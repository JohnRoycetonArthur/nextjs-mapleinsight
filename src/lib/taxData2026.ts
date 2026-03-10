// 2026 Canadian Federal + Provincial Tax Bracket Data
// Bracket format: { min, max, rate } (from design comp)
// Separate from src/lib/tax.ts (2025 brackets) to preserve existing calculator data.

export interface Bracket2026 {
  min: number;
  max: number;
  rate: number;
}

interface ProvinceData {
  name: string;
  brackets: Bracket2026[];
}

export const FEDERAL_BRACKETS_2026: Bracket2026[] = [
  { min: 0, max: 58523, rate: 0.14 },
  { min: 58523, max: 117045, rate: 0.205 },
  { min: 117045, max: 181440, rate: 0.26 },
  { min: 181440, max: 258482, rate: 0.29 },
  { min: 258482, max: Infinity, rate: 0.33 },
];

export const PROVINCIAL_BRACKETS_2026: Record<string, ProvinceData> = {
  AB: {
    name: "Alberta",
    brackets: [
      { min: 0, max: 148269, rate: 0.10 },
      { min: 148269, max: 177922, rate: 0.12 },
      { min: 177922, max: 237230, rate: 0.13 },
      { min: 237230, max: 355845, rate: 0.14 },
      { min: 355845, max: Infinity, rate: 0.15 },
    ],
  },
  BC: {
    name: "British Columbia",
    brackets: [
      { min: 0, max: 47937, rate: 0.0506 },
      { min: 47937, max: 95875, rate: 0.077 },
      { min: 95875, max: 110076, rate: 0.105 },
      { min: 110076, max: 133664, rate: 0.1229 },
      { min: 133664, max: 181232, rate: 0.147 },
      { min: 181232, max: 252752, rate: 0.168 },
      { min: 252752, max: Infinity, rate: 0.205 },
    ],
  },
  MB: {
    name: "Manitoba",
    brackets: [
      { min: 0, max: 47000, rate: 0.108 },
      { min: 47000, max: 100000, rate: 0.1275 },
      { min: 100000, max: Infinity, rate: 0.174 },
    ],
  },
  NB: {
    name: "New Brunswick",
    brackets: [
      { min: 0, max: 49958, rate: 0.094 },
      { min: 49958, max: 99916, rate: 0.14 },
      { min: 99916, max: 185064, rate: 0.16 },
      { min: 185064, max: Infinity, rate: 0.195 },
    ],
  },
  NL: {
    name: "Newfoundland & Labrador",
    brackets: [
      { min: 0, max: 43198, rate: 0.087 },
      { min: 43198, max: 86395, rate: 0.145 },
      { min: 86395, max: 154244, rate: 0.158 },
      { min: 154244, max: 215943, rate: 0.178 },
      { min: 215943, max: 275870, rate: 0.198 },
      { min: 275870, max: 551739, rate: 0.208 },
      { min: 551739, max: 1103478, rate: 0.213 },
      { min: 1103478, max: Infinity, rate: 0.218 },
    ],
  },
  NS: {
    name: "Nova Scotia",
    brackets: [
      { min: 0, max: 29590, rate: 0.0879 },
      { min: 29590, max: 59180, rate: 0.1495 },
      { min: 59180, max: 93000, rate: 0.1667 },
      { min: 93000, max: 150000, rate: 0.175 },
      { min: 150000, max: Infinity, rate: 0.21 },
    ],
  },
  NT: {
    name: "Northwest Territories",
    brackets: [
      { min: 0, max: 50597, rate: 0.059 },
      { min: 50597, max: 101198, rate: 0.086 },
      { min: 101198, max: 164525, rate: 0.122 },
      { min: 164525, max: Infinity, rate: 0.1405 },
    ],
  },
  NU: {
    name: "Nunavut",
    brackets: [
      { min: 0, max: 53268, rate: 0.04 },
      { min: 53268, max: 106537, rate: 0.07 },
      { min: 106537, max: 173205, rate: 0.09 },
      { min: 173205, max: Infinity, rate: 0.115 },
    ],
  },
  ON: {
    name: "Ontario",
    brackets: [
      { min: 0, max: 52886, rate: 0.0505 },
      { min: 52886, max: 105773, rate: 0.0915 },
      { min: 105773, max: 150000, rate: 0.1116 },
      { min: 150000, max: 220000, rate: 0.1216 },
      { min: 220000, max: Infinity, rate: 0.1316 },
    ],
  },
  PE: {
    name: "Prince Edward Island",
    brackets: [
      { min: 0, max: 32656, rate: 0.098 },
      { min: 32656, max: 64313, rate: 0.138 },
      { min: 64313, max: 105000, rate: 0.167 },
      { min: 105000, max: 140000, rate: 0.175 },
      { min: 140000, max: Infinity, rate: 0.19 },
    ],
  },
  QC: {
    name: "Quebec",
    brackets: [
      { min: 0, max: 51780, rate: 0.14 },
      { min: 51780, max: 103545, rate: 0.19 },
      { min: 103545, max: 126000, rate: 0.24 },
      { min: 126000, max: Infinity, rate: 0.2575 },
    ],
  },
  SK: {
    name: "Saskatchewan",
    brackets: [
      { min: 0, max: 52057, rate: 0.105 },
      { min: 52057, max: 148734, rate: 0.125 },
      { min: 148734, max: Infinity, rate: 0.145 },
    ],
  },
  YT: {
    name: "Yukon",
    brackets: [
      { min: 0, max: 55867, rate: 0.064 },
      { min: 55867, max: 111733, rate: 0.09 },
      { min: 111733, max: 173205, rate: 0.109 },
      { min: 173205, max: 500000, rate: 0.128 },
      { min: 500000, max: Infinity, rate: 0.15 },
    ],
  },
};

