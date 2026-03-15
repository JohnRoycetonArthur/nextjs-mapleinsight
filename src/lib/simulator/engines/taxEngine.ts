/**
 * Tax & Net Income Calculator Engine — US-9.4
 *
 * calculateNetIncome() is a pure function: deterministic, no side effects (AC-8).
 * Data is injected via parameters so the function is fully testable without
 * touching the filesystem.
 *
 * For production use, pass data from:
 *   src/data/simulator/tax_brackets.json   → taxBracketsData
 *   src/data/simulator/payroll_params.json  → payrollParams.data
 */

import type {
  TaxBracketsData,
  PayrollParamsData,
  NetIncomeResult,
} from './taxTypes';
import { applyBrackets, lowestRate } from './bracketCalculator';
import { calculateCPP, calculateQPP } from './cppCalculator';
import { calculateEI } from './eiCalculator';

// ── 2026 Basic Personal Amounts ───────────────────────────────────────────────
// Source: CRA T1 General 2026 and provincial line 58040 equivalents.
// These are non-refundable tax credits applied as: bpa × lowest_bracket_rate.

const FEDERAL_BPA = 16129;

const PROVINCIAL_BPA: Record<string, number> = {
  AB: 21003,
  BC: 11981,
  MB: 15780,
  NB: 12458,
  NL: 10818,
  NS:  8481,
  NT: 16593,
  NU: 17925,
  ON: 11865,
  PE: 12000,
  QC: 17183, // used at the 14% rate (lowest QC bracket)
  SK: 17661,
  YT: 16129, // mirrors federal
};

const ASSUMPTIONS: string[] = [
  'employee',
  'standard_credits_only',
  'no_rrsp_deductions',
  '2026_tax_year',
];

// ── Internal helpers ──────────────────────────────────────────────────────────

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Estimates annual net income after federal/provincial tax, CPP, and EI.
 *
 * @param grossIncome      Annual gross employment income (CAD).
 * @param provinceCode     Two-letter province/territory code (e.g. "ON").
 * @param taxBracketsData  Injected from tax_brackets.json.
 * @param payrollParams    Injected from payroll_params.json → data.
 * @returns                Full NetIncomeResult (AC-1 through AC-8).
 */
export function calculateNetIncome(
  grossIncome:     number,
  provinceCode:    string,
  taxBracketsData: TaxBracketsData,
  payrollParams:   PayrollParamsData,
): NetIncomeResult {
  const income = Math.max(0, grossIncome);
  const isQuebec = provinceCode === 'QC';

  // ── 1. Federal tax (AC-2) ──────────────────────────────────────────────────

  const federalBrackets = taxBracketsData.federal;
  const federalGross    = applyBrackets(income, federalBrackets);
  const federalBPACredit = round2(FEDERAL_BPA * lowestRate(federalBrackets));

  // Quebec residents receive a 16.5% federal tax abatement
  const federalAbatement = isQuebec ? round2(federalGross * 0.165) : 0;
  const federal_tax = round2(Math.max(0, federalGross - federalBPACredit - federalAbatement));

  // ── 2. Provincial tax (AC-3) ───────────────────────────────────────────────

  const provData         = taxBracketsData.provinces[provinceCode];
  const provBrackets     = provData?.brackets ?? [];
  const provGross        = applyBrackets(income, provBrackets);
  const provBPAAmount    = PROVINCIAL_BPA[provinceCode] ?? 0;
  const provBPACredit    = round2(provBPAAmount * lowestRate(provBrackets));
  const provincial_tax   = round2(Math.max(0, provGross - provBPACredit));

  // ── 3. CPP / QPP (AC-4) ───────────────────────────────────────────────────

  const cppResult    = isQuebec
    ? calculateQPP(income, payrollParams)
    : calculateCPP(income, payrollParams);
  const cpp_contribution = cppResult.total;

  // ── 4. EI (AC-5) ──────────────────────────────────────────────────────────

  const eiResult  = calculateEI(income, provinceCode, payrollParams);
  const ei_premium = eiResult.premium;

  // ── 5. Totals (AC-1) ──────────────────────────────────────────────────────

  const total_deductions  = round2(federal_tax + provincial_tax + cpp_contribution + ei_premium);
  const annual_net_income = round2(Math.max(0, income - total_deductions));
  const monthly_take_home = Math.round(annual_net_income / 12);

  // ── 6. Assemble result ────────────────────────────────────────────────────

  const assumptions = isQuebec
    ? [...ASSUMPTIONS, 'quebec_qpp_qpip_applied']
    : ASSUMPTIONS;

  return {
    gross_income:        income,
    province_code:       provinceCode,
    federal_tax,
    provincial_tax,
    cpp_contribution,
    ei_premium,
    total_deductions,
    annual_net_income,
    monthly_take_home,
    quebec_special_case: isQuebec,
    assumptions,
  };
}
