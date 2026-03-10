"use client";

import { useState, useRef, useEffect } from "react";

const formatInput = (val: number): string => {
  if (val === 0) return "";
  return new Intl.NumberFormat("en-CA").format(val);
};

const parseAmount = (str: string): number => {
  const cleaned = String(str).replace(/[^0-9.]/g, "");
  const val = parseFloat(cleaned);
  return isNaN(val) ? 0 : Math.min(val, 999999);
};

interface CurrencyInputProps {
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  ariaLabel?: string;
  style?: React.CSSProperties;
}

export function CurrencyInput({
  value,
  onChange,
  placeholder,
  ariaLabel,
  style: outerStyle,
}: CurrencyInputProps) {
  const [focused, setFocused] = useState(false);
  const [raw, setRaw] = useState(value > 0 ? String(value) : "");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!focused) setRaw(value > 0 ? formatInput(value) : "");
  }, [value, focused]);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        borderRadius: 10,
        border: `1px solid ${focused ? "#1B7A4A" : "#D1D5DB"}`,
        background: "#fff",
        overflow: "hidden",
        transition: "border-color 0.2s, box-shadow 0.2s",
        boxShadow: focused ? "0 0 0 3px rgba(27,122,74,0.1)" : "none",
        ...outerStyle,
      }}
    >
      <span
        style={{
          padding: "0 0 0 12px",
          fontFamily: "var(--font-dm-sans, 'DM Sans', Helvetica, sans-serif)",
          fontSize: 14,
          color: "#9CA3AF",
          fontWeight: 600,
          userSelect: "none",
        }}
      >
        $
      </span>
      <input
        ref={inputRef}
        type="text"
        inputMode="decimal"
        aria-label={ariaLabel}
        placeholder={placeholder}
        value={focused ? raw : value > 0 ? formatInput(value) : ""}
        onFocus={() => {
          setFocused(true);
          setRaw(value > 0 ? String(value) : "");
        }}
        onBlur={() => {
          setFocused(false);
          onChange(parseAmount(raw));
        }}
        onChange={(e) => {
          const v = e.target.value.replace(/[^0-9.,]/g, "");
          setRaw(v);
          onChange(parseAmount(v));
        }}
        style={{
          flex: 1,
          padding: "10px 12px 10px 4px",
          border: "none",
          outline: "none",
          fontSize: 14,
          fontFamily: "var(--font-dm-sans, 'DM Sans', Helvetica, sans-serif)",
          color: "#374151",
          background: "transparent",
          minWidth: 0,
        }}
      />
    </div>
  );
}
