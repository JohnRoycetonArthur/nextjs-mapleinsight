'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { ArticleSummary } from '@/sanity/queries';
import { NewsletterInline } from '@/components/start-here/NewsletterInline';

// ── Shared icons ──────────────────────────────────────────────────────────────

const MapleLeaf = ({ size = 18, color = '#C41E3A' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden="true">
    <path d="M12 0L13.5 6.5L17 4L15.5 8.5L22 9L17 12L20 16L14 14L12 24L10 14L4 16L7 12L2 9L8.5 8.5L7 4L10.5 6.5Z" />
  </svg>
);

const ArrowRight = ({ size = 14 }: { size?: number }) => (
  <svg
    width={size} height={size} viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2.5"
    strokeLinecap="round" strokeLinejoin="round"
    style={{ marginLeft: 4, flexShrink: 0 }}
    aria-hidden="true"
  >
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

const CheckCircle = ({ color = '#1B7A4A' }: { color?: string }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }} aria-hidden="true">
    <circle cx="12" cy="12" r="11" fill={color} opacity="0.12" />
    <circle cx="12" cy="12" r="11" stroke={color} strokeWidth="1.5" opacity="0.3" />
    <polyline points="8 12.5 11 15.5 16.5 9.5" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// ── Static data ────────────────────────────────────────────────────────────────

const TRUST_ITEMS = [
  { label: 'Salary estimates',           source: 'Job Bank Canada' },
  { label: 'Taxes & take-home pay',      source: 'CRA rates'       },
  { label: 'Cost of living',             source: 'StatsCan MBM'    },
  { label: 'Housing affordability',      source: 'CMHC rents'      },
  { label: 'Personalized action roadmap', source: 'Maple Insight'  },
];

const CALCULATORS = [
  {
    title:       'TFSA vs RRSP Comparison',
    description: 'Find the best account for your savings',
    icon:        '📊',
    color:       '#2563EB',
    href:        '/calculators/tfsa-vs-rrsp',
  },
  {
    title:       'Newcomer Budget Calculator',
    description: 'Plan your first months in Canada',
    icon:        '💰',
    color:       '#1B7A4A',
    href:        '/calculators/newcomer-budget',
  },
  {
    title:       'RRSP Tax Refund Estimator',
    description: 'Estimate federal + provincial tax savings',
    icon:        '🧮',
    color:       '#B8860B',
    href:        '/tools/rrsp-refund',
  },
];

// Category → accent color mapping
const CATEGORY_COLORS: Record<string, string> = {
  Taxes:      '#B8860B',
  Tax:        '#B8860B',
  Saving:     '#2563EB',
  Savings:    '#2563EB',
  Investment: '#2563EB',
  Banking:    '#1B7A4A',
  Benefits:   '#9333EA',
  Housing:    '#C41E3A',
  Credit:     '#1B7A4A',
  Employment: '#9333EA',
};

function categoryColor(cat: string | null): string {
  if (!cat) return '#6B7280';
  return CATEGORY_COLORS[cat] ?? '#6B7280';
}

function formatDate(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-CA', { month: 'short', year: 'numeric' });
}

// ── Props ──────────────────────────────────────────────────────────────────────

interface Props {
  articles: ArticleSummary[];
}

// ── Layer 1: Hero ─────────────────────────────────────────────────────────────

function HeroLayer({ isMobile }: { isMobile: boolean }) {
  return (
    <header
      style={{
        background: 'linear-gradient(165deg, #0F3D3A 0%, #1B5E58 35%, #1B7A4A 100%)',
        padding: isMobile ? '52px 20px 48px' : '80px 24px 72px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Dot pattern overlay */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute', inset: 0, opacity: 0.04,
          backgroundImage:
            'radial-gradient(circle at 20% 50%, #fff 1px, transparent 1px), ' +
            'radial-gradient(circle at 80% 20%, #fff 1px, transparent 1px)',
          backgroundSize: '60px 60px, 40px 40px',
        }}
      />

      <div style={{
        maxWidth: 720, margin: '0 auto', textAlign: 'center',
        position: 'relative', zIndex: 1,
      }}>
        {/* Pill badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: 'rgba(255,255,255,0.12)', borderRadius: 20,
          padding: '6px 16px', marginBottom: 24, backdropFilter: 'blur(8px)',
        }}>
          <MapleLeaf size={14} color="#FF6B6B" />
          <span style={{
            fontSize: 12, color: 'rgba(255,255,255,0.85)',
            fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1,
            fontFamily: "var(--font-dm-sans), Helvetica, sans-serif",
          }}>
            Financial Planning Tool
          </span>
        </div>

        <h1 style={{
          fontFamily: "var(--font-dm-serif), Georgia, serif",
          fontSize: isMobile ? 34 : 52,
          fontWeight: 700, color: '#fff',
          margin: '0 0 18px', lineHeight: 1.12, letterSpacing: -0.5,
        }}>
          Plan Your Financial Life{' '}
          <span style={{ color: '#7DD3A8' }}>in Canada</span>
        </h1>

        <p style={{
          fontSize: isMobile ? 16 : 19, lineHeight: 1.7,
          color: 'rgba(255,255,255,0.78)', margin: '0 auto 32px', maxWidth: 520,
          fontFamily: "var(--font-dm-sans), Helvetica, sans-serif",
        }}>
          Instead of guessing your income, taxes, and living costs in Canada — simulate it in 2 minutes.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <Link
            href="/simulator"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'linear-gradient(135deg, #B8860B, #D4A017)',
              color: '#fff', textDecoration: 'none', fontWeight: 700,
              fontSize: isMobile ? 16 : 17,
              padding: isMobile ? '14px 32px' : '16px 40px',
              borderRadius: 12, boxShadow: '0 4px 20px rgba(184,134,11,0.35)',
              fontFamily: "var(--font-dm-sans), Helvetica, sans-serif",
            }}
          >
            Start My Financial Simulation
            <ArrowRight size={16} />
          </Link>

          <Link
            href="/start-here"
            style={{
              fontSize: 14, color: 'rgba(255,255,255,0.7)',
              textDecoration: 'none', fontWeight: 500,
              fontFamily: "var(--font-dm-sans), Helvetica, sans-serif",
              display: 'inline-flex', alignItems: 'center', gap: 4,
            }}
          >
            Explore newcomer guides
            <ArrowRight size={12} />
          </Link>
        </div>
      </div>
    </header>
  );
}

// ── Layer 2: Trust ────────────────────────────────────────────────────────────

function TrustLayer({ isMobile }: { isMobile: boolean }) {
  return (
    <section
      aria-labelledby="trust-heading"
      style={{
        background: '#fff', borderBottom: '1px solid #E5E7EB',
        padding: isMobile ? '40px 16px' : '64px 24px',
      }}
    >
      <div style={{ maxWidth: 780, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: isMobile ? 28 : 40 }}>
          <h2
            id="trust-heading"
            style={{
              fontFamily: "var(--font-dm-serif), Georgia, serif",
              fontSize: isMobile ? 24 : 32, color: '#1B4F4A',
              margin: '0 0 10px', fontWeight: 700,
            }}
          >
            What You&apos;ll Discover
          </h2>
          <p style={{
            fontSize: 15, color: '#6B7280', margin: '0 auto', maxWidth: 480,
            lineHeight: 1.6, fontFamily: "var(--font-dm-sans), Helvetica, sans-serif",
          }}>
            Our simulator uses official Canadian data to give you a realistic financial picture.
          </p>
        </div>

        {/* Trust checkmarks — 2-col grid, 5th item spans full */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
          gap: isMobile ? 10 : 14,
          marginBottom: isMobile ? 32 : 44,
        }}>
          {TRUST_ITEMS.map((item, i) => (
            <div
              key={item.label}
              style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '16px 20px', background: '#FAFBFC',
                borderRadius: 14, border: '1px solid #E5E7EB',
                gridColumn: !isMobile && i === TRUST_ITEMS.length - 1 ? '1 / -1' : undefined,
                justifyContent: !isMobile && i === TRUST_ITEMS.length - 1 ? 'center' : undefined,
              }}
            >
              <CheckCircle color="#1B7A4A" />
              <div>
                <span style={{
                  fontFamily: "var(--font-dm-sans), Helvetica, sans-serif",
                  fontSize: 15, fontWeight: 600, color: '#1B4F4A',
                }}>
                  {item.label}
                </span>
                <span style={{
                  fontFamily: "var(--font-dm-sans), Helvetica, sans-serif",
                  fontSize: 12, color: '#9CA3AF', marginLeft: 8,
                }}>
                  ({item.source})
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Why trust Maple Insight */}
        <div style={{
          background: '#F8FAF9', borderRadius: 16,
          border: '1px solid #1B7A4A18',
          padding: isMobile ? '24px 20px' : '32px 36px',
          display: 'flex', gap: isMobile ? 16 : 24,
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: isMobile ? 'flex-start' : 'center',
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: '#E8F5EE', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            fontSize: 28, flexShrink: 0,
          }} aria-hidden="true">
            🍁
          </div>
          <div>
            <h3 style={{
              fontFamily: "var(--font-dm-serif), Georgia, serif",
              fontSize: 18, color: '#1B4F4A', margin: '0 0 6px', fontWeight: 700,
            }}>
              Why Trust Maple Insight?
            </h3>
            <p style={{
              fontFamily: "var(--font-dm-sans), Helvetica, sans-serif",
              fontSize: 14, color: '#6B7280', margin: 0, lineHeight: 1.65,
            }}>
              Built by a newcomer who navigated this process firsthand. All calculations use
              published data from the Government of Canada, CRA, Statistics Canada, and CMHC —
              never guesswork.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Layer 3: Education Library ────────────────────────────────────────────────

function LibraryLayer({ articles, isMobile }: { articles: ArticleSummary[]; isMobile: boolean }) {
  return (
    <section
      aria-labelledby="library-heading"
      style={{
        background: '#F3F4F6',
        padding: isMobile ? '40px 16px' : '64px 24px',
      }}
    >
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: isMobile ? 24 : 36 }}>
          <h2
            id="library-heading"
            style={{
              fontFamily: "var(--font-dm-serif), Georgia, serif",
              fontSize: isMobile ? 24 : 30, color: '#1B4F4A',
              margin: '0 0 8px', fontWeight: 700,
            }}
          >
            Learn at Your Own Pace
          </h2>
          <p style={{
            fontSize: 15, color: '#6B7280', margin: 0, lineHeight: 1.6,
            fontFamily: "var(--font-dm-sans), Helvetica, sans-serif",
          }}>
            Articles, calculators, and a glossary — everything you need to understand Canadian finances.
          </p>
        </div>

        {/* Articles */}
        <div style={{ marginBottom: isMobile ? 28 : 40 }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: 16,
          }}>
            <h3 style={{
              fontFamily: "var(--font-dm-serif), Georgia, serif",
              fontSize: 20, color: '#1B4F4A', margin: 0, fontWeight: 700,
            }}>
              Articles
            </h3>
            <Link href="/articles" style={{
              fontSize: 13, color: '#1B7A4A', textDecoration: 'none',
              fontWeight: 600, fontFamily: "var(--font-dm-sans), Helvetica, sans-serif",
              display: 'inline-flex', alignItems: 'center',
            }}>
              View all <ArrowRight size={12} />
            </Link>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
            gap: 14,
          }}>
            {articles.map((article) => {
              const color = categoryColor(article.category);
              return (
                <ArticleCard
                  key={article.slug}
                  title={article.title}
                  category={article.category}
                  date={formatDate(article.publishedAt)}
                  color={color}
                  href={`/articles/${article.slug}`}
                />
              );
            })}
          </div>
        </div>

        {/* Calculators */}
        <div style={{ marginBottom: isMobile ? 28 : 40 }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: 16,
          }}>
            <h3 style={{
              fontFamily: "var(--font-dm-serif), Georgia, serif",
              fontSize: 20, color: '#1B4F4A', margin: 0, fontWeight: 700,
            }}>
              Calculators
            </h3>
            <Link href="/tools" style={{
              fontSize: 13, color: '#1B7A4A', textDecoration: 'none',
              fontWeight: 600, fontFamily: "var(--font-dm-sans), Helvetica, sans-serif",
              display: 'inline-flex', alignItems: 'center',
            }}>
              View all <ArrowRight size={12} />
            </Link>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
            gap: 14,
          }}>
            {CALCULATORS.map((calc) => (
              <CalculatorCard key={calc.href} {...calc} />
            ))}
          </div>
        </div>

        {/* Glossary */}
        <div style={{
          background: '#fff', borderRadius: 14,
          border: '1px solid #E5E7EB',
          padding: isMobile ? '20px' : '24px 32px',
          display: 'flex',
          alignItems: isMobile ? 'flex-start' : 'center',
          gap: 16, flexDirection: isMobile ? 'column' : 'row',
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: '#EFF6FF', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            fontSize: 22, flexShrink: 0,
          }} aria-hidden="true">
            📖
          </div>
          <div style={{ flex: 1 }}>
            <div style={{
              fontFamily: "var(--font-dm-sans), Helvetica, sans-serif",
              fontSize: 16, fontWeight: 600, color: '#1B4F4A', marginBottom: 2,
            }}>
              Financial Glossary
            </div>
            <div style={{
              fontSize: 13, color: '#6B7280', lineHeight: 1.5,
              fontFamily: "var(--font-dm-sans), Helvetica, sans-serif",
            }}>
              RRSP, TFSA, FHSA, CCB, CRA… Understand every Canadian financial term in plain language.
            </div>
          </div>
          <Link
            href="/glossary"
            style={{
              background: '#2563EB', color: '#fff', textDecoration: 'none',
              fontWeight: 700, fontSize: 13, padding: '10px 22px',
              borderRadius: 10, whiteSpace: 'nowrap',
              display: 'inline-flex', alignItems: 'center', gap: 6,
              fontFamily: "var(--font-dm-sans), Helvetica, sans-serif",
              flexShrink: 0,
            }}
          >
            Browse Glossary <ArrowRight size={12} />
          </Link>
        </div>
      </div>
    </section>
  );
}

