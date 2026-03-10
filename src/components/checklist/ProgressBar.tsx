"use client";

interface ProgressBarProps {
  completed: number;
  total: number;
}

export function ProgressBar({ completed, total }: ProgressBarProps) {
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100);
  const isComplete = completed === total;

  return (
    <div>
      <div
        role="progressbar"
        aria-valuenow={completed}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-label="Checklist progress"
        style={{
          height: 10,
          background: "#E5E7EB",
          borderRadius: 999,
          overflow: "hidden",
          marginBottom: 8,
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            borderRadius: 999,
            background: isComplete
              ? "linear-gradient(to right, #1B7A4A, #2563EB, #9333EA)"
              : "linear-gradient(to right, #1B7A4A, #22915A)",
            transition: "width 0.4s cubic-bezier(0.4,0,0.2,1)",
          }}
        />
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)",
          fontSize: 13,
          color: "#6B7280",
        }}
      >
        {isComplete ? (
          <span style={{ color: "#1B7A4A", fontWeight: 600 }}>
            🎉 All tasks complete!
          </span>
        ) : (
          <span>
            <strong style={{ color: "#374151" }}>{completed}</strong> of {total} complete
          </span>
        )}
        <span style={{ fontWeight: 600, color: isComplete ? "#1B7A4A" : "#374151" }}>
          {pct}%
        </span>
      </div>
    </div>
  );
}
