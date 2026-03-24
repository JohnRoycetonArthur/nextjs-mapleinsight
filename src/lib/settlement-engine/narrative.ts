/**
 * Settlement Planner — Narrative Intelligence Layer (R4)
 *
 * Pure functions that generate human-readable verdicts, timeline guidance,
 * depletion analysis, priority actions, and cash-flow scenario models.
 *
 * Used by:
 *  - ResultsDashboard (Zone A + Zone B)
 *  - Consultant Report (US-13.4)
 *  - .maple.json export (US-13.2, `narrative` top-level key)
 *
 * No side effects. No network calls. All inputs must be pre-computed.
 */

// ─── Internal formatter ───────────────────────────────────────────────────────

function fmt(n: number): string {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    maximumFractionDigits: 0,
  }).format(Math.abs(n))
}

// ─── Public types ─────────────────────────────────────────────────────────────

export type DepletionSeverity = 'critical' | 'limited' | 'reasonable' | 'strong'

export interface DepletionResult {
  /** Raw months until depletion. Infinity when monthlyMin = 0. */
  months:   number
  severity: DepletionSeverity
  label:    string
}

export type ActionUrgency = 'critical' | 'high' | 'medium' | 'low'

export interface PriorityAction {
  id:          string
  urgency:     ActionUrgency
  title:       string
  description: string
}

export type RiskLevel = 'high' | 'medium' | 'low'

export interface TimelineItem {
  id:          string
  /** Short display label, e.g. "If you move today." */
  label:       string
  riskLevel:   RiskLevel
  /** Uppercase display variant for badge rendering */
  riskLabel:   'HIGH' | 'MEDIUM' | 'LOW'
  description: string
}

export interface ScenarioRun {
  label:            string  // "Best case" | "Expected case" | "Worst case"
  icon:             string  // emoji
  incomeStartMonth: number  // 1-indexed; 999 = never within the 12-month window
  monthlyIncome:    number
  /** Length 13: index 0 = starting balance, indices 1–12 = end-of-month balances */
  balanceByMonth:   number[]
  /** null when savings were depleted before month 12 */
  savingsAtMonth12: number | null
  /** null when savings last through month 12 */
  depletionMonth:   number | null
  summary:          string
}

export interface ScenarioSet {
  best:     ScenarioRun
  expected: ScenarioRun
  worst:    ScenarioRun
}

// ─── Input / context shapes (used by getPriorityAction + generateTimelineGuidance) ─

export interface PriorityInputs {
  liquidSavings: number
  monthlyMin:    number
  savingsGap:    number
  monthlyIncome: number
  runwayMonths:  number
}

export interface PriorityResults {
  safeSavingsTarget: number
  upfront:           number
}

export interface ComplianceContext {
  /** null when pathway is exempt */
  required: number | null
  /** max(0, required - liquidSavings); 0 when exempt */
  gap:      number
  isExempt: boolean
}

export interface TimelineInputs {
  liquidSavings:   number
  /** Monthly savings capacity before the move; 0 if not provided */
  savingsCapacity: number
  savingsGap:      number
  /** 0 when pathway is exempt */
  complianceGap:   number
  isStudyPermit:   boolean
}

export interface TimelineResults {
  monthlyMin:        number
  safeSavingsTarget: number
}

/**
 * Aggregate narrative result object.
 * Flows into the consultant report (US-13.4) and the .maple.json export
 * (US-13.2) under the top-level `narrative` key.
 */
export interface NarrativeOutput {
  /** Plain-language readiness verdict string. */
  verdict:          string
  /** Time-to-depletion analysis at current monthly burn rate. */
  timeToDepletion:  DepletionResult
  /** The single most important action to take right now. */
  priorityAction:   PriorityAction
  /** 2–3 timeline scenario items. */
  timelineGuidance: TimelineItem[]
  /** Best / expected / worst 12-month cash-flow model. */
  incomeScenarios:  ScenarioSet
}

// ─── Constants ────────────────────────────────────────────────────────────────

/**
 * Estimated monthly part-time income for international students on a study permit.
 * Based on 20 h/week at approx. national average minimum wage (~$15.80/hr).
 * Formula: 20 × $15.80 × (52/12) ≈ $1,369/month
 */
