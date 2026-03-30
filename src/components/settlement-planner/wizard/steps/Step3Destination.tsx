'use client'

/**
 * Step 3: Destination (US-11.4)
 *
 * Collects: destination city (7 supported + "Other"), province (auto-populated
 * for known cities; manual dropdown for "Other"), transit mode.
 *
 * On mount, fetches live cityBaseline data from Sanity for all 7 supported
 * cities in a single GROQ query. While fetching, the hardcoded CMHC figures
 * are shown as placeholders so the UI is never blank (graceful degradation).
 *
 * Selecting a city auto-populates the province code in session state (AC-2).
 * "Other" shows province dropdown + national-averages warning (AC-3).
 */

import { useEffect, useState } from 'react'
import { createClient } from '@sanity/client'
import { apiVersion, dataset, projectId } from '@/sanity/env'
import {
  Commute,
  DirectionsCar,
  DirectionsSubway,
  Warning,
} from '@material-symbols-svg/react'
import { C, FONT, SERIF } from '../constants'
import type { WizardAnswers } from '../../SettlementSessionContext'

// ─── Sanity client (CDN, read-only, client-safe — uses NEXT_PUBLIC_ vars) ────

const sanityClient = createClient({ projectId, dataset, apiVersion, useCdn: true })

// ─── City configuration ───────────────────────────────────────────────────────

interface CityConfig {
  value:        string
  label:        string
  provinceCode: string
  provinceName: string
  sanityName:   string   // exact cityName stored in Sanity
  color:        string
  // Hardcoded CMHC fallback values — shown while Sanity fetch is in-flight
  fallbackRent1BR:   number
  fallbackTransit:   number
}

const CITIES: CityConfig[] = [
  { value: 'toronto',   label: 'Toronto',   provinceCode: 'ON', provinceName: 'Ontario',          sanityName: 'Toronto',   color: C.accent, fallbackRent1BR: 1_761, fallbackTransit: 156 },
  { value: 'vancouver', label: 'Vancouver', provinceCode: 'BC', provinceName: 'British Columbia', sanityName: 'Vancouver', color: C.blue,   fallbackRent1BR: 1_807, fallbackTransit: 112 },
  { value: 'calgary',   label: 'Calgary',   provinceCode: 'AB', provinceName: 'Alberta',          sanityName: 'Calgary',   color: C.gold,   fallbackRent1BR: 1_581, fallbackTransit: 126 },
  { value: 'montreal',  label: 'Montréal',  provinceCode: 'QC', provinceName: 'Quebec',           sanityName: 'Montreal',  color: C.purple, fallbackRent1BR: 1_131, fallbackTransit: 105 },
  { value: 'ottawa',    label: 'Ottawa',    provinceCode: 'ON', provinceName: 'Ontario',          sanityName: 'Ottawa',    color: C.accent, fallbackRent1BR: 1_593, fallbackTransit: 139 },
  { value: 'halifax',   label: 'Halifax',   provinceCode: 'NS', provinceName: 'Nova Scotia',      sanityName: 'Halifax',   color: C.red,    fallbackRent1BR: 1_539, fallbackTransit:  90 },
  { value: 'winnipeg',  label: 'Winnipeg',  provinceCode: 'MB', provinceName: 'Manitoba',         sanityName: 'Winnipeg',  color: C.forest, fallbackRent1BR: 1_232, fallbackTransit: 119 },
]

const PROVINCE_OPTIONS = [
  { code: 'ON', name: 'Ontario' },
  { code: 'BC', name: 'British Columbia' },
  { code: 'AB', name: 'Alberta' },
  { code: 'QC', name: 'Quebec' },
  { code: 'MB', name: 'Manitoba' },
  { code: 'SK', name: 'Saskatchewan' },
  { code: 'NS', name: 'Nova Scotia' },
  { code: 'NB', name: 'New Brunswick' },
  { code: 'NL', name: 'Newfoundland & Labrador' },
  { code: 'PE', name: 'Prince Edward Island' },
  { code: 'NT', name: 'Northwest Territories' },
  { code: 'NU', name: 'Nunavut' },
  { code: 'YT', name: 'Yukon' },
]

const TRANSIT_OPTIONS = [
  { value: 'public', label: 'Public Transit', icon: <DirectionsSubway size={20} color={C.accent} /> },
  { value: 'car',    label: 'Car',             icon: <DirectionsCar size={20} color={C.accent} /> },
  { value: 'both',   label: 'Both',            icon: <Commute size={20} color={C.accent} /> },
]

// ─── Live baseline data shape (from Sanity) ───────────────────────────────────

interface LiveBaseline {
  cityName:           string
  avgRent1BR:         number
  monthlyTransitPass: number
  source:             string
  effectiveDate:      string
}

// ─── Label ────────────────────────────────────────────────────────────────────

