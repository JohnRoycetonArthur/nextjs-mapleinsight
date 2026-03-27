import { createClient } from '@sanity/client'
import { apiVersion, dataset, projectId } from '@/sanity/env'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CityBaseline {
  cityName: string
  province: string
  avgRent1BR: number
  avgRent2BR: number
  avgRentStudio: number
  monthlyTransitPass: number
  source: string
  effectiveDate: string   // ISO date string, e.g. "2025-10-01"
  dataVersion: string     // e.g. "2025-10"
  isFallback: boolean     // true when national-average fallback was used
  studentHousing?: {
    sharedRoom: number
    onCampus: number
    homestay: number
  }
}

// ─── Fallback national averages ───────────────────────────────────────────────
// Used when no Sanity document exists for the requested city.
// Values are conservative estimates for affordability modelling.

const NATIONAL_FALLBACK: Omit<CityBaseline, 'cityName' | 'province'> = {
  avgRent1BR:        1600,
  avgRent2BR:        1900,
  avgRentStudio:     1300,
  monthlyTransitPass: 130,
  source:            'National average (fallback — no city-specific data available)',
  effectiveDate:     '2025-10-01',
  dataVersion:       'fallback',
  isFallback:        true,
}

// ─── Sanity client (CDN-enabled for public, uncached reads) ───────────────────

const publicClient = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: true,
})

// ─── In-memory session cache ──────────────────────────────────────────────────
// Keyed by normalised city name. Cleared on module reload (i.e. per server
// request in Next.js server components / route handlers, but reused within
// a single wizard session when called client-side via API).

const cache = new Map<string, CityBaseline>()

function normalise(city: string): string {
  return city.trim().toLowerCase()
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * Fetch city baseline data from Sanity.
 *
 * Returns cached data if the city has already been fetched this session.
 * Falls back to conservative national averages if no Sanity document is found,
 * and sets `isFallback: true` so callers can surface a warning.
 */
export async function fetchCityBaseline(city: string): Promise<CityBaseline> {
  const key = normalise(city)

  if (cache.has(key)) {
    return cache.get(key)!
  }

  let baseline: CityBaseline

  try {
    const result = await publicClient.fetch<{
      cityName: string
      province: string
      avgRent1BR: number
      avgRent2BR: number
      avgRentStudio: number
      monthlyTransitPass: number
      source: string
      effectiveDate: string
      dataVersion: string | null
      studentHousing: { sharedRoom: number; onCampus: number; homestay: number } | null
    } | null>(
      `*[_type == "cityBaseline" && lower(cityName) == lower($city)][0] {
        cityName,
        province,
        avgRent1BR,
        avgRent2BR,
        avgRentStudio,
        monthlyTransitPass,
        source,
        effectiveDate,
        dataVersion,
        studentHousing
      }`,
      { city },
    )

    if (result) {
      baseline = {
        cityName:           result.cityName,
        province:           result.province,
        avgRent1BR:         result.avgRent1BR,
        avgRent2BR:         result.avgRent2BR,
        avgRentStudio:      result.avgRentStudio,
        monthlyTransitPass: result.monthlyTransitPass,
        source:             result.source,
        effectiveDate:      result.effectiveDate,
        dataVersion:        result.dataVersion ?? result.effectiveDate.slice(0, 7),
        isFallback:         false,
        studentHousing:     result.studentHousing ?? undefined,
      }
    } else {
      // No document found — use national-average fallback
      baseline = {
        cityName: city,
        province: 'CA',
        ...NATIONAL_FALLBACK,
      }
    }
  } catch {
    // Network / Sanity error — use fallback rather than crashing the engine
    baseline = {
      cityName: city,
      province: 'CA',
      ...NATIONAL_FALLBACK,
    }
  }

  cache.set(key, baseline)
  return baseline
}

/**
 * Clear the in-memory baseline cache.
 * Call this between wizard sessions if running in a long-lived process.
 */
export function clearBaselineCache(): void {
  cache.clear()
}

// ─── dataVersion helper ───────────────────────────────────────────────────────

/**
 * Construct a composite dataVersion string from multiple baseline sources.
 * Concatenates the effectiveDates of each source for reproducibility.
 *
 * Example: buildDataVersion(cityBaseline, irccBaseline)
 *   → "cmhc:2025-10|ircc:2024-11"
 */
export function buildDataVersion(
  sources: Array<{ label: string; effectiveDate: string }>,
): string {
  return sources.map(({ label, effectiveDate }) => `${label}:${effectiveDate}`).join('|')
}
