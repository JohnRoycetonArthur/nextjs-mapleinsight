/**
 * Unit tests — Core Calculation Engine (US-12.1)
 *
 * Toronto scenario (TC-1):
 *   $60K income, 1BR, Express Entry FSW, no job offer,
 *   $18K savings, $300 obligations, single adult, basic furnishing
 */

import {
  computeGap,
  computeMonthlyMin,
  computeSafe,
  computeUpfront,
  runEngine,
} from '@/lib/settlement-engine/calculate'
import { BUFFER_PERCENT, ENGINE_VERSION, RUNWAY_MONTHS } from '@/lib/settlement-engine/constants'
import type { CityBaseline } from '@/lib/settlement-engine/baselines'
import type { EngineInput } from '@/lib/settlement-engine/types'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const TORONTO_BASELINE: CityBaseline = {
  cityName:           'Toronto',
  province:           'ON',
  avgRentStudio:      1_450,
  avgRent1BR:         1_761,
  avgRent2BR:         2_100,
  monthlyTransitPass: 156,
  source:             'CMHC Rental Market Report, October 2025',
  effectiveDate:      '2025-10-01',
  dataVersion:        '2025-10',
  isFallback:         false,
}

const TORONTO_INPUT: EngineInput = {
  city:     'Toronto',
  province: 'ON',
  pathway:  'express-entry-fsw',
  fees: {
    applicationFee:  1_365,
    biometricsFee:   85,
    biometricsPaid:  false,
  },
  housingType:           '1br',
  furnishingLevel:       'basic',
  household:             { adults: 1, children: 0 },
  needsChildcare:        false,
  liquidSavings:         18_000,
  monthlyObligations:    300,
  plansCar:              false,
  customMonthlyExpenses: 0,
  jobStatus:             'none',
}

// ─── computeUpfront ───────────────────────────────────────────────────────────

describe('computeUpfront', () => {
  const result = computeUpfront(TORONTO_INPUT, TORONTO_BASELINE)

  it('includes immigration fee', () => {
    const item = result.breakdown.find(i => i.key === 'immigration-fee')
    expect(item?.cad).toBe(1_365)
    expect(item?.source).toBe('ircc')
  })

  it('includes biometrics fee when not yet paid', () => {
    const item = result.breakdown.find(i => i.key === 'biometrics')
    expect(item?.cad).toBe(85)
    expect(item?.source).toBe('ircc')
  })

  it('omits biometrics fee when already paid', () => {
    const r = computeUpfront(
      { ...TORONTO_INPUT, fees: { ...TORONTO_INPUT.fees, biometricsPaid: true } },
      TORONTO_BASELINE,
    )
    expect(r.breakdown.find(i => i.key === 'biometrics')).toBeUndefined()
  })

  it('includes default travel estimate', () => {
    const item = result.breakdown.find(i => i.key === 'travel')
    expect(item?.cad).toBe(1_500)
  })

  it('uses override travel estimate when provided', () => {
    const r = computeUpfront({ ...TORONTO_INPUT, travelEstimateOverride: 2_500 }, TORONTO_BASELINE)
    expect(r.breakdown.find(i => i.key === 'travel')?.cad).toBe(2_500)
  })

  it('includes housing deposit = 2× 1BR rent', () => {
    const item = result.breakdown.find(i => i.key === 'housing-deposit')
    expect(item?.cad).toBe(1_761 * 2)
    expect(item?.source).toBe('cmhc')
  })

  it('includes setup cost for basic furnishing level', () => {
    const item = result.breakdown.find(i => i.key === 'setup-essentials')
    expect(item?.cad).toBe(2_000)
  })

  // U = 1365 + 85 + 1500 + 3522 + 2000 = 8472
  it('total upfront equals sum of all items', () => {
    expect(result.total).toBe(1_365 + 85 + 1_500 + 1_761 * 2 + 2_000)
    expect(result.total).toBe(8_472)
  })
})

// ─── computeMonthlyMin ────────────────────────────────────────────────────────