const Label = ({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) => (
  <label
    htmlFor={htmlFor}
    style={{ display: 'block', fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 8, fontFamily: FONT }}
  >
    {children}
  </label>
)

// ─── Format currency helper ───────────────────────────────────────────────────

function fmtCAD(n: number): string {
  return `$${n.toLocaleString('en-CA')}`
}

// ─── Step 3: Destination ──────────────────────────────────────────────────────

interface Props {
  data:     WizardAnswers
  onChange: (key: keyof WizardAnswers, value: unknown) => void
  errors:   Record<string, string>
  isMobile: boolean
}

export function Step3Destination({ data, onChange, errors, isMobile }: Props) {
  // Task 2: Live Sanity baselines keyed by lowercase city name
  const [liveBaselines, setLiveBaselines] = useState<Record<string, LiveBaseline>>({})
  const [loadingBaselines, setLoadingBaselines] = useState(true)

  // Fetch all 7 city baselines in a single GROQ query on mount
  useEffect(() => {
    const names = CITIES.map(c => c.sanityName)
    sanityClient
      .fetch<LiveBaseline[]>(
        `*[_type == "cityBaseline" && cityName in $names] {
          cityName, avgRent1BR, monthlyTransitPass, source, effectiveDate
        }`,
        { names },
      )
      .then(results => {
        const map: Record<string, LiveBaseline> = {}
        for (const r of results) {
          map[r.cityName.toLowerCase()] = r
        }
        setLiveBaselines(map)
      })
      .catch(() => {
        // Network error — keep using hardcoded fallbacks silently
      })
      .finally(() => setLoadingBaselines(false))
  }, [])

  // Resolve display data for the selected city
  const selectedConfig = CITIES.find(c => c.value === data.city)
  const liveLine = selectedConfig ? liveBaselines[selectedConfig.sanityName.toLowerCase()] : null

  const previewRent    = liveLine?.avgRent1BR         ?? selectedConfig?.fallbackRent1BR
  const previewTransit = liveLine?.monthlyTransitPass ?? selectedConfig?.fallbackTransit
  const previewSource  = liveLine?.source             ?? 'CMHC Rental Market Report, Oct 2025'
  const previewDate    = liveLine?.effectiveDate

  // Handle city selection: update city + auto-populate province code (AC-2)
  const handleCitySelect = (cityValue: string) => {
    const cfg = CITIES.find(c => c.value === cityValue)
    onChange('city', cityValue)
    if (cfg) {
      onChange('province', cfg.provinceCode)
    } else if (cityValue === 'other') {
      onChange('province', '')   // clear — user must pick manually
    }
  }

  const [selectFocused, setSelectFocused] = useState(false)
  const isOther = data.city === 'other'

  return (
    <div>
      <h2 style={{ fontFamily: SERIF, fontSize: 24, color: C.forest, margin: '0 0 6px' }}>
        Where are you heading?
      </h2>
      <p style={{ fontSize: 14, color: C.gray, margin: '0 0 28px', lineHeight: 1.6, fontFamily: FONT }}>
        Cost estimates are based on official data for your destination city.
      </p>

      {/* ── City card grid (AC-1) ─────────────────────────────────────────── */}
      <div style={{ marginBottom: 20 }}>
        <Label>Select your destination city *</Label>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr 1fr 1fr 1fr', gap: 8 }}>
          {CITIES.map(c => {
            const active = data.city === c.value
            return (
              <button
                key={c.value}
                type="button"
                onClick={() => handleCitySelect(c.value)}
                aria-pressed={active}
                style={{
                  padding: '14px 12px', borderRadius: 10, textAlign: 'center',
                  border:     active ? `2px solid ${c.color}` : `1px solid ${C.border}`,
                  background: active ? `${c.color}08` : C.white,
                  cursor: 'pointer', fontFamily: FONT, transition: 'all 0.15s',
                  minHeight: 44,   // TC-4: adequate touch target
                }}
              >
                <span style={{ fontSize: 14, fontWeight: 700, color: active ? c.color : C.forest, display: 'block' }}>
                  {c.label}
                </span>
                {c.provinceName && (
                  <span style={{ fontSize: 11, color: C.textLight }}>
                    {c.provinceName}
                  </span>
                )}
              </button>
            )
          })}

          {/* "Other City" card */}
          {(() => {
            const active = data.city === 'other'
            return (
              <button
                type="button"
                onClick={() => handleCitySelect('other')}
                aria-pressed={active}
                style={{
                  padding: '14px 12px', borderRadius: 10, textAlign: 'center',
                  border:     active ? `2px solid ${C.gray}` : `1px solid ${C.border}`,
                  background: active ? `${C.gray}08` : C.white,
                  cursor: 'pointer', fontFamily: FONT, transition: 'all 0.15s',
                  minHeight: 44,
                }}
              >
                <span style={{ fontSize: 14, fontWeight: 700, color: active ? C.gray : C.forest, display: 'block' }}>
                  Other City
                </span>
                <span style={{ fontSize: 11, color: C.textLight }}>Not listed</span>
              </button>
            )
          })()}
        </div>

        {errors.city && (
          <p role="alert" style={{ fontSize: 12, color: C.red, margin: '6px 0 0', fontFamily: FONT }}>
            {errors.city}
          </p>
        )}
      </div>

      {/* ── Baseline preview card — live from Sanity (AC-2) ───────────────── */}
      {selectedConfig && !isOther && previewRent !== undefined && (
        <div style={{
          background:   `${selectedConfig.color}06`,
          border:       `1px solid ${selectedConfig.color}20`,
          borderRadius: 12,
          padding:      '16px 20px',
          marginBottom: 20,
          display:      'flex',
          gap:          24,
          flexWrap:     'wrap',
          transition:   'background 0.3s',
        }}>
          {/* Rent stat */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: C.textLight, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Avg. 1BR Rent
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: selectedConfig.color, fontFamily: SERIF }}>
              {loadingBaselines && !liveLine ? '—' : fmtCAD(previewRent!)}/mo
            </div>
            <div style={{ fontSize: 10, color: C.textLight }}>
              {previewDate ? `CMHC ${previewDate.slice(0, 7)}` : 'CMHC Oct 2025'}
            </div>
          </div>

          {/* Transit stat */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: C.textLight, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Monthly Transit
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: selectedConfig.color, fontFamily: SERIF }}>
              {loadingBaselines && !liveLine ? '—' : fmtCAD(previewTransit!)}/mo
            </div>
            <div style={{ fontSize: 10, color: C.textLight }}>Source: Transit agency</div>
          </div>

          {/* Province badge */}
          <div style={{ marginLeft: 'auto', alignSelf: 'center' }}>
            <div style={{
              fontSize: 11, fontWeight: 700, color: selectedConfig.color,
              background: `${selectedConfig.color}15`, borderRadius: 6,
              padding: '4px 10px', letterSpacing: 0.3,
            }}>
              {selectedConfig.provinceName}
            </div>
            {liveLine && (
              <div style={{ fontSize: 10, color: C.textLight, marginTop: 4, textAlign: 'right' }}>
                Live data ✓
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── "Other" section: warning + province dropdown (AC-3) ──────────── */}
      {isOther && (
        <div style={{
          background:   '#FDF6E3',
          border:       `1px solid ${C.gold}30`,
          borderRadius: 10,
          padding:      '14px 16px',
          marginBottom: 20,
        }}>
          {/* Warning */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 14 }}>
            <Warning size={16} color={C.gold} />
            <p style={{ fontSize: 12, color: '#7A6010', margin: 0, lineHeight: 1.55, fontFamily: FONT, fontWeight: 500 }}>
              Estimates will use conservative national averages for cities not in our database
              (avg. 1BR $1,600/mo · transit $130/mo). Your plan may underestimate costs in
              high-cost cities — consider selecting the nearest listed city if applicable.
            </p>
          </div>

          {/* Province select */}
          <Label htmlFor="province-select">Select your province *</Label>
          <select
            id="province-select"
            value={data.province ?? ''}
            onChange={e => onChange('province', e.target.value)}
            onFocus={() => setSelectFocused(true)}
            onBlur={() => setSelectFocused(false)}
            aria-required="true"
            aria-invalid={!!errors.province}
            aria-describedby={errors.province ? 'province-error' : undefined}
            style={{
              width: '100%', maxWidth: 280,
              padding: '12px 16px', borderRadius: 10,
              border: `1px solid ${errors.province ? C.red : selectFocused ? C.accent : C.border}`,
              boxShadow: selectFocused ? `0 0 0 3px ${C.forest}18` : 'none',
              fontSize: 14, fontFamily: FONT, color: data.province ? C.text : C.textLight,
              background: C.white, outline: 'none',
              transition: 'border-color 0.2s, box-shadow 0.2s',
            }}
          >
            <option value="">Select province / territory</option>
            {PROVINCE_OPTIONS.map(p => (
              <option key={p.code} value={p.code}>{p.name} ({p.code})</option>
            ))}
          </select>

          {errors.province && (
            <p id="province-error" role="alert" style={{ fontSize: 12, color: C.red, margin: '6px 0 0', fontFamily: FONT }}>
              {errors.province}
            </p>
          )}
        </div>
      )}

      {/* ── Transit mode selector (AC-4) ──────────────────────────────────── */}
      <div>
        <Label>How will you get around?</Label>
        <div style={{ display: 'flex', gap: 10 }}>
          {TRANSIT_OPTIONS.map(o => {
            const active = data.transitMode === o.value
            return (
              <button
                key={o.value}
                type="button"
                onClick={() => onChange('transitMode', o.value)}
                aria-pressed={active}
                style={{
                  flex: 1, padding: '14px 12px', borderRadius: 12, textAlign: 'center',
                  border:     active ? `2px solid ${C.accent}` : `1px solid ${C.border}`,
                  background: active ? `${C.accent}08` : C.white,
                  cursor: 'pointer', fontFamily: FONT, transition: 'all 0.15s',
                  minHeight: 44,
                }}
              >
                <span style={{ display: 'block', marginBottom: 4 }} aria-hidden="true">
                  {o.icon}
                </span>
                <span style={{ fontSize: 13, fontWeight: 600, color: active ? C.accent : C.forest }}>
                  {o.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
