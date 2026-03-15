import type { MBMThresholdEntry, MBMLookupResult } from '../engines/colTypes';

/** Maximum family size tracked in the JSON thresholds. */
const MAX_FAMILY_SIZE = 7;

/**
 * Looks up the MBM (Market Basket Measure) annual threshold for a given
 * MBM region and family size (AC-2).
 *
 * Family size is clamped to [1, 7] — persons_7 covers all households of 7+.
 * Data is injected so the function is pure and testable (AC-8 pattern).
 */
export function lookupMBM(
  mbmRegion:  string,
  familySize: number,
  mbmData:    MBMThresholdEntry[],
): MBMLookupResult {
  const region = mbmData.find(r => r.mbm_region === mbmRegion);

  if (!region) {
    return {
      annual_threshold:  0,
      monthly_threshold: 0,
      mbm_region:        mbmRegion,
      family_size_used:  Math.min(Math.max(1, familySize), MAX_FAMILY_SIZE),
      found:             false,
    };
  }

  const sizeKey = `persons_${Math.min(Math.max(1, familySize), MAX_FAMILY_SIZE)}` as keyof typeof region.thresholds;
  const annual = region.thresholds[sizeKey] ?? 0;

  return {
    annual_threshold:  annual,
    monthly_threshold: Math.round(annual / 12),
    mbm_region:        mbmRegion,
    family_size_used:  Math.min(Math.max(1, familySize), MAX_FAMILY_SIZE),
    found:             true,
  };
}
