/**
 * Fee Regression Fixtures — US-1.3 accuracy fix
 *
 * Four pinned scenarios that boundary-pin immigration fees subtotals after the
 * April 30 2024 fee correction ($950 processing, $575 RPRF, $85/$170 biometrics).
 *
 * Deltas vs prior seeded values (processing was bundled at $1,365, RPRF at $515):
 *   Single Toronto   — was $1,965 ($1,365+$515+$85) → now $1,610  (-$355)
 *   Couple Calgary   — was $2,780 ($1,365+$1,030+$170+$85+$130*) → now $2,270  (-$510)
 *                      (*prior double-count: immigration-fee already included RPRF)
 *   Family Halifax   — was same as couple → now $2,270  (-$510)
 *   Study permit Mtl — no RPRF / unaffected → $235  (unchanged)
 *
 * These tests must remain green before any deployment that touches fee schedules,
 * the RPRF constant, or computeUpfront.
 */

import { computeUpfront } from '@/lib/settlement-engine/calculate'
import { getFeeSchedule, computeBiometricsFee } from '@/lib/settlement-engine/fees'
import { STUDY_PERMIT_DEFAULTS } from '@/lib/settlement-engine/study-permit'
import type { CityBaseline } from '@/lib/settlement-engine/baselines'
import type { EngineInput } from '@/lib/settlement-engine/types'

// ─── Helper ───────────────────────────────────────────────────────────────────

/** Sum of all government-fee line items in the upfront breakdown. */
function immigrationFeesSubtotal(breakdown: { key: string; cad: number }[]): number {
  return breakdown
    .filter(i => ['immigration-fee', 'rprf', 'biometrics'].includes(i.key))
    .reduce((sum, i) => sum + i.cad, 0)
}

// ─── Baselines (CMHC Rental Market Report, October 2025) ─────────────────────

const TORONTO_BASELINE: CityBaseline = {
  cityName: 'Toronto', province: 'ON',
  avgRentStudio: 1_450, avgRent1BR: 1_761, avgRent2BR: 2_100,
  monthlyTransitPass: 156,
  source: 'CMHC Rental Market Report, October 2025',
  effectiveDate: '2025-10-01', dataVersion: '2025-10', isFallback: false,
}

const CALGARY_BASELINE: CityBaseline = {
  cityName: 'Calgary', province: 'AB',
  avgRentStudio: 1_400, avgRent1BR: 1_660, avgRent2BR: 2_050,
  monthlyTransitPass: 115,
  source: 'CMHC Rental Market Report, October 2025',
  effectiveDate: '2025-10-01', dataVersion: '2025-10', isFallback: false,
}

const HALIFAX_BASELINE: CityBaseline = {
  cityName: 'Halifax', province: 'NS',
  avgRentStudio: 1_350, avgRent1BR: 1_700, avgRent2BR: 2_050,
  monthlyTransitPass: 82,
  source: 'CMHC Rental Market Report, October 2025',
  effectiveDate: '2025-10-01', dataVersion: '2025-10', isFallback: false,
}

const MONTREAL_BASELINE: CityBaseline = {
  cityName: 'Montréal', province: 'QC',
  avgRentStudio: 1_050, avgRent1BR: 1_250, avgRent2BR: 1_600,
  monthlyTransitPass: 101,
  source: 'CMHC Rental Market Report, October 2025',
  effectiveDate: '2025-10-01', dataVersion: '2025-10', isFallback: false,
}

// ─── Fixture 1: Single Toronto — EE FSW ──────────────────────────────────────

describe('Regression Fixture 1 — Single Toronto (EE FSW)', () => {
  const schedule = getFeeSchedule('express-entry-fsw')
  const input: EngineInput = {
    city: 'Toronto', province: 'ON',
    pathway:        'express-entry-fsw',
    fees:           { applicationFee: schedule.applicationFee, biometricsFee: schedule.biometricsPerPerson, biometricsPaid: false },
    housingType:    '1br',
    furnishingLevel:'basic',
    household:      { adults: 1, children: 0 },
    needsChildcare: false,
    liquidSavings:  18_000,
    monthlyObligations: 0,
    plansCar:       false,
    jobStatus:      'none',
  }
  const { breakdown } = computeUpfront(input, TORONTO_BASELINE, undefined, schedule)

  it('processing fee = $950', () => {
    expect(breakdown.find(i => i.key === 'immigration-fee')?.cad).toBe(950)
  })
  it('RPRF = $575 (single adult)', () => {
    expect(breakdown.find(i => i.key === 'rprf')?.cad).toBe(575)
  })
  it('biometrics = $85 (single)', () => {
    expect(breakdown.find(i => i.key === 'biometrics')?.cad).toBe(85)
  })
  it('immigration fees subtotal = $1,610', () => {
    expect(immigrationFeesSubtotal(breakdown)).toBe(1_610)
  })
})

// ─── Fixture 2: Couple Calgary — EE FSW ──────────────────────────────────────

