import Link from "next/link";
import { Container } from "./Container";

const links = [
  { href: "/guides", label: "Guides" },
  { href: "/tools", label: "Calculators" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-ink-200 bg-ink-50/80 backdrop-blur">
      <Container>
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="no-underline">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-xl bg-maple-600" aria-hidden="true" />
              <div className="leading-tight">
                <div className="text-sm font-semibold text-ink-900">Maple Insight</div>
                <div className="text-xs text-ink-600">Calm, clear Canada guidance</div>
              </div>
            </div>
          </Link>

          <nav className="hidden items-center gap-6 md:flex">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className="text-sm font-medium text-ink-700 no-underline hover:text-ink-900">
                {l.label}
              </Link>
            ))}
          </nav>

          <Link
            href="/tools/rrsp-refund"
            className="rounded-xl bg-ink-900 px-4 py-2 text-sm font-semibold text-white no-underline hover:bg-ink-800"
          >
            Try RRSP Calculator
          </Link>
        </div>
      </Container>
    </header>
  );
}
