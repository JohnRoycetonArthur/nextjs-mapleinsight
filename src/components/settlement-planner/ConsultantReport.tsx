'use client'

/**
 * Settlement Planner — Consultant Intelligence Report (US-13.4)
 *
 * Rendered when a consultant views the client's session results.
 * Generates all advisory content deterministically via consultant-advisory.ts.
 * NOT for client distribution.
 */

import { useState, useEffect, useMemo } from 'react'
import { generateConsultantAdvisory } from '@/lib/settlement-engine/consultant-advisory'
import type { EngineInput, EngineOutput, DataSource } from '@/lib/settlement-engine/types'
import type { Risk } from '@/lib/settlement-engine/risks'
import type { IRCCComplianceResult } from '@/lib/settlement-engine/study-permit'
import type { ConsultantBranding } from './wizard/WizardShell'
import type { WizardAnswers } from './SettlementSessionContext'
import { DataFreshnessBar } from './DataFreshnessBar'
import { fetchDataSources } from '@/lib/settlement-engine/sources'

// ─── Design tokens ────────────────────────────────────────────────────────────

const C = {
  forest:    '#1B4F4A', accent: '#1B7A4A', gold: '#B8860B',
  red:       '#C41E3A', blue:   '#2563EB', purple: '#9333EA',
  gray:      '#6B7280', lightGray: '#F3F4F6', border: '#E5E7EB',
  white:     '#FFFFFF', text: '#374151', textLight: '#9CA3AF', bg: '#FAFBFC',
}
const FONT  = "'DM Sans', Helvetica, sans-serif"
const SERIF = "'DM Serif Display', Georgia, serif"

// ─── Formatter ────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(Math.abs(n))

// ─── Pathway label ────────────────────────────────────────────────────────────

const PATHWAY_LABELS: Record<string, string> = {
  'express-entry-fsw':  'Express Entry (FSW)',
  'express-entry-cec':  'Express Entry (CEC)',
  'express-entry-fstp': 'Express Entry (FSTP)',
  'study-permit':       'Study Permit',
  'work-permit':        'Work Permit',
  'pnp':                'Provincial Nominee',
  'family-sponsorship': 'Family Sponsorship',
  'other':              'Other Pathway',
}

// ─── SVG Icons ────────────────────────────────────────────────────────────────

const MapleLeaf = ({ size = 14, color = C.red }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden="true">
    <path d="M12 0L13.5 6.5L17 4L15.5 8.5L22 9L17 12L20 16L14 14L12 24L10 14L4 16L7 12L2 9L8.5 8.5L7 4L10.5 6.5Z"/>
  </svg>
)

const ArrowUp = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="12" y1="19" x2="12" y2="5"/>
    <polyline points="5 12 12 5 19 12"/>
  </svg>
)

const AlertIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={C.red} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
)

const LinkIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
    <polyline points="15 3 21 3 21 9"/>
    <line x1="10" y1="14" x2="21" y2="3"/>
  </svg>
)

const ChevronLeft = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
)

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionCard({ children, mb = 20 }: { children: React.ReactNode; mb?: number }) {
  return (
    <div style={{
      background: C.white, borderRadius: 14, border: `1px solid ${C.border}`,
      padding: '28px 30px', marginBottom: mb, boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
    }}>
      {children}
    </div>
  )
}

function SectionTitle({ icon, children }: { icon: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
      <span style={{ fontSize: 20 }} aria-hidden="true">{icon}</span>
      <h2 style={{ fontFamily: SERIF, fontSize: 20, color: C.forest, margin: 0, fontWeight: 700 }}>{children}</h2>
    </div>
  )
}

function DifficultyPill({ level }: { level: 'Easy' | 'Moderate' | 'Hard' }) {
  const colors: Record<string, string> = { Easy: C.accent, Moderate: C.gold, Hard: C.red }
  const col = colors[level] ?? C.gray
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: col,
      background: `${col}15`, padding: '2px 8px', borderRadius: 4,
    }}>{level}</span>
  )
}

function StatusBadge({ status }: { status: 'compliant' | 'at-risk' | 'critical' | 'info' }) {
  const map = {
    compliant: { label: '✓ Compliant', bg: '#E8F5EE', color: C.accent },
    'at-risk': { label: '⚠ At Risk',   bg: '#FDF6E3', color: C.gold  },
    critical:  { label: '✗ Critical',  bg: '#FEF2F2', color: C.red   },
    info:      { label: '● Info',       bg: '#EFF6FF', color: C.blue  },
  }
  const { label, bg, color } = map[status]
  return (
    <span style={{ fontSize: 11, fontWeight: 700, color, background: bg, padding: '2px 10px', borderRadius: 20, whiteSpace: 'nowrap' }}>
      {label}
    </span>
  )
}

