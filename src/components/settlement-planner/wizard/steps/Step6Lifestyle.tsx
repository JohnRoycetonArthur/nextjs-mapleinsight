'use client'

import { C, FONT, SERIF } from '../constants'
import type { WizardAnswers } from '../../SettlementSessionContext'

const Label = ({ children }: { children: React.ReactNode }) => (
  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 8, fontFamily: FONT }}>{children}</label>
)
const Helper = ({ children }: { children: React.ReactNode }) => (
  <p style={{ fontSize: 12, color: C.textLight, margin: '4px 0 0', lineHeight: 1.5, fontFamily: FONT }}>{children}</p>
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

const HOUSING = [
  { value: 'studio', label: 'Studio',      icon: '🏢' },
  { value: '1br',    label: '1 Bedroom',   icon: '🛏️' },
  { value: '2br',    label: '2 Bedrooms',  icon: '🏠' },
  { value: '3br',    label: '3+ Bedrooms', icon: '🏡' },
]

const FURNISHING = [
  { value: 'minimal',  label: 'Minimal',          desc: 'Basics only — ~$500 setup'          },
  { value: 'moderate', label: 'Moderate',          desc: 'Comfortable start — ~$1,500 setup'  },
  { value: 'full',     label: 'Fully furnished',   desc: 'Everything you need — ~$3,000 setup' },
]

// ─── XIcon ────────────────────────────────────────────────────────────────────

const XIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)
const PlusIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
)

interface Props {
  data:        WizardAnswers
  onChange:    (key: keyof WizardAnswers, value: unknown) => void
  errors:      Record<string, string>
  isMobile:    boolean
  hasChildren: boolean
}

export function Step6Lifestyle({ data, onChange, errors, isMobile, hasChildren }: Props) {
  const inputBase: React.CSSProperties = {
    padding: '8px 12px', borderRadius: 8, border: `1px solid ${C.border}`,
    fontSize: 14, fontFamily: FONT, color: C.text, outline: 'none', background: C.white,
  }

  return (
    <div>
      <h2 style={{ fontFamily: SERIF, fontSize: 24, color: C.forest, margin: '0 0 6px' }}>Lifestyle & setup preferences</h2>
      <p style={{ fontSize: 14, color: C.gray, margin: '0 0 28px', lineHeight: 1.6, fontFamily: FONT }}>
        These preferences shape your estimated monthly costs and initial setup budget.
      </p>

      {/* Housing type */}
      <div style={{ marginBottom: 24 }}>
        <Label>Preferred housing type *</Label>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: 10 }}>
          {HOUSING.map(h => (
            <button
              key={h.value}
              type="button"
              onClick={() => onChange('housing', h.value)}
              aria-pressed={data.housing === h.value}
              style={{
                padding: '14px 12px', borderRadius: 12, textAlign: 'center',
                border:     data.housing === h.value ? `2px solid ${C.accent}` : `1px solid ${C.border}`,
                background: data.housing === h.value ? `${C.accent}08` : C.white,
                cursor: 'pointer', fontFamily: FONT, transition: 'all 0.15s',
              }}
            >
              <span style={{ fontSize: 22, display: 'block', marginBottom: 4 }}>{h.icon}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: C.forest }}>{h.label}</span>
            </button>
          ))}
        </div>
        {errors.housing && <p style={{ fontSize: 12, color: C.red, margin: '6px 0 0', fontFamily: FONT }}>{errors.housing}</p>}
      </div>

      {/* Furnishing level */}
      <div style={{ marginBottom: 24 }}>
        <Label>Furnishing level *</Label>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: 10 }}>
          {FURNISHING.map(f => (
            <button
              key={f.value}
              type="button"
              onClick={() => onChange('furnishing', f.value)}
              aria-pressed={data.furnishing === f.value}
              style={{
                padding: '16px 18px', borderRadius: 12, textAlign: 'left',
                border:     data.furnishing === f.value ? `2px solid ${C.accent}` : `1px solid ${C.border}`,
                background: data.furnishing === f.value ? `${C.accent}08` : C.white,
                cursor: 'pointer', fontFamily: FONT, transition: 'all 0.15s',
              }}
            >
              <span style={{ fontSize: 14, fontWeight: 700, color: C.forest, display: 'block' }}>{f.label}</span>
              <span style={{ fontSize: 12, color: C.gray, display: 'block', marginTop: 3 }}>{f.desc}</span>
            </button>
          ))}
        </div>
        {errors.furnishing && <p style={{ fontSize: 12, color: C.red, margin: '6px 0 0', fontFamily: FONT }}>{errors.furnishing}</p>}
      </div>

      {/* Childcare (only if has children) */}
      {hasChildren && (
        <div style={{ marginBottom: 20 }}>
          <Label>Will you need childcare?</Label>
          <Toggle value={data.childcare ?? false} onChange={v => onChange('childcare', v)} />
          {data.childcare && <Helper>Estimated childcare cost: ~$1,200/month (varies by city).</Helper>}
        </div>
      )}

      {/* Car */}
      <div style={{ marginBottom: 20 }}>
        <Label>Planning to own a car?</Label>
        <Toggle value={data.car ?? false} onChange={v => onChange('car', v)} />
        {data.car && <Helper>Estimated car cost: ~$600/month (insurance, gas, maintenance).</Helper>}
      </div>

      {/* Custom expenses */}
      <div>
        <Label>Any other monthly expenses?</Label>
        {(data.customExpenses ?? []).map((exp, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Label (e.g. Language classes)"
              value={exp.label}
              onChange={e => {
                const next = [...(data.customExpenses ?? [])]
                next[i] = { ...next[i], label: e.target.value }
                onChange('customExpenses', next)
              }}
              style={{ ...inputBase, flex: 1, maxWidth: 200 }}
            />
            <div style={{ position: 'relative', flex: '0 0 140px' }}>
              <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: C.textLight, fontFamily: FONT, pointerEvents: 'none' }}>CAD $</span>
              <input
                type="text"
                inputMode="decimal"
                placeholder="0"
                value={exp.amount}
                onChange={e => {
                  const next = [...(data.customExpenses ?? [])]
                  next[i] = { ...next[i], amount: e.target.value.replace(/[^0-9.,]/g, '') }
                  onChange('customExpenses', next)
                }}
                style={{ ...inputBase, width: '100%', paddingLeft: 48 }}
              />
            </div>
            <button
              type="button"
              onClick={() => onChange('customExpenses', (data.customExpenses ?? []).filter((_, idx) => idx !== i))}
              aria-label="Remove expense"
              style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${C.border}`, background: C.white, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.red, flexShrink: 0 }}
            >
              <XIcon />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => onChange('customExpenses', [...(data.customExpenses ?? []), { label: '', amount: '' }])}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: `1px dashed ${C.border}`, background: 'transparent', color: C.accent, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: FONT }}
        >
          <PlusIcon /> Add expense
        </button>
      </div>
    </div>
  )
}
