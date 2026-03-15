import type { TaxBracketJSON } from './taxTypes';

/**
 * Applies a progressive bracket schedule to a taxable income and returns
 * the total tax owing (before any non-refundable credits).
 *
 * Brackets are expected in ascending order with no gaps.
 * `max: null` on the top bracket means the ceiling is Infinity.
 *
 * Pure function — no side effects (AC-8).
 */
export function applyBrackets(taxableIncome: number, brackets: TaxBracketJSON[]): number {
  if (taxableIncome <= 0) return 0;

  let tax = 0;
  for (const b of brackets) {
    if (taxableIncome <= b.min) break;
    const ceiling = b.max ?? Infinity;
    const slice   = Math.min(taxableIncome, ceiling) - b.min;
    tax += slice * b.rate;
  }
  return tax;
}

/** Returns the lowest marginal rate in a bracket schedule. */
export function lowestRate(brackets: TaxBracketJSON[]): number {
  return brackets[0]?.rate ?? 0;
}
