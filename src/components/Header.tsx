"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Container } from "./Container";

const links = [
  { href: "/articles", label: "Articles" },
  { href: "/tools", label: "Calculators" },
  { href: "/glossary", label: "Glossary" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function Header() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-ink-200 bg-white">
      <Container>
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-3" onClick={() => setIsOpen(false)}>
            <img
              src="/maple-insight-logo.png"
              alt="Maple Insight"
              className="h-10 w-10"
            />
            <div>
              <div className="font-semibold text-gray-900">Maple Insight</div>
              <div className="text-xs text-gray-500">Financial clarity for newcomers</div>
            </div>
          </Link>

          {/* Desktop nav */}
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

          {/* Hamburger button (mobile only) */}
          <button
            className="md:hidden rounded-md p-2 text-gray-700 hover:bg-gray-100"
            onClick={() => setIsOpen(!isOpen)}
            aria-label={isOpen ? "Close menu" : "Open menu"}
          >
            {isOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </Container>

      {/* Mobile drawer */}
      {isOpen && (
        <div className="md:hidden border-t border-ink-200 bg-white px-4 py-3 flex flex-col gap-1">
          <Link
            href="/"
            onClick={() => setIsOpen(false)}
            className="block rounded-lg px-3 py-2 text-sm font-bold no-underline"
            style={{ color: "#C41E3A", background: "#C41E3A11" }}
          >
            ✦ Start Here
          </Link>
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setIsOpen(false)}
              className="block rounded-lg px-3 py-2 text-sm font-medium text-ink-700 no-underline hover:bg-gray-50"
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/recommended-tools"
            onClick={() => setIsOpen(false)}
            className="block rounded-lg px-3 py-2 text-sm font-bold no-underline"
            style={{ color: "#1B7A4A", background: "#E8F5EE" }}
          >
            ✦ Tools
          </Link>
        </div>
      )}
    </header>
  );
}
