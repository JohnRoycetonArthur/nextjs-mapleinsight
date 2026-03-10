"use client";

import Link from "next/link";
import { ChecklistItemData } from "@/data/checklist-data";
import { CheckIcon, ArticleIcon, CalculatorIcon, ArrowRight } from "./icons";
import { trackEvent } from "@/lib/analytics";

interface ChecklistItemProps {
  item: ChecklistItemData;
  isChecked: boolean;
  groupColor: string;
  groupLightColor: string;
  onToggle: (id: string) => void;
}

export function ChecklistItem({
  item,
  isChecked,
  groupColor,
  groupLightColor,
  onToggle,
}: ChecklistItemProps) {
  function handleLinkClick() {
    trackEvent("checklist_resource_click", {
      item_id: item.id,
      link_type: item.linkType,
      destination_url: item.link,
    });
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 6,
        padding: "8px 0",
        borderBottom: "1px solid #F3F4F6",
      }}
    >
      {/* Checkbox row */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 12,
          minHeight: 44,
        }}
      >
        {/* Custom checkbox */}
        <button
          role="checkbox"
          aria-checked={isChecked}
          aria-label={item.task}
          onClick={() => onToggle(item.id)}
          style={{
            width: 24,
            height: 24,
            borderRadius: 6,
            border: isChecked ? "none" : `2px solid #D1D5DB`,
            background: isChecked ? groupColor : "transparent",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            flexShrink: 0,
            marginTop: 2,
            transition: "background 0.15s, border-color 0.15s",
            padding: 0,
          }}
          onMouseEnter={(e) => {
            if (!isChecked) {
              e.currentTarget.style.background = groupColor + "08";
              e.currentTarget.style.borderColor = groupColor;
            }
          }}
          onMouseLeave={(e) => {
            if (!isChecked) {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.borderColor = "#D1D5DB";
            }
          }}
        >
          {isChecked && <CheckIcon />}
        </button>

        {/* Task label */}
        <span
          onClick={() => onToggle(item.id)}
          style={{
            fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)",
            fontSize: 14,
            lineHeight: 1.55,
            color: isChecked ? "#9CA3AF" : "#374151",
            textDecoration: isChecked ? "line-through" : "none",
            opacity: isChecked ? 0.6 : 1,
            cursor: "pointer",
            flex: 1,
            transition: "opacity 0.15s, color 0.15s",
            userSelect: "none",
          }}
        >
          {item.task}
        </span>
      </div>

      {/* Resource link pill */}
      <div style={{ marginLeft: 36 }}>
        <Link
          href={item.link}
          onClick={handleLinkClick}
          className="checklist-resource-link"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            fontSize: 12,
            fontWeight: 600,
            fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)",
            color: groupColor,
            background: groupLightColor,
            border: `1px solid ${groupColor}18`,
            borderRadius: 6,
            padding: "4px 10px",
            textDecoration: "none",
            transition: "background 0.15s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.background = groupColor + "18";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.background = groupLightColor;
          }}
        >
          {item.linkType === "article" ? <ArticleIcon /> : <CalculatorIcon />}
          <span>{item.linkType === "article" ? "Read article" : "Use calculator"}</span>
          <ArrowRight />
        </Link>
      </div>
    </div>
  );
}
