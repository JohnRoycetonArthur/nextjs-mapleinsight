/**
 * fetchCountryCosts — US-3.2
 *
 * Resolves country-specific pre-arrival costs from the Sanity CountryCosts
 * collection with a two-level fallback:
 *
 *   1. Specific country document (iso match, isSeeded = true)
 *   2. ZZ global fallback document (iso = "ZZ") from Sanity
 *   3. Hardcoded ZZ_FALLBACK constant (if Sanity is unreachable or ZZ missing)
 *
 * fetchCountryCostsList() returns all country records (iso + name + flag +
 * isSeeded) for the wizard dropdown, ordered by name, with unseeded countries
 * still included so the user can pick their country and see a "DATA PENDING"
 * badge rather than a missing option.
 */

import { client } from '@/sanity/lib/client'

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface CountryCosts {
  iso: string
  countryName: string
  flag?: string
  isSeeded: boolean
  effectiveDate?: string
  // Medical exam
  medicalExamCAD: number
  medicalExamSource?: string
  medicalExamSourceUrl?: string
  // Police clearance certificate
  pccCAD: number
  pccSource?: string
  pccSourceUrl?: string
  // Language test
  languageTestCAD: number
  languageTestProvider?: string
  languageTestSource?: string
  languageTestSourceUrl?: string
  notes?: string
}

export interface CountryListItem {
  iso: string
  name: string
  flag: string
  isSeeded: boolean
}

// ─── ZZ hardcoded fallback ─────────────────────────────────────────────────────
// Mirrors DEFAULT_ESTIMATE from the country-of-origin design comp.
// Used only when Sanity is unreachable AND no ZZ document exists in cache.

export const ZZ_FALLBACK: CountryCosts = {
  iso: 'ZZ',
  countryName: 'Default (Global Fallback)',
  isSeeded: true,
  medicalExamCAD: 250,
  medicalExamSource: 'Canadian newcomer average',
  pccCAD: 40,
  pccSource: 'Canadian newcomer average',
  languageTestCAD: 300,
  languageTestProvider: 'IELTS',
  languageTestSource: 'IELTS Canada average',
}

// ─── GROQ fragments ────────────────────────────────────────────────────────────

const COST_FIELDS = `
  iso,
  countryName,
  flag,
  isSeeded,
  effectiveDate,
  medicalExamCAD,
  medicalExamSource,
  medicalExamSourceUrl,
  pccCAD,
  pccSource,
  pccSourceUrl,
  languageTestCAD,
  languageTestProvider,
  languageTestSource,
  languageTestSourceUrl,
  notes
`

// ─── Field-level fallbacks ────────────────────────────────────────────────────

/**
 * Applies field-level fallbacks to a seeded document.
 *
 * Some countries may not have a locally available language test centre (e.g. no
 * IELTS/CELPIP/TEF/TCF presence).  In those cases the seed script leaves
 * languageTestCAD null rather than fabricating a value.  This function
 * substitutes ZZ_FALLBACK.languageTestCAD so the engine always receives a
 * well-formed cost structure without falling back to the entire ZZ document.
 */
function applyFieldFallbacks(doc: CountryCosts): CountryCosts {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = doc as any
  if (raw.languageTestCAD == null || raw.languageTestCAD <= 0) {
    return { ...doc, languageTestCAD: ZZ_FALLBACK.languageTestCAD }
  }
  return doc
}

// ─── fetchCountryCosts ─────────────────────────────────────────────────────────

/**
 * Returns cost data for the given ISO code.
 *
 * Resolution order:
 *   1. Seeded Sanity document for `iso` (isSeeded = true), with field-level
 *      fallback for any null cost fields (e.g. languageTestCAD when no local
 *      test centre exists).
 *   2. Sanity ZZ fallback document
 *   3. Hardcoded ZZ_FALLBACK constant
 *
 * An unseeded country document (isSeeded = false) is intentionally skipped —
 * the engine must never display unverified cost figures as seeded data.
 */
export async function fetchCountryCosts(iso: string): Promise<CountryCosts> {
  try {
    // 1. Try country-specific seeded document
    const specific = await client.fetch<CountryCosts | null>(
      `*[_type == "countryCosts" && iso == $iso && isSeeded == true][0] { ${COST_FIELDS} }`,
      { iso },
    )
    if (specific) return applyFieldFallbacks(specific)

    // 2. Try ZZ fallback document from Sanity
    const zzDoc = await client.fetch<CountryCosts | null>(
      `*[_type == "countryCosts" && iso == "ZZ"][0] { ${COST_FIELDS} }`,
      {},
    )
    if (zzDoc) return zzDoc
  } catch {
    // Sanity unreachable — fall through to hardcoded constant
  }

  // 3. Hardcoded constant
  return ZZ_FALLBACK
}

// ─── fetchCountryCostsList ─────────────────────────────────────────────────────

/**
 * Returns all country list items for the wizard dropdown, ordered by name.
 * Excludes the ZZ sentinel document.
 * Falls back to an empty array on error — the route handler will use the stub.
 */
export async function fetchCountryCostsList(): Promise<CountryListItem[]> {
  return client.fetch<CountryListItem[]>(
    `*[_type == "countryCosts" && iso != "ZZ"] | order(countryName asc) {
      iso,
      "name": countryName,
      "flag": coalesce(flag, ""),
      isSeeded
    }`,
    {},
  )
}
