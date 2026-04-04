"use client";

import { CATEGORIES, C, font } from "./config";

interface Props {
  activeCategory: string;
  onCategoryChange: (id: string) => void;
  articleCounts: Record<string, number>;
}

export function TopicNav({ activeCategory, onCategoryChange, articleCounts }: Props) {
  return (
    <div
      style={{
        position: "sticky",
        top: 64,
        zIndex: 40,
        background: C.white,
        borderBottom: `1px solid ${C.border}`,
        boxShadow: "0 2px 8px rgba(0,0,0,.04)",
      }}
    >
      <div
        role="tablist"
        aria-label="Filter articles by topic"
        style={{
          maxWidth: 860,
          margin: "0 auto",
          padding: "0 16px",
          display: "flex",
          alignItems: "center",
          overflowX: "auto",
          gap: 2,
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        {CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => onCategoryChange(cat.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                padding: "12px 14px",
                background: "transparent",
                border: "none",
                borderBottom: `2px solid ${isActive ? cat.color : "transparent"}`,
                cursor: "pointer",
                fontFamily: font,
                fontSize: 13,
                fontWeight: isActive ? 700 : 500,
                color: isActive ? cat.color : C.gray,
                whiteSpace: "nowrap",
                transition: "all .2s",
                flexShrink: 0,
              }}
            >
              <span style={{ fontSize: 14 }} aria-hidden="true">
                {cat.icon}
              </span>
              {cat.label}
              {cat.id !== "all" && (
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    color: isActive ? cat.color : C.textLight,
                    background: isActive ? `${cat.color}15` : C.lightGray,
                    borderRadius: 4,
                    padding: "1px 5px",
                  }}
                >
                  {articleCounts[cat.id] ?? 0}
                </span>
              )}
            </button>
          );
        })}
      </div>
      <style>{`div::-webkit-scrollbar{display:none}`}</style>
    </div>
  );
}
