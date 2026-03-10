import Link from "next/link";

const MapleLeaf = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="#FF6B6B" aria-hidden="true">
    <path d="M12 0L13.5 6.5L17 4L15.5 8.5L22 9L17 12L20 16L14 14L12 24L10 14L4 16L7 12L2 9L8.5 8.5L7 4L10.5 6.5Z" />
  </svg>
);

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
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <MapleLeaf />
          <span
            style={{
              fontFamily: "var(--font-dm-serif, 'DM Serif Display', Georgia, serif)",
              fontSize: 16,
              color: "rgba(255,255,255,0.85)",
            }}
          >
            Maple Insight
          </span>
        </div>

        {/* Copyright + links */}
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
          <span>© 2026 Maple Insight · Educational content only · Not financial advice</span>
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
          <span>·</span>
          <Link
            href="/contact"
            style={{ color: "rgba(255,255,255,0.6)", textDecoration: "underline" }}
          >
            Contact
          </Link>
        </div>
      </div>
    </footer>
  );
}
