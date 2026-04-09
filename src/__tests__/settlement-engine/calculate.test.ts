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
import { buildDefaultExpenses, type CustomExpense } from '@/lib/settlement-engine/defaults'

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
    applicationFee:  950,
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
  customExpenses:        buildDefaultExpenses(1),
  jobStatus:             'none',
}

// ─── computeUpfront ───────────────────────────────────────────────────────────

describe('computeUpfront', () => {
  const result = computeUpfront(TORONTO_INPUT, TORONTO_BASELINE)

  it('includes processing fee', () => {
    const item = result.breakdown.find(i => i.key === 'immigration-fee')
    expect(item?.cad).toBe(950)
    expect(item?.source).toBe('ircc')
    expect(item?.label).toBe('Processing fee')
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

  // U = 950 + 85 + 575 + 1500 + 3522 + 2000 = 8632
  it('total upfront equals sum of all items', () => {
    expect(result.total).toBe(950 + 85 + 575 + 1_500 + 1_761 * 2 + 2_000)
    expect(result.total).toBe(8_632)
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
    expect(item?.label).toBe('Public transit (TTC)')
  })

  it('includes utilities baseline', () => {
    expect(result.breakdown.find(i => i.key === 'utilities')?.cad).toBe(150)
    expect(result.breakdown.find(i => i.key === 'utilities')?.source).toBe('estimate')
  })

  it('includes phone/internet baseline', () => {
    expect(result.breakdown.find(i => i.key === 'phone')?.cad).toBe(80)
    expect(result.breakdown.find(i => i.key === 'phone')?.source).toBe('estimate')
  })

  it('includes groceries for single adult', () => {
    expect(result.breakdown.find(i => i.key === 'groceries')?.cad).toBe(400)
    expect(result.breakdown.find(i => i.key === 'groceries')?.source).toBe('estimate')
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
      { ...TORONTO_INPUT, household: { adults: 2, children: 1 }, customExpenses: buildDefaultExpenses(2), monthlyObligations: 0 },
      TORONTO_BASELINE,
    )
    expect(couple.breakdown.find(i => i.key === 'groceries')?.cad).toBe(800)
  })

  it('uses unchanged default expenses from customExpenses without double-counting', () => {
    const unchangedDefaults = buildDefaultExpenses(1)
    const monthly = computeMonthlyMin(
      { ...TORONTO_INPUT, customExpenses: unchangedDefaults, monthlyObligations: 0 },
      TORONTO_BASELINE,
    )

    expect(monthly.total).toBe(1_761 + 156 + 150 + 80 + 400)
  })

  it('uses modified utilities amount and source from user input', () => {
    const modifiedUtilities: CustomExpense[] = buildDefaultExpenses(1).map(expense =>
      expense.defaultKey === 'utilities'
        ? { ...expense, amount: '200', isModified: true }
        : expense,
    )

    const monthly = computeMonthlyMin(
      { ...TORONTO_INPUT, customExpenses: modifiedUtilities, monthlyObligations: 0 },
      TORONTO_BASELINE,
    )

    expect(monthly.breakdown.find(i => i.key === 'utilities')).toMatchObject({
      cad: 200,
      source: 'user-input',
    })
    expect(monthly.total).toBe(1_761 + 156 + 200 + 80 + 400)
  })

  it('falls back to groceries default when user deleted groceries row', () => {
    const withoutGroceries = buildDefaultExpenses(2)
      .filter(expense => expense.defaultKey !== 'groceries')

    const monthly = computeMonthlyMin(
      { ...TORONTO_INPUT, household: { adults: 2, children: 0 }, customExpenses: withoutGroceries, monthlyObligations: 0 },
      TORONTO_BASELINE,
    )

    expect(monthly.breakdown.find(i => i.key === 'groceries')).toMatchObject({
      cad: 800,
      source: 'estimate',
    })
  })

  it('falls back to all defaults when customExpenses is empty', () => {
    const monthly = computeMonthlyMin(
      { ...TORONTO_INPUT, customExpenses: [], monthlyObligations: 0 },
      TORONTO_BASELINE,
    )

    expect(monthly.total).toBe(1_761 + 156 + 150 + 80 + 400)
  })

  it('includes additional non-default custom expenses exactly once', () => {
    const withLanguageClasses: CustomExpense[] = [
      ...buildDefaultExpenses(1),
      { id: 'custom_language_classes', label: 'Language classes', amount: '200' },
    ]

    const monthly = computeMonthlyMin(
      { ...TORONTO_INPUT, customExpenses: withLanguageClasses, monthlyObligations: 0 },
      TORONTO_BASELINE,
    )

    expect(monthly.breakdown.find(i => i.key === 'custom-custom_language_classes')).toMatchObject({
      cad: 200,
      source: 'user-input',
    })
    expect(monthly.total).toBe(1_761 + 156 + 150 + 80 + 400 + 200)
  })

  it('uses grocery scaling of $400 per adult when unchanged', () => {
    const monthly = computeMonthlyMin(
      { ...TORONTO_INPUT, household: { adults: 3, children: 0 }, customExpenses: buildDefaultExpenses(3), monthlyObligations: 0 },
      TORONTO_BASELINE,
    )

    expect(monthly.breakdown.find(i => i.key === 'groceries')?.cad).toBe(1_200)
  })
})

// ─── computeSafe ─────────────────────────────────────────────────────────────

describe('computeSafe', () => {
  const upfront     = 8_632
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

  // S_safe = (8632 + 2847×6) × 1.10 = 25714 × 1.10 = 28285.4
  it('S_safe = (U + M_safe × runway) × (1 + buffer)', () => {
    const r = computeSafe(TORONTO_INPUT, upfront, monthlyMin, monthlyBreakdown)
    const expected = (upfront + monthlyMin * 6) * (1 + BUFFER_PERCENT)
    expect(r.safeSavingsTarget).toBeCloseTo(expected, 2)
    expect(r.safeSavingsTarget).toBeCloseTo(28_285.4, 1)
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

  it('produces upfront of $8,632', () => {
    expect(output.upfront).toBe(8_632)
  })

  it('produces monthlyMin of $2,847', () => {
    expect(output.monthlyMin).toBe(2_847)
  })

  it('S_safe ≈ $28,285', () => {
    expect(output.safeSavingsTarget).toBeCloseTo(28_285.4, 1)
  })

  it('savings gap ≈ $10,285 (18K savings)', () => {
    expect(output.savingsGap).toBeCloseTo(28_285.4 - 18_000, 1)
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

  it('uses the fallback public transit cost in monthly breakdown', () => {
    const transit = output.monthlyBreakdown.find(i => i.key === 'transit')
    expect(transit?.cad).toBe(130)
    expect(transit?.label).toBe('Public transit')
  })
})
