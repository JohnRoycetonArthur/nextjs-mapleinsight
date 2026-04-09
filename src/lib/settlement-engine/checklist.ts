/**
 * Settlement Planner — Personalized Settlement Checklist Engine (US-13.3)
 * Updated: US-19.4 — Deduplication, capping, conditional TFSA/RRSP
 *
 * Items are grouped into 4 periods:
 *   Pre-Arrival · First Week · First 30 Days · First 90 Days
 *
 * Post-processing (in order):
 *   1. Deduplication — if a key appears in multiple periods, keep the
 *      earliest-period instance and discard later duplicates.
 *   2. Capping — each period keeps the 7 highest-priority items;
 *      the remainder move to `additionalSteps`.
 */

import { STUDY_PERMIT_DEFAULTS } from './study-permit'
import type { Risk } from './risks'

// ─── Public Types ─────────────────────────────────────────────────────────────

export interface ChecklistItem {
  key:          string             // machine key — used for deduplication
  label:        string
  articleSlug?: string | null
  priority:     number             // 1 = highest priority, 10 = lowest
}

/** One settlement period after deduplication and capping. */
export interface ChecklistPeriod {
  items:           ChecklistItem[]   // ≤ 7 items, sorted by priority
  additionalSteps: ChecklistItem[]   // overflow (lowest-priority or priority > 7)
}

export interface Checklist {
  preArrival: ChecklistPeriod
  firstWeek:  ChecklistPeriod
  first30:    ChecklistPeriod
  first90:    ChecklistPeriod
}

