/**
 * Scenario-Based Hero Cards — Source of Truth (US-1.4)
 *
 * All cost figures are in CAD and derived from the US-1.4 deep research report:
 *   - IRCC fee schedule (Apr 30 2026)
 *   - CMHC Rental Market Survey (October 2025)
 *   - FCAC emergency-fund guidance
 *   - Statistics Canada household air-travel spend
 *   - Ontario Nutritious Food Basket, UofT & UCalgary living-cost benchmarks
 *   - City of Toronto CWELCC childcare rates
 */

export interface CostBreakdown {
  immigration_fees: number;
  licensing_credentialing?: number;
  travel: number;
  housing_deposit_3mo_rent: number;
  utilities: number;
  food: number;
  childcare?: number;
  transportation: number;
  incidental: number;
  settlement_buffer: number;
  /** Student scenarios only */
  tuition?: number;
  /** Student scenarios only — proof-of-funds instrument, not a fee */
  gic?: number;
}

export interface PrefillData {
  // Step 1 — Household
  adults: number;
  children: number;
  arrival: string;
  // Step 2 — Immigration
  pathway: string;
  feesPaid: boolean;
  biometricsDone: boolean;
  // Step 3 — Destination
  city: string;
  province: string;
  transitMode: string;
  // Step 4 — Work & Income
  jobStatus: string;
  income: string;        // always "" — never pre-fill income
  // Step 5 — Savings (intentionally always blank)
  savings: string;
  obligations: string;
  savingsCapacity: string;
  // Step 6 — Lifestyle
  housing: string;
  furnishing: string;
  childcare: boolean;
  car: boolean;
}

export interface Scenario {
  /** Unique string ID used as URL param */
  type: string;
  /** Display title for card and banner */
  persona: string;
  /** Emoji persona icon */
  emoji: string;
  /** Display name for pathway badge */
  pathway: string;
  /** Matches wizard PATHWAYS value */
  pathwayKey: string;
  /** Display city/region name */
  destination: string;
  /** Matches wizard CITIES value */
  cityKey: string;
  /** Low-end total from research report */
  low: number;
  /** Recommended prefill total — injected into wizard */
  recommended: number;
  /** High-end total from research report */
  high: number;
  /** Formatted range string for card UI */
  displayRange: string;
  /** Null for most scenarios; "/first year" for student */
  costPeriod: string | null;
  /** One-line context summary */
  contextLine: string;
  /** Student card only — distinguishes locked funds from fees paid */
  studentNote: string | null;
  /** Line-item cost breakdown at recommended level */
  costBreakdown: CostBreakdown;
  /** Primary source URLs from research report */
  sources: string[];
  /** All 6 wizard step values — savings/obligations/income always blank */
  prefill: PrefillData;
}

// ─── Scenario definitions ─────────────────────────────────────────────────────

