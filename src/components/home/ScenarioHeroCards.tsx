'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Scenario } from '@/lib/scenarios';
import { trackEvent } from '@/lib/analytics';
import { ScenarioCarousel } from './ScenarioCarousel';

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  forest: '#1B4F4A',
  accent: '#1B7A4A',
  gold: '#B8860B',
  red: '#C41E3A',
  white: '#FFFFFF',
  textLight: 'rgba(255,255,255,0.45)',
};

const font = "var(--font-dm-sans, 'DM Sans', Helvetica, sans-serif)";
const serif = "var(--font-dm-serif, 'DM Serif Display', Georgia, serif)";

// ─── Icons ────────────────────────────────────────────────────────────────────

function MapleLeafIcon({ size = 18, color = C.red }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden="true">
      <path d="M12 0L13.5 6.5L17 4L15.5 8.5L22 9L17 12L20 16L14 14L12 24L10 14L4 16L7 12L2 9L8.5 8.5L7 4L10.5 6.5Z" />
    </svg>
  );
}

function ArrowRightIcon({ size = 14, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

function ShieldCheckIcon({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

function ClockIcon({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function LockIcon({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

// ─── Credibility bar items ────────────────────────────────────────────────────

const CREDIBILITY_ITEMS = [
  { icon: <ShieldCheckIcon size={13} />, text: 'IRCC fees (Apr 2026) + CMHC rents (Oct 2025)' },
  { icon: <ClockIcon size={13} />, text: 'FCAC buffer guidance' },
  { icon: <LockIcon size={13} />, text: 'No personal data collected' },
] as const;

// ─── ScenarioHeroCards ────────────────────────────────────────────────────────

export function ScenarioHeroCards() {
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Fire scenario_card_view once when hero section enters viewport
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          trackEvent('scenario_card_view', { scenario_type: 'all' });
          observer.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const handleCardClick = useCallback(
    (scenario: Scenario) => {
      trackEvent('scenario_selected', {
        scenario_type: scenario.type,
        destination: scenario.cityKey,
        pathway: scenario.pathwayKey,
      });
      router.push(`/immigration-cost?scenario=${scenario.type}#plan`);
    },
    [router],
  );

  return (
    <>
      {/* Keyframe styles injected once */}
      <style>{`
        @keyframes cardEntrance {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .scenario-scroll::-webkit-scrollbar { display: none; }
        .scenario-card:focus-visible { outline: 2px solid #1B7A4A; outline-offset: 2px; }
      `}</style>

      <header
        ref={sectionRef}
        style={{
          background: 'linear-gradient(165deg, #0F3D3A 0%, #1B5E58 35%, #1B7A4A 100%)',
          padding: isMobile ? '40px 0 36px' : '64px 0 56px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background effects */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(ellipse at 20% 50%, rgba(27,122,74,0.15) 0%, transparent 60%),' +
              'radial-gradient(ellipse at 80% 20%, rgba(184,134,11,0.08) 0%, transparent 50%)',
            pointerEvents: 'none',
          }}
        />
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),' +
              'linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
            pointerEvents: 'none',
          }}
        />

        <div
          style={{
            maxWidth: 1200,
            margin: '0 auto',
            padding: isMobile ? '0 20px' : '0 32px',
            position: 'relative',
            zIndex: 1,
          }}
        >
          {/* Badge */}
          <div style={{ textAlign: 'center', marginBottom: isMobile ? 28 : 40 }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 12,
                fontWeight: 600,
                color: 'rgba(255,255,255,0.5)',
                textTransform: 'uppercase',
                letterSpacing: 1.5,
                marginBottom: 12,
                fontFamily: font,
              }}
            >
              <MapleLeafIcon size={12} color="rgba(196,30,58,0.7)" />
              Settlement Cost Explorer
            </div>

            {/* Headline */}
            <h1
              style={{
                fontFamily: serif,
                fontSize: isMobile ? 28 : 42,
                fontWeight: 700,
                color: C.white,
                margin: '0 0 12px',
                lineHeight: 1.15,
                letterSpacing: -0.5,
                maxWidth: 700,
                marginLeft: 'auto',
                marginRight: 'auto',
              }}
            >
              What people like you{' '}
              <span style={{ color: C.gold }}>actually spend</span>
            </h1>

            {/* Subheadline */}
            <p
              style={{
                fontSize: isMobile ? 15 : 17,
                color: 'rgba(255,255,255,0.65)',
                margin: '0 auto',
                maxWidth: 560,
                lineHeight: 1.65,
                fontFamily: font,
              }}
            >
              Source-backed cost patterns from IRCC, CMHC, and official benchmarks.
              <br />
              Click your situation to get a personalized plan.
            </p>
          </div>

          {/* Scenario cards */}
          <ScenarioCarousel onCardClick={handleCardClick} />

          {/* Credibility bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 16,
              marginTop: isMobile ? 20 : 28,
              flexWrap: 'wrap',
            }}
          >
            {CREDIBILITY_ITEMS.map((item, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  fontSize: 11,
                  color: C.textLight,
                  fontFamily: font,
                  fontWeight: 500,
                }}
              >
                {item.icon}
                <span>{item.text}</span>
              </div>
            ))}
          </div>

          {/* Primary CTA */}
          <div style={{ textAlign: 'center', marginTop: isMobile ? 24 : 32 }}>
            <a
              href="/immigration-cost#plan"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: C.white,
                color: C.forest,
                fontSize: 15,
                fontWeight: 700,
                fontFamily: font,
                padding: '14px 32px',
                borderRadius: 14,
                textDecoration: 'none',
                boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 24px rgba(0,0,0,0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.15)';
              }}
            >
              <MapleLeafIcon size={16} color={C.forest} />
              Start My Free Settlement Plan
              <ArrowRightIcon size={14} color={C.forest} />
            </a>
            <div
              style={{
                fontSize: 12,
                color: 'rgba(255,255,255,0.35)',
                marginTop: 10,
                fontFamily: font,
              }}
            >
              No signup required — takes about 8 minutes
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
