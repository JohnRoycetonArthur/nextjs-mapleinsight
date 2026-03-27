/**
 * Unit tests — Study Permit Engine Module (E11)
 *
 * SP-1: Standard non-Quebec study permit (Ontario, family size 1, undergrad)
 * SP-2: Quebec study permit — Quebec thresholds apply
 * SP-3: GIC scenarios (planning / purchased / not-purchasing)
 * SP-4: Scholarship reduces savings gap
 * SP-5: Health insurance — ON (UHIP), BC (MSP + bridge), AB ($0)
 */

import {
  STUDY_PERMIT_DEFAULTS,
  buildIRCCComplianceResult,
  computeIRCCProofOfFunds,
  computeStudyPermitUpfront,
  fetchStudyPermitData,
  getHealthBridgeCost,
  getHealthInsuranceMonthlyCost,
  getPartTimeMonthlyIncome,
} from '@/lib/settlement-engine/study-permit'
import { computeGap, runEngine } from '@/lib/settlement-engine/calculate'
import type { CityBaseline } from '@/lib/settlement-engine/baselines'
import type { EngineInput } from '@/lib/settlement-engine/types'

// ─── Shared fixtures ──────────────────────────────────────────────────────────

const DATA = STUDY_PERMIT_DEFAULTS

const TORONTO_BASELINE: CityBaseline = {
  cityName:           'Toronto',
  province:           'ON',
  avgRentStudio:      1_450,
  avgRent1BR:         1_761,
  avgRent2BR:         2_100,
  monthlyTransitPass: 156,
  source:             'CMHC',
  effectiveDate:      '2025-10-01',
  dataVersion:        '2025-10',
  isFallback:         false,
}

const BASE_INPUT: EngineInput = {
  city:     'Toronto',
  province: 'ON',
  pathway:  'study-permit',
  fees:     { applicationFee: 150, biometricsFee: 85, biometricsPaid: false },
  housingType:           '1br',
  furnishingLevel:       'basic',
  household:             { adults: 1, children: 0 },
  needsChildcare:        false,
  liquidSavings:         30_000,
  monthlyObligations:    0,
  plansCar:              false,
  customMonthlyExpenses: 0,
  jobStatus:             'student',
  studyPermit: {
    programLevel:      'undergraduate',
    tuitionAmount:     41_746,
    gicStatus:         'planning',
    gicAmount:         0,
    scholarshipAmount: 0,
    biometricsDone:    false,
    feesPaid:          false,
  },
}

// ─── SP-1: Non-Quebec, family size 1, undergrad ───────────────────────────────

describe('SP-1: computeIRCCProofOfFunds — Ontario undergrad, family 1', () => {
  it('uses federal living table for ON', () => {
    const result = computeIRCCProofOfFunds(1, 41_746, 'ON', DATA)
    // tuition(41746) + living(22895) + transport(2000) = 66641
    expect(result).toBe(41_746 + 22_895 + 2_000)
    expect(result).toBe(66_641)
  })

  it('scales living expenses for family size 3', () => {
    const result = computeIRCCProofOfFunds(3, 41_746, 'ON', DATA)
    // living(35040) + tuition + transport
    expect(result).toBe(41_746 + 35_040 + 2_000)
  })

  it('uses additional member increment beyond family size 7', () => {
    const result = computeIRCCProofOfFunds(8, 20_000, 'ON', DATA)
    // living(60589 + 6170) + tuition + transport
    expect(result).toBe(20_000 + 60_589 + 6_170 + 2_000)
  })
})

describe('SP-1: buildIRCCComplianceResult — Ontario undergrad, family 1', () => {
  it('marks compliant when available funds >= required', () => {
    const r = buildIRCCComplianceResult(1, 41_746, 'ON', 70_000, DATA)
    expect(r.compliant).toBe(true)
    expect(r.shortfall).toBe(0)
  })

  it('marks non-compliant and computes shortfall', () => {
    const r = buildIRCCComplianceResult(1, 41_746, 'ON', 50_000, DATA)
    expect(r.compliant).toBe(false)
    expect(r.shortfall).toBe(66_641 - 50_000)
    expect(r.shortfall).toBe(16_641)
  })

  it('exposes individual components', () => {
    const r = buildIRCCComplianceResult(1, 41_746, 'ON', 70_000, DATA)
    expect(r.tuition).toBe(41_746)
    expect(r.livingExpenses).toBe(22_895)
    expect(r.transport).toBe(2_000)
    expect(r.isQuebec).toBe(false)
  })
})

