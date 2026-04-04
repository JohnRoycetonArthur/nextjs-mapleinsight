"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { PortableText } from "@portabletext/react";
import { ArticleFull } from "@/sanity/queries";
import { GlossaryTooltip } from "@/components/article/GlossaryTooltip";
import { buildGlossaryMap, buildGlossaryRegex, type GlossaryEntry } from "@/lib/glossary-utils";
import {
  AFFILIATE_PRODUCTS,
  PLACEMENTS,
  getProductsByCategory,
} from "@/data/affiliateProducts";
import { AffiliateDisclosure } from "@/components/affiliate/AffiliateDisclosure";
import { AffiliateProductCard } from "@/components/affiliate/AffiliateProductCard";
import { AffiliateComparisonTable } from "@/components/affiliate/AffiliateComparisonTable";
import { AffiliateBanner } from "@/components/affiliate/AffiliateBanner";
import { AnswerSummaryBox } from "./AnswerSummaryBox";
import { ExampleScenario } from "./ExampleScenario";
import { FAQSection } from "./FAQSection";
import { InlineCalculatorCTA } from "./InlineCalculatorCTA";
import { SourcesSection } from "@/components/article/SourcesSection";

export type ArticleSection = { id: string; title: string };

interface ArticleContentProps {
  article: ArticleFull;
  sections: ArticleSection[];
  readingTime: number;
}

// ─── Shared Utility ───

function slugifyHeading(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function extractText(value: any): string {
  return ((value?.children ?? []) as any[])
    .filter((c) => c._type === "span")
    .map((c) => c.text ?? "")
    .join("");
}

function filterContentForAffiliate(content: unknown[]): unknown[] {
  const skipPrefixes = ["Best Newcomer Bank Accounts", "Our Top Pick"];
  return (content as any[]).filter((b) => {
    if (b._type !== "block" || !["h2", "h3"].includes(b.style)) return true;
    const title = ((b.children as any[]) ?? []).map((c: any) => c.text ?? "").join("");
    return !skipPrefixes.some((p) => title.startsWith(p));
  });
}

// ─── Glossary annotation helpers ───

/**
 * Pre-transform Portable Text blocks to inject custom `glossaryTerm` marks on
 * the first occurrence of each glossary term. PortableText then renders those
 * marks natively via `components.marks.glossaryTerm`.
 *
 * AC-6: only the first occurrence of each term across the whole content is annotated.
 * Only `normal` and `blockquote` block styles are annotated.
 */
function addGlossaryMarks(
  content: any[],
  glossaryMap: Map<string, GlossaryEntry>,
  glossaryRegex: RegExp | null,
): any[] {
  if (!glossaryRegex || !content?.length) return content ?? [];

  const seenTerms = new Set<string>();

  return content.map((block) => {
    if (
      block._type !== "block" ||
      (block.style !== "normal" && block.style !== "blockquote" && block.style != null)
    ) {
      return block;
    }

    const children: any[] = block.children ?? [];
    const markDefs: any[] = [...(block.markDefs ?? [])];
    const newChildren: any[] = [];
    let blockModified = false;

    for (const child of children) {
      if (child._type !== "span" || !child.text) {
        newChildren.push(child);
        continue;
      }

      const text: string = child.text;
      const re = new RegExp(glossaryRegex.source, glossaryRegex.flags);
      let lastIndex = 0;
      let match: RegExpExecArray | null;
      const newSpans: any[] = [];
      let spanModified = false;

      while ((match = re.exec(text)) !== null) {
        const matchedLower = match[1].toLowerCase();
        if (seenTerms.has(matchedLower)) continue;

        // Pre-match text span (inherits original marks)
        if (match.index > lastIndex) {
          newSpans.push({ ...child, _key: `${child._key}_pre${match.index}`, text: text.slice(lastIndex, match.index) });
        }

        // Ensure markDef exists in this block (one per term per block)
        const markKey = `gl_${matchedLower.replace(/[\s\W]+/g, "_")}`;
        if (!markDefs.find((d) => d._key === markKey)) {
          markDefs.push({ _key: markKey, _type: "glossaryTerm", termId: matchedLower });
        }

        // Annotated span
        newSpans.push({
          ...child,
          _key: `${child._key}_gl${seenTerms.size}`,
          text: match[1],
          marks: [...(child.marks ?? []), markKey],
        });

        seenTerms.add(matchedLower);
        lastIndex = match.index + match[1].length;
        spanModified = true;
      }

      if (!spanModified) {
        newChildren.push(child);
      } else {
        if (lastIndex < text.length) {
          newSpans.push({ ...child, _key: `${child._key}_post${lastIndex}`, text: text.slice(lastIndex) });
        }
        newChildren.push(...newSpans);
        blockModified = true;
      }
    }

    return blockModified ? { ...block, children: newChildren, markDefs } : block;
  });
}

// ─── Icons ───

const ClockIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ flexShrink: 0 }}
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const ArrowRight = ({ size = 14 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ marginLeft: 4, flexShrink: 0 }}
    aria-hidden="true"
  >
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

