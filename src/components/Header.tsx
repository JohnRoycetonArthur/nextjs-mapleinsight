"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Container } from "./Container";
import { BrandMark } from "./BrandMark";
import { useSimulatorReport } from "@/hooks/useSimulatorReport";

const NAV_LINKS = [
  { href: "/articles",    label: "Articles"    },
  { href: "/tools",       label: "Calculators" },
  { href: "/glossary",    label: "Glossary"    },
  { href: "/about",       label: "About"       },
];

// ── Pulsing badge dot shown when a report exists ──────────────────────────────
function ReportDot() {
  return (
    <span
      aria-hidden="true"
      style={{
        display: "inline-block",
        width: 7, height: 7,
        borderRadius: "50%",
        background: "#1B7A4A",
        boxShadow: "0 0 0 0 rgba(27,122,74,0.4)",
        animation: "mi-pulse 2s ease-in-out infinite",
        flexShrink: 0,
      }}
    />
  );
}

// ── Primary CTA pill (desktop) ────────────────────────────────────────────────
function PlanCTA({ hasReport }: { hasReport: boolean }) {
  const href  = hasReport ? "/simulator/results" : "/simulator";
  const label = hasReport ? "My Report"           : "Plan My Finances";

  return (
    <Link
      href={href}
      aria-label={hasReport ? "View your saved financial report" : "Start your financial simulation"}
      style={{
        display:        "inline-flex",
        alignItems:     "center",
        gap:            6,
        fontSize:       14,
        color:          "#1B7A4A",
        textDecoration: "none",
        fontWeight:     700,
        background:     "#1B7A4A11",
        padding:        "6px 16px",
        borderRadius:   20,
        border:         "1px solid #1B7A4A22",
        whiteSpace:     "nowrap",
        transition:     "background 0.2s",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "#1B7A4A1A")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "#1B7A4A11")}
    >
      {hasReport && <ReportDot />}
      ✦ {label}
    </Link>
  );
}

// ── Mobile CTA (always visible outside hamburger) ─────────────────────────────
function MobilePlanCTA({ hasReport, onClick }: { hasReport: boolean; onClick: () => void }) {
  const href  = hasReport ? "/simulator/results" : "/simulator";
  const label = hasReport ? "My Report"           : "Plan My Finances";

  return (
    <Link
      href={href}
      onClick={onClick}
      aria-label={hasReport ? "View your saved financial report" : "Start your financial simulation"}
      style={{
        display:        "inline-flex",
        alignItems:     "center",
        gap:            5,
        fontSize:       12,
        color:          "#1B7A4A",
        textDecoration: "none",
        fontWeight:     700,
        background:     "#1B7A4A11",
        padding:        "6px 14px",
        borderRadius:   16,
        border:         "1px solid #1B7A4A22",
        whiteSpace:     "nowrap",
      }}
    >
      {hasReport && <ReportDot />}
      {label}
    </Link>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const { hasReport } = useSimulatorReport();

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  return (
    <>
      {/* Keyframe for pulsing report dot */}
      <style>{`
        @keyframes mi-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(27,122,74,0.4); }
          50%       { box-shadow: 0 0 0 5px rgba(27,122,74,0); }
        }
      `}</style>

      <header className="sticky top-0 z-50 border-b border-ink-200 bg-white">
        <Container>
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3" onClick={() => setIsOpen(false)}>
              <div className="flex h-10 w-10 items-center justify-center" aria-hidden="true">
                <BrandMark size={40} />
              </div>
              <div>
                <div className="font-semibold text-gray-900">Maple Insight Canada</div>
                <div className="text-xs text-gray-500">Financial clarity for newcomers</div>
              </div>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden items-center gap-6 md:flex" aria-label="Main navigation">
              <PlanCTA hasReport={hasReport} />
              {NAV_LINKS.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="text-sm font-medium text-ink-700 no-underline hover:text-ink-900"
                >
                  {l.label}
                </Link>
              ))}
            </nav>

            {/* Mobile: persistent CTA + hamburger */}
            <div className="flex items-center gap-2 md:hidden">
              <MobilePlanCTA hasReport={hasReport} onClick={() => setIsOpen(false)} />
              <button
                className="rounded-md p-2 text-gray-700 hover:bg-gray-100"
                onClick={() => setIsOpen(!isOpen)}
                aria-label={isOpen ? "Close menu" : "Open menu"}
                aria-expanded={isOpen}
                aria-controls="mobile-menu"
              >
                {isOpen ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </Container>

        {/* Mobile dropdown */}
        {isOpen && (
          <div
            id="mobile-menu"
            role="navigation"
            aria-label="Mobile navigation"
            className="md:hidden border-t border-ink-200 bg-white px-4 py-3 flex flex-col gap-1"
          >
            {NAV_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setIsOpen(false)}
                className="block rounded-lg px-3 py-2 text-sm font-medium text-ink-700 no-underline hover:bg-gray-50"
              >
                {l.label}
              </Link>
            ))}
          </div>
        )}
      </header>
    </>
  );
}
