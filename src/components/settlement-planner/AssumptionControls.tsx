'use client'

/**
 * AssumptionControls — US-21.2
 *
 * Collapsible panel (default collapsed) allowing a consultant to override
 * four default assumptions: runway months, safety buffer %, housing type,
 * and fees-paid status.
 *
 * Shows an amber "MODIFIED" badge when any assumption differs from default.
 * "Reset All to Defaults" appears when any override is active.
 */

import { useState } from 'react'
import {
  OVERRIDE_HOUSING_OPTIONS,
  type AssumptionOverrides,
  type OverrideHousingKey,
} from '@/hooks/useAssumptionOverrides'

const C = {
  forest: '#1B4F4A', accent: '#1B7A4A', gold: '#B8860B',
  border: '#E5E7EB', white: '#FFFFFF', text: '#374151',
  textLight: '#9CA3AF', gray: '#6B7280', lightGray: '#F3F4F6',
}
const FONT  = "'DM Sans', Helvetica, sans-serif"
const SERIF = "'DM Serif Display', Georgia, serif"

// ─── Slider control ───────────────────────────────────────────────────────────

interface SliderProps {
  label:    string
  value:    number
  min:      number
  max:      number
  suffix:   string
  modified: boolean
  onChange: (v: number) => void
}

function SliderControl({ label, value, min, max, suffix, modified, onChange }: SliderProps) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: C.text, fontFamily: FONT }}>
          {label}
          {modified && <ModifiedPip />}
        </span>
        <span style={{ fontSize: 12, fontWeight: 700, color: C.forest, fontFamily: FONT }}>
          {value}{suffix}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: '100%', accentColor: C.accent }}
        aria-label={`${label}: ${value}${suffix}`}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 9, color: C.textLight }}>{min}{suffix}</span>
        <span style={{ fontSize: 9, color: C.textLight }}>{max}{suffix}</span>
      </div>
    </div>
  )
}

// ─── Inline modified pip ──────────────────────────────────────────────────────

function ModifiedPip() {
  return (
    <span style={{
      display: 'inline-block', width: 6, height: 6, borderRadius: '50%',
      background: C.gold, marginLeft: 6, verticalAlign: 'middle',
    }} aria-label="modified"/>
  )
}

// ─── Toggle switch ────────────────────────────────────────────────────────────

interface ToggleProps {
  checked:  boolean
  label:    string
  modified: boolean
  onChange: (v: boolean) => void
}

function Toggle({ checked, label, modified, onChange }: ToggleProps) {
  return (
    <div
      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', cursor: 'pointer' }}
      onClick={() => onChange(!checked)}
      role="switch"
      aria-checked={checked}
      tabIndex={0}
      onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && onChange(!checked)}
    >
      {/* Track */}
      <div style={{
        width: 40, height: 22, borderRadius: 11, position: 'relative',
        background: checked ? C.accent : C.border,
        transition: 'background 0.2s', flexShrink: 0,
      }}>
        {/* Thumb */}
        <div style={{
          width: 18, height: 18, borderRadius: 9, background: C.white,
          position: 'absolute', top: 2, left: checked ? 20 : 2,
          transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
        }}/>
      </div>
      <span style={{ fontSize: 12, fontWeight: 600, color: C.text, fontFamily: FONT }}>
        {label}
        {modified && <ModifiedPip />}
      </span>
    </div>
  )
}

// ─── AssumptionControls ───────────────────────────────────────────────────────

interface Props {
  overrides:      AssumptionOverrides
  defaults:       AssumptionOverrides
  isModified:     boolean
  modifiedFields: Array<keyof AssumptionOverrides>
  setRunway:      (v: number) => void
  setBuffer:      (v: number) => void
  setHousing:     (v: OverrideHousingKey) => void
  setFeesPaid:    (v: boolean) => void
  resetAll:       () => void
}

