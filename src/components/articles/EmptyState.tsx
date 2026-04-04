"use client";

import { C, font, serif } from "./config";

interface Props {
  onReset: () => void;
}

export function EmptyState({ onReset }: Props) {
  return (
    <div
      style={{
        textAlign: "center",
        padding: "50px 20px",
        borderRadius: 14,
        background: C.white,
        border: `1px solid ${C.border}`,
      }}
    >
      <div style={{ fontSize: 36, marginBottom: 10 }} aria-hidden="true">
        🔍
      </div>
      <h3
        style={{
          fontFamily: serif,
          fontSize: 18,
          color: C.forest,
          margin: "0 0 6px",
          fontWeight: 700,
        }}
      >
        No articles found
      </h3>
      <p style={{ fontFamily: font, fontSize: 13, color: C.gray, margin: "0 0 14px" }}>
        Try a different search term or browse by category.
      </p>
      <button
        onClick={onReset}
        style={{
          fontFamily: font,
          fontSize: 13,
          fontWeight: 600,
          color: C.white,
          background: C.accent,
          border: "none",
          borderRadius: 8,
          padding: "8px 18px",
          cursor: "pointer",
          minHeight: 44,
          minWidth: 44,
        }}
      >
        Show all
      </button>
    </div>
  );
}
