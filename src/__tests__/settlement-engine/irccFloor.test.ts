/**
 * IRCC Floor Regression Suite — US-1.5
 *
 * Final line of defense: verifies that no displayed required-funds figure
 * (safeSavingsTarget) can fall below the applicable IRCC floor for any
 * pathway × family size combination.
 *
 * CI job: ircc-floor-guard (see .github/workflows/ci.yml)
 * This suite MUST remain green before any deployment.
 *
 * Pathways with an IRCC floor:
 *   express-entry-fsw  → EE settlement funds table (FSWP, 50 % LICO, 2025-07-07)
 *   express-entry-fstp → EE settlement funds table (FSTP, same table)
 *   pnp                → EE settlement funds table (conservative LICO proxy)
 *   study-permit (ON)  → tuition + federal living-expenses table + transport
 *   study-permit (QC)  → tuition + Quebec living-expenses table + transport
 *
 * Exempt pathways (no IRCC regulatory floor):
 *   express-entry-cec  → no floor (CEC holders already employed in Canada)
 *   work-permit        → no floor
 *   family-sponsorship → no floor
 *
 * Future CEC/job-offer exemption logic is stubbed here and must not break main.
 */

import { DATA_VERSION } from '@/lib/settlement-engine/version'
import {
  EXPRESS_ENTRY_DEFAULTS,
  getComplianceRequirement,
  getExpressEntryFunds,
  computeEEProofOfFunds,
} from '@/lib/settlement-engine/compliance'
import {
  STUDY_PERMIT_DEFAULTS,
  computeIRCCProofOfFunds,
} from '@/lib/settlement-engine/study-permit'
import { computeSafe } from '@/lib/settlement-engine/calculate'
import type { ImmigrationPathway } from '@/lib/settlement-engine/types'

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Formats a floor-violation failure message containing all fields required by
 * US-1.5 AC-5: pathway, family size, expected floor, actual amount, dataVersion.
 */
function floorFailMessage(
  pathway: string,
  familySize: number,
  expectedFloor: number,
  actualAmount: number,
): string {
  return (
    `IRCC floor violation — ` +
    `pathway=${pathway}, ` +
    `familySize=${familySize}, ` +
    `expectedFloor=$${expectedFloor.toLocaleString('en-CA')}, ` +
    `actualAmount=$${actualAmount.toLocaleString('en-CA')}, ` +
    `dataVersion=${DATA_VERSION}`
  )
}

/**
 * Splits a family size into EngineInput.household.
 * Convention: adults = min(familySize, 2), children = remainder.
 */
function splitHousehold(familySize: number): { adults: number; children: number } {
  const adults   = Math.min(familySize, 2)
  const children = Math.max(0, familySize - adults)
  return { adults, children }
}

/** Full range under test: covers the 1–7 lookup table and beyond-7 extension. */
const FAMILY_SIZES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

/**
 * Runs computeSafe for an EE/PNP pathway with zero upfront and zero monthly
 * costs, forcing the compliance floor to dominate standardTarget.
 */
function runSafeForEEPathway(pathway: ImmigrationPathway, familySize: number) {
  const { adults, children } = splitHousehold(familySize)
  return computeSafe(
    {
      pathway,
      province:              'ON',
      household:             { adults, children },
      jobStatus:             'none',
      needsChildcare:        false,
      plansCar:              false,
      customMonthlyExpenses: 0,
      customExpenses:        [],
    },
    /* upfront           */ 0,
    /* monthlyMin        */ 0,
    /* monthlyMinBreakdown */ [],
    /* studyPermitData   */ undefined,
    /* expressEntryData  */ EXPRESS_ENTRY_DEFAULTS,
  )
}

/** Fixed tuition used across all study permit floor tests. */
const STUDY_TUITION = 20_000

/**
 * Runs computeSafe for the study-permit pathway in the given province with zero
 * upfront and zero monthly costs, forcing the IRCC proof-of-funds floor to apply.
 */
function runSafeForStudyPermit(province: string, familySize: number) {
  const { adults, children } = splitHousehold(familySize)
  return computeSafe(
    {
      pathway:  'study-permit',
      province,
      household: { adults, children },
      jobStatus: 'student',
      needsChildcare:        false,
      plansCar:              false,
      customMonthlyExpenses: 0,
      customExpenses:        [],
      studyPermit: {
        programLevel:      'undergraduate',
        tuitionAmount:     STUDY_TUITION,
        gicStatus:         'planning',
        gicAmount:         0,
        scholarshipAmount: 0,
        biometricsDone:    false,
        feesPaid:          false,
      },
    },
    /* upfront           */ 0,
    /* monthlyMin        */ 0,
    /* monthlyMinBreakdown */ [],
    /* studyPermitData   */ STUDY_PERMIT_DEFAULTS,
    /* expressEntryData  */ undefined,
  )
}