// ─── SP-2: Quebec thresholds ──────────────────────────────────────────────────

describe('SP-2: Quebec proof-of-funds thresholds', () => {
  it('uses Quebec single adult rate for family size 1', () => {
    const result = computeIRCCProofOfFunds(1, 41_746, 'QC', DATA)
    // tuition + QC single adult(24617) + transport(2000)
    expect(result).toBe(41_746 + 24_617 + 2_000)
    expect(result).toBe(68_363)
  })

  it('adds per-additional-member for family size 2', () => {
    const result = computeIRCCProofOfFunds(2, 41_746, 'QC', DATA)
    // QC: singleAdult(24617) + 1 × perAdditional(6170)
    expect(result).toBe(41_746 + 24_617 + 6_170 + 2_000)
  })

  it('isQuebec flag is true in compliance result', () => {
    const r = buildIRCCComplianceResult(1, 41_746, 'QC', 70_000, DATA)
    expect(r.isQuebec).toBe(true)
  })

  it('Quebec required is higher than federal for same inputs', () => {
    const federal = computeIRCCProofOfFunds(1, 41_746, 'ON', DATA)
    const quebec  = computeIRCCProofOfFunds(1, 41_746, 'QC', DATA)
    expect(quebec).toBeGreaterThan(federal)
  })
})

// ─── SP-3: GIC scenarios ──────────────────────────────────────────────────────

describe('SP-3: GIC handling in computeStudyPermitUpfront', () => {
  const baseInput = {
    province:      'ON' as const,
    housingType:   '1br' as const,
    furnishingLevel: 'basic' as const,
    household:     { adults: 1, children: 0 },
    studyPermit: {
      programLevel:      'undergraduate' as const,
      tuitionAmount:     20_000,
      gicAmount:         0,
      scholarshipAmount: 0,
      biometricsDone:    false,
      feesPaid:          false,
    },
  }

  it('planning: includes GIC minimum and processing fee', () => {
    const result = computeStudyPermitUpfront(
      { ...baseInput, studyPermit: { ...baseInput.studyPermit, gicStatus: 'planning' } },
      DATA,
      TORONTO_BASELINE,
    )
    const gic    = result.breakdown.find(i => i.key === 'gic')
    const gicFee = result.breakdown.find(i => i.key === 'gic-fee')
    expect(gic?.cad).toBe(DATA.gicMinimum)       // 22895
    expect(gicFee?.cad).toBe(DATA.gicProcessingFee) // 200
  })

  it('purchased: no GIC line items added', () => {
    const result = computeStudyPermitUpfront(
      { ...baseInput, studyPermit: { ...baseInput.studyPermit, gicStatus: 'purchased' } },
      DATA,
      TORONTO_BASELINE,
    )
    expect(result.breakdown.find(i => i.key === 'gic')).toBeUndefined()
    expect(result.breakdown.find(i => i.key === 'gic-fee')).toBeUndefined()
  })

  it('not-purchasing: no GIC line items added', () => {
    const result = computeStudyPermitUpfront(
      { ...baseInput, studyPermit: { ...baseInput.studyPermit, gicStatus: 'not-purchasing' } },
      DATA,
      TORONTO_BASELINE,
    )
    expect(result.breakdown.find(i => i.key === 'gic')).toBeUndefined()
  })

  it('feesPaid=true: omits permit fee, biometrics, medical exam', () => {
    const result = computeStudyPermitUpfront(
      { ...baseInput, studyPermit: { ...baseInput.studyPermit, gicStatus: 'not-purchasing', feesPaid: true } },
      DATA,
      TORONTO_BASELINE,
    )
    expect(result.breakdown.find(i => i.key === 'permit-fee')).toBeUndefined()
    expect(result.breakdown.find(i => i.key === 'biometrics')).toBeUndefined()
    expect(result.breakdown.find(i => i.key === 'medical-exam')).toBeUndefined()
  })

  it('biometricsDone=true: omits biometrics but keeps permit fee', () => {
    const result = computeStudyPermitUpfront(
      { ...baseInput, studyPermit: { ...baseInput.studyPermit, gicStatus: 'not-purchasing', feesPaid: false, biometricsDone: true } },
      DATA,
      TORONTO_BASELINE,
    )
    expect(result.breakdown.find(i => i.key === 'permit-fee')).toBeDefined()
    expect(result.breakdown.find(i => i.key === 'biometrics')).toBeUndefined()
  })
})

