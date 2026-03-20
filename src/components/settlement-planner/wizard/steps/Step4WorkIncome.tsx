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

const inputStyle = (focus: boolean): React.CSSProperties => ({
  width: '100%', padding: '12px 16px', borderRadius: 10,
  border: `1px solid ${focus ? C.accent : C.border}`,
  fontSize: 14, fontFamily: FONT, color: C.text,
  outline: 'none', background: C.white,
  boxShadow: focus ? `0 0 0 3px ${C.accent}18` : 'none',
  transition: 'border-color 0.2s, box-shadow 0.2s',
})

const CurrencyInput = ({ value, onChange, placeholder = '0' }: { value: string; onChange: (v: string) => void; placeholder?: string }) => {
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
        style={{ ...inputStyle(focused), paddingLeft: 62 }}
      />
    </div>
  )
}

const JOB_OPTIONS = [
  { value: 'secured_30',  label: 'Job secured',              desc: 'Start date within 30 days of arrival',     icon: '✅', color: C.accent  },
  { value: 'offer_30_90', label: 'Job offer, delayed start', desc: 'Start date 30–90 days after arrival',       icon: '📋', color: C.gold    },
  { value: 'no_offer',    label: 'No job offer yet',         desc: 'Still searching or plan to search on arrival', icon: '🔍', color: C.red   },
  { value: 'student',     label: 'Student',                  desc: 'Income uncertain or part-time only',        icon: '🎓', color: C.purple  },
]

const RUNWAY_LABEL: Record<string, string> = {
  secured_30: '2 months', offer_30_90: '3 months', no_offer: '6 months', student: '6 months',
}

interface Props {
  data:     WizardAnswers
  onChange: (key: keyof WizardAnswers, value: unknown) => void
  errors:   Record<string, string>
  isMobile: boolean
}

export function Step4WorkIncome({ data, onChange, errors, isMobile }: Props) {
  const showIncome = data.jobStatus === 'secured_30' || data.jobStatus === 'offer_30_90' ||
                     data.jobStatus === 'no_offer'   || data.jobStatus === 'student'

  return (
    <div>
      <h2 style={{ fontFamily: SERIF, fontSize: 24, color: C.forest, margin: '0 0 6px' }}>Work & income situation</h2>
      <p style={{ fontSize: 14, color: C.gray, margin: '0 0 28px', lineHeight: 1.6, fontFamily: FONT }}>
        This determines your financial runway and how we estimate your income.
      </p>

      <div style={{ marginBottom: 24 }}>
        <Label>What&apos;s your job situation? *</Label>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 10 }}>
          {JOB_OPTIONS.map(o => (
            <button
              key={o.value}
              type="button"
              onClick={() => onChange('jobStatus', o.value)}
              aria-pressed={data.jobStatus === o.value}
              style={{
                padding: '16px 18px', borderRadius: 12, textAlign: 'left',
                border:     data.jobStatus === o.value ? `2px solid ${o.color}` : `1px solid ${C.border}`,
                background: data.jobStatus === o.value ? `${o.color}08` : C.white,
                cursor: 'pointer', transition: 'all 0.15s', fontFamily: FONT,
              }}
            >
              <span style={{ fontSize: 20, display: 'block', marginBottom: 6 }}>{o.icon}</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: C.forest, display: 'block', lineHeight: 1.3 }}>{o.label}</span>
              <span style={{ fontSize: 12, color: C.gray, display: 'block', marginTop: 3, lineHeight: 1.4 }}>{o.desc}</span>
            </button>
          ))}
        </div>
        {data.jobStatus && (
          <div style={{ marginTop: 10, fontSize: 12, color: C.accent, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, fontFamily: FONT }}>
            <span style={{ width: 8, height: 8, borderRadius: 4, background: C.accent, display: 'inline-block' }} />
            Planning runway: {RUNWAY_LABEL[data.jobStatus]}
          </div>
        )}
        {errors.jobStatus && (
          <p style={{ fontSize: 12, color: C.red, margin: '6px 0 0', fontFamily: FONT }}>{errors.jobStatus}</p>
        )}
      </div>

      {showIncome && (
        <div style={{ marginBottom: 24 }}>
          <Label>Expected net monthly income (CAD)</Label>
          <CurrencyInput value={data.income ?? ''} onChange={v => onChange('income', v)} placeholder="e.g. 4,500" />
          <Helper>
            {data.jobStatus === 'no_offer' || data.jobStatus === 'student'
              ? 'Leave blank if uncertain. We\'ll plan for maximum runway.'
              : 'Your take-home pay after taxes and deductions.'}
          </Helper>
        </div>
      )}
    </div>
  )
}
