/**
 * Settlement Planner — Study Permit Engine Module (E11)
 *
 * Pure functions for study-permit-specific financial calculations.
 * All IRCC thresholds come from Sanity (studyPermitData); hardcoded
 * fallbacks are used only if the Sanity document is unavailable.
 *
 * Data effective: September 1, 2025 (federal) / January 1, 2026 (Quebec)
 */

import type { CityBaseline } from './baselines'
import {
  DEPOSIT_MONTHS,
  FURNISHING_COST,
  computeOneWayFlight,
  computeRoundTripFlight,
  rentFromBaseline,
} from './constants'
import type { BreakdownItem, EngineInput, StudyPermitInputs } from './types'

/** Normalize a city name to a Sanity catalog key fragment (e.g. "Montréal" → "montreal"). */
function citySlug(name: string): string {
  return name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-')
}

// ─── StudyPermitData interface ────────────────────────────────────────────────

export interface ProofOfFundsEntry {
  familyMembers: number
  amountCAD:     number
}

export interface HealthInsuranceEntry {
  provinceCode:          string
  hasProvincialCoverage: boolean
  mechanism:             string
  annualCostCAD:         number
  waitPeriodMonths:      number
  bridgeCoverageNeeded:  boolean
  bridgeCostCAD:         number
}

export interface StudyPermitData {
  effectiveDate:               string
  proofOfFundsLiving:          ProofOfFundsEntry[]
  proofOfFundsAdditionalMember: number
  quebecProofOfFunds: {
    effectiveDate:        string
    singleAdult18Plus:    number
    singleUnder18:        number
    perAdditionalMember:  number
  }
  tuitionBenchmarks: {
    undergraduate:      number
    graduate:           number
    collegeDiplomaLow:  number
    collegeDiplomaHigh: number
  }
  gicMinimum:                  number
  gicProcessingFee:            number
  healthInsuranceByProvince:   HealthInsuranceEntry[]
  studentWorkRights: {
    maxHoursPerWeekTerm:     number
    maxHoursPerWeekBreak:    number
    estimatedHourlyRateLow:  number
    estimatedHourlyRateHigh: number
  }
  provincialMinWages: Array<{ provinceCode: string; hourlyRate: number }>
}

export interface IRCCComplianceResult {
  required:       number   // total IRCC proof of funds required
  tuition:        number   // tuition component
  livingExpenses: number   // living expense component
  transport:      number   // $2,000 transport estimate
  isQuebec:       boolean
  compliant:      boolean  // availableFunds >= required
  shortfall:      number   // max(0, required - availableFunds)
}

// ─── Hardcoded fallback (used if Sanity data unavailable) ─────────────────────

