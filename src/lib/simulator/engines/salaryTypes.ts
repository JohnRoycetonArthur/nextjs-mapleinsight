// Types scoped to the salary estimation engine (US-9.3).
// These are separate from the UI-level types in src/types/simulator.ts.

/** Experience tier derived from years_experience. */
export type ExperienceLevel = 'entry' | 'intermediate' | 'senior' | 'executive';

/** Which wage percentile column is used as the point estimate. */
export type WagePercentile = 'low' | 'median' | 'high';

/** Which level in the geographic fallback chain supplied the data. */
export type FallbackTier = 'city' | 'province' | 'national' | 'none';

/** Confidence tiers matching AC-5. */
export type ConfidenceTier = 'High' | 'Medium' | 'Low';

/**
 * Signals that influence the confidence score.
 * Exactly one geo-match signal is emitted per call; penalty signals stack.
 */
export type ConfidenceSignalKey =
  | 'city_level_match'          // geo_key === city_id — ideal
  | 'province_fallback'         // geo_key === province_code
  | 'national_fallback'         // geo_key === "national"
  | 'no_data_found'             // nothing in the data set
  | 'data_over_18_months_old'   // ref_period is stale
  | 'executive_multiplier_applied'; // 1.15× applied to high percentile

/** Subset of WageFact needed by the engine (matches wage_facts.json shape). */
export interface WageFact {
  noc_code:      string;
  geo_key:       string;
  low_hourly:    number;
  median_hourly: number;
  high_hourly:   number;
  source:        string;
  ref_period:    string; // e.g. "2023"
}

/** Input to estimateSalary(). */
export interface SalaryInput {
  noc_code:         string; // 5-digit NOC code
  city_id:          string; // e.g. "toronto-on" — checked first in fallback chain
  province_code:    string; // e.g. "ON"
  years_experience: number; // 0–30
  hours_per_week:   number; // e.g. 40
}

/** Identifies where the wage data came from. */
export interface DataSource {
  source:     string; // e.g. "Job Bank Canada"
  ref_period: string; // e.g. "2023"
  geo_key:    string; // e.g. "ON"
}

/** Confidence quality assessment (AC-5). */
export interface ConfidenceResult {
  score:   number;                // 0–1, rounded to 2dp
  tier:    ConfidenceTier;        // High / Medium / Low
  signals: ConfidenceSignalKey[]; // all signals that fired
}

/** Full output of estimateSalary() (AC-1 through AC-7). */
export interface SalaryEstimate {
  // Identity
  noc_code:      string;
  city_id:       string;
  province_code: string;

  // Wage range (hourly)
  low_hourly:    number;
  median_hourly: number;
  high_hourly:   number;

  // Annual gross range  (AC-4: hourly × hours_per_week × 52)
  annual_low:  number;
  annual_mid:  number;
  annual_high: number;

  // Experience-adjusted point estimate (AC-2)
  experience_level: ExperienceLevel;
  point_hourly:     number;
  point_annual:     number;

  // Fallback info (AC-3)
  fallback_tier:   FallbackTier;
  fallback_reason: string;

  // Quality (AC-5)
  confidence: ConfidenceResult;

  // Provenance (AC-6)
  data_sources: DataSource[];
}
