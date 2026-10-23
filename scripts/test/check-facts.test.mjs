// Unit tests for scripts/check-facts.mjs. Run: node --test scripts/test/check-facts.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { validateLedger, evaluateDate, evaluateFiles, evaluateLedger, main, utc } from "../check-facts.mjs";

const fact = (over = {}) => ({
  id: "eldercare-locator-phone",
  claim: "Eldercare Locator phone number",
  value: "1-800-677-1116",
  source: "https://eldercare.acl.gov/Public/About/Contact_Info/Index.aspx",
  verified_on: "2026-10-23",
  recheck_days: 180,
  files: ["references/aging-services.md"],
  ...over,
});
const ledger = (facts, def = 90) => ({ recheck_days_default: def, facts });

test("validateLedger accepts the documented shape", () => {
  assert.deepEqual(validateLedger(ledger([fact()])), []);
});

test("validateLedger reports every structural problem, not just the first", () => {
  const bad = ledger([fact({ id: "Bad ID", source: "cms.gov", verified_on: "10/23/2026", files: [] }), fact({ recheck_days: 0 })], 0);
  const errs = validateLedger(bad);
  assert.ok(errs.some((e) => /recheck_days_default/.test(e)));
  assert.ok(errs.some((e) => /kebab-case/.test(e)));
  assert.ok(errs.some((e) => /source must be a URL/.test(e)));
  assert.ok(errs.some((e) => /verified_on must be YYYY-MM-DD/.test(e)));
  assert.ok(errs.some((e) => /files must be a non-empty array/.test(e)));
  assert.ok(errs.some((e) => /recheck_days must be a positive integer/.test(e)));
});

test("validateLedger rejects duplicate ids and paths that escape the repo", () => {
  const errs = validateLedger(ledger([fact(), fact({ files: ["../outside.md"] })]));
  assert.ok(errs.some((e) => /duplicate id/.test(e)));
  assert.ok(errs.some((e) => /relative paths inside the repo/.test(e)));
});

test("a fact inside its recheck window is clean", () => {
  const r = evaluateDate(fact(), utc("2027-01-01"), 90);
  assert.deepEqual(r.errors, []);
  assert.deepEqual(r.warnings, []);
});

test("a fact warns within 14 days of its recheck date and fails on the day", () => {
  // 2026-10-23 + 180d = 2027-04-21
  assert.equal(evaluateDate(fact(), utc("2027-04-10"), 90).warnings.length, 1);
  assert.equal(evaluateDate(fact(), utc("2027-04-20"), 90).errors.length, 0);
  assert.equal(evaluateDate(fact(), utc("2027-04-21"), 90).errors.length, 1);
});

test("recheck_days_default applies when a fact has no recheck_days", () => {
  const f = fact({ recheck_days: undefined });
  delete f.recheck_days;
  assert.equal(evaluateDate(f, utc("2027-01-20"), 90).errors.length, 0); // day 89
  assert.equal(evaluateDate(f, utc("2027-01-21"), 90).errors.length, 1); // day 90
});

test("a future verified_on fails (no forward-dating)", () => {
  assert.match(evaluateDate(fact({ verified_on: "2026-12-01" }), utc("2026-10-23"), 90).errors[0], /in the future/);
});

test("evaluateFiles passes when the value is in any listed file", () => {
  const files = new Map([
    ["references/aging-services.md", "Call 1-800-677-1116 Monday through Friday."],
    ["SKILL.md", "nothing here"],
  ]);
  assert.deepEqual(evaluateFiles(fact({ files: ["SKILL.md", "references/aging-services.md"] }), files), []);
});

test("evaluateFiles fails when the value drifted out of every file", () => {
  const files = new Map([["references/aging-services.md", "Call 1-800-677-1117."]]);
  const errs = evaluateFiles(fact(), files);
  assert.equal(errs.length, 1);
  assert.match(errs[0], /not found in any listed file/);
});

test("evaluateFiles fails for a missing file and still checks the others", () => {
  const files = new Map([
    ["references/aging-services.md", null],
    ["SKILL.md", "1-800-677-1116"],
  ]);
  const errs = evaluateFiles(fact({ files: ["references/aging-services.md", "SKILL.md"] }), files);
  assert.equal(errs.length, 1);
  assert.match(errs[0], /does not exist/);
});

test("evaluateLedger collects every failure across facts", () => {
  const files = new Map([["a.md", "$202.90"], ["b.md", null]]);
  const l = ledger([
    fact({ id: "part-b-premium", value: "$202.90", files: ["a.md"], verified_on: "2026-01-01", recheck_days: 90 }), // stale
    fact({ id: "part-b-deductible", value: "$283", files: ["a.md"] }), // drifted
    fact({ id: "missing", files: ["b.md"] }), // missing file
  ]);
  const { errors } = evaluateLedger(l, { today: utc("2026-10-23"), files });
  assert.equal(errors.length, 3);
});

test("main runs against a real directory and exits 1 on findings, 0 when clean", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "facts-"));
  try {
    await mkdir(path.join(root, "facts"));
    await mkdir(path.join(root, "references"));
    await writeFile(path.join(root, "references", "aging-services.md"), "Eldercare Locator: 1-800-677-1116\n");
    const ledgerPath = path.join(root, "facts", "ledger.json");
    await writeFile(ledgerPath, JSON.stringify(ledger([fact()])));
    const quiet = { log() {}, warn() {}, error() {} };
    const orig = { log: console.log, warn: console.warn, error: console.error };
    Object.assign(console, quiet);
    try {
      assert.equal(await main({ root, ledgerPath, today: utc("2026-11-01") }), 0);
      assert.equal(await main({ root, ledgerPath, today: utc("2028-01-01") }), 1, "past due");
      await writeFile(ledgerPath, JSON.stringify(ledger([fact({ value: "1-800-000-0000" })])));
      assert.equal(await main({ root, ledgerPath, today: utc("2026-11-01") }), 1, "drifted value");
      await writeFile(ledgerPath, "{not json");
      assert.equal(await main({ root, ledgerPath, today: utc("2026-11-01") }), 1, "unreadable ledger");
    } finally {
      Object.assign(console, orig);
    }
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
