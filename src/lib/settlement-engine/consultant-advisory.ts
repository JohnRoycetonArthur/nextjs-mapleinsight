/**
 * Settlement Planner — Consultant Advisory Engine (US-13.4)
 *
 * Pure functions for generating the Consultant Intelligence Report.
 * All logic is deterministic and rule-based. No AI. No network calls.
 */

import type { EngineInput, EngineOutput } from './types'
import type { Risk } from './risks'
import type { IRCCComplianceResult, StudyPermitData } from './study-permit'
import { STUDY_PERMIT_DEFAULTS } from './study-permit'

// ─── Formatters ───────────────────────────────────────────────────────────────

function fmt(n: number): string {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency', currency: 'CAD', maximumFractionDigits: 0,
  }).format(Math.abs(n))
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n))
}

function cityLabel(city: string): string {
  return city.charAt(0).toUpperCase() + city.slice(1)
}

// ─── Public Types ─────────────────────────────────────────────────────────────

export interface ReadinessComponent {
  label:  string
  score:  number   // 0–10
  max:    10
  weight: string   // e.g. "30%"
}

export interface ReadinessScore {
  score:      number   // 0.0–10.0 (1 decimal)
  tier:       string   // Critical | Needs Work | Moderate | Good | Excellent
  color:      string   // hex
  narrative:  string
  components: ReadinessComponent[]
}

export interface AlternativeScenario {
  id:         string
  name:       string
  change:     string
  icon:       string
  newTarget:  number
  newGap:     number
  delta:      number   // negative = savings/improvement
  deltaLabel: string
  details:    string
  positive:   boolean
}

export interface GapStrategy {
  title:      string
  impact:     number   // negative = saves money, 0 = qualitative benefit
  difficulty: 'Easy' | 'Moderate' | 'Hard'
  timeline:   string
  rationale:  string
}

export type ProgramNoteSeverity = 'warning' | 'info' | 'positive' | 'negative'

export interface ProgramNote {
  title:    string
  severity: ProgramNoteSeverity
  color:    string
  content:  string
  source?:  string
}

export interface StudyPermitAdvisorySubsection {
  title:   string
  status:  'compliant' | 'at-risk' | 'critical' | 'info'
  content: string
  metric?: string  // e.g. "$22,895 required"
}

export interface StudyPermitAdvisory {
  proofOfFunds:   StudyPermitAdvisorySubsection
  tuitionCosts:   StudyPermitAdvisorySubsection
  healthCoverage: StudyPermitAdvisorySubsection
  partTimeIncome: StudyPermitAdvisorySubsection
  refusalRisk:    StudyPermitAdvisorySubsection
}

export interface RedFlag {
  flag:   string
  detail: string
}

export interface CrossReferral {
  tool:   string
  link:   string
  reason: string
}

export interface MeetingGuide {
  talkingPoints:   string[]
  questions:       string[]
  redFlags:        RedFlag[]
  crossReferrals?: CrossReferral[]
}

export interface ConsultantAdvisory {
  readiness:             ReadinessScore
  scenarios:             AlternativeScenario[]
  strategies:            GapStrategy[]
  programNotes:          ProgramNote[]
  studyPermitAdvisory?:  StudyPermitAdvisory
  meetingGuide:          MeetingGuide
}

// ─── Fact Registry ────────────────────────────────────────────────────────────
//
// Central deduplication mechanism (US-19.3).
// Section generators claim facts in priority order:
//   scenarios → strategies → notes → meetingGuide → redFlags
// When a fact is already claimed, later sections use a cross-reference
// instead of restating the data.

export type FactType = 'number' | 'strategy' | 'risk' | 'note'
export type AdvisorySection = 'scenarios' | 'strategies' | 'notes' | 'meetingGuide' | 'redFlags'

export interface RegistryFact {
  key:          string
  type:         FactType
  content:      string        // human-readable label, e.g. "Scenario 1: Destination: Winnipeg"
  dollarImpact: number | null
  section:      AdvisorySection | null
}

export class FactRegistry {
  private readonly facts = new Map<string, RegistryFact>()

  /** Add a fact. No-op if key is already registered. */
  register(key: string, fact: { type: FactType; content: string; dollarImpact: number | null }): void {
    if (!this.facts.has(key)) {
      this.facts.set(key, { ...fact, key, section: null })
    }
  }

  /**
   * Mark a fact as owned by a section.
   * Returns true when successful; false if not found or already claimed.
   */
  claim(key: string, section: AdvisorySection): boolean {
    const f = this.facts.get(key)
    if (!f || f.section !== null) return false
    f.section = section
    return true
  }

  /** Returns true when the fact has not yet been claimed. */
  isAvailable(key: string): boolean {
    const f = this.facts.get(key)
    return f === undefined || f.section === null
  }

  /** Returns all facts claimed by a given section. */
  getBySection(section: AdvisorySection): RegistryFact[] {
    return Array.from(this.facts.values()).filter(f => f.section === section)
  }
}

// ─── Internal constants ───────────────────────────────────────────────────────

const C = {
  forest: '#1B4F4A', accent: '#1B7A4A', gold: '#B8860B',
  red: '#C41E3A', blue: '#2563EB',
}

const HIGH_COST_CITIES = new Set(['toronto', 'vancouver', 'calgary', 'ottawa'])

// Approximate monthly savings vs expensive alternatives (used for city-swap scenario)
const CHEAPER_CITY_ALT: Record<string, { city: string; monthlySavings: number; details: string }> = {
  toronto:   { city: 'Winnipeg',    monthlySavings: 754, details: 'Winnipeg 1BR rent is $1,232/mo (vs $1,761 in Toronto) — a $529/mo savings. Transit is $119/mo. Total monthly cost drops significantly.' },
  vancouver: { city: 'Calgary',     monthlySavings: 700, details: 'Calgary 1BR rent is ~$1,660/mo (vs $2,350 in Vancouver) — a $690/mo savings. No provincial sales tax in Alberta (GST only at 5%).' },
  calgary:   { city: 'Edmonton',    monthlySavings: 280, details: 'Edmonton 1BR rent is ~$1,380/mo (vs $1,660 in Calgary) — a $280/mo savings with a similar Alberta job market.' },
  ottawa:    { city: 'Hamilton',    monthlySavings: 440, details: 'Hamilton 1BR rent is ~$1,450/mo (vs $1,900 in Ottawa) — a $450/mo savings. 1hr from Toronto via GO Transit.' },
  montreal:  { city: 'Quebec City', monthlySavings: 300, details: 'Quebec City 1BR rent is ~$900/mo (vs $1,200 in Montreal) — a $300/mo savings in a bilingual market.' },
}

