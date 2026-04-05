"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search, Close } from "@material-symbols-svg/react";
import type { ArticleListing, PillarArticleMeta } from "@/sanity/queries";
import { CATEGORIES, TOOLS, C, font, serif } from "./config";
import { TopicNav } from "./TopicNav";
import { FeaturedPillarCard } from "./FeaturedPillarCard";
import { ResultsBar } from "./ResultsBar";
import { TopicSection } from "./TopicSection";
import { EmptyState } from "./EmptyState";
import { ArticlesBottomCTA } from "./ArticlesBottomCTA";

const MAPLE_LEAF_PATH =
  "M12 0L13.5 6.5L17 4L15.5 8.5L22 9L17 12L20 16L14 14L12 24L10 14L4 16L7 12L2 9L8.5 8.5L7 4L10.5 6.5Z";

interface Props {
  articles: ArticleListing[];
  pillarArticle: PillarArticleMeta;
}

export function ArticlesPageClient({ articles, pillarArticle }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [activeCategory, setActiveCategory] = useState(
    () => searchParams.get("category") ?? "all"
  );
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get("q") ?? "");

  // Sync URL without pushing to browser history
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const params = new URLSearchParams();
    if (activeCategory !== "all") params.set("category", activeCategory);
    if (searchQuery) params.set("q", searchQuery);
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [activeCategory, searchQuery, pathname, router]);

  // Category change clears search
  const handleCategoryChange = (id: string) => {
    setActiveCategory(id);
    setSearchQuery("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Search change resets category to "all"
  const handleSearchChange = (q: string) => {
    setSearchQuery(q);
    if (q.trim()) setActiveCategory("all");
  };

  const handleClear = () => {
    setActiveCategory("all");
    setSearchQuery("");
  };

  // Filtering
  const filtered = useMemo(() => {
    let result = articles;
    if (activeCategory !== "all") result = result.filter((a) => a.category === activeCategory);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          (a.excerpt ?? "").toLowerCase().includes(q) ||
          a.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }
    return result;
  }, [articles, activeCategory, searchQuery]);

  // Grouping for "All Topics" view
  const groups = useMemo(() => {
    const g: Record<string, ArticleListing[]> = {};
    if (activeCategory !== "all") {
      g[activeCategory] = filtered;
    } else {
      CATEGORIES.filter((c) => c.id !== "all").forEach((cat) => {
        const catArticles = filtered.filter((a) => a.category === cat.id);
        if (catArticles.length > 0) g[cat.id] = catArticles;
      });
    }
    return g;
  }, [filtered, activeCategory]);

  // Article counts per category (from unfiltered data)
  const articleCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    CATEGORIES.filter((c) => c.id !== "all").forEach((cat) => {
      counts[cat.id] = articles.filter((a) => a.category === cat.id).length;
    });
    return counts;
  }, [articles]);

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: font }}>

      {/* ── Page Header ─────────────────────────────────────── */}
      <header
        style={{
          padding: "48px 20px 36px",
          background: `linear-gradient(170deg, ${C.forest} 0%, #153D39 60%, #0F2B28 100%)`,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative orb */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            top: -80,
            right: -80,
            width: 300,
            height: 300,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${C.accent}10, transparent 70%)`,
          }}
        />

        <div style={{ maxWidth: 860, margin: "0 auto", position: "relative", zIndex: 1 }}>
          {/* Maple Insight badge */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }}>
            <svg width={14} height={14} viewBox="0 0 24 24" fill={C.gold} aria-hidden="true">
              <path d={MAPLE_LEAF_PATH} />
            </svg>
            <span
              style={{
                fontFamily: font,
                fontSize: 11,
                color: "#ffffff50",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: 1,
              }}
            >
              Maple Insight
            </span>
          </div>

          <h1
            style={{
              fontFamily: serif,
              fontSize: 34,
              fontWeight: 700,
              color: "#fff",
              margin: "0 0 8px",
              lineHeight: 1.15,
            }}
          >
            Guides &amp; Articles
          </h1>
          <p
            style={{
              fontFamily: font,
              fontSize: 15,
              color: "#ffffffAA",
              margin: "0 0 24px",
              maxWidth: 480,
              lineHeight: 1.6,
            }}
          >
            Plain-language guides to Canadian personal finance, immigration, housing, and taxes —
            sourced from official government data.
          </p>

          {/* Search input */}
          <div style={{ position: "relative", maxWidth: 440 }}>
            <div
              style={{
                position: "absolute",
                left: 14,
                top: "50%",
                transform: "translateY(-50%)",
                color: "#ffffff40",
                pointerEvents: "none",
                display: "flex",
              }}
              aria-hidden="true"
            >
              <Search size={18} color="#ffffff40" />
            </div>
            <input
              type="search"
              role="searchbox"
              aria-label="Search articles"
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 14px 12px 42px",
                borderRadius: 10,
                border: "1px solid rgba(255,255,255,.12)",
                background: "rgba(255,255,255,.07)",
                backdropFilter: "blur(8px)",
                color: "#fff",
                fontSize: 14,
                fontFamily: font,
                outline: "none",
                boxSizing: "border-box",
              }}
            />
            {searchQuery && (
              <button
                onClick={() => handleSearchChange("")}
                aria-label="Clear search"
                style={{
                  position: "absolute",
                  right: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "rgba(255,255,255,.12)",
                  border: "none",
                  borderRadius: 5,
                  width: 24,
                  height: 24,
                  cursor: "pointer",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Close size={14} color="#fff" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ── Sticky Topic Nav ─────────────────────────────────── */}
      <TopicNav
        activeCategory={activeCategory}
        onCategoryChange={handleCategoryChange}
        articleCounts={articleCounts}
      />

      {/* ── Main Content ─────────────────────────────────────── */}
      <main style={{ maxWidth: 860, margin: "0 auto", padding: "28px 16px 60px" }}>

        {/* Featured pillar card */}
        <FeaturedPillarCard
          pillarArticle={pillarArticle}
          activeCategory={activeCategory}
          searchQuery={searchQuery}
        />

        {/* Results bar */}
        <ResultsBar
          activeCategory={activeCategory}
          searchQuery={searchQuery}
          resultCount={filtered.length}
          onClear={handleClear}
        />

        {/* Empty state */}
        {filtered.length === 0 && <EmptyState onReset={handleClear} />}

        {/* Topic sections */}
        {Object.entries(groups).map(([catId, catArticles]) => {
          const catConfig = CATEGORIES.find((c) => c.id === catId);
          if (!catConfig) return null;
          return (
            <TopicSection
              key={catId}
              category={catConfig}
              articles={catArticles}
              tools={TOOLS[catId] ?? []}
              showHeader={activeCategory === "all"}
              onViewAll={() => handleCategoryChange(catId)}
            />
          );
        })}

        {/* Bottom CTA */}
        <ArticlesBottomCTA />
      </main>
    </div>
  );
}
