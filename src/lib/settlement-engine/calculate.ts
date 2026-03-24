/**
 * Settlement Planner — Core Calculation Engine
 *
 * All functions are pure: same inputs always produce same outputs.
 * No network calls, no side effects. Baseline data must be pre-fetched
 * and passed in as a plain object.
 */

import type { CityBaseline } from './baselines'
import {
  BUFFER_PERCENT,
  CAR_MONTHLY,
  CHILDCARE_MONTHLY,
  DEPOSIT_MONTHS,
  ENGINE_VERSION,
  FURNISHING_COST,
  PHONE_INTERNET_BASELINE,
  RUNWAY_MONTHS,
  UTILITIES_BASELINE,
  computeOneWayFlight,
  groceriesForHousehold,
  rentFromBaseline,
} from './constants'
import {
  type ExpressEntryData,
  getComplianceRequirement,
} from './compliance'
import {
  type StudyPermitData,
  computeIRCCProofOfFunds,
  computeStudyPermitUpfront,
  getHealthInsuranceMonthlyCost,
} from './study-permit'
import type { BreakdownItem, EngineInput, EngineOutput } from './types'

// ─── computeUpfront ───────────────────────────────────────────────────────────

export interface UpfrontResult {
  total: number
  breakdown: BreakdownItem[]
}

/**
 * U = immigration fees + biometrics + travel + housing deposit + setup essentials
 * For study permit pathway, delegates to computeStudyPermitUpfront().
 * Regional flight cost is used when departureRegion is provided.
 * staying-family housingType sets deposit and furnishing to $0.
 */
export function computeUpfront(
  input: Pick<EngineInput, 'fees' | 'housingType' | 'furnishingLevel' | 'travelEstimateOverride' | 'departureRegion' | 'pathway' | 'province' | 'household' | 'studyPermit'>,
  baseline: Pick<CityBaseline, 'avgRentStudio' | 'avgRent1BR' | 'avgRent2BR' | 'isFallback' | 'studentHousing'>,
  studyPermitData?: StudyPermitData,
): UpfrontResult {
  // ── Study permit delegation ──────────────────────────────────────────────
  if (input.pathway === 'study-permit' && input.studyPermit && studyPermitData) {
    return computeStudyPermitUpfront(
      {
        province:               input.province,
        housingType:            input.housingType,
        furnishingLevel:        input.furnishingLevel,
        household:              input.household,
        travelEstimateOverride: input.travelEstimateOverride,
        departureRegion:        input.departureRegion,
        studyPermit:            input.studyPermit,
      },
      studyPermitData,
      baseline,
    )
  }
  const { fees, furnishingLevel, travelEstimateOverride, departureRegion, household } = input

  const items: BreakdownItem[] = []

  // Immigration application fee
  items.push({
    key:    'immigration-fee',
    label:  'Immigration application fee',
    cad:    fees.applicationFee,
    source: 'ircc',
  })

  // Biometrics (skip if already paid)
  if (!fees.biometricsPaid) {
    items.push({
      key:    'biometrics',
      label:  'Biometrics fee',
      cad:    fees.biometricsFee,
      source: 'ircc',
    })
  }

  // Travel — regional one-way or default
  const travel = travelEstimateOverride
    ?? computeOneWayFlight(departureRegion, household.adults, household.children)
  items.push({
    key:    'travel',
    label:  'One-way flight & travel',
    cad:    travel,
    source: 'estimate',
  })

  // Housing deposit ($0 for staying-family)
  const rent = rentFromBaseline(baseline, input.housingType)
  const deposit = input.housingType === 'staying-family' ? 0 : rent * DEPOSIT_MONTHS
  if (deposit > 0) {
    items.push({
      key:    'housing-deposit',
      label:  `Housing deposit (${DEPOSIT_MONTHS}× rent)`,
      cad:    deposit,
      source: baseline.isFallback ? 'national-average' : 'cmhc',
    })
  }

  // Setup / furnishing ($0 for staying-family)
  const setup = input.housingType === 'staying-family' ? 0 : FURNISHING_COST[furnishingLevel]
  if (setup > 0) {
    items.push({
      key:    'setup-essentials',
      label:  `Setup & furnishing (${furnishingLevel})`,
      cad:    setup,
      source: 'constant',
    })
  }

  const total = items.reduce((sum, item) => sum + item.cad, 0)
  return { total, breakdown: items }
}

// ─── computeMonthlyMin ────────────────────────────────────────────────────────

export interface MonthlyResult {
  total: number
  breakdown: BreakdownItem[]
}

/**
 * M_min = rent + transit + utilities + phone/internet + groceries + obligations
 * For study permit pathway: adds health insurance monthly cost.
 */
