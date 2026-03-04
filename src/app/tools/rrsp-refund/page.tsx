"use client";

import { useMemo, useState } from "react";
import { Container } from "@/components/Container";
import { NumberInput } from "@/components/NumberInput";
import { ResultPanel } from "@/components/ResultPanel";
import { money, pct } from "@/lib/format";
import { combinedMarginalOntario2025, combinedTaxOntario2025 } from "@/lib/tax";

export default function RrspRefundPage() {
  const [income, setIncome] = useState<number | "">(116000);
  const [rrsp, setRrsp] = useState<number | "">(8000);

  const results = useMemo(() => {
    const inc = typeof income === "number" ? income : 0;
    const contrib = typeof rrsp === "number" ? rrsp : 0;

    const taxableBefore = Math.max(0, inc);
    const taxableAfter = Math.max(0, inc - contrib);

    const taxBefore = combinedTaxOntario2025(taxableBefore);
    const taxAfter = combinedTaxOntario2025(taxableAfter);

    const change = taxBefore - taxAfter;
    const impliedMarginal = taxableBefore > 0 ? combinedMarginalOntario2025(taxableBefore) : 0;

    return {
      taxableBefore,
      taxableAfter,
      taxBefore,
      taxAfter,
      change,
      impliedMarginal,
      effectiveRate: taxableBefore > 0 ? taxBefore / taxableBefore : 0,
    };
  }, [income, rrsp]);

  return (
    <Container>
      <div className="py-12">
        <h1 className="text-2xl font-semibold text-ink-900 md:text-3xl">RRSP Refund Calculator</h1>
        <p className="mt-2 max-w-3xl text-ink-700">
          Educational estimate using <span className="font-semibold">Ontario + federal 2025 marginal brackets</span>.
          Simplified (doesn’t model credits, surtaxes, CPP/EI, or other deductions).
        </p>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <NumberInput label="Annual taxable income" prefix="$" value={income} onChange={setIncome} step={100} min={0} />
            <NumberInput label="RRSP contribution to claim" prefix="$" value={rrsp} onChange={setRrsp} step={100} min={0} />
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
