/**
 * Unit tests for the Cost-of-Living & Affordability Engine (US-9.5)
 *
 * Run with: npm run test:simulator
 *
 * Reference values sourced from:
 *   - Statistics Canada MBM thresholds 2022-base (mbm_thresholds.json)
 *   - CMHC Rental Market Survey 2024 (rent_benchmarks.json)
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { estimateCostOfLiving }   from '../../src/lib/simulator/engines/colEngine';
import { calculateAffordability } from '../../src/lib/simulator/engines/affordabilityEngine';
import { lookupMBM }              from '../../src/lib/simulator/data/mbmLookup';
import { lookupRent }             from '../../src/lib/simulator/data/rentLookup';
import type {
  COLInput,
  MBMThresholdEntry,
  RentBenchmarkEntry,
} from '../../src/lib/simulator/engines/colTypes';

// ── Load real data ────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-require-imports
const mbmRaw  = require('../../src/data/simulator/mbm_thresholds.json')  as { data: MBMThresholdEntry[] };
// eslint-disable-next-line @typescript-eslint/no-require-imports
const rentRaw = require('../../src/data/simulator/rent_benchmarks.json') as { data: RentBenchmarkEntry[] };

const mbmData:  MBMThresholdEntry[]  = mbmRaw.data;
const rentData: RentBenchmarkEntry[] = rentRaw.data;

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Base input: Toronto, 3 persons, 2BR, moderate lifestyle. */
function torontoInput(overrides: Partial<COLInput> = {}): COLInput {
  return {
    mbm_region:           'toronto',
    cma_code:             '535',
    family_size:          3,
    bedrooms:             2,
    lifestyle:            'moderate',
    monthly_take_home:    4500,
    gross_monthly_income: 6667, // ~$80k / 12
    ...overrides,
  };
}

function assertClose(actual: number, expected: number, tol: number, label: string) {
  const diff = Math.abs(actual - expected);
  assert.ok(diff <= tol, `${label}: expected ${expected} ± ${tol}, got ${actual} (diff=${diff.toFixed(2)})`);
}

// ── TC-1: MBM baseline — Toronto 3 persons ────────────────────────────────────
// Statistics Canada threshold: $54,300 / 12 = $4,525/month

describe('TC-1: MBM baseline — Toronto 3 persons', () => {
  it('baseline_mbm_monthly is within 10% of published StatCan threshold', () => {
    const result = estimateCostOfLiving(torontoInput(), mbmData, rentData);
    // Published: 54300 / 12 = 4525
    assertClose(result.baseline_mbm_monthly, 4525, 4525 * 0.10, 'baseline_mbm_monthly');
  });

  it('baseline_mbm_monthly equals exact published value (54300/12)', () => {
    const result = estimateCostOfLiving(torontoInput(), mbmData, rentData);
    assert.equal(result.baseline_mbm_monthly, Math.round(54300 / 12)); // 4525
  });

  it('mbm_region_match signal fires', () => {
    const result = estimateCostOfLiving(torontoInput(), mbmData, rentData);
    assert.ok(result.confidence.signals.includes('mbm_region_match'));
  });
});

// ── TC-2: Rent benchmark — Toronto 2BR ────────────────────────────────────────
// CMHC 2024 Toronto 2BR average: $2,080

describe('TC-2: rent benchmark — Toronto 2BR', () => {
  it('rent_benchmark_monthly is within 10% of CMHC Toronto 2BR average', () => {
    const result = estimateCostOfLiving(torontoInput(), mbmData, rentData);
    assertClose(result.rent_benchmark_monthly, 2080, 2080 * 0.10, 'rent_benchmark_monthly');
  });

  it('rent_benchmark_monthly equals exact CMHC value ($2,080)', () => {
    const result = estimateCostOfLiving(torontoInput(), mbmData, rentData);
    assert.equal(result.rent_benchmark_monthly, 2080);
  });

  it('rent_source is cmhc_benchmark', () => {
    const result = estimateCostOfLiving(torontoInput(), mbmData, rentData);
    assert.equal(result.rent_source, 'cmhc_benchmark');
  });

  it('rent_cmhc_available signal fires', () => {
    const result = estimateCostOfLiving(torontoInput(), mbmData, rentData);
    assert.ok(result.confidence.signals.includes('rent_cmhc_available'));
  });
});

