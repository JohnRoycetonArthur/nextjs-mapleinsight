"use client";

import { useMemo, useState } from "react";
import { Container } from "@/components/Container";
import { NumberInput } from "@/components/NumberInput";
import { ResultPanel } from "@/components/ResultPanel";
import { money2 } from "@/lib/format";
import { amortizationSummary } from "@/lib/finance";

export function CarFinancingCalculator() {
  const [price, setPrice] = useState<number | "">(37900);
  const [down, setDown] = useState<number | "">(5000);
  const [tradeIn, setTradeIn] = useState<number | "">(0);

  const [rateA, setRateA] = useState<number | "">(7.99);
  const [termA, setTermA] = useState<number | "">(5);

  const [rateB, setRateB] = useState<number | "">(5.99);
  const [termB, setTermB] = useState<number | "">(7);

  const calc = useMemo(() => {
    const p = typeof price === "number" ? price : 0;
    const d = typeof down === "number" ? down : 0;
    const t = typeof tradeIn === "number" ? tradeIn : 0;
    const principal = Math.max(0, p - d - t);

    const a = amortizationSummary(principal, typeof rateA === "number" ? rateA : 0, typeof termA === "number" ? termA : 1);
    const b = amortizationSummary(principal, typeof rateB === "number" ? rateB : 0, typeof termB === "number" ? termB : 1);

    return { principal, a, b };
  }, [price, down, tradeIn, rateA, termA, rateB, termB]);

  return (
    <Container>
      <div className="py-12">
        <h1 className="text-2xl font-semibold text-ink-900 md:text-3xl">Car Financing Comparison Tool</h1>
        <p className="mt-2 max-w-3xl text-ink-700">
          Compare two loan options for the same car price (math-only). Confirm your lender's true APR and fees.
        </p>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <NumberInput label="Car price" prefix="$" value={price} onChange={setPrice} step={100} min={0} />
              <NumberInput label="Down payment" prefix="$" value={down} onChange={setDown} step={100} min={0} />
              <NumberInput label="Trade-in value" prefix="$" value={tradeIn} onChange={setTradeIn} step={100} min={0} hint="If applicable" />
            </div>

            <div className="rounded-2xl border border-ink-200 bg-white p-5">
              <div className="text-sm font-semibold text-ink-900">Option A</div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <NumberInput label="APR" value={rateA} onChange={setRateA} step={0.01} min={0} suffix="%" />
                <NumberInput label="Term" value={termA} onChange={setTermA} step={1} min={1} suffix="years" />
              </div>
            </div>

            <div className="rounded-2xl border border-ink-200 bg-white p-5">
              <div className="text-sm font-semibold text-ink-900">Option B</div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <NumberInput label="APR" value={rateB} onChange={setRateB} step={0.01} min={0} suffix="%" />
                <NumberInput label="Term" value={termB} onChange={setTermB} step={1} min={1} suffix="years" />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <ResultPanel title="Loan amount" items={[{ label: "Principal (price - down - trade)", value: money2(calc.principal) }]} />
            <ResultPanel title="Option A" items={[
              { label: "Monthly payment", value: money2(calc.a.payment) },
              { label: "Total interest", value: money2(calc.a.interest) },
              { label: "Total paid", value: money2(calc.a.totalPaid) },
            ]} />
            <ResultPanel title="Option B" items={[
              { label: "Monthly payment", value: money2(calc.b.payment) },
              { label: "Total interest", value: money2(calc.b.interest) },
              { label: "Total paid", value: money2(calc.b.totalPaid) },
            ]} />
            <ResultPanel title="Quick takeaway" items={[
              { label: "Cheaper total cost", value: calc.a.totalPaid <= calc.b.totalPaid ? "Option A" : "Option B" },
              { label: "Lower monthly payment", value: calc.a.payment <= calc.b.payment ? "Option A" : "Option B" },
            ]} note="Longer terms often lower monthly payments but can increase total interest." />
          </div>
        </div>
      </div>
    </Container>
  );
}
