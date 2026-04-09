#!/usr/bin/env node
/**
 * audit-noc-parity.mjs
 *
 * Compares every entry in src/data/simulator/occupations.json against the
 * official StatCan NOC 2021 reference CSV at data/reference/noc-2021-statcan.csv.
 *
 * A row fails when:
 *   1. Its noc_code is not found in the reference (unknown / possible NOC 2016 code).
 *   2. Its noc_code IS in the reference but the local title does not match the
 *      official title (case-insensitive, punctuation-normalised comparison).
 *
 * Known wrong → correct code mappings are shown in the failure output to speed
 * up remediation.
 *
 * Exit 0 = all rows pass. Exit 1 = one or more failures found.
 *
 * Run: node scripts/audit-noc-parity.mjs
 */

import fs   from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT      = path.resolve(__dirname, '..');

// ── Known wrong→correct code suggestions ──────────────────────────────────────
const KNOWN_CORRECTIONS = {
  '13100': '63100',
  '13101': '63101',
  '13102': '63102',
  '13110': '12102',
  '14100': '12100',
  '55100': '51120',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Normalize a title for comparison: lowercase, collapse whitespace, strip trailing punctuation */
function normalise(title) {
  return title
    .toLowerCase()
    .replace(/,\s*n\.e\.c\.?/g, '')   // strip ", n.e.c." variant
    .replace(/\s+/g, ' ')
    .trim();
}

/** Parse the reference CSV, skipping comment lines (#) and the header row. */
function loadReference(csvPath) {
  const lines  = fs.readFileSync(csvPath, 'utf-8').split('\n');
  const refMap = new Map(); // noc_code → { official_title, teer_level }

  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;

    const parts = line.split(',');
    if (parts.length < 3) continue;

    const noc_code      = parts[0].trim();
    const teer_level    = parseInt(parts[parts.length - 1].trim(), 10);
    // title may contain commas — rejoin middle parts
    const official_title = parts.slice(1, parts.length - 1).join(',').trim();

    if (noc_code === 'noc_code') continue; // header row

    refMap.set(noc_code, { official_title, teer_level });
  }
  return refMap;
}

// ── Main ──────────────────────────────────────────────────────────────────────

const csvPath  = path.join(ROOT, 'data', 'reference', 'noc-2021-statcan.csv');
const jsonPath = path.join(ROOT, 'src', 'data', 'simulator', 'occupations.json');

if (!fs.existsSync(csvPath)) {
  console.error(`ERROR: Reference CSV not found at ${csvPath}`);
  process.exit(1);
}
if (!fs.existsSync(jsonPath)) {
  console.error(`ERROR: occupations.json not found at ${jsonPath}`);
  process.exit(1);
}

const refMap     = loadReference(csvPath);
const occupData  = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
const occupations = occupData.data;

console.log(`NOC 2021 Parity Audit`);
console.log(`Reference rows : ${refMap.size}`);
console.log(`Local rows     : ${occupations.length}`);
console.log('');

let failCount = 0;
let passCount = 0;

for (const occ of occupations) {
  const { noc_code, title } = occ;
  const ref = refMap.get(noc_code);

  if (!ref) {
    const suggestion = KNOWN_CORRECTIONS[noc_code]
      ? ` → suggest correcting to ${KNOWN_CORRECTIONS[noc_code]}`
      : '';
    console.error(`  FAIL [${noc_code}] "${title}" — code not found in NOC 2021 reference${suggestion}`);
    failCount++;
    continue;
  }

  const localNorm   = normalise(title);
  const officialNorm = normalise(ref.official_title);

  if (localNorm !== officialNorm) {
    console.error(
      `  FAIL [${noc_code}] title mismatch:\n` +
      `       local   : "${title}"\n` +
      `       official: "${ref.official_title}"`
    );
    failCount++;
  } else {
    passCount++;
  }
}

console.log('');
if (failCount === 0) {
  console.log(`All ${passCount} occupation rows pass NOC 2021 parity check.`);
  process.exit(0);
} else {
  console.error(`${failCount} row(s) FAILED parity check. ${passCount} passed.`);
  process.exit(1);
}
