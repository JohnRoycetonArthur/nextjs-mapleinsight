"use client";

export interface Tip {
  id: string;
  type: "alert" | "warning" | "positive" | "info";
  text: string;
  link?: string;
  linkText?: string;
}

const colorMap: Record<string, string> = {
  alert: "#C41E3A",
  warning: "#B8860B",
  positive: "#1B7A4A",
  info: "#2563EB",
};

const bgMap: Record<string, string> = {
  alert: "#FEF2F2",
  warning: "#FDF6E3",
  positive: "#E8F5EE",
  info: "#EFF6FF",
};

const TipIcon = ({ type }: { type: string }) => {
  if (type === "alert") return <span style={{ fontSize: 18 }}>⚠️</span>;
  if (type === "warning") return <span style={{ fontSize: 18 }}>💡</span>;
  if (type === "positive") return <span style={{ fontSize: 18 }}>🎉</span>;
  return <span style={{ fontSize: 18 }}>💬</span>;
};

const ArrowRight = ({ size = 12 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ marginLeft: 4, flexShrink: 0 }}
  >
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

interface TipCardProps {
  tip: Tip;
  isMobile: boolean;
}

export function TipCard({ tip, isMobile }: TipCardProps) {
  const borderColor = colorMap[tip.type] || "#2563EB";

  return (
    <div
      role={tip.type === "alert" ? "alert" : "status"}
      style={{
        background: "#fff",
        borderRadius: 14,
        border: "1px solid #E5E7EB",
        borderLeft: `4px solid ${borderColor}`,
        padding: isMobile ? "16px 16px" : "18px 22px",
        display: "flex",
        alignItems: "flex-start",
        gap: 14,
        marginBottom: 10,
        animation: "tipFadeIn 0.25s ease-out",
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          flexShrink: 0,
          background: bgMap[tip.type],
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <TipIcon type={tip.type} />
      </div>
      <div style={{ flex: 1 }}>
        <p
          style={{
            fontFamily: "var(--font-dm-sans, 'DM Sans', Helvetica, sans-serif)",
            fontSize: 14,
            lineHeight: 1.6,
            color: "#374151",
            margin: 0,
          }}
        >
          {tip.text}
        </p>
        {tip.link && (
          <a
            href={tip.link}
            style={{
              fontFamily: "var(--font-dm-sans, 'DM Sans', Helvetica, sans-serif)",
              fontSize: 13,
              fontWeight: 600,
              color: borderColor,
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              marginTop: 8,
            }}
          >
            {tip.linkText} <ArrowRight size={10} />
          </a>
        )}
      </div>
    </div>
  );
}