export const STUDY_PERMIT_DEFAULTS: StudyPermitData = {
  effectiveDate:               '2025-09-01',
  proofOfFundsAdditionalMember: 6_170,
  proofOfFundsLiving: [
    { familyMembers: 1, amountCAD: 22_895 },
    { familyMembers: 2, amountCAD: 28_502 },
    { familyMembers: 3, amountCAD: 35_040 },
    { familyMembers: 4, amountCAD: 42_543 },
    { familyMembers: 5, amountCAD: 48_252 },
    { familyMembers: 6, amountCAD: 54_420 },
    { familyMembers: 7, amountCAD: 60_589 },
  ],
  quebecProofOfFunds: {
    effectiveDate:       '2026-01-01',
    singleAdult18Plus:   24_617,
    singleUnder18:       24_617,
    perAdditionalMember: 6_170,
  },
  tuitionBenchmarks: {
    undergraduate:      41_746,
    graduate:           24_028,
    collegeDiplomaLow:  7_000,
    collegeDiplomaHigh: 22_000,
  },
  gicMinimum:       22_895,
  gicProcessingFee: 200,
  healthInsuranceByProvince: [
    { provinceCode: 'ON', hasProvincialCoverage: false, mechanism: 'UHIP',                    annualCostCAD:   792, waitPeriodMonths: 0, bridgeCoverageNeeded: false, bridgeCostCAD:   0 },
    { provinceCode: 'BC', hasProvincialCoverage: true,  mechanism: 'MSP',                     annualCostCAD:     0, waitPeriodMonths: 3, bridgeCoverageNeeded: true,  bridgeCostCAD: 900 },
    { provinceCode: 'AB', hasProvincialCoverage: true,  mechanism: 'AHCIP',                   annualCostCAD:     0, waitPeriodMonths: 0, bridgeCoverageNeeded: false, bridgeCostCAD:   0 },
    { provinceCode: 'QC', hasProvincialCoverage: false, mechanism: 'RAMQ (partial)',           annualCostCAD: 1_000, waitPeriodMonths: 0, bridgeCoverageNeeded: false, bridgeCostCAD:   0 },
    { provinceCode: 'MB', hasProvincialCoverage: false, mechanism: 'Private/university plan', annualCostCAD:   700, waitPeriodMonths: 0, bridgeCoverageNeeded: false, bridgeCostCAD:   0 },
    { provinceCode: 'SK', hasProvincialCoverage: true,  mechanism: 'SHIP',                    annualCostCAD:     0, waitPeriodMonths: 3, bridgeCoverageNeeded: true,  bridgeCostCAD: 300 },
    { provinceCode: 'NS', hasProvincialCoverage: false, mechanism: 'University plan',          annualCostCAD:   850, waitPeriodMonths: 0, bridgeCoverageNeeded: false, bridgeCostCAD:   0 },
    { provinceCode: 'NB', hasProvincialCoverage: true,  mechanism: 'Medicare',                annualCostCAD:     0, waitPeriodMonths: 2, bridgeCoverageNeeded: true,  bridgeCostCAD: 200 },
    { provinceCode: 'PE', hasProvincialCoverage: true,  mechanism: 'PEI Health Card',         annualCostCAD:     0, waitPeriodMonths: 3, bridgeCoverageNeeded: true,  bridgeCostCAD: 300 },
    { provinceCode: 'NL', hasProvincialCoverage: true,  mechanism: 'MCP',                     annualCostCAD:     0, waitPeriodMonths: 0, bridgeCoverageNeeded: false, bridgeCostCAD:   0 },
  ],
  studentWorkRights: {
    maxHoursPerWeekTerm:     24,
    maxHoursPerWeekBreak:    40,
    estimatedHourlyRateLow:  15,
    estimatedHourlyRateHigh: 18,
  },
  // Provincial minimum wages — verified 2026 values.
  // Note: BC $18.25 is effective June 1, 2026 (forward rate used for planning);
  //       $17.85 is current through May 31, 2026.
  // Sources:
  //   ON: ontario.ca/page/employment-standard-exemptions (effective Oct 1, 2024 → $17.20)
  //   BC: labour.gov.bc.ca/esb/ESBAct/regulations/mworder.htm ($17.85 → $18.25 Jun 1 2026)
  //   AB: alberta.ca/minimum-wage ($15.00)
  //   QC: travail.gouv.qc.ca/en/employers/labour-standards/wages ($15.75)
  //   MB: gov.mb.ca/labour/standards/doc,minimum_wage,factsheet.html ($15.80)
  //   SK: saskatchewan.ca/business/employment-standards/minimum-wage ($15.00)
  //   NS: novascotia.ca/lae/employmentrights/minimumwage.asp ($15.20)
  //   NB: gnb.ca/content/gnb/en/departments/post-secondary_education_training_and_labour/labour/content/employment_standards/minimum_wage.html ($15.30)
  //   PE: princeedwardisland.ca/en/information/workforce-advanced-learning-and-population/minimum-wage ($15.40)
  //   NL: gov.nl.ca/ecc/labour-standards/minimum-wage/ ($15.60)
  provincialMinWages: [
    { provinceCode: 'ON', hourlyRate: 17.20 },
    { provinceCode: 'BC', hourlyRate: 18.25 },   // $17.85 current (< Jun 2026); $18.25 effective Jun 1 2026
    { provinceCode: 'AB', hourlyRate: 15.00 },
    { provinceCode: 'QC', hourlyRate: 15.75 },
    { provinceCode: 'MB', hourlyRate: 15.80 },
    { provinceCode: 'SK', hourlyRate: 15.00 },
    { provinceCode: 'NS', hourlyRate: 15.20 },
    { provinceCode: 'NB', hourlyRate: 15.30 },
    { provinceCode: 'PE', hourlyRate: 15.40 },
    { provinceCode: 'NL', hourlyRate: 15.60 },
  ],
}

