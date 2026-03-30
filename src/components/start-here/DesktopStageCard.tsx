"use client";

import Link from "next/link";
import { Stage, STAGES } from "@/data/start-here-stages";
import { ArrowRight } from "./ArrowRight";
import { trackEvent } from "@/lib/analytics";

interface DesktopStageCardProps {
  stage: Stage;
  index: number;
  isVisible: boolean;
}

export function DesktopStageCard({ stage, index, isVisible }: DesktopStageCardProps) {
  return (
    <div
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translateY(0)" : "translateY(32px)",
        transition: `opacity 0.6s ease ${index * 0.15}s, transform 0.6s ease ${index * 0.15}s`,
        display: "flex",
        gap: 0,
        alignItems: "flex-start",
        position: "relative",
      }}
    >
      {/* Timeline dot + line */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          minWidth: 56,
          position: "relative",
          paddingTop: 2,
        }}
      >
        <div
          aria-hidden="true"
          style={{
            width: 44,
            height: 44,
            borderRadius: "50%",
            background: stage.color,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontWeight: 800,
            fontSize: 18,
            fontFamily: "var(--font-dm-serif), Georgia, serif",
            boxShadow: `0 0 0 4px ${stage.lightColor}, 0 2px 12px ${stage.color}33`,
            zIndex: 2,
          }}
        >
          {stage.order}
        </div>
        {index < 3 && (
          <div
            aria-hidden="true"
            style={{
              width: 2,
              flexGrow: 1,
              minHeight: 40,
              background: `linear-gradient(to bottom, ${stage.color}44, ${STAGES[index + 1]?.color || "#ccc"}44)`,
              marginTop: -2,
            }}
          />
        )}
      </div>

      {/* Card */}
      <div
        id={`stage-card-${stage.id}`}
        style={{
          flex: 1,
          background: "#fff",
          borderRadius: 16,
          border: `1px solid ${stage.color}22`,
          padding: "28px 32px",
          marginBottom: index < 3 ? 12 : 0,
          marginLeft: 16,
          boxShadow: `0 1px 3px rgba(0,0,0,0.04), 0 4px 16px ${stage.color}08`,
          transition: "box-shadow 0.3s ease, transform 0.2s ease",
          cursor: "default",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = `0 4px 24px ${stage.color}18`;
          e.currentTarget.style.transform = "translateY(-2px)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = `0 1px 3px rgba(0,0,0,0.04), 0 4px 16px ${stage.color}08`;
          e.currentTarget.style.transform = "translateY(0)";
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
          <span role="img" aria-hidden="true">
            {stage.icon}
          </span>
          <div>
            <h3
              style={{
                margin: 0,
                fontFamily: "var(--font-dm-serif), Georgia, serif",
                fontSize: 22,
                color: stage.color,
                fontWeight: 700,
                lineHeight: 1.2,
              }}
            >
              <span className="sr-only">Step {stage.order} of 4: </span>
              {stage.title}
            </h3>
            <span
              style={{
                fontFamily: "var(--font-dm-sans), Helvetica, sans-serif",
                fontSize: 13,
                color: "#6B7280",
                letterSpacing: 0.5,
                textTransform: "uppercase",
                fontWeight: 500,
              }}
            >
              {stage.subtitle}
            </span>
          </div>
        </div>

        <p
          style={{
            fontFamily: "var(--font-dm-sans), Helvetica, sans-serif",
            fontSize: 15,
            lineHeight: 1.65,
            color: "#374151",
            margin: "12px 0 20px",
          }}
        >
          {stage.description}
        </p>

        <div style={{ display: "flex", gap: 32, flexWrap: "wrap" }}>
          {/* Articles */}
          {stage.articles.length > 0 && (
            <nav aria-label={`Related articles for ${stage.title}`} style={{ flex: "1 1 220px" }}>
              <div
                style={{
                  fontFamily: "var(--font-dm-sans), Helvetica, sans-serif",
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: 1.2,
                  color: "#9CA3AF",
                  marginBottom: 8,
                }}
              >
                Articles
              </div>
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {stage.articles.map((a, i) => (
                  <li key={i} style={{ marginBottom: 5 }}>
                    <Link
                      href={a.url}
                      style={{
                        fontFamily: "var(--font-dm-sans), Helvetica, sans-serif",
                        fontSize: 14,
                        color: stage.color,
                        textDecoration: "none",
                        display: "inline-flex",
                        alignItems: "center",
                        transition: "opacity 0.2s",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.7")}
                      onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                      onClick={() =>
                        trackEvent("article_click", {
                          stage_id: stage.id,
                          article_title: a.title,
                          article_url: a.url,
                        })
                      }
                    >
                      <span
                        aria-hidden="true"
                        style={{
                          width: 5,
                          height: 5,
                          borderRadius: "50%",
                          background: stage.color,
                          display: "inline-block",
                          marginRight: 10,
                          flexShrink: 0,
                          opacity: 0.5,
                        }}
                      />
                      {a.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          )}

          {/* Calculators */}
          {stage.calculators.length > 0 && (
            <div style={{ flex: "0 0 auto" }}>
              <div
                style={{
                  fontFamily: "var(--font-dm-sans), Helvetica, sans-serif",
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: 1.2,
                  color: "#9CA3AF",
                  marginBottom: 8,
                }}
              >
                Calculators
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {stage.calculators.map((c, i) => (
                  <Link
                    key={i}
                    href={c.url}
                    style={{
                      fontFamily: "var(--font-dm-sans), Helvetica, sans-serif",
                      fontSize: 13,
                      fontWeight: 600,
                      color: stage.color,
                      background: stage.lightColor,
                      border: `1px solid ${stage.color}22`,
                      borderRadius: 8,
                      padding: "7px 14px",
                      textDecoration: "none",
                      display: "inline-flex",
                      alignItems: "center",
                      transition: "background 0.2s, transform 0.15s",
                      whiteSpace: "nowrap",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = stage.color + "18";
                      e.currentTarget.style.transform = "translateX(2px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = stage.lightColor;
                      e.currentTarget.style.transform = "translateX(0)";
                    }}
                    onClick={() =>
                      trackEvent("calculator_click", {
                        stage_id: stage.id,
                        calculator_title: c.title,
                        calculator_url: c.url,
                      })
                    }
                  >
                    {c.title}
                    <ArrowRight />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
