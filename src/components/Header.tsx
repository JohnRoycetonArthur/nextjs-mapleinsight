import Link from "next/link";
import { Container } from "./Container";

const links = [
  { href: "/articles", label: "Articles" },
  { href: "/tools", label: "Calculators" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-ink-200 bg-ink-50/80 backdrop-blur">
      <Container>
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-3">

          <img
            src="/logo-mark.svg"
            alt="Maple Insight"
            className="h-10 w-10"
          />

          <div>
            <div className="font-semibold text-gray-900">
              Maple Insight
            </div>

            <div className="text-xs text-gray-500">
              Financial clarity for newcomers
            </div>
          </div>

        </Link>

          <nav className="hidden items-center gap-6 md:flex">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-sm font-medium text-ink-700 no-underline hover:text-ink-900"
              >
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
