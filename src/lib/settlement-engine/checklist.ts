/**
 * Settlement Planner — Personalized Settlement Checklist Engine (US-13.3)
 *
 * Pure function. Generates a checklist personalised to the client's pathway,
 * destination city, province, and triggered risks.
 *
 * Items are grouped into 4 periods:
 *   Pre-Arrival · First Week · First 30 Days · First 90 Days
 *
 * Conditions are evaluated at generation time — the returned Checklist
 * contains only items relevant to this specific client.
 */

import { STUDY_PERMIT_DEFAULTS } from './study-permit'
import type { Risk } from './risks'

// ─── Public Types ─────────────────────────────────────────────────────────────

export interface ChecklistItem {
  label:        string
  articleSlug?: string | null   // null = no article link
}

export interface Checklist {
  preArrival: ChecklistItem[]
  firstWeek:  ChecklistItem[]
  first30:    ChecklistItem[]
  first90:    ChecklistItem[]
}

export interface ChecklistInputs {
  pathway:   string          // wizard answers.pathway (e.g. 'study_permit')
  province:  string          // 2-letter code, e.g. 'ON'
  city:      string          // lowercase slug, e.g. 'toronto'
  gicStatus?: string | null  // 'planning' | 'purchased' | 'not_purchasing' | null
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

/** Normalises the wizard pathway string to the engine pathway string. */
function isStudyPermit(pathway: string) { return pathway === 'study_permit'   }
function isExpressEntry(pathway: string) { return pathway === 'express_entry'  }
function isPNP(pathway: string)          { return pathway === 'pnp'            }
function isWorkPermit(pathway: string)   { return pathway === 'work_permit'    }
function isFamily(pathway: string)       { return pathway === 'family'         }

function item(label: string, articleSlug?: string | null): ChecklistItem {
  return { label, articleSlug: articleSlug ?? null }
}

// ─── City lookup tables ───────────────────────────────────────────────────────

const TRANSIT_CARD: Record<string, string> = {
  toronto:   'PRESTO card (TTC & GO)',
  ottawa:    'PRESTO card (OC Transpo)',
  vancouver: 'Compass card (TransLink)',
  calgary:   'MyFare account (Calgary Transit)',
  montreal:  'OPUS card (STM)',
  winnipeg:  'Peggo card (Winnipeg Transit)',
  halifax:   'Halifax Transit app (mobile ticketing)',
}

const TRANSIT_LINK: Record<string, string | null> = {
  toronto: null, ottawa: null, vancouver: null, calgary: null,
  montreal: null, winnipeg: null, halifax: null,
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

// ─── Main: generateChecklist ──────────────────────────────────────────────────

export function generateChecklist(
  inputs: ChecklistInputs,
  risks:  Risk[],
): Checklist {
  const { pathway, province, city, gicStatus } = inputs
  const cityLow      = city.toLowerCase()
  const cityName     = CITY_LABELS[cityLow] ?? city.charAt(0).toUpperCase() + city.slice(1)
  const healthPlan   = PROVINCE_HEALTH_PLAN[province] ?? 'provincial health card'
  const transitCard  = TRANSIT_CARD[cityLow] ?? 'local transit card'
  const riskIds      = new Set(risks.map(r => r.id))

  const preArrival: ChecklistItem[] = []
  const firstWeek:  ChecklistItem[] = []
  const first30:    ChecklistItem[] = []
  const first90:    ChecklistItem[] = []

  // ── BASE: items for all newcomers ─────────────────────────────────────────

  // Pre-Arrival
  if (!isStudyPermit(pathway)) {
    // Students handle accommodation differently
    preArrival.push(
      item('Prepare rental application package (references, credit report, employment letter)',
        'renting-in-canada-newcomer-guide'),
      item(`Arrange temporary accommodation for first 2 weeks in ${cityName} (Airbnb, hostel, or friend's place)`),
    )
  }
  preArrival.push(
    item('Open a Canadian bank account online — many banks allow pre-arrival account opening'),
    item(`Download the ${transitCard.split(' (')[0]} app and research commute routes in ${cityName}`),
  )

  // First Week
  firstWeek.push(
    item('Apply for your Social Insurance Number (SIN) at a Service Canada office or online'),
    item('Activate your Canadian bank account in person and deposit initial funds'),
    item(`Get a ${transitCard} and load funds or a monthly pass`),
    item('Set up a Canadian phone plan — compare Fido, Koodo, Freedom Mobile for newcomer plans'),
  )

  // First 30 Days
  if (!isStudyPermit(pathway)) {
    // Study permit has its own health coverage flow
    first30.push(
      item(`Apply for your ${healthPlan} card at a provincial service centre`,
        'health-insurance-for-newcomers-canada'),
    )
  }
  first30.push(
    item("Register for CRA My Account online — required for tax filing and benefits"),
    item('Apply for a secured credit card to start building Canadian credit history'),
    item('Build a detailed monthly budget using the Maple Insight Newcomer Budget Calculator',
      null),
  )

  // First 90 Days
  first90.push(
    item('Open a TFSA and set up automatic weekly contributions',
      'tfsa-vs-rrsp-newcomer-guide'),
    item('Compare TFSA vs RRSP for your situation using the Maple Insight Calculator',
      'tfsa-vs-rrsp-newcomer-guide'),
    item('Review your housing options — consider whether to renew or move to a better unit',
      'renting-in-canada-newcomer-guide'),
    item('File for any applicable GST/HST credit and provincial benefit programs'),
  )

  // ── PATHWAY-SPECIFIC: Express Entry / PNP ────────────────────────────────

  if (isExpressEntry(pathway) || isPNP(pathway)) {
    preArrival.push(
      item('Gather proof-of-funds documentation (6 months of bank statements)',
        'financial-checklist-before-moving-to-canada'),
      item('Confirm your COPR expiry date and book flights within the validity window'),
    )
    firstWeek.push(
      item('Complete landing at the port of entry — have your COPR stamped by CBSA'),
    )
    first30.push(
      item('Apply for your Permanent Resident (PR) card at an IRCC Service Centre'),
    )
    first90.push(
      item('Confirm your address with IRCC — required to receive your PR card'),
    )
  }

  // ── PATHWAY-SPECIFIC: Work Permit ─────────────────────────────────────────

  if (isWorkPermit(pathway)) {
    preArrival.push(
      item('Confirm your employer\'s LMIA exemption code or LMIA approval number'),
      item('Ensure your work permit is valid for the correct employer, location, and NOC'),
    )
    firstWeek.push(
      item('Report to your employer on your confirmed start date with all work authorization documents'),
    )
    first90.push(
      item('Track your months of skilled work experience toward Canadian Experience Class (CEC) eligibility'),
    )
  }

  // ── PATHWAY-SPECIFIC: Family Sponsorship ─────────────────────────────────

  if (isFamily(pathway)) {
    preArrival.push(
      item('Confirm the sponsor\'s undertaking agreement is signed and on file with IRCC'),
    )
    first30.push(
      item('Register with provincial family support services if applicable'),
    )
  }

  // ── PATHWAY-SPECIFIC: Study Permit ───────────────────────────────────────

  if (isStudyPermit(pathway)) {
    const spHealthEntry = STUDY_PERMIT_DEFAULTS.healthInsuranceByProvince
      .find(h => h.provinceCode === province)
    const noProvCoverage = spHealthEntry ? !spHealthEntry.hasProvincialCoverage : true

    // Pre-Arrival (study permit)
    preArrival.push(
      item('Obtain acceptance letter from a Designated Learning Institution (DLI)',
        null),
      item('Obtain Provincial Attestation Letter (PAL/TAL) from your province if required',
        null),
    )

    // GIC — only if not already purchased
    if (gicStatus !== 'purchased') {
      preArrival.push(
        item('Purchase a GIC (Guaranteed Investment Certificate) from a participating Canadian bank',
          'what-is-a-gic-canada'),
      )
    }

    preArrival.push(
      item('Complete medical examination with an IRCC-approved panel physician'),
      item('Submit study permit application with proof of funds documentation',
        'study-permit-proof-of-funds'),
    )

    // Health insurance: show only for provinces without provincial coverage
    if (noProvCoverage) {
      preArrival.push(
        item('Arrange private health insurance or confirm mandatory UHIP enrollment with your institution',
          'health-insurance-international-students-canada'),
      )
    }

    // CAQ: Quebec only
    if (province === 'QC') {
      preArrival.push(
        item('Apply for Quebec Acceptance Certificate (CAQ) from MIFI before your study permit',
          'studying-in-quebec-caq'),
      )
    }

    preArrival.push(
      item(`Arrange temporary accommodation near your campus in ${cityName} for the first 2 weeks`),
    )

    // First Week (study permit)
    if (gicStatus === 'purchased' || gicStatus === 'planning') {
      firstWeek.push(
        item('Activate your GIC at a local branch of your designated bank'),
      )
    }
    firstWeek.push(
      item('Collect your student ID card and confirm UHIP or health insurance enrollment'),
      item('Apply for your Social Insurance Number (SIN) — required for any part-time work'),
      item('Open a Canadian bank account (if separate from your GIC bank)'),
      item(`Get a ${transitCard} and load funds for your commute to campus`),
    )

    // First 30 Days (study permit)
    if (province === 'BC') {
      first30.push(
        item('Apply for MSP (Medical Services Plan) — eligible after 3-month wait',
          'health-insurance-for-newcomers-canada'),
      )
    }
    first30.push(
      item('Confirm your class schedule and review work-hour limits (max 24 hrs/week during term)'),
      item('Register for on-campus job board and explore permitted off-campus work opportunities'),
      item('Set up a student budget using your GIC monthly disbursement as the baseline',
        null),
    )

    // First 90 Days (study permit)
    first90.push(
      item('Confirm UHIP or health coverage is active — review what is and is not covered'),
      item('Review your first GIC disbursement amounts and adjust monthly spending budget'),
      item('Apply for institutional scholarships for Year 2 (check your institution\'s deadline)'),
    )
  }

  // ── CITY-SPECIFIC items ───────────────────────────────────────────────────

  if (cityLow === 'toronto') {
    first30.push(
      item('Apply for the Toronto newcomer library card — free access to digital resources and job tools'),
    )
  }
  if (cityLow === 'vancouver') {
    first30.push(
      item('Register with S.U.C.C.E.S.S. or DIVERSEcity newcomer services for free settlement support'),
    )
  }
  if (cityLow === 'calgary') {
    first30.push(
      item('Register with Calgary Immigrant Women\'s Association or Centre for Newcomers for settlement support'),
    )
  }
  if (cityLow === 'montreal') {
    first30.push(
      item('Register with an OFII-accredited francisation program if French proficiency is a goal'),
    )
  }

  // ── RISK-DRIVEN items ──────────────────────────────────────────────────────

  if (riskIds.has('housingBurden')) {
    preArrival.push(
      item('Explore shared housing or studio apartments to reduce rent below 45% of income',
        'renting-in-canada-newcomer-guide'),
    )
  }

  if (riskIds.has('incomeUncertainty')) {
    preArrival.push(
      item(`Begin your job search before arriving — use Job Bank Canada and LinkedIn to target ${cityName} roles`,
        'finding-a-job-in-canada-before-you-arrive'),
    )
  }

  if (riskIds.has('healthCoverageGap')) {
    firstWeek.push(
      item('Purchase bridge health insurance to cover the provincial waiting period',
        'health-insurance-for-newcomers-canada'),
    )
  }

  if (riskIds.has('healthCoverageGapStudent') && spHasBridgeNeed(province)) {
    firstWeek.push(
      item('Purchase bridge health insurance to cover the provincial coverage wait period',
        'health-insurance-international-students-canada'),
    )
  }

  if (riskIds.has('irccProofOfFundsCompliance')) {
    preArrival.push(
      item('Resolve IRCC proof-of-funds shortfall before submitting your study permit application',
        'study-permit-proof-of-funds'),
    )
  }

  if (riskIds.has('largeSavingsGap') || riskIds.has('proofOfFundsMinimum')) {
    preArrival.push(
      item('Increase your liquid savings to at least cover the one-time move-in costs before travelling',
        'financial-checklist-before-moving-to-canada'),
    )
  }

  if (riskIds.has('quebecComplexity')) {
    preArrival.push(
      item('Apply for the Quebec CAQ (Certificat d\'acceptation du Québec) — allow 4–8 weeks processing',
        'studying-in-quebec-caq'),
    )
  }

  return { preArrival, firstWeek, first30, first90 }
}

// ─── Internal helper ──────────────────────────────────────────────────────────

function spHasBridgeNeed(province: string): boolean {
  const entry = STUDY_PERMIT_DEFAULTS.healthInsuranceByProvince
    .find(h => h.provinceCode === province)
  return !!entry?.bridgeCoverageNeeded
}
