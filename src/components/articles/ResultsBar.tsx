"use client";

import { CATEGORIES, C, font } from "./config";

interface Props {
  activeCategory: string;
  searchQuery: string;
  resultCount: number;
  onClear: () => void;
}

export function ResultsBar({ activeCategory, searchQuery, resultCount, onClear }: Props) {
  const activeCat = CATEGORIES.find((c) => c.id === activeCategory);
  const isFiltered = activeCategory !== "all" || searchQuery !== "";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 20,
        flexWrap: "wrap",
        gap: 8,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {activeCategory !== "all" && (
          <span style={{ fontSize: 20 }} aria-hidden="true">
            {activeCat?.icon}
          </span>
        )}
        <div>
          <div style={{ fontFamily: font, fontSize: 14, fontWeight: 600, color: C.textDark }}>
            {searchQuery
              ? `${resultCount} result${resultCount !== 1 ? "s" : ""} for "${searchQuery}"`
              : activeCategory === "all"
              ? `All articles (${resultCount})`
              : activeCat?.label}
          </div>
          {activeCategory !== "all" && activeCat?.desc && !searchQuery && (
            <div style={{ fontFamily: font, fontSize: 12, color: C.gray, marginTop: 2 }}>
              {activeCat.desc}
            </div>
          )}
        </div>
      </div>

      {isFiltered && (
        <button
          onClick={onClear}
          style={{
            fontFamily: font,
            fontSize: 12,
            fontWeight: 600,
            color: C.gray,
            background: C.lightGray,
            border: "none",
            borderRadius: 6,
            padding: "5px 10px",
            cursor: "pointer",
          }}
        >
          ✕ Clear
        </button>
      )}
    </div>
  );
}
