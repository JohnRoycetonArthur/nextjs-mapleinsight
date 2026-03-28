'use client'

/**
 * Step 2: Immigration Plan (US-11.3)
 *
 * Collects: immigration pathway (7 options), fees already paid (toggle),
 * biometrics done (toggle).
 *
 * When pathway === 'study_permit', renders a conditional sub-form that collects:
 *   - Program level (4 options)
 *   - Annual tuition (currency input, pre-populated with national average)
 *   - GIC status (3 options)
 *   - Scholarship / funding amount (currency input, optional)
 *
 * The sub-form expands with a smooth max-height animation and clears when the
 * user switches away from Study Permit.
 */

import { useState } from 'react'
import { C, FONT, SERIF } from '../constants'
import type { WizardAnswers } from '../../SettlementSessionContext'

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

// ─── Toggle (Yes / No) ────────────────────────────────────────────────────────

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
          padding: '10px 22px', borderRadius: 8, fontSize: 13, fontWeight: 600,
          border:     value === o.v ? `2px solid ${C.accent}` : `1px solid ${C.border}`,
          background: value === o.v ? `${C.accent}10` : C.white,
          color:      value === o.v ? C.accent : C.gray,
          cursor: 'pointer', fontFamily: FONT, transition: 'all 0.15s',
          minHeight: 44,   // touch target
        }}
      >{o.l}</button>
    ))}
  </div>
)

// ─── Currency input ────────────────────────────────────────────────────────────

function CurrencyInput({
  id, value, onChange, placeholder = '0',
}: { id?: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ position: 'relative', maxWidth: 280 }}>
      <div style={{
        position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
        fontSize: 13, fontWeight: 600, color: C.textLight, fontFamily: FONT, pointerEvents: 'none',
      }}>CAD $</div>
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
          width: '100%', paddingLeft: 62, paddingRight: 16, paddingTop: 12, paddingBottom: 12,
          borderRadius: 10, border: `1px solid ${focused ? C.accent : C.border}`,
          boxShadow: focused ? `0 0 0 3px ${C.forest}18` : 'none',
          fontSize: 14, fontFamily: FONT, color: C.text, outline: 'none', background: C.white,
          transition: 'border-color 0.2s, box-shadow 0.2s',
        }}
      />
    </div>
  )
}

// ─── Pathway data ─────────────────────────────────────────────────────────────

const PATHWAYS = [
  {
    value: 'express_entry',
    label: 'Express Entry',
    icon:  '🚀',
    desc:  'Apply as a skilled worker through the federal points-based system (FSW, CEC, or Skilled Trades).',
    color: C.accent,
    irccKey: 'express-entry-fsw',
  },
  {
    value: 'pnp',
    label: 'Provincial Nominee',
    icon:  '🏛️',
    desc:  'Nominated by a province or territory for permanent residence through a stream matching your profile.',
    color: C.blue,
    irccKey: 'pnp',
  },
  {
    value: 'study_permit',
    label: 'Study Permit',
    icon:  '🎓',
    desc:  'Study at a designated learning institution in Canada as an international student.',
    color: C.purple,
    irccKey: 'study-permit',
  },
  {
    value: 'work_permit',
    label: 'Work Permit',
    icon:  '💼',
    desc:  'Work in Canada temporarily under an LMIA-based, intra-company transfer, or open work permit.',
    color: C.gold,
    irccKey: 'work-permit',
  },
  {
    value: 'family',
    label: 'Family Sponsorship',
    icon:  '👨‍👩‍👧',
    desc:  'Sponsored for permanent residence by a Canadian citizen or permanent resident family member.',
    color: C.red,
    irccKey: 'family-sponsorship',
  },
  {
    value: 'refugee',
    label: 'Refugee / Protected',
    icon:  '🛡️',
    desc:  'Protected person status through a refugee claim, government sponsorship, or private sponsorship.',
    color: C.forest,
    irccKey: 'other',
  },
  {
    value: 'other',
    label: 'Other / Not Sure',
    icon:  '❓',
    desc:  'Another pathway or still exploring options — we\'ll use general federal fee defaults.',
    color: C.gray,
    irccKey: 'other',
  },
]