// ─── fetchStudyPermitData ─────────────────────────────────────────────────────

/**
 * Extract and return typed StudyPermitData from a raw Sanity immigrationFees
 * document. Falls back to STUDY_PERMIT_DEFAULTS if the field is absent.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function fetchStudyPermitData(doc: Record<string, any> | null | undefined): StudyPermitData {
  if (!doc?.studyPermitData) return STUDY_PERMIT_DEFAULTS
  return {
    effectiveDate:                doc.studyPermitData.effectiveDate                ?? STUDY_PERMIT_DEFAULTS.effectiveDate,
    proofOfFundsLiving:           doc.studyPermitData.proofOfFundsLiving           ?? STUDY_PERMIT_DEFAULTS.proofOfFundsLiving,
    proofOfFundsAdditionalMember: doc.studyPermitData.proofOfFundsAdditionalMember ?? STUDY_PERMIT_DEFAULTS.proofOfFundsAdditionalMember,
    quebecProofOfFunds:           doc.studyPermitData.quebecProofOfFunds           ?? STUDY_PERMIT_DEFAULTS.quebecProofOfFunds,
    tuitionBenchmarks:            doc.studyPermitData.tuitionBenchmarks            ?? STUDY_PERMIT_DEFAULTS.tuitionBenchmarks,
    gicMinimum:                   doc.studyPermitData.gicMinimum                   ?? STUDY_PERMIT_DEFAULTS.gicMinimum,
    gicProcessingFee:             doc.studyPermitData.gicProcessingFee             ?? STUDY_PERMIT_DEFAULTS.gicProcessingFee,
    healthInsuranceByProvince:    doc.studyPermitData.healthInsuranceByProvince    ?? STUDY_PERMIT_DEFAULTS.healthInsuranceByProvince,
    studentWorkRights:            doc.studyPermitData.studentWorkRights            ?? STUDY_PERMIT_DEFAULTS.studentWorkRights,
    provincialMinWages:           doc.studyPermitData.provincialMinWages           ?? STUDY_PERMIT_DEFAULTS.provincialMinWages,
  }
}

// ─── computeIRCCProofOfFunds ──────────────────────────────────────────────────

/** Default round-trip transport fallback when no departure region is provided. */
const TRANSPORT_ESTIMATE_DEFAULT = 2_000

/**
 * Compute the IRCC total proof-of-funds requirement.
 *   = tuition + living expenses (by family size, Quebec-aware) + transport (round-trip)
 *
 * When departureRegion is provided, transport = round-trip regional fare × household size.
 * Otherwise falls back to $2,000 flat estimate.
 */
export function computeIRCCProofOfFunds(
  familySize: number,
  tuition: number,
  province: string,
  data: StudyPermitData,
  departureRegion?: string,
  adults?: number,
  children?: number,
): number {
  const isQuebec = province === 'QC'
  let livingExpenses: number

  if (isQuebec) {
    const qc = data.quebecProofOfFunds
    livingExpenses = qc.singleAdult18Plus + Math.max(0, familySize - 1) * qc.perAdditionalMember
  } else {
    const capped = Math.min(familySize, 7)
    const entry  = data.proofOfFundsLiving.find(e => e.familyMembers === capped)
    const base   = entry?.amountCAD ?? 22_895
    livingExpenses = base + Math.max(0, familySize - 7) * data.proofOfFundsAdditionalMember
  }

  const transport = departureRegion
    ? computeRoundTripFlight(departureRegion, adults ?? familySize, children ?? 0)
    : TRANSPORT_ESTIMATE_DEFAULT

  return tuition + livingExpenses + transport
}

/**
 * Build the full IRCCComplianceResult with individual components.
 *
 * Transport uses round-trip regional fare when departureRegion is provided,
 * otherwise falls back to $2,000 flat estimate per IRCC guidance.
 */