describe('computeMonthlyMin', () => {
  const result = computeMonthlyMin(TORONTO_INPUT, TORONTO_BASELINE)

  it('includes 1BR rent from CMHC baseline', () => {
    const item = result.breakdown.find(i => i.key === 'rent')
    expect(item?.cad).toBe(1_761)
    expect(item?.source).toBe('cmhc')
  })

  it('includes transit pass from baseline', () => {
    const item = result.breakdown.find(i => i.key === 'transit')
    expect(item?.cad).toBe(156)
  })

  it('includes utilities baseline', () => {
    expect(result.breakdown.find(i => i.key === 'utilities')?.cad).toBe(150)
  })

  it('includes phone/internet baseline', () => {
    expect(result.breakdown.find(i => i.key === 'phone')?.cad).toBe(80)
  })

  it('includes groceries for single adult', () => {
    expect(result.breakdown.find(i => i.key === 'groceries')?.cad).toBe(400)
  })

  it('includes monthly obligations', () => {
    expect(result.breakdown.find(i => i.key === 'obligations')?.cad).toBe(300)
  })

  it('omits obligations line when $0', () => {
    const r = computeMonthlyMin({ ...TORONTO_INPUT, monthlyObligations: 0 }, TORONTO_BASELINE)
    expect(r.breakdown.find(i => i.key === 'obligations')).toBeUndefined()
  })

  // M_min = 1761 + 156 + 150 + 80 + 400 + 300 = 2847
  it('total monthly min equals sum of items', () => {
    expect(result.total).toBe(1_761 + 156 + 150 + 80 + 400 + 300)
    expect(result.total).toBe(2_847)
  })

  it('groceries scale with household size', () => {
    const couple = computeMonthlyMin(
      { ...TORONTO_INPUT, household: { adults: 2, children: 1 }, monthlyObligations: 0 },
      TORONTO_BASELINE,
    )
    // couple $600 + 1 child $200 = $800
    expect(couple.breakdown.find(i => i.key === 'groceries')?.cad).toBe(800)
  })
})

// ─── computeSafe ─────────────────────────────────────────────────────────────

describe('computeSafe', () => {
  const upfront     = 8_472
  const monthlyMin  = 2_847
  const monthlyBreakdown = computeMonthlyMin(TORONTO_INPUT, TORONTO_BASELINE).breakdown

  it('M_safe equals M_min when no lifestyle adders', () => {
    const r = computeSafe(TORONTO_INPUT, upfront, monthlyMin, monthlyBreakdown)
    expect(r.monthlySafe).toBe(monthlyMin)
  })

  it('runway is 6 months for jobStatus=none', () => {
    const r = computeSafe(TORONTO_INPUT, upfront, monthlyMin, monthlyBreakdown)
    expect(r.runwayMonths).toBe(6)
  })

  it('runway is 2 months for jobStatus=secured', () => {
    const r = computeSafe({ ...TORONTO_INPUT, jobStatus: 'secured' }, upfront, monthlyMin, monthlyBreakdown)
    expect(r.runwayMonths).toBe(2)
  })

  it('adds childcare when needsChildcare=true', () => {
    const r = computeSafe({ ...TORONTO_INPUT, needsChildcare: true }, upfront, monthlyMin, monthlyBreakdown)
    expect(r.monthlySafe).toBe(monthlyMin + 1_200)
  })

  it('adds car cost when plansCar=true', () => {
    const r = computeSafe({ ...TORONTO_INPUT, plansCar: true }, upfront, monthlyMin, monthlyBreakdown)
    expect(r.monthlySafe).toBe(monthlyMin + 600)
  })

  // S_safe = (8472 + 2847×6) × 1.10 = 25554 × 1.10 = 28109.4
  it('S_safe = (U + M_safe × runway) × (1 + buffer)', () => {
    const r = computeSafe(TORONTO_INPUT, upfront, monthlyMin, monthlyBreakdown)
    const expected = (upfront + monthlyMin * 6) * (1 + BUFFER_PERCENT)
    expect(r.safeSavingsTarget).toBeCloseTo(expected, 2)
    expect(r.safeSavingsTarget).toBeCloseTo(28_109.4, 1)
  })

  it('bufferPercent is 10%', () => {
    const r = computeSafe(TORONTO_INPUT, upfront, monthlyMin, monthlyBreakdown)
    expect(r.bufferPercent).toBe(0.10)
  })
})

// ─── computeGap ───────────────────────────────────────────────────────────────

describe('computeGap', () => {
  it('gap = S_safe - savings when savings < S_safe', () => {
    expect(computeGap(28_000, 18_000)).toBeCloseTo(10_000, 0)
  })

  it('gap = 0 when savings >= S_safe', () => {
    expect(computeGap(28_000, 30_000)).toBe(0)
    expect(computeGap(28_000, 28_000)).toBe(0)
  })

  it('gap is never negative', () => {
    expect(computeGap(5_000, 100_000)).toBe(0)
  })
})

