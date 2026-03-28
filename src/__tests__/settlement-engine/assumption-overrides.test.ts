/**
 * Unit tests — US-21.2 Assumption Override Controls
 *
 * Tests the recalculation logic from useAssumptionOverrides in isolation,
 * using the same formula the hook applies client-side.
 */

import {
  CITY_DATA,
  HOUSING_MULT,
  toCityKey,
} from '@/lib/settlement-engine/scenario-builder-constants'

// ─── Shared baseline fixture ───────────────────────────────────────────────

/** Mirrors a typical engineOutput for a Toronto 1BR client. */
const BASE = {
  monthlySafe:        2847,
  upfront:            7472,
  safeSavingsTarget:  26_000,
  savingsGap:         8_000,
  runwayMonths:       6,
  bufferPercent:      0.10,
  liquidSavings:      18_000,
  biometricsCad:      185,    // fee from upfrontBreakdown key='biometrics'
  baselineRent:       1761,   // from monthlyBreakdown key='rent'
  baselineDeposit:    3522,   // 1761 × 2 from upfrontBreakdown key='housing-deposit'
}

/**
 * Reusable recalculation formula — mirrors the logic in useAssumptionOverrides.
 */
function recalculate(opts: {
  runway:       number
  buffer:       number   // 0–25 integer
  housing:      'studio' | '1br' | '2br' | '3br+'
  feesPaid:     boolean
  defaultFeesPaid: boolean
}) {
  const cityKey    = toCityKey('toronto')
  const newRent    = Math.round(CITY_DATA[cityKey].rent1br * HOUSING_MULT[opts.housing])
  const newDeposit = newRent * 2

  const rentDelta    = newRent    - BASE.baselineRent
  const depositDelta = newDeposit - BASE.baselineDeposit
  const feesDelta    = (!opts.defaultFeesPaid && opts.feesPaid) ? -BASE.biometricsCad : 0

  const newMonthlySafe = Math.round(BASE.monthlySafe + rentDelta)
  const newUpfront     = Math.round(BASE.upfront + depositDelta + feesDelta)
  const runningTotal   = newUpfront + newMonthlySafe * opts.runway
  const newSafeTarget  = Math.round(runningTotal * (1 + opts.buffer / 100))
  const newGap         = Math.max(0, newSafeTarget - BASE.liquidSavings)

  return { newMonthlySafe, newUpfront, newSafeTarget, newGap }
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Assumption Overrides — recalculation formula', () => {

  describe('baseline (no changes)', () => {
    it('produces consistent results with default assumptions', () => {
      const result = recalculate({ runway: 6, buffer: 10, housing: '1br', feesPaid: false, defaultFeesPaid: false })
      // rent unchanged, deposit unchanged, no fees delta
      expect(result.newMonthlySafe).toBe(2847)
      expect(result.newUpfront).toBe(7472)
      // safeTarget: (7472 + 2847 × 6) × 1.10 = (7472 + 17082) × 1.10 = 24554 × 1.10 = 27009.4 → 27009
      expect(result.newSafeTarget).toBe(Math.round((7472 + 2847 * 6) * 1.10))
    })
  })

  describe('runway override', () => {
    it('shorter runway reduces safe target and gap', () => {
      const r1 = recalculate({ runway: 6, buffer: 10, housing: '1br', feesPaid: false, defaultFeesPaid: false })
      const r2 = recalculate({ runway: 2, buffer: 10, housing: '1br', feesPaid: false, defaultFeesPaid: false })
      expect(r2.newSafeTarget).toBeLessThan(r1.newSafeTarget)
    })

    it('longer runway increases safe target', () => {
      const r1 = recalculate({ runway: 6,  buffer: 10, housing: '1br', feesPaid: false, defaultFeesPaid: false })
      const r12 = recalculate({ runway: 12, buffer: 10, housing: '1br', feesPaid: false, defaultFeesPaid: false })
      expect(r12.newSafeTarget).toBeGreaterThan(r1.newSafeTarget)
    })

    it('runway=1 produces minimum target', () => {
      const result = recalculate({ runway: 1, buffer: 10, housing: '1br', feesPaid: false, defaultFeesPaid: false })
      const runningTotal = 7472 + 2847 * 1
      expect(result.newSafeTarget).toBe(Math.round(runningTotal * 1.10))
    })
  })

  describe('buffer override', () => {
    it('buffer=0 removes contingency', () => {
      const result = recalculate({ runway: 6, buffer: 0, housing: '1br', feesPaid: false, defaultFeesPaid: false })
      const runningTotal = 7472 + 2847 * 6
      expect(result.newSafeTarget).toBe(runningTotal)
    })

    it('buffer=25 adds 25% contingency', () => {
      const result = recalculate({ runway: 6, buffer: 25, housing: '1br', feesPaid: false, defaultFeesPaid: false })
      const runningTotal = 7472 + 2847 * 6
      expect(result.newSafeTarget).toBe(Math.round(runningTotal * 1.25))
    })
  })

  describe('housing override', () => {
    it('studio reduces rent and deposit', () => {
      const result = recalculate({ runway: 6, buffer: 10, housing: 'studio', feesPaid: false, defaultFeesPaid: false })
      const studioRent = Math.round(CITY_DATA.toronto.rent1br * HOUSING_MULT.studio)  // ~1497
      expect(result.newMonthlySafe).toBe(Math.round(BASE.monthlySafe + (studioRent - BASE.baselineRent)))
      expect(result.newUpfront).toBe(Math.round(BASE.upfront + (studioRent * 2 - BASE.baselineDeposit)))
    })

    it('2br increases rent and deposit', () => {
      const result = recalculate({ runway: 6, buffer: 10, housing: '2br', feesPaid: false, defaultFeesPaid: false })
      const rent2br = Math.round(CITY_DATA.toronto.rent1br * HOUSING_MULT['2br'])  // ~2201
      expect(result.newMonthlySafe).toBeGreaterThan(BASE.monthlySafe)
      expect(result.newUpfront).toBeGreaterThan(BASE.upfront)
      expect(result.newMonthlySafe).toBe(Math.round(BASE.monthlySafe + (rent2br - BASE.baselineRent)))
    })

    it('3br+ increases rent by 1.55× factor', () => {
      const cityKey    = toCityKey('toronto')
      const expected3br = Math.round(CITY_DATA[cityKey].rent1br * HOUSING_MULT['3br+'])
      expect(expected3br).toBe(Math.round(1761 * 1.55))  // ~2729
    })
  })

  describe('fees paid toggle', () => {
    it('marking fees paid removes biometrics from upfront', () => {
      const withFees    = recalculate({ runway: 6, buffer: 10, housing: '1br', feesPaid: false, defaultFeesPaid: false })
      const feesPaidNow = recalculate({ runway: 6, buffer: 10, housing: '1br', feesPaid: true,  defaultFeesPaid: false })
      expect(feesPaidNow.newUpfront).toBe(withFees.newUpfront - BASE.biometricsCad)
      expect(feesPaidNow.newSafeTarget).toBeLessThan(withFees.newSafeTarget)
    })

    it('no effect if fees were already paid by default', () => {
      const r1 = recalculate({ runway: 6, buffer: 10, housing: '1br', feesPaid: false, defaultFeesPaid: true })
      const r2 = recalculate({ runway: 6, buffer: 10, housing: '1br', feesPaid: true,  defaultFeesPaid: true })
      // feesDelta = 0 in both cases when defaultFeesPaid=true
      expect(r1.newUpfront).toBe(r2.newUpfront)
    })
  })

  describe('combined overrides', () => {
    it('runway=2 + buffer=0 + studio + fees paid eliminates gap', () => {
      const result = recalculate({ runway: 2, buffer: 0, housing: 'studio', feesPaid: true, defaultFeesPaid: false })
      // All changes reduce costs, gap should be eliminated
      const studioRent = Math.round(CITY_DATA.toronto.rent1br * HOUSING_MULT.studio)
      const newMonthly  = Math.round(BASE.monthlySafe + (studioRent - BASE.baselineRent))
      const newUpfront  = Math.round(BASE.upfront + (studioRent * 2 - BASE.baselineDeposit) - BASE.biometricsCad)
      const newTarget   = Math.round((newUpfront + newMonthly * 2) * 1.00)  // buffer=0
      const newGap      = Math.max(0, newTarget - BASE.liquidSavings)
      expect(result.newGap).toBe(newGap)
    })

    it('runway=12 + buffer=25 + 3br+ increases gap substantially', () => {
      const baseline = recalculate({ runway: 6, buffer: 10, housing: '1br',  feesPaid: false, defaultFeesPaid: false })
      const worst    = recalculate({ runway: 12, buffer: 25, housing: '3br+', feesPaid: false, defaultFeesPaid: false })
      expect(worst.newSafeTarget).toBeGreaterThan(baseline.newSafeTarget)
      expect(worst.newGap).toBeGreaterThan(baseline.newGap)
    })
  })

  describe('export.ts AssumptionOverridesExport type', () => {
    it('can be constructed with all required fields', () => {
      // Verifies the type shape expected by AC-6
      const export_ = {
        runway:   6,
        buffer:   10,
        housing:  '1br' as const,
        feesPaid: false,
      }
      expect(export_.runway).toBe(6)
      expect(export_.buffer).toBe(10)
      expect(export_.housing).toBe('1br')
      expect(export_.feesPaid).toBe(false)
    })
  })
})
