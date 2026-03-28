/**
 * Unit tests — US-20.2: Funds Composition & Encumbrance Flags
 *
 * Tests the `borrowedFunds` risk rule:
 *   AC-3: borrowed > 0 + EE pathway → HIGH risk "Possible non-qualifying funds"
 */

import { borrowedFunds } from '@/lib/settlement-engine/risks'
import type { RiskContext } from '@/lib/settlement-engine/risks'
import type { EngineInput, EngineOutput } from '@/lib/settlement-engine/types'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const BASE_INPUT: EngineInput = {
  city:                  'toronto',
  province:              'ON',
  pathway:               'express-entry-fsw',
  fees:                  { applicationFee: 1_365, biometricsFee: 85, biometricsPaid: false },
  housingType:           '1br',
  furnishingLevel:       'basic',
  household:             { adults: 1, children: 0 },
  needsChildcare:        false,
  liquidSavings:         20_000,
  monthlyObligations:    0,
  plansCar:              false,
  customMonthlyExpenses: 0,
  jobStatus:             'secured',
}

const BASE_OUTPUT: EngineOutput = {
  upfront:           8_000,
  monthlyMin:        2_500,
  monthlySafe:       3_000,
  safeSavingsTarget: 18_000,
  savingsGap:        0,
  runwayMonths:      6,
  bufferPercent:     20,
  engineVersion:     '1.0.0',
  dataVersion:       '2025-10',
  upfrontBreakdown:  [],
  monthlyBreakdown:  [{ key: 'rent', label: 'Rent', cad: 1_761, source: 'CMHC' }],
  baselineFallback:  false,
}

function ctx(
  inputOverrides: Partial<EngineInput> = {},
  outputOverrides: Partial<EngineOutput> = {},
): RiskContext {
  return {
    input:         { ...BASE_INPUT, ...inputOverrides },
    output:        { ...BASE_OUTPUT, ...outputOverrides },
    monthlyIncome: 5_000,
  }
}

// ─── borrowedFunds rule ────────────────────────────────────────────────────────

describe('borrowedFunds (AC-3)', () => {
  it('fires HIGH when borrowed > 0 on express-entry-fsw pathway', () => {
    const risk = borrowedFunds.evaluate(ctx({
      fundsComposition: { borrowed: 5_000, gifted: 0 },
    }))
    expect(risk).not.toBeNull()
    expect(risk!.id).toBe('borrowedFunds')
    expect(risk!.severity).toBe('high')
    expect(risk!.title).toBe('Possible non-qualifying funds')
  })

  it('fires HIGH when borrowed > 0 on express-entry-cec pathway', () => {
    const risk = borrowedFunds.evaluate(ctx({
      pathway:          'express-entry-cec',
      fundsComposition: { borrowed: 3_000, gifted: 0 },
    }))
    expect(risk).not.toBeNull()
    expect(risk!.severity).toBe('high')
  })

  it('fires HIGH when borrowed > 0 on express-entry-fstp pathway', () => {
    const risk = borrowedFunds.evaluate(ctx({
      pathway:          'express-entry-fstp',
      fundsComposition: { borrowed: 1, gifted: 0 },
    }))
    expect(risk).not.toBeNull()
    expect(risk!.severity).toBe('high')
  })

  it('does NOT fire when borrowed = 0 (even on EE pathway)', () => {
    const risk = borrowedFunds.evaluate(ctx({
      fundsComposition: { borrowed: 0, gifted: 3_000 },
    }))
    expect(risk).toBeNull()
  })

  it('does NOT fire when fundsComposition is absent', () => {
    const risk = borrowedFunds.evaluate(ctx({
      fundsComposition: undefined,
    }))
    expect(risk).toBeNull()
  })

  it('does NOT fire on study-permit pathway even when borrowed > 0', () => {
    const risk = borrowedFunds.evaluate(ctx({
      pathway:          'study-permit',
      fundsComposition: { borrowed: 5_000, gifted: 0 },
    }))
    expect(risk).toBeNull()
  })

  it('does NOT fire on work-permit pathway even when borrowed > 0', () => {
    const risk = borrowedFunds.evaluate(ctx({
      pathway:          'work-permit',
      fundsComposition: { borrowed: 5_000, gifted: 0 },
    }))
    expect(risk).toBeNull()
  })

  it('does NOT fire on pnp pathway (not express-entry prefix)', () => {
    const risk = borrowedFunds.evaluate(ctx({
      pathway:          'pnp',
      fundsComposition: { borrowed: 5_000, gifted: 0 },
    }))
    expect(risk).toBeNull()
  })

  it('description references IRCC and the borrowed amount', () => {
    const risk = borrowedFunds.evaluate(ctx({
      fundsComposition: { borrowed: 5_000, gifted: 0 },
    }))
    expect(risk!.description).toContain('IRCC')
    expect(risk!.description).toContain('$5,000')
  })

  it('includes an action with an IRCC link', () => {
    const risk = borrowedFunds.evaluate(ctx({
      fundsComposition: { borrowed: 5_000, gifted: 0 },
    }))
    expect(risk!.actions).toHaveLength(1)
    expect(risk!.actions[0].link).toContain('canada.ca')
  })
})
