/**
 * US-2.3 — Proof of Funds Dual Display
 *
 * Unit tests for:
 *   - computeSafeRecommended(): correct formula for all family sizes
 *   - computeSafe(): EE/PNP safeSavingsTarget uses safeRecommended (not officialMinimum)
 *   - computeGap(): savings gap targets safeRecommended, not officialMinimum
 *   - family size > 7: overflow extension is applied before safeRecommended
 *   - exempt pathways (CEC, job-offer): safeRecommended never used as floor
 */

import {
  EXPRESS_ENTRY_DEFAULTS,
  computeSafeRecommended,
  getExpressEntryFunds,
} from '@/lib/settlement-engine/compliance'
import { computeSafe, computeGap, computeFamilySize } from '@/lib/settlement-engine/calculate'
import type { ImmigrationPathway } from '@/lib/settlement-engine/types'

// ─── computeSafeRecommended ───────────────────────────────────────────────────

describe('computeSafeRecommended', () => {
  it('family size 1 FSW: ceil(15263 × 1.05 / 100) × 100 = 16100', () => {
    const official = getExpressEntryFunds(1)  // 15_263
    expect(computeSafeRecommended(official)).toBe(16_100)
  })

  it('family size 2: ceil(19001 × 1.05 / 100) × 100', () => {
    const official = getExpressEntryFunds(2)  // 19_001
    const expected = Math.ceil((official * 1.05) / 100) * 100
    expect(computeSafeRecommended(official)).toBe(expected)
  })

  it('family size 4: ceil(28362 × 1.05 / 100) × 100', () => {
    const official = getExpressEntryFunds(4)  // 28_362
    const expected = Math.ceil((official * 1.05) / 100) * 100
    expect(computeSafeRecommended(official)).toBe(expected)
  })

  it('always returns a value >= officialMinimum', () => {
    for (let size = 1; size <= 10; size++) {
      const official = getExpressEntryFunds(size)
      expect(computeSafeRecommended(official)).toBeGreaterThanOrEqual(official)
    }
  })

  it('result is always a multiple of 100', () => {
    for (let size = 1; size <= 10; size++) {
      const official = getExpressEntryFunds(size)
      expect(computeSafeRecommended(official) % 100).toBe(0)
    }
  })

  it('result is strictly greater than officialMinimum (5% buffer always adds something)', () => {
    // 5% of any positive number rounded up to $100 always adds at least $100
    const official = getExpressEntryFunds(1)
    expect(computeSafeRecommended(official)).toBeGreaterThan(official)
  })
})

// ─── Helpers ─────────────────────────────────────────────────────────────────

const EE_PATHWAYS: ImmigrationPathway[] = ['express-entry-fsw', 'express-entry-fstp', 'pnp']
const FAMILY_SIZES = [1, 2, 3, 4, 5, 6, 7, 8, 10]

function splitHousehold(familySize: number) {
  return {
    adults:   Math.min(familySize, 2),
    children: Math.max(0, familySize - 2),
  }
}

function runSafeZeroCost(pathway: ImmigrationPathway, familySize: number) {
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
    /* upfront */ 0,
    /* monthly */ 0,
    /* breakdown */ [],
    /* studyPermitData */ undefined,
    /* expressEntryData */ EXPRESS_ENTRY_DEFAULTS,
  )
}

// ─── computeSafe — EE/PNP: safeSavingsTarget uses safeRecommended ─────────────

describe.each(EE_PATHWAYS)(
  'computeSafe — %s: safeSavingsTarget is safeRecommended when floor dominates (US-2.3)',
  (pathway) => {
    test.each(FAMILY_SIZES)(
      'family size %d: safeSavingsTarget = ceil(official × 1.05 / 100) × 100',
      (familySize) => {
        const result              = runSafeZeroCost(pathway, familySize)
        const official            = getExpressEntryFunds(familySize)
        const expectedSafeRec     = computeSafeRecommended(official)

        // When upfront + monthly = 0, standardTarget = 0, so floor always dominates.
        expect(result.safeSavingsTarget).toBe(expectedSafeRec)
      },
    )

    test.each(FAMILY_SIZES)(
      'family size %d: complianceFloor (official minimum) is preserved unchanged',
      (familySize) => {
        const result   = runSafeZeroCost(pathway, familySize)
        const official = getExpressEntryFunds(familySize)

        expect(result.complianceFloor).toBe(official)
      },
    )

    test.each(FAMILY_SIZES)(
      'family size %d: safeSavingsTarget > complianceFloor (safeRec always exceeds official)',
      (familySize) => {
        const result = runSafeZeroCost(pathway, familySize)
        expect(result.safeSavingsTarget).toBeGreaterThan(result.complianceFloor!)
      },
    )
  },
)

// ─── computeGap — targets safeRecommended ─────────────────────────────────────

