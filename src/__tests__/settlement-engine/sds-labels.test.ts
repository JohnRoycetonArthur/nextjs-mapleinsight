/**
 * US-2.5 — SDS Mandatory-vs-Optional Cost Labels
 *
 * Tests for:
 *   SDS-1  Checklist: sds-eligibility and sds-language present when isSDS=true
 *   SDS-2  Checklist: SDS items absent when isSDS=false
 *   SDS-3  Checklist: SDS items absent for non-study-permit pathways even if isSDS=true
 *   SDS-4  Checklist: SDS items appear in preArrival at priority 1
 *   SDS-5  Checklist: deduplication — SDS items appear exactly once
 *   SDS-6  Advisory: sdsEligibility subsection present when isSDS=true
 *   SDS-7  Advisory: sdsEligibility subsection absent when isSDS=false
 *   SDS-8  Advisory: sdsEligibility content references GIC as mandatory
 *   SDS-9  Advisory: sdsEligibility status is 'at-risk' (prompts consultant to verify)
 *   SDS-10 Advisory: refusalRisk includes SDS GIC factor when isSDS=true
 */

import { generateChecklist } from '@/lib/settlement-engine/checklist'
import type { Risk } from '@/lib/settlement-engine/risks'
import {
  STUDY_PERMIT_DEFAULTS,
} from '@/lib/settlement-engine/study-permit'
import { generateStudyPermitAdvisory as genAdvisory } from '@/lib/settlement-engine/consultant-advisory'
import type { EngineInput, EngineOutput } from '@/lib/settlement-engine/types'
import type { IRCCComplianceResult } from '@/lib/settlement-engine/study-permit'

// ─── Shared helpers ───────────────────────────────────────────────────────────

const NO_RISKS: Risk[] = []

function allKeys(checklist: ReturnType<typeof generateChecklist>): string[] {
  return [
    ...checklist.preArrival.items,
    ...checklist.preArrival.additionalSteps,
    ...checklist.firstWeek.items,
    ...checklist.firstWeek.additionalSteps,
    ...checklist.first30.items,
    ...checklist.first30.additionalSteps,
    ...checklist.first90.items,
    ...checklist.first90.additionalSteps,
  ].map(it => it.key)
}

function keysForPeriod(
  checklist: ReturnType<typeof generateChecklist>,
  period: keyof ReturnType<typeof generateChecklist>,
): string[] {
  return [
    ...checklist[period].items,
    ...checklist[period].additionalSteps,
  ].map(it => it.key)
}

// ─── Fixture inputs ───────────────────────────────────────────────────────────

const SP_ONTARIO_SDS = {
  pathway:  'study_permit',
  province: 'ON',
  city:     'toronto',
  gicStatus: 'planning',
  income:   0,
  savings:  50_000,
  isSDS:    true,
} as const

const SP_ONTARIO_NO_SDS = {
  pathway:  'study_permit',
  province: 'ON',
  city:     'toronto',
  gicStatus: 'planning',
  income:   0,
  savings:  50_000,
  isSDS:    false,
} as const

const EE_WITH_SDS_FLAG = {
  pathway:  'express_entry',
  province: 'ON',
  city:     'toronto',
  income:   5_000,
  savings:  20_000,
  isSDS:    true,   // isSDS=true but pathway is not study_permit — should have no effect
} as const

// ─── Advisory fixtures ────────────────────────────────────────────────────────

