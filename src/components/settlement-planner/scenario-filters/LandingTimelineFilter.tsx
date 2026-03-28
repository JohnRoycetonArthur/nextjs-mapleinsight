'use client'

import { DELAY_OPTIONS, type DelayKey } from '@/lib/settlement-engine/scenario-builder-constants'

const C = {
  forest: '#1B4F4A', accent: '#1B7A4A', gold: '#B8860B',
  border: '#E5E7EB', white: '#FFFFFF', text: '#374151', textLight: '#9CA3AF',
  lightGray: '#F3F4F6', gray: '#6B7280', blue: '#2563EB',
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
  selected:       DelayKey
  monthlySavings: number
  baselineSavings: number
  effectiveSavings: number   // computed by the hook
  onChange:       (delay: DelayKey) => void
  onSavingsChange: (amount: number) => void
}

export function LandingTimelineFilter({
  selected, monthlySavings, baselineSavings, effectiveSavings,
  onChange, onSavingsChange,
}: Props) {
  const delayOption   = DELAY_OPTIONS.find(d => d.key === selected)!
  const delaySavings  = delayOption.months * monthlySavings
  const hasDelay      = selected !== 'now'

  return (
    <div>
      {/* Section header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <span style={{ fontSize: 18 }} aria-hidden="true">⏳</span>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.forest, fontFamily: FONT }}>
            Landing Timeline &amp; Savings Capacity
          </div>
          <div style={{ fontSize: 10, color: C.textLight }}>
            When will the client arrive, and how much can they save while waiting?
          </div>
        </div>
      </div>

      {/* Delay pills */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        {DELAY_OPTIONS.map(opt => {
          const isSelected = selected === opt.key
          const isCurrent  = opt.key === 'now'
          return (
            <button
              key={opt.key}
              onClick={() => onChange(opt.key)}
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
              {opt.label}
              {isCurrent && isSelected && <CurrentBadge />}
            </button>
          )
        })}
      </div>

      {/* Monthly savings input — always visible */}
      <div style={{
        padding: '14px 16px', background: '#FFFBEB', borderRadius: 10,
        border: `1px solid ${C.gold}30`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: hasDelay ? 8 : 0 }}>
          <label
            htmlFor="monthly-savings-input"
            style={{ fontSize: 12, fontWeight: 600, color: C.text, fontFamily: FONT, whiteSpace: 'nowrap' }}
          >
            Monthly savings capacity:
          </label>
          <div style={{
            display: 'flex', alignItems: 'center',
            border: `1px solid ${C.border}`, borderRadius: 8, overflow: 'hidden',
          }}>
            <span style={{
              padding: '6px 10px', background: C.lightGray,
              fontSize: 11, fontWeight: 600, color: C.gray,
              borderRight: `1px solid ${C.border}`,
            }}>
              CAD $
            </span>
            <input
              id="monthly-savings-input"
              type="number"
              value={monthlySavings}
              min={0}
              onChange={e => onSavingsChange(Math.max(0, Number(e.target.value)))}
              style={{
                width: 80, padding: '6px 10px', border: 'none', outline: 'none',
                fontSize: 13, fontFamily: FONT, color: C.text,
              }}
            />
          </div>
          <span style={{ fontSize: 10, color: C.textLight }}>/month</span>
        </div>

        {/* When delay selected: show calculation */}
        {hasDelay && (
          <>
            <div style={{ fontSize: 11, color: C.gold, fontWeight: 600 }}>
              💰 {delayOption.months} months × {fmt(monthlySavings)}/mo = {fmt(delaySavings)} additional savings before arrival
            </div>
            <div style={{ fontSize: 10, color: C.textLight, marginTop: 4 }}>
              Available funds: {fmt(baselineSavings)} → {fmt(effectiveSavings)}
            </div>
          </>
        )}

        {/* When "arrive now" and savings > 0: helper note */}
        {!hasDelay && monthlySavings > 0 && (
          <div style={{ fontSize: 10, color: C.textLight, marginTop: 4 }}>
            Select a delayed timeline above to see the impact of saving {fmt(monthlySavings)}/mo before arrival.
          </div>
        )}
      </div>
    </div>
  )
}
