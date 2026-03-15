import { Container } from "@/components/Container";
import { FounderBio } from "@/components/FounderBio";

export const metadata = { title: "About", description: "About Maple Insight Canada." };

export default function AboutPage() {
  return (
    <Container>
      <div className="py-12">
        <h1 className="text-2xl font-semibold text-ink-900 md:text-3xl">About Maple Insight Canada</h1>
        <p className="mt-4 max-w-3xl leading-relaxed text-ink-700">
          Maple Insight Canada is a Canada-focused resource designed to help newcomers navigate financial and everyday decisions with confidence. Moving to a new country often means dealing with unfamiliar systems — from banking and taxes to government processes and financial planning. Maple Insight Canada aims to simplify these topics through practical guides, clear explanations, and easy-to-use calculators that break complex choices into understandable trade-offs. Wherever possible, we reference official Canadian sources so readers can verify information and make informed decisions as they build their lives in Canada.
        </p>
        <FounderBio showAboutLink={false} />
      </div>
    </Container>
  );
}
