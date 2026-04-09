/**
 * US-2.2 — Valid Job Offer Exemption Logic
 *
 * Unit tests for:
 *   - computeEEProofOfFunds(): FSW + jobOfferExempt returns exempt:true, reason:'job_offer'
 *   - computeEEProofOfFunds(): FSTP + jobOfferExempt returns exempt:true, reason:'job_offer'
 *   - computeEEProofOfFunds(): FSW without jobOfferExempt returns non-exempt (floor applies)
 *   - computeEEProofOfFunds(): PNP with jobOfferExempt is NOT exempt (exemption is FSW/FSTP only)
 *   - computeSafe(): FSW + jobOfferExempt emits proofOfFundsExemption reason:'job_offer', no floor
 *   - computeSafe(): FSW without jobOfferExempt applies compliance floor normally
 *   - proofOfFundsMinimum risk: does not fire for FSW when jobOfferExempt
 *   - proofOfFundsMinimum risk: still fires for FSW when NOT exempt and savings < upfront
 *   - E2E pathway switch: FSW + jobOfferExempt removes compliance floor from safeSavingsTarget
 *   - Restore behavior: clearing jobOfferExempt restores the compliance floor
 */

import {
  EXPRESS_ENTRY_DEFAULTS,
  computeEEProofOfFunds,
  getExpressEntryFunds,
} from '@/lib/settlement-engine/compliance'
import { computeSafe, runEngine } from '@/lib/settlement-engine/calculate'
import { proofOfFundsMinimum } from '@/lib/settlement-engine/risks'
import type { RiskContext } from '@/lib/settlement-engine/risks'
import type { CityBaseline } from '@/lib/settlement-engine/baselines'
import type { EngineInput, EngineOutput } from '@/lib/settlement-engine/types'

// ─── Shared fixtures ──────────────────────────────────────────────────────────

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

const BASE_INPUT_COMMON = {
  city:                  'toronto',
  province:              'ON',
  fees:                  { applicationFee: 950, biometricsFee: 85, biometricsPaid: false },
  housingType:           '1br' as const,
  furnishingLevel:       'basic' as const,
  household:             { adults: 1, children: 0 },
  needsChildcare:        false,
  liquidSavings:         18_000,
  monthlyObligations:    300,
  plansCar:              false,
  customExpenses:        [],
  customMonthlyExpenses: 0,
  jobStatus:             'none' as const,
}

const FSW_INPUT: EngineInput        = { ...BASE_INPUT_COMMON, pathway: 'express-entry-fsw' }
const FSW_EXEMPT_INPUT: EngineInput = { ...BASE_INPUT_COMMON, pathway: 'express-entry-fsw', jobOfferExempt: true }
const FSTP_EXEMPT_INPUT: EngineInput = { ...BASE_INPUT_COMMON, pathway: 'express-entry-fstp', jobOfferExempt: true }

const BASE_OUTPUT: EngineOutput = {
  upfront:           8_000,
  monthlyMin:        2_500,
  monthlySafe:       3_000,
  safeSavingsTarget: 20_000,
  savingsGap:        0,
  runwayMonths:      6,
  bufferPercent:     10,
  engineVersion:     '1.1.0',
  dataVersion:       '2025-10',
  upfrontBreakdown:  [],
  monthlyBreakdown:  [],
  baselineFallback:  false,
}

// ─── computeEEProofOfFunds — job offer exemption ──────────────────────────────

describe('computeEEProofOfFunds — FSW job offer exempt (US-2.2)', () => {
  it('returns exempt:true, reason:job_offer, amount:0 for FSW when jobOfferExempt', () => {
    const r = computeEEProofOfFunds('express-entry-fsw', 1, EXPRESS_ENTRY_DEFAULTS, true)
    expect(r).toEqual({ amount: 0, exempt: true, reason: 'job_offer' })
  })

  it('returns exempt:true, reason:job_offer, amount:0 for FSTP when jobOfferExempt', () => {
    const r = computeEEProofOfFunds('express-entry-fstp', 2, EXPRESS_ENTRY_DEFAULTS, true)
    expect(r).toEqual({ amount: 0, exempt: true, reason: 'job_offer' })
  })

  it('does not set safeRecommended or buffer when exempt via job offer', () => {
    const r = computeEEProofOfFunds('express-entry-fsw', 2, EXPRESS_ENTRY_DEFAULTS, true)
    expect(r.safeRecommended).toBeUndefined()
    expect(r.buffer).toBeUndefined()
  })
})