export function buildIRCCComplianceResult(
  familySize: number,
  tuition: number,
  province: string,
  availableFunds: number,
  data: StudyPermitData,
  departureRegion?: string,
  adults?: number,
  children?: number,
): IRCCComplianceResult {
  const isQuebec = province === 'QC'
  let livingExpenses: number

  if (isQuebec) {
    const qc = data.quebecProofOfFunds
    livingExpenses = qc.singleAdult18Plus + Math.max(0, familySize - 1) * qc.perAdditionalMember
  } else {
    const capped = Math.min(familySize, 7)
    const entry  = data.proofOfFundsLiving.find(e => e.familyMembers === capped)
    const base   = entry?.amountCAD ?? 22_895
    livingExpenses = base + Math.max(0, familySize - 7) * data.proofOfFundsAdditionalMember
  }

  const transport = departureRegion
    ? computeRoundTripFlight(departureRegion, adults ?? familySize, children ?? 0)
    : TRANSPORT_ESTIMATE_DEFAULT

  const required = tuition + livingExpenses + transport
  return {
    required,
    tuition,
    livingExpenses,
    transport,
    isQuebec,
    compliant:  availableFunds >= required,
    shortfall:  Math.max(0, required - availableFunds),
  }
}

// ─── getHealthBridgeCost ──────────────────────────────────────────────────────

/** One-time upfront bridge coverage cost during the wait period (if applicable). */
export function getHealthBridgeCost(province: string, data: StudyPermitData): number {
  const entry = data.healthInsuranceByProvince.find(p => p.provinceCode === province)
  if (!entry) return 0
  return entry.bridgeCoverageNeeded ? entry.bridgeCostCAD : 0
}

// ─── getHealthInsuranceMonthlyCost ────────────────────────────────────────────

/**
 * Monthly health insurance cost for international students in the given province.
 * For provinces without coverage, this is the annual plan cost ÷ 12.
 * For provinces with provincial coverage (e.g. AB), this is $0/month.
 */
export function getHealthInsuranceMonthlyCost(province: string, data: StudyPermitData): number {
  const entry = data.healthInsuranceByProvince.find(p => p.provinceCode === province)
  if (!entry) return 0
  return Math.round(entry.annualCostCAD / 12)
}

// ─── getPartTimeMonthlyIncome ─────────────────────────────────────────────────

/**
 * Estimated monthly income for a student working part-time.
 * Formula: hoursPerWeek × provincial min wage × 4.33 weeks/month.
 *
 * Note: This income does NOT count toward IRCC proof of funds.
 * It is used only for post-arrival monthly budget projections.
 */
export function getPartTimeMonthlyIncome(
  province: string,
  hoursPerWeek: number,
  data: StudyPermitData,
): number {
  const entry   = data.provincialMinWages.find(w => w.provinceCode === province)
  const minWage = entry?.hourlyRate ?? data.studentWorkRights.estimatedHourlyRateLow
  return hoursPerWeek * minWage * 4.33
}

// ─── computeStudyPermitUpfront ────────────────────────────────────────────────

export interface StudyPermitUpfrontInput {
  province:              string
  housingType:           EngineInput['housingType']
  furnishingLevel:       EngineInput['furnishingLevel']
  household:             EngineInput['household']
  travelEstimateOverride?: number
  departureRegion?:      string
  studyPermit:           StudyPermitInputs
}

/**
 * Compute total upfront costs for study permit holders.
 * Replaces the standard computeUpfront() when pathway === 'study-permit'.
 */