export const STUDENT_PART_TIME_MONTHLY = 1_369

// ─── A: generateVerdict ───────────────────────────────────────────────────────

/**
 * Returns a plain-language readiness verdict.
 *
 * Priority:
 *  1. Compliance gap > 0         → "not ready, need $X more" (IRCC language)
 *  2. Compliant but savings gap  → "meet IRCC, but below real-world target"
 *  3. Exempt + savings gap       → "not ready, need $X more" (no IRCC mention)
 *  4. Fully ready                → positive confirmation
 */
export function generateVerdict(
  savingsGap:    number,
  complianceGap: number | null,
  isExempt:      boolean,
): string {
  // 1. Compliance shortfall
  if (complianceGap !== null && complianceGap > 0) {
    return (
      `You are not financially ready yet. You need at least ${fmt(complianceGap)} more ` +
      `in savings to meet IRCC's financial requirements for your pathway. ` +
      `Your application may be refused without sufficient proof of funds.`
    )
  }

  // 2. Compliant with IRCC but real-world gap remains
  if (complianceGap !== null && complianceGap === 0 && savingsGap > 0) {
    return (
      `You meet IRCC's financial requirements. However, your savings fall short of ` +
      `your estimated real-world settlement costs by ${fmt(savingsGap)}. ` +
      `Consider building additional savings to cover your first months comfortably.`
    )
  }

  // 3. Exempt pathway with savings gap
  if (isExempt && savingsGap > 0) {
    return (
      `You are not financially ready yet. You need approximately ${fmt(savingsGap)} more ` +
      `to cover your estimated settlement costs. Arriving with sufficient savings is ` +
      `strongly advised for a comfortable start in Canada.`
    )
  }

  // 4a. Compliant, no savings gap
  if (complianceGap !== null && complianceGap === 0 && savingsGap === 0) {
    return (
      `You meet IRCC's financial requirements and your savings cover your estimated ` +
      `settlement costs. You are financially ready to proceed with your move.`
    )
  }

  // 4b. Exempt, no savings gap
  return (
    `Your savings are sufficient for your estimated settlement costs. ` +
    `You are financially ready to move. Focus on logistics and your pre-arrival checklist.`
  )
}

// ─── B: computeTimeToDepletion ────────────────────────────────────────────────

/**
 * Returns how many months current savings last at the given monthly burn rate.
 *
 * Edge case: monthlyMin = 0 (e.g. staying with family, no recurring costs)
 * → returns Infinity with a descriptive label.
 */
export function computeTimeToDepletion(
  liquidSavings: number,
  monthlyMin:    number,
): DepletionResult {
  if (monthlyMin <= 0) {
    return {
      months:   Infinity,
      severity: 'strong',
      label:    'Your monthly expenses are minimal — savings depletion is not a concern.',
    }
  }

  const months = liquidSavings / monthlyMin

  let severity: DepletionSeverity
  let label: string

  if (months < 3) {
    severity = 'critical'
    label    = `Your savings cover only ${months.toFixed(1)} months of expenses — this is critically low.`
  } else if (months < 6) {
    severity = 'limited'
    label    = `Your savings cover ${months.toFixed(1)} months of expenses. Build a larger buffer before moving.`
  } else if (months < 12) {
    severity = 'reasonable'
    label    = `Your savings cover ${months.toFixed(1)} months of expenses — a reasonable buffer.`
  } else {
    severity = 'strong'
    label    = `Your savings cover ${months.toFixed(1)} months of expenses — strong financial position.`
  }

  return { months, severity, label }
}

// ─── C: getPriorityAction ─────────────────────────────────────────────────────

/**
 * Returns the single most important action to take right now.
 *
 * Priority order:
 *  1. IRCC compliance gap exists
 *  2. No income AND depletion < 3 months
 *  3. Savings gap exists (but compliance met or exempt)
 *  4. Fully ready — focus on logistics
 */
