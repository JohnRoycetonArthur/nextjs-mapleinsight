'use client'

import { useState } from 'react'

const C = {
  accent: '#1B7A4A',
  border: '#E5E7EB',
  forest: '#1B4F4A',
  lightGray: '#F3F4F6',
  text: '#374151',
  white: '#FFFFFF',
}
const FONT = "'DM Sans', Helvetica, sans-serif"
const SERIF = "'DM Serif Display', Georgia, serif"

const TargetIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </svg>
)

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
)

const ChevDown = ({ open }: { open: boolean }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} aria-hidden="true">
    <polyline points="6 9 12 15 18 9" />
  </svg>
)

const NEXT_STEPS = [
  'Compare your current savings against the estimated landing costs above — how far are you from the safe target?',
  'Review the cost breakdown and identify areas where you could reduce expenses (e.g., shared housing, a more affordable city).',
  'If you have questions about immigration pathways or proof-of-funds requirements, consider consulting a Registered Canadian Immigration Consultant (RCIC).',
]

const MapleLeafIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill={C.white} aria-hidden="true">
    <path d="M12 0L13.5 6.5L17 4L15.5 8.5L22 9L17 12L20 16L14 14L12 24L10 14L4 16L7 12L2 9L8.5 8.5L7 4L10.5 6.5Z" />
  </svg>
)

interface Props {
  onOpenSettlementPlan?: () => void
}

export function WhatToDoNext({ onOpenSettlementPlan }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <div style={{
      background: C.white,
      borderRadius: 14,
      borderLeft: `5px solid ${C.accent}`,
      borderTop: `1px solid ${C.accent}20`,
      borderRight: `1px solid ${C.accent}20`,
      borderBottom: `1px solid ${C.accent}20`,
      padding: '26px 28px',
      marginBottom: 14,
      boxShadow: '0 2px 12px rgba(27,122,74,0.08)',
      fontFamily: FONT,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 14 }}>
        <div style={{
          width: 48,
          height: 48,
          borderRadius: 14,
          background: '#E8F5EE',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          <TargetIcon />
        </div>
        <div>
          <h3 style={{ fontFamily: SERIF, fontSize: 18, color: C.forest, margin: '0 0 6px', fontWeight: 700 }}>
            What to Do Next
          </h3>
          <p style={{ fontSize: 14, color: C.text, margin: 0, lineHeight: 1.65 }}>
            Use your results to prepare for your move with more confidence and clarity.
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          borderRadius: 8,
          border: `1px solid ${C.border}`,
          background: C.lightGray,
          cursor: 'pointer',
          fontFamily: FONT,
          color: C.forest,
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 600 }}>Your recommended next steps</span>
        <ChevDown open={open} />
      </button>

      {open && (
        <div style={{ padding: '14px 14px 0', marginTop: 8 }}>
          {NEXT_STEPS.map((tip) => (
            <div key={tip} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'flex-start' }}>
              <CheckIcon />
              <span style={{ fontSize: 13, color: C.text, lineHeight: 1.5 }}>{tip}</span>
            </div>
          ))}
        </div>
      )}

      {onOpenSettlementPlan && (
        <div style={{
          marginTop: 18,
          paddingTop: 18,
          borderTop: `1px solid ${C.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap',
        }}>
          <div>
            <div style={{ fontFamily: SERIF, fontSize: 15, fontWeight: 700, color: C.forest, marginBottom: 3 }}>
              Your personalized action plan is ready
            </div>
            <p style={{ fontFamily: FONT, fontSize: 13, color: C.text, margin: 0, lineHeight: 1.5 }}>
              Step-by-step checklist based on your situation — track your progress as you settle in.
            </p>
          </div>
          <button
            onClick={onOpenSettlementPlan}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '12px 22px', borderRadius: 100, border: 'none',
              background: `linear-gradient(135deg, ${C.forest}, ${C.accent})`,
              color: C.white, fontFamily: FONT, fontSize: 14, fontWeight: 700,
              cursor: 'pointer', boxShadow: '0 4px 16px rgba(27,122,74,0.3)',
              whiteSpace: 'nowrap', flexShrink: 0,
            }}
          >
            <MapleLeafIcon />
            Open My Settlement Plan →
          </button>
        </div>
      )}
    </div>
  )
}
