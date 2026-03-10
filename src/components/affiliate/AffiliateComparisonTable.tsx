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

interface AffiliateComparisonTableProps {
  products: AffiliateProduct[];
  placement: string;
  isMobile?: boolean;
}

export function AffiliateComparisonTable({
  products,
  placement,
  isMobile,
}: AffiliateComparisonTableProps) {
  const isEditorsPick = (p: AffiliateProduct) => p.badge === "Editor's Pick";

  if (isMobile) {
    return (
      <div style={{ margin: "24px 0" }}>
        <div
          style={{
            fontFamily: "var(--font-dm-serif, 'DM Serif Display', Georgia, serif)",
            fontSize: 20,
            color: "#1B4F4A",
            fontWeight: 700,
            marginBottom: 16,
          }}
        >
          Compare Newcomer Bank Accounts
        </div>
        {products.map((p) => (
          <div
            key={p.id}
            style={{
              background: "#fff",
              borderRadius: 14,
              border: isEditorsPick(p) ? "1px solid #1B7A4A33" : "1px solid #E5E7EB",
              borderLeft: isEditorsPick(p) ? "4px solid #1B7A4A" : "1px solid #E5E7EB",
              padding: "18px 16px",
              marginBottom: 10,
              fontFamily: "var(--font-dm-sans, 'DM Sans', Helvetica, sans-serif)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: 8,
              }}
            >
              <div>
                <div style={{ fontWeight: 700, fontSize: 16, color: "#1B4F4A" }}>{p.name}</div>
                <div style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>{p.keyFeature}</div>
              </div>
              {p.badge && (
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    background: "#E8F5EE",
                    color: "#1B7A4A",
                    padding: "3px 8px",
                    borderRadius: 4,
                    whiteSpace: "nowrap",
                  }}
                >
                  {p.badge}
                </span>
              )}
            </div>
            <div style={{ fontSize: 13, color: "#6B7280", marginBottom: 12 }}>
              Monthly fee:{" "}
              <strong style={{ color: "#1B4F4A" }}>{p.monthlyFee}</strong>
            </div>
            <AffiliateLink
              href={buildAffiliateUrl(p, placement)}
              aria-label={`${p.ctaText} — opens ${p.name} in a new tab`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                fontSize: 13,
                fontWeight: 700,
                color: "#1B7A4A",
                background: "#E8F5EE",
                padding: "8px 16px",
                borderRadius: 8,
                border: "1px solid #1B7A4A18",
                fontFamily: "var(--font-dm-sans, 'DM Sans', Helvetica, sans-serif)",
              }}
            >
              {p.ctaText}
              <ExternalLinkIcon />
            </AffiliateLink>
          </div>
        ))}
        <div
          style={{
            fontSize: 11,
            color: "#9CA3AF",
            marginTop: 8,
            fontFamily: "var(--font-dm-sans, 'DM Sans', Helvetica, sans-serif)",
          }}
        >
          Affiliate links — we may earn a commission
        </div>
      </div>
    );
  }

  return (
    <div style={{ margin: "32px 0" }}>
      <div
        style={{
          fontFamily: "var(--font-dm-serif, 'DM Serif Display', Georgia, serif)",
          fontSize: 22,
          color: "#1B4F4A",
          fontWeight: 700,
          marginBottom: 16,
        }}
      >
        Compare Newcomer Bank Accounts
      </div>
      <div
        style={{
          borderRadius: 14,
          overflow: "hidden",
          border: "1px solid #E5E7EB",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontFamily: "var(--font-dm-sans, 'DM Sans', Helvetica, sans-serif)",
          }}
        >
          <thead>
            <tr style={{ background: "#E8F5EE" }}>
              {["Product", "Monthly Fee", "Key Feature", ""].map((h, i) => (
                <th
                  key={i}
                  style={{
                    padding: "14px 18px",
                    textAlign: "left",
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: 0.8,
                    color: "#1B7A4A",
                    borderBottom: "1px solid #1B7A4A22",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {products.map((p, i) => (
              <tr
                key={p.id}
                style={{
                  background: isEditorsPick(p) ? "#F0FAF4" : i % 2 === 1 ? "#FAFBFC" : "#fff",
                  borderLeft: isEditorsPick(p)
                    ? "3px solid #1B7A4A"
                    : "3px solid transparent",
                }}
              >
                <td style={{ padding: "16px 18px", borderBottom: "1px solid #F3F4F6" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontWeight: 700, fontSize: 15, color: "#1B4F4A" }}>
                      {p.name}
                    </span>
                    {p.badge && (
                      <span
                        style={{
                          fontSize: 9,
                          fontWeight: 700,
                          textTransform: "uppercase",
                          background: "#E8F5EE",
                          color: "#1B7A4A",
                          padding: "2px 7px",
                          borderRadius: 4,
                        }}
                      >
                        {p.badge}
                      </span>
                    )}
                  </div>
                </td>
                <td
                  style={{
                    padding: "16px 18px",
                    borderBottom: "1px solid #F3F4F6",
                    fontSize: 14,
                    fontWeight: 600,
                    color: "#374151",
                  }}
                >
                  {p.monthlyFee}
                </td>
                <td
                  style={{
                    padding: "16px 18px",
                    borderBottom: "1px solid #F3F4F6",
                    fontSize: 14,
                    color: "#6B7280",
                  }}
                >
                  {p.keyFeature}
                </td>
                <td style={{ padding: "16px 18px", borderBottom: "1px solid #F3F4F6" }}>
                  <AffiliateLink
                    href={buildAffiliateUrl(p, placement)}
                    aria-label={`${p.ctaText} — opens ${p.name} in a new tab`}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      fontSize: 13,
                      fontWeight: 700,
                      color: "#1B7A4A",
                      background: "#E8F5EE",
                      padding: "7px 14px",
                      borderRadius: 8,
                      border: "1px solid #1B7A4A18",
                      transition: "background 0.2s",
                      fontFamily: "var(--font-dm-sans, 'DM Sans', Helvetica, sans-serif)",
                      whiteSpace: "nowrap",
                    }}
                    onMouseEnter={(e) =>
                      ((e.currentTarget as HTMLAnchorElement).style.background = "#D1EDDB")
                    }
                    onMouseLeave={(e) =>
                      ((e.currentTarget as HTMLAnchorElement).style.background = "#E8F5EE")
                    }
                  >
                    {p.ctaText}
                    <ExternalLinkIcon />
                  </AffiliateLink>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div
        style={{
          fontSize: 11,
          color: "#9CA3AF",
          marginTop: 8,
          fontFamily: "var(--font-dm-sans, 'DM Sans', Helvetica, sans-serif)",
        }}
      >
        Affiliate links — we may earn a commission. See our{" "}
        <a
          href="/affiliate-disclosure"
          style={{ color: "#9CA3AF", textDecoration: "underline" }}
        >
          full disclosure
        </a>
        .
      </div>
    </div>
  );
}
