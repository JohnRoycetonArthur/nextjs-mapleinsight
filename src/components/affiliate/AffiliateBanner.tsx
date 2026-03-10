"use client";

import { AffiliateProduct, buildAffiliateUrl } from "@/data/affiliateProducts";
import { AffiliateLink } from "./AffiliateLink";

const ExternalLinkIcon = ({ size = 11 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ marginLeft: 4, flexShrink: 0 }}
    aria-hidden="true"
  >
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
);

interface AffiliateBannerProps {
  product: AffiliateProduct;
  placement: string;
  isMobile?: boolean;
}

export function AffiliateBanner({ product, placement, isMobile }: AffiliateBannerProps) {
  const url = buildAffiliateUrl(product, placement);
  const firstSentence = product.description.split(".")[0] + ".";

  return (
    <div
      style={{
        background: "linear-gradient(135deg, #E8F5EE 0%, #EFF6FF 100%)",
        borderRadius: 14,
        padding: isMobile ? "22px 18px" : "24px 28px",
        margin: "28px 0",
        border: "1px solid #1B7A4A15",
        display: "flex",
        alignItems: isMobile ? "flex-start" : "center",
        gap: isMobile ? 14 : 20,
        flexDirection: isMobile ? "column" : "row",
        fontFamily: "var(--font-dm-sans, 'DM Sans', Helvetica, sans-serif)",
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 12,
          background: "#fff",
          border: "1px solid #1B7A4A18",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 22,
          flexShrink: 0,
        }}
        aria-hidden="true"
      >
        💡
      </div>
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontWeight: 700,
            fontSize: 15,
            color: "#1B4F4A",
            marginBottom: 2,
          }}
        >
          We recommend {product.name}
        </div>
        <div style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.5 }}>
          {firstSentence}
          <span style={{ fontSize: 11, color: "#9CA3AF", marginLeft: 4 }}>Affiliate</span>
        </div>
      </div>
      <AffiliateLink
        href={url}
        aria-label={`${product.ctaText} — opens ${product.name} in a new tab`}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          background: "#1B7A4A",
          color: "#fff",
          fontWeight: 700,
          fontSize: 13,
          padding: "10px 20px",
          borderRadius: 10,
          transition: "background 0.2s",
          whiteSpace: "nowrap",
          flexShrink: 0,
          fontFamily: "var(--font-dm-sans, 'DM Sans', Helvetica, sans-serif)",
        }}
        onMouseEnter={(e) =>
          ((e.currentTarget as HTMLAnchorElement).style.background = "#166B3F")
        }
        onMouseLeave={(e) =>
          ((e.currentTarget as HTMLAnchorElement).style.background = "#1B7A4A")
        }
      >
        {product.ctaText}
        <ExternalLinkIcon />
      </AffiliateLink>
    </div>
  );
}
