"use client";

import { useState } from "react";
import { Schedule } from "@material-symbols-svg/react";
import { CATEGORIES, C, font, serif } from "./config";
import type { ArticleListing } from "@/sanity/queries";

interface Props {
  article: ArticleListing;
  categoryColor: string;
}

export function ArticleCard({ article, categoryColor }: Props) {
  const [hovered, setHovered] = useState(false);
  const cat = CATEGORIES.find((c) => c.id === article.category);

  return (
    <a
      href={`/articles/${article.slug}`}
      style={{
        display: "block",
        textDecoration: "none",
        borderRadius: 14,
        border: `1px solid ${hovered ? `${categoryColor}35` : C.border}`,
        background: C.white,
        overflow: "hidden",
        transition: "all .25s",
        boxShadow: hovered ? `0 8px 28px ${categoryColor}10` : "0 1px 3px rgba(0,0,0,.03)",
        transform: hovered ? "translateY(-3px)" : "translateY(0)",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Top accent bar */}
      <div
        style={{
          height: 3,
          background: hovered ? categoryColor : "transparent",
          transition: "background .25s",
        }}
      />

      <div style={{ padding: "18px 20px 16px" }}>
        {/* Category + reading time */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 8,
          }}
        >
          <span
            style={{
              fontFamily: font,
              fontSize: 11,
              fontWeight: 600,
              color: categoryColor,
              textTransform: "uppercase",
              letterSpacing: 0.8,
            }}
          >
            {cat?.label ?? article.category}
          </span>
          {article.readingTime != null && (
            <span
              style={{
                fontFamily: font,
                fontSize: 11,
                color: C.textLight,
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <Schedule size={12} color={C.textLight} aria-hidden="true" />
              {article.readingTime} min
            </span>
          )}
        </div>

        {/* Title */}
        <h3
          style={{
            fontFamily: serif,
            fontSize: 16,
            fontWeight: 700,
            color: hovered ? categoryColor : C.forest,
            margin: "0 0 6px",
            lineHeight: 1.35,
            transition: "color .2s",
          }}
        >
          {article.title}
        </h3>

        {/* Excerpt */}
        {article.excerpt && (
          <p
            style={{
              fontFamily: font,
              fontSize: 13,
              color: C.gray,
              margin: "0 0 12px",
              lineHeight: 1.6,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {article.excerpt}
          </p>
        )}

        {/* Tags */}
        {article.tags && article.tags.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {article.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                style={{
                  fontFamily: font,
                  fontSize: 10,
                  fontWeight: 500,
                  color: C.textLight,
                  background: C.lightGray,
                  borderRadius: 4,
                  padding: "2px 6px",
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </a>
  );
}
