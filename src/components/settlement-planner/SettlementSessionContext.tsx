'use client'

/**
 * Settlement Planner — Privacy-First Session Management (US-10.3)
 *
 * All wizard answers are stored in localStorage only.
 * Nothing is sent to any server except on an explicit "Send to consultant" action.
 *
 * localStorage key scheme:
 *   Pointer:  mi_settlement_ptr_{slug}   → timestamp (string)
 *   Data:     mi_settlement_{slug}_{ts}  → JSON session data
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import type { ConsultantBranding, PlannerMode } from './types'
import { resetWorkIncomeAnswersForPathway } from './session/pathwayResets'
import type { CustomExpense } from '@/lib/settlement-engine/defaults'
// ─── Session data shape ───────────────────────────────────────────────────────

/** All answers the wizard collects — all fields are optional until submitted. */
export interface WizardAnswers {
  // Step 1 — Household
  adults?: number        // default 1
  children?: number      // default 0
  arrival?: string       // 'within_30'|'1_3_months'|'3_6_months'|'6_12_months'|'12_plus'
  departureRegion?: string  // region code e.g. 'south-asia' — used for flight cost estimate

  // Step 2 — Immigration
  pathway?: string       // 'express_entry'|'pnp'|'study_permit'|'work_permit'|'family'
  feesPaid?: boolean
  biometricsDone?: boolean

  // Step 3 — Destination
  city?: string          // 'toronto'|'vancouver'|'calgary'|'montreal'|'ottawa'|'halifax'|'winnipeg'|'other'
  province?: string

  // Step 4 — Work & Income
  jobStatus?: string     // 'secured_30'|'offer_30_90'|'no_offer'|'student'
  income?: string        // raw string (e.g. "4,500") — parsed to number for engine
  // Occupation estimator (optional — only set when user uses the E9 estimator)
  occupation?: string
  nocCode?: string
  experience?: number
  hoursPerWeek?: number
  estimatedGrossLow?: number
  estimatedGrossMid?: number
  estimatedGrossHigh?: number
  estimatedNetMonthly?: number
  incomeSource?: string    // 'engine_estimate' | 'user_override' | 'direct_input'
  confidence?: string      // 'High' | 'Medium' | 'Low'

  // Step 5 — Savings
  savings?: string       // raw string, maps to liquidSavings
  obligations?: string   // raw string, maps to monthlyObligations
  savingsCapacity?: string
  inputCurrency?: string      // ISO 4217 code (e.g. 'INR') — defaults to 'CAD'
  exchangeRate?: number       // 1 unit inputCurrency → CAD (at time of wizard completion)
  exchangeRateDate?: string   // ISO date when rate was fetched
  fundsComposition?: {
    borrowed: string     // raw string, maps to fundsComposition.borrowed in EngineInput
    gifted:   string     // raw string, maps to fundsComposition.gifted in EngineInput
  }

  // Step 6 — Lifestyle
  housing?: string       // 'studio'|'1br'|'2br'|'3br'
  furnishing?: string    // 'minimal'|'moderate'|'full'
  childcare?: boolean
  car?: boolean
  customExpenses?: CustomExpense[]

  // Express Entry sub-class (only present when pathway === 'express_entry')
  expressEntry?: {
    subClass:        string   // 'fsw' | 'cec' | 'fst' | 'unsure'
    hasJobOffer:     boolean
    isWorkAuthorized: boolean
  }

  // Study permit sub-form (only present when pathway === 'study_permit')
  studyPermit?: {
    programLevel:      string   // 'undergraduate'|'graduate'|'college_diploma'|'language_school'
    tuitionAmount:     number
    gicStatus:         string   // 'planning'|'purchased'|'not_purchasing'
    scholarshipAmount: number
    isSDS?:            boolean  // Student Direct Stream fast-track
    // Part-time income estimator (Step 4)
    partTimeHoursPerWeek?:             number
    partTimeHourlyRate?:               number
    estimatedPartTimeMonthlyIncome?:   number
  } | null
}

export interface SessionData {
  slug: string
  mode: PlannerMode
  timestamp: number
  currentStep: number
  answers: WizardAnswers
  /** Schema version - bump when shape changes to invalidate stale sessions. */
  schemaVersion: number
}

const SCHEMA_VERSION = 1
const DEBOUNCE_MS    = 400
const DEPRECATED_ANSWER_KEYS = ['transit' + 'Mode'] as const

// ─── localStorage helpers ─────────────────────────────────────────────────────

function ptrKey(slug: string)             { return `mi_settlement_ptr_${slug}` }
function dataKey(slug: string, ts: number){ return `mi_settlement_${slug}_${ts}` }

function readStorage(key: string): string | null {
  try { return localStorage.getItem(key) } catch { return null }
}

function writeStorage(key: string, value: string): void {
  try { localStorage.setItem(key, value) } catch { /* storage full / disabled — silently ignore */ }
}

function removeStorage(key: string): void {
  try { localStorage.removeItem(key) } catch { /* ignore */ }
}

/** Load + validate a session from localStorage. Returns null if absent or invalid. */
function loadSession(slug: string): SessionData | null {
  const tsStr = readStorage(ptrKey(slug))
  if (!tsStr) return null

  const ts  = parseInt(tsStr, 10)
  const raw = readStorage(dataKey(slug, ts))
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as SessionData
    // Validate schema version — discard sessions from incompatible shapes
    if (parsed.schemaVersion !== SCHEMA_VERSION) return null
    if (typeof parsed.timestamp !== 'number')    return null
    if (typeof parsed.answers   !== 'object')    return null
    const answers = typeof parsed.answers === 'object' && parsed.answers !== null
      ? parsed.answers
      : {}
    const sanitizedAnswers = { ...(answers as WizardAnswers & Record<string, unknown>) }
    for (const key of DEPRECATED_ANSWER_KEYS) {
      delete sanitizedAnswers[key]
    }
    return {
      ...parsed,
      answers: sanitizedAnswers,
    }
  } catch {
    return null
  }
}

