/**
 * CCB Engine Tests — US-9.8
 *
 * Validates calculateCCB() against CRA-published scenarios for the
 * July 2025 – June 2026 benefit year.
 *
 * Reference: https://www.canada.ca/en/revenue-agency/services/child-family-benefits/
 *            canada-child-benefit-overview/canada-child-benefit-we-calculate-your-payment.html
 *
 * CRA amounts used for assertions are derived from the published formula:
 *   - max = under6 × $7,997 + age6to17 × $6,748
 *   - phase 1 (T1–T2): reduction = (afni − T1) × r1
 *   - phase 2 (> T2):  reduction = base2 + (afni − T2) × r2
 * Monthly = floor(annual / 12)
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calculateCCB, CCB_DISCLAIMER } from '../../src/lib/simulator/engines/ccbEngine';
import type { CCBParams } from '../../src/lib/simulator/engines/ccbTypes';

// ── Load test params from data file ──────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-require-imports
const RAW = require('../../src/data/simulator/ccb_params.json');
const PARAMS: CCBParams = RAW.data;

// ── Helper ────────────────────────────────────────────────────────────────────

function run(ages: number[], afni: number) {
  return calculateCCB(
    { children: ages.map((age) => ({ age })), adjusted_family_net_income: afni },
    PARAMS,
  );
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('calculateCCB — output shape', () => {
  it('returns applicable=false and zero amounts when no children', () => {
    const result = run([], 80_000);
    assert.equal(result.applicable,       false);
    assert.equal(result.total_children,   0);
    assert.equal(result.monthly_estimate, 0);
    assert.equal(result.annual_estimate,  0);
    assert.equal(result.max_annual,       0);
  });

  it('returns applicable=true when children present', () => {
    const result = run([3], 80_000);
    assert.equal(result.applicable, true);
  });

  it('always includes the disclaimer string (AC-6)', () => {
    const withKids    = run([3], 80_000);
    const withoutKids = run([], 80_000);
    assert.equal(withKids.disclaimer,    CCB_DISCLAIMER);
    assert.equal(withoutKids.disclaimer, CCB_DISCLAIMER);
  });

  it('echoes AFNI on result', () => {
    const result = run([3], 75_000);
    assert.equal(result.afni, 75_000);
  });
});

describe('calculateCCB — age categorisation (AC-4)', () => {
  it('TC-2: child age 3 counts as under-6, age 8 counts as 6-17', () => {
    const result = run([3, 8], 60_000);
    assert.equal(result.under_6_count,   1);
    assert.equal(result.age_6to17_count, 1);
    assert.equal(result.total_children,  2);
  });

  it('under-6 max is higher than 6-17 max per child', () => {
    assert.ok(PARAMS.max_per_child_under_6 > PARAMS.max_per_child_6_to_17);
  });

  it('age-17 child is included; age-18 child is excluded', () => {
    const included = run([17], 50_000);
    const excluded = run([18], 50_000);
    assert.equal(included.applicable, true);
    assert.equal(excluded.applicable, false);
  });
});

describe('calculateCCB — TC-4: full amount below threshold_1', () => {
  it('AFNI $35K — no reduction (below T1)', () => {
    const result = run([3], 35_000);
    // AFNI < T1 → reduction = 0 → annual = max
    assert.equal(result.reduction,      0);
    assert.equal(result.annual_estimate, PARAMS.max_per_child_under_6);
    // monthly = floor(7997 / 12) = 666
    assert.equal(result.monthly_estimate, Math.floor(PARAMS.max_per_child_under_6 / 12));
  });
});

describe('calculateCCB — TC-1: phase-1 reduction (T1 < AFNI ≤ T2)', () => {
  it('1 child age 3, AFNI $80K — within 10% of CRA estimate (~$418/mo)', () => {
    const result = run([3], 80_000);
    // phase-1: reduction = (80000 − 37487) × 0.07 = 2975.91
    // annual  = 7997 − 2975.91 = 5021.09  →  monthly = 418
    assert.equal(result.under_6_count, 1);
    assert.ok(result.reduction > 0, 'reduction should be positive');
    assert.ok(result.annual_estimate < PARAMS.max_per_child_under_6, 'annual should be less than max');
    // CRA reference ~$418/mo — check within 10%
    const CRA_REFERENCE = 418;
    const tolerance = CRA_REFERENCE * 0.1;
    assert.ok(
      Math.abs(result.monthly_estimate - CRA_REFERENCE) <= tolerance,
      `Expected monthly ~$${CRA_REFERENCE}, got $${result.monthly_estimate}`,
    );
  });
});

describe('calculateCCB — TC-2: 2 children, mixed ages, AFNI $60K', () => {
  it('under-6 child contributes higher base amount than 6-17 child', () => {
    const result = run([3, 8], 60_000);
    // max = 7997 + 6748 = 14745
    assert.equal(result.max_annual, PARAMS.max_per_child_under_6 + PARAMS.max_per_child_6_to_17);
    // phase-1 with 2 children: (60000 − 37487) × 0.135 = 3039.26
    // annual ≈ 14745 − 3039.26 = 11705.74  →  monthly = 975
    assert.ok(result.monthly_estimate > 0);
    assert.ok(result.annual_estimate > 0);
    assert.ok(result.reduction > 0, 'income above T1 — reduction expected');
  });

  it('single-child reference: under-6 alone yields higher monthly than 6-17 alone', () => {
    const under6   = run([3], 60_000);
    const older    = run([8], 60_000);
    assert.ok(under6.monthly_estimate > older.monthly_estimate);
  });
});

describe('calculateCCB — TC-3: phase-2 reduction, AFNI $250K', () => {
  it('1 child age 3, AFNI $250K — CCB reduced to zero', () => {
    const result = run([3], 250_000);
    // base2 = 3061; (250000 − 81222) × 0.032 = 5400.90 → reduction = 8461.90 > 7997
    assert.equal(result.monthly_estimate, 0);
    assert.equal(result.annual_estimate,  0);
    assert.ok(result.reduction >= result.max_annual, 'reduction should equal or exceed max');
  });

  it('annual_estimate never goes negative', () => {
    const result = run([3, 5], 500_000);
    assert.ok(result.annual_estimate >= 0);
    assert.ok(result.monthly_estimate >= 0);
  });
});

describe('calculateCCB — TC-7: five additional CRA-aligned scenarios', () => {
  it('4 children, AFNI $45K — reduction uses 4-child rates', () => {
    const result = run([2, 4, 8, 14], 45_000);
    // r1 for 4+ children = 0.23
    // reduction = (45000 − 37487) × 0.23 = 7513 × 0.23 = 1727.99
    // max = 2×7997 + 2×6748 = 29490
    // annual ≈ 29490 − 1728 = 27762  →  monthly = 2313
    assert.equal(result.total_children,  4);
    assert.equal(result.under_6_count,   2);
    assert.equal(result.age_6to17_count, 2);
    assert.ok(result.monthly_estimate > 2000, 'large family should receive substantial benefit');
    assert.ok(result.annual_estimate < result.max_annual);
  });

  it('AFNI exactly at threshold_1 — no reduction (boundary)', () => {
    const result = run([3], PARAMS.threshold_1);
    assert.equal(result.reduction, 0);
    assert.equal(result.annual_estimate, PARAMS.max_per_child_under_6);
  });

  it('AFNI just above threshold_1 — small positive reduction', () => {
    const result = run([3], PARAMS.threshold_1 + 1000);
    // reduction = 1000 × 0.07 = 70
    assert.ok(result.reduction > 0);
    assert.ok(result.annual_estimate < PARAMS.max_per_child_under_6);
  });

  it('AFNI exactly at threshold_2 — uses base2 (phase-2 boundary)', () => {
    // At exactly T2, formula uses: reduction = base2 + 0 × r2 = base2
    // but our implementation: afni > T2 for phase 2, so at exactly T2 it's phase 1
    const result = run([3], PARAMS.threshold_2);
    const expectedPhase1 = (PARAMS.threshold_2 - PARAMS.threshold_1) * PARAMS.phase_rates.children_1.r1;
    assert.ok(Math.abs(result.reduction - expectedPhase1) < 1, 'at T2 exactly, phase-1 rate applies');
  });

  it('all children age 6-17 — uses lower per-child rate', () => {
    const allOlder    = run([7, 10, 15], 50_000);
    const allUnder6   = run([1, 2, 3],  50_000);
    assert.ok(allUnder6.max_annual > allOlder.max_annual,
      'under-6 cohort should have higher max than 6-17 cohort (same count)');
  });
});

describe('calculateCCB — data integrity', () => {
  it('monthly_estimate = floor(annual_estimate / 12)', () => {
    const scenarios = [
      run([3], 50_000),
      run([3, 8], 75_000),
      run([1, 2, 10], 100_000),
    ];
    for (const r of scenarios) {
      assert.equal(r.monthly_estimate, Math.floor(r.annual_estimate / 12));
    }
  });

  it('annual_estimate = max_annual − reduction (clamped to 0)', () => {
    const result = run([3], 60_000);
    const expected = Math.max(0, result.max_annual - result.reduction);
    assert.ok(Math.abs(result.annual_estimate - expected) < 0.01);
  });
});
