'use client'

import { C, FONT, SERIF } from '../constants'
import type { WizardAnswers } from '../../SettlementSessionContext'

// ─── Shared primitives ────────────────────────────────────────────────────────

const Label = ({ children }: { children: React.ReactNode }) => (
  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 8, fontFamily: FONT }}>{children}</label>
)

const Toggle = ({
  value, onChange, labelOn = 'Yes', labelOff = 'No',
}: { value: boolean; onChange: (v: boolean) => void; labelOn?: string; labelOff?: string }) => (
  <div style={{ display: 'flex', gap: 8 }}>
    {([{ v: true, l: labelOn }, { v: false, l: labelOff }] as const).map(o => (
      <button
        key={String(o.v)}
        type="button"
        onClick={() => onChange(o.v)}
        aria-pressed={value === o.v}
        style={{
          padding: '8px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600,
          border:     value === o.v ? `2px solid ${C.accent}` : `1px solid ${C.border}`,
          background: value === o.v ? `${C.accent}10` : C.white,
          color:      value === o.v ? C.accent : C.gray,
          cursor: 'pointer', fontFamily: FONT, transition: 'all 0.15s',
        }}
      >{o.l}</button>
    ))}
  </div>
)

const PATHWAYS = [
  { value: 'express_entry', label: 'Express Entry',      icon: '🚀', desc: 'Federal Skilled Worker, CEC, or Skilled Trades', color: C.accent  },
  { value: 'pnp',           label: 'Provincial Nominee', icon: '🏛️', desc: 'Province-specific nomination programs',           color: C.blue    },
  { value: 'study_permit',  label: 'Study Permit',       icon: '🎓', desc: 'International student visa',                     color: C.purple  },
  { value: 'work_permit',   label: 'Work Permit',        icon: '💼', desc: 'LMIA-based or open work permit',                 color: C.gold    },
  { value: 'family',        label: 'Family Sponsorship', icon: '👨‍👩‍👧', desc: 'Sponsored by a Canadian citizen or PR',          color: C.red     },
  { value: 'refugee',       label: 'Refugee / Protected', icon: '🛡️', desc: 'Refugee claim or protected person',              color: C.forest  },
  { value: 'other',         label: 'Other / Not Sure',   icon: '❓', desc: 'Other immigration pathway',                      color: C.gray    },
]

// ─── Step 2 ───────────────────────────────────────────────────────────────────

interface Props {
  data:     WizardAnswers
  onChange: (key: keyof WizardAnswers, value: unknown) => void
  errors:   Record<string, string>
  isMobile: boolean
}

export function Step2Immigration({ data, onChange, errors, isMobile }: Props) {
  return (
    <div>
      <h2 style={{ fontFamily: SERIF, fontSize: 24, color: C.forest, margin: '0 0 6px' }}>Your immigration pathway</h2>
      <p style={{ fontSize: 14, color: C.gray, margin: '0 0 28px', lineHeight: 1.6, fontFamily: FONT }}>
        This determines which fees and program rules apply to your estimate.
      </p>

      <div style={{ marginBottom: 24 }}>
        <Label>Immigration pathway *</Label>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 10 }}>
          {PATHWAYS.map(p => (
            <button
              key={p.value}
              type="button"
              onClick={() => onChange('pathway', p.value)}
              aria-pressed={data.pathway === p.value}
              style={{
                padding: '16px 18px', borderRadius: 12, textAlign: 'left',
                border:     data.pathway === p.value ? `2px solid ${p.color}` : `1px solid ${C.border}`,
                background: data.pathway === p.value ? `${p.color}08` : C.white,
                cursor: 'pointer', transition: 'all 0.15s', fontFamily: FONT,
              }}
            >
              <span style={{ fontSize: 20, display: 'block', marginBottom: 6 }}>{p.icon}</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: C.forest, display: 'block', lineHeight: 1.3 }}>{p.label}</span>
              <span style={{ fontSize: 12, color: C.gray, display: 'block', marginTop: 3, lineHeight: 1.4 }}>{p.desc}</span>
            </button>
          ))}
        </div>
        {errors.pathway && (
          <p style={{ fontSize: 12, color: C.red, margin: '6px 0 0', fontFamily: FONT }}>{errors.pathway}</p>
        )}
      </div>

      <div style={{ marginBottom: 20 }}>
        <Label>Have you already paid your application fees?</Label>
        <Toggle value={data.feesPaid ?? false} onChange={v => onChange('feesPaid', v)} />
      </div>

      <div>
        <Label>Have you completed biometrics?</Label>
        <Toggle value={data.biometricsDone ?? false} onChange={v => onChange('biometricsDone', v)} />
      </div>
    </div>
  )
}
