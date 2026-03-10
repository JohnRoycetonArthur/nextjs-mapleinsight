"use client";

import { useState } from "react";

const PlusIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

interface AddCategoryButtonProps {
  onAdd: () => void;
  disabled: boolean;
  isMobile: boolean;
}

export function AddCategoryButton({ onAdd, disabled, isMobile }: AddCategoryButtonProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={onAdd}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: "100%",
        padding: isMobile ? "14px" : "12px",
        border: `1px dashed ${disabled ? "#E5E7EB" : hovered ? "#1B7A4A" : "#D1D5DB"}`,
        borderRadius: 10,
        background: hovered && !disabled ? "#E8F5EE" : "transparent",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        cursor: disabled ? "not-allowed" : "pointer",
        fontFamily: "var(--font-dm-sans, 'DM Sans', Helvetica, sans-serif)",
        fontSize: 14,
        fontWeight: 600,
        color: disabled ? "#D1D5DB" : hovered ? "#1B7A4A" : "#6B7280",
        transition: "all 0.2s",
        marginTop: 8,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <PlusIcon />
      {disabled ? "Maximum 15 categories reached" : "Add expense category"}
    </button>
  );
}
