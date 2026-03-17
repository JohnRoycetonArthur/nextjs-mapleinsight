"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
  CHECKLIST_DATA,
  STORAGE_KEY,
  ALL_ITEM_IDS,
  type ChecklistGroupData,
} from "@/data/checklist-data";
import { REPORT_KEY } from "@/hooks/useSimulatorReport";
import { ProgressBar } from "@/components/checklist/ProgressBar";
import { ChecklistGroup } from "@/components/checklist/ChecklistGroup";
import { ResetDialog } from "@/components/checklist/ResetDialog";
import { PrintIcon, ResetIcon, ArrowRight } from "@/components/checklist/icons";
import { NewsletterInline } from "@/components/start-here/NewsletterInline";
import { trackEvent } from "@/lib/analytics";

// --- Confetti particle ---
interface Particle {
  id: number;
  x: number;
  color: string;
  size: number;
  delay: number;
  duration: number;
}

function Confetti() {
  const colors = ["#1B7A4A", "#2563EB", "#9333EA", "#C41E3A", "#B8860B", "#FF6B6B"];
  const particles: Particle[] = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    color: colors[Math.floor(Math.random() * colors.length)],
    size: 6 + Math.random() * 6,
    delay: Math.random() * 1.5,
    duration: 2.5 + Math.random() * 1,
  }));

  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 150,
        overflow: "hidden",
      }}
    >
      {particles.map((p) => (
        <div
          key={p.id}
          style={{
            position: "absolute",
            left: `${p.x}%`,
            top: -10,
            width: p.size,
            height: p.size,
            background: p.color,
            borderRadius: Math.random() > 0.5 ? "50%" : "2px",
            animation: `confettiFall ${p.duration}s ease-in ${p.delay}s forwards`,
            opacity: 0,
          }}
        />
      ))}
    </div>
  );
}

// --- Milestone tracking ---
const MILESTONES = [25, 50, 75, 100];

// Settled persona: show only Month 4–6 and Month 7–12, relabelled
const SETTLED_PERIODS = new Set(["Month 4–6", "Month 7–12"]);
const SETTLED_PERIOD_LABELS: Record<string, Pick<ChecklistGroupData, 'period' | 'subtitle'>> = {
  "Month 4–6":  { period: "Phase 1: Grow & Save", subtitle: "Investing & building wealth" },
  "Month 7–12": { period: "Phase 2: Plan Ahead",  subtitle: "Big decisions & the future"  },
};

