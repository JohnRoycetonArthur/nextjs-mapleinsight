"use client";

import { useMemo, useState } from "react";
import { Container } from "@/components/Container";
import { NumberInput } from "@/components/NumberInput";
import { ResultPanel } from "@/components/ResultPanel";
import { money, pct } from "@/lib/format";
import {
  combinedTaxOntario2025, combinedMarginalOntario2025,
  combinedTaxBC2025, combinedMarginalBC2025,
  combinedTaxAlberta2025, combinedMarginalAlberta2025,
  combinedTaxQuebec2025, combinedMarginalQuebec2025,
} from "@/lib/tax";

const PROVINCES = [
  { value: "ontario",  label: "Ontario",          tax: combinedTaxOntario2025,  marginal: combinedMarginalOntario2025 },
  { value: "bc",       label: "British Columbia",  tax: combinedTaxBC2025,       marginal: combinedMarginalBC2025 },
  { value: "alberta",  label: "Alberta",           tax: combinedTaxAlberta2025,  marginal: combinedMarginalAlberta2025 },
  { value: "quebec",   label: "Quebec",            tax: combinedTaxQuebec2025,   marginal: combinedMarginalQuebec2025 },
];

export function RrspRefundCalculator() {
  const [income, setIncome] = useState<number | "">(116000);
  const [rrsp, setRrsp] = useState<number | "">(8000);
  const [province, setProvince] = useState("ontario");

  const selected = PROVINCES.find((p) => p.value === province) ?? PROVINCES[0];

  const results = useMemo(() => {
    const inc = typeof income === "number" ? income : 0;
    const contrib = typeof rrsp === "number" ? rrsp : 0;

    const taxableBefore = Math.max(0, inc);
    const taxableAfter = Math.max(0, inc - contrib);

    const taxBefore = selected.tax(taxableBefore);
    const taxAfter = selected.tax(taxableAfter);

    const change = taxBefore - taxAfter;
    const impliedMarginal = taxableBefore > 0 ? selected.marginal(taxableBefore) : 0;

    return {
      taxableBefore,
      taxableAfter,
      taxBefore,
      taxAfter,
      change,
      impliedMarginal,
      effectiveRate: taxableBefore > 0 ? taxBefore / taxableBefore : 0,
    };
  }, [income, rrsp, selected]);

  return (
    <Container>
      <div className="py-12">
        <h1 className="text-2xl font-semibold text-ink-900 md:text-3xl">RRSP Refund Calculator</h1>
        <p className="mt-2 max-w-3xl text-ink-700">
          Educational estimate using <span className="font-semibold">{selected.label} + federal 2025 marginal brackets</span>.
          Simplified (doesn&apos;t model credits, surtaxes, CPP/EI, or other deductions).
        </p>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <NumberInput label="Annual taxable income" prefix="$" value={income} onChange={setIncome} step={100} min={0} />
            <NumberInput label="RRSP contribution to claim" prefix="$" value={rrsp} onChange={setRrsp} step={100} min={0} />

            <div>
              <label className="mb-1 block text-sm font-medium text-ink-900">Province</label>
              <select
                value={province}
                onChange={(e) => setProvince(e.target.value)}
                className="w-full rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-sm text-ink-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-ink-400"
              >
                {PROVINCES.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>

            {province === "quebec" && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Quebec note: this estimate omits the 16.5% federal tax abatement that Quebec residents receive. Actual federal tax will be lower.
              </div>
            )}

            <div className="rounded-2xl border border-ink-200 bg-white p-5 text-sm text-ink-700">
              <div className="font-semibold text-ink-900">How this works</div>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>RRSP contributions reduce taxable income for the year you claim them.</li>
                <li>The value depends heavily on your marginal tax rate.</li>
                <li>This tool estimates tax before vs after the deduction.</li>
              </ul>
            </div>
          </div>

          <ResultPanel
            title="Estimated impact"
            items={[
              { label: "Taxable income (before)", value: money(results.taxableBefore) },
              { label: "Taxable income (after)", value: money(results.taxableAfter) },
              { label: "Estimated tax (before)", value: money(results.taxBefore) },
              { label: "Estimated tax (after)", value: money(results.taxAfter) },
              { label: "Estimated refund change", value: money(results.change) },
              { label: "Marginal rate (approx.)", value: pct(results.impliedMarginal, 1) },
              { label: "Effective rate (approx.)", value: pct(results.effectiveRate, 1) },
            ]}
            note="Real refunds can differ due to credits, surtaxes, CPP/EI, other deductions, and withholding."
          />
        </div>
      </div>
    </Container>
  );
}
