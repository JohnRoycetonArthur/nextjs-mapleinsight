'use client'

/**
 * WizardShell — US-11.1
 *
 * Renders the full 6-step settlement planner wizard:
 *   - Compact consultant-branded header (sticky)
 *   - Desktop horizontal stepper / mobile progress bar
 *   - Step content area with privacy badge
 *   - Fixed navigation footer (Back, Clear, Next/See My Plan)
 *   - Per-step validation gate with inline error messages
 *   - All wizard state wired to useSettlementSession (US-10.3)
 */

import { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import {
  useSettlementSession,
  type WizardAnswers,
} from '../SettlementSessionContext'
import { DesktopStepper } from './DesktopStepper'
import { MobileProgress } from './MobileProgress'
import { Step1Household }  from './steps/Step1Household'
import { Step2Immigration } from './steps/Step2Immigration'
import { Step3Destination } from './steps/Step3Destination'
import { Step4WorkIncome }  from './steps/Step4WorkIncome'
import { Step5Savings }     from './steps/Step5Savings'
import { Step6Lifestyle }   from './steps/Step6Lifestyle'
import { C, FONT, SERIF, TOTAL_STEPS, WIZARD_STEPS } from './constants'
import { ResultsDashboard } from '../ResultsDashboard'

// ─── Consultant branding shape (minimal — what the header needs) ───────────────

export interface ConsultantBranding {
  displayName:  string
  companyName:  string | null
  logo:         { asset: { url: string } } | null
  theme:        { accentColor: string | null } | null
}

// ─── Icons ────────────────────────────────────────────────────────────────────

const MapleLeaf = ({ size = 11, color = C.red }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden="true">
    <path d="M12 0L13.5 6.5L17 4L15.5 8.5L22 9L17 12L20 16L14 14L12 24L10 14L4 16L7 12L2 9L8.5 8.5L7 4L10.5 6.5Z" />
  </svg>
)

const LockIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
)

const ChevLeft = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
  </svg>
)

const ChevRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
  </svg>
)

const TrashIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
  </svg>
)

// ─── Per-step validation ──────────────────────────────────────────────────────

interface StepErrors { [field: string]: string }

function validateStep(step: number, answers: WizardAnswers): StepErrors {
  const errors: StepErrors = {}
  switch (step) {
    case 1:
      if (!answers.arrival) errors.arrival = 'Please select your planned arrival window.'
      break
    case 2:
      if (!answers.pathway) errors.pathway = 'Please select your immigration pathway.'
      if (answers.pathway === 'study_permit') {
        if (!answers.studyPermit?.programLevel) {
          errors.studyPermitProgramLevel = 'Please select your program level.'
        }
      }
      break
    case 3:
      if (!answers.city) errors.city = 'Please select your destination city.'
      if (answers.city === 'other' && !answers.province) errors.province = 'Please select your province.'
      break
    case 4:
      if (!answers.jobStatus) errors.jobStatus = 'Please select your job situation.'
      break
    case 5:
      if (!answers.savings?.trim()) errors.savings = 'Please enter your available savings.'
      break
    case 6:
      if (!answers.housing)    errors.housing    = 'Please select a housing type.'
      if (!answers.furnishing) errors.furnishing = 'Please select a furnishing level.'
      break
  }
  return errors
}

// ─── Initials helper ──────────────────────────────────────────────────────────

function initials(name: string): string {
  return name.split(/\s+/).slice(0, 2).map(w => w[0] ?? '').join('').toUpperCase()
}

// ─── WizardShell ──────────────────────────────────────────────────────────────

interface Props {
  consultant?:    ConsultantBranding | null
  onComplete?:    (answers: WizardAnswers) => void
}

