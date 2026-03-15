import type { ExperienceLevel, WagePercentile, WageFact } from './salaryTypes';

/** Multiplier applied to the high-percentile wage for executive-level earners. */
export const EXECUTIVE_MULTIPLIER = 1.15;

/**
 * Maps years of experience to an experience tier (AC-2).
 *
 * Entry        0–2  yrs → low percentile
 * Intermediate 3–6  yrs → median percentile
 * Senior       7–12 yrs → high percentile
 * Executive    13+  yrs → high × 1.15 (with confidence flag)
 */
export function mapExperienceToLevel(years: number): ExperienceLevel {
  if (years <= 2)  return 'entry';
  if (years <= 6)  return 'intermediate';
  if (years <= 12) return 'senior';
  return 'executive';
}

/** Maps an experience level to the corresponding wage percentile column. */
export function mapLevelToPercentile(level: ExperienceLevel): WagePercentile {
  if (level === 'entry')        return 'low';
  if (level === 'intermediate') return 'median';
  return 'high'; // senior and executive both start from the high percentile
}

/**
 * Returns the point estimate hourly wage for a given experience level.
 * Executive applies EXECUTIVE_MULTIPLIER on top of the high percentile.
 */
export function getPointHourly(fact: WageFact, level: ExperienceLevel): number {
  const base =
    level === 'entry'        ? fact.low_hourly
    : level === 'intermediate' ? fact.median_hourly
    : fact.high_hourly; // senior + executive

  return level === 'executive'
    ? Math.round(base * EXECUTIVE_MULTIPLIER * 100) / 100
    : base;
}
