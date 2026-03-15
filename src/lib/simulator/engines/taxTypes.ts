// Types scoped to the tax / net-income calculation engine (US-9.4).

/** Tax bracket in the shape used by tax_brackets.json. */
export interface TaxBracketJSON {
  min:  number;
  max:  number | null; // null → top bracket (no ceiling)
  rate: number;        // marginal rate, 0–1
}

/** Slice of tax_brackets.json needed by the engine. */
export interface TaxBracketsData {
  federal: TaxBracketJSON[];
  provinces: Record<string, { name: string; brackets: TaxBracketJSON[] }>;
}

/** Slice of payroll_params.json → data needed by the engine. */
export interface PayrollParamsData {
  tax_year: number;
  cpp:  { ympe: number; basic_exemption: number; employee_rate: number; max_employee_contribution: number; };
  cpp2: { yampe: number; employee_rate: number; max_employee_contribution: number; };
  ei:   { mie: number; employee_rate: number; max_employee_premium: number; };
  qpp:  { ympe: number; basic_exemption: number; employee_rate: number; max_employee_contribution: number; };
  qpp2: { yampe: number; employee_rate: number; max_employee_contribution: number; };
  qpip: { max_insurable_earnings: number; employee_rate: number; max_employee_premium: number; };
  ei_quebec: { mie: number; employee_rate: number; max_employee_premium: number; };
}

/** Output of calculateCPP(). */
export interface CPPResult {
  cpp1:  number; // base CPP1 contribution
  cpp2:  number; // CPP2 enhancement (0 if income ≤ YMPE)
  total: number; // cpp1 + cpp2
}

/** Output of calculateEI(). */
export interface EIResult {
  premium: number; // total EI-equivalent premium (includes QPIP for Quebec)
  qpip:    number; // QPIP portion (> 0 only for Quebec)
}

/**
 * Full output of calculateNetIncome() (AC-1 through AC-8).
 *
 * All dollar amounts are rounded to the nearest cent except
 * `monthly_take_home`, which is rounded to the nearest dollar.
 */
export interface NetIncomeResult {
  // Inputs echoed for traceability
  gross_income:   number;
  province_code:  string;

  // Deduction components (AC-1)
  federal_tax:        number;
  provincial_tax:     number;
  cpp_contribution:   number;
  ei_premium:         number; // for QC: includes QPIP
  total_deductions:   number;
  annual_net_income:  number;
  monthly_take_home:  number; // rounded to nearest dollar

  // Quebec flag (AC-7)
  quebec_special_case: boolean;

  // Provenance (AC-6)
  assumptions: string[];
}
