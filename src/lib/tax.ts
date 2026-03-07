export type Bracket = { upTo: number | null; rate: number };

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
  for (const b of brackets) {
    const cap = b.upTo ?? Infinity;
    if (income <= cap) return b.rate;
  }
  return brackets[brackets.length - 1]?.rate ?? 0;
}

// Simplified 2025 marginal brackets (Ontario + Federal).
// Educational estimate only; does not model credits, surtaxes, CPP/EI, etc.
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

// ── BC 2025 ───────────────────────────────────────────────────────────────────
// Educational estimate. Does not model credits, surtaxes, CPP/EI, etc.
export const BC_2025: Bracket[] = [
  { upTo: 45654,  rate: 0.0506 },
  { upTo: 91310,  rate: 0.0770 },
  { upTo: 104835, rate: 0.1050 },
  { upTo: 127299, rate: 0.1229 },
  { upTo: 172602, rate: 0.1470 },
  { upTo: 240716, rate: 0.1680 },
  { upTo: null,   rate: 0.2050 },
];

export function combinedTaxBC2025(taxableIncome: number) {
  return taxFromBrackets(taxableIncome, FEDERAL_2025) + taxFromBrackets(taxableIncome, BC_2025);
}

export function combinedMarginalBC2025(taxableIncome: number) {
  return marginalRateAtIncome(taxableIncome, FEDERAL_2025) + marginalRateAtIncome(taxableIncome, BC_2025);
}

// ── Alberta 2025 ──────────────────────────────────────────────────────────────
// No provincial surtax. Lower provincial rates than most provinces.
export const ALBERTA_2025: Bracket[] = [
  { upTo: 148269, rate: 0.10 },
  { upTo: 177922, rate: 0.12 },
  { upTo: 237230, rate: 0.13 },
  { upTo: 355845, rate: 0.14 },
  { upTo: null,   rate: 0.15 },
];

export function combinedTaxAlberta2025(taxableIncome: number) {
  return taxFromBrackets(taxableIncome, FEDERAL_2025) + taxFromBrackets(taxableIncome, ALBERTA_2025);
}

export function combinedMarginalAlberta2025(taxableIncome: number) {
  return marginalRateAtIncome(taxableIncome, FEDERAL_2025) + marginalRateAtIncome(taxableIncome, ALBERTA_2025);
}

// ── Quebec 2025 ───────────────────────────────────────────────────────────────
// Note: Quebec residents receive a 16.5% federal tax abatement (federal tax
// is reduced by 16.5%). This implementation omits the abatement for simplicity.
// Label all Quebec output as "estimated" in UI.
export const QUEBEC_2025: Bracket[] = [
  { upTo: 51780,  rate: 0.14   },
  { upTo: 103545, rate: 0.19   },
  { upTo: 126000, rate: 0.24   },
  { upTo: null,   rate: 0.2575 },
];

export function combinedTaxQuebec2025(taxableIncome: number) {
  return taxFromBrackets(taxableIncome, FEDERAL_2025) + taxFromBrackets(taxableIncome, QUEBEC_2025);
}

export function combinedMarginalQuebec2025(taxableIncome: number) {
  return marginalRateAtIncome(taxableIncome, FEDERAL_2025) + marginalRateAtIncome(taxableIncome, QUEBEC_2025);
}
