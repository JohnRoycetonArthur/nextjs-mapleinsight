/**
 * Unit tests for the Salary Estimation Engine (US-9.3)
 *
 * Run with: npm run test:simulator
 * Uses Node 22 built-in test runner (node:test) — no extra dependencies.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { estimateSalary } from '../../src/lib/simulator/engines/salaryEngine';
import type { WageFact, SalaryInput } from '../../src/lib/simulator/engines/salaryTypes';

// ── Shared fixtures ───────────────────────────────────────────────────────────

/**
 * A small synthetic wage dataset.
 * 2025 data = fresh (within 18 months from March 2026).
 * 2023 data = stale (>18 months from March 2026).
 */
const MOCK_FACTS: WageFact[] = [
  // Software developer: city + province + national
  {
    noc_code: '21231',
    geo_key: 'toronto-on',
    low_hourly: 35.00,
    median_hourly: 50.00,
    high_hourly: 70.00,
    source: 'Job Bank Canada',
    ref_period: '2025',
  },
  {
    noc_code: '21231',
    geo_key: 'ON',
    low_hourly: 32.00,
    median_hourly: 46.00,
    high_hourly: 65.00,
    source: 'Job Bank Canada',
    ref_period: '2025',
  },
  {
    noc_code: '21231',
    geo_key: 'national',
    low_hourly: 28.00,
    median_hourly: 40.00,
    high_hourly: 58.00,
    source: 'Statistics Canada',
    ref_period: '2025',
  },
  // Nurse: province only (no city, no national)
  {
    noc_code: '31301',
    geo_key: 'BC',
    low_hourly: 36.00,
    median_hourly: 45.00,
    high_hourly: 56.00,
    source: 'Job Bank Canada',
    ref_period: '2025',
  },
  // Accountant: stale data (2023)
  {
    noc_code: '11100',
    geo_key: 'AB',
    low_hourly: 30.00,
    median_hourly: 42.00,
    high_hourly: 60.00,
    source: 'Job Bank Canada',
    ref_period: '2023',
  },
];

/** Convenience: build an input with sensible defaults, override as needed. */
function input(overrides: Partial<SalaryInput> = {}): SalaryInput {
  return {
    noc_code:         '21231',
    city_id:          'toronto-on',
    province_code:    'ON',
    years_experience: 5,
    hours_per_week:   40,
    ...overrides,
  };
}

// ── TC-1: City-level match ────────────────────────────────────────────────────

describe('TC-1: city-level geographic match', () => {
  it('uses city-level data when available', () => {
    const result = estimateSalary(input(), MOCK_FACTS);
    assert.equal(result.fallback_tier, 'city');
    assert.equal(result.median_hourly, 50.00);
  });

  it('emits city_level_match signal', () => {
    const result = estimateSalary(input(), MOCK_FACTS);
    assert.ok(result.confidence.signals.includes('city_level_match'));
  });

  it('annual_mid is within $70k–$130k for software developer at 40h/week', () => {
    const result = estimateSalary(input({ years_experience: 5 }), MOCK_FACTS);
    // 50.00 × 40 × 52 = $104,000
    assert.ok(result.annual_mid >= 70_000, `annual_mid ${result.annual_mid} < $70k`);
    assert.ok(result.annual_mid <= 130_000, `annual_mid ${result.annual_mid} > $130k`);
  });

  it('annual_mid equals median_hourly × hours_per_week × 52', () => {
    const result = estimateSalary(input(), MOCK_FACTS);
    assert.equal(result.annual_mid, Math.round(50.00 * 40 * 52));
  });
});

// ── TC-2: Province fallback ───────────────────────────────────────────────────

describe('TC-2: province-level fallback', () => {
  it('falls back to province when no city data exists', () => {
    const result = estimateSalary(input({ city_id: 'unknown-city-on' }), MOCK_FACTS);
    assert.equal(result.fallback_tier, 'province');
  });

  it('emits province_fallback signal', () => {
    const result = estimateSalary(input({ city_id: 'unknown-city-on' }), MOCK_FACTS);
    assert.ok(result.confidence.signals.includes('province_fallback'));
  });

  it('uses provincial wage values', () => {
    const result = estimateSalary(input({ city_id: 'unknown-city-on' }), MOCK_FACTS);
    assert.equal(result.median_hourly, 46.00);
    assert.equal(result.low_hourly, 32.00);
    assert.equal(result.high_hourly, 65.00);
  });
});

// ── TC-3: National fallback ───────────────────────────────────────────────────

describe('TC-3: national fallback', () => {
  it('falls back to national when no city or province data exists', () => {
    const result = estimateSalary(
      input({ city_id: 'whitehorse-yt', province_code: 'YT' }),
      MOCK_FACTS,
    );
    assert.equal(result.fallback_tier, 'national');
  });

  it('emits national_fallback signal', () => {
    const result = estimateSalary(
      input({ city_id: 'whitehorse-yt', province_code: 'YT' }),
      MOCK_FACTS,
    );
    assert.ok(result.confidence.signals.includes('national_fallback'));
  });

  it('confidence tier is Low for national-only data', () => {
    const result = estimateSalary(
      input({ city_id: 'whitehorse-yt', province_code: 'YT' }),
      MOCK_FACTS,
    );
    // national_fallback score = 0.35, which is < 0.40 → Low
    assert.equal(result.confidence.tier, 'Low');
  });
});