// ─── Study permit: tuition benchmarks ────────────────────────────────────────
// Source: Statistics Canada / ApplyBoard national averages (effective Sept 2025)
// These mirror STUDY_PERMIT_DEFAULTS.tuitionBenchmarks and are used to
// pre-populate the tuition field before Sanity data is available.

const TUITION_BENCHMARKS: Record<string, number> = {
  undergraduate:    41_746,
  graduate:         24_028,
  college_diploma:  14_500,   // midpoint of $7,000–$22,000 range
  language_school:   8_000,   // typical ESL/FSL program annual cost
}

const TUITION_LABELS: Record<string, string> = {
  undergraduate:   '$41,746',
  graduate:        '$24,028',
  college_diploma: '$14,500',
  language_school: '$8,000',
}

const PROGRAM_LEVELS = [
  { value: 'undergraduate',   label: 'Undergraduate', icon: '🎓', desc: 'Bachelor\'s degree program at a university' },
  { value: 'graduate',        label: 'Graduate',       icon: '📜', desc: 'Master\'s or doctoral program' },
  { value: 'college_diploma', label: 'College / Diploma', icon: '🏫', desc: 'College certificate or diploma program' },
  { value: 'language_school', label: 'Language School', icon: '🗣️', desc: 'ESL, FSL, or other language training' },
]

const GIC_OPTIONS = [
  {
    value: 'planning',
    label: 'Planning to purchase',
    icon:  '📋',
    desc:  'I will buy a GIC before applying.',
    detail: 'The engine will add the IRCC minimum GIC amount ($22,895) and bank processing fee (~$200) to your upfront costs.',
  },
  {
    value: 'purchased',
    label: 'Already purchased',
    icon:  '✅',
    desc:  'I have already bought a GIC.',
    detail: 'Your GIC is committed — it will be noted in your plan as secured funds, not added as a new cost.',
  },
  {
    value: 'not_purchasing',
    label: 'Not purchasing',
    icon:  '🚫',
    desc:  'I am not using a GIC.',
    detail: 'GIC costs will be excluded. Note: a GIC is required for the Student Direct Stream (SDS) fast-track.',
  },
]

// ─── GIC tooltip pill ─────────────────────────────────────────────────────────

const InfoIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }}>
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/>
    <line x1="12" y1="8" x2="12.01" y2="8"/>
  </svg>
)

// ─── Study permit sub-form ────────────────────────────────────────────────────

type StudyPermitData = NonNullable<WizardAnswers['studyPermit']>

interface SubFormProps {
  sp:          StudyPermitData
  onSPChange:  (patch: Partial<StudyPermitData>) => void
  isMobile:    boolean
  errors:      Record<string, string>
}

