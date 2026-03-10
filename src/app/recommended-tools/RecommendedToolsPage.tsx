"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { AffiliateProduct, PLACEMENTS } from "@/data/affiliateProducts";
import { AffiliateDisclosure } from "@/components/affiliate/AffiliateDisclosure";
import { AffiliateProductCard } from "@/components/affiliate/AffiliateProductCard";
import { NewsletterInline } from "@/components/start-here/NewsletterInline";

type Category = "all" | "banking" | "investing" | "tax" | "savings";

const CATEGORIES: { id: Category; label: string }[] = [
  { id: "all", label: "All" },
  { id: "banking", label: "Banking" },
  { id: "investing", label: "Investing" },
  { id: "tax", label: "Tax" },
  { id: "savings", label: "Savings" },
];

const CATEGORY_SECTIONS: {
  id: "banking" | "investing" | "tax" | "savings";
  label: string;
  intro: string;
  placement: string;
}[] = [
  {
    id: "banking",
    label: "Banking",
    intro: "No-fee accounts and newcomer-friendly banking options to get you started in Canada.",
    placement: PLACEMENTS.RECOMMENDED_TOOLS_BANKING,
  },
  {
    id: "investing",
    label: "Investing",
    intro: "Platforms to open your TFSA, RRSP, or FHSA and start growing your savings.",
    placement: PLACEMENTS.RECOMMENDED_TOOLS_INVESTING,
  },
  {
    id: "tax",
    label: "Tax Filing",
    intro: "Software to help you file your first Canadian tax return with confidence.",
    placement: PLACEMENTS.RECOMMENDED_TOOLS_TAX,
  },
  {
    id: "savings",
    label: "Saving for a Home",
    intro: "Tools and accounts to help you save for your first home in Canada.",
    placement: PLACEMENTS.RECOMMENDED_TOOLS_SAVINGS,
  },
];

interface RecommendedToolsPageProps {
  products: AffiliateProduct[];
}

