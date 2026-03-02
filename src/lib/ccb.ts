export type CcbInputs = {
  afni: number;
  under6: number;
  age6to17: number;
};

// July 2025 to June 2026 maximum annual amounts (CRA).
export const CCB_MAX_UNDER6 = 7997;
export const CCB_MAX_6TO17 = 6748;

// Thresholds (CRA)
export const THRESHOLD_1 = 37487;
export const THRESHOLD_2 = 81222;

function phaseRates(children: number) {
  // Rates from CRA examples / tables for Phase 1 and Phase 2
  // 1 child: 7% then 3.2%
  // 2 children: 13.5% then 5.7%
  // 3 children: 19% then 8%
  // 4+ children: 23% then 9.5%
  if (children <= 1) return { r1: 0.07, r2: 0.032, base2: 3061 };
  if (children === 2) return { r1: 0.135, r2: 0.057, base2: 5904 };
  if (children === 3) return { r1: 0.19, r2: 0.08, base2: 8310 };
  return { r1: 0.23, r2: 0.095, base2: 10059 };
}

export function estimateCcbAnnual({ afni, under6, age6to17 }: CcbInputs) {
  const kids = Math.max(0, Math.round(under6)) + Math.max(0, Math.round(age6to17));
  const max = Math.max(0, Math.round(under6)) * CCB_MAX_UNDER6 + Math.max(0, Math.round(age6to17)) * CCB_MAX_6TO17;
  if (kids === 0) return { max, reduction: 0, annual: 0, monthly: 0 };

  const { r1, r2, base2 } = phaseRates(kids);

  let reduction = 0;
  if (afni > THRESHOLD_1 && afni <= THRESHOLD_2) {
    reduction = (afni - THRESHOLD_1) * r1;
  } else if (afni > THRESHOLD_2) {
    reduction = base2 + (afni - THRESHOLD_2) * r2;
  }

  const annual = Math.max(0, max - reduction);
  const monthly = annual / 12;
  return { max, reduction, annual, monthly };
}