export const PROVINCES_LIST = Object.entries(PROVINCIAL_BRACKETS_2026)
  .map(([code, data]) => ({ code, name: data.name }))
  .sort((a, b) => a.name.localeCompare(b.name));

// --- Calculation helpers ---

export function getMarginalRate(income: number, brackets: Bracket2026[]): number {
  for (let i = brackets.length - 1; i >= 0; i--) {
    if (income > brackets[i].min) return brackets[i].rate;
  }
  return brackets[0].rate;
}

export function calcCombinedMarginal(income: number, provinceCode: string): number {
  if (!provinceCode || !PROVINCIAL_BRACKETS_2026[provinceCode]) return 0;
  const fedRate = getMarginalRate(income, FEDERAL_BRACKETS_2026);
  const provRate = getMarginalRate(income, PROVINCIAL_BRACKETS_2026[provinceCode].brackets);
  return fedRate + provRate;
}

export interface ChartDataPoint {
  year: number;
  rrspGross: number;
  rrspAfterTax: number;
  tfsaValue: number;
}

export interface ComparisonResult {
  marginalRate: number;
  rrspRefund: number;
  rrspInvested: number;
  rrspFV: number;
  rrspTax: number;
  rrspAfterTax: number;
  tfsaFV: number;
  tfsaAfterTax: number;
  difference: number;
  winner: "TFSA" | "RRSP" | "tie";
  chartData: ChartDataPoint[];
}

export function runComparison(
  income: number,
  provinceCode: string,
  contribution: number,
  horizon: number,
  returnRate: number,  // decimal e.g. 0.06
  retirementRate: number  // decimal e.g. 0.30
): ComparisonResult {
  const marginalRate = calcCombinedMarginal(income, provinceCode);

  // RRSP
  const rrspRefund = contribution * marginalRate;
  const rrspInvested = contribution + rrspRefund;
  const rrspFV = rrspInvested * Math.pow(1 + returnRate, horizon);
  const rrspTax = rrspFV * retirementRate;
  const rrspAfterTax = rrspFV - rrspTax;

  // TFSA
  const tfsaFV = contribution * Math.pow(1 + returnRate, horizon);
  const tfsaAfterTax = tfsaFV;

  const rawDiff = tfsaAfterTax - rrspAfterTax;
  const winner: "TFSA" | "RRSP" | "tie" =
    Math.abs(rawDiff) < 1 ? "tie" : rawDiff > 0 ? "TFSA" : "RRSP";

  // Year-by-year data for chart
  const chartData: ChartDataPoint[] = [];
  for (let y = 0; y <= horizon; y++) {
    const rFV = rrspInvested * Math.pow(1 + returnRate, y);
    const rAfter = rFV * (1 - retirementRate);
    const tFV = contribution * Math.pow(1 + returnRate, y);
    chartData.push({
      year: y,
      rrspGross: Math.round(rFV),
      rrspAfterTax: Math.round(rAfter),
      tfsaValue: Math.round(tFV),
    });
  }

  return {
    marginalRate,
    rrspRefund,
    rrspInvested,
    rrspFV,
    rrspTax,
    rrspAfterTax,
    tfsaFV,
    tfsaAfterTax,
    difference: Math.abs(rawDiff),
    winner,
    chartData,
  };
}

// --- Formatters ---
export const fmt = (n: number): string => {
  if (Math.abs(n) >= 1_000_000) return "$" + (n / 1_000_000).toFixed(1) + "M";
  return "$" + Math.round(n).toLocaleString("en-CA");
};

export const fmtFull = (n: number): string =>
  "$" + n.toLocaleString("en-CA", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

export const pctFmt = (n: number): string => (n * 100).toFixed(1) + "%";
