"use client";

import { useMemo, useState } from "react";
import { Container } from "@/components/Container";
import { NumberInput } from "@/components/NumberInput";
import { ResultPanel } from "@/components/ResultPanel";
import { money2 } from "@/lib/format";
import { amortizationSummary } from "@/lib/finance";

function diff(a: number, b: number) {
  return a - b;
}

export default function MortgageComparisonPage() {
  const [price, setPrice] = useState<number | "">(900000);
  const [down, setDown] = useState<number | "">(180000);

  const [rateA, setRateA] = useState<number | "">(4.89);
  const [amortA, setAmortA] = useState<number | "">(25);

  const [rateB, setRateB] = useState<number | "">(4.49);
  const [amortB, setAmortB] = useState<number | "">(30);

  const calc = useMemo(() => {
    const p = typeof price === "number" ? price : 0;
    const d = typeof down === "number" ? down : 0;
    const principal = Math.max(0, p - d);

    const a = amortizationSummary(principal, typeof rateA === "number" ? rateA : 0, typeof amortA === "number" ? amortA : 1);
    const b = amortizationSummary(principal, typeof rateB === "number" ? rateB : 0, typeof amortB === "number" ? amortB : 1);

    return { principal, a, b };
  }, [price, down, rateA, amortA, rateB, amortB]);

  return (
    <Container>
      <div className="py-12">
        <h1 className="text-2xl font-semibold text-ink-900 md:text-3xl">Mortgage Comparison Calculator</h1>
        <p className="mt-2 max-w-3xl text-ink-700">
          Compare two mortgage scenarios using standard amortization math (monthly payments, total interest).
          This doesn’t model variable rates, prepayments, taxes, insurance, or renewal changes.
        </p>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <NumberInput label="Home price" prefix="$" value={price} onChange={setPrice} step={1000} min={0} />
              <NumberInput label="Down payment" prefix="$" value={down} onChange={setDown} step={1000} min={0} />
            </div>

            <div className="rounded-2xl border border-ink-200 bg-white p-5">
              <div className="text-sm font-semibold text-ink-900">Scenario A</div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <NumberInput label="Interest rate" value={rateA} onChange={setRateA} step={0.01} min={0} suffix="%" />
                <NumberInput label="Amortization" value={amortA} onChange={setAmortA} step={1} min={1} suffix="years" />
              </div>
            </div>

            <div className="rounded-2xl border border-ink-200 bg-white p-5">
              <div className="text-sm font-semibold text-ink-900">Scenario B</div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <NumberInput label="Interest rate" value={rateB} onChange={setRateB} step={0.01} min={0} suffix="%" />
                <NumberInput label="Amortization" value={amortB} onChange={setAmortB} step={1} min={1} suffix="years" />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <ResultPanel
              title="Loan amount"
              items={[{ label: "Principal (price - down)", value: money2(calc.principal) }]}
              note="Principal excludes mortgage insurance, closing costs, and land transfer taxes."
            />
            <ResultPanel
              title="Scenario A"
              items={[
                { label: "Monthly payment", value: money2(calc.a.payment) },
                { label: "Total interest", value: money2(calc.a.interest) },
                { label: "Total paid", value: money2(calc.a.totalPaid) },
              ]}
            />
            <ResultPanel
              title="Scenario B"
              items={[
                { label: "Monthly payment", value: money2(calc.b.payment) },
                { label: "Total interest", value: money2(calc.b.interest) },
                { label: "Total paid", value: money2(calc.b.totalPaid) },
              ]}
            />
            <ResultPanel
              title="Difference (A - B)"
              items={[
                { label: "Monthly payment", value: money2(diff(calc.a.payment, calc.b.payment)) },
                { label: "Total interest", value: money2(diff(calc.a.interest, calc.b.interest)) },
                { label: "Total paid", value: money2(diff(calc.a.totalPaid, calc.b.totalPaid)) },
              ]}
              note="Positive numbers mean Scenario A costs more than Scenario B."
            />
          </div>
        </div>
      </div>
    </Container>
  );
}
