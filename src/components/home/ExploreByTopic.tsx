'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  BarChart,
  TaskAlt,
  AccountBalance,
  ReceiptLong,
  Savings,
  Home,
} from '@material-symbols-svg/react';

const C = {
  forest: '#1B4F4A', accent: '#1B7A4A', gold: '#B8860B', blue: '#2563EB', purple: '#9333EA',
  gray: '#6B7280', border: '#E5E7EB', white: '#FFFFFF',
  textDark: '#111827',
};
const serif = "var(--font-dm-serif, 'DM Serif Display', Georgia, serif)";
const font = "var(--font-dm-sans, 'DM Sans', Helvetica, sans-serif)";

const TOPICS = [
  { Icon: BarChart,       title: 'Immigration Costs',     desc: 'How much you need, by pathway and city',               href: '/immigration-costs',           color: C.accent,  badge: 'Popular' },
  { Icon: TaskAlt,        title: 'Your Settlement Plan',  desc: 'Personalized checklist — before & after arrival',      href: '/settlement-plan',             color: C.accent,  badge: null },
  { Icon: AccountBalance, title: 'Banking & Credit',      desc: 'Bank accounts, credit scores, and getting set up',     href: '/articles?category=banking',   color: C.gold,    badge: null },
  { Icon: ReceiptLong,    title: 'Taxes & Filing',        desc: 'Your first tax return, slips, and credits',            href: '/articles?category=taxes',     color: C.gold,    badge: null },
  { Icon: Savings,        title: 'Saving & Investing',    desc: 'TFSA, RRSP, FHSA — which is right for you?',          href: '/articles?category=saving',    color: C.blue,    badge: null },
  { Icon: Home,           title: 'Housing in Canada',     desc: 'Renting, buying, and what it really costs',           href: '/articles?category=housing',   color: C.purple,  badge: null },
];

function TopicCard({ topic }: { topic: typeof TOPICS[number] }) {
  const [hov, setHov] = useState(false);
  const { Icon } = topic;
  return (
    <Link
      href={topic.href}
      style={{
        display: 'flex', gap: 14, padding: '18px',
        borderRadius: 14, border: `1px solid ${hov ? topic.color + '30' : C.border}`,
        background: C.white, textDecoration: 'none',
        transition: 'all 0.2s',
        transform: hov ? 'translateY(-2px)' : 'translateY(0)',
        boxShadow: hov ? `0 4px 16px ${topic.color}08` : 'none',
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      <div style={{
        width: 42, height: 42, borderRadius: 10,
        background: `${topic.color}10`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Icon size={20} color={topic.color} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
          <span style={{ fontFamily: font, fontSize: 15, fontWeight: 700, color: C.textDark }}>{topic.title}</span>
          {topic.badge && (
            <span style={{ fontSize: 10, fontWeight: 600, color: C.accent, background: `${C.accent}10`, borderRadius: 100, padding: '2px 8px' }}>
              {topic.badge}
            </span>
          )}
        </div>
        <span style={{ fontFamily: font, fontSize: 13, color: C.gray, lineHeight: 1.5 }}>{topic.desc}</span>
      </div>
    </Link>
  );
}

export function ExploreByTopic({ isMobile }: { isMobile: boolean }) {
  return (
    <section style={{ background: C.white, padding: isMobile ? '44px 16px' : '64px 24px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: isMobile ? 20 : 28 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.blue, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 6 }}>Explore by Topic</div>
            <h2 style={{ fontFamily: serif, fontSize: isMobile ? 22 : 28, fontWeight: 700, color: C.forest, margin: 0 }}>
              Everything You Need to Know
            </h2>
          </div>
          {!isMobile && (
            <Link href="/articles" style={{ fontFamily: font, fontSize: 13, fontWeight: 600, color: C.accent, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}>
              All articles →
            </Link>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: 10 }}>
          {TOPICS.map((t) => <TopicCard key={t.href} topic={t} />)}
        </div>

        {isMobile && (
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <Link href="/articles" style={{ fontFamily: font, fontSize: 13, fontWeight: 600, color: C.accent, textDecoration: 'none' }}>
              Browse all articles →
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
