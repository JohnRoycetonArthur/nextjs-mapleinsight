/**
 * CCB Estimator Engine — US-9.8
 *
 * calculateCCB() is a pure function: deterministic, no side effects.
 * All parameters are injected so the function is fully testable
 * without touching the filesystem.
 *
 * For production use, pass data from src/data/simulator/ccb_params.json.
 */

import type { CCBInput, CCBEstimate, CCBParams, CCBPhaseRates } from './ccbTypes';

// ── Constants ─────────────────────────────────────────────────────────────────

export const CCB_DISCLAIMER =
  'This is an estimate based on published CRA rules. ' +
  'Your actual CCB may differ based on your complete tax return.';

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Selects the correct phase-out rates for the total number of eligible children. */
function selectPhaseRates(totalChildren: number, params: CCBParams): CCBPhaseRates {
  if (totalChildren <= 1) return params.phase_rates.children_1;
  if (totalChildren === 2) return params.phase_rates.children_2;
  if (totalChildren === 3) return params.phase_rates.children_3;
  return params.phase_rates.children_4plus;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Estimates annual and monthly Canada Child Benefit for a household.
 *
 * @param input   Children (with ages) and adjusted family net income.
 * @param params  CRA benefit parameters (from ccb_params.json → data).
 */
export function calculateCCB(input: CCBInput, params: CCBParams): CCBEstimate {
  const under6    = input.children.filter((c) => c.age >= 0 && c.age < 6).length;
  const age6to17  = input.children.filter((c) => c.age >= 6 && c.age <= 17).length;
  const totalKids = under6 + age6to17;
  const afni      = input.adjusted_family_net_income;

  // AC-7: no children → not applicable
  if (totalKids === 0) {
    return {
      under_6_count: 0, age_6to17_count: 0, total_children: 0,
      max_annual: 0, reduction: 0, annual_estimate: 0, monthly_estimate: 0,
      afni, applicable: false, disclaimer: CCB_DISCLAIMER,
    };
  }

  // AC-4: age-based maximum amounts
  const maxAnnual =
    under6   * params.max_per_child_under_6 +
    age6to17 * params.max_per_child_6_to_17;

  // AC-3: CRA two-phase reduction
  const { r1, r2, base2 } = selectPhaseRates(totalKids, params);

  let reduction = 0;
  if (afni > params.threshold_2) {
    // Phase 2: base accumulated reduction + incremental rate above threshold_2
    reduction = base2 + (afni - params.threshold_2) * r2;
  } else if (afni > params.threshold_1) {
    // Phase 1: marginal rate between threshold_1 and threshold_2
    reduction = (afni - params.threshold_1) * r1;
  }
  // Below threshold_1: no reduction (full amount)

  const annualEstimate  = Math.max(0, maxAnnual - reduction);
  const monthlyEstimate = Math.floor(annualEstimate / 12);

  return {
    under_6_count:    under6,
    age_6to17_count:  age6to17,
    total_children:   totalKids,
    max_annual:       Math.round(maxAnnual * 100) / 100,
    reduction:        Math.round(reduction * 100) / 100,
    annual_estimate:  Math.round(annualEstimate * 100) / 100,
    monthly_estimate: monthlyEstimate,
    afni,
    applicable:       true,
    disclaimer:       CCB_DISCLAIMER,
  };
}
