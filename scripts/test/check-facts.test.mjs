// Unit tests for the fact ledger gate (scripts/check-facts.mjs).
// Run: node --test scripts/test/check-facts.test.mjs
// The pure evaluator is tested with in-memory files; the CLI is run once end to
// end against a temp directory so the exit code and --root are covered too.

import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { evaluateLedger, validateFact, dueDate, normalise } from "../check-facts.mjs";

const utc = (s) => new Date(`${s}T00:00:00Z`);
const SCRIPT = new URL("../check-facts.mjs", import.meta.url).pathname;

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
const ledger = (facts, extra = {}) => ({ recheck_days_default: 90, facts, ...extra });
const files = (obj) => new Map(Object.entries(obj));
const run = (l, today, f) => evaluateLedger({ ledger: l, today: utc(today), files: files(f) });

test("a verified, in-date fact whose value is in its file is clean", () => {
  const res = run(ledger([fact()]), "2026-11-01", { "references/aging-services.md": "Call 1-800-677-1116 for help." });
  assert.deepEqual(res, { errors: [], warnings: [] });
});

test("dueDate uses recheck_days, falls back to the default, and recheck_on wins", () => {
  assert.equal(dueDate(fact(), 90).toISOString().slice(0, 10), "2027-04-21");
  assert.equal(dueDate(fact({ recheck_days: undefined }), 90).toISOString().slice(0, 10), "2027-01-21");
  assert.equal(dueDate(fact({ recheck_on: "2027-01-01" }), 90).toISOString().slice(0, 10), "2027-01-01");
  assert.equal(dueDate(fact({ recheck_days: undefined }), undefined), null);
});

test("a fact past verified_on + recheck_days FAILS; within 14 days it warns", () => {
  const f = { "references/aging-services.md": "1-800-677-1116" };
  const past = run(ledger([fact()]), "2027-04-22", f); // 181 days later
  assert.equal(past.errors.length, 1);
  assert.match(past.errors[0], /past due/);
  const soon = run(ledger([fact()]), "2027-04-10", f);
  assert.deepEqual(soon.errors, []);
  assert.equal(soon.warnings.length, 1);
  assert.match(soon.warnings[0], /recheck due 2027-04-21/);
  const onTheDay = run(ledger([fact()]), "2027-04-21", f);
  assert.deepEqual(onTheDay.errors, []);
});

test("an explicit recheck_on (annual cycle) is honoured over recheck_days", () => {
  const f = { "references/x.md": "$202.90" };
  const l = ledger([fact({ value: "$202.90", recheck_days: 30, recheck_on: "2027-01-01", files: ["references/x.md"] })]);
  assert.deepEqual(run(l, "2026-12-31", f).errors, []);
  assert.equal(run(l, "2027-01-02", f).errors.length, 1);
});

test("a missing file FAILS and names the path", () => {
  const res = run(ledger([fact({ files: ["references/missing.md"] })]), "2026-11-01", { "references/missing.md": null });
  assert.equal(res.errors.length, 2, "missing file plus the value appearing nowhere");
  assert.match(res.errors[0], /file not found: references\/missing\.md/);
});

test("a value that no longer appears in any listed file FAILS (silent edit)", () => {
  const res = run(ledger([fact()]), "2026-11-01", { "references/aging-services.md": "Call 1-800-677-1117 for help." });
  assert.equal(res.errors.length, 1, "one line: the value is absent everywhere (no per-file repeat)");
  assert.match(res.errors[0], /no longer appears in any listed file/);
});

test("the value may live in one of several files; a listed file with none of the strings FAILS", () => {
  const f = { "a.md": "x 1-800-677-1116 y", "b.md": "Mon–Fri 8am–9pm ET" };
  const ok = run(ledger([fact({ match: ["1-800-677-1116", "Mon–Fri 8am–9pm ET"], files: ["a.md", "b.md"] })]), "2026-11-01", f);
  assert.deepEqual(ok.errors, []);
  const bad = run(ledger([fact({ files: ["a.md", "b.md"] })]), "2026-11-01", f);
  assert.equal(bad.errors.length, 1);
  assert.match(bad.errors[0], /b\.md contains none of the ledger strings/);
});