export function computeMonthlyMin(
  input: Pick<EngineInput, 'housingType' | 'household' | 'monthlyObligations' | 'pathway' | 'province' | 'studyPermit'>,
  baseline: Pick<
    CityBaseline,
    'avgRentStudio' | 'avgRent1BR' | 'avgRent2BR' | 'monthlyTransitPass' | 'cityName' | 'isFallback' | 'studentHousing'
  >,
  studyPermitData?: StudyPermitData,
): MonthlyResult {
  const items: BreakdownItem[] = []
  const baselineSource = baseline.isFallback ? 'national-average' : 'cmhc'
  const transitSource  = baseline.isFallback ? 'national-average' : baseline.cityName.toLowerCase().replace(/\s+/g, '-')

  // Rent
  const rent = rentFromBaseline(baseline, input.housingType)
  items.push({ key: 'rent',    label: 'Rent',          cad: rent,                        source: baselineSource })

  // Transit
  items.push({ key: 'transit', label: 'Transit pass',  cad: baseline.monthlyTransitPass,  source: transitSource })

  // Utilities
  items.push({ key: 'utilities', label: 'Utilities',   cad: UTILITIES_BASELINE,           source: 'constant' })

  // Phone + internet
  items.push({ key: 'phone', label: 'Phone & internet', cad: PHONE_INTERNET_BASELINE,     source: 'constant' })

  // Groceries
  const groceries = groceriesForHousehold(input.household.adults, input.household.children)
  items.push({ key: 'groceries', label: 'Groceries',   cad: groceries,                    source: 'constant' })

  // Monthly obligations
  if (input.monthlyObligations > 0) {
    items.push({
      key:    'obligations',
      label:  'Monthly obligations (debt / remittances)',
      cad:    input.monthlyObligations,
      source: 'user-input',
    })
  }

  // Study permit: health insurance monthly cost
  if (input.pathway === 'study-permit' && studyPermitData) {
    const healthMonthly = getHealthInsuranceMonthlyCost(input.province, studyPermitData)
    if (healthMonthly > 0) {
      items.push({
        key:    'health-insurance',
        label:  'Health insurance (monthly)',
        cad:    healthMonthly,
        source: 'provincial',
      })
    }
  }

  const total = items.reduce((sum, item) => sum + item.cad, 0)
  return { total, breakdown: items }
}

// ─── computeSafe ─────────────────────────────────────────────────────────────

export interface SafeResult {
  monthlySafe: number
  safeSavingsTarget: number
  runwayMonths: number
  bufferPercent: number
  breakdown: BreakdownItem[]
  irccFloor?: number               // IRCC proof-of-funds requirement (study permit)
  irccFloorApplied?: boolean       // true when irccFloor overrode standard target
  complianceFloor?: number         // IRCC settlement funds (EE FSWP/FSTP/PNP)
  complianceFloorApplied?: boolean // true when complianceFloor overrode standard target
  bindingConstraint?: 'compliance' | 'real-world'
}

/**
 * M_safe = M_min + childcare adder + car adder + custom expenses
 * S_safe = U + M_safe × runwayMonths + bufferPercent × (U + M_safe × runwayMonths)
 * For study permit: S_safe = max(standard, irccFloor)
 * For EE FSWP/FSTP/PNP: S_safe = max(standard, complianceFloor)
 * bindingConstraint indicates which drove the final safeSavingsTarget.
 */
