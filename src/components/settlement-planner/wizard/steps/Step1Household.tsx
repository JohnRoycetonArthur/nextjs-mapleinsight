'use client'

/**
 * Step 1: Household Information (US-11.2)
 *
 * Collects: adults (1–6), children (0–10), arrival window (dropdown).
 * Validates on blur (arrival) and on Next click (via WizardShell).
 * Stepper touch targets are 44×44px minimum (TC-3).
 */

import { useState } from 'react'
import { C, FONT, SERIF } from '../constants'
import { CountrySearch } from '../CountrySearch'
import type { WizardAnswers } from '../../SettlementSessionContext'

// ─── Departure region options ─────────────────────────────────────────────────

const DEPARTURE_REGIONS = [
  { code: 'north-america',    label: 'USA / Mexico / Caribbean'       },
  { code: 'south-america',    label: 'South & Central America'        },
  { code: 'uk-europe',        label: 'UK / Europe'                    },
  { code: 'south-asia',       label: 'South Asia'                     },
  { code: 'east-se-asia',     label: 'East & Southeast Asia'          },
  { code: 'africa-west-east', label: 'West & East Africa'             },
  { code: 'africa-south',     label: 'Southern Africa'                },
  { code: 'middle-east-na',   label: 'Middle East / North Africa'     },
  { code: 'domestic',         label: 'Within Canada'                  },
]

// ─── Label ────────────────────────────────────────────────────────────────────

const Label = ({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) => (
  <label
    htmlFor={htmlFor}
    style={{ display: 'block', fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 8, fontFamily: FONT }}
  >
    {children}
  </label>
)

// ─── Stepper — 44×44px touch targets (TC-3) ───────────────────────────────────

interface StepperProps {
  id?:      string
  value:    number
  onChange: (v: number) => void
  min?:     number
  max?:     number
  color?:   string
  label:    string   // e.g. "adults" — used to build accessible button labels
}

function Stepper({ id, value, onChange, min = 0, max = 10, color = C.accent, label }: StepperProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }} id={id}>
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        aria-label={`Decrease ${label}`}
        style={{
          width: 44, height: 44, borderRadius: 10,
          border:     `1px solid ${value <= min ? C.border : C.border}`,
          background: C.white,
          fontSize: 20, cursor: value <= min ? 'default' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: value <= min ? C.textLight : C.text,
          fontFamily: FONT,
          opacity: value <= min ? 0.4 : 1,
          transition: 'opacity 0.15s',
        }}
      >−</button>

      <span
        aria-live="polite"
        aria-atomic="true"
        style={{ fontSize: 24, fontWeight: 700, color: C.forest, minWidth: 32, textAlign: 'center', fontFamily: SERIF }}
      >
        {value}
      </span>

      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        aria-label={`Increase ${label}`}
        style={{
          width: 44, height: 44, borderRadius: 10,
          border:     `1px solid ${value >= max ? C.border : color}`,
          background: value >= max ? C.white : `${color}10`,
          fontSize: 20, cursor: value >= max ? 'default' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color:   value >= max ? C.textLight : color,
          fontFamily: FONT,
          opacity: value >= max ? 0.4 : 1,
          transition: 'all 0.15s',
        }}
      >+</button>
    </div>
  )
}

// ─── Step 1: Household ────────────────────────────────────────────────────────

interface Props {
  data:     WizardAnswers
  onChange: (key: keyof WizardAnswers, value: unknown) => void
  /** Errors injected by WizardShell on Next click */
  errors:   Record<string, string>
}

