'use client'

/**
 * Step 5: Savings & Obligations (US-11.6)
 *
 * Collects: liquid savings (required), monthly obligations (optional),
 * monthly savings capacity (optional).
 *
 * All inputs use "CAD $" prefix, inputMode="decimal", and allow comma
 * separators (digits, commas, and decimal points only).
 */

import { useState } from 'react'
import { C, FONT, SERIF } from '../constants'
import type { WizardAnswers } from '../../SettlementSessionContext'

// ─── Design primitives ────────────────────────────────────────────────────────

const Label = ({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) => (
  <label
    htmlFor={htmlFor}
    style={{ display: 'block', fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 8, fontFamily: FONT }}
  >
    {children}
  </label>
)

const Helper = ({ children }: { children: React.ReactNode }) => (
  <p style={{ fontSize: 12, color: C.textLight, margin: '4px 0 0', lineHeight: 1.5, fontFamily: FONT }}>
    {children}
  </p>
)

// ─── Currency input ───────────────────────────────────────────────────────────

function CurrencyInput({
  id, value, onChange, placeholder = '0', error,
}: {
  id?: string
  value:       string
  onChange:    (v: string) => void
  placeholder?: string
  error?:       string
}) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ maxWidth: 280 }}>
      <div style={{ position: 'relative' }}>
        <div style={{
          position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
          fontSize: 13, fontWeight: 600, color: C.textLight, fontFamily: FONT,
          pointerEvents: 'none',
        }}>
          CAD $
        </div>
        <input
          id={id}
          type="text"
          inputMode="decimal"
          placeholder={placeholder}
          value={value}
          onChange={e => onChange(e.target.value.replace(/[^0-9.,]/g, ''))}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          aria-invalid={!!error}
          aria-describedby={error && id ? `${id}-error` : undefined}
          style={{
            width: '100%', padding: '12px 16px', paddingLeft: 62, borderRadius: 10,
            border: `1px solid ${error ? C.red : focused ? C.accent : C.border}`,
            boxShadow: focused ? `0 0 0 3px ${C.accent}18` : 'none',
            fontSize: 14, fontFamily: FONT, color: C.text,
            outline: 'none', background: C.white,
            transition: 'border-color 0.2s, box-shadow 0.2s',
          }}
        />
      </div>
      {error && (
        <p id={id ? `${id}-error` : undefined} role="alert" style={{ fontSize: 12, color: C.red, margin: '6px 0 0', fontFamily: FONT }}>
          {error}
        </p>
      )}
    </div>
  )
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  data:     WizardAnswers
  onChange: (key: keyof WizardAnswers, value: unknown) => void
  errors:   Record<string, string>
}

// ─── Step 5: Savings & Obligations ───────────────────────────────────────────

export function Step5Savings({ data, onChange, errors }: Props) {
  return (
    <div>
      <h2 style={{ fontFamily: SERIF, fontSize: 24, color: C.forest, margin: '0 0 6px' }}>
        Your financial position
      </h2>
      <p style={{ fontSize: 14, color: C.gray, margin: '0 0 28px', lineHeight: 1.6, fontFamily: FONT }}>
        Tell us about your current savings and ongoing commitments.
      </p>

      {/* ── Liquid savings (required) (AC-1, AC-2) ────────────────────────── */}
      <div style={{ marginBottom: 24 }}>
        <Label htmlFor="savings-input">Liquid savings available for the move (CAD) *</Label>
        <CurrencyInput
          id="savings-input"
          value={data.savings ?? ''}
          onChange={v => onChange('savings', v)}
          placeholder="e.g. 18,000"
          error={errors.savings}
        />
        <Helper>Include cash, savings accounts, and easily accessible investments.</Helper>
      </div>

      {/* ── Monthly obligations (optional) (AC-1, AC-3) ───────────────────── */}
      <div style={{ marginBottom: 24 }}>
        <Label htmlFor="obligations-input">Monthly financial obligations (CAD)</Label>
        <CurrencyInput
          id="obligations-input"
          value={data.obligations ?? ''}
          onChange={v => onChange('obligations', v)}
          placeholder="e.g. 300"
        />
        <Helper>Ongoing payments like student loans, family support, or debt repayments.</Helper>
      </div>

      {/* ── Monthly savings capacity (optional) (AC-1) ────────────────────── */}
      <div>
        <Label htmlFor="capacity-input">Monthly savings capacity (CAD)</Label>
        <CurrencyInput
          id="capacity-input"
          value={data.savingsCapacity ?? ''}
          onChange={v => onChange('savingsCapacity', v)}
          placeholder="e.g. 500"
        />
        <Helper>Optional. Used to estimate how long it takes to close any savings gap.</Helper>
      </div>
    </div>
  )
}