describe('computeEEProofOfFunds — FSW without job offer exempt', () => {
  it('FSW without jobOfferExempt remains non-exempt', () => {
    const r = computeEEProofOfFunds('express-entry-fsw', 1, EXPRESS_ENTRY_DEFAULTS, false)
    expect(r.exempt).toBe(false)
    expect(r.amount).toBe(getExpressEntryFunds(1))
  })

  it('FSW without jobOfferExempt (undefined) remains non-exempt', () => {
    const r = computeEEProofOfFunds('express-entry-fsw', 1, EXPRESS_ENTRY_DEFAULTS)
    expect(r.exempt).toBe(false)
  })
})

describe('computeEEProofOfFunds — PNP job offer exemption does NOT apply', () => {
  it('PNP with jobOfferExempt is still non-exempt (exemption is FSW/FSTP only)', () => {
    const r = computeEEProofOfFunds('pnp', 2, EXPRESS_ENTRY_DEFAULTS, true)
    expect(r.exempt).toBe(false)
    expect(r.amount).toBe(getExpressEntryFunds(2))
  })
})

// ─── computeSafe — FSW job offer exemption flag ───────────────────────────────

describe('computeSafe — FSW job offer exemption (US-2.2)', () => {
  const SAFE_INPUT_BASE = {
    province:              'ON',
    household:             { adults: 1, children: 0 },
    jobStatus:             'none' as const,
    needsChildcare:        false,
    plansCar:              false,
    customMonthlyExpenses: 0,
    customExpenses:        [] as [],
  }

  it('emits proofOfFundsExemption: { exempt: true, reason: "job_offer" } for FSW + jobOfferExempt', () => {
    const result = computeSafe(
      { ...SAFE_INPUT_BASE, pathway: 'express-entry-fsw', jobOfferExempt: true },
      5_000, 2_500, [], undefined, EXPRESS_ENTRY_DEFAULTS,
    )
    expect(result.proofOfFundsExemption).toEqual({ exempt: true, reason: 'job_offer' })
  })

  it('safeSavingsTarget equals standardTarget (model total, no IRCC floor) for FSW + jobOfferExempt', () => {
    const result = computeSafe(
      { ...SAFE_INPUT_BASE, pathway: 'express-entry-fsw', jobOfferExempt: true },
      5_000, 2_500, [], undefined, EXPRESS_ENTRY_DEFAULTS,
    )
    expect(result.complianceFloor).toBeUndefined()
    expect(result.complianceFloorApplied).toBeUndefined()
    expect(result.bindingConstraint).toBe('real-world')
  })

  it('FSW WITHOUT jobOfferExempt: complianceFloor is set', () => {
    const result = computeSafe(
      { ...SAFE_INPUT_BASE, pathway: 'express-entry-fsw', jobOfferExempt: false },
      5_000, 2_500, [], undefined, EXPRESS_ENTRY_DEFAULTS,
    )
    expect(result.proofOfFundsExemption).toBeUndefined()
    expect(result.complianceFloor).toBeDefined()
    expect(result.complianceFloor).toBe(getExpressEntryFunds(1, EXPRESS_ENTRY_DEFAULTS))
  })

  it('FSTP + jobOfferExempt: emits job_offer reason', () => {
    const result = computeSafe(
      { ...SAFE_INPUT_BASE, pathway: 'express-entry-fstp', jobOfferExempt: true },
      5_000, 2_500, [], undefined, EXPRESS_ENTRY_DEFAULTS,
    )
    expect(result.proofOfFundsExemption).toEqual({ exempt: true, reason: 'job_offer' })
    expect(result.complianceFloor).toBeUndefined()
  })
})

// ─── proofOfFundsMinimum risk — FSW job offer exempt skipped ──────────────────

