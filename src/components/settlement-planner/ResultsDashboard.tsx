'use client'

/**
 * Settlement Planner — Client Results Dashboard (US-13.1)
 *
 * Renders the full results page after wizard completion.
 * Reads session context, runs the settlement engine client-side,
 * evaluates risks, and displays all required sections.
 */

import { useState, useEffect, useMemo } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine, ResponsiveContainer,
} from 'recharts'
import {
  generateVerdict,
  computeTimeToDepletion,
  getPriorityAction,
  generateTimelineGuidance,
  modelIncomeScenarios,
  type NarrativeOutput,
  type DepletionResult,
  type PriorityAction,
  type TimelineItem,
  type ScenarioSet,
} from '@/lib/settlement-engine/narrative'
import { useSettlementSession } from './SettlementSessionContext'
import { fetchCityBaseline } from '@/lib/settlement-engine/baselines'
import { runEngine } from '@/lib/settlement-engine/calculate'
import { evaluateRisks, type RiskContext } from '@/lib/settlement-engine/risks'
import {
  STUDY_PERMIT_DEFAULTS,
  buildIRCCComplianceResult,
} from '@/lib/settlement-engine/study-permit'
import {
  getComplianceRequirement,
  EXPRESS_ENTRY_DEFAULTS,
} from '@/lib/settlement-engine/compliance'
import type { CityBaseline } from '@/lib/settlement-engine/baselines'
import type {
  EngineInput,
  EngineOutput,
  ImmigrationPathway,
  JobStatus,
  HousingType,
  FurnishingLevel,
} from '@/lib/settlement-engine/types'
import type { ConsultantBranding } from './wizard/WizardShell'
import { ConsultantReport } from './ConsultantReport'
import { generateReportPackage, downloadReportPackage, type MapleReportPackage } from '@/lib/settlement-engine/export'
import { generateChecklist, type ChecklistItem } from '@/lib/settlement-engine/checklist'
import { SendToConsultantModal } from './SendToConsultantModal'

// ─── Design tokens ────────────────────────────────────────────────────────────

const C = {
  forest:    '#1B4F4A', accent: '#1B7A4A', gold: '#B8860B',
  red:       '#C41E3A', blue:   '#2563EB', purple: '#9333EA',
  gray:      '#6B7280', lightGray: '#F3F4F6', border: '#E5E7EB',
  white:     '#FFFFFF', text: '#374151', textLight: '#9CA3AF', bg: '#FAFBFC',
}
const FONT  = "'DM Sans', Helvetica, sans-serif"
const SERIF = "'DM Serif Display', Georgia, serif"

// ─── Formatters ───────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(n)

// ─── Mapping helpers ──────────────────────────────────────────────────────────

function parseAmount(s: string | undefined): number {
  if (!s) return 0
  return parseFloat(s.replace(/,/g, '')) || 0
}

function mapPathway(w: string | undefined): ImmigrationPathway {
  switch (w) {
    case 'study_permit':  return 'study-permit'
    case 'work_permit':   return 'work-permit'
    case 'pnp':           return 'pnp'
    case 'family':        return 'family-sponsorship'
    case 'express_entry': return 'express-entry-fsw'
    default:              return 'other'
  }
}

function mapJobStatus(w: string | undefined): JobStatus {
  switch (w) {
    case 'secured_30':  return 'secured'
    case 'offer_30_90': return 'offer'
    case 'student':     return 'student'
    default:            return 'none'
  }
}

function mapHousing(w: string | undefined): HousingType {
  if (w === 'studio')         return 'studio'
  if (w === '2br' || w === '3br') return '2br'
  if (w === 'shared-room')    return 'shared-room'
  if (w === 'on-campus')      return 'on-campus'
  if (w === 'homestay')       return 'homestay'
  if (w === 'staying-family') return 'staying-family'
  return '1br'
}

function mapFurnishing(w: string | undefined): FurnishingLevel {
  if (w === 'minimal') return 'furnished'
  if (w === 'full')    return 'standard'
  return 'basic'
}

function mapGICStatus(s: string | undefined): 'planning' | 'purchased' | 'not-purchasing' {
  if (s === 'purchased')                           return 'purchased'
  if (s === 'not_purchasing' || s === 'not-purchasing') return 'not-purchasing'
  return 'planning'
}

function mapProgramLevel(s: string | undefined): 'undergraduate' | 'graduate' | 'college-diploma' | 'language-school' {
  if (s === 'college_diploma' || s === 'college-diploma') return 'college-diploma'
  if (s === 'language_school' || s === 'language-school') return 'language-school'
  if (s === 'graduate') return 'graduate'
  return 'undergraduate'
}

// ─── Display lookups ──────────────────────────────────────────────────────────

const CITY_LABELS: Record<string, string> = {
  toronto: 'Toronto', vancouver: 'Vancouver', calgary: 'Calgary',
  montreal: 'Montréal', ottawa: 'Ottawa', halifax: 'Halifax', winnipeg: 'Winnipeg',
}

const PROVINCE_NAMES: Record<string, string> = {
  ON: 'Ontario', BC: 'British Columbia', AB: 'Alberta', QC: 'Quebec',
  MB: 'Manitoba', SK: 'Saskatchewan', NS: 'Nova Scotia', NB: 'New Brunswick',
  PE: 'Prince Edward Island', NL: 'Newfoundland & Labrador',
}


const PATHWAY_LABELS: Record<string, string> = {
  express_entry: 'Express Entry', pnp: 'Provincial Nominee Program',
  study_permit: 'Study Permit', work_permit: 'Work Permit',
  family: 'Family Sponsorship', refugee: 'Refugee Protection', other: 'Other Pathway',
}

const DEPARTURE_REGION_LABELS: Record<string, string> = {
  'north-america':    'USA / Mexico / Caribbean',
  'south-america':    'South & Central America',
  'uk-europe':        'UK / Europe',
  'south-asia':       'South Asia',
  'east-se-asia':     'East & Southeast Asia',
  'africa-west-east': 'West & East Africa',
  'africa-south':     'Southern Africa',
  'middle-east-na':   'Middle East / North Africa',
  'domestic':         'Within Canada',
}

const HOUSING_TYPE_LABELS: Record<string, string> = {
  'studio':         'Studio apartment',
  '1br':            '1-bedroom apartment',
  '2br':            '2-bedroom apartment',
  'shared-room':    'Shared room',
  'on-campus':      'On-campus residence',
  'homestay':       'Homestay',
  'staying-family': 'Staying with family',
}

// ─── Severity display ─────────────────────────────────────────────────────────

const SEV_COLOR: Record<string, string> = { critical: C.red, high: C.red, medium: C.gold, low: C.blue }
const SEV_BG:    Record<string, string> = { critical: '#FEF2F2', high: '#FEF2F2', medium: '#FDF6E3', low: '#EFF6FF' }
const SEV_LABEL: Record<string, string> = { critical: 'Critical', high: 'High', medium: 'Medium', low: 'Low' }

// ─── Source badge labels ──────────────────────────────────────────────────────

const SOURCE_MAP: Record<string, string> = {
  ircc: 'IRCC', cmhc: 'CMHC', constant: 'Estimate', estimate: 'Estimate',
  'user-input': 'Your input', provincial: 'Provincial', bank: 'Bank',
  'national-average': 'National avg',
  'toronto-on': 'TTC', 'vancouver-bc': 'TransLink', 'calgary-ab': 'Calgary Transit',
  'montreal-qc': 'STM', 'ottawa-on': 'OC Transpo', 'halifax-ns': 'Halifax Transit',
  'winnipeg-mb': 'Winnipeg Transit',
}

function sourceLabel(s: string): string {
  return SOURCE_MAP[s] ?? s.toUpperCase()
}


// ─── SVG icons ────────────────────────────────────────────────────────────────

const MapleLeaf = ({ size = 14, color = C.red }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden="true">
    <path d="M12 0L13.5 6.5L17 4L15.5 8.5L22 9L17 12L20 16L14 14L12 24L10 14L4 16L7 12L2 9L8.5 8.5L7 4L10.5 6.5Z"/>
  </svg>
)

const DownloadIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/>
    <line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
)

const SendIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="22" y1="2" x2="11" y2="13"/>
    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
)

const FileIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
  </svg>
)

const CalendarIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.red} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
)

const ChevDown = ({ open }: { open: boolean }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
    style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
    aria-hidden="true"
  >
    <polyline points="6 9 12 15 18 9"/>
  </svg>
)

const ArrowRight = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
    style={{ marginLeft: 3 }} aria-hidden="true"
  >
    <line x1="5" y1="12" x2="19" y2="12"/>
    <polyline points="12 5 19 12 12 19"/>
  </svg>
)

const CheckIcon = ({ color = C.accent }: { color?: string }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
    style={{ flexShrink: 0, marginTop: 2 }} aria-hidden="true"
  >
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
    <polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
)

// ─── MetricTile ───────────────────────────────────────────────────────────────

