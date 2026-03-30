'use client';

import { useRef, useState, useEffect } from 'react';
import { VerifiedUser } from '@material-symbols-svg/react';

const C = {
  forest: '#1B4F4A', accent: '#1B7A4A',
  blue: '#2563EB', purple: '#9333EA',
  gray: '#6B7280', lightGray: '#F3F4F6', border: '#E5E7EB',
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

const DATA_SOURCES = [
  {
    badge: 'CMHC',
    label: 'Rental data from CMHC',
    desc: 'Canada Mortgage and Housing Corporation October 2025 rental market data for 7 major cities.',
    color: C.accent,
  },
  {
    badge: 'IRCC',
    label: 'Aligned with IRCC proof of funds',
    desc: 'Validates your savings against Immigration, Refugees and Citizenship Canada requirements.',
    color: C.blue,
  },
  {
    badge: 'CRA/ESDC',
    label: 'Income and tax data',
    desc: 'Salary estimates from Job Bank (ESDC) and net income calculations using CRA tax brackets.',
    color: C.purple,
  },
];

const PATHWAYS = [
  'Express Entry', 'Study Permit', 'Provincial Nominee', 'Work Permit', 'Family Sponsorship',
];

export function TrustSection({ isMobile }: { isMobile: boolean }) {
  return (
    <section style={{
      padding: isMobile ? '48px 20px' : '64px 32px',
      background: 'linear-gradient(180deg, #FAFBFC 0%, #EEF2F1 100%)',
    }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <FadeIn>
          <div style={{
            background: '#fff', borderRadius: 18,
            border: `1px solid ${C.border}`,
            padding: isMobile ? '32px 20px' : '44px 48px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.03)',
          }}>
            {/* Heading */}
            <div style={{ textAlign: 'center', marginBottom: isMobile ? 28 : 36 }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '5px 14px', borderRadius: 20,
                background: '#E8F5EE', border: '1px solid rgba(27,122,74,0.1)',
                marginBottom: 14,
              }}>
                <VerifiedUser size={14} color="#1B7A4A" />
                <span style={{
                  fontSize: 11, fontWeight: 700, color: C.accent,
                  textTransform: 'uppercase', letterSpacing: 0.5,
                }}>Trusted Data</span>
              </div>
              <h2 style={{
                fontFamily: serif,
                fontSize: isMobile ? 24 : 30,
                fontWeight: 700, color: C.forest, margin: '0 0 8px',
              }}>
                Built for newcomers. Backed by real data.
              </h2>
              <p style={{
                fontSize: 14, color: C.gray, margin: 0,
                maxWidth: 520, marginLeft: 'auto', marginRight: 'auto',
              }}>
                Every estimate is sourced from Canadian government data — not guesswork.
              </p>
            </div>

            {/* Data sources */}
            <div style={{
              display: 'flex',
              gap: isMobile ? 16 : 20,
              flexDirection: isMobile ? 'column' : 'row',
            }}>
              {DATA_SOURCES.map((item, i) => (
                <div key={i} style={{
                  flex: 1, display: 'flex', gap: 14, alignItems: 'flex-start',
                }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                    background: `${item.color}08`, border: `1px solid ${item.color}18`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: serif, fontSize: 11, fontWeight: 700, color: item.color,
                  }}>
                    {item.badge}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: C.forest, marginBottom: 4 }}>
                      {item.label}
                    </div>
                    <div style={{ fontSize: 13, color: C.gray, lineHeight: 1.6 }}>
                      {item.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pathway badges */}
            <div style={{
              display: 'flex', justifyContent: 'center',
              gap: 8, marginTop: 28, flexWrap: 'wrap',
            }}>
              {PATHWAYS.map((p, i) => (
                <div key={i} style={{
                  padding: '5px 14px', borderRadius: 20,
                  background: C.lightGray, fontSize: 12,
                  fontWeight: 600, color: C.gray,
                  border: `1px solid ${C.border}`,
                }}>
                  {p}
                </div>
              ))}
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
