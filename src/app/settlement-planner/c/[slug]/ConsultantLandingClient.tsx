'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  WalletContent,
  SquareChartLine,
  Roadmap,
  Lock,
  Gauge,
  ClipboardCheck,
  CircleArrowRight,
} from 'nucleo-glass-icons/react'

// ─── Design tokens ────────────────────────────────────────────────────────────

const C = {
  forest:    '#1B4F4A',
  accent:    '#1B7A4A',
  gold:      '#B8860B',
  red:       '#C41E3A',
  gray:      '#6B7280',
  lightGray: '#F3F4F6',
  border:    '#E5E7EB',
  white:     '#FFFFFF',
  text:      '#374151',
  textLight: '#9CA3AF',
  bg:        '#FAFBFC',
}

// ─── Brand icon ──────────────────────────────────────────────────────────────

const MapleLeaf = ({ size = 16, color = C.red }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden="true">
    <path d="M12 0L13.5 6.5L17 4L15.5 8.5L22 9L17 12L20 16L14 14L12 24L10 14L4 16L7 12L2 9L8.5 8.5L7 4L10.5 6.5Z" />
  </svg>
)

// ─── Feature card ─────────────────────────────────────────────────────────────

interface FeatureCardProps {
  icon:  React.ReactNode
  title: string
  desc:  string
}

