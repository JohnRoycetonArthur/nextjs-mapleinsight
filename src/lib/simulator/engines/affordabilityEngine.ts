import type { AffordabilityFlag } from './colTypes';

/**
 * Computes the shelter-cost-to-income ratio and affordability flag (AC-5).
 *
 * Uses the gross monthly income as the denominator — consistent with CMHC's
 * 30% affordability benchmark, which is defined relative to gross income.
 *
 * Flag thresholds:
 *   < 30%  → affordable
 *   30–50% → at_risk
 *   > 50%  → unaffordable
 *
 * Pure function — no side effects.
 */
export function calculateAffordability(
  rentMonthly:        number,
  grossMonthlyIncome: number,
): { shelter_cost_to_income_ratio: number; housing_affordability_flag: AffordabilityFlag } {
  if (grossMonthlyIncome <= 0) {
    return {
      shelter_cost_to_income_ratio: 1,
      housing_affordability_flag:  'unaffordable',
    };
  }

  const ratio = Math.min(1, rentMonthly / grossMonthlyIncome);
  const rounded = Math.round(ratio * 10000) / 10000; // 4dp precision

  const flag: AffordabilityFlag =
    ratio < 0.30 ? 'affordable'
    : ratio <= 0.50 ? 'at_risk'
    : 'unaffordable';

  return { shelter_cost_to_income_ratio: rounded, housing_affordability_flag: flag };
}
