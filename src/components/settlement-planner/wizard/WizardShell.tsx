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

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import {
  usePlannerMode,
  useSettlementSession,
  type WizardAnswers,
} from '../SettlementSessionContext'
import {
  ArrowBack,
  ArrowRightAlt,
  Delete,
  Lock,
  RestartAlt,
} from '@material-symbols-svg/react'
import type { ConsultantBranding } from '../types'
import { DesktopStepper } from './DesktopStepper'
import { MobileProgress } from './MobileProgress'
import { Step1Household }  from './steps/Step1Household'
import { LiveCostImpactPreview } from './LiveCostImpactPreview'
import { Step2Immigration } from './steps/Step2Immigration'
import { Step3Destination } from './steps/Step3Destination'
import { Step4WorkIncome }  from './steps/Step4WorkIncome'
import { Step5Savings }     from './steps/Step5Savings'
import { Step6Lifestyle }   from './steps/Step6Lifestyle'
import { C, FONT, SERIF, TOTAL_STEPS, WIZARD_STEPS } from './constants'
import { ResultsDashboard } from '../ResultsDashboard'
import { VersionStamp } from '../VersionStamp'
import {
  trackPlannerComplete,
  trackPlannerSeePlanClick,
  trackPlannerStart,
  trackPlannerStepView,
  trackPlannerStepComplete,
} from '@/lib/settlement-engine/analytics'

// ─── Consultant branding shape (minimal — what the header needs) ───────────────

// ─── Brand icon ───────────────────────────────────────────────────────────────

const MapleLeaf = ({ size = 11, color = C.red }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden="true">
    <path d="M12 0L13.5 6.5L17 4L15.5 8.5L22 9L17 12L20 16L14 14L12 24L10 14L4 16L7 12L2 9L8.5 8.5L7 4L10.5 6.5Z" />
  </svg>
)

// ─── Per-step validation ──────────────────────────────────────────────────────

interface StepErrors { [field: string]: string }