export function WizardShell({ consultant, onComplete }: Props) {
  const { session, updateAnswers, setStep, clearSession } = useSettlementSession()
  const { currentStep, answers } = session

  const [isMobile,    setIsMobile]    = useState(false)
  const [completed,   setCompleted]   = useState<Set<number>>(new Set())
  const [errors,      setErrors]      = useState<StepErrors>({})
  const [showClear,   setShowClear]   = useState(false)
  const [showResults, setShowResults] = useState(false)

  // ── Responsive breakpoint ─────────────────────────────────────────────────
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // ── Restore completed set from session ─────────────────────────────────────
  useEffect(() => {
    if (currentStep > 1) {
      setCompleted(prev => {
        const next = new Set(prev)
        for (let i = 1; i < currentStep; i++) next.add(i)
        return next
      })
    }
  }, [currentStep])

  // ── Navigation handlers ───────────────────────────────────────────────────

  const onChange = useCallback((key: keyof WizardAnswers, value: unknown) => {
    updateAnswers({ [key]: value } as Partial<WizardAnswers>)
    // Clear the error for this field as soon as user interacts
    setErrors(prev => {
      if (!prev[key]) return prev
      const next = { ...prev }
      delete next[key]
      return next
    })
  }, [updateAnswers])

  const goNext = useCallback(() => {
    const stepErrors = validateStep(currentStep, answers)
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors)
      return
    }
    setErrors({})
    setCompleted(prev => new Set([...prev, currentStep]))

    if (currentStep >= TOTAL_STEPS) {
      onComplete?.(answers)
      setShowResults(true)
      return
    }
    setStep(currentStep + 1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [currentStep, answers, setStep, onComplete])

  const goBack = useCallback(() => {
    setErrors({})
    setStep(Math.max(1, currentStep - 1))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [currentStep, setStep])

  const handleClear = useCallback(() => {
    clearSession()
    setCompleted(new Set())
    setErrors({})
    setShowClear(false)
  }, [clearSession])

  // ── Step meta ─────────────────────────────────────────────────────────────
  const stepMeta   = WIZARD_STEPS[currentStep - 1]
  const accentColor = consultant?.theme?.accentColor ?? stepMeta.color

  // ── Step content ──────────────────────────────────────────────────────────
  const renderStep = () => {
    const props = { data: answers, onChange, errors }
    switch (currentStep) {
      case 1: return <Step1Household  {...props} />
      case 2: return <Step2Immigration {...props} isMobile={isMobile} />
      case 3: return <Step3Destination {...props} isMobile={isMobile} />
      case 4: return <Step4WorkIncome  {...props} isMobile={isMobile} />
      case 5: return <Step5Savings     {...props} />
      case 6: return (
        <Step6Lifestyle
          {...props}
          isMobile={isMobile}
          hasChildren={(answers.children ?? 0) > 0}
        />
      )
      default: return null
    }
  }

  // ── Header logo or initials ───────────────────────────────────────────────
  const logoUrl  = consultant?.logo?.asset?.url
  const name     = consultant?.companyName ?? consultant?.displayName ?? 'Maple Insight'
  const abbr     = initials(name)

  if (showResults) {
    return <ResultsDashboard consultant={consultant} />
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: FONT, paddingBottom: 80 }}>

      {/* ── Compact wizard header ──────────────────────────────────────────── */}
      <nav
        style={{
          background:   C.white,
          borderBottom: `1px solid ${C.border}`,
          padding:      isMobile ? '0 16px' : '0 32px',
          position:     'sticky',
          top:           0,
          zIndex:        100,
        }}
        aria-label="Wizard header"
      >
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 52 }}>
          {/* Left: consultant branding */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt={name}
                width={28}
                height={28}
                style={{ borderRadius: 7, objectFit: 'contain' }}
              />
            ) : (
              <div style={{
                width: 28, height: 28, borderRadius: 7,
                background: `linear-gradient(135deg, ${C.forest}, ${accentColor})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontWeight: 800, fontSize: 11, fontFamily: SERIF,
              }}>
                {abbr}
              </div>
            )}
            {!isMobile && (
              <span style={{ fontFamily: SERIF, fontSize: 14, color: C.forest }}>{name}</span>
            )}
            <span style={{ fontSize: 11, color: C.textLight }}>|</span>
            <span style={{ fontSize: 11, color: C.textLight }}>Settlement Planner</span>
          </div>

          {/* Right: Powered by Maple Insight */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: C.textLight }}>
            <span>Powered by</span>
            <MapleLeaf size={11} />
            <span style={{ fontFamily: SERIF, fontSize: 11, color: C.forest, fontWeight: 700 }}>Maple Insight</span>
          </div>
        </div>
      </nav>

      {/* ── Progress indicator ────────────────────────────────────────────── */}
      <div style={{ background: C.white, borderBottom: `1px solid ${C.border}`, padding: isMobile ? '0 16px' : '16px 24px' }}>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          {isMobile
            ? <MobileProgress currentStep={currentStep} />
            : <DesktopStepper currentStep={currentStep} completedSteps={completed} />
          }
        </div>
      </div>

      {/* ── Step content ──────────────────────────────────────────────────── */}
      <section
        style={{ maxWidth: 580, margin: '0 auto', padding: isMobile ? '24px 16px' : '40px 24px' }}
        aria-label={`Step ${currentStep} of ${TOTAL_STEPS}: ${stepMeta.title}`}
      >
        {/* Privacy badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          background: '#E8F5EE', borderRadius: 7, padding: '4px 11px',
          marginBottom: 22, fontSize: 11, color: C.accent, fontWeight: 600,
        }}>
          <LockIcon /> Your data stays in your browser
        </div>

        {renderStep()}
      </section>

      {/* ── Clear confirmation dialog ─────────────────────────────────────── */}
      {showClear && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="clear-dialog-title"
          onClick={e => { if (e.target === e.currentTarget) setShowClear(false) }}
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 24,
          }}
        >
          <div style={{ background: C.white, borderRadius: 20, padding: '40px 32px', maxWidth: 420, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: '#FDF6E3', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, margin: '0 auto 16px' }}>🗑️</div>
            <h3 id="clear-dialog-title" style={{ fontFamily: SERIF, fontSize: 20, color: C.forest, textAlign: 'center', margin: '0 0 10px' }}>Clear all data?</h3>
            <p style={{ fontSize: 14, color: C.gray, textAlign: 'center', lineHeight: 1.65, margin: '0 0 24px', fontFamily: FONT }}>
              All your answers will be removed and the wizard will restart from step 1. This cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                onClick={() => setShowClear(false)}
                style={{ flex: 1, padding: '10px 16px', borderRadius: 10, border: `1px solid ${C.border}`, background: C.white, fontSize: 14, fontWeight: 600, color: C.text, cursor: 'pointer', fontFamily: FONT }}
              >
                Keep my answers
              </button>
              <button
                type="button"
                onClick={handleClear}
                style={{ flex: 1, padding: '10px 16px', borderRadius: 10, border: 'none', background: C.red, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: FONT }}
              >
                Yes, clear all
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Fixed navigation footer ────────────────────────────────────────── */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: C.white, borderTop: `1px solid ${C.border}`,
        padding:    isMobile ? '10px 16px' : '14px 24px',
        zIndex: 50,
      }}>
        <div style={{ maxWidth: 580, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>

          {/* Left: Back + Clear */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {currentStep > 1 && (
              <button
                type="button"
                onClick={goBack}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '9px 16px', borderRadius: 9,
                  border: `1px solid ${C.border}`, background: C.white,
                  color: C.text, fontWeight: 600, fontSize: 13,
                  cursor: 'pointer', fontFamily: FONT,
                }}
              >
                <ChevLeft /> Back
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowClear(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '5px 10px', borderRadius: 7, border: 'none',
                background: 'transparent', color: C.textLight,
                fontSize: 11, cursor: 'pointer', fontFamily: FONT,
              }}
            >
              <TrashIcon /> Clear
            </button>
          </div>

          {/* Right: Step text + Next button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* "Step X of 6" — AC-1 */}
            {!isMobile && (
              <span style={{ fontSize: 12, color: C.textLight, fontFamily: FONT }}>
                Step {currentStep} of {TOTAL_STEPS}
              </span>
            )}

            <button
              type="button"
              onClick={goNext}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding:    '11px 26px', borderRadius: 10, border: 'none',
                background: accentColor, color: '#fff',
                fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: FONT,
                boxShadow: `0 2px 8px ${accentColor}44`,
                transition: 'transform 0.15s, box-shadow 0.15s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-1px)'
                e.currentTarget.style.boxShadow = `0 4px 12px ${accentColor}55`
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = `0 2px 8px ${accentColor}44`
              }}
            >
              {currentStep === TOTAL_STEPS ? 'See My Plan' : 'Next'} <ChevRight />
            </button>
          </div>
        </div>

        {/* Inline validation error bar */}
        {Object.keys(errors).length > 0 && (
          <div style={{ maxWidth: 580, margin: '8px auto 0', textAlign: 'right' }}>
            <span style={{ fontSize: 12, color: C.red, fontFamily: FONT }}>
              Please complete all required fields to continue.
            </span>
          </div>
        )}
      </div>

    </div>
  )
}