export function RecommendedToolsPage({ products }: RecommendedToolsPageProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [activeCategory, setActiveCategory] = useState<Category>("all");

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  function getProducts(category: "banking" | "investing" | "tax" | "savings") {
    return products.filter((p) => p.category === category);
  }

  function isSectionVisible(category: "banking" | "investing" | "tax" | "savings") {
    return activeCategory === "all" || activeCategory === category;
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#FAFBFC",
        fontFamily: "var(--font-dm-sans, 'DM Sans', Helvetica, sans-serif)",
      }}
    >
      {/* ─── Hero ─── */}
      <header
        style={{
          background: "linear-gradient(165deg, #0F3D3A 0%, #1B5E58 40%, #1B7A4A 100%)",
          padding: isMobile ? "48px 20px 40px" : "64px 24px 56px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0.04,
            backgroundImage:
              "radial-gradient(circle at 20% 50%, #fff 1px, transparent 1px), radial-gradient(circle at 80% 20%, #fff 1px, transparent 1px)",
            backgroundSize: "60px 60px, 40px 40px",
          }}
        />
        <div
          style={{
            maxWidth: 680,
            margin: "0 auto",
            textAlign: "center",
            position: "relative",
            zIndex: 1,
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "rgba(255,255,255,0.12)",
              borderRadius: 20,
              padding: "6px 16px",
              marginBottom: 18,
              backdropFilter: "blur(8px)",
            }}
          >
            <span
              style={{
                fontSize: 13,
                color: "rgba(255,255,255,0.85)",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: 1,
              }}
            >
              ✦ Recommended Tools
            </span>
          </div>
          <h1
            style={{
              fontFamily: "var(--font-dm-serif, 'DM Serif Display', Georgia, serif)",
              fontSize: isMobile ? 30 : 44,
              fontWeight: 700,
              color: "#fff",
              margin: "0 0 14px",
              lineHeight: 1.15,
              letterSpacing: -0.5,
            }}
          >
            Recommended Tools &{" "}
            <span style={{ color: "#7DD3A8" }}>Accounts</span>
          </h1>
          <p
            style={{
              fontSize: isMobile ? 15 : 17,
              lineHeight: 1.7,
              color: "rgba(255,255,255,0.78)",
              margin: "0 auto",
              maxWidth: 500,
            }}
          >
            Products we&apos;ve personally reviewed and recommend for newcomers to Canada. Honest
            assessments, not paid placements.
          </p>
        </div>
      </header>

      {/* ─── Disclosure ─── */}
      <div
        style={{
          maxWidth: 820,
          margin: "0 auto",
          padding: isMobile ? "0 16px" : "0 24px",
        }}
      >
        <AffiliateDisclosure isMobile={isMobile} />
      </div>

      {/* ─── Why trust our picks? ─── */}
      <div
        style={{
          maxWidth: 820,
          margin: "32px auto 0",
          padding: isMobile ? "0 16px" : "0 24px",
        }}
      >
        <div
          style={{
            background: "#fff",
            borderRadius: 16,
            border: "1px solid #E5E7EB",
            borderLeft: "4px solid #1B7A4A",
            padding: isMobile ? "22px 18px" : "26px 28px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
          }}
        >
          <h2
            style={{
              fontFamily: "var(--font-dm-serif, 'DM Serif Display', Georgia, serif)",
              fontSize: 20,
              color: "#1B4F4A",
              fontWeight: 700,
              margin: "0 0 10px",
            }}
          >
            Why trust our picks?
          </h2>
          <p
            style={{
              fontSize: 15,
              lineHeight: 1.7,
              color: "#374151",
              margin: "0 0 8px",
            }}
          >
            Every product on this page was selected because it genuinely serves newcomers to
            Canada — not because of the commission it pays us. We evaluate accounts and tools based
            on fees, newcomer-friendliness, ease of setup, and long-term value.
          </p>
          <p style={{ fontSize: 15, lineHeight: 1.7, color: "#6B7280", margin: 0 }}>
            We disclose all known downsides and will update recommendations when products change.{" "}
            <Link href="/about" style={{ color: "#1B7A4A", textDecoration: "underline" }}>
              Learn more about us →
            </Link>
          </p>
        </div>
      </div>

      {/* ─── Category Filter ─── */}
      <div
        style={{
          maxWidth: 820,
          margin: "28px auto 0",
          padding: isMobile ? "0 16px" : "0 24px",
        }}
      >
        <div
          style={{ display: "flex", gap: 8, flexWrap: "wrap" }}
          role="group"
          aria-label="Filter by category"
        >
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              style={{
                padding: "8px 18px",
                borderRadius: 10,
                border: "none",
                cursor: "pointer",
                fontSize: 14,
                fontWeight: 600,
                fontFamily: "var(--font-dm-sans, 'DM Sans', Helvetica, sans-serif)",
                transition: "all 0.15s",
                background: activeCategory === cat.id ? "#1B7A4A" : "#E8F5EE",
                color: activeCategory === cat.id ? "#fff" : "#1B7A4A",
              }}
              aria-pressed={activeCategory === cat.id}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Product Sections ─── */}
      <main
        style={{
          maxWidth: 820,
          margin: "0 auto",
          padding: isMobile ? "0 16px 64px" : "0 24px 80px",
        }}
      >
        {CATEGORY_SECTIONS.map((section) => {
          const sectionProducts = getProducts(section.id);
          if (!isSectionVisible(section.id) || sectionProducts.length === 0) return null;
          return (
            <section key={section.id} style={{ marginTop: 40 }}>
              <h2
                style={{
                  fontFamily: "var(--font-dm-serif, 'DM Serif Display', Georgia, serif)",
                  fontSize: 24,
                  color: "#1B4F4A",
                  fontWeight: 700,
                  margin: "0 0 8px",
                }}
              >
                {section.label}
              </h2>
              <p
                style={{
                  fontSize: 15,
                  color: "#6B7280",
                  lineHeight: 1.6,
                  margin: "0 0 24px",
                }}
              >
                {section.intro}
              </p>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                  gap: 16,
                }}
              >
                {sectionProducts.map((product) => (
                  <AffiliateProductCard
                    key={product.id}
                    product={product}
                    placement={section.placement}
                    isMobile={isMobile}
                  />
                ))}
              </div>
            </section>
          );
        })}

        {/* Empty state if a non-"savings" category has no products */}
        {activeCategory === "savings" && getProducts("savings").length === 0 && (
          <div
            style={{
              textAlign: "center",
              padding: "60px 24px",
              color: "#6B7280",
              fontSize: 15,
            }}
          >
            <div style={{ fontSize: 40, marginBottom: 12 }}>🏠</div>
            <p style={{ margin: 0 }}>
              Home savings recommendations coming soon. Check our{" "}
              <Link href="/glossary#fhsa" style={{ color: "#1B7A4A" }}>
                FHSA glossary entry
              </Link>{" "}
              in the meantime.
            </p>
          </div>
        )}
      </main>

      {/* ─── Newsletter ─── */}
      <NewsletterInline />
    </div>
  );
}