function validateStep(step: number, answers: WizardAnswers): StepErrors {
  const errors: StepErrors = {}
  switch (step) {
    case 1:
      if (!answers.arrival)         errors.arrival         = 'Please select your planned arrival window.'
      if (!answers.departureRegion) errors.departureRegion = 'Please select where your household is travelling from.'
      if (!answers.countryOfOrigin) errors.countryOfOrigin = 'Please select your country of origin.'
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
      if (answers.pathway === 'study_permit') {
        if (answers.jobStatus !== 'student') {
          errors.jobStatus = 'Study permit applicants are automatically set to student for this step.'
        }
      } else if (!answers.jobStatus) {
        errors.jobStatus = 'Please select your job situation.'
      }
      break
    case 5:
      if (!answers.savings?.trim()) errors.savings = 'Please enter your available savings.'
      break
    case 6: {
      if (!answers.housing) errors.housing = 'Please select a housing type.'
      // Furnishing not required for furnished/family housing types
      const noFurnishing = answers.housing === 'on-campus'
        || answers.housing === 'homestay'
        || answers.housing === 'staying-family'
      if (!noFurnishing && !answers.furnishing) errors.furnishing = 'Please select a furnishing level.'
      break
    }
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
  scrollTargetId?: string
  frameTargetId?: string
  publicResultsHref?: string
}

export function WizardShell({ consultant, onComplete, scrollTargetId, frameTargetId, publicResultsHref }: Props) {
  const { session, consultant: sessionConsultant, updateAnswers, setStep, clearSession, stalePathwayToast, clearStalePathwayToast, persistNow } = useSettlementSession()
  const { currentStep, answers } = session
  const mode = usePlannerMode()
  const isPublicMode = mode === 'public'
  const router = useRouter()

  const [isMobile,    setIsMobile]    = useState(false)
  const [completed,   setCompleted]   = useState<Set<number>>(new Set())
  const [errors,      setErrors]      = useState<StepErrors>({})
  const [showClear,   setShowClear]   = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [hasTrackedStart, setHasTrackedStart] = useState(false)
  const [footerFrame, setFooterFrame] = useState<{left: number; right: number} | null>(null)
  const viewedStepsRef = useRef<Set<number>>(new Set())
  const previousPathwayRef = useRef<string | undefined>(answers.pathway)

  // ── Responsive breakpoint ─────────────────────────────────────────────────
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    if (!frameTargetId) {
      setFooterFrame(null)
      return
    }

    const syncFrame = () => {
      const target = document.getElementById(frameTargetId)
      if (!target) {
        setFooterFrame(null)
        return
      }

      const rect = target.getBoundingClientRect()
      const left = Math.max(0, rect.left)
      const right = Math.max(0, window.innerWidth - rect.right)
      setFooterFrame({ left, right })
    }

    syncFrame()
    window.addEventListener('resize', syncFrame)
    window.addEventListener('scroll', syncFrame, { passive: true })

    return () => {
      window.removeEventListener('resize', syncFrame)
      window.removeEventListener('scroll', syncFrame)
    }
  }, [frameTargetId])

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

  useEffect(() => {
    const previousPathway = previousPathwayRef.current
    previousPathwayRef.current = answers.pathway

    if (previousPathway === undefined || previousPathway === answers.pathway) return

    setCompleted(prev => {
      const next = new Set(prev)
      next.delete(4)
      next.delete(5)
      next.delete(6)
      return next
    })
  }, [answers.pathway])

  useEffect(() => {
    if (showResults || hasTrackedStart) return
    trackPlannerStart({ mode })
    setHasTrackedStart(true)
  }, [hasTrackedStart, mode, showResults])

  useEffect(() => {
    if (showResults || viewedStepsRef.current.has(currentStep)) return
    viewedStepsRef.current.add(currentStep)
    trackPlannerStepView({
      mode,
      step: currentStep,
      step_name: WIZARD_STEPS[currentStep - 1]?.key ?? 'step',
      completed_steps: completed.size,
    })
  }, [completed.size, currentStep, mode, showResults])

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

  const scrollToPlannerTop = useCallback(() => {
    if (scrollTargetId) {
      const target = document.getElementById(scrollTargetId)
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' })
        return
      }
    }

    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [scrollTargetId])

  const goNext = useCallback(() => {
    const stepKey = WIZARD_STEPS[currentStep - 1]?.key ?? 'step'
    if (currentStep >= TOTAL_STEPS) {
      trackPlannerSeePlanClick({
        mode,
        step: currentStep,
        step_name: stepKey,
        destination: answers.city ?? null,
        pathway: answers.pathway ?? null,
      })
    }
    const stepErrors = validateStep(currentStep, answers)
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors)
      return
    }
    setErrors({})
    setCompleted(prev => new Set([...prev, currentStep]))

    if (currentStep >= TOTAL_STEPS) {
      trackPlannerStepComplete({
        mode,
        step: currentStep,
        step_name: stepKey,
      })
      trackPlannerComplete({
        mode,
        destination: answers.city ?? null,
        pathway: answers.pathway ?? null,
      })
      persistNow()
      onComplete?.(answers)
      if (isPublicMode && publicResultsHref) {
        router.push(publicResultsHref)
        return
      }
      setShowResults(true)
      return
    }
    trackPlannerStepComplete({
      mode,
      step: currentStep,
      step_name: stepKey,
    })
    setStep(currentStep + 1)
    scrollToPlannerTop()
  }, [answers, currentStep, isPublicMode, mode, onComplete, persistNow, publicResultsHref, router, scrollToPlannerTop, setStep])

  const goBack = useCallback(() => {
    setErrors({})
    setStep(Math.max(1, currentStep - 1))
    scrollToPlannerTop()
  }, [currentStep, scrollToPlannerTop, setStep])

  const handleClear = useCallback(() => {
    clearSession()
    setCompleted(new Set())
    setErrors({})
    setHasTrackedStart(false)
    viewedStepsRef.current = new Set()
    setShowClear(false)
  }, [clearSession])

  const handleStartOver = useCallback(() => {
    clearSession()
    setCompleted(new Set())
    setErrors({})
    setHasTrackedStart(false)
    viewedStepsRef.current = new Set()
    setShowClear(false)
    setShowResults(false)
    scrollToPlannerTop()
  }, [clearSession, scrollToPlannerTop])

  // ── Step meta ─────────────────────────────────────────────────────────────
  const stepMeta   = WIZARD_STEPS[currentStep - 1]
  const effectiveConsultant = isPublicMode ? null : consultant ?? sessionConsultant
  const accentColor = effectiveConsultant?.theme?.accentColor ?? stepMeta.color

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
  const logoUrl  = effectiveConsultant?.logo?.asset?.url
  const name     = effectiveConsultant?.companyName ?? effectiveConsultant?.displayName ?? 'Maple Insight'
  const abbr     = initials(name)

  if (showResults) {
    return <ResultsDashboard consultant={effectiveConsultant} onStartOver={handleStartOver} />
  }

  return (
    <div style={{ minHeight: '100dvh', background: C.bg, fontFamily: FONT, paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 0px))' }}>

      {/* ── Compact wizard header ──────────────────────────────────────────── */}
      {!isPublicMode && (
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

            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: C.textLight }}>
              <span>Powered by</span>
              <MapleLeaf size={11} />
              <span style={{ fontFamily: SERIF, fontSize: 11, color: C.forest, fontWeight: 700 }}>Maple Insight</span>
            </div>
          </div>
        </nav>
      )}

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
      {/* Step 1 desktop: two-column layout with Live Cost Impact right rail */}
      {currentStep === 1 && !isMobile ? (
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px', display: 'grid', gridTemplateColumns: 'minmax(0, 1.1fr) minmax(0, 1fr)', gap: 32, alignItems: 'start' }}>
          <section aria-label={`Step ${currentStep} of ${TOTAL_STEPS}: ${stepMeta.title}`}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              background: '#E8F5EE', borderRadius: 7, padding: '4px 11px',
              marginBottom: 22, fontSize: 11, color: C.accent, fontWeight: 600,
            }}>
              <Lock size={12} color="#1B7A4A" /> Your data stays in your browser
            </div>
            {renderStep()}
          </section>
          <div style={{ position: 'sticky', top: 24 }}>
            <LiveCostImpactPreview iso={answers.countryOfOrigin ?? ''} />
          </div>
        </div>
      ) : (
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
            <Lock size={12} color="#1B7A4A" /> Your data stays in your browser
          </div>

          {/* Stale pathway toast — shown when a restored session had an unsupported pathway */}
          {stalePathwayToast && currentStep === 2 && (
            <div
              role="status"
              style={{
                display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12,
                background: '#FFF7E6', border: '1px solid #F59E0B',
                borderRadius: 10, padding: '12px 16px', marginBottom: 20,
                fontSize: 13, color: '#92400E', fontFamily: FONT, lineHeight: 1.5,
              }}
            >
              <span>Your previously selected pathway is no longer available. Please select a new pathway.</span>
              <button
                type="button"
                onClick={clearStalePathwayToast}
                aria-label="Dismiss notice"
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: 16, color: '#92400E', flexShrink: 0, lineHeight: 1, padding: 0,
                }}
              >×</button>
            </div>
          )}

          {renderStep()}
        </section>
      )}

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
            <div style={{ width: 52, height: 52, borderRadius: 14, background: '#FDF6E3', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}><Delete size={24} color={C.red} /></div>
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
                Yes, start over
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Fixed navigation footer ────────────────────────────────────────── */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: C.white, borderTop: `1px solid ${C.border}`,
        paddingTop:    isMobile ? '10px' : '14px',
        paddingLeft:   isMobile ? '16px' : '24px',
        paddingRight:  isMobile ? '16px' : '24px',
        paddingBottom: isMobile ? 'calc(10px + env(safe-area-inset-bottom, 0px))' : '14px',
        zIndex: 50,
        ...(footerFrame && !isMobile ? { left: footerFrame.left, right: footerFrame.right } : {}),
      }}>
        <div style={{
          maxWidth: frameTargetId && !isMobile ? 'none' : 580,
          margin: '0 auto',
          display: isMobile ? 'flex' : 'grid',
          gridTemplateColumns: isMobile ? undefined : '1fr auto 1fr',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: isMobile ? 12 : 16,
        }}>

          {/* Left: Back + Start over */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
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
                <ArrowBack size={16} color="#374151" /> Back
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowClear(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '9px 16px', borderRadius: 9,
                border: `1px solid ${C.border}`, background: C.white,
                color: C.text, fontWeight: 600, fontSize: 13,
                cursor: 'pointer', fontFamily: FONT,
              }}
            >
              <RestartAlt size={16} color="#374151" /> Start over
            </button>
          </div>

          {!isMobile && (
            <div style={{ justifySelf: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 12, color: C.textLight, fontFamily: FONT, whiteSpace: 'nowrap' }}>
                Step {currentStep} of {TOTAL_STEPS}
              </span>
              <VersionStamp />
            </div>
          )}

          {/* Right: Step text + Next button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'flex-end', justifySelf: isMobile ? undefined : 'end' }}>
            {/* "Step X of 6" — AC-1 */}
            {!isMobile && (
              <span style={{ display: 'none', fontSize: 12, color: C.textLight, fontFamily: FONT }}>
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
              {currentStep === TOTAL_STEPS ? 'See My Plan' : 'Next'} <ArrowRightAlt size={16} color="#FFFFFF" />
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