// ─── Section 1: computeReadinessScore ─────────────────────────────────────────

export function computeReadinessScore(
  input:                 EngineInput,
  output:                EngineOutput,
  monthlyIncome:         number,
  risks:                 Risk[],
  complianceRequirement: number | null,
  registry?:             FactRegistry,
): ReadinessScore {
  // ── Component 1: Savings Coverage (30%) ──────────────────────────────────
  const savingsCovScore = output.safeSavingsTarget <= 0 ? 10
    : Math.max(0, 10 * (1 - clamp(output.savingsGap / output.safeSavingsTarget, 0, 1)))

  // ── Component 2: Income Stability (25%) ──────────────────────────────────
  const incomeScore = (() => {
    if (input.pathway === 'study-permit') return 4   // restricted part-time rights; predictable
    switch (input.jobStatus) {
      case 'secured': return 10
      case 'offer':   return 7
      case 'student': return 4
      case 'none':    return 2
      default:        return 3
    }
  })()

  // ── Component 3: Housing Affordability (20%) ──────────────────────────────
  const rent = output.monthlyBreakdown.find(i => i.key === 'rent')?.cad ?? 0
  const affordScore = (() => {
    if (monthlyIncome > 0 && rent > 0) {
      const r = rent / monthlyIncome
      if      (r <= 0.30) return 10
      else if (r <= 0.45) return 10 - ((r - 0.30) / 0.15) * 5
      else if (r <= 0.70) return 5  - ((r - 0.45) / 0.25) * 3
      else                return 2
    }
    // No income: score based on rent share of monthly burn
    if (output.monthlyMin <= 0) return 7
    const burnRatio = rent / output.monthlyMin
    if      (burnRatio <= 0.40) return 8
    else if (burnRatio <= 0.55) return 5
    else                        return 3
  })()

  // ── Component 4: Runway Adequacy (15%) ────────────────────────────────────
  const runwayMonths = output.monthlyMin > 0 ? input.liquidSavings / output.monthlyMin : 12
  const runwayScore  = runwayMonths < 3  ? 1
                     : runwayMonths < 6  ? 4
                     : runwayMonths < 9  ? 6.5
                     : runwayMonths < 12 ? 8
                     :                    10

  // ── Component 5: Risk Profile (10%) ───────────────────────────────────────
  let riskScore = 10
  for (const r of risks) {
    riskScore -= r.severity === 'critical' ? 4 : r.severity === 'high' ? 2 : r.severity === 'medium' ? 1 : 0.5
  }
  riskScore = Math.max(1, riskScore)

  const components: ReadinessComponent[] = [
    { label: 'Savings Coverage',      score: round1(savingsCovScore), max: 10, weight: '30%' },
    { label: 'Income Stability',      score: incomeScore,              max: 10, weight: '25%' },
    { label: 'Housing Affordability', score: round1(affordScore),      max: 10, weight: '20%' },
    { label: 'Runway Adequacy',       score: runwayScore,              max: 10, weight: '15%' },
    { label: 'Risk Profile',          score: round1(riskScore),        max: 10, weight: '10%' },
  ]

  const weights  = [0.30, 0.25, 0.20, 0.15, 0.10]
  const score    = round1(components.reduce((acc, c, i) => acc + c.score * weights[i], 0))

  const tier  = score < 3 ? 'Critical' : score < 5 ? 'Needs Work' : score < 7 ? 'Moderate' : score < 9 ? 'Good' : 'Excellent'
  const color = score < 3 ? C.red : score < 5 ? '#E06B00' : score < 7 ? C.gold : C.accent

  const narrative = buildNarrative(input, output, score, monthlyIncome, complianceRequirement, registry)

  return { score, tier, color, narrative, components }
}

function round1(n: number) { return Math.round(n * 10) / 10 }

function buildNarrative(
  input:                 EngineInput,
  output:                EngineOutput,
  score:                 number,
  monthlyIncome:         number,
  complianceRequirement: number | null,
  registry?:             FactRegistry,
): string {
  const city      = cityLabel(input.city)
  const savingsPct = output.safeSavingsTarget > 0
    ? Math.round((input.liquidSavings / output.safeSavingsTarget) * 100)
    : 100

  const opening = score < 3 ? 'This client is not financially ready to proceed with their move.'
    : score < 5 ? `This client's financial position requires significant improvement before safely proceeding.`
    : score < 7 ? `This client has moderate financial readiness.`
    : score < 9 ? `This client is in a good financial position.`
    : `This client is in an excellent financial position for their move.`

  const savingsLine = output.safeSavingsTarget > 0
    ? `Their savings of ${fmt(input.liquidSavings)} cover ${savingsPct}% of the recommended ${fmt(output.safeSavingsTarget)} safe target.`
    : `Their savings of ${fmt(input.liquidSavings)} are sufficient for their settlement plan.`

  let complianceLine = ''
  if (complianceRequirement !== null) {
    if (registry) {
      // When the registry is active, full IRCC detail lives in Program-Specific Notes.
      // Keep the narrative concise with a cross-reference.
      const gap = Math.max(0, complianceRequirement - input.liquidSavings)
      complianceLine = gap > 0
        ? ` IRCC proof-of-funds shortfall of ${fmt(gap)} — see Program-Specific Notes.`
        : ` IRCC proof-of-funds requirement met — see Program-Specific Notes.`
    } else {
      const gap = Math.max(0, complianceRequirement - input.liquidSavings)
      complianceLine = gap > 0
        ? ` They do not yet meet the IRCC proof-of-funds minimum of ${fmt(complianceRequirement)}, with a shortfall of ${fmt(gap)}.`
        : ` They meet the IRCC proof-of-funds minimum of ${fmt(complianceRequirement)} with a ${fmt(input.liquidSavings - complianceRequirement)} buffer.`
    }
  }

  let riskLine = ''
  if (input.jobStatus === 'none' && HIGH_COST_CITIES.has(input.city.toLowerCase())) {
    riskLine = ` The absence of secured income in ${city} — one of Canada's highest-cost cities — creates significant runway risk.`
  } else if (monthlyIncome > 0 && output.monthlyMin > 0) {
    const surplus = monthlyIncome - output.monthlyMin
    riskLine = surplus >= 0
      ? ` With monthly income of ${fmt(monthlyIncome)}, the client covers monthly costs of ${fmt(output.monthlyMin)} with ${fmt(surplus)} remaining each month.`
      : ` Monthly income of ${fmt(monthlyIncome)} does not fully cover monthly costs of ${fmt(output.monthlyMin)} — a ${fmt(-surplus)}/month deficit.`
  }

  return `${opening} ${savingsLine}${complianceLine}${riskLine}`.trim()
}

