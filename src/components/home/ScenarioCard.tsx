'use client';

import { useState } from 'react';
import type { Scenario } from '@/lib/scenarios';

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  forest: '#1B4F4A',
  accent: '#1B7A4A',
  gold: '#B8860B',
  purple: '#9333EA',
  text: '#374151',
  textLight: '#6B7280',
  border: '#E5E7EB',
  white: '#FFFFFF',
};

const font = "var(--font-dm-sans, 'DM Sans', Helvetica, sans-serif)";
const serif = "var(--font-dm-serif, 'DM Serif Display', Georgia, serif)";

// ─── Icons ────────────────────────────────────────────────────────────────────

function ArrowRightIcon() {
  return (
    <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

function ShieldCheckIcon() {
  return (
    <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
}

function LocationIcon() {
  return (
    <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke={C.textLight} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

// ─── ScenarioCard ─────────────────────────────────────────────────────────────

interface ScenarioCardProps {
  scenario: Scenario;
  onClick: (scenario: Scenario) => void;
  index: number;
  isMobile?: boolean;
}

export function ScenarioCard({ scenario, onClick, index, isMobile = false }: ScenarioCardProps) {
  const [hovered, setHovered] = useState(false);

  const padding = isMobile ? '22px 20px' : '26px 24px';
  const costFontSize = isMobile ? 24 : 26;

  const cardStyle: React.CSSProperties = {
    background: C.white,
    borderRadius: 16,
    border: `1px solid ${hovered ? C.accent + '44' : C.border}`,
    padding,
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
    boxShadow: hovered
      ? '0 8px 32px rgba(27,79,74,0.12), 0 2px 8px rgba(27,79,74,0.06)'
      : '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)',
    outline: 'none',
    minWidth: isMobile ? 280 : 'auto',
    maxWidth: isMobile ? 300 : 'none',
    scrollSnapAlign: isMobile ? 'center' : 'none',
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    position: 'relative',
    overflow: 'hidden',
    animationName: 'cardEntrance',
    animationDuration: '0.5s',
    animationTimingFunction: 'ease-out',
    animationDelay: `${index * 0.1}s`,
    animationFillMode: 'both',
  };

  return (
    <div
      role="link"
      tabIndex={0}
      className="scenario-card"
      aria-label={`${scenario.persona} moving to ${scenario.destination} via ${scenario.pathway}. Estimated cost: ${scenario.displayRange}${scenario.costPeriod ?? ''}. Click to see full breakdown.`}
      onClick={() => onClick(scenario)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(scenario);
        }
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={cardStyle}
    >
      {/* Top accent bar */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: `linear-gradient(90deg, ${C.accent}, ${C.gold})`,
          borderRadius: '16px 16px 0 0',
          opacity: hovered ? 1 : 0.6,
          transition: 'opacity 0.3s',
        }}
      />

      {/* Header: Emoji + Persona + Pathway Badge */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <span
            role="img"
            aria-hidden="true"
            style={{
              fontSize: 28,
              lineHeight: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 44,
              height: 44,
              background: `${C.forest}08`,
              borderRadius: 12,
              flexShrink: 0,
            }}
          >
            {scenario.emoji}
          </span>
          <div>
            <div
              style={{
                fontFamily: serif,
                fontSize: 17,
                fontWeight: 700,
                color: C.forest,
                lineHeight: 1.2,
              }}
            >
              {scenario.persona}
            </div>
            <div
              style={{
                marginTop: 3,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 11,
                fontWeight: 600,
                color: C.accent,
                background: `${C.accent}0F`,
                border: `1px solid ${C.accent}22`,
                padding: '2px 10px',
                borderRadius: 20,
                fontFamily: font,
                letterSpacing: 0.2,
              }}
            >
              {scenario.pathway}
            </div>
          </div>
        </div>
      </div>

      {/* Cost Range */}
      <div style={{ marginBottom: scenario.studentNote ? 8 : 14 }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: C.textLight,
            textTransform: 'uppercase',
            letterSpacing: 0.8,
            marginBottom: 4,
            fontFamily: font,
          }}
        >
          Estimated Cost
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
          <span
            style={{
              fontFamily: serif,
              fontSize: costFontSize,
              fontWeight: 700,
              color: C.gold,
              lineHeight: 1.1,
              letterSpacing: -0.5,
            }}
          >
            {scenario.displayRange}
          </span>
          {scenario.costPeriod && (
            <span
              style={{
                fontSize: 13,
                color: C.textLight,
                fontWeight: 500,
                fontFamily: font,
              }}
            >
              {scenario.costPeriod}
            </span>
          )}
        </div>
      </div>

      {/* Student note: GIC / tuition distinction */}
      {scenario.studentNote && (
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 5,
            fontSize: 11,
            color: C.purple,
            fontFamily: font,
            fontWeight: 500,
            background: `${C.purple}08`,
            border: `1px solid ${C.purple}15`,
            borderRadius: 8,
            padding: '6px 10px',
            marginBottom: 14,
            lineHeight: 1.45,
          }}
        >
          <span style={{ flexShrink: 0, marginTop: 1 }}>
            <InfoIcon />
          </span>
          <span>{scenario.studentNote}</span>
        </div>
      )}

      {/* Context line */}
      <div
        style={{
          fontSize: 13,
          color: C.textLight,
          lineHeight: 1.55,
          fontFamily: font,
          marginBottom: 14,
          minHeight: 40,
        }}
      >
        {scenario.contextLine}
      </div>

      {/* Destination tag */}
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 5,
          fontSize: 12,
          color: C.textLight,
          fontWeight: 500,
          fontFamily: font,
          marginBottom: 16,
        }}
      >
        <LocationIcon />
        {scenario.destination}
      </div>

      {/* Footer: CTA + Credibility */}
      <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: C.accent,
              fontFamily: font,
              display: 'flex',
              alignItems: 'center',
              gap: hovered ? 10 : 6,
              transition: 'gap 0.2s',
            }}
          >
            See full breakdown <ArrowRightIcon />
          </span>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 10,
              color: '#9CA3AF',
              fontFamily: font,
            }}
          >
            <ShieldCheckIcon />
            <span>Apr 2026</span>
          </div>
        </div>
      </div>
    </div>
  );
}
