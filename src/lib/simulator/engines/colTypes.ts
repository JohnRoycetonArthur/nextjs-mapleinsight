// Types scoped to the Cost-of-Living & Affordability engine (US-9.5).

export type LifestyleTier    = 'frugal' | 'moderate' | 'comfortable';
export type AffordabilityFlag = 'affordable' | 'at_risk' | 'unaffordable';
export type RentSource       = 'cmhc_benchmark' | 'mbm_shelter_fallback';
export type COLConfidenceTier = 'High' | 'Medium' | 'Low';

export type COLConfidenceSignal =
  | 'rent_cmhc_available'       // CMHC rent benchmark found for this CMA + bedroom count
  | 'rent_mbm_shelter_fallback' // no CMHC data; using estimated MBM shelter share
  | 'mbm_region_match';         // MBM regional threshold found (always fires when data exists)

/** Confidence assessment for CoL estimates (AC-8). */
export interface COLConfidence {
  score:   number;             // 0–1, rounded to 2dp
  tier:    COLConfidenceTier;  // High / Medium / Low
  signals: COLConfidenceSignal[];
}

/** Shape of one entry in mbm_thresholds.json → data. */
export interface MBMThresholdEntry {
  mbm_region:   string;
  display_name: string;
  province_code: string;
  thresholds: {
    persons_1: number; persons_2: number; persons_3: number;
    persons_4: number; persons_5: number; persons_6: number;
    persons_7: number;
  };
  ref_year: number;
}

/** Shape of one rent entry inside rent_benchmarks.json → data[].rents. */
export interface RentEntry {
  bedrooms:        number;
  bedroom_label:   string;
  average_monthly: number;
  median_monthly:  number;
}

/** Shape of one entry in rent_benchmarks.json → data. */
export interface RentBenchmarkEntry {
  cma_code:     string;
  city_name:    string;
  province_code: string;
  survey_year:  number;
  source:       string;
  rents:        RentEntry[];
}

/** Returned by lookupMBM(). */
export interface MBMLookupResult {
  annual_threshold:  number;
  monthly_threshold: number;
  mbm_region:        string;
  family_size_used:  number; // clamped 1–7
  found:             boolean;
}

/** Returned by lookupRent() when CMHC data is available, null otherwise. */
export interface RentLookupResult {
  average_monthly: number;
  cma_code:        string;
  bedrooms:        number;
  source:          string;
  survey_year:     number;
}

/** Input to estimateCostOfLiving(). */
export interface COLInput {
  mbm_region:           string;  // from city record (e.g. "toronto")
  cma_code:             string;  // from city record (e.g. "535")
  family_size:          number;  // total persons in household, 1–7+
  bedrooms:             number;  // 0=bachelor, 1, 2, 3=3+
  lifestyle?:           LifestyleTier; // default 'moderate'
  monthly_take_home:    number;  // from tax engine → used for surplus/deficit
  gross_monthly_income: number;  // gross_annual / 12  → used for shelter ratio
}

/** Full output of estimateCostOfLiving() (AC-1 through AC-8). */
export interface CostEstimate {
  // AC-1 — core figures
  baseline_mbm_monthly:   number; // full MBM threshold / 12
  rent_benchmark_monthly: number; // CMHC average or MBM shelter-share fallback
  non_shelter_monthly:    number; // MBM non-shelter portion × lifestyle multiplier
  estimated_total_monthly: number; // non_shelter + rent

  // AC-5 — affordability
  shelter_cost_to_income_ratio: number;        // rent / gross_monthly_income (0–1)
  housing_affordability_flag:   AffordabilityFlag;

  // AC-6 — lifestyle
  lifestyle:            LifestyleTier;
  lifestyle_multiplier: number;

  // AC-7 — surplus / deficit
  monthly_surplus: number; // monthly_take_home − estimated_total_monthly (can be negative)

  // AC-8 — confidence
  confidence:  COLConfidence;
  rent_source: RentSource;

  // Provenance
  mbm_region:  string;
  cma_code:    string;
  family_size: number;
  bedrooms:    number;
}
