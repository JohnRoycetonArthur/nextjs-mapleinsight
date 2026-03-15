// Types scoped to the CCB Estimator engine (US-9.8).

/** One child record supplied to the CCB engine. */
export interface CCBChild {
  age: number; // 0–17
}

/** Input to calculateCCB(). */
export interface CCBInput {
  children:                   CCBChild[];
  adjusted_family_net_income: number; // AFNI from tax engine
}

/** Phase-out rates for a given number of children (from ccb_params.json). */
export interface CCBPhaseRates {
  r1:    number; // phase-1 marginal reduction rate (between threshold_1 and threshold_2)
  r2:    number; // phase-2 incremental reduction rate (above threshold_2)
  base2: number; // accumulated phase-1 reduction at threshold_2 — used as offset in phase 2
}

/** Shape of ccb_params.json → data. */
export interface CCBParams {
  benefit_year:             string;
  max_per_child_under_6:    number;
  max_per_child_6_to_17:    number;
  threshold_1:              number;
  threshold_2:              number;
  phase_rates: {
    children_1:     CCBPhaseRates;
    children_2:     CCBPhaseRates;
    children_3:     CCBPhaseRates;
    children_4plus: CCBPhaseRates;
  };
}

/** Full output of calculateCCB() (AC-1 through AC-6). */
export interface CCBEstimate {
  // Age breakdown
  under_6_count:   number;
  age_6to17_count: number;
  total_children:  number;

  // Amounts (AC-2 through AC-4)
  max_annual:       number; // maximum before any reduction
  reduction:        number; // total reduction applied
  annual_estimate:  number; // net annual CCB
  monthly_estimate: number; // floor(annual / 12) — whole dollars

  // Context
  afni:       number;
  applicable: boolean; // false when total_children === 0 (AC-7)

  // AC-6
  disclaimer: string;
}
