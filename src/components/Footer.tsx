import Link from "next/link";
import { Container } from "./Container";

export function Footer() {
  return (
    <footer className="border-t border-ink-200 bg-white">
      <Container>
        <div className="flex flex-col gap-6 py-10 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-sm font-semibold text-ink-900">Maple Insight</div>
            <div className="mt-1 text-xs text-ink-600">
              Educational tools and explanations for Canada—finance, immigration, and tech.
            </div>
            <div className="mt-3 text-xs text-ink-600">
              Not financial, legal, or tax advice. Use for education and double‑check with official sources.
            </div>
          </div>

          <div className="flex flex-wrap gap-4 text-sm">
            <Link href="/tools" className="text-ink-700 no-underline hover:text-ink-900">Calculators</Link>
            <Link href="/guides" className="text-ink-700 no-underline hover:text-ink-900">Guides</Link>
            <Link href="/about" className="text-ink-700 no-underline hover:text-ink-900">About</Link>
            <Link href="/contact" className="text-ink-700 no-underline hover:text-ink-900">Contact</Link>
          </div>
        </div>
      </Container>
    </footer>
  );
}
