/**
 * Settlement Checklist Engine — Unit Tests (US-19.4)
 *
 * AC-1  No item key appears in more than one period
 * AC-2  Each period has ≤ 7 items; overflow goes to additionalSteps
 * AC-3  TFSA/RRSP items are conditional on income > 0 OR savings > $5,000
 * AC-4  SIN and bank-account appear in correct periods (first-week / pre-arrival)
 * AC-5  Study-permit-specific items appear in correct periods; duplicate keys
 *        (sin, bank-account, transit-card) are removed by the dedup pass
 */

import { generateChecklist, type Checklist } from '@/lib/settlement-engine/checklist'
import type { Risk } from '@/lib/settlement-engine/risks'

// ─── Shared helpers ───────────────────────────────────────────────────────────

const NO_RISKS: Risk[] = []

function allKeys(checklist: Checklist): string[] {
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

function keysForPeriod(checklist: Checklist, period: keyof Checklist): string[] {
  return [
    ...checklist[period].items,
    ...checklist[period].additionalSteps,
  ].map(it => it.key)
}

// ─── Fixture inputs ───────────────────────────────────────────────────────────

const EE_TORONTO = {
  pathway:  'express_entry',
  province: 'ON',
  city:     'toronto',
  income:   0,
  savings:  18_000,
} as const

const SP_VANCOUVER_QC = {
  pathway:  'study_permit',
  province: 'QC',
  city:     'montreal',
  gicStatus: 'planning',
  income:   0,
  savings:  45_000,
} as const

const SP_BC = {
  pathway:  'study_permit',
  province: 'BC',
  city:     'vancouver',
  gicStatus: null,
  income:   0,
  savings:  10_000,
} as const

const ZERO_SAVINGS_NO_INCOME = {
  pathway:  'express_entry',
  province: 'ON',
  city:     'toronto',
  income:   0,
  savings:  0,
} as const

// ─── AC-1: No key appears in more than one period ─────────────────────────────

describe('AC-1 — Deduplication: no key in more than one period', () => {
  test('express entry — no duplicate keys', () => {
    const cl = generateChecklist(EE_TORONTO, NO_RISKS)
    const keys = allKeys(cl)
    const unique = new Set(keys)
    expect(keys.length).toBe(unique.size)
  })

  test('study permit QC — no duplicate keys (sin, bank-account, transit-card deduped)', () => {
    const cl = generateChecklist(SP_VANCOUVER_QC, NO_RISKS)
    const keys = allKeys(cl)
    const unique = new Set(keys)
    expect(keys.length).toBe(unique.size)
  })

  test('study permit BC — no duplicate keys', () => {
    const cl = generateChecklist(SP_BC, NO_RISKS)
    const keys = allKeys(cl)
    const unique = new Set(keys)
    expect(keys.length).toBe(unique.size)
  })

  test('work permit — no duplicate keys', () => {
    const cl = generateChecklist({ pathway: 'work_permit', province: 'AB', city: 'calgary', income: 4_000, savings: 12_000 }, NO_RISKS)
    const keys = allKeys(cl)
    const unique = new Set(keys)
    expect(keys.length).toBe(unique.size)
  })

  test('family — no duplicate keys', () => {
    const cl = generateChecklist({ pathway: 'family', province: 'BC', city: 'vancouver', income: 3_000, savings: 8_000 }, NO_RISKS)
    const keys = allKeys(cl)
    const unique = new Set(keys)
    expect(keys.length).toBe(unique.size)
  })
})

// ─── AC-2: Each period ≤ 7 items; overflow in additionalSteps ─────────────────

describe('AC-2 — Capping: each period ≤ 7 items, overflow in additionalSteps', () => {
  test('express entry Toronto — all periods ≤ 7 items', () => {
    const cl = generateChecklist(EE_TORONTO, NO_RISKS)
    expect(cl.preArrival.items.length).toBeLessThanOrEqual(7)
    expect(cl.firstWeek.items.length).toBeLessThanOrEqual(7)
    expect(cl.first30.items.length).toBeLessThanOrEqual(7)
    expect(cl.first90.items.length).toBeLessThanOrEqual(7)
  })

  test('study permit QC (many pre-arrival items) — preArrival ≤ 7', () => {
    const cl = generateChecklist(SP_VANCOUVER_QC, NO_RISKS)
    expect(cl.preArrival.items.length).toBeLessThanOrEqual(7)
    // Excess items move to additionalSteps
    if (cl.preArrival.additionalSteps.length > 0) {
      // Verify additionalSteps items have lower priority than the top 7
      const worstPrimaryPriority = Math.max(...cl.preArrival.items.map(i => i.priority))
      const bestOverflowPriority = Math.min(...cl.preArrival.additionalSteps.map(i => i.priority))
      expect(bestOverflowPriority).toBeGreaterThanOrEqual(worstPrimaryPriority)
    }
  })

  test('all periods: items sorted by priority (ascending)', () => {
    const cl = generateChecklist(EE_TORONTO, NO_RISKS)
    for (const period of [cl.preArrival, cl.firstWeek, cl.first30, cl.first90]) {
      for (let i = 1; i < period.items.length; i++) {
        expect(period.items[i].priority).toBeGreaterThanOrEqual(period.items[i - 1].priority)
      }
    }
  })

  test('with housing risk — additional risk items still ≤ 7 per period', () => {
    const risks: Risk[] = [
      { id: 'housingBurden',      severity: 'high',   label: 'Housing burden',   description: '', primaryAction: '', articleSlug: null },
      { id: 'incomeUncertainty',  severity: 'high',   label: 'Income',           description: '', primaryAction: '', articleSlug: null },
      { id: 'largeSavingsGap',    severity: 'medium', label: 'Savings gap',      description: '', primaryAction: '', articleSlug: null },
    ]
    const cl = generateChecklist(EE_TORONTO, risks)
    expect(cl.preArrival.items.length).toBeLessThanOrEqual(7)
    expect(cl.firstWeek.items.length).toBeLessThanOrEqual(7)
    expect(cl.first30.items.length).toBeLessThanOrEqual(7)
    expect(cl.first90.items.length).toBeLessThanOrEqual(7)
  })
})

// ─── AC-3: TFSA/RRSP conditional ─────────────────────────────────────────────

describe('AC-3 — TFSA/RRSP conditional', () => {
  test('suppressed when income = 0 AND savings = 0', () => {
    const cl = generateChecklist(ZERO_SAVINGS_NO_INCOME, NO_RISKS)
    const all = allKeys(cl)
    expect(all).not.toContain('tfsa-open')
    expect(all).not.toContain('tfsa-rrsp-compare')
  })

  test('suppressed when income = 0 AND savings ≤ $5,000', () => {
    const cl = generateChecklist({ ...EE_TORONTO, income: 0, savings: 5_000 }, NO_RISKS)
    const all = allKeys(cl)
    expect(all).not.toContain('tfsa-open')
    expect(all).not.toContain('tfsa-rrsp-compare')
  })

  test('shown when savings > $5,000 (even with no income)', () => {
    const cl = generateChecklist({ ...EE_TORONTO, income: 0, savings: 5_001 }, NO_RISKS)
    const all = allKeys(cl)
    expect(all).toContain('tfsa-open')
    expect(all).toContain('tfsa-rrsp-compare')
  })

  test('shown when income > 0 (even with low savings)', () => {
    const cl = generateChecklist({ ...ZERO_SAVINGS_NO_INCOME, income: 1 }, NO_RISKS)
    const all = allKeys(cl)
    expect(all).toContain('tfsa-open')
    expect(all).toContain('tfsa-rrsp-compare')
  })

  test('when shown, TFSA items appear in first90 period', () => {
    const cl = generateChecklist(EE_TORONTO, NO_RISKS)
    const f90Keys = keysForPeriod(cl, 'first90')
    expect(f90Keys).toContain('tfsa-open')
    expect(f90Keys).toContain('tfsa-rrsp-compare')
  })
})

// ─── AC-4: SIN and bank-account in correct periods ───────────────────────────

describe('AC-4 — Core items in correct periods', () => {
  test('EE: sin appears in firstWeek (not preArrival)', () => {
    const cl = generateChecklist(EE_TORONTO, NO_RISKS)
    const preKeys = keysForPeriod(cl, 'preArrival')
    const weekKeys = keysForPeriod(cl, 'firstWeek')
    expect(preKeys).not.toContain('sin')
    expect(weekKeys).toContain('sin')
  })

  test('EE: bank-account appears in preArrival (not firstWeek)', () => {
    const cl = generateChecklist(EE_TORONTO, NO_RISKS)
    const preKeys = keysForPeriod(cl, 'preArrival')
    const weekKeys = keysForPeriod(cl, 'firstWeek')
    expect(preKeys).toContain('bank-account')
    expect(weekKeys).not.toContain('bank-account')
  })

  test('EE: transit-card appears in firstWeek (not preArrival)', () => {
    const cl = generateChecklist(EE_TORONTO, NO_RISKS)
    const preKeys = keysForPeriod(cl, 'preArrival')
    const weekKeys = keysForPeriod(cl, 'firstWeek')
    expect(preKeys).not.toContain('transit-card')
    expect(weekKeys).toContain('transit-card')
  })

  test('EE: COPR landing item in firstWeek', () => {
    const cl = generateChecklist(EE_TORONTO, NO_RISKS)
    const weekKeys = keysForPeriod(cl, 'firstWeek')
    expect(weekKeys).toContain('copr-landing')
  })

  test('EE: PR card application in first30', () => {
    const cl = generateChecklist(EE_TORONTO, NO_RISKS)
    const f30Keys = keysForPeriod(cl, 'first30')
    expect(f30Keys).toContain('pr-card')
  })
})

// ─── AC-5: Study permit items in correct periods ──────────────────────────────

describe('AC-5 — Study permit specific items', () => {
  test('DLI acceptance letter in preArrival', () => {
    const cl = generateChecklist(SP_BC, NO_RISKS)
    const preKeys = keysForPeriod(cl, 'preArrival')
    expect(preKeys).toContain('dli-letter')
  })

  test('study permit application in preArrival', () => {
    const cl = generateChecklist(SP_BC, NO_RISKS)
    const preKeys = keysForPeriod(cl, 'preArrival')
    expect(preKeys).toContain('study-permit-app')
  })

  test('GIC purchase item present when gicStatus is planning', () => {
    const cl = generateChecklist({ ...SP_BC, gicStatus: 'planning' }, NO_RISKS)
    const preKeys = keysForPeriod(cl, 'preArrival')
    expect(preKeys).toContain('gic-purchase')
  })

  test('GIC purchase item absent when gicStatus is purchased', () => {
    const cl = generateChecklist({ ...SP_BC, gicStatus: 'purchased' }, NO_RISKS)
    const preKeys = keysForPeriod(cl, 'preArrival')
    expect(preKeys).not.toContain('gic-purchase')
  })

  test('GIC activate item in firstWeek when gicStatus is purchased', () => {
    const cl = generateChecklist({ ...SP_BC, gicStatus: 'purchased' }, NO_RISKS)
    const weekKeys = keysForPeriod(cl, 'firstWeek')
    expect(weekKeys).toContain('gic-activate')
  })

  test('CAQ item in preArrival for Quebec study permit', () => {
    const cl = generateChecklist(SP_VANCOUVER_QC, NO_RISKS)
    const preKeys = keysForPeriod(cl, 'preArrival')
    expect(preKeys).toContain('caq')
  })

  test('CAQ item NOT present for non-Quebec study permit', () => {
    const cl = generateChecklist(SP_BC, NO_RISKS)
    const all = allKeys(cl)
    expect(all).not.toContain('caq')
  })

  test('SP: sin appears exactly once across all periods (dedup removes SP duplicate)', () => {
    const cl = generateChecklist(SP_BC, NO_RISKS)
    const keys = allKeys(cl)
    const sinOccurrences = keys.filter(k => k === 'sin').length
    expect(sinOccurrences).toBe(1)
  })

  test('SP: bank-account appears exactly once across all periods', () => {
    const cl = generateChecklist(SP_BC, NO_RISKS)
    const keys = allKeys(cl)
    const bankOccurrences = keys.filter(k => k === 'bank-account').length
    expect(bankOccurrences).toBe(1)
  })

  test('SP: transit-card appears exactly once across all periods', () => {
    const cl = generateChecklist(SP_BC, NO_RISKS)
    const keys = allKeys(cl)
    const transitOccurrences = keys.filter(k => k === 'transit-card').length
    expect(transitOccurrences).toBe(1)
  })

  test('SP: work-hour limits item in first30', () => {
    const cl = generateChecklist(SP_BC, NO_RISKS)
    const f30Keys = keysForPeriod(cl, 'first30')
    expect(f30Keys).toContain('sp-work-hours')
  })
})

// ─── Risk-driven items ────────────────────────────────────────────────────────

describe('Risk-driven items', () => {
  test('shared-housing-risk item added when housingBurden risk active', () => {
    const risks: Risk[] = [
      { id: 'housingBurden', severity: 'high', label: 'Housing', description: '', primaryAction: '', articleSlug: null },
    ]
    const cl = generateChecklist(EE_TORONTO, risks)
    const all = allKeys(cl)
    expect(all).toContain('shared-housing-risk')
  })

  test('job-search-risk item added when incomeUncertainty risk active', () => {
    const risks: Risk[] = [
      { id: 'incomeUncertainty', severity: 'high', label: 'Income', description: '', primaryAction: '', articleSlug: null },
    ]
    const cl = generateChecklist(EE_TORONTO, risks)
    const all = allKeys(cl)
    expect(all).toContain('job-search-risk')
  })

  test('savings-gap item added when largeSavingsGap risk active', () => {
    const risks: Risk[] = [
      { id: 'largeSavingsGap', severity: 'high', label: 'Gap', description: '', primaryAction: '', articleSlug: null },
    ]
    const cl = generateChecklist(EE_TORONTO, risks)
    const all = allKeys(cl)
    expect(all).toContain('savings-gap')
  })

  test('caq dedup: quebecComplexity risk does not double-add caq for QC study permit', () => {
    const risks: Risk[] = [
      { id: 'quebecComplexity', severity: 'medium', label: 'QC', description: '', primaryAction: '', articleSlug: null },
    ]
    const cl = generateChecklist(SP_VANCOUVER_QC, risks)
    const keys = allKeys(cl)
    const caqOccurrences = keys.filter(k => k === 'caq').length
    expect(caqOccurrences).toBe(1)
  })
})
