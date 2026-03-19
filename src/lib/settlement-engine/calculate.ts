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
  TRAVEL_ESTIMATE_DEFAULT,
  UTILITIES_BASELINE,
  groceriesForHousehold,
  rentFromBaseline,
} from './constants'
import type { BreakdownItem, EngineInput, EngineOutput } from './types'

// ─── computeUpfront ───────────────────────────────────────────────────────────

export interface UpfrontResult {
  total: number
  breakdown: BreakdownItem[]
}

/**
 * U = immigration fees + biometrics + travel + housing deposit + setup essentials
 */
export function computeUpfront(
  input: Pick<EngineInput, 'fees' | 'housingType' | 'furnishingLevel' | 'travelEstimateOverride'>,
  baseline: Pick<CityBaseline, 'avgRentStudio' | 'avgRent1BR' | 'avgRent2BR' | 'isFallback'>,
): UpfrontResult {
  const { fees, furnishingLevel, travelEstimateOverride } = input

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

  // Travel
  const travel = travelEstimateOverride ?? TRAVEL_ESTIMATE_DEFAULT
  items.push({
    key:    'travel',
    label:  'Flights & travel',
    cad:    travel,
    source: 'estimate',
  })

  // Housing deposit (first + last month rent)
  const rent = rentFromBaseline(baseline, input.housingType)
  const deposit = rent * DEPOSIT_MONTHS
  items.push({
    key:    'housing-deposit',
    label:  `Housing deposit (${DEPOSIT_MONTHS}× rent)`,
    cad:    deposit,
    source: baseline.isFallback ? 'national-average' : 'cmhc',
  })

  // Setup / furnishing
  const setup = FURNISHING_COST[furnishingLevel]
  items.push({
    key:    'setup-essentials',
    label:  `Setup & furnishing (${furnishingLevel})`,
    cad:    setup,
    source: 'constant',
  })

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
 */
export function computeMonthlyMin(
  input: Pick<EngineInput, 'housingType' | 'household' | 'monthlyObligations'>,
  baseline: Pick<
    CityBaseline,
    'avgRentStudio' | 'avgRent1BR' | 'avgRent2BR' | 'monthlyTransitPass' | 'cityName' | 'isFallback'
  >,
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
}

/**
 * M_safe = M_min + childcare adder + car adder + custom expenses
 * S_safe = U + M_safe × runwayMonths + bufferPercent × (U + M_safe × runwayMonths)
 */
export function computeSafe(
  input: Pick<EngineInput, 'jobStatus' | 'needsChildcare' | 'plansCar' | 'customMonthlyExpenses'>,
  upfront: number,
  monthlyMin: number,
  monthlyMinBreakdown: BreakdownItem[],
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
  const safeSavingsTarget = runningTotal + buffer

  return {
    monthlySafe,
    safeSavingsTarget,
    runwayMonths: runway,
    bufferPercent: BUFFER_PERCENT,
    breakdown: [...monthlyMinBreakdown, ...adderItems],
  }
}

// ─── computeGap ───────────────────────────────────────────────────────────────

/**
 * G = max(0, S_safe − liquidSavings)
 */
export function computeGap(safeSavingsTarget: number, liquidSavings: number): number {
  return Math.max(0, safeSavingsTarget - liquidSavings)
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
 */
export function runEngine(
  input: EngineInput,
  baseline: CityBaseline,
  dataVersion: string,
): EngineOutput {
  const upfrontResult  = computeUpfront(input, baseline)
  const monthlyResult  = computeMonthlyMin(input, baseline)
  const safeResult     = computeSafe(input, upfrontResult.total, monthlyResult.total, monthlyResult.breakdown)
  const gap            = computeGap(safeResult.safeSavingsTarget, input.liquidSavings)

  return {
    upfront:           upfrontResult.total,
    monthlyMin:        monthlyResult.total,
    monthlySafe:       safeResult.monthlySafe,
    safeSavingsTarget: safeResult.safeSavingsTarget,
    savingsGap:        gap,
    runwayMonths:      safeResult.runwayMonths,
    bufferPercent:     safeResult.bufferPercent,
    engineVersion:     ENGINE_VERSION,
    dataVersion,
    upfrontBreakdown:  upfrontResult.breakdown,
    monthlyBreakdown:  safeResult.breakdown,
    baselineFallback:  baseline.isFallback,
  }
}
