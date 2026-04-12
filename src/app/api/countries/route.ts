/**
 * GET /api/countries — US-3.1 / US-3.2
 *
 * Returns the list of supported countries for the CountrySearch dropdown.
 * Fetches from Sanity countryCosts collection (US-3.2); falls back to
 * COUNTRIES_STUB if Sanity returns zero results or throws (e.g. during build).
 */

import { fetchCountryCostsList } from '@/lib/settlement-engine/fetchCountryCosts'
import { COUNTRIES_STUB } from '@/lib/settlement-engine/countries-stub'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const list = await fetchCountryCostsList()
    if (list.length > 0) {
      return Response.json(list)
    }
  } catch {
    // fall through to stub
  }
  return Response.json(COUNTRIES_STUB)
}
