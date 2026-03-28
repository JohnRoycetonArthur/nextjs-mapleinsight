/**
 * Settlement Planner — Risk Rules Engine (US-12.2)
 *
 * Pure functions: same inputs always produce same outputs. No side effects.
 *
 * 6 base rules + 4 study-permit-specific rules.
 * evaluateRisks() returns risks sorted by severity, capped at top 3.
 */

import {
  STUDY_PERMIT_DEFAULTS,
  computeIRCCProofOfFunds,
} from './study-permit'
import type { StudyPermitData } from './study-permit'
import type { EngineInput, EngineOutput } from './types'

// ─── Types ────────────────────────────────────────────────────────────────────

export type Severity = 'critical' | 'high' | 'medium' | 'low'

export interface Action {
  id:           string
  title:        string
  description:  string
  impactCAD:    number   // positive = saves money, negative = additional cost
  articleSlug?: string  // Maple Insight article slug
  link?:        string  // external resource URL
}

export interface Risk {
  id:          string
  severity:    Severity
  title:       string
  description: string
  actions:     Action[]
}

export interface RiskContext {
  input:             EngineInput
  output:            EngineOutput
  monthlyIncome:     number          // 0 if unknown / not yet secured
  studyPermitData?:  StudyPermitData // only needed for study-permit pathway
}

export interface RiskRule {
  id: string
  evaluate(ctx: RiskContext): Risk | null
}

// ─── Severity ordering ────────────────────────────────────────────────────────

const SEVERITY_ORDER: Record<Severity, number> = {
  critical: 0,
  high:     1,
  medium:   2,
  low:      3,
}

// ─── Constants ────────────────────────────────────────────────────────────────

/** Cities where income uncertainty is most severe (high-cost markets). */
const HIGH_COST_CITIES = new Set(['toronto', 'vancouver', 'calgary', 'ottawa'])

/**
 * General immigration health coverage wait periods (months) by province.
 * Applies to all newcomers regardless of pathway (PR, work permit, etc.).
 * Source: provincial health authority eligibility rules.
 *
 * NOTE: Ontario (OHIP) has NO waiting period — immediate coverage upon
 * establishing residency. Source: ontario.ca/page/apply-ohip-and-get-health-card
 */
const HEALTH_WAIT_MONTHS: Record<string, number> = {
  BC: 3,
  NB: 3,
  PE: 3,
  SK: 3,
}

/** Names for display in risk descriptions. */
const PROVINCE_NAMES: Record<string, string> = {
  ON: 'Ontario',  BC: 'British Columbia', AB: 'Alberta',   QC: 'Quebec',
  MB: 'Manitoba', SK: 'Saskatchewan',     NS: 'Nova Scotia', NB: 'New Brunswick',
  PE: 'Prince Edward Island', NL: 'Newfoundland & Labrador',
  NT: 'Northwest Territories', NU: 'Nunavut', YT: 'Yukon',
}

