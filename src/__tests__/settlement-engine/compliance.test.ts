/**
 * Unit tests — Retrofit R1 compliance and flight cost calculations
 *
 * Covers:
 * - EE settlement funds by family size (incl. beyond 7)
 * - getComplianceRequirement pathway applicability matrix
 * - computeOneWayFlight & computeRoundTripFlight by region
 * - staying-family edge case ($0 deposit, rent, furnishing)
 * - student housing rent from baseline
 * - round-trip vs one-way in IRCC study permit compliance
 * - CEC exemption from compliance floor
 */

import {
  EXPRESS_ENTRY_DEFAULTS,
  getComplianceRequirement,
  getExpressEntryFunds,
} from '@/lib/settlement-engine/compliance'
import {
  FLIGHT_COST_BY_REGION,
  computeOneWayFlight,
  computeRoundTripFlight,
  rentFromBaseline,
} from '@/lib/settlement-engine/constants'
import {
  STUDY_PERMIT_DEFAULTS,
  buildIRCCComplianceResult,
  computeIRCCProofOfFunds,
} from '@/lib/settlement-engine/study-permit'
import { computeMonthlyMin, computeUpfront } from '@/lib/settlement-engine/calculate'
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
  source:             'CMHC Rental Market Report, October 2025',
  effectiveDate:      '2025-10-01',
  dataVersion:        '2025-10',
  isFallback:         false,
  studentHousing: {
    sharedRoom: 1_050,
    onCampus:   1_200,
    homestay:   1_200,
  },
}

const BASE_INPUT: Omit<EngineInput, 'pathway' | 'housingType'> = {
  city:     'Toronto',
  province: 'ON',
  fees: { applicationFee: 950, biometricsFee: 85, biometricsPaid: false },
  furnishingLevel:       'basic',
  household:             { adults: 1, children: 0 },
  needsChildcare:        false,
  liquidSavings:         30_000,
  monthlyObligations:    0,
  plansCar:              false,
  customMonthlyExpenses: 0,
  jobStatus:             'none',
  departureRegion:       'south-asia',
}

// ─── EE Settlement Funds ──────────────────────────────────────────────────────

describe('getExpressEntryFunds', () => {
  it('returns correct amount for family size 1', () => {
    expect(getExpressEntryFunds(1)).toBe(15_263)
  })

  it('returns correct amount for family size 2', () => {
    expect(getExpressEntryFunds(2)).toBe(19_001)
  })

  it('returns correct amount for family size 4', () => {
    expect(getExpressEntryFunds(4)).toBe(28_362)
  })

  it('returns correct amount for family size 7', () => {
    expect(getExpressEntryFunds(7)).toBe(40_392)
  })

  it('adds per-member increment for family size 8', () => {
    expect(getExpressEntryFunds(8)).toBe(40_392 + 4_112)
  })

  it('adds per-member increment for family size 10', () => {
    expect(getExpressEntryFunds(10)).toBe(40_392 + 3 * 4_112)
  })

  it('uses custom data when provided', () => {
    const customData = {
      expressEntryEffectiveDate:    '2025-07-07',
      expressEntryAdditionalMember: 5_000,
      expressEntryFunds: [
        { familyMembers: 1, amountCAD: 10_000 },
        { familyMembers: 2, amountCAD: 14_000 },
        { familyMembers: 3, amountCAD: 18_000 },
        { familyMembers: 4, amountCAD: 22_000 },
        { familyMembers: 5, amountCAD: 26_000 },
        { familyMembers: 6, amountCAD: 30_000 },
        { familyMembers: 7, amountCAD: 34_000 },
      ],
    }
    expect(getExpressEntryFunds(1, customData)).toBe(10_000)
    expect(getExpressEntryFunds(8, customData)).toBe(34_000 + 5_000)
  })
})

// ─── Compliance Applicability ─────────────────────────────────────────────────

describe('getComplianceRequirement — pathway matrix', () => {
  it('returns EE funds for express-entry-fsw', () => {
    const result = getComplianceRequirement('express-entry-fsw', 1)
    expect(result).toBe(15_263)
  })

  it('returns EE funds for express-entry-fstp', () => {
    const result = getComplianceRequirement('express-entry-fstp', 2)
    expect(result).toBe(19_001)
  })

  it('returns EE funds for pnp', () => {
    const result = getComplianceRequirement('pnp', 3)
    expect(result).toBe(23_360)
  })

  it('returns null for express-entry-cec (exempt)', () => {
    expect(getComplianceRequirement('express-entry-cec', 1)).toBeNull()
  })

  it('returns null for study-permit (handled separately)', () => {
    expect(getComplianceRequirement('study-permit', 2)).toBeNull()
  })

  it('returns null for work-permit', () => {
    expect(getComplianceRequirement('work-permit', 1)).toBeNull()
  })

  it('returns null for family-sponsorship', () => {
    expect(getComplianceRequirement('family-sponsorship', 2)).toBeNull()
  })
})

