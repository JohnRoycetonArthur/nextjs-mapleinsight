'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSettlementSession } from '@/components/settlement-planner/SettlementSessionContext'
import {
  Analytics,
  ArrowRightAlt,
  Checklist,
  Delete,
  Gavel,
  Payments,
  Schedule,
  ShieldLock,
  TaskAlt,
} from '@material-symbols-svg/react'

const C = {
  forest: '#1B4F4A',
  accent: '#1B7A4A',
  gold: '#B8860B',
  gray: '#6B7280',
  border: '#E5E7EB',
  white: '#FFFFFF',
  text: '#374151',
  textLight: '#9CA3AF',
  bg: '#FAFBFC',
  danger: '#C41E3A',
}

const MapleLeaf = ({ size = 16, color = '#C41E3A' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden="true">
    <path d="M12 0L13.5 6.5L17 4L15.5 8.5L22 9L17 12L20 16L14 14L12 24L10 14L4 16L7 12L2 9L8.5 8.5L7 4L10.5 6.5Z" />
  </svg>
)

const Spinner = () => (
  <div
    aria-hidden="true"
    style={{
      width: 56,
      height: 56,
      borderRadius: '50%',
      border: `4px solid ${C.accent}22`,
      borderTopColor: C.accent,
      animation: 'settlementPlannerSpin 1s linear infinite',
    }}
  />
)

interface StartFreshDialogProps {
  onConfirm: () => void
  onCancel: () => void
}

function StartFreshDialog({ onConfirm, onCancel }: StartFreshDialogProps) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15,61,58,0.5)',
        backdropFilter: 'blur(4px)',
        zIndex: 1100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel() }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="start-fresh-dialog-title"
        style={{
          background: '#fff',
          borderRadius: 16,
          padding: '32px 28px',
          maxWidth: 420,
          width: '100%',
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
        }}
      >
        <div
          aria-hidden="true"
          style={{
            width: 52,
            height: 52,
            borderRadius: 14,
            background: '#FEF2F2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 24,
            margin: '0 auto 16px',
          }}
        >
          <Delete size={26} color={C.danger} />
        </div>

        <h3
          id="start-fresh-dialog-title"
          style={{
            fontFamily: "var(--font-dm-serif, 'DM Serif Display', serif)",
            fontSize: 20,
            fontWeight: 700,
            color: C.forest,
            margin: '0 0 8px',
            textAlign: 'center',
          }}
        >
          Start a new plan?
        </h3>
        <p
          style={{
            fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)",
            fontSize: 14,
            color: C.gray,
            lineHeight: 1.6,
            margin: '0 0 24px',
            textAlign: 'center',
          }}
        >
          Starting a new plan will clear your existing plan information from this device. Your data was never sent to any server.
        </p>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              flex: 1,
              padding: '11px 16px',
              borderRadius: 10,
              border: '1px solid #E5E7EB',
              background: '#fff',
              fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)",
              fontSize: 14,
              fontWeight: 600,
              color: C.text,
              cursor: 'pointer',
            }}
          >
            Keep existing plan
          </button>
          <button
            type="button"
            onClick={onConfirm}
            style={{
              flex: 1,
              padding: '11px 16px',
              borderRadius: 10,
              border: 'none',
              background: C.danger,
              fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)",
              fontSize: 14,
              fontWeight: 700,
              color: '#fff',
              cursor: 'pointer',
            }}
          >
            Start new plan
          </button>
        </div>
      </div>
    </div>
  )
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      style={{
        background: C.white,
        borderRadius: 14,
        border: `1px solid ${C.border}`,
        padding: '22px 20px',
        flex: '1 1 200px',
        boxShadow: hovered ? '0 4px 16px rgba(27,79,74,0.08)' : '0 1px 3px rgba(0,0,0,0.03)',
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
        transition: 'box-shadow 0.2s, transform 0.2s',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{
        width: 40, height: 40, borderRadius: 10, background: '#E8F5EE',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: C.accent, marginBottom: 14,
      }}>
        {icon}
      </div>
      <h3 style={{
        fontFamily: "var(--font-dm-serif, 'DM Serif Display', Georgia, serif)",
        fontSize: 16, color: C.forest, margin: '0 0 6px', fontWeight: 700, lineHeight: 1.3,
      }}>
        {title}
      </h3>
      <p style={{
        fontFamily: "var(--font-dm-sans, 'DM Sans', Helvetica, sans-serif)",
        fontSize: 13, color: C.gray, margin: 0, lineHeight: 1.6,
      }}>
        {desc}
      </p>
    </div>
  )
}

