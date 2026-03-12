import Link from "next/link";

const InfoIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#92400E"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ flexShrink: 0 }}
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);

interface AffiliateDisclosureProps {
  isMobile?: boolean;
}

export function AffiliateDisclosure({ isMobile }: AffiliateDisclosureProps) {
  return (
    <div
      role="note"
      aria-label="Affiliate disclosure"
      style={{
        maxWidth: 720,
        margin: isMobile ? "20px 0 0" : "28px auto 0",
        padding: "14px 18px",
        background: "#FDF6E3",
        borderLeft: "4px solid #B8860B",
        borderRadius: "0 12px 12px 0",
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        fontFamily: "var(--font-dm-sans, 'DM Sans', Helvetica, sans-serif)",
      }}
    >
      <InfoIcon />
      <div style={{ minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: "#92400E" }}>
          This article contains affiliate links. If you sign up through our links, we may earn a
          commission at no extra cost to you.{" "}
          <Link
            href="/affiliate-disclosure"
            style={{
              color: "#92400E",
              fontWeight: 700,
              textDecoration: "underline",
              textUnderlineOffset: 2,
            }}
          >
            Full disclosure →
          </Link>
        </p>
      </div>
    </div>
  );
}