function StudyPermitSubForm({ sp, onSPChange, isMobile, errors }: SubFormProps) {
  const avgLabel = sp.programLevel ? TUITION_LABELS[sp.programLevel] : null

  return (
    <div
      style={{
        background:   `${C.purple}04`,
        border:       `1px solid ${C.border}`,
        borderRadius: 16,
        padding:      isMobile ? '20px 16px' : '24px 24px',
        marginTop:    24,
      }}
    >
      {/* Sub-form header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <span style={{ fontSize: 22 }} aria-hidden="true">📚</span>
        <div>
          <div style={{ fontFamily: SERIF, fontSize: 17, fontWeight: 700, color: C.forest }}>
            Study Permit Details
          </div>
          <div style={{ fontSize: 12, color: C.textLight, fontFamily: FONT, marginTop: 2 }}>
            These fields shape IRCC proof-of-funds and your upfront cost estimate.
          </div>
        </div>
      </div>

      {/* ── 1. Program level ─────────────────────────────────────────────── */}
      <div style={{ marginBottom: 22 }}>
        <Label>Program level *</Label>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: 8 }}>
          {PROGRAM_LEVELS.map(pl => (
            <button
              key={pl.value}
              type="button"
              onClick={() => {
                const benchmark = TUITION_BENCHMARKS[pl.value] ?? 0
                onSPChange({
                  programLevel:  pl.value,
                  tuitionAmount: benchmark,
                })
              }}
              aria-pressed={sp.programLevel === pl.value}
              style={{
                padding: '14px 12px', borderRadius: 12, textAlign: 'center',
                border:     sp.programLevel === pl.value ? `2px solid ${C.purple}` : `1px solid ${C.border}`,
                background: sp.programLevel === pl.value ? `${C.purple}0a` : C.white,
                cursor: 'pointer', transition: 'all 0.15s', fontFamily: FONT,
                minHeight: 44,
              }}
            >
              <span style={{ fontSize: 20, display: 'block', marginBottom: 4 }}>{pl.icon}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: sp.programLevel === pl.value ? C.purple : C.forest, display: 'block', lineHeight: 1.2 }}>{pl.label}</span>
              <span style={{ fontSize: 11, color: C.gray, display: 'block', marginTop: 3, lineHeight: 1.3 }}>{pl.desc}</span>
            </button>
          ))}
        </div>
        {errors.studyPermitProgramLevel && (
          <p role="alert" style={{ fontSize: 12, color: C.red, margin: '6px 0 0', fontFamily: FONT }}>
            {errors.studyPermitProgramLevel}
          </p>
        )}
      </div>

      {/* ── 2. Annual tuition ─────────────────────────────────────────────── */}
      <div style={{ marginBottom: 22 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <Label htmlFor="tuition-input">Annual tuition amount</Label>
          {avgLabel && (
            <span style={{
              fontSize: 11, fontWeight: 700, color: C.purple,
              background: `${C.purple}12`, borderRadius: 5,
              padding: '2px 8px', marginBottom: 8, whiteSpace: 'nowrap',
            }}>
              National average {avgLabel}
            </span>
          )}
        </div>
        <CurrencyInput
          id="tuition-input"
          value={sp.tuitionAmount > 0 ? String(sp.tuitionAmount) : ''}
          onChange={v => onSPChange({ tuitionAmount: parseFloat(v.replace(/,/g, '')) || 0 })}
          placeholder={sp.programLevel ? String(TUITION_BENCHMARKS[sp.programLevel] ?? '0') : '0'}
        />
        <Helper>You can change this to your actual tuition amount.</Helper>
      </div>

      {/* ── 3. GIC status ─────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 22 }}>
        <Label>Guaranteed Investment Certificate (GIC) status</Label>
        {/* What is a GIC? */}
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: 8,
          background: '#F0F4FF', border: `1px solid ${C.blue}20`,
          borderRadius: 8, padding: '10px 14px', marginBottom: 12,
          fontSize: 12, color: C.gray, fontFamily: FONT, lineHeight: 1.5,
        }}>
          <span style={{ color: C.blue, marginTop: 1 }}><InfoIcon /></span>
          <span>
            A <strong style={{ color: C.text }}>GIC (Guaranteed Investment Certificate)</strong> is a
            Canadian bank deposit required by IRCC for many study permit applicants. Funds are held for
            12 months and then released monthly for living expenses. The current minimum is{' '}
            <strong style={{ color: C.text }}>$22,895 CAD</strong>.
          </span>
        </div>

        {/* SDS mandatory GIC note */}
        {sp.isSDS && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: `${C.purple}10`, border: `1px solid ${C.purple}30`,
            borderRadius: 8, padding: '8px 12px', marginBottom: 12,
            fontSize: 12, color: C.purple, fontFamily: FONT, fontWeight: 600,
          }}>
            <InfoIcon />
            GIC is required for SDS applications.
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: 8 }}>
          {GIC_OPTIONS.map(g => {
            const isDisabled = sp.isSDS && g.value === 'not_purchasing'
            return (
              <button
                key={g.value}
                type="button"
                onClick={() => { if (!isDisabled) onSPChange({ gicStatus: g.value }) }}
                aria-pressed={sp.gicStatus === g.value}
                disabled={isDisabled}
                style={{
                  padding: '14px 16px', borderRadius: 12, textAlign: 'left',
                  border:     sp.gicStatus === g.value ? `2px solid ${C.purple}` : `1px solid ${C.border}`,
                  background: isDisabled ? C.lightGray : sp.gicStatus === g.value ? `${C.purple}0a` : C.white,
                  cursor:     isDisabled ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s', fontFamily: FONT,
                  minHeight: 44, opacity: isDisabled ? 0.45 : 1,
                }}
              >
                <span style={{ fontSize: 18, display: 'block', marginBottom: 5 }}>{g.icon}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: sp.gicStatus === g.value ? C.purple : C.forest, display: 'block', lineHeight: 1.2 }}>{g.label}</span>
                <span style={{ fontSize: 11, color: C.gray, display: 'block', marginTop: 4, lineHeight: 1.4 }}>{g.desc}</span>
                {sp.gicStatus === g.value && !isDisabled && (
                  <span style={{ fontSize: 11, color: C.purple, display: 'block', marginTop: 6, lineHeight: 1.4, fontStyle: 'italic' }}>{g.detail}</span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── 4. SDS toggle ─────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 22 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <Label>Are you applying through the Student Direct Stream (SDS)?</Label>
          {/* Tooltip */}
          <div style={{ position: 'relative', display: 'inline-flex' }} className="sds-tooltip-wrap">
            <span
              style={{ color: C.blue, cursor: 'default', display: 'inline-flex', marginBottom: 8 }}
              title="The Student Direct Stream (SDS) is an expedited study permit processing program for applicants from eligible countries (India, China, Philippines, Vietnam, and others). SDS requires a GIC of at least $10,000 CAD and an IELTS score of 6.0 or higher. Processing is typically 20 days."
            >
              <InfoIcon />
            </span>
          </div>
        </div>
        <SwitchToggle
          label="Yes, I am applying through SDS"
          checked={sp.isSDS ?? false}
          onChange={() => {
            const newIsSDS = !(sp.isSDS ?? false)
            // If enabling SDS, ensure gicStatus is not 'not_purchasing'
            const patch: Parameters<typeof onSPChange>[0] = { isSDS: newIsSDS }
            if (newIsSDS && sp.gicStatus === 'not_purchasing') {
              patch.gicStatus = 'planning'
            }
            onSPChange(patch)
          }}
          helper="SDS offers ~20-day processing for eligible countries. A GIC is mandatory."
        />
      </div>

      {/* ── 5. Scholarship / funding ──────────────────────────────────────── */}
      <div>
        <Label htmlFor="scholarship-input">Scholarship / external funding (optional)</Label>
        <CurrencyInput
          id="scholarship-input"
          value={sp.scholarshipAmount > 0 ? String(sp.scholarshipAmount) : ''}
          onChange={v => onSPChange({ scholarshipAmount: parseFloat(v.replace(/,/g, '')) || 0 })}
          placeholder="0"
        />
        <Helper>Include any scholarships, grants, or external funding you have secured. This reduces your savings gap.</Helper>
      </div>
    </div>
  )
}

// ─── Step 2: Immigration Plan ─────────────────────────────────────────────────

interface Props {
  data:     WizardAnswers
  onChange: (key: keyof WizardAnswers, value: unknown) => void
  errors:   Record<string, string>
  isMobile: boolean
}

// ─── Express Entry sub-class data ────────────────────────────────────────────

const EE_SUB_CLASSES = [
  { code: 'FSW', value: 'fsw',    title: 'Federal Skilled Worker',   desc: 'Points-based selection for skilled workers' },
  { code: 'CEC', value: 'cec',    title: 'Canadian Experience Class', desc: 'For those with Canadian work experience' },
  { code: 'FST', value: 'fst',    title: 'Federal Skilled Trades',    desc: 'For qualified tradespeople' },
  { code: '?',   value: 'unsure', title: 'Not Sure',                  desc: 'Apply conservative (FSW) requirements' },
]

const DEFAULT_EXPRESS_ENTRY: NonNullable<WizardAnswers['expressEntry']> = {
  subClass:         'fsw',
  hasJobOffer:      false,
  isWorkAuthorized: false,
}

// ─── SubClassCard ─────────────────────────────────────────────────────────────

function SubClassCard({
  code, title, desc, selected, onClick,
}: { code: string; title: string; desc: string; selected: boolean; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      role="button"
      aria-pressed={selected}
      tabIndex={0}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onClick() }}
      style={{
        flex: '1 1 140px', padding: '14px 16px', borderRadius: 12, cursor: 'pointer',
        border:     `2px solid ${selected ? C.gold : C.border}`,
        background: selected ? '#FFFBEB' : C.white,
        transition: 'all 0.15s',
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 700, color: selected ? C.gold : C.text, fontFamily: FONT }}>{code}</div>
      <div style={{ fontFamily: SERIF, fontSize: 15, color: C.forest, margin: '4px 0 2px', fontWeight: 700 }}>{title}</div>
      <div style={{ fontSize: 11, color: C.gray, lineHeight: 1.4 }}>{desc}</div>
    </div>
  )
}