describe('proofOfFundsMinimum risk — FSW job offer exempt skipped (US-2.2)', () => {
  function ctx(overrides: Partial<EngineInput> = {}): RiskContext {
    return {
      input:  { ...BASE_INPUT_COMMON, pathway: 'express-entry-fsw', ...overrides },
      output: { ...BASE_OUTPUT, upfront: 8_000 },
      monthlyIncome: 0,
    }
  }

  it('does not fire for FSW + jobOfferExempt even when savings < upfront', () => {
    const risk = proofOfFundsMinimum.evaluate(ctx({ liquidSavings: 1_000, jobOfferExempt: true }))
    expect(risk).toBeNull()
  })

  it('does not fire for FSTP + jobOfferExempt when savings < upfront', () => {
    const risk = proofOfFundsMinimum.evaluate({
      input:  { ...BASE_INPUT_COMMON, pathway: 'express-entry-fstp', liquidSavings: 1_000, jobOfferExempt: true },
      output: { ...BASE_OUTPUT, upfront: 8_000 },
      monthlyIncome: 0,
    })
    expect(risk).toBeNull()
  })

  it('still fires for FSW when NOT exempt and savings < upfront', () => {
    const risk = proofOfFundsMinimum.evaluate(ctx({ liquidSavings: 1_000, jobOfferExempt: false }))
    expect(risk).not.toBeNull()
    expect(risk!.id).toBe('proofOfFundsMinimum')
  })

  it('still fires for FSW without jobOfferExempt field when savings < upfront', () => {
    const risk = proofOfFundsMinimum.evaluate(ctx({ liquidSavings: 1_000 }))
    expect(risk).not.toBeNull()
  })
})

// ─── E2E: FSW + jobOfferExempt removes IRCC floor (US-2.2) ───────────────────

describe('E2E: FSW + jobOfferExempt removes IRCC floor from required funds', () => {
  const DATA_VERSION = 'test:2025-10'

  it('FSW without jobOfferExempt: complianceFloor is set, safeSavingsTarget >= EE floor', () => {
    const result = runEngine(FSW_INPUT, TORONTO_BASELINE, DATA_VERSION, undefined, EXPRESS_ENTRY_DEFAULTS)
    expect(result.complianceFloor).toBeDefined()
    expect(result.complianceFloor).toBe(getExpressEntryFunds(1, EXPRESS_ENTRY_DEFAULTS))
    expect(result.proofOfFundsExemption).toBeUndefined()
  })

  it('FSW + jobOfferExempt: complianceFloor is absent, proofOfFundsExemption.reason is job_offer', () => {
    const result = runEngine(FSW_EXEMPT_INPUT, TORONTO_BASELINE, DATA_VERSION, undefined, EXPRESS_ENTRY_DEFAULTS)
    expect(result.complianceFloor).toBeUndefined()
    expect(result.proofOfFundsExemption).toEqual({ exempt: true, reason: 'job_offer' })
    expect(result.bindingConstraint).toBe('real-world')
  })

  it('FSTP + jobOfferExempt: complianceFloor absent, reason job_offer', () => {
    const result = runEngine(FSTP_EXEMPT_INPUT, TORONTO_BASELINE, DATA_VERSION, undefined, EXPRESS_ENTRY_DEFAULTS)
    expect(result.complianceFloor).toBeUndefined()
    expect(result.proofOfFundsExemption).toEqual({ exempt: true, reason: 'job_offer' })
  })

  it('upfront and monthlySafe are identical with and without exemption (same inputs, only flag differs)', () => {
    const nonExempt = runEngine(FSW_INPUT,        TORONTO_BASELINE, DATA_VERSION)
    const exempt    = runEngine(FSW_EXEMPT_INPUT,  TORONTO_BASELINE, DATA_VERSION)
    expect(exempt.upfront).toBe(nonExempt.upfront)
    expect(exempt.monthlySafe).toBe(nonExempt.monthlySafe)
  })

  it('restore behavior: clearing jobOfferExempt (false) restores compliance floor', () => {
    const exemptResult = runEngine(FSW_EXEMPT_INPUT, TORONTO_BASELINE, DATA_VERSION, undefined, EXPRESS_ENTRY_DEFAULTS)
    const restored = runEngine(
      { ...FSW_EXEMPT_INPUT, jobOfferExempt: false },
      TORONTO_BASELINE, DATA_VERSION, undefined, EXPRESS_ENTRY_DEFAULTS,
    )
    expect(exemptResult.proofOfFundsExemption).toEqual({ exempt: true, reason: 'job_offer' })
    expect(restored.complianceFloor).toBeDefined()
    expect(restored.proofOfFundsExemption).toBeUndefined()
  })
})
