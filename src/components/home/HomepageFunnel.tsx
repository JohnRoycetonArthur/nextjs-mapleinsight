'use client';

import { useState, useEffect } from 'react';
import { ArrowRightAlt, TaskAlt } from '@material-symbols-svg/react';
import Link from 'next/link';
import { PlanIncludes } from './PlanIncludes';
import { TrustSection } from './TrustSection';
import { HowItWorks } from './HowItWorks';
import { ForConsultants } from './ForConsultants';
import { FinalCTA } from './FinalCTA';

// ── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  forest: '#1B4F4A', accent: '#1B7A4A',
  red: '#C41E3A', blue: '#2563EB', gold: '#B8860B',
  gray: '#6B7280', lightGray: '#F3F4F6', border: '#E5E7EB',
  text: '#374151', textLight: '#9CA3AF', bg: '#FAFBFC',
};
const serif = "var(--font-dm-serif, 'DM Serif Display', Georgia, serif)";

// ── Mini Settlement Planner Preview ──────────────────────────────────────────

function PlannerPreview() {
  return (
    <div style={{
      background: '#fff', borderRadius: 16,
      border: `1px solid ${C.border}`,
      boxShadow: '0 16px 48px rgba(15,61,58,0.12), 0 4px 16px rgba(0,0,0,0.04)',
      overflow: 'hidden', width: '100%',
    }}>
      {/* Header bar */}
      <div style={{
        background: 'linear-gradient(135deg, #0F3D3A, #1B5E58, #1B7A4A)',
        padding: '14px 18px',
      }}>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>Your Settlement Plan</div>
        <div style={{ fontFamily: serif, fontSize: 16, color: '#fff', fontWeight: 700, marginTop: 2 }}>
          Toronto, Ontario · Express Entry
        </div>
      </div>

      <div style={{ padding: '14px 16px' }}>
        {/* Metric tiles */}
        <div style={{ display: 'flex', gap: 7, marginBottom: 12 }}>
          {[
            { l: 'Upfront', v: '$7,472', c: C.accent },
            { l: 'Monthly', v: '$2,847', c: C.blue },
            { l: 'Gap',     v: '$8,000', c: C.red  },
          ].map((m, i) => (
            <div key={i} style={{
              flex: 1, padding: '10px', borderRadius: 8,
              background: C.bg, borderLeft: `3px solid ${m.c}`,
            }}>
              <div style={{ fontSize: 8, fontWeight: 600, color: C.textLight, textTransform: 'uppercase', letterSpacing: 0.5 }}>{m.l}</div>
              <div style={{ fontFamily: serif, fontSize: 16, fontWeight: 700, color: C.forest }}>{m.v}</div>
            </div>
          ))}
        </div>

        {/* Savings bar */}
        <div style={{ marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
            <span style={{ fontSize: 9, color: C.gray }}>Savings: $18,000</span>
            <span style={{ fontSize: 9, color: C.accent, fontWeight: 700 }}>69%</span>
          </div>
          <div style={{ height: 6, borderRadius: 3, background: C.lightGray }}>
            <div style={{
              height: '100%', width: '69%', borderRadius: 3,
              background: `linear-gradient(90deg, ${C.accent}, ${C.forest})`,
            }} />
          </div>
        </div>

        {/* Risk pills */}
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {[
            { label: 'No secured income', color: C.red,  bg: '#FEF2F2' },
            { label: 'Savings gap',       color: C.gold, bg: '#FDF6E3' },
            { label: 'OHIP — no wait',    color: C.blue, bg: '#EFF6FF' },
          ].map((r, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '3px 8px', borderRadius: 5,
              background: r.bg, fontSize: 9, color: r.color, fontWeight: 600,
            }}>
              <div style={{ width: 4, height: 4, borderRadius: '50%', background: r.color }} />
              {r.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Hero Section ──────────────────────────────────────────────────────────────

function HeroSection({ isMobile }: { isMobile: boolean }) {
  return (
    <header style={{
      background: 'linear-gradient(165deg, #0F3D3A 0%, #1B5E58 40%, #1B7A4A 100%)',
      padding: isMobile ? '52px 20px 56px' : '80px 32px 88px',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Dot pattern overlay */}
      <div aria-hidden="true" style={{
        position: 'absolute', inset: 0, opacity: 0.04,
        backgroundImage:
          'radial-gradient(circle at 20% 50%, #fff 1px, transparent 1px), ' +
          'radial-gradient(circle at 80% 20%, #fff 1px, transparent 1px)',
        backgroundSize: '60px 60px, 40px 40px',
      }} />
      {/* Ambient glow */}
      <div aria-hidden="true" style={{
        position: 'absolute', top: '-20%', right: '-10%',
        width: 550, height: 550, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(27,122,74,0.12), transparent 70%)',
        filter: 'blur(60px)', pointerEvents: 'none',
      }} />

      <div style={{
        maxWidth: 1100, margin: '0 auto', position: 'relative', zIndex: 1,
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        alignItems: 'center',
        gap: isMobile ? 40 : 56,
      }}>
        {/* Left copy */}
        <div style={{
          flex: '1 1 55%',
          textAlign: isMobile ? 'center' : 'left',
        }}>
          <h1 style={{
            fontFamily: serif,
            fontSize: isMobile ? 34 : 52,
            fontWeight: 700, color: '#fff',
            lineHeight: 1.08, letterSpacing: -1,
            margin: '0 0 18px',
          }}>
            Are You Financially Ready to{' '}
            <span style={{ color: '#7DD3A8' }}>Move to Canada?</span>
          </h1>

          <p style={{
            fontSize: isMobile ? 16 : 18, lineHeight: 1.7,
            color: 'rgba(255,255,255,0.7)',
            margin: '0 0 28px',
            maxWidth: isMobile ? '100%' : 480,
          }}>
            Get a personalized settlement plan with cost estimates, savings gap analysis,
            and a step-by-step checklist — in under 8 minutes.
          </p>

          {/* CTA buttons */}
          <div style={{
            display: 'flex', gap: 14, flexWrap: 'wrap',
            justifyContent: isMobile ? 'center' : 'flex-start',
            marginBottom: 20,
          }}>
            <Link
              href="/settlement-planner/plan"
              style={{
                display: 'inline-flex', alignItems: 'center',
                padding: '16px 32px', borderRadius: 12,
                background: '#fff', color: C.forest,
                fontWeight: 700, fontSize: 16, textDecoration: 'none',
                boxShadow: '0 4px 20px rgba(255,255,255,0.18)',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 28px rgba(255,255,255,0.22)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 20px rgba(255,255,255,0.18)';
              }}
            >
              Start My Free Settlement Plan <ArrowRightAlt size={16} color="#1B4F4A" />
            </Link>

            <a
              href="#how-it-works"
              style={{
                display: 'inline-flex', alignItems: 'center',
                padding: '14px 24px', borderRadius: 10,
                background: 'transparent', color: '#fff',
                fontWeight: 600, fontSize: 14, textDecoration: 'none',
                border: '2px solid rgba(255,255,255,0.2)',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              See how it works
            </a>
          </div>

          {/* Trust line */}
          <div style={{
            display: 'flex', gap: 16, flexWrap: 'wrap',
            justifyContent: isMobile ? 'center' : 'flex-start',
            fontSize: 13, color: 'rgba(255,255,255,0.5)',
          }}>
            {['Free', 'No sign-up required', 'Takes ~8 minutes'].map((t, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <TaskAlt size={13} color="#7DD3A8" />
                <span>{t}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: product preview */}
        <div style={{ flex: '0 0 auto', maxWidth: 400, width: '100%' }}>
          <PlannerPreview />
        </div>
      </div>
    </header>
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
      <HeroSection isMobile={isMobile} />
      <PlanIncludes isMobile={isMobile} />
      <TrustSection isMobile={isMobile} />
      <HowItWorks isMobile={isMobile} />
      <ForConsultants isMobile={isMobile} />
      <FinalCTA isMobile={isMobile} />
    </div>
  );
}