// ─── SP-4: Scholarship reduces savings gap ────────────────────────────────────

describe('SP-4: Scholarship reduces savings gap', () => {
  it('computeGap subtracts scholarship from available funds', () => {
    const target = 66_641
    const savings = 30_000
    const scholarship = 10_000

    const gapWithout = computeGap(target, savings)
    const gapWith    = computeGap(target, savings, scholarship)

    expect(gapWith).toBe(gapWithout - scholarship)
    expect(gapWith).toBe(Math.max(0, target - savings - scholarship))
  })

  it('gap is 0 when savings + scholarship >= target', () => {
    expect(computeGap(50_000, 30_000, 25_000)).toBe(0)
  })

  it('runEngine uses scholarship for gap when pathway is study-permit', () => {
    const inputWithScholarship: EngineInput = {
      ...BASE_INPUT,
      studyPermit: { ...BASE_INPUT.studyPermit!, scholarshipAmount: 15_000 },
    }
    const inputNoScholarship: EngineInput = {
      ...BASE_INPUT,
      studyPermit: { ...BASE_INPUT.studyPermit!, scholarshipAmount: 0 },
    }

    const withScholarship = runEngine(inputWithScholarship, TORONTO_BASELINE, 'test', DATA)
    const noScholarship   = runEngine(inputNoScholarship,   TORONTO_BASELINE, 'test', DATA)

    // Scholarship should reduce gap by 15000
    expect(noScholarship.savingsGap - withScholarship.savingsGap).toBe(15_000)
  })

  it('gap is never negative regardless of large scholarship', () => {
    const bigScholarship: EngineInput = {
      ...BASE_INPUT,
      studyPermit: { ...BASE_INPUT.studyPermit!, scholarshipAmount: 999_999 },
    }
    const output = runEngine(bigScholarship, TORONTO_BASELINE, 'test', DATA)
    expect(output.savingsGap).toBe(0)
  })
})

// ─── SP-5: Health insurance by province ───────────────────────────────────────

describe('SP-5: Health insurance costs', () => {
  describe('Ontario (UHIP — no provincial coverage)', () => {
    it('monthly cost = annual $792 / 12 = $66', () => {
      expect(getHealthInsuranceMonthlyCost('ON', DATA)).toBe(66)
    })

    it('no bridge coverage needed', () => {
      expect(getHealthBridgeCost('ON', DATA)).toBe(0)
    })
  })

  describe('BC (MSP — provincial coverage after 3-month wait)', () => {
    it('monthly cost = $0 (provincial coverage)', () => {
      expect(getHealthInsuranceMonthlyCost('BC', DATA)).toBe(0)
    })

    it('bridge coverage required during wait = $900', () => {
      expect(getHealthBridgeCost('BC', DATA)).toBe(900)
    })

    it('bridge cost appears in computeStudyPermitUpfront for BC', () => {
      const result = computeStudyPermitUpfront(
        {
          province:        'BC',
          housingType:     '1br',
          furnishingLevel: 'basic',
          household:       { adults: 1, children: 0 },
          studyPermit: {
            programLevel:      'undergraduate',
            tuitionAmount:     20_000,
            gicStatus:         'not-purchasing',
            gicAmount:         0,
            scholarshipAmount: 0,
            biometricsDone:    false,
            feesPaid:          false,
          },
        },
        DATA,
        TORONTO_BASELINE,
      )
      const bridge = result.breakdown.find(i => i.key === 'health-bridge')
      expect(bridge?.cad).toBe(900)
      expect(bridge?.source).toBe('provincial')
    })
  })

  describe('Alberta (AHCIP — immediate provincial coverage)', () => {
    it('monthly cost = $0', () => {
      expect(getHealthInsuranceMonthlyCost('AB', DATA)).toBe(0)
    })

    it('no bridge coverage needed', () => {
      expect(getHealthBridgeCost('AB', DATA)).toBe(0)
    })
  })

  describe('unknown province — graceful fallback', () => {
    it('monthly cost = $0', () => {
      expect(getHealthInsuranceMonthlyCost('YT', DATA)).toBe(0)
    })

    it('bridge cost = $0', () => {
      expect(getHealthBridgeCost('YT', DATA)).toBe(0)
    })
  })
})