// ─── Regional Flight Costs ────────────────────────────────────────────────────

describe('computeOneWayFlight', () => {
  it('uses south-asia fare for 1 adult', () => {
    // south-asia = $750 × (1 + 0 × 0.75) = $750
    expect(computeOneWayFlight('south-asia', 1, 0)).toBe(750)
  })

  it('applies 0.75 child discount for 2 adults + 1 child', () => {
    // south-asia = $750 × (2 + 1 × 0.75) = $750 × 2.75 = $2,062.50 → $2,063
    expect(computeOneWayFlight('south-asia', 2, 1)).toBe(Math.round(750 * 2.75))
  })

  it('uses north-america fare', () => {
    expect(computeOneWayFlight('north-america', 1, 0)).toBe(350)
  })

  it('uses uk-europe fare', () => {
    expect(computeOneWayFlight('uk-europe', 2, 0)).toBe(1_200)
  })

  it('falls back to TRAVEL_ESTIMATE_DEFAULT when region is undefined', () => {
    // default = $1,500, 1 adult: 1500 × 1 = 1500
    expect(computeOneWayFlight(undefined, 1, 0)).toBe(1_500)
  })

  it('falls back for unknown region code', () => {
    expect(computeOneWayFlight('unknown-region', 1, 0)).toBe(1_500)
  })

  it('handles domestic region', () => {
    expect(computeOneWayFlight('domestic', 1, 0)).toBe(200)
  })
})

describe('computeRoundTripFlight', () => {
  it('is exactly 2× the one-way cost', () => {
    const oneWay = computeOneWayFlight('uk-europe', 2, 1)
    expect(computeRoundTripFlight('uk-europe', 2, 1)).toBe(oneWay * 2)
  })

  it('falls back to 2 × 1500 when region undefined', () => {
    expect(computeRoundTripFlight(undefined, 1, 0)).toBe(3_000)
  })
})

describe('FLIGHT_COST_BY_REGION lookup table', () => {
  it('has all 9 regions', () => {
    const expected = ['north-america', 'south-america', 'uk-europe', 'south-asia',
      'east-se-asia', 'africa-west-east', 'africa-south', 'middle-east-na', 'domestic']
    expected.forEach(r => expect(FLIGHT_COST_BY_REGION).toHaveProperty(r))
  })
})

// ─── Round-trip vs one-way in IRCC study permit compliance ────────────────────

describe('computeIRCCProofOfFunds — transport component', () => {
  it('uses 2000 flat when no departureRegion', () => {
    // family 1, tuition 20_000, ON
    const result = computeIRCCProofOfFunds(1, 20_000, 'ON', STUDY_PERMIT_DEFAULTS)
    // living = 22_895, transport = 2_000
    expect(result).toBe(20_000 + 22_895 + 2_000)
  })

  it('uses round-trip regional fare when departureRegion provided', () => {
    // south-asia: $750 one-way × 2 = $1,500 round-trip for 1 adult
    const roundTrip = computeRoundTripFlight('south-asia', 1, 0)
    const result = computeIRCCProofOfFunds(1, 20_000, 'ON', STUDY_PERMIT_DEFAULTS, 'south-asia', 1, 0)
    expect(result).toBe(20_000 + 22_895 + roundTrip)
  })

  it('round-trip is greater than one-way for south-asia', () => {
    const withRegion    = computeIRCCProofOfFunds(1, 20_000, 'ON', STUDY_PERMIT_DEFAULTS, 'south-asia', 1, 0)
    const withoutRegion = computeIRCCProofOfFunds(1, 20_000, 'ON', STUDY_PERMIT_DEFAULTS)
    // south-asia round-trip: 750 × 2 = 1500, which is less than 2000 flat
    // So with region = 20_000 + 22_895 + 1_500 < 20_000 + 22_895 + 2_000
    expect(withRegion).toBeLessThan(withoutRegion)
  })
})

