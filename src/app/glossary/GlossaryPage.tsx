"use client";

import { useState, useEffect, useRef } from "react";
import { GLOSSARY_TERMS, ALPHABET, LETTERS_WITH_TERMS } from "@/data/glossaryTerms";
import { LetterSection } from "@/components/glossary/LetterSection";
import { NewsletterInline } from "@/components/start-here/NewsletterInline";

const SearchIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#9CA3AF"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const XIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export function GlossaryPage() {
  const [query, setQuery] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [resultCount, setResultCount] = useState(GLOSSARY_TERMS.length);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Scroll to hash on load
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash) {
      setTimeout(() => {
        const el = document.getElementById(hash);
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }, 300);
    }
  }, []);

  const filtered = query.trim()
    ? GLOSSARY_TERMS.filter(
        (t) =>
          t.term.toLowerCase().includes(query.toLowerCase()) ||
          (t.fullName ?? "").toLowerCase().includes(query.toLowerCase()) ||
          t.definition.toLowerCase().includes(query.toLowerCase())
      )
    : GLOSSARY_TERMS;

  useEffect(() => {
    setResultCount(filtered.length);
  }, [filtered.length]);

  const filteredGrouped = filtered.reduce<Record<string, typeof filtered>>(
    (acc, term) => {
      if (!acc[term.letter]) acc[term.letter] = [];
      acc[term.letter].push(term);
      return acc;
    },
    {}
  );

  const activeLetters = new Set(Object.keys(filteredGrouped));
  const isFiltering = query.trim().length > 0;

  const handleClear = () => {
    setQuery("");
    searchRef.current?.focus();
  };

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
          padding: isMobile ? "48px 20px 40px" : "64px 24px 56px",
          position: "relative",
          overflow: "hidden",
        }}
      >
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
            maxWidth: 680,
            margin: "0 auto",
            textAlign: "center",
            position: "relative",
            zIndex: 1,
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "rgba(255,255,255,0.12)",
              borderRadius: 20,
              padding: "6px 16px",
              marginBottom: 18,
              backdropFilter: "blur(8px)",
            }}
          >
            <span
              style={{
                fontSize: 13,
                color: "rgba(255,255,255,0.85)",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: 1,
              }}
            >
              📖 Financial Glossary
            </span>
          </div>
          <h1
            style={{
              fontFamily: "var(--font-dm-serif, 'DM Serif Display', Georgia, serif)",
              fontSize: isMobile ? 30 : 44,
              fontWeight: 700,
              color: "#fff",
              margin: "0 0 14px",
              lineHeight: 1.15,
              letterSpacing: -0.5,
            }}
          >
            Canadian Finance Terms,{" "}
            <span style={{ color: "#7DD3A8" }}>Plain & Simple</span>
          </h1>
          <p
            style={{
              fontSize: isMobile ? 15 : 17,
              lineHeight: 1.7,
              color: "rgba(255,255,255,0.78)",
              margin: "0 auto",
              maxWidth: 500,
            }}
          >
            {GLOSSARY_TERMS.length} terms explained in plain language — from RRSP and TFSA to NOA and CCB. No financial background required.
          </p>
        </div>
      </header>

      {/* ─── Sticky Search + A–Z Nav ─── */}
      <div
        style={{
          background: "#fff",
          borderBottom: "1px solid #E5E7EB",
          padding: isMobile ? "20px 16px 16px" : "24px 24px 18px",
          position: "sticky",
          top: 64,
          zIndex: 90,
          boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
        }}
      >
        <div style={{ maxWidth: 820, margin: "0 auto" }}>
          {/* Search input */}
          <div role="search" style={{ position: "relative", marginBottom: 16 }}>
            <div
              style={{
                position: "absolute",
                left: 14,
                top: "50%",
                transform: "translateY(-50%)",
                pointerEvents: "none",
              }}
            >
              <SearchIcon />
            </div>
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search terms or definitions… e.g. RRSP, tax, mortgage"
              aria-label="Search glossary terms"
              style={{
                width: "100%",
                padding: "13px 44px 13px 44px",
                borderRadius: 12,
                border: "1.5px solid #D1D5DB",
                fontSize: 15,
                fontFamily: "var(--font-dm-sans, 'DM Sans', Helvetica, sans-serif)",
                outline: "none",
                background: "#fff",
                boxSizing: "border-box",
                transition: "border-color 0.2s",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#1B7A4A")}
              onBlur={(e) => (e.target.style.borderColor = "#D1D5DB")}
            />
            {query && (
              <button
                onClick={handleClear}
                aria-label="Clear search"
                style={{
                  position: "absolute",
                  right: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "#F3F4F6",
                  border: "none",
                  borderRadius: "50%",
                  width: 26,
                  height: 26,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "#6B7280",
                }}
              >
                <XIcon />
              </button>
            )}
          </div>

          {/* A–Z Quick Nav */}
          <div
            aria-label="Jump to letter section"
            style={{ display: "flex", flexWrap: "wrap", gap: isMobile ? 4 : 6 }}
          >
            {ALPHABET.map((letter) => {
              const isActive = LETTERS_WITH_TERMS.has(letter);
              const isMatchedFilter = activeLetters.has(letter);
              const isDisabled = !isActive || (isFiltering && !isMatchedFilter);
              return (
                <a
                  key={letter}
                  href={isDisabled ? undefined : `#letter-${letter}`}
                  aria-disabled={isDisabled}
                  tabIndex={isDisabled ? -1 : 0}
                  onClick={(e) => {
                    if (isDisabled) {
                      e.preventDefault();
                      return;
                    }
                    e.preventDefault();
                    const el = document.getElementById(`letter-${letter}`);
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                  }}
                  style={{
                    width: isMobile ? 28 : 32,
                    height: isMobile ? 28 : 32,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 7,
                    fontFamily: "var(--font-dm-sans, 'DM Sans', Helvetica, sans-serif)",
                    fontSize: isMobile ? 12 : 13,
                    fontWeight: 700,
                    textDecoration: "none",
                    transition: "all 0.15s",
                    cursor: isDisabled ? "default" : "pointer",
                    color: isDisabled
                      ? "#D1D5DB"
                      : isMatchedFilter && isFiltering
                      ? "#1B7A4A"
                      : "#4B5563",
                    background:
                      isMatchedFilter && isFiltering ? "#E8F5EE" : "transparent",
                    border: `1px solid ${
                      isDisabled
                        ? "#F3F4F6"
                        : isMatchedFilter && isFiltering
                        ? "#1B7A4A22"
                        : "#E5E7EB"
                    }`,
                  }}
                >
                  {letter}
                </a>
              );
            })}
          </div>

          {/* Live result count */}
          {isFiltering && (
            <div
              aria-live="polite"
              aria-atomic="true"
              style={{
                marginTop: 10,
                fontSize: 13,
                color: resultCount > 0 ? "#1B7A4A" : "#C41E3A",
                fontWeight: 600,
                fontFamily: "var(--font-dm-sans, 'DM Sans', Helvetica, sans-serif)",
              }}
            >
              {resultCount > 0
                ? `${resultCount} term${resultCount !== 1 ? "s" : ""} found`
                : `No terms found for "${query}"`}
            </div>
          )}
        </div>
      </div>

      {/* ─── Glossary Content ─── */}
      <main
        style={{
          maxWidth: 820,
          margin: "0 auto",
          padding: isMobile ? "0 0 48px" : "0 24px 64px",
        }}
      >
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 24px" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
            <h3
              style={{
                fontFamily: "var(--font-dm-serif, 'DM Serif Display', Georgia, serif)",
                fontSize: 22,
                color: "#1B4F4A",
                margin: "0 0 8px",
              }}
            >
              No terms found
            </h3>
            <p
              style={{
                fontSize: 15,
                color: "#6B7280",
                margin: "0 0 20px",
                lineHeight: 1.6,
              }}
            >
              No results for &ldquo;<strong>{query}</strong>&rdquo;. Try a shorter search or browse by letter above.
            </p>
            <button
              onClick={handleClear}
              style={{
                background: "#1B7A4A",
                color: "#fff",
                border: "none",
                borderRadius: 10,
                padding: "10px 24px",
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "var(--font-dm-sans, 'DM Sans', Helvetica, sans-serif)",
              }}
            >
              Clear search
            </button>
          </div>
        ) : (
          <div
            style={{
              background: "#fff",
              borderRadius: isMobile ? 0 : 16,
              border: isMobile ? "none" : "1px solid #E5E7EB",
              marginTop: 24,
              overflow: "hidden",
              boxShadow: isMobile ? "none" : "0 1px 4px rgba(0,0,0,0.03)",
            }}
          >
            {ALPHABET.filter((l) => filteredGrouped[l]).map((letter) => (
              <LetterSection key={letter} letter={letter} terms={filteredGrouped[letter]} />
            ))}
          </div>
        )}
      </main>

      {/* ─── Newsletter ─── */}
      <NewsletterInline />
    </div>
  );
}
