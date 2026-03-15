/**
 * Salary Estimation Engine — US-9.3
 *
 * estimateSalary() is a pure function: deterministic, no side effects (AC-7).
 * Data is injected via the wageFacts parameter so the function is fully
 * testable without touching the filesystem.
 *
 * For production use, pass the data from src/data/simulator/wage_facts.json.
 */

import type {
  SalaryInput,
  SalaryEstimate,
  WageFact,
  FallbackTier,
  ConfidenceSignalKey,
  DataSource,
} from './salaryTypes';
import { createWageLookup } from '../data/wageLookup';
import { mapExperienceToLevel, getPointHourly } from './levelMapper';
import { computeConfidence } from './confidence';

// ── Internal helpers ─────────────────────────────────────────────────────────

const WEEKS_PER_YEAR = 52;

/** Check whether a ref_period string represents data older than 18 months. */
function isDataStale(refPeriod: string): boolean {
  const refYear = parseInt(refPeriod, 10);
  if (isNaN(refYear)) return false;
  const refDate  = new Date(refYear, 11, 31); // end of ref year
  const cutoff   = new Date();
  cutoff.setMonth(cutoff.getMonth() - 18);
  return refDate < cutoff;
}

/** hourly × hours_per_week × 52, rounded to nearest dollar. */
function toAnnual(hourly: number, hoursPerWeek: number): number {
  return Math.round(hourly * hoursPerWeek * WEEKS_PER_YEAR);
}

/** Zero-value estimate returned when no wage data is found. */
function buildNoDataEstimate(
  input: SalaryInput,
  signals: ConfidenceSignalKey[],
): SalaryEstimate {
  const level = mapExperienceToLevel(input.years_experience);
  return {
    noc_code:         input.noc_code,
    city_id:          input.city_id,
    province_code:    input.province_code,
    low_hourly:       0,
    median_hourly:    0,
    high_hourly:      0,
    annual_low:       0,
    annual_mid:       0,
    annual_high:      0,
    experience_level: level,
    point_hourly:     0,
    point_annual:     0,
    fallback_tier:    'none',
    fallback_reason:  `No wage data found for NOC ${input.noc_code} at city, province, or national level.`,
    confidence:       computeConfidence(signals),
    data_sources:     [],
  };
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Estimates annual salary for a given occupation and location.
 *
 * @param input      The user's selection (NOC code, city, province, experience, hours).
 * @param wageFacts  Array of WageFact records (inject from wage_facts.json in production).
 * @returns          Full SalaryEstimate including range, point estimate, confidence, and sources.
 */
export function estimateSalary(
  input: SalaryInput,
  wageFacts: WageFact[],
): SalaryEstimate {
  const lookup  = createWageLookup(wageFacts);
  const signals: ConfidenceSignalKey[] = [];

  // ── 1. Geographic fallback chain (AC-3) ───────────────────────────────────

  let fact: WageFact | null = null;
  let fallbackTier: FallbackTier = 'none';
  let fallbackReason = '';

  // Tier 1: city-level  (geo_key = city_id, e.g. "toronto-on")
  fact = lookup(input.noc_code, input.city_id);
  if (fact) {
    fallbackTier    = 'city';
    fallbackReason  = `City-level data found for "${input.city_id}".`;
    signals.push('city_level_match');
  }

  // Tier 2: province-level  (geo_key = province_code, e.g. "ON")
  if (!fact) {
    fact = lookup(input.noc_code, input.province_code);
    if (fact) {
      fallbackTier   = 'province';
      fallbackReason = `No city-level data; using ${input.province_code} provincial average.`;
      signals.push('province_fallback');
    }
  }

  // Tier 3: national-level
  if (!fact) {
    fact = lookup(input.noc_code, 'national');
    if (fact) {
      fallbackTier   = 'national';
      fallbackReason = `No city or provincial data; using national average.`;
      signals.push('national_fallback');
    }
  }

  // No data at all
  if (!fact) {
    signals.push('no_data_found');
    return buildNoDataEstimate(input, signals);
  }

  // ── 2. Data staleness check ───────────────────────────────────────────────

  if (isDataStale(fact.ref_period)) {
    signals.push('data_over_18_months_old');
  }

  // ── 3. Experience level mapping (AC-2) ────────────────────────────────────

  const level = mapExperienceToLevel(input.years_experience);
  if (level === 'executive') {
    signals.push('executive_multiplier_applied');
  }

  // ── 4. Hourly → annual conversion (AC-4) ─────────────────────────────────

  const annual_low  = toAnnual(fact.low_hourly,    input.hours_per_week);
  const annual_mid  = toAnnual(fact.median_hourly, input.hours_per_week);
  const annual_high = toAnnual(fact.high_hourly,   input.hours_per_week);

  // Point estimate: experience-adjusted hourly wage
  const point_hourly = getPointHourly(fact, level);
  const point_annual = toAnnual(point_hourly, input.hours_per_week);

  // ── 5. Confidence (AC-5) ──────────────────────────────────────────────────

  const confidence = computeConfidence(signals);

  // ── 6. Data sources (AC-6) ────────────────────────────────────────────────

  const data_sources: DataSource[] = [
    { source: fact.source, ref_period: fact.ref_period, geo_key: fact.geo_key },
  ];

  // ── 7. Assemble result ────────────────────────────────────────────────────

  return {
    noc_code:         input.noc_code,
    city_id:          input.city_id,
    province_code:    input.province_code,
    low_hourly:       fact.low_hourly,
    median_hourly:    fact.median_hourly,
    high_hourly:      fact.high_hourly,
    annual_low,
    annual_mid,
    annual_high,
    experience_level: level,
    point_hourly,
    point_annual,
    fallback_tier:    fallbackTier,
    fallback_reason:  fallbackReason,
    confidence,
    data_sources,
  };
}
