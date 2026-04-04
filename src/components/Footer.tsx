"use client";

import Link from "next/link";
import { BrandMark } from "./BrandMark";

const TOOLS_LINKS = [
  { href: "/immigration-costs#your-plan", label: "Settlement Cost Calculator" },
  { href: "/settlement-plan",             label: "Your Settlement Plan" },
  { href: "/tools/rrsp-refund",           label: "RRSP Refund Calculator" },
  { href: "/tools/mortgage-comparison",   label: "Mortgage Comparison" },
];

const LEARN_LINKS = [
  { href: "/immigration-costs",           label: "Immigration Costs Guide" },
  { href: "/articles",                    label: "Guides & Articles" },
  { href: "/glossary",                    label: "Glossary" },
];

const RESOURCES_LINKS = [
  { href: "/about",                       label: "About" },
  { href: "/for-consultants",             label: "For Consultants" },
  { href: "/affiliate-disclosure",        label: "Affiliate Disclosure" },
];

const LINK_COLUMNS = [
  { heading: "Tools",     links: TOOLS_LINKS },
  { heading: "Learn",     links: LEARN_LINKS },
  { heading: "Resources", links: RESOURCES_LINKS },
];

const linkStyle = {
  display: "block" as const,
  color: "rgba(255,255,255,0.5)",
  textDecoration: "none",
  lineHeight: 2.2,
  fontSize: 13,
  transition: "color 0.2s",
};

function FooterLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      style={linkStyle}
      onMouseEnter={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.8)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.5)"; }}
    >
      {label}
    </Link>
  );
}

export function Footer() {
  return (
    <footer style={{ background: "#0F2F2D" }}>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "52px 24px 32px" }}>
        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 28 }}>
          <BrandMark size={18} />
          <span style={{ fontFamily: "var(--font-dm-serif, 'DM Serif Display', Georgia, serif)", fontSize: 18, color: "rgba(255,255,255,0.85)" }}>
            Maple Insight
          </span>
        </div>
        <div style={{ marginTop: -16, marginBottom: 28, fontSize: 12, color: "rgba(255,255,255,0.62)" }}>
          Financial Clarity for your move to Canada
        </div>

        {/* 3-column grid */}
        <div className="footer-grid" style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 40,
          marginBottom: 28,
        }}>
          {LINK_COLUMNS.map((col) => (
            <div key={col.heading}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 12 }}>
                {col.heading}
              </div>
              {col.links.map((l) => <FooterLink key={l.href} {...l} />)}
            </div>
          ))}
        </div>

        {/* Featured link */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", padding: "18px 0", marginBottom: 18 }}>
          <Link
            href="/immigration-costs"
            style={{ display: "flex", alignItems: "center", gap: 8, color: "rgba(255,255,255,0.55)", textDecoration: "none", fontSize: 14, transition: "color 0.2s" }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.85)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.55)"; }}
          >
            📊 How Much Money Do I Need to Move to Canada? — Free personalized calculator →
          </Link>
        </div>

        {/* Legal + copyright */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0 8px", alignItems: "center", fontSize: 12, color: "rgba(255,255,255,0.35)" }}>
          <Link href="/privacy" style={{ color: "rgba(255,255,255,0.5)", textDecoration: "underline" }}>Privacy Policy</Link>
          <span>·</span>
          <Link href="/terms" style={{ color: "rgba(255,255,255,0.5)", textDecoration: "underline" }}>Terms of Use</Link>
          <span>·</span>
          <Link href="/disclaimer" style={{ color: "rgba(255,255,255,0.5)", textDecoration: "underline" }}>Disclaimer</Link>
          <span>·</span>
          <Link href="/affiliate-disclosure" style={{ color: "rgba(255,255,255,0.5)", textDecoration: "underline" }}>Affiliate Disclosure</Link>
          <span style={{ marginLeft: 8 }}>© 2026 Maple Insight · Educational content only · Not financial advice</span>
        </div>
      </div>

      {/* Mobile: stack columns */}
      <style>{`
        @media (max-width: 640px) {
          .footer-grid { grid-template-columns: 1fr !important; gap: 28px !important; }
        }
      `}</style>
    </footer>
  );
}