// ─── fetchStudyPermitData ─────────────────────────────────────────────────────

describe('fetchStudyPermitData', () => {
  it('returns STUDY_PERMIT_DEFAULTS when doc is null', () => {
    expect(fetchStudyPermitData(null)).toBe(STUDY_PERMIT_DEFAULTS)
  })

  it('returns STUDY_PERMIT_DEFAULTS when doc has no studyPermitData', () => {
    expect(fetchStudyPermitData({})).toBe(STUDY_PERMIT_DEFAULTS)
  })

  it('extracts gicMinimum from doc', () => {
    const doc = { studyPermitData: { gicMinimum: 25_000 } }
    const result = fetchStudyPermitData(doc)
    expect(result.gicMinimum).toBe(25_000)
  })

  it('falls back to defaults for missing subfields', () => {
    const doc = { studyPermitData: { gicMinimum: 25_000 } }
    const result = fetchStudyPermitData(doc)
    // proofOfFundsLiving was not in doc, should fallback
    expect(result.proofOfFundsLiving).toBe(STUDY_PERMIT_DEFAULTS.proofOfFundsLiving)
  })
})

// ─── getPartTimeMonthlyIncome ─────────────────────────────────────────────────

describe('getPartTimeMonthlyIncome', () => {
  it('computes correctly for Ontario at 24 hrs/week', () => {
    // ON min wage $17.20 × 24 hrs × 4.33 = 1787.136
    const income = getPartTimeMonthlyIncome('ON', 24, DATA)
    expect(income).toBeCloseTo(17.20 * 24 * 4.33, 1)
  })

  it('falls back to estimatedHourlyRateLow for unknown province', () => {
    const income = getPartTimeMonthlyIncome('YT', 24, DATA)
    expect(income).toBeCloseTo(DATA.studentWorkRights.estimatedHourlyRateLow * 24 * 4.33, 1)
  })
})

// ─── runEngine IRCC floor integration ────────────────────────────────────────

describe('runEngine — IRCC floor applies when required > standard target', () => {
  it('irccFloor is set on study permit output', () => {
    const output = runEngine(BASE_INPUT, TORONTO_BASELINE, 'test', DATA)
    expect(output.irccFloor).toBeDefined()
    expect(output.irccFloor).toBeGreaterThan(0)
  })

  it('safeSavingsTarget >= irccFloor when floor was applied', () => {
    const output = runEngine(BASE_INPUT, TORONTO_BASELINE, 'test', DATA)
    if (output.irccFloorApplied) {
      expect(output.safeSavingsTarget).toBe(output.irccFloor)
    }
  })

  it('irccFloor is not set on non-study-permit pathways', () => {
    const fsw: EngineInput = {
      ...BASE_INPUT,
      pathway:     'express-entry-fsw',
      studyPermit: undefined,
      fees:        { applicationFee: 1_365, biometricsFee: 85, biometricsPaid: false },
    }
    const output = runEngine(fsw, TORONTO_BASELINE, 'test', DATA)
    expect(output.irccFloor).toBeUndefined()
    expect(output.irccFloorApplied).toBeUndefined()
  })
})