export function Step1Household({ data, onChange, errors }: Props) {
  // Blur-triggered local validation state (AC-4)
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  const arrivalError =
    (touched.arrival || errors.arrival) && !data.arrival
      ? (errors.arrival ?? 'Please select your planned arrival window.')
      : errors.arrival

  const regionError =
    (touched.region || errors.departureRegion) && !data.departureRegion
      ? (errors.departureRegion ?? 'Please select where your household is travelling from.')
      : errors.departureRegion

  const countryError = errors.countryOfOrigin

  const [selectFocused, setSelectFocused] = useState(false)
  const [regionFocused, setRegionFocused] = useState(false)

  return (
    <div>
      <h2 style={{ fontFamily: SERIF, fontSize: 24, color: C.forest, margin: '0 0 6px' }}>
        Tell us about your household
      </h2>
      <p style={{ fontSize: 14, color: C.gray, margin: '0 0 28px', lineHeight: 1.6, fontFamily: FONT }}>
        This helps us estimate costs based on your family size and arrival timeline.
      </p>

      {/* ── Adults ────────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 28 }}>
        <Label htmlFor="stepper-adults">Number of adults</Label>
        <Stepper
          id="stepper-adults"
          value={data.adults ?? 1}
          onChange={v => onChange('adults', v)}
          min={1}
          max={6}
          color={C.accent}
          label="number of adults"
        />
        <p style={{ fontSize: 12, color: C.textLight, margin: '6px 0 0', fontFamily: FONT }}>
          Minimum 1 adult required.
        </p>
      </div>

      {/* ── Children ──────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 28 }}>
        <Label htmlFor="stepper-children">Number of children / dependents</Label>
        <Stepper
          id="stepper-children"
          value={data.children ?? 0}
          onChange={v => onChange('children', v)}
          min={0}
          max={10}
          color={C.accent}
          label="number of children"
        />
        <p style={{ fontSize: 12, color: C.textLight, margin: '6px 0 0', fontFamily: FONT, lineHeight: 1.5 }}>
          IRCC counts <strong>all</strong> dependents — including a spouse and children who are <em>not</em> accompanying you to Canada.
        </p>
      </div>

      {/* ── Arrival window ────────────────────────────────────────────────── */}
      <div>
        <Label htmlFor="arrival-select">When do you plan to arrive? *</Label>
        <select
          id="arrival-select"
          value={data.arrival ?? ''}
          onChange={e => {
            onChange('arrival', e.target.value)
            // Clear blur-touched once value is set
            if (e.target.value) setTouched(prev => ({ ...prev, arrival: false }))
          }}
          onBlur={() => {
            setTouched(prev => ({ ...prev, arrival: true }))
            // Explicit blur validation (AC-4)
            if (!data.arrival) {
              // The error display is driven by `arrivalError` below
            }
          }}
          onFocus={() => setSelectFocused(true)}
          style={{
            width: '100%', maxWidth: 340,
            padding: '12px 16px', borderRadius: 10,
            border: `1px solid ${arrivalError ? C.red : selectFocused ? C.accent : C.border}`,
            boxShadow: selectFocused ? `0 0 0 3px ${C.forest}18` : 'none',
            fontSize: 14, fontFamily: FONT, color: data.arrival ? C.text : C.textLight,
            background: C.white, outline: 'none',
            transition: 'border-color 0.2s, box-shadow 0.2s',
          }}
          aria-required="true"
          aria-invalid={!!arrivalError}
          aria-describedby={arrivalError ? 'arrival-error' : undefined}
        >
          <option value="">Select arrival window</option>
          <option value="within_30">Within 30 days</option>
          <option value="1_3_months">1–3 months</option>
          <option value="3_6_months">3–6 months</option>
          <option value="6_12_months">6–12 months</option>
          <option value="12_plus">12+ months</option>
        </select>

        {arrivalError && (
          <p id="arrival-error" role="alert" style={{ fontSize: 12, color: C.red, margin: '6px 0 0', fontFamily: FONT }}>
            {arrivalError}
          </p>
        )}
      </div>

      {/* ── Departure region ──────────────────────────────────────────────── */}
      <div style={{ marginTop: 28 }}>
        <Label htmlFor="region-select">Where is your household travelling from? *</Label>
        <select
          id="region-select"
          value={data.departureRegion ?? ''}
          onChange={e => {
            onChange('departureRegion', e.target.value)
            if (e.target.value) setTouched(prev => ({ ...prev, region: false }))
          }}
          onBlur={() => setTouched(prev => ({ ...prev, region: true }))}
          onFocus={() => setRegionFocused(true)}
          style={{
            width: '100%', maxWidth: 340,
            padding: '12px 16px', borderRadius: 10,
            border: `1px solid ${regionError ? C.red : regionFocused ? C.accent : C.border}`,
            boxShadow: regionFocused ? `0 0 0 3px ${C.forest}18` : 'none',
            fontSize: 14, fontFamily: FONT, color: data.departureRegion ? C.text : C.textLight,
            background: C.white, outline: 'none',
            transition: 'border-color 0.2s, box-shadow 0.2s',
          }}
          aria-required="true"
          aria-invalid={!!regionError}
          aria-describedby={regionError ? 'region-error' : 'region-helper'}
        >
          <option value="">Select departure region</option>
          {DEPARTURE_REGIONS.map(r => (
            <option key={r.code} value={r.code}>{r.label}</option>
          ))}
        </select>
        {regionError ? (
          <p id="region-error" role="alert" style={{ fontSize: 12, color: C.red, margin: '6px 0 0', fontFamily: FONT }}>
            {regionError}
          </p>
        ) : (
          <p id="region-helper" style={{ fontSize: 12, color: C.textLight, margin: '6px 0 0', fontFamily: FONT }}>
            This helps us estimate your flight cost to Canada.
          </p>
        )}
      </div>

      {/* ── Country of origin (US-3.1) ────────────────────────────────────── */}
      <div style={{
        marginTop: 28, padding: 20,
        background: `${C.accent}06`, borderRadius: 14,
        border: `1px dashed ${C.accent}40`,
      }}>
        <label
          style={{ display: 'block', fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 4, fontFamily: FONT }}
          id="country-of-origin-label"
        >
          Country of origin *
        </label>
        <p style={{ fontSize: 12, color: C.gray, fontFamily: FONT, marginBottom: 14, lineHeight: 1.5, marginTop: 0 }}>
          Some costs (medical exam, police clearance, language tests) vary significantly by country.
          We use this to personalize your estimate.
        </p>
        <CountrySearch
          value={data.countryOfOrigin ?? ''}
          onChange={iso => onChange('countryOfOrigin', iso)}
          error={countryError}
        />
        <p style={{ fontSize: 11, color: C.textLight, fontFamily: FONT, marginTop: 14, marginBottom: 0, lineHeight: 1.55 }}>
          Stored as an ISO-3166-1 alpha-2 code in your session. Used only to look up country-specific
          costs — never shared.
        </p>
      </div>
    </div>
  )
}