// ─── SwitchToggle ─────────────────────────────────────────────────────────────

function SwitchToggle({
  label, checked, onChange: handleChange, helper,
}: { label: string; checked: boolean; onChange: () => void; helper?: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 12,
      padding: '12px 16px',
      background: checked ? '#FFFBEB' : C.lightGray,
      borderRadius: 10, marginBottom: 8,
    }}>
      <div
        onClick={handleChange}
        role="switch"
        aria-checked={checked}
        tabIndex={0}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') handleChange() }}
        style={{
          width: 40, height: 22, borderRadius: 11,
          background: checked ? C.gold : C.border,
          position: 'relative', cursor: 'pointer', flexShrink: 0, marginTop: 2,
          transition: 'background 0.2s',
        }}
      >
        <div style={{
          width: 18, height: 18, borderRadius: 9, background: C.white,
          position: 'absolute', top: 2, left: checked ? 20 : 2,
          transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
        }} />
      </div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: C.text, fontFamily: FONT }}>{label}</div>
        {helper && <div style={{ fontSize: 11, color: C.textLight, marginTop: 2 }}>{helper}</div>}
      </div>
    </div>
  )
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_STUDY_PERMIT: NonNullable<WizardAnswers['studyPermit']> = {
  programLevel:      '',
  tuitionAmount:     0,
  gicStatus:         'planning',
  scholarshipAmount: 0,
  isSDS:             false,
}

