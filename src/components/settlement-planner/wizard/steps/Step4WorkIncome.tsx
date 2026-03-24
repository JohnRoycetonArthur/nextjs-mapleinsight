'use client'

/**
 * Step 4: Work & Income (US-11.5)
 *
 * Collects: job offer status (4 options) → runway defaults.
 * - Secured / Offer: direct CAD income input.
 * - No offer / Student: "I know my income" | "Help me estimate" toggle.
 *   "Help me estimate" opens an E9-powered occupation estimator that calls
 *   estimateSalary() (US-9.3) → calculateNetIncome() (US-9.4).
 *
 * When jobStatus === 'student' AND pathway === 'study_permit', an additional
 * Part-Time Income Estimator section is shown (study-permit enhancement §4.2).
 * Wires to studyPermit.partTimeHoursPerWeek / partTimeHourlyRate /
 * estimatedPartTimeMonthlyIncome.
 *
 * Graceful degradation (AC-10): if E9 data files are unavailable at module
 * evaluation time, the occupation search is hidden; only direct income input
 * is shown.
 */

import { useState, useRef, useEffect } from 'react'
import { C, FONT, SERIF } from '../constants'
import type { WizardAnswers } from '../../SettlementSessionContext'
import { searchOccupations } from '@/lib/simulator/occupationSearch'
import { estimateSalary } from '@/lib/simulator/engines/salaryEngine'
import { calculateNetIncome } from '@/lib/simulator/engines/taxEngine'
import { STUDY_PERMIT_DEFAULTS } from '@/lib/settlement-engine/study-permit'
import type { OccupationOption } from '@/components/simulator/wizardTypes'
import type { WageFact } from '@/lib/simulator/engines/salaryTypes'
import type { TaxBracketsData, PayrollParamsData } from '@/lib/simulator/engines/taxTypes'

// ─── Static data imports (E9 data files bundled at build time) ────────────────
// If unavailable the try/catch leaves the arrays empty — occupation estimator
// is then hidden (AC-10 graceful degradation).

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let ALL_OCCUPATIONS: OccupationOption[]  = []
let WAGE_FACTS:      WageFact[]          = []
let TAX_BRACKETS:    TaxBracketsData | null = null
let PAYROLL_PARAMS:  PayrollParamsData  | null = null

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  ALL_OCCUPATIONS = (require('@/data/simulator/occupations.json') as { data: OccupationOption[] }).data ?? []
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  WAGE_FACTS      = (require('@/data/simulator/wage_facts.json') as { data: WageFact[] }).data ?? []
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  TAX_BRACKETS    = require('@/data/simulator/tax_brackets.json') as TaxBracketsData
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  PAYROLL_PARAMS  = (require('@/data/simulator/payroll_params.json') as { data: PayrollParamsData }).data ?? null
} catch {
  // Data not available — graceful degradation
}

const E9_AVAILABLE = ALL_OCCUPATIONS.length > 0 && WAGE_FACTS.length > 0

// ─── City → salary engine city_id ────────────────────────────────────────────

const CITY_ID_MAP: Record<string, string> = {
  toronto:   'toronto-on',
  vancouver: 'vancouver-bc',
  calgary:   'calgary-ab',
  montreal:  'montreal-qc',
  ottawa:    'ottawa-on',
  halifax:   'halifax-ns',
  winnipeg:  'winnipeg-mb',
}

// ─── Job status options ───────────────────────────────────────────────────────

const JOB_OPTIONS = [
  { value: 'secured_30',  label: 'Job secured',              desc: 'Start date within 30 days of arrival',        icon: '✅', color: C.accent  },
  { value: 'offer_30_90', label: 'Job offer, delayed start', desc: 'Start date 30–90 days after arrival',          icon: '📋', color: C.gold    },
  { value: 'no_offer',    label: 'No job offer yet',         desc: 'Still searching or plan to search on arrival', icon: '🔍', color: C.red     },
  { value: 'student',     label: 'Student',                  desc: 'Income uncertain or part-time only',           icon: '🎓', color: C.purple  },
] as const

