#!/usr/bin/env node
// check-facts.mjs — the fact ledger gate.
//
// facts/ledger.json lists every phone number, dollar figure, deadline and
// program-status claim this skill states, with the primary source it was
// verified against, the date, and the files that carry it. This script FAILS
// (exit 1) when:
//   1. a fact is past due: verified_on + recheck_days (or recheck_days_default)
//      is before today — someone must re-verify it on its source and bump the date;
//   2. a listed file does not exist;
//   3. the fact's `value` string no longer appears verbatim in any of its listed
//      files — so an edit cannot silently drift the text away from the ledger.
// Every failure is printed, not just the first. The date can be pinned with
// CHECK_DATE=YYYY-MM-DD for deterministic runs and tests.
//
// Same pattern as access-to-energy's scripts/check-staleness.mjs: pure logic is
// exported (and unit-tested in scripts/test/check-facts.test.mjs); main() does IO.
// No dependencies.

import { readFile, access } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import path from "node:path";

export const DAY = 86400000;
export const WARN_DAYS = 14; // warn (never fail) when a recheck is this close

export const isISODate = (s) => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(`${s}T00:00:00Z`));
export const utc = (s) => new Date(`${s}T00:00:00Z`);
const iso = (d) => d.toISOString().slice(0, 10);

// Structural problems with the ledger itself. Returns an array of messages.
export function validateLedger(ledger) {
  const errors = [];
  if (!ledger || typeof ledger !== "object" || Array.isArray(ledger)) return ["ledger must be a JSON object"];
  const def = ledger.recheck_days_default;
  if (!Number.isInteger(def) || def <= 0) errors.push("recheck_days_default must be a positive integer");
  if (!Array.isArray(ledger.facts)) return [...errors, "facts must be an array"];

  const seen = new Set();
  ledger.facts.forEach((f, i) => {
    const where = `facts[${i}]${f && f.id ? ` (${f.id})` : ""}`;
    if (!f || typeof f !== "object") return errors.push(`${where}: must be an object`);
    for (const key of ["id", "claim", "value", "source", "verified_on"]) {
      if (typeof f[key] !== "string" || !f[key].trim()) errors.push(`${where}: ${key} must be a non-empty string`);
    }
    if (typeof f.id === "string") {
      if (!/^[a-z0-9][a-z0-9-]*$/.test(f.id)) errors.push(`${where}: id must be lowercase kebab-case`);
      if (seen.has(f.id)) errors.push(`${where}: duplicate id`);
      seen.add(f.id);
    }
    if (typeof f.source === "string" && !/^https?:\/\/\S+$/.test(f.source)) errors.push(`${where}: source must be a URL`);
    if (f.verified_on !== undefined && !isISODate(f.verified_on)) errors.push(`${where}: verified_on must be YYYY-MM-DD`);
    if (f.recheck_days !== undefined && (!Number.isInteger(f.recheck_days) || f.recheck_days <= 0)) {
      errors.push(`${where}: recheck_days must be a positive integer`);
    }
    if (!Array.isArray(f.files) || !f.files.length || !f.files.every((p) => typeof p === "string" && p.trim())) {
      errors.push(`${where}: files must be a non-empty array of paths`);
    } else if (f.files.some((p) => p.startsWith("/") || p.split(/[\\/]/).includes(".."))) {
      errors.push(`${where}: files must be relative paths inside the repo`);
    }
  });
  return errors;
}

