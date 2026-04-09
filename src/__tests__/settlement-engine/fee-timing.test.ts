/**
 * Unit tests — Fee Timing Split (US-20.4)
 *
 * AC-4: Engine returns items with a `timing` field.
 * Verifies correct timing assignment for:
 *   FT-1: Express Entry FSW — submission, pre-landing (RPRF), settlement
 *   FT-2: Study Permit — submission, pre-arrival-setup (GIC), settlement
 *   FT-3: RPRF amount is $515 × number of adults
 *   FT-4: Study permit items with GIC omitted when not-purchasing
 */

import { computeUpfront } from '@/lib/settlement-engine/calculate'
import { computeStudyPermitUpfront, STUDY_PERMIT_DEFAULTS } from '@/lib/settlement-engine/study-permit'
import { RPRF_PER_ADULT } from '@/lib/settlement-engine/constants'
import type { CityBaseline } from '@/lib/settlement-engine/baselines'
import type { EngineInput } from '@/lib/settlement-engine/types'

// ─── Shared fixtures ──────────────────────────────────────────────────────────

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

const EE_INPUT: EngineInput = {
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
  liquidSavings:         20_000,
  monthlyObligations:    0,
  plansCar:              false,
  customMonthlyExpenses: 0,
  jobStatus:             'none',
}

