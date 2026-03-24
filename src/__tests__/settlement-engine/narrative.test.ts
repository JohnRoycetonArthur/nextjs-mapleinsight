/**
 * Unit tests — Narrative Intelligence Layer (R4)
 *
 * Covers:
 * 1.  generateVerdict — compliance gap present ($48K shortfall)
 * 2.  generateVerdict — compliant ($70K vs $66K IRCC)
 * 3.  computeTimeToDepletion — $18K / $3,086/month → 5.8 months, 'limited'
 * 4.  computeTimeToDepletion — $0 monthly expenses → Infinity
 * 5.  getPriorityAction — compliance gap present → 'close-compliance-gap'
 * 6.  getPriorityAction — compliant but savings gap → 'increase-savings' (not IRCC)
 * 7.  generateTimelineGuidance — gap $12K, capacity $3K/month → "wait 4 months" item
 * 8.  modelIncomeScenarios — $18K, $3,086/mo, $4,200 income
 *       Best (month 2): month 12 balance > 0
 *       Worst (no income): depletion at month 6
 * 9.  modelIncomeScenarios — study-permit uses $1,369 part-time, not full income
 */

import {
  generateVerdict,
  computeTimeToDepletion,
  getPriorityAction,
  generateTimelineGuidance,
  modelIncomeScenarios,
  STUDENT_PART_TIME_MONTHLY,
} from '@/lib/settlement-engine/narrative'

// ─── 1. generateVerdict — compliance gap ──────────────────────────────────────

describe('generateVerdict', () => {
  it('returns "not ready" with exact shortfall when compliance gap > 0', () => {
    // $18K savings, $66K IRCC requirement → gap = $48K
    const result = generateVerdict(0, 48_000, false)
    expect(result).toContain('not financially ready')
    expect(result).toContain('$48,000')
  })

  it('says "meet IRCC" when compliance gap is 0 ($70K vs $66K)', () => {
    // $70K savings, $66K IRCC → compliant; assume real-world gap = 0
    const result = generateVerdict(0, 0, false)
    expect(result).toContain("meet IRCC")
  })

  it('mentions real-world shortfall when compliant but savings gap exists', () => {
    const result = generateVerdict(5_000, 0, false)
    expect(result).toContain("meet IRCC")
    expect(result).toContain("$5,000")
  })

  it('uses non-IRCC language when pathway is exempt with a gap', () => {
    const result = generateVerdict(8_000, null, true)
    expect(result).toContain('not financially ready')
    expect(result).toContain('$8,000')
    expect(result).not.toContain('IRCC')
  })

  it('returns positive message when exempt and no gap', () => {
    const result = generateVerdict(0, null, true)
    expect(result).toContain('financially ready')
  })
})

// ─── 2 & 3. computeTimeToDepletion ───────────────────────────────────────────

describe('computeTimeToDepletion', () => {
  it('returns 5.83 months and severity "limited" for $18K / $3,086', () => {
    const result = computeTimeToDepletion(18_000, 3_086)
    expect(result.months).toBeCloseTo(5.83, 1)
    expect(result.severity).toBe('limited')
    expect(result.label).toContain('5.8')
  })

  it('returns Infinity when monthlyMin = 0 (staying with family / no expenses)', () => {
    const result = computeTimeToDepletion(18_000, 0)
    expect(result.months).toBe(Infinity)
    expect(result.severity).toBe('strong')
    expect(result.label).toContain('minimal')
  })

  it('returns severity "critical" when < 3 months', () => {
    const result = computeTimeToDepletion(5_000, 3_000)
    expect(result.severity).toBe('critical')
  })

  it('returns severity "reasonable" for 6–12 months', () => {
    const result = computeTimeToDepletion(24_000, 3_000)
    // 8 months
    expect(result.severity).toBe('reasonable')
  })

  it('returns severity "strong" for 12+ months', () => {
    const result = computeTimeToDepletion(40_000, 3_000)
    // 13.3 months
    expect(result.severity).toBe('strong')
  })
})

// ─── 5 & 6. getPriorityAction ────────────────────────────────────────────────

describe('getPriorityAction', () => {
  const baseInputs = {
    liquidSavings: 18_000,
    monthlyMin:    3_086,
    savingsGap:    8_000,
    monthlyIncome: 4_200,
    runwayMonths:  6,
  }
  const baseResults = { safeSavingsTarget: 26_000, upfront: 10_000 }

  it('returns close-compliance-gap when compliance gap > 0', () => {
    const action = getPriorityAction(
      baseInputs,
      baseResults,
      { required: 66_000, gap: 48_000, isExempt: false },
    )
    expect(action.id).toBe('close-compliance-gap')
    expect(action.urgency).toBe('critical')
    expect(action.description).toContain('$48,000')
  })

  it('returns increase-savings (not IRCC) when compliant but savings gap > 0', () => {
    const action = getPriorityAction(
      { ...baseInputs, savingsGap: 5_000 },
      baseResults,
      { required: 66_000, gap: 0, isExempt: false },
    )
    expect(action.id).toBe('increase-savings')
    expect(action.urgency).toBe('high')
    expect(action.description).not.toContain('proof-of-funds')
  })

  it('returns focus-logistics when fully ready', () => {
    const action = getPriorityAction(
      { ...baseInputs, savingsGap: 0, liquidSavings: 80_000 },
      baseResults,
      { required: 66_000, gap: 0, isExempt: false },
    )
    expect(action.id).toBe('focus-logistics')
    expect(action.urgency).toBe('low')
  })

  it('returns critical for no-income + very short runway', () => {
    const action = getPriorityAction(
      { ...baseInputs, monthlyIncome: 0, liquidSavings: 5_000 },
      baseResults,
      { required: null, gap: 0, isExempt: true },
    )
    // 5000 / 3086 = 1.6 months → critical
    expect(action.id).toBe('secure-income-or-savings')
    expect(action.urgency).toBe('critical')
  })
})