// ── TC-3: Shelter ratio formula verification ──────────────────────────────────
// Toronto 2BR rent = $2,080; gross monthly = $6,500
// shelter_ratio = 2080 / 6500 = 0.32 → at_risk

describe('TC-3: shelter ratio formula — $6,500 gross monthly', () => {
  it('shelter_cost_to_income_ratio = rent / gross_monthly', () => {
    const inp = torontoInput({ gross_monthly_income: 6500 });
    const result = estimateCostOfLiving(inp, mbmData, rentData);
    const expected = 2080 / 6500;
    assertClose(result.shelter_cost_to_income_ratio, expected, 0.001, 'shelter ratio');
  });

  it('shelter ratio is approximately 0.32 for $6,500 gross', () => {
    const inp = torontoInput({ gross_monthly_income: 6500 });
    const result = estimateCostOfLiving(inp, mbmData, rentData);
    assertClose(result.shelter_cost_to_income_ratio, 0.32, 0.005, 'shelter ratio ≈ 0.32');
  });
});

// ── TC-4: Affordability flag thresholds ──────────────────────────────────────

describe('TC-4: affordability flags', () => {
  it('affordable when rent < 30% of gross', () => {
    const { housing_affordability_flag } = calculateAffordability(1000, 5000); // 20% → affordable
    assert.equal(housing_affordability_flag, 'affordable');
  });

  it('at_risk when rent is between 30% and 50% of gross', () => {
    // Toronto 2BR $2,080 / $6,500 = 32% → at_risk
    const inp = torontoInput({ gross_monthly_income: 6500 });
    const result = estimateCostOfLiving(inp, mbmData, rentData);
    assert.equal(result.housing_affordability_flag, 'at_risk');
  });

  it('at_risk at exactly 30% boundary', () => {
    const { housing_affordability_flag } = calculateAffordability(1500, 5000); // exactly 30%
    assert.equal(housing_affordability_flag, 'at_risk');
  });

  it('unaffordable when rent > 50% of gross', () => {
    const { housing_affordability_flag } = calculateAffordability(3000, 5000); // 60%
    assert.equal(housing_affordability_flag, 'unaffordable');
  });

  it('affordable when rent is below 30%', () => {
    const { housing_affordability_flag } = calculateAffordability(2080, 10000); // 20.8%
    assert.equal(housing_affordability_flag, 'affordable');
  });
});

// ── TC-5: Rent fallback to MBM shelter share ─────────────────────────────────

describe('TC-5: rent fallback — unknown CMA', () => {
  const noRentData: RentBenchmarkEntry[] = []; // empty → forces fallback

  it('rent_source is mbm_shelter_fallback when no CMHC data', () => {
    const result = estimateCostOfLiving(torontoInput(), mbmData, noRentData);
    assert.equal(result.rent_source, 'mbm_shelter_fallback');
  });

  it('fallback rent = baseline_mbm_monthly × 0.38', () => {
    const result = estimateCostOfLiving(torontoInput(), mbmData, noRentData);
    const expected = Math.round(result.baseline_mbm_monthly * 0.38 * 100) / 100;
    assertClose(result.rent_benchmark_monthly, expected, 1, 'fallback rent');
  });

  it('rent_mbm_shelter_fallback signal fires', () => {
    const result = estimateCostOfLiving(torontoInput(), mbmData, noRentData);
    assert.ok(result.confidence.signals.includes('rent_mbm_shelter_fallback'));
  });

  it('confidence tier is lower (not High) for fallback rent', () => {
    const result = estimateCostOfLiving(torontoInput(), mbmData, noRentData);
    assert.notEqual(result.confidence.tier, 'High');
  });

  it('CMHC version has higher confidence than fallback version', () => {
    const withCmhc    = estimateCostOfLiving(torontoInput(), mbmData, rentData);
    const withFallback = estimateCostOfLiving(torontoInput(), mbmData, noRentData);
    assert.ok(withCmhc.confidence.score > withFallback.confidence.score, 'CMHC score > fallback score');
  });
});

