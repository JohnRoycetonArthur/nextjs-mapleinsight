"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Container } from "./Container";
import { BrandMark } from "./BrandMark";
import { Layers, TabClose } from "nucleo-glass-icons/react";

const NAV_LINKS = [
  { href: "/articles",        label: "Articles"         },
  { href: "/tools",           label: "Calculators"      },
  { href: "/for-consultants", label: "For Consultants"  },
  { href: "/about",           label: "About"            },
];

// ── Component ─────────────────────────────────────────────────────────────────

export function Header() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-ink-200 bg-white">
      <Container>
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3" onClick={() => setIsOpen(false)}>
            <div className="flex h-10 w-10 items-center justify-center" aria-hidden="true">
              <BrandMark size={40} />
            </div>
            <div>
              <div className="font-semibold text-gray-900 leading-tight">
                Maple Insight<span className="hidden md:inline"> Canada</span>
              </div>
              <div className="hidden md:block text-xs text-gray-500">Financial clarity for newcomers</div>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-6 md:flex" aria-label="Main navigation">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-sm font-medium text-ink-700 no-underline hover:text-ink-900"
              >
                {l.label}
              </Link>
            ))}
            {/* Primary CTA button */}
            <Link
              href="/settlement-planner/plan"
              aria-label="Start your free settlement plan"
              style={{
                display:      "inline-flex",
                alignItems:   "center",
                gap:          5,
                fontSize:     14,
                color:        "#fff",
                textDecoration: "none",
                fontWeight:   700,
                background:   "#1B7A4A",
                padding:      "9px 20px",
                borderRadius: 9,
                border:       "none",
                whiteSpace:   "nowrap",
                boxShadow:    "0 2px 8px rgba(27,122,74,0.2)",
                transition:   "background 0.2s, transform 0.15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-1px)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}
            >
              Start Free Plan
            </Link>
          </nav>

          {/* Mobile: compact CTA + hamburger */}
          <div className="flex items-center gap-2 md:hidden">
            <Link
              href="/settlement-planner/plan"
              aria-label="Start your free settlement plan"
              style={{
                display:      "inline-flex",
                alignItems:   "center",
                fontSize:     12,
                color:        "#fff",
                textDecoration: "none",
                fontWeight:   700,
                background:   "#1B7A4A",
                padding:      "7px 14px",
                borderRadius: 8,
                whiteSpace:   "nowrap",
              }}
              onClick={() => setIsOpen(false)}
            >
              Start Free Plan
            </Link>
            <button
              className="rounded-md p-2 text-gray-700 hover:bg-gray-100"
              onClick={() => setIsOpen(!isOpen)}
              aria-label={isOpen ? "Close menu" : "Open menu"}
              aria-expanded={isOpen}
              aria-controls="mobile-menu"
            >
              {isOpen ? (
                <TabClose size={22} stopColor1="#374151" stopColor2="#1B4F4A" />
              ) : (
                <Layers size={22} stopColor1="#374151" stopColor2="#1B4F4A" />
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
  );
}
