"use client";

import { useState, useRef, useEffect } from "react";
import { CurrencyInput } from "./CurrencyInput";

interface ExpenseCategory {
  id: string;
  label: string;
  amount: number;
  icon: string;
  isDefault: boolean;
  isRemovable: boolean;
  placeholder?: string;
  color: string;
}

interface ExpenseRowProps {
  cat: ExpenseCategory;
  index: number;
  onUpdate: (id: string, field: string, value: string | number) => void;
  onRemove: (id: string) => void;
  isMobile: boolean;
}

const CloseIcon = ({ size = 16 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export function ExpenseRow({ cat, index, onUpdate, onRemove, isMobile }: ExpenseRowProps) {
  const [hoverRemove, setHoverRemove] = useState(false);
  const [editingLabel, setEditingLabel] = useState(!cat.isDefault && cat.label === "");
  const labelRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingLabel && labelRef.current) labelRef.current.focus();
  }, [editingLabel]);

  return (
    <div
      style={{
        display: "flex",
        alignItems: isMobile ? "flex-start" : "center",
        gap: isMobile ? 8 : 14,
        padding: isMobile ? "14px 0" : "10px 0",
        borderBottom: "1px solid #F3F4F6",
        flexWrap: isMobile ? "wrap" : "nowrap",
        position: "relative",
      }}
    >
      {/* Icon + Label */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          flex: isMobile ? "1 1 100%" : "1 1 auto",
          minWidth: 0,
          paddingRight: isMobile && cat.isRemovable ? 36 : 0,
        }}
      >
        <span
          style={{ fontSize: 20, flexShrink: 0, width: 28, textAlign: "center" }}
          role="img"
          aria-hidden="true"
        >
          {cat.icon}
        </span>
        {editingLabel || (!cat.isDefault && cat.label !== "") ? (
          <input
            ref={labelRef}
            type="text"
            value={cat.label}
            maxLength={40}
            placeholder="Category name"
            aria-label="Expense category name"
            onChange={(e) => onUpdate(cat.id, "label", e.target.value)}
            onBlur={() => setEditingLabel(false)}
            style={{
              flex: 1,
              border: "none",
              borderBottom: "1px dashed #D1D5DB",
              outline: "none",
              fontFamily: "var(--font-dm-sans, 'DM Sans', Helvetica, sans-serif)",
              fontSize: 15,
              color: "#374151",
              padding: "2px 0",
              background: "transparent",
              minWidth: 0,
            }}
          />
        ) : (
          <span
            style={{
              fontFamily: "var(--font-dm-sans, 'DM Sans', Helvetica, sans-serif)",
              fontSize: 15,
              color: "#374151",
              lineHeight: 1.4,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {cat.label}
          </span>
        )}
      </div>

      {/* Amount */}
      <CurrencyInput
        value={cat.amount}
        onChange={(v) => onUpdate(cat.id, "amount", v)}
        placeholder={cat.placeholder || "e.g., 100"}
        ariaLabel={`${cat.label} monthly amount in dollars`}
        style={{
          width: isMobile ? "calc(100% - 38px)" : 140,
          marginLeft: isMobile ? 38 : 0,
          flexShrink: 0,
        }}
      />

      {/* Remove button */}
      {cat.isRemovable && (
        <button
          onClick={() => onRemove(cat.id)}
          onMouseEnter={() => setHoverRemove(true)}
          onMouseLeave={() => setHoverRemove(false)}
          aria-label={`Remove ${cat.label} from budget`}
          style={{
            width: 28,
            height: 28,
            minWidth: 28,
            borderRadius: 6,
            border: "none",
            background: hoverRemove ? "#FEF2F2" : "transparent",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: hoverRemove ? "#C41E3A" : "#D1D5DB",
            transition: "all 0.15s",
            padding: 0,
            flexShrink: 0,
            position: isMobile ? "absolute" : "static",
            top: isMobile ? 14 : undefined,
            right: isMobile ? 0 : undefined,
          }}
        >
          <CloseIcon size={14} />
        </button>
      )}
    </div>
  );
}
