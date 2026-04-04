'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Calculate,
  ChecklistRtl,
  MenuBook,
} from '@material-symbols-svg/react';

const C = {
  forest: '#1B4F4A', accent: '#1B7A4A', gold: '#B8860B', blue: '#2563EB',
  gray: '#6B7280', border: '#E5E7EB', white: '#FFFFFF', bg: '#FAFBFC',
  textDark: '#111827',
};
const serif = "var(--font-dm-serif, 'DM Serif Display', Georgia, serif)";
const font = "var(--font-dm-sans, 'DM Sans', Helvetica, sans-serif)";

const PILLARS = [
  {
    Icon: Calculate,
    color: C.accent,
    lightBg: '#E8F5EE',
    title: 'Calculate Costs',
    desc: 'Get your exact settlement cost based on IRCC proof of funds, CMHC rent data, and real application fees. Every line item sourced.',
    cta: 'Calculate my costs →',
    href: '/immigration-costs',
  },
  {
    Icon: ChecklistRtl,
    color: C.gold,
    lightBg: '#FDF6E3',
    title: 'Your Settlement Plan',
    desc: 'A personalized step-by-step checklist from pre-arrival through your first 90 days. Track progress, stay on track, know what matters.',
    cta: 'See my plan →',
    href: '/settlement-plan',
  },
  {
    Icon: MenuBook,
    color: C.blue,
    lightBg: '#EFF6FF',
    title: 'Guides & Articles',
    desc: '30+ plain-language guides covering banking, taxes, housing, investing, and government benefits — sourced from official data.',
    cta: 'Browse guides →',
    href: '/articles',
  },
];

function PillarCard({ pillar }: { pillar: typeof PILLARS[number] }) {
  const [hov, setHov] = useState(false);
  const { Icon } = pillar;
  return (
    <Link
      href={pillar.href}
      style={{
        display: 'block', textDecoration: 'none',
        background: C.white, borderRadius: 16,
        border: `1px solid ${hov ? pillar.color + '30' : C.border}`,
        padding: '28px 24px', position: 'relative', overflow: 'hidden',
        transition: 'all 0.25s',
        boxShadow: hov ? `0 8px 28px ${pillar.color}12` : '0 1px 4px rgba(0,0,0,0.03)',
        transform: hov ? 'translateY(-4px)' : 'translateY(0)',
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      {/* Top accent bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 3,
        background: pillar.color,
        opacity: hov ? 1 : 0, transition: 'opacity 0.25s',
      }} />
      <div style={{
        width: 44, height: 44, borderRadius: 12, background: pillar.lightBg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 16,
      }}>
        <Icon size={22} color={pillar.color} />
      </div>
      <h3 style={{ fontFamily: serif, fontSize: 18, fontWeight: 700, color: C.forest, margin: '0 0 8px' }}>
        {pillar.title}
      </h3>
      <p style={{ fontFamily: font, fontSize: 13, color: C.gray, margin: '0 0 16px', lineHeight: 1.6 }}>
        {pillar.desc}
      </p>
      <span style={{ fontFamily: font, fontSize: 13, fontWeight: 600, color: pillar.color, display: 'flex', alignItems: 'center', gap: 4 }}>
        {pillar.cta}
      </span>
    </Link>
  );
}

export function PlatformPillars({ isMobile }: { isMobile: boolean }) {
  return (
    <section style={{ background: C.bg, padding: isMobile ? '44px 16px' : '64px 24px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: isMobile ? 24 : 36 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.gold, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 }}>
            More Than a Calculator
          </div>
          <h2 style={{ fontFamily: serif, fontSize: isMobile ? 24 : 32, fontWeight: 700, color: C.forest, margin: '0 0 8px', lineHeight: 1.2 }}>
            A Complete Settlement Platform
          </h2>
          <p style={{ fontFamily: font, fontSize: 15, color: C.gray, margin: '0 auto', maxWidth: 480, lineHeight: 1.6 }}>
            Calculate your costs, track your progress, and learn what you need to know — all in one place.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 16 }}>
          {PILLARS.map((p) => <PillarCard key={p.href} pillar={p} />)}
        </div>
      </div>
    </section>
  );
}