// ─── 7. generateTimelineGuidance ─────────────────────────────────────────────

describe('generateTimelineGuidance', () => {
  it('always includes "move today" item', () => {
    const items = generateTimelineGuidance(
      { liquidSavings: 18_000, savingsCapacity: 0, savingsGap: 0, complianceGap: 0, isStudyPermit: false },
      { monthlyMin: 3_086, safeSavingsTarget: 18_000 },
    )
    expect(items[0].id).toBe('move-today')
  })

  it('adds "wait X months" when gap=$12K and capacity=$3K → wait 4 months', () => {
    const items = generateTimelineGuidance(
      { liquidSavings: 18_000, savingsCapacity: 3_000, savingsGap: 12_000, complianceGap: 0, isStudyPermit: false },
      { monthlyMin: 3_086, safeSavingsTarget: 30_000 },
    )
    const waitItem = items.find(i => i.id === 'wait-x-months')
    expect(waitItem).toBeDefined()
    expect(waitItem?.label).toContain('4 month')
  })

  it('adds defer-intake item for study permit with a gap', () => {
    const items = generateTimelineGuidance(
      { liquidSavings: 18_000, savingsCapacity: 2_000, savingsGap: 10_000, complianceGap: 0, isStudyPermit: true },
      { monthlyMin: 3_086, safeSavingsTarget: 28_000 },
    )
    expect(items.some(i => i.id === 'defer-intake')).toBe(true)
  })

  it('does NOT add defer-intake for non-student', () => {
    const items = generateTimelineGuidance(
      { liquidSavings: 18_000, savingsCapacity: 2_000, savingsGap: 10_000, complianceGap: 0, isStudyPermit: false },
      { monthlyMin: 3_086, safeSavingsTarget: 28_000 },
    )
    expect(items.some(i => i.id === 'defer-intake')).toBe(false)
  })

  it('assigns low risk when no gap', () => {
    const items = generateTimelineGuidance(
      { liquidSavings: 40_000, savingsCapacity: 3_000, savingsGap: 0, complianceGap: 0, isStudyPermit: false },
      { monthlyMin: 3_086, safeSavingsTarget: 30_000 },
    )
    expect(items[0].riskLevel).toBe('low')
  })
})

// ─── 8 & 9. modelIncomeScenarios ─────────────────────────────────────────────

describe('modelIncomeScenarios', () => {
  const savings  = 18_000
  const expenses = 3_086
  const income   = 4_200

  describe('non-student pathway', () => {
    const scenarios = modelIncomeScenarios(savings, expenses, income, 'express-entry-fsw')

    it('best case: income starts month 2, balance > 0 at month 12', () => {
      expect(scenarios.best.incomeStartMonth).toBe(2)
      expect(scenarios.best.monthlyIncome).toBe(income)
      expect(scenarios.best.savingsAtMonth12).not.toBeNull()
      expect(scenarios.best.savingsAtMonth12!).toBeGreaterThan(0)
    })

    it('expected case: income starts month 4', () => {
      expect(scenarios.expected.incomeStartMonth).toBe(4)
      expect(scenarios.expected.monthlyIncome).toBe(income)
    })

    it('worst case: no income, depletes around month 5–6', () => {
      expect(scenarios.worst.monthlyIncome).toBe(0)
      // $18K / $3,086 ≈ 5.83 → should deplete at month 6
      expect(scenarios.worst.depletionMonth).toBe(6)
    })

    it('worst case balanceByMonth length is 13 (index 0..12)', () => {
      expect(scenarios.worst.balanceByMonth).toHaveLength(13)
    })

    it('worst case starting balance equals savings', () => {
      expect(scenarios.worst.balanceByMonth[0]).toBe(savings)
    })
  })

  describe('study-permit pathway', () => {
    const studentScenarios = modelIncomeScenarios(savings, expenses, income, 'study-permit')

    it('uses STUDENT_PART_TIME_MONTHLY ($1,369) not full income', () => {
      expect(studentScenarios.best.monthlyIncome).toBe(STUDENT_PART_TIME_MONTHLY)
      expect(studentScenarios.best.monthlyIncome).toBe(1_369)
      // Must NOT equal the full $4,200 income
      expect(studentScenarios.best.monthlyIncome).not.toBe(income)
    })

    it('best case: income starts month 1', () => {
      expect(studentScenarios.best.incomeStartMonth).toBe(1)
    })

    it('expected case: income starts month 2', () => {
      expect(studentScenarios.expected.incomeStartMonth).toBe(2)
    })

    it('worst case: no income', () => {
      expect(studentScenarios.worst.monthlyIncome).toBe(0)
    })

    it('student worst case also depletes ~month 6 (same expenses)', () => {
      expect(studentScenarios.worst.depletionMonth).toBe(6)
    })
  })
})
