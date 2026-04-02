export const DEFAULT_EXPENSES = {
  utilities: { label: 'Utilities', amount: 150, perAdult: false },
  phoneInternet: { label: 'Phone & Internet', amount: 80, perAdult: false },
  groceries: { label: 'Groceries', amount: 400, perAdult: true },
} as const

export type DefaultExpenseKey = keyof typeof DEFAULT_EXPENSES

export interface CustomExpense {
  id: string
  label: string
  amount: string
  isDefault?: boolean
  defaultKey?: DefaultExpenseKey
  isModified?: boolean
}

export function buildDefaultExpenses(adults: number): CustomExpense[] {
  const householdAdults = Math.max(1, adults || 1)

  return [
    {
      id: 'default_utilities',
      label: DEFAULT_EXPENSES.utilities.label,
      amount: String(DEFAULT_EXPENSES.utilities.amount),
      isDefault: true,
      defaultKey: 'utilities',
      isModified: false,
    },
    {
      id: 'default_phoneInternet',
      label: DEFAULT_EXPENSES.phoneInternet.label,
      amount: String(DEFAULT_EXPENSES.phoneInternet.amount),
      isDefault: true,
      defaultKey: 'phoneInternet',
      isModified: false,
    },
    {
      id: 'default_groceries',
      label: DEFAULT_EXPENSES.groceries.label,
      amount: String(DEFAULT_EXPENSES.groceries.amount * householdAdults),
      isDefault: true,
      defaultKey: 'groceries',
      isModified: false,
    },
  ]
}

export function parseExpenseAmount(amount: string | undefined): number {
  if (!amount) return 0
  const parsed = Number.parseFloat(amount.replace(/,/g, ''))
  return Number.isFinite(parsed) ? parsed : 0
}
