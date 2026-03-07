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

/**
 * Canadian minimum down payment requirement (CMHC / OSFI rules, post Dec 15 2024).
 * - Under $500k: 5%
 * - $500k–$1,499,999: 5% on first $500k + 10% on remainder
 * - $1,500,000+: 20%
 */
export function minDownPayment(price: number): number {
  if (price <= 0) return 0;
  if (price >= 1_500_000) return price * 0.20;
  if (price <= 500_000) return price * 0.05;
  return 500_000 * 0.05 + (price - 500_000) * 0.10;
}

export type YearlyRow = {
  year: number;
  totalPaid: number;
  principalPaid: number;
  interestPaid: number;
  balance: number;
};

/**
 * Builds a year-by-year amortization schedule using real month-by-month compounding.
 * Returns one row per year (plus a partial final year if amortization is not whole years).
 */
export function yearlyAmortizationSchedule(
  principal: number,
  annualRate: number,
  years: number
): YearlyRow[] {
  const r = Math.max(0, annualRate) / 100 / 12;
  const totalMonths = Math.max(1, Math.round(years * 12));
  const payment = r === 0 ? principal / totalMonths
    : principal * (r * Math.pow(1 + r, totalMonths)) / (Math.pow(1 + r, totalMonths) - 1);

  const rows: YearlyRow[] = [];
  let balance = principal;
  let yearStart = new Date().getFullYear();
  let monthsInYear = 0;
  let yearTotalPaid = 0;
  let yearPrincipal = 0;
  let yearInterest = 0;

  for (let m = 0; m < totalMonths; m++) {
    const interestPortion = balance * r;
    const principalPortion = Math.min(payment - interestPortion, balance);
    balance = Math.max(0, balance - principalPortion);

    yearTotalPaid += payment;
    yearPrincipal += principalPortion;
    yearInterest += interestPortion;
    monthsInYear++;

    if (monthsInYear === 12 || m === totalMonths - 1) {
      rows.push({
        year: yearStart + Math.floor(m / 12),
        totalPaid: yearTotalPaid,
        principalPaid: yearPrincipal,
        interestPaid: yearInterest,
        balance,
      });
      yearTotalPaid = 0;
      yearPrincipal = 0;
      yearInterest = 0;
      monthsInYear = 0;
    }
  }

  return rows;
}

/**
 * CMHC mortgage default insurance premium.
 * Returns 0 for conventional mortgages (down >= 20% OR price >= $1.5M).
 * Otherwise returns the premium amount to be added to the mortgage principal.
 */
export function cmhcPremium(loanAmount: number, price: number): number {
  if (price <= 0 || loanAmount <= 0) return 0;
  const downPct = (price - loanAmount) / price;
  if (downPct >= 0.20 || price >= 1_500_000) return 0;
  if (downPct >= 0.15) return loanAmount * 0.028;
  if (downPct >= 0.10) return loanAmount * 0.031;
  return loanAmount * 0.040;
}