function FeatureCard({ icon, title, desc }: FeatureCardProps) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      style={{
        background:    C.white,
        borderRadius:  14,
        border:        `1px solid ${C.border}`,
        padding:       '22px 20px',
        flex:          '1 1 200px',
        boxShadow:     hovered ? '0 4px 16px rgba(27,79,74,0.08)' : '0 1px 3px rgba(0,0,0,0.03)',
        transform:     hovered ? 'translateY(-2px)' : 'translateY(0)',
        transition:    'box-shadow 0.2s, transform 0.2s',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{
        width: 40, height: 40, borderRadius: 10, background: '#E8F5EE',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 14,
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

// ─── Consultant type ──────────────────────────────────────────────────────────

export interface PublicConsultant {
  slug:         string
  displayName:  string
  companyName:  string | null
  status:       string
  logo:         { asset: { url: string } } | null
  theme:        { accentColor: string | null; footerText: string | null } | null
}

interface Props {
  consultant: PublicConsultant
}

// ─── Initials helper ──────────────────────────────────────────────────────────

function initials(name: string | null): string {
  if (!name) return 'CI'
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join('')
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ConsultantLandingClient({ consultant }: Props) {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const c   = consultant
  const cta = c.theme?.accentColor || C.accent
  const ini = initials(c.companyName ?? c.displayName)

  const planUrl = `/settlement-planner/c/${c.slug}/wizard`

  return (
    <div style={{ minHeight: '60vh', background: C.bg, fontFamily: "var(--font-dm-sans, 'DM Sans', Helvetica, sans-serif)" }}>

      {/* ══════ MINIMALISTIC HEADER ══════ */}
      <header style={{
        background:   C.white,
        borderBottom: `1px solid ${C.border}`,
        padding:      isMobile ? '14px 16px' : '16px 32px',
      }}>
        <div style={{
          maxWidth: 800, margin: '0 auto',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          {/* Left: Consultant logo + company name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {c.logo ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={c.logo.asset.url}
                alt={`${c.companyName ?? c.displayName} logo`}
                style={{ width: 40, height: 40, borderRadius: 10, objectFit: 'contain' }}
              />
            ) : (
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: `linear-gradient(135deg, ${C.forest}, ${C.accent})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontWeight: 800, fontSize: 15,
                fontFamily: "var(--font-dm-serif, 'DM Serif Display', Georgia, serif)",
                flexShrink: 0,
              }}>
                {ini}
              </div>
            )}
            <div>
              <div style={{
                fontSize: 15, fontWeight: 700, color: C.forest, lineHeight: 1.2,
                fontFamily: "var(--font-dm-serif, 'DM Serif Display', Georgia, serif)",
              }}>
                {c.companyName ?? c.displayName}
              </div>
              {!isMobile && (
                <div style={{ fontSize: 11, color: C.textLight, marginTop: 1 }}>
                  Settlement Planner
                </div>
              )}
            </div>
          </div>

          {/* Right: Powered by Maple Insight */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            fontSize: 11, color: C.textLight, fontWeight: 500,
          }}>
            <span style={{ opacity: 0.6 }}>Powered by</span>
            <MapleLeaf size={14} />
            <span style={{
              fontFamily: "var(--font-dm-serif, 'DM Serif Display', Georgia, serif)",
              fontSize: 13, color: C.forest, fontWeight: 700,
            }}>
              Maple Insight
            </span>
          </div>
        </div>
      </header>

      {/* ══════ MAIN CONTENT ══════ */}
      <main style={{
        maxWidth: 720, margin: '0 auto',
        padding:  isMobile ? '28px 16px' : '48px 24px',
      }}>

        {/* ── Prepared for you by card ── */}
        <div style={{
          background:    C.white,
          borderRadius:  16,
          border:        `1px solid ${C.border}`,
          padding:       isMobile ? '24px 20px' : '28px 32px',
          marginBottom:  28,
          boxShadow:     '0 1px 4px rgba(0,0,0,0.03)',
          display:       'flex',
          alignItems:    isMobile ? 'flex-start' : 'center',
          gap:           isMobile ? 16 : 20,
          flexDirection: isMobile ? 'column' : 'row',
        }}>
          {c.logo ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={c.logo.asset.url}
              alt=""
              style={{ width: 56, height: 56, borderRadius: 14, objectFit: 'contain', flexShrink: 0 }}
            />
          ) : (
            <div style={{
              width: 56, height: 56, borderRadius: 14,
              background: `linear-gradient(135deg, ${C.forest}, ${C.accent})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: 800, fontSize: 20,
              fontFamily: "var(--font-dm-serif, 'DM Serif Display', Georgia, serif)",
              flexShrink: 0,
            }}>
              {ini}
            </div>
          )}
          <div>
            <div style={{ fontSize: 13, color: C.textLight, fontWeight: 500, marginBottom: 2 }}>
              Prepared for you by
            </div>
            <div style={{
              fontFamily: "var(--font-dm-serif, 'DM Serif Display', Georgia, serif)",
              fontSize: 20, color: C.forest, fontWeight: 700, lineHeight: 1.2,
            }}>
              {c.displayName}
            </div>
            {c.companyName && (
              <div style={{ fontSize: 13, color: C.gray, marginTop: 2 }}>
                {c.companyName}
              </div>
            )}
          </div>
        </div>

        {/* ── Hero text ── */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{
            fontFamily:    "var(--font-dm-serif, 'DM Serif Display', Georgia, serif)",
            fontSize:      isMobile ? 28 : 36,
            fontWeight:    700,
            color:         C.forest,
            margin:        '0 0 12px',
            lineHeight:    1.15,
            letterSpacing: -0.5,
          }}>
            Your Personalized{' '}
            <span style={{ color: C.accent }}>Canada Settlement Plan</span>
          </h1>
          <p style={{
            fontSize: isMobile ? 15 : 16, lineHeight: 1.7,
            color: C.gray, margin: '0 auto', maxWidth: 520,
            fontFamily: "var(--font-dm-sans, 'DM Sans', Helvetica, sans-serif)",
          }}>
            Get a detailed cost estimate, savings gap analysis, and actionable checklist for your move to Canada. Takes about 8 minutes.
          </p>
        </div>

        {/* ── Feature cards ── */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 28 }}>
          <FeatureCard
            icon={<WalletContent size={24} stopColor1="#1B7A4A" stopColor2="#1B4F4A" />}
            title="Cost Estimates"
            desc="Upfront move costs and monthly survival estimates using official CMHC rent data and transit prices for your city."
          />
          <FeatureCard
            icon={<SquareChartLine size={24} stopColor1="#2563EB" stopColor2="#0F766E" />}
            title="Savings Gap Analysis"
            desc="See exactly how much more you need to save, with a recommended safe target and a timeline to close the gap."
          />
          <FeatureCard
            icon={<Roadmap size={24} stopColor1="#C41E3A" stopColor2="#B8860B" />}
            title="Action Checklist"
            desc="A personalized pre-arrival and first-90-days checklist based on your destination and immigration pathway."
          />
        </div>

        {/* ── How it works ── */}
        <div style={{
          background:    C.white,
          borderRadius:  14,
          border:        `1px solid ${C.border}`,
          padding:       isMobile ? '22px 18px' : '28px 28px',
          boxShadow:     '0 1px 3px rgba(0,0,0,0.03)',
          marginBottom:  28,
        }}>
          <h2 style={{
            fontFamily: "var(--font-dm-serif, 'DM Serif Display', Georgia, serif)",
            fontSize: 20, color: C.forest, margin: '0 0 20px', fontWeight: 700,
          }}>
            How It Works
          </h2>

          {[
            { n: '1', t: 'Answer 6 quick sections',     d: 'Household, immigration plan, destination, income, savings, and lifestyle preferences.' },
            { n: '2', t: 'Get your personalized plan',  d: 'Cost estimates, risks, and a tailored action checklist — calculated instantly in your browser.' },
            { n: '3', t: 'Download or share',           d: 'Save as PDF, export as a portable file, or send directly to your consultant.' },
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

        {/* ── Privacy + Disclaimer side by side ── */}
        <div style={{
          display:       'flex',
          gap:           12,
          flexDirection: isMobile ? 'column' : 'row',
          marginBottom:  32,
        }}>
          {/* Privacy */}
          <div style={{
            flex: 1, background: '#E8F5EE', borderRadius: 12,
            border: `1px solid ${C.accent}20`, padding: '18px 18px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
              <Lock size={16} stopColor1="#1B7A4A" stopColor2="#1B4F4A" />
              <span style={{
                fontSize: 14, fontWeight: 700, color: C.forest,
                fontFamily: "var(--font-dm-serif, 'DM Serif Display', Georgia, serif)",
              }}>
                Your Privacy, Protected
              </span>
            </div>
            <p style={{ fontSize: 13, color: C.text, margin: 0, lineHeight: 1.6 }}>
              Your answers stay in your browser. Nothing is saved on our servers unless you choose to send your report to your consultant.
            </p>
          </div>

          {/* Disclaimer */}
          <div style={{
            flex: 1, background: '#FDF6E3', borderRadius: 12,
            border: `1px solid ${C.gold}20`, padding: '18px 18px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
              <Gauge size={16} stopColor1="#B8860B" stopColor2="#92720A" />
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

        {/* ── CTA Section ── */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 6, marginBottom: 16, color: C.textLight, fontSize: 13,
          }}>
            <Gauge size={15} stopColor1="#9CA3AF" stopColor2="#6B7280" />
            <span>Takes about 8–12 minutes</span>
          </div>

          <CtaButton href={planUrl} color={cta} />

          <div style={{
            display: 'flex', justifyContent: 'center', gap: 20, marginTop: 18, flexWrap: 'wrap',
          }}>
            {['No account needed', '100% free', 'Data stays local'].map((label) => (
              <div key={label} style={{
                display: 'flex', alignItems: 'center', gap: 5,
                fontSize: 12, color: C.gray, fontWeight: 500,
              }}>
                <ClipboardCheck size={15} stopColor1="#1B7A4A" stopColor2="#1B4F4A" /> {label}
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* ══════ FOOTER ══════ */}
      <footer style={{
        borderTop: `1px solid ${C.border}`, background: C.white,
        padding:   isMobile ? '24px 16px' : '32px 24px',
      }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          {c.theme?.footerText && (
            <p style={{
              fontSize: 11, color: C.textLight, lineHeight: 1.6,
              marginBottom: 16, padding: '12px 16px',
              background: C.lightGray, borderRadius: 8,
            }}>
              {c.theme.footerText}
            </p>
          )}
          <div style={{
            display:        'flex',
            justifyContent: 'space-between',
            alignItems:     isMobile ? 'flex-start' : 'center',
            flexDirection:  isMobile ? 'column' : 'row',
            gap:            10,
            fontSize:       11,
            color:          C.textLight,
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

// ─── CTA button (separate for hover state) ───────────────────────────────────

function CtaButton({ href, color }: { href: string; color: string }) {
  const [hovered, setHovered] = useState(false)
  return (
    <Link
      href={href}
      style={{
        background:    color,
        color:         '#fff',
        fontWeight:    700,
        fontSize:      17,
        padding:       '16px 48px',
        borderRadius:  12,
        border:        'none',
        cursor:        'pointer',
        fontFamily:    "var(--font-dm-sans, 'DM Sans', Helvetica, sans-serif)",
        display:       'inline-flex',
        alignItems:    'center',
        textDecoration: 'none',
        transform:     hovered ? 'translateY(-2px)' : 'translateY(0)',
        boxShadow:     hovered ? `0 6px 20px ${color}55` : `0 4px 14px ${color}44`,
        transition:    'background 0.2s, transform 0.15s, box-shadow 0.2s',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      Start Planning
      <CircleArrowRight size={16} stopColor1="#FFFFFF" stopColor2="#FFFFFF" />
    </Link>
  )
}