// ─── Section 2: generateAlternativeScenarios ─────────────────────────────────

export function generateAlternativeScenarios(
  input:          EngineInput,
  output:         EngineOutput,
  _monthlyIncome: number,
  registry?:      FactRegistry,
): AlternativeScenario[] {
  const scenarios: AlternativeScenario[] = []
  const cityLow   = input.city.toLowerCase()
  const curGap    = output.savingsGap

  // ── 1. City swap ──────────────────────────────────────────────────────────
  const alt = CHEAPER_CITY_ALT[cityLow]
  if (alt) {
    const savedOverRunway = alt.monthlySavings * output.runwayMonths
    const newTarget       = Math.max(0, output.safeSavingsTarget - savedOverRunway)
    const newGap          = Math.max(0, newTarget - input.liquidSavings)
    const delta           = newTarget - output.safeSavingsTarget

    scenarios.push({
      id: 'city_swap', icon: '🔄', positive: true,
      name:       `Destination: ${alt.city}`,
      change:     `Switch from ${cityLabel(input.city)} to ${alt.city}`,
      newTarget, newGap, delta,
      deltaLabel: `${fmt(Math.abs(delta))} lower target`,
      details:    alt.details,
    })
  }

  // ── 2. Housing downgrade ──────────────────────────────────────────────────
  const curRent = output.monthlyBreakdown.find(i => i.key === 'rent')?.cad ?? 0
  if (curRent > 0 && !['shared-room', 'staying-family'].includes(input.housingType)) {
    const savingPct  = input.housingType === '2br' ? 0.22 : input.housingType === '1br' ? 0.15 : 0.30
    const rentSaving = Math.round(curRent * savingPct)
    const downLabel  = input.housingType === '2br' ? '1-bedroom' : input.housingType === '1br' ? 'studio' : 'shared room'
    const totalSaved = rentSaving * output.runwayMonths + rentSaving * 2   // runway + deposit diff
    const newTargetH = Math.max(0, output.safeSavingsTarget - totalSaved)
    const newGapH    = Math.max(0, newTargetH - input.liquidSavings)
    const deltaH     = newTargetH - output.safeSavingsTarget

    scenarios.push({
      id: 'housing_down', icon: '🏢', positive: true,
      name:       `Housing: ${downLabel} apartment`,
      change:     `Downgrade to a ${downLabel}`,
      newTarget:  newTargetH, newGap: newGapH, delta: deltaH,
      deltaLabel: `${fmt(Math.abs(deltaH))} lower target`,
      details:    `Switching to a ${downLabel} saves ~${fmt(rentSaving)}/mo on rent and ~${fmt(rentSaving * 2)} on housing deposit. Over the ${output.runwayMonths}-month runway, the safe target falls by ${fmt(totalSaved)}.`,
    })
  }

  // ── 3. Delay landing 3 months ─────────────────────────────────────────────
  const ASSUMED_MONTHLY_SAVE = 500
  const DELAY_MONTHS         = 3
  const additionalSaved      = ASSUMED_MONTHLY_SAVE * DELAY_MONTHS
  const newGapDelay          = Math.max(0, curGap - additionalSaved)

  scenarios.push({
    id: 'delay_landing', icon: '⏳', positive: true,
    name:       `Delay landing by ${DELAY_MONTHS} months`,
    change:     `Save for ${DELAY_MONTHS} more months before arriving`,
    newTarget:  output.safeSavingsTarget,
    newGap:     newGapDelay,
    delta:      -additionalSaved,
    deltaLabel: `Gap closes by ${fmt(additionalSaved)}`,
    details:    `At an assumed savings rate of ${fmt(ASSUMED_MONTHLY_SAVE)}/month, a ${DELAY_MONTHS}-month delay adds ${fmt(additionalSaved)} to liquid savings. Gap reduces from ${fmt(curGap)} to ${fmt(newGapDelay)}. Full gap closure requires ~${Math.ceil(curGap / ASSUMED_MONTHLY_SAVE)} months at this rate.`,
  })

  // ── 4. Secure a job at median salary ─────────────────────────────────────
  const MEDIAN_SALARY: Record<string, number> = {
    ON: 72_000, BC: 68_000, AB: 75_000, QC: 60_000,
    MB: 58_000, SK: 62_000, NS: 55_000,
  }
  const medianGross   = MEDIAN_SALARY[input.province] ?? 65_000
  const approxNet     = Math.round(medianGross * 0.65 / 12)
  const JOB_RUNWAY    = 2   // months of buffer when job is secured
  const jobTarget     = output.upfront + output.monthlyMin * JOB_RUNWAY
  const jobGap        = Math.max(0, jobTarget - input.liquidSavings)
  const jobDelta      = jobTarget - output.safeSavingsTarget

  scenarios.push({
    id: 'income_scenario', icon: '💼', positive: true,
    name:       `Secure role at ${fmt(medianGross)}/year`,
    change:     `Land a job at ${fmt(medianGross)} median salary`,
    newTarget:  jobTarget, newGap: jobGap, delta: jobDelta,
    deltaLabel: jobGap === 0 ? 'Gap eliminated' : `${fmt(Math.abs(jobDelta))} lower target`,
    details:    `With a secured job at ${fmt(medianGross)} gross (~${fmt(approxNet)}/mo net), the runway assumption drops to ${JOB_RUNWAY} months. Safe target falls to ${fmt(jobTarget)} (upfront + ${JOB_RUNWAY} months buffer). ${input.liquidSavings >= jobTarget ? 'Current savings already exceed this reduced target.' : `Gap reduces to ${fmt(jobGap)}.`}`,
  })

  // Register and claim each scenario so downstream generators can cross-reference
  scenarios.forEach((s, i) => {
    registry?.register('scenario:' + s.id, {
      type:         'number',
      content:      `Scenario ${i + 1}: ${s.name}`,
      dollarImpact: s.delta,
    })
    registry?.claim('scenario:' + s.id, 'scenarios')
  })

  return scenarios
}