function persistSession(session: SessionData): void {
  const json = JSON.stringify(session)
  writeStorage(ptrKey(session.slug), String(session.timestamp))
  writeStorage(dataKey(session.slug, session.timestamp), json)
}

function eraseSession(slug: string, timestamp: number): void {
  removeStorage(ptrKey(slug))
  removeStorage(dataKey(slug, timestamp))
}

function freshSession(slug: string, mode: PlannerMode): SessionData {
  return {
    slug,
    mode,
    timestamp:     Date.now(),
    currentStep:   1,
    answers:       {},
    schemaVersion: SCHEMA_VERSION,
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

export interface SettlementSessionContextValue {
  session:       SessionData
  mode: PlannerMode
  consultant: ConsultantBranding | null
  isRestored:    boolean   // true once mount restoration check is complete
  storageAvailable: boolean
  stalePathwayToast: boolean   // true when a restored session had an unsupported pathway

  updateAnswers:         (patch: Partial<WizardAnswers>) => void
  setStep:               (step: number) => void
  clearSession:          () => void
  clearStalePathwayToast: () => void
}

const SettlementSessionContext = createContext<SettlementSessionContextValue | null>(null)

// ─── Provider ─────────────────────────────────────────────────────────────────

interface Props {
  slug:     string
  mode?: PlannerMode
  consultant?: ConsultantBranding | null
  children: React.ReactNode
}

export function SettlementSessionProvider({
  slug,
  mode = 'consultant',
  consultant = null,
  children,
}: Props) {
  const effectiveConsultant = mode === 'public' ? null : consultant
  const [session, setSession]             = useState<SessionData>(() => freshSession(slug, mode))
  const [isRestored, setIsRestored]       = useState(false)
  const [storageAvailable, setStorageAvailable] = useState(true)
  const [stalePathwayToast, setStalePathwayToast] = useState(false)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const previousPathwayRef = useRef<string | undefined>(undefined)

  // ── Task 4: Session restoration on mount ────────────────────────────────────
  useEffect(() => {
    // Check if localStorage is available (TC-4 graceful degradation)
    try {
      localStorage.setItem('__mi_test__', '1')
      localStorage.removeItem('__mi_test__')
    } catch {
      setStorageAvailable(false)
      setIsRestored(true)
      return
    }

    const saved = loadSession(slug)
    if (saved) {
      const stalePathways = ['refugee', 'other']
      if (saved.answers.pathway && stalePathways.includes(saved.answers.pathway)) {
        // Pathway is no longer supported — reset to Step 2 with no pathway selected
        setSession({
          ...saved,
          slug,
          mode,
          currentStep: 2,
          answers: { ...saved.answers, pathway: '' },
        })
        setStalePathwayToast(true)
      } else {
        setSession({ ...saved, slug, mode })
      }
    } else {
      setSession(freshSession(slug, mode))
    }
    setIsRestored(true)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, mode])

  // ── Task 5: Auto-save after each state change (debounced) ───────────────────
  useEffect(() => {
    if (!isRestored || !storageAvailable) return

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      persistSession(session)
    }, DEBOUNCE_MS)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [session, isRestored, storageAvailable])

  useEffect(() => {
    if (!isRestored) return

    const currentPathway = session.answers.pathway
    const previousPathway = previousPathwayRef.current
    previousPathwayRef.current = currentPathway

    if (previousPathway === undefined || previousPathway === currentPathway) return

    setSession(prev => ({
      ...prev,
      answers: resetWorkIncomeAnswersForPathway(prev.answers, currentPathway),
    }))
  }, [isRestored, session.answers.pathway])

  // ── Mutations ────────────────────────────────────────────────────────────────

  const updateAnswers = useCallback((patch: Partial<WizardAnswers>) => {
    setSession(prev => ({
      ...prev,
      answers: { ...prev.answers, ...patch },
    }))
  }, [])

  const setStep = useCallback((step: number) => {
    setSession(prev => ({ ...prev, currentStep: step }))
  }, [])

  const clearStalePathwayToast = useCallback(() => {
    setStalePathwayToast(false)
  }, [])

  // Task 3: Clear — removes localStorage and resets to a fresh session
  const clearSession = useCallback(() => {
    setSession(prev => {
      eraseSession(prev.slug, prev.timestamp)
      return freshSession(prev.slug, mode)
    })
  }, [mode])

  return (
    <SettlementSessionContext.Provider
      value={{
        session,
        mode,
        consultant: effectiveConsultant,
        isRestored,
        storageAvailable,
        stalePathwayToast,
        updateAnswers,
        setStep,
        clearSession,
        clearStalePathwayToast,
      }}
    >
      {children}
    </SettlementSessionContext.Provider>
  )
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useSettlementSession(): SettlementSessionContextValue {
  const ctx = useContext(SettlementSessionContext)
  if (!ctx) {
    throw new Error('useSettlementSession must be used inside <SettlementSessionProvider>')
  }
  return ctx
}

export function usePlannerMode(): PlannerMode {
  return useSettlementSession().mode
}