// ── TC-6: Family size increases MBM threshold ────────────────────────────────

describe('TC-6: family size scales MBM threshold', () => {
  it('family size 5 has higher threshold than family size 3', () => {
    const size3 = lookupMBM('toronto', 3, mbmData);
    const size5 = lookupMBM('toronto', 5, mbmData);
    assert.ok(size5.annual_threshold > size3.annual_threshold, 'size5 > size3');
  });

  it('Toronto persons_3 = $54,300; persons_5 = $70,100', () => {
    const size3 = lookupMBM('toronto', 3, mbmData);
    const size5 = lookupMBM('toronto', 5, mbmData);
    assert.equal(size3.annual_threshold, 54300);
    assert.equal(size5.annual_threshold, 70100);
  });

  it('baseline_mbm_monthly increases as family_size goes from 3 to 5', () => {
    const r3 = estimateCostOfLiving(torontoInput({ family_size: 3 }), mbmData, rentData);
    const r5 = estimateCostOfLiving(torontoInput({ family_size: 5 }), mbmData, rentData);
    assert.ok(r5.baseline_mbm_monthly > r3.baseline_mbm_monthly);
  });

  it('family size 7+ is clamped to persons_7', () => {
    const size7  = lookupMBM('toronto', 7, mbmData);
    const size10 = lookupMBM('toronto', 10, mbmData);
    assert.equal(size10.annual_threshold, size7.annual_threshold);
    assert.equal(size10.family_size_used, 7);
  });
});

// ── TC-7: Lifestyle multiplier reduces non-shelter costs ─────────────────────

describe('TC-7: lifestyle multiplier', () => {
  it('frugal non_shelter_monthly = moderate × 0.85', () => {
    const mod    = estimateCostOfLiving(torontoInput({ lifestyle: 'moderate' }),   mbmData, rentData);
    const frugal = estimateCostOfLiving(torontoInput({ lifestyle: 'frugal' }),     mbmData, rentData);
    assertClose(frugal.non_shelter_monthly, mod.non_shelter_monthly * 0.85, 1, 'frugal vs moderate');
  });

  it('comfortable non_shelter_monthly = moderate × 1.20', () => {
    const mod         = estimateCostOfLiving(torontoInput({ lifestyle: 'moderate' }),    mbmData, rentData);
    const comfortable = estimateCostOfLiving(torontoInput({ lifestyle: 'comfortable' }), mbmData, rentData);
    assertClose(comfortable.non_shelter_monthly, mod.non_shelter_monthly * 1.20, 1, 'comfortable vs moderate');
  });

  it('frugal reduces non-shelter by ~15% compared to moderate', () => {
    const mod    = estimateCostOfLiving(torontoInput({ lifestyle: 'moderate' }), mbmData, rentData);
    const frugal = estimateCostOfLiving(torontoInput({ lifestyle: 'frugal' }),   mbmData, rentData);
    const reduction = (mod.non_shelter_monthly - frugal.non_shelter_monthly) / mod.non_shelter_monthly;
    assertClose(reduction, 0.15, 0.005, 'frugal reduction %');
  });

  it('lifestyle multiplier does NOT change rent_benchmark_monthly', () => {
    const mod    = estimateCostOfLiving(torontoInput({ lifestyle: 'moderate' }),   mbmData, rentData);
    const frugal = estimateCostOfLiving(torontoInput({ lifestyle: 'frugal' }),     mbmData, rentData);
    assert.equal(frugal.rent_benchmark_monthly, mod.rent_benchmark_monthly);
  });

  it('lifestyle_multiplier field reflects the selected tier', () => {
    const r = estimateCostOfLiving(torontoInput({ lifestyle: 'comfortable' }), mbmData, rentData);
    assert.equal(r.lifestyle_multiplier, 1.20);
  });

  it('moderate is the default when lifestyle is not specified', () => {
    const inp = torontoInput();
    delete (inp as Partial<COLInput>).lifestyle;
    const r = estimateCostOfLiving(inp, mbmData, rentData);
    assert.equal(r.lifestyle, 'moderate');
    assert.equal(r.lifestyle_multiplier, 1.00);
  });
});