export function getPriorityAction(
  inputs:     PriorityInputs,
  results:    PriorityResults,
  compliance: ComplianceContext,
): PriorityAction {
  const depletion = computeTimeToDepletion(inputs.liquidSavings, inputs.monthlyMin)

  // 1. Compliance gap
  if (compliance.required !== null && compliance.gap > 0) {
    return {
      id:      'close-compliance-gap',
      urgency: 'critical',
      title:   'Close your IRCC compliance gap',
      description:
        `You need ${fmt(compliance.gap)} more in savings to meet IRCC's proof-of-funds ` +
        `requirement. Without this, your immigration application may be refused.`,
    }
  }

  // 2. No income + critically short runway
  if (inputs.monthlyIncome === 0 && depletion.months < 3) {
    return {
      id:      'secure-income-or-savings',
      urgency: 'critical',
      title:   'Secure income or increase savings urgently',
      description:
        `With no income and only ${depletion.months.toFixed(1)} months of savings, your ` +
        `funds will be exhausted very quickly after arrival. Delay your move or increase ` +
        `savings before proceeding.`,
    }
  }

  // 3. Savings gap (but compliant or exempt)
  if (inputs.savingsGap > 0) {
    return {
      id:      'increase-savings',
      urgency: 'high',
      title:   'Increase your savings before moving',
      description:
        `You have a ${fmt(inputs.savingsGap)} savings gap relative to your recommended ` +
        `settlement target. Building this buffer will give you a stronger financial start ` +
        `in Canada.`,
    }
  }

  // 4. Ready
  return {
    id:      'focus-logistics',
    urgency: 'low',
    title:   'Focus on pre-arrival logistics',
    description:
      `Your finances are in good shape. Prioritize pre-arrival tasks: open a Canadian bank ` +
      `account, research your city, and prepare your rental application package.`,
  }
}

// ─── D: generateTimelineGuidance ─────────────────────────────────────────────

/**
 * Returns 2–3 timeline items describing the user's options:
 *  1. Always: "If you move today."
 *  2. If gap > 0 and savingsCapacity > 0: "If you wait X months."
 *  3. If study permit and gap > 0: "If you defer to the next intake."
 */
export function generateTimelineGuidance(
  inputs:  TimelineInputs,
  results: TimelineResults,
): TimelineItem[] {
  const items: TimelineItem[] = []
  const totalGap = Math.max(inputs.complianceGap, inputs.savingsGap)
  const isReady  = totalGap <= 0

  // ── Item 1: Move today ──────────────────────────────────────────────────────
  const todayRisk: RiskLevel = isReady
    ? 'low'
    : totalGap > results.safeSavingsTarget * 0.25
    ? 'high'
    : 'medium'

  items.push({
    id:        'move-today',
    label:     'If you move today.',
    riskLevel: todayRisk,
    riskLabel: todayRisk === 'low' ? 'LOW' : todayRisk === 'medium' ? 'MEDIUM' : 'HIGH',
    description: isReady
      ? `You are financially ready. Your savings cover your settlement costs and IRCC ` +
        `requirements. You can proceed with confidence.`
      : `You have a ${fmt(totalGap)} gap. Moving now means relying on income to cover ` +
        `shortfalls quickly — higher financial risk.`,
  })

  // ── Item 2: Wait X months ───────────────────────────────────────────────────
  if (totalGap > 0 && inputs.savingsCapacity > 0) {
    const monthsToWait = Math.ceil(totalGap / inputs.savingsCapacity)
    const waitRisk: RiskLevel = monthsToWait <= 3 ? 'low' : monthsToWait <= 6 ? 'medium' : 'high'
    const projectedSavings = inputs.liquidSavings + monthsToWait * inputs.savingsCapacity

    items.push({
      id:        'wait-x-months',
      label:     `If you wait ${monthsToWait} month${monthsToWait !== 1 ? 's' : ''}.`,
      riskLevel: waitRisk,
      riskLabel: waitRisk === 'low' ? 'LOW' : waitRisk === 'medium' ? 'MEDIUM' : 'HIGH',
      description:
        `Saving ${fmt(inputs.savingsCapacity)}/month for ${monthsToWait} ` +
        `month${monthsToWait !== 1 ? 's' : ''} would close your gap. You would arrive with ` +
        `${fmt(projectedSavings)} in savings — meeting all requirements.`,
    })
  }

  // ── Item 3: Defer to next intake (study permit only) ───────────────────────
  if (inputs.isStudyPermit && totalGap > 0) {
    const intakeMonths    = 5 // typical gap between intakes (Sep → Jan or Jan → Sep)
    const additionalSaved = inputs.savingsCapacity > 0
      ? intakeMonths * inputs.savingsCapacity
      : 0
    const gapAfterDefer   = Math.max(0, totalGap - additionalSaved)
    const deferRisk: RiskLevel = gapAfterDefer === 0 ? 'low' : 'medium'

    items.push({
      id:        'defer-intake',
      label:     'If you defer to the next intake.',
      riskLevel: deferRisk,
      riskLabel: deferRisk === 'low' ? 'LOW' : 'MEDIUM',
      description: gapAfterDefer === 0
        ? `Deferring one semester (~5 months) gives you time to save ` +
          `${fmt(Math.min(totalGap, additionalSaved))} more, closing your gap entirely. ` +
          `You would arrive financially prepared.`
        : `Deferring one semester could reduce your gap to ${fmt(gapAfterDefer)}. ` +
          `Consider additional scholarships or funding sources to bridge the remainder.`,
    })
  }

  return items
}