// ─── EE / PNP compliance floor ────────────────────────────────────────────────

const EE_PATHWAYS: ImmigrationPathway[] = [
  'express-entry-fsw',
  'express-entry-fstp',
  'pnp',
]

describe.each(EE_PATHWAYS)(
  'IRCC compliance floor — %s',
  (pathway) => {
    test.each(FAMILY_SIZES)(
      'family size %d: safeSavingsTarget >= EE settlement funds floor',
      (familySize) => {
        const result        = runSafeForEEPathway(pathway, familySize)
        const expectedFloor = getExpressEntryFunds(familySize, EXPRESS_ENTRY_DEFAULTS)

        if (result.safeSavingsTarget < expectedFloor) {
          throw new Error(floorFailMessage(pathway, familySize, expectedFloor, result.safeSavingsTarget))
        }

        expect(result.safeSavingsTarget).toBeGreaterThanOrEqual(expectedFloor)
      },
    )

    test.each(FAMILY_SIZES)(
      'family size %d: complianceFloor field matches EE table value',
      (familySize) => {
        const result        = runSafeForEEPathway(pathway, familySize)
        const expectedFloor = getExpressEntryFunds(familySize, EXPRESS_ENTRY_DEFAULTS)
        expect(result.complianceFloor).toBe(expectedFloor)
      },
    )

    test.each(FAMILY_SIZES)(
      'family size %d: complianceFloorApplied is true when upfront+monthly = 0',
      (familySize) => {
        const result = runSafeForEEPathway(pathway, familySize)
        // standardTarget = 0 when both upfront and monthly are 0, so floor always applies
        expect(result.complianceFloorApplied).toBe(true)
      },
    )
  },
)

// ─── Study Permit — Ontario (federal table) ───────────────────────────────────

describe('IRCC proof-of-funds floor — study-permit (ON, federal table)', () => {
  test.each(FAMILY_SIZES)(
    'family size %d: safeSavingsTarget >= IRCC proof-of-funds floor',
    (familySize) => {
      const result        = runSafeForStudyPermit('ON', familySize)
      const expectedFloor = computeIRCCProofOfFunds(
        familySize,
        STUDY_TUITION,
        'ON',
        STUDY_PERMIT_DEFAULTS,
      )

      if (result.safeSavingsTarget < expectedFloor) {
        throw new Error(floorFailMessage('study-permit(ON)', familySize, expectedFloor, result.safeSavingsTarget))
      }

      expect(result.safeSavingsTarget).toBeGreaterThanOrEqual(expectedFloor)
    },
  )

  test.each(FAMILY_SIZES)(
    'family size %d: irccFloor field matches computeIRCCProofOfFunds (federal)',
    (familySize) => {
      const result        = runSafeForStudyPermit('ON', familySize)
      const expectedFloor = computeIRCCProofOfFunds(
        familySize,
        STUDY_TUITION,
        'ON',
        STUDY_PERMIT_DEFAULTS,
      )
      expect(result.irccFloor).toBe(expectedFloor)
    },
  )

  test.each(FAMILY_SIZES)(
    'family size %d: irccFloorApplied is true when upfront+monthly = 0',
    (familySize) => {
      const result = runSafeForStudyPermit('ON', familySize)
      expect(result.irccFloorApplied).toBe(true)
    },
  )
})

// ─── Study Permit — Quebec (province-specific table) ─────────────────────────

describe('IRCC proof-of-funds floor — study-permit (QC, Quebec table)', () => {
  test.each(FAMILY_SIZES)(
    'family size %d: safeSavingsTarget >= IRCC proof-of-funds floor',
    (familySize) => {
      const result        = runSafeForStudyPermit('QC', familySize)
      const expectedFloor = computeIRCCProofOfFunds(
        familySize,
        STUDY_TUITION,
        'QC',
        STUDY_PERMIT_DEFAULTS,
      )

      if (result.safeSavingsTarget < expectedFloor) {
        throw new Error(floorFailMessage('study-permit(QC)', familySize, expectedFloor, result.safeSavingsTarget))
      }

      expect(result.safeSavingsTarget).toBeGreaterThanOrEqual(expectedFloor)
    },
  )

  test.each(FAMILY_SIZES)(
    'family size %d: irccFloor field matches computeIRCCProofOfFunds (Quebec)',
    (familySize) => {
      const result        = runSafeForStudyPermit('QC', familySize)
      const expectedFloor = computeIRCCProofOfFunds(
        familySize,
        STUDY_TUITION,
        'QC',
        STUDY_PERMIT_DEFAULTS,
      )
      expect(result.irccFloor).toBe(expectedFloor)
    },
  )

  it('QC floor > ON floor for same family size (Quebec living costs are higher)', () => {
    // Quebec perAdditionalMember ($6,170) exceeds the federal extension ($6,170 also),
    // but the QC base for size-1 ($24,617) > federal ($22,895).
    const qcFloor = computeIRCCProofOfFunds(1, STUDY_TUITION, 'QC', STUDY_PERMIT_DEFAULTS)
    const onFloor = computeIRCCProofOfFunds(1, STUDY_TUITION, 'ON', STUDY_PERMIT_DEFAULTS)
    expect(qcFloor).toBeGreaterThan(onFloor)
  })
})

