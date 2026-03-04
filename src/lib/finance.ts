export function monthlyLoanPayment(principal: number, annualRate: number, years: number) {
  const r = Math.max(0, annualRate) / 100 / 12;
  const n = Math.max(1, Math.round(years * 12));
  if (r === 0) return principal / n;
  return principal * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

export function amortizationSummary(principal: number, annualRate: number, years: number) {
  const payment = monthlyLoanPayment(principal, annualRate, years);
  const months = Math.max(1, Math.round(years * 12));
  const totalPaid = payment * months;
  const interest = totalPaid - principal;
  return { payment, totalPaid, interest, months };
}