function MetricTile({ label, value, sub, color, isMobile, explainerId, openExplainer, onToggleExplainer, explainerContent, statusBadge, isPrimary }: {
  label: string; value: string; sub?: string; color: string; isMobile: boolean
  explainerId?: string
  openExplainer?: string | null
  onToggleExplainer?: (id: string | null) => void
  explainerContent?: React.ReactNode
  statusBadge?: React.ReactNode
  isPrimary?: boolean
}) {
  const isOpen = explainerId ? openExplainer === explainerId : false
  return (
    <div style={{
      flex: isPrimary ? '2 1 280px' : '1 1 140px', background: C.white, borderRadius: 14,
      borderTop: `1px solid ${C.border}`, borderRight: `1px solid ${C.border}`,
      borderBottom: `1px solid ${C.border}`, borderLeft: `4px solid ${color}`,
      padding: isMobile ? '16px 14px' : '20px 22px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: C.textLight, textTransform: 'uppercase', letterSpacing: 0.7, fontFamily: FONT }}>
          {label}
        </div>
        {explainerId && onToggleExplainer && (
          <button
            type="button"
            onClick={() => onToggleExplainer(isOpen ? null : explainerId)}
            aria-expanded={isOpen}
            aria-label={`${isOpen ? 'Hide' : 'Show'} ${label} details`}
            style={{
              width: 22, height: 22, borderRadius: '50%', border: `1px solid ${C.border}`,
              background: isOpen ? C.lightGray : C.white,
              color: C.gray, fontSize: 13, fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: FONT, flexShrink: 0, lineHeight: 1,
            }}
          >
            ⓘ
          </button>
        )}
      </div>
      <div style={{ fontFamily: SERIF, fontSize: isMobile ? 24 : (isPrimary ? 30 : 28), fontWeight: 700, color: C.forest, lineHeight: 1.1 }}>
        {value}
      </div>
      {statusBadge}
      {sub && <div style={{ fontSize: 11, color: C.gray, marginTop: 3, fontFamily: FONT }}>{sub}</div>}
      {isOpen && explainerContent && (
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${C.lightGray}`, fontSize: 12, color: C.text, lineHeight: 1.6 }}>
          {explainerContent}
        </div>
      )}
    </div>
  )
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  consultant?: ConsultantBranding | null
}

// ─── ResultsDashboard ─────────────────────────────────────────────────────────

export function ResultsDashboard({ consultant }: Props) {
  const { session }  = useSettlementSession()
  const { answers }  = session

  const [isMobile,             setIsMobile]             = useState(false)
  const [prepareOpen,          setPrepareOpen]          = useState(false)
  const [baseline,             setBaseline]             = useState<CityBaseline | null>(null)
  const [baselineError,        setBaselineError]        = useState(false)
  const [openExplainer,        setOpenExplainer]        = useState<string | null>(null)
  const [showConsultantReport, setShowConsultantReport] = useState(false)
  const [pdfLoading,           setPdfLoading]           = useState(false)
  const [showSendModal,        setShowSendModal]        = useState(false)
  const [sendPackage,          setSendPackage]          = useState<MapleReportPackage | null>(null)

  // ── Responsive ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // ── Fetch city baseline ──────────────────────────────────────────────────────
  useEffect(() => {
    const city = answers.city ?? 'toronto'
    fetchCityBaseline(city)
      .then(b => setBaseline(b))
      .catch(() => setBaselineError(true))
  }, [answers.city])

  // ── Build EngineInput ────────────────────────────────────────────────────────
  const engineInput = useMemo<EngineInput | null>(() => {
    if (!baseline) return null

    const pathway   = mapPathway(answers.pathway)
    const isStudy   = pathway === 'study-permit'
    const feesPaid  = answers.feesPaid ?? false
    const bioDone   = answers.biometricsDone ?? false
    const adults    = answers.adults ?? 1

    const studyPermitInput: EngineInput['studyPermit'] = isStudy && answers.studyPermit
      ? {
          programLevel:      mapProgramLevel(answers.studyPermit.programLevel),
          tuitionAmount:     answers.studyPermit.tuitionAmount,
          gicStatus:         mapGICStatus(answers.studyPermit.gicStatus),
          gicAmount:         0,
          scholarshipAmount: answers.studyPermit.scholarshipAmount,
          biometricsDone:    bioDone,
          feesPaid,
        }
      : undefined

    const customMonthly = (answers.customExpenses ?? [])
      .reduce((sum, e) => sum + parseAmount(e.amount), 0)

    return {
      city:     answers.city ?? 'toronto',
      province: answers.province ?? 'ON',
      pathway,
      departureRegion: answers.departureRegion,
      fees: {
        applicationFee: isStudy ? 150 : pathway === 'express-entry-fsw' ? 1_365 : 1_050,
        biometricsFee:  adults >= 2 ? 170 : 85,
        biometricsPaid: bioDone,
      },
      housingType:           mapHousing(answers.housing),
      furnishingLevel:       mapFurnishing(answers.furnishing),
      household:             { adults, children: answers.children ?? 0 },
      needsChildcare:        answers.childcare ?? false,
      liquidSavings:         parseAmount(answers.savings),
      monthlyObligations:    parseAmount(answers.obligations),
      plansCar:              answers.car ?? false,
      customMonthlyExpenses: customMonthly,
      jobStatus:             mapJobStatus(answers.jobStatus),
      studyPermit:           studyPermitInput,
    }
  }, [baseline, answers])

  // ── Run engine ───────────────────────────────────────────────────────────────
  const engineOutput = useMemo<EngineOutput | null>(() => {
    if (!engineInput || !baseline) return null
    const dataVersion = `cmhc:${baseline.dataVersion}|ircc:2026-q1`
    const isStudy     = engineInput.pathway === 'study-permit'
    return runEngine(
      engineInput,
      baseline,
      dataVersion,
      isStudy ? STUDY_PERMIT_DEFAULTS : undefined,
    )
  }, [engineInput, baseline])

  // ── Risks & actions ──────────────────────────────────────────────────────────
  const { topRisks, topActions } = useMemo(() => {
    if (!engineInput || !engineOutput) return { topRisks: [], topActions: [] }
    const monthlyIncome =
      answers.incomeSource === 'engine_estimate'
        ? (answers.estimatedNetMonthly ?? 0)
        : parseAmount(answers.income)
    const ctx: RiskContext = {
      input:  engineInput,
      output: engineOutput,
      monthlyIncome,
      studyPermitData: engineInput.pathway === 'study-permit' ? STUDY_PERMIT_DEFAULTS : undefined,
    }
    const risks   = evaluateRisks(ctx, 3)
    const actions = risks.flatMap(r => r.actions).slice(0, 3)
    return { topRisks: risks, topActions: actions }
  }, [engineInput, engineOutput, answers])

  // ── IRCC compliance (study permit) ───────────────────────────────────────────
  const irccCompliance = useMemo(() => {
    if (!engineInput || engineInput.pathway !== 'study-permit') return null
    if (!engineInput.studyPermit) return null
    const familySize = engineInput.household.adults + engineInput.household.children
    const available  = engineInput.liquidSavings + (engineInput.studyPermit.scholarshipAmount ?? 0)
    return buildIRCCComplianceResult(
      familySize,
      engineInput.studyPermit.tuitionAmount,
      engineInput.province,
      available,
      STUDY_PERMIT_DEFAULTS,
    )
  }, [engineInput])

  // ── EE/PNP compliance requirement ────────────────────────────────────────────
  const complianceRequirement = useMemo(() => {
    if (!engineInput) return null
    if (engineInput.pathway === 'study-permit') return null
    const familySize = engineInput.household.adults + engineInput.household.children
    return getComplianceRequirement(engineInput.pathway, familySize, EXPRESS_ENTRY_DEFAULTS)
  }, [engineInput])

  // ── Narrative layer (R4) ─────────────────────────────────────────────────────
  // narrativeOutput is the NarrativeOutput interface — ready for US-13.4 (consultant report)
  // and US-13.2 (.maple.json export, `narrative` top-level key).
  const narrativeData = useMemo<(NarrativeOutput & { compGap: number | null; isExempt: boolean; irccRequired: number | null; monthlyIncome: number }) | null>(() => {
    if (!engineInput || !engineOutput) return null

    const monthlyIncome =
      answers.incomeSource === 'engine_estimate'
        ? (answers.estimatedNetMonthly ?? 0)
        : parseAmount(answers.income)

    // Determine compliance context
    const isStudy      = engineInput.pathway === 'study-permit'
    const irccRequired = isStudy && irccCompliance ? irccCompliance.required : complianceRequirement
    const irccAvailFunds = isStudy
      ? engineInput.liquidSavings + (engineInput.studyPermit?.scholarshipAmount ?? 0)
      : engineInput.liquidSavings
    const compGap      = irccRequired !== null ? Math.max(0, irccRequired - irccAvailFunds) : null
    const isExempt     = irccRequired === null

    const verdict = generateVerdict(engineOutput.savingsGap, compGap, isExempt)

    const depletion = computeTimeToDepletion(
      engineInput.liquidSavings,
      engineOutput.monthlyMin,
    )

    const priorityAction = getPriorityAction(
      {
        liquidSavings: engineInput.liquidSavings,
        monthlyMin:    engineOutput.monthlyMin,
        savingsGap:    engineOutput.savingsGap,
        monthlyIncome,
        runwayMonths:  engineOutput.runwayMonths,
      },
      { safeSavingsTarget: engineOutput.safeSavingsTarget, upfront: engineOutput.upfront },
      {
        required: irccRequired,
        gap:      compGap ?? 0,
        isExempt,
      },
    )

    const timelineGuidance = generateTimelineGuidance(
      {
        liquidSavings:   engineInput.liquidSavings,
        savingsCapacity: parseAmount(answers.savingsCapacity),
        savingsGap:      engineOutput.savingsGap,
        complianceGap:   compGap ?? 0,
        isStudyPermit:   isStudy,
      },
      {
        monthlyMin:        engineOutput.monthlyMin,
        safeSavingsTarget: engineOutput.safeSavingsTarget,
      },
    )

    const incomeScenarios = modelIncomeScenarios(
      engineInput.liquidSavings,
      engineOutput.monthlyMin,
      monthlyIncome,
      engineInput.pathway,
    )

    return {
      verdict, timeToDepletion: depletion, priorityAction, timelineGuidance, incomeScenarios,
      compGap, isExempt, irccRequired, monthlyIncome,
    }
  }, [engineInput, engineOutput, irccCompliance, complianceRequirement, answers])

  // ── Consultant Report view ───────────────────────────────────────────────────
  if (showConsultantReport && consultant && engineInput && engineOutput) {
    return (
      <ConsultantReport
        engineInput={engineInput}
        engineOutput={engineOutput}
        answers={answers}
        consultant={consultant}
        irccCompliance={irccCompliance}
        complianceRequirement={complianceRequirement}
        monthlyIncome={narrativeData?.monthlyIncome ?? 0}
        risks={topRisks}
        onBack={() => setShowConsultantReport(false)}
      />
    )
  }

  // ── Loading / error guard ────────────────────────────────────────────────────
  if (!baseline || !engineInput || !engineOutput) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: C.bg, fontFamily: FONT, fontSize: 15, color: C.gray,
      }}>
        {baselineError ? 'Unable to load city data. Please refresh.' : 'Preparing your plan…'}
      </div>
    )
  }

  // ── Derived values ───────────────────────────────────────────────────────────
  const savings       = engineInput.liquidSavings
  const gapPct        = Math.min(100, Math.round((savings / engineOutput.safeSavingsTarget) * 100))
  const runwayLabel   = `${engineOutput.runwayMonths} month${engineOutput.runwayMonths !== 1 ? 's' : ''}`
  const capacity      = parseAmount(answers.savingsCapacity)
  const monthsToClose = capacity > 0 && engineOutput.savingsGap > 0
    ? Math.ceil(engineOutput.savingsGap / capacity)
    : null

  const cityKey       = answers.city?.toLowerCase() ?? 'toronto'
  const cityLabel     = CITY_LABELS[cityKey] ?? (answers.city ?? 'your destination')
  const provinceName  = PROVINCE_NAMES[answers.province ?? ''] ?? ''
  const pathwayLabel  = PATHWAY_LABELS[answers.pathway ?? ''] ?? 'Immigration'
  const adults        = answers.adults ?? 1
  const children      = answers.children ?? 0
  const householdLabel = `${adults} adult${adults > 1 ? 's' : ''}${children > 0 ? ` · ${children} child${children > 1 ? 'ren' : ''}` : ''}`

  const consultantName = consultant?.displayName ?? 'your consultant'
  const companyName    = consultant?.companyName ?? 'Maple Insight'
  const companyAbbr    = companyName.split(/\s+/).slice(0, 2).map(w => w[0] ?? '').join('').toUpperCase() || 'MI'

  const isStudyPermit  = answers.pathway === 'study_permit'
  const showGICCard    = isStudyPermit && (answers.studyPermit?.gicStatus ?? 'planning') !== 'purchased'

  const checklist = generateChecklist(
    {
      pathway:   answers.pathway  ?? '',
      province:  answers.province ?? 'ON',
      city:      answers.city     ?? 'toronto',
      gicStatus: answers.studyPermit?.gicStatus ?? null,
    },
    topRisks,
  )

  // ── IRCC card derived values (study permit) ──────────────────────────────────
  let irccStatus: 'compliant' | 'amber' | 'deficit' = 'compliant'
  let irccBorderColor = C.accent
  let irccStatusText  = 'Meets IRCC requirements'
  let irccAvailable   = 0

  if (irccCompliance) {
    irccAvailable = engineInput.liquidSavings + (engineInput.studyPermit?.scholarshipAmount ?? 0)
    const ratio   = irccCompliance.shortfall / irccCompliance.required
    irccStatus      = irccCompliance.compliant ? 'compliant' : ratio <= 0.1 ? 'amber' : 'deficit'
    irccBorderColor = irccStatus === 'compliant' ? C.accent : irccStatus === 'amber' ? C.gold : C.red
    irccStatusText  = irccStatus === 'compliant'
      ? 'Meets IRCC requirements'
      : irccStatus === 'amber'
      ? 'Close to minimum — strengthen documentation'
      : 'Application may be refused'
  }

  // ── EE/PNP compliance derived values ─────────────────────────────────────────
  let eeStatus: 'compliant' | 'amber' | 'deficit' = 'compliant'
  let eeBorderColor = C.accent
  let eeStatusText  = 'Meets IRCC requirements'

  if (complianceRequirement !== null) {
    const gap   = complianceRequirement - savings
    const ratio = complianceRequirement > 0 ? gap / complianceRequirement : 0
    eeStatus      = savings >= complianceRequirement ? 'compliant' : ratio <= 0.1 ? 'amber' : 'deficit'
    eeBorderColor = eeStatus === 'compliant' ? C.accent : eeStatus === 'amber' ? C.gold : C.red
    eeStatusText  = eeStatus === 'compliant'
      ? 'Meets IRCC requirements'
      : eeStatus === 'amber'
      ? 'Close to minimum — strengthen documentation'
      : 'Below IRCC minimum — application at risk'
  }

  // ─── Report Package download (US-13.2) ────────────────────────────────────
  function handleDownloadReport() {
    if (!engineInput || !engineOutput) return
    const pkg = generateReportPackage({
      engineInput,
      engineOutput,
      answers,
      consultant: consultant
        ? { slug: consultant.displayName.toLowerCase().replace(/\s+/g, '-'), displayName: consultant.displayName, companyName: consultant.companyName ?? null }
        : null,
      irccCompliance,
      complianceRequirement,
      monthlyIncome:  narrativeData?.monthlyIncome ?? 0,
      risks:          topRisks,
      narrative:      narrativeData ?? null,
    })
    const slug = consultant
      ? consultant.displayName.toLowerCase().replace(/\s+/g, '-')
      : 'plan'
    downloadReportPackage(pkg, slug)
  }

  // ─── PDF download (US-14.1) ───────────────────────────────────────────────
  async function handleDownloadPdf() {
    if (!engineInput || !engineOutput || pdfLoading) return
    setPdfLoading(true)
    try {
      const pkg = generateReportPackage({
        engineInput,
        engineOutput,
        answers,
        consultant: consultant
          ? { slug: consultant.displayName.toLowerCase().replace(/\s+/g, '-'), displayName: consultant.displayName, companyName: consultant.companyName ?? null }
          : null,
        irccCompliance,
        complianceRequirement,
        monthlyIncome: narrativeData?.monthlyIncome ?? 0,
        risks:         topRisks,
        narrative:     narrativeData ?? null,
      })
      const res = await fetch('/api/reports/generate-pdf?mode=client', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(pkg),
      })
      if (!res.ok) throw new Error('PDF generation failed')
      const blob     = await res.blob()
      const url      = URL.createObjectURL(blob)
      const a        = document.createElement('a')
      const date     = new Date().toISOString().slice(0, 10).replace(/-/g, '')
      a.href         = url
      a.download     = `mapleinsight_settlement_report_${date}.pdf`
      a.style.display = 'none'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch {
      // silently fail — user can still use browser print as fallback
    } finally {
      setPdfLoading(false)
    }
  }

  // ─── Open Send modal (US-14.2) ────────────────────────────────────────────
  function handleOpenSendModal() {
    if (!engineInput || !engineOutput) return
    const pkg = generateReportPackage({
      engineInput,
      engineOutput,
      answers,
      consultant: consultant
        ? { slug: consultant.slug, displayName: consultant.displayName, companyName: consultant.companyName ?? null }
        : null,
      irccCompliance,
      complianceRequirement,
      monthlyIncome: narrativeData?.monthlyIncome ?? 0,
      risks:         topRisks,
      narrative:     narrativeData ?? null,
    })
    setSendPackage(pkg)
    setShowSendModal(true)
  }

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: FONT }}>

      {/* ── Nav ──────────────────────────────────────────────────────────── */}
      <nav style={{ background: C.white, borderBottom: `1px solid ${C.border}`, padding: '0 24px', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 52 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 7,
              background: `linear-gradient(135deg, ${C.forest}, ${C.accent})`,
              color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 800, fontSize: 11, fontFamily: SERIF,
            }}>
              {companyAbbr}
            </div>
            {!isMobile && (
              <span style={{ fontFamily: SERIF, fontSize: 14, color: C.forest }}>{companyName}</span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {consultant && engineInput && engineOutput && (
              <button
                onClick={() => setShowConsultantReport(true)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px',
                  borderRadius: 6, border: `1px solid ${C.forest}40`,
                  background: `${C.forest}08`, color: C.forest,
                  cursor: 'pointer', fontFamily: FONT, fontSize: 12, fontWeight: 600,
                }}
                aria-label="View consultant intelligence report"
              >
                <span style={{ fontSize: 13 }}>📊</span>
                {!isMobile && 'Consultant Report'}
              </button>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: C.textLight }}>
              <span>Powered by</span>
              <MapleLeaf size={11} />
              <span style={{ fontFamily: SERIF, fontSize: 11, color: C.forest, fontWeight: 700 }}>Maple Insight</span>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <header style={{
        background: 'linear-gradient(165deg, #0F3D3A 0%, #1B5E58 40%, #1B7A4A 100%)',
        padding: isMobile ? '32px 20px 28px' : '44px 24px 40px',
        position: 'relative',
      }}>
        <div style={{ maxWidth: 760, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <h1 style={{ fontFamily: SERIF, fontSize: isMobile ? 24 : 32, fontWeight: 700, color: '#fff', margin: '0 0 6px', lineHeight: 1.15 }}>
            Your Settlement Plan
          </h1>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>
            <span>{cityLabel}{provinceName ? `, ${provinceName}` : ''}</span>
            <span>·</span>
            <span>{pathwayLabel}</span>
            <span>·</span>
            <span>{householdLabel}</span>
          </div>
        </div>
      </header>

      <section style={{ maxWidth: isMobile ? '100%' : 760, margin: '0 auto', padding: isMobile ? '22px 16px' : '36px 24px' }}>

        {/* ── AC-1: Metric Tiles ─────────────────────────────────────────── */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>

          {/* ── Compliance-first: EE / PNP ───────────────────────────────── */}
          {complianceRequirement !== null && (() => {
            const eeShortfall = Math.max(0, complianceRequirement - savings)
            const eeExplainer = (
              <div>
                <div style={{ fontWeight: 700, color: C.forest, marginBottom: 8, fontSize: 13 }}>
                  Express Entry / PNP Settlement Funds
                </div>
                <p style={{ margin: '0 0 10px' }}>
                  Under IRCC regulations, {answers.pathway === 'pnp' ? 'PNP' : 'Express Entry FSW/FSTP'} applicants must demonstrate sufficient settlement funds. The amount is based on family size using LICO (Low Income Cut-Off) benchmarks.
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: `1px solid ${C.lightGray}` }}>
                  <span>Required (family of {engineInput.household.adults + engineInput.household.children})</span>
                  <strong style={{ color: C.forest }}>{fmt(complianceRequirement)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: `1px solid ${C.lightGray}` }}>
                  <span>Your current savings</span>
                  <strong style={{ color: C.text }}>{fmt(savings)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0' }}>
                  <span>{eeStatus === 'compliant' ? 'Surplus' : 'Shortfall'}</span>
                  <strong style={{ color: eeBorderColor }}>
                    {eeStatus === 'compliant' ? `+${fmt(savings - complianceRequirement)}` : `-${fmt(eeShortfall)}`}
                  </strong>
                </div>
                {eeStatus !== 'compliant' && (
                  <div style={{ marginTop: 10, padding: '8px 10px', background: '#FEF2F2', borderRadius: 6, fontSize: 11 }}>
                    You need <strong>{fmt(eeShortfall)}</strong> more in liquid savings to meet IRCC&apos;s threshold. Funds must be readily available and documented.
                  </div>
                )}
                <p style={{ margin: '10px 0 0', fontSize: 11, color: C.textLight }}>
                  Data effective {EXPRESS_ENTRY_DEFAULTS.expressEntryEffectiveDate} · Source: IRCC (canada.ca)
                </p>
              </div>
            )
            return (
              <>
                <MetricTile
                  label="IRCC Required Funds"
                  value={fmt(complianceRequirement)}
                  sub={`Family of ${engineInput.household.adults + engineInput.household.children}`}
                  color={eeBorderColor}
                  isMobile={isMobile}
                  isPrimary
                  explainerId="tile-compliance"
                  openExplainer={openExplainer}
                  onToggleExplainer={setOpenExplainer}
                  explainerContent={eeExplainer}
                  statusBadge={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: eeBorderColor, flexShrink: 0 }} />
                      <span style={{ fontSize: 11, fontWeight: 600, color: eeBorderColor }}>{eeStatusText}</span>
                    </div>
                  }
                />
                <MetricTile label="Upfront Move Cost"   value={fmt(engineOutput.upfront)}    sub="One-time costs"    color={C.accent} isMobile={isMobile}
                  explainerId="tile-upfront" openExplainer={openExplainer} onToggleExplainer={setOpenExplainer}
                  explainerContent={<p style={{ margin: 0 }}>Includes immigration fees, biometrics, one-way flight, housing deposit (first + last month), and setup/furnishing costs. Does not include ongoing monthly expenses.</p>}
                />
                <MetricTile label="Monthly Survival"    value={fmt(engineOutput.monthlyMin)} sub="Minimum monthly"   color={C.blue}   isMobile={isMobile}
                  explainerId="tile-monthly" openExplainer={openExplainer} onToggleExplainer={setOpenExplainer}
                  explainerContent={<p style={{ margin: 0 }}>Core monthly costs: rent, utilities, transit, groceries, phone/internet, plus any obligations, childcare, or car costs you entered. This is the minimum needed to cover basic living expenses each month.</p>}
                />
                <MetricTile label="Safe Savings Target" value={fmt(engineOutput.safeSavingsTarget)} sub="Recommended total" color={C.purple} isMobile={isMobile}
                  explainerId="tile-target" openExplainer={openExplainer} onToggleExplainer={setOpenExplainer}
                  explainerContent={<p style={{ margin: 0 }}>Your upfront move cost plus a {Math.round((engineOutput.safeSavingsTarget / engineOutput.upfront - 1) * 100)}% buffer for unexpected expenses. This is the total liquid savings recommended before your move — separate from any IRCC compliance funds above.</p>}
                />
              </>
            )
          })()}

          {/* ── Compliance-first: Study Permit ───────────────────────────── */}
          {isStudyPermit && irccCompliance && complianceRequirement === null && (() => {
            const spExplainer = (
              <div>
                <div style={{ fontWeight: 700, color: C.forest, marginBottom: 8, fontSize: 13 }}>
                  IRCC Study Permit — Proof of Funds
                </div>
                {[
                  { label: 'First year tuition',      amount: irccCompliance.tuition,        note: 'Your input'                                    },
                  { label: 'Living expenses (IRCC)',   amount: irccCompliance.livingExpenses, note: irccCompliance.isQuebec ? 'Quebec MIFI' : 'IRCC' },
                  { label: 'Round-trip transportation', amount: irccCompliance.transport,     note: 'Estimate'                                       },
                ].map((row, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: `1px solid ${C.lightGray}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>{row.label}</span>
                      <span style={{ fontSize: 10, color: C.textLight, background: C.lightGray, padding: '1px 5px', borderRadius: 3 }}>{row.note}</span>
                    </div>
                    <strong style={{ color: C.forest }}>{fmt(row.amount)}</strong>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: `1px solid ${C.lightGray}` }}>
                  <span style={{ fontWeight: 700 }}>Required proof of funds</span>
                  <strong style={{ color: C.forest }}>{fmt(irccCompliance.required)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: `1px solid ${C.lightGray}` }}>
                  <span>Your available funds</span>
                  <strong style={{ color: C.text }}>{fmt(irccAvailable)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0' }}>
                  <span>{irccCompliance.compliant ? 'Surplus' : 'Shortfall'}</span>
                  <strong style={{ color: irccBorderColor }}>
                    {irccCompliance.compliant ? `+${fmt(irccAvailable - irccCompliance.required)}` : `-${fmt(irccCompliance.shortfall)}`}
                  </strong>
                </div>
                {!irccCompliance.compliant && (
                  <div style={{ marginTop: 10, padding: '8px 10px', background: '#FEF2F2', borderRadius: 6, fontSize: 11 }}>
                    A GIC ({fmt(STUDY_PERMIT_DEFAULTS.gicMinimum)}) at a designated Canadian bank satisfies proof-of-funds requirements and is returned in monthly installments after arrival.
                  </div>
                )}
                <a href="/articles/study-permit-proof-of-funds" style={{ display: 'inline-block', marginTop: 10, fontSize: 11, fontWeight: 600, color: C.blue, textDecoration: 'none' }}>
                  Learn about proof of funds →
                </a>
              </div>
            )
            return (
              <>
                <MetricTile
                  label="IRCC Proof of Funds"
                  value={fmt(irccCompliance.required)}
                  sub="Required for study permit"
                  color={irccBorderColor}
                  isMobile={isMobile}
                  isPrimary
                  explainerId="tile-compliance"
                  openExplainer={openExplainer}
                  onToggleExplainer={setOpenExplainer}
                  explainerContent={spExplainer}
                  statusBadge={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: irccBorderColor, flexShrink: 0 }} />
                      <span style={{ fontSize: 11, fontWeight: 600, color: irccBorderColor }}>{irccStatusText}</span>
                    </div>
                  }
                />
                <MetricTile label="Upfront Move Cost"   value={fmt(engineOutput.upfront)}    sub="One-time costs"    color={C.accent} isMobile={isMobile}
                  explainerId="tile-upfront" openExplainer={openExplainer} onToggleExplainer={setOpenExplainer}
                  explainerContent={<p style={{ margin: 0 }}>Includes study permit fee, biometrics, one-way flight, housing deposit, furnishing, GIC (if applicable), and first tuition instalment.</p>}
                />
                <MetricTile label="Monthly Survival"    value={fmt(engineOutput.monthlyMin)} sub="Minimum monthly"   color={C.blue}   isMobile={isMobile}
                  explainerId="tile-monthly" openExplainer={openExplainer} onToggleExplainer={setOpenExplainer}
                  explainerContent={<p style={{ margin: 0 }}>Core monthly costs including rent/housing, transit, utilities, groceries, phone, and provincial health insurance. Your GIC will release funds monthly to help cover these costs after arrival.</p>}
                />
                <MetricTile label="Financial Runway"    value={runwayLabel}                  sub="Months of coverage" color={C.gold}   isMobile={isMobile}
                  explainerId="tile-runway" openExplainer={openExplainer} onToggleExplainer={setOpenExplainer}
                  explainerContent={<p style={{ margin: 0 }}>How many months your current savings (after upfront costs) cover your monthly minimum. This excludes any GIC funds, which are returned monthly after you arrive.</p>}
                />
              </>
            )
          })()}

          {/* ── No compliance requirement (CEC, Work Permit, Family, etc.) ── */}
          {!isStudyPermit && complianceRequirement === null && (
            <>
              <MetricTile label="Upfront Move Cost"   value={fmt(engineOutput.upfront)}           sub="One-time costs"     color={C.accent} isMobile={isMobile}
                explainerId="tile-upfront" openExplainer={openExplainer} onToggleExplainer={setOpenExplainer}
                explainerContent={<p style={{ margin: 0 }}>Includes immigration fees, biometrics, one-way flight, housing deposit (first + last month), and setup/furnishing costs. Does not include ongoing monthly expenses.</p>}
              />
              <MetricTile label="Monthly Survival"    value={fmt(engineOutput.monthlyMin)}        sub="Minimum monthly"    color={C.blue}   isMobile={isMobile}
                explainerId="tile-monthly" openExplainer={openExplainer} onToggleExplainer={setOpenExplainer}
                explainerContent={<p style={{ margin: 0 }}>Core monthly costs: rent, utilities, transit, groceries, phone/internet, plus any obligations, childcare, or car costs you entered.</p>}
              />
              <MetricTile label="Safe Savings Target" value={fmt(engineOutput.safeSavingsTarget)} sub="Recommended total"  color={C.purple} isMobile={isMobile}
                explainerId="tile-target" openExplainer={openExplainer} onToggleExplainer={setOpenExplainer}
                explainerContent={<p style={{ margin: 0 }}>Your upfront move cost plus a buffer for unexpected expenses. This is the total liquid savings recommended before your move. There is no mandatory IRCC savings floor for your pathway.</p>}
              />
              <MetricTile label="Financial Runway"    value={runwayLabel}                         sub="Months of coverage" color={C.gold}   isMobile={isMobile}
                explainerId="tile-runway" openExplainer={openExplainer} onToggleExplainer={setOpenExplainer}
                explainerContent={<p style={{ margin: 0 }}>How many months your current savings (after upfront costs) cover your monthly minimum expenses.</p>}
              />
            </>
          )}

        </div>

        {/* ── R4 Zone A: Financial Summary Block ─────────────────────────── */}
        {narrativeData && (() => {
          const { verdict, timeToDepletion: depletion, priorityAction, timelineGuidance } = narrativeData

          // Verdict color
          const verdictIsPositive =
            !verdict.startsWith('You are not') && !verdict.startsWith('You need')
          const verdictColor = verdictIsPositive ? C.forest : C.red

          // Severity colors
          const SEV_COLORS: Record<string, { bg: string; text: string; border: string }> = {
            critical:   { bg: '#FEF2F2', text: C.red,    border: C.red    },
            limited:    { bg: '#FDF6E3', text: C.gold,   border: C.gold   },
            reasonable: { bg: '#F0FFF4', text: C.accent, border: C.accent },
            strong:     { bg: '#F0FFF4', text: C.accent, border: C.accent },
          }
          const depColors = SEV_COLORS[depletion.severity] ?? SEV_COLORS.reasonable

          // Urgency colors for Priority Action
          const URG_COLORS: Record<string, string> = {
            critical: C.red, high: C.red, medium: C.gold, low: C.accent,
          }
          const urgColor = URG_COLORS[priorityAction.urgency] ?? C.accent

          // Risk level colors for Timeline
          const RISK_COLORS: Record<string, string> = {
            high: C.red, medium: C.gold, low: C.accent,
          }

          return (
            <div style={{ marginBottom: 14 }}>

              {/* 1. Readiness Verdict */}
              <p style={{
                fontFamily: SERIF, fontSize: 18, fontWeight: 700,
                color: verdictColor, lineHeight: 1.5,
                margin: '0 0 12px', padding: 0,
              }}>
                {verdict}
              </p>

              {/* 2. Time-to-Depletion Card — or Academic Budget for study permit */}
              {isStudyPermit ? (() => {
                const tuition     = engineInput?.studyPermit?.tuitionAmount ?? 0
                const monthlyMin  = engineOutput?.monthlyMin ?? 0
                const firstYear   = tuition + monthlyMin * 12
                return (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 16,
                    background: '#EFF6FF', borderRadius: 16,
                    border: '1px solid #BFDBFE',
                    padding: isMobile ? '14px 16px' : '16px 22px',
                    marginBottom: 10,
                  }}>
                    <div style={{ fontSize: isMobile ? 28 : 34, lineHeight: 1, flexShrink: 0 }}>🎓</div>
                    <div>
                      <div style={{ fontFamily: SERIF, fontSize: isMobile ? 26 : 32, fontWeight: 700, color: '#1D4ED8', lineHeight: 1.1 }}>
                        {fmt(firstYear)}
                      </div>
                      <div style={{ fontSize: 13, color: C.text, marginTop: 3, fontFamily: FONT, lineHeight: 1.5, fontWeight: 600 }}>
                        First year budget
                      </div>
                      <div style={{ fontSize: 12, color: C.gray, marginTop: 2, fontFamily: FONT, lineHeight: 1.5 }}>
                        Your first year of study will cost approximately {fmt(firstYear)} including tuition, housing, and living expenses.
                      </div>
                    </div>
                  </div>
                )
              })() : (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 16,
                  background: depColors.bg, borderRadius: 16,
                  border: `1px solid ${depColors.border}20`,
                  padding: isMobile ? '14px 16px' : '16px 22px',
                  marginBottom: 10,
                }}>
                  <div style={{ fontSize: isMobile ? 28 : 34, lineHeight: 1, flexShrink: 0 }}>⏱️</div>
                  <div>
                    <div style={{ fontFamily: SERIF, fontSize: isMobile ? 26 : 32, fontWeight: 700, color: depColors.text, lineHeight: 1.1 }}>
                      {depletion.months === Infinity ? '∞' : `${depletion.months.toFixed(1)} mo`}
                    </div>
                    <div style={{ fontSize: 13, color: C.text, marginTop: 3, fontFamily: FONT, lineHeight: 1.5 }}>
                      {depletion.label}
                    </div>
                  </div>
                </div>
              )}

              {/* 3. #1 Priority Action Card */}
              <div style={{
                background: C.white, borderRadius: 14,
                borderLeft: `5px solid ${urgColor}`,
                borderTop: `1px solid ${urgColor}18`,
                borderRight: `1px solid ${urgColor}18`,
                borderBottom: `1px solid ${urgColor}18`,
                padding: isMobile ? '14px 16px' : '16px 22px',
                marginBottom: 10,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{
                    fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                    color: '#fff', background: urgColor,
                    padding: '3px 8px', borderRadius: 4, letterSpacing: 0.6,
                  }}>
                    #1 Priority
                  </span>
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: C.forest, fontFamily: FONT, marginBottom: 4 }}>
                  {priorityAction.title}
                </div>
                <div style={{ fontSize: 14, color: C.text, lineHeight: 1.6, fontFamily: FONT }}>
                  {priorityAction.description}
                </div>
              </div>

              {/* 4. Timeline Guidance */}
              <div style={{ background: C.white, borderRadius: 14, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
                {timelineGuidance.map((item, i) => (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: 14,
                      padding: isMobile ? '12px 16px' : '14px 20px',
                      borderBottom: i < timelineGuidance.length - 1 ? `1px solid ${C.lightGray}` : 'none',
                    }}
                  >
                    {/* Risk badge */}
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0,
                      minWidth: 72, paddingTop: 2,
                    }}>
                      <div style={{ width: 9, height: 9, borderRadius: '50%', background: RISK_COLORS[item.riskLevel], flexShrink: 0 }} />
                      <span style={{ fontSize: 10, fontWeight: 700, color: RISK_COLORS[item.riskLevel], textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        {item.riskLabel}
                      </span>
                    </div>
                    {/* Text */}
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: C.forest, marginBottom: 2, fontFamily: FONT }}>
                        {item.label}
                      </div>
                      <div style={{ fontSize: 12, color: C.text, lineHeight: 1.55, fontFamily: FONT }}>
                        {item.description}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          )
        })()}

        {/* ── AC-2: Savings Gap ──────────────────────────────────────────── */}
        <div style={{ background: C.white, borderRadius: 14, border: `1px solid ${C.border}`, padding: isMobile ? '18px 16px' : '22px 26px', marginBottom: 14, boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
            <span style={{ fontFamily: SERIF, fontSize: 18, color: C.forest, fontWeight: 700 }}>
              {engineOutput.savingsGap > 0 ? 'Your Savings Gap' : "You're On Track!"}
            </span>
            <span style={{ fontSize: 22, fontWeight: 700, color: engineOutput.savingsGap > 0 ? C.red : C.accent, fontFamily: SERIF }}>
              {engineOutput.savingsGap > 0 ? fmt(engineOutput.savingsGap) : '✓'}
            </span>
          </div>
          <div style={{ width: '100%', height: 14, background: '#E5E7EB', borderRadius: 7, overflow: 'hidden', marginBottom: 8 }}>
            <div style={{
              height: '100%', width: `${gapPct}%`,
              background: engineOutput.savingsGap > 0
                ? `linear-gradient(90deg, ${C.accent}, ${C.gold})`
                : C.accent,
              borderRadius: 7, transition: 'width 0.5s',
            }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: C.gray }}>
            <span>Your savings: {fmt(savings)}</span>
            <span>Target: {fmt(engineOutput.safeSavingsTarget)}</span>
          </div>
          {engineOutput.savingsGap > 0 && monthsToClose && (
            <div style={{ marginTop: 10, fontSize: 12, color: C.text, background: C.lightGray, borderRadius: 8, padding: '8px 12px', lineHeight: 1.5 }}>
              At your savings rate of <strong>{fmt(capacity)}/month</strong>, you could close this gap in approximately <strong>{monthsToClose} month{monthsToClose !== 1 ? 's' : ''}</strong>.
            </div>
          )}
          {engineOutput.savingsGap > 0 && !monthsToClose && (
            <div style={{ marginTop: 10, fontSize: 12, color: C.text, background: C.lightGray, borderRadius: 8, padding: '8px 12px', lineHeight: 1.5 }}>
              Consider the recommended actions below to help close this gap before your move.
            </div>
          )}
          {engineOutput.baselineFallback && (
            <div style={{ marginTop: 8, fontSize: 11, color: C.gold, fontStyle: 'italic' }}>
              Note: National average baselines were used — no city-specific data found for your destination.
            </div>
          )}
        </div>

        {/* ── AC-4: Income Estimate Card (E9 engine) ─────────────────────── */}
        {answers.incomeSource === 'engine_estimate' && (answers.estimatedGrossMid ?? 0) > 0 && (
          <div style={{ background: C.white, borderRadius: 14, border: `1px solid ${C.purple}20`, padding: isMobile ? '18px 16px' : '22px 26px', marginBottom: 14, boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
              <span style={{ fontFamily: SERIF, fontSize: 16, color: C.forest, fontWeight: 700 }}>Income Estimate</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: C.accent, background: `${C.accent}12`, padding: '2px 8px', borderRadius: 4 }}>
                  {answers.confidence ?? 'Medium'} confidence
                </span>
                {answers.nocCode && (
                  <span style={{ fontSize: 10, color: C.textLight }}>NOC {answers.nocCode}</span>
                )}
              </div>
            </div>
            <div style={{ fontSize: 12, color: C.gray, marginBottom: 10 }}>
              Based on <strong>{answers.occupation ?? 'your occupation'}</strong> wages in {cityLabel} (Job Bank data)
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {[
                { label: 'Low',    gross: answers.estimatedGrossLow  ?? 0, net: 0,                              hl: false },
                { label: 'Median', gross: answers.estimatedGrossMid  ?? 0, net: answers.estimatedNetMonthly ?? 0, hl: true  },
                { label: 'High',   gross: answers.estimatedGrossHigh ?? 0, net: 0,                              hl: false },
              ].map(e => (
                <div key={e.label} style={{
                  flex: 1, minWidth: 80, textAlign: 'center',
                  padding: '10px 8px', borderRadius: 8,
                  background: e.hl ? `${C.purple}08` : C.lightGray,
                  border: e.hl ? `1px solid ${C.purple}20` : 'none',
                }}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: C.textLight, textTransform: 'uppercase' }}>{e.label}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: e.hl ? C.purple : C.forest, fontFamily: SERIF }}>
                    ${(e.gross / 1000).toFixed(0)}K
                  </div>
                  {e.hl && e.net > 0 && (
                    <div style={{ fontSize: 11, color: C.gray }}>~${e.net.toLocaleString('en-CA')}/mo net</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* User-provided income (non-engine) */}
        {answers.incomeSource !== 'engine_estimate' && answers.income && (
          <div style={{ background: C.white, borderRadius: 14, border: `1px solid ${C.border}`, padding: isMobile ? '18px 16px' : '22px 26px', marginBottom: 14, boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <span style={{ fontFamily: SERIF, fontSize: 16, color: C.forest, fontWeight: 700 }}>Expected Monthly Income</span>
              <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: C.textLight, background: C.lightGray, padding: '2px 8px', borderRadius: 4 }}>Your estimate</span>
            </div>
            <div style={{ fontFamily: SERIF, fontSize: 28, fontWeight: 700, color: C.forest, marginTop: 8 }}>
              {fmt(parseAmount(answers.income))}<span style={{ fontSize: 14, fontWeight: 400, color: C.gray }}>/mo</span>
            </div>
          </div>
        )}

        {/* ── Study Permit: GIC Recommendation Card ──────────────────────── */}
        {showGICCard && (
          <div style={{ background: '#F0F4FF', borderRadius: 16, border: '1px solid #BFCFFF', padding: isMobile ? '18px 16px' : '22px 26px', marginBottom: 14 }}>
            <h2 style={{ fontFamily: SERIF, fontSize: 17, color: C.forest, margin: '0 0 10px' }}>
              💰 Consider a Guaranteed Investment Certificate (GIC)
            </h2>
            <p style={{ fontSize: 13, color: C.text, lineHeight: 1.6, margin: '0 0 12px' }}>
              A GIC of <strong>{fmt(STUDY_PERMIT_DEFAULTS.gicMinimum)}</strong> at a designated Canadian bank satisfies IRCC&apos;s proof-of-funds requirement and is returned to you in monthly installments after you arrive. Processing fee: ~{fmt(STUDY_PERMIT_DEFAULTS.gicProcessingFee)}.
            </p>
            <div style={{ fontSize: 12, color: C.gray, marginBottom: 10 }}>
              <strong>Participating banks:</strong> Scotiabank, TD, CIBC, RBC, BMO
            </div>
            <a href="/articles/what-is-a-gic-canada" style={{ fontSize: 12, fontWeight: 600, color: C.blue, textDecoration: 'none' }}>
              Learn more about GICs for study permits →
            </a>
          </div>
        )}

        {/* ── AC-3: Cost Breakdown ────────────────────────────────────────── */}
        {(() => {
          const regionLabel = DEPARTURE_REGION_LABELS[answers.departureRegion ?? ''] ?? 'International'
          const familySize  = (answers.adults ?? 1) + (answers.children ?? 0)
          const housingLabel = HOUSING_TYPE_LABELS[answers.housing ?? '1br'] ?? 'Accommodation'

          function displayLabel(it: { key?: string; label: string }): string {
            if (it.key === 'travel') {
              const kind = isStudyPermit ? 'One-way flight' : 'One-way flight'
              return `${kind} — ${regionLabel} (×${familySize})`
            }
            if (it.key === 'housing-deposit') {
              if (answers.housing === 'staying-family') return 'Housing deposit — staying with family ($0)'
              return `Housing deposit — ${housingLabel} (2× rent)`
            }
            if (it.key === 'rent') {
              if (answers.housing === 'staying-family') return 'Rent — staying with family ($0)'
              return `Rent — ${housingLabel}`
            }
            return it.label
          }

          return (
            <div style={{ background: C.white, borderRadius: 14, border: `1px solid ${C.border}`, padding: isMobile ? '18px 16px' : '22px 26px', marginBottom: 14, boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
              <h2 style={{ fontFamily: SERIF, fontSize: 18, color: C.forest, margin: '0 0 14px' }}>Cost Breakdown</h2>
              {[
                { label: 'Upfront Costs', items: engineOutput.upfrontBreakdown, total: engineOutput.upfront    },
                { label: 'Monthly Costs', items: engineOutput.monthlyBreakdown,  total: engineOutput.monthlyMin },
              ].map(section => (
                <div key={section.label} style={{ marginBottom: 18 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: C.textLight, textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 6 }}>
                    {section.label}
                  </div>
                  {section.items.map((it, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: i < section.items.length - 1 ? `1px solid ${C.lightGray}` : 'none' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', flex: 1, marginRight: 8 }}>
                        <span style={{ fontSize: 13, color: C.text }}>{displayLabel(it)}</span>
                        <span style={{ fontSize: 10, color: C.textLight, background: C.lightGray, padding: '1px 6px', borderRadius: 4, whiteSpace: 'nowrap' }}>{sourceLabel(it.source)}</span>
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 600, color: C.forest, whiteSpace: 'nowrap' }}>{fmt(it.cad)}</span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0 0', borderTop: `2px solid ${C.border}`, marginTop: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: C.forest }}>Total</span>
                    <span style={{ fontSize: 15, fontWeight: 700, color: C.forest, fontFamily: SERIF }}>{fmt(section.total)}</span>
                  </div>
                </div>
              ))}
              {isStudyPermit && (
                <p style={{ fontSize: 11, color: C.textLight, margin: '0', fontStyle: 'italic' }}>
                  * IRCC proof-of-funds calculation includes a round-trip transport estimate. The upfront cost above reflects your one-way flight only.
                </p>
              )}
            </div>
          )
        })()}

        {/* ── R4 Zone B: Income Scenarios (or Part-Time Work Impact for study permit) ── */}
        {narrativeData && (() => {
          // ── Study permit: replace with Part-Time Work Impact card ──────────────
          if (isStudyPermit) {
            const ptHours   = answers.studyPermit?.partTimeHoursPerWeek ?? 0
            const ptRate    = answers.studyPermit?.partTimeHourlyRate   ?? 15
            const ptMonthly = answers.studyPermit?.estimatedPartTimeMonthlyIncome ?? 0
            if (ptHours === 0) return null  // no part-time work planned — omit section

            const ptTotal    = ptMonthly * 8
            const monthlyMin = engineOutput?.monthlyMin ?? 1
            const ptPct      = Math.min(100, Math.round(ptMonthly / monthlyMin * 100))

            return (
              <div style={{ background: C.white, borderRadius: 14, border: `1px solid ${C.border}`, padding: isMobile ? '18px 16px' : '22px 26px', marginBottom: 14, boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <span style={{ fontSize: 22 }}>💼</span>
                  <h2 style={{ fontFamily: SERIF, fontSize: 18, color: C.forest, margin: 0 }}>Part-time work impact</h2>
                </div>
                <p style={{ fontSize: 14, color: C.text, lineHeight: 1.7, margin: '0 0 12px', fontFamily: FONT }}>
                  Working <strong>{ptHours} hrs/week</strong> at <strong>{fmt(ptRate)}/hr</strong>, you could earn approximately{' '}
                  <strong>{fmt(ptMonthly)}/month</strong> during the academic term. Over 8 months of classes, that&apos;s{' '}
                  ~<strong>{fmt(ptTotal)}</strong> — enough to cover approximately <strong>{ptPct}%</strong> of your monthly living expenses.
                </p>
                <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 10, padding: '10px 14px', fontSize: 12, color: '#1D4ED8', fontFamily: FONT, lineHeight: 1.6 }}>
                  ℹ️ This income is not counted toward IRCC proof of funds. IRCC requires you to demonstrate available funds without relying on employment in Canada.
                </div>
              </div>
            )
          }

          const { incomeScenarios, compGap, isExempt, monthlyIncome } = narrativeData
          const { best, expected, worst } = incomeScenarios

          // No income entered — show a helpful prompt instead of identical scenarios
          if (monthlyIncome === 0) {
            return (
              <div style={{ background: C.white, borderRadius: 14, border: `1px solid ${C.border}`, padding: isMobile ? '18px 16px' : '22px 26px', marginBottom: 14, boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
                <h2 style={{ fontFamily: SERIF, fontSize: 20, color: C.forest, margin: '0 0 10px' }}>
                  What happens when you start earning?
                </h2>
                <div style={{ background: `${C.gold}0F`, border: `1px solid ${C.gold}40`, borderLeft: `4px solid ${C.gold}`, borderRadius: 10, padding: '14px 16px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 20, flexShrink: 0 }}>💡</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.text, fontFamily: FONT, marginBottom: 4 }}>
                      Add your expected income to see cash-flow projections
                    </div>
                    <div style={{ fontSize: 12, color: C.gray, fontFamily: FONT, lineHeight: 1.6 }}>
                      Go back to Step 4 and enter your expected monthly income. We&apos;ll model three scenarios — best case, expected, and worst case — showing how your savings evolve over the first 12 months in Canada.
                    </div>
                  </div>
                </div>
              </div>
            )
          }

          // Chart data: one point per month 0–12
          const chartData = Array.from({ length: 13 }, (_, m) => ({
            month: m === 0 ? 'Start' : `Mo ${m}`,
            best:     best.balanceByMonth[m],
            expected: expected.balanceByMonth[m],
            worst:    worst.balanceByMonth[m],
          }))

          const scenarioCards = [
            { run: best,     borderColor: C.accent, bgColor: `${C.accent}08` },
            { run: expected, borderColor: C.gold,   bgColor: `${C.gold}08`   },
            { run: worst,    borderColor: C.red,    bgColor: `${C.red}08`    },
          ]

          const hasComplianceReq = compGap !== null && !isExempt

          return (
            <div style={{ background: C.white, borderRadius: 14, border: `1px solid ${C.border}`, padding: isMobile ? '18px 16px' : '22px 26px', marginBottom: 14, boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
              <h2 style={{ fontFamily: SERIF, fontSize: 20, color: C.forest, margin: '0 0 16px' }}>
                What happens when you start earning?
              </h2>

              {/* 1. Scenario Cards */}
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 18 }}>
                {scenarioCards.map(({ run, borderColor, bgColor }) => (
                  <div key={run.label} style={{
                    flex: '1 1 160px', borderRadius: 12,
                    borderTop: `3px solid ${borderColor}`,
                    border: `1px solid ${borderColor}30`,
                    borderTopWidth: 3, borderTopColor: borderColor,
                    background: bgColor,
                    padding: '14px 16px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                      <span style={{ fontSize: 16 }}>{run.icon}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: C.text, fontFamily: FONT }}>{run.label}</span>
                    </div>
                    <div style={{ fontFamily: SERIF, fontSize: isMobile ? 18 : 22, fontWeight: 700, color: run.depletionMonth !== null ? C.red : C.forest, lineHeight: 1.1, marginBottom: 4 }}>
                      {run.depletionMonth !== null
                        ? `Depleted mo ${run.depletionMonth}`
                        : run.savingsAtMonth12 !== null
                        ? fmt(run.savingsAtMonth12)
                        : '—'}
                    </div>
                    <div style={{ fontSize: 11, color: C.gray, fontFamily: FONT, lineHeight: 1.4 }}>
                      {run.depletionMonth !== null
                        ? `Savings run out at month ${run.depletionMonth}`
                        : `Balance at month 12`}
                    </div>
                    <div style={{ fontSize: 11, color: C.textLight, marginTop: 4, fontFamily: FONT }}>
                      {run.incomeStartMonth < 13
                        ? `Income (${fmt(run.monthlyIncome)}/mo) starts month ${run.incomeStartMonth}`
                        : 'No income in 12-month window'}
                    </div>
                  </div>
                ))}
              </div>

              {/* 2. Runway Chart */}
              <div style={{ width: '100%', height: 240, marginBottom: 8 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.lightGray} />
                    <XAxis dataKey="month" tick={{ fontSize: 10, fill: C.textLight, fontFamily: FONT }} />
                    <YAxis
                      tickFormatter={(v: number) => v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`}
                      tick={{ fontSize: 10, fill: C.textLight, fontFamily: FONT }}
                      width={48}
                    />
                    <ReferenceLine y={0} stroke={C.gray} strokeDasharray="4 2" />
                    <Tooltip
                      formatter={(value, name) => [
                        typeof value === 'number'
                          ? new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(value)
                          : String(value),
                        name === 'best' ? '☀️ Best' : name === 'expected' ? '⚖️ Expected' : '⛈️ Worst',
                      ]}
                      contentStyle={{ fontFamily: FONT, fontSize: 12, borderRadius: 8, border: `1px solid ${C.border}` }}
                    />
                    <Legend
                      formatter={(value: string) =>
                        value === 'best' ? '☀️ Best case' : value === 'expected' ? '⚖️ Expected' : '⛈️ Worst case'
                      }
                      wrapperStyle={{ fontSize: 11, fontFamily: FONT, paddingTop: 4 }}
                    />
                    <Area type="monotone" dataKey="best"     stroke={C.accent} fill={C.accent} fillOpacity={0.15} strokeWidth={2} dot={false} />
                    <Area type="monotone" dataKey="expected" stroke={C.gold}   fill={C.gold}   fillOpacity={0.15} strokeWidth={2} dot={false} />
                    <Area type="monotone" dataKey="worst"    stroke={C.red}    fill={C.red}    fillOpacity={0.15} strokeWidth={2} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* 3. Contextual Note */}
              <p style={{ fontSize: 11, color: C.textLight, margin: 0, lineHeight: 1.6, fontStyle: 'italic' }}>
                {hasComplianceReq
                  ? `These scenarios model cash flow after arrival and assume you keep your IRCC-required funds available for your application. Income projections are estimates — actual timing may vary.`
                  : `These scenarios model 12 months of cash flow starting from your current savings. Income projections are estimates based on typical job-search timelines for your pathway.`}
              </p>
            </div>
          )
        })()}

        {/* ── AC-5: Risks & Actions ───────────────────────────────────────── */}
        <div style={{ display: 'flex', gap: 14, flexDirection: isMobile ? 'column' : 'row', marginBottom: 14 }}>

          {/* Risks */}
          <div style={{ flex: 1 }}>
            <h2 style={{ fontFamily: SERIF, fontSize: 18, color: C.forest, margin: '0 0 10px' }}>Key Risks</h2>
            {topRisks.length === 0 ? (
              <div style={{ background: `${C.accent}08`, borderRadius: 10, borderLeft: `4px solid ${C.accent}`, padding: '14px 16px', fontSize: 13, color: C.text, lineHeight: 1.5 }}>
                No significant risks identified. Your settlement plan looks strong!
              </div>
            ) : topRisks.map(risk => (
              <div key={risk.id} style={{ background: SEV_BG[risk.severity], borderRadius: 10, borderLeft: `4px solid ${SEV_COLOR[risk.severity]}`, padding: '14px 16px', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', color: SEV_COLOR[risk.severity], background: `${SEV_COLOR[risk.severity]}15`, padding: '1px 6px', borderRadius: 3 }}>
                    {SEV_LABEL[risk.severity]}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: C.forest }}>{risk.title}</span>
                </div>
                <p style={{ fontSize: 12, color: C.text, margin: 0, lineHeight: 1.5 }}>{risk.description}</p>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div style={{ flex: 1 }}>
            <h2 style={{ fontFamily: SERIF, fontSize: 18, color: C.forest, margin: '0 0 10px' }}>Recommended Actions</h2>
            {topActions.length === 0 ? (
              <div style={{ background: C.white, borderRadius: 10, border: `1px solid ${C.border}`, padding: '14px 16px', fontSize: 13, color: C.gray, lineHeight: 1.5 }}>
                Your plan looks solid — no immediate actions required.
              </div>
            ) : topActions.map((action, i) => (
              <div key={action.id} style={{ background: C.white, borderRadius: 10, border: `1px solid ${C.border}`, padding: '14px 16px', marginBottom: 8, display: 'flex', gap: 12 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: C.accent, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13, flexShrink: 0, fontFamily: SERIF }}>
                  {i + 1}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.forest, marginBottom: 2 }}>{action.title}</div>
                  <p style={{ fontSize: 12, color: C.text, margin: '0 0 6px', lineHeight: 1.5 }}>{action.description}</p>
                  {action.impactCAD !== 0 && (
                    <div style={{ fontSize: 11, fontWeight: 600, color: action.impactCAD > 0 ? C.accent : C.red }}>
                      {action.impactCAD > 0
                        ? `Potential savings: ${fmt(action.impactCAD)}`
                        : `Estimated cost: ${fmt(Math.abs(action.impactCAD))}`}
                    </div>
                  )}
                  {action.articleSlug && (
                    <a href={`/articles/${action.articleSlug}`} style={{ fontSize: 11, fontWeight: 600, color: C.blue, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
                      Learn more <ArrowRight />
                    </a>
                  )}
                  {action.link && !action.articleSlug && (
                    <a href={action.link} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, fontWeight: 600, color: C.blue, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
                      Learn more <ArrowRight />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── AC-7: Consultant Post-Review Callout ────────────────────────── */}
        <div style={{
          background: C.white, borderRadius: 14,
          borderTop: `1px solid ${C.red}20`,
          borderRight: `1px solid ${C.red}20`,
          borderBottom: `1px solid ${C.red}20`,
          borderLeft: `5px solid ${C.red}`,
          padding: isMobile ? '22px 18px' : '26px 28px', marginBottom: 14,
          boxShadow: `0 2px 12px ${C.red}08`,
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 14 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <CalendarIcon />
            </div>
            <div>
              <h3 style={{ fontFamily: SERIF, fontSize: 18, color: C.forest, margin: '0 0 6px', fontWeight: 700 }}>
                Schedule Your Plan Review
              </h3>
              <p style={{ fontSize: 14, color: C.text, margin: 0, lineHeight: 1.65 }}>
                Your consultant <strong style={{ color: C.forest }}>{consultantName}</strong> will prepare a detailed advisory review of your settlement plan — including alternative scenarios, gap-closure strategies, and program-specific guidance tailored to your situation.
              </p>
              <p style={{ fontSize: 14, color: C.red, fontWeight: 600, margin: '10px 0 0' }}>
                Schedule a follow-up meeting to discuss your results and finalize your strategy.
              </p>
            </div>
          </div>

          {/* Expandable "How to prepare" */}
          <button
            onClick={() => setPrepareOpen(!prepareOpen)}
            aria-expanded={prepareOpen}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 14px', borderRadius: 8, border: `1px solid ${C.border}`,
              background: C.lightGray, cursor: 'pointer', fontFamily: FONT,
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 600, color: C.forest }}>How to prepare for your meeting</span>
            <ChevDown open={prepareOpen} />
          </button>
          {prepareOpen && (
            <div style={{ padding: '14px 14px 0', marginTop: 8 }}>
              {[
                'Review your cost breakdown and note any line items you want to discuss or adjust.',
                "Think about whether you're flexible on destination city or housing type — your consultant can model alternatives.",
                'Gather any additional financial documents (bank statements, scholarship letters, job offer details) to refine the estimates.',
                'Prepare questions about your immigration timeline and how it affects your financial runway.',
              ].map((tip, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'flex-start' }}>
                  <CheckIcon color={C.red} />
                  <span style={{ fontSize: 13, color: C.text, lineHeight: 1.5 }}>{tip}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── AC-6: Settlement Checklist ──────────────────────────────────── */}
        <div style={{ background: C.white, borderRadius: 14, border: `1px solid ${C.border}`, padding: isMobile ? '18px 16px' : '22px 26px', marginBottom: 14, boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
          <h2 style={{ fontFamily: SERIF, fontSize: 18, color: C.forest, margin: '0 0 18px' }}>Your Settlement Checklist</h2>
          {[
            { title: 'Pre-Arrival',   items: checklist.preArrival, icon: '✈️', color: C.accent  },
            { title: 'First Week',    items: checklist.firstWeek,  icon: '🏁', color: C.gold    },
            { title: 'First 30 Days', items: checklist.first30,    icon: '📋', color: C.blue    },
            { title: 'First 90 Days', items: checklist.first90,    icon: '🎯', color: C.purple  },
          ].map(group => (
            <div key={group.title} style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
                <span aria-hidden="true" style={{ fontSize: 14 }}>{group.icon}</span>
                <span style={{ fontFamily: SERIF, fontSize: 15, color: group.color, fontWeight: 700 }}>{group.title}</span>
              </div>
              {group.items.map((item: ChecklistItem, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 5, paddingLeft: 4, alignItems: 'flex-start' }}>
                  <CheckIcon color={group.color} />
                  <span style={{ fontSize: 12, color: C.text, lineHeight: 1.5 }}>
                    {item.label}
                    {item.articleSlug && (
                      <a
                        href={`/articles/${item.articleSlug}`}
                        style={{ marginLeft: 5, color: C.accent, fontSize: 11, textDecoration: 'none', borderBottom: `1px solid ${C.accent}44`, whiteSpace: 'nowrap' }}
                      >
                        Learn more →
                      </a>
                    )}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* ── AC-8: Action Buttons ────────────────────────────────────────── */}
        <div style={{ background: C.white, borderRadius: 14, border: `1px solid ${C.border}`, padding: isMobile ? '18px 16px' : '22px 26px', marginBottom: 14 }}>
          <h3 style={{ fontFamily: SERIF, fontSize: 16, color: C.forest, margin: '0 0 14px' }}>Save or Share Your Plan</h3>
          <div style={{ display: 'flex', gap: 8, flexDirection: isMobile ? 'column' : 'row' }}>
            <button
              onClick={handleDownloadPdf}
              disabled={pdfLoading}
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '13px 18px', borderRadius: 10, border: `1px solid ${C.border}`, background: C.white, color: C.forest, fontWeight: 700, fontSize: 13, cursor: pdfLoading ? 'wait' : 'pointer', fontFamily: FONT, opacity: pdfLoading ? 0.7 : 1 }}
            >
              <DownloadIcon /> {pdfLoading ? 'Generating…' : 'Download PDF'}
            </button>
            <button
              onClick={handleDownloadReport}
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '13px 18px', borderRadius: 10, border: `1px solid ${C.border}`, background: C.white, color: C.forest, fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: FONT }}
            >
              <FileIcon /> Report Package
            </button>
            {consultant?.slug && (
              <button
                onClick={handleOpenSendModal}
                style={{ flex: 1.3, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '13px 18px', borderRadius: 10, border: 'none', background: C.red, color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: FONT, boxShadow: `0 2px 8px ${C.red}33` }}
              >
                <SendIcon /> Send to Consultant
              </button>
            )}
          </div>
        </div>

        {/* ── AC-9: Data Sources Footer ───────────────────────────────────── */}
        <div style={{ background: C.lightGray, borderRadius: 10, padding: '14px 18px', fontSize: 11, color: C.textLight, lineHeight: 1.6 }}>
          <strong style={{ color: C.gray }}>Data Sources:</strong> Rent data from CMHC ({baseline.effectiveDate.slice(0, 7)}). Immigration fees from IRCC. Income estimates from Job Bank via NOC wage data. Items marked &quot;Estimate&quot; are conservative baselines.
          <br />
          <strong style={{ color: C.gray }}>Engine:</strong> v{engineOutput.engineVersion} · Data: {engineOutput.dataVersion}
          <br />
          <strong style={{ color: C.gray }}>Disclaimer:</strong> This is a financial planning tool, not immigration or financial advice. Actual costs may vary. Consult your immigration representative for program-specific guidance.
        </div>

      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer style={{ borderTop: `1px solid ${C.border}`, background: C.white, padding: isMobile ? '24px 16px' : '32px 24px', marginTop: 20 }}>
        <div style={{ maxWidth: 760, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', flexDirection: isMobile ? 'column' : 'row', gap: 10, fontSize: 11, color: C.textLight }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <MapleLeaf size={12} />
            <span style={{ fontFamily: SERIF, fontSize: 12, color: C.gray }}>Maple Insight</span>
          </div>
          <div>© 2026 · Educational content only · Not financial or immigration advice</div>
        </div>
      </footer>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Serif+Display&display=swap');
        * { box-sizing: border-box; }
        button:focus-visible { outline: 2px solid #2563EB; outline-offset: 2px; border-radius: 4px; }
      `}</style>

      {showSendModal && sendPackage && consultant?.slug && (
        <SendToConsultantModal
          consultantSlug={consultant.slug}
          consultantName={consultant.displayName}
          reportPackage={sendPackage}
          onClose={() => { setShowSendModal(false); setSendPackage(null) }}
          onSuccess={() => { /* modal shows its own success state; close after delay handled by user */ }}
        />
      )}
    </div>
  )
}
