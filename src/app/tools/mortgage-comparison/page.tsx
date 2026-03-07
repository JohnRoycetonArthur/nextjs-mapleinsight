"use client";

import { useMemo, useState } from "react";
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { Container } from "@/components/Container";
import { NumberInput } from "@/components/NumberInput";
import { money2, pct } from "@/lib/format";
import {
  amortizationSummary, yearlyAmortizationSchedule,
  minDownPayment, cmhcPremium,
} from "@/lib/finance";

// ─── helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return new Intl.NumberFormat("en-CA", {
    style: "currency", currency: "CAD", maximumFractionDigits: 0,
  }).format(n);
}

function diffLabel(n: number) {
  const sign = n > 0 ? "+" : "";
  return `${sign}${money2(n)}`;
}

// ─── sub-components ───────────────────────────────────────────────────────────

function Toggle({
  label, value, onChange,
}: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div>
      <div className="mb-1 text-sm font-medium text-gray-700">{label}</div>
      <div className="flex overflow-hidden rounded-lg border border-gray-200 bg-white w-fit">
        <button
          className={`px-5 py-2 text-sm font-medium transition-colors ${value ? "bg-maple-red text-white" : "text-gray-600 hover:bg-gray-50"}`}
          onClick={() => onChange(true)}
        >
          Yes
        </button>
        <button
          className={`px-5 py-2 text-sm font-medium transition-colors ${!value ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-50"}`}
          onClick={() => onChange(false)}
        >
          No
        </button>
      </div>
    </div>
  );
}