// ─── Section 3: generateGapStrategies ────────────────────────────────────────

export function generateGapStrategies(
  input:          EngineInput,
  output:         EngineOutput,
  _monthlyIncome: number,
  scenarios?:     AlternativeScenario[],
  registry?:      FactRegistry,
): GapStrategy[] {
  const strategies: GapStrategy[] = []
  const city       = cityLabel(input.city)
  const cityLow    = input.city.toLowerCase()
  const isHighCost = HIGH_COST_CITIES.has(cityLow)
  const hasJob     = input.jobStatus === 'secured' || input.jobStatus === 'offer'
  const isStudent  = input.pathway === 'study-permit'

  // ── 1. Shared housing (always if not already doing it) ────────────────────
  if (!['shared-room', 'staying-family'].includes(input.housingType)) {
    const curRent   = output.monthlyBreakdown.find(i => i.key === 'rent')?.cad ?? 0
    const shared    = Math.round(curRent * 0.55)
    const saving    = curRent - shared
    const totalSave = saving * output.runwayMonths + saving * 2

    strategies.push({
      title:      `Start in shared housing for the first ${output.runwayMonths} months`,
      impact:     -Math.round(totalSave),
      difficulty: 'Easy',
      timeline:   'Immediate',
      rationale:  `Shared housing in ${city} averages ~${fmt(shared)}/month vs ${fmt(curRent)} for a private unit. Over ${output.runwayMonths} months, this saves ${fmt(saving * output.runwayMonths)} on rent plus ~${fmt(saving * 2)} on the reduced housing deposit.`,
    })
  }

  // ── 2. Settlement agency furniture bank ───────────────────────────────────
  strategies.push({
    title:      'Use settlement agency furniture banks',
    impact:     -400,
    difficulty: 'Easy',
    timeline:   'Pre-arrival research',
    rationale:  'Organizations like Furniture Bank Toronto, Habitat for Humanity ReStores, and local newcomer settlement agencies provide free or low-cost furnishings. This can reduce setup costs from $500–$2,000 to near $0.',
  })

  // ── 3. Pre-arrival job search (non-student, no job) ───────────────────────
  if (!hasJob && !isStudent) {
    const jobImpact   = Math.max(5_000, Math.round(output.monthlySafe * (output.runwayMonths - 2)))
    const jobScenario = scenarios?.find(s => s.id === 'income_scenario')
    const jobScenarioIdx = jobScenario ? (scenarios!.findIndex(s => s.id === 'income_scenario') + 1) : null
    const jobClaimed  = registry && !registry.isAvailable('scenario:income_scenario')
    strategies.push({
      title:      'Accelerate job search — apply pre-arrival',
      impact:     -jobImpact,
      difficulty: 'Moderate',
      timeline:   'Start now',
      rationale:  (jobClaimed && jobScenario && jobScenarioIdx)
        ? `Securing employment before landing is the highest-impact financial action. See Scenario ${jobScenarioIdx} (${jobScenario.name}) for the full target reduction. Even a conditional offer significantly improves readiness.`
        : `Securing a job offer before landing changes the runway assumption from ${output.runwayMonths} months to 2 months, reducing the safe savings target by ~${fmt(jobImpact)}. Even a conditional offer significantly improves financial readiness.`,
    })
  }

  // ── 4. Study permit: maximize part-time work ─────────────────────────────
  if (isStudent) {
    const ptMax   = STUDY_PERMIT_DEFAULTS.studentWorkRights.maxHoursPerWeekTerm
    const minWage = STUDY_PERMIT_DEFAULTS.provincialMinWages.find(w => w.provinceCode === input.province)?.hourlyRate ?? 15.80
    const ptHours = 20
    const monthly = Math.round(ptHours * minWage * 4.33)
    strategies.push({
      title:      `Maximize off-campus part-time work (up to ${ptMax} hours/week)`,
      impact:     -Math.round(monthly * 8),   // 8-month academic year
      difficulty: 'Moderate',
      timeline:   'After arrival',
      rationale:  `Students in ${input.province} can work up to ${ptMax} hours per week off campus during regular academic sessions and full-time during scheduled breaks. On-campus work has no hourly limit. At $${minWage.toFixed(2)}/hr, ${ptHours} hrs/week generates ~${fmt(monthly)}/month — significantly extending financial runway. This income does not count toward IRCC proof of funds.`,
    })
  }

  // ── 5. Stepping-stone city (expensive city + no job) ─────────────────────
  if (isHighCost && !hasJob && !isStudent) {
    const alt = CHEAPER_CITY_ALT[cityLow]
    if (alt) {
      const cityScenario = scenarios?.find(s => s.id === 'city_swap')
      const cityScenarioIdx = cityScenario ? (scenarios!.findIndex(s => s.id === 'city_swap') + 1) : null
      const cityClaimed = registry && !registry.isAvailable('scenario:city_swap')
      strategies.push({
        title:      `Consider a 'stepping stone' city strategy`,
        impact:     -Math.round(alt.monthlySavings * 12),
        difficulty: 'Moderate',
        timeline:   'Planning phase',
        rationale:  (cityClaimed && cityScenario && cityScenarioIdx)
          ? `See Scenario ${cityScenarioIdx} (${cityScenario.name}) for the gap impact. Land in ${alt.city} for 6–12 months to build Canadian experience and credit history, then transfer to ${city}.`
          : `Land in ${alt.city} for 6–12 months to build Canadian work experience and credit history, then transfer to ${city}. Monthly costs are 20–30% lower, closing the savings gap while building a financial cushion.`,
      })
    }
  }

  // ── 6. Pathway-specific action ────────────────────────────────────────────
  if (input.pathway.startsWith('express-entry') || input.pathway === 'pnp') {
    strategies.push({
      title:      'Enter the Express Entry pool immediately',
      impact:     0,
      difficulty: 'Easy',
      timeline:   'Now',
      rationale:  'Entering the pool sooner gives more lead time to save. If an ITA takes 6+ months, the client gains natural runway to close the savings gap at their current rate without delaying the immigration timeline.',
    })
  }

  // ── 7. Remote start negotiation (hard, conditional) ──────────────────────
  if (!hasJob && !isStudent) {
    strategies.push({
      title:      'Negotiate a remote start with a Canadian employer',
      impact:     -Math.round(output.monthlySafe * 1.5),
      difficulty: 'Hard',
      timeline:   'Job search phase',
      rationale:  `If the client secures an employer willing to allow 1–2 months of remote work before relocation, they begin earning Canadian income while still benefiting from lower overseas living costs — effectively shrinking the savings gap.`,
    })
  }

  // Sort by impact (largest savings first), qualitative last
  return strategies.sort((a, b) => a.impact - b.impact)
}

