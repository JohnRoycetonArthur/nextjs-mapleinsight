'use client';

import { useRef, useState, useEffect } from 'react';
import {
  AccountBalanceWallet,
  Analytics,
  Checklist,
  TaskAlt,
} from '@material-symbols-svg/react';

const C = {
  forest: '#1B4F4A', accent: '#1B7A4A',
  red: '#C41E3A', blue: '#2563EB',
  gray: '#6B7280', border: '#E5E7EB', bg: '#FAFBFC',
};
const serif = "var(--font-dm-serif, 'DM Serif Display', Georgia, serif)";

// ── Scroll fade-in ─────────────────────────────────────────────────────────────

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

// ── Card with hover ───────────────────────────────────────────────────────────

function PlanCard({ icon, title, desc, color, lightColor, iconShellBg, iconShellBorder, detail }: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  color: string;
  lightColor: string;
  iconShellBg: string;
  iconShellBorder: string;
  detail: string;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        flex: 1, background: C.bg, borderRadius: 16,
        border: `1px solid ${C.border}`, padding: '32px 26px',
        transition: 'box-shadow 0.3s, transform 0.3s',
        display: 'flex', flexDirection: 'column',
        boxShadow: hovered ? '0 8px 28px rgba(27,79,74,0.07)' : 'none',
        transform: hovered ? 'translateY(-3px)' : 'translateY(0)',
      }}
    >
      <div style={{
        width: 56, height: 56, borderRadius: 14,
        background: iconShellBg,
        border: `1px solid ${iconShellBorder}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 18,
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.65)',
      }} aria-hidden="true">{icon}</div>
      <h3 style={{
        fontFamily: serif, fontSize: 20, color: C.forest,
        margin: '0 0 10px', fontWeight: 700,
      }}>{title}</h3>
      <p style={{
        fontSize: 14, color: C.gray, margin: '0 0 16px',
        lineHeight: 1.7, flex: 1,
      }}>{desc}</p>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        fontSize: 12, fontWeight: 600, color,
        padding: '6px 12px', borderRadius: 8,
        background: `${color}06`, border: `1px solid ${color}15`,
        alignSelf: 'flex-start',
      }}>
        <TaskAlt size={14} color={color} />
        {detail}
      </div>
    </div>
  );
}

// ── Section ───────────────────────────────────────────────────────────────────

/*
  Material Symbols mapping:
  - Cost of Living Estimate -> AccountBalanceWallet
  - Savings Gap Analysis -> Analytics
  - First 90 Days Checklist -> Checklist
*/
const CARDS = [
  {
    icon: <AccountBalanceWallet size={28} color="#1D4ED8" />,
    title: 'Cost of Living Estimate',
    desc: 'Realistic monthly and upfront costs based on your destination city — including rent (CMHC data), transit, groceries, and immigration fees.',
    color: C.accent,
    lightColor: '#E8F5EE',
    iconShellBg: 'linear-gradient(145deg,#F8FFFB,#EEF7F2)',
    iconShellBorder: '#D8E7DF',
    detail: 'Covers 7 major cities with real data',
  },
  {
    icon: <Analytics size={28} color="#2563EB" />,
    title: 'Savings Gap Analysis',
    desc: "Know exactly how much you need — and whether you're short. See your savings coverage percentage, recommended safe target, and time to close any gap.",
    color: C.blue,
    lightColor: '#EFF6FF',
    iconShellBg: 'linear-gradient(145deg,#F8FAFF,#EEF4FF)',
    iconShellBorder: '#DCE6F8',
    detail: 'Includes IRCC proof-of-funds check',
  },
  {
    icon: <Checklist size={28} color="#C41E3A" />,
    title: 'First 90 Days Checklist',
    desc: 'A clear plan for what to do before and after you arrive. SIN, banking, health card, housing, transit — organized by pre-arrival, first week, and first 90 days.',
    color: C.red,
    lightColor: '#FEF2F2',
    iconShellBg: 'linear-gradient(145deg,#FFF9F9,#FFF1F1)',
    iconShellBorder: '#F0DDDD',
    detail: 'Tailored to your city and pathway',
  },
];

export function PlanIncludes({ isMobile }: { isMobile: boolean }) {
  return (
    <section style={{
      padding: isMobile ? '60px 20px' : '96px 32px',
      background: '#fff',
    }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <FadeIn>
          <div style={{ textAlign: 'center', marginBottom: isMobile ? 36 : 52 }}>
            <h2 style={{
              fontFamily: serif,
              fontSize: isMobile ? 28 : 38,
              fontWeight: 700, color: C.forest,
              lineHeight: 1.15, margin: '0 0 10px',
            }}>
              What Your Plan Includes
            </h2>
            <p style={{
              fontSize: 16, color: C.gray, margin: 0,
              maxWidth: 480, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.6,
            }}>
              Everything you need to understand the true cost of settling in Canada.
            </p>
          </div>
        </FadeIn>

        <div style={{
          display: 'flex',
          gap: 16,
          flexDirection: isMobile ? 'column' : 'row',
        }}>
          {CARDS.map((card, i) => (
            <FadeIn key={i} delay={i * 0.1} style={{ flex: 1, display: 'flex' }}>
              <PlanCard {...card} />
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
