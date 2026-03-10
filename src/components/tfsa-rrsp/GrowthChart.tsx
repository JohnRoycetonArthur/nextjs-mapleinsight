"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { ChartDataPoint, fmtFull } from "@/lib/taxData2026";

interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{ color: string; name: string; value: number }>;
  label?: number;
}

function ChartTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 12,
        padding: "12px 16px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
        border: "1px solid #E5E7EB",
        fontFamily: "var(--font-dm-sans, 'DM Sans', Helvetica, sans-serif)",
        minWidth: 160,
      }}
    >
      <div
        style={{
          fontSize: 11,
          color: "#9CA3AF",
          fontWeight: 600,
          marginBottom: 6,
          textTransform: "uppercase",
          letterSpacing: 0.5,
        }}
      >
        Year {label}
      </div>
      {payload.map((p, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 16,
            marginBottom: 2,
          }}
        >
          <span style={{ fontSize: 13, color: p.color, fontWeight: 600 }}>{p.name}</span>
          <span style={{ fontSize: 13, color: "#374151", fontWeight: 600 }}>
            {fmtFull(p.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

interface GrowthChartProps {
  chartData: ChartDataPoint[];
  horizon: number;
  isMobile: boolean;
}

export function GrowthChart({ chartData, horizon, isMobile }: GrowthChartProps) {
  const tickFormatter = (v: number) =>
    v >= 1_000_000
      ? `$${(v / 1_000_000).toFixed(1)}M`
      : v >= 1000
      ? `$${Math.round(v / 1000)}K`
      : `$${v}`;

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 16,
        border: "1px solid #E5E7EB",
        padding: isMobile ? "20px 12px 16px" : "28px 28px 20px",
        marginBottom: 24,
        boxShadow: "0 1px 4px rgba(0,0,0,0.03)",
      }}
    >
      {/* Header + legend */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 20,
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <h3
          style={{
            fontFamily: "var(--font-dm-serif, 'DM Serif Display', Georgia, serif)",
            fontSize: 18,
            color: "#1B4F4A",
            margin: 0,
            fontWeight: 700,
          }}
        >
          Growth Over Time
        </h3>
        <div style={{ display: "flex", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 12, height: 3, background: "#2563EB", borderRadius: 2 }} />
            <span
              style={{
                fontSize: 12,
                color: "#6B7280",
                fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)",
              }}
            >
              TFSA
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 12, height: 3, background: "#B8860B", borderRadius: 2 }} />
            <span
              style={{
                fontSize: 12,
                color: "#6B7280",
                fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)",
              }}
            >
              RRSP (after tax)
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div
              style={{
                width: 12,
                height: 3,
                background: "#B8860B",
                borderRadius: 2,
                opacity: 0.35,
              }}
            />
            <span
              style={{
                fontSize: 12,
                color: "#6B7280",
                fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)",
              }}
            >
              RRSP (gross)
            </span>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div
        aria-label={`Line chart comparing TFSA and RRSP growth over ${horizon} years`}
        style={{ width: "100%", height: isMobile ? 260 : 340 }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 8, right: 8, left: isMobile ? -10 : 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
            <XAxis
              dataKey="year"
              tick={{
                fontSize: 11,
                fill: "#9CA3AF",
                fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)",
              }}
              axisLine={{ stroke: "#E5E7EB" }}
              tickLine={false}
              label={
                isMobile
                  ? undefined
                  : {
                      value: "Years",
                      position: "insideBottomRight",
                      offset: -4,
                      style: { fontSize: 11, fill: "#9CA3AF" },
                    }
              }
            />
            <YAxis
              tick={{
                fontSize: 11,
                fill: "#9CA3AF",
                fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)",
              }}
              axisLine={false}
              tickLine={false}
              tickFormatter={tickFormatter}
            />
            <Tooltip content={<ChartTooltip />} />
            <Line
              type="monotone"
              dataKey="rrspGross"
              name="RRSP (gross)"
              stroke="#B8860B"
              strokeWidth={2}
              strokeDasharray="6 4"
              dot={false}
              strokeOpacity={0.35}
            />
            <Line
              type="monotone"
              dataKey="rrspAfterTax"
              name="RRSP (after tax)"
              stroke="#B8860B"
              strokeWidth={2.5}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="tfsaValue"
              name="TFSA"
              stroke="#2563EB"
              strokeWidth={2.5}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Visually-hidden data table for screen readers */}
      <table className="sr-only" aria-label="Year-by-year account values">
        <thead>
          <tr>
            <th>Year</th>
            <th>TFSA Value</th>
            <th>RRSP Gross</th>
            <th>RRSP After Tax</th>
          </tr>
        </thead>
        <tbody>
          {chartData
            .filter((_, i) => i % Math.max(1, Math.floor(chartData.length / 10)) === 0)
            .map((row) => (
              <tr key={row.year}>
                <td>{row.year}</td>
                <td>{fmtFull(row.tfsaValue)}</td>
                <td>{fmtFull(row.rrspGross)}</td>
                <td>{fmtFull(row.rrspAfterTax)}</td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}
