"use client";

interface MetricRow {
  label: string;
  value: string;
  highlight?: boolean;
}

interface ComparisonCardProps {
  title: string;
  icon: string;
  color: string;
  lightColor: string;
  metrics: MetricRow[];
  isWinner: boolean;
  isMobile: boolean;
}

export function ComparisonCard({
  title,
  icon,
  color,
  lightColor,
  metrics,
  isWinner,
  isMobile,
}: ComparisonCardProps) {
  return (
    <div
      style={{
        flex: "1 1 280px",
        background: "#fff",
        borderRadius: 16,
        border: `1px solid ${isWinner ? color + "44" : "#E5E7EB"}`,
        padding: isMobile ? "20px 18px" : "24px 28px",
        position: "relative",
        overflow: "hidden",
        boxShadow: isWinner
          ? `0 4px 20px ${color}15`
          : "0 1px 3px rgba(0,0,0,0.04)",
        transition: "box-shadow 0.3s, border-color 0.3s",
      }}
    >
      {/* Winner badge */}
      {isWinner && (
        <div
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            background: color,
            color: "#fff",
            fontSize: 10,
            fontWeight: 700,
            padding: "4px 10px",
            borderRadius: 20,
            fontFamily: "var(--font-dm-sans, 'DM Sans', Helvetica, sans-serif)",
            textTransform: "uppercase",
            letterSpacing: 0.8,
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <svg
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#fff"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Better
        </div>
      )}

      {/* Card header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background: lightColor,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 20,
            border: `1px solid ${color}22`,
          }}
          aria-hidden="true"
        >
          {icon}
        </div>
        <div>
          <div
            style={{
              fontFamily: "var(--font-dm-serif, 'DM Serif Display', Georgia, serif)",
              fontSize: 20,
              color,
              fontWeight: 700,
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontSize: 11,
              color: "#9CA3AF",
              fontFamily: "var(--font-dm-sans, 'DM Sans', Helvetica, sans-serif)",
            }}
          >
            {title === "TFSA" ? "Tax-Free Savings Account" : "Registered Retirement Savings Plan"}
          </div>
        </div>
      </div>

      {/* Metric rows */}
      {metrics.map((m, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            padding: "8px 0",
            borderBottom: i < metrics.length - 1 ? "1px solid #F3F4F6" : "none",
          }}
        >
          <span
            style={{
              fontSize: 13,
              color: "#6B7280",
              fontFamily: "var(--font-dm-sans, 'DM Sans', Helvetica, sans-serif)",
            }}
          >
            {m.label}
          </span>
          <span
            style={{
              fontSize: m.highlight ? 20 : 14,
              fontWeight: m.highlight ? 700 : 500,
              color: m.highlight ? color : "#374151",
              fontFamily: m.highlight
                ? "var(--font-dm-serif, 'DM Serif Display', Georgia, serif)"
                : "var(--font-dm-sans, 'DM Sans', Helvetica, sans-serif)",
            }}
          >
            {m.value}
          </span>
        </div>
      ))}
    </div>
  );
}