// ─── Section 4: generateProgramNotes ─────────────────────────────────────────

export function generateProgramNotes(
  input:                  EngineInput,
  output:                 EngineOutput,
  irccCompliance:         IRCCComplianceResult | null,
  complianceRequirement:  number | null,
  registry?:              FactRegistry,
  hasStudyPermitAdvisory?: boolean,
): ProgramNote[] {
  const notes: ProgramNote[] = []
  const prov = input.province

  // ── Express Entry / PNP ───────────────────────────────────────────────────
  if (input.pathway.startsWith('express-entry') || input.pathway === 'pnp') {
    const required = complianceRequirement ?? 0
    const buffer   = input.liquidSavings - required

    // CEC exemption note
    if (input.pathway === 'express-entry-cec') {
      notes.push({
        title:    'Proof of Funds: Exempt (CEC)',
        severity: 'positive',
        color:    C.accent,
        content:  'This client qualifies for the CEC proof-of-funds exemption: Canadian Experience Class with a valid job offer and current work authorization. No IRCC settlement funds minimum applies. However, the client should still demonstrate sufficient funds for the landing transition period. The real-world savings target above reflects this.',
        source:   'https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/documents/proof-funds.html',
      })
    }

    // Proof of funds
    if (complianceRequirement !== null) {
      const feeEst = Math.round(output.upfront * 0.30)
      const effBuf = buffer - feeEst
      notes.push({
        title:    buffer < 0 ? 'Proof of Funds: Below IRCC Minimum'
                : buffer < 3_000 ? 'Proof of Funds: Compliant but Thin'
                : 'Proof of Funds: Compliant',
        severity: buffer < 0 ? 'negative' : buffer < 3_000 ? 'warning' : 'positive',
        color:    buffer < 0 ? C.red : buffer < 3_000 ? C.gold : C.accent,
        content:  buffer < 0
          ? `IRCC requires ${fmt(required)} in settlement funds. Client has ${fmt(input.liquidSavings)} — a shortfall of ${fmt(-buffer)}. This must be resolved before the application can advance.`
          : `IRCC requires ${fmt(required)} for this pathway. Client's ${fmt(input.liquidSavings)} exceeds this by ${fmt(buffer)}. After estimated application fees (~${fmt(feeEst)}), the effective buffer drops to ~${fmt(effBuf)}. Funds must remain accessible and documented through landing.`,
        source: 'https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/documents/proof-funds.html',
      })
    }

    // RPRF timing
    notes.push({
      title:    'RPRF Payment Timing',
      severity: 'info',
      color:    C.blue,
      content:  'The Right of Permanent Residence Fee ($515 per adult) can be paid at any time before landing. Recommend paying early to avoid last-minute pressure on savings and to signal readiness to IRCC.',
      source:   'https://ircc.canada.ca/english/information/fees/fees.asp',
    })

    // Landing deadline flexibility
    notes.push({
      title:    'COPR Landing Deadline Flexibility',
      severity: 'info',
      color:    C.blue,
      content:  'After receiving the Confirmation of Permanent Residence (COPR), the client typically has up to 12 months to complete landing. If the savings gap is a concern, they can use this window to build additional reserves — aligns with the delayed landing scenario above.',
    })

    // Health coverage by province
    if (prov === 'ON') {
      notes.push({
        title:    'Ontario OHIP: No Waiting Period',
        severity: 'positive',
        color:    C.accent,
        content:  'Ontario: No waiting period — immediate OHIP coverage upon establishing residency. No private insurance bridge is required. This is a cost advantage vs. BC or Saskatchewan where a wait period applies.',
        source:   'https://www.ontario.ca/page/apply-ohip-and-get-health-card',
      })
    } else if (['BC', 'SK', 'NB', 'PE'].includes(prov)) {
      const waitMap:  Record<string, number> = { BC: 3, SK: 3, NB: 2, PE: 3 }
      const planMap:  Record<string, string> = { BC: 'MSP', SK: 'Saskatchewan Health', NB: 'Medicare', PE: 'PEI Health Card' }
      const wait = waitMap[prov]
      notes.push({
        title:    `${wait}-Month Health Coverage Gap (${planMap[prov]})`,
        severity: 'warning',
        color:    C.gold,
        content:  `${planMap[prov]} has a ${wait}-month wait period for new residents. Budget ~${fmt(wait * 200)} for private bridge insurance during this gap. Include this in upfront cost planning.`,
      })
    }
  }

  // ── Study Permit ──────────────────────────────────────────────────────────
  if (input.pathway === 'study-permit') {
    // Detailed advisory is in the separate StudyPermitAdvisory block;
    // add high-level notes here for the program notes section.
    const isQC = prov === 'QC'

    if (irccCompliance !== null) {
      notes.push({
        title:    irccCompliance.compliant ? 'IRCC Proof of Funds: Compliant' : 'IRCC Proof of Funds: Shortfall',
        severity: irccCompliance.compliant ? 'positive' : 'negative',
        color:    irccCompliance.compliant ? C.accent : C.red,
        content:  (registry && hasStudyPermitAdvisory)
          // Study Permit Advisory Block has full detail — keep this note brief
          ? `IRCC requirement: ${fmt(irccCompliance.required)}. Status: ${irccCompliance.compliant ? `compliant ✓` : `shortfall of ${fmt(irccCompliance.shortfall)}`}. Full details in Study Permit Advisory Block below.`
          : irccCompliance.compliant
            ? `Client meets the IRCC study permit proof-of-funds requirement of ${fmt(irccCompliance.required)} (tuition ${fmt(irccCompliance.tuition)} + living ${fmt(irccCompliance.livingExpenses)} + transport ${fmt(irccCompliance.transport)}).`
            : `Client is ${fmt(irccCompliance.shortfall)} short of the IRCC proof-of-funds requirement of ${fmt(irccCompliance.required)}. Insufficient proof of funds is the leading cause of study permit refusals.`,
        source: 'https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada/study-permit/get-documents/study-permit-requirements.html',
      })
    }

    if (isQC) {
      notes.push({
        title:    'Quebec: CAQ Required Before Study Permit',
        severity: 'warning',
        color:    C.gold,
        content:  "Studying in Quebec requires a Certificat d'acceptation du Québec (CAQ) from the Ministère de l'Immigration du Québec (MIFI) before applying for the federal study permit. Quebec proof-of-funds thresholds also exceed the federal minimum. Allow 4–8 weeks for CAQ processing.",
        source:   'https://www.quebec.ca/en/education/study-in-quebec/temporary-study-permit',
      })
    }

    notes.push({
      title:    'Post-Graduation Work Permit (PGWP)',
      severity: 'info',
      color:    C.blue,
      content:  'Graduates of eligible Canadian institutions may qualify for a Post-Graduation Work Permit (PGWP) valid for up to 3 years. This is a common pathway to Canadian work experience and eventual permanent residency through CEC. Advise client to confirm their institution and program are PGWP-eligible.',
      source:   'https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada/work/after-graduation.html',
    })
  }

  // ── Work Permit ───────────────────────────────────────────────────────────
  if (input.pathway === 'work-permit') {
    notes.push({
      title:    'Work Permit Tied to Employer (Closed WP)',
      severity: 'warning',
      color:    C.gold,
      content:  'A closed work permit is tied to a specific employer. If employment ends, the client may lose authorization to work. Ensure the employment contract is solid before landing and understand LMIA-exempt pathways for future flexibility.',
    })
    notes.push({
      title:    'Pathway to Permanent Residency via CEC',
      severity: 'info',
      color:    C.blue,
      content:  'Work permit holders typically qualify for Canadian Experience Class (CEC) Express Entry after 1 year of skilled Canadian work experience (NOC TEER 0, 1, 2, or 3). Advise client to track hours and obtain reference letters from day one.',
    })
  }

  // ── Family Sponsorship ────────────────────────────────────────────────────
  if (input.pathway === 'family-sponsorship') {
    notes.push({
      title:    'Undertaking Obligation',
      severity: 'warning',
      color:    C.gold,
      content:  'The Canadian sponsor must sign a legally binding undertaking to provide for the sponsored person for 3 years (spouse/partner) or up to 10 years (dependent children under 22). Both parties should fully understand this obligation before proceeding.',
    })
  }

  // ── Fallback if no specific notes generated ───────────────────────────────
  if (notes.length === 0) {
    notes.push({
      title:    'No Mandatory IRCC Funds Requirement',
      severity: 'info',
      color:    C.blue,
      content:  `The ${input.pathway.replace(/-/g, ' ')} pathway does not have a specific IRCC proof-of-funds minimum. However, border officers assess financial self-sufficiency. The settlement amounts shown are real-world estimates for a comfortable start.`,
    })
  }

  return notes
}