export interface ChecklistInputs {
  pathway:         string          // wizard answers.pathway
  province:        string          // 2-letter code, e.g. 'ON'
  city:            string          // lowercase slug, e.g. 'toronto'
  gicStatus?:      string | null   // 'planning' | 'purchased' | 'not_purchasing' | null
  income?:         number          // monthly net income — used for TFSA/RRSP conditional (AC-3)
  savings?:        number          // liquid savings    — used for TFSA/RRSP conditional (AC-3)
  jobOfferExempt?: boolean         // US-2.2: FSW/FST applicant is exempt from proof-of-funds
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function isStudyPermit(pathway: string) { return pathway === 'study_permit'   }
function isExpressEntry(pathway: string) { return pathway === 'express_entry'  }
function isPNP(pathway: string)          { return pathway === 'pnp'            }
function isWorkPermit(pathway: string)   { return pathway === 'work_permit'    }
function isFamily(pathway: string)       { return pathway === 'family'         }

/** Build a ChecklistItem with an explicit key and priority. */
function item(
  key:         string,
  label:       string,
  articleSlug?: string | null,
  priority = 5,
): ChecklistItem {
  return { key, label, articleSlug: articleSlug ?? null, priority }
}

// ─── City / Province lookup tables ───────────────────────────────────────────

const TRANSIT_CARD: Record<string, string> = {
  toronto:   'PRESTO card (TTC & GO)',
  ottawa:    'PRESTO card (OC Transpo)',
  vancouver: 'Compass card (TransLink)',
  calgary:   'MyFare account (Calgary Transit)',
  montreal:  'OPUS card (STM)',
  winnipeg:  'Peggo card (Winnipeg Transit)',
  halifax:   'Halifax Transit app (mobile ticketing)',
}

const CITY_LABELS: Record<string, string> = {
  toronto: 'Toronto', vancouver: 'Vancouver', calgary: 'Calgary',
  montreal: 'Montréal', ottawa: 'Ottawa', halifax: 'Halifax', winnipeg: 'Winnipeg',
}

const PROVINCE_HEALTH_PLAN: Record<string, string> = {
  ON: 'OHIP', BC: 'MSP', AB: 'AHCIP', QC: 'RAMQ',
  MB: 'Manitoba Health', SK: 'Saskatchewan Health Card',
  NS: 'MSI', NB: 'Medicare', PE: 'PEI Health Card', NL: 'MCP',
}

// ─── Post-processing: deduplication pass ─────────────────────────────────────

/**
 * Processes periods in priority order (pre-arrival → first-week → first-30 → first-90).
 * If a key is already seen (earlier period or earlier in same period), the later
 * occurrence is dropped.
 * Satisfies AC-1 and AC-4.
 */
function deduplicatePeriods(
  periods: ChecklistItem[][],
): ChecklistItem[][] {
  const seen = new Set<string>()
  return periods.map(items =>
    items.filter(it => {
      if (seen.has(it.key)) return false
      seen.add(it.key)
      return true
    })
  )
}

// ─── Post-processing: capping pass ───────────────────────────────────────────

/**
 * Keeps the 7 highest-priority items in `items`.
 * Any remainder (sorted by priority, lowest first) moves to `additionalSteps`.
 * Satisfies AC-2.
 */
function capPeriod(items: ChecklistItem[]): ChecklistPeriod {
  const sorted = [...items].sort((a, b) => a.priority - b.priority)
  return {
    items:           sorted.slice(0, 7),
    additionalSteps: sorted.slice(7),
  }
}

// ─── Main: generateChecklist ──────────────────────────────────────────────────

export function generateChecklist(
  inputs: ChecklistInputs,
  risks:  Risk[],
): Checklist {
  const { pathway, province, city, gicStatus, jobOfferExempt } = inputs
  const cityLow     = city.toLowerCase()
  const cityName    = CITY_LABELS[cityLow] ?? city.charAt(0).toUpperCase() + city.slice(1)
  const healthPlan  = PROVINCE_HEALTH_PLAN[province] ?? 'provincial health card'
  const transitCard = TRANSIT_CARD[cityLow] ?? 'local transit card'
  const riskIds     = new Set(risks.map(r => r.id))

  // TFSA/RRSP conditional (AC-3): only show when income > 0 OR savings > $5,000
  const showTfsaRrsp = (inputs.income ?? 0) > 0 || (inputs.savings ?? 0) > 5_000

  const preArrival: ChecklistItem[] = []
  const firstWeek:  ChecklistItem[] = []
  const first30:    ChecklistItem[] = []
  const first90:    ChecklistItem[] = []

  // ── BASE: items for all newcomers ─────────────────────────────────────────

  // Pre-Arrival
  if (!isStudyPermit(pathway)) {
    preArrival.push(
      item('rental-app',
        'Prepare rental application package (references, credit report, employment letter)',
        'renting-in-canada-newcomer-guide', 5),
      item('temp-accommodation',
        `Arrange temporary accommodation for first 2 weeks in ${cityName} (Airbnb, hostel, or friend's place)`,
        null, 6),
    )
  }
  preArrival.push(
    item('bank-account',
      'Open a Canadian bank account online — many banks allow pre-arrival account opening',
      null, 4),
    item('transit-app',
      `Download the ${transitCard.split(' (')[0]} app and research commute routes in ${cityName}`,
      null, 7),
  )

  // First Week
  firstWeek.push(
    item('sin',
      'Apply for your Social Insurance Number (SIN) at a Service Canada office or online',
      null, 1),
    item('bank-activate',
      'Activate your Canadian bank account in person and deposit initial funds',
      null, 4),
    item('transit-card',
      `Get a ${transitCard} and load funds or a monthly pass`,
      null, 6),
    item('phone-plan',
      'Set up a Canadian phone plan — compare Fido, Koodo, Freedom Mobile for newcomer plans',
      null, 7),
  )

  // First 30 Days
  if (!isStudyPermit(pathway)) {
    first30.push(
      item('health-plan',
        `Apply for your ${healthPlan} card at a provincial service centre`,
        'health-insurance-for-newcomers-canada', 4),
    )
  }
  first30.push(
    item('cra-account',
      'Register for CRA My Account online — required for tax filing and benefits',
      null, 4),
    item('secured-credit',
      'Apply for a secured credit card to start building Canadian credit history',
      null, 5),
    item('newcomer-budget',
      'Build a detailed monthly budget using the Maple Insight Newcomer Budget Calculator',
      null, 6),
  )

  // First 90 Days — TFSA/RRSP only when income > 0 OR savings > $5,000 (AC-3)
  if (showTfsaRrsp) {
    first90.push(
      item('tfsa-open',
        'Open a TFSA and set up automatic weekly contributions',
        'tfsa-vs-rrsp-newcomer-guide', 8),
      item('tfsa-rrsp-compare',
        'Compare TFSA vs RRSP for your situation using the Maple Insight Calculator',
        'tfsa-vs-rrsp-newcomer-guide', 8),
    )
  }
  first90.push(
    item('housing-review',
      'Review your housing options — consider whether to renew or move to a better unit',
      'renting-in-canada-newcomer-guide', 7),
    item('gst-hst-credit',
      'File for any applicable GST/HST credit and provincial benefit programs',
      null, 7),
  )

  // ── PATHWAY-SPECIFIC: Express Entry / PNP ────────────────────────────────

  if (isExpressEntry(pathway) || isPNP(pathway)) {
    // US-2.2: FSW/FST applicants with job offer + work auth exemption don't need proof-of-funds docs
    if (!jobOfferExempt) {
      preArrival.push(
        item('proof-of-funds',
          'Gather proof-of-funds documentation (6 months of bank statements)',
          'financial-checklist-before-moving-to-canada', 2),
      )
    }
    preArrival.push(
      item('copr-dates',
        'Confirm your COPR expiry date and book flights within the validity window',
        null, 3),
    )
    firstWeek.push(
      item('copr-landing',
        'Complete landing at the port of entry — have your COPR stamped by CBSA',
        null, 1),
    )
    first30.push(
      item('pr-card',
        'Apply for your Permanent Resident (PR) card at an IRCC Service Centre',
        null, 3),
    )
    first90.push(
      item('ircc-address',
        'Confirm your address with IRCC — required to receive your PR card',
        null, 5),
    )
  }

  // ── PATHWAY-SPECIFIC: Work Permit ─────────────────────────────────────────

  if (isWorkPermit(pathway)) {
    preArrival.push(
      item('lmia-code',
        "Confirm your employer's LMIA exemption code or LMIA approval number",
        null, 2),
      item('work-permit-check',
        'Ensure your work permit is valid for the correct employer, location, and NOC',
        null, 2),
    )
    firstWeek.push(
      item('employer-report',
        'Report to your employer on your confirmed start date with all work authorization documents',
        null, 1),
    )
    first90.push(
      item('cec-tracking',
        'Track your months of skilled work experience toward Canadian Experience Class (CEC) eligibility',
        null, 8),
    )
  }

  // ── PATHWAY-SPECIFIC: Family Sponsorship ─────────────────────────────────

  if (isFamily(pathway)) {
    preArrival.push(
      item('sponsor-undertaking',
        "Confirm the sponsor's undertaking agreement is signed and on file with IRCC",
        null, 2),
    )
    first30.push(
      item('family-services',
        'Register with provincial family support services if applicable',
        null, 7),
    )
  }

  // ── PATHWAY-SPECIFIC: Study Permit ───────────────────────────────────────

  if (isStudyPermit(pathway)) {
    const spHealthEntry = STUDY_PERMIT_DEFAULTS.healthInsuranceByProvince
      .find(h => h.provinceCode === province)
    const noProvCoverage = spHealthEntry ? !spHealthEntry.hasProvincialCoverage : true

    // Pre-Arrival (study permit)
    preArrival.push(
      item('dli-letter',
        'Obtain acceptance letter from a Designated Learning Institution (DLI)',
        null, 1),
      item('pal-letter',
        'Obtain Provincial Attestation Letter (PAL/TAL) from your province if required',
        null, 2),
    )

    if (gicStatus !== 'purchased') {
      preArrival.push(
        item('gic-purchase',
          'Purchase a GIC (Guaranteed Investment Certificate) from a participating Canadian bank',
          'what-is-a-gic-canada', 2),
      )
    }

    preArrival.push(
      item('medical-exam',
        'Complete medical examination with an IRCC-approved panel physician',
        null, 2),
      item('study-permit-app',
        'Submit study permit application with proof of funds documentation',
        'study-permit-proof-of-funds', 1),
    )

    if (noProvCoverage) {
      preArrival.push(
        item('uhip-prearr',
          'Arrange private health insurance or confirm mandatory UHIP enrollment with your institution',
          'health-insurance-international-students-canada', 3),
      )
    }

    // CAQ: Quebec only (AC-5)
    if (province === 'QC') {
      preArrival.push(
        item('caq',
          'Apply for Quebec Acceptance Certificate (CAQ) from MIFI before your study permit',
          'studying-in-quebec-caq', 2),
      )
    }

    preArrival.push(
      item('campus-accommodation',
        `Arrange temporary accommodation near your campus in ${cityName} for the first 2 weeks`,
        null, 5),
    )

    // First Week (study permit) — 'sin', 'bank-account', 'transit-card' are intentionally
    // the same keys as base items; the dedup pass will drop these duplicates (AC-4, AC-5).
    if (gicStatus === 'purchased' || gicStatus === 'planning') {
      firstWeek.push(
        item('gic-activate',
          'Activate your GIC at a local branch of your designated bank',
          null, 1),
      )
    }
    firstWeek.push(
      item('student-id',
        'Collect your student ID card and confirm UHIP or health insurance enrollment',
        null, 3),
      // 'sin' — duplicate of base firstWeek item; dedup keeps the base instance
      item('sin',
        'Apply for your Social Insurance Number (SIN) — required for any part-time work',
        null, 1),
      // 'bank-account' — duplicate of base preArrival item; dedup keeps preArrival
      item('bank-account',
        'Open a Canadian bank account (if separate from your GIC bank)',
        null, 4),
      // 'transit-card' — duplicate of base firstWeek item; dedup keeps base instance
      item('transit-card',
        `Get a ${transitCard} and load funds for your commute to campus`,
        null, 6),
    )

    // First 30 Days (study permit)
    if (province === 'BC') {
      first30.push(
        item('msp-bc',
          'Apply for MSP (Medical Services Plan) — eligible after 3-month wait',
          'health-insurance-for-newcomers-canada', 4),
      )
    }
    first30.push(
      item('sp-work-hours',
        'Confirm your class schedule and review work-hour limits (up to 24 hours per week off campus during regular academic sessions; on-campus work has no hourly limit)',
        null, 3),
      item('campus-jobs',
        'Register for on-campus job board and explore permitted off-campus work opportunities',
        null, 6),
      // 'newcomer-budget' — duplicate of base first30 item; dedup keeps base instance
      item('newcomer-budget',
        'Set up a student budget using your GIC monthly disbursement as the baseline',
        null, 5),
    )

    // First 90 Days (study permit)
    first90.push(
      item('uhip-review',
        'Confirm UHIP or health coverage is active — review what is and is not covered',
        null, 5),
      item('gic-disbursement',
        'Review your first GIC disbursement amounts and adjust monthly spending budget',
        null, 4),
      item('scholarships-y2',
        "Apply for institutional scholarships for Year 2 (check your institution's deadline)",
        null, 8),
    )
  }

  // ── CITY-SPECIFIC items ───────────────────────────────────────────────────

  if (cityLow === 'toronto') {
    first30.push(
      item('toronto-library',
        'Apply for the Toronto newcomer library card — free access to digital resources and job tools',
        null, 8),
    )
  }
  if (cityLow === 'vancouver') {
    first30.push(
      item('vancouver-settlement',
        'Register with S.U.C.C.E.S.S. or DIVERSEcity newcomer services for free settlement support',
        null, 8),
    )
  }
  if (cityLow === 'calgary') {
    first30.push(
      item('calgary-settlement',
        "Register with Calgary Immigrant Women's Association or Centre for Newcomers for settlement support",
        null, 8),
    )
  }
  if (cityLow === 'montreal') {
    first30.push(
      item('montreal-francisation',
        'Register with an OFII-accredited francisation program if French proficiency is a goal',
        null, 8),
    )
  }

  // ── RISK-DRIVEN items ──────────────────────────────────────────────────────

  if (riskIds.has('housingBurden')) {
    preArrival.push(
      item('shared-housing-risk',
        'Explore shared housing or studio apartments to reduce rent below 45% of income',
        'renting-in-canada-newcomer-guide', 5),
    )
  }

  if (riskIds.has('incomeUncertainty')) {
    preArrival.push(
      item('job-search-risk',
        `Begin your job search before arriving — use Job Bank Canada and LinkedIn to target ${cityName} roles`,
        'finding-a-job-in-canada-before-you-arrive', 3),
    )
  }

  if (riskIds.has('healthCoverageGap')) {
    firstWeek.push(
      item('bridge-health',
        'Purchase bridge health insurance to cover the provincial waiting period',
        'health-insurance-for-newcomers-canada', 3),
    )
  }

  if (riskIds.has('healthCoverageGapStudent') && spHasBridgeNeed(province)) {
    firstWeek.push(
      item('bridge-health-student',
        'Purchase bridge health insurance to cover the provincial coverage wait period',
        'health-insurance-international-students-canada', 3),
    )
  }

  if (riskIds.has('irccProofOfFundsCompliance')) {
    preArrival.push(
      item('ircc-shortfall',
        'Resolve IRCC proof-of-funds shortfall before submitting your study permit application',
        'study-permit-proof-of-funds', 1),
    )
  }

  if (riskIds.has('largeSavingsGap') || riskIds.has('proofOfFundsMinimum')) {
    preArrival.push(
      item('savings-gap',
        'Increase your liquid savings to at least cover the one-time move-in costs before travelling',
        'financial-checklist-before-moving-to-canada', 2),
    )
  }

  if (riskIds.has('quebecComplexity')) {
    // 'caq' — may already be present from study permit QC block; dedup drops this duplicate
    preArrival.push(
      item('caq',
        "Apply for the Quebec CAQ (Certificat d'acceptation du Québec) — allow 4–8 weeks processing",
        'studying-in-quebec-caq', 2),
    )
  }

  // ── Post-processing ────────────────────────────────────────────────────────

  // Step 1: Deduplication — keep earliest-period instance of each key (AC-1, AC-4)
  const [dedupedPreArrival, dedupedFirstWeek, dedupedFirst30, dedupedFirst90] =
    deduplicatePeriods([preArrival, firstWeek, first30, first90])

  // Step 2: Capping — max 7 items per period; excess → additionalSteps (AC-2)
  return {
    preArrival: capPeriod(dedupedPreArrival),
    firstWeek:  capPeriod(dedupedFirstWeek),
    first30:    capPeriod(dedupedFirst30),
    first90:    capPeriod(dedupedFirst90),
  }
}

// ─── Internal helper ──────────────────────────────────────────────────────────

function spHasBridgeNeed(province: string): boolean {
  const entry = STUDY_PERMIT_DEFAULTS.healthInsuranceByProvince
    .find(h => h.provinceCode === province)
  return !!entry?.bridgeCoverageNeeded
}
