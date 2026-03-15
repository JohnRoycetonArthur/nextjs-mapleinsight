// Simulator types for US-9.1 — Simulator Data Foundation
// Covers data layer interfaces and simulation I/O contracts.

// ---------------------------------------------------------------------------
// Data-layer interfaces (map 1:1 to JSON files in src/data/simulator/)
// ---------------------------------------------------------------------------

export interface Occupation {
  noc_code: string;       // 5-digit NOC 2021 string, e.g. "21231"
  title: string;          // Official NOC title
  synonyms: string[];     // Searchable alternate names / keywords
  teer_level: 0 | 1 | 2 | 3 | 4 | 5;
  sector: string;         // Broad sector label for grouping (e.g. "IT", "Healthcare")
}

export interface City {
  city_id: string;        // Slug, e.g. "toronto-on"
  name: string;           // Display name, e.g. "Toronto"
  province_code: string;  // 2-letter province/territory, e.g. "ON"
  cma_code: string;       // Statistics Canada CMA code, e.g. "535"
  mbm_region: string;     // MBM region key used in mbm_thresholds.json
  latitude: number;
  longitude: number;
}

export interface WageFact {
  noc_code: string;       // 5-digit NOC code
  geo_key: string;        // Province code (e.g. "ON") or "national"
  low_hourly: number;     // 10th-percentile hourly wage (CAD)
  median_hourly: number;  // 50th-percentile hourly wage (CAD)
  high_hourly: number;    // 90th-percentile hourly wage (CAD)
  source: string;         // Data source, e.g. "Job Bank Canada"
  ref_period: string;     // Reference period, e.g. "2023"
}

/** Single tax bracket — max: null means no upper bound (top bracket). */
export interface TaxBracket {
  min: number;
  max: number | null;
  rate: number;           // Marginal rate as decimal, e.g. 0.205
}

export interface ProvinceTaxData {
  name: string;
  brackets: TaxBracket[];
}

export interface TaxBracketFile {
  metadata: DataFileMetadata;
  federal: TaxBracket[];
  provinces: Record<string, ProvinceTaxData>;
}

/** CPP/EI/QPP/QPIP payroll parameters for a given tax year. */
export interface PayrollParams {
  tax_year: number;
  cpp: {
    ympe: number;                   // Year's Maximum Pensionable Earnings
    basic_exemption: number;
    employee_rate: number;          // Decimal, e.g. 0.0595
    max_employee_contribution: number;
    employer_rate: number;
    max_employer_contribution: number;
  };
  cpp2: {
    yampe: number;                  // Year's Additional Maximum Pensionable Earnings
    employee_rate: number;
    max_employee_contribution: number;
    employer_rate: number;
    max_employer_contribution: number;
  };
  ei: {
    mie: number;                    // Maximum Insurable Earnings
    employee_rate: number;
    max_employee_premium: number;
    employer_rate: number;
    max_employer_premium: number;
  };
  qpp: {
    // Quebec Pension Plan — same YMPE as CPP, different rate
    ympe: number;
    basic_exemption: number;
    employee_rate: number;
    max_employee_contribution: number;
    employer_rate: number;
    max_employer_contribution: number;
  };
  qpp2: {
    yampe: number;
    employee_rate: number;
    max_employee_contribution: number;
    employer_rate: number;
    max_employer_contribution: number;
  };
  qpip: {
    // Quebec Parental Insurance Plan
    max_insurable_earnings: number;
    employee_rate: number;
    max_employee_premium: number;
    employer_rate: number;
    max_employer_premium: number;
  };
  ei_quebec: {
    // Reduced EI rate for Quebec employees (QPIP covers parental)
    employee_rate: number;
    max_employee_premium: number;
    employer_rate: number;
    max_employer_premium: number;
  };
}

