/**
 * Cost-of-Living & Affordability Engine — US-9.5
 *
 * estimateCostOfLiving() is a pure function: deterministic, no side effects.
 * All data is injected via parameters so the function is fully testable
 * without touching the filesystem.
 *
 * For production use, pass data from:
 *   src/data/simulator/mbm_thresholds.json  → mbmData
 *   src/data/simulator/rent_benchmarks.json → rentData
 */

import type {
  COLInput,
  CostEstimate,
  COLConfidence,
  COLConfidenceSignal,
  LifestyleTier,
  MBMThresholdEntry,
  RentBenchmarkEntry,
} from './colTypes';
import { lookupMBM }  from '../data/mbmLookup';
import { lookupRent } from '../data/rentLookup';
import { calculateAffordability } from './affordabilityEngine';

// ── Constants ─────────────────────────────────────────────────────────────────

/**
 * Approximate share of MBM total that represents shelter costs.
 * Based on Statistics Canada MBM component breakdown (2022 base).
 * Used only when CMHC rent data is unavailable (AC-3 fallback).
 */
const MBM_SHELTER_SHARE = 0.38;

/** Lifestyle multiplier table (AC-6). Applied to non-shelter MBM components only. */
const LIFESTYLE_MULTIPLIERS: Record<LifestyleTier, number> = {
  frugal:     0.85,
  moderate:   1.00,
  comfortable: 1.20,
};

/** Confidence scores for CoL signals (AC-8). */
const COL_SIGNAL_SCORES: Record<COLConfidenceSignal, number> = {
  rent_cmhc_available:       0.55, // CMHC data present — boosts total to High
  rent_mbm_shelter_fallback: 0.10, // estimated from MBM share — stays Medium
  mbm_region_match:          0.35, // MBM data found (adds to any rent signal)
};

// ── Internal helpers ──────────────────────────────────────────────────────────

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function computeCOLConfidence(signals: COLConfidenceSignal[]): COLConfidence {
  let score = 0;
  for (const sig of signals) {
    score += COL_SIGNAL_SCORES[sig] ?? 0;
  }
  score = Math.round(Math.max(0, Math.min(1, score)) * 100) / 100;

  const tier =
    score >= 0.70 ? 'High'
    : score >= 0.40 ? 'Medium'
    : 'Low';

  return { score, tier, signals };
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Estimates monthly living costs and affordability for a given city, family
 * size, bedroom preference, and lifestyle tier (AC-1 through AC-8).
 *
 * @param input     COL input (mbm_region, cma_code, family_size, bedrooms, …).
 * @param mbmData   Array of MBMThresholdEntry records (inject from mbm_thresholds.json).
 * @param rentData  Array of RentBenchmarkEntry records (inject from rent_benchmarks.json).
 */
export function estimateCostOfLiving(
  input:    COLInput,
  mbmData:  MBMThresholdEntry[],
  rentData: RentBenchmarkEntry[],
): CostEstimate {
  const lifestyle          = input.lifestyle ?? 'moderate';
  const lifestyleMultiplier = LIFESTYLE_MULTIPLIERS[lifestyle];
  const signals: COLConfidenceSignal[] = [];

  // ── 1. MBM baseline (AC-2) ────────────────────────────────────────────────

  const mbm = lookupMBM(input.mbm_region, input.family_size, mbmData);
  const baseline_mbm_monthly = mbm.monthly_threshold;

  if (mbm.found) {
    signals.push('mbm_region_match');
  }

  // ── 2. Rent benchmark (AC-3) ──────────────────────────────────────────────

  const rentResult = lookupRent(input.cma_code, input.bedrooms, rentData);

  let rent_benchmark_monthly: number;
  let rentSource: CostEstimate['rent_source'];

  if (rentResult) {
    rent_benchmark_monthly = rentResult.average_monthly;
    rentSource = 'cmhc_benchmark';
    signals.push('rent_cmhc_available');
  } else {
    // Fallback: use MBM shelter share (AC-3)
    rent_benchmark_monthly = round2(baseline_mbm_monthly * MBM_SHELTER_SHARE);
    rentSource = 'mbm_shelter_fallback';
    signals.push('rent_mbm_shelter_fallback');
  }

  // ── 3. Estimated total (AC-4) ─────────────────────────────────────────────
  // Non-shelter = MBM × (1 − SHELTER_SHARE), then apply lifestyle multiplier.
  // Rent is kept at face value (lifestyle multiplier only adjusts discretionary spend).

  const non_shelter_monthly    = round2(baseline_mbm_monthly * (1 - MBM_SHELTER_SHARE) * lifestyleMultiplier);
  const estimated_total_monthly = round2(non_shelter_monthly + rent_benchmark_monthly);

  // ── 4. Affordability (AC-5) ───────────────────────────────────────────────

  const { shelter_cost_to_income_ratio, housing_affordability_flag } =
    calculateAffordability(rent_benchmark_monthly, input.gross_monthly_income);

  // ── 5. Monthly surplus / deficit (AC-7) ───────────────────────────────────

  const monthly_surplus = round2(input.monthly_take_home - estimated_total_monthly);

  // ── 6. Confidence (AC-8) ──────────────────────────────────────────────────

  const confidence = computeCOLConfidence(signals);

  // ── 7. Assemble result ────────────────────────────────────────────────────

  return {
    baseline_mbm_monthly,
    rent_benchmark_monthly,
    non_shelter_monthly,
    estimated_total_monthly,
    shelter_cost_to_income_ratio,
    housing_affordability_flag,
    lifestyle,
    lifestyle_multiplier: lifestyleMultiplier,
    monthly_surplus,
    confidence,
    rent_source: rentSource,
    mbm_region:  input.mbm_region,
    cma_code:    input.cma_code,
    family_size: input.family_size,
    bedrooms:    input.bedrooms,
  };
}
