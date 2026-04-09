/**
 * noc-parity.test.ts
 *
 * CI guard: fails the build if any row in occupations.json is not found in
 * the StatCan NOC 2021 reference CSV, or if its local title does not match
 * the official title (case-insensitive, ignoring ", n.e.c." variants).
 *
 * This test encodes story US-1.2 acceptance criterion: full NOC 2021 parity.
 */

import fs   from 'fs';
import path from 'path';

// ── Reference CSV loader ──────────────────────────────────────────────────────

interface RefEntry {
  official_title: string;
  teer_level: number;
}

function loadReference(): Map<string, RefEntry> {
  const csvPath = path.resolve(process.cwd(), 'data', 'reference', 'noc-2021-statcan.csv');
  const lines   = fs.readFileSync(csvPath, 'utf-8').split('\n');
  const map     = new Map<string, RefEntry>();

  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;

    const parts = line.split(',');
    if (parts.length < 3) continue;

    const noc_code      = parts[0].trim();
    const teer_level    = parseInt(parts[parts.length - 1].trim(), 10);
    const official_title = parts.slice(1, parts.length - 1).join(',').trim();

    if (noc_code === 'noc_code') continue; // header

    map.set(noc_code, { official_title, teer_level });
  }
  return map;
}

// ── Title normalisation ───────────────────────────────────────────────────────

function normalise(title: string): string {
  return title
    .toLowerCase()
    .replace(/,\s*n\.e\.c\.?/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// ── Data ──────────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-var-requires
const occupationsRaw = require('@/data/simulator/occupations.json') as {
  data: Array<{ noc_code: string; title: string; teer_level: number }>;
};

const refMap      = loadReference();
const occupations = occupationsRaw.data;

// ── Tests ─────────────────────────────────────────────────────────────────────

test('all occupations have noc_code present in NOC 2021 reference', () => {
  const missing = occupations.filter((o) => !refMap.has(o.noc_code));
  if (missing.length > 0) {
    const detail = missing
      .map((o) => `  ${o.noc_code} — "${o.title}"`)
      .join('\n');
    throw new Error(
      `${missing.length} occupation(s) have noc_code not found in NOC 2021 reference:\n${detail}`
    );
  }
});

test('all occupation titles match the official NOC 2021 title (case-insensitive)', () => {
  const mismatches: string[] = [];

  for (const occ of occupations) {
    const ref = refMap.get(occ.noc_code);
    if (!ref) continue; // already caught by previous test

    const localNorm    = normalise(occ.title);
    const officialNorm = normalise(ref.official_title);

    if (localNorm !== officialNorm) {
      mismatches.push(
        `  [${occ.noc_code}] local="${occ.title}" official="${ref.official_title}"`
      );
    }
  }

  if (mismatches.length > 0) {
    throw new Error(
      `${mismatches.length} title mismatch(es) against NOC 2021 reference:\n` +
      mismatches.join('\n')
    );
  }
});

test('no occupation uses a known-wrong NOC code that was replaced in US-1.2', () => {
  const knownWrong = ['13100', '13101', '13102', '13110', '14100', '55100'];
  const found = occupations.filter((o) => knownWrong.includes(o.noc_code));
  if (found.length > 0) {
    const detail = found.map((o) => `  ${o.noc_code} — "${o.title}"`).join('\n');
    throw new Error(
      `${found.length} occupation(s) still use pre-US-1.2 wrong NOC codes:\n${detail}`
    );
  }
});