// ── TC-8: Exact monthly surplus arithmetic ────────────────────────────────────

describe('TC-8: monthly surplus / deficit', () => {
  it('monthly_surplus = monthly_take_home − estimated_total_monthly', () => {
    const take_home = 4500;
    const result = estimateCostOfLiving(torontoInput({ monthly_take_home: take_home }), mbmData, rentData);
    const expected = Math.round((take_home - result.estimated_total_monthly) * 100) / 100;
    assert.equal(result.monthly_surplus, expected);
  });

  it('monthly_surplus is negative when take-home < total costs (deficit)', () => {
    const result = estimateCostOfLiving(torontoInput({ monthly_take_home: 2000 }), mbmData, rentData);
    assert.ok(result.monthly_surplus < 0, 'should be a deficit');
  });

  it('monthly_surplus is positive when take-home > total costs', () => {
    const result = estimateCostOfLiving(torontoInput({ monthly_take_home: 8000 }), mbmData, rentData);
    assert.ok(result.monthly_surplus > 0, 'should be a surplus');
  });

  it('estimated_total_monthly = non_shelter_monthly + rent_benchmark_monthly', () => {
    const r = estimateCostOfLiving(torontoInput(), mbmData, rentData);
    assertClose(
      r.estimated_total_monthly,
      r.non_shelter_monthly + r.rent_benchmark_monthly,
      0.02,
      'estimated_total_monthly composition',
    );
  });
});

// ── Additional invariants ─────────────────────────────────────────────────────

describe('additional invariants', () => {
  it('confidence.score is between 0 and 1', () => {
    const r = estimateCostOfLiving(torontoInput(), mbmData, rentData);
    assert.ok(r.confidence.score >= 0 && r.confidence.score <= 1);
  });

  it('all monetary outputs are non-negative for positive income', () => {
    const r = estimateCostOfLiving(torontoInput({ monthly_take_home: 5000 }), mbmData, rentData);
    assert.ok(r.baseline_mbm_monthly   >= 0);
    assert.ok(r.rent_benchmark_monthly >= 0);
    assert.ok(r.non_shelter_monthly    >= 0);
    assert.ok(r.estimated_total_monthly >= 0);
  });

  it('lookupRent returns null for an unknown CMA code', () => {
    const result = lookupRent('9999', 2, rentData);
    assert.equal(result, null);
  });

  it('lookupMBM found=false for an unknown MBM region', () => {
    const result = lookupMBM('unknown-region', 3, mbmData);
    assert.equal(result.found, false);
    assert.equal(result.annual_threshold, 0);
  });

  it('shelter ratio is clamped to 1 for zero income', () => {
    const { shelter_cost_to_income_ratio } = calculateAffordability(2000, 0);
    assert.equal(shelter_cost_to_income_ratio, 1);
  });

  it('output echoes back mbm_region, cma_code, family_size, bedrooms', () => {
    const inp = torontoInput({ family_size: 4, bedrooms: 3 });
    const r   = estimateCostOfLiving(inp, mbmData, rentData);
    assert.equal(r.mbm_region,  'toronto');
    assert.equal(r.cma_code,    '535');
    assert.equal(r.family_size, 4);
    assert.equal(r.bedrooms,    3);
  });
});
