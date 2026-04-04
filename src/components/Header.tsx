"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Container } from "./Container";
import { BrandMark } from "./BrandMark";
import { Layers, TabClose } from "nucleo-glass-icons/react";

const NAV_LINKS = [
  { href: "/immigration-costs", label: "Calculate Costs",       activeMatch: (p: string) => p.startsWith("/immigration-costs") },
  { href: "/settlement-plan",   label: "Your Settlement Plan",  activeMatch: (p: string) => p === "/settlement-plan" },
  { href: "/articles",          label: "Guides & Articles",     activeMatch: (p: string) => p.startsWith("/articles") },
  { href: "/about",             label: "About",                 activeMatch: (p: string) => p === "/about" },
];

const MOBILE_SECONDARY = [
  { href: "/about",            label: "About"              },
  { href: "/glossary",         label: "Glossary"           },
  { href: "/for-consultants",  label: "For Consultants"    },
];

// Maple leaf icon (reused from design system)
const MapleLeaf = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="#D52B1E" aria-hidden="true">
    <path d="M12 0L13.5 6.5L17 4L15.5 8.5L22 9L17 12L20 16L14 14L12 24L10 14L4 16L7 12L2 9L8.5 8.5L7 4L10.5 6.5Z" />
  </svg>
);

// ── Component ─────────────────────────────────────────────────────────────────

export function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

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
              <div
                style={{
                  fontFamily: "var(--font-dm-serif, 'DM Serif Display', Georgia, serif)",
                  fontSize: 18,
                  color: "#111827",
                  lineHeight: 1.1,
                }}
              >
                Maple Insight
              </div>
              <div className="hidden md:block text-xs text-gray-500">Financial Clarity for your move to Canada</div>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-6 md:flex" aria-label="Main navigation">
            {NAV_LINKS.map((l) => {
              const isActive = l.activeMatch(pathname);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  style={{
                    fontSize: 14,
                    fontWeight: 500,
                    textDecoration: "none",
                    color: isActive ? "#1B7A4A" : "#4B5563",
                    borderBottom: isActive ? "2px solid #1B7A4A" : "2px solid transparent",
                    paddingBottom: 2,
                    transition: "color 0.15s, border-color 0.15s",
                  }}
                >
                  {l.label}
                </Link>
              );
            })}
          </nav>

          {/* Mobile: hamburger only */}
          <div className="flex items-center gap-2 md:hidden">
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
          {/* Primary nav items */}
          {NAV_LINKS.map((l) => {
            const isActive = l.activeMatch(pathname);
            return (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setIsOpen(false)}
                style={{
                  display: "block",
                  borderRadius: 8,
                  padding: "10px 12px",
                  fontSize: 14,
                  fontWeight: isActive ? 600 : 500,
                  textDecoration: "none",
                  color: isActive ? "#1B7A4A" : "#374151",
                  background: isActive ? "rgba(27, 122, 74, 0.06)" : "transparent",
                }}
              >
                {l.label}
              </Link>
            );
          })}

          {/* CTA row */}
          <div style={{ margin: "4px 0", borderTop: "1px solid #E5E7EB", paddingTop: 8 }} />
          <Link
            href="/immigration-costs#your-plan"
            onClick={() => setIsOpen(false)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              borderRadius: 8,
              padding: "10px 12px",
              fontSize: 14,
              fontWeight: 700,
              textDecoration: "none",
              color: "#1B7A4A",
              background: "rgba(27, 122, 74, 0.06)",
              borderLeft: "3px solid #1B7A4A",
            }}
          >
            <MapleLeaf /> Start My Free Plan
          </Link>
          <div style={{ margin: "4px 0", borderTop: "1px solid #E5E7EB", paddingTop: 8 }} />

          {/* Secondary links */}
          {MOBILE_SECONDARY.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setIsOpen(false)}
              style={{
                display: "block",
                borderRadius: 8,
                padding: "8px 12px",
                fontSize: 13,
                fontWeight: 500,
                textDecoration: "none",
                color: "#6B7280",
              }}
            >
              {l.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
