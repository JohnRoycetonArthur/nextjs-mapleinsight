"use client";

import { useRef, useState, useEffect } from "react";
import { ChecklistGroupData } from "@/data/checklist-data";
import { ChecklistItem } from "./ChecklistItem";

interface ChecklistGroupProps {
  group: ChecklistGroupData;
  checkedItems: Set<string>;
  onToggle: (id: string) => void;
  // Desktop only
  isVisible?: boolean;
  index?: number;
  // Mobile only
  isOpen?: boolean;
  onAccordionToggle?: () => void;
}

function MiniProgressBar({
  completed,
  total,
  color,
}: {
  completed: number;
  total: number;
  color: string;
}) {
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100);
  return (
    <div
      style={{
        width: 48,
        height: 4,
        background: "#E5E7EB",
        borderRadius: 999,
        overflow: "hidden",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${pct}%`,
          background: color,
          borderRadius: 999,
          transition: "width 0.4s cubic-bezier(0.4,0,0.2,1)",
        }}
      />
    </div>
  );
}

// Desktop card
function DesktopGroupCard({
  group,
  checkedItems,
  onToggle,
  isVisible,
  index,
}: {
  group: ChecklistGroupData;
  checkedItems: Set<string>;
  onToggle: (id: string) => void;
  isVisible: boolean;
  index: number;
}) {
  const completed = group.items.filter((i) => checkedItems.has(i.id)).length;

  return (
    <div
      className="checklist-card"
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translateY(0)" : "translateY(24px)",
        transition: `opacity 0.5s ease ${index * 0.12}s, transform 0.5s ease ${index * 0.12}s`,
        background: "#fff",
        borderRadius: 16,
        border: `1px solid ${group.color}18`,
        boxShadow: `0 1px 3px rgba(0,0,0,0.04), 0 4px 16px ${group.color}06`,
        marginBottom: 16,
        overflow: "hidden",
      }}
    >
      {/* Card header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "16px 28px",
          background: `${group.lightColor}66`,
          borderBottom: `1px solid ${group.color}12`,
        }}
      >
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: 10,
            background: `${group.color}14`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
          aria-hidden="true"
        >
          {group.icon}
        </div>
        <div style={{ flex: 1 }}>
          <h2
            style={{
              margin: 0,
              fontFamily: "var(--font-dm-serif, 'DM Serif Display', serif)",
              fontSize: 18,
              fontWeight: 700,
              color: group.color,
              lineHeight: 1.2,
            }}
          >
            {group.period}
          </h2>
          <span
            style={{
              fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)",
              fontSize: 12,
              color: "#6B7280",
              fontWeight: 500,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            {group.subtitle}
          </span>
        </div>
        <MiniProgressBar
          completed={completed}
          total={group.items.length}
          color={group.color}
        />
      </div>

      {/* Items */}
      <div style={{ padding: "8px 28px 16px" }}>
        {group.items.map((item) => (
          <ChecklistItem
            key={item.id}
            item={item}
            isChecked={checkedItems.has(item.id)}
            groupColor={group.color}
            groupLightColor={group.lightColor}
            onToggle={onToggle}
          />
        ))}
      </div>
    </div>
  );
}

// Mobile accordion
function MobileGroupAccordion({
  group,
  checkedItems,
  onToggle,
  isOpen,
  onAccordionToggle,
}: {
  group: ChecklistGroupData;
  checkedItems: Set<string>;
  onToggle: (id: string) => void;
  isOpen: boolean;
  onAccordionToggle: () => void;
}) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);
  const completed = group.items.filter((i) => checkedItems.has(i.id)).length;

  useEffect(() => {
    if (contentRef.current) {
      setHeight(contentRef.current.scrollHeight);
    }
  }, [isOpen, checkedItems]);

  const headerId = `mobile-group-btn-${group.period.replace(/\s+/g, "-").toLowerCase()}`;
  const panelId = `mobile-group-panel-${group.period.replace(/\s+/g, "-").toLowerCase()}`;

  return (
    <div
      className="checklist-card"
      style={{
        background: "#fff",
        borderRadius: 14,
        border: `1px solid ${isOpen ? group.color + "33" : "#E5E7EB"}`,
        marginBottom: 10,
        overflow: "hidden",
        transition: "border-color 0.3s ease",
      }}
    >
      <button
        id={headerId}
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={onAccordionToggle}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "14px 16px",
          border: "none",
          background: isOpen ? `${group.lightColor}` : "transparent",
          cursor: "pointer",
          textAlign: "left",
          transition: "background 0.3s ease",
          minHeight: 56,
        }}
      >
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            background: `${group.color}14`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 18,
            flexShrink: 0,
          }}
          aria-hidden="true"
        >
          {group.icon}
        </div>
        <div style={{ flex: 1, textAlign: "left" }}>
          <div
            style={{
              fontFamily: "var(--font-dm-serif, 'DM Serif Display', serif)",
              fontSize: 16,
              fontWeight: 700,
              color: group.color,
              lineHeight: 1.2,
            }}
          >
            {group.period}
          </div>
          <div
            style={{
              fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)",
              fontSize: 12,
              color: "#6B7280",
              marginTop: 2,
            }}
          >
            {completed}/{group.items.length} complete
          </div>
        </div>
        {/* Chevron */}
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#9CA3AF"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          style={{
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.3s ease",
            flexShrink: 0,
          }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      <div
        id={panelId}
        role="region"
        aria-labelledby={headerId}
        className="checklist-accordion-panel"
        data-print-group-content
        style={{
          maxHeight: isOpen ? height : 0,
          overflow: "hidden",
          transition: "max-height 0.35s ease",
        }}
        hidden={!isOpen}
      >
        <div ref={contentRef} style={{ padding: "4px 16px 16px" }}>
          {group.items.map((item) => (
            <ChecklistItem
              key={item.id}
              item={item}
              isChecked={checkedItems.has(item.id)}
              groupColor={group.color}
              groupLightColor={group.lightColor}
              onToggle={onToggle}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export function ChecklistGroup({
  group,
  checkedItems,
  onToggle,
  isVisible = true,
  index = 0,
  isOpen = false,
  onAccordionToggle,
}: ChecklistGroupProps) {
  return (
    <>
      {/* Desktop */}
      <div className="hidden md:block">
        <DesktopGroupCard
          group={group}
          checkedItems={checkedItems}
          onToggle={onToggle}
          isVisible={isVisible}
          index={index}
        />
      </div>
      {/* Mobile */}
      <div className="md:hidden">
        <MobileGroupAccordion
          group={group}
          checkedItems={checkedItems}
          onToggle={onToggle}
          isOpen={isOpen}
          onAccordionToggle={onAccordionToggle ?? (() => {})}
        />
      </div>
    </>
  );
}
