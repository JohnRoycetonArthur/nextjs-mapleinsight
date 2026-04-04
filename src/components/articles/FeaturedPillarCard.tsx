"use client";

import { useState } from "react";
import { Schedule, ArrowRightAlt } from "@material-symbols-svg/react";
import { C, font, serif } from "./config";
import type { PillarArticleMeta } from "@/sanity/queries";

interface Props {
  pillarArticle: PillarArticleMeta;
  activeCategory: string;
  searchQuery: string;
}

export function FeaturedPillarCard({ pillarArticle, activeCategory, searchQuery }: Props) {
  const [hovered, setHovered] = useState(false);

  if (!pillarArticle || activeCategory !== "all" || searchQuery !== "") return null;

  return (
    <a
      href="/immigration-costs"
      style={{
        display: "block",
        textDecoration: "none",
        borderRadius: 16,
        overflow: "hidden",
        background: `linear-gradient(135deg, ${C.forest}, #1A3F3B)`,
        marginBottom: 32,
        position: "relative",
        transition: "box-shadow .3s, transform .2s",
        boxShadow: hovered ? `0 12px 40px ${C.forest}30` : "none",
        transform: hovered ? "translateY(-2px)" : "translateY(0)",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Decorative orb */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: -40,
          right: -40,
          width: 200,
          height: 200,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${C.accent}18, transparent 70%)`,
        }}
      />

      <div style={{ padding: "28px 24px", position: "relative", zIndex: 1 }}>
        {/* Badge + reading time */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: C.gold,
              background: `${C.gold}20`,
              borderRadius: 100,
              padding: "3px 10px",
              textTransform: "uppercase",
              letterSpacing: 1,
              fontFamily: font,
            }}
          >
            Featured Guide
          </span>
          {pillarArticle.readingTime != null && (
            <span
              style={{
                fontSize: 11,
                color: "#ffffff40",
                display: "flex",
                alignItems: "center",
                gap: 3,
                fontFamily: font,
              }}
            >
              <Schedule size={12} color="#ffffff40" aria-hidden="true" />
              {pillarArticle.readingTime} min
            </span>
          )}
        </div>

        {/* Title */}
        <h2
          style={{
            fontFamily: serif,
            fontSize: 22,
            fontWeight: 700,
            color: "#fff",
            margin: "0 0 6px",
            lineHeight: 1.2,
          }}
        >
          Are You Financially Ready to Move to Canada?
        </h2>

        {/* Excerpt */}
        <p
          style={{
            fontFamily: font,
            fontSize: 13,
            color: "#ffffff99",
            margin: "0 0 14px",
            lineHeight: 1.6,
            maxWidth: 500,
          }}
        >
          The complete 2026 breakdown — every pathway, real IRCC data, and a free personalized
          settlement calculator.
        </p>

        {/* CTA + feature pills */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              fontSize: 12,
              fontWeight: 700,
              color: C.gold,
              fontFamily: font,
            }}
          >
            ✨ Read + calculate your cost{" "}
            <ArrowRightAlt size={10} color={C.gold} aria-hidden="true" />
          </span>
          {["6 pathways", "IRCC data", "Free calculator"].map((t) => (
            <span
              key={t}
              style={{
                fontFamily: font,
                fontSize: 10,
                color: "#ffffff50",
                background: "rgba(255,255,255,.07)",
                borderRadius: 4,
                padding: "3px 8px",
              }}
            >
              {t}
            </span>
          ))}
        </div>
      </div>
    </a>
  );
}
