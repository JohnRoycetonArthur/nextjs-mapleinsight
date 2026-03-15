import type { CPPResult, PayrollParamsData } from './taxTypes';

/**
 * Calculates employee CPP1 and CPP2 contributions for 2026 (AC-4).
 *
 * CPP1: (min(income, YMPE) − basic_exemption) × employee_rate, capped at max.
 * CPP2: (min(income, YAMPE) − YMPE) × employee_rate, capped at max.
 *       CPP2 only applies when income exceeds the first YMPE ceiling.
 *
 * Quebec residents pay QPP/QPP2 instead of CPP; the caller is responsible
 * for passing the correct params (qpp/qpp2) when province_code === 'QC'.
 *
 * Pure function — no side effects (AC-8).
 */
export function calculateCPP(income: number, params: PayrollParamsData): CPPResult {
  if (income <= 0) return { cpp1: 0, cpp2: 0, total: 0 };

  const { cpp, cpp2 } = params;

  // CPP1 — income between basic_exemption and YMPE
  const cpp1Earnings = Math.max(0, Math.min(income, cpp.ympe) - cpp.basic_exemption);
  const cpp1 = Math.min(
    round2(cpp1Earnings * cpp.employee_rate),
    cpp.max_employee_contribution,
  );

  // CPP2 — income between YMPE and YAMPE (enhancement tier, post-2024)
  const cpp2Earnings = Math.max(0, Math.min(income, cpp2.yampe) - cpp.ympe);
  const cpp2Amount = Math.min(
    round2(cpp2Earnings * cpp2.employee_rate),
    cpp2.max_employee_contribution,
  );

  return { cpp1, cpp2: cpp2Amount, total: round2(cpp1 + cpp2Amount) };
}

/**
 * Calculates employee QPP1 and QPP2 contributions for Quebec (AC-4 / AC-7).
 * Identical formula to CPP but uses QPP rates and maximums.
 */
export function calculateQPP(income: number, params: PayrollParamsData): CPPResult {
  if (income <= 0) return { cpp1: 0, cpp2: 0, total: 0 };

  const { qpp, qpp2 } = params;

  const qpp1Earnings = Math.max(0, Math.min(income, qpp.ympe) - qpp.basic_exemption);
  const cpp1 = Math.min(
    round2(qpp1Earnings * qpp.employee_rate),
    qpp.max_employee_contribution,
  );

  const qpp2Earnings = Math.max(0, Math.min(income, qpp2.yampe) - qpp.ympe);
  const cpp2Amount = Math.min(
    round2(qpp2Earnings * qpp2.employee_rate),
    qpp2.max_employee_contribution,
  );

  return { cpp1, cpp2: cpp2Amount, total: round2(cpp1 + cpp2Amount) };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
