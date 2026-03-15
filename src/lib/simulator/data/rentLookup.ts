import type { RentBenchmarkEntry, RentLookupResult } from '../engines/colTypes';

/** Maps UI bedroom option values to the bedroom integer used in rent_benchmarks.json. */
const MAX_BEDROOM_CODE = 3; // "3+ Bedroom" is stored as 3

/**
 * Looks up the CMHC average monthly rent for a given CMA and bedroom count (AC-3).
 *
 * `bedrooms` uses the same encoding as rent_benchmarks.json:
 *   0 = Bachelor, 1 = 1 Bedroom, 2 = 2 Bedroom, 3 = 3+ Bedroom
 *
 * Returns null when no data is found — the caller should fall back to the
 * MBM shelter share estimate.
 *
 * Data is injected so the function is pure and testable.
 */
export function lookupRent(
  cmaCode:  string,
  bedrooms: number,
  rentData: RentBenchmarkEntry[],
): RentLookupResult | null {
  const cma = rentData.find(r => r.cma_code === cmaCode);
  if (!cma) return null;

  const bedroomCode = Math.min(Math.max(0, bedrooms), MAX_BEDROOM_CODE);
  const entry = cma.rents.find(r => r.bedrooms === bedroomCode);
  if (!entry) return null;

  return {
    average_monthly: entry.average_monthly,
    cma_code:        cmaCode,
    bedrooms:        bedroomCode,
    source:          cma.source,
    survey_year:     cma.survey_year,
  };
}