export interface MBMThreshold {
  mbm_region: string;     // e.g. "toronto", "vancouver", "rural-on"
  display_name: string;
  province_code: string;
  /** Annual threshold in CAD, keyed by family size (1–7) */
  thresholds: {
    persons_1: number;
    persons_2: number;
    persons_3: number;
    persons_4: number;    // Reference family size (2 adults + 2 children)
    persons_5: number;
    persons_6: number;
    persons_7: number;
  };
  ref_year: number;
}

export interface RentBenchmark {
  cma_code: string;
  city_name: string;
  province_code: string;
  rents: RentByBedroom[];
  source: string;
  survey_year: number;
}

export interface RentByBedroom {
  bedrooms: number;       // 0 = bachelor, 1 = 1BR, 2 = 2BR, 3 = 3BR+
  bedroom_label: string;
  average_monthly: number;
  median_monthly: number;
}

/** Shared metadata header required on every data file (AC-4). */
export interface DataFileMetadata {
  data_version: string;   // e.g. "2026.1"
  source_url: string;
  last_updated: string;   // ISO date string
  tax_year: number;
  license: string;        // e.g. "Open Government Licence – Canada"
}

// ---------------------------------------------------------------------------
// Simulation I/O contracts
// ---------------------------------------------------------------------------

export interface SimulationInput {
  /** NOC 2021 code of the target occupation */
  noc_code: string;
  /** Target city id (matches City.city_id) */
  city_id: string;
  /** Wage percentile: "low" | "median" | "high" */
  wage_percentile: "low" | "median" | "high";
  /** Override hourly wage instead of using wage fact lookup */
  custom_hourly_wage?: number;
  /** Hours worked per week (default 40) */
  hours_per_week?: number;
  /** Weeks worked per year (default 52) */
  weeks_per_year?: number;
  /** Family size for MBM affordability calculation (1–7) */
  family_size: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  /** Number of dependent children (for CCB eligibility) */
  children_count: number;
  /** Tax year for brackets and payroll params */
  tax_year: number;
  /** Optional: override province (defaults to city's province) */
  province_code?: string;
}

export interface IncomeEstimate {
  hourly_wage: number;
  annual_gross: number;
  source: "wage_fact" | "custom";
  noc_code: string;
  geo_key: string;
}

export interface NetIncome {
  annual_gross: number;
  federal_tax: number;
  provincial_tax: number;
  cpp_employee: number;
  cpp2_employee: number;
  ei_employee: number;
  /** QPP replaces CPP for Quebec residents */
  qpp_employee?: number;
  qpp2_employee?: number;
  /** QPIP applies to Quebec residents */
  qpip_employee?: number;
  total_deductions: number;
  annual_net: number;
  monthly_net: number;
  effective_tax_rate: number;   // Decimal
  marginal_tax_rate: number;    // Decimal (federal + provincial combined)
}

export interface CostOfLiving {
  city_id: string;
  mbm_threshold: number;        // Annual MBM for this family size
  estimated_monthly_rent: number;
  estimated_monthly_total: number; // Rough total monthly COL estimate
}

export interface Affordability {
  annual_net: number;
  annual_mbm: number;
  monthly_net: number;
  monthly_rent: number;
  monthly_surplus_after_rent: number;
  mbm_coverage_ratio: number;   // annual_net / annual_mbm; >= 1 means above poverty line
  is_above_mbm: boolean;
}

export interface RoadmapOutput {
  /** Ordered list of suggested next steps for the newcomer */
  steps: RoadmapStep[];
}

export interface RoadmapStep {
  order: number;
  title: string;
  description: string;
  category: "credential" | "registration" | "job_search" | "financial" | "settlement";
}

export interface ConfidenceScore {
  score: number;            // 0–100
  factors: ConfidenceFactor[];
}

export interface ConfidenceFactor {
  label: string;
  impact: "positive" | "negative" | "neutral";
  note: string;
}

export interface SimulationOutput {
  input: SimulationInput;
  income: IncomeEstimate;
  net_income: NetIncome;
  cost_of_living: CostOfLiving;
  affordability: Affordability;
  roadmap: RoadmapOutput;
  confidence: ConfidenceScore;
  generated_at: string;    // ISO timestamp
}
