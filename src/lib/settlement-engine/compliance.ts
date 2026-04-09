/**
 * Settlement Planner — IRCC Express Entry Compliance Module
 *
 * Determines whether a pathway has an IRCC settlement funds requirement
 * and returns the required amount.
 *
 * Pathways covered here: FSWP, FSTP, PNP (use EE table).
 * Study permit compliance is handled separately in study-permit.ts.
 * CEC, Work Permit, Family Sponsorship, Refugee: no IRCC floor.
 *
 * Data effective: July 7, 2025 (50% of LICO, source: canada.ca)
 */

import type { ImmigrationPathway } from './types'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ExpressEntryFundsEntry {
  familyMembers: number
  amountCAD:     number
}

export interface ExpressEntryData {
  expressEntryFunds:            ExpressEntryFundsEntry[]
  expressEntryAdditionalMember: number
  expressEntryEffectiveDate:    string
}

// ─── Hardcoded fallback (effective July 7, 2025) ─────────────────────────────

export const EXPRESS_ENTRY_DEFAULTS: ExpressEntryData = {
  expressEntryEffectiveDate:    '2025-07-07',
  expressEntryAdditionalMember: 4_112,
  expressEntryFunds: [
    { familyMembers: 1, amountCAD: 15_263 },
    { familyMembers: 2, amountCAD: 19_001 },
    { familyMembers: 3, amountCAD: 23_360 },
    { familyMembers: 4, amountCAD: 28_362 },
    { familyMembers: 5, amountCAD: 32_168 },
    { familyMembers: 6, amountCAD: 36_280 },
    { familyMembers: 7, amountCAD: 40_392 },
  ],
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Returns the required EE settlement funds for the given family size.
 * Uses the lookup table for 1–7 members, then adds per-additional-member
 * for family sizes beyond 7.
 */
export function getExpressEntryFunds(
  familySize: number,
  data: ExpressEntryData = EXPRESS_ENTRY_DEFAULTS,
): number {
  const capped = Math.min(familySize, 7)
  const entry  = data.expressEntryFunds.find(e => e.familyMembers === capped)
  const base   = entry?.amountCAD ?? EXPRESS_ENTRY_DEFAULTS.expressEntryFunds[0].amountCAD
  return base + Math.max(0, familySize - 7) * data.expressEntryAdditionalMember
}

/**
 * Returns the IRCC compliance requirement for the given pathway, or null if exempt.
 *
 * - FSWP, FSTP: EE settlement funds (Section 1.1 table)
 * - PNP: Most PNPs reference LICO — use EE table as conservative estimate
 * - CEC: Exempt (no regulatory floor — still recommended to have savings)
 * - Study Permit: Handled in study-permit.ts (tuition + living + transport)
 * - Work Permit, Family Sponsorship, Other: null
 */
export function getComplianceRequirement(
  pathway: ImmigrationPathway,
  familySize: number,
  data: ExpressEntryData = EXPRESS_ENTRY_DEFAULTS,
): number | null {
  switch (pathway) {
    case 'express-entry-fsw':
    case 'express-entry-fstp':
    case 'pnp':
      return getExpressEntryFunds(familySize, data)
    default:
      return null
  }
}

// ─── EE Proof-of-Funds Result (US-2.1) ───────────────────────────────────────

export interface EEProofOfFundsResult {
  amount:           number
  exempt:           boolean
  reason?:          'cec' | 'job_offer'
  safeRecommended?: number
  buffer?:          number
}

/**
 * Returns the IRCC proof-of-funds result for Express Entry and PNP pathways.
 *
 * CEC is unconditionally exempt (US-2.1): no minimum applies.
 * FSW/FSTP with a valid job offer AND work authorization are exempt (US-2.2).
 * FSW/FSTP/PNP (no exemption): returns the official minimum and a 5 % safe-recommended buffer.
 * All other pathways (work-permit, family-sponsorship, etc.): exempt with no reason.
 *
 * Safe Recommended = ceil(official × 1.05 / 100) × 100
 */
export function computeEEProofOfFunds(
  pathway:        ImmigrationPathway,
  familySize:     number,
  data?:          ExpressEntryData,
  jobOfferExempt?: boolean,
): EEProofOfFundsResult {
  if (pathway === 'express-entry-cec') {
    return { amount: 0, exempt: true, reason: 'cec' }
  }
  // US-2.2: FSW/FSTP applicants with a valid job offer AND work authorization are exempt
  if (jobOfferExempt && (pathway === 'express-entry-fsw' || pathway === 'express-entry-fstp')) {
    return { amount: 0, exempt: true, reason: 'job_offer' }
  }
  const floor = getComplianceRequirement(pathway, familySize, data)
  if (floor === null) return { amount: 0, exempt: true }
  const safeRecommended = Math.ceil((floor * 1.05) / 100) * 100
  return { amount: floor, exempt: false, safeRecommended, buffer: safeRecommended - floor }
}

/**
 * Extract ExpressEntryData from a raw Sanity immigrationFees document.
 * Falls back to EXPRESS_ENTRY_DEFAULTS if fields are absent.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function fetchExpressEntryData(doc: Record<string, any> | null | undefined): ExpressEntryData {
  if (!doc?.expressEntryFunds?.length) return EXPRESS_ENTRY_DEFAULTS
  return {
    expressEntryFunds:            doc.expressEntryFunds            ?? EXPRESS_ENTRY_DEFAULTS.expressEntryFunds,
    expressEntryAdditionalMember: doc.expressEntryAdditionalMember ?? EXPRESS_ENTRY_DEFAULTS.expressEntryAdditionalMember,
    expressEntryEffectiveDate:    doc.expressEntryEffectiveDate    ?? EXPRESS_ENTRY_DEFAULTS.expressEntryEffectiveDate,
  }
}
