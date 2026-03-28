'use client'

import { CITY_DATA, type CityKey } from '@/lib/settlement-engine/scenario-builder-constants'

const C = {
  forest: '#1B4F4A', accent: '#1B7A4A',
  border: '#E5E7EB', white: '#FFFFFF', text: '#374151', textLight: '#9CA3AF',
  blue: '#2563EB',
}
const FONT = "'DM Sans', Helvetica, sans-serif"
const SERIF = "'DM Serif Display', Georgia, serif"

const fmt = (n: number) =>
  new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(n)

function CurrentBadge() {
  return (
    <span style={{
      fontSize: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5,
      color: C.blue, background: '#EFF6FF', padding: '2px 6px', borderRadius: 3,
      marginLeft: 6, verticalAlign: 'middle',
    }}>
      Current
    </span>
  )
}

interface Props {
  selected:  CityKey
  baseline:  CityKey
  onChange:  (city: CityKey) => void
}

export function DestinationFilter({ selected, baseline, onChange }: Props) {
  const isChanged = selected !== baseline
  const baselineData = CITY_DATA[baseline]
  const selectedData = CITY_DATA[selected]

  return (
    <div>
      {/* Section header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <span style={{ fontSize: 18 }} aria-hidden="true">📍</span>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.forest, fontFamily: FONT }}>Destination</div>
          <div style={{ fontSize: 10, color: C.textLight }}>Where will the client settle?</div>
        </div>
      </div>

      {/* City pills */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {(Object.keys(CITY_DATA) as CityKey[]).map(key => {
          const isSelected = selected === key
          const isCurrent  = baseline === key
          return (
            <button
              key={key}
              onClick={() => onChange(key)}
              style={{
                padding: '8px 14px', borderRadius: 10, fontSize: 12, fontFamily: FONT,
                cursor: 'pointer',
                border: `2px solid ${isSelected ? C.accent : C.border}`,
                background: isSelected ? '#ECFDF5' : C.white,
                color: isSelected ? C.accent : C.text,
                fontWeight: isSelected ? 700 : 400,
                transition: 'all 0.15s',
              }}
              aria-pressed={isSelected}
            >
              {CITY_DATA[key].label}
              {isCurrent && isSelected && <CurrentBadge />}
            </button>
          )
        })}
      </div>

      {/* Inline rent preview when non-baseline city selected */}
      {isChanged && (
        <div style={{
          marginTop: 8, padding: '8px 12px', background: '#ECFDF5', borderRadius: 8,
          fontSize: 11, color: C.accent,
        }}>
          🏠 1BR rent in {selectedData.label}: {fmt(selectedData.rent1br)}/mo
          {' '}(vs {fmt(baselineData.rent1br)} in {baselineData.label})
          {baselineData.rent1br !== selectedData.rent1br && (
            <>
              {' '}— {baselineData.rent1br > selectedData.rent1br
                ? `saves ${fmt(baselineData.rent1br - selectedData.rent1br)}/mo`
                : `costs ${fmt(selectedData.rent1br - baselineData.rent1br)}/mo more`
              }
            </>
          )}
        </div>
      )}
    </div>
  )
}
