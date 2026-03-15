// Shared design tokens for the Maple Insight simulator UI.
// Sourced from design comp US-9.2.

export const C = {
  forest:      '#1B4F4A',
  green:       '#1B7A4A',
  darkGreen:   '#0F3D3A',
  midGreen:    '#1B5E58',
  selectedBg:  '#E8F5EE',
  gold:        '#B8860B',
  goldBg:      '#FDF6E3',
  border:      '#E5E7EB',
  lightGray:   '#F3F4F6',
  white:       '#FFFFFF',
  textDark:    '#374151',
  gray:        '#6B7280',
  textLight:   '#9CA3AF',
  heroAccent:  '#7DD3A8',
} as const;

export const F = {
  heading: "var(--font-dm-serif), 'DM Serif Display', Georgia, serif",
  body:    "var(--font-dm-sans), 'DM Sans', Helvetica, sans-serif",
} as const;

export const STEP_LABELS = ['Stage', 'Location', 'Work', 'Household', 'Review'] as const;
export const TOTAL_STEPS = 5;
