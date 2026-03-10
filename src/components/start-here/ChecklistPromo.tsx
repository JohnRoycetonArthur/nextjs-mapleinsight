"use client";

import Link from "next/link";
import { ArrowRight } from "./ArrowRight";
import { trackEvent } from "@/lib/analytics";

export function ChecklistPromo() {
  return (
    <section
      style={{
        maxWidth: 700,
        margin: "0 auto",
      }}
      className="px-4 pb-10 md:px-6 md:pb-16"
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 16,
          border: "1px solid #E5E7EB",
          borderLeft: "4px solid #C41E3A",
          boxShadow: "0 1px 4px rgba(0,0,0,0.03)",
        }}
        className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:gap-6 md:p-9"
      >
        {/* Icon */}
        <div
          aria-hidden="true"
          style={{
            width: 52,
            height: 52,
            borderRadius: 14,
            background: "#FEF2F2",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 26,
            flexShrink: 0,
          }}
        >
          ✓
        </div>

        {/* Text */}
        <div style={{ flex: 1 }}>
          <h3
            style={{
              fontFamily: "var(--font-dm-serif), Georgia, serif",
              fontSize: 18,
              color: "#1B4F4A",
              margin: "0 0 6px",
              fontWeight: 700,
            }}
          >
            Track Your Progress
          </h3>
          <p
            style={{
              fontSize: 14,
              color: "#6B7280",
              margin: 0,
              lineHeight: 1.6,
              fontFamily: "var(--font-dm-sans), Helvetica, sans-serif",
            }}
          >
            Use our Interactive Newcomer Checklist to mark tasks complete as
            you go. Your progress saves automatically.
          </p>
        </div>

        {/* CTA */}
        <Link
          href="/checklist"
          style={{
            background: "#C41E3A",
            color: "#fff",
            textDecoration: "none",
            fontWeight: 700,
            fontSize: 14,
            padding: "11px 24px",
            borderRadius: 10,
            whiteSpace: "nowrap",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            transition: "background 0.2s, transform 0.15s",
            flexShrink: 0,
            fontFamily: "var(--font-dm-sans), Helvetica, sans-serif",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#A3172E";
            e.currentTarget.style.transform = "translateY(-1px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#C41E3A";
            e.currentTarget.style.transform = "translateY(0)";
          }}
          onClick={() => trackEvent("checklist_promo_click", { source: "start_here" })}
        >
          Open Checklist
          <ArrowRight />
        </Link>
      </div>
    </section>
  );
}
