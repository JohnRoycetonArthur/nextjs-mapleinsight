'use client';

import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRightAlt, Description, Groups, Speed } from '@material-symbols-svg/react';

const C = {
  forest: '#1B4F4A', gold: '#B8860B',
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

const VALUE_PROPS = [
  {
    icon: <Speed size={22} color="#FFFFFF" />,
    title: 'Save time',
    desc: 'Replace manual calculations with instant, structured reports powered by CMHC and IRCC data.',
  },
  {
    icon: <Description size={22} color="#FFFFFF" />,
    title: 'Look more professional',
    desc: 'Deliver branded, data-backed settlement plans to your clients — with your name and company.',
  },
  {
    icon: <Groups size={22} color="#FFFFFF" />,
    title: 'Increase client trust',
    desc: 'Help clients understand financial readiness before submission. Reduce post-arrival complaints.',
  },
];

const SCENARIOS = [
  { label: 'Switch to Winnipeg',       impact: '-$7,800'        },
  { label: 'Secure job pre-arrival',   impact: 'Gap eliminated' },
  { label: 'Start in shared housing',  impact: '-$4,800'        },
];

export function ForConsultants({ isMobile }: { isMobile: boolean }) {
  return (
    <section id="for-consultants" style={{
      padding: isMobile ? '60px 20px' : '96px 32px',
      background: 'linear-gradient(165deg, #0F3D3A 0%, #1B4F4A 50%, #1B5E58 100%)',
      position: 'relative', overflow: 'hidden',
      scrollMarginTop: 96,
    }}>
      {/* Dot pattern overlay */}
      <div aria-hidden="true" style={{
        position: 'absolute', inset: 0, opacity: 0.03,
        backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.5) 1px, transparent 0)',
        backgroundSize: '30px 30px',
      }} />

      <div style={{ maxWidth: 1100, margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <FadeIn>
          <div style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: 'center',
            gap: isMobile ? 36 : 56,
          }}>
            {/* Left copy */}
            <div style={{ flex: '1 1 55%' }}>
              {/* Badge */}
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '5px 14px', borderRadius: 20,
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.1)',
                marginBottom: 16,
              }}>
                <Groups size={14} color="rgba(255,255,255,0.85)" />
                <span style={{
                  fontSize: 11, fontWeight: 700,
                  color: 'rgba(255,255,255,0.7)',
                  textTransform: 'uppercase', letterSpacing: 0.5,
                }}>For Immigration Consultants</span>
              </div>

              <h2 style={{
                fontFamily: serif,
                fontSize: isMobile ? 26 : 36,
                fontWeight: 700, color: '#fff',
                lineHeight: 1.15, margin: '0 0 14px',
              }}>
                Offer your clients a structured financial settlement plan
              </h2>
              <p style={{
                fontSize: 16, color: 'rgba(255,255,255,0.6)',
                lineHeight: 1.7, margin: '0 0 28px', maxWidth: 460,
              }}>
                Without adding hours to your workflow. Send a branded link, get a professional report back instantly.
              </p>

              {/* Value props */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 32 }}>
                {VALUE_PROPS.map((item, i) => (
                  <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                      background: 'rgba(255,255,255,0.06)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }} aria-hidden="true">{item.icon}</div>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 3 }}>
                        {item.title}
                      </div>
                      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6 }}>
                        {item.desc}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <Link
                href="/for-consultants/coming-soon"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '14px 28px', borderRadius: 10,
                  background: '#fff', color: C.forest,
                  fontWeight: 700, fontSize: 14, textDecoration: 'none',
                  transition: 'transform 0.2s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                Explore Consultant Tools <ArrowRightAlt size={14} color="#1B4F4A" />
              </Link>
            </div>

            {/* Right: consultant preview card */}
            <div style={{
              flex: '0 0 auto',
              maxWidth: isMobile ? '100%' : 340,
              width: '100%',
            }}>
              <div style={{
                background: 'rgba(255,255,255,0.06)',
                backdropFilter: 'blur(12px)',
                borderRadius: 16,
                border: '1px solid rgba(255,255,255,0.08)',
                overflow: 'hidden',
              }}>
                {/* Card header */}
                <div style={{
                  padding: '16px 20px',
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                }}>
                  <div style={{
                    fontSize: 10, color: 'rgba(255,255,255,0.4)',
                    fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5,
                  }}>
                    Consultant Intelligence Report
                  </div>
                </div>

                <div style={{ padding: '16px 20px' }}>
                  {/* Readiness gauge */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: '50%',
                      background: `conic-gradient(${C.gold} 0% 52%, rgba(255,255,255,0.1) 52% 100%)`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }} aria-hidden="true">
                      <div style={{
                        width: 36, height: 36, borderRadius: '50%',
                        background: 'rgba(15,61,58,0.9)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontFamily: serif, fontSize: 14, fontWeight: 700, color: C.gold,
                      }}>5.2</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>
                        Moderate Readiness
                      </div>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>
                        Proof-of-funds met · Income unsecured
                      </div>
                    </div>
                  </div>

                  {/* What-if scenarios */}
                  <div style={{
                    fontSize: 10, fontWeight: 700,
                    color: 'rgba(255,255,255,0.4)',
                    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8,
                  }}>
                    What-If Scenarios
                  </div>
                  {SCENARIOS.map((s, i) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '7px 10px', borderRadius: 8,
                      background: i === 0 ? 'rgba(94,230,160,0.06)' : 'transparent',
                      marginBottom: 3,
                    }}>
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>{s.label}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: '#5EE6A0' }}>{s.impact}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