function ReadinessGauge({ score, tier, color }: { score: number; tier: string; color: string }) {
  const angle = (score / 10) * 180
  const dashArray = `${(angle / 180) * 251.2} 251.2`
  return (
    <div style={{ textAlign: 'center', marginBottom: 18 }}>
      <svg width="180" height="100" viewBox="0 0 180 100" aria-label={`Readiness score: ${score} out of 10`}>
        <path d="M 10 90 A 80 80 0 0 1 170 90" fill="none" stroke="#E5E7EB" strokeWidth="12" strokeLinecap="round"/>
        <path d="M 10 90 A 80 80 0 0 1 170 90" fill="none" stroke={color} strokeWidth="12" strokeLinecap="round"
          strokeDasharray={dashArray}/>
        <text x="90" y="72" textAnchor="middle" style={{ fontFamily: SERIF, fontSize: 36, fontWeight: 700, fill: C.forest }}>{score.toFixed(1)}</text>
        <text x="90" y="90" textAnchor="middle" style={{ fontFamily: FONT, fontSize: 11, fontWeight: 600, fill: color }}>{tier.toUpperCase()}</text>
      </svg>
    </div>
  )
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  engineInput:           EngineInput
  engineOutput:          EngineOutput
  answers:               WizardAnswers
  consultant:            ConsultantBranding
  irccCompliance:        IRCCComplianceResult | null
  complianceRequirement: number | null
  monthlyIncome:         number
  risks:                 Risk[]
  onBack:                () => void
}

// ─── ConsultantReport ─────────────────────────────────────────────────────────