export function computeStudyPermitUpfront(
  input: StudyPermitUpfrontInput,
  data: StudyPermitData,
  baseline: Pick<CityBaseline, 'avgRentStudio' | 'avgRent1BR' | 'avgRent2BR' | 'isFallback' | 'cityName'>,
): { total: number; breakdown: BreakdownItem[] } {
  const { studyPermit, household, province } = input
  const familySize = household.adults + household.children
  const items: BreakdownItem[] = []

  // ── 1. Immigration fees — Due at Submission ──────────────────────────────
  if (!studyPermit.feesPaid) {
    items.push({ key: 'permit-fee', label: 'Study permit application fee', cad: 150, source: 'ircc', sourceKey: 'ircc-study-permit-fees', timing: 'submission' })

    if (!studyPermit.biometricsDone) {
      const bioFee = familySize >= 2 ? 170 : 85
      items.push({ key: 'biometrics', label: `Biometrics fee (${familySize >= 2 ? 'family' : 'individual'})`, cad: bioFee, source: 'ircc', sourceKey: 'ircc-study-permit-fees', timing: 'submission' })
    }

    const medical = familySize * 250
    items.push({ key: 'medical-exam', label: `Medical exam (${familySize} person${familySize > 1 ? 's' : ''} × $250)`, cad: medical, source: 'ircc', sourceKey: 'ircc-study-permit-fees', timing: 'submission' })
  }

  // ── 2. Tuition (first year) — Pre-Arrival Setup ───────────────────────────
  items.push({ key: 'tuition', label: 'First year tuition', cad: studyPermit.tuitionAmount, source: 'user-input', sourceKey: 'user-input', timing: 'pre-arrival-setup' })

  // ── 3. GIC + processing fee — Pre-Arrival Setup ───────────────────────────
  if (studyPermit.gicStatus === 'planning') {
    items.push({ key: 'gic', label: 'GIC (Guaranteed Investment Certificate)', cad: data.gicMinimum, source: 'ircc', sourceKey: 'ircc-proof-of-funds-sp', timing: 'pre-arrival-setup' })
    items.push({ key: 'gic-fee', label: 'GIC bank processing fee', cad: data.gicProcessingFee, source: 'bank', sourceKey: 'maple-estimate', timing: 'pre-arrival-setup' })
  }
  // 'purchased' → already committed (shown in breakdown as note, not added to upfront)
  // 'not-purchasing' → $0

  // ── 4. Health insurance bridge coverage — Pre-Arrival Setup ───────────────
  const bridgeCost = getHealthBridgeCost(province, data)
  if (bridgeCost > 0) {
    items.push({ key: 'health-bridge', label: 'Bridge health insurance (wait period)', cad: bridgeCost, source: 'provincial', sourceKey: 'maple-estimate', timing: 'pre-arrival-setup' })
  }

  // ── 5. Travel — Settlement Setup ──────────────────────────────────────────
  const travel = input.travelEstimateOverride
    ?? computeOneWayFlight(input.departureRegion, household.adults, household.children)
  items.push({ key: 'travel', label: 'One-way flight & travel', cad: travel, source: 'estimate', sourceKey: 'maple-estimate', timing: 'settlement' })

  // ── 6. Housing deposit — Settlement Setup ─────────────────────────────────
  const rent = rentFromBaseline(baseline, input.housingType)
  let deposit = 0
  let depositLabel = ''
  switch (input.housingType) {
    case 'on-campus':
      deposit      = 1_650 + rent  // confirmation deposit + first month
      depositLabel = 'On-campus deposit (confirmation + 1st month)'
      break
    case 'homestay':
      deposit      = rent  // first month only
      depositLabel = 'Homestay deposit (1st month)'
      break
    case 'staying-family':
      deposit      = 0
      depositLabel = 'Housing deposit (staying with family)'
      break
    default:
      deposit      = rent * DEPOSIT_MONTHS  // first + last
      depositLabel = `Housing deposit (${DEPOSIT_MONTHS}× rent)`
  }
  if (deposit > 0) {
    items.push({
      key:       'housing-deposit',
      label:     depositLabel,
      cad:       deposit,
      source:    baseline.isFallback ? 'national-average' : 'cmhc',
      sourceKey: baseline.isFallback ? 'maple-estimate' : `cmhc-${citySlug(baseline.cityName)}-rent`,
      timing:    'settlement',
    })
  }

  // ── 7. Setup / furnishing — Settlement Setup ───────────────────────────────
  const setup = input.housingType === 'staying-family' ? 0 : FURNISHING_COST[input.furnishingLevel]
  if (setup > 0) {
    items.push({ key: 'setup-essentials', label: `Setup & furnishing (${input.furnishingLevel})`, cad: setup, source: 'constant', sourceKey: 'maple-estimate', timing: 'settlement' })
  }

  const total = items.reduce((sum, i) => sum + i.cad, 0)
  return { total, breakdown: items }
}
