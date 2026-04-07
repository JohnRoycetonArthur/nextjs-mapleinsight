'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Scenario } from '@/lib/scenarios';
import { trackEvent } from '@/lib/analytics';
import { ScenarioCarousel } from './ScenarioCarousel';
import { GoldenGrid } from './GoldenGrid';

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  forest: '#1B4F4A',
  accent: '#1B7A4A',
  gold: '#B8860B',
  red: '#C41E3A',
  white: '#FFFFFF',
  textFaint: 'rgba(255,255,255,0.35)',
  textMid: 'rgba(255,255,255,0.55)',
  textLight: 'rgba(255,255,255,0.65)',
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

function CheckIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function ShieldCheckIcon({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

function ClockIcon({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function UserIcon({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const TRUST_PROOF_POINTS = [
  { icon: <CheckIcon size={11} />, text: 'Based on IRCC & CMHC data' },
  { icon: <CheckIcon size={11} />, text: 'No signup required' },
  { icon: <CheckIcon size={11} />, text: 'Personalized to your situation' },
] as const;

const CREDIBILITY_ITEMS = [
  { icon: <ShieldCheckIcon size={13} />, text: 'IRCC fees (Apr 2026) + CMHC rents (Oct 2025)' },
  { icon: <ClockIcon size={13} />, text: 'FCAC buffer guidance' },
  { icon: <UserIcon size={13} />, text: 'No personal data collected' },
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
      router.push(`/immigration-costs?scenario=${scenario.type}#your-plan`);
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
        .hero-cta-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 28px rgba(0,0,0,0.28) !important;
        }
      `}</style>

      <header
        ref={sectionRef}
        style={{
          background: 'linear-gradient(165deg, #0F3D3A 0%, #1B5E58 35%, #1B7A4A 100%)',
          padding: isMobile ? '40px 0 40px' : '60px 0 52px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Golden checkerboard grid — base decorative layer */}
        <GoldenGrid />

        {/* Radial glow overlays */}
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
          style={{
            maxWidth: 1200,
            margin: '0 auto',
            padding: isMobile ? '0 20px' : '0 32px',
            position: 'relative',
            zIndex: 1,
          }}
        >
          {/* ── 1. Badge ── */}
          <div style={{ textAlign: 'center', marginBottom: isMobile ? 24 : 32 }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 11,
                fontWeight: 600,
                color: C.textMid,
                textTransform: 'uppercase',
                letterSpacing: 1.5,
                marginBottom: 14,
                fontFamily: font,
              }}
            >
              <MapleLeafIcon size={11} color="rgba(196,30,58,0.7)" />
              Settlement Cost Explorer
            </div>

            {/* ── 2. Headline ── */}
            <h1
              style={{
                fontFamily: serif,
                fontSize: isMobile ? 27 : 40,
                fontWeight: 700,
                color: C.white,
                margin: '0 0 14px',
                lineHeight: 1.18,
                letterSpacing: -0.5,
                maxWidth: 680,
                marginLeft: 'auto',
                marginRight: 'auto',
              }}
            >
              Planning to move to Canada?{' '}
              <span style={{ color: C.gold }}>See your real cost before you decide.</span>
            </h1>

            {/* ── 3. Subtext ── */}
            <p
              style={{
                fontSize: isMobile ? 15 : 16,
                color: C.textLight,
                margin: '0 auto 8px',
                maxWidth: 520,
                lineHeight: 1.65,
                fontFamily: font,
              }}
            >
              Source-backed estimates from IRCC, CMHC, and official benchmarks —
              personalized to your pathway, destination, and household.
            </p>

            {/* ── 4. Reassurance line ── */}
            <p
              style={{
                fontSize: 13,
                color: C.textMid,
                margin: '0 auto 28px',
                fontFamily: font,
                fontWeight: 500,
                letterSpacing: 0.1,
              }}
            >
              Takes 60 seconds — no signup required.
            </p>

            {/* ── 5. Primary CTA ── */}
            <a
              href="/immigration-costs#your-plan"
              className="hero-cta-primary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 9,
                background: C.white,
                color: C.forest,
                fontSize: isMobile ? 15 : 16,
                fontWeight: 700,
                fontFamily: font,
                padding: isMobile ? '14px 28px' : '16px 36px',
                borderRadius: 14,
                textDecoration: 'none',
                boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                transition: 'all 0.2s ease',
              }}
            >
              <MapleLeafIcon size={15} color={C.forest} />
              Calculate My Cost
              <ArrowRightIcon size={14} color={C.forest} />
            </a>
          </div>

          {/* ── 6. Trust proof points ── */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: isMobile ? 12 : 20,
              marginBottom: isMobile ? 14 : 18,
              flexWrap: 'wrap',
            }}
          >
            {TRUST_PROOF_POINTS.map((item, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  fontSize: 12,
                  color: 'rgba(255,255,255,0.72)',
                  fontFamily: font,
                  fontWeight: 500,
                  background: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 20,
                  padding: '5px 12px',
                }}
              >
                <span style={{ color: '#6EE7B7', flexShrink: 0 }}>{item.icon}</span>
                {item.text}
              </div>
            ))}
          </div>

          {/* ── 7. Scenario context line ── */}
          <p
            style={{
              textAlign: 'center',
              fontSize: 12,
              color: C.textMid,
              fontFamily: font,
              margin: '0 auto 16px',
              maxWidth: 500,
              lineHeight: 1.5,
            }}
          >
            Choose a scenario below or start fresh — your plan will be personalized to your situation.
          </p>

          {/* ── 8. Scenario cards ── */}
          <ScenarioCarousel onCardClick={handleCardClick} />

          {/* ── 9. Credibility strip ── */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: isMobile ? 12 : 20,
              marginTop: isMobile ? 18 : 24,
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
                  color: C.textFaint,
                  fontFamily: font,
                  fontWeight: 500,
                }}
              >
                {item.icon}
                <span>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </header>
    </>
  );
}
