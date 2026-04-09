/**
 * Settlement Planner — Immigration Fee Schedules (US-1.3)
 *
 * Canonical fee defaults mirroring Sanity `immigrationFees` documents.
 * These are the single source of truth for fee values in code.
 * Components and engine functions must not hard-code fee numbers — they
 * must reference a FeeSchedule returned by getFeeSchedule().
 *
 * When Sanity data is available, call feeScheduleFromSanityDoc() to
 * override these defaults with the live document values.
 *
 * Source: IRCC — https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/apply-permanent-residence/fees.html
 * Effective: November 2024
 * Verified: 2026-04-08
 */

import type { ImmigrationPathway } from './types'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface FeeLineItem {
  /** Machine-readable identifier matching the BreakdownItem key it governs. */
  key:           string
  /** Human-readable label shown in the breakdown. */
  label:         string
  /** Fee amount in Canadian dollars. */
  amountCAD:     number
  /** Canonical government URL documenting this specific fee. */
  sourceUrl:     string
  /** ISO date when this fee amount took effect. */
  effectiveDate: string
  /** Optional editorial note (e.g. "Includes RPRF"). */
  notes?:        string
}

export interface FeeSchedule {
  /** Immigration pathway identifier — matches ImmigrationPathway. */
  pathway:              string
  /** Per-applicant government processing fee (CAD). */
  applicationFee:       number
  /** Biometrics fee per person (CAD). */
  biometricsPerPerson:  number
  /** Maximum biometrics fee for a family or group of 2+ (CAD). */
  biometricsFamilyCap:  number
  /** Medical exam fee per person (CAD). 0 for non-study-permit pathways. */
  medicalExamPerPerson: number
  /** True if this schedule has been verified against official IRCC sources. */
  verified:             boolean
  /** ISO date of last verification. */
  verifiedAt:           string
  /** Canonical IRCC URL for this fee schedule. */
  sourceUrl:            string
  /** ISO date when these fees took effect. */
  effectiveDate:        string
  /** Granular fee line items — one per fee component with individual source URLs. */
  feeLineItems:         FeeLineItem[]
}

// ─── IRCC source URLs ─────────────────────────────────────────────────────────

const IRCC_PR_FEES_URL =
  'https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/apply-permanent-residence/fees.html'
const IRCC_BIO_URL =
  'https://www.canada.ca/en/immigration-refugees-citizenship/services/application/fees.html'
const IRCC_SP_FEES_URL =
  'https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada/study-permit/get-documents/letters/fees.html'
const IRCC_WP_FEES_URL =
  'https://www.canada.ca/en/immigration-refugees-citizenship/services/work-canada/permit/temporary/apply/fees.html'
const IRCC_FAMILY_FEES_URL =
  'https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/family-sponsorship/relative/apply.html'

// ─── Shared constants ─────────────────────────────────────────────────────────

const BIOMETRICS_PER_PERSON = 85
const BIOMETRICS_FAMILY_CAP = 170
/** Processing fee only — RPRF ($575/adult) is a separate line item. Effective April 30, 2024. */
const EE_PR_APPLICATION_FEE = 950
const RPRF_SINGLE           = 575
const RPRF_COUPLE           = 1_150  // 2 × 575
const EFFECTIVE_DATE_PR     = '2024-04-30'
const VERIFIED_AT           = '2026-04-08'
const IRCC_RPRF_URL         =
  'https://www.canada.ca/en/immigration-refugees-citizenship/corporate/mandate/policies-operational-instructions-agreements/ministerial-instructions/other-goods-services-fees/fees.html'

// ─── Express Entry — Federal Skilled Worker (FSW) ────────────────────────────

