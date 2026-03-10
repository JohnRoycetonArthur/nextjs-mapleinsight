import Link from "next/link";
import { Container } from "./Container";

const links = [
  { href: "/articles", label: "Articles" },
  { href: "/tools", label: "Calculators" },
  { href: "/glossary", label: "Glossary" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-ink-200 bg-white">
      <Container>
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-3">

          <img
            src="/maple-insight-logo.png"
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
            <Link
              href="/"
              style={{
                fontSize: 14,
                color: "#C41E3A",
                textDecoration: "none",
                fontWeight: 700,
                background: "#C41E3A11",
                padding: "6px 16px",
                borderRadius: 20,
                border: "1px solid #C41E3A22",
                transition: "background 0.2s",
                whiteSpace: "nowrap",
              }}
            >
              ✦ Start Here
            </Link>
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-sm font-medium text-ink-700 no-underline hover:text-ink-900"
              >
                {l.label}
              </Link>
            ))}
            <Link
              href="/recommended-tools"
              style={{
                fontSize: 14,
                color: "#1B7A4A",
                textDecoration: "none",
                fontWeight: 700,
                background: "#E8F5EE",
                padding: "6px 16px",
                borderRadius: 20,
                border: "1px solid #1B7A4A22",
                transition: "background 0.2s",
                whiteSpace: "nowrap",
              }}
            >
              ✦ Tools
            </Link>
          </nav>

        </div>
      </Container>
    </header>
  );
}
