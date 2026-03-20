// ─── Design tokens ────────────────────────────────────────────────────────────

export const C = {
  forest:    '#1B4F4A',
  accent:    '#1B7A4A',
  gold:      '#B8860B',
  red:       '#C41E3A',
  blue:      '#2563EB',
  purple:    '#9333EA',
  gray:      '#6B7280',
  lightGray: '#F3F4F6',
  border:    '#E5E7EB',
  white:     '#FFFFFF',
  text:      '#374151',
  textLight: '#9CA3AF',
  bg:        '#FAFBFC',
} as const

export const FONT  = "'DM Sans', Helvetica, sans-serif"
export const SERIF = "'DM Serif Display', Georgia, serif"

// ─── Step metadata ────────────────────────────────────────────────────────────

export interface StepMeta {
  num:   number
  key:   string
  title: string
  icon:  string
  color: string
}

export const WIZARD_STEPS: StepMeta[] = [
  { num: 1, key: 'household',   title: 'Household',    icon: '👥', color: C.accent  },
  { num: 2, key: 'immigration', title: 'Immigration',  icon: '🛂', color: C.gold    },
  { num: 3, key: 'destination', title: 'Destination',  icon: '📍', color: C.blue    },
  { num: 4, key: 'income',      title: 'Work & Income', icon: '💼', color: C.purple },
  { num: 5, key: 'savings',     title: 'Savings',      icon: '🏦', color: C.red     },
  { num: 6, key: 'lifestyle',   title: 'Lifestyle',    icon: '🏠', color: C.accent  },
]

export const TOTAL_STEPS = WIZARD_STEPS.length