// ── TC-4/TC-5: Experience level mapping ──────────────────────────────────────

describe('TC-4 & TC-5: experience level mapping', () => {
  it('0 years → entry level, uses low_hourly', () => {
    const result = estimateSalary(input({ years_experience: 0 }), MOCK_FACTS);
    assert.equal(result.experience_level, 'entry');
    assert.equal(result.point_hourly, 35.00);
  });

  it('2 years → entry level', () => {
    const result = estimateSalary(input({ years_experience: 2 }), MOCK_FACTS);
    assert.equal(result.experience_level, 'entry');
  });

  it('3 years → intermediate level, uses median_hourly', () => {
    const result = estimateSalary(input({ years_experience: 3 }), MOCK_FACTS);
    assert.equal(result.experience_level, 'intermediate');
    assert.equal(result.point_hourly, 50.00);
  });

  it('6 years → intermediate level', () => {
    const result = estimateSalary(input({ years_experience: 6 }), MOCK_FACTS);
    assert.equal(result.experience_level, 'intermediate');
  });

  it('7 years → senior level, uses high_hourly', () => {
    const result = estimateSalary(input({ years_experience: 7 }), MOCK_FACTS);
    assert.equal(result.experience_level, 'senior');
    assert.equal(result.point_hourly, 70.00);
  });

  it('12 years → senior level', () => {
    const result = estimateSalary(input({ years_experience: 12 }), MOCK_FACTS);
    assert.equal(result.experience_level, 'senior');
  });

  it('TC-5: 13 years → executive level, point_hourly = high × 1.15', () => {
    const result = estimateSalary(input({ years_experience: 13 }), MOCK_FACTS);
    assert.equal(result.experience_level, 'executive');
    const expected = Math.round(70.00 * 1.15 * 100) / 100;
    assert.equal(result.point_hourly, expected); // 80.5
  });

  it('TC-5: executive emits executive_multiplier_applied signal', () => {
    const result = estimateSalary(input({ years_experience: 15 }), MOCK_FACTS);
    assert.ok(result.confidence.signals.includes('executive_multiplier_applied'));
  });
});

// ── TC-6: Hours per week affects annual conversion ───────────────────────────

describe('TC-6: hours_per_week in annual conversion', () => {
  it('30h/week → annual = median × 30 × 52, not 40 × 52', () => {
    const result = estimateSalary(input({ hours_per_week: 30, years_experience: 5 }), MOCK_FACTS);
    const expected30h = Math.round(50.00 * 30 * 52);
    const expected40h = Math.round(50.00 * 40 * 52);
    assert.equal(result.annual_mid, expected30h);
    assert.notEqual(result.annual_mid, expected40h);
  });

  it('annual_low and annual_high also reflect hours_per_week', () => {
    const result = estimateSalary(input({ hours_per_week: 30 }), MOCK_FACTS);
    assert.equal(result.annual_low,  Math.round(35.00 * 30 * 52));
    assert.equal(result.annual_high, Math.round(70.00 * 30 * 52));
  });
});

// ── TC-7: Data sources ────────────────────────────────────────────────────────

describe('TC-7: data_sources provenance', () => {
  it('data_sources is non-empty', () => {
    const result = estimateSalary(input(), MOCK_FACTS);
    assert.ok(result.data_sources.length > 0);
  });

  it('data_sources entry has source, ref_period, and geo_key', () => {
    const result = estimateSalary(input(), MOCK_FACTS);
    const ds = result.data_sources[0];
    assert.ok(typeof ds.source     === 'string' && ds.source.length > 0);
    assert.ok(typeof ds.ref_period === 'string' && ds.ref_period.length > 0);
    assert.ok(typeof ds.geo_key    === 'string' && ds.geo_key.length > 0);
  });

  it('data_sources geo_key matches city_id for a city-level match', () => {
    const result = estimateSalary(input(), MOCK_FACTS);
    assert.equal(result.data_sources[0].geo_key, 'toronto-on');
  });
});

// ── TC-8: Confidence score range ─────────────────────────────────────────────

describe('TC-8: confidence score', () => {
  it('confidence.score is a number between 0 and 1 (city match)', () => {
    const result = estimateSalary(input(), MOCK_FACTS);
    assert.ok(result.confidence.score >= 0);
    assert.ok(result.confidence.score <= 1);
  });

  it('confidence.score is between 0 and 1 (no data found)', () => {
    const result = estimateSalary(input({ noc_code: '99999' }), MOCK_FACTS);
    assert.ok(result.confidence.score >= 0);
    assert.ok(result.confidence.score <= 1);
  });

  it('city_level_match yields High confidence tier (fresh data)', () => {
    const result = estimateSalary(input(), MOCK_FACTS);
    assert.equal(result.confidence.tier, 'High');
  });

  it('province_fallback yields Medium confidence (score 0.65)', () => {
    const result = estimateSalary(
      input({ city_id: 'kelowna-bc', province_code: 'BC', noc_code: '31301' }),
      MOCK_FACTS,
    );
    assert.equal(result.confidence.tier, 'Medium');
  });
});