export const SCENARIOS: Scenario[] = [
  // ── Scenario 1: Family of 4 — PNP / Express Entry in Toronto ────────────────
  {
    type: 'family_pnp',
    emoji: '👨‍👩‍👧‍👦',
    persona: 'Family of 4',
    pathway: 'PNP / Express Entry',
    pathwayKey: 'pnp',
    destination: 'Ontario',
    cityKey: 'toronto',
    low: 29496,
    recommended: 43238,
    high: 57286,
    displayRange: '$29,500 – $57,300',
    costPeriod: null,
    contextLine: 'Housing, childcare, settlement buffer included',
    studentNote: null,
    costBreakdown: {
      immigration_fees: 5890,
      licensing_credentialing: 858,
      travel: 4632,
      housing_deposit_3mo_rent: 9872,
      utilities: 360,
      food: 4106,
      childcare: 2904,
      transportation: 936,
      incidental: 3207,
      settlement_buffer: 10473,
    },
    sources: [
      'https://www.canada.ca/en/immigration-refugees-citizenship/services/application/fees.html',
      'https://www.cmhc-schl.gc.ca/professionals/housing-markets-data-and-research/housing-data/rental-market/rental-market-reports/major-centres',
      'https://www.ontario.ca/page/ontario-immigrant-nominee-program-oinp',
      'https://www.canada.ca/en/financial-consumer-agency/services/financial-toolkit/savings/savings-2.html',
      'https://www.toronto.ca/community-people/children-parenting/children-programs-activities/licensed-child-care/child-care-fee-subsidy/',
    ],
    prefill: {
      adults: 2,
      children: 2,
      arrival: '3_6_months',
      pathway: 'pnp',
      feesPaid: false,
      biometricsDone: false,
      city: 'toronto',
      province: 'Ontario',
      transitMode: 'public',
      jobStatus: 'no_offer',
      income: '',
      savings: '',
      obligations: '',
      savingsCapacity: '',
      housing: '2br',
      furnishing: 'moderate',
      childcare: true,
      car: false,
    },
  },

  // ── Scenario 2: International Student — Study Permit in Toronto ──────────────
  {
    type: 'student_toronto',
    emoji: '🎓',
    persona: 'International Student',
    pathway: 'Study Permit',
    pathwayKey: 'study_permit',
    destination: 'Toronto',
    cityKey: 'toronto',
    low: 66703,
    recommended: 80173,
    high: 94659,
    displayRange: '$66,700 – $94,700',
    costPeriod: '/first year',
    contextLine: 'Tuition, GIC, rent, and living costs for first year',
    studentNote: 'Includes $39.5k tuition + $22.9k GIC (funds locked, not lost)',
    costBreakdown: {
      immigration_fees: 335,
      tuition: 39500,
      gic: 22895,
      travel: 1158,
      housing_deposit_3mo_rent: 7660,
      utilities: 195,
      food: 1350,
      transportation: 468,
      incidental: 1440,
      settlement_buffer: 5172,
    },
    sources: [
      'https://www.canada.ca/en/immigration-refugees-citizenship/services/application/fees.html',
      'https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada/study-permit/get-documents/proof-financial-support.html',
      'https://www.cmhc-schl.gc.ca/professionals/housing-markets-data-and-research/housing-data/rental-market/rental-market-reports/major-centres',
      'https://studentlife.utoronto.ca/task/plan-your-finances-for-studying-in-toronto/',
      'https://www.canada.ca/en/financial-consumer-agency/services/financial-toolkit/savings/savings-2.html',
    ],
    prefill: {
      adults: 1,
      children: 0,
      arrival: '3_6_months',
      pathway: 'study_permit',
      feesPaid: false,
      biometricsDone: false,
      city: 'toronto',
      province: 'Ontario',
      transitMode: 'public',
      jobStatus: 'student',
      income: '',
      savings: '',
      obligations: '',
      savingsCapacity: '',
      housing: '1br',
      furnishing: 'minimal',
      childcare: false,
      car: false,
    },
  },

  // ── Scenario 3: Single Worker — Work Permit in Calgary ───────────────────────
  {
    type: 'worker_calgary',
    emoji: '👷',
    persona: 'Single Worker',
    pathway: 'Work Permit (NOC)',
    pathwayKey: 'work_permit',
    destination: 'Calgary',
    cityKey: 'calgary',
    low: 8771,
    recommended: 16558,
    high: 23754,
    displayRange: '$8,800 – $23,800',
    costPeriod: null,
    contextLine: 'Travel + initial rent + essentials',
    studentNote: null,
    costBreakdown: {
      immigration_fees: 340,
      licensing_credentialing: 98,
      travel: 1158,
      housing_deposit_3mo_rent: 6328,
      utilities: 180,
      food: 1950,
      transportation: 378,
      incidental: 1290,
      settlement_buffer: 4836,
    },
    sources: [
      'https://www.canada.ca/en/immigration-refugees-citizenship/services/application/fees.html',
      'https://www.cmhc-schl.gc.ca/professionals/housing-markets-data-and-research/housing-data/rental-market/rental-market-reports/major-centres',
      'https://www.ucalgary.ca/registrar/student-finances/budgeting',
      'https://www.calgarytransit.com/fares-passes',
      'https://www.canada.ca/en/financial-consumer-agency/services/financial-toolkit/savings/savings-2.html',
    ],
    prefill: {
      adults: 1,
      children: 0,
      arrival: '1_3_months',
      pathway: 'work_permit',
      feesPaid: false,
      biometricsDone: false,
      city: 'calgary',
      province: 'Alberta',
      transitMode: 'public',
      jobStatus: 'offer_30_90',
      income: '',
      savings: '',
      obligations: '',
      savingsCapacity: '',
      housing: '1br',
      furnishing: 'minimal',
      childcare: false,
      car: false,
    },
  },

  // ── Scenario 4: Skilled Professional — Express Entry in Toronto ──────────────
  {
    type: 'professional_ee',
    emoji: '💻',
    persona: 'Skilled Professional',
    pathway: 'Express Entry',
    pathwayKey: 'express_entry',
    destination: 'Toronto',
    cityKey: 'toronto',
    low: 15737,
    recommended: 22050,
    high: 30656,
    displayRange: '$15,700 – $30,700',
    costPeriod: null,
    contextLine: 'Rent + job search buffer + settlement costs',
    studentNote: null,
    costBreakdown: {
      immigration_fees: 1675,
      licensing_credentialing: 568,
      travel: 1158,
      housing_deposit_3mo_rent: 8224,
      utilities: 240,
      food: 2119,
      transportation: 468,
      incidental: 1602,
      settlement_buffer: 5996,
    },
    sources: [
      'https://www.canada.ca/en/immigration-refugees-citizenship/services/application/fees.html',
      'https://www.cmhc-schl.gc.ca/professionals/housing-markets-data-and-research/housing-data/rental-market/rental-market-reports/major-centres',
      'https://studentlife.utoronto.ca/task/plan-your-finances-for-studying-in-toronto/',
      'https://www.canada.ca/en/financial-consumer-agency/services/financial-toolkit/savings/savings-2.html',
      'https://www150.statcan.gc.ca/n1/pub/71-222-x/2018001/def/def-eng.htm',
    ],
    prefill: {
      adults: 1,
      children: 0,
      arrival: '3_6_months',
      pathway: 'express_entry',
      feesPaid: false,
      biometricsDone: false,
      city: 'toronto',
      province: 'Ontario',
      transitMode: 'public',
      jobStatus: 'no_offer',
      income: '',
      savings: '',
      obligations: '',
      savingsCapacity: '',
      housing: '1br',
      furnishing: 'moderate',
      childcare: false,
      car: false,
    },
  },
];

// ─── Utility functions ────────────────────────────────────────────────────────

/** Look up a scenario by its type string. */
export function getScenarioByType(type: string): Scenario | undefined {
  return SCENARIOS.find((s) => s.type === type);
}

/** Return only the wizard pre-fill values for a scenario. */
export function getScenarioPrefill(type: string): PrefillData | undefined {
  return getScenarioByType(type)?.prefill;
}