// ─── runEngine (TC-1 full scenario) ──────────────────────────────────────────

describe('runEngine — Toronto TC-1 scenario', () => {
  const output = runEngine(TORONTO_INPUT, TORONTO_BASELINE, 'cmhc:2025-10|ircc:2024-11')

  it('produces upfront of $8,472', () => {
    expect(output.upfront).toBe(8_472)
  })

  it('produces monthlyMin of $2,847', () => {
    expect(output.monthlyMin).toBe(2_847)
  })

  it('S_safe ≈ $28,109', () => {
    expect(output.safeSavingsTarget).toBeCloseTo(28_109.4, 1)
  })

  it('savings gap ≈ $10,109 (18K savings)', () => {
    expect(output.savingsGap).toBeCloseTo(28_109.4 - 18_000, 1)
  })

  it('includes engineVersion', () => {
    expect(output.engineVersion).toBe(ENGINE_VERSION)
    expect(output.engineVersion).toMatch(/^\d+\.\d+\.\d+$/)
  })

  it('includes dataVersion', () => {
    expect(output.dataVersion).toBe('cmhc:2025-10|ircc:2024-11')
  })

  it('baselineFallback is false for Toronto', () => {
    expect(output.baselineFallback).toBe(false)
  })

  // TC-4 — determinism
  it('is deterministic — same inputs produce same outputs', () => {
    const run1 = runEngine(TORONTO_INPUT, TORONTO_BASELINE, 'cmhc:2025-10|ircc:2024-11')
    const run2 = runEngine(TORONTO_INPUT, TORONTO_BASELINE, 'cmhc:2025-10|ircc:2024-11')
    expect(run1).toEqual(run2)
  })

  // TC-3 — rent source is "cmhc" for Toronto
  it('upfrontBreakdown rent source is cmhc', () => {
    const deposit = output.upfrontBreakdown.find(i => i.key === 'housing-deposit')
    expect(deposit?.source).toBe('cmhc')
  })
})

// ─── Vancouver TC-2 scenario ─────────────────────────────────────────────────

describe('runEngine — Vancouver TC-2 scenario', () => {
  const VANCOUVER_BASELINE: CityBaseline = {
    cityName:           'Vancouver',
    province:           'BC',
    avgRentStudio:      1_550,
    avgRent1BR:         1_807,
    avgRent2BR:         2_400,
    monthlyTransitPass: 127,
    source:             'CMHC Rental Market Report, October 2025',
    effectiveDate:      '2025-10-01',
    dataVersion:        '2025-10',
    isFallback:         false,
  }

  const input: EngineInput = {
    ...TORONTO_INPUT,
    city:              'Vancouver',
    province:          'BC',
    pathway:           'study-permit',
    fees:              { applicationFee: 150, biometricsFee: 85, biometricsPaid: false },
    housingType:       '2br',
    liquidSavings:     5_000,
    monthlyObligations: 0,
    jobStatus:         'student',
    household:         { adults: 1, children: 0 },
  }

  const output = runEngine(input, VANCOUVER_BASELINE, 'cmhc:2025-10|ircc:2024-01')

  it('uses 6-month runway for student', () => {
    expect(output.runwayMonths).toBe(6)
  })

  it('produces a large savings gap on $5K savings', () => {
    expect(output.savingsGap).toBeGreaterThan(10_000)
  })
})

// ─── Fallback baseline ────────────────────────────────────────────────────────

describe('runEngine — fallback baseline', () => {
  const FALLBACK_BASELINE: CityBaseline = {
    cityName:           'Unknown City',
    province:           'CA',
    avgRentStudio:      1_300,
    avgRent1BR:         1_600,
    avgRent2BR:         1_900,
    monthlyTransitPass: 130,
    source:             'National average (fallback)',
    effectiveDate:      '2025-10-01',
    dataVersion:        'fallback',
    isFallback:         true,
  }

  const output = runEngine(
    { ...TORONTO_INPUT, city: 'Unknown City' },
    FALLBACK_BASELINE,
    'fallback',
  )

  it('sets baselineFallback=true', () => {
    expect(output.baselineFallback).toBe(true)
  })

  it('deposit source is national-average', () => {
    const deposit = output.upfrontBreakdown.find(i => i.key === 'housing-deposit')
    expect(deposit?.source).toBe('national-average')
  })
})