export function AssumptionControls({
  overrides, defaults, isModified, modifiedFields,
  setRunway, setBuffer, setHousing, setFeesPaid, resetAll,
}: Props) {
  const [expanded, setExpanded] = useState(false)

  const isFieldModified = (field: keyof AssumptionOverrides) =>
    modifiedFields.includes(field)

  return (
    <div style={{
      background: C.white, borderRadius: 14, border: `1px solid ${C.border}`,
      overflow: 'hidden', marginBottom: 16,
    }}>
      {/* Collapsible header */}
      <button
        onClick={() => setExpanded(e => !e)}
        aria-expanded={expanded}
        style={{
          width: '100%', padding: '14px 20px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          cursor: 'pointer',
          background: isModified ? '#FFFBEB' : '#F8FAFC',
          borderBottom: expanded ? `1px solid ${C.border}` : 'none',
          border: 'none', textAlign: 'left', fontFamily: FONT,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 16 }} aria-hidden="true">⚙️</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: C.forest, fontFamily: SERIF }}>
            Assumption Controls
          </span>
          {isModified && (
            <span style={{
              fontSize: 9, fontWeight: 700, color: C.gold,
              background: '#FFFBEB', border: `1px solid ${C.gold}40`,
              padding: '1px 8px', borderRadius: 4,
            }}>
              MODIFIED
            </span>
          )}
        </div>
        <span style={{
          fontSize: 18, color: C.gray,
          transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.2s',
          display: 'inline-block',
        }} aria-hidden="true">
          ▾
        </span>
      </button>

      {/* Controls body */}
      {expanded && (
        <div style={{ padding: 24 }}>
          {/* Runway slider */}
          <SliderControl
            label="Runway months"
            value={overrides.runway}
            min={1}
            max={12}
            suffix=" mo"
            modified={isFieldModified('runway')}
            onChange={setRunway}
          />

          {/* Buffer slider */}
          <SliderControl
            label="Safety buffer"
            value={overrides.buffer}
            min={0}
            max={25}
            suffix="%"
            modified={isFieldModified('buffer')}
            onChange={setBuffer}
          />

          {/* Housing type buttons */}
          <div style={{ marginBottom: 16 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: C.text, fontFamily: FONT, display: 'block', marginBottom: 8 }}>
              Housing type
              {isFieldModified('housing') && <ModifiedPip />}
            </span>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {OVERRIDE_HOUSING_OPTIONS.map(({ key, label }) => {
                const isSelected = overrides.housing === key
                const isDefault  = defaults.housing === key
                return (
                  <button
                    key={key}
                    onClick={() => setHousing(key)}
                    aria-pressed={isSelected}
                    style={{
                      padding: '8px 14px', borderRadius: 8, fontSize: 12,
                      fontFamily: FONT, cursor: 'pointer',
                      border: `1px solid ${isSelected ? C.accent : C.border}`,
                      background: isSelected ? '#ECFDF5' : C.white,
                      color: isSelected ? C.accent : C.text,
                      fontWeight: isSelected ? 700 : 400,
                    }}
                  >
                    {label}
                    {isDefault && isSelected && (
                      <span style={{
                        fontSize: 8, fontWeight: 700, textTransform: 'uppercase',
                        color: '#2563EB', background: '#EFF6FF',
                        padding: '1px 5px', borderRadius: 3, marginLeft: 5,
                        verticalAlign: 'middle',
                      }}>
                        Default
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Fees paid toggle */}
          <Toggle
            checked={overrides.feesPaid}
            label="Application fees already paid"
            modified={isFieldModified('feesPaid')}
            onChange={setFeesPaid}
          />

          {/* Reset button */}
          {isModified && (
            <button
              onClick={resetAll}
              style={{
                marginTop: 16, padding: '8px 16px', borderRadius: 8,
                border: `1px solid ${C.border}`, background: C.white,
                color: C.gray, fontSize: 12, cursor: 'pointer', fontFamily: FONT,
              }}
            >
              Reset All to Defaults
            </button>
          )}
        </div>
      )}
    </div>
  )
}