// ── Article card (hover state managed locally) ────────────────────────────────

function ArticleCard({
  title, category, date, color, href,
}: {
  title: string; category: string | null; date: string; color: string; href: string;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <Link
      href={href}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: '#fff', borderRadius: 14,
        border: '1px solid #E5E7EB', padding: '20px',
        textDecoration: 'none', display: 'block',
        boxShadow: hovered ? '0 4px 16px rgba(0,0,0,0.08)' : 'none',
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
        transition: 'box-shadow 0.2s, transform 0.15s',
      }}
    >
      {category && (
        <div style={{
          display: 'inline-block', fontSize: 11, fontWeight: 700,
          color, background: `${color}10`,
          border: `1px solid ${color}20`,
          borderRadius: 6, padding: '3px 10px', marginBottom: 10,
          fontFamily: "var(--font-dm-sans), Helvetica, sans-serif",
          textTransform: 'uppercase', letterSpacing: 0.5,
        }}>
          {category}
        </div>
      )}
      <div style={{
        fontFamily: "var(--font-dm-sans), Helvetica, sans-serif",
        fontSize: 15, fontWeight: 600, color: '#1B4F4A', lineHeight: 1.4, marginBottom: 8,
      }}>
        {title}
      </div>
      {date && (
        <div style={{
          fontSize: 12, color: '#9CA3AF',
          fontFamily: "var(--font-dm-sans), Helvetica, sans-serif",
        }}>
          {date}
        </div>
      )}
    </Link>
  );
}

