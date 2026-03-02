import Link from "next/link";
import { Container } from "@/components/Container";
import { Badge } from "@/components/Badge";
import { Card } from "@/components/Card";

export default function HomePage() {
  return (
    <div>
      <section className="bg-white">
        <Container>
          <div className="py-14 md:py-20">
            <div className="flex flex-wrap items-center gap-3">
              <Badge>Canada-focused</Badge>
              <Badge>Plain English</Badge>
              <Badge>Calculator-first</Badge>
            </div>

            <h1 className="mt-6 text-3xl font-semibold tracking-tight text-ink-900 md:text-5xl">
              Clear guidance for Canadian decisions.
            </h1>

            <p className="mt-4 max-w-2xl text-base leading-relaxed text-ink-700 md:text-lg">
              Use fast calculators and calm explanations to understand RRSP refunds, mortgages, CCB impact,
              and car financing — without the hype.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/tools"
                className="inline-flex items-center justify-center rounded-xl bg-maple-600 px-5 py-3 text-sm font-semibold text-white no-underline hover:bg-maple-700"
              >
                Open calculators
              </Link>
              <Link
                href="/guides"
                className="inline-flex items-center justify-center rounded-xl border border-ink-200 bg-white px-5 py-3 text-sm font-semibold text-ink-900 no-underline hover:bg-ink-50"
              >
                Browse guides
              </Link>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-3">
              <Card
                title="RRSP Refund Calculator"
                description="Estimate how an RRSP deduction could change your tax bill (Ontario 2025 brackets)."
                href="/tools/rrsp-refund"
              />
              <Card
                title="Mortgage Comparison"
                description="Compare two mortgage scenarios: payments, interest, and total cost."
                href="/tools/mortgage-comparison"
              />
              <Card
                title="CCB Impact Calculator"
                description="Estimate Canada Child Benefit based on AFNI, number of children, and ages."
                href="/tools/ccb-impact"
              />
            </div>
          </div>
        </Container>
      </section>

      <section>
        <Container>
          <div className="py-12">
            <h2 className="text-xl font-semibold text-ink-900">How Maple Insight works</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <Card
                title="1) Start with a calculator"
                description="Get a quick, understandable estimate that you can sanity-check."
              />
              <Card
                title="2) Read the plain-English guide"
                description="Learn what matters, what doesn’t, and where assumptions live."
              />
              <Card
                title="3) Verify with official sources"
                description="We link to CRA and other primary sources, so you can confirm details."
              />
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
