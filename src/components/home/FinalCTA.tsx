'use client';

import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRightAlt, TaskAlt } from '@material-symbols-svg/react';

const C = {
  forest: '#1B4F4A', accent: '#1B7A4A',
  gray: '#6B7280', textLight: '#9CA3AF',
};
const serif = "var(--font-dm-serif, 'DM Serif Display', Georgia, serif)";

function FadeIn({ children, style = {} }: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [vis, setVis] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVis(true); obs.disconnect(); } },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref} style={{
      opacity: vis ? 1 : 0,
      transform: vis ? 'translateY(0)' : 'translateY(24px)',
      transition: 'opacity 0.6s ease, transform 0.6s ease',
      ...style,
    }}>
      {children}
    </div>
  );
}

const MapleLeaf = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="#C41E3A" aria-hidden="true">
    <path d="M12 0L13.5 6.5L17 4L15.5 8.5L22 9L17 12L20 16L14 14L12 24L10 14L4 16L7 12L2 9L8.5 8.5L7 4L10.5 6.5Z" />
  </svg>
);

const TRUST_BADGES = ['Free', 'No sign-up required', '~8 minutes', 'Data stays local'];

export function FinalCTA({ isMobile }: { isMobile: boolean }) {
  return (
    <section style={{
      padding: isMobile ? '64px 20px' : '96px 32px',
      background: '#fff',
      textAlign: 'center',
    }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <FadeIn>
          <MapleLeaf />
          <h2 style={{
            fontFamily: serif,
            fontSize: isMobile ? 28 : 38,
            fontWeight: 700, color: C.forest,
            lineHeight: 1.12, margin: '16px 0 12px',
          }}>
            Know before you go.
          </h2>
          <p style={{
            fontSize: 16, color: C.gray, lineHeight: 1.7, margin: '0 0 32px',
          }}>
            A personalized financial settlement plan — so you arrive in Canada with clarity,
            confidence, and a roadmap for your first 90 days.
          </p>

          <Link
            href="/settlement-planner/plan"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '16px 36px', borderRadius: 12,
              background: C.accent, color: '#fff',
              fontWeight: 700, fontSize: 16, textDecoration: 'none',
              boxShadow: `0 4px 14px ${C.accent}44`,
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = `0 6px 20px ${C.accent}55`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = `0 4px 14px ${C.accent}44`;
            }}
          >
            Start Your Free Settlement Plan <ArrowRightAlt size={16} color="#FFFFFF" />
          </Link>

          {/* Trust badges */}
          <div style={{
            display: 'flex', justifyContent: 'center',
            gap: 16, marginTop: 16, flexWrap: 'wrap',
            fontSize: 13, color: C.textLight,
          }}>
            {TRUST_BADGES.map((t, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <TaskAlt size={12} color="#7DD3A8" />
                <span>{t}</span>
              </div>
            ))}
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
