'use client';

import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRightAlt } from '@material-symbols-svg/react';

const C = {
  forest: '#1B4F4A', accent: '#1B7A4A',
  blue: '#2563EB', purple: '#9333EA',
  gray: '#6B7280', textLight: '#9CA3AF',
};
const serif = "var(--font-dm-serif, 'DM Serif Display', Georgia, serif)";

function FadeIn({ children, delay = 0, style = {} }: {
  children: React.ReactNode;
  delay?: number;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [vis, setVis] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVis(true); obs.disconnect(); } },
      { threshold: 0.12 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref} style={{
      opacity: vis ? 1 : 0,
      transform: vis ? 'translateY(0)' : 'translateY(24px)',
      transition: `opacity 0.6s ease ${delay}s, transform 0.6s ease ${delay}s`,
      ...style,
    }}>
      {children}
    </div>
  );
}

const STEPS = [
  {
    num: '1',
    title: 'Tell us your situation',
    desc: 'Family size, immigration pathway, and which Canadian city you\'re heading to.',
    color: C.accent,
  },
  {
    num: '2',
    title: 'We crunch the numbers',
    desc: 'Real data from IRCC, CMHC & CRA — proof of funds, rent, fees, and hidden costs. No AI.',
    color: C.blue,
  },
  {
    num: '3',
    title: 'Get your free plan',
    desc: 'IRCC compliance check, cost breakdown, savings gap analysis, and a personalized settlement checklist.',
    color: C.purple,
  },
];

export function HowItWorks({ isMobile }: { isMobile: boolean }) {
  return (
    <section
      id="how-it-works"
      style={{
        padding: isMobile ? '60px 20px' : '96px 32px',
        background: '#fff',
      }}
    >
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <FadeIn>
          <div style={{ textAlign: 'center', marginBottom: isMobile ? 36 : 52 }}>
            <h2 style={{
              fontFamily: serif,
              fontSize: isMobile ? 26 : 34,
              fontWeight: 700, color: C.forest, margin: '0 0 8px',
            }}>
              How It Works
            </h2>
            <p style={{ fontSize: 15, color: C.gray, margin: 0 }}>
              Three simple steps. No account needed.
            </p>
          </div>
        </FadeIn>

        {/* Steps */}
        <div style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? 24 : 0,
          alignItems: 'flex-start',
          maxWidth: 780, margin: '0 auto',
        }}>
          {STEPS.map((step, i) => (
            <FadeIn
              key={i}
              delay={i * 0.1}
              style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', textAlign: 'center',
                position: 'relative',
              }}
            >
              {/* Connector line between steps (desktop) */}
              {!isMobile && i < 2 && (
                <div style={{
                  position: 'absolute',
                  top: 28,
                  left: 'calc(50% + 32px)',
                  right: 'calc(-50% + 32px)',
                  height: 2,
                  background: `linear-gradient(90deg, ${step.color}30, ${STEPS[i + 1].color}30)`,
                }} aria-hidden="true" />
              )}
              {/* Circle */}
              <div style={{
                width: 56, height: 56, borderRadius: '50%',
                background: step.color, color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: serif, fontWeight: 800, fontSize: 22,
                marginBottom: 16, position: 'relative', zIndex: 1,
                boxShadow: `0 0 0 6px ${step.color}12`,
              }}>
                {step.num}
              </div>
              <h3 style={{
                fontFamily: serif, fontSize: 17,
                color: C.forest, margin: '0 0 6px', fontWeight: 700,
              }}>
                {step.title}
              </h3>
              <p style={{
                fontSize: 13, color: C.gray, margin: 0,
                lineHeight: 1.6, maxWidth: 220,
              }}>
                {step.desc}
              </p>
            </FadeIn>
          ))}
        </div>

        {/* CTA */}
        <FadeIn delay={0.3}>
          <div style={{ textAlign: 'center', marginTop: 44 }}>
            <Link
              href="/immigration-costs#your-plan"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '13px 28px', borderRadius: 100,
                background: C.accent, color: '#fff',
                fontWeight: 700, fontSize: 15, textDecoration: 'none',
                boxShadow: `0 3px 14px ${C.accent}30`,
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              Start Now — It&apos;s Free <ArrowRightAlt size={14} color="#FFFFFF" />
            </Link>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
