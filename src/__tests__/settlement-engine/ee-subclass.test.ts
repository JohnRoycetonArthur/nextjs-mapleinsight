/**
 * Unit tests — US-20.1 Express Entry Sub-Class Branching & Exemption Logic
 *
 * Validates:
 * - FSW: compliance floor = IRCC EE table (1 person = $15,263)
 * - CEC + job offer + work auth: proof-of-funds exempt (no compliance floor)
 * - CEC without job offer: treated as FSW — compliance floor applies
 * - FST with job offer: compliance floor applies (FST exemption not supported)
 * - "Not Sure" (unsure): conservative default = FSW compliance floor
 *
 * The mapPathway function in ResultsDashboard converts wizard answers to engine
 * ImmigrationPathway values. These tests validate the compliance engine and the
 * mapping logic in isolation.
 */

import {
  getComplianceRequirement,
  getExpressEntryFunds,
  EXPRESS_ENTRY_DEFAULTS,
} from '@/lib/settlement-engine/compliance'
import { computeSafe } from '@/lib/settlement-engine/calculate'
import type { EngineInput } from '@/lib/settlement-engine/types'

// ─── Shared fixture ────────────────────────────────────────────────────────────

const BASE_SAFE_INPUT: Pick<
  EngineInput,
  'jobStatus' | 'needsChildcare' | 'plansCar' | 'customMonthlyExpenses' | 'province' | 'household' | 'departureRegion'
> = {
  jobStatus:             'none',
  needsChildcare:        false,
  plansCar:              false,
  customMonthlyExpenses: 0,
  province:              'ON',
  household:             { adults: 1, children: 0 },
  departureRegion:       'south-asia',
}

/** Compliance floor for a single applicant (IRCC table, effective 2025-07-07) */
const EE_SINGLE = getExpressEntryFunds(1, EXPRESS_ENTRY_DEFAULTS)  // $15,263

// ─── mapPathway logic (mirrored from ResultsDashboard) ────────────────────────
// These replicate the branch logic so we can test it without importing the React component.

type SubClass = 'fsw' | 'cec' | 'fst' | 'unsure'
type EEAnswers = { subClass: SubClass; hasJobOffer: boolean; isWorkAuthorized: boolean }

function mapPathway(subClass: SubClass, hasJobOffer: boolean, isWorkAuthorized: boolean): EngineInput['pathway'] {
  if (subClass === 'cec' && hasJobOffer && isWorkAuthorized) return 'express-entry-cec'
  if (subClass === 'fst') return 'express-entry-fstp'
  return 'express-entry-fsw'
}

// ─── getComplianceRequirement — sub-class matrix ───────────────────────────────

describe('EE sub-class — getComplianceRequirement', () => {
  it('FSW: returns IRCC table amount for 1 person', () => {
    const pathway = mapPathway('fsw', false, false)
    expect(getComplianceRequirement(pathway, 1)).toBe(EE_SINGLE)
  })

  it('CEC + job offer + work auth: returns null (exempt)', () => {
    const pathway = mapPathway('cec', true, true)
    expect(getComplianceRequirement(pathway, 1)).toBeNull()
  })

  it('CEC without job offer: returns compliance floor (treated as FSW)', () => {
    const pathway = mapPathway('cec', false, false)
    expect(getComplianceRequirement(pathway, 1)).toBe(EE_SINGLE)
  })

  it('CEC with job offer but no work auth: returns compliance floor', () => {
    const pathway = mapPathway('cec', true, false)
    expect(getComplianceRequirement(pathway, 1)).toBe(EE_SINGLE)
  })

  it('FST with job offer: returns compliance floor (FST not exempt)', () => {
    const pathway = mapPathway('fst', true, false)
    expect(getComplianceRequirement(pathway, 1)).toBe(EE_SINGLE)
  })

  it('FST with job offer + work auth: returns compliance floor (only CEC exemption applies)', () => {
    // FST maps to express-entry-fstp regardless of job offer / work auth
    const pathway = mapPathway('fst', true, true)
    expect(pathway).toBe('express-entry-fstp')
    expect(getComplianceRequirement(pathway, 1)).toBe(EE_SINGLE)
  })

  it('"Not Sure" (unsure): maps to FSW — returns compliance floor', () => {
    const pathway = mapPathway('unsure', false, false)
    expect(pathway).toBe('express-entry-fsw')
    expect(getComplianceRequirement(pathway, 1)).toBe(EE_SINGLE)
  })
})

// ─── computeSafe — compliance floor integration ────────────────────────────────

describe('EE sub-class — computeSafe compliance floor', () => {
  const upfront    = 5_000
  const monthlyMin = 2_000
  const breakdown  = []

  it('FSW: complianceFloor is set to IRCC EE amount', () => {
    const result = computeSafe(
      { ...BASE_SAFE_INPUT, pathway: 'express-entry-fsw', studyPermit: undefined },
      upfront, monthlyMin, breakdown,
    )
    expect(result.complianceFloor).toBe(EE_SINGLE)
  })

  it('CEC + job offer + work auth: no complianceFloor (exempt)', () => {
    const result = computeSafe(
      { ...BASE_SAFE_INPUT, pathway: 'express-entry-cec', studyPermit: undefined },
      upfront, monthlyMin, breakdown,
    )
    expect(result.complianceFloor).toBeUndefined()
    expect(result.complianceFloorApplied).toBeUndefined()
  })

  it('CEC without exemption (mapped to FSW): complianceFloor is set', () => {
    // When CEC does not have job offer+workAuth, mapPathway returns 'express-entry-fsw'
    const result = computeSafe(
      { ...BASE_SAFE_INPUT, pathway: 'express-entry-fsw', studyPermit: undefined },
      upfront, monthlyMin, breakdown,
    )
    expect(result.complianceFloor).toBe(EE_SINGLE)
  })

  it('FST: complianceFloor is set (uses same EE table)', () => {
    const result = computeSafe(
      { ...BASE_SAFE_INPUT, pathway: 'express-entry-fstp', studyPermit: undefined },
      upfront, monthlyMin, breakdown,
    )
    expect(result.complianceFloor).toBe(EE_SINGLE)
  })
})

// ─── EE_SINGLE sanity check ────────────────────────────────────────────────────

describe('EXPRESS_ENTRY_DEFAULTS — 1-person amount', () => {
  it('is $15,263 (effective 2025-07-07)', () => {
    expect(EE_SINGLE).toBe(15_263)
  })
})
