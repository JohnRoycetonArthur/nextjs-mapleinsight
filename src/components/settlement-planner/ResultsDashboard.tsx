'use client'

/**
 * Settlement Planner — Client Results Dashboard (US-13.1)
 *
 * Renders the full results page after wizard completion.
 * Reads session context, runs the settlement engine client-side,
 * evaluates risks, and displays all required sections.
 */

import { useState, useEffect, useMemo, useRef } from 'react'
import { CloudDownload, PaperPlane, File, Calendar, CircleArrowDown, CircleArrowRight, ClipboardCheck, Clipboard, Rocket, Crosshairs } from 'nucleo-glass-icons/react'
import {
  generateVerdict,
  computeTimeToDepletion,
  getPriorityAction,
  generateTimelineGuidance,
  modelIncomeScenarios,
  type NarrativeOutput,
} from '@/lib/settlement-engine/narrative'
import { usePlannerMode, useSettlementSession } from './SettlementSessionContext'
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
import type { ConsultantBranding } from './types'
import { ConsultantReport } from './ConsultantReport'
import { generateReportPackage, downloadReportPackage, type MapleReportPackage } from '@/lib/settlement-engine/export'
import { generateChecklist, type ChecklistItem } from '@/lib/settlement-engine/checklist'
import { SendToConsultantModal } from './SendToConsultantModal'
import { SourceBadge } from './SourceBadge'
import { DataFreshnessBar } from './DataFreshnessBar'
import { fetchDataSources } from '@/lib/settlement-engine/sources'
import type { DataSource } from '@/lib/settlement-engine/types'
import { CURRENCY_SYMBOLS, type SupportedCurrency } from '@/lib/settlement-engine/currency'
import { PublicModeSaveCard } from './PublicModeSaveCard'
import { WhatToDoNext } from './WhatToDoNext'
import {
  trackPlannerReportExit,
  trackPlannerReportScrollDepth,
  trackPlannerReportTimeMilestone,
  trackPlannerReportView,
} from '@/lib/settlement-engine/analytics'

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