// ─── E: modelIncomeScenarios ──────────────────────────────────────────────────

/**
 * Internal: builds a single 12-month cash-flow ScenarioRun.
 *
 * @param incomeStartMonth  1-indexed first month income arrives; 999 = never in window
 */
function buildScenario(
  label:            string,
  icon:             string,
  startingBalance:  number,
  monthlyExpenses:  number,
  monthlyIncome:    number,
  incomeStartMonth: number,
): ScenarioRun {
  const balanceByMonth: number[] = [startingBalance]
  let depletionMonth: number | null = null

  for (let m = 1; m <= 12; m++) {
    const income = m >= incomeStartMonth ? monthlyIncome : 0
    const next   = balanceByMonth[m - 1] - monthlyExpenses + income
    balanceByMonth.push(next)
    if (depletionMonth === null && next <= 0) {
      depletionMonth = m
    }
  }

  const final          = balanceByMonth[12]
  const savingsAtMonth12 = depletionMonth === null ? final : null
  const summary = depletionMonth !== null
    ? `Savings depleted at month ${depletionMonth}`
    : `Savings at month 12: ${fmt(final)}`

  return {
    label, icon,
    incomeStartMonth, monthlyIncome,
    balanceByMonth, savingsAtMonth12, depletionMonth,
    summary,
  }
}

/**
 * Models 3 income scenarios (best / expected / worst) over 12 months.
 *
 * Non-student pathways:
 *   Best     — job secured, income starts month 2
 *   Expected — job offer in hand, income starts month 4
 *   Worst    — no job secured, income never arrives within the 12-month window
 *
 * Study-permit pathway:
 *   Best     — part-time work starts month 1
 *   Expected — part-time work starts month 2
 *   Worst    — no work (visa restriction or unable to find work)
 *
 * Student income uses STUDENT_PART_TIME_MONTHLY, not the full `income` parameter.
 *
 * @param savings          Current liquid savings (pre-move starting balance)
 * @param monthlyExpenses  Monthly minimum burn rate
 * @param income           Expected monthly net income (used for non-student cases)
 * @param pathway          Engine pathway string; 'study-permit' triggers student logic
 */
export function modelIncomeScenarios(
  savings:         number,
  monthlyExpenses: number,
  income:          number,
  pathway:         string,
): ScenarioSet {
  const isStudent = pathway === 'study-permit'

  if (isStudent) {
    return {
      best: buildScenario(
        'Best case', '☀️', savings, monthlyExpenses, STUDENT_PART_TIME_MONTHLY, 1,
      ),
      expected: buildScenario(
        'Expected case', '⚖️', savings, monthlyExpenses, STUDENT_PART_TIME_MONTHLY, 2,
      ),
      worst: buildScenario(
        'Worst case', '⛈️', savings, monthlyExpenses, 0, 999,
      ),
    }
  }

  return {
    best: buildScenario(
      'Best case', '☀️', savings, monthlyExpenses, income, 2,
    ),
    expected: buildScenario(
      'Expected case', '⚖️', savings, monthlyExpenses, income, 4,
    ),
    worst: buildScenario(
      'Worst case', '⛈️', savings, monthlyExpenses, 0, 999,
    ),
  }
}
