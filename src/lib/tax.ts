export type Bracket = { upTo: number | null; rate: number };

/**
 * Simplified combined tax estimate using marginal brackets only (does not model non-refundable credits, surtaxes, EI/CPP, etc.)
 * Intended for educational comparisons, not exact filing outcomes.
 */
export function taxFromBrackets(income: number, brackets: Bracket[]): number {
  let remaining = Math.max(0, income);
  let prevCap = 0;
  let tax = 0;

  for (const b of brackets) {
    const cap = b.upTo ?? Infinity;
    const slice = Math.max(0, Math.min(remaining, cap - prevCap));
    tax += slice * b.rate;
    remaining -= slice;
    prevCap = cap;
    if (remaining <= 0) break;
  }
  return tax;
}

export function marginalRateAtIncome(income: number, brackets: Bracket[]): number {
  let prevCap = 0;
  for (const b of brackets) {
    const cap = b.upTo ?? Infinity;
    if (income <= cap) return b.rate;
    prevCap = cap;
  }
  return brackets[brackets.length - 1]?.rate ?? 0;
}

// 2025 Federal brackets (lowest bracket effectively 14.5% due to mid-year change), and Ontario 2025.
// Sources used when building this repo: CRA + reputable tax reference summaries.
// Update yearly.
export const FEDERAL_2025: Bracket[] = [
  { upTo: 57375, rate: 0.145 },
  { upTo: 114750, rate: 0.205 },
  { upTo: 177882, rate: 0.26 },
  { upTo: 253414, rate: 0.29 },
  { upTo: null, rate: 0.33 },
];

export const ONTARIO_2025: Bracket[] = [
  { upTo: 52886, rate: 0.0505 },
  { upTo: 105775, rate: 0.0915 },
  { upTo: 150000, rate: 0.1116 },
  { upTo: 220000, rate: 0.1216 },
  { upTo: null, rate: 0.1316 },
];

export function combinedTaxOntario2025(taxableIncome: number) {
  return taxFromBrackets(taxableIncome, FEDERAL_2025) + taxFromBrackets(taxableIncome, ONTARIO_2025);
}

export function combinedMarginalOntario2025(taxableIncome: number) {
  return marginalRateAtIncome(taxableIncome, FEDERAL_2025) + marginalRateAtIncome(taxableIncome, ONTARIO_2025);
}
