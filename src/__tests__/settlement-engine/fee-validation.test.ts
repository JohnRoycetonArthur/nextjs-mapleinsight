/**
 * fee-validation.test.ts — US-1.3 Express Entry Fee Breakdown Validation
 *
 * AC coverage:
 *   FV-1: FSW single applicant — correct applicationFee, biometricsPerPerson
 *   FV-2: FSW family — biometrics capped at $170 for 2+ total persons
 *   FV-3: CEC schedule present with same fee amounts as FSW
 *   FV-4: Study permit — correct permit fee, biometrics cap, medical exam per person
 *   FV-5: computeUpfront carries sourceUrl on fee breakdown items
 *   FV-6: Study permit upfront carries sourceUrl on fee items
 *   FV-7: Work permit fee schedule uses correct $155 application fee
 *   FV-8: biometricsFamilyCap applies when children push total persons to 2+
 *   FV-9: feeScheduleFromSanityDoc hydrates from Sanity doc and falls back per-field
 *   FV-10: getFeeSchedule returns correct schedule for each pathway
 */

import {
  getFeeSchedule,
  computeBiometricsFee,
  feeScheduleFromSanityDoc,
  FSW_FEE_DEFAULTS,
  CEC_FEE_DEFAULTS,
  STUDY_PERMIT_FEE_DEFAULTS,
  WORK_PERMIT_FEE_DEFAULTS,
} from '@/lib/settlement-engine/fees'
import { computeUpfront } from '@/lib/settlement-engine/calculate'
import { computeStudyPermitUpfront, STUDY_PERMIT_DEFAULTS } from '@/lib/settlement-engine/study-permit'
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
  source:             'CMHC',
  effectiveDate:      '2025-10-01',
  dataVersion:        '2025-10',
  isFallback:         false,
}

const EE_INPUT_SINGLE: EngineInput = {
  city:     'Toronto',
  province: 'ON',
  pathway:  'express-entry-fsw',
  fees: {
    applicationFee:  FSW_FEE_DEFAULTS.applicationFee,
    biometricsFee:   FSW_FEE_DEFAULTS.biometricsPerPerson,
    biometricsPaid:  false,
  },
  housingType:           '1br',
  furnishingLevel:       'basic',
  household:             { adults: 1, children: 0 },
  needsChildcare:        false,
  liquidSavings:         20_000,
  monthlyObligations:    0,
  plansCar:              false,
  jobStatus:             'none',
}

const EE_INPUT_FAMILY: EngineInput = {
  ...EE_INPUT_SINGLE,
  fees: {
    applicationFee:  FSW_FEE_DEFAULTS.applicationFee,
    biometricsFee:   FSW_FEE_DEFAULTS.biometricsFamilyCap,
    biometricsPaid:  false,
  },
  household: { adults: 2, children: 1 },
}

// ─── FV-1: FSW single applicant fee schedule ──────────────────────────────────

