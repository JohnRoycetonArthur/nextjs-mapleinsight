import type { ConfidenceSignalKey, ConfidenceResult, ConfidenceTier } from './salaryTypes';

/**
 * Base score for each geo-match signal, and delta for penalty signals.
 *
 * Only one geo-match signal fires per estimateSalary() call.
 * Penalty signals stack independently.
 */
const SIGNAL_SCORES: Record<ConfidenceSignalKey, number> = {
  city_level_match:             0.90,  // ideal: city-specific data
  province_fallback:            0.65,  // good: provincial average
  national_fallback:            0.35,  // acceptable: country-wide
  no_data_found:                0.00,  // no data at all
  data_over_18_months_old:     -0.10,  // penalty: stale data
  executive_multiplier_applied: -0.05, // penalty: estimated extrapolation
};

/**
 * Computes a 0–1 confidence score and tier from a list of fired signals (AC-5).
 *
 * Score boundaries:
 *   ≥ 0.70 → High
 *   ≥ 0.40 → Medium
 *   <  0.40 → Low
 */
export function computeConfidence(signals: ConfidenceSignalKey[]): ConfidenceResult {
  let score = 0;
  for (const sig of signals) {
    score += SIGNAL_SCORES[sig] ?? 0;
  }

  // Clamp to [0, 1] and round to 2 decimal places
  score = Math.round(Math.max(0, Math.min(1, score)) * 100) / 100;

  const tier: ConfidenceTier =
    score >= 0.70 ? 'High'
    : score >= 0.40 ? 'Medium'
    : 'Low';

  return { score, tier, signals };
}