const BASE_ENGINE_INPUT: EngineInput = {
  city:     'Toronto',
  province: 'ON',
  pathway:  'study-permit',
  fees:     { applicationFee: 150, biometricsFee: 85, biometricsPaid: false },
  housingType:           '1br',
  furnishingLevel:       'basic',
  household:             { adults: 1, children: 0 },
  needsChildcare:        false,
  liquidSavings:         50_000,
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

const MOCK_OUTPUT: EngineOutput = {
  upfront:           65_000,
  monthlyMin:        2_200,
  monthlySafe:       2_500,
  safeSavingsTarget: 70_000,
  savingsGap:        0,
  runwayMonths:      6,
  bufferPercent:     10,
  engineVersion:     '0.0.0-test',
  dataVersion:       'test',
  upfrontBreakdown:  [],
  monthlyBreakdown:  [],
  baselineFallback:  false,
  irccFloor:         66_641,
  irccFloorApplied:  true,
}

const COMPLIANCE_COMPLIANT: IRCCComplianceResult = {
  required:       66_641,
  tuition:        41_746,
  livingExpenses: 22_895,
  transport:      2_000,
  isQuebec:       false,
  compliant:      true,
  shortfall:      0,
}

const COMPLIANCE_NONCOMPLIANT: IRCCComplianceResult = {
  ...COMPLIANCE_COMPLIANT,
  compliant: false,
  shortfall: 16_641,
}

function makeInput(isSDS: boolean, gicStatus = 'planning'): EngineInput {
  return {
    ...BASE_ENGINE_INPUT,
    studyPermit: {
      ...BASE_ENGINE_INPUT.studyPermit!,
      isSDS,
      gicStatus,
    },
  }
}

// ─── SDS-1: SDS items present when isSDS=true ────────────────────────────────

describe('SDS-1 — Checklist: SDS items present when isSDS=true', () => {
  const cl = generateChecklist(SP_ONTARIO_SDS, NO_RISKS)
  const all = allKeys(cl)

  test('sds-eligibility key present in checklist', () => {
    expect(all).toContain('sds-eligibility')
  })

  test('sds-language key present in checklist', () => {
    expect(all).toContain('sds-language')
  })
})

// ─── SDS-2: SDS items absent when isSDS=false ────────────────────────────────

describe('SDS-2 — Checklist: SDS items absent when isSDS=false', () => {
  const cl = generateChecklist(SP_ONTARIO_NO_SDS, NO_RISKS)
  const all = allKeys(cl)

  test('sds-eligibility key absent', () => {
    expect(all).not.toContain('sds-eligibility')
  })

  test('sds-language key absent', () => {
    expect(all).not.toContain('sds-language')
  })
})

// ─── SDS-3: SDS items absent for non-study-permit pathways ───────────────────

describe('SDS-3 — Checklist: isSDS=true on non-study-permit has no effect', () => {
  const cl = generateChecklist(EE_WITH_SDS_FLAG, NO_RISKS)
  const all = allKeys(cl)

  test('sds-eligibility absent for Express Entry', () => {
    expect(all).not.toContain('sds-eligibility')
  })

  test('sds-language absent for Express Entry', () => {
    expect(all).not.toContain('sds-language')
  })
})

// ─── SDS-4: SDS items appear in preArrival at priority 1 ─────────────────────

describe('SDS-4 — Checklist: SDS items in preArrival at priority 1', () => {
  const cl = generateChecklist(SP_ONTARIO_SDS, NO_RISKS)

  test('sds-eligibility is in preArrival period', () => {
    const preKeys = keysForPeriod(cl, 'preArrival')
    expect(preKeys).toContain('sds-eligibility')
  })

  test('sds-language is in preArrival period', () => {
    const preKeys = keysForPeriod(cl, 'preArrival')
    expect(preKeys).toContain('sds-language')
  })

  test('sds-eligibility has priority 1', () => {
    const all = [
      ...cl.preArrival.items,
      ...cl.preArrival.additionalSteps,
    ]
    const item = all.find(it => it.key === 'sds-eligibility')
    expect(item?.priority).toBe(1)
  })

  test('sds-language has priority 1', () => {
    const all = [
      ...cl.preArrival.items,
      ...cl.preArrival.additionalSteps,
    ]
    const item = all.find(it => it.key === 'sds-language')
    expect(item?.priority).toBe(1)
  })
})

// ─── SDS-5: Deduplication — SDS items appear exactly once ────────────────────

describe('SDS-5 — Checklist: SDS items appear exactly once (no duplicates)', () => {
  const cl = generateChecklist(SP_ONTARIO_SDS, NO_RISKS)
  const all = allKeys(cl)

  test('sds-eligibility appears exactly once', () => {
    expect(all.filter(k => k === 'sds-eligibility').length).toBe(1)
  })

  test('sds-language appears exactly once', () => {
    expect(all.filter(k => k === 'sds-language').length).toBe(1)
  })
})

// ─── SDS-6: Advisory sdsEligibility present when isSDS=true ─────────────────

describe('SDS-6 — Advisory: sdsEligibility subsection present when isSDS=true', () => {
  const advisory = genAdvisory(makeInput(true), MOCK_OUTPUT, COMPLIANCE_COMPLIANT, STUDY_PERMIT_DEFAULTS)

  test('sdsEligibility is defined', () => {
    expect(advisory.sdsEligibility).toBeDefined()
  })

  test('sdsEligibility has a title', () => {
    expect(advisory.sdsEligibility?.title).toBeTruthy()
  })
})

// ─── SDS-7: Advisory sdsEligibility absent when isSDS=false ─────────────────

describe('SDS-7 — Advisory: sdsEligibility absent when isSDS=false', () => {
  const advisory = genAdvisory(makeInput(false), MOCK_OUTPUT, COMPLIANCE_COMPLIANT, STUDY_PERMIT_DEFAULTS)

  test('sdsEligibility is undefined', () => {
    expect(advisory.sdsEligibility).toBeUndefined()
  })
})

// ─── SDS-8: Advisory sdsEligibility content references GIC as mandatory ──────

describe('SDS-8 — Advisory: sdsEligibility content mentions mandatory GIC', () => {
  const advisory = genAdvisory(makeInput(true), MOCK_OUTPUT, COMPLIANCE_COMPLIANT, STUDY_PERMIT_DEFAULTS)

  test('content mentions "mandatory"', () => {
    expect(advisory.sdsEligibility?.content.toLowerCase()).toContain('mandatory')
  })

  test('content mentions GIC', () => {
    expect(advisory.sdsEligibility?.content).toContain('GIC')
  })

  test('content mentions IELTS', () => {
    expect(advisory.sdsEligibility?.content).toContain('IELTS')
  })
})

// ─── SDS-9: Advisory sdsEligibility status is at-risk ────────────────────────

describe('SDS-9 — Advisory: sdsEligibility status is at-risk', () => {
  const advisory = genAdvisory(makeInput(true), MOCK_OUTPUT, COMPLIANCE_COMPLIANT, STUDY_PERMIT_DEFAULTS)

  test("status is 'at-risk' to prompt consultant verification", () => {
    expect(advisory.sdsEligibility?.status).toBe('at-risk')
  })
})

// ─── SDS-10: refusalRisk includes SDS GIC factor when isSDS=true ─────────────

describe('SDS-10 — Advisory: refusalRisk includes SDS factor when isSDS=true', () => {
  test('refusalRisk content mentions SDS when isSDS=true and GIC not purchased', () => {
    const advisory = genAdvisory(makeInput(true, 'not_purchasing'), MOCK_OUTPUT, COMPLIANCE_COMPLIANT, STUDY_PERMIT_DEFAULTS)
    expect(advisory.refusalRisk.content).toContain('SDS')
  })

  test('refusalRisk content does not mention SDS when isSDS=false', () => {
    const advisory = genAdvisory(makeInput(false), MOCK_OUTPUT, COMPLIANCE_COMPLIANT, STUDY_PERMIT_DEFAULTS)
    // When isSDS=false there should be no SDS refusal factor
    const hasSdsFactor = advisory.refusalRisk.content.includes('SDS applicant')
    expect(hasSdsFactor).toBe(false)
  })
})

// ─── SDS-11: advisory metric shows 20-day processing target ──────────────────

describe('SDS-11 — Advisory: sdsEligibility metric shows processing target', () => {
  const advisory = genAdvisory(makeInput(true), MOCK_OUTPUT, COMPLIANCE_COMPLIANT, STUDY_PERMIT_DEFAULTS)

  test('metric mentions 20-day target', () => {
    expect(advisory.sdsEligibility?.metric).toContain('20-day')
  })
})

// ─── SDS-12: STUDY_PERMIT_DEFAULTS has sdsEligibleCountries ─────────────────

describe('SDS-12 — STUDY_PERMIT_DEFAULTS includes sdsEligibleCountries list', () => {
  test('sdsEligibleCountries is a non-empty array', () => {
    expect(Array.isArray(STUDY_PERMIT_DEFAULTS.sdsEligibleCountries)).toBe(true)
    expect(STUDY_PERMIT_DEFAULTS.sdsEligibleCountries.length).toBeGreaterThan(0)
  })

  test('India is in the SDS eligible countries list', () => {
    expect(STUDY_PERMIT_DEFAULTS.sdsEligibleCountries).toContain('India')
  })

  test('Philippines is in the SDS eligible countries list', () => {
    expect(STUDY_PERMIT_DEFAULTS.sdsEligibleCountries).toContain('Philippines')
  })

  test('All entries are non-empty strings', () => {
    for (const country of STUDY_PERMIT_DEFAULTS.sdsEligibleCountries) {
      expect(typeof country).toBe('string')
      expect(country.length).toBeGreaterThan(0)
    }
  })
})
