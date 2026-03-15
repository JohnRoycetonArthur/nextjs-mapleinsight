import type { EIResult, PayrollParamsData } from './taxTypes';

/**
 * Calculates employee EI premiums for 2026 (AC-5).
 *
 * Non-Quebec: min(income, MIE) × employee_rate, capped at max_premium.
 *
 * Quebec (AC-7): Quebec residents pay a reduced EI rate AND an additional
 * QPIP (Quebec Parental Insurance Plan) premium.  Both are included in the
 * returned `premium` total; the `qpip` field shows the QPIP portion alone.
 *
 * Pure function — no side effects (AC-8).
 */
export function calculateEI(
  income:       number,
  provinceCode: string,
  params:       PayrollParamsData,
): EIResult {
  if (income <= 0) return { premium: 0, qpip: 0 };

  if (provinceCode === 'QC') {
    const { ei_quebec, qpip } = params;

    const eiPremium = Math.min(
      round2(Math.min(income, ei_quebec.mie) * ei_quebec.employee_rate),
      ei_quebec.max_employee_premium,
    );

    const qpipPremium = Math.min(
      round2(Math.min(income, qpip.max_insurable_earnings) * qpip.employee_rate),
      qpip.max_employee_premium,
    );

    return { premium: round2(eiPremium + qpipPremium), qpip: qpipPremium };
  }

  const { ei } = params;
  const premium = Math.min(
    round2(Math.min(income, ei.mie) * ei.employee_rate),
    ei.max_employee_premium,
  );

  return { premium, qpip: 0 };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