export function ConsultantReport({
  engineInput, engineOutput, answers, consultant,
  irccCompliance, complianceRequirement, monthlyIncome, risks, onBack,
}: Props) {
  const [isMobile,     setIsMobile]     = useState(false)
  const [dataSources,  setDataSources]  = useState<Map<string, DataSource>>(new Map())

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    fetchDataSources().then(setDataSources).catch(() => { /* degrade gracefully */ })
  }, [])

  // Generate all advisory data
  const advisory = useMemo(() => generateConsultantAdvisory(
    engineInput,
    engineOutput,
    monthlyIncome,
    risks,
    complianceRequirement,
    irccCompliance ?? undefined,
  ), [engineInput, engineOutput, monthlyIncome, risks, complianceRequirement, irccCompliance])

  const { readiness, scenarios, strategies, programNotes, studyPermitAdvisory, meetingGuide } = advisory

  // Derived display values
  const city         = (answers.city ?? 'Toronto').charAt(0).toUpperCase() + (answers.city ?? 'toronto').slice(1)
  const province     = answers.province ?? ''
  const pathwayLabel = PATHWAY_LABELS[engineInput.pathway] ?? engineInput.pathway
  const household    = `${engineInput.household.adults} adult${engineInput.household.adults !== 1 ? 's' : ''}${engineInput.household.children > 0 ? ` + ${engineInput.household.children} child${engineInput.household.children !== 1 ? 'ren' : ''}` : ''}`
  const today        = new Date().toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: FONT }}>

      {/* ── Header nav ──────────────────────────────────────────────────── */}
      <nav style={{ background: C.forest, padding: '0 24px' }}>
        <div style={{ maxWidth: 860, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 52 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <MapleLeaf size={18} color="#FF6B6B"/>
            <span style={{ fontFamily: SERIF, fontSize: 16, color: '#fff', fontWeight: 700 }}>Maple Insight</span>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginLeft: 4 }}>Consultant Advisory Report</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>Generated {today}</span>
            <button
              onClick={onBack}
              style={{
                display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px',
                borderRadius: 6, border: '1px solid rgba(255,255,255,0.25)',
                background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)',
                cursor: 'pointer', fontFamily: FONT, fontSize: 12, fontWeight: 600,
              }}
              aria-label="Back to client view"
            >
              <ChevronLeft />
              Client View
            </button>
          </div>
        </div>
      </nav>

      {/* ── Confidentiality banner ──────────────────────────────────────── */}
      <div style={{ background: '#FDF6E3', borderBottom: `1px solid ${C.gold}30`, padding: '10px 24px' }}>
        <div style={{ maxWidth: 860, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: C.gold, fontWeight: 600 }}>
          <span aria-hidden="true">🔒</span>
          <span>
            CONFIDENTIAL — Prepared for{' '}
            <strong>{consultant.displayName}</strong>
            {consultant.companyName ? ` (${consultant.companyName})` : ''}.
            {' '}Not for client distribution.
          </span>
        </div>
      </div>

      <section style={{ maxWidth: 860, margin: '0 auto', padding: isMobile ? '22px 16px' : '36px 24px' }}>

        {/* ── Client summary header ─────────────────────────────────────── */}
        <div style={{
          background: C.white, borderRadius: 14, border: `1px solid ${C.border}`,
          padding: isMobile ? '18px 16px' : '20px 24px', marginBottom: 20,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexWrap: 'wrap', gap: 12,
        }}>
          <div>
            <div style={{ fontSize: 11, color: C.textLight, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
              Client Profile
            </div>
            <div style={{ fontFamily: SERIF, fontSize: 20, color: C.forest }}>
              {city}, {province} · {pathwayLabel} · {household}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            {[
              { l: 'Savings',  v: fmt(engineInput.liquidSavings),          c: undefined },
              { l: 'Target',   v: fmt(engineOutput.safeSavingsTarget),      c: undefined },
              { l: 'Gap',      v: engineOutput.savingsGap > 0 ? fmt(engineOutput.savingsGap) : 'None ✓',
                c: engineOutput.savingsGap > 0 ? C.red : C.accent },
            ].map(m => (
              <div key={m.l} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: C.textLight, fontWeight: 600, textTransform: 'uppercase' }}>{m.l}</div>
                <div style={{ fontFamily: SERIF, fontSize: 18, fontWeight: 700, color: m.c ?? C.forest }}>{m.v}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ══ SECTION 1: Financial Readiness Assessment ════════════════════ */}
        <SectionCard>
          <SectionTitle icon="📊">Financial Readiness Assessment</SectionTitle>
          {(() => {
            const allKeys = [
              ...engineOutput.upfrontBreakdown,
              ...engineOutput.monthlyBreakdown,
            ].map(it => it.sourceKey).filter((k): k is string => Boolean(k))
            return <DataFreshnessBar sources={dataSources} sourceKeys={allKeys} />
          })()}
          <ReadinessGauge score={readiness.score} tier={readiness.tier} color={readiness.color}/>

          {/* Score components */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 8, marginBottom: 18 }}>
            {readiness.components.map(c => (
              <div key={c.label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: C.lightGray, borderRadius: 8 }}>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{c.label} </span>
                  <span style={{ fontSize: 11, color: C.textLight }}>({c.weight})</span>
                </div>
                <div style={{ width: 60, height: 6, background: '#E5E7EB', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', width: `${(c.score / c.max) * 100}%`,
                    background: c.score >= 7 ? C.accent : c.score >= 4 ? C.gold : C.red,
                    borderRadius: 3,
                  }}/>
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: C.forest, minWidth: 24, textAlign: 'right' }}>
                  {c.score}
                </span>
              </div>
            ))}
          </div>

          {/* Narrative */}
          <div style={{ background: `${C.forest}06`, borderRadius: 10, padding: '16px 18px', borderLeft: `4px solid ${readiness.color}` }}>
            <p style={{ fontSize: 14, color: C.text, margin: 0, lineHeight: 1.7 }}>{readiness.narrative}</p>
          </div>
        </SectionCard>

        {/* ══ SECTION 2: Alternative Scenario Analysis ══════════════════════ */}
        <SectionCard>
          <SectionTitle icon="🔮">Alternative Scenario Analysis</SectionTitle>
          <p style={{ fontSize: 13, color: C.gray, margin: '0 0 18px', lineHeight: 1.6 }}>
            These scenarios show how specific changes to the client&apos;s plan would affect their financial readiness. Use them as discussion starters.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12 }}>
            {scenarios.map(s => (
              <div key={s.id} style={{
                borderRadius: 12, border: `1px solid ${C.border}`, padding: '18px',
                background: C.white, position: 'relative', overflow: 'hidden',
              }}>
                {/* Delta badge */}
                <div style={{ position: 'absolute', top: 0, right: 0, background: '#16a34a12', padding: '4px 12px 4px 14px', borderBottomLeftRadius: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: '#16a34a' }}>
                    <ArrowUp/> {s.deltaLabel}
                  </div>
                </div>
                <div style={{ fontSize: 20, marginBottom: 8 }}>{s.icon}</div>
                <div style={{ fontFamily: SERIF, fontSize: 15, color: C.forest, fontWeight: 700, marginBottom: 4, paddingRight: 90 }}>{s.name}</div>
                <div style={{ fontSize: 12, color: C.gray, lineHeight: 1.6, marginBottom: 12 }}>{s.details}</div>
                <div style={{ display: 'flex', gap: 18 }}>
                  <div>
                    <div style={{ fontSize: 10, color: C.textLight, fontWeight: 600, textTransform: 'uppercase' }}>New Target</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: C.forest, fontFamily: SERIF }}>{fmt(s.newTarget)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: C.textLight, fontWeight: 600, textTransform: 'uppercase' }}>New Gap</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: s.newGap === 0 ? C.accent : C.gold, fontFamily: SERIF }}>
                      {s.newGap === 0 ? 'None ✓' : fmt(s.newGap)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* ══ SECTION 3: Gap Closure Strategies ════════════════════════════ */}
        <SectionCard>
          <SectionTitle icon="🎯">Gap Closure Strategies</SectionTitle>
          <p style={{ fontSize: 13, color: C.gray, margin: '0 0 16px', lineHeight: 1.6 }}>
            Ordered by financial impact. Combine multiple strategies to close or significantly reduce the{' '}
            {engineOutput.savingsGap > 0 ? <strong>{fmt(engineOutput.savingsGap)}</strong> : 'savings'} gap.
          </p>
          {strategies.map((s, i) => (
            <div key={i} style={{
              display: 'flex', gap: 14, padding: '16px 0',
              borderBottom: i < strategies.length - 1 ? `1px solid ${C.lightGray}` : 'none',
              alignItems: 'flex-start',
            }}>
              {/* Rank bubble */}
              <div style={{
                width: 30, height: 30, borderRadius: '50%',
                background: s.impact < 0 ? `${C.accent}15` : C.lightGray,
                color: s.impact < 0 ? C.accent : C.gray,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 800, fontSize: 13, flexShrink: 0, fontFamily: SERIF,
              }}>{i + 1}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: C.forest }}>{s.title}</span>
                  <DifficultyPill level={s.difficulty}/>
                  {s.impact !== 0 && (
                    <span style={{ fontSize: 12, fontWeight: 700, color: s.impact < 0 ? '#16a34a' : C.red }}>
                      {s.impact < 0 ? '↓' : '↑'} {fmt(Math.abs(s.impact))}
                    </span>
                  )}
                </div>
                <p style={{ fontSize: 12, color: C.text, margin: '0 0 4px', lineHeight: 1.6 }}>{s.rationale}</p>
                <span style={{ fontSize: 11, color: C.textLight }}>Timeline: {s.timeline}</span>
              </div>
            </div>
          ))}
        </SectionCard>

        {/* ══ SECTION 4: Program-Specific Notes ════════════════════════════ */}
        <SectionCard>
          <SectionTitle icon="📋">{pathwayLabel} — Program-Specific Notes</SectionTitle>
          {programNotes.map((n, i) => {
            const sevMap: Record<string, { bg: string; border: string }> = {
              warning:  { bg: '#FDF6E3', border: C.gold   },
              info:     { bg: '#EFF6FF', border: C.blue   },
              positive: { bg: '#E8F5EE', border: C.accent },
              negative: { bg: '#FEF2F2', border: C.red    },
            }
            const { bg, border } = sevMap[n.severity] ?? sevMap.info
            return (
              <div key={i} style={{ background: bg, borderLeft: `4px solid ${border}`, borderRadius: 10, padding: '14px 18px', marginBottom: 10 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: n.color, marginBottom: 5 }}>{n.title}</div>
                <p style={{ fontSize: 13, color: C.text, margin: 0, lineHeight: 1.65 }}>{n.content}</p>
                {n.source && (
                  <a href={n.source} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: C.blue, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 3, marginTop: 6 }}>
                    IRCC Source <LinkIcon/>
                  </a>
                )}
              </div>
            )
          })}

          {/* ── Study Permit Advisory Block ─────────────────────────────── */}
          {studyPermitAdvisory && (
            <div style={{ marginTop: 22 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.forest, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>
                Study Permit Advisory Block
              </div>
              {Object.values(studyPermitAdvisory).map((sub, i) => {
                const statusColors: Record<string, { bg: string; border: string }> = {
                  compliant: { bg: '#E8F5EE', border: C.accent },
                  'at-risk': { bg: '#FDF6E3', border: C.gold   },
                  critical:  { bg: '#FEF2F2', border: C.red    },
                  info:      { bg: '#EFF6FF', border: C.blue   },
                }
                const { bg, border } = statusColors[sub.status] ?? statusColors.info
                return (
                  <div key={i} style={{ background: bg, borderLeft: `4px solid ${border}`, borderRadius: 10, padding: '14px 18px', marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: C.forest }}>{sub.title}</span>
                      <StatusBadge status={sub.status}/>
                      {sub.metric && (
                        <span style={{ fontSize: 12, fontWeight: 600, color: C.textLight }}>{sub.metric}</span>
                      )}
                    </div>
                    <p style={{ fontSize: 13, color: C.text, margin: 0, lineHeight: 1.65 }}>{sub.content}</p>
                  </div>
                )
              })}
            </div>
          )}
        </SectionCard>

        {/* ══ SECTION 5: Meeting Preparation Guide ══════════════════════════ */}
        <SectionCard>
          <SectionTitle icon="🤝">Meeting Preparation Guide</SectionTitle>

          {/* Talking Points */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.forest, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>
              Key Talking Points
            </div>
            {meetingGuide.talkingPoints.map((tp, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 10, alignItems: 'flex-start' }}>
                <div style={{
                  width: 24, height: 24, borderRadius: '50%', background: C.accent,
                  color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: 11, flexShrink: 0, fontFamily: SERIF,
                }}>{i + 1}</div>
                <p style={{ fontSize: 13, color: C.text, margin: 0, lineHeight: 1.65 }}>{tp}</p>
              </div>
            ))}
          </div>

          {/* Discovery Questions */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.blue, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>
              Discovery Questions for the Client
            </div>
            {meetingGuide.questions.map((q, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 8, alignItems: 'flex-start' }}>
                <span style={{ color: C.blue, fontSize: 16, flexShrink: 0, lineHeight: 1.4 }}>?</span>
                <p style={{ fontSize: 13, color: C.text, margin: 0, lineHeight: 1.6 }}>{q}</p>
              </div>
            ))}
          </div>

          {/* Red Flags */}
          {meetingGuide.redFlags.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.red, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>
                ⚠ Red Flags
              </div>
              {meetingGuide.redFlags.map((rf, i) => (
                <div key={i} style={{ background: '#FEF2F2', borderRadius: 10, borderLeft: `4px solid ${C.red}`, padding: '12px 16px', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <AlertIcon/>
                    <span style={{ fontSize: 13, fontWeight: 700, color: C.red }}>{rf.flag}</span>
                  </div>
                  <p style={{ fontSize: 12, color: C.text, margin: 0, lineHeight: 1.6 }}>{rf.detail}</p>
                </div>
              ))}
            </div>
          )}

          {/* Cross-Referrals */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.purple, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>
              Maple Insight Tools to Recommend
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {meetingGuide.crossReferrals.map((cr, i) => (
                <a key={i} href={cr.link} style={{
                  flex: '1 1 180px', padding: '12px 16px', borderRadius: 10,
                  border: `1px solid ${C.purple}20`, background: `${C.purple}04`,
                  textDecoration: 'none', display: 'block',
                }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.purple, marginBottom: 2 }}>{cr.tool}</div>
                  <div style={{ fontSize: 11, color: C.gray, lineHeight: 1.4 }}>{cr.reason}</div>
                </a>
              ))}
            </div>
          </div>
        </SectionCard>

        {/* ── Data footer ────────────────────────────────────────────────── */}
        <div style={{ background: C.lightGray, borderRadius: 10, padding: '14px 18px', fontSize: 11, color: C.textLight, lineHeight: 1.7 }}>
          <strong style={{ color: C.gray }}>Report Type:</strong> Consultant Intelligence Report — not for client distribution
          <br/><strong style={{ color: C.gray }}>Engine:</strong> v{engineOutput.engineVersion} · Data: {engineOutput.dataVersion}
          <br/><strong style={{ color: C.gray }}>Advisory Logic:</strong> All analysis is deterministic and rule-based. No AI-generated content. Scenarios use CMHC, IRCC, and provincial data.
        </div>

      </section>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer style={{ background: C.forest, padding: '24px', marginTop: 20 }}>
        <div style={{ maxWidth: 860, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <MapleLeaf size={12} color="#FF6B6B"/>
            <span style={{ fontFamily: SERIF, fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>Maple Insight</span>
          </div>
          <div>© 2026 · Consultant Advisory Report · Confidential</div>
        </div>
      </footer>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Serif+Display&display=swap');
        * { box-sizing: border-box; }
        button:focus-visible, a:focus-visible { outline: 2px solid #2563EB; outline-offset: 2px; border-radius: 4px; }
      `}</style>
    </div>
  )
}
