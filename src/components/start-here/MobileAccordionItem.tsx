"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Stage } from "@/data/start-here-stages";
import { ChevronDown } from "./ChevronDown";
import { ArrowRight } from "./ArrowRight";
import { trackEvent } from "@/lib/analytics";

interface MobileAccordionItemProps {
  stage: Stage;
  isOpen: boolean;
  onToggle: () => void;
}

export function MobileAccordionItem({ stage, isOpen, onToggle }: MobileAccordionItemProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [height, setHeight] = useState(0);

  const panelId = `stage-panel-${stage.id}`;
  const buttonId = `stage-btn-${stage.id}`;

  useEffect(() => {
    if (contentRef.current) {
      setHeight(contentRef.current.scrollHeight);
    }
  }, [isOpen]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLButtonElement>) {
    if (e.key === "Escape" && isOpen) {
      onToggle();
      buttonRef.current?.focus();
    }
  }

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 14,
        border: `1px solid ${isOpen ? stage.color + "33" : "#E5E7EB"}`,
        marginBottom: 10,
        overflow: "hidden",
        transition: "border-color 0.3s ease",
      }}
    >
      <button
        ref={buttonRef}
        id={buttonId}
        onClick={() => {
          onToggle();
          if (!isOpen) {
            trackEvent("stage_expand", {
              stage_id: stage.id,
              stage_title: stage.title,
              device_type: "mobile",
            });
          }
        }}
        onKeyDown={handleKeyDown}
        aria-expanded={isOpen}
        aria-controls={panelId}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "16px 18px",
          border: "none",
          background: isOpen ? stage.lightColor : "transparent",
          cursor: "pointer",
          textAlign: "left",
          fontFamily: "var(--font-dm-sans), Helvetica, sans-serif",
          transition: "background 0.3s ease",
          minHeight: 56,
        }}
      >
        <div
          aria-hidden="true"
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: stage.color,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontWeight: 800,
            fontSize: 15,
            fontFamily: "var(--font-dm-serif), Georgia, serif",
            flexShrink: 0,
          }}
        >
          {stage.order}
        </div>
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontFamily: "var(--font-dm-serif), Georgia, serif",
              fontSize: 17,
              fontWeight: 700,
              color: stage.color,
              lineHeight: 1.2,
            }}
          >
            <span className="sr-only">Step {stage.order} of 4: </span>
            {stage.title}
          </div>
          <div
            style={{
              fontSize: 12,
              color: "#6B7280",
              textTransform: "uppercase",
              letterSpacing: 0.5,
              fontWeight: 500,
              marginTop: 1,
            }}
          >
            {stage.subtitle}
          </div>
        </div>
        <ChevronDown open={isOpen} />
      </button>

      <div
        id={panelId}
        role="region"
        aria-labelledby={buttonId}
        style={{
          maxHeight: isOpen ? height : 0,
          overflow: "hidden",
          transition: "max-height 0.3s ease",
        }}
      >
        <div ref={contentRef} style={{ padding: "4px 18px 20px" }}>
          <p
            style={{
              fontFamily: "var(--font-dm-sans), Helvetica, sans-serif",
              fontSize: 14,
              lineHeight: 1.65,
              color: "#374151",
              margin: "0 0 16px",
            }}
          >
            {stage.description}
          </p>

          {stage.articles.length > 0 && (
            <>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: 1.2,
                  color: "#9CA3AF",
                  marginBottom: 6,
                  fontFamily: "var(--font-dm-sans), Helvetica, sans-serif",
                }}
              >
                Articles
              </div>
              <nav aria-label={`Related articles for ${stage.title}`}>
                <ul style={{ listStyle: "none", padding: 0, margin: "0 0 14px" }}>
                  {stage.articles.map((a, i) => (
                    <li key={i} style={{ marginBottom: 4 }}>
                      <Link
                        href={a.url}
                        style={{
                          fontSize: 14,
                          color: stage.color,
                          textDecoration: "none",
                          fontFamily: "var(--font-dm-sans), Helvetica, sans-serif",
                          display: "inline-flex",
                          alignItems: "center",
                          minHeight: 44,
                        }}
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
                            width: 4,
                            height: 4,
                            borderRadius: "50%",
                            background: stage.color,
                            display: "inline-block",
                            marginRight: 8,
                            opacity: 0.5,
                            flexShrink: 0,
                          }}
                        />
                        {a.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            </>
          )}

          {stage.calculators.length > 0 && (
            <>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: 1.2,
                  color: "#9CA3AF",
                  marginBottom: 6,
                  fontFamily: "var(--font-dm-sans), Helvetica, sans-serif",
                }}
              >
                Calculators
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {stage.calculators.map((c, i) => (
                  <Link
                    key={i}
                    href={c.url}
                    style={{
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
                      fontFamily: "var(--font-dm-sans), Helvetica, sans-serif",
                      minHeight: 44,
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}