export function Step2Immigration({ data, onChange, errors, isMobile }: Props) {
  const isStudyPermit   = data.pathway === 'study_permit'
  const isExpressEntry  = data.pathway === 'express_entry'
  const ee              = data.expressEntry ?? DEFAULT_EXPRESS_ENTRY
  const showJobOffer    = isExpressEntry && (ee.subClass === 'cec' || ee.subClass === 'fst')
  const showWorkAuth    = isExpressEntry && ee.subClass === 'cec' && ee.hasJobOffer

  const handlePathwayChange = (pathwayValue: string) => {
    onChange('pathway', pathwayValue)
    if (pathwayValue === 'study_permit') {
      if (!data.studyPermit) {
        onChange('studyPermit', { ...DEFAULT_STUDY_PERMIT })
      }
    } else {
      onChange('studyPermit', null)
    }
    if (pathwayValue === 'express_entry') {
      if (!data.expressEntry) {
        onChange('expressEntry', { ...DEFAULT_EXPRESS_ENTRY })
      }
    } else {
      onChange('expressEntry', undefined)
    }
  }

  const handleEEChange = (patch: Partial<NonNullable<WizardAnswers['expressEntry']>>) => {
    onChange('expressEntry', { ...(data.expressEntry ?? DEFAULT_EXPRESS_ENTRY), ...patch })
  }

  const handleStudyPermitChange = (patch: Partial<NonNullable<WizardAnswers['studyPermit']>>) => {
    onChange('studyPermit', {
      ...(data.studyPermit ?? DEFAULT_STUDY_PERMIT),
      ...patch,
    })
  }

  return (
    <div>
      <h2 style={{ fontFamily: SERIF, fontSize: 24, color: C.forest, margin: '0 0 6px' }}>
        Your immigration pathway
      </h2>
      <p style={{ fontSize: 14, color: C.gray, margin: '0 0 28px', lineHeight: 1.6, fontFamily: FONT }}>
        This determines which fees and program rules apply to your estimate.
      </p>

      {/* ── Pathway card selector ─────────────────────────────────────────── */}
      <div style={{ marginBottom: 24 }}>
        <Label>Immigration pathway *</Label>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 10 }}>
          {PATHWAYS.map(p => (
            <button
              key={p.value}
              type="button"
              onClick={() => handlePathwayChange(p.value)}
              aria-pressed={data.pathway === p.value}
              style={{
                padding: '16px 18px', borderRadius: 12, textAlign: 'left',
                border:     data.pathway === p.value ? `2px solid ${p.color}` : `1px solid ${C.border}`,
                background: data.pathway === p.value ? `${p.color}08` : C.white,
                cursor: 'pointer', transition: 'all 0.15s', fontFamily: FONT,
                minHeight: 44,
              }}
            >
              <span style={{ fontSize: 20, display: 'block', marginBottom: 6 }} aria-hidden="true">{p.icon}</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: C.forest, display: 'block', lineHeight: 1.3 }}>{p.label}</span>
              <span style={{ fontSize: 12, color: C.gray, display: 'block', marginTop: 3, lineHeight: 1.4 }}>{p.desc}</span>
            </button>
          ))}
        </div>
        {errors.pathway && (
          <p role="alert" style={{ fontSize: 12, color: C.red, margin: '6px 0 0', fontFamily: FONT }}>
            {errors.pathway}
          </p>
        )}
      </div>

      {/* ── Express Entry: sub-class selector + conditional toggles ─────── */}
      <div
        aria-hidden={!isExpressEntry}
        style={{
          maxHeight:  isExpressEntry ? '600px' : '0px',
          overflow:   'hidden',
          transition: 'max-height 0.4s ease-in-out',
        }}
      >
        {isExpressEntry && (
          <div style={{
            background: C.white, borderRadius: 14, border: `1px solid ${C.border}`,
            padding: 20, marginBottom: 16,
          }}>
            {/* Sub-class header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <span style={{ fontSize: 20 }} aria-hidden="true">🎯</span>
              <div>
                <Label>Which Express Entry class are you applying under?</Label>
                <Helper>This determines whether proof of funds is required.</Helper>
              </div>
            </div>

            {/* Sub-class cards */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
              {EE_SUB_CLASSES.map(sc => (
                <SubClassCard
                  key={sc.value}
                  code={sc.code}
                  title={sc.title}
                  desc={sc.desc}
                  selected={ee.subClass === sc.value}
                  onClick={() => {
                    const reset = { hasJobOffer: false, isWorkAuthorized: false }
                    handleEEChange(sc.value === 'cec' ? { subClass: sc.value } : { subClass: sc.value, ...reset })
                  }}
                />
              ))}
            </div>

            {/* Job offer toggle (CEC or FST) */}
            {showJobOffer && (
              <SwitchToggle
                label="Do you have a valid job offer from a Canadian employer?"
                checked={ee.hasJobOffer}
                onChange={() => handleEEChange({ hasJobOffer: !ee.hasJobOffer, isWorkAuthorized: false })}
                helper="A job offer from an LMIA-exempt or LMIA-approved employer"
              />
            )}

            {/* Work authorization toggle (CEC + job offer only) */}
            {showWorkAuth && (
              <SwitchToggle
                label="Are you currently authorized to work in Canada?"
                checked={ee.isWorkAuthorized}
                onChange={() => handleEEChange({ isWorkAuthorized: !ee.isWorkAuthorized })}
                helper="You hold a valid work permit or PGWP"
              />
            )}
          </div>
        )}
      </div>

      {/* ── Study permit conditional sub-form (smooth expand) ────────────── */}
      <div
        aria-hidden={!isStudyPermit}
        style={{
          maxHeight:  isStudyPermit ? '1400px' : '0px',
          overflow:   'hidden',
          transition: 'max-height 0.4s ease-in-out',
        }}
      >
        {(isStudyPermit || data.studyPermit) && (
          <StudyPermitSubForm
            sp={data.studyPermit ?? DEFAULT_STUDY_PERMIT}
            onSPChange={handleStudyPermitChange}
            isMobile={isMobile}
            errors={errors}
          />
        )}
      </div>

      {/* ── Fees paid toggle ──────────────────────────────────────────────── */}
      <div style={{ marginBottom: 20, marginTop: isStudyPermit ? 24 : 0 }}>
        <Label>Have you already paid your application fees?</Label>
        <Toggle
          value={data.feesPaid ?? false}
          onChange={v => onChange('feesPaid', v)}
        />
        <Helper>
          {isStudyPermit
            ? 'Includes the study permit fee ($150), biometrics, and medical exam.'
            : 'Government application processing and program fees.'}
        </Helper>
      </div>

      {/* ── Biometrics done toggle ────────────────────────────────────────── */}
      <div>
        <Label>Have you completed biometrics?</Label>
        <Toggle
          value={data.biometricsDone ?? false}
          onChange={v => onChange('biometricsDone', v)}
        />
        <Helper>Biometrics (fingerprints + photo) are required for most applicants. Fee is $85 individual / $170 family.</Helper>
      </div>
    </div>
  )
}