describe('Regression Fixture 2 — Couple Calgary (EE FSW)', () => {
  const schedule = getFeeSchedule('express-entry-fsw')
  const household = { adults: 2, children: 0 }
  const input: EngineInput = {
    city: 'Calgary', province: 'AB',
    pathway:        'express-entry-fsw',
    fees:           { applicationFee: schedule.applicationFee, biometricsFee: computeBiometricsFee(schedule, household), biometricsPaid: false },
    housingType:    '1br',
    furnishingLevel:'basic',
    household,
    needsChildcare: false,
    liquidSavings:  30_000,
    monthlyObligations: 0,
    plansCar:       false,
    jobStatus:      'none',
  }
  const { breakdown } = computeUpfront(input, CALGARY_BASELINE, undefined, schedule)

  it('processing fee = $950 (principal applicant)', () => {
    expect(breakdown.find(i => i.key === 'immigration-fee')?.cad).toBe(950)
  })
  it('RPRF = $1,150 (2 adults × $575)', () => {
    expect(breakdown.find(i => i.key === 'rprf')?.cad).toBe(1_150)
  })
  it('biometrics = $170 (family cap)', () => {
    expect(breakdown.find(i => i.key === 'biometrics')?.cad).toBe(170)
  })
  it('immigration fees subtotal = $2,270', () => {
    expect(immigrationFeesSubtotal(breakdown)).toBe(2_270)
  })
})

// ─── Fixture 3: Family Halifax — EE FSW (2 adults + 2 children) ──────────────

describe('Regression Fixture 3 — Family Halifax (EE FSW, 2 adults + 2 children)', () => {
  const schedule = getFeeSchedule('express-entry-fsw')
  const household = { adults: 2, children: 2 }
  const input: EngineInput = {
    city: 'Halifax', province: 'NS',
    pathway:        'express-entry-fsw',
    fees:           { applicationFee: schedule.applicationFee, biometricsFee: computeBiometricsFee(schedule, household), biometricsPaid: false },
    housingType:    '2br',
    furnishingLevel:'basic',
    household,
    needsChildcare: true,
    liquidSavings:  40_000,
    monthlyObligations: 0,
    plansCar:       false,
    jobStatus:      'none',
  }
  const { breakdown } = computeUpfront(input, HALIFAX_BASELINE, undefined, schedule)

  it('processing fee = $950 (principal applicant)', () => {
    expect(breakdown.find(i => i.key === 'immigration-fee')?.cad).toBe(950)
  })
  it('RPRF = $1,150 (2 adults × $575; children do not pay RPRF)', () => {
    expect(breakdown.find(i => i.key === 'rprf')?.cad).toBe(1_150)
  })
  it('biometrics = $170 (family cap applies at 2+ persons)', () => {
    expect(breakdown.find(i => i.key === 'biometrics')?.cad).toBe(170)
  })
  it('immigration fees subtotal = $2,270', () => {
    expect(immigrationFeesSubtotal(breakdown)).toBe(2_270)
  })
})

// ─── Fixture 4: Study Permit Montréal — single applicant ─────────────────────

describe('Regression Fixture 4 — Study Permit Montréal (single)', () => {
  const schedule = getFeeSchedule('study-permit')
  const input: EngineInput = {
    city: 'Montréal', province: 'QC',
    pathway:        'study-permit',
    fees:           { applicationFee: schedule.applicationFee, biometricsFee: schedule.biometricsPerPerson, biometricsPaid: false },
    housingType:    '1br',
    furnishingLevel:'basic',
    household:      { adults: 1, children: 0 },
    needsChildcare: false,
    liquidSavings:  35_000,
    monthlyObligations: 0,
    plansCar:       false,
    jobStatus:      'student',
    studyPermit: {
      programLevel:      'undergraduate',
      tuitionAmount:     20_000,
      gicStatus:         'planning',
      gicAmount:         0,
      scholarshipAmount: 0,
      biometricsDone:    false,
      feesPaid:          false,
    },
  }
  // Study permit routes through computeStudyPermitUpfront — fee key is 'permit-fee'
  const { breakdown } = computeUpfront(input, MONTREAL_BASELINE, STUDY_PERMIT_DEFAULTS)

  it('permit fee = $150', () => {
    expect(breakdown.find(i => i.key === 'permit-fee')?.cad).toBe(150)
  })
  it('biometrics = $85 (single)', () => {
    expect(breakdown.find(i => i.key === 'biometrics')?.cad).toBe(85)
  })
  it('no RPRF for study permit pathway', () => {
    expect(breakdown.find(i => i.key === 'rprf')).toBeUndefined()
  })
  it('government fees subtotal = $235 (permit $150 + biometrics $85)', () => {
    const govFees = breakdown
      .filter(i => ['permit-fee', 'biometrics'].includes(i.key))
      .reduce((sum, i) => sum + i.cad, 0)
    expect(govFees).toBe(235)
  })
})
