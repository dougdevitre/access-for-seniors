#!/usr/bin/env node
// check-facts.mjs — the fact ledger gate (shared across the Access To repos).
//
// facts/ledger.json lists every phone number, dollar figure, deadline and
// program-status claim the skill makes, with the primary source it was checked
// against, the date it was checked and how long that check is good for. This
// script fails CI (exit 1) when:
//   1. a fact is past due — `verified_on` + `recheck_days` (or the explicit
//      `recheck_on` date) is before today;
//   2. a path in a fact's `files` does not exist;
//   3. a fact's `value` (or, when given, each string in `match`) no longer
//      appears in any of its listed files, or a listed file contains none of
//      them — so a silent edit cannot drift away from the ledger;
//   4. the ledger itself is malformed (missing fields, duplicate ids, a
//      `verified_on` in the future, a non-https source).
// Every failure is printed, not just the first. A fact due within 14 days is a
// warning. Facts verified against an annual cycle set `recheck_on` to the next
// cycle's date instead of a day count.
//
// Usage:
//   node scripts/check-facts.mjs                       # ledger at facts/ledger.json, files under the repo root
//   node scripts/check-facts.mjs --root <dir>          # files live under <dir> (e.g. an extracted .skill package)
//   node scripts/check-facts.mjs --ledger <file.json>  # a ledger somewhere else
//   CHECK_DATE=2026-12-01 node scripts/check-facts.mjs # pin "today" for deterministic runs and tests
//
// No dependencies. The pure evaluation logic (`evaluateLedger`) is exported and
// unit-tested in scripts/test/check-facts.test.mjs; main() does the IO.
// Modelled on access-to-energy's scripts/check-staleness.mjs.

import { readFile, access } from "node:fs/promises";
import { resolve, join } from "node:path";
import { pathToFileURL } from "node:url";

export const DAY = 86400000;
export const WARN_WINDOW_DAYS = 14;
const REQUIRED = ["id", "claim", "value", "source", "verified_on", "files"];

export const isISODate = (s) => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s));
const utc = (s) => new Date(`${s}T00:00:00Z`);
const iso = (d) => d.toISOString().slice(0, 10);

// Whitespace-insensitive comparison so a wrapped line or a non-breaking space
// does not count as drift. Nothing else is normalised: a changed digit, dash
// or word is drift.
export const normalise = (s) => String(s).replace(/[\s ]+/g, " ").trim();

export function dueDate(fact, defaultDays) {
  if (fact.recheck_on !== undefined) return isISODate(fact.recheck_on) ? utc(fact.recheck_on) : null;
  const days = fact.recheck_days ?? defaultDays;
  if (!Number.isInteger(days) || days <= 0) return null;
  return new Date(utc(fact.verified_on).getTime() + days * DAY);
}

// Validate one fact's shape. Returns an array of error strings (empty === ok).
export function validateFact(fact, defaultDays) {
  const errors = [];
  const tag = fact && typeof fact.id === "string" ? fact.id : "<no id>";
  if (!fact || typeof fact !== "object") return [`${tag}: fact is not an object`];
  for (const key of REQUIRED) if (fact[key] === undefined || fact[key] === null || fact[key] === "") errors.push(`${tag}: missing "${key}"`);
  if (fact.verified_on !== undefined && !isISODate(fact.verified_on)) errors.push(`${tag}: verified_on "${fact.verified_on}" is not a YYYY-MM-DD date`);
  if (fact.recheck_days !== undefined && (!Number.isInteger(fact.recheck_days) || fact.recheck_days <= 0)) errors.push(`${tag}: recheck_days must be a positive integer`);
  if (fact.recheck_on !== undefined && !isISODate(fact.recheck_on)) errors.push(`${tag}: recheck_on "${fact.recheck_on}" is not a YYYY-MM-DD date`);
  if (fact.recheck_days === undefined && fact.recheck_on === undefined && (!Number.isInteger(defaultDays) || defaultDays <= 0)) errors.push(`${tag}: no recheck_days, no recheck_on and no usable recheck_days_default`);
  if (fact.source !== undefined && !/^https:\/\/\S+$/.test(String(fact.source))) errors.push(`${tag}: source must be an https URL`);
  if (fact.files !== undefined && (!Array.isArray(fact.files) || fact.files.length === 0 || !fact.files.every((f) => typeof f === "string" && f))) errors.push(`${tag}: files must be a non-empty array of paths`);
  if (fact.match !== undefined && (!Array.isArray(fact.match) || fact.match.length === 0 || !fact.match.every((m) => typeof m === "string" && m.trim()))) errors.push(`${tag}: match must be a non-empty array of strings`);
  return errors;
}