const RUNWAY_LABEL: Record<string, string> = {
  secured_30: '2 months', offer_30_90: '3 months', no_offer: '6 months', student: '6 months',
}

const HOURS_OPTIONS = [20, 25, 30, 35, 40]

// ─── Confidence display ───────────────────────────────────────────────────────

const CONFIDENCE_COLOR: Record<string, string>   = { High: C.accent, Medium: C.gold, Low: C.red }
const CONFIDENCE_TOOLTIP: Record<string, string> = {
  High:   'City-level Job Bank data found for this occupation. Estimate is based on local wage rates.',
  Medium: 'Province or national data used as a fallback. Estimate may differ from local rates.',
  Low:    'Limited or no wage data found for this occupation. Estimate is a rough guide only.',
}

// ─── Province name map ────────────────────────────────────────────────────────

const PROVINCE_NAMES: Record<string, string> = {
  ON: 'Ontario', BC: 'British Columbia', AB: 'Alberta', QC: 'Quebec',
  MB: 'Manitoba', SK: 'Saskatchewan', NS: 'Nova Scotia', NB: 'New Brunswick',
  PE: 'Prince Edward Island', NL: 'Newfoundland & Labrador',
  NT: 'Northwest Territories', NU: 'Nunavut', YT: 'Yukon',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtCAD(n: number): string {
  return `$${Math.round(n).toLocaleString('en-CA')}`
}

// ─── Design primitives ────────────────────────────────────────────────────────

const Label = ({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) => (
  <label
    htmlFor={htmlFor}
    style={{ display: 'block', fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 8, fontFamily: FONT }}
  >
    {children}
  </label>
)

const Helper = ({ children }: { children: React.ReactNode }) => (
  <p style={{ fontSize: 12, color: C.textLight, margin: '4px 0 0', lineHeight: 1.5, fontFamily: FONT }}>
    {children}
  </p>
)

// ─── Currency input ───────────────────────────────────────────────────────────

function CurrencyInput({
  id, value, onChange, placeholder = '0',
}: { id?: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ position: 'relative', maxWidth: 280 }}>
      <div style={{
        position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
        fontSize: 13, fontWeight: 600, color: C.textLight, fontFamily: FONT, pointerEvents: 'none',
      }}>
        CAD $
      </div>
      <input
        id={id}
        type="text"
        inputMode="decimal"
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value.replace(/[^0-9.,]/g, ''))}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: '100%', padding: '12px 16px', paddingLeft: 62, borderRadius: 10,
          border: `1px solid ${focused ? C.accent : C.border}`,
          boxShadow: focused ? `0 0 0 3px ${C.accent}18` : 'none',
          fontSize: 14, fontFamily: FONT, color: C.text,
          outline: 'none', background: C.white,
          transition: 'border-color 0.2s, box-shadow 0.2s',
        }}
      />
    </div>
  )
}

// ─── Confidence badge with tooltip ───────────────────────────────────────────

function ConfidenceBadge({ tier }: { tier: string }) {
  const [show, setShow] = useState(false)
  const color = CONFIDENCE_COLOR[tier] ?? C.gray
  return (
    <span
      style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', cursor: 'help' }}
      onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}
      onFocus={() => setShow(true)} onBlur={() => setShow(false)}
      tabIndex={0}
      aria-label={`${tier} confidence — ${CONFIDENCE_TOOLTIP[tier]}`}
    >
      <span style={{
        fontSize: 10, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: 0.5,
        color, background: `${color}15`, padding: '2px 8px', borderRadius: 4, fontFamily: FONT,
      }}>
        {tier} confidence
      </span>
      {show && (
        <div role="tooltip" style={{
          position: 'absolute', bottom: 'calc(100% + 8px)', left: '50%', transform: 'translateX(-50%)',
          background: C.forest, color: '#fff', padding: '10px 14px', borderRadius: 10,
          fontSize: 12, lineHeight: 1.5, fontFamily: FONT, width: 240,
          boxShadow: '0 4px 16px rgba(0,0,0,0.15)', zIndex: 20, pointerEvents: 'none',
        }}>
          {CONFIDENCE_TOOLTIP[tier]}
          <div aria-hidden="true" style={{
            position: 'absolute', bottom: -5, left: '50%',
            transform: 'translateX(-50%) rotate(45deg)',
            width: 10, height: 10, background: C.forest,
          }} />
        </div>
      )}
    </span>
  )
}

