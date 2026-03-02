import { Container } from "@/components/Container";

export const metadata = {
  title: "About",
  description: "About Maple Insight — calm, confident, clean, educational tools for Canada."
};

export default function AboutPage() {
  return (
    <Container>
      <div className="py-12">
        <h1 className="text-2xl font-semibold text-ink-900 md:text-3xl">About</h1>
        <p className="mt-4 max-w-3xl leading-relaxed text-ink-700">
          Maple Insight is a Canada-focused site that turns confusing decisions into clear tradeoffs.
          We start with calculators, explain assumptions, and point you to official sources for verification.
        </p>
      </div>
    </Container>
  );
}