// Staleness of one fact. Returns { errors, warnings }.
export function evaluateDate(fact, today, defaultDays) {
  const errors = [];
  const warnings = [];
  if (!isISODate(fact.verified_on)) return { errors, warnings }; // reported by validateLedger
  const verified = utc(fact.verified_on);
  const days = fact.recheck_days ?? defaultDays;
  const due = new Date(verified.getTime() + days * DAY);
  if (verified > today) {
    errors.push(`${fact.id}: verified_on ${fact.verified_on} is in the future (today is ${iso(today)})`);
  } else if (today >= due) {
    errors.push(`${fact.id}: recheck due ${iso(due)} (verified ${fact.verified_on} + ${days}d) — re-verify "${fact.claim}" at ${fact.source}`);
  } else if (today >= new Date(due.getTime() - WARN_DAYS * DAY)) {
    warnings.push(`${fact.id}: recheck due ${iso(due)} — "${fact.claim}"`);
  }
  return { errors, warnings };
}

// Presence of the value in the listed files. `files` is a Map of path -> text,
// or path -> null when the file is missing. Returns an array of errors.
export function evaluateFiles(fact, files) {
  const errors = [];
  let found = false;
  for (const rel of fact.files) {
    const text = files.get(rel);
    if (text === null || text === undefined) {
      errors.push(`${fact.id}: listed file does not exist: ${rel}`);
      continue;
    }
    if (text.includes(fact.value)) found = true;
  }
  const anyExists = fact.files.some((rel) => typeof files.get(rel) === "string");
  if (anyExists && !found) {
    errors.push(`${fact.id}: value "${fact.value}" not found in any listed file (${fact.files.join(", ")}) — the text drifted from the ledger, or the ledger needs updating`);
  }
  return errors;
}

// Whole-ledger evaluation with injected file contents (for tests and for main).
export function evaluateLedger(ledger, { today, files }) {
  const errors = validateLedger(ledger);
  const warnings = [];
  if (errors.length) return { errors, warnings };
  for (const fact of ledger.facts) {
    const d = evaluateDate(fact, today, ledger.recheck_days_default);
    errors.push(...d.errors);
    warnings.push(...d.warnings);
    errors.push(...evaluateFiles(fact, files));
  }
  return { errors, warnings };
}

export async function loadFiles(root, ledger) {
  const files = new Map();
  for (const fact of ledger.facts || []) {
    for (const rel of fact.files || []) {
      if (files.has(rel)) continue;
      const abs = path.join(root, rel);
      try {
        await access(abs);
        files.set(rel, await readFile(abs, "utf8"));
      } catch {
        files.set(rel, null);
      }
    }
  }
  return files;
}

export async function main({ root, ledgerPath, today } = {}) {
  root = root ?? path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
  ledgerPath = ledgerPath ?? path.join(root, "facts", "ledger.json");
  today = today ?? (process.env.CHECK_DATE ? utc(process.env.CHECK_DATE) : new Date());
  if (Number.isNaN(today.getTime())) throw new Error(`CHECK_DATE must be YYYY-MM-DD, got "${process.env.CHECK_DATE}"`);

  let ledger;
  try {
    ledger = JSON.parse(await readFile(ledgerPath, "utf8"));
  } catch (e) {
    console.error(`✗  cannot read ${path.relative(root, ledgerPath)}: ${e.message}`);
    return 1;
  }
  const structural = validateLedger(ledger);
  const files = structural.length ? new Map() : await loadFiles(root, ledger);
  const { errors, warnings } = evaluateLedger(ledger, { today, files });
  const stamp = iso(today);
  const n = Array.isArray(ledger.facts) ? ledger.facts.length : 0;
  if (warnings.length) console.warn(`Fact ledger warnings (as of ${stamp}):\n` + warnings.map((w) => `  !  ${w}`).join("\n"));
  if (errors.length) {
    console.error(`\nFact ledger FAILURES (as of ${stamp}, ${errors.length} problem(s) across ${n} fact(s)):\n` + errors.map((e) => `  ✗  ${e}`).join("\n"));
    return 1;
  }
  console.log(`Fact ledger OK as of ${stamp}: ${n} fact(s) verified, present in their files, and within their recheck window${warnings.length ? ` (${warnings.length} warning(s))` : ""}.`);
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main()
    .then((code) => process.exit(code))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