// ─── Search icon ──────────────────────────────────────────────────────────────

const SearchIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
)

// ─── Per-tier net monthly (local state, not persisted) ────────────────────────

interface TierNetMonthly { low: number; mid: number; high: number }

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  data:     WizardAnswers
  onChange: (key: keyof WizardAnswers, value: unknown) => void
  errors:   Record<string, string>
  isMobile: boolean
}

// ─── Step 4 ───────────────────────────────────────────────────────────────────

export function Step4WorkIncome({ data, onChange, errors, isMobile }: Props) {
  const [showEstimator, setShowEstimator] = useState(false)
  const [occSearch, setOccSearch]         = useState(data.occupation ?? '')
  const [occResults, setOccResults]       = useState<OccupationOption[]>([])
  const [dropdownOpen, setDropdownOpen]   = useState(false)
  const [tierNet, setTierNet]             = useState<TierNetMonthly | null>(null)
  const dropdownRef                       = useRef<HTMLDivElement>(null)

  // Study permit path flag (uses session value with underscore)
  const isStudyPermitPath = data.pathway === 'study_permit'

  // Auto-select "Student" when on study permit path and no status set yet
  useEffect(() => {
    if (isStudyPermitPath && !data.jobStatus) {
      onChange('jobStatus', 'student')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStudyPermitPath])

  // Sync income field from part-time monthly when on study permit student/no-offer path
  useEffect(() => {
    if (isStudyPermitPath && (data.jobStatus === 'student' || data.jobStatus === 'no_offer')) {
      const monthly = data.studyPermit?.estimatedPartTimeMonthlyIncome ?? 0
      if (!data.income || data.incomeSource !== 'direct_input') {
        onChange('income', String(monthly))
        onChange('incomeSource', 'direct_input')
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStudyPermitPath, data.jobStatus])

  // Derived flags
  const showDirectInput     = data.jobStatus === 'secured_30' || data.jobStatus === 'offer_30_90'
  const showEstimatorToggle = !isStudyPermitPath && (data.jobStatus === 'no_offer' || data.jobStatus === 'student')
  // For study permit: show part-time estimator when student or no_offer selected
  const showPartTimeForStudyPermit = isStudyPermitPath && (data.jobStatus === 'student' || data.jobStatus === 'no_offer')
  const isStudentPermit     = data.jobStatus === 'student' && data.pathway === 'study_permit'

  // Province min wage (for part-time estimator)
  const province     = data.province ?? 'ON'
  const minWageEntry = STUDY_PERMIT_DEFAULTS.provincialMinWages.find(w => w.provinceCode === province)
  const defaultRate  = minWageEntry?.hourlyRate ?? 15.00

  // Part-time toggle state — initialise from session
  const [partTimeOn, setPartTimeOn] = useState<boolean>(() => {
    if (!data.studyPermit) return true
    const h = data.studyPermit.partTimeHoursPerWeek
    return h === undefined || h > 0
  })

  const ptHours  = data.studyPermit?.partTimeHoursPerWeek ?? 20
  const ptRate   = data.studyPermit?.partTimeHourlyRate   ?? defaultRate
  const ptMonthly = partTimeOn ? Math.round(ptHours * ptRate * 4.33) : 0

  // ── Close dropdown on outside click ─────────────────────────────────────────
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [])

  // ── Occupation search ─────────────────────────────────────────────────────
  const handleOccSearch = (q: string) => {
    setOccSearch(q)
    if (q.length < 2) { setOccResults([]); setDropdownOpen(false); return }
    const results = searchOccupations(ALL_OCCUPATIONS, q)
    setOccResults(results)
    setDropdownOpen(results.length > 0)
  }

  // ── Run salary + tax engines ──────────────────────────────────────────────
  function runEngines(nocCode: string, experienceYears: number, hoursPerWeek: number) {
    if (!TAX_BRACKETS || !PAYROLL_PARAMS) return
    const cityId   = CITY_ID_MAP[data.city ?? ''] ?? ''
    const estimate = estimateSalary(
      { noc_code: nocCode, city_id: cityId, province_code: province, years_experience: experienceYears, hours_per_week: hoursPerWeek },
      WAGE_FACTS,
    )
    const taxLow  = calculateNetIncome(estimate.annual_low,  province, TAX_BRACKETS, PAYROLL_PARAMS)
    const taxMid  = calculateNetIncome(estimate.annual_mid,  province, TAX_BRACKETS, PAYROLL_PARAMS)
    const taxHigh = calculateNetIncome(estimate.annual_high, province, TAX_BRACKETS, PAYROLL_PARAMS)

    onChange('estimatedGrossLow',  estimate.annual_low)
    onChange('estimatedGrossMid',  estimate.annual_mid)
    onChange('estimatedGrossHigh', estimate.annual_high)
    onChange('estimatedNetMonthly', taxMid.monthly_take_home)
    onChange('confidence', estimate.confidence.tier)
    setTierNet({ low: taxLow.monthly_take_home, mid: taxMid.monthly_take_home, high: taxHigh.monthly_take_home })

    return { estimate, netMid: taxMid.monthly_take_home }
  }

  const selectOccupation = (occ: OccupationOption) => {
    setOccSearch(occ.title)
    setDropdownOpen(false)
    onChange('occupation', occ.title)
    onChange('nocCode', occ.noc_code)
    const result = runEngines(occ.noc_code, data.experience ?? 0, data.hoursPerWeek ?? 40)
    if (result) {
      onChange('incomeSource', 'engine_estimate')
      onChange('income', String(result.netMid))
    }
  }

  const rerunEngines = (experienceYears: number, hoursPerWeek: number) => {
    if (!data.nocCode) return
    const result = runEngines(data.nocCode, experienceYears, hoursPerWeek)
    if (result && data.incomeSource !== 'user_override') {
      onChange('income', String(result.netMid))
    }
  }

  // ── Update part-time session fields ──────────────────────────────────────
  const updatePartTime = (hours: number, rate: number, on: boolean) => {
    const monthly = on ? Math.round(hours * rate * 4.33) : 0
    onChange('studyPermit', {
      ...data.studyPermit,
      partTimeHoursPerWeek:           on ? hours : 0,
      partTimeHourlyRate:             rate,
      estimatedPartTimeMonthlyIncome: monthly,
    })
    // Sync income field so income scenarios can use part-time income
    if (isStudyPermitPath) {
      onChange('income', String(monthly))
      onChange('incomeSource', 'direct_input')
    }
  }

  // Fallback tier label for the estimate card (AC-9)
  const fallbackLabel =
    data.confidence === 'Medium' ? 'Province-level estimate' :
    data.confidence === 'Low'    ? 'National estimate' : ''

  return (
    <div>
      <h2 style={{ fontFamily: SERIF, fontSize: 24, color: C.forest, margin: '0 0 6px' }}>
        Work & income situation
      </h2>
      <p style={{ fontSize: 14, color: C.gray, margin: '0 0 28px', lineHeight: 1.6, fontFamily: FONT }}>
        This determines your financial runway and how we estimate your income.
      </p>

      {/* ── Job status cards (AC-1) ────────────────────────────────────────── */}
      <div style={{ marginBottom: 24 }}>
        <Label>What&apos;s your job situation? *</Label>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 10 }}>
          {JOB_OPTIONS.map(o => {
            const active = data.jobStatus === o.value
            return (
              <button
                key={o.value}
                type="button"
                onClick={() => {
                  onChange('jobStatus', o.value)
                  setShowEstimator(false)
                  if (o.value === 'secured_30' || o.value === 'offer_30_90') {
                    onChange('estimatedGrossMid', undefined)
                    onChange('incomeSource', 'direct_input')
                  }
                }}
                aria-pressed={active}
                style={{
                  padding: '16px 18px', borderRadius: 12, textAlign: 'left',
                  border:     active ? `2px solid ${o.color}` : `1px solid ${C.border}`,
                  background: active ? `${o.color}08` : C.white,
                  cursor: 'pointer', transition: 'all 0.15s', fontFamily: FONT, minHeight: 44,
                }}
              >
                <span style={{ fontSize: 20, display: 'block', marginBottom: 6 }} aria-hidden="true">{o.icon}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: active ? o.color : C.forest, display: 'block', lineHeight: 1.3 }}>
                  {o.label}
                </span>
                <span style={{ fontSize: 12, color: C.gray, display: 'block', marginTop: 3, lineHeight: 1.4 }}>
                  {o.desc}
                </span>
              </button>
            )
          })}
        </div>

        {/* Runway indicator (AC-2) */}
        {data.jobStatus && (
          <div style={{ marginTop: 10, fontSize: 12, color: C.accent, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, fontFamily: FONT }}>
            <span style={{ width: 8, height: 8, borderRadius: 4, background: C.accent, display: 'inline-block' }} />
            Planning runway: {RUNWAY_LABEL[data.jobStatus]}
          </div>
        )}

        {errors.jobStatus && (
          <p role="alert" style={{ fontSize: 12, color: C.red, margin: '6px 0 0', fontFamily: FONT }}>
            {errors.jobStatus}
          </p>
        )}
      </div>

      {/* ── Direct income input (secured / offer with start date) (AC-3) ───── */}
      {showDirectInput && (
        <div style={{ marginBottom: 24 }}>
          <Label htmlFor="income-direct">Expected net monthly income (CAD)</Label>
          <CurrencyInput
            id="income-direct"
            value={data.income ?? ''}
            onChange={v => { onChange('income', v); onChange('incomeSource', 'direct_input') }}
            placeholder="e.g. 4,500"
          />
          <Helper>Your take-home pay after taxes and deductions.</Helper>
        </div>
      )}

      {/* ── No offer / Student: income toggle + estimator (AC-4) — hidden for study permit ── */}
      {showEstimatorToggle && (
        <div style={{ marginBottom: 24 }}>
          <Label>Do you have an expected income figure?</Label>

          {/* Yes / Help me estimate toggle */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <button
              type="button"
              onClick={() => setShowEstimator(false)}
              aria-pressed={!showEstimator}
              style={{
                padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                border:     !showEstimator ? `2px solid ${C.accent}` : `1px solid ${C.border}`,
                background: !showEstimator ? `${C.accent}10` : C.white,
                color:      !showEstimator ? C.accent : C.gray,
                cursor: 'pointer', fontFamily: FONT, transition: 'all 0.15s', minHeight: 44,
              }}
            >
              Yes, I know my income
            </button>
            {E9_AVAILABLE && (
              <button
                type="button"
                onClick={() => setShowEstimator(true)}
                aria-pressed={showEstimator}
                style={{
                  padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                  border:     showEstimator ? `2px solid ${C.purple}` : `1px solid ${C.border}`,
                  background: showEstimator ? `${C.purple}10` : C.white,
                  color:      showEstimator ? C.purple : C.gray,
                  cursor: 'pointer', fontFamily: FONT, transition: 'all 0.15s', minHeight: 44,
                }}
              >
                Help me estimate
              </button>
            )}
          </div>

          {/* Direct income input for "Yes I know" path */}
          {!showEstimator && (
            <div>
              <CurrencyInput
                id="income-known"
                value={data.income ?? ''}
                onChange={v => { onChange('income', v); onChange('incomeSource', 'direct_input') }}
                placeholder="e.g. 4,500"
              />
              <Helper>Leave blank if you have no expected income yet. We&apos;ll plan for maximum runway.</Helper>
            </div>
          )}

          {/* ── E9-powered occupation estimator (AC-4 through AC-9) ──────────── */}
          {showEstimator && E9_AVAILABLE && (
            <div style={{
              background: `${C.purple}06`, border: `1px solid ${C.purple}20`,
              borderRadius: 14, padding: isMobile ? '18px 16px' : '22px 24px',
            }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <span style={{ fontSize: 16 }} aria-hidden="true">🔮</span>
                <span style={{ fontSize: 15, fontWeight: 700, color: C.purple, fontFamily: SERIF }}>
                  Income Estimator
                </span>
                <span style={{ fontSize: 11, color: C.textLight, fontWeight: 500 }}>
                  Powered by Job Bank data
                </span>
              </div>

              {/* Occupation search (AC-5a) */}
              <div style={{ marginBottom: 16, position: 'relative' }} ref={dropdownRef}>
                <Label htmlFor="occ-search">What&apos;s your occupation?</Label>
                <div style={{ position: 'relative' }}>
                  <span style={{
                    position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                    color: C.textLight, pointerEvents: 'none',
                  }}>
                    <SearchIcon />
                  </span>
                  <input
                    id="occ-search"
                    type="text"
                    placeholder="Search by job title (e.g. Software Developer)"
                    value={occSearch}
                    onChange={e => handleOccSearch(e.target.value)}
                    onFocus={() => occResults.length > 0 && setDropdownOpen(true)}
                    autoComplete="off"
                    style={{
                      width: '100%', padding: '12px 16px', paddingLeft: 34, borderRadius: 10,
                      border: `1px solid ${dropdownOpen ? C.purple : C.border}`,
                      boxShadow: dropdownOpen ? `0 0 0 3px ${C.purple}18` : 'none',
                      fontSize: 14, fontFamily: FONT, color: C.text,
                      outline: 'none', background: C.white,
                      transition: 'border-color 0.2s, box-shadow 0.2s',
                    }}
                  />
                </div>

                {/* Typeahead dropdown */}
                {dropdownOpen && (
                  <div style={{
                    position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 50,
                    background: C.white, border: `1px solid ${C.border}`, borderRadius: 10,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.1)', maxHeight: 220, overflowY: 'auto',
                  }}>
                    {occResults.map(o => (
                      <button
                        key={o.noc_code}
                        type="button"
                        onClick={() => selectOccupation(o)}
                        style={{
                          width: '100%', padding: '10px 14px', border: 'none',
                          background: 'transparent', textAlign: 'left', cursor: 'pointer',
                          fontFamily: FONT, fontSize: 14,
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          borderBottom: `1px solid ${C.lightGray}`,
                        }}
                        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = C.lightGray }}
                        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
                      >
                        <span style={{ fontWeight: 600, color: C.forest }}>{o.title}</span>
                        <span style={{ fontSize: 11, color: C.textLight }}>NOC {o.noc_code}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Experience slider (AC-5b) and hours/week (AC-5c) */}
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 16 }}>
                <div style={{ flex: '1 1 140px' }}>
                  <Label htmlFor="exp-slider">Years of experience</Label>
                  <input
                    id="exp-slider"
                    type="range"
                    min={0} max={30}
                    value={data.experience ?? 0}
                    onChange={e => {
                      const yrs = parseInt(e.target.value, 10)
                      onChange('experience', yrs)
                      rerunEngines(yrs, data.hoursPerWeek ?? 40)
                    }}
                    style={{ width: '100%', accentColor: C.purple }}
                    aria-valuemin={0} aria-valuemax={30} aria-valuenow={data.experience ?? 0}
                    aria-label="Years of relevant experience"
                  />
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.purple, textAlign: 'center', fontFamily: FONT }}>
                    {data.experience ?? 0} years
                  </div>
                </div>

                <div style={{ flex: '1 1 140px' }}>
                  <Label htmlFor="hours-select">Hours per week</Label>
                  <select
                    id="hours-select"
                    value={data.hoursPerWeek ?? 40}
                    onChange={e => {
                      const hrs = parseInt(e.target.value, 10)
                      onChange('hoursPerWeek', hrs)
                      rerunEngines(data.experience ?? 0, hrs)
                    }}
                    style={{
                      width: '100%', padding: '12px 16px', borderRadius: 10,
                      border: `1px solid ${C.border}`, fontSize: 14, fontFamily: FONT,
                      color: C.text, background: C.white, outline: 'none',
                    }}
                  >
                    {HOURS_OPTIONS.map(h => (
                      <option key={h} value={h}>{h} hrs/week</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Salary estimate result card (AC-6 / AC-7 / AC-8 / AC-9) */}
              {data.estimatedGrossMid != null && data.estimatedGrossMid > 0 && (() => {
                const grossLow  = data.estimatedGrossLow  ?? 0
                const grossMid  = data.estimatedGrossMid  ?? 0
                const grossHigh = data.estimatedGrossHigh ?? 0
                const nm: TierNetMonthly = tierNet ?? {
                  low:  Math.round(grossLow  * 0.73 / 12),
                  mid:  data.estimatedNetMonthly ?? Math.round(grossMid  * 0.73 / 12),
                  high: Math.round(grossHigh * 0.68 / 12),
                }
                const tiers = [
                  { label: 'Low',    gross: grossLow,  net: nm.low,  highlight: false },
                  { label: 'Median', gross: grossMid,  net: nm.mid,  highlight: true  },
                  { label: 'High',   gross: grossHigh, net: nm.high, highlight: false },
                ]
                return (
                  <div style={{ background: C.white, borderRadius: 12, padding: '16px 18px', border: `1px solid ${C.border}` }}>
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: C.forest, fontFamily: FONT }}>
                        Estimated Income
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {fallbackLabel && (
                          <span style={{ fontSize: 10, color: C.gold, fontWeight: 600, fontFamily: FONT }}>
                            {fallbackLabel}
                          </span>
                        )}
                        {data.confidence && <ConfidenceBadge tier={data.confidence} />}
                      </div>
                    </div>

                    {/* Low / Median / High range */}
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
                      {tiers.map(t => (
                        <div key={t.label} style={{
                          flex: 1, minWidth: 90, textAlign: 'center',
                          padding: '10px 8px', borderRadius: 8,
                          background: t.highlight ? `${C.purple}08` : C.lightGray,
                          border: t.highlight ? `1px solid ${C.purple}25` : 'none',
                        }}>
                          <div style={{ fontSize: 11, color: C.textLight, fontWeight: 600, textTransform: 'uppercase', fontFamily: FONT }}>
                            {t.label}
                          </div>
                          <div style={{ fontSize: 16, fontWeight: 700, color: t.highlight ? C.purple : C.forest, fontFamily: SERIF }}>
                            ${(t.gross / 1000).toFixed(0)}K
                          </div>
                          <div style={{ fontSize: 11, color: C.gray, fontFamily: FONT }}>
                            ~{fmtCAD(t.net)}/mo net
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Auto-populated income — user can override (AC-7) */}
                    <div style={{ padding: '10px 14px', background: `${C.accent}06`, borderRadius: 8 }}>
                      <div style={{ fontSize: 12, color: C.gray, marginBottom: 6, fontFamily: FONT }}>
                        Auto-populated estimate (you can edit):
                      </div>
                      <CurrencyInput
                        value={data.income ?? String(nm.mid)}
                        onChange={v => { onChange('income', v); onChange('incomeSource', 'user_override') }}
                        placeholder={String(nm.mid)}
                      />
                    </div>
                  </div>
                )
              })()}
            </div>
          )}
        </div>
      )}

      {/* ── Study permit: part-time income estimator (§4.2) ─────────────────── */}
      {(isStudentPermit || showPartTimeForStudyPermit) && (
        <div style={{
          background: `${C.accent}05`, border: `1px solid ${C.accent}20`,
          borderRadius: 14, padding: isMobile ? '18px 16px' : '20px 22px',
        }}>
          {/* Section header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <span style={{ fontSize: 15 }} aria-hidden="true">💼</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: C.accent, fontFamily: FONT }}>
              Part-Time Income Estimator
            </span>
          </div>

          {/* Toggle: plan to work part-time? */}
          <div style={{ marginBottom: 16 }}>
            <Label>I plan to work part-time while studying</Label>
            <div style={{ display: 'flex', gap: 8 }}>
              {([{ v: true, l: 'Yes' }, { v: false, l: 'No' }] as const).map(o => (
                <button
                  key={String(o.v)}
                  type="button"
                  onClick={() => {
                    setPartTimeOn(o.v)
                    updatePartTime(o.v ? (ptHours || 20) : 0, ptRate, o.v)
                  }}
                  aria-pressed={partTimeOn === o.v}
                  style={{
                    padding: '8px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                    border:     partTimeOn === o.v ? `2px solid ${C.accent}` : `1px solid ${C.border}`,
                    background: partTimeOn === o.v ? `${C.accent}10` : C.white,
                    color:      partTimeOn === o.v ? C.accent : C.gray,
                    cursor: 'pointer', fontFamily: FONT, transition: 'all 0.15s', minHeight: 44,
                  }}
                >
                  {o.l}
                </button>
              ))}
            </div>
          </div>

          {/* Hours + rate inputs (only when ON) */}
          {partTimeOn && (
            <>
              {/* Hours per week slider (0–24) */}
              <div style={{ marginBottom: 16 }}>
                <Label htmlFor="pt-hours">
                  Hours per week:{' '}
                  <strong style={{ color: C.accent }}>{ptHours} hrs</strong>
                </Label>
                <input
                  id="pt-hours"
                  type="range"
                  min={1} max={24} step={1}
                  value={ptHours}
                  onChange={e => {
                    const h = parseInt(e.target.value, 10)
                    updatePartTime(h, ptRate, true)
                  }}
                  style={{ width: '100%', maxWidth: 320, accentColor: C.accent }}
                  aria-valuemin={1} aria-valuemax={24} aria-valuenow={ptHours}
                  aria-label="Part-time hours per week"
                />
                <Helper>
                  International students can work up to 24 hours/week during the academic term.
                </Helper>
              </div>

              {/* Hourly rate input */}
              <div style={{ marginBottom: 16 }}>
                <Label htmlFor="pt-rate">Hourly rate (CAD $)</Label>
                <div style={{ position: 'relative', maxWidth: 200 }}>
                  <div style={{
                    position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                    fontSize: 13, fontWeight: 600, color: C.textLight, fontFamily: FONT, pointerEvents: 'none',
                  }}>
                    CAD $
                  </div>
                  <input
                    id="pt-rate"
                    type="text"
                    inputMode="decimal"
                    value={String(ptRate)}
                    onChange={e => {
                      const r = parseFloat(e.target.value.replace(/[^0-9.]/g, '')) || defaultRate
                      updatePartTime(ptHours, r, true)
                    }}
                    style={{
                      width: '100%', padding: '12px 16px', paddingLeft: 62, borderRadius: 10,
                      border: `1px solid ${C.border}`, fontSize: 14, fontFamily: FONT,
                      color: C.text, outline: 'none', background: C.white,
                    }}
                  />
                </div>
                <Helper>
                  {PROVINCE_NAMES[province] ?? province} minimum wage: {fmtCAD(defaultRate)}/hr
                </Helper>
              </div>

              {/* Estimated monthly income (read-only display) */}
              <div style={{
                background: `${C.accent}0D`, border: `1px solid ${C.accent}25`,
                borderRadius: 10, padding: '14px 16px', marginBottom: 14,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                gap: 12, flexWrap: 'wrap',
              }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: C.textLight, textTransform: 'uppercase', letterSpacing: 0.5, fontFamily: FONT }}>
                    Est. Monthly Part-Time Income
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: C.accent, fontFamily: SERIF }}>
                    {fmtCAD(ptMonthly)}/mo
                  </div>
                  <div style={{ fontSize: 10, color: C.textLight, fontFamily: FONT }}>
                    {ptHours} hrs × {fmtCAD(ptRate)}/hr × 4.33 weeks
                  </div>
                </div>
              </div>
            </>
          )}

          {/* IRCC notice */}
          <div style={{
            background: C.lightGray, border: `1px solid ${C.border}`,
            borderRadius: 10, padding: '12px 14px',
            display: 'flex', alignItems: 'flex-start', gap: 8,
          }}>
            <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }} aria-hidden="true">ℹ️</span>
            <p style={{ fontSize: 12, color: C.text, margin: 0, lineHeight: 1.6, fontFamily: FONT }}>
              <strong>This income is NOT counted toward IRCC proof of funds</strong> for your study
              permit application. IRCC requires you to demonstrate available funds without relying on
              employment in Canada. However, part-time work income is included in your monthly budget
              projection after arrival.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
