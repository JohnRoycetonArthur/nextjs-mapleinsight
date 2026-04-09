/**
 * occupation-search.test.ts
 *
 * Covers searchOccupations() correctness, including the Roselyn-reported
 * mismatch where searching "insurance broker" previously returned NOC 13100
 * (a NOC 2016-era code). After the US-1.2 fix the correct NOC 2021 code is
 * 63100.
 */

import occupationsRaw from '@/data/simulator/occupations.json';
import { searchOccupations } from '@/lib/simulator/occupationSearch';
import type { OccupationOption } from '@/components/simulator/wizardTypes';

const occupations = occupationsRaw.data as OccupationOption[];

// ── Roselyn case: NOC 13100 mismatch ─────────────────────────────────────────

test('insurance broker search returns NOC 63100, not 13100', () => {
  const results = searchOccupations(occupations, 'insurance broker');
  expect(results.length).toBeGreaterThan(0);
  const top = results[0];
  expect(top.noc_code).toBe('63100');
  expect(top.title).toBe('Insurance Agents and Brokers');
});

test('insurance agent search returns NOC 63100 in top results', () => {
  const results = searchOccupations(occupations, 'insurance agent');
  const match = results.find((r) => r.noc_code === '63100');
  expect(match).toBeDefined();
  // Ensure the old wrong code is absent from the dataset entirely
  const hasOldCode = occupations.some((o) => o.noc_code === '13100');
  expect(hasOldCode).toBe(false);
});

// ── Companion fixes: real estate and financial sales reps ─────────────────────

test('realtor search returns NOC 63101, not 13101', () => {
  const results = searchOccupations(occupations, 'realtor');
  expect(results.length).toBeGreaterThan(0);
  const top = results[0];
  expect(top.noc_code).toBe('63101');
});

test('bank teller search returns NOC 63102, not 13102', () => {
  const results = searchOccupations(occupations, 'bank teller');
  expect(results.length).toBeGreaterThan(0);
  const top = results[0];
  expect(top.noc_code).toBe('63102');
});

// ── General correctness ───────────────────────────────────────────────────────

test('software engineer search returns NOC 21231', () => {
  const results = searchOccupations(occupations, 'software engineer');
  expect(results.length).toBeGreaterThan(0);
  expect(results[0].noc_code).toBe('21231');
});

test('empty query returns empty array', () => {
  expect(searchOccupations(occupations, '')).toEqual([]);
  expect(searchOccupations(occupations, ' ')).toEqual([]);
});

test('short query under 2 chars returns empty array', () => {
  expect(searchOccupations(occupations, 'a')).toEqual([]);
});

test('exact title match scores highest', () => {
  const results = searchOccupations(occupations, 'dentists');
  expect(results.length).toBeGreaterThan(0);
  expect(results[0].noc_code).toBe('31110');
});