export function computeSafe(
  input: Pick<EngineInput, 'jobStatus' | 'needsChildcare' | 'plansCar' | 'customMonthlyExpenses' | 'pathway' | 'province' | 'household' | 'studyPermit' | 'departureRegion'>,
  upfront: number,
  monthlyMin: number,
  monthlyMinBreakdown: BreakdownItem[],
  studyPermitData?: StudyPermitData,
  expressEntryData?: ExpressEntryData,
): SafeResult {
  // Build M_safe from M_min items + lifestyle adders
  const adderItems: BreakdownItem[] = []

  if (input.needsChildcare) {
    adderItems.push({ key: 'childcare', label: 'Childcare', cad: CHILDCARE_MONTHLY, source: 'constant' })
  }

  if (input.plansCar) {
    adderItems.push({ key: 'car', label: 'Car (payment + insurance + fuel)', cad: CAR_MONTHLY, source: 'constant' })
  }

  if (input.customMonthlyExpenses > 0) {
    adderItems.push({ key: 'custom', label: 'Other monthly expenses', cad: input.customMonthlyExpenses, source: 'user-input' })
  }

  const monthlySafe = monthlyMin + adderItems.reduce((s, i) => s + i.cad, 0)
  const runway = RUNWAY_MONTHS[input.jobStatus]
  const runningTotal = upfront + monthlySafe * runway
  const buffer = runningTotal * BUFFER_PERCENT
  const standardTarget = runningTotal + buffer
  const breakdown = [...monthlyMinBreakdown, ...adderItems]
  const familySize = input.household.adults + input.household.children

  // ── Study permit IRCC floor ──────────────────────────────────────────────
  if (input.pathway === 'study-permit' && input.studyPermit && studyPermitData) {
    const irccFloor = computeIRCCProofOfFunds(
      familySize,
      input.studyPermit.tuitionAmount,
      input.province,
      studyPermitData,
      input.departureRegion,
      input.household.adults,
      input.household.children,
    )
    const irccFloorApplied = irccFloor > standardTarget
    return {
      monthlySafe,
      safeSavingsTarget:   irccFloorApplied ? irccFloor : standardTarget,
      runwayMonths:        runway,
      bufferPercent:       BUFFER_PERCENT,
      breakdown,
      irccFloor,
      irccFloorApplied,
      bindingConstraint:   irccFloorApplied ? 'compliance' : 'real-world',
    }
  }

  // ── Express Entry / PNP compliance floor ────────────────────────────────
  const complianceFloor = getComplianceRequirement(input.pathway, familySize, expressEntryData)
  if (complianceFloor !== null) {
    const complianceFloorApplied = complianceFloor > standardTarget
    return {
      monthlySafe,
      safeSavingsTarget:       complianceFloorApplied ? complianceFloor : standardTarget,
      runwayMonths:            runway,
      bufferPercent:           BUFFER_PERCENT,
      breakdown,
      complianceFloor,
      complianceFloorApplied,
      bindingConstraint:       complianceFloorApplied ? 'compliance' : 'real-world',
    }
  }

  return {
    monthlySafe,
    safeSavingsTarget: standardTarget,
    runwayMonths:      runway,
    bufferPercent:     BUFFER_PERCENT,
    breakdown,
    bindingConstraint: 'real-world',
  }
}

// ─── computeGap ───────────────────────────────────────────────────────────────

/**
 * G = max(0, S_safe − (liquidSavings + scholarshipAmount))
 * For study permit: scholarship reduces the effective savings gap.
 */
export function computeGap(
  safeSavingsTarget: number,
  liquidSavings: number,
  scholarshipAmount = 0,
): number {
  return Math.max(0, safeSavingsTarget - liquidSavings - scholarshipAmount)
}

// ─── generateBreakdown ────────────────────────────────────────────────────────

/**
 * Produce the complete upfront breakdown array with each line item.
 * Monthly breakdown is returned from computeMonthlyMin / computeSafe directly.
 */
export function generateBreakdown(upfrontBreakdown: BreakdownItem[]): BreakdownItem[] {
  return upfrontBreakdown
}

// ─── Top-level run ────────────────────────────────────────────────────────────

/**
 * Run the full calculation engine. Returns a complete EngineOutput.
 * Caller is responsible for pre-fetching the city baseline and fees.
 * Pass studyPermitData when pathway === 'study-permit'.
 * Pass expressEntryData when pathway === 'express-entry-fsw' | 'express-entry-fstp' | 'pnp'.
 */
export function runEngine(
  input: EngineInput,
  baseline: CityBaseline,
  dataVersion: string,
  studyPermitData?: StudyPermitData,
  expressEntryData?: ExpressEntryData,
): EngineOutput {
  const upfrontResult  = computeUpfront(input, baseline, studyPermitData)
  const monthlyResult  = computeMonthlyMin(input, baseline, studyPermitData)
  const safeResult     = computeSafe(input, upfrontResult.total, monthlyResult.total, monthlyResult.breakdown, studyPermitData, expressEntryData)
  const scholarshipAmount = input.pathway === 'study-permit' ? (input.studyPermit?.scholarshipAmount ?? 0) : 0
  const gap            = computeGap(safeResult.safeSavingsTarget, input.liquidSavings, scholarshipAmount)

  return {
    upfront:                 upfrontResult.total,
    monthlyMin:              monthlyResult.total,
    monthlySafe:             safeResult.monthlySafe,
    safeSavingsTarget:       safeResult.safeSavingsTarget,
    savingsGap:              gap,
    runwayMonths:            safeResult.runwayMonths,
    bufferPercent:           safeResult.bufferPercent,
    engineVersion:           ENGINE_VERSION,
    dataVersion,
    upfrontBreakdown:        upfrontResult.breakdown,
    monthlyBreakdown:        safeResult.breakdown,
    baselineFallback:        baseline.isFallback,
    irccFloor:               safeResult.irccFloor,
    irccFloorApplied:        safeResult.irccFloorApplied,
    complianceFloor:         safeResult.complianceFloor,
    complianceFloorApplied:  safeResult.complianceFloorApplied,
    bindingConstraint:       safeResult.bindingConstraint,
  }
}
