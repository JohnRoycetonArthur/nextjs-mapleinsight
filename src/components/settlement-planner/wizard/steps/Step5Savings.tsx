'use client'

import { useState } from 'react'
import { C, FONT, SERIF } from '../constants'
import type { WizardAnswers } from '../../SettlementSessionContext'

const Label = ({ children }: { children: React.ReactNode }) => (
  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 8, fontFamily: FONT }}>{children}</label>
)
const Helper = ({ children }: { children: React.ReactNode }) => (
  <p style={{ fontSize: 12, color: C.textLight, margin: '4px 0 0', lineHeight: 1.5, fontFamily: FONT }}>{children}</p>
)

const CurrencyInput = ({
  value, onChange, placeholder = '0', error,
}: { value: string; onChange: (v: string) => void; placeholder?: string; error?: string }) => {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ position: 'relative', maxWidth: 280 }}>
      <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 13, fontWeight: 600, color: C.textLight, fontFamily: FONT, pointerEvents: 'none' }}>CAD $</div>
      <input
        type="text"
        inputMode="decimal"
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value.replace(/[^0-9.,]/g, ''))}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        aria-invalid={!!error}
        style={{
          width: '100%', paddingLeft: 62, paddingRight: 16, paddingTop: 12, paddingBottom: 12,
          borderRadius: 10, border: `1px solid ${error ? C.red : focused ? C.accent : C.border}`,
          fontSize: 14, fontFamily: FONT, color: C.text, outline: 'none', background: C.white,
          boxShadow: focused ? `0 0 0 3px ${C.accent}18` : 'none',
          transition: 'border-color 0.2s, box-shadow 0.2s',
        }}
      />
      {error && <p style={{ fontSize: 12, color: C.red, margin: '6px 0 0', fontFamily: FONT }}>{error}</p>}
    </div>
  )
}

interface Props {
  data:     WizardAnswers
  onChange: (key: keyof WizardAnswers, value: unknown) => void
  errors:   Record<string, string>
}

export function Step5Savings({ data, onChange, errors }: Props) {
  return (
    <div>
      <h2 style={{ fontFamily: SERIF, fontSize: 24, color: C.forest, margin: '0 0 6px' }}>Your financial position</h2>
      <p style={{ fontSize: 14, color: C.gray, margin: '0 0 28px', lineHeight: 1.6, fontFamily: FONT }}>
        Tell us about your current savings and ongoing commitments.
      </p>

      <div style={{ marginBottom: 24 }}>
        <Label>Liquid savings available for the move (CAD) *</Label>
        <CurrencyInput
          value={data.savings ?? ''}
          onChange={v => onChange('savings', v)}
          placeholder="e.g. 18,000"
          error={errors.savings}
        />
        <Helper>Include cash, savings accounts, and easily accessible investments.</Helper>
      </div>

      <div style={{ marginBottom: 24 }}>
        <Label>Monthly financial obligations (CAD)</Label>
        <CurrencyInput
          value={data.obligations ?? ''}
          onChange={v => onChange('obligations', v)}
          placeholder="e.g. 300"
        />
        <Helper>Ongoing payments like student loans, family support, or debt repayments.</Helper>
      </div>

      <div>
        <Label>Monthly savings capacity (CAD)</Label>
        <CurrencyInput
          value={data.savingsCapacity ?? ''}
          onChange={v => onChange('savingsCapacity', v)}
          placeholder="e.g. 500"
        />
        <Helper>Optional. Used to estimate how long it takes to close any savings gap.</Helper>
      </div>
    </div>
  )
}
