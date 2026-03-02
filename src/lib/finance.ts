export function monthlyLoanPayment(principal: number, annualRate: number, years: number) {
  const r = Math.max(0, annualRate) / 100 / 12;
  const n = Math.max(1, Math.round(years * 12));
  if (r === 0) return principal / n;
  return principal * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

export function amortizationSummary(principal: number, annualRate: number, years: number) {
  const pmt = monthlyLoanPayment(principal, annualRate, years);
  const n = Math.max(1, Math.round(years * 12));
  const totalPaid = pmt * n;
  const interest = totalPaid - principal;
  return { payment: pmt, totalPaid, interest, months: n };
}