function mapPathway(
  w: string | undefined,
  expressEntry?: { subClass: string; hasJobOffer: boolean; isWorkAuthorized: boolean },
): ImmigrationPathway {
  switch (w) {
    case 'study_permit':  return 'study-permit'
    case 'work_permit':   return 'work-permit'
    case 'pnp':           return 'pnp'
    case 'family':        return 'family-sponsorship'
    case 'express_entry': {
      const sub = expressEntry?.subClass ?? 'fsw'
      if (sub === 'cec' && expressEntry?.hasJobOffer && expressEntry?.isWorkAuthorized) {
        return 'express-entry-cec'   // proof-of-funds exempt
      }
      if (sub === 'fst') return 'express-entry-fstp'
      return 'express-entry-fsw'     // fsw, unsure, or CEC without full exemption criteria
    }
    default: return 'express-entry-fsw'
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

const ChevDown = ({ open }: { open: boolean }) => (
  <span style={{ display: 'inline-flex', transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} aria-hidden="true">
    <CircleArrowDown size={16} stopColor1="#374151" stopColor2="#6B7280" />
  </span>
)

const CheckIcon = ({ color = C.accent }: { color?: string }) => (
  <span style={{ flexShrink: 0, marginTop: 2, display: 'inline-flex' }} aria-hidden="true">
    <ClipboardCheck size={14} stopColor1={color} stopColor2={color} />
  </span>
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
  onStartOver?: () => void
}

// ─── ResultsDashboard ─────────────────────────────────────────────────────────

export function ResultsDashboard({ consultant, onStartOver }: Props) {
  const { session }  = useSettlementSession()
  const { answers }  = session
  const mode = usePlannerMode()
  const isPublicMode = mode === 'public'

  const [isMobile,             setIsMobile]             = useState(false)
  const [prepareOpen,          setPrepareOpen]          = useState(false)
  const [minLoadDone,          setMinLoadDone]          = useState(false)
  const [baseline,             setBaseline]             = useState<CityBaseline | null>(null)
  const [baselineError,        setBaselineError]        = useState(false)
  const [openExplainer,        setOpenExplainer]        = useState<string | null>(null)
  const [showConsultantReport, setShowConsultantReport] = useState(false)
  const [pdfLoading,           setPdfLoading]           = useState(false)
  const [showSendModal,        setShowSendModal]        = useState(false)
  const [sendPackage,          setSendPackage]          = useState<MapleReportPackage | null>(null)
  const [dataSources,          setDataSources]          = useState<Map<string, DataSource>>(new Map())
  const [checklistOpen,        setChecklistOpen]        = useState(false)
  const [reportTrackingActive, setReportTrackingActive] = useState(false)
  const hasTrackedReportViewRef = useRef(false)
  const reportStartAtRef = useRef<number | null>(null)
  const reportMilestonesRef = useRef<Set<number>>(new Set())
  const reportScrollMilestonesRef = useRef<Set<number>>(new Set())
  const reportMaxDepthRef = useRef(0)
  const reportExitTrackedRef = useRef(false)

  // ── Minimum loading screen duration (3 s) ───────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => setMinLoadDone(true), 3000)
    return () => clearTimeout(t)
  }, [])

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

  // ── Fetch data source catalog ─────────────────────────────────────────────
  useEffect(() => {
    fetchDataSources().then(setDataSources).catch(() => { /* degrade gracefully */ })
  }, [])

  useEffect(() => {
    if (!reportTrackingActive || reportStartAtRef.current === null) return

    const scrollThresholds = [25, 50, 75, 100]
    const timeThresholds = [15, 30, 60, 120, 300]

    const getElapsedSeconds = () =>
      Math.max(1, Math.round((Date.now() - (reportStartAtRef.current ?? Date.now())) / 1000))

    const flushExitEvent = () => {
      if (reportExitTrackedRef.current) return
      reportExitTrackedRef.current = true
      trackPlannerReportExit({
        mode,
        report_type: 'client_plan',
        destination: answers.city ?? null,
        pathway: answers.pathway ?? null,
        elapsed_seconds: getElapsedSeconds(),
        max_depth_percentage: reportMaxDepthRef.current,
      })
    }

    const handleScroll = () => {
      const totalScrollable = document.documentElement.scrollHeight - window.innerHeight
      const depth = totalScrollable <= 0
        ? 100
        : Math.min(100, Math.round((window.scrollY / totalScrollable) * 100))

      reportMaxDepthRef.current = Math.max(reportMaxDepthRef.current, depth)

      for (const threshold of scrollThresholds) {
        if (depth < threshold || reportScrollMilestonesRef.current.has(threshold)) continue
        reportScrollMilestonesRef.current.add(threshold)
        trackPlannerReportScrollDepth({
          mode,
          report_type: 'client_plan',
          destination: answers.city ?? null,
          pathway: answers.pathway ?? null,
          depth_percentage: threshold,
        })
      }
    }

    const intervalId = window.setInterval(() => {
      const elapsedSeconds = getElapsedSeconds()
      for (const threshold of timeThresholds) {
        if (elapsedSeconds < threshold || reportMilestonesRef.current.has(threshold)) continue
        reportMilestonesRef.current.add(threshold)
        trackPlannerReportTimeMilestone({
          mode,
          report_type: 'client_plan',
          destination: answers.city ?? null,
          pathway: answers.pathway ?? null,
          elapsed_seconds: threshold,
        })
      }
    }, 1000)

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        flushExitEvent()
      }
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('pagehide', flushExitEvent)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.clearInterval(intervalId)
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('pagehide', flushExitEvent)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      flushExitEvent()
    }
  }, [answers.city, answers.pathway, mode, reportTrackingActive])

  // ── Build EngineInput ────────────────────────────────────────────────────────
  const engineInput = useMemo<EngineInput | null>(() => {
    if (!baseline) return null

    const pathway   = mapPathway(answers.pathway, answers.expressEntry ?? undefined)
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
          isSDS:             answers.studyPermit.isSDS ?? false,
        }
      : undefined

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
      liquidSavings:         Math.round(parseAmount(answers.savings) * (answers.exchangeRate ?? 1.0)),
      ...(answers.inputCurrency && answers.inputCurrency !== 'CAD' ? {
        inputCurrency: answers.inputCurrency,
        exchangeRate:  answers.exchangeRate ?? 1.0,
      } : {}),
      monthlyObligations:    parseAmount(answers.obligations),
      fundsComposition: answers.fundsComposition
        ? {
            borrowed: parseAmount(answers.fundsComposition.borrowed),
            gifted:   parseAmount(answers.fundsComposition.gifted),
          }
        : undefined,
      plansCar:              answers.car ?? false,
      customExpenses:        answers.customExpenses ?? [],
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

  useEffect(() => {
    const reportReady = minLoadDone && Boolean(baseline) && Boolean(engineInput) && Boolean(engineOutput) && !showConsultantReport

    if (!reportReady) {
      setReportTrackingActive(false)
      return
    }

    setReportTrackingActive(true)
    if (hasTrackedReportViewRef.current && !reportExitTrackedRef.current) return

    hasTrackedReportViewRef.current = true
    reportStartAtRef.current = Date.now()
    reportMilestonesRef.current = new Set()
    reportScrollMilestonesRef.current = new Set()
    reportMaxDepthRef.current = 0
    reportExitTrackedRef.current = false
    trackPlannerReportView({
      mode,
      report_type: 'client_plan',
      destination: answers.city ?? null,
      pathway: answers.pathway ?? null,
    })
  }, [answers.city, answers.pathway, baseline, engineInput, engineOutput, minLoadDone, mode, showConsultantReport])

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

  function buildReportPackage(
    reportConsultant: { slug: string; displayName: string; companyName: string | null } | null,
  ) {
    if (!engineInput || !engineOutput) return null

    return generateReportPackage({
      engineInput,
      engineOutput,
      answers,
      consultant: reportConsultant,
      irccCompliance,
      complianceRequirement,
      monthlyIncome: narrativeData?.monthlyIncome ?? 0,
      risks:         topRisks,
      narrative:     narrativeData ?? null,
    })
  }

  const publicReportPackage = isPublicMode ? buildReportPackage(null) : null

  // ── Consultant Report view ───────────────────────────────────────────────────
  if (!isPublicMode && showConsultantReport && consultant && engineInput && engineOutput) {
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
  if (!minLoadDone || !baseline || !engineInput || !engineOutput) {
    const clientName  = consultant?.displayName ?? null
    const cityLabel   = answers.city
      ? answers.city.charAt(0).toUpperCase() + answers.city.slice(1)
      : null
    const subLine = clientName && cityLabel
      ? `Analyzing data for ${clientName} · ${cityLabel}`
      : clientName
        ? `Analyzing data for ${clientName}`
        : cityLabel
          ? `Analyzing data for ${cityLabel}`
          : 'Analyzing your data…'

    if (baselineError) {
      return (
        <div style={{
          minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: C.forest, fontFamily: FONT, fontSize: 15, color: 'rgba(255,255,255,0.7)',
        }}>
          Unable to load city data. Please refresh.
        </div>
      )
    }

    return (
      <>
        <style>{`
          @keyframes mi-pulse {
            0%   { transform: scale(1);    box-shadow: 0 0 0 0 rgba(255,255,255,0.18); }
            50%  { transform: scale(1.06); box-shadow: 0 0 0 14px rgba(255,255,255,0); }
            100% { transform: scale(1);    box-shadow: 0 0 0 0 rgba(255,255,255,0); }
          }
          @keyframes mi-fade-in {
            from { opacity: 0; transform: translateY(10px); }
            to   { opacity: 1; transform: translateY(0); }
          }
        `}</style>
        <div style={{
          minHeight: '100vh', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          background: C.forest, fontFamily: FONT,
        }}>
          {/* Animated icon */}
          <div style={{
            width: 80, height: 80, borderRadius: 22,
            background: 'rgba(255,255,255,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 28,
            animation: 'mi-pulse 2s ease-in-out infinite',
          }}>
            <svg width="38" height="38" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 2L13.8 8.2L20 9L13.8 9.8L12 16L10.2 9.8L4 9L10.2 8.2L12 2Z"
                fill="white" opacity="0.95"/>
              <path d="M19 14L19.9 16.9L22 17.5L19.9 18.1L19 21L18.1 18.1L16 17.5L18.1 16.9L19 14Z"
                fill="white" opacity="0.6"/>
              <path d="M5 3L5.7 5.3L8 6L5.7 6.7L5 9L4.3 6.7L2 6L4.3 5.3L5 3Z"
                fill="white" opacity="0.45"/>
            </svg>
          </div>

          {/* Text */}
          <div style={{ animation: 'mi-fade-in 0.6s ease both', textAlign: 'center' }}>
            <div style={{
              fontFamily: SERIF, fontSize: 22, fontWeight: 700,
              color: C.white, marginBottom: 10, letterSpacing: '-0.01em',
            }}>
              Generating Settlement Plan…
            </div>
            <div style={{
              fontSize: 13, color: 'rgba(255,255,255,0.55)', fontFamily: FONT,
            }}>
              {subLine}
            </div>
          </div>
        </div>
      </>
    )
  }

  // ── Derived values ───────────────────────────────────────────────────────────
  const savings       = engineInput.liquidSavings

  // Original-currency display (US-22.1 AC-7)
  const inputCurrency    = answers.inputCurrency as SupportedCurrency | undefined
  const hasNonCAD        = !!(inputCurrency && inputCurrency !== 'CAD' && answers.exchangeRate)
  const savingsOriginalAmt = hasNonCAD ? parseAmount(answers.savings) : null
  const origSymbol         = hasNonCAD ? (CURRENCY_SYMBOLS[inputCurrency!] ?? inputCurrency) : null
  const savingsOriginalStr = savingsOriginalAmt !== null
    ? `${origSymbol}${savingsOriginalAmt.toLocaleString('en-CA', { maximumFractionDigits: 0 })}`
    : null
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

  const checklist = generateChecklist(
    {
      pathway:   answers.pathway  ?? '',
      province:  answers.province ?? 'ON',
      city:      answers.city     ?? 'toronto',
      gicStatus: answers.studyPermit?.gicStatus ?? null,
      income:    narrativeData?.monthlyIncome ?? 0,
      savings:   engineInput.liquidSavings,
    },
    topRisks,
  )

  // ── IRCC card derived values (study permit) ──────────────────────────────────
  let irccStatus: 'compliant' | 'amber' | 'deficit' = 'compliant'
  let irccBorderColor = C.accent
  let irccAvailable   = 0

  if (irccCompliance) {
    irccAvailable = engineInput.liquidSavings + (engineInput.studyPermit?.scholarshipAmount ?? 0)
    const ratio   = irccCompliance.shortfall / irccCompliance.required
    irccStatus      = irccCompliance.compliant ? 'compliant' : ratio <= 0.1 ? 'amber' : 'deficit'
    irccBorderColor = irccStatus === 'compliant' ? C.accent : irccStatus === 'amber' ? C.gold : C.red
  }

  // ── EE/PNP compliance derived values ─────────────────────────────────────────
  let eeStatus: 'compliant' | 'amber' | 'deficit' = 'compliant'
  let eeBorderColor = C.accent

  if (complianceRequirement !== null) {
    const gap   = complianceRequirement - savings
    const ratio = complianceRequirement > 0 ? gap / complianceRequirement : 0
    eeStatus      = savings >= complianceRequirement ? 'compliant' : ratio <= 0.1 ? 'amber' : 'deficit'
    eeBorderColor = eeStatus === 'compliant' ? C.accent : eeStatus === 'amber' ? C.gold : C.red
  }

  // ─── Report Package download (US-13.2) ────────────────────────────────────
  function handleDownloadReport() {
    const pkg = buildReportPackage(
      consultant
        ? {
            slug: consultant.displayName.toLowerCase().replace(/\s+/g, '-'),
            displayName: consultant.displayName,
            companyName: consultant.companyName ?? null,
          }
        : null,
    )
    if (!pkg) return
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
      const pkg = buildReportPackage(
        consultant
          ? {
              slug: consultant.displayName.toLowerCase().replace(/\s+/g, '-'),
              displayName: consultant.displayName,
              companyName: consultant.companyName ?? null,
            }
          : null,
      )
      if (!pkg) return
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
    const pkg = buildReportPackage(
      consultant
        ? { slug: consultant.slug, displayName: consultant.displayName, companyName: consultant.companyName ?? null }
        : null,
    )
    if (!pkg) return
    setSendPackage(pkg)
    setShowSendModal(true)
  }

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: FONT }}>

      {/* ── Nav ──────────────────────────────────────────────────────────── */}
      {!isPublicMode && (
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
            {!isPublicMode && consultant && engineInput && engineOutput && (
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
      )}

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <header style={{
        background: 'linear-gradient(165deg, #0F3D3A 0%, #1B5E58 40%, #1B7A4A 100%)',
        padding: isMobile ? '32px 20px 28px' : '44px 24px 40px',
        position: 'relative',
      }}>
        <div style={{ maxWidth: 760, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <h1 style={{ fontFamily: SERIF, fontSize: isMobile ? 24 : 32, fontWeight: 700, color: '#fff', margin: '0 0 6px', lineHeight: 1.15 }}>
            {isPublicMode ? 'Your Personalized Canada Settlement Plan' : 'Your Settlement Plan'}
          </h1>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>
            <span>{cityLabel}{provinceName ? `, ${provinceName}` : ''}</span>
            <span>·</span>
            <span>{pathwayLabel}</span>
            <span>·</span>
            <span>{householdLabel}</span>
          </div>
          {isPublicMode && (
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.72)', margin: '10px 0 0', lineHeight: 1.6 }}>
              Built by Maple Insight to help newcomers plan with more clarity and confidence.
            </p>
          )}
        </div>
      </header>

      <section style={{ maxWidth: isMobile ? '100%' : 760, margin: '0 auto', padding: isMobile ? '22px 16px' : '36px 24px' }}>

        {/* ── 1. Compliance Status Card — visually dominant ─────────────── */}

        {/* EE CEC: Proof of Funds Exempt */}
        {answers.pathway === 'express_entry' && engineInput?.pathway === 'express-entry-cec' && (
          <div style={{ borderRadius: 14, padding: isMobile ? '20px 18px' : '24px 28px', marginBottom: 20, background: '#ECFDF5', border: `2px solid ${C.accent}`, textAlign: 'center' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.accent, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5, fontFamily: FONT }}>
              IRCC Financial Requirement
            </div>
            <div style={{ fontFamily: SERIF, fontSize: isMobile ? 24 : 30, fontWeight: 700, color: C.accent, marginBottom: 6 }}>
              ✓ Proof of Funds: Exempt
            </div>
            <div style={{ fontSize: 13, color: C.text }}>
              CEC applicants with a valid job offer and current work authorization are exempt from the proof-of-funds requirement.
            </div>
            <div style={{ fontSize: 10, color: C.textLight, marginTop: 6 }}>
              Source: IRCC — Express Entry CEC eligibility criteria
            </div>
          </div>
        )}

        {/* EE / PNP: IRCC Settlement Funds */}
        {complianceRequirement !== null && (() => {
          const eeShortfall = Math.max(0, complianceRequirement - savings)
          const eeBg = eeStatus === 'compliant' ? '#ECFDF5' : eeStatus === 'amber' ? '#FFFBEB' : '#FEF2F2'
          return (
            <div style={{ borderRadius: 14, padding: isMobile ? '20px 18px' : '24px 28px', marginBottom: 20, background: eeBg, border: `2px solid ${eeBorderColor}`, textAlign: 'center' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: eeBorderColor, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5, fontFamily: FONT }}>
                IRCC Financial Requirement
              </div>
              <div style={{ fontFamily: SERIF, fontSize: isMobile ? 24 : 30, fontWeight: 700, color: eeBorderColor, marginBottom: 6 }}>
                {eeStatus === 'compliant' ? '✓ Meets Requirement' : eeStatus === 'amber' ? '⚠ Close to Minimum' : '✗ Below IRCC Minimum'}
              </div>
              <div style={{ fontSize: 13, color: C.text }}>
                {eeStatus === 'compliant'
                  ? `Savings of ${fmt(savings)} exceed the IRCC minimum of ${fmt(complianceRequirement)} by ${fmt(savings - complianceRequirement)}`
                  : `You need ${fmt(eeShortfall)} more to meet the IRCC minimum of ${fmt(complianceRequirement)}`
                }
              </div>
              <div style={{ fontSize: 10, color: C.textLight, marginTop: 6 }}>
                Based on IRCC proof-of-funds table effective {EXPRESS_ENTRY_DEFAULTS.expressEntryEffectiveDate}
              </div>
            </div>
          )
        })()}

        {/* Study Permit: IRCC Proof of Funds */}
        {isStudyPermit && irccCompliance && (
          <div style={{ borderRadius: 14, padding: isMobile ? '20px 18px' : '24px 28px', marginBottom: 20, background: irccCompliance.compliant ? '#ECFDF5' : '#FEF2F2', border: `2px solid ${irccBorderColor}`, textAlign: 'center' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: irccBorderColor, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5, fontFamily: FONT }}>
              IRCC Study Permit — Proof of Funds
            </div>
            <div style={{ fontFamily: SERIF, fontSize: isMobile ? 24 : 30, fontWeight: 700, color: irccBorderColor, marginBottom: 6 }}>
              {irccCompliance.compliant ? '✓ Funds Sufficient' : '✗ Shortfall Detected'}
            </div>
            <div style={{ fontSize: 13, color: C.text }}>
              {irccCompliance.compliant
                ? `Available funds of ${fmt(irccAvailable)} meet the required ${fmt(irccCompliance.required)}`
                : `Required: ${fmt(irccCompliance.required)} · Available: ${fmt(irccAvailable)} · Shortfall: ${fmt(irccCompliance.shortfall)}`
              }
            </div>
            <div style={{ fontSize: 10, color: C.textLight, marginTop: 6 }}>
              Requirement based on tuition + IRCC living expenses + transportation
            </div>
          </div>
        )}

        {/* ── 2. Metric Tiles ───────────────────────────────────────────────── */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>


          {/* ── 4 uniform metric tiles — all pathways ────────────────────── */}
          <MetricTile
            label="Upfront Move Cost" value={fmt(engineOutput.upfront)} sub="One-time costs"
            color={C.accent} isMobile={isMobile}
            explainerId="tile-upfront" openExplainer={openExplainer} onToggleExplainer={setOpenExplainer}
            explainerContent={<p style={{ margin: 0 }}>
              {isStudyPermit
                ? 'Includes study permit fee, biometrics, one-way flight, housing deposit, furnishing, GIC (if applicable), and first tuition instalment.'
                : 'Includes immigration fees, biometrics, one-way flight, housing deposit (first + last month), and setup/furnishing costs. Does not include ongoing monthly expenses.'}
            </p>}
          />
          <MetricTile
            label="Monthly Survival" value={fmt(engineOutput.monthlyMin)} sub="Minimum monthly"
            color={C.blue} isMobile={isMobile}
            explainerId="tile-monthly" openExplainer={openExplainer} onToggleExplainer={setOpenExplainer}
            explainerContent={<p style={{ margin: 0 }}>
              {isStudyPermit
                ? 'Core monthly costs including rent/housing, transit, utilities, groceries, phone, and provincial health insurance. Your GIC will release funds monthly to help cover these costs after arrival.'
                : 'Core monthly costs: rent, utilities, transit, groceries, phone/internet, plus any obligations, childcare, or car costs you entered. This is the minimum needed to cover basic living expenses each month.'}
            </p>}
          />
          <MetricTile
            label="Safe Savings Target" value={fmt(engineOutput.safeSavingsTarget)} sub="Recommended total"
            color={C.purple} isMobile={isMobile}
            explainerId="tile-target" openExplainer={openExplainer} onToggleExplainer={setOpenExplainer}
            explainerContent={<p style={{ margin: 0 }}>
              {complianceRequirement !== null
                ? `Your upfront move cost plus a ${Math.round((engineOutput.safeSavingsTarget / engineOutput.upfront - 1) * 100)}% buffer for unexpected expenses. This is the total liquid savings recommended before your move — separate from any IRCC compliance funds above.`
                : 'Your upfront move cost plus a buffer for unexpected expenses. This is the total liquid savings recommended before your move.'}
            </p>}
          />
          <MetricTile
            label="Financial Runway" value={runwayLabel} sub="Months of coverage"
            color={C.gold} isMobile={isMobile}
            explainerId="tile-runway" openExplainer={openExplainer} onToggleExplainer={setOpenExplainer}
            explainerContent={<p style={{ margin: 0 }}>
              How many months your current savings (after upfront costs) cover your monthly minimum expenses.
              {isStudyPermit && ' This excludes any GIC funds, which are returned monthly after you arrive.'}
            </p>}
          />

        </div>

        {/* ── 3. Savings Gap ─────────────────────────────────────────────── */}
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
            <span>
              Your savings: {fmt(savings)}
              {savingsOriginalStr && (
                <span style={{ color: C.textLight, marginLeft: 4 }}>({savingsOriginalStr})</span>
              )}
            </span>
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

        {/* ── 4. Cost Breakdown ───────────────────────────────────────────── */}
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

          // ── Timing buckets for upfront items (US-20.4) ────────────────
          const TIMING_GROUPS: Array<{
            timing: string
            label: string
            headerColor: string
            tipText?: string
          }> = [
            { timing: 'submission',        label: 'Due at Application Submission', headerColor: C.forest },
            { timing: 'pre-landing',       label: 'Due Before Landing',             headerColor: C.gold,
              tipText: 'The RPRF can be paid any time before landing. Paying early reduces last-minute pressure on savings.' },
            { timing: 'pre-arrival-setup', label: 'Pre-Arrival Setup Costs',        headerColor: C.gold },
            { timing: 'settlement',        label: 'Settlement Setup Costs',          headerColor: C.blue },
          ]

          const upfrontByTiming = TIMING_GROUPS
            .map(g => ({
              ...g,
              items: engineOutput.upfrontBreakdown.filter(it => (it.timing ?? 'settlement') === g.timing && it.cad > 0),
            }))
            .filter(g => g.items.length > 0)

          const hasTimingData = engineOutput.upfrontBreakdown.some(it => it.timing)

          return (
            <div style={{ background: C.white, borderRadius: 14, border: `1px solid ${C.border}`, padding: isMobile ? '18px 16px' : '22px 26px', marginBottom: 14, boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
              <h2 style={{ fontFamily: SERIF, fontSize: 18, color: C.forest, margin: '0 0 14px' }}>Cost Breakdown</h2>

              {/* ── Upfront costs split by timing ─────────────────────────── */}
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.textLight, textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 6 }}>
                  Upfront Costs
                </div>
                {hasTimingData ? (
                  /* Grouped by timing bucket */
                  <>
                    {upfrontByTiming.map(group => {
                      const groupTotal = group.items.reduce((s, it) => s + it.cad, 0)
                      return (
                        <div key={group.timing} style={{ marginBottom: 10, borderRadius: 10, overflow: 'hidden', border: `1px solid ${C.border}` }}>
                          {/* Section header */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 14px', background: group.headerColor }}>
                            <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{group.label}</span>
                            <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{fmt(groupTotal)}</span>
                          </div>
                          {group.items.map((it, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 14px', borderBottom: i < group.items.length - 1 ? `1px solid ${C.lightGray}` : 'none', background: C.white }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', flex: 1, marginRight: 8 }}>
                                <span style={{ fontSize: 13, color: C.text }}>{displayLabel(it)}</span>
                                {it.sourceKey
                                  ? <SourceBadge sourceKey={it.sourceKey} sources={dataSources} fallbackSource={it.source} />
                                  : <span style={{ fontSize: 10, color: C.textLight, background: C.lightGray, padding: '1px 6px', borderRadius: 4, whiteSpace: 'nowrap' }}>{sourceLabel(it.source)}</span>
                                }
                              </div>
                              <span style={{ fontSize: 13, fontWeight: 600, color: C.forest, whiteSpace: 'nowrap' }}>{fmt(it.cad)}</span>
                            </div>
                          ))}
                          {group.tipText && (
                            <div style={{ padding: '7px 14px', background: '#FFFBEB' }}>
                              <span style={{ fontSize: 11, color: C.gold, fontStyle: 'italic' }}>💡 {group.tipText}</span>
                            </div>
                          )}
                        </div>
                      )
                    })}
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0 0', borderTop: `2px solid ${C.border}`, marginTop: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: C.forest }}>Total Upfront</span>
                      <span style={{ fontSize: 15, fontWeight: 700, color: C.forest, fontFamily: SERIF }}>{fmt(engineOutput.upfront)}</span>
                    </div>
                  </>
                ) : (
                  /* Fallback: flat list (no timing data) */
                  <>
                    <DataFreshnessBar sources={dataSources} sourceKeys={engineOutput.upfrontBreakdown.map(it => it.sourceKey).filter((k): k is string => Boolean(k))} />
                    {engineOutput.upfrontBreakdown.map((it, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: i < engineOutput.upfrontBreakdown.length - 1 ? `1px solid ${C.lightGray}` : 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', flex: 1, marginRight: 8 }}>
                          <span style={{ fontSize: 13, color: C.text }}>{displayLabel(it)}</span>
                          {it.sourceKey
                            ? <SourceBadge sourceKey={it.sourceKey} sources={dataSources} fallbackSource={it.source} />
                            : <span style={{ fontSize: 10, color: C.textLight, background: C.lightGray, padding: '1px 6px', borderRadius: 4, whiteSpace: 'nowrap' }}>{sourceLabel(it.source)}</span>
                          }
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 600, color: C.forest, whiteSpace: 'nowrap' }}>{fmt(it.cad)}</span>
                      </div>
                    ))}
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0 0', borderTop: `2px solid ${C.border}`, marginTop: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: C.forest }}>Total</span>
                      <span style={{ fontSize: 15, fontWeight: 700, color: C.forest, fontFamily: SERIF }}>{fmt(engineOutput.upfront)}</span>
                    </div>
                  </>
                )}
              </div>

              {/* ── Monthly costs (unchanged) ─────────────────────────────── */}
              {(() => {
                const monthlySourceKeys = engineOutput.monthlyBreakdown.map(it => it.sourceKey).filter((k): k is string => Boolean(k))
                return (
                  <div style={{ marginBottom: 18 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: C.textLight, textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 6 }}>
                      Monthly Costs
                    </div>
                    <DataFreshnessBar sources={dataSources} sourceKeys={monthlySourceKeys} />
                    {engineOutput.monthlyBreakdown.map((it, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: i < engineOutput.monthlyBreakdown.length - 1 ? `1px solid ${C.lightGray}` : 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', flex: 1, marginRight: 8 }}>
                          <span style={{ fontSize: 13, color: C.text }}>{displayLabel(it)}</span>
                          {it.sourceKey
                            ? <SourceBadge sourceKey={it.sourceKey} sources={dataSources} fallbackSource={it.source} />
                            : <span style={{ fontSize: 10, color: C.textLight, background: C.lightGray, padding: '1px 6px', borderRadius: 4, whiteSpace: 'nowrap' }}>{sourceLabel(it.source)}</span>
                          }
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 600, color: C.forest, whiteSpace: 'nowrap' }}>{fmt(it.cad)}</span>
                      </div>
                    ))}
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0 0', borderTop: `2px solid ${C.border}`, marginTop: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: C.forest }}>Total</span>
                      <span style={{ fontSize: 15, fontWeight: 700, color: C.forest, fontFamily: SERIF }}>{fmt(engineOutput.monthlyMin)}</span>
                    </div>
                  </div>
                )
              })()}

              {isStudyPermit && (
                <p style={{ fontSize: 11, color: C.textLight, margin: '0', fontStyle: 'italic' }}>
                  * IRCC proof-of-funds calculation includes a round-trip transport estimate. The upfront cost above reflects your one-way flight only.
                </p>
              )}
            </div>
          )
        })()}

        {/* ── 5. Risks + Actions ──────────────────────────────────────────── */}
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
            ) : topActions.map((action, i) => {
              const isSDS = answers.studyPermit?.isSDS ?? false
              const sdsGicLink = isSDS && action.id === 'ircc-gic'
                ? 'https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada/study-permit/student-direct-stream.html'
                : null
              return (
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
                    {sdsGicLink ? (
                      <a href={sdsGicLink} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, fontWeight: 600, color: C.blue, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
                        IRCC SDS page <CircleArrowRight size={11} stopColor1={C.blue} stopColor2="#1D4ED8" style={{ marginLeft: 3 }} />
                      </a>
                    ) : action.articleSlug ? (
                      <a href={`/articles/${action.articleSlug}`} style={{ fontSize: 11, fontWeight: 600, color: C.blue, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
                        Learn more <CircleArrowRight size={11} stopColor1={C.blue} stopColor2="#1D4ED8" style={{ marginLeft: 3 }} />
                      </a>
                    ) : action.link ? (
                      <a href={action.link} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, fontWeight: 600, color: C.blue, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
                        Learn more <CircleArrowRight size={11} stopColor1={C.blue} stopColor2="#1D4ED8" style={{ marginLeft: 3 }} />
                      </a>
                    ) : null}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── AC-7: Consultant Post-Review Callout ────────────────────────── */}
        {isPublicMode ? (
          <WhatToDoNext />
        ) : (
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
              <Calendar size={20} stopColor1={C.red} stopColor2="#A3172E" />
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

        )}
        {/* ── 7. Settlement Checklist — collapsible accordion ─────────────── */}
        {(() => {
          const totalItems = checklist.preArrival.items.length + checklist.firstWeek.items.length + checklist.first30.items.length + checklist.first90.items.length
          return (
            <div style={{ background: C.white, borderRadius: 14, border: `1px solid ${C.border}`, marginBottom: 14, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
              <button
                onClick={() => setChecklistOpen(!checklistOpen)}
                aria-expanded={checklistOpen}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: isMobile ? '16px 16px' : '18px 26px', border: 'none', background: C.white, cursor: 'pointer', fontFamily: FONT }}
              >
                <h2 style={{ fontFamily: SERIF, fontSize: 18, color: C.forest, margin: 0 }}>Settlement Checklist</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 11, color: C.textLight }}>{totalItems} items · 4 periods</span>
                  <ChevDown open={checklistOpen} />
                </div>
              </button>
              {checklistOpen && (
                <div style={{ padding: isMobile ? '0 16px 18px' : '0 26px 22px', borderTop: `1px solid ${C.border}` }}>
                  {[
                    { title: 'Pre-Arrival',   period: checklist.preArrival, icon: <Rocket        size={14} stopColor1={C.accent} stopColor2="#1B4F4A" />, color: C.accent  },
                    { title: 'First Week',    period: checklist.firstWeek,  icon: <ClipboardCheck size={14} stopColor1={C.gold}   stopColor2="#92720A" />, color: C.gold    },
                    { title: 'First 30 Days', period: checklist.first30,    icon: <Clipboard      size={14} stopColor1={C.blue}   stopColor2="#1D4ED8" />, color: C.blue    },
                    { title: 'First 90 Days', period: checklist.first90,    icon: <Crosshairs     size={14} stopColor1={C.purple} stopColor2="#7C3AED" />, color: C.purple  },
                  ].map(group => (
                    <div key={group.title} style={{ marginTop: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
                        <span aria-hidden="true">{group.icon}</span>
                        <span style={{ fontFamily: SERIF, fontSize: 15, color: group.color, fontWeight: 700 }}>{group.title}</span>
                      </div>
                      {group.period.items.map((item: ChecklistItem, i) => (
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
                      {group.period.additionalSteps.length > 0 && (
                        <div style={{ marginTop: 6, paddingLeft: 4 }}>
                          <span style={{ fontSize: 11, color: C.textLight, fontStyle: 'italic' }}>
                            + {group.period.additionalSteps.length} additional step{group.period.additionalSteps.length > 1 ? 's' : ''} available in the full checklist PDF
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })()}

        {/* ── AC-8: Action Buttons ────────────────────────────────────────── */}
        {isPublicMode ? (
          publicReportPackage ? <PublicModeSaveCard reportPackage={publicReportPackage} onStartNewPlan={onStartOver} /> : null
        ) : (
        <div style={{ background: C.white, borderRadius: 14, border: `1px solid ${C.border}`, padding: isMobile ? '18px 16px' : '22px 26px', marginBottom: 14 }}>
          <h3 style={{ fontFamily: SERIF, fontSize: 16, color: C.forest, margin: '0 0 14px' }}>Save or Share Your Plan</h3>
          <div style={{ display: 'flex', gap: 8, flexDirection: isMobile ? 'column' : 'row' }}>
            <button
              onClick={handleDownloadPdf}
              disabled={pdfLoading}
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '13px 18px', borderRadius: 10, border: `1px solid ${C.border}`, background: C.white, color: C.forest, fontWeight: 700, fontSize: 13, cursor: pdfLoading ? 'wait' : 'pointer', fontFamily: FONT, opacity: pdfLoading ? 0.7 : 1 }}
            >
              <CloudDownload size={15} stopColor1="#374151" stopColor2="#1B4F4A" /> {pdfLoading ? 'Generating…' : 'Download PDF'}
            </button>
            <button
              onClick={handleDownloadReport}
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '13px 18px', borderRadius: 10, border: `1px solid ${C.border}`, background: C.white, color: C.forest, fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: FONT }}
            >
              <File size={15} stopColor1="#374151" stopColor2="#1B4F4A" /> Report Package
            </button>
            {consultant?.slug && (
              <button
                onClick={handleOpenSendModal}
                style={{ flex: 1.3, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '13px 18px', borderRadius: 10, border: 'none', background: C.red, color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: FONT, boxShadow: `0 2px 8px ${C.red}33` }}
              >
                <PaperPlane size={15} stopColor1="#FFFFFF" stopColor2="rgba(255,255,255,0.7)" /> Send to Consultant
              </button>
            )}
          </div>
        </div>
        )}

        {/* ── AC-9: Data Sources Footer ───────────────────────────────────── */}
        <div style={{ background: C.lightGray, borderRadius: 10, padding: '14px 18px', fontSize: 11, color: C.textLight, lineHeight: 1.6 }}>
          <strong style={{ color: C.gray }}>Data Sources:</strong> Rent data from CMHC ({baseline.effectiveDate.slice(0, 7)}). Immigration fees from IRCC. Income estimates from Job Bank via NOC wage data. Items marked &quot;Estimate&quot; are conservative baselines.
          <br />
          <strong style={{ color: C.gray }}>Engine:</strong> v{engineOutput.engineVersion} · Data: {engineOutput.dataVersion}
          <br />
          <strong style={{ color: C.gray }}>Disclaimer:</strong>{' '}
          {isPublicMode
            ? 'This is a financial planning tool, not immigration, legal, or financial advice. Actual costs vary by city, household, and personal situation. Consider consulting a Registered Canadian Immigration Consultant (RCIC) for program-specific guidance.'
            : 'This is a financial planning tool, not immigration or financial advice. Actual costs may vary. Consult your immigration representative for program-specific guidance.'}
        </div>

      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      {!isPublicMode && (
      <footer style={{ borderTop: `1px solid ${C.border}`, background: C.white, padding: isMobile ? '24px 16px' : '32px 24px', marginTop: 20 }}>
        <div style={{ maxWidth: 760, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', flexDirection: isMobile ? 'column' : 'row', gap: 10, fontSize: 11, color: C.textLight }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <MapleLeaf size={12} />
            <span style={{ fontFamily: SERIF, fontSize: 12, color: C.gray }}>Maple Insight</span>
          </div>
          <div>© 2026 · Educational content only · Not financial or immigration advice</div>
        </div>
      </footer>
      )}

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