export function ChecklistPage() {
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [cardsVisible, setCardsVisible] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isSettled, setIsSettled] = useState(false);
  const reachedMilestonesRef = useRef<Set<number>>(new Set());

  // Load from localStorage on mount
  useEffect(() => {
    setMounted(true);

    // Detect settled persona from simulator report
    try {
      const report = localStorage.getItem(REPORT_KEY);
      if (report) {
        const parsed = JSON.parse(report) as { inputs?: { stage?: string } };
        if (parsed?.inputs?.stage === 'settled') setIsSettled(true);
      }
    } catch { /* ignore */ }

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const validIds = (parsed as unknown[])
            .filter((id): id is string => typeof id === "string" && ALL_ITEM_IDS.has(id));
          setCheckedItems(new Set(validIds));
        }
      }
    } catch {
      console.warn("[Checklist] Failed to read localStorage:", STORAGE_KEY);
    }

    // Card entrance animation
    const timer = setTimeout(() => setCardsVisible(true), 150);
    return () => clearTimeout(timer);
  }, []);

  // Analytics: page view
  useEffect(() => {
    if (mounted) {
      trackEvent("checklist_view", {});
    }
  }, [mounted]);

  // Filtered + optionally relabelled groups for settled persona
  const activeGroups: ChecklistGroupData[] = isSettled
    ? CHECKLIST_DATA
        .filter((g) => SETTLED_PERIODS.has(g.period))
        .map((g) => ({ ...g, ...SETTLED_PERIOD_LABELS[g.period] }))
    : CHECKLIST_DATA;
  const activeTotal = activeGroups.reduce((sum, g) => sum + g.items.length, 0);

  const saveToStorage = useCallback((nextSet: Set<string>) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(nextSet)));
    } catch {
      console.warn("[Checklist] Failed to write localStorage:", STORAGE_KEY);
    }
  }, []);

  const handleToggle = useCallback(
    (id: string) => {
      setCheckedItems((prev) => {
        const next = new Set(prev);
        const action = next.has(id) ? "uncheck" : "check";
        if (action === "check") {
          next.add(id);
        } else {
          next.delete(id);
        }

        const totalCompleted = next.size;
        trackEvent("checklist_item_toggle", {
          item_id: id,
          action,
          total_completed: totalCompleted,
        });

        // Milestone tracking
        const pct = Math.round((totalCompleted / activeTotal) * 100);
        for (const milestone of MILESTONES) {
          if (pct >= milestone && !reachedMilestonesRef.current.has(milestone)) {
            reachedMilestonesRef.current.add(milestone);
            trackEvent("checklist_progress_milestone", {
              milestone_percent: milestone,
              items_completed: totalCompleted,
            });
          }
        }

        // Confetti on 100%
        if (totalCompleted === activeTotal) {
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 3000);
        }

        saveToStorage(next);
        return next;
      });
    },
    [saveToStorage, activeTotal]
  );

  const handleReset = useCallback(() => {
    const itemsCleared = checkedItems.size;
    trackEvent("checklist_reset", { items_cleared: itemsCleared });
    setCheckedItems(new Set());
    reachedMilestonesRef.current = new Set();
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      console.warn("[Checklist] Failed to clear localStorage");
    }
    setShowResetDialog(false);
  }, [checkedItems.size]);

  const handlePrint = useCallback(() => {
    trackEvent("checklist_print", { items_completed_at_print: checkedItems.size });
    window.print();
  }, [checkedItems.size]);

  const completed = checkedItems.size;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#FAFBFC",
        fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)",
      }}
    >
      {/* Confetti */}
      {showConfetti && <Confetti />}

      {/* Reset dialog */}
      {showResetDialog && (
        <ResetDialog
          onConfirm={handleReset}
          onCancel={() => setShowResetDialog(false)}
        />
      )}

      {/* Hero header */}
      <header
        data-print-hide
        style={{
          background: "linear-gradient(165deg, #0F3D3A 0%, #1B5E58 40%, #1B7A4A 100%)",
          padding: "48px 20px 40px",
          position: "relative",
          overflow: "hidden",
          textAlign: "center",
        }}
      >
        {/* Pattern overlay */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0.04,
            backgroundImage: `radial-gradient(circle at 20% 50%, #fff 1px, transparent 1px), radial-gradient(circle at 80% 20%, #fff 1px, transparent 1px)`,
            backgroundSize: "60px 60px, 40px 40px",
          }}
        />
        <div
          style={{
            maxWidth: 640,
            margin: "0 auto",
            position: "relative",
            zIndex: 1,
          }}
        >
          {/* Eyebrow badge */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "rgba(255,255,255,0.12)",
              borderRadius: 20,
              padding: "6px 16px",
              marginBottom: 20,
              backdropFilter: "blur(8px)",
            }}
          >
            <span style={{ fontSize: 14 }} aria-hidden="true">✓</span>
            <span
              style={{
                fontSize: 12,
                color: "rgba(255,255,255,0.85)",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "1px",
                fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)",
              }}
            >
              Newcomer Checklist
            </span>
          </div>

          <h1
            style={{
              fontFamily: "var(--font-dm-serif, 'DM Serif Display', serif)",
              fontSize: "clamp(28px, 5vw, 42px)",
              fontWeight: 700,
              color: "#fff",
              margin: "0 0 14px",
              lineHeight: 1.15,
              letterSpacing: "-0.5px",
            }}
          >
            Your First Year{" "}
            <span style={{ color: "#7DD3A8" }}>Financial Checklist</span>
          </h1>

          <p
            style={{
              fontSize: "clamp(15px, 2.5vw, 17px)",
              lineHeight: 1.7,
              color: "rgba(255,255,255,0.8)",
              margin: "0 auto",
              maxWidth: 500,
              fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)",
            }}
          >
            16 essential tasks to complete in your first year in Canada.
            Check them off as you go — your progress saves automatically.
          </p>
        </div>
      </header>

      {/* Main content */}
      <main
        style={{
          maxWidth: 740,
          margin: "0 auto",
          padding: "32px 16px 48px",
        }}
      >
        {/* Progress card */}
        <div
          aria-live="polite"
          className="checklist-card"
          data-print-hide
          style={{
            background: "#fff",
            borderRadius: 16,
            border: "1px solid #E5E7EB",
            padding: "20px 24px",
            marginBottom: 24,
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          }}
        >
          <ProgressBar completed={completed} total={activeTotal} />

          {/* Action buttons */}
          <div
            style={{
              display: "flex",
              gap: 8,
              marginTop: 14,
              justifyContent: "flex-end",
            }}
          >
            <button
              onClick={handlePrint}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "7px 14px",
                borderRadius: 8,
                border: "1px solid #E5E7EB",
                background: "#fff",
                fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)",
                fontSize: 13,
                fontWeight: 600,
                color: "#6B7280",
                cursor: "pointer",
                transition: "background 0.15s, color 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#F9FAFB";
                e.currentTarget.style.color = "#374151";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#fff";
                e.currentTarget.style.color = "#6B7280";
              }}
            >
              <PrintIcon />
              Print
            </button>
            <button
              onClick={() => setShowResetDialog(true)}
              disabled={completed === 0}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "7px 14px",
                borderRadius: 8,
                border: "1px solid #E5E7EB",
                background: "#fff",
                fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)",
                fontSize: 13,
                fontWeight: 600,
                color: completed === 0 ? "#D1D5DB" : "#6B7280",
                cursor: completed === 0 ? "default" : "pointer",
                transition: "background 0.15s, color 0.15s",
              }}
              onMouseEnter={(e) => {
                if (completed > 0) {
                  e.currentTarget.style.background = "#FFF5F5";
                  e.currentTarget.style.color = "#C41E3A";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#fff";
                e.currentTarget.style.color = completed === 0 ? "#D1D5DB" : "#6B7280";
              }}
            >
              <ResetIcon />
              Reset
            </button>
          </div>
        </div>

        {/* Desktop groups */}
        <div className="hidden md:block">
          {activeGroups.map((group, i) => (
            <ChecklistGroup
              key={group.period}
              group={group}
              checkedItems={checkedItems}
              onToggle={handleToggle}
              isVisible={cardsVisible}
              index={i}
            />
          ))}
        </div>

        {/* Mobile groups */}
        <div className="md:hidden">
          {activeGroups.map((group) => (
            <ChecklistGroup
              key={group.period}
              group={group}
              checkedItems={checkedItems}
              onToggle={handleToggle}
              isOpen={openGroup === group.period}
              onAccordionToggle={() =>
                setOpenGroup(openGroup === group.period ? null : group.period)
              }
            />
          ))}
        </div>

        {/* Back to Start Here CTA */}
        <div
          data-print-hide
          style={{
            marginTop: 32,
            padding: "24px 28px",
            background: "#fff",
            borderRadius: 16,
            border: "1px solid #E5E7EB",
            borderLeft: "4px solid #1B7A4A",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            flexWrap: "wrap",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          }}
        >
          <div>
            <div
              style={{
                fontFamily: "var(--font-dm-serif, 'DM Serif Display', serif)",
                fontSize: 16,
                fontWeight: 700,
                color: "#1B4F4A",
                marginBottom: 4,
              }}
            >
              Need more guidance?
            </div>
            <div
              style={{
                fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)",
                fontSize: 13,
                color: "#6B7280",
                lineHeight: 1.5,
              }}
            >
              Explore our full newcomer financial roadmap with articles and calculators.
            </div>
          </div>
          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "10px 20px",
              borderRadius: 10,
              background: "#1B7A4A",
              color: "#fff",
              fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)",
              fontSize: 14,
              fontWeight: 700,
              textDecoration: "none",
              whiteSpace: "nowrap",
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "#155E3A"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "#1B7A4A"; }}
          >
            View Roadmap
            <ArrowRight />
          </Link>
        </div>
      </main>

      {/* Newsletter */}
      <div data-print-hide>
        <NewsletterInline />
      </div>
    </div>
  );
}
