'use client'

/**
 * Step 6: Lifestyle & Setup (US-11.7)
 *
 * Collects: housing type, furnishing level, childcare (if children > 0),
 * car ownership, and optional custom monthly expenses.
 *
 * Study permit enhancement (§4.3): when pathway === 'study_permit', derives
 * health insurance status from STUDY_PERMIT_DEFAULTS for the selected province
 * and shows one of three info cards:
 *   - No provincial coverage → non-removable locked monthly cost line + info card
 *   - Provincial coverage with waiting period → bridge insurance upfront info card
 *   - Provincial coverage, no waiting period → positive "no cost" info card
 */

import { C, FONT, SERIF } from '../constants'
import { STUDY_PERMIT_DEFAULTS } from '@/lib/settlement-engine/study-permit'
import type { WizardAnswers } from '../../SettlementSessionContext'
import {
  Add,
  Apartment,
  Bed,
  Close,
  FamilyGroup,
  FamilyHome,
  Handshake,
  HomeWork,
  House,
  Info,
  Lock,
  School,
  TaskAlt,
} from '@material-symbols-svg/react'

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

// ─── Toggle ───────────────────────────────────────────────────────────────────

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
          cursor: 'pointer', fontFamily: FONT, transition: 'all 0.15s', minHeight: 44,
        }}
      >
        {o.l}
      </button>
    ))}
  </div>
)

// ─── Icons ────────────────────────────────────────────────────────────────────

// ─── Housing / furnishing config ──────────────────────────────────────────────

const HOUSING = [
  { value: 'studio', label: 'Studio',      icon: <Apartment size={22} color={C.accent} /> },
  { value: '1br',    label: '1 Bedroom',   icon: <Bed size={22} color={C.accent} /> },
  { value: '2br',    label: '2 Bedrooms',  icon: <House size={22} color={C.accent} /> },
  { value: '3br',    label: '3+ Bedrooms', icon: <HomeWork size={22} color={C.accent} /> },
  { value: 'staying-family', label: 'Staying with Family / Friends', icon: <Handshake size={22} color={C.accent} /> },
]

const STUDENT_HOUSING = [
  { value: 'shared-room',    label: 'Shared Room / House',          icon: <House size={20} color={C.accent} />, desc: 'Share a house or apartment with roommates. Most affordable option.' },
  { value: 'on-campus',      label: 'On-Campus Residence',          icon: <School size={20} color={C.accent} />, desc: 'University dormitory or student housing. Convenient, may include meal plan.' },
  { value: 'homestay',       label: 'Homestay',                     icon: <FamilyHome size={20} color={C.accent} />, desc: 'Live with a Canadian host family. Often includes meals.' },
  { value: 'staying-family', label: 'Staying with Family / Friends', icon: <FamilyGroup size={20} color={C.accent} />, desc: 'Live with relatives or friends at no rental cost.' },
]

const FURNISHING = [
  { value: 'minimal',  label: 'Minimal',        desc: 'Basics only — ~$500 setup'           },
  { value: 'moderate', label: 'Moderate',        desc: 'Comfortable start — ~$1,500 setup'   },
  { value: 'full',     label: 'Fully furnished', desc: 'Everything you need — ~$3,000 setup' },
]

// ─── Student housing costs by city (matches Sanity seed data) ─────────────────

const STUDENT_HOUSING_COSTS: Record<string, { sharedRoom: number; onCampus: number; homestay: number }> = {
  toronto:   { sharedRoom: 1_050, onCampus: 1_200, homestay: 1_200 },
  vancouver: { sharedRoom: 1_100, onCampus: 1_200, homestay: 1_250 },
  montreal:  { sharedRoom:   725, onCampus:   900, homestay: 1_000 },
  ottawa:    { sharedRoom:   850, onCampus: 1_000, homestay: 1_050 },
  calgary:   { sharedRoom:   750, onCampus:   850, homestay:   950 },
  halifax:   { sharedRoom:   675, onCampus:   800, homestay:   900 },
  winnipeg:  { sharedRoom:   575, onCampus:   700, homestay:   800 },
}
const STUDENT_HOUSING_FALLBACK = { sharedRoom: 900, onCampus: 1_000, homestay: 1_000 }