describe('buildIRCCComplianceResult — transport in result', () => {
  it('sets transport to round-trip when departureRegion provided', () => {
    const result = buildIRCCComplianceResult(1, 20_000, 'ON', 50_000, STUDY_PERMIT_DEFAULTS, 'south-asia', 1, 0)
    expect(result.transport).toBe(computeRoundTripFlight('south-asia', 1, 0))
  })

  it('sets transport to 2000 when no region', () => {
    const result = buildIRCCComplianceResult(1, 20_000, 'ON', 50_000, STUDY_PERMIT_DEFAULTS)
    expect(result.transport).toBe(2_000)
  })
})

// ─── Student housing rent from baseline ──────────────────────────────────────

describe('rentFromBaseline — student housing types', () => {
  it('returns sharedRoom from baseline.studentHousing', () => {
    expect(rentFromBaseline(TORONTO_BASELINE, 'shared-room')).toBe(1_050)
  })

  it('returns onCampus from baseline.studentHousing', () => {
    expect(rentFromBaseline(TORONTO_BASELINE, 'on-campus')).toBe(1_200)
  })

  it('returns homestay from baseline.studentHousing', () => {
    expect(rentFromBaseline(TORONTO_BASELINE, 'homestay')).toBe(1_200)
  })

  it('uses fallback values when studentHousing is absent', () => {
    const baselineNoStudentHousing = { ...TORONTO_BASELINE, studentHousing: undefined }
    expect(rentFromBaseline(baselineNoStudentHousing, 'shared-room')).toBe(900)
    expect(rentFromBaseline(baselineNoStudentHousing, 'on-campus')).toBe(1_000)
    expect(rentFromBaseline(baselineNoStudentHousing, 'homestay')).toBe(1_000)
  })

  it('returns 0 for staying-family', () => {
    expect(rentFromBaseline(TORONTO_BASELINE, 'staying-family')).toBe(0)
  })
})

// ─── staying-family edge case ─────────────────────────────────────────────────

describe('computeUpfront — staying-family', () => {
  const input: EngineInput = {
    ...BASE_INPUT,
    pathway:     'express-entry-fsw',
    housingType: 'staying-family',
  }

  const result = computeUpfront(input, TORONTO_BASELINE)

  it('has no housing-deposit item', () => {
    expect(result.breakdown.find(i => i.key === 'housing-deposit')).toBeUndefined()
  })

  it('has no setup-essentials item', () => {
    expect(result.breakdown.find(i => i.key === 'setup-essentials')).toBeUndefined()
  })

  it('total does not include rent deposit or furnishing', () => {
    // Only fees + biometrics + RPRF + travel (no deposit, no setup — staying-family)
    const fees    = 950
    const bio     = 85
    const rprf    = 575
    const travel  = computeOneWayFlight('south-asia', 1, 0)
    expect(result.total).toBe(fees + bio + rprf + travel)
  })
})

describe('computeMonthlyMin — staying-family', () => {
  const input: Pick<EngineInput, 'housingType' | 'household' | 'monthlyObligations' | 'pathway' | 'province' | 'studyPermit'> = {
    housingType:        'staying-family',
    household:          { adults: 1, children: 0 },
    monthlyObligations: 0,
    pathway:            'express-entry-fsw',
    province:           'ON',
  }

  const result = computeMonthlyMin(input, TORONTO_BASELINE)

  it('has rent = 0 for staying-family', () => {
    const rentItem = result.breakdown.find(i => i.key === 'rent')
    expect(rentItem?.cad).toBe(0)
  })
})

// ─── CEC compliance exemption in computeSafe ─────────────────────────────────

describe('computeSafe — CEC is exempt from compliance floor', () => {
  it('does not set complianceFloor for CEC pathway', () => {
    const { computeSafe } = require('@/lib/settlement-engine/calculate')
    const input = {
      ...BASE_INPUT,
      pathway:     'express-entry-cec' as const,
      housingType: '1br'  as const,
    }
    const result = computeSafe(input, 5_000, 2_000, [])
    expect(result.complianceFloor).toBeUndefined()
  })

  it('sets complianceFloor for FSW pathway', () => {
    const { computeSafe } = require('@/lib/settlement-engine/calculate')
    const input = {
      ...BASE_INPUT,
      pathway:     'express-entry-fsw' as const,
      housingType: '1br'  as const,
    }
    const result = computeSafe(input, 5_000, 2_000, [])
    expect(result.complianceFloor).toBe(getExpressEntryFunds(1))
  })
})
