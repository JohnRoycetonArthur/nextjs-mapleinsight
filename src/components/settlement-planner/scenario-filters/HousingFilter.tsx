'use client'

import {
  CITY_DATA, HOUSING_MULT, HOUSING_LABELS,
  type CityKey, type HousingKey,
} from '@/lib/settlement-engine/scenario-builder-constants'

const C = {
  forest: '#1B4F4A', accent: '#1B7A4A',
  border: '#E5E7EB', white: '#FFFFFF', text: '#374151', textLight: '#9CA3AF',
  blue: '#2563EB',
}
const FONT = "'DM Sans', Helvetica, sans-serif"

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
  selected:  HousingKey
  baseline:  HousingKey
  city:      CityKey      // currently selected city, for adjusted rent preview
  onChange:  (housing: HousingKey) => void
}

export function HousingFilter({ selected, baseline, city, onChange }: Props) {
  const isChanged    = selected !== baseline
  const cityData     = CITY_DATA[city]
  const adjustedRent = Math.round(cityData.rent1br * HOUSING_MULT[selected])

  return (
    <div>
      {/* Section header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <span style={{ fontSize: 18 }} aria-hidden="true">🏢</span>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.forest, fontFamily: FONT }}>Housing Type</div>
          <div style={{ fontSize: 10, color: C.textLight }}>What housing arrangement?</div>
        </div>
      </div>

      {/* Housing pills */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {(Object.keys(HOUSING_LABELS) as HousingKey[]).map(key => {
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
              {HOUSING_LABELS[key]}
              {isCurrent && isSelected && <CurrentBadge />}
            </button>
          )
        })}
      </div>

      {/* Info bar when non-baseline housing selected */}
      {isChanged && (
        <div style={{
          marginTop: 8, padding: '8px 12px', borderRadius: 8, fontSize: 11,
          background: selected === 'family-friends' ? '#EFF6FF' : '#ECFDF5',
          color:      selected === 'family-friends' ? C.blue    : C.accent,
        }}>
          {selected === 'family-friends'
            ? '🏡 Staying with family or friends — rent and housing deposit set to $0. This is the highest-impact cost reduction available.'
            : `Adjusted rent: ${fmt(adjustedRent)}/mo`
          }
        </div>
      )}
    </div>
  )
}