describe('FV-1: FSW fee schedule — single applicant', () => {
  const schedule = getFeeSchedule('express-entry-fsw')

  it('applicationFee is $950 (processing only, not bundled with RPRF)', () => {
    expect(schedule.applicationFee).toBe(950)
  })

  it('biometricsPerPerson is $85', () => {
    expect(schedule.biometricsPerPerson).toBe(85)
  })

  it('biometricsFamilyCap is $170', () => {
    expect(schedule.biometricsFamilyCap).toBe(170)
  })

  it('is marked verified', () => {
    expect(schedule.verified).toBe(true)
  })

  it('has a non-empty sourceUrl', () => {
    expect(schedule.sourceUrl).toBeTruthy()
    expect(schedule.sourceUrl).toMatch(/^https:\/\//)
  })

  it('has feeLineItems with at least 3 entries', () => {
    expect(schedule.feeLineItems.length).toBeGreaterThanOrEqual(3)
  })

  it('every feeLineItem has a sourceUrl', () => {
    for (const item of schedule.feeLineItems) {
      expect(item.sourceUrl).toBeTruthy()
      expect(item.sourceUrl).toMatch(/^https:\/\//)
    }
  })
})

// ─── FV-2: Family biometrics cap ─────────────────────────────────────────────

describe('FV-2: family biometrics cap applies at 2+ total persons', () => {
  const schedule = getFeeSchedule('express-entry-fsw')

  it('single adult → $85', () => {
    expect(computeBiometricsFee(schedule, { adults: 1, children: 0 })).toBe(85)
  })

  it('2 adults → $170 (family cap)', () => {
    expect(computeBiometricsFee(schedule, { adults: 2, children: 0 })).toBe(170)
  })

  it('1 adult + 1 child → $170 (family cap)', () => {
    expect(computeBiometricsFee(schedule, { adults: 1, children: 1 })).toBe(170)
  })

  it('3 adults → still $170 (cap, not per-person)', () => {
    expect(computeBiometricsFee(schedule, { adults: 3, children: 0 })).toBe(170)
  })
})

// ─── FV-3: CEC fee schedule ───────────────────────────────────────────────────

describe('FV-3: CEC fee schedule', () => {
  const cec = getFeeSchedule('express-entry-cec')
  const fsw = getFeeSchedule('express-entry-fsw')

  it('applicationFee matches FSW ($950 processing fee)', () => {
    expect(cec.applicationFee).toBe(fsw.applicationFee)
    expect(cec.applicationFee).toBe(950)
  })

  it('biometricsPerPerson matches FSW ($85)', () => {
    expect(cec.biometricsPerPerson).toBe(fsw.biometricsPerPerson)
  })

  it('is marked verified', () => {
    expect(cec.verified).toBe(true)
  })

  it('pathway is express-entry-cec', () => {
    expect(cec.pathway).toBe('express-entry-cec')
  })
})

// ─── FV-4: Study permit fees ──────────────────────────────────────────────────

describe('FV-4: study permit fee schedule', () => {
  const sp = getFeeSchedule('study-permit')

  it('applicationFee is $150', () => {
    expect(sp.applicationFee).toBe(150)
  })

  it('biometricsPerPerson is $85', () => {
    expect(sp.biometricsPerPerson).toBe(85)
  })

  it('biometricsFamilyCap is $170', () => {
    expect(sp.biometricsFamilyCap).toBe(170)
  })

  it('medicalExamPerPerson is $250', () => {
    expect(sp.medicalExamPerPerson).toBe(250)
  })

  it('is marked verified', () => {
    expect(sp.verified).toBe(true)
  })
})

// ─── FV-5: computeUpfront carries sourceUrl on fee items ─────────────────────

describe('FV-5: computeUpfront propagates sourceUrl on fee breakdown items', () => {
  const schedule = getFeeSchedule('express-entry-fsw')
  const { breakdown } = computeUpfront(EE_INPUT_SINGLE, TORONTO_BASELINE, undefined, schedule)

  it('immigration-fee item has sourceUrl', () => {
    const item = breakdown.find(i => i.key === 'immigration-fee')
    expect(item?.sourceUrl).toBeTruthy()
    expect(item?.sourceUrl).toMatch(/^https:\/\//)
  })

  it('biometrics item has sourceUrl', () => {
    const item = breakdown.find(i => i.key === 'biometrics')
    expect(item?.sourceUrl).toBeTruthy()
    expect(item?.sourceUrl).toMatch(/^https:\/\//)
  })

  it('rprf item has sourceUrl', () => {
    const item = breakdown.find(i => i.key === 'rprf')
    expect(item?.sourceUrl).toBeTruthy()
  })

  it('non-fee items (travel, housing-deposit) have no sourceUrl', () => {
    const travel = breakdown.find(i => i.key === 'travel')
    // travel uses estimate, no per-line source URL from fee schedule
    expect(travel?.sourceUrl).toBeUndefined()
  })
})

// ─── FV-6: study permit upfront carries sourceUrl on fee items ────────────────

describe('FV-6: computeStudyPermitUpfront propagates sourceUrl on fee items', () => {
  const schedule = getFeeSchedule('study-permit')
  const input = {
    province:       'ON',
    housingType:    '1br' as const,
    furnishingLevel: 'basic' as const,
    household:      { adults: 1, children: 0 },
    studyPermit: {
      programLevel:      'undergraduate' as const,
      tuitionAmount:     41_746,
      gicStatus:         'planning' as const,
      gicAmount:         0,
      scholarshipAmount: 0,
      biometricsDone:    false,
      feesPaid:          false,
    },
  }
  const { breakdown } = computeStudyPermitUpfront(input, STUDY_PERMIT_DEFAULTS, TORONTO_BASELINE, schedule)

  it('permit-fee item has sourceUrl', () => {
    const item = breakdown.find(i => i.key === 'permit-fee')
    expect(item?.sourceUrl).toBeTruthy()
    expect(item?.sourceUrl).toMatch(/^https:\/\//)
  })

  it('biometrics item has sourceUrl', () => {
    const item = breakdown.find(i => i.key === 'biometrics')
    expect(item?.sourceUrl).toBeTruthy()
  })

  it('medical-exam item has sourceUrl', () => {
    const item = breakdown.find(i => i.key === 'medical-exam')
    expect(item?.sourceUrl).toBeTruthy()
  })

  it('medical exam total = $250 × 1 person', () => {
    const item = breakdown.find(i => i.key === 'medical-exam')
    expect(item?.cad).toBe(250)
  })

  it('family medical exam total = $250 × family size', () => {
    const familyInput = { ...input, household: { adults: 2, children: 1 } }
    const { breakdown: fb } = computeStudyPermitUpfront(familyInput, STUDY_PERMIT_DEFAULTS, TORONTO_BASELINE, schedule)
    const medical = fb.find(i => i.key === 'medical-exam')
    expect(medical?.cad).toBe(750) // 3 persons × $250
  })
})

// ─── FV-7: Work permit fee schedule ──────────────────────────────────────────

describe('FV-7: work permit fee schedule', () => {
  const wp = getFeeSchedule('work-permit')

  it('applicationFee is $155', () => {
    expect(wp.applicationFee).toBe(155)
  })

  it('is marked verified', () => {
    expect(wp.verified).toBe(true)
  })
})

// ─── FV-8: biometrics cap when 1 adult + 1 child ─────────────────────────────

describe('FV-8: children trigger biometrics family cap', () => {
  const schedule = getFeeSchedule('express-entry-fsw')

  it('1 adult + 0 children → $85 (per-person)', () => {
    expect(computeBiometricsFee(schedule, { adults: 1, children: 0 })).toBe(85)
  })

  it('1 adult + 1 child → $170 (cap applies)', () => {
    expect(computeBiometricsFee(schedule, { adults: 1, children: 1 })).toBe(170)
  })
})

// ─── FV-9: feeScheduleFromSanityDoc ──────────────────────────────────────────

describe('FV-9: feeScheduleFromSanityDoc hydrates from Sanity doc', () => {
  it('returns defaults when doc is null', () => {
    const result = feeScheduleFromSanityDoc(null, FSW_FEE_DEFAULTS)
    expect(result).toBe(FSW_FEE_DEFAULTS)
  })

  it('overrides applicationFee from doc', () => {
    const result = feeScheduleFromSanityDoc({ applicationFee: 999, biometricsFee: 85 }, FSW_FEE_DEFAULTS)
    expect(result.applicationFee).toBe(999)
  })

  it('overrides biometricsFamilyCapFee from doc', () => {
    const result = feeScheduleFromSanityDoc({ biometricsFamilyCapFee: 200 }, FSW_FEE_DEFAULTS)
    expect(result.biometricsFamilyCap).toBe(200)
  })

  it('verified defaults to false when doc has no verified field', () => {
    const result = feeScheduleFromSanityDoc({ applicationFee: 1_365 }, FSW_FEE_DEFAULTS)
    expect(result.verified).toBe(false)
  })

  it('uses doc feeLineItems when present and non-empty', () => {
    const items = [{ key: 'test', label: 'Test', amountCAD: 100, sourceUrl: 'https://example.com', effectiveDate: '2024-01-01' }]
    const result = feeScheduleFromSanityDoc({ feeLineItems: items }, FSW_FEE_DEFAULTS)
    expect(result.feeLineItems).toHaveLength(1)
    expect(result.feeLineItems[0].key).toBe('test')
  })

  it('falls back to default feeLineItems when doc.feeLineItems is empty', () => {
    const result = feeScheduleFromSanityDoc({ feeLineItems: [] }, FSW_FEE_DEFAULTS)
    expect(result.feeLineItems).toBe(FSW_FEE_DEFAULTS.feeLineItems)
  })
})

// ─── FV-10: getFeeSchedule routing ───────────────────────────────────────────

describe('FV-10: getFeeSchedule returns correct schedule per pathway', () => {
  it('express-entry-fsw → FSW_FEE_DEFAULTS', () => {
    expect(getFeeSchedule('express-entry-fsw')).toBe(FSW_FEE_DEFAULTS)
  })
  it('express-entry-cec → CEC_FEE_DEFAULTS', () => {
    expect(getFeeSchedule('express-entry-cec')).toBe(CEC_FEE_DEFAULTS)
  })
  it('study-permit → STUDY_PERMIT_FEE_DEFAULTS', () => {
    expect(getFeeSchedule('study-permit')).toBe(STUDY_PERMIT_FEE_DEFAULTS)
  })
  it('work-permit → WORK_PERMIT_FEE_DEFAULTS', () => {
    expect(getFeeSchedule('work-permit')).toBe(WORK_PERMIT_FEE_DEFAULTS)
  })
  it('unknown pathway → FSW_FEE_DEFAULTS (conservative fallback)', () => {
    expect(getFeeSchedule('unknown-pathway')).toBe(FSW_FEE_DEFAULTS)
  })
})

// ─── US-1.3 accuracy fix — immigration fees subtotal boundary pins ────────────
//
// Task 8: FSW single applicant immigration fees = $1,610
// Task 9: FSW couple (2 adults) immigration fees = $2,270
//           Note: engine charges applicationFee for the principal applicant only;
//           the per-adult RPRF is computed dynamically (RPRF_PER_ADULT × adults).
//           $950 (fee) + $1,150 (RPRF 2×$575) + $170 (bio cap) = $2,270.
// Task 10: CEC single = $1,610 (same as FSW; CEC exempt from proof-of-funds
//           floor but pays identical government processing and RPRF fees)

function immigrationFeesSubtotal(breakdown: { key: string; cad: number }[]): number {
  return breakdown
    .filter(i => ['immigration-fee', 'rprf', 'biometrics'].includes(i.key))
    .reduce((sum, i) => sum + i.cad, 0)
}

describe('US-1.3 fix — immigration fees subtotal boundary pins', () => {
  // Task 8: FSW single applicant → $950 + $575 + $85 = $1,610
  it('FSW single: processing $950 + RPRF $575 + biometrics $85 = $1,610', () => {
    const schedule = getFeeSchedule('express-entry-fsw')
    const input: EngineInput = {
      ...EE_INPUT_SINGLE,
      pathway:   'express-entry-fsw',
      fees:      { applicationFee: schedule.applicationFee, biometricsFee: schedule.biometricsPerPerson, biometricsPaid: false },
      household: { adults: 1, children: 0 },
    }
    const { breakdown } = computeUpfront(input, TORONTO_BASELINE, undefined, schedule)
    expect(immigrationFeesSubtotal(breakdown)).toBe(1_610)
  })

  // Task 9: FSW couple (2 adults) → $950 + $1,150 + $170 = $2,270
  it('FSW couple (2 adults): processing $950 + RPRF $1,150 + biometrics $170 = $2,270', () => {
    const schedule = getFeeSchedule('express-entry-fsw')
    const input: EngineInput = {
      ...EE_INPUT_SINGLE,
      pathway:   'express-entry-fsw',
      fees:      { applicationFee: schedule.applicationFee, biometricsFee: schedule.biometricsFamilyCap, biometricsPaid: false },
      household: { adults: 2, children: 0 },
    }
    const { breakdown } = computeUpfront(input, TORONTO_BASELINE, undefined, schedule)
    expect(immigrationFeesSubtotal(breakdown)).toBe(2_270)
  })

  // Task 10: CEC single → $950 + $575 + $85 = $1,610 (same as FSW; CEC is exempt
  //   from proof-of-funds compliance floor, NOT from application fees or RPRF)
  it('CEC single: same immigration fees as FSW single = $1,610', () => {
    const schedule = getFeeSchedule('express-entry-cec')
    const input: EngineInput = {
      ...EE_INPUT_SINGLE,
      pathway:   'express-entry-cec',
      fees:      { applicationFee: schedule.applicationFee, biometricsFee: schedule.biometricsPerPerson, biometricsPaid: false },
      household: { adults: 1, children: 0 },
    }
    const { breakdown } = computeUpfront(input, TORONTO_BASELINE, undefined, schedule)
    expect(immigrationFeesSubtotal(breakdown)).toBe(1_610)
  })

  it('no double-counting: processing-fee and RPRF are distinct breakdown keys', () => {
    const schedule = getFeeSchedule('express-entry-fsw')
    const input: EngineInput = {
      ...EE_INPUT_SINGLE,
      fees:      { applicationFee: schedule.applicationFee, biometricsFee: schedule.biometricsPerPerson, biometricsPaid: false },
      household: { adults: 1, children: 0 },
    }
    const { breakdown } = computeUpfront(input, TORONTO_BASELINE, undefined, schedule)
    const fee  = breakdown.find(i => i.key === 'immigration-fee')
    const rprf = breakdown.find(i => i.key === 'rprf')
    expect(fee).toBeDefined()
    expect(rprf).toBeDefined()
    // RPRF must not be embedded inside the processing fee
    expect(fee!.cad).toBe(950)
    expect(rprf!.cad).toBe(575)
  })
})
