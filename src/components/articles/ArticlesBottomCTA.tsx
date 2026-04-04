"use client";

import { C, font, serif } from "./config";

const MAPLE_LEAF_PATH =
  "M12 0L13.5 6.5L17 4L15.5 8.5L22 9L17 12L20 16L14 14L12 24L10 14L4 16L7 12L2 9L8.5 8.5L7 4L10.5 6.5Z";

export function ArticlesBottomCTA() {
  return (
    <div
      style={{
        padding: "30px 24px",
        borderRadius: 16,
        background: `linear-gradient(135deg, ${C.forest}, #1A3F3B)`,
        textAlign: "center",
        position: "relative",
        overflow: "hidden",
        marginTop: 16,
      }}
    >
      {/* Decorative orb */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: -25,
          right: -25,
          width: 120,
          height: 120,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${C.accent}20, transparent 70%)`,
        }}
      />

      <div style={{ position: "relative", zIndex: 1 }}>
        <h3
          style={{
            fontFamily: serif,
            fontSize: 20,
            color: "#fff",
            margin: "0 0 6px",
            fontWeight: 700,
          }}
        >
          Not sure where to start?
        </h3>
        <p
          style={{
            fontFamily: font,
            fontSize: 13,
            color: "#ffffffAA",
            margin: "0 0 16px",
            maxWidth: 360,
            marginLeft: "auto",
            marginRight: "auto",
            lineHeight: 1.6,
          }}
        >
          Get a personalized settlement cost estimate in 3 minutes.
        </p>
        <a
          href="/immigration-costs#your-plan"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "11px 24px",
            borderRadius: 100,
            background: `linear-gradient(135deg, ${C.gold}, #D4A017)`,
            color: "#fff",
            fontFamily: font,
            fontSize: 13,
            fontWeight: 700,
            textDecoration: "none",
            boxShadow: `0 4px 14px ${C.gold}40`,
          }}
        >
          <svg width={12} height={12} viewBox="0 0 24 24" fill="#fff" aria-hidden="true">
            <path d={MAPLE_LEAF_PATH} />
          </svg>
          Start My Free Plan
        </a>
      </div>
    </div>
  );
}
