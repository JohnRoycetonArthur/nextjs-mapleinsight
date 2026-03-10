"use client";

import { ChartDataPoint, fmtFull } from "@/lib/taxData2026";

interface YearByYearTableProps {
  chartData: ChartDataPoint[];
  horizon: number;
  isOpen: boolean;
  onToggle: () => void;
}

export function YearByYearTable({
  chartData,
  horizon,
  isOpen,
  onToggle,
}: YearByYearTableProps) {
  // Row filtering: every 5yr if >20, every 2yr if >10, else all; always include final row
  const filtered = chartData.filter((row, i) => {
    if (i === chartData.length - 1) return true;
    if (horizon > 20) return row.year % 5 === 0;
    if (horizon > 10) return row.year % 2 === 0;
    return true;
  });

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 16,
        border: "1px solid #E5E7EB",
        overflow: "hidden",
        marginBottom: 24,
        boxShadow: "0 1px 4px rgba(0,0,0,0.03)",
      }}
    >
      <button
        onClick={onToggle}
        aria-expanded={isOpen}
        style={{
          width: "100%",
          padding: "16px 24px",
          border: "none",
          background: isOpen ? "#F9FAFB" : "transparent",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontFamily: "var(--font-dm-sans, 'DM Sans', Helvetica, sans-serif)",
          fontSize: 14,
          fontWeight: 600,
          color: "#374151",
          transition: "background 0.2s",
        }}
      >
        <span>Year-by-Year Breakdown</span>
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          style={{
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.3s",
          }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {isOpen && (
        <div style={{ overflowX: "auto", padding: "0 0 16px" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontFamily: "var(--font-dm-sans, 'DM Sans', Helvetica, sans-serif)",
              fontSize: 13,
              minWidth: 500,
            }}
          >
            <thead>
              <tr style={{ background: "#1B4F4A" }}>
                {["Year", "TFSA Value", "RRSP Gross", "RRSP After Tax", "TFSA Advantage"].map(
                  (h) => (
                    <th
                      key={h}
                      style={{
                        padding: "10px 16px",
                        color: "#fff",
                        fontWeight: 600,
                        textAlign: "right",
                        fontSize: 11,
                        textTransform: "uppercase",
                        letterSpacing: 0.5,
                      }}
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {filtered.map((row, i) => {
                const adv = row.tfsaValue - row.rrspAfterTax;
                return (
                  <tr
                    key={row.year}
                    style={{
                      background: i % 2 === 0 ? "#F9FAFB" : "#fff",
                      borderBottom: "1px solid #F3F4F6",
                    }}
                  >
                    <td
                      style={{
                        padding: "8px 16px",
                        textAlign: "right",
                        fontWeight: 600,
                        color: "#1B4F4A",
                      }}
                    >
                      {row.year}
                    </td>
                    <td
                      style={{
                        padding: "8px 16px",
                        textAlign: "right",
                        color: "#2563EB",
                        fontWeight: 500,
                      }}
                    >
                      {fmtFull(row.tfsaValue)}
                    </td>
                    <td
                      style={{ padding: "8px 16px", textAlign: "right", color: "#9CA3AF" }}
                    >
                      {fmtFull(row.rrspGross)}
                    </td>
                    <td
                      style={{
                        padding: "8px 16px",
                        textAlign: "right",
                        color: "#B8860B",
                        fontWeight: 500,
                      }}
                    >
                      {fmtFull(row.rrspAfterTax)}
                    </td>
                    <td
                      style={{
                        padding: "8px 16px",
                        textAlign: "right",
                        color:
                          adv > 0 ? "#2563EB" : adv < 0 ? "#B8860B" : "#9CA3AF",
                        fontWeight: 600,
                      }}
                    >
                      {adv > 0 ? "+" : ""}
                      {fmtFull(adv)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
