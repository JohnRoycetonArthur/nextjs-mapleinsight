export function money(n: number, currency: string = "CAD") {
  return new Intl.NumberFormat("en-CA", { style: "currency", currency, maximumFractionDigits: 0 }).format(n);
}

export function money2(n: number, currency: string = "CAD") {
  return new Intl.NumberFormat("en-CA", { style: "currency", currency, minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}

export function pct(n: number, digits: number = 1) {
  return `${(n * 100).toFixed(digits)}%`;
}
