"use client";

import { ArrowRightAlt } from "@material-symbols-svg/react";
import { C, font, serif } from "./config";
import type { Category, Tool } from "./config";
import type { ArticleListing } from "@/sanity/queries";
import { ArticleCard } from "./ArticleCard";
import { ToolCard } from "./ToolCard";

interface Props {
  category: Category;
  articles: ArticleListing[];
  tools: Tool[];
  showHeader: boolean;
  onViewAll: () => void;
}

export function TopicSection({ category, articles, tools, showHeader, onViewAll }: Props) {
  return (
    <section
      id={`topic-${category.id}`}
      style={{ scrollMarginTop: 130, marginBottom: 40 }}
    >
      {/* Section header (All Topics view only) */}
      {showHeader && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 14,
            paddingBottom: 10,
            borderBottom: `2px solid ${category.color}12`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 18 }} aria-hidden="true">
              {category.icon}
            </span>
            <h2
              style={{
                fontFamily: serif,
                fontSize: 18,
                fontWeight: 700,
                color: C.forest,
                margin: 0,
              }}
            >
              {category.label}
            </h2>
            <span
              style={{
                fontFamily: font,
                fontSize: 11,
                fontWeight: 600,
                color: category.color,
                background: `${category.color}10`,
                borderRadius: 4,
                padding: "1px 6px",
              }}
            >
              {articles.length}
            </span>
          </div>

          <button
            onClick={onViewAll}
            style={{
              fontFamily: font,
              fontSize: 12,
              fontWeight: 600,
              color: category.color,
              background: "transparent",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 3,
              padding: 0,
            }}
          >
            View all <ArrowRightAlt size={9} color={category.color} aria-hidden="true" />
          </button>
        </div>
      )}

      {/* Article grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: 12,
          marginBottom: tools.length > 0 ? 12 : 0,
        }}
      >
        {articles.map((article) => (
          <ArticleCard key={article.slug} article={article} categoryColor={category.color} />
        ))}
      </div>

      {/* Related tools */}
      {tools.length > 0 && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: 10,
            background: `${category.color}04`,
            border: `1px solid ${category.color}10`,
          }}
        >
          <div
            style={{
              fontFamily: font,
              fontSize: 11,
              fontWeight: 700,
              color: category.color,
              textTransform: "uppercase",
              letterSpacing: 1,
              marginBottom: 8,
            }}
          >
            Related Tools
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${Math.min(tools.length, 2)}, 1fr)`,
              gap: 8,
            }}
          >
            {tools.map((tool) => (
              <ToolCard key={tool.title} tool={tool} color={category.color} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
