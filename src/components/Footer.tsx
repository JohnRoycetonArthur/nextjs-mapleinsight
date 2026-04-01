"use client";

import Link from "next/link";
import { BrandMark } from "./BrandMark";

const NAV_LINKS = [
  { href: "/settlement-planner/plan", label: "Settlement Planner" },
  { href: "/articles",                label: "Articles"           },
  { href: "/tools",                   label: "Calculators"        },
  { href: "/#for-consultants",        label: "For Consultants"    },
  { href: "/glossary",                label: "Glossary"           },
  { href: "/about",                   label: "About"              },
];

export function Footer() {
  return (
    <footer style={{ background: "#0F2F2D" }}>
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "48px 24px 32px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: 24,
        }}
      >
        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <BrandMark size={16} />
          <span
            style={{
              fontFamily: "var(--font-dm-serif, 'DM Serif Display', Georgia, serif)",
              fontSize: 16,
              color: "rgba(255,255,255,0.85)",
            }}
          >
            Maple Insight Canada
          </span>
        </div>

        {/* Nav links */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "8px 20px",
            fontSize: 12,
            alignItems: "center",
          }}
        >
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              style={{
                color: "rgba(255,255,255,0.5)",
                textDecoration: "none",
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.8)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.5)"; }}
            >
              {l.label}
            </Link>
          ))}
        </div>

        {/* Legal + copyright */}
        <div
          style={{
            fontSize: 12,
            fontFamily: "var(--font-dm-sans, 'DM Sans', Helvetica, sans-serif)",
            display: "flex",
            flexDirection: "column",
            gap: 6,
            alignItems: "flex-end",
          }}
        >
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "0 8px",
              alignItems: "center",
              color: "rgba(255,255,255,0.45)",
            }}
          >
            <Link href="/privacy" style={{ color: "rgba(255,255,255,0.6)", textDecoration: "underline" }}>
              Privacy Policy
            </Link>
            <span>·</span>
            <Link href="/terms" style={{ color: "rgba(255,255,255,0.6)", textDecoration: "underline" }}>
              Terms of Use
            </Link>
            <span>·</span>
            <Link href="/disclaimer" style={{ color: "rgba(255,255,255,0.6)", textDecoration: "underline" }}>
              Disclaimer
            </Link>
            <span>·</span>
            <Link href="/affiliate-disclosure" style={{ color: "rgba(255,255,255,0.6)", textDecoration: "underline" }}>
              Affiliate Disclosure
            </Link>
          </div>
          <span style={{ color: "rgba(255,255,255,0.35)" }}>
            © 2026 Maple Insight Canada · Educational content only · Not financial advice
          </span>
        </div>
      </div>
    </footer>
  );
}