const CheckCircle = ({ color = "#1B7A4A" }: { color?: string }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ flexShrink: 0, marginTop: 2 }}
    aria-hidden="true"
  >
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

// ─── Table of Contents ───

function TableOfContents({
  sections,
  activeSection,
}: {
  sections: ArticleSection[];
  activeSection: string;
}) {
  return (
    <div
      style={{
        position: "sticky",
        top: 88,
        width: 200,
        fontFamily: "var(--font-dm-sans, 'DM Sans', Helvetica, sans-serif)",
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: 1,
          color: "#9CA3AF",
          marginBottom: 12,
        }}
      >
        On this page
      </div>
      {sections.map((s) => (
        <a
          key={s.id}
          href={`#${s.id}`}
          onClick={(e) => {
            e.preventDefault();
            document.getElementById(s.id)?.scrollIntoView({ behavior: "smooth" });
          }}
          style={{
            display: "block",
            fontSize: 13,
            lineHeight: 1.4,
            padding: "6px 0 6px 14px",
            borderLeft: `2px solid ${activeSection === s.id ? "#1B7A4A" : "transparent"}`,
            color: activeSection === s.id ? "#1B7A4A" : "#6B7280",
            fontWeight: activeSection === s.id ? 600 : 400,
            textDecoration: "none",
            transition: "all 0.2s",
          }}
        >
          {s.title}
        </a>
      ))}
    </div>
  );
}

// ─── Key Takeaways Card (bank account article only) ───

