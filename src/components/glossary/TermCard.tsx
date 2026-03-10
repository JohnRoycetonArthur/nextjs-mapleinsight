"use client";

import { useState } from "react";
import { GlossaryTerm } from "@/data/glossaryTerms";

const LinkIcon = () => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
);

const ArticleIcon = () => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ flexShrink: 0 }}
  >
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </svg>
);

const CalculatorIcon = () => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ flexShrink: 0 }}
  >
    <rect x="4" y="2" width="16" height="20" rx="2" />
    <line x1="8" y1="6" x2="16" y2="6" />
    <line x1="8" y1="10" x2="10" y2="10" />
    <line x1="14" y1="10" x2="16" y2="10" />
    <line x1="8" y1="14" x2="10" y2="14" />
    <line x1="14" y1="14" x2="16" y2="14" />
  </svg>
);

interface TermCardProps {
  term: GlossaryTerm;
}

export function TermCard({ term }: TermCardProps) {
  const [copyState, setCopyState] = useState<"idle" | "copied">("idle");

  const handleCopyLink = (e: React.MouseEvent) => {
    e.preventDefault();
    const url = `${window.location.origin}${window.location.pathname}#${term.id}`;
    navigator.clipboard?.writeText(url).then(() => {
      setCopyState("copied");
      setTimeout(() => setCopyState("idle"), 2000);
    });
  };

  return (
    <div
      id={term.id}
      style={{
        padding: "22px 28px",
        borderBottom: "1px solid #F3F4F6",
        scrollMarginTop: 80,
        transition: "background 0.15s",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "#FAFBFC")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      {/* Term heading row */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 8 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
            <h3
              style={{
                margin: 0,
                fontFamily: "var(--font-dm-serif, 'DM Serif Display', Georgia, serif)",
                fontSize: 18,
                fontWeight: 700,
                color: "#1B4F4A",
                lineHeight: 1.2,
              }}
            >
              {term.term}
            </h3>
            {term.fullName && (
              <span
                style={{
                  fontFamily: "var(--font-dm-sans, 'DM Sans', Helvetica, sans-serif)",
                  fontSize: 13,
                  color: "#6B7280",
                  fontWeight: 400,
                }}
              >
                {term.fullName}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={handleCopyLink}
          aria-label={`Copy link to ${term.term}`}
          title={copyState === "copied" ? "Copied!" : "Copy link to this term"}
          style={{
            background: copyState === "copied" ? "#E8F5EE" : "transparent",
            border: "1px solid",
            borderColor: copyState === "copied" ? "#1B7A4A22" : "#E5E7EB",
            borderRadius: 7,
            padding: "5px 9px",
            cursor: "pointer",
            color: copyState === "copied" ? "#1B7A4A" : "#9CA3AF",
            display: "flex",
            alignItems: "center",
            gap: 4,
            fontSize: 11,
            fontWeight: 600,
            fontFamily: "var(--font-dm-sans, 'DM Sans', Helvetica, sans-serif)",
            whiteSpace: "nowrap",
            flexShrink: 0,
            transition: "all 0.2s",
          }}
        >
          <LinkIcon />
          {copyState === "copied" ? "Copied!" : "Copy link"}
        </button>
      </div>

      {/* Definition */}
      <p
        style={{
          fontFamily: "var(--font-dm-sans, 'DM Sans', Helvetica, sans-serif)",
          fontSize: 14.5,
          lineHeight: 1.7,
          color: "#374151",
          margin: "0 0 12px",
        }}
      >
        {term.definition}
      </p>

      {/* Related links */}
      {term.relatedLinks && term.relatedLinks.length > 0 && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {term.relatedLinks.map((link, i) => (
            <a
              key={i}
              href={link.url}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                fontSize: 12,
                fontWeight: 600,
                color: link.type === "calculator" ? "#2563EB" : "#1B7A4A",
                background: link.type === "calculator" ? "#EFF6FF" : "#E8F5EE",
                border: `1px solid ${link.type === "calculator" ? "#2563EB22" : "#1B7A4A22"}`,
                borderRadius: 6,
                padding: "4px 10px",
                textDecoration: "none",
                fontFamily: "var(--font-dm-sans, 'DM Sans', Helvetica, sans-serif)",
                transition: "opacity 0.2s",
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.opacity = "0.75")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.opacity = "1")}
            >
              {link.type === "calculator" ? <CalculatorIcon /> : <ArticleIcon />}
              {link.label}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
