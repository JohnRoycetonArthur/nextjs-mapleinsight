/**
 * GET /api/countries — US-3.1 / US-3.2
 *
 * Returns the list of supported countries for the CountrySearch dropdown.
 * Stub implementation until Prompt 12 (full CountryCosts Sanity seed) is merged.
 * At that point, replace COUNTRIES_STUB with a Sanity GROQ fetch.
 */

import { COUNTRIES_STUB } from '@/lib/settlement-engine/countries-stub'

export const dynamic = 'force-static'

export function GET() {
  return Response.json(COUNTRIES_STUB)
}
