"use client";

import { useState, useEffect, useRef } from "react";
import { STAGES } from "@/data/start-here-stages";
import { StartHereHero } from "@/components/start-here/StartHereHero";
import { DesktopStageCard } from "@/components/start-here/DesktopStageCard";
import { MobileAccordionItem } from "@/components/start-here/MobileAccordionItem";
import { ChecklistPromo } from "@/components/start-here/ChecklistPromo";
import { NewsletterInline } from "@/components/start-here/NewsletterInline";
import { trackEvent } from "@/lib/analytics";

// Build-time content validation
if (process.env.NODE_ENV !== "production") {
  if (STAGES.length !== 4) {
    throw new Error(`start-here-stages.ts must contain exactly 4 stages, got ${STAGES.length}`);
  }
  STAGES.forEach((s) => {
    if (!s.description) throw new Error(`Stage "${s.id}" has no description`);
    if (s.description.length > 300) throw new Error(`Stage "${s.id}" description exceeds 300 chars`);
    if (s.articles.length === 0) throw new Error(`Stage "${s.id}" has no articles`);
  });
}

export function StartHerePage() {
  const [openStage, setOpenStage] = useState<string | null>(null);
  const [cardsVisible, setCardsVisible] = useState(false);
  const journeyRef = useRef<HTMLElement>(null);

  // Trigger desktop card entrance animation after 200ms
  useEffect(() => {
    const timer = setTimeout(() => setCardsVisible(true), 200);
    return () => clearTimeout(timer);
  }, []);

  // Deep-link: auto-expand stage from URL hash (e.g. /start-here#tax-season)
  useEffect(() => {
    const hash = window.location.hash.slice(1); // remove '#'
    if (hash) {
      const matched = STAGES.find((s) => s.id === hash);
      if (matched) {
        setOpenStage(matched.id);
        // Scroll to the stage after a brief delay for layout to settle
        setTimeout(() => {
          const el = document.getElementById(`stage-panel-${matched.id}`) ||
                     document.getElementById(`stage-card-${matched.id}`);
          el?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 300);
      }
    }
  }, []);

  // Track page view on mount
  useEffect(() => {
    trackEvent("start_here_view", {
      referrer: document.referrer,
      device_type: window.innerWidth < 768 ? "mobile" : "desktop",
    });
  }, []);

  // Scroll depth tracking
  useEffect(() => {
    const thresholds = [25, 50, 75, 100];
    const fired = new Set<number>();

    function handleScroll() {
      const scrolled = window.scrollY + window.innerHeight;
      const total = document.body.scrollHeight;
      const pct = Math.round((scrolled / total) * 100);
      for (const t of thresholds) {
        if (pct >= t && !fired.has(t)) {
          fired.add(t);
          trackEvent("scroll_depth", {
            depth_percentage: t,
            device_type: window.innerWidth < 768 ? "mobile" : "desktop",
          });
        }
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  function handleAccordionToggle(stageId: string) {
    setOpenStage((prev) => (prev === stageId ? null : stageId));
  }

  // Error/fallback if data fails
  if (!STAGES || STAGES.length === 0) {
    return (
      <div
        style={{
          minHeight: "60vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "var(--font-dm-sans), Helvetica, sans-serif",
          color: "#6B7280",
          fontSize: 16,
          textAlign: "center",
          padding: "40px 24px",
        }}
      >
        We&apos;re updating this page. Please check back shortly.
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#FAFBFC",
        fontFamily: "var(--font-dm-sans), Helvetica, sans-serif",
      }}
    >
      {/* Hero */}
      <StartHereHero />

      {/* Journey Section */}
      <section
        ref={journeyRef}
        style={{ margin: "0 auto" }}
        className="max-w-full px-4 py-8 md:max-w-[780px] md:px-6 md:py-14"
      >
        {/* Section header */}
        <div style={{ textAlign: "center" }} className="mb-6 md:mb-10">
          <h2
            style={{
              fontFamily: "var(--font-dm-serif), Georgia, serif",
              color: "#1B4F4A",
              margin: "0 0 8px",
              fontWeight: 700,
            }}
            className="text-2xl md:text-[30px]"
          >
            Your Financial Roadmap
          </h2>
          <p
            style={{
              fontSize: 15,
              color: "#6B7280",
              margin: "0 auto",
              maxWidth: 480,
              lineHeight: 1.6,
              fontFamily: "var(--font-dm-sans), Helvetica, sans-serif",
            }}
          >
            Four stages to guide you through your first year and beyond.
            Take them at your own pace.
          </p>
        </div>

        {/* Desktop timeline — hidden on mobile */}
        <div className="hidden md:block">
          {STAGES.map((stage, i) => (
            <DesktopStageCard
              key={stage.id}
              stage={stage}
              index={i}
              isVisible={cardsVisible}
            />
          ))}
        </div>

        {/* Mobile accordion — hidden on desktop */}
        <div className="md:hidden">
          {STAGES.map((stage) => (
            <MobileAccordionItem
              key={stage.id}
              stage={stage}
              isOpen={openStage === stage.id}
              onToggle={() => handleAccordionToggle(stage.id)}
            />
          ))}
        </div>
      </section>

      {/* Checklist Promo */}
      <ChecklistPromo />

      {/* Newsletter */}
      <NewsletterInline />
    </div>
  );
}