function KeyTakeawaysCard({ isMobile }: { isMobile: boolean }) {
  const items = [
    "You can open a bank account before arriving in Canada — several banks offer pre-arrival programs.",
    "Newcomer accounts typically waive monthly fees for the first year.",
    "You'll need your passport, proof of immigration status, and a Canadian address.",
    "We recommend starting with a no-fee account to avoid unnecessary costs while you settle in.",
  ];
  return (
    <div
      id="key-takeaways"
      style={{
        background: "#fff",
        borderRadius: 16,
        border: "1px solid #E5E7EB",
        borderLeft: "4px solid #1B7A4A",
        padding: isMobile ? "22px 18px" : "26px 28px",
        marginBottom: 32,
        boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
        scrollMarginTop: 100,
      }}
    >
      <h2
        style={{
          fontFamily: "var(--font-dm-serif, 'DM Serif Display', Georgia, serif)",
          fontSize: 18,
          color: "#1B4F4A",
          margin: "0 0 14px",
          fontWeight: 700,
        }}
      >
        Key Takeaways
      </h2>
      {items.map((item, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            gap: 10,
            marginBottom: i < items.length - 1 ? 10 : 0,
            fontSize: 14,
            lineHeight: 1.6,
            color: "#374151",
            fontFamily: "var(--font-dm-sans, 'DM Sans', Helvetica, sans-serif)",
          }}
        >
          <CheckCircle />
          <span>{item}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Custom PortableText Components ───

function makePortableTextComponents(
  glossaryMap: Map<string, GlossaryEntry>,
) {
  return {
    block: {
      h2: ({ children, value }: any) => {
        const id = slugifyHeading(extractText(value));
        return (
          <h2
            id={id}
            style={{
              fontFamily: "var(--font-dm-serif, 'DM Serif Display', Georgia, serif)",
              fontSize: 24,
              color: "#1B4F4A",
              fontWeight: 700,
              margin: "40px 0 16px",
              lineHeight: 1.3,
              scrollMarginTop: 100,
            }}
          >
            {children}
          </h2>
        );
      },
      h3: ({ children, value }: any) => {
        const id = slugifyHeading(extractText(value));
        return (
          <h3
            id={id}
            style={{
              fontFamily: "var(--font-dm-serif, 'DM Serif Display', Georgia, serif)",
              fontSize: 20,
              color: "#1B4F4A",
              fontWeight: 700,
              margin: "32px 0 12px",
              lineHeight: 1.3,
              scrollMarginTop: 100,
            }}
          >
            {children}
          </h3>
        );
      },
      normal: ({ children }: any) => (
        <p
          style={{
            fontFamily: "var(--font-dm-sans, 'DM Sans', Helvetica, sans-serif)",
            fontSize: 16,
            lineHeight: 1.75,
            color: "#374151",
            margin: "0 0 16px",
          }}
        >
          {children}
        </p>
      ),
      blockquote: ({ children }: any) => (
        <blockquote
          style={{
            borderLeft: "4px solid #1B7A4A",
            paddingLeft: 20,
            margin: "24px 0",
            color: "#6B7280",
            fontStyle: "italic",
            fontSize: 16,
            lineHeight: 1.75,
          }}
        >
          {children}
        </blockquote>
      ),
    },
    list: {
      bullet: ({ children }: any) => (
        <ul
          style={{
            margin: "0 0 16px",
            paddingLeft: 24,
            fontFamily: "var(--font-dm-sans, 'DM Sans', Helvetica, sans-serif)",
          }}
        >
          {children}
        </ul>
      ),
      number: ({ children }: any) => (
        <ol
          style={{
            margin: "0 0 16px",
            paddingLeft: 24,
            fontFamily: "var(--font-dm-sans, 'DM Sans', Helvetica, sans-serif)",
          }}
        >
          {children}
        </ol>
      ),
    },
    listItem: {
      bullet: ({ children }: any) => (
        <li
          style={{
            fontSize: 16,
            lineHeight: 1.75,
            color: "#374151",
            marginBottom: 6,
          }}
        >
          {children}
        </li>
      ),
      number: ({ children }: any) => (
        <li
          style={{
            fontSize: 16,
            lineHeight: 1.75,
            color: "#374151",
            marginBottom: 6,
          }}
        >
          {children}
        </li>
      ),
    },
    types: {
      calculatorEmbed: ({ value }: any) => (
        <InlineCalculatorCTA
          calculatorSlug={value?.calculatorSlug ?? ""}
          title={value?.calculatorSlug ? `Try the ${value.calculatorSlug.replace(/-/g, " ")} calculator` : "Try a calculator"}
        />
      ),
      toolEmbed: ({ value }: any) => {
        const toolId = value?.toolId ?? "";
        const isSettlementPlanner = toolId === "settlement-planner";

        return (
          <div
            style={{
              margin: "28px 0",
              padding: "24px",
              borderRadius: 18,
              background: "linear-gradient(135deg, #F4FBF7 0%, #EEF7FF 100%)",
              border: "1px solid #D6E9DD",
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: 1,
                color: "#1B7A4A",
                marginBottom: 8,
              }}
            >
              Interactive Tool
            </div>
            <h3
              style={{
                fontFamily: "var(--font-dm-serif, 'DM Serif Display', Georgia, serif)",
                fontSize: 24,
                lineHeight: 1.2,
                color: "#1B4F4A",
                margin: "0 0 10px",
              }}
            >
              {value?.title || "Explore the tool"}
            </h3>
            <p
              style={{
                fontSize: 15,
                lineHeight: 1.7,
                color: "#4B5563",
                margin: "0 0 16px",
              }}
            >
              {value?.description || "Open the interactive tool for a personalized estimate."}
            </p>
            <Link
              href={isSettlementPlanner ? "/settlement-planner/plan" : "/tools"}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "10px 16px",
                borderRadius: 10,
                background: "#1B7A4A",
                color: "#fff",
                fontWeight: 700,
                textDecoration: "none",
              }}
            >
              Open tool
              <ArrowRight size={12} />
            </Link>
          </div>
        );
      },
      markdownTable: ({ value }: any) => {
        const rows = Array.isArray(value?.rows) ? value.rows : [];
        if (rows.length === 0) return null;

        const [headerRow, ...bodyRows] = rows;

        return (
          <div style={{ overflowX: "auto", margin: "24px 0" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                background: "#fff",
                border: "1px solid #E5E7EB",
                borderRadius: 12,
                overflow: "hidden",
              }}
            >
              <thead style={{ background: "#F9FAFB" }}>
                <tr>
                  {(headerRow?.cells ?? []).map((cell: string, index: number) => (
                    <th
                      key={`${cell}-${index}`}
                      style={{
                        textAlign: "left",
                        padding: "12px 14px",
                        borderBottom: "1px solid #E5E7EB",
                        fontSize: 13,
                        fontWeight: 700,
                        color: "#1F2937",
                      }}
                    >
                      {cell}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bodyRows.map((row: any, rowIndex: number) => (
                  <tr key={row._key ?? rowIndex}>
                    {(row?.cells ?? []).map((cell: string, cellIndex: number) => (
                      <td
                        key={`${cell}-${cellIndex}`}
                        style={{
                          padding: "12px 14px",
                          borderBottom:
                            rowIndex === bodyRows.length - 1 ? "none" : "1px solid #E5E7EB",
                          fontSize: 15,
                          lineHeight: 1.6,
                          color: "#374151",
                          verticalAlign: "top",
                        }}
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      },
      divider: () => (
        <hr
          style={{
            border: 0,
            borderTop: "1px solid #E5E7EB",
            margin: "32px 0",
          }}
        />
      ),
    },
    marks: {
      link: ({ children, value }: any) => (
        <a
          href={value?.href}
          target={value?.href?.startsWith("http") ? "_blank" : undefined}
          rel={value?.href?.startsWith("http") ? "noopener noreferrer" : undefined}
          style={{ color: "#1B7A4A", textDecoration: "underline", textUnderlineOffset: 2 }}
        >
          {children}
        </a>
      ),
      strong: ({ children }: any) => (
        <strong style={{ fontWeight: 700, color: "#1B4F4A" }}>{children}</strong>
      ),
      em: ({ children }: any) => <em>{children}</em>,
      code: ({ children }: any) => (
        <code
          style={{
            background: "#F3F4F6",
            borderRadius: 4,
            padding: "2px 6px",
            fontSize: 14,
            color: "#1B4F4A",
          }}
        >
          {children}
        </code>
      ),
      // AC-1, AC-2: render glossaryTerm marks injected by addGlossaryMarks()
      glossaryTerm: ({ value, children }: any) => {
        const entry = glossaryMap.get(value?.termId ?? "");
        if (!entry) return <>{children}</>;
        return (
          <GlossaryTooltip term={entry.term} definition={entry.definition} slug={entry.id}>
            {children}
          </GlossaryTooltip>
        );
      },
    },
  };
}

// ─── Related Section ───

const RELATED_ARTICLES = [
  {
    title: "Understanding Canadian Credit Scores",
    category: "Banking",
    href: "/articles/understanding-credit-scores-in-canada",
    color: "#1B7A4A",
  },
  {
    title: "Getting a Social Insurance Number (SIN)",
    category: "First 90 Days",
    href: "/articles/getting-a-social-insurance-number-sin",
    color: "#2563EB",
  },
  {
    title: "Your First Canadian Tax Return",
    category: "Taxes",
    href: "/articles/your-first-canadian-tax-return",
    color: "#B8860B",
  },
];

const RELATED_CALCULATORS = [
  {
    title: "Newcomer Budget Calculator",
    href: "/calculators/newcomer-budget",
    color: "#1B7A4A",
    bg: "#E8F5EE",
  },
  {
    title: "TFSA vs RRSP Calculator",
    href: "/calculators/tfsa-vs-rrsp",
    color: "#2563EB",
    bg: "#EFF6FF",
  },
];

function RelatedSection({ isMobile }: { isMobile: boolean }) {
  return (
    <section id="related" style={{ marginBottom: 40, scrollMarginTop: 100 }}>
      <h2
        style={{
          fontFamily: "var(--font-dm-serif, 'DM Serif Display', Georgia, serif)",
          fontSize: 24,
          color: "#1B4F4A",
          margin: "0 0 16px",
          fontWeight: 700,
        }}
      >
        Continue Learning
      </h2>

      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: 1,
          color: "#9CA3AF",
          marginBottom: 12,
          fontFamily: "var(--font-dm-sans, 'DM Sans', Helvetica, sans-serif)",
        }}
      >
        Related Articles
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
          gap: 12,
          marginBottom: 24,
        }}
      >
        {RELATED_ARTICLES.map((a) => (
          <Link
            key={a.href}
            href={a.href}
            style={{
              display: "block",
              background: "#fff",
              borderRadius: 14,
              border: "1px solid #E5E7EB",
              padding: "18px 20px",
              textDecoration: "none",
              transition: "box-shadow 0.2s, transform 0.15s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 16px rgba(0,0,0,0.06)";
              (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.boxShadow = "none";
              (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
            }}
          >
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                textTransform: "uppercase",
                color: a.color,
                letterSpacing: 0.6,
                fontFamily: "var(--font-dm-sans, 'DM Sans', Helvetica, sans-serif)",
              }}
            >
              {a.category}
            </span>
            <div
              style={{
                fontFamily: "var(--font-dm-serif, 'DM Serif Display', Georgia, serif)",
                fontSize: 16,
                color: "#1B4F4A",
                fontWeight: 700,
                marginTop: 6,
                lineHeight: 1.3,
              }}
            >
              {a.title}
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                fontSize: 13,
                color: a.color,
                fontWeight: 600,
                marginTop: 10,
                fontFamily: "var(--font-dm-sans, 'DM Sans', Helvetica, sans-serif)",
              }}
            >
              Read article
              <ArrowRight size={12} />
            </div>
          </Link>
        ))}
      </div>

      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: 1,
          color: "#9CA3AF",
          marginBottom: 12,
          fontFamily: "var(--font-dm-sans, 'DM Sans', Helvetica, sans-serif)",
        }}
      >
        Try These Calculators
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {RELATED_CALCULATORS.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: c.color,
              background: c.bg,
              border: `1px solid ${c.color}22`,
              borderRadius: 8,
              padding: "9px 16px",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              transition: "transform 0.15s",
              fontFamily: "var(--font-dm-sans, 'DM Sans', Helvetica, sans-serif)",
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLElement).style.transform = "translateX(2px)")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLElement).style.transform = "translateX(0)")
            }
          >
            {c.title}
            <ArrowRight size={12} />
          </Link>
        ))}
      </div>
    </section>
  );
}