describe('computeGap — savings gap targets safeRecommended, not officialMinimum (US-2.3)', () => {
  it('gap = safeRecommended - savings when user is at exactly the official minimum', () => {
    // User has exactly the official minimum — still has a gap up to safeRecommended.
    const officialMinimum = getExpressEntryFunds(1)
    const safeRec         = computeSafeRecommended(officialMinimum)
    const result          = runSafeZeroCost('express-entry-fsw', 1)

    const gap = computeGap(result.safeSavingsTarget, officialMinimum)
    expect(result.safeSavingsTarget).toBe(safeRec)
    expect(gap).toBe(safeRec - officialMinimum)
  })

  it('gap = 0 when savings >= safeRecommended', () => {
    const officialMinimum = getExpressEntryFunds(1)
    const safeRec         = computeSafeRecommended(officialMinimum)
    const result          = runSafeZeroCost('express-entry-fsw', 1)

    expect(computeGap(result.safeSavingsTarget, safeRec)).toBe(0)
  })

  it('user at officialMinimum still has a gap (safeRec > official)', () => {
    // This is the key US-2.3 property: savings gap != 0 even when at official minimum.
    const officialMinimum = getExpressEntryFunds(1)
    const safeRec         = computeSafeRecommended(officialMinimum)
    const result          = runSafeZeroCost('express-entry-fsw', 1)

    const gap = computeGap(result.safeSavingsTarget, officialMinimum)
    expect(gap).toBeGreaterThan(0)
    expect(gap).toBe(safeRec - officialMinimum)
  })
})

// ─── Family size > 7 overflow extension ──────────────────────────────────────

describe('family size > 7: overflow extension applied before safeRecommended (US-2.4)', () => {
  it('family size 8: safeRecommended is higher than for family size 7', () => {
    const official7 = getExpressEntryFunds(7)
    const official8 = getExpressEntryFunds(8)
    const safe7     = computeSafeRecommended(official7)
    const safe8     = computeSafeRecommended(official8)

    expect(official8).toBe(official7 + EXPRESS_ENTRY_DEFAULTS.expressEntryAdditionalMember)
    expect(safe8).toBeGreaterThan(safe7)
  })

  it('family size 10: safeSavingsTarget uses 3 overflow increments', () => {
    const official10 = getExpressEntryFunds(10)  // 40392 + 3 × 4112
    const result     = runSafeZeroCost('express-entry-fsw', 10)

    expect(official10).toBe(40_392 + 3 * 4_112)
    expect(result.safeSavingsTarget).toBe(computeSafeRecommended(official10))
    expect(result.complianceFloor).toBe(official10)
  })
})

// ─── Exempt pathways — safeRecommended not applied as floor ──────────────────

describe('CEC: safeRecommended not used as compliance floor (US-2.1)', () => {
  const CEC_INPUT = {
    pathway:               'express-entry-cec' as const,
    province:              'ON',
    household:             { adults: 1, children: 0 },
    jobStatus:             'none' as const,
    needsChildcare:        false,
    plansCar:              false,
    customMonthlyExpenses: 0,
    customExpenses:        [] as [],
  }

  it('complianceFloor is undefined', () => {
    const result = computeSafe(CEC_INPUT, 5_000, 2_500, [], undefined, EXPRESS_ENTRY_DEFAULTS)
    expect(result.complianceFloor).toBeUndefined()
  })

  it('safeSavingsTarget = standardTarget (22000), not safeRecommended of family-1 FSW floor', () => {
    // upfront=5000, monthly=2500, runway=6, buffer=10%
    // standardTarget = (5000 + 2500×6) × 1.1 = 22_000
    const result = computeSafe(CEC_INPUT, 5_000, 2_500, [], undefined, EXPRESS_ENTRY_DEFAULTS)
    expect(result.safeSavingsTarget).toBe(22_000)
  })

  it('bindingConstraint is real-world', () => {
    const result = computeSafe(CEC_INPUT, 5_000, 2_500, [], undefined, EXPRESS_ENTRY_DEFAULTS)
    expect(result.bindingConstraint).toBe('real-world')
  })
})

describe('FSW + jobOfferExempt: safeRecommended not used as compliance floor (US-2.2)', () => {
  const JOB_OFFER_INPUT = {
    pathway:               'express-entry-fsw' as const,
    jobOfferExempt:        true,
    province:              'ON',
    household:             { adults: 1, children: 0 },
    jobStatus:             'none' as const,
    needsChildcare:        false,
    plansCar:              false,
    customMonthlyExpenses: 0,
    customExpenses:        [] as [],
  }

  it('complianceFloor is undefined', () => {
    const result = computeSafe(JOB_OFFER_INPUT, 5_000, 2_500, [], undefined, EXPRESS_ENTRY_DEFAULTS)
    expect(result.complianceFloor).toBeUndefined()
  })

  it('proofOfFundsExemption reason is job_offer', () => {
    const result = computeSafe(JOB_OFFER_INPUT, 5_000, 2_500, [], undefined, EXPRESS_ENTRY_DEFAULTS)
    expect(result.proofOfFundsExemption).toEqual({ exempt: true, reason: 'job_offer' })
  })

  it('safeSavingsTarget = standardTarget (22000)', () => {
    const result = computeSafe(JOB_OFFER_INPUT, 5_000, 2_500, [], undefined, EXPRESS_ENTRY_DEFAULTS)
    expect(result.safeSavingsTarget).toBe(22_000)
  })
})

