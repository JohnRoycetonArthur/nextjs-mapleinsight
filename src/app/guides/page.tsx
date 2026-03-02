import { Container } from "@/components/Container";
import { Card } from "@/components/Card";

export const metadata = {
  title: "Guides",
  description: "Canada-focused guides for finance, immigration, and tech — written calmly and clearly."
};

export default function GuidesPage() {
  return (
    <Container>
      <div className="py-12">
        <h1 className="text-2xl font-semibold text-ink-900 md:text-3xl">Guides</h1>
        <p className="mt-2 max-w-2xl text-ink-700">
          Starter guides (placeholders for now). You can replace these with real content as you publish.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <Card title="RRSP basics" description="How deductions reduce taxable income and why refunds vary." href="/tools/rrsp-refund" />
          <Card title="Mortgage essentials" description="Rate vs amortization vs prepayment: what changes the total cost." href="/tools/mortgage-comparison" />
          <Card title="CCB overview" description="What AFNI means and why payments are recalculated every July." href="/tools/ccb-impact" />
        </div>
      </div>
    </Container>
  );
}