// Evaluate a whole ledger. `files` maps each relative path to its text, or to
// null when it does not exist. Returns { errors, warnings } (arrays of strings).
export function evaluateLedger({ ledger, today, files }) {
  const errors = [];
  const warnings = [];
  if (!ledger || typeof ledger !== "object" || !Array.isArray(ledger.facts)) return { errors: ["ledger: expected an object with a facts array"], warnings };
  const defaultDays = ledger.recheck_days_default;
  if (defaultDays !== undefined && (!Number.isInteger(defaultDays) || defaultDays <= 0)) errors.push("ledger: recheck_days_default must be a positive integer");
  if (!ledger.facts.length) errors.push("ledger: facts is empty");

  const seen = new Set();
  for (const fact of ledger.facts) {
    const shape = validateFact(fact, defaultDays);
    if (shape.length) {
      errors.push(...shape);
      continue;
    }
    const { id } = fact;
    if (seen.has(id)) errors.push(`${id}: duplicate id`);
    seen.add(id);

    const verified = utc(fact.verified_on);
    if (verified > today) {
      errors.push(`${id}: verified_on ${fact.verified_on} is in the future (today is ${iso(today)})`);
      continue;
    }
    const due = dueDate(fact, defaultDays);
    if (!due) errors.push(`${id}: cannot work out a recheck date`);
    else if (today > due) errors.push(`${id}: past due — verified ${fact.verified_on}, recheck was due ${iso(due)} (${Math.floor((today - due) / DAY)}d ago). Re-verify at ${fact.source} and update verified_on.`);
    else if (due - today <= WARN_WINDOW_DAYS * DAY) warnings.push(`${id}: recheck due ${iso(due)} (${Math.ceil((due - today) / DAY)}d) — ${fact.source}`);

    const needles = (fact.match ?? [fact.value]).map(normalise);
    const texts = new Map();
    for (const rel of fact.files) {
      const text = files.get(rel);
      if (text === undefined || text === null) errors.push(`${id}: file not found: ${rel}`);
      else texts.set(rel, normalise(text));
    }
    let anyFound = false;
    for (const needle of needles) {
      if ([...texts.values()].some((t) => t.includes(needle))) anyFound = true;
      else errors.push(`${id}: "${needle}" no longer appears in any listed file (${fact.files.join(", ")}) — the text drifted from the ledger, or the ledger needs updating`);
    }
    // Only worth reporting per file when the strings survive somewhere; otherwise the line above already says it all.
    if (anyFound) {
      for (const [rel, text] of texts) {
        if (!needles.some((n) => text.includes(n))) errors.push(`${id}: ${rel} contains none of the ledger strings — remove it from files or restore the text`);
      }
    }
  }
  return { errors, warnings };
}

function parseArgs(argv) {
  const opts = { ledger: "facts/ledger.json", root: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--ledger") opts.ledger = argv[++i];
    else if (a === "--root") opts.root = argv[++i];
    else if (a.startsWith("--ledger=")) opts.ledger = a.slice(9);
    else if (a.startsWith("--root=")) opts.root = a.slice(7);
    else if (a === "--help" || a === "-h") {
      console.log("usage: check-facts.mjs [--ledger facts/ledger.json] [--root <dir>]   (env CHECK_DATE=YYYY-MM-DD)");
      process.exit(0);
    } else throw new Error(`unknown argument: ${a}`);
  }
  if (!opts.ledger || opts.root === "") throw new Error("--ledger and --root need a value");
  return opts;
}

export async function main(argv = process.argv.slice(2)) {
  const opts = parseArgs(argv);
  const repoRoot = resolve(new URL("..", import.meta.url).pathname);
  const ledgerPath = resolve(repoRoot, opts.ledger);
  const root = opts.root ? resolve(opts.root) : repoRoot;
  const today = process.env.CHECK_DATE ? utc(process.env.CHECK_DATE) : utc(iso(new Date()));
  if (Number.isNaN(today.getTime())) throw new Error(`CHECK_DATE "${process.env.CHECK_DATE}" is not a YYYY-MM-DD date`);

  let ledger;
  try {
    ledger = JSON.parse(await readFile(ledgerPath, "utf8"));
  } catch (e) {
    console.error(`✗  cannot read ledger ${ledgerPath}: ${e.message}`);
    process.exit(1);
  }

  const files = new Map();
  for (const fact of Array.isArray(ledger.facts) ? ledger.facts : []) {
    for (const rel of Array.isArray(fact?.files) ? fact.files : []) {
      if (typeof rel !== "string" || files.has(rel)) continue;
      const abs = join(root, rel);
      try {
        await access(abs);
        files.set(rel, await readFile(abs, "utf8"));
      } catch {
        files.set(rel, null);
      }
    }
  }

  const { errors, warnings } = evaluateLedger({ ledger, today, files });
  const count = Array.isArray(ledger.facts) ? ledger.facts.length : 0;
  const stamp = iso(today);
  if (warnings.length) console.warn(`Fact ledger warnings (as of ${stamp}):\n` + warnings.map((w) => `  !  ${w}`).join("\n"));
  if (errors.length) {
    console.error(`\nFact ledger FAILURES (as of ${stamp}, ${errors.length} problem(s) in ${count} fact(s)):\n` + errors.map((e) => `  ✗  ${e}`).join("\n"));
    process.exit(1);
  }
  console.log(`Fact ledger OK as of ${stamp}: ${count} fact(s) verified, in date and present in their files (root: ${root})${warnings.length ? ` (${warnings.length} warning(s))` : ""}.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((e) => {
    console.error(`✗  ${e.message}`);
    process.exit(1);
  });
}
