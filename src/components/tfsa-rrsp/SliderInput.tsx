"use client";

interface SliderInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  format?: (n: number) => string;
  suffix?: string;
  helpText?: string;
  isMobile: boolean;
  color?: string;
}

export function SliderInput({
  label,
  value,
  onChange,
  min,
  max,
  step,
  format,
  suffix,
  helpText,
  isMobile,
  color = "#1B7A4A",
}: SliderInputProps) {
  const pctPos = ((value - min) / (max - min)) * 100;

  return (
    <div style={{ marginBottom: isMobile ? 20 : 24 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: 8,
        }}
      >
        <label
          style={{
            fontFamily: "var(--font-dm-sans, 'DM Sans', Helvetica, sans-serif)",
            fontSize: 13,
            fontWeight: 600,
            color: "#374151",
            textTransform: "uppercase",
            letterSpacing: 0.5,
          }}
        >
          {label}
        </label>
        <span
          style={{
            fontFamily: "var(--font-dm-serif, 'DM Serif Display', Georgia, serif)",
            fontSize: 22,
            fontWeight: 700,
            color: "#1B4F4A",
          }}
        >
          {format ? format(value) : value}
          {suffix || ""}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        aria-label={label}
        aria-valuenow={value}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuetext={`${format ? format(value) : value}${suffix || ""}`}
        style={{
          width: "100%",
          height: 6,
          appearance: "none",
          background: `linear-gradient(to right, ${color} 0%, ${color} ${pctPos}%, #E5E7EB ${pctPos}%, #E5E7EB 100%)`,
          borderRadius: 3,
          outline: "none",
          cursor: "pointer",
        }}
      />
      {helpText && (
        <div
          style={{
            fontSize: 11,
            color: "#9CA3AF",
            marginTop: 4,
            fontFamily: "var(--font-dm-sans, 'DM Sans', Helvetica, sans-serif)",
          }}
        >
          {helpText}
        </div>
      )}
    </div>
  );
}
