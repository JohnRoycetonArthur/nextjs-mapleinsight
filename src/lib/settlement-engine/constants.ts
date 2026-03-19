import type { FurnishingLevel, HousingType, JobStatus } from './types'

// ─── Engine version ───────────────────────────────────────────────────────────

export const ENGINE_VERSION = '1.0.0'

// ─── Buffer ───────────────────────────────────────────────────────────────────

/** 10% contingency buffer applied to the full savings target. */
export const BUFFER_PERCENT = 0.10

// ─── Runway months by job status ─────────────────────────────────────────────

export const RUNWAY_MONTHS: Record<JobStatus, number> = {
  secured: 2,   // job starts within weeks of arrival
  offer:   3,   // offer in hand, start date TBD
  none:    6,   // arriving without employment lined up
  student: 6,   // student — no immediate income expected
}

// ─── Travel estimate ─────────────────────────────────────────────────────────

/** Default travel cost estimate when no override is provided (CAD). */
export const TRAVEL_ESTIMATE_DEFAULT = 1_500

// ─── Furnishing / setup essentials by level ──────────────────────────────────

/** One-time cost to set up a home depending on how furnished it already is. */
export const FURNISHING_COST: Record<FurnishingLevel, number> = {
  furnished: 500,   // just essentials: bedding, kitchen basics
  basic:     2_000, // mix of IKEA / used furniture
  standard:  4_000, // new furniture for most rooms
}

// ─── Monthly fixed baselines ─────────────────────────────────────────────────

/** Utilities: electricity, gas, water (CAD/month). */
export const UTILITIES_BASELINE = 150

/** Phone + internet combined (CAD/month). */
export const PHONE_INTERNET_BASELINE = 80

// ─── Groceries by household composition ─────────────────────────────────────

export const GROCERIES_SINGLE  = 400  // 1 adult
export const GROCERIES_COUPLE  = 600  // 2 adults
export const GROCERIES_PER_CHILD = 200 // per child

// ─── Lifestyle adders ────────────────────────────────────────────────────────

/** Estimated monthly childcare cost when `needsChildcare` is true. */
export const CHILDCARE_MONTHLY = 1_200

/** Estimated monthly car ownership cost (payment + insurance + fuel). */
export const CAR_MONTHLY = 600

// ─── Housing deposit ─────────────────────────────────────────────────────────

/** Landlords in Canada typically require first + last month's rent upfront. */
export const DEPOSIT_MONTHS = 2

// ─── Rent lookup helper ───────────────────────────────────────────────────────

export function rentFromBaseline(
  baseline: { avgRentStudio: number; avgRent1BR: number; avgRent2BR: number },
  housingType: HousingType,
): number {
  switch (housingType) {
    case 'studio': return baseline.avgRentStudio
    case '1br':    return baseline.avgRent1BR
    case '2br':    return baseline.avgRent2BR
  }
}

// ─── Groceries helper ────────────────────────────────────────────────────────

export function groceriesForHousehold(adults: number, children: number): number {
  const adultCost = adults >= 2 ? GROCERIES_COUPLE : GROCERIES_SINGLE
  return adultCost + children * GROCERIES_PER_CHILD
}
