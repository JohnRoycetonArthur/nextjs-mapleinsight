"use client";

import { useMemo, useState } from "react";
import { Container } from "@/components/Container";
import { NumberInput } from "@/components/NumberInput";
import { ResultPanel } from "@/components/ResultPanel";
import { money2 } from "@/lib/format";
import { estimateCcbAnnual, THRESHOLD_1, THRESHOLD_2, CCB_MAX_UNDER6, CCB_MAX_6TO17 } from "@/lib/ccb";

export default function CcbImpactPage() {
  const [afni, setAfni] = useState<number | "">(100000);
  const [under6, setUnder6] = useState<number | "">(1);
  const [age6to17, setAge6to17] = useState<number | "">(2);

  const result = useMemo(() => {
    const a = typeof afni === "number" ? afni : 0;
    const u = typeof under6 === "number" ? under6 : 0;
    const o = typeof age6to17 === "number" ? age6to17 : 0;
    return estimateCcbAnnual({ afni: a, under6: u, age6to17: o });
  }, [afni, under6, age6to17]);

  return (
    <Container>
      <div className="py-12">
        <h1 className="text-2xl font-semibold text-ink-900 md:text-3xl">CCB Impact Calculator</h1>
        <p className="mt-2 max-w-3xl text-ink-700">
          Estimate the <span className="font-semibold">federal</span> Canada Child Benefit for the
          <span className="font-semibold"> July 2025 – June 2026</span> benefit year.
          Provincial add-ons are not included.
        </p>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <NumberInput
              label="Adjusted Family Net Income (AFNI)"
              prefix="$"
              value={afni}
              onChange={setAfni}
              step={100}
              min={0}
              hint="CCB is recalculated every July based on prior-year AFNI."
            />
            <div className="grid gap-4 md:grid-cols-2">
              <NumberInput label="Children under 6" value={under6} onChange={setUnder6} step={1} min={0} />
              <NumberInput label="Children age 6–17" value={age6to17} onChange={setAge6to17} step={1} min={0} />
            </div>

            <div className="rounded-2xl border border-ink-200 bg-white p-5 text-sm text-ink-700">
              <div className="font-semibold text-ink-900">Parameters used</div>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>Max annual per child: under 6 = {CCB_MAX_UNDER6.toLocaleString("en-CA")}; age 6–17 = {CCB_MAX_6TO17.toLocaleString("en-CA")}.</li>
                <li>Threshold 1: {THRESHOLD_1.toLocaleString("en-CA")}.</li>
                <li>Threshold 2: {THRESHOLD_2.toLocaleString("en-CA")}.</li>
                <li>Reduction rates depend on number of children.</li>
              </ul>
            </div>
          </div>

          <ResultPanel
            title="Estimated CCB (federal only)"
            items={[
              { label: "Maximum annual CCB", value: money2(result.max) },
              { label: "Estimated reduction", value: money2(result.reduction) },
              { label: "Estimated annual CCB", value: money2(result.annual) },
              { label: "Estimated monthly CCB", value: money2(result.monthly) },
            ]}
            note="CRA calculates exact amounts. This estimate is for education and planning only."
          />
        </div>
      </div>
    </Container>
  );
}