function CtaButton({ href }: { href: string }) {
  const router = useRouter()
  const { session, isRestored, clearSession } = useSettlementSession()
  const [hovered, setHovered] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showStartFreshDialog, setShowStartFreshDialog] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const hasExistingPlan = isRestored && (session.currentStep > 1 || Object.keys(session.answers).length > 0)

  useEffect(() => {
    router.prefetch(href)

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [href, router])

  const beginTransition = () => {
    setIsLoading(true)
    timeoutRef.current = setTimeout(() => {
      router.push(href)
    }, 3400)
  }

  const handleStart = () => {
    if (isLoading || !isRestored) return
    if (hasExistingPlan) {
      setShowStartFreshDialog(true)
      return
    }
    beginTransition()
  }

  const handleConfirmStartFresh = () => {
    clearSession()
    setShowStartFreshDialog(false)
    beginTransition()
  }

  return (
    <>
      <button
        type="button"
        style={{
          background: C.accent,
          color: '#fff',
          fontWeight: 700,
          fontSize: 17,
          padding: '16px 48px',
          borderRadius: 12,
          border: 'none',
          cursor: isLoading || !isRestored ? 'wait' : 'pointer',
          fontFamily: "var(--font-dm-sans, 'DM Sans', Helvetica, sans-serif)",
          display: 'inline-flex',
          alignItems: 'center',
          textDecoration: 'none',
          transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
          boxShadow: hovered ? `0 6px 20px ${C.accent}55` : `0 4px 14px ${C.accent}44`,
          transition: 'transform 0.15s, box-shadow 0.2s',
          opacity: isLoading || !isRestored ? 0.9 : 1,
        }}
        onClick={handleStart}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        disabled={isLoading || !isRestored}
        aria-busy={isLoading}
      >
        Start Planning
        <ArrowRightAlt size={16} color="#FFFFFF" style={{ marginLeft: 6 }} />
      </button>

      {showStartFreshDialog && (
        <StartFreshDialog
          onConfirm={handleConfirmStartFresh}
          onCancel={() => setShowStartFreshDialog(false)}
        />
      )}

      {isLoading && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            background: 'linear-gradient(180deg, rgba(250,251,252,0.98) 0%, rgba(232,245,238,0.98) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}
        >
          <style>{`
            @keyframes settlementPlannerSpin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}</style>
          <div style={{ maxWidth: 520, textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 22 }}>
              <Spinner />
            </div>
            <div style={{
              fontFamily: "var(--font-dm-serif, 'DM Serif Display', Georgia, serif)",
              fontSize: 30,
              lineHeight: 1.15,
              color: C.forest,
              marginBottom: 12,
            }}>
              Building your settlement planning workspace
            </div>
            <p style={{
              margin: '0 0 10px',
              fontSize: 16,
              lineHeight: 1.7,
              color: C.text,
            }}>
              We&apos;re preparing your personalized cost estimator, savings gap analysis, and first-steps checklist.
            </p>
            <p style={{
              margin: 0,
              fontSize: 14,
              lineHeight: 1.6,
              color: C.gray,
            }}>
              This should only take a moment.
            </p>
          </div>
        </div>
      )}
    </>
  )
}

export function PublicLandingClient() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  return (
    <div style={{ minHeight: '60vh', background: C.bg, fontFamily: "var(--font-dm-sans, 'DM Sans', Helvetica, sans-serif)" }}>
      <main style={{
        maxWidth: 720, margin: '0 auto',
        padding: isMobile ? '28px 16px' : '48px 24px',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{
            fontFamily: "var(--font-dm-serif, 'DM Serif Display', Georgia, serif)",
            fontSize: isMobile ? 28 : 36,
            fontWeight: 700,
            color: C.forest,
            margin: '0 0 12px',
            lineHeight: 1.15,
            letterSpacing: -0.5,
          }}>
            Your Personalized{' '}
            <span style={{ color: C.accent }}>Canada Settlement Plan</span>
          </h1>
          <p style={{
            fontSize: isMobile ? 15 : 16,
            lineHeight: 1.7,
            color: C.gray,
            margin: '0 auto',
            maxWidth: 520,
            fontFamily: "var(--font-dm-sans, 'DM Sans', Helvetica, sans-serif)",
          }}>
            Get a detailed cost estimate, savings gap analysis, and actionable checklist for your move to Canada. Takes about 8 minutes.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 28 }}>
          <FeatureCard
            icon={<Payments size={20} color={C.accent} />}
            title="Cost Estimates"
            desc="Upfront move costs and monthly survival estimates using official CMHC rent data and transit prices for your city."
          />
          <FeatureCard
            icon={<Analytics size={20} color={C.accent} />}
            title="Savings Gap Analysis"
            desc="See exactly how much more you need to save, with a recommended safe target and a timeline to close the gap."
          />
          <FeatureCard
            icon={<Checklist size={20} color={C.accent} />}
            title="Action Checklist"
            desc="A personalized pre-arrival and first-90-days checklist based on your destination and immigration pathway."
          />
        </div>

        <div style={{
          background: C.white,
          borderRadius: 14,
          border: `1px solid ${C.border}`,
          padding: isMobile ? '22px 18px' : '28px 28px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          marginBottom: 28,
        }}>
          <h2 style={{
            fontFamily: "var(--font-dm-serif, 'DM Serif Display', Georgia, serif)",
            fontSize: 20, color: C.forest, margin: '0 0 20px', fontWeight: 700,
          }}>
            How It Works
          </h2>

          {[
            { n: '1', t: 'Answer 6 quick sections', d: 'Household, immigration plan, destination, income, savings, and lifestyle preferences.' },
            { n: '2', t: 'Get your personalized plan', d: 'Cost estimates, risks, and a tailored action checklist calculated instantly in your browser.' },
            { n: '3', t: 'Download or share', d: 'Save as PDF, export as a portable file, or send directly to your consultant.' },
          ].map((step, i) => (
            <div key={step.n} style={{
              display: 'flex', gap: 14, alignItems: 'flex-start',
              marginBottom: i < 2 ? 16 : 0,
            }}>
              <div style={{
                width: 34, height: 34, borderRadius: '50%',
                background: C.accent, color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 800, fontSize: 14, flexShrink: 0,
                fontFamily: "var(--font-dm-serif, 'DM Serif Display', Georgia, serif)",
              }}>
                {step.n}
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: C.forest, marginBottom: 2 }}>{step.t}</div>
                <div style={{ fontSize: 13, color: C.gray, lineHeight: 1.55 }}>{step.d}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{
          display: 'flex',
          gap: 12,
          flexDirection: isMobile ? 'column' : 'row',
          marginBottom: 32,
        }}>
          <div style={{
            flex: 1, background: '#E8F5EE', borderRadius: 12,
            border: `1px solid ${C.accent}20`, padding: '18px 18px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
              <span style={{ color: C.accent }}><ShieldLock size={14} color={C.accent} /></span>
              <span style={{
                fontSize: 14, fontWeight: 700, color: C.forest,
                fontFamily: "var(--font-dm-serif, 'DM Serif Display', Georgia, serif)",
              }}>
                Your Privacy, Protected
              </span>
            </div>
            <p style={{ fontSize: 13, color: C.text, margin: 0, lineHeight: 1.6 }}>
              Your answers stay in your browser. Nothing is saved on our servers unless you choose to send your report to your email.
            </p>
          </div>

          <div style={{
            flex: 1, background: '#FDF6E3', borderRadius: 12,
            border: `1px solid ${C.gold}20`, padding: '18px 18px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
              <Gavel size={15} color={C.gold} />
              <span style={{
                fontSize: 14, fontWeight: 700, color: C.gold,
                fontFamily: "var(--font-dm-serif, 'DM Serif Display', Georgia, serif)",
              }}>
                Important Disclaimer
              </span>
            </div>
            <p style={{ fontSize: 13, color: C.text, margin: 0, lineHeight: 1.6 }}>
              This is a financial planning tool, not immigration advice. For program eligibility, consult your immigration representative and official IRCC resources.
            </p>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 6, marginBottom: 16, color: C.textLight, fontSize: 13,
          }}>
            <Schedule size={15} color={C.textLight} />
            <span>Takes about 8-12 minutes</span>
          </div>

          <CtaButton href="/settlement-planner/plan/wizard" />

          <div style={{
            display: 'flex', justifyContent: 'center', gap: 20, marginTop: 18, flexWrap: 'wrap',
          }}>
            {['No account needed', '100% free', 'Data stays local'].map((label) => (
              <div key={label} style={{
                display: 'flex', alignItems: 'center', gap: 5,
                fontSize: 12, color: C.gray, fontWeight: 500,
              }}>
                <TaskAlt size={15} color={C.accent} /> {label}
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer style={{
        borderTop: `1px solid ${C.border}`, background: C.white,
        padding: isMobile ? '24px 16px' : '32px 24px',
      }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: isMobile ? 'flex-start' : 'center',
            flexDirection: isMobile ? 'column' : 'row',
            gap: 10,
            fontSize: 11,
            color: C.textLight,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <MapleLeaf size={12} />
              <span style={{
                fontFamily: "var(--font-dm-serif, 'DM Serif Display', Georgia, serif)",
                fontSize: 13, color: C.gray,
              }}>
                Maple Insight
              </span>
            </div>
            <div>© 2026 · Educational content only · Not financial or immigration advice</div>
          </div>
        </div>
      </footer>
    </div>
  )
}