// ─── computeFamilySize (US-2.4) ───────────────────────────────────────────────

describe('computeFamilySize (US-2.4)', () => {
  it('1 adult, 0 children → 1', () => {
    expect(computeFamilySize({ adults: 1, children: 0 })).toBe(1)
  })

  it('2 adults, 0 children → 2', () => {
    expect(computeFamilySize({ adults: 2, children: 0 })).toBe(2)
  })

  it('2 adults, 3 children → 5', () => {
    expect(computeFamilySize({ adults: 2, children: 3 })).toBe(5)
  })

  it('1 adult, 8 children (non-accompanying counted) → 9', () => {
    expect(computeFamilySize({ adults: 1, children: 8 })).toBe(9)
  })

  it('equals adults + children for all household combinations', () => {
    for (let adults = 1; adults <= 6; adults++) {
      for (let children = 0; children <= 10; children++) {
        expect(computeFamilySize({ adults, children })).toBe(adults + children)
      }
    }
  })
})

// ─── Family size 9 IRCC floor value (US-2.4) ─────────────────────────────────

describe('family size 9: IRCC floor value (US-2.4)', () => {
  // family size 9 = family size 7 base + 2 overflow increments
  const official7 = getExpressEntryFunds(7)
  const addl      = EXPRESS_ENTRY_DEFAULTS.expressEntryAdditionalMember
  const official9 = official7 + 2 * addl

  it('getExpressEntryFunds(9) = 40392 + 2 × 4112 = 48616', () => {
    expect(getExpressEntryFunds(9)).toBe(official9)
  })

  it('safeRecommended(official9) = ceil(official9 × 1.05 / 100) × 100', () => {
    const expected = Math.ceil((official9 * 1.05) / 100) * 100
    expect(computeSafeRecommended(official9)).toBe(expected)
  })

  it('safeSavingsTarget for FSW family size 9 uses safeRecommended', () => {
    const result = runSafeZeroCost('express-entry-fsw', 9)
    expect(result.safeSavingsTarget).toBe(computeSafeRecommended(official9))
  })

  it('complianceFloor for family size 9 equals official minimum (not safeRecommended)', () => {
    const result = runSafeZeroCost('express-entry-fsw', 9)
    expect(result.complianceFloor).toBe(official9)
  })

  it('safeRecommended > official minimum (5% buffer always adds something)', () => {
    expect(computeSafeRecommended(official9)).toBeGreaterThan(official9)
  })
})

// ─── Stress test: repeated family-size flips (US-2.4) ────────────────────────

describe('family-size stress: repeated flips produce stable results (US-2.4)', () => {
  // Flip through various sizes, including sizes > 7, in non-monotonic order.
  const FLIP_SEQUENCE = [1, 9, 1, 7, 3, 9, 5, 1, 4, 9, 2, 7, 6]

  it('every repeated call with the same family size returns the same safeSavingsTarget', () => {
    const seen = new Map<number, number>()

    for (const familySize of FLIP_SEQUENCE) {
      const result = runSafeZeroCost('express-entry-fsw', familySize)
      if (seen.has(familySize)) {
        expect(result.safeSavingsTarget).toBe(seen.get(familySize))
      } else {
        seen.set(familySize, result.safeSavingsTarget)
      }
    }
  })

  it('interleaved size-1 and size-9 calls do not cross-contaminate results', () => {
    const SIZES = [1, 9, 1, 9, 1, 9]
    const results = SIZES.map(size => runSafeZeroCost('express-entry-fsw', size))

    // All size-1 results must be identical
    const size1Results = results.filter((_, i) => SIZES[i] === 1)
    for (const r of size1Results) {
      expect(r.safeSavingsTarget).toBe(size1Results[0].safeSavingsTarget)
    }

    // All size-9 results must be identical
    const size9Results = results.filter((_, i) => SIZES[i] === 9)
    for (const r of size9Results) {
      expect(r.safeSavingsTarget).toBe(size9Results[0].safeSavingsTarget)
    }

    // size-9 target must be strictly greater than size-1 target
    expect(size9Results[0].safeSavingsTarget).toBeGreaterThan(size1Results[0].safeSavingsTarget)
  })

  it('all EE pathways produce stable results across the flip sequence', () => {
    const pathways: ImmigrationPathway[] = ['express-entry-fsw', 'express-entry-fstp', 'pnp']
    for (const pathway of pathways) {
      const seen = new Map<number, number>()
      for (const familySize of FLIP_SEQUENCE) {
        const result = runSafeZeroCost(pathway, familySize)
        if (seen.has(familySize)) {
          expect(result.safeSavingsTarget).toBe(seen.get(familySize))
        } else {
          seen.set(familySize, result.safeSavingsTarget)
        }
      }
    }
  })
})
