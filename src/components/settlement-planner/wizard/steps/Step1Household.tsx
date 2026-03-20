'use client'

import { C, FONT, SERIF } from '../constants'
import type { WizardAnswers } from '../../SettlementSessionContext'

// ─── Shared primitives ────────────────────────────────────────────────────────

const Label = ({ children }: { children: React.ReactNode }) => (
  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 8, fontFamily: FONT }}>{children}</label>
)

const Stepper = ({
  value, onChange, min = 0, max = 10, color = C.accent,
}: { value: number; onChange: (v: number) => void; min?: number; max?: number; color?: string }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
    <button
      type="button"
      onClick={() => onChange(Math.max(min, value - 1))}
      aria-label="Decrease"
      style={{ width: 42, height: 42, borderRadius: 10, border: `1px solid ${C.border}`, background: C.white, fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.text, fontFamily: FONT }}
    >−</button>
    <span style={{ fontSize: 24, fontWeight: 700, color: C.forest, minWidth: 28, textAlign: 'center', fontFamily: SERIF }}>{value}</span>
    <button
      type="button"
      onClick={() => onChange(Math.min(max, value + 1))}
      aria-label="Increase"
      style={{ width: 42, height: 42, borderRadius: 10, border: `1px solid ${color}`, background: `${color}10`, fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color, fontFamily: FONT }}
    >+</button>
  </div>
)

const selectStyle: React.CSSProperties = {
  width: '100%', maxWidth: 340, padding: '12px 16px', borderRadius: 10,
  border: `1px solid ${C.border}`, fontSize: 14, fontFamily: FONT, color: C.text,
  background: C.white, outline: 'none',
}

// ─── Step 1 ───────────────────────────────────────────────────────────────────

interface Props {
  data:     WizardAnswers
  onChange: (key: keyof WizardAnswers, value: unknown) => void
  errors:   Record<string, string>
}

export function Step1Household({ data, onChange, errors }: Props) {
  return (
    <div>
      <h2 style={{ fontFamily: SERIF, fontSize: 24, color: C.forest, margin: '0 0 6px' }}>Tell us about your household</h2>
      <p style={{ fontSize: 14, color: C.gray, margin: '0 0 28px', lineHeight: 1.6, fontFamily: FONT }}>
        This helps us estimate costs based on your family size and arrival timeline.
      </p>

      <div style={{ marginBottom: 24 }}>
        <Label>Number of adults</Label>
        <Stepper value={data.adults ?? 1} onChange={v => onChange('adults', v)} min={1} max={6} />
      </div>

      <div style={{ marginBottom: 24 }}>
        <Label>Number of children</Label>
        <Stepper value={data.children ?? 0} onChange={v => onChange('children', v)} min={0} max={10} />
      </div>

      <div>
        <Label>When do you plan to arrive? *</Label>
        <select
          value={data.arrival ?? ''}
          onChange={e => onChange('arrival', e.target.value)}
          style={{ ...selectStyle, borderColor: errors.arrival ? C.red : C.border }}
          aria-required="true"
          aria-invalid={!!errors.arrival}
          aria-describedby={errors.arrival ? 'arrival-error' : undefined}
        >
          <option value="">Select arrival window</option>
          <option value="within_30">Within 30 days</option>
          <option value="1_3_months">1–3 months</option>
          <option value="3_6_months">3–6 months</option>
          <option value="6_12_months">6–12 months</option>
          <option value="12_plus">12+ months</option>
        </select>
        {errors.arrival && (
          <p id="arrival-error" style={{ fontSize: 12, color: C.red, margin: '6px 0 0', fontFamily: FONT }}>
            {errors.arrival}
          </p>
        )}
      </div>
    </div>
  )
}