export const FSW_FEE_DEFAULTS: FeeSchedule = {
  pathway:              'express-entry-fsw',
  applicationFee:       EE_PR_APPLICATION_FEE,
  biometricsPerPerson:  BIOMETRICS_PER_PERSON,
  biometricsFamilyCap:  BIOMETRICS_FAMILY_CAP,
  medicalExamPerPerson: 0,
  verified:             true,
  verifiedAt:           VERIFIED_AT,
  sourceUrl:            IRCC_PR_FEES_URL,
  effectiveDate:        EFFECTIVE_DATE_PR,
  feeLineItems: [
    {
      key:           'immigration-fee',
      label:         'Processing fee — principal applicant',
      amountCAD:     EE_PR_APPLICATION_FEE,
      sourceUrl:     IRCC_PR_FEES_URL,
      effectiveDate: EFFECTIVE_DATE_PR,
      notes:         'Government processing fee for Express Entry PR application. Effective April 30, 2024.',
    },
    {
      key:           'rprf-single',
      label:         'Right of Permanent Residence Fee — single applicant',
      amountCAD:     RPRF_SINGLE,
      sourceUrl:     IRCC_RPRF_URL,
      effectiveDate: EFFECTIVE_DATE_PR,
      notes:         'RPRF is charged per adult and can be paid any time before landing. Effective April 30, 2024.',
    },
    {
      key:           'rprf-couple',
      label:         'Right of Permanent Residence Fee — 2 adults',
      amountCAD:     RPRF_COUPLE,
      sourceUrl:     IRCC_RPRF_URL,
      effectiveDate: EFFECTIVE_DATE_PR,
      notes:         '2 × $575 RPRF for couples. Effective April 30, 2024.',
    },
    {
      key:           'biometrics-single',
      label:         'Biometrics — single applicant',
      amountCAD:     BIOMETRICS_PER_PERSON,
      sourceUrl:     IRCC_BIO_URL,
      effectiveDate: EFFECTIVE_DATE_PR,
    },
    {
      key:           'biometrics-family-cap',
      label:         'Biometrics — family/group cap (2+ persons)',
      amountCAD:     BIOMETRICS_FAMILY_CAP,
      sourceUrl:     IRCC_BIO_URL,
      effectiveDate: EFFECTIVE_DATE_PR,
      notes:         'IRCC caps total biometrics at $170 when a family or group applies together.',
    },
  ],
}

// ─── Express Entry — Canadian Experience Class (CEC) ─────────────────────────

export const CEC_FEE_DEFAULTS: FeeSchedule = {
  ...FSW_FEE_DEFAULTS,
  pathway: 'express-entry-cec',
}

// ─── Express Entry — Federal Skilled Trades (FSTP) ───────────────────────────

export const FSTP_FEE_DEFAULTS: FeeSchedule = {
  ...FSW_FEE_DEFAULTS,
  pathway: 'express-entry-fstp',
}

// ─── Provincial Nominee Program (PNP) ────────────────────────────────────────

export const PNP_FEE_DEFAULTS: FeeSchedule = {
  ...FSW_FEE_DEFAULTS,
  pathway: 'pnp',
}

// ─── Study Permit ─────────────────────────────────────────────────────────────

export const STUDY_PERMIT_FEE_DEFAULTS: FeeSchedule = {
  pathway:              'study-permit',
  applicationFee:       150,
  biometricsPerPerson:  BIOMETRICS_PER_PERSON,
  biometricsFamilyCap:  BIOMETRICS_FAMILY_CAP,
  medicalExamPerPerson: 250,
  verified:             true,
  verifiedAt:           VERIFIED_AT,
  sourceUrl:            IRCC_SP_FEES_URL,
  effectiveDate:        '2024-09-01',
  feeLineItems: [
    {
      key:           'permit-fee',
      label:         'Study permit application fee',
      amountCAD:     150,
      sourceUrl:     IRCC_SP_FEES_URL,
      effectiveDate: '2024-09-01',
    },
    {
      key:           'biometrics-single',
      label:         'Biometrics — single applicant',
      amountCAD:     BIOMETRICS_PER_PERSON,
      sourceUrl:     IRCC_BIO_URL,
      effectiveDate: EFFECTIVE_DATE_PR,
    },
    {
      key:           'biometrics-family-cap',
      label:         'Biometrics — family/group cap (2+ persons)',
      amountCAD:     BIOMETRICS_FAMILY_CAP,
      sourceUrl:     IRCC_BIO_URL,
      effectiveDate: EFFECTIVE_DATE_PR,
      notes:         'IRCC caps total biometrics at $170 when a family applies together.',
    },
    {
      key:           'medical-exam',
      label:         'Medical exam (per person)',
      amountCAD:     250,
      sourceUrl:     'https://www.canada.ca/en/immigration-refugees-citizenship/services/application/medical-police/medical-exams/requirements-temporary-residents.html',
      effectiveDate: '2024-01-01',
    },
  ],
}

// ─── Work Permit ─────────────────────────────────────────────────────────────

export const WORK_PERMIT_FEE_DEFAULTS: FeeSchedule = {
  pathway:              'work-permit',
  applicationFee:       155,
  biometricsPerPerson:  BIOMETRICS_PER_PERSON,
  biometricsFamilyCap:  BIOMETRICS_FAMILY_CAP,
  medicalExamPerPerson: 0,
  verified:             true,
  verifiedAt:           VERIFIED_AT,
  sourceUrl:            IRCC_WP_FEES_URL,
  effectiveDate:        EFFECTIVE_DATE_PR,
  feeLineItems: [
    {
      key:           'immigration-fee',
      label:         'Work permit application fee',
      amountCAD:     155,
      sourceUrl:     IRCC_WP_FEES_URL,
      effectiveDate: EFFECTIVE_DATE_PR,
    },
    {
      key:           'biometrics-single',
      label:         'Biometrics — single applicant',
      amountCAD:     BIOMETRICS_PER_PERSON,
      sourceUrl:     IRCC_BIO_URL,
      effectiveDate: EFFECTIVE_DATE_PR,
    },
  ],
}

