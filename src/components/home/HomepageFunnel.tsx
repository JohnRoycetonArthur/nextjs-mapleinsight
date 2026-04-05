'use client';

import { useState, useEffect } from 'react';
import { TaskAlt } from '@material-symbols-svg/react';
import Link from 'next/link';
import { HowItWorks } from './HowItWorks';
import { PlatformPillars } from './PlatformPillars';
import { ExploreByTopic } from './ExploreByTopic';
import { SocialProof } from './SocialProof';
import { ScenarioHeroCards } from './ScenarioHeroCards';

// ── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  forest: '#1B4F4A', accent: '#1B7A4A',
  red: '#C41E3A', blue: '#2563EB', gold: '#B8860B',
  gray: '#6B7280', lightGray: '#F3F4F6', border: '#E5E7EB',
  text: '#374151', textLight: '#9CA3AF', bg: '#FAFBFC',
};
const serif = "var(--font-dm-serif, 'DM Serif Display', Georgia, serif)";

// ── Hero Section ──────────────────────────────────────────────────────────────

const MAPLE_LEAF_PATH = "M12 0L13.5 6.5L17 4L15.5 8.5L22 9L17 12L20 16L14 14L12 24L10 14L4 16L7 12L2 9L8.5 8.5L7 4L10.5 6.5Z";

function HeroSection({ isMobile }: { isMobile: boolean }) {
  return (
    <header style={{
      background: 'linear-gradient(165deg, #0F3D3A 0%, #1B5E58 40%, #1B7A4A 100%)',
      padding: isMobile ? '48px 20px 40px' : '72px 24px 60px',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Decorative orbs */}
      <div aria-hidden="true" style={{ position: 'absolute', top: -100, right: -100, width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(27,122,74,0.15), transparent 70%)' }} />
      <div aria-hidden="true" style={{ position: 'absolute', bottom: -80, left: -80, width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(184,134,11,0.08), transparent 70%)' }} />
      {/* Dot pattern */}
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, opacity: 0.03, backgroundImage: 'radial-gradient(circle at 20% 50%, #fff 1px, transparent 1px), radial-gradient(circle at 80% 20%, #fff 1px, transparent 1px)', backgroundSize: '60px 60px, 40px 40px' }} />

      <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
        {/* Badge */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 100, padding: '6px 16px', marginBottom: 20, backdropFilter: 'blur(8px)' }}>
          <svg width={13} height={13} viewBox="0 0 24 24" fill={C.gold} aria-hidden="true"><path d={MAPLE_LEAF_PATH} /></svg>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>
            Free Settlement Planning Tool
          </span>
        </div>

        {/* Headline */}
        <h1 style={{ fontFamily: serif, fontSize: isMobile ? 32 : 48, fontWeight: 700, color: '#fff', margin: '0 0 16px', lineHeight: 1.12, letterSpacing: -0.5 }}>
          Are You Financially Ready{' '}
          <span style={{ background: 'linear-gradient(135deg, #B8860B, #D4A017)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            to Move to Canada?
          </span>
        </h1>

        {/* Subtitle */}
        <p style={{ fontSize: isMobile ? 16 : 18, color: 'rgba(255,255,255,0.75)', lineHeight: 1.6, margin: '0 auto 28px', maxWidth: 540 }}>
          Find out exactly how much you need — based on your pathway, city, and family size. Real government data from IRCC, CMHC &amp; CRA. No guesswork.
        </p>

        {/* CTAs */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, marginBottom: 28 }}>
          <Link
            href="/immigration-costs#your-plan"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '15px 36px', borderRadius: 100,
              background: 'linear-gradient(135deg, #B8860B, #D4A017)',
              color: '#fff', fontSize: 16, fontWeight: 700,
              textDecoration: 'none', boxShadow: '0 4px 20px rgba(184,134,11,0.35)',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 28px rgba(184,134,11,0.45)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(184,134,11,0.35)'; }}
          >
            <svg width={16} height={16} viewBox="0 0 24 24" fill="#fff" aria-hidden="true"><path d={MAPLE_LEAF_PATH} /></svg>
            Calculate My Settlement Cost
          </Link>
          <Link
            href="/immigration-costs"
            style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.6)', textDecoration: 'none', transition: 'color 0.2s' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.9)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}
          >
            Read the Full Guide →
          </Link>
        </div>

        {/* Quick answer card */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 16, background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 14, padding: '16px 24px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: 20 }}>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 3 }}>Quick answer</div>
            <div style={{ fontFamily: serif, fontSize: 20, color: '#fff', fontWeight: 700 }}>$14,690 – $70,000+ CAD</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>Depending on pathway, family size &amp; city</div>
          </div>
        </div>

        {/* Trust badges */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
          {['No signup required', '100% free', 'IRCC · CMHC · CRA data'].map((t, i) => (
            <span key={i} style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <TaskAlt size={14} color="rgba(255,255,255,0.35)" /> {t}
            </span>
          ))}
        </div>
      </div>
    </header>
  );
}

// ── Final CTA ────────────────────────────────────────────────────────────────

function FinalCTASection({ isMobile }: { isMobile: boolean }) {
  return (
    <section style={{ background: `linear-gradient(135deg, ${C.forest}, #1A3F3B)`, padding: isMobile ? '44px 20px' : '64px 24px', position: 'relative', overflow: 'hidden' }}>
      <div aria-hidden="true" style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%', background: `radial-gradient(circle, ${C.accent}20, transparent 70%)` }} />
      <div style={{ maxWidth: 560, margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <h2 style={{ fontFamily: serif, fontSize: isMobile ? 24 : 30, fontWeight: 700, color: '#fff', margin: '0 0 10px', lineHeight: 1.2 }}>
          Don&apos;t guess. Plan.
        </h2>
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.65)', margin: '0 0 24px', lineHeight: 1.6 }}>
          Join thousands of newcomers who planned their move to Canada with real government data — not estimates.
        </p>
        <Link
          href="/immigration-costs#your-plan"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 32px', borderRadius: 100, background: 'linear-gradient(135deg, #B8860B, #D4A017)', color: '#fff', fontSize: 15, fontWeight: 700, textDecoration: 'none', boxShadow: '0 4px 20px rgba(184,134,11,0.35)' }}
        >
          <svg width={15} height={15} viewBox="0 0 24 24" fill="#fff" aria-hidden="true"><path d={MAPLE_LEAF_PATH} /></svg>
          Start My Free Plan
        </Link>
      </div>
    </section>
  );
}

// ── Root component ────────────────────────────────────────────────────────────

export function HomepageFunnel() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: C.bg }}>
      <ScenarioHeroCards />
      <HowItWorks isMobile={isMobile} />
      <PlatformPillars isMobile={isMobile} />
      <ExploreByTopic isMobile={isMobile} />
      <SocialProof isMobile={isMobile} />
      <FinalCTASection isMobile={isMobile} />
    </div>
  );
}
