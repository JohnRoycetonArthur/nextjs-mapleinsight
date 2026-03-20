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
// ─── Session data shape ───────────────────────────────────────────────────────

/** All answers the wizard collects — all fields are optional until submitted. */
export interface WizardAnswers {
  // Step 1 — Household
  adults?: number        // default 1
  children?: number      // default 0
  arrival?: string       // 'within_30'|'1_3_months'|'3_6_months'|'6_12_months'|'12_plus'

  // Step 2 — Immigration
  pathway?: string       // 'express_entry'|'pnp'|'study_permit'|'work_permit'|'family'|'refugee'|'other'
  feesPaid?: boolean
  biometricsDone?: boolean

  // Step 3 — Destination
  city?: string          // 'toronto'|'vancouver'|'calgary'|'montreal'|'ottawa'|'halifax'|'winnipeg'|'other'
  province?: string
  transitMode?: string   // 'public'|'car'|'both'

  // Step 4 — Work & Income
  jobStatus?: string     // 'secured_30'|'offer_30_90'|'no_offer'|'student'
  income?: string        // raw string (e.g. "4,500") — parsed to number for engine

  // Step 5 — Savings
  savings?: string       // raw string, maps to liquidSavings
  obligations?: string   // raw string, maps to monthlyObligations
  savingsCapacity?: string

  // Step 6 — Lifestyle
  housing?: string       // 'studio'|'1br'|'2br'|'3br'
  furnishing?: string    // 'minimal'|'moderate'|'full'
  childcare?: boolean
  car?: boolean
  customExpenses?: Array<{ label: string; amount: string }>
}

export interface SessionData {
  slug: string
  timestamp: number
  currentStep: number
  answers: WizardAnswers
  /** Schema version — bump when shape changes to invalidate stale sessions. */
  schemaVersion: number
}

const SCHEMA_VERSION = 1
const DEBOUNCE_MS    = 400

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
    return parsed
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

function freshSession(slug: string): SessionData {
  return {
    slug,
    timestamp:     Date.now(),
    currentStep:   1,
    answers:       {},
    schemaVersion: SCHEMA_VERSION,
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

export interface SettlementSessionContextValue {
  session:       SessionData
  isRestored:    boolean   // true once mount restoration check is complete
  storageAvailable: boolean

  updateAnswers: (patch: Partial<WizardAnswers>) => void
  setStep:       (step: number) => void
  clearSession:  () => void
}

const SettlementSessionContext = createContext<SettlementSessionContextValue | null>(null)

// ─── Provider ─────────────────────────────────────────────────────────────────

interface Props {
  slug:     string
  children: React.ReactNode
}

export function SettlementSessionProvider({ slug, children }: Props) {
  const [session, setSession]             = useState<SessionData>(() => freshSession(slug))
  const [isRestored, setIsRestored]       = useState(false)
  const [storageAvailable, setStorageAvailable] = useState(true)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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
      setSession(saved)
    }
    setIsRestored(true)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug])

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

  // Task 3: Clear — removes localStorage and resets to a fresh session
  const clearSession = useCallback(() => {
    setSession(prev => {
      eraseSession(prev.slug, prev.timestamp)
      return freshSession(prev.slug)
    })
  }, [])

  return (
    <SettlementSessionContext.Provider
      value={{ session, isRestored, storageAvailable, updateAnswers, setStep, clearSession }}
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