// ─── Section 4b: generateStudyPermitAdvisory ─────────────────────────────────

export function generateStudyPermitAdvisory(
  input:          EngineInput,
  output:         EngineOutput,
  irccCompliance: IRCCComplianceResult,
  data:           StudyPermitData = STUDY_PERMIT_DEFAULTS,
): StudyPermitAdvisory {
  const sp         = input.studyPermit!
  const prov       = input.province

  // ── 1. IRCC Proof of Funds Compliance ────────────────────────────────────
  const proofOfFunds: StudyPermitAdvisorySubsection = {
    title:  'IRCC Proof of Funds Compliance',
    status: irccCompliance.compliant ? 'compliant' : irccCompliance.shortfall > 5_000 ? 'critical' : 'at-risk',
    metric: `${fmt(irccCompliance.required)} required`,
    content: irccCompliance.compliant
      ? `Client meets the IRCC proof-of-funds requirement of ${fmt(irccCompliance.required)} (tuition ${fmt(irccCompliance.tuition)} + living ${fmt(irccCompliance.livingExpenses)} + transport ${fmt(irccCompliance.transport)}). GIC status: ${sp.gicStatus === 'purchased' ? 'purchased ✓' : sp.gicStatus === 'planning' ? 'planning to purchase' : 'not purchasing — confirm alternative documentation is strong'}. IRCC may verify funds at the port of entry.`
      : `Client is ${fmt(irccCompliance.shortfall)} short of the IRCC requirement of ${fmt(irccCompliance.required)}. This is the #1 reason for study permit refusals. Immediate action required: consider a GIC (${fmt(data.gicMinimum)} minimum from a designated bank) or documented scholarship/loan letters to bridge the gap.`,
  }

  // ── 2. Tuition & Program Costs ────────────────────────────────────────────
  const tuition    = sp.tuitionAmount
  const benchmarks = data.tuitionBenchmarks
  const benchmark  = sp.programLevel === 'undergraduate' ? benchmarks.undergraduate
                   : sp.programLevel === 'graduate'      ? benchmarks.graduate
                   : (benchmarks.collegeDiplomaLow + benchmarks.collegeDiplomaHigh) / 2
  const aboveBench = tuition > benchmark * 1.1
  const tuitionCosts: StudyPermitAdvisorySubsection = {
    title:  'Tuition & Program Costs',
    status: aboveBench ? 'at-risk' : 'info',
    metric: `${fmt(tuition)}/year`,
    content: `${sp.programLevel.replace(/-/g, ' ')} program at ${fmt(tuition)}/year. National benchmark: ~${fmt(benchmark)}/year. ${aboveBench ? `Tuition is ${Math.round((tuition / benchmark - 1) * 100)}% above benchmark — explore scholarships or institution alternatives.` : 'Tuition is within typical range.'}${sp.scholarshipAmount > 0 ? ` A scholarship of ${fmt(sp.scholarshipAmount)} has been applied to reduce the savings gap.` : ''}`,
  }

  // ── 3. Health Coverage Strategy ───────────────────────────────────────────
  const healthEntry = data.healthInsuranceByProvince.find(h => h.provinceCode === prov)
  const healthCoverage: StudyPermitAdvisorySubsection = (() => {
    if (!healthEntry) {
      return {
        title: 'Health Coverage Strategy', status: 'info' as const,
        content: 'Advise client to contact their institution\'s international student office for mandatory health plan details and associated costs.',
      }
    }
    if (!healthEntry.hasProvincialCoverage) {
      return {
        title: 'Health Coverage Strategy', status: 'at-risk' as const,
        metric: `${fmt(healthEntry.annualCostCAD)}/year`,
        content: `${prov} does not provide provincial health coverage to international students. ${healthEntry.mechanism} is mandatory and typically billed through the institution. Annual cost: ${fmt(healthEntry.annualCostCAD)}. Confirm this is included in the tuition estimate or add it separately.`,
      }
    }
    if (healthEntry.waitPeriodMonths > 0) {
      return {
        title: 'Health Coverage Strategy', status: 'at-risk' as const,
        metric: `${healthEntry.waitPeriodMonths}-month wait`,
        content: `${prov} provides ${healthEntry.mechanism} for international students after a ${healthEntry.waitPeriodMonths}-month waiting period. Bridge insurance is required during the gap — estimated cost ${fmt(healthEntry.bridgeCostCAD)}. This should be included in upfront cost planning.`,
      }
    }
    return {
      title: 'Health Coverage Strategy', status: 'compliant' as const,
      content: `${prov} provides ${healthEntry.mechanism} to international students with no waiting period and no supplemental premium. No bridge insurance needed.`,
    }
  })()

  // ── 4. Part-Time Work Income Projection ───────────────────────────────────
  const ptRights  = data.studentWorkRights
  const minWage   = data.provincialMinWages.find(w => w.provinceCode === prov)?.hourlyRate ?? ptRights.estimatedHourlyRateLow
  const ptHours   = 20
  const ptMonthly = Math.round(ptHours * minWage * 4.33)
  const partTimeIncome: StudyPermitAdvisorySubsection = {
    title:  'Part-Time Work Income Projection',
    status: 'info',
    metric: `~${fmt(ptMonthly)}/month estimated`,
    content: `Students in ${prov} may work up to ${ptRights.maxHoursPerWeekTerm} hours per week off campus during regular academic sessions, and full-time during scheduled breaks. On-campus work has no hourly limit. At $${minWage.toFixed(2)}/hr minimum wage, ${ptHours} hrs/week generates ~${fmt(ptMonthly)}/month. This income does NOT count toward IRCC proof of funds. It is supplemental post-arrival cash flow only and depends on securing eligible employment.`,
  }

  // ── 5. Key Risk: Study Permit Refusal ────────────────────────────────────
  const refusalFactors: string[] = []
  if (!irccCompliance.compliant)     refusalFactors.push('Insufficient proof of funds (primary refusal reason)')
  if (sp.gicStatus === 'not-purchasing') refusalFactors.push('No GIC — alternative proof of funds documentation must be strong')
  if (prov === 'QC')                 refusalFactors.push('Quebec requires CAQ approval before the federal study permit can be issued')
  if (tuition > benchmark * 1.5)    refusalFactors.push('Very high tuition relative to program benchmark may trigger officer scrutiny')
  if (!sp.biometricsDone)           refusalFactors.push('Biometrics not yet collected — required for most applicants')

  const refusalStatus: StudyPermitAdvisorySubsection['status'] =
    refusalFactors.some(f => f.includes('proof of funds')) ? 'critical'
    : refusalFactors.length >= 2 ? 'at-risk'
    : refusalFactors.length >= 1 ? 'at-risk'
    : 'compliant'

  const refusalRisk: StudyPermitAdvisorySubsection = {
    title:   'Key Risk: Study Permit Refusal',
    status:  refusalStatus,
    content: refusalFactors.length === 0
      ? 'No significant refusal risk factors identified. Client appears to meet IRCC\'s core requirements. Ensure the Letter of Acceptance, proof of funds documentation, and biometrics are organized and consistent with the application.'
      : `${refusalFactors.length} refusal risk factor${refusalFactors.length > 1 ? 's' : ''} identified: ${refusalFactors.map((f, i) => `(${i + 1}) ${f}`).join('; ')}. Each must be resolved before application submission.`,
  }

  return { proofOfFunds, tuitionCosts, healthCoverage, partTimeIncome, refusalRisk }
}