// ─── Exemption stubs ──────────────────────────────────────────────────────────

/**
 * These pathways have no IRCC regulatory settlement funds floor.
 * Verified via getComplianceRequirement, computeEEProofOfFunds (US-2.1),
 * and computeSafe exemption flag.
 */

describe('Exemption — no IRCC floor', () => {
  const EXEMPT_PATHWAYS: ImmigrationPathway[] = [
    'express-entry-cec',
    'work-permit',
    'family-sponsorship',
  ]

  describe.each(EXEMPT_PATHWAYS)(
    '%s — getComplianceRequirement returns null',
    (pathway) => {
      test.each(FAMILY_SIZES)(
        'family size %d: no compliance floor',
        (familySize) => {
          expect(getComplianceRequirement(pathway, familySize)).toBeNull()
        },
      )
    },
  )

  // ── computeEEProofOfFunds CEC exemption (US-2.1) ────────────────────────────

  test.each(FAMILY_SIZES)(
    'CEC computeEEProofOfFunds family size %d: exempt:true, reason:cec, amount:0',
    (familySize) => {
      const result = computeEEProofOfFunds('express-entry-cec', familySize, EXPRESS_ENTRY_DEFAULTS)
      expect(result.exempt).toBe(true)
      expect(result.reason).toBe('cec')
      expect(result.amount).toBe(0)
      expect(result.safeRecommended).toBeUndefined()
      expect(result.buffer).toBeUndefined()
    },
  )

  it('CEC computeSafe: complianceFloor is undefined (exempt)', () => {
    const result = computeSafe(
      {
        pathway:               'express-entry-cec',
        province:              'ON',
        household:             { adults: 1, children: 0 },
        jobStatus:             'none',
        needsChildcare:        false,
        plansCar:              false,
        customMonthlyExpenses: 0,
        customExpenses:        [],
      },
      0, 0, [],
      undefined,
      EXPRESS_ENTRY_DEFAULTS,
    )
    expect(result.complianceFloor).toBeUndefined()
    expect(result.complianceFloorApplied).toBeUndefined()
  })

  it('CEC computeSafe: bindingConstraint is real-world (no regulatory floor)', () => {
    const result = computeSafe(
      {
        pathway:               'express-entry-cec',
        province:              'ON',
        household:             { adults: 1, children: 0 },
        jobStatus:             'none',
        needsChildcare:        false,
        plansCar:              false,
        customMonthlyExpenses: 0,
        customExpenses:        [],
      },
      0, 0, [],
      undefined,
      EXPRESS_ENTRY_DEFAULTS,
    )
    expect(result.bindingConstraint).toBe('real-world')
  })

  it('CEC computeSafe: proofOfFundsExemption.exempt is true with reason cec (US-2.1)', () => {
    const result = computeSafe(
      {
        pathway:               'express-entry-cec',
        province:              'ON',
        household:             { adults: 1, children: 0 },
        jobStatus:             'none',
        needsChildcare:        false,
        plansCar:              false,
        customMonthlyExpenses: 0,
        customExpenses:        [],
      },
      0, 0, [],
      undefined,
      EXPRESS_ENTRY_DEFAULTS,
    )
    expect(result.proofOfFundsExemption).toBeDefined()
    expect(result.proofOfFundsExemption?.exempt).toBe(true)
    if (result.proofOfFundsExemption?.exempt) {
      expect(result.proofOfFundsExemption.reason).toBe('cec')
    }
  })
})

// ─── Canary failure proof test ────────────────────────────────────────────────

/**
 * CANARY — intentionally skipped.
 *
 * Documents the exact failure message format emitted when the IRCC floor
 * enforcement is violated. Re-enable (remove .skip) to confirm the message
 * format is correct after any change to floorFailMessage or DATA_VERSION.
 *
 * If this test ever appears to fail while NOT skipped and the engine is intact,
 * the canary itself has been misconfigured — do not suppress it.
 */
test.skip('CANARY — demonstrates floor-violation failure message format', () => {
  const pathway       = 'express-entry-fsw'
  const familySize    = 1
  const expectedFloor = getExpressEntryFunds(familySize, EXPRESS_ENTRY_DEFAULTS)
  const brokenAmount  = 0 // simulates an engine that ignores the compliance floor

  if (brokenAmount < expectedFloor) {
    throw new Error(floorFailMessage(pathway, familySize, expectedFloor, brokenAmount))
  }
})
