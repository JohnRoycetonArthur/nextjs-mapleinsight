'use client';

import { useState } from 'react';
import type { Scenario } from '@/lib/scenarios';

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  forest: '#1B4F4A',
  accent: '#1B7A4A',
  gold: '#B8860B',
  purple: '#9333EA',
  textLight: '#6B7280',
  border: '#E5E7EB',
  white: '#FFFFFF',
};

const font = "var(--font-dm-sans, 'DM Sans', Helvetica, sans-serif)";
const serif = "var(--font-dm-serif, 'DM Serif Display', Georgia, serif)";

// ─── Icons ────────────────────────────────────────────────────────────────────

function ArrowRightIcon() {
  return (
    <svg
      width={13}
      height={13}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg
      width={12}
      height={12}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg width={9} height={9} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
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
  const [tooltipVisible, setTooltipVisible] = useState(false);

  const formattedCost = `$${scenario.displayCost.toLocaleString()}`;

  return (
    <div
      role="link"
      tabIndex={0}
      className="scenario-card"
      aria-label={`${scenario.name} moving to ${scenario.destination} via ${scenario.pathway}. Estimated cost: ${formattedCost}. Click to see full breakdown.`}
      onClick={() => onClick(scenario)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(scenario);
        }
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        setHovered(false);
        setTooltipVisible(false);
      }}
      style={{
        background: C.white,
        borderRadius: 16,
        border: `1px solid ${hovered ? C.accent + '44' : C.border}`,
        cursor: 'pointer',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: hovered ? 'translateY(-5px)' : 'translateY(0)',
        boxShadow: hovered
          ? '0 16px 48px rgba(27,79,74,0.18), 0 4px 12px rgba(27,79,74,0.08)'
          : '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)',
        outline: 'none',
        minWidth: isMobile ? 268 : 'auto',
        maxWidth: isMobile ? 288 : 'none',
        scrollSnapAlign: isMobile ? 'center' : 'none',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
        animationName: 'cardEntrance',
        animationDuration: '0.5s',
        animationTimingFunction: 'ease-out',
        animationDelay: `${index * 0.1}s`,
        animationFillMode: 'both',
      }}
    >
      {/* ── Photo section (175px) ── */}
      <div style={{ position: 'relative', height: 175, overflow: 'hidden', flexShrink: 0 }}>
        <img
          src={scenario.photo}
          alt={scenario.name}
          loading={index < 2 ? 'eager' : 'lazy'}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center 20%',
            display: 'block',
            transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            transform: hovered ? 'scale(1.04)' : 'scale(1)',
          }}
        />

        {/* Bottom fade to white */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 72,
            background: 'linear-gradient(to top, rgba(255,255,255,1) 0%, rgba(255,255,255,0) 100%)',
            pointerEvents: 'none',
          }}
        />

        {/* Pathway badge — top left */}
        <div
          style={{
            position: 'absolute',
            top: 10,
            left: 10,
            background: scenario.pathwayColor,
            color: '#fff',
            fontSize: 10,
            fontWeight: 700,
            fontFamily: font,
            letterSpacing: 0.3,
            padding: '4px 10px',
            borderRadius: 20,
            backdropFilter: 'blur(4px)',
            lineHeight: 1.3,
          }}
        >
          {scenario.pathway}
        </div>

        {/* Arrival date badge — bottom right */}
        <div
          style={{
            position: 'absolute',
            bottom: 10,
            right: 10,
            background: 'rgba(255,255,255,0.92)',
            color: C.textLight,
            fontSize: 10,
            fontWeight: 600,
            fontFamily: font,
            padding: '3px 8px',
            borderRadius: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            border: `1px solid ${C.border}`,
            lineHeight: 1.3,
          }}
        >
          <PinIcon />
          {scenario.arrivalDate}
        </div>
      </div>

      {/* ── Card body (grows to fill, pushes footer down) ── */}
      <div
        style={{
          padding: '12px 16px 0 16px',
          display: 'flex',
          flexDirection: 'column',
          flexGrow: 1,
        }}
      >
        {/* Name row — 38px */}
        <div
          style={{
            height: 38,
            display: 'flex',
            alignItems: 'center',
            overflow: 'hidden',
          }}
        >
          <span
            style={{
              fontFamily: serif,
              fontSize: 17,
              fontWeight: 700,
              color: C.forest,
              lineHeight: 1.2,
            }}
          >
            {scenario.name}
          </span>
        </div>

        {/* Origin → Destination row — 16px + 10px mb */}
        <div
          style={{
            height: 16,
            marginBottom: 10,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            overflow: 'hidden',
          }}
        >
          <span style={{ fontSize: 11, color: C.textLight, fontFamily: font, fontWeight: 500 }}>
            {scenario.origin} → {scenario.destination}
          </span>
        </div>

        {/* Divider — 1px + 10px mb */}
        <div
          aria-hidden="true"
          style={{ height: 1, background: C.border, marginBottom: 10, flexShrink: 0 }}
        />

        {/* Cost label */}
        <div
          style={{
            fontSize: 9.5,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: 0.8,
            color: C.textLight,
            fontFamily: font,
          }}
        >
          Est. Cost
        </div>

        {/* Cost value + period + tooltip (student only) — 32px */}
        <div style={{ height: 32, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span
            style={{
              fontFamily: serif,
              fontSize: 24,
              fontWeight: 700,
              color: C.gold,
              lineHeight: 1,
              letterSpacing: -0.5,
            }}
          >
            {formattedCost}
          </span>
          {scenario.costPeriod && (
            <span style={{ fontSize: 11, color: C.textLight, fontWeight: 500, fontFamily: font }}>
              {scenario.costPeriod}
            </span>
          )}
          {scenario.studentNote && (
            <span
              style={{ position: 'relative', display: 'inline-flex' }}
              onMouseEnter={(e) => { e.stopPropagation(); setTooltipVisible(true); }}
              onMouseLeave={(e) => { e.stopPropagation(); setTooltipVisible(false); }}
            >
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  background: `${C.purple}14`,
                  color: C.purple,
                  border: `1px solid ${C.purple}30`,
                  cursor: 'help',
                }}
              >
                <InfoIcon />
              </span>
              {tooltipVisible && (
                <div
                  role="tooltip"
                  style={{
                    position: 'absolute',
                    bottom: 'calc(100% + 6px)',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'rgba(147,51,234,0.95)',
                    color: '#fff',
                    fontSize: 11,
                    fontFamily: font,
                    fontWeight: 500,
                    lineHeight: 1.5,
                    padding: '8px 11px',
                    borderRadius: 8,
                    width: 200,
                    whiteSpace: 'normal',
                    zIndex: 20,
                    boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
                    pointerEvents: 'none',
                  }}
                >
                  {scenario.studentNote}
                  <span
                    aria-hidden="true"
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: 0,
                      height: 0,
                      borderLeft: '5px solid transparent',
                      borderRight: '5px solid transparent',
                      borderTop: '5px solid rgba(147,51,234,0.95)',
                    }}
                  />
                </div>
              )}
            </span>
          )}
        </div>

        {/* Flex spacer — pushes context line to bottom of body */}
        <div style={{ flexGrow: 1 }} />

        {/* Context line */}
        <div
          style={{
            fontSize: 11,
            color: C.textLight,
            fontFamily: font,
            lineHeight: 1.5,
            paddingBottom: 10,
          }}
        >
          {scenario.contextLine}
        </div>
      </div>

      {/* ── Footer (always at bottom, aligned across all cards) ── */}
      <div
        style={{
          borderTop: `1px solid ${C.border}`,
          padding: '11px 16px 13px',
          flexShrink: 0,
        }}
      >
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
          See exact costs <ArrowRightIcon />
        </span>
      </div>
    </div>
  );
}
