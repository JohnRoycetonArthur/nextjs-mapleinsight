/**
 * Settlement Planner — Core Calculation Engine
 *
 * All functions are pure: same inputs always produce same outputs.
 * No network calls, no side effects. Baseline data must be pre-fetched
 * and passed in as a plain object.
 */

import type { CityBaseline } from './baselines'
import type { FeeSchedule } from './fees'
import {
  BUFFER_PERCENT,
  CAR_MONTHLY,
  CHILDCARE_MONTHLY,
  DEPOSIT_MONTHS,
  ENGINE_VERSION,
  FURNISHING_COST,
  RPRF_PER_ADULT,
  RUNWAY_MONTHS,
  computeOneWayFlight,
  rentFromBaseline,
} from './constants'
import {
  type ExpressEntryData,
  getComplianceRequirement,
  computeEEProofOfFunds,
} from './compliance'
import {
  type StudyPermitData,
  computeIRCCProofOfFunds,
  computeStudyPermitUpfront,
  getHealthInsuranceMonthlyCost,
} from './study-permit'
import type { BreakdownItem, EngineInput, EngineOutput } from './types'
import {
  DEFAULT_EXPENSES,
  parseExpenseAmount,
  type CustomExpense,
  type DefaultExpenseKey,
} from './defaults'

// ─── helpers ──────────────────────────────────────────────────────────────────

/** Normalize a city name to a Sanity catalog key fragment (e.g. "Montréal" → "montreal"). */
function citySlug(name: string): string {
  return name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-')
}

const TRANSIT_AGENCIES: Record<string, string> = {
  'toronto:on': 'TTC',
  'vancouver:bc': 'TransLink',
  'calgary:ab': 'Calgary Transit',
  'montreal:qc': 'STM',
  'ottawa:on': 'OC Transpo',
  'halifax:ns': 'Halifax Transit',
  'winnipeg:mb': 'Winnipeg Transit',
}

function transitLabel(baseline: Pick<CityBaseline, 'cityName' | 'province' | 'isFallback'>): string {
  if (baseline.isFallback) return 'Public transit'
  const agency = TRANSIT_AGENCIES[`${citySlug(baseline.cityName)}:${baseline.province.toLowerCase()}`]
  return agency ? `Public transit (${agency})` : 'Public transit'
}

function defaultExpenseSource(entry: CustomExpense | undefined): string {
  return entry?.isModified ? 'user-input' : 'estimate'
}

function defaultExpenseLabel(
  defaultKey: DefaultExpenseKey,
  entry: CustomExpense | undefined,
  adults: number,
): string {
  if (entry?.label) return entry.label
  if (defaultKey === 'groceries') {
    return `Groceries (${adults} adult${adults !== 1 ? 's' : ''})`
  }
  return DEFAULT_EXPENSES[defaultKey].label
}