// ─── Main Component ───

export function ArticleContent({ article, sections, readingTime }: ArticleContentProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [activeSection, setActiveSection] = useState<string>(sections[0]?.id ?? "");

  const isBankAccount = article.slug === "opening-a-newcomer-bank-account";
  const bankingProducts = isBankAccount ? getProductsByCategory("banking") : [];

  // Mobile detection
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // IntersectionObserver for TOC active section
  useEffect(() => {
    if (isMobile || sections.length === 0) return;
    const observers: IntersectionObserver[] = [];

    sections.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (!el) return;
      const obs = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) setActiveSection(id);
          });
        },
        { rootMargin: "-64px 0px -70% 0px", threshold: 0 }
      );
      obs.observe(el);
      observers.push(obs);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, [isMobile, sections]);

  const formattedDate = article.publishedAt
    ? new Date(article.publishedAt).toLocaleDateString("en-CA", {
        year: "numeric",
        month: "long",
      })
    : null;

  const glossaryMap = useMemo(() => buildGlossaryMap(), []);
  const glossaryRegex = useMemo(() => buildGlossaryRegex(glossaryMap), [glossaryMap]);
  // Pre-transform content once: inject glossaryTerm marks for first-occurrence terms (AC-6)
  const glossaryContent = useMemo(
    () => addGlossaryMarks(article.content as any[], glossaryMap, glossaryRegex),
    [article.content, glossaryMap, glossaryRegex],
  );
  const ptComponents = useMemo(() => makePortableTextComponents(glossaryMap), [glossaryMap]);

  // For bank account article, filter out h2 blocks that affiliate sections replace
  const portableTextContent = isBankAccount
    ? filterContentForAffiliate(glossaryContent as unknown[])
    : (glossaryContent as unknown[]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#FAFBFC",
        fontFamily: "var(--font-dm-sans, 'DM Sans', Helvetica, sans-serif)",
      }}
    >
      {/* ─── Hero ─── */}
      <header
        style={{
          background: "linear-gradient(165deg, #0F3D3A 0%, #1B5E58 40%, #1B7A4A 100%)",
          padding: isMobile ? "36px 0 32px" : "56px 0 48px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Dot pattern overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0.04,
            backgroundImage:
              "radial-gradient(circle at 20% 50%, #fff 1px, transparent 1px), radial-gradient(circle at 80% 20%, #fff 1px, transparent 1px)",
            backgroundSize: "60px 60px, 40px 40px",
          }}
        />

        <div
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            padding: isMobile ? "0 16px" : "0 24px",
            position: "relative",
            zIndex: 1,
          }}
        >
          {/* Breadcrumb */}
          <div
            style={{
              fontSize: 13,
              color: "rgba(255,255,255,0.5)",
              marginBottom: 16,
              fontFamily: "var(--font-dm-sans, 'DM Sans', Helvetica, sans-serif)",
            }}
          >
            <Link href="/" style={{ color: "rgba(255,255,255,0.6)", textDecoration: "none" }}>
              Home
            </Link>
            {" / "}
            <Link
              href="/articles"
              style={{ color: "rgba(255,255,255,0.6)", textDecoration: "none" }}
            >
              Articles
            </Link>
            {article.category && (
              <>
                {" / "}
                <span style={{ color: "rgba(255,255,255,0.6)" }}>{article.category}</span>
              </>
            )}
            {" / "}
            <span style={{ color: "rgba(255,255,255,0.8)" }}>{article.title}</span>
          </div>

          {/* Category badge + meta row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 14,
              flexWrap: "wrap",
            }}
          >
            {article.category && (
              <span
                style={{
                  background: "rgba(255,255,255,0.15)",
                  color: "#7DD3A8",
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: 0.8,
                  padding: "4px 12px",
                  borderRadius: 6,
                  backdropFilter: "blur(4px)",
                  fontFamily: "var(--font-dm-sans, 'DM Sans', Helvetica, sans-serif)",
                }}
              >
                {article.category}
              </span>
            )}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                color: "rgba(255,255,255,0.55)",
                fontSize: 13,
              }}
            >
              <ClockIcon />
              <span>{readingTime} min read</span>
            </div>
            {formattedDate && (
              <>
                <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>·</span>
                <span style={{ color: "rgba(255,255,255,0.55)", fontSize: 13 }}>
                  {formattedDate}
                </span>
              </>
            )}
          </div>

          {/* h1 */}
          <h1
            style={{
              fontFamily: "var(--font-dm-serif, 'DM Serif Display', Georgia, serif)",
              fontSize: isMobile ? 28 : 40,
              fontWeight: 700,
              color: "#fff",
              margin: "0 0 14px",
              lineHeight: 1.15,
              letterSpacing: -0.5,
            }}
          >
            {article.title}
          </h1>

          {/* Summary */}
          {article.summary && (
            <p
              style={{
                fontSize: isMobile ? 15 : 17,
                lineHeight: 1.7,
                color: "rgba(255,255,255,0.75)",
                margin: 0,
                maxWidth: 580,
              }}
            >
              {article.summary}
            </p>
          )}
        </div>
      </header>

      {/* ─── Affiliate Disclosure (bank account article only) ─── */}
      {isBankAccount && (
        <div
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            padding: isMobile ? "0 16px" : "0 24px",
          }}
        >
          <AffiliateDisclosure isMobile={isMobile} />
        </div>
      )}

      {/* ─── Article Body ─── */}
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: isMobile ? "32px 16px 64px" : "48px 24px 64px",
          display: isMobile ? "block" : "flex",
          gap: isMobile ? 0 : 48,
          alignItems: isMobile ? undefined : "flex-start",
        }}
      >
        {/* Main content */}
        <article
          style={{
            flex: 1,
            maxWidth: 720,
            minWidth: 0,
            fontFamily: "var(--font-dm-sans, 'DM Sans', Helvetica, sans-serif)",
          }}
        >
          {/* Answer Summary Box */}
          {article.answerSummary && (
            <AnswerSummaryBox summary={article.answerSummary} />
          )}

          {/* Bank account article: Key Takeaways card */}
          {isBankAccount && <KeyTakeawaysCard isMobile={isMobile} />}

          {/* Portable Text content */}
          <PortableText
            value={portableTextContent as Parameters<typeof PortableText>[0]["value"]}
            components={ptComponents}
          />

          {/* Bank account article: Comparison Table */}
          {isBankAccount && (
            <section id="best-accounts" style={{ scrollMarginTop: 100 }}>
              <h2
                style={{
                  fontFamily: "var(--font-dm-serif, 'DM Serif Display', Georgia, serif)",
                  fontSize: 24,
                  color: "#1B4F4A",
                  margin: "0 0 4px",
                  fontWeight: 700,
                }}
              >
                Best Newcomer Bank Accounts in 2026
              </h2>
              <p
                style={{
                  fontSize: 16,
                  lineHeight: 1.75,
                  color: "#374151",
                  margin: "0 0 8px",
                }}
              >
                We&apos;ve reviewed dozens of banking options and narrowed it down to four standout
                choices for newcomers. Here&apos;s how they compare:
              </p>
              <AffiliateComparisonTable
                products={bankingProducts}
                placement={PLACEMENTS.ARTICLE_BANK_COMPARISON}
                isMobile={isMobile}
              />
            </section>
          )}

          {/* Bank account article: Inline Banner (Wealthsimple Cash) */}
          {isBankAccount && (
            <AffiliateBanner
              product={AFFILIATE_PRODUCTS[2]}
              placement={PLACEMENTS.ARTICLE_BANK_INLINE}
              isMobile={isMobile}
            />
          )}

          {/* Bank account article: Top Pick Product Card (Simplii) */}
          {isBankAccount && (
            <section id="our-top-pick" style={{ marginBottom: 36, scrollMarginTop: 100 }}>
              <h2
                style={{
                  fontFamily: "var(--font-dm-serif, 'DM Serif Display', Georgia, serif)",
                  fontSize: 24,
                  color: "#1B4F4A",
                  margin: "0 0 8px",
                  fontWeight: 700,
                }}
              >
                Our Top Pick: Simplii Financial
              </h2>
              <p
                style={{
                  fontSize: 16,
                  lineHeight: 1.75,
                  color: "#374151",
                  margin: "0 0 20px",
                }}
              >
                For most newcomers, we recommend Simplii Financial as the best starting point. No
                monthly fees, no minimum balance, and a genuinely free chequing account that you
                can keep long after your first year.
              </p>
              <AffiliateProductCard
                product={AFFILIATE_PRODUCTS[0]}
                placement={PLACEMENTS.ARTICLE_BANK_TOP_PICK}
                isMobile={isMobile}
              />
            </section>
          )}

          {/* Example Scenarios (guide-type articles only) */}
          {article.articleType === "guide" && article.exampleScenarios && article.exampleScenarios.length > 0 && (
            <section style={{ marginTop: 40 }}>
              <h2
                style={{
                  fontFamily: "var(--font-dm-serif, 'DM Serif Display', Georgia, serif)",
                  fontSize: 22,
                  color: "#1B4F4A",
                  fontWeight: 700,
                  marginBottom: 16,
                }}
              >
                Example Scenarios
              </h2>
              {article.exampleScenarios.map((scenario, i) => (
                <ExampleScenario key={i} title={scenario.title} body={scenario.body} />
              ))}
            </section>
          )}

          {/* FAQ Section */}
          {article.faqItems && article.faqItems.length > 0 && (
            <FAQSection faqItems={article.faqItems} />
          )}

          {/* Sources & References — AC-1, AC-5 */}
          <SourcesSection sources={article.sources} />

          <RelatedSection isMobile={isMobile} />
        </article>

        {/* TOC sidebar — desktop only */}
        {!isMobile && sections.length > 0 && (
          <aside style={{ width: 200, flexShrink: 0 }}>
            <TableOfContents sections={sections} activeSection={activeSection} />
          </aside>
        )}
      </div>
    </div>
  );
}
