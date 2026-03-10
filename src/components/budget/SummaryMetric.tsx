"use client";

import React from "react";

interface SummaryMetricProps {
  label: string;
  value: string;
  color: string;
  icon?: React.ReactNode;
  subtext?: string;
  isMobile: boolean;
}

export function SummaryMetric({ label, value, color, icon, subtext, isMobile }: SummaryMetricProps) {
  return (
    <div
      style={{
        flex: isMobile ? "1 1 100%" : "1 1 0",
        textAlign: isMobile ? "left" : "center",
        padding: isMobile ? "12px 0" : "16px 8px",
        borderBottom: isMobile ? "1px solid #F3F4F6" : "none",
        display: isMobile ? "flex" : "block",
        alignItems: "center",
        gap: isMobile ? 14 : 0,
      }}
    >
      {isMobile && icon && (
        <div style={{ color, flexShrink: 0, opacity: 0.7 }}>{icon}</div>
      )}
      <div>
        {!isMobile && icon && (
          <div style={{ color, marginBottom: 4, display: "flex", justifyContent: "center" }}>
            {icon}
          </div>
        )}
        <div
          style={{
            fontFamily: "var(--font-dm-serif, 'DM Serif Display', Georgia, serif)",
            fontSize: isMobile ? 24 : 28,
            fontWeight: 700,
            color,
            lineHeight: 1.1,
          }}
        >
          {value}
        </div>
        <div
          style={{
            fontFamily: "var(--font-dm-sans, 'DM Sans', Helvetica, sans-serif)",
            fontSize: 12,
            color: "#9CA3AF",
            fontWeight: 500,
            marginTop: 4,
            textTransform: "uppercase",
            letterSpacing: 0.5,
          }}
        >
          {label}
        </div>
        {subtext && (
          <div
            style={{
              fontFamily: "var(--font-dm-sans, 'DM Sans', Helvetica, sans-serif)",
              fontSize: 12,
              color: "#6B7280",
              marginTop: 2,
            }}
          >
            {subtext}
          </div>
        )}
      </div>
    </div>
  );
}
