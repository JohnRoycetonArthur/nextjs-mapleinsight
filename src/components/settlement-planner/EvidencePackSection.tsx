'use client'

/**
 * Settlement Planner — Proof-of-Funds Evidence Pack (US-20.3)
 *
 * Consultant-facing checklist of IRCC bank letter requirements and
 * document naming conventions. Reusable across client files.
 */

import type { EvidencePackData } from '@/lib/settlement-engine/consultant-advisory'

// ─── Design tokens (matches ConsultantReport.tsx) ─────────────────────────────

const C = {
  forest:    '#1B4F4A', accent: '#1B7A4A', blue: '#2563EB',
  gray:      '#6B7280', lightGray: '#F3F4F6', border: '#E5E7EB',
  white:     '#FFFFFF', text: '#374151', textLight: '#9CA3AF',
}
const FONT  = "'DM Sans', Helvetica, sans-serif"
const SERIF = "'DM Serif Display', Georgia, serif"

// ─── Icons ────────────────────────────────────────────────────────────────────

const LinkIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
    <polyline points="15 3 21 3 21 9"/>
    <line x1="10" y1="14" x2="21" y2="3"/>
  </svg>
)

// ─── CheckItem ────────────────────────────────────────────────────────────────

function CheckItem({ text }: { text: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 10,
      padding: '8px 0', borderBottom: `1px solid ${C.border}`,
    }}>
      <div style={{
        width: 20, height: 20, borderRadius: 6,
        border: `2px solid ${C.border}`,
        background: C.white,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, marginTop: 1,
      }} aria-hidden="true"/>
      <span style={{ fontSize: 12, color: C.text, lineHeight: 1.5, fontFamily: FONT }}>{text}</span>
    </div>
  )
}

// ─── EvidencePackSection ──────────────────────────────────────────────────────

interface Props {
  pack: EvidencePackData
  pathway: string
}

export function EvidencePackSection({ pack, pathway }: Props) {
  if (!pack.items) return null

  const isStudyPermit = pathway === 'study-permit'
  const sectionLabel  = isStudyPermit
    ? 'Document Checklist (Study Permit)'
    : 'Bank Letter Requirements (Express Entry)'

  return (
    <div style={{
      background: C.white, borderRadius: 14,
      border: `1px solid ${C.border}`, padding: 24, marginTop: 22,
    }}>
      {/* Section heading */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <span style={{ fontSize: 20 }} aria-hidden="true">📋</span>
        <h3 style={{ fontFamily: SERIF, fontSize: 16, color: C.forest, margin: 0, fontWeight: 700 }}>
          Proof-of-Funds Evidence Pack
        </h3>
      </div>

      <p style={{ fontSize: 12, color: C.gray, marginBottom: 16, lineHeight: 1.5 }}>
        {isStudyPermit
          ? 'IRCC requires the following financial documents for a study permit application. Use this checklist to verify the client\'s documentation is complete before submission.'
          : 'IRCC requires bank letters that include all of the following elements. Use this checklist to verify the client\'s documentation is complete before application submission.'}
      </p>

      {/* Checklist */}
      <div style={{
        fontSize: 11, fontWeight: 700, color: C.textLight,
        textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8,
      }}>
        {sectionLabel}
      </div>
      {pack.items.map(item => (
        <CheckItem key={item.key} text={item.text} />
      ))}

      {/* Document naming convention */}
      {pack.namingConvention && (
        <>
          <div style={{
            fontSize: 11, fontWeight: 700, color: C.textLight,
            textTransform: 'uppercase', letterSpacing: 0.5, margin: '20px 0 8px',
          }}>
            Document Naming Convention
          </div>
          <div style={{
            padding: '12px 16px', background: C.lightGray, borderRadius: 8,
            fontSize: 11, color: C.text, fontFamily: "'Courier New', monospace",
            lineHeight: 1.6,
          }}>
            {pack.namingConvention.map((line, i) => (
              <div key={i}>{line}</div>
            ))}
          </div>
        </>
      )}

      {/* Source citation */}
      {pack.sourceUrl && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 16 }}>
          <LinkIcon />
          <a
            href={pack.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: 11, color: C.blue, textDecoration: 'none', fontFamily: FONT }}
          >
            {pack.sourceLabel}
          </a>
        </div>
      )}
    </div>
  )
}