// ─── Family Sponsorship ───────────────────────────────────────────────────────

export const FAMILY_SPONSORSHIP_FEE_DEFAULTS: FeeSchedule = {
  pathway:              'family-sponsorship',
  applicationFee:       1_050,
  biometricsPerPerson:  BIOMETRICS_PER_PERSON,
  biometricsFamilyCap:  BIOMETRICS_FAMILY_CAP,
  medicalExamPerPerson: 0,
  verified:             true,
  verifiedAt:           VERIFIED_AT,
  sourceUrl:            IRCC_FAMILY_FEES_URL,
  effectiveDate:        EFFECTIVE_DATE_PR,
  feeLineItems: [
    {
      key:           'immigration-fee',
      label:         'Family sponsorship processing fee (combined)',
      amountCAD:     1_050,
      sourceUrl:     IRCC_FAMILY_FEES_URL,
      effectiveDate: EFFECTIVE_DATE_PR,
      notes:         'Includes sponsor application fee and principal applicant processing fee.',
    },
    {
      key:           'biometrics-single',
      label:         'Biometrics — single applicant',
      amountCAD:     BIOMETRICS_PER_PERSON,
      sourceUrl:     IRCC_BIO_URL,
      effectiveDate: EFFECTIVE_DATE_PR,
    },
  ],
}

// ─── Lookup ───────────────────────────────────────────────────────────────────

/**
 * Returns the canonical fee schedule for the given immigration pathway.
 * Falls back to FSW defaults for any unrecognised pathway string.
 */
export function getFeeSchedule(pathway: ImmigrationPathway | string): FeeSchedule {
  switch (pathway) {
    case 'express-entry-cec':  return CEC_FEE_DEFAULTS
    case 'express-entry-fstp': return FSTP_FEE_DEFAULTS
    case 'study-permit':       return STUDY_PERMIT_FEE_DEFAULTS
    case 'work-permit':        return WORK_PERMIT_FEE_DEFAULTS
    case 'pnp':                return PNP_FEE_DEFAULTS
    case 'family-sponsorship': return FAMILY_SPONSORSHIP_FEE_DEFAULTS
    default:                   return FSW_FEE_DEFAULTS
  }
}

// ─── Computation helpers ──────────────────────────────────────────────────────

/**
 * Returns the correct biometrics fee for the household.
 * Applies the IRCC family/group cap of $170 when the total
 * number of persons (adults + children) is 2 or more.
 */
export function computeBiometricsFee(
  schedule: Pick<FeeSchedule, 'biometricsPerPerson' | 'biometricsFamilyCap'>,
  household: { adults: number; children: number },
): number {
  const totalPersons = household.adults + household.children
  return totalPersons >= 2 ? schedule.biometricsFamilyCap : schedule.biometricsPerPerson
}

// ─── Sanity hydration helper ──────────────────────────────────────────────────

/**
 * Build a FeeSchedule from a raw Sanity `immigrationFees` document.
 * Falls back field-by-field to the supplied defaults if document fields are absent.
 * Call this in server components or API routes where the Sanity document is available.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function feeScheduleFromSanityDoc(
  doc: Record<string, any> | null | undefined,
  defaults: FeeSchedule,
): FeeSchedule {
  if (!doc) return defaults
  return {
    pathway:              doc.pathway              ?? defaults.pathway,
    applicationFee:       doc.applicationFee       ?? defaults.applicationFee,
    biometricsPerPerson:  doc.biometricsFee        ?? defaults.biometricsPerPerson,
    biometricsFamilyCap:  doc.biometricsFamilyCapFee ?? defaults.biometricsFamilyCap,
    medicalExamPerPerson: defaults.medicalExamPerPerson,
    verified:             doc.verified             ?? false,
    verifiedAt:           doc.verifiedAt           ?? defaults.verifiedAt,
    sourceUrl:            doc.source               ?? defaults.sourceUrl,
    effectiveDate:        doc.effectiveDate         ?? defaults.effectiveDate,
    feeLineItems:         doc.feeLineItems?.length > 0
      ? doc.feeLineItems.map((item: Record<string, unknown>) => ({
          key:           item.key,
          label:         item.label,
          amountCAD:     item.amountCAD,
          sourceUrl:     item.sourceUrl ?? '',
          effectiveDate: item.effectiveDate ?? doc.effectiveDate ?? defaults.effectiveDate,
          notes:         item.notes,
        }))
      : defaults.feeLineItems,
  }
}
