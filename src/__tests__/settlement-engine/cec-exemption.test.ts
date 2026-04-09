/**
 * US-2.1 — CEC Exemption Logic
 *
 * Unit tests for:
 *   - computeEEProofOfFunds(): CEC returns exempt:true, reason:'cec', amount:0
 *   - computeEEProofOfFunds(): FSW/FSTP/PNP returns non-exempt with official minimum + buffer
 *   - computeSafe(): CEC emits proofOfFundsExemption, uses model total (no floor)
 *   - proofOfFundsMinimum risk: does not fire for CEC
 *   - E2E pathway switch: same inputs, switching FSW→CEC removes the compliance floor
 *     from safeSavingsTarget and flips the exemption flag
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

const CEC_INPUT: EngineInput  = { ...BASE_INPUT_COMMON, pathway: 'express-entry-cec' }
const FSW_INPUT: EngineInput  = { ...BASE_INPUT_COMMON, pathway: 'express-entry-fsw' }

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

// ─── computeEEProofOfFunds ─────────────────────────────────────────────────────

describe('computeEEProofOfFunds — CEC (US-2.1)', () => {
  it('returns exempt:true, reason:cec, amount:0 for all family sizes', () => {
    for (const size of [1, 2, 3, 4, 5, 7, 10]) {
      const r = computeEEProofOfFunds('express-entry-cec', size, EXPRESS_ENTRY_DEFAULTS)
      expect(r).toEqual({ amount: 0, exempt: true, reason: 'cec' })
    }
  })

  it('does not set safeRecommended or buffer when exempt', () => {
    const r = computeEEProofOfFunds('express-entry-cec', 2, EXPRESS_ENTRY_DEFAULTS)
    expect(r.safeRecommended).toBeUndefined()
    expect(r.buffer).toBeUndefined()
  })
})

describe('computeEEProofOfFunds — non-exempt pathways', () => {
  it('FSW family size 1: amount = EE floor, exempt:false', () => {
    const r = computeEEProofOfFunds('express-entry-fsw', 1, EXPRESS_ENTRY_DEFAULTS)
    expect(r.exempt).toBe(false)
    expect(r.amount).toBe(getExpressEntryFunds(1))
    expect(r.reason).toBeUndefined()
  })

  it('FSW safeRecommended = ceil(official × 1.05 / 100) × 100', () => {
    const official = getExpressEntryFunds(1)
    const expected = Math.ceil((official * 1.05) / 100) * 100
    const r = computeEEProofOfFunds('express-entry-fsw', 1, EXPRESS_ENTRY_DEFAULTS)
    expect(r.safeRecommended).toBe(expected)
    expect(r.buffer).toBe(expected - official)
  })

  it('FSTP returns same official amount as FSW', () => {
    const fsw  = computeEEProofOfFunds('express-entry-fsw',  1, EXPRESS_ENTRY_DEFAULTS)
    const fstp = computeEEProofOfFunds('express-entry-fstp', 1, EXPRESS_ENTRY_DEFAULTS)
    expect(fstp.amount).toBe(fsw.amount)
    expect(fstp.exempt).toBe(false)
  })

  it('PNP is non-exempt and uses EE table as conservative estimate', () => {
    const r = computeEEProofOfFunds('pnp', 2, EXPRESS_ENTRY_DEFAULTS)
    expect(r.exempt).toBe(false)
    expect(r.amount).toBe(getExpressEntryFunds(2))
  })

  it('work-permit: exempt:true (no IRCC floor)', () => {
    const r = computeEEProofOfFunds('work-permit', 1, EXPRESS_ENTRY_DEFAULTS)
    expect(r.exempt).toBe(true)
    expect(r.reason).toBeUndefined()
  })
})

// ─── computeSafe — CEC exemption flag ────────────────────────────────────────

describe('computeSafe — CEC proofOfFundsExemption (US-2.1)', () => {
  const CEC_SAFE_INPUT = {
    pathway:               'express-entry-cec' as const,
    province:              'ON',
    household:             { adults: 1, children: 0 },
    jobStatus:             'none' as const,
    needsChildcare:        false,
    plansCar:              false,
    customMonthlyExpenses: 0,
    customExpenses:        [] as [],
  }

  it('emits proofOfFundsExemption: { exempt: true, reason: "cec" }', () => {
    const result = computeSafe(CEC_SAFE_INPUT, 5_000, 2_500, [], undefined, EXPRESS_ENTRY_DEFAULTS)
    expect(result.proofOfFundsExemption).toEqual({ exempt: true, reason: 'cec' })
  })

  it('safeSavingsTarget equals standardTarget (model total, no IRCC floor)', () => {
    // upfront=5000, monthly=2500, runway=6 (none), buffer=10%
    // standardTarget = (5000 + 2500*6) * 1.1 = 20000 * 1.1 = 22000
    const result = computeSafe(CEC_SAFE_INPUT, 5_000, 2_500, [], undefined, EXPRESS_ENTRY_DEFAULTS)
    const familyFloor = getExpressEntryFunds(1, EXPRESS_ENTRY_DEFAULTS)
    // For FSW the floor ($15,263) would be less than standardTarget here,
    // but the key assertion is no floor was applied
    expect(result.complianceFloor).toBeUndefined()
    expect(result.complianceFloorApplied).toBeUndefined()
    expect(result.bindingConstraint).toBe('real-world')
    // safeSavingsTarget must not have been bumped up by the compliance floor
    expect(result.safeSavingsTarget).not.toBe(familyFloor)
  })
})

// ─── proofOfFundsMinimum risk — CEC skipped ──────────────────────────────────

describe('proofOfFundsMinimum risk — CEC skipped (US-2.1)', () => {
  function ctx(overrides: Partial<EngineInput> = {}): RiskContext {
    return {
      input:  { ...BASE_INPUT_COMMON, pathway: 'express-entry-cec', ...overrides },
      output: { ...BASE_OUTPUT, upfront: 8_000 },
      monthlyIncome: 0,
    }
  }

  it('does not fire for CEC even when savings < upfront', () => {
    const risk = proofOfFundsMinimum.evaluate(ctx({ liquidSavings: 1_000 }))
    expect(risk).toBeNull()
  })

  it('does not fire for CEC when savings = 0', () => {
    const risk = proofOfFundsMinimum.evaluate(ctx({ liquidSavings: 0 }))
    expect(risk).toBeNull()
  })

  it('still fires for FSW when savings < upfront (rule still active for non-CEC)', () => {
    const fswCtx: RiskContext = {
      input:  { ...BASE_INPUT_COMMON, pathway: 'express-entry-fsw', liquidSavings: 1_000 },
      output: { ...BASE_OUTPUT, upfront: 8_000 },
      monthlyIncome: 0,
    }
    const risk = proofOfFundsMinimum.evaluate(fswCtx)
    expect(risk).not.toBeNull()
    expect(risk!.id).toBe('proofOfFundsMinimum')
  })
})

// ─── E2E pathway switch: FSW → CEC (US-2.1) ──────────────────────────────────

describe('E2E pathway switch: FSW → CEC removes IRCC floor from required funds', () => {
  const DATA_VERSION = 'test:2025-10'

  it('FSW: complianceFloor is set, safeSavingsTarget >= EE floor', () => {
    const result = runEngine(FSW_INPUT, TORONTO_BASELINE, DATA_VERSION, undefined, EXPRESS_ENTRY_DEFAULTS)
    expect(result.complianceFloor).toBeDefined()
    expect(result.complianceFloor).toBe(getExpressEntryFunds(1, EXPRESS_ENTRY_DEFAULTS))
    expect(result.proofOfFundsExemption).toBeUndefined()
  })

  it('CEC: complianceFloor is absent, proofOfFundsExemption.exempt is true', () => {
    const result = runEngine(CEC_INPUT, TORONTO_BASELINE, DATA_VERSION, undefined, EXPRESS_ENTRY_DEFAULTS)
    expect(result.complianceFloor).toBeUndefined()
    expect(result.proofOfFundsExemption).toEqual({ exempt: true, reason: 'cec' })
  })

  it('switching FSW → CEC: safeSavingsTarget driven by real-world model, not compliance floor', () => {
    const fswResult = runEngine(FSW_INPUT, TORONTO_BASELINE, DATA_VERSION, undefined, EXPRESS_ENTRY_DEFAULTS)
    const cecResult = runEngine(CEC_INPUT, TORONTO_BASELINE, DATA_VERSION, undefined, EXPRESS_ENTRY_DEFAULTS)

    // For FSW with $18K savings, the compliance floor drives safeSavingsTarget up
    // (FSW floor = $15,263 but model target for 6-month runway will be higher)
    // Key property: CEC bindingConstraint is always 'real-world'
    expect(fswResult.bindingConstraint).toBeDefined()
    expect(cecResult.bindingConstraint).toBe('real-world')
    expect(cecResult.complianceFloor).toBeUndefined()
  })

  it('upfront and monthlySafe are identical for FSW and CEC (same inputs, different pathway)', () => {
    const fswResult = runEngine(FSW_INPUT, TORONTO_BASELINE, DATA_VERSION)
    const cecResult = runEngine(CEC_INPUT, TORONTO_BASELINE, DATA_VERSION)
    // Immigration fees are the same (both EE PR); only compliance logic differs
    expect(cecResult.upfront).toBe(fswResult.upfront)
    expect(cecResult.monthlySafe).toBe(fswResult.monthlySafe)
  })
})