const SP_UPFRONT_INPUT = {
  province:       'ON',
  housingType:    '1br' as const,
  furnishingLevel:'basic' as const,
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

const DATA = STUDY_PERMIT_DEFAULTS

// ─── FT-1: Express Entry FSW timing ──────────────────────────────────────────

describe('FT-1: Express Entry FSW — timing assignment', () => {
  const { breakdown } = computeUpfront(EE_INPUT, TORONTO_BASELINE)

  it('immigration-fee is tagged submission', () => {
    const item = breakdown.find(i => i.key === 'immigration-fee')
    expect(item?.timing).toBe('submission')
  })

  it('biometrics is tagged submission', () => {
    const item = breakdown.find(i => i.key === 'biometrics')
    expect(item?.timing).toBe('submission')
  })

  it('rprf is tagged pre-landing', () => {
    const item = breakdown.find(i => i.key === 'rprf')
    expect(item?.timing).toBe('pre-landing')
  })

  it('travel is tagged settlement', () => {
    const item = breakdown.find(i => i.key === 'travel')
    expect(item?.timing).toBe('settlement')
  })

  it('housing-deposit is tagged settlement', () => {
    const item = breakdown.find(i => i.key === 'housing-deposit')
    expect(item?.timing).toBe('settlement')
  })

  it('setup-essentials is tagged settlement', () => {
    const item = breakdown.find(i => i.key === 'setup-essentials')
    expect(item?.timing).toBe('settlement')
  })

  it('all items have a timing field', () => {
    for (const item of breakdown) {
      expect(item.timing).toBeDefined()
    }
  })
})

// ─── FT-2: Study Permit — timing assignment ───────────────────────────────────

describe('FT-2: Study Permit — timing assignment', () => {
  const { breakdown } = computeStudyPermitUpfront(SP_UPFRONT_INPUT, DATA, TORONTO_BASELINE)

  it('permit-fee is tagged submission', () => {
    const item = breakdown.find(i => i.key === 'permit-fee')
    expect(item?.timing).toBe('submission')
  })

  it('biometrics is tagged submission', () => {
    const item = breakdown.find(i => i.key === 'biometrics')
    expect(item?.timing).toBe('submission')
  })

  it('medical-exam is tagged submission', () => {
    const item = breakdown.find(i => i.key === 'medical-exam')
    expect(item?.timing).toBe('submission')
  })

  it('tuition is tagged pre-arrival-setup', () => {
    const item = breakdown.find(i => i.key === 'tuition')
    expect(item?.timing).toBe('pre-arrival-setup')
  })

  it('gic is tagged pre-arrival-setup', () => {
    const item = breakdown.find(i => i.key === 'gic')
    expect(item?.timing).toBe('pre-arrival-setup')
  })

  it('gic-fee is tagged pre-arrival-setup', () => {
    const item = breakdown.find(i => i.key === 'gic-fee')
    expect(item?.timing).toBe('pre-arrival-setup')
  })

  it('travel is tagged settlement', () => {
    const item = breakdown.find(i => i.key === 'travel')
    expect(item?.timing).toBe('settlement')
  })

  it('housing-deposit is tagged settlement', () => {
    const item = breakdown.find(i => i.key === 'housing-deposit')
    expect(item?.timing).toBe('settlement')
  })

  it('all items have a timing field', () => {
    for (const item of breakdown) {
      expect(item.timing).toBeDefined()
    }
  })
})

// ─── FT-3: RPRF amount is $575 × adults (effective April 30, 2024) ───────────

describe('FT-3: RPRF amount', () => {
  it('single adult — $575', () => {
    const { breakdown } = computeUpfront(EE_INPUT, TORONTO_BASELINE)
    const rprf = breakdown.find(i => i.key === 'rprf')
    expect(rprf?.cad).toBe(575)
  })

  it('two adults — $1,150', () => {
    const input = { ...EE_INPUT, household: { adults: 2, children: 0 } }
    const { breakdown } = computeUpfront(input, TORONTO_BASELINE)
    const rprf = breakdown.find(i => i.key === 'rprf')
    expect(rprf?.cad).toBe(RPRF_PER_ADULT * 2)
  })

  it('RPRF is ircc source', () => {
    const { breakdown } = computeUpfront(EE_INPUT, TORONTO_BASELINE)
    const rprf = breakdown.find(i => i.key === 'rprf')
    expect(rprf?.source).toBe('ircc')
  })

  it('RPRF absent for non-EE pathway (work-permit)', () => {
    const input = { ...EE_INPUT, pathway: 'work-permit' as const }
    const { breakdown } = computeUpfront(input, TORONTO_BASELINE)
    expect(breakdown.find(i => i.key === 'rprf')).toBeUndefined()
  })

  it('RPRF present for express-entry-cec', () => {
    const input = { ...EE_INPUT, pathway: 'express-entry-cec' as const }
    const { breakdown } = computeUpfront(input, TORONTO_BASELINE)
    expect(breakdown.find(i => i.key === 'rprf')).toBeDefined()
  })

  it('RPRF present for pnp', () => {
    const input = { ...EE_INPUT, pathway: 'pnp' as const }
    const { breakdown } = computeUpfront(input, TORONTO_BASELINE)
    expect(breakdown.find(i => i.key === 'rprf')).toBeDefined()
  })
})

// ─── FT-4: Study permit GIC absent when not-purchasing ───────────────────────

describe('FT-4: Study Permit — GIC omitted when not-purchasing', () => {
  it('gic absent when gicStatus = not-purchasing', () => {
    const input = {
      ...SP_UPFRONT_INPUT,
      studyPermit: { ...SP_UPFRONT_INPUT.studyPermit, gicStatus: 'not-purchasing' as const },
    }
    const { breakdown } = computeStudyPermitUpfront(input, DATA, TORONTO_BASELINE)
    expect(breakdown.find(i => i.key === 'gic')).toBeUndefined()
    expect(breakdown.find(i => i.key === 'gic-fee')).toBeUndefined()
  })

  it('gic absent when gicStatus = purchased', () => {
    const input = {
      ...SP_UPFRONT_INPUT,
      studyPermit: { ...SP_UPFRONT_INPUT.studyPermit, gicStatus: 'purchased' as const },
    }
    const { breakdown } = computeStudyPermitUpfront(input, DATA, TORONTO_BASELINE)
    expect(breakdown.find(i => i.key === 'gic')).toBeUndefined()
  })
})
