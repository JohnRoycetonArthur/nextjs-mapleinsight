"use client";

import { type ReactNode, useState, useEffect } from "react";
import Link from "next/link";
import { ArticleFull } from "@/sanity/queries";
import { SettlementSessionProvider } from "@/components/settlement-planner/SettlementSessionContext";
import { WizardShell } from "@/components/settlement-planner/wizard/WizardShell";
import {
  Analytics,
  ArrowRightAlt,
  Checklist,
  Close,
  Description,
  Explore,
  FamilyGroup,
  Gavel,
  Groups,
  HomeWork,
  OpenInFull,
  Payments,
  QueryStats,
  Savings,
  Schedule,
  School,
  ShieldLock,
  TaskAlt,
  TravelLuggageAndBags,
} from "@material-symbols-svg/react";

// ─── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  forest: "#1B4F4A",
  accent: "#1B7A4A",
  gold: "#B8860B",
  red: "#C41E3A",
  blue: "#2563EB",
  purple: "#9333EA",
  gray: "#6B7280",
  lightGray: "#F3F4F6",
  border: "#E5E7EB",
  white: "#FFFFFF",
  text: "#374151",
  textDark: "#111827",
  textLight: "#9CA3AF",
  bg: "#FAFBFC",
};
const font = "var(--font-dm-sans, 'DM Sans', Helvetica, sans-serif)";
const serif = "var(--font-dm-serif, 'DM Serif Display', Georgia, serif)";

// ─── Static data ────────────────────────────────────────────────────────────────

const TOC_SECTIONS = [
  { id: "quick-answer",  label: "The Quick Answer" },
  { id: "pathways",      label: "By Immigration Pathway" },
  { id: "proof-of-funds", label: "IRCC Proof of Funds" },
  { id: "hidden-costs",  label: "Costs Most People Miss" },
  { id: "your-plan",     label: "Get Your Free Plan" },
  { id: "your-report",   label: "Your Report" },
  { id: "faq",           label: "FAQ" },
];

const IRCC_FUNDS = [
  { members: 1, amount: 14690 },
  { members: 2, amount: 18288 },
  { members: 3, amount: 22483 },
  { members: 4, amount: 27315 },
  { members: 5, amount: 30980 },
  { members: 6, amount: 34924 },
  { members: 7, amount: 38892 },
];

const PATHWAY_DATA = [
  {
    id: "express-entry",
    title: "Express Entry",
    subtitle: "Skilled workers & professionals",
    icon: <TravelLuggageAndBags size={24} color={C.accent} />,
    color: C.accent,
    lightColor: "#E8F5EE",
    range: "$15,000 – $35,000+",
    includes: [
      "IRCC proof of funds",
      "Application & biometrics fees",
      "3–6 months living expenses",
      "Housing deposit",
      "Travel costs",
    ],
    articles: [
      { title: "Express Entry Proof of Funds Explained", slug: "express-entry-proof-of-funds" },
      { title: "How to Improve Your CRS Score", slug: "improve-crs-score" },
    ],
  },
  {
    id: "study-permit",
    title: "Study Permit",
    subtitle: "International students",
    icon: <School size={24} color={C.blue} />,
    color: C.blue,
    lightColor: "#EFF6FF",
    range: "$25,000 – $70,000+",
    includes: [
      "First-year tuition",
      "GIC ($22,895)",
      "Living expense proof",
      "Health insurance",
      "Study permit fees",
    ],
    articles: [
      { title: "What is a GIC? Complete Guide", slug: "what-is-a-gic-canada" },
      { title: "Study Permit Proof of Funds", slug: "study-permit-proof-of-funds" },
    ],
  },
  {
    id: "family-sponsorship",
    title: "Family Sponsorship",
    subtitle: "Sponsor your loved ones",
    icon: <FamilyGroup size={24} color={C.purple} />,
    color: C.purple,
    lightColor: "#F5F0FF",
    range: "$18,000 – $45,000+",
    includes: [
      "Sponsorship fees",
      "Scaled proof of funds",
      "Housing for family size",
      "Provincial health coverage gap",
      "Setup costs × family members",
    ],
    articles: [
      { title: "Sponsoring Family Members — Financial Requirements", slug: "sponsoring-family-members-financial-requirements" },
      { title: "Canada Child Benefit (CCB) Guide", slug: "canada-child-benefit-ccb-guide" },
    ],
  },
  {
    id: "pnp",
    title: "Provincial Nominee",
    subtitle: "PNP pathways",
    icon: <Gavel size={24} color={C.gold} />,
    color: C.gold,
    lightColor: "#FDF6E3",
    range: "$15,000 – $40,000+",
    includes: [
      "Provincial application fees",
      "Federal PR fees",
      "Proof of funds (varies)",
      "Relocation to nominee province",
      "Cost of living varies widely",
    ],
    articles: [
      { title: "Provincial Nominee Programs Overview", slug: "pnp-overview" },
      { title: "Cost of Living Across Canadian Provinces", slug: "cost-of-living-canada-city-comparison" },
    ],
  },
];