/** Provincial health plan names for display. */
const PROVINCE_HEALTH_PLAN: Record<string, string> = {
  ON: 'OHIP', BC: 'MSP', AB: 'AHCIP', QC: 'RAMQ',
  MB: 'Manitoba Health', SK: 'Saskatchewan Health',
  NS: 'MSI', NB: 'Medicare', PE: 'PEI Health Card',
  NL: 'MCP', NT: 'NWT Health Care Plan', YT: 'Yukon Health Care Insurance Plan',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtCAD(n: number): string {
  return `$${Math.round(n).toLocaleString('en-CA')}`
}

function pct(ratio: number): string {
  return `${Math.round(ratio * 100)}%`
}

// ─── Rule 1: Housing Burden ───────────────────────────────────────────────────

const housingBurden: RiskRule = {
  id: 'housingBurden',
  evaluate({ output, monthlyIncome }): Risk | null {
    if (monthlyIncome <= 0) return null
    const rentItem = output.monthlyBreakdown.find(i => i.key === 'rent')
    const rent = rentItem?.cad ?? 0
    if (rent === 0) return null
    const ratio = rent / monthlyIncome
    if (ratio <= 0.45) return null
    const excess = Math.round(rent - monthlyIncome * 0.45)
    return {
      id: 'housingBurden',
      severity: 'high',
      title: 'High Housing Cost Burden',
      description:
        `Your estimated rent (${fmtCAD(rent)}/mo) is ${pct(ratio)} of your expected income ` +
        `(${fmtCAD(monthlyIncome)}/mo), above the 45% affordability threshold. ` +
        `This leaves limited room for savings or unexpected costs.`,
      actions: [
        {
          id:          'housingBurden-downsize',
          title:       'Consider a studio or shared unit',
          description: `Choosing a smaller unit or sharing could reduce rent by ${fmtCAD(excess)}/mo or more.`,
          impactCAD:    excess,
          articleSlug: 'renting-in-canada-newcomer-guide',
        },
        {
          id:          'housingBurden-income',
          title:       'Secure income before arriving',
          description: 'A secured job offer before landing reduces housing burden risk significantly.',
          impactCAD:    0,
          articleSlug: 'finding-a-job-in-canada-before-you-arrive',
        },
      ],
    }
  },
}

// ─── Rule 2: Income Uncertainty ───────────────────────────────────────────────

const incomeUncertainty: RiskRule = {
  id: 'incomeUncertainty',
  evaluate({ input, output }): Risk | null {
    const noIncome = input.jobStatus === 'none' || input.jobStatus === 'student'
    if (!noIncome) return null
    if (!HIGH_COST_CITIES.has(input.city.toLowerCase())) return null
    const cityLabel = input.city.charAt(0).toUpperCase() + input.city.slice(1)
    const extraMonths = 2
    const extraBuffer = Math.round(output.monthlySafe * extraMonths)
    return {
      id: 'incomeUncertainty',
      severity: 'high',
      title: `Income Uncertainty in High-Cost Market`,
      description:
        `You plan to arrive in ${cityLabel} — one of Canada's most expensive cities — without ` +
        `secured income. Your ${output.runwayMonths}-month financial runway may not be sufficient ` +
        `if employment takes longer than expected.`,
      actions: [
        {
          id:          'incomeUncertainty-jobSearch',
          title:       'Begin your job search before arriving',
          description: 'Securing employment in advance shortens your income gap. Use Job Bank Canada and LinkedIn.',
          impactCAD:    0,
          link:        'https://www.jobbank.gc.ca',
        },
        {
          id:          'incomeUncertainty-buffer',
          title:       `Add ${extraMonths} months of savings buffer`,
          description: `Increasing your savings by ${fmtCAD(extraBuffer)} provides extra runway.`,
          impactCAD:   -extraBuffer,
          articleSlug: 'financial-checklist-before-moving-to-canada',
        },
      ],
    }
  },
}

// ─── Rule 3: Health Coverage Gap (non-study-permit) ───────────────────────────

const healthCoverageGap: RiskRule = {
  id: 'healthCoverageGap',
  evaluate({ input }): Risk | null {
    // Study-permit path has its own student-specific rule
    if (input.pathway === 'study-permit') return null
    const waitMonths = HEALTH_WAIT_MONTHS[input.province]
    if (!waitMonths) return null
    const provName  = PROVINCE_NAMES[input.province] ?? input.province
    const planName  = PROVINCE_HEALTH_PLAN[input.province] ?? 'provincial health insurance'
    const estimatedCost = waitMonths * 200  // ~$200/mo for private coverage
    return {
      id: 'healthCoverageGap',
      severity: 'medium',
      title: `${waitMonths}-Month Health Coverage Wait in ${provName}`,
      description:
        `${provName} has a ${waitMonths}-month wait before ${planName} takes effect for new residents. ` +
        `You will need private health insurance or bear out-of-pocket medical costs during this period.`,
      actions: [
        {
          id:          'healthCoverageGap-bridge',
          title:       'Purchase bridge health insurance',
          description: `Budget ~${fmtCAD(estimatedCost)} for ${waitMonths} months of private coverage.`,
          impactCAD:   -estimatedCost,
          articleSlug: 'health-insurance-for-newcomers-canada',
        },
      ],
    }
  },
}

// ─── Rule 4: Study Permit Funding Shortfall ───────────────────────────────────

const studyPermitFunding: RiskRule = {
  id: 'studyPermitFunding',
  evaluate({ input, output }): Risk | null {
    if (input.pathway !== 'study-permit') return null
    if (output.savingsGap <= 0) return null
    const scholarship = input.studyPermit?.scholarshipAmount ?? 0
    return {
      id: 'studyPermitFunding',
      severity: 'high',
      title: 'Study Permit Savings Gap',
      description:
        `Your available savings fall short of the recommended amount for your study plan by ` +
        `${fmtCAD(output.savingsGap)}.` +
        (scholarship > 0 ? ` This already accounts for your ${fmtCAD(scholarship)} scholarship.` : ''),
      actions: [
        {
          id:          'studyPermitFunding-gic',
          title:       'Consider a GIC to meet proof-of-funds',
          description: 'A Guaranteed Investment Certificate (GIC) counts toward IRCC proof-of-funds.',
          impactCAD:    0,
          articleSlug: 'what-is-a-gic-canada',
        },
        {
          id:          'studyPermitFunding-scholarship',
          title:       'Apply for entrance scholarships',
          description: 'Many Canadian institutions offer merit scholarships that reduce the funding gap.',
          impactCAD:    0,
          articleSlug: 'scholarships-for-international-students-canada',
        },
      ],
    }
  },
}

// ─── Rule 5: Proof-of-Funds Minimum ──────────────────────────────────────────

const proofOfFundsMinimum: RiskRule = {
  id: 'proofOfFundsMinimum',
  evaluate({ input, output }): Risk | null {
    // For study-permit this is covered more precisely by irccProofOfFundsCompliance
    if (input.pathway === 'study-permit') return null
    // Fires when savings can't even cover the upfront move-in costs
    if (input.liquidSavings >= output.upfront) return null
    const shortfall = Math.round(output.upfront - input.liquidSavings)
    return {
      id: 'proofOfFundsMinimum',
      severity: 'high',
      title: 'Savings Below Move-In Cost Minimum',
      description:
        `Your liquid savings (${fmtCAD(input.liquidSavings)}) are less than the estimated ` +
        `one-time move-in costs (${fmtCAD(output.upfront)}). You will need at least ` +
        `${fmtCAD(shortfall)} more before you can safely complete the move.`,
      actions: [
        {
          id:          'proofOfFunds-save',
          title:       `Save an additional ${fmtCAD(shortfall)}`,
          description: 'Delay your move date until you can cover the upfront costs.',
          impactCAD:   -shortfall,
          articleSlug: 'financial-checklist-before-moving-to-canada',
        },
        {
          id:          'proofOfFunds-expenses',
          title:       'Reduce upfront setup costs',
          description: 'Choose minimal furnishing and negotiate shared or furnished accommodation to lower deposit requirements.',
          impactCAD:    Math.round(output.upfront * 0.2),
          articleSlug: 'renting-in-canada-newcomer-guide',
        },
      ],
    }
  },
}

// ─── Rule 6: Large Savings Gap ───────────────────────────────────────────────

const largeSavingsGap: RiskRule = {
  id: 'largeSavingsGap',
  evaluate({ input, output }): Risk | null {
    if (output.safeSavingsTarget <= 0) return null
    const ratio = output.savingsGap / output.safeSavingsTarget
    if (ratio < 0.5) return null
    return {
      id: 'largeSavingsGap',
      severity: 'medium',
      title: 'Large Savings Gap',
      description:
        `Your savings gap (${fmtCAD(output.savingsGap)}) is ${pct(ratio)} of your recommended ` +
        `savings target (${fmtCAD(output.safeSavingsTarget)}). Consider delaying your arrival ` +
        `or significantly reducing planned expenses.`,
      actions: [
        {
          id:          'largeSavingsGap-reduce',
          title:       'Reduce monthly lifestyle costs',
          description: 'Choosing a smaller unit, skipping a car, or removing optional expenses reduces your target.',
          impactCAD:    Math.round(output.monthlySafe * 0.15 * output.runwayMonths),
          articleSlug: 'cost-of-living-canada-newcomer',
        },
        {
          id:          'largeSavingsGap-delay',
          title:       'Delay move to build savings',
          description: `Adding even 3 more months of saving can meaningfully close the gap.`,
          impactCAD:    0,
        },
      ],
    }
  },
}

// ─── Rule 7: Borrowed Funds (Express Entry) ───────────────────────────────────

const borrowedFunds: RiskRule = {
  id: 'borrowedFunds',
  evaluate({ input }): Risk | null {
    const borrowed = input.fundsComposition?.borrowed ?? 0
    if (borrowed <= 0) return null
    // Only fires for Express Entry pathways (IRCC requirement applies)
    if (!input.pathway.startsWith('express-entry')) return null
    return {
      id: 'borrowedFunds',
      severity: 'high',
      title: 'Possible non-qualifying funds',
      description:
        `IRCC requires Express Entry proof of funds to be legally accessible and not borrowed. ` +
        `${fmtCAD(borrowed)} of your savings may not qualify. ` +
        `Borrowed funds cannot be counted toward the IRCC settlement funds requirement (FSWP/FSTP/PNP). ` +
        `Consult with your immigration advisor about documentation requirements.`,
      actions: [
        {
          id:          'borrowedFunds-repay',
          title:       'Exclude borrowed amounts from your proof of funds',
          description: `Only funds that are legally yours and not encumbered by a repayment obligation can be shown as settlement funds. Repay or exclude ${fmtCAD(borrowed)} before the application.`,
          impactCAD:    0,
          link:        'https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/documents/proof-funds.html',
        },
      ],
    }
  },
}

// ─── Study Permit Rule 1: IRCC Proof-of-Funds Compliance ─────────────────────

const irccProofOfFundsCompliance: RiskRule = {
  id: 'irccProofOfFundsCompliance',
  evaluate({ input, output }): Risk | null {
    if (input.pathway !== 'study-permit') return null
    if (!input.studyPermit) return null

    const data       = STUDY_PERMIT_DEFAULTS
    const familySize = input.household.adults + input.household.children
    const required   = computeIRCCProofOfFunds(
      familySize,
      input.studyPermit.tuitionAmount,
      input.province,
      data,
    )

    if (input.liquidSavings >= required) return null

    const shortfall = Math.round(required - input.liquidSavings)
    const gicFee    = data.gicProcessingFee

    return {
      id: 'irccProofOfFundsCompliance',
      severity: 'critical',
      title: 'Below IRCC Proof of Funds Minimum',
      description:
        `IRCC requires ${fmtCAD(required)} in proof of funds for your study permit application ` +
        `(tuition + living expenses + $2,000 transport). You currently have ${fmtCAD(input.liquidSavings)}, ` +
        `a shortfall of ${fmtCAD(shortfall)}. Insufficient proof of funds is the #1 reason for ` +
        `study permit refusals.` +
        (output.irccFloorApplied ? ' Note: IRCC minimum has been applied as your savings target.' : ''),
      actions: [
        {
          id:          'ircc-gic',
          title:       'Purchase a GIC',
          description:
            `A Guaranteed Investment Certificate (GIC) of ${fmtCAD(data.gicMinimum)} from a ` +
            `designated bank satisfies a major portion of the proof-of-funds requirement. ` +
            `Processing fee: ${fmtCAD(gicFee)}.`,
          impactCAD:   -gicFee,
          articleSlug: 'what-is-a-gic-canada',
        },
        {
          id:          'ircc-scholarship-docs',
          title:       'Secure scholarship or loan documentation',
          description: 'Scholarships, institutional awards, and confirmed student loans can supplement your proof of funds.',
          impactCAD:    0,
          articleSlug: 'study-permit-proof-of-funds',
        },
      ],
    }
  },
}

// ─── Study Permit Rule 2: Health Coverage Gap (Student) ──────────────────────

const healthCoverageGapStudent: RiskRule = {
  id: 'healthCoverageGapStudent',
  evaluate({ input }): Risk | null {
    if (input.pathway !== 'study-permit') return null

    const data  = STUDY_PERMIT_DEFAULTS
    const entry = data.healthInsuranceByProvince.find(h => h.provinceCode === input.province)
    if (!entry) return null

    const provName = PROVINCE_NAMES[input.province] ?? input.province

    // No provincial coverage at all
    if (!entry.hasProvincialCoverage) {
      const monthly = Math.round(entry.annualCostCAD / 12)
      return {
        id: 'healthCoverageGapStudent',
        severity: 'medium',
        title: `No Provincial Health Coverage in ${provName}`,
        description:
          `International students in ${provName} are not eligible for provincial health coverage. ` +
          `${entry.mechanism} is mandatory and typically added to your tuition by your institution. ` +
          `Estimated cost: ${fmtCAD(entry.annualCostCAD)}/year (~${fmtCAD(monthly)}/month).`,
        actions: [
          {
            id:          'healthStudent-budget',
            title:       `Budget for ${entry.mechanism}`,
            description: `Allocate ${fmtCAD(entry.annualCostCAD)}/year for mandatory health coverage.`,
            impactCAD:   -entry.annualCostCAD,
            articleSlug: 'health-insurance-international-students-canada',
          },
        ],
      }
    }

    // Has coverage but with a waiting period
    if (entry.waitPeriodMonths > 0) {
      return {
        id: 'healthCoverageGapStudent',
        severity: 'medium',
        title: `${entry.waitPeriodMonths}-Month Health Coverage Wait Period`,
        description:
          `${provName} provides provincial health coverage (${entry.mechanism}) for international students ` +
          `but only after a ${entry.waitPeriodMonths}-month waiting period. ` +
          `Bridge insurance is needed to cover the gap. Estimated one-time cost: ${fmtCAD(entry.bridgeCostCAD)}.`,
        actions: [
          {
            id:          'healthStudent-bridge',
            title:       `Purchase bridge insurance for ${entry.waitPeriodMonths} months`,
            description: `Budget ${fmtCAD(entry.bridgeCostCAD)} for temporary coverage during the waiting period.`,
            impactCAD:   -entry.bridgeCostCAD,
            articleSlug: 'health-insurance-international-students-canada',
          },
        ],
      }
    }

    return null  // has coverage, no wait — no risk
  },
}

// ─── Study Permit Rule 3: Tuition Affordability ───────────────────────────────

const tuitionAffordability: RiskRule = {
  id: 'tuitionAffordability',
  evaluate({ input }): Risk | null {
    if (input.pathway !== 'study-permit') return null
    if (!input.studyPermit) return null
    if (input.liquidSavings <= 0) return null

    const tuition = input.studyPermit.tuitionAmount
    if (tuition <= 0) return null

    const ratio = tuition / input.liquidSavings
    if (ratio <= 0.7) return null

    const savingRemainder = Math.round(input.liquidSavings - tuition)
    const lowerTuitionSaving = Math.round(tuition * 0.3)

    return {
      id: 'tuitionAffordability',
      severity: 'high',
      title: 'Tuition Consumes Over 70% of Savings',
      description:
        `Your tuition (${fmtCAD(tuition)}) is ${pct(ratio)} of your liquid savings ` +
        `(${fmtCAD(input.liquidSavings)}), leaving only ${fmtCAD(savingRemainder)} for ` +
        `all other settlement, living, and emergency costs. ` +
        `This creates a very thin financial margin.`,
      actions: [
        {
          id:          'tuition-lowerCost',
          title:       'Consider a lower-tuition province or institution',
          description:
            `Choosing a program with lower fees could save ~${fmtCAD(lowerTuitionSaving)} ` +
            `and significantly improve your financial safety margin.`,
          impactCAD:    lowerTuitionSaving,
          articleSlug: 'study-permit-proof-of-funds',
        },
        {
          id:          'tuition-scholarships',
          title:       'Explore scholarships at your institution',
          description: 'Merit and need-based scholarships can reduce the net tuition cost substantially.',
          impactCAD:    0,
          articleSlug: 'scholarships-for-international-students-canada',
        },
      ],
    }
  },
}

// ─── Study Permit Rule 4: Quebec Complexity ───────────────────────────────────

const quebecComplexity: RiskRule = {
  id: 'quebecComplexity',
  evaluate({ input }): Risk | null {
    if (input.pathway !== 'study-permit') return null
    if (input.province !== 'QC') return null
    return {
      id: 'quebecComplexity',
      severity: 'medium',
      title: 'Quebec Requires CAQ Before Study Permit',
      description:
        'Studying in Quebec requires two separate authorisations: a Certificat d\'acceptation du Québec (CAQ) ' +
        'from the Ministère de l\'Immigration du Québec (MIFI), followed by the federal study permit from IRCC. ' +
        'Quebec\'s proof-of-funds thresholds also exceed the federal minimum. ' +
        'Plan for additional processing time and higher fund requirements.',
      actions: [
        {
          id:          'quebecComplexity-caq',
          title:       'Begin your CAQ application early',
          description: 'Apply for the CAQ as early as possible — processing can take 4–8 weeks.',
          impactCAD:    0,
          articleSlug: 'studying-in-quebec-caq',
        },
      ],
    }
  },
}

// ─── Rule: Exchange Rate Fluctuation Risk (US-22.1) ───────────────────────────

const exchangeRateRisk: RiskRule = {
  id: 'exchangeRateRisk',
  evaluate({ input, output }): Risk | null {
    if (!input.inputCurrency || input.inputCurrency === 'CAD') return null

    // Find the active compliance floor (IRCC study permit or EE/PNP compliance)
    const floor = output.irccFloor ?? output.complianceFloor
    if (!floor || floor <= 0) return null

    const savings = input.liquidSavings
    // Warn only when savings are within 5% above the floor (compliant but barely)
    if (savings < floor || savings >= floor * 1.05) return null

    const bufferNeeded = Math.round(floor * 1.05 - savings)

    return {
      id:       'exchangeRateRisk',
      severity: 'medium',
      title:    'Exchange rate shift may push savings below IRCC threshold',
      description:
        `Your ${input.inputCurrency}-denominated savings convert to ${fmtCAD(savings)} CAD — ` +
        `just above the ${fmtCAD(floor)} IRCC threshold. A 5% currency depreciation could push you below ` +
        `this floor, causing a compliance gap. Convert funds to CAD before your application.`,
      actions: [
        {
          id:          'exchangeRateRisk-convert',
          title:       'Convert savings to CAD before applying',
          description: `Lock in at least ${fmtCAD(Math.round(floor * 1.05))} CAD (${fmtCAD(bufferNeeded)} above the threshold) to absorb currency movement.`,
          impactCAD:    0,
        },
      ],
    }
  },
}

// ─── All Rules (order matters for evaluation, not display) ────────────────────

const ALL_RULES: RiskRule[] = [
  housingBurden,
  incomeUncertainty,
  healthCoverageGap,
  studyPermitFunding,
  proofOfFundsMinimum,
  largeSavingsGap,
  borrowedFunds,
  exchangeRateRisk,
  // Study permit enhancements
  irccProofOfFundsCompliance,
  healthCoverageGapStudent,
  tuitionAffordability,
  quebecComplexity,
]

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Evaluate all risk rules against the context and return the top N triggered
 * risks sorted by severity (critical → high → medium → low).
 */
export function evaluateRisks(
  ctx: RiskContext,
  topN = 3,
): Risk[] {
  const triggered: Risk[] = []

  for (const rule of ALL_RULES) {
    const risk = rule.evaluate(ctx)
    if (risk) triggered.push(risk)
  }

  return triggered
    .sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity])
    .slice(0, topN)
}

// Re-export individual rule evaluators for testing
export {
  housingBurden,
  incomeUncertainty,
  healthCoverageGap,
  studyPermitFunding,
  proofOfFundsMinimum,
  largeSavingsGap,
  borrowedFunds,
  irccProofOfFundsCompliance,
  healthCoverageGapStudent,
  tuitionAffordability,
  quebecComplexity,
}
