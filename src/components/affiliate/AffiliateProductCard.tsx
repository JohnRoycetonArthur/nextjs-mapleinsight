"use client";

import { useState } from "react";
import { AffiliateProduct, buildAffiliateUrl } from "@/data/affiliateProducts";
import { AffiliateLink } from "./AffiliateLink";

const CheckCircle = ({ color = "#1B7A4A" }: { color?: string }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ flexShrink: 0, marginTop: 2 }}
    aria-hidden="true"
  >
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const MinusCircle = ({ color = "#9CA3AF" }: { color?: string }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ flexShrink: 0, marginTop: 2 }}
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="8" y1="12" x2="16" y2="12" />
  </svg>
);

const ExternalLinkIcon = ({ size = 12 }: { size?: number }) => (
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

interface AffiliateProductCardProps {
  product: AffiliateProduct;
  placement: string;
  isMobile?: boolean;
}

export function AffiliateProductCard({ product, placement, isMobile }: AffiliateProductCardProps) {
  const [hovered, setHovered] = useState(false);
  const url = buildAffiliateUrl(product, placement);

  const isEditorsPick = product.badge === "Editor's Pick";

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "#fff",
        borderRadius: 16,
        border: "1px solid #E5E7EB",
        padding: isMobile ? "24px 20px" : "28px 32px",
        marginBottom: 20,
        boxShadow: hovered
          ? "0 8px 32px rgba(27,79,74,0.10)"
          : "0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.02)",
        transition: "box-shadow 0.3s ease, transform 0.2s ease",
        transform: hovered ? "translateY(-2px)" : "translateY(0)",
        position: "relative",
        fontFamily: "var(--font-dm-sans, 'DM Sans', Helvetica, sans-serif)",
      }}
    >
      {/* Badge */}
      {product.badge && (
        <div
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            background: isEditorsPick ? "#E8F5EE" : "#EFF6FF",
            color: isEditorsPick ? "#1B7A4A" : "#2563EB",
            fontSize: 10,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: 0.8,
            padding: "4px 10px",
            borderRadius: 6,
            border: `1px solid ${isEditorsPick ? "#1B7A4A" : "#2563EB"}18`,
          }}
        >
          {product.badge}
        </div>
      )}

      {/* Affiliate marker */}
      <div
        style={{
          fontSize: 10,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: 0.8,
          color: "#9CA3AF",
          marginBottom: 12,
        }}
      >
        Affiliate
      </div>

      {/* Product header */}
      <div
        style={{
          display: "flex",
          alignItems: isMobile ? "flex-start" : "center",
          gap: 16,
          marginBottom: 16,
          flexDirection: isMobile ? "column" : "row",
        }}
      >
        {/* Logo placeholder */}
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 14,
            background: "linear-gradient(135deg, #E8F5EE 0%, #EFF6FF 100%)",
            border: "1px solid #E5E7EB",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 24,
            flexShrink: 0,
          }}
          aria-hidden="true"
        >
          🏦
        </div>
        <div style={{ flex: 1 }}>
          <h4
            style={{
              margin: 0,
              fontFamily: "var(--font-dm-serif, 'DM Serif Display', Georgia, serif)",
              fontSize: 20,
              color: "#1B4F4A",
              fontWeight: 700,
              lineHeight: 1.3,
            }}
          >
            {product.name}
          </h4>
          <p
            style={{
              margin: "4px 0 0",
              fontSize: 14,
              color: "#6B7280",
              lineHeight: 1.6,
            }}
          >
            {product.description}
          </p>
        </div>
      </div>

      {/* Pros / Cons */}
      <div
        style={{
          display: "flex",
          gap: isMobile ? 12 : 32,
          flexWrap: "wrap",
          marginBottom: 20,
        }}
      >
        <div style={{ flex: "1 1 200px" }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 1,
              color: "#1B7A4A",
              marginBottom: 8,
            }}
          >
            What we like
          </div>
          {product.pros.map((pro, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                gap: 8,
                marginBottom: 6,
                fontSize: 13,
                color: "#374151",
                lineHeight: 1.5,
              }}
            >
              <CheckCircle />
              <span>{pro}</span>
            </div>
          ))}
        </div>
        <div style={{ flex: "1 1 200px" }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 1,
              color: "#9CA3AF",
              marginBottom: 8,
            }}
          >
            Consider
          </div>
          {product.cons.map((con, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                gap: 8,
                marginBottom: 6,
                fontSize: 13,
                color: "#6B7280",
                lineHeight: 1.5,
              }}
            >
              <MinusCircle />
              <span>{con}</span>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
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
          fontSize: 14,
          padding: "12px 24px",
          borderRadius: 10,
          transition: "background 0.2s, transform 0.15s",
          fontFamily: "var(--font-dm-sans, 'DM Sans', Helvetica, sans-serif)",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLAnchorElement).style.background = "#166B3F";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLAnchorElement).style.background = "#1B7A4A";
        }}
      >
        {product.ctaText}
        <ExternalLinkIcon />
      </AffiliateLink>
    </div>
  );
}