const HIDDEN_COSTS = [
  { icon: <TravelLuggageAndBags size={22} color={C.accent} />, title: "Winter clothing", range: "$500 – $1,500", note: "Essential if arriving Oct–Apr. Don't buy at home — wait for Canadian prices." },
  { icon: <Description size={22} color={C.gold} />, title: "Credential evaluation", range: "$200 – $500", note: "WES or IQAS assessment for your degrees. Required for most immigration programs." },
  { icon: <ShieldLock size={22} color={C.red} />, title: "Health insurance gap", range: "$75 – $250/mo", note: "Some provinces have a 3-month wait for coverage. You'll need private insurance." },
  { icon: <HomeWork size={22} color={C.purple} />, title: "Rental deposit", range: "1–2 months rent", note: "Most landlords require first and last month's rent upfront." },
  { icon: <Payments size={22} color={C.blue} />, title: "Phone & internet setup", range: "$60 – $120/mo", note: "Canadian telecom is expensive. Compare plans before committing." },
  { icon: <Explore size={22} color={C.accent} />, title: "Transit pass", range: "$100 – $170/mo", note: "Monthly passes vary by city. Toronto TTC: $156. Vancouver TransLink: $104–$181." },
];

const RELATED_ARTICLES = [
  { title: "Opening a Newcomer Bank Account",          slug: "opening-a-newcomer-bank-account",  category: "Banking",  color: C.accent },
  { title: "Understanding Canadian Credit Scores",     slug: "understanding-canadian-credit-scores", category: "Banking", color: C.accent },
  { title: "Your First Canadian Tax Return",           slug: "your-first-canadian-tax-return",  category: "Taxes",    color: C.gold   },
  { title: "TFSA Explained for Newcomers",             slug: "tfsa-explained-for-newcomers",    category: "Saving",   color: C.blue   },
  { title: "Renting vs Buying in Canada",              slug: "renting-vs-buying-in-canada",     category: "Housing",  color: C.purple },
  { title: "Provincial Health Insurance Guide",        slug: "provincial-health-insurance", category: "Benefits", color: C.red },
];

// ─── Icons ──────────────────────────────────────────────────────────────────────

const MapleLeaf = ({ size = 16, color = C.red }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden="true">
    <path d="M12 0L13.5 6.5L17 4L15.5 8.5L22 9L17 12L20 16L14 14L12 24L10 14L4 16L7 12L2 9L8.5 8.5L7 4L10.5 6.5Z" />
  </svg>
);

const ChevDown = ({ open, size = 20 }: { open: boolean; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
    style={{ transform: open ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.3s ease", flexShrink: 0 }}>
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const ArrowRight = ({ size = 14 }: { size?: number }) => (
  <ArrowRightAlt size={size} color="currentColor" aria-hidden="true" />
);

const CheckCircle = ({ color = C.accent }: { color?: string }) => (
  <TaskAlt size={16} color={color} aria-hidden="true" style={{ flexShrink: 0, marginTop: 2 }} />
);

const BookIcon = () => (
  <Description size={14} color="currentColor" aria-hidden="true" />
);

const BarChartIcon = () => (
  <Analytics size={18} color="currentColor" aria-hidden="true" />
);

const SparkleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 2l2.09 6.26L20 10l-5.91 1.74L12 18l-2.09-6.26L4 10l5.91-1.74z" />
  </svg>
);

const ClockIcon = () => (
  <Schedule size={14} color="currentColor" aria-hidden="true" />
);

// ─── Sub-components ─────────────────────────────────────────────────────────────

function Pill({ children, color = C.accent, bg: bgColor, small }: {
  children: React.ReactNode; color?: string; bg?: string; small?: boolean;
}) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: small ? "2px 8px" : "4px 12px",
      borderRadius: 100,
      background: bgColor || `${color}12`,
      color,
      fontSize: small ? 11 : 12,
      fontWeight: 600,
      fontFamily: font,
      letterSpacing: 0.3,
      lineHeight: 1.4,
      whiteSpace: "nowrap",
    }}>
      {children}
    </span>
  );
}

