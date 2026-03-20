'use client'

import { C, FONT, SERIF } from '../constants'
import type { WizardAnswers } from '../../SettlementSessionContext'

const Label = ({ children }: { children: React.ReactNode }) => (
  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 8, fontFamily: FONT }}>{children}</label>
)

const CITIES = [
  { value: 'toronto',  label: 'Toronto',   province: 'Ontario',          rent: '$1,761', transit: '$156', color: C.accent  },
  { value: 'vancouver',label: 'Vancouver', province: 'British Columbia', rent: '$1,807', transit: '$112', color: C.blue    },
  { value: 'calgary',  label: 'Calgary',   province: 'Alberta',          rent: '$1,581', transit: '$126', color: C.gold    },
  { value: 'montreal', label: 'Montréal',  province: 'Quebec',           rent: '$1,131', transit: '$105', color: C.purple  },
  { value: 'ottawa',   label: 'Ottawa',    province: 'Ontario',          rent: '$1,593', transit: '$139', color: C.accent  },
  { value: 'halifax',  label: 'Halifax',   province: 'Nova Scotia',      rent: '$1,539', transit: '$90',  color: C.red     },
  { value: 'winnipeg', label: 'Winnipeg',  province: 'Manitoba',         rent: '$1,232', transit: '$119', color: C.forest  },
  { value: 'other',    label: 'Other City',province: null,               rent: null,     transit: null,   color: C.gray    },
]

const TRANSIT_OPTIONS = [
  { value: 'public', label: 'Public Transit', icon: '🚇' },
  { value: 'car',    label: 'Car',             icon: '🚗' },
  { value: 'both',   label: 'Both',            icon: '🚇🚗' },
]

const PROVINCES = [
  'Ontario','British Columbia','Alberta','Quebec','Manitoba',
  'Saskatchewan','Nova Scotia','New Brunswick','Newfoundland','PEI','NWT','Nunavut','Yukon',
]

const selectStyle: React.CSSProperties = {
  width: '100%', maxWidth: 260, padding: '12px 16px', borderRadius: 10,
  border: `1px solid ${C.border}`, fontSize: 14, fontFamily: FONT, color: C.text,
  background: C.white, outline: 'none',
}

interface Props {
  data:     WizardAnswers
  onChange: (key: keyof WizardAnswers, value: unknown) => void
  errors:   Record<string, string>
  isMobile: boolean
}

export function Step3Destination({ data, onChange, errors, isMobile }: Props) {
  const selected = CITIES.find(c => c.value === data.city)

  return (
    <div>
      <h2 style={{ fontFamily: SERIF, fontSize: 24, color: C.forest, margin: '0 0 6px' }}>Where are you heading?</h2>
      <p style={{ fontSize: 14, color: C.gray, margin: '0 0 28px', lineHeight: 1.6, fontFamily: FONT }}>
        Cost estimates are based on official data for your destination city.
      </p>

      <div style={{ marginBottom: 20 }}>
        <Label>Select your destination city *</Label>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr 1fr 1fr 1fr', gap: 8 }}>
          {CITIES.map(c => (
            <button
              key={c.value}
              type="button"
              onClick={() => onChange('city', c.value)}
              aria-pressed={data.city === c.value}
              style={{
                padding: '14px 12px', borderRadius: 10, textAlign: 'center',
                border:     data.city === c.value ? `2px solid ${c.color}` : `1px solid ${C.border}`,
                background: data.city === c.value ? `${c.color}08` : C.white,
                cursor: 'pointer', fontFamily: FONT, transition: 'all 0.15s',
              }}
            >
              <span style={{ fontSize: 14, fontWeight: 700, color: data.city === c.value ? c.color : C.forest, display: 'block' }}>{c.label}</span>
              {c.province && <span style={{ fontSize: 11, color: C.textLight }}>{c.province}</span>}
            </button>
          ))}
        </div>
        {errors.city && (
          <p style={{ fontSize: 12, color: C.red, margin: '6px 0 0', fontFamily: FONT }}>{errors.city}</p>
        )}
      </div>

      {/* Baseline preview for known cities */}
      {selected?.rent && (
        <div style={{
          background: `${selected.color}06`, border: `1px solid ${selected.color}20`,
          borderRadius: 12, padding: '16px 20px', marginBottom: 20,
          display: 'flex', gap: 24, flexWrap: 'wrap',
        }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: C.textLight, textTransform: 'uppercase', letterSpacing: 0.5 }}>Avg. 1BR Rent</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: selected.color, fontFamily: SERIF }}>{selected.rent}/mo</div>
            <div style={{ fontSize: 10, color: C.textLight }}>Source: CMHC Oct 2025</div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: C.textLight, textTransform: 'uppercase', letterSpacing: 0.5 }}>Transit Pass</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: selected.color, fontFamily: SERIF }}>{selected.transit}/mo</div>
            <div style={{ fontSize: 10, color: C.textLight }}>Source: Transit agency</div>
          </div>
        </div>
      )}

      {/* Province select for "Other" */}
      {data.city === 'other' && (
        <div style={{ background: '#FDF6E3', borderRadius: 10, padding: '14px 16px', marginBottom: 20, border: `1px solid ${C.gold}20` }}>
          <p style={{ fontSize: 12, color: C.gold, margin: '0 0 10px', fontWeight: 600, fontFamily: FONT }}>
            Estimates will use conservative national averages for unlisted cities.
          </p>
          <Label>Select your province</Label>
          <select value={data.province ?? ''} onChange={e => onChange('province', e.target.value)} style={selectStyle}>
            <option value="">Select province</option>
            {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      )}

      <div>
        <Label>How will you get around?</Label>
        <div style={{ display: 'flex', gap: 10 }}>
          {TRANSIT_OPTIONS.map(o => (
            <button
              key={o.value}
              type="button"
              onClick={() => onChange('transitMode', o.value)}
              aria-pressed={data.transitMode === o.value}
              style={{
                flex: 1, padding: '14px 12px', borderRadius: 12, textAlign: 'center',
                border:     data.transitMode === o.value ? `2px solid ${C.accent}` : `1px solid ${C.border}`,
                background: data.transitMode === o.value ? `${C.accent}08` : C.white,
                cursor: 'pointer', fontFamily: FONT, transition: 'all 0.15s',
              }}
            >
              <span style={{ fontSize: 20, display: 'block', marginBottom: 4 }}>{o.icon}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: C.forest }}>{o.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