// ── TC-9: Multiple occupation/city combinations ───────────────────────────────

describe('TC-9: multiple occupation/city combinations', () => {
  const cases: Array<[string, SalaryInput, string]> = [
    ['SW Dev – Toronto city match',  input({ noc_code: '21231', city_id: 'toronto-on', province_code: 'ON' }), 'city'],
    ['SW Dev – Ottawa → ON province', input({ noc_code: '21231', city_id: 'ottawa-on',  province_code: 'ON' }), 'province'],
    ['SW Dev – Whitehorse → national', input({ noc_code: '21231', city_id: 'whitehorse-yt', province_code: 'YT' }), 'national'],
    ['Nurse – Vancouver → BC province', input({ noc_code: '31301', city_id: 'vancouver-bc', province_code: 'BC' }), 'province'],
    ['Unknown NOC → none',           input({ noc_code: '00000', city_id: 'toronto-on', province_code: 'ON' }), 'none'],
  ];

  for (const [label, inp, expectedTier] of cases) {
    it(`${label}`, () => {
      const result = estimateSalary(inp, MOCK_FACTS);
      assert.equal(result.fallback_tier, expectedTier, `Expected tier "${expectedTier}" for ${label}`);
    });
  }
});

// ── Staleness signal ──────────────────────────────────────────────────────────

describe('data staleness', () => {
  it('emits data_over_18_months_old when ref_period is 2023 (stale from March 2026)', () => {
    const result = estimateSalary(
      input({ noc_code: '11100', city_id: 'calgary-ab', province_code: 'AB' }),
      MOCK_FACTS,
    );
    assert.ok(result.confidence.signals.includes('data_over_18_months_old'));
  });

  it('does NOT emit data_over_18_months_old for 2025 data', () => {
    const result = estimateSalary(input(), MOCK_FACTS);
    assert.ok(!result.confidence.signals.includes('data_over_18_months_old'));
  });

  it('staleness penalty reduces confidence score', () => {
    const staleResult = estimateSalary(
      input({ noc_code: '11100', city_id: 'calgary-ab', province_code: 'AB' }),
      MOCK_FACTS,
    );
    // province_fallback(0.65) + stale(-0.10) = 0.55
    assert.ok(staleResult.confidence.score < 0.65);
  });
});

// ── No-data edge case ─────────────────────────────────────────────────────────

describe('no data found', () => {
  it('returns fallback_tier = "none" for unknown NOC code', () => {
    const result = estimateSalary(input({ noc_code: '99999' }), MOCK_FACTS);
    assert.equal(result.fallback_tier, 'none');
  });

  it('all wage fields are zero when no data is found', () => {
    const result = estimateSalary(input({ noc_code: '99999' }), MOCK_FACTS);
    assert.equal(result.low_hourly,   0);
    assert.equal(result.median_hourly, 0);
    assert.equal(result.high_hourly,  0);
    assert.equal(result.annual_low,   0);
    assert.equal(result.annual_mid,   0);
    assert.equal(result.annual_high,  0);
    assert.equal(result.point_hourly, 0);
    assert.equal(result.point_annual, 0);
  });

  it('data_sources is empty when no data is found', () => {
    const result = estimateSalary(input({ noc_code: '99999' }), MOCK_FACTS);
    assert.equal(result.data_sources.length, 0);
  });

  it('emits no_data_found signal', () => {
    const result = estimateSalary(input({ noc_code: '99999' }), MOCK_FACTS);
    assert.ok(result.confidence.signals.includes('no_data_found'));
  });
});

// ── Output shape ──────────────────────────────────────────────────────────────

describe('output shape', () => {
  it('output preserves noc_code, city_id, and province_code from input', () => {
    const inp = input({ noc_code: '21231', city_id: 'toronto-on', province_code: 'ON' });
    const result = estimateSalary(inp, MOCK_FACTS);
    assert.equal(result.noc_code,      inp.noc_code);
    assert.equal(result.city_id,       inp.city_id);
    assert.equal(result.province_code, inp.province_code);
  });

  it('annual_low ≤ annual_mid ≤ annual_high when data exists', () => {
    const result = estimateSalary(input(), MOCK_FACTS);
    assert.ok(result.annual_low  <= result.annual_mid,  'annual_low > annual_mid');
    assert.ok(result.annual_mid  <= result.annual_high, 'annual_mid > annual_high');
  });

  it('point_annual = point_hourly × hours_per_week × 52 (rounded)', () => {
    const result = estimateSalary(input({ years_experience: 7 }), MOCK_FACTS);
    // senior → high_hourly = 70, no multiplier
    assert.equal(result.point_annual, Math.round(result.point_hourly * 40 * 52));
  });
});