// ─── Section 5: generateMeetingGuide ─────────────────────────────────────────

export function generateMeetingGuide(
  input:         EngineInput,
  output:        EngineOutput,
  monthlyIncome: number,
  risks:         Risk[],
  scenarios:     AlternativeScenario[],
  strategies:    GapStrategy[],
  programNotes:  ProgramNote[],
  registry?:     FactRegistry,
): MeetingGuide {
  const city       = cityLabel(input.city)
  const cityLow    = input.city.toLowerCase()
  const hasGap     = output.savingsGap > 0
  const isHighCost = HIGH_COST_CITIES.has(cityLow)
  const hasJob     = input.jobStatus === 'secured' || input.jobStatus === 'offer'
  const isStudent  = input.pathway === 'study-permit'

  // ── Talking points ─────────────────────────────────────────────────────────
  const talkingPoints: string[] = []

  if (hasGap) {
    const top2     = strategies.slice(0, 2)
    const combined = Math.abs(top2.reduce((s, st) => s + st.impact, 0))
    talkingPoints.push(
      registry
        ? `Address the ${fmt(output.savingsGap)} gap: lead with Strategies 1 & 2 as a package (combined impact: ~${fmt(combined)}).`
        : `Address the ${fmt(output.savingsGap)} savings gap first — present the combined strategies (${top2.map(s => `"${s.title}"`).join(' and ')}) as a package that could reduce the gap by ~${fmt(combined)}.`
    )
  } else {
    talkingPoints.push(
      'Client is financially ready. Focus the meeting on pre-arrival logistics: opening a Canadian bank account, rental application package, and temporary accommodation plan for the first 2–4 weeks.'
    )
  }

  const compNote = programNotes.find(n => n.title.toLowerCase().includes('proof of funds'))
  if (compNote) {
    talkingPoints.push(
      compNote.severity === 'positive'
        ? `Confirm proof-of-funds compliance is met. Remind client that funds must remain accessible and documented through landing — do not use these funds before the COPR or permit is stamped.`
        : `Proof of funds is a critical concern: ${compNote.content.split('.')[0]}.`
    )
  }

  if (!hasJob && !isStudent) {
    const jobScenario    = scenarios.find(s => s.id === 'income_scenario')
    const jobIdx         = jobScenario ? scenarios.findIndex(s => s.id === 'income_scenario') + 1 : null
    const jobClaimed     = registry && !registry.isAvailable('scenario:income_scenario')
    talkingPoints.push(
      (registry && jobClaimed && jobScenario && jobIdx)
        ? `Discuss the pre-arrival job search — the highest-impact action (see Scenario ${jobIdx}: ${jobScenario.name}).`
        : `Discuss the pre-arrival job search strategy — this is the single highest-impact action. ${jobScenario ? `A secured job offer reduces the safe target from ${fmt(output.safeSavingsTarget)} to ${fmt(jobScenario.newTarget)}` : 'Securing income before landing significantly reduces financial risk'}.`
    )
  }

  const citySwap     = scenarios.find(s => s.id === 'city_swap')
  const citySwapIdx  = citySwap ? scenarios.findIndex(s => s.id === 'city_swap') + 1 : null
  const citySwapClaimed = registry && !registry.isAvailable('scenario:city_swap')
  if (citySwap && hasGap) {
    talkingPoints.push(
      (registry && citySwapClaimed && citySwapIdx)
        ? `Present Scenario ${citySwapIdx}: ${citySwap.name} as a Plan B — see Scenario Analysis for gap-reduction detail.`
        : `Present the ${citySwap.name} alternative as a Plan B — it ${citySwap.newGap === 0 ? 'eliminates the gap entirely' : `reduces the gap to ${fmt(citySwap.newGap)}`} by lowering the safe target by ${fmt(Math.abs(citySwap.delta))}.`
    )
  }

  if (isStudent) {
    talkingPoints.push(
      `Walk through the IRCC proof-of-funds checklist and GIC documentation requirements. Confirm the Letter of Acceptance is from a Designated Learning Institution (DLI) and that the client understands the biometrics timeline.`
    )
  }

  talkingPoints.push(
    `Run the Newcomer Budget Calculator together to build a month-by-month cash flow plan for the first ${output.runwayMonths} months — this gives the client a concrete financial roadmap to take away.`
  )

  // ── Discovery questions ────────────────────────────────────────────────────
  const questions: string[] = [
    `Do you have any family or friends in ${city} who could provide temporary housing for the first 2–4 weeks? This could save $700–$1,400 in short-term accommodation costs.`,
    `How flexible is your arrival timeline? If you can delay by 3–6 months, the savings gap closes significantly even at a modest ${fmt(500)}/month savings rate.`,
  ]

  if (isHighCost && !hasJob && !isStudent) {
    questions.push(
      `Are you open to starting in a smaller city for 6–12 months to build Canadian experience before moving to ${city}? The cost-of-living difference is substantial and could eliminate your savings gap.`
    )
  }

  if (isStudent) {
    questions.push(
      `Have you confirmed your institution and program are eligible for a Post-Graduation Work Permit (PGWP)? This dramatically affects your long-term immigration pathway.`
    )
  } else {
    questions.push(
      `Do you have professional contacts or LinkedIn connections in Canada who could assist with your job search? Pre-arrival networking significantly improves employment outcomes and reduces time-to-income.`
    )
  }

  // ── Red flags ─────────────────────────────────────────────────────────────
  const redFlags: RedFlag[] = []

  for (const risk of risks) {
    if (risk.severity === 'critical' || risk.severity === 'high') {
      redFlags.push({ flag: risk.title, detail: risk.description })
    }
  }

  if (hasGap && isHighCost && !hasJob && !isStudent) {
    redFlags.push({
      flag:   `No income source in a high-cost city`,
      detail: `${city} is one of Canada's most expensive cities. Without secured income, the ${output.runwayMonths}-month runway burns through ${fmt(output.monthlyMin * output.runwayMonths)} in living expenses. The client needs a clear income strategy before or immediately upon landing.`,
    })
  }

  // ── Cross-referrals ────────────────────────────────────────────────────────
  const crossReferrals: CrossReferral[] = [
    {
      tool:   'Newcomer Budget Calculator',
      link:   '/calculators/newcomer-budget',
      reason: `Build a month-by-month cash flow plan for the first ${output.runwayMonths} months after arrival`,
    },
    {
      tool:   'TFSA vs RRSP Calculator',
      link:   '/calculators/tfsa-vs-rrsp',
      reason: 'Plan first-year savings strategy once income is established in Canada',
    },
    {
      tool:   'Income Tax Estimator',
      link:   '/tools/rrsp-refund',
      reason: 'Model take-home pay scenarios at different Canadian salary levels',
    },
  ]

  return { talkingPoints, questions, redFlags, crossReferrals }
}

