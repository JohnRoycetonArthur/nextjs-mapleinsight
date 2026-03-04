import { Container } from "@/components/Container";
import { Card } from "@/components/Card";

export const metadata = {
  title: "Calculators",
  description: "Practical calculators for Canadian decisions: RRSP, mortgage, CCB, and car financing."
};

export default function ToolsPage() {
  return (
    <Container>
      <div className="py-12">
        <h1 className="text-2xl font-semibold text-ink-900 md:text-3xl">Calculators</h1>
        <p className="mt-2 max-w-2xl text-ink-700">
          Fast, educational estimates. Not tax/financial advice — use to understand direction and tradeoffs.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <Card title="RRSP Refund Calculator" description="Estimate refund change from an RRSP deduction (Ontario 2025 simplified)." href="/tools/rrsp-refund" />
          <Card title="Mortgage Comparison Calculator" description="Compare two mortgages: payments, interest, and totals." href="/tools/mortgage-comparison" />
          <Card title="CCB Impact Calculator" description="Estimate federal CCB (Jul 2025–Jun 2026) from AFNI and child counts." href="/tools/ccb-impact" />
          <Card title="Car Financing Comparison Tool" description="Compare loan terms, down payment, trade-in, and total interest." href="/tools/car-financing" />
        </div>
      </div>
    </Container>
  );
}