function getExpenseAmount(
  customExpenses: CustomExpense[] | undefined,
  defaultKey: DefaultExpenseKey,
  adults: number,
): number {
  const userEntry = customExpenses?.find(expense => expense.defaultKey === defaultKey)
  if (userEntry) return parseExpenseAmount(userEntry.amount)

  const defaultExpense = DEFAULT_EXPENSES[defaultKey]
  return defaultExpense.perAdult ? defaultExpense.amount * adults : defaultExpense.amount
}

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
  baseline: Pick<CityBaseline, 'avgRentStudio' | 'avgRent1BR' | 'avgRent2BR' | 'isFallback' | 'studentHousing' | 'cityName'>,
  studyPermitData?: StudyPermitData,
  feeSchedule?: FeeSchedule,
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
      feeSchedule,
    )
  }
  const { fees, furnishingLevel, travelEstimateOverride, departureRegion, household } = input

  // Resolve per-item source URLs from the fee schedule line items (US-1.3)
  const feeUrl    = feeSchedule?.feeLineItems.find(li => li.key === 'immigration-fee')?.sourceUrl
  const bioUrl    = feeSchedule?.feeLineItems.find(li => li.key === 'biometrics-family-cap' || li.key === 'biometrics-single')?.sourceUrl
  const scheduleUrl = feeSchedule?.sourceUrl

  const items: BreakdownItem[] = []

  // ── Due at Submission ────────────────────────────────────────────────────

  // Processing fee (IRCC government application fee — RPRF is a separate line item)
  items.push({
    key:       'immigration-fee',
    label:     'Processing fee',
    cad:       fees.applicationFee,
    source:    'ircc',
    sourceKey: 'ircc-fee-schedule',
    sourceUrl: feeUrl ?? scheduleUrl,
    timing:    'submission',
  })

  // Biometrics (skip if already paid)
  if (!fees.biometricsPaid) {
    items.push({
      key:       'biometrics',
      label:     'Biometrics fee',
      cad:       fees.biometricsFee,
      source:    'ircc',
      sourceKey: 'ircc-fee-schedule',
      sourceUrl: bioUrl ?? scheduleUrl,
      timing:    'submission',
    })
  }

  // ── Due Before Landing (EE / PNP only) ───────────────────────────────────

  const isEEorPNP = (
    input.pathway === 'express-entry-fsw'  ||
    input.pathway === 'express-entry-cec'  ||
    input.pathway === 'express-entry-fstp' ||
    input.pathway === 'pnp'
  )
  if (isEEorPNP) {
    const rprf = RPRF_PER_ADULT * household.adults
    items.push({
      key:       'rprf',
      label:     `Right of Permanent Residence Fee (${household.adults} adult${household.adults !== 1 ? 's' : ''} × $${RPRF_PER_ADULT})`,
      cad:       rprf,
      source:    'ircc',
      sourceKey: 'ircc-fee-schedule',
      sourceUrl: scheduleUrl,
      timing:    'pre-landing',
    })
  }

  // ── Settlement Setup ─────────────────────────────────────────────────────

  // Travel — regional one-way or default
  const travel = travelEstimateOverride
    ?? computeOneWayFlight(departureRegion, household.adults, household.children)
  items.push({
    key:       'travel',
    label:     'One-way flight & travel',
    cad:       travel,
    source:    'estimate',
    sourceKey: 'maple-estimate',
    timing:    'settlement',
  })

  // Housing deposit ($0 for staying-family)
  const rent = rentFromBaseline(baseline, input.housingType)
  const deposit = input.housingType === 'staying-family' ? 0 : rent * DEPOSIT_MONTHS
  if (deposit > 0) {
    items.push({
      key:       'housing-deposit',
      label:     `Housing deposit (${DEPOSIT_MONTHS}× rent)`,
      cad:       deposit,
      source:    baseline.isFallback ? 'national-average' : 'cmhc',
      sourceKey: baseline.isFallback ? 'maple-estimate' : `cmhc-${citySlug(baseline.cityName)}-rent`,
      timing:    'settlement',
    })
  }

  // Setup / furnishing ($0 for staying-family)
  const setup = input.housingType === 'staying-family' ? 0 : FURNISHING_COST[furnishingLevel]
  if (setup > 0) {
    items.push({
      key:       'setup-essentials',
      label:     `Setup & furnishing (${furnishingLevel})`,
      cad:       setup,
      source:    'constant',
      sourceKey: 'maple-estimate',
      timing:    'settlement',
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
  input: Pick<EngineInput, 'housingType' | 'household' | 'monthlyObligations' | 'pathway' | 'province' | 'studyPermit' | 'customExpenses'>,
  baseline: Pick<
    CityBaseline,
    'avgRentStudio' | 'avgRent1BR' | 'avgRent2BR' | 'monthlyTransitPass' | 'cityName' | 'province' | 'isFallback' | 'studentHousing'
  >,
  studyPermitData?: StudyPermitData,
): MonthlyResult {
  const items: BreakdownItem[] = []
  const adults = Math.max(1, input.household.adults)
  const baselineSource    = baseline.isFallback ? 'national-average' : 'cmhc'
  const transitSource     = baseline.isFallback ? 'national-average' : baseline.cityName.toLowerCase().replace(/\s+/g, '-')
  const rentSourceKey     = baseline.isFallback ? 'maple-estimate' : `cmhc-${citySlug(baseline.cityName)}-rent`
  const transitSourceKey  = baseline.isFallback ? 'maple-estimate' : `transit-${citySlug(baseline.cityName)}`

  // Rent
  const rent = rentFromBaseline(baseline, input.housingType)
  items.push({ key: 'rent',    label: 'Rent',          cad: rent,                        source: baselineSource, sourceKey: rentSourceKey })

  // Transit
  items.push({
    key: 'transit',
    label: transitLabel(baseline),
    cad: baseline.monthlyTransitPass,
    source: transitSource,
    sourceKey: transitSourceKey,
  })

  const utilitiesEntry = input.customExpenses?.find(expense => expense.defaultKey === 'utilities')
  const utilities = getExpenseAmount(input.customExpenses, 'utilities', adults)
  items.push({
    key: 'utilities',
    label: defaultExpenseLabel('utilities', utilitiesEntry, adults),
    cad: utilities,
    source: defaultExpenseSource(utilitiesEntry),
    sourceKey: 'maple-estimate',
  })

  const phoneEntry = input.customExpenses?.find(expense => expense.defaultKey === 'phoneInternet')
  const phone = getExpenseAmount(input.customExpenses, 'phoneInternet', adults)
  items.push({
    key: 'phone',
    label: defaultExpenseLabel('phoneInternet', phoneEntry, adults),
    cad: phone,
    source: defaultExpenseSource(phoneEntry),
    sourceKey: 'maple-estimate',
  })

  const groceriesEntry = input.customExpenses?.find(expense => expense.defaultKey === 'groceries')
  const groceries = getExpenseAmount(input.customExpenses, 'groceries', adults)
  items.push({
    key: 'groceries',
    label: defaultExpenseLabel('groceries', groceriesEntry, adults),
    cad: groceries,
    source: defaultExpenseSource(groceriesEntry),
    sourceKey: 'maple-estimate',
  })

  // Monthly obligations
  if (input.monthlyObligations > 0) {
    items.push({
      key:       'obligations',
      label:     'Monthly obligations (debt / remittances)',
      cad:       input.monthlyObligations,
      source:    'user-input',
      sourceKey: 'user-input',
    })
  }

  for (const expense of input.customExpenses ?? []) {
    if (expense.defaultKey) continue
    const amount = parseExpenseAmount(expense.amount)
    if (amount <= 0) continue

    items.push({
      key: `custom-${expense.id}`,
      label: expense.label || 'Other monthly expense',
      cad: amount,
      source: 'user-input',
      sourceKey: 'user-input',
    })
  }

  // Study permit: health insurance monthly cost
  if (input.pathway === 'study-permit' && studyPermitData) {
    const healthMonthly = getHealthInsuranceMonthlyCost(input.province, studyPermitData)
    if (healthMonthly > 0) {
      items.push({
        key:       'health-insurance',
        label:     'Health insurance (monthly)',
        cad:       healthMonthly,
        source:    'provincial',
        sourceKey: 'maple-estimate',
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
  proofOfFundsExemption?: { exempt: true; reason: 'cec' | 'job_offer' } | { exempt: false }
}

/**
 * M_safe = M_min + childcare adder + car adder + custom expenses
 * S_safe = U + M_safe × runwayMonths + bufferPercent × (U + M_safe × runwayMonths)
 * For study permit: S_safe = max(standard, irccFloor)
 * For EE FSWP/FSTP/PNP: S_safe = max(standard, complianceFloor)
 * bindingConstraint indicates which drove the final safeSavingsTarget.
 */
export function computeSafe(
  input: Pick<EngineInput, 'jobStatus' | 'needsChildcare' | 'plansCar' | 'customMonthlyExpenses' | 'customExpenses' | 'pathway' | 'province' | 'household' | 'studyPermit' | 'departureRegion' | 'jobOfferExempt'>,
  upfront: number,
  monthlyMin: number,
  monthlyMinBreakdown: BreakdownItem[],
  studyPermitData?: StudyPermitData,
  expressEntryData?: ExpressEntryData,
): SafeResult {
  // Build M_safe from M_min items + lifestyle adders
  const adderItems: BreakdownItem[] = []

  if (input.needsChildcare) {
    adderItems.push({ key: 'childcare', label: 'Childcare', cad: CHILDCARE_MONTHLY, source: 'constant', sourceKey: 'maple-estimate' })
  }

  if (input.plansCar) {
    adderItems.push({ key: 'car', label: 'Car (payment + insurance + fuel)', cad: CAR_MONTHLY, source: 'constant', sourceKey: 'maple-estimate' })
  }

  const legacyCustomMonthlyExpenses = input.customMonthlyExpenses ?? 0
  if (!input.customExpenses?.length && legacyCustomMonthlyExpenses > 0) {
    adderItems.push({ key: 'custom', label: 'Other monthly expenses', cad: legacyCustomMonthlyExpenses, source: 'user-input', sourceKey: 'user-input' })
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

  // ── CEC exemption (US-2.1): use model total only, emit exempt flag ──────
  if (input.pathway === 'express-entry-cec') {
    return {
      monthlySafe,
      safeSavingsTarget: standardTarget,
      runwayMonths:      runway,
      bufferPercent:     BUFFER_PERCENT,
      breakdown,
      bindingConstraint: 'real-world',
      proofOfFundsExemption: { exempt: true, reason: 'cec' as const },
    }
  }

  // ── FSW/FSTP job offer exemption (US-2.2): valid job offer + work auth ──
  if (
    input.jobOfferExempt &&
    (input.pathway === 'express-entry-fsw' || input.pathway === 'express-entry-fstp')
  ) {
    return {
      monthlySafe,
      safeSavingsTarget: standardTarget,
      runwayMonths:      runway,
      bufferPercent:     BUFFER_PERCENT,
      breakdown,
      bindingConstraint: 'real-world',
      proofOfFundsExemption: { exempt: true, reason: 'job_offer' as const },
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
  feeSchedule?: FeeSchedule,
): EngineOutput {
  const upfrontResult  = computeUpfront(input, baseline, studyPermitData, feeSchedule)
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
    proofOfFundsExemption:   safeResult.proofOfFundsExemption,
  }
}