function getStudentCost(city: string, type: 'sharedRoom' | 'onCampus' | 'homestay'): number {
  const key = city.toLowerCase()
  return (STUDENT_HOUSING_COSTS[key] ?? STUDENT_HOUSING_FALLBACK)[type]
}

// ─── Province name map ────────────────────────────────────────────────────────

const PROVINCE_NAMES: Record<string, string> = {
  ON: 'Ontario', BC: 'British Columbia', AB: 'Alberta', QC: 'Quebec',
  MB: 'Manitoba', SK: 'Saskatchewan', NS: 'Nova Scotia', NB: 'New Brunswick',
  PE: 'Prince Edward Island', NL: 'Newfoundland & Labrador',
  NT: 'Northwest Territories', NU: 'Nunavut', YT: 'Yukon',
}

// ─── Format helpers ───────────────────────────────────────────────────────────

function fmtCAD(n: number): string {
  return `$${Math.round(n).toLocaleString('en-CA')}`
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  data:        WizardAnswers
  onChange:    (key: keyof WizardAnswers, value: unknown) => void
  errors:      Record<string, string>
  isMobile:    boolean
  hasChildren: boolean
}

// ─── Step 6: Lifestyle & Setup ────────────────────────────────────────────────

export function Step6Lifestyle({ data, onChange, errors, isMobile, hasChildren }: Props) {
  // ── Study permit health insurance derivation (§4.3) ──────────────────────
  const isStudyPermit  = data.pathway === 'study_permit'
  const city           = data.city ?? ''
  const province       = data.province ?? ''
  const provinceName  = PROVINCE_NAMES[province] ?? province

  const healthEntry = isStudyPermit
    ? STUDY_PERMIT_DEFAULTS.healthInsuranceByProvince.find(h => h.provinceCode === province) ?? null
    : null

  // Determine which scenario applies
  const hiNoCoverage     = healthEntry && !healthEntry.hasProvincialCoverage
  const hiCoverageWait   = healthEntry && healthEntry.hasProvincialCoverage && healthEntry.waitPeriodMonths > 0
  const hiCoverageNoWait = healthEntry && healthEntry.hasProvincialCoverage && healthEntry.waitPeriodMonths === 0

  const hiMonthly  = healthEntry && hiNoCoverage  ? Math.round(healthEntry.annualCostCAD / 12) : 0
  const hiAnnual   = healthEntry?.annualCostCAD ?? 0
  const hiBridge   = healthEntry?.bridgeCostCAD ?? 0
  const hiMechanism = healthEntry?.mechanism ?? ''
  const hiWaitMonths = healthEntry?.waitPeriodMonths ?? 0

  // ── Housing / furnishing visibility logic ────────────────────────────────
  const housingVal      = data.housing ?? ''
  const isStayingFamily = housingVal === 'staying-family'
  const isOnCampus      = housingVal === 'on-campus'
  const isHomestay      = housingVal === 'homestay'
  // Furnishing hidden for on-campus, homestay (furnished), and staying-family
  const showFurnishing  = !isStayingFamily && !isOnCampus && !isHomestay

  // Input styles for custom expense text fields
  const inputBase: React.CSSProperties = {
    padding: '8px 12px', borderRadius: 8, border: `1px solid ${C.border}`,
    fontSize: 14, fontFamily: FONT, color: C.text, outline: 'none', background: C.white,
  }

  return (
    <div>
      <h2 style={{ fontFamily: SERIF, fontSize: 24, color: C.forest, margin: '0 0 6px' }}>
        Lifestyle & setup preferences
      </h2>
      <p style={{ fontSize: 14, color: C.gray, margin: '0 0 28px', lineHeight: 1.6, fontFamily: FONT }}>
        These preferences shape your estimated monthly costs and initial setup budget.
      </p>

      {/* ── Housing type cards (AC-1, AC-2) ────────────────────────────────── */}
      <div style={{ marginBottom: 24 }}>
        <Label>
          {isStudyPermit ? 'Where will you live? *' : 'Preferred housing type *'}
        </Label>

        {/* Study permit — student-specific cards (2×2 grid with descriptions + costs) */}
        {isStudyPermit ? (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 10 }}>
            {STUDENT_HOUSING.map(h => {
              const active = data.housing === h.value
              const monthlyCost =
                h.value === 'staying-family' ? '$0'
                : h.value === 'shared-room'  ? `${fmtCAD(getStudentCost(city, 'sharedRoom'))}`
                : h.value === 'on-campus'    ? `${fmtCAD(getStudentCost(city, 'onCampus'))}`
                : h.value === 'homestay'     ? `${fmtCAD(getStudentCost(city, 'homestay'))}`
                : ''
              return (
                <button
                  key={h.value}
                  type="button"
                  onClick={() => onChange('housing', h.value)}
                  aria-pressed={active}
                  style={{
                    padding: '14px 16px', borderRadius: 12, textAlign: 'left',
                    border:     active ? `2px solid ${C.accent}` : `1px solid ${C.border}`,
                    background: active ? `${C.accent}08` : C.white,
                    cursor: 'pointer', fontFamily: FONT, transition: 'all 0.15s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 20 }} aria-hidden="true">{h.icon}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: active ? C.accent : C.forest }}>
                      {h.label}
                    </span>
                  </div>
                  <span style={{ fontSize: 11, color: C.gray, display: 'block', lineHeight: 1.4, marginBottom: 6 }}>
                    {h.desc}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: active ? C.accent : C.forest }}>
                    {monthlyCost}/month
                  </span>
                </button>
              )
            })}
          </div>
        ) : (
          /* Standard pathway — existing 4 cards + staying-family as 5th */
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(5, 1fr)', gap: 10 }}>
            {HOUSING.map(h => {
              const active = data.housing === h.value
              const isFamily = h.value === 'staying-family'
              return (
                <button
                  key={h.value}
                  type="button"
                  onClick={() => onChange('housing', h.value)}
                  aria-pressed={active}
                  style={{
                    padding: '14px 12px', borderRadius: 12, textAlign: 'center',
                    border:     active ? `2px solid ${C.accent}` : `1px solid ${C.border}`,
                    background: active ? `${C.accent}08` : C.white,
                    cursor: 'pointer', fontFamily: FONT, transition: 'all 0.15s', minHeight: 44,
                  }}
                >
                  <span style={{ fontSize: 22, display: 'block', marginBottom: 4 }} aria-hidden="true">{h.icon}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: active ? C.accent : C.forest, display: 'block' }}>
                    {h.label}
                  </span>
                  {isFamily && (
                    <span style={{ fontSize: 11, color: active ? C.accent : C.gray, display: 'block', marginTop: 2 }}>
                      $0/month
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        )}

        {errors.housing && (
          <p role="alert" style={{ fontSize: 12, color: C.red, margin: '6px 0 0', fontFamily: FONT }}>
            {errors.housing}
          </p>
        )}
      </div>

      {/* ── Staying with family advisory callout ────────────────────────────── */}
      {isStayingFamily && (
        <div style={{
          background: '#EAF4FB', border: `1px solid #3B9AC425`,
          borderRadius: 12, padding: '14px 16px', marginBottom: 24,
          display: 'flex', alignItems: 'flex-start', gap: 10,
        }}>
          <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }} aria-hidden="true">ℹ️</span>
          <p style={{ fontSize: 13, color: '#1A4A6B', margin: 0, lineHeight: 1.65, fontFamily: FONT }}>
            Living with family or friends significantly reduces your settlement costs. Consider budgeting
            a contribution to household expenses and maintaining a contingency fund of 2–3 months&apos; rent
            in case your arrangement changes.
          </p>
        </div>
      )}

      {/* ── Furnishing level cards (AC-1, AC-3) ────────────────────────────── */}
      {showFurnishing && (
        <div style={{ marginBottom: 24 }}>
          <Label>Furnishing level *</Label>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: 10 }}>
            {FURNISHING.map(f => {
              const active = data.furnishing === f.value
              return (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => onChange('furnishing', f.value)}
                  aria-pressed={active}
                  style={{
                    padding: '16px 18px', borderRadius: 12, textAlign: 'left',
                    border:     active ? `2px solid ${C.accent}` : `1px solid ${C.border}`,
                    background: active ? `${C.accent}08` : C.white,
                    cursor: 'pointer', fontFamily: FONT, transition: 'all 0.15s',
                  }}
                >
                  <span style={{ fontSize: 14, fontWeight: 700, color: active ? C.accent : C.forest, display: 'block' }}>
                    {f.label}
                  </span>
                  <span style={{ fontSize: 12, color: C.gray, display: 'block', marginTop: 3 }}>
                    {f.desc}
                  </span>
                </button>
              )
            })}
          </div>
          {errors.furnishing && (
            <p role="alert" style={{ fontSize: 12, color: C.red, margin: '6px 0 0', fontFamily: FONT }}>
              {errors.furnishing}
            </p>
          )}
        </div>
      )}

      {/* ── Childcare (shown only if household has children) (AC-1) ─────────── */}
      {hasChildren && (
        <div style={{ marginBottom: 20 }}>
          <Label>Will you need childcare?</Label>
          <Toggle value={data.childcare ?? false} onChange={v => onChange('childcare', v)} />
          {data.childcare && (
            <Helper>Estimated childcare cost: ~$1,200/month (varies by city).</Helper>
          )}
        </div>
      )}

      {/* ── Car ownership (AC-1) ───────────────────────────────────────────── */}
      <div style={{ marginBottom: 20 }}>
        <Label>Planning to own a car?</Label>
        <Toggle value={data.car ?? false} onChange={v => onChange('car', v)} />
        {data.car && (
          <Helper>Estimated car cost: ~$600/month (insurance, gas, maintenance).</Helper>
        )}
      </div>

      {/* ── Custom expenses + health insurance section ────────────────────── */}
      <div>
        <Label>Any other monthly expenses?</Label>

        {/* ── Study permit health insurance info card (§4.3) ──────────────── */}
        {isStudyPermit && healthEntry && (
          <>
            {/* Case 1: No provincial coverage — locked monthly cost line */}
            {hiNoCoverage && (
              <>
                {/* Locked expense row */}
                <div style={{
                  display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center',
                  padding: '10px 12px', borderRadius: 10,
                  background: `${C.gold}08`, border: `1px solid ${C.gold}25`,
                }}>
                  <div style={{ flex: 1, fontSize: 14, color: C.text, fontFamily: FONT, fontWeight: 500 }}>
                    {hiMechanism} Health Insurance
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.gold, fontFamily: FONT, minWidth: 80, textAlign: 'right' }}>
                    {fmtCAD(hiMonthly)}/mo
                  </div>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    fontSize: 10, fontWeight: 700, color: C.gold,
                    background: `${C.gold}18`, borderRadius: 5, padding: '3px 7px',
                    whiteSpace: 'nowrap',
                  }}>
                    <Lock size={11} color={C.gold} /> Required
                  </div>
                </div>

                {/* Info card */}
                <div style={{
                  background: '#FDF6E3', border: `1px solid ${C.gold}30`,
                  borderRadius: 10, padding: '12px 14px', marginBottom: 16,
                  display: 'flex', alignItems: 'flex-start', gap: 8,
                }}>
                  <Info size={14} color="#7A6010" style={{ flexShrink: 0, marginTop: 1 }} />
                  <p style={{ fontSize: 12, color: '#7A6010', margin: 0, lineHeight: 1.6, fontFamily: FONT }}>
                    International students in <strong>{provinceName}</strong> are required to have{' '}
                    <strong>{hiMechanism}</strong>. This cost is typically added to your tuition fees by your
                    institution. Estimated: <strong>{fmtCAD(hiAnnual)}/year</strong> (~{fmtCAD(hiMonthly)}/month).
                  </p>
                </div>
              </>
            )}

            {/* Case 2: Provincial coverage with waiting period — bridge insurance card */}
            {hiCoverageWait && (
              <div style={{
                background: '#FDF6E3', border: `1px solid ${C.gold}30`,
                borderRadius: 10, padding: '12px 14px', marginBottom: 16,
                display: 'flex', alignItems: 'flex-start', gap: 8,
              }}>
                <Info size={14} color="#7A6010" style={{ flexShrink: 0, marginTop: 1 }} />
                <p style={{ fontSize: 12, color: '#7A6010', margin: 0, lineHeight: 1.6, fontFamily: FONT }}>
                  <strong>{provinceName}</strong> provides provincial health coverage (
                  <strong>{hiMechanism}</strong>) after{' '}
                  <strong>{hiWaitMonths} month{hiWaitMonths !== 1 ? 's' : ''}</strong>. You will need bridge
                  insurance to cover the waiting period. Estimated one-time cost:{' '}
                  <strong>{fmtCAD(hiBridge)}</strong>.
                </p>
              </div>
            )}

            {/* Case 3: Provincial coverage, no waiting period — positive card */}
            {hiCoverageNoWait && (
              <div style={{
                background: '#E8F5EE', border: `1px solid ${C.accent}25`,
                borderRadius: 10, padding: '12px 14px', marginBottom: 16,
                display: 'flex', alignItems: 'flex-start', gap: 8,
              }}>
                <TaskAlt size={14} color={C.accent} style={{ flexShrink: 0, marginTop: 1 }} />
                <p style={{ fontSize: 12, color: C.accent, margin: 0, lineHeight: 1.6, fontFamily: FONT }}>
                  <strong>Good news</strong> — international students in <strong>{provinceName}</strong> are
                  eligible for provincial health coverage (<strong>{hiMechanism}</strong>) with no waiting period.
                  No additional health insurance cost is included in your estimate.
                </p>
              </div>
            )}
          </>
        )}

        {/* User-added custom expense rows */}
        {(data.customExpenses ?? []).map((exp, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Label (e.g. Language classes)"
              value={exp.label}
              aria-label={`Custom expense ${i + 1} label`}
              onChange={e => {
                const next = [...(data.customExpenses ?? [])]
                next[i] = { ...next[i], label: e.target.value }
                onChange('customExpenses', next)
              }}
              style={{ ...inputBase, flex: 1, maxWidth: 200 }}
            />
            <div style={{ position: 'relative', flex: '0 0 140px' }}>
              <span style={{
                position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
                fontSize: 12, color: C.textLight, fontFamily: FONT, pointerEvents: 'none',
              }}>
                CAD $
              </span>
              <input
                type="text"
                inputMode="decimal"
                placeholder="0"
                value={exp.amount}
                aria-label={`Custom expense ${i + 1} amount`}
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
              aria-label={`Remove expense: ${exp.label || `item ${i + 1}`}`}
              style={{
                width: 32, height: 32, borderRadius: 8, border: `1px solid ${C.border}`,
                background: C.white, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: C.red, flexShrink: 0,
              }}
            >
              <Close size={12} color={C.red} />
            </button>
          </div>
        ))}

        {/* Add expense button */}
        <button
          type="button"
          onClick={() => onChange('customExpenses', [...(data.customExpenses ?? []), { label: '', amount: '' }])}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '8px 14px', borderRadius: 8, border: `1px dashed ${C.border}`,
            background: 'transparent', color: C.accent, fontSize: 13, fontWeight: 600,
            cursor: 'pointer', fontFamily: FONT,
          }}
        >
          <Add size={14} color={C.accent} /> Add expense
        </button>
      </div>
    </div>
  )
}
