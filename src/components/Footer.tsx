import Link from "next/link";
import { BrandMark } from "./BrandMark";

export function Footer() {
  return (
    <footer style={{ background: "#0F2F2D" }}>
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "32px 24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 16,
        }}
      >
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

        <div
          style={{
            fontSize: 13,
            color: "rgba(255,255,255,0.45)",
            fontFamily: "var(--font-dm-sans, 'DM Sans', Helvetica, sans-serif)",
            display: "flex",
            flexWrap: "wrap",
            gap: "0 8px",
            alignItems: "center",
          }}
        >
          <span>© 2026 Maple Insight Canada · Educational content only · Not financial advice</span>
          <span>·</span>
          <Link
            href="/affiliate-disclosure"
            style={{ color: "rgba(255,255,255,0.6)", textDecoration: "underline" }}
          >
            Affiliate Disclosure
          </Link>
          <span>·</span>
          <Link
            href="/recommended-tools"
            style={{ color: "rgba(255,255,255,0.6)", textDecoration: "underline" }}
          >
            Recommended Tools
          </Link>
          <span>·</span>
          <Link href="/about" style={{ color: "rgba(255,255,255,0.6)", textDecoration: "underline" }}>
            About
          </Link>
        </div>
      </div>
    </footer>
  );
}