function ScenarioCard({
  label, rate, setRate, amort, setAmort,
  payment, totalInterest, totalPaid, fthbWarning,
}: {
  label: string;
  rate: number | "";
  setRate: (v: number | "") => void;
  amort: number | "";
  setAmort: (v: number | "") => void;
  payment: number;
  totalInterest: number;
  totalPaid: number;
  fthbWarning: boolean;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold uppercase tracking-wider text-gray-500">
          Scenario {label}
        </div>
        {fthbWarning && (
          <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
            Max 25 yrs for non-FTHB insured
          </span>
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <NumberInput label="Interest rate" value={rate} onChange={setRate} step={0.01} min={0} suffix="%" />
        <NumberInput label="Amortization" value={amort} onChange={setAmort} step={1} min={1} max={30} suffix="yrs" />
      </div>

      <div className="mt-5 border-t border-gray-100 pt-5">
        <div className="text-xs font-medium uppercase tracking-wider text-gray-500">Monthly payment</div>
        <div className="mt-1 text-3xl font-bold text-gray-900">{money2(payment)}</div>
        <div className="mt-2 flex gap-4 text-sm text-gray-500">
          <span>Interest: <span className="font-medium text-gray-700">{fmt(totalInterest)}</span></span>
          <span>Total: <span className="font-medium text-gray-700">{fmt(totalPaid)}</span></span>
        </div>
      </div>
    </div>
  );
}

function ChartTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-lg text-sm">
      <div className="mb-2 font-semibold text-gray-900">{label}</div>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: p.color }} />
          <span className="text-gray-600">{p.name}:</span>
          <span className="font-medium text-gray-900">{fmt(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

// ─── main page ────────────────────────────────────────────────────────────────

export default function MortgageComparisonPage() {
  const [price, setPrice] = useState<number | "">(900_000);
  const [down, setDown] = useState<number | "">(180_000);
  const [isFirstTime, setIsFirstTime] = useState(false);

  const [rateA, setRateA] = useState<number | "">(4.49);
  const [amortA, setAmortA] = useState<number | "">(25);
  const [rateB, setRateB] = useState<number | "">(4.89);
  const [amortB, setAmortB] = useState<number | "">(30);

  const [activeScenario, setActiveScenario] = useState<"A" | "B">("A");

  const calc = useMemo(() => {
    const p = typeof price === "number" ? price : 0;
    const d = typeof down === "number" ? down : 0;
    const minDown = minDownPayment(p);
    const baseLoan = Math.max(0, p - d);
    const downPct = p > 0 ? d / p : 0;
    const isHighRatio = downPct < 0.20 && p < 1_500_000 && p > 0;
    const belowMinDown = p > 0 && d < minDown;
    const cmhc = isHighRatio ? cmhcPremium(baseLoan, p) : 0;
    const insuredPrincipal = baseLoan + cmhc;

    const rA = typeof rateA === "number" ? rateA : 0;
    const rB = typeof rateB === "number" ? rateB : 0;
    const yA = typeof amortA === "number" ? amortA : 1;
    const yB = typeof amortB === "number" ? amortB : 1;

    const fthbWarnA = isHighRatio && !isFirstTime && yA > 25;
    const fthbWarnB = isHighRatio && !isFirstTime && yB > 25;

    const a = amortizationSummary(insuredPrincipal, rA, yA);
    const b = amortizationSummary(insuredPrincipal, rB, yB);
    const scheduleA = yearlyAmortizationSchedule(insuredPrincipal, rA, yA);
    const scheduleB = yearlyAmortizationSchedule(insuredPrincipal, rB, yB);

    return {
      p, d, minDown, downPct, isHighRatio, belowMinDown,
      cmhc, insuredPrincipal,
      fthbWarnA, fthbWarnB,
      a, b, scheduleA, scheduleB,
    };
  }, [price, down, isFirstTime, rateA, amortA, rateB, amortB]);

  const activeSchedule = activeScenario === "A" ? calc.scheduleA : calc.scheduleB;

  const totalRow = activeSchedule.reduce(
    (acc, r) => ({
      totalPaid: acc.totalPaid + r.totalPaid,
      principalPaid: acc.principalPaid + r.principalPaid,
      interestPaid: acc.interestPaid + r.interestPaid,
    }),
    { totalPaid: 0, principalPaid: 0, interestPaid: 0 }
  );

  const chartData = activeSchedule.map((r) => ({
    year: String(r.year),
    Interest: Math.round(r.interestPaid),
    Principal: Math.round(r.principalPaid),
    Balance: Math.round(r.balance),
  }));

  return (
    <Container>
      <div className="py-10">
        <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">Mortgage Comparison Calculator</h1>
        <p className="mt-2 text-gray-500">
          Compare two scenarios. Canadian CMHC rules and minimum down payments applied automatically.
        </p>

        {/* ── Section 1: Inputs ── */}
        <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="grid gap-6 sm:grid-cols-3">
            <NumberInput label="Home price" prefix="$" value={price} onChange={setPrice} step={1000} min={0} />
            <NumberInput
              label={`Down payment${calc.p > 0 ? ` (${pct(calc.downPct, 1)})` : ""}`}
              prefix="$"
              value={down}
              onChange={setDown}
              step={1000}
              min={0}
              hint={calc.p > 0 ? `Min: ${fmt(calc.minDown)}` : undefined}
            />
            <Toggle label="First-time home buyer?" value={isFirstTime} onChange={setIsFirstTime} />
          </div>

          {/* Mortgage equation strip */}
          <div className="mt-6 rounded-xl bg-gray-50 px-5 py-4">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
              {[
                { heading: "Price", value: fmt(calc.p), color: "text-gray-700" },
                { op: "−" },
                { heading: "Down payment", value: `${fmt(calc.d)} (${pct(calc.downPct, 1)})`, color: "text-green-700" },
                { op: "+" },
                { heading: "CMHC insurance", value: fmt(calc.cmhc), color: calc.cmhc > 0 ? "text-amber-700" : "text-gray-400" },
                { op: "=" },
                { heading: "Total mortgage", value: fmt(calc.insuredPrincipal), color: "text-gray-900 font-bold text-xl", large: true },
              ].map((item, i) =>
                "op" in item ? (
                  <span key={i} className="text-xl font-light text-gray-400">{item.op}</span>
                ) : (
                  <div key={i} className="text-center">
                    <div className="text-xs font-medium uppercase tracking-wide text-gray-400">{item.heading}</div>
                    <div className={`mt-0.5 text-base font-semibold ${item.color}`}>{item.value}</div>
                  </div>
                )
              )}

              <div className="ml-auto">
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  calc.isHighRatio ? "bg-amber-100 text-amber-800" : "bg-green-100 text-green-800"
                }`}>
                  {calc.isHighRatio ? "High-ratio (insured)" : "Conventional"}
                </span>
              </div>
            </div>

            {calc.belowMinDown && (
              <div className="mt-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
                <span className="mt-0.5">⚠</span>
                <span>Down payment is below the minimum of <strong>{fmt(calc.minDown)}</strong> for a <strong>{fmt(calc.p)}</strong> property.</span>
              </div>
            )}

            {isFirstTime && calc.isHighRatio && (
              <div className="mt-3 flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm text-blue-700">
                <span className="mt-0.5">ℹ</span>
                <span>As a first-time home buyer, you qualify for up to 30-year amortization on an insured mortgage (Dec 15, 2024 rules).</span>
              </div>
            )}
          </div>
        </div>

        {/* ── Section 2: Scenario cards ── */}
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <ScenarioCard
            label="A"
            rate={rateA} setRate={setRateA}
            amort={amortA} setAmort={setAmortA}
            payment={calc.a.payment}
            totalInterest={calc.a.interest}
            totalPaid={calc.a.totalPaid}
            fthbWarning={calc.fthbWarnA}
          />
          <ScenarioCard
            label="B"
            rate={rateB} setRate={setRateB}
            amort={amortB} setAmort={setAmortB}
            payment={calc.b.payment}
            totalInterest={calc.b.interest}
            totalPaid={calc.b.totalPaid}
            fthbWarning={calc.fthbWarnB}
          />
        </div>

        {/* ── Section 3: Comparison strip ── */}
        <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Difference (A − B)</div>
          <div className="grid grid-cols-3 divide-x divide-gray-100">
            {[
              { label: "Monthly payment", val: calc.a.payment - calc.b.payment },
              { label: "Total interest", val: calc.a.interest - calc.b.interest },
              { label: "Total paid", val: calc.a.totalPaid - calc.b.totalPaid },
            ].map(({ label, val }) => (
              <div key={label} className="px-4 text-center first:pl-0 last:pr-0">
                <div className="text-xs text-gray-500">{label}</div>
                <div className={`mt-1 text-lg font-bold ${val > 0 ? "text-red-600" : val < 0 ? "text-green-600" : "text-gray-900"}`}>
                  {diffLabel(val)}
                </div>
                <div className="text-xs text-gray-400">{val > 0 ? "A costs more" : val < 0 ? "B costs more" : "Equal"}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Section 4: Amortization schedule ── */}
        <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Amortization schedule</h2>
            <div className="flex overflow-hidden rounded-lg border border-gray-200">
              {(["A", "B"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setActiveScenario(s)}
                  className={`px-5 py-1.5 text-sm font-medium transition-colors ${
                    activeScenario === s ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  Scenario {s}
                </button>
              ))}
            </div>
          </div>

          <ResponsiveContainer width="100%" height={380}>
            <ComposedChart data={chartData} margin={{ top: 5, right: 50, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="year" tick={{ fontSize: 11, fill: "#9ca3af" }} />
              <YAxis
                yAxisId="left"
                tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                width={55}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                width={55}
              />
              <Tooltip content={<ChartTooltip />} />
              <Legend wrapperStyle={{ fontSize: 13 }} />
              <Bar yAxisId="left" dataKey="Interest" stackId="a" fill="#3b82f6" name="Interest" />
              <Bar yAxisId="left" dataKey="Principal" stackId="a" fill="#22c55e" name="Principal" radius={[3, 3, 0, 0]} />
              <Line yAxisId="right" type="monotone" dataKey="Balance" stroke="#f97316" strokeWidth={2.5} dot={false} name="Balance" />
            </ComposedChart>
          </ResponsiveContainer>

          {/* Year-by-year table */}
          <div className="mt-8 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  {["Year", "Total paid", "Principal paid", "Interest paid", "Balance"].map((h) => (
                    <th key={h} className="pb-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 pr-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {activeSchedule.map((row) => (
                  <tr key={row.year} className="hover:bg-gray-50">
                    <td className="py-2 pr-4 font-medium text-gray-900">{row.year}</td>
                    <td className="py-2 pr-4 text-gray-700">{fmt(row.totalPaid)}</td>
                    <td className="py-2 pr-4 text-green-700">{fmt(row.principalPaid)}</td>
                    <td className="py-2 pr-4 text-blue-700">{fmt(row.interestPaid)}</td>
                    <td className="py-2 pr-4 text-gray-700">{fmt(row.balance)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-300 bg-gray-50 font-semibold">
                  <td className="py-2.5 pr-4 text-gray-900">Total</td>
                  <td className="py-2.5 pr-4 text-gray-900">{fmt(totalRow.totalPaid)}</td>
                  <td className="py-2.5 pr-4 text-green-700">{fmt(totalRow.principalPaid)}</td>
                  <td className="py-2.5 pr-4 text-blue-700">{fmt(totalRow.interestPaid)}</td>
                  <td className="py-2.5 pr-4 text-gray-400">—</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <p className="mt-4 text-xs text-gray-400">
            Assumes a fixed rate held for the full amortization period. Actual costs vary at renewal.
            Model does not include prepayments, property taxes, or closing costs.
          </p>
        </div>
      </div>
    </Container>
  );
}