// ─── Main: generateConsultantAdvisory ────────────────────────────────────────

export function generateConsultantAdvisory(
  input:                 EngineInput,
  output:                EngineOutput,
  monthlyIncome:         number,
  risks:                 Risk[],
  complianceRequirement: number | null,
  irccCompliance?:       IRCCComplianceResult,
  studyPermitData?:      StudyPermitData,
): ConsultantAdvisory {
  // Priority order: scenarios → strategies → studyPermitAdvisory → notes → meetingGuide
  const registry = new FactRegistry()

  const readiness  = computeReadinessScore(input, output, monthlyIncome, risks, complianceRequirement, registry)
  const scenarios  = generateAlternativeScenarios(input, output, monthlyIncome, registry)
  const strategies = generateGapStrategies(input, output, monthlyIncome, scenarios, registry)

  // Generate study permit advisory BEFORE program notes so the IRCC fact can be claimed
  const studyPermitAdvisory = (input.pathway === 'study-permit' && irccCompliance && input.studyPermit)
    ? generateStudyPermitAdvisory(input, output, irccCompliance, studyPermitData ?? STUDY_PERMIT_DEFAULTS)
    : undefined

  const programNotes = generateProgramNotes(
    input, output, irccCompliance ?? null, complianceRequirement,
    registry, !!studyPermitAdvisory,
  )

  const meetingGuide = generateMeetingGuide(
    input, output, monthlyIncome, risks, scenarios, strategies, programNotes, registry,
  )

  return { readiness, scenarios, strategies, programNotes, studyPermitAdvisory, meetingGuide }
}