// ── Calculator card (hover state managed locally) ─────────────────────────────

function CalculatorCard({
  title, description, icon, color, href,
}: {
  title: string; description: string; icon: string; color: string; href: string;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <Link
      href={href}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: '#fff', borderRadius: 14,
        border: `1px solid ${color}18`, padding: '20px',
        textDecoration: 'none', display: 'flex',
        alignItems: 'flex-start', gap: 14,
        boxShadow: hovered ? `0 4px 16px ${color}12` : 'none',
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
        transition: 'box-shadow 0.2s, transform 0.15s',
      }}
    >
      <div style={{
        width: 42, height: 42, borderRadius: 12,
        background: `${color}10`, display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        fontSize: 20, flexShrink: 0,
      }} aria-hidden="true">
        {icon}
      </div>
      <div>
        <div style={{
          fontFamily: "var(--font-dm-sans), Helvetica, sans-serif",
          fontSize: 15, fontWeight: 600, color: '#1B4F4A', marginBottom: 4,
        }}>
          {title}
        </div>
        <div style={{
          fontSize: 13, color: '#6B7280', lineHeight: 1.5,
          fontFamily: "var(--font-dm-sans), Helvetica, sans-serif",
        }}>
          {description}
        </div>
      </div>
    </Link>
  );
}

// ── Root component ────────────────────────────────────────────────────────────

export function HomepageFunnel({ articles }: Props) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#FAFBFC' }}>
      <HeroLayer isMobile={isMobile} />
      <TrustLayer isMobile={isMobile} />
      <LibraryLayer articles={articles} isMobile={isMobile} />
      <NewsletterInline />
    </div>
  );
}