function SectionHeader({ id, number, title, subtitle }: {
  id?: string; number?: string; title: string; subtitle?: string;
}) {
  return (
    <div id={id} style={{ scrollMarginTop: 80, marginBottom: 28 }}>
      {number && (
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <span style={{ fontFamily: font, fontSize: 12, fontWeight: 700, color: C.accent, textTransform: "uppercase", letterSpacing: 1.5 }}>
            Section {number}
          </span>
          <span style={{ width: 40, height: 2, background: `linear-gradient(90deg, ${C.accent}, transparent)`, borderRadius: 1, display: "inline-block" }} />
        </div>
      )}
      <h2 style={{ fontFamily: serif, fontSize: 28, fontWeight: 400, color: C.forest, margin: "0 0 6px", lineHeight: 1.25 }}>
        {title}
      </h2>
      {subtitle && (
        <p style={{ fontFamily: font, fontSize: 15, color: C.gray, margin: 0, lineHeight: 1.5 }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

function ArticleLink({ title, slug, category, color = C.accent }: {
  title: string; slug: string; category?: string; color?: string;
}) {
  const [hov, setHov] = useState(false);
  return (
    <Link href={`/articles/${slug}`} style={{
      display: "flex", alignItems: "center", gap: 12,
      padding: "12px 16px", borderRadius: 12,
      background: hov ? `${color}08` : "transparent",
      border: `1px solid ${hov ? `${color}30` : C.border}`,
      textDecoration: "none",
      transition: "all 0.2s ease",
    }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      <div style={{ width: 32, height: 32, borderRadius: 8, background: `${color}12`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color }}>
        <BookIcon />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: font, fontSize: 14, fontWeight: 600, color: C.textDark, lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {title}
        </div>
        {category && <div style={{ fontFamily: font, fontSize: 11, color: C.textLight, marginTop: 2 }}>{category}</div>}
      </div>
      <div style={{ color, transition: "transform 0.2s", transform: hov ? "translateX(3px)" : "translateX(0)" }}>
        <ArrowRight size={14} />
      </div>
    </Link>
  );
}

function PathwayCard({ data }: { data: typeof PATHWAY_DATA[0] }) {
  const [hov, setHov] = useState(false);
  const [expanded, setExpanded] = useState(false);
  return (
    <div style={{
      borderRadius: 16,
      border: `1px solid ${hov ? data.color + "40" : C.border}`,
      background: C.white, overflow: "hidden",
      transition: "all 0.25s ease",
      boxShadow: hov ? `0 8px 30px ${data.color}12` : "0 1px 3px rgba(0,0,0,0.04)",
    }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      <div style={{ padding: "20px 22px 16px", background: `linear-gradient(135deg, ${data.lightColor}, ${C.white})` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{data.icon}</span>
          <div>
            <h3 style={{ fontFamily: serif, fontSize: 18, color: C.forest, margin: 0, lineHeight: 1.2 }}>{data.title}</h3>
            <span style={{ fontFamily: font, fontSize: 12, color: C.gray }}>{data.subtitle}</span>
          </div>
        </div>
        <div style={{ fontFamily: serif, fontSize: 26, color: data.color, marginTop: 8, lineHeight: 1 }}>{data.range}</div>
        <div style={{ fontFamily: font, fontSize: 12, color: C.textLight, marginTop: 4 }}>Typical total cost range (CAD)</div>
      </div>

      <div style={{ padding: "0 22px 16px" }}>
        <button onClick={() => setExpanded(!expanded)} style={{
          background: "none", border: "none", cursor: "pointer",
          fontFamily: font, fontSize: 13, fontWeight: 600, color: data.color,
          padding: "8px 0", display: "flex", alignItems: "center", gap: 6,
        }}>
          What&apos;s included <ChevDown open={expanded} size={14} />
        </button>
        <div style={{ maxHeight: expanded ? 300 : 0, overflow: "hidden", transition: "max-height 0.3s ease" }}>
          <ul style={{ listStyle: "none", padding: 0, margin: "4px 0 12px" }}>
            {data.includes.map((item, i) => (
              <li key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", fontFamily: font, fontSize: 13, color: C.text }}>
                <CheckCircle color={data.color} />{item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div style={{ padding: "0 22px 18px" }}>
        {data.articles.map((a, i) => (
          <Link key={i} href={`/articles/${a.slug}`} style={{
            display: "flex", alignItems: "center", gap: 6,
            fontFamily: font, fontSize: 13, color: data.color,
            textDecoration: "none", padding: "4px 0", opacity: 0.85,
          }}>
            <BookIcon /> {a.title} →
          </Link>
        ))}
      </div>
    </div>
  );
}

function FAQItem({ q, a, open, onToggle }: { q: string; a: string; open: boolean; onToggle: () => void }) {
  return (
    <div style={{ borderBottom: `1px solid ${C.border}` }}>
      <button onClick={onToggle} style={{
        width: "100%", border: "none", background: "transparent",
        padding: "20px 0", cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16,
        textAlign: "left",
      }}>
        <span style={{ fontFamily: font, fontSize: 16, fontWeight: 600, color: open ? C.forest : C.text, lineHeight: 1.4, transition: "color 0.2s" }}>
          {q}
        </span>
        <ChevDown open={open} size={18} />
      </button>
      <div style={{ maxHeight: open ? 300 : 0, overflow: "hidden", transition: "max-height 0.35s ease" }}>
        <p style={{ fontFamily: font, fontSize: 15, lineHeight: 1.7, color: C.gray, margin: 0, paddingBottom: 20 }}>{a}</p>
      </div>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────────

interface Props {
  article: ArticleFull;
  readingTime: number;
}

export function PillarArticlePage({ article, readingTime }: Props) {
  const [scrollPct, setScrollPct] = useState(0);
  const [activeSection, setActiveSection] = useState("quick-answer");
  const [faqOpen, setFaqOpen] = useState<Record<number, boolean>>({});
  const [wizardStarted, setWizardStarted] = useState(false);
  const [plannerExpanded, setPlannerExpanded] = useState(false);
  const [tocOpen, setTocOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 900);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      setScrollPct(h > 0 ? (window.scrollY / h) * 100 : 0);
      for (const s of [...TOC_SECTIONS].reverse()) {
        const el = document.getElementById(s.id);
        if (el && el.getBoundingClientRect().top <= 120) {
          setActiveSection(s.id);
          break;
        }
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!plannerExpanded) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [plannerExpanded]);

  const faqItems = article.faqItems ?? [];
  const toggleFaq = (i: number) => setFaqOpen((p) => ({ ...p, [i]: !p[i] }));

  return (
    <div style={{ background: C.bg, minHeight: "100vh" }}>
      {/* Reading progress */}
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: 3, zIndex: 100, background: C.border }}>
        <div style={{ height: "100%", width: `${scrollPct}%`, background: `linear-gradient(90deg, ${C.accent}, ${C.blue})`, transition: "width 0.1s linear" }} />
      </div>

      {/* ─── Hero ─── */}
      <header style={{
        padding: "60px 24px 50px",
        background: `linear-gradient(170deg, ${C.forest} 0%, #153D39 60%, #0F2B28 100%)`,
        position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", top: -80, right: -80, width: 350, height: 350, borderRadius: "50%", background: `radial-gradient(circle, ${C.accent}15, transparent 70%)` }} />
        <div style={{ position: "absolute", bottom: -60, left: -60, width: 250, height: 250, borderRadius: "50%", background: `radial-gradient(circle, ${C.gold}10, transparent 70%)` }} />

        <div style={{ maxWidth: 720, margin: "0 auto", position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
            <Pill color={C.gold} bg={`${C.gold}20`}>
              <MapleLeaf size={12} color={C.gold} /> Immigration Guide
            </Pill>
            <span style={{ fontFamily: font, fontSize: 12, color: "#ffffff80", display: "flex", alignItems: "center", gap: 4 }}>
              <ClockIcon /> {readingTime} min read
            </span>
          </div>

          <h1 style={{ fontFamily: serif, fontSize: isMobile ? 32 : 42, fontWeight: 400, color: C.white, margin: "0 0 16px", lineHeight: 1.15 }}>
            Are You Financially Ready{" "}
            <span style={{ background: `linear-gradient(135deg, ${C.gold}, #D4A017)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              to Move to Canada?
            </span>
          </h1>

          <p style={{ fontFamily: font, fontSize: 18, color: "#ffffffCC", lineHeight: 1.6, margin: "0 0 28px", maxWidth: 580 }}>
            The complete 2026 breakdown — real government data, every pathway, your exact cost. Not a guess. A plan.
          </p>

          <div style={{
            background: "rgba(255,255,255,0.07)", backdropFilter: "blur(10px)",
            border: "1px solid rgba(255,255,255,0.12)", borderRadius: 14, padding: "18px 22px",
            display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap",
          }}>
            <div>
              <div style={{ fontFamily: font, fontSize: 12, color: "#ffffff80", marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>Quick answer</div>
              <div style={{ fontFamily: serif, fontSize: 22, color: C.white }}>$14,690 – $70,000+ CAD</div>
              <div style={{ fontFamily: font, fontSize: 13, color: "#ffffff90", marginTop: 2 }}>Depending on pathway, family size, and city</div>
            </div>
            <a href="#your-plan" style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "12px 24px", borderRadius: 100,
              background: `linear-gradient(135deg, ${C.gold}, #D4A017)`,
              color: C.white, fontFamily: font, fontSize: 14, fontWeight: 700,
              textDecoration: "none", boxShadow: `0 4px 20px ${C.gold}40`, whiteSpace: "nowrap",
            }}>
              <SparkleIcon /> Get My Exact Number
            </a>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 24, flexWrap: "wrap" }}>
            <span style={{ fontFamily: font, fontSize: 12, color: "#ffffff60" }}>Updated April 2026</span>
            <span style={{ fontFamily: font, fontSize: 12, color: "#ffffff60" }}>Sources: IRCC · CMHC · CRA · ESDC</span>
            <Pill color="#fff" bg="rgba(255,255,255,0.1)" small>No AI — 100% Government Data</Pill>
          </div>
        </div>
      </header>

      {/* ─── Content layout ─── */}
      <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", gap: 40, padding: "0 24px", alignItems: "flex-start" }}>

        {/* Sticky TOC — desktop only */}
        {!isMobile && (
          <nav style={{ width: 200, flexShrink: 0, position: "sticky", top: 40, paddingTop: 40 }}>
            <div style={{ fontFamily: font, fontSize: 11, fontWeight: 700, color: C.textLight, textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 12 }}>
              Contents
            </div>
            {TOC_SECTIONS.map((s) => (
              <a key={s.id} href={`#${s.id}`} style={{
                display: "block", padding: "7px 12px", borderRadius: 8,
                fontFamily: font, fontSize: 13,
                color: activeSection === s.id ? C.forest : C.gray,
                fontWeight: activeSection === s.id ? 600 : 400,
                background: activeSection === s.id ? `${C.accent}08` : "transparent",
                textDecoration: "none",
                borderLeft: `2px solid ${activeSection === s.id ? C.accent : "transparent"}`,
                transition: "all 0.2s",
                marginBottom: 2,
              }}>
                {s.label}
              </a>
            ))}
          </nav>
        )}

        {/* ─── Article ─── */}
        <article style={{ flex: 1, minWidth: 0, padding: "40px 0 80px" }}>

          {/* Mobile TOC */}
          {isMobile && (
            <div style={{ position: "sticky", top: 4, zIndex: 50, marginBottom: 24 }}>
              <button onClick={() => setTocOpen(!tocOpen)} style={{
                width: "100%", padding: "10px 16px", borderRadius: 12, border: `1px solid ${C.border}`,
                background: C.white, cursor: "pointer", fontFamily: font, fontSize: 13, fontWeight: 600, color: C.forest,
                display: "flex", alignItems: "center", justifyContent: "space-between",
                boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
              }}>
                <span>📑 Jump to section</span>
                <ChevDown open={tocOpen} size={16} />
              </button>
              {tocOpen && (
                <div style={{ marginTop: 4, borderRadius: 12, border: `1px solid ${C.border}`, background: C.white, boxShadow: "0 8px 30px rgba(0,0,0,0.08)", overflow: "hidden" }}>
                  {TOC_SECTIONS.map((s) => (
                    <a key={s.id} href={`#${s.id}`} onClick={() => setTocOpen(false)} style={{
                      display: "block", padding: "12px 16px", fontFamily: font, fontSize: 14, color: C.text,
                      textDecoration: "none", borderBottom: `1px solid ${C.border}40`,
                      background: activeSection === s.id ? `${C.accent}06` : "transparent",
                    }}>
                      {s.label}
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ══ Section 1: Quick Answer ══ */}
          <SectionHeader id="quick-answer" number="01" title="The Short Answer" subtitle="What you need to know in 60 seconds" />
          <p style={{ fontFamily: font, fontSize: 16, lineHeight: 1.75, color: C.text, margin: "0 0 20px" }}>
            Most people moving to Canada need somewhere between <strong>$15,000 and $70,000+ CAD</strong>, depending on three factors: your immigration pathway, your family size, and where in Canada you&apos;re headed. That&apos;s a big range — so let&apos;s break it down.
          </p>
          <p style={{ fontFamily: font, fontSize: 16, lineHeight: 1.75, color: C.text, margin: "0 0 20px" }}>
            The Canadian government (IRCC) sets minimum proof-of-funds requirements that you <em>must</em> meet to be approved. But those minimums cover just the paperwork. The real cost of actually settling — rent deposits, transit, groceries, winter gear — is usually 30–60% higher.
          </p>

          <div style={{ margin: "28px 0 36px", padding: "24px", borderRadius: 16, background: `linear-gradient(135deg, ${C.accent}06, ${C.blue}04)`, border: `1px solid ${C.accent}15` }}>
            <div style={{ fontFamily: font, fontSize: 12, fontWeight: 700, color: C.accent, textTransform: "uppercase", letterSpacing: 1, marginBottom: 16 }}>
              Cost at a Glance (2026 CAD)
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 16 }}>
              {[
                { label: "Single adult",  value: "$15K–$30K",  sub: "Express Entry" },
                { label: "Couple",        value: "$20K–$45K",  sub: "Express Entry" },
                { label: "Family of 4",   value: "$30K–$55K",  sub: "Express Entry" },
                { label: "Student",       value: "$25K–$70K+", sub: "Study Permit"  },
              ].map((item, i) => (
                <div key={i} style={{ padding: "14px 16px", borderRadius: 12, background: C.white, border: `1px solid ${C.border}` }}>
                  <div style={{ fontFamily: font, fontSize: 12, color: C.textLight, marginBottom: 4 }}>{item.label}</div>
                  <div style={{ fontFamily: serif, fontSize: 20, color: C.forest }}>{item.value}</div>
                  <div style={{ fontFamily: font, fontSize: 11, color: C.gray, marginTop: 2 }}>{item.sub}</div>
                </div>
              ))}
            </div>
            <div style={{ fontFamily: font, fontSize: 12, color: C.textLight, marginTop: 14, paddingTop: 14, borderTop: `1px solid ${C.border}` }}>
              Based on IRCC proof-of-funds requirements + CMHC rental market data + average settlement costs.{" "}
              <a href="#your-plan" style={{ color: C.accent, fontWeight: 600 }}>Get your exact number below</a>.
            </div>
          </div>

          <p style={{ fontFamily: font, fontSize: 16, lineHeight: 1.75, color: C.text, margin: "0 0 20px" }}>
            Generic cost estimates are everywhere online. But <strong>your</strong> situation isn&apos;t generic. That&apos;s why we built the{" "}
            <a href="#your-plan" style={{ color: C.accent }}>Settlement Planner</a> — it calculates your exact financial readiness based on your real inputs and real government data.
          </p>

          {/* ══ Section 2: By Pathway ══ */}
          <div style={{ height: 1, background: C.border, margin: "48px 0" }} />
          <SectionHeader id="pathways" number="02" title="Cost by Immigration Pathway" subtitle="Your pathway determines your minimum requirements" />
          <p style={{ fontFamily: font, fontSize: 16, lineHeight: 1.75, color: C.text, margin: "0 0 28px" }}>
            Not all pathways cost the same. A student permit applicant faces tuition plus a mandatory GIC deposit, while an Express Entry applicant needs proof of liquid funds. Here&apos;s how each pathway breaks down.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(280px, 1fr))", gap: 20, margin: "0 0 40px" }}>
            {PATHWAY_DATA.map((p) => <PathwayCard key={p.id} data={p} />)}
          </div>

          {/* ══ Section 3: Proof of Funds ══ */}
          <div style={{ height: 1, background: C.border, margin: "48px 0" }} />
          <SectionHeader id="proof-of-funds" number="03" title="IRCC Proof of Funds Requirements" subtitle="The official minimums you must prove to immigration" />
          <p style={{ fontFamily: font, fontSize: 16, lineHeight: 1.75, color: C.text, margin: "0 0 20px" }}>
            The Immigration, Refugees and Citizenship Canada (IRCC) requires you to show you have enough money to support yourself and your family. These are the <strong>minimum</strong> amounts — your actual costs will be higher.
          </p>

          <div style={{ margin: "32px 0", borderRadius: 14, overflow: "hidden", border: `1px solid ${C.border}`, background: C.white }}>
            <div style={{ padding: "16px 20px", background: C.lightGray, borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
              <span style={{ fontFamily: serif, fontSize: 15, color: C.forest }}>Minimum Proof of Funds by Family Size (2026)</span>
              <a href="https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/documents/proof-funds.html"
                target="_blank" rel="noopener noreferrer"
                style={{ fontFamily: font, fontSize: 11, color: C.textLight, textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
                Source: IRCC ↗
              </a>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["Family Size", "Minimum Required (CAD)"].map((h, i) => (
                    <th key={i} style={{ fontFamily: font, fontSize: 12, fontWeight: 700, color: C.textLight, textTransform: "uppercase", letterSpacing: 0.8, padding: "12px 20px", textAlign: i === 0 ? "left" : "right", borderBottom: `1px solid ${C.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {IRCC_FUNDS.map((row, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? "transparent" : `${C.lightGray}60` }}>
                    <td style={{ fontFamily: font, fontSize: 14, color: C.text, padding: "12px 20px", borderBottom: `1px solid ${C.border}40` }}>
                      {row.members} {row.members === 1 ? "person" : "people"}
                    </td>
                    <td style={{ fontFamily: font, fontSize: 14, fontWeight: 600, color: C.forest, padding: "12px 20px", textAlign: "right", borderBottom: `1px solid ${C.border}40` }}>
                      ${row.amount.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ padding: "10px 20px", background: `${C.gold}08`, fontFamily: font, fontSize: 12, color: C.gray, lineHeight: 1.5, borderTop: `1px solid ${C.border}40` }}>
              For each additional family member beyond 7, add $3,492. Amounts updated annually by IRCC based on 50% of the Low Income Cut-Off (LICO).
            </div>
          </div>

          <p style={{ fontFamily: font, fontSize: 16, lineHeight: 1.75, color: C.text, margin: "0 0 24px" }}>
            Important: these are <em>proof of funds</em> requirements — the money you need to show on paper. Your actual <em>settlement costs</em> will typically be 30–60% higher. That&apos;s exactly what the <a href="#your-plan" style={{ color: C.accent }}>Settlement Planner</a> calculates for you.
          </p>
          <div style={{ margin: "24px 0", display: "grid", gap: 8 }}>
            <ArticleLink title="Express Entry Proof of Funds Explained" slug="express-entry-proof-of-funds" category="Immigration" color={C.accent} />
            <ArticleLink title="Study Permit Proof of Funds (Different Rules)" slug="study-permit-proof-of-funds" category="Immigration" color={C.blue} />
          </div>

          {/* ══ Section 4: Hidden Costs ══ */}
          <div style={{ height: 1, background: C.border, margin: "48px 0" }} />
          <SectionHeader id="hidden-costs" number="04" title="The Costs Most People Forget" subtitle="Budget for these before you land" />
          <p style={{ fontFamily: font, fontSize: 16, lineHeight: 1.75, color: C.text, margin: "0 0 24px" }}>
            Beyond IRCC requirements and rent, there&apos;s a long list of expenses that catch newcomers off guard. These aren&apos;t optional — they&apos;re the real costs of starting a life in Canada.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(260px, 1fr))", gap: 14, margin: "0 0 36px" }}>
            {HIDDEN_COSTS.map((cost, i) => (
              <div key={i} style={{ padding: "18px 20px", borderRadius: 14, background: C.white, border: `1px solid ${C.border}`, display: "flex", gap: 14 }}>
                <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", lineHeight: 1 }}>{cost.icon}</span>
                <div>
                  <div style={{ fontFamily: font, fontSize: 14, fontWeight: 600, color: C.textDark, marginBottom: 2 }}>{cost.title}</div>
                  <div style={{ fontFamily: serif, fontSize: 16, color: C.forest, marginBottom: 4 }}>{cost.range}</div>
                  <div style={{ fontFamily: font, fontSize: 12, color: C.gray, lineHeight: 1.5 }}>{cost.note}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ padding: "20px", borderRadius: 14, background: `${C.gold}06`, border: `1px solid ${C.gold}15`, marginBottom: 8 }}>
            <div style={{ fontFamily: font, fontSize: 12, fontWeight: 700, color: C.gold, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>Deep Dive Articles</div>
            <div style={{ display: "grid", gap: 8 }}>
              <ArticleLink title="Setting Up Phone & Internet Plans" slug="phone-internet-plans" category="Getting Started" color={C.gold} />
              <ArticleLink title="Provincial Health Insurance Guide" slug="provincial-health-insurance" category="Benefits" color={C.gold} />
              <ArticleLink title="Opening a Newcomer Bank Account" slug="opening-a-newcomer-bank-account" category="Banking" color={C.gold} />
            </div>
          </div>

          {/* ══ Section 5: Your Plan ══ */}
          <div style={{ height: 1, background: C.border, margin: "48px 0" }} />
          <SectionHeader id="your-plan" number="05" title="Get Your Personalized Settlement Plan" subtitle="Free. No signup. Based on government data." />
          <p style={{ fontFamily: font, fontSize: 16, lineHeight: 1.75, color: C.text, margin: "0 0 24px" }}>
            Everything above gives you a range. But you need a number — <strong>your</strong> number. The Settlement Planner takes your specific situation and calculates exactly how much money you need, where the gaps are, and what to do about them.
          </p>

          {/* ── Tool embed ── */}
          <div id="settlement-planner-widget" style={{
            margin: plannerExpanded ? 0 : "40px 0",
            borderRadius: plannerExpanded ? 0 : 16,
            border: `2px solid ${C.accent}25`,
            background: C.white,
            overflow: "hidden",
            boxShadow: plannerExpanded ? "0 24px 80px rgba(15,61,58,0.24)" : "0 4px 24px rgba(27,79,74,0.06)",
            position: plannerExpanded ? "fixed" : "relative",
            inset: plannerExpanded ? 0 : undefined,
            zIndex: plannerExpanded ? 220 : undefined,
            display: "flex",
            flexDirection: "column",
          }}>
            <div id="settlement-planner-widget-header" style={{
              padding: "20px 24px",
              background: `linear-gradient(135deg, ${C.accent}08, ${C.accent}03)`,
              borderBottom: `1px solid ${C.accent}15`,
              display: "flex",
              alignItems: "center",
              gap: 12,
              position: plannerExpanded ? "sticky" : "relative",
              top: 0,
              zIndex: 2,
            }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: `${C.accent}15`, display: "flex", alignItems: "center", justifyContent: "center", color: C.accent }}>
                <BarChartIcon />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: serif, fontSize: 17, fontWeight: 400, color: C.forest, lineHeight: 1.3 }}>Settlement Planner</div>
                <div style={{ fontFamily: font, fontSize: 13, color: C.gray, marginTop: 2 }}>Answer 6 quick questions to get your personalized plan</div>
              </div>
              <Pill color={C.accent} small>Interactive</Pill>
              {wizardStarted && (
                <button
                  type="button"
                  onClick={() => setPlannerExpanded((current) => !current)}
                  aria-label={plannerExpanded ? "Close fullscreen planner" : "Expand planner"}
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    border: `1px solid ${plannerExpanded ? `${C.red}25` : `${C.accent}20`}`,
                    background: plannerExpanded ? `${C.red}10` : `${C.accent}10`,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    flexShrink: 0,
                  }}
                >
                  {plannerExpanded ? <Close size={20} color={C.red} /> : <OpenInFull size={18} color={C.accent} />}
                </button>
              )}
            </div>

            <div style={{ padding: plannerExpanded ? (isMobile ? "16px" : "24px") : "24px", flex: 1, overflowY: plannerExpanded ? "auto" : "visible" }}>
              {!wizardStarted ? (
                <div style={{ textAlign: "center", padding: "32px 0" }}>
                  <div style={{ width: 80, height: 80, borderRadius: 20, background: `linear-gradient(135deg, ${C.accent}15, ${C.blue}10)`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                    <Analytics size={36} color={C.accent} />
                  </div>
                  <h3 style={{ fontFamily: serif, fontSize: 22, color: C.forest, margin: "0 0 8px" }}>Ready to find out your number?</h3>
                  <p style={{ fontFamily: font, fontSize: 15, color: C.gray, margin: "0 0 24px", maxWidth: 420, marginLeft: "auto", marginRight: "auto", lineHeight: 1.6 }}>
                    No signup required. No AI guesses. Just real data from IRCC, CMHC, and CRA tailored to your situation.
                  </p>
                  <button onClick={() => { setWizardStarted(true); setPlannerExpanded(true); }} style={{
                    padding: "14px 36px", borderRadius: 100,
                    background: `linear-gradient(135deg, ${C.forest}, ${C.accent})`,
                    color: C.white, fontFamily: font, fontSize: 16, fontWeight: 700,
                    border: "none", cursor: "pointer", boxShadow: `0 4px 20px ${C.accent}30`,
                    display: "inline-flex", alignItems: "center", gap: 8,
                  }}>
                    <MapleLeaf size={18} color={C.white} />
                    Start My Free Settlement Plan
                  </button>
                  <div style={{ fontFamily: font, fontSize: 12, color: C.textLight, marginTop: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 16 }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Schedule size={14} color={C.textLight} /> Takes 3 minutes</span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><ShieldLock size={14} color={C.textLight} /> No data stored</span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><TaskAlt size={14} color={C.textLight} /> No AI</span>
                  </div>
                </div>
              ) : (
                <SettlementSessionProvider slug="pillar-article" mode="public">
                  <WizardShell
                    scrollTargetId="settlement-planner-widget-header"
                    frameTargetId="settlement-planner-widget"
                    publicResultsHref="/settlement-plan?view=report"
                  />
                </SettlementSessionProvider>
              )}
            </div>
          </div>

          {/* ══ Section 6: Your Report ══ */}
          <div id="your-report" style={{ scrollMarginTop: 80, textAlign: "center", padding: "40px 0", color: C.textLight }}>
            {!wizardStarted && (
              <div style={{ fontFamily: font, fontSize: 14, fontStyle: "italic" }}>
                ↑ Complete the Settlement Planner above to see your personalized report here
              </div>
            )}
          </div>

          {/* ══ Section 7: FAQ ══ */}
          <div style={{ height: 1, background: C.border, margin: "48px 0" }} />
          <SectionHeader id="faq" number="07" title="Frequently Asked Questions" subtitle="Common questions about the cost of moving to Canada" />
          <div style={{ borderRadius: 16, border: `1px solid ${C.border}`, background: C.white, overflow: "hidden", marginBottom: 40 }}>
            <div style={{ padding: "0 24px" }}>
              {faqItems.map((faq, i) => (
                <FAQItem key={i} q={faq.question} a={faq.answer} open={!!faqOpen[i]} onToggle={() => toggleFaq(i)} />
              ))}
            </div>
          </div>

          {/* ── Related articles grid ── */}
          <div style={{ padding: "32px 24px", borderRadius: 16, background: C.white, border: `1px solid ${C.border}`, marginBottom: 40 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <h3 style={{ fontFamily: serif, fontSize: 20, color: C.forest, margin: 0 }}>Keep Reading</h3>
              <Link href="/articles" style={{ fontFamily: font, fontSize: 13, color: C.accent, textDecoration: "none", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                All articles <ArrowRight size={12} />
              </Link>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(280px, 1fr))", gap: 10 }}>
              {RELATED_ARTICLES.map((a) => (
                <ArticleLink key={a.slug} title={a.title} slug={a.slug} category={a.category} color={a.color} />
              ))}
            </div>
          </div>

          {/* ── Final CTA ── */}
          <div style={{ padding: "40px 28px", borderRadius: 20, background: `linear-gradient(135deg, ${C.forest}, #1A3F3B)`, textAlign: "center", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: -40, right: -40, width: 200, height: 200, borderRadius: "50%", background: `radial-gradient(circle, ${C.accent}20, transparent 70%)` }} />
            <div style={{ position: "relative", zIndex: 1 }}>
              <h3 style={{ fontFamily: serif, fontSize: 26, color: C.white, margin: "0 0 10px" }}>Don&apos;t guess. Plan.</h3>
              <p style={{ fontFamily: font, fontSize: 15, color: "#ffffffAA", margin: "0 0 24px", maxWidth: 460, marginLeft: "auto", marginRight: "auto" }}>
                Join thousands of newcomers who planned their move to Canada with real government data — not estimates.
              </p>
              <a href="#your-plan" style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "14px 32px", borderRadius: 100,
                background: `linear-gradient(135deg, ${C.gold}, #D4A017)`,
                color: C.white, fontFamily: font, fontSize: 15, fontWeight: 700,
                textDecoration: "none", boxShadow: `0 4px 20px ${C.gold}40`,
              }}>
                <MapleLeaf size={16} color={C.white} /> Start My Free Plan
              </a>
            </div>
          </div>

          {/* ── Footer ── */}
          <div style={{ marginTop: 48, paddingTop: 24, borderTop: `1px solid ${C.border}` }}>
            <p style={{ fontFamily: font, fontSize: 12, color: C.textLight, lineHeight: 1.7, margin: 0 }}>
              <strong style={{ color: C.gray }}>Data sources:</strong> Immigration, Refugees and Citizenship Canada (IRCC), Canada Mortgage and Housing Corporation (CMHC), Canada Revenue Agency (CRA), Employment and Social Development Canada (ESDC), Statistics Canada.
              {" "}<strong style={{ color: C.gray }}>Last updated:</strong> April 2026. Proof-of-funds amounts reflect the latest IRCC update. Rental data reflects CMHC October 2025 market survey.
              {" "}<strong style={{ color: C.gray }}>Disclaimer:</strong> This content is for informational purposes only and does not constitute immigration or financial advice. Always consult with a Regulated Canadian Immigration Consultant (RCIC) for guidance specific to your situation.
            </p>
          </div>

        </article>
      </div>
    </div>
  );
}