test("matching ignores line wraps and non-breaking spaces but not digits or dashes", () => {
  assert.equal(normalise("Mon–Fri 8am–9pm\n  ET"), "Mon–Fri 8am–9pm ET");
  const f = { "a.md": "hours: Mon–Fri\n8am–9pm ET." };
  assert.deepEqual(run(ledger([fact({ value: "Mon–Fri 8am–9pm ET", files: ["a.md"] })]), "2026-11-01", f).errors, []);
  assert.equal(run(ledger([fact({ value: "Mon-Fri 8am-9pm ET", files: ["a.md"] })]), "2026-11-01", f).errors.length, 1);
});

test("every failure is reported, not just the first", () => {
  const l = ledger([
    fact({ id: "a", files: ["a.md"] }),
    fact({ id: "b", verified_on: "2025-01-01", files: ["b.md"] }),
    fact({ id: "c", files: ["c.md"] }),
  ]);
  const res = run(l, "2026-11-01", { "a.md": "nope", "b.md": "1-800-677-1116", "c.md": null });
  assert.ok(res.errors.some((e) => e.startsWith("a:")), "a drifted");
  assert.ok(res.errors.some((e) => e.startsWith("b:") && /past due/.test(e)), "b stale");
  assert.ok(res.errors.some((e) => e.startsWith("c:") && /file not found/.test(e)), "c missing");
});

test("malformed facts are rejected: missing fields, bad dates, future dates, duplicates, non-https source", () => {
  assert.ok(validateFact({ id: "x" }, 90).length >= 4);
  assert.match(validateFact(fact({ verified_on: "23/10/2026" }), 90)[0], /not a YYYY-MM-DD/);
  assert.match(validateFact(fact({ source: "http://example.gov" }), 90)[0], /https/);
  assert.match(validateFact(fact({ recheck_days: 0 }), 90)[0], /positive integer/);
  assert.match(validateFact(fact({ files: [] }), 90)[0], /non-empty array/);
  const f = { "references/aging-services.md": "1-800-677-1116" };
  const future = run(ledger([fact({ verified_on: "2026-12-01" })]), "2026-11-01", f);
  assert.match(future.errors[0], /in the future/);
  const dup = run(ledger([fact(), fact()]), "2026-11-01", f);
  assert.match(dup.errors[0], /duplicate id/);
  assert.match(evaluateLedger({ ledger: { facts: "no" }, today: utc("2026-11-01"), files: files({}) }).errors[0], /facts array/);
  assert.match(run(ledger([]), "2026-11-01", {}).errors[0], /facts is empty/);
});

test("CLI: exit 0 when clean, exit 1 with every failure printed; --root points at an extracted package", async () => {
  const dir = await mkdtemp(join(tmpdir(), "check-facts-"));
  try {
    await mkdir(join(dir, "pkg", "references"), { recursive: true });
    await writeFile(join(dir, "pkg", "references", "aging-services.md"), "Eldercare Locator: 1-800-677-1116\n");
    const ledgerFile = join(dir, "ledger.json");
    await writeFile(ledgerFile, JSON.stringify(ledger([fact()])));
    const env = { ...process.env, CHECK_DATE: "2026-11-01" };

    const ok = spawnSync(process.execPath, [SCRIPT, "--ledger", ledgerFile, "--root", join(dir, "pkg")], { env, encoding: "utf8" });
    assert.equal(ok.status, 0, ok.stderr);
    assert.match(ok.stdout, /Fact ledger OK .* 1 fact\(s\)/);

    await writeFile(ledgerFile, JSON.stringify(ledger([fact(), fact({ id: "stale", verified_on: "2025-01-01" }), fact({ id: "gone", files: ["references/none.md"] })])));
    const bad = spawnSync(process.execPath, [SCRIPT, "--ledger", ledgerFile, "--root", join(dir, "pkg")], { env, encoding: "utf8" });
    assert.equal(bad.status, 1);
    assert.match(bad.stderr, /stale: past due/);
    assert.match(bad.stderr, /gone: file not found: references\/none\.md/);
    assert.match(bad.stderr, /3 problem\(s\) in 3 fact\(s\)/);

    const missing = spawnSync(process.execPath, [SCRIPT, "--ledger", join(dir, "nope.json")], { env, encoding: "utf8" });
    assert.equal(missing.status, 1);
    assert.match(missing.stderr, /cannot read ledger/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
