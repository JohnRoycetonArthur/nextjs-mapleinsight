// tools/bootstrap-mapleinsight.mjs
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const run = (cmd) => execSync(cmd, { stdio: "inherit" });
const exists = (p) => fs.existsSync(path.join(process.cwd(), p));

const write = (p, content) => {
  const full = path.join(process.cwd(), p);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content, "utf8");
};

const readJson = (p) => JSON.parse(fs.readFileSync(path.join(process.cwd(), p), "utf8"));
const writeJson = (p, obj) => write(p, JSON.stringify(obj, null, 2) + "\n");

const ensure = (cond, msg) => {
  if (!cond) {
    console.error("\n❌ " + msg);
    process.exit(1);
  }
};

const repoRoot = process.cwd();
ensure(exists("package.json"), "Run this from the repo root (where package.json exists).");

// -----------------------------------------------------------------------------
// 0) Detect Next.js app structure. We support either /app or /src/app.
// We'll standardize to /src/app because it's cleaner for larger sites.
// If user already created Next app without src dir, we still handle it.
// -----------------------------------------------------------------------------
const hasSrcApp = exists("src/app");
const hasRootApp = exists("app");

// We'll choose baseDir = "src" if present; otherwise create it and move app/ if needed.
let useSrc = hasSrcApp || (!hasSrcApp && !hasRootApp);
if (!hasSrcApp && hasRootApp) {
  // If Next app exists with /app at root, we can keep it. But we prefer /src/app.
  // We'll move it to /src/app to keep imports consistent.
  fs.mkdirSync(path.join(repoRoot, "src"), { recursive: true });
  fs.renameSync(path.join(repoRoot, "app"), path.join(repoRoot, "src/app"));
  useSrc = true;
}
if (!exists("src/app")) {
  fs.mkdirSync(path.join(repoRoot, "src/app"), { recursive: true });
  useSrc = true;
}

const APP = "src/app";
const SRC = "src";

// -----------------------------------------------------------------------------
// 1) Update package.json: add engines node>=20 and ensure scripts exist
// -----------------------------------------------------------------------------
const pkg = readJson("package.json");
pkg.private = true;
pkg.engines = { node: ">=20.0.0" };
pkg.scripts = pkg.scripts || {};
pkg.scripts.dev = pkg.scripts.dev || "next dev";
pkg.scripts.build = pkg.scripts.build || "next build";
pkg.scripts.start = pkg.scripts.start || "next start";
pkg.scripts.lint = pkg.scripts.lint || "next lint";
writeJson("package.json", pkg);

// -----------------------------------------------------------------------------
// 2) Next config (www -> apex redirect)
// -----------------------------------------------------------------------------
write("next.config.mjs", `/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  async redirects() {
    return [
      { source: "/:path*", has: [{ type: "host", value: "www.mapleinsight.ca" }], destination: "https://mapleinsight.ca/:path*", permanent: true },
    ];
  },
};

export default nextConfig;
`);

// -----------------------------------------------------------------------------
// 3) Tailwind config content paths (src/*)
// -----------------------------------------------------------------------------
if (exists("tailwind.config.ts")) {
  // overwrite to ensure correct content globs
  write("tailwind.config.ts", `import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "Segoe UI", "Roboto", "Helvetica", "Arial", "Apple Color Emoji", "Segoe UI Emoji"],
      },
      colors: {
        ink: {
          50: "#f6f7f9",
          100: "#eceff3",
          200: "#d7dde6",
          300: "#b6c1d1",
          400: "#8697b1",
          500: "#607696",
          600: "#4a5d7a",
          700: "#3c4b63",
          800: "#343f52",
          900: "#2f3746"
        },
        maple: {
          50: "#fff6f2",
          100: "#ffe8dd",
          200: "#ffd0ba",
          300: "#ffad86",
          400: "#ff7a45",
          500: "#ff5b1f",
          600: "#f0420a",
          700: "#c83207",
          800: "#a0280b",
          900: "#7f240c"
        }
      }
    },
  },
  plugins: [],
} satisfies Config;
`);
}

// -----------------------------------------------------------------------------
// 4) PostCSS config: ensure CJS so PowerShell/Node doesn’t choke
// -----------------------------------------------------------------------------
if (exists("postcss.config.js")) fs.rmSync(path.join(repoRoot, "postcss.config.js"));
write("postcss.config.cjs", `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
`);

// -----------------------------------------------------------------------------
// 5) Global styles
// -----------------------------------------------------------------------------
write(`${APP}/globals.css`, `@tailwind base;
@tailwind components;
@tailwind utilities;

:root { color-scheme: light; }
html, body { height: 100%; }

body {
  @apply bg-ink-50 text-ink-900 antialiased;
}

a { @apply underline-offset-4; }
`);

// -----------------------------------------------------------------------------
// 6) Public icon (simple)
// -----------------------------------------------------------------------------
fs.mkdirSync(path.join(repoRoot, "public"), { recursive: true });
// tiny 1x1 png (valid)
const iconB64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMB/ee1X3kAAAAASUVORK5CYII=";
fs.writeFileSync(path.join(repoRoot, "public/icon.png"), Buffer.from(iconB64, "base64"));

// -----------------------------------------------------------------------------
// 7) Components + libs
// -----------------------------------------------------------------------------
write(`${SRC}/components/Container.tsx`, `import { ReactNode } from "react";

export function Container({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
      {children}
    </div>
  );
}
`);

write(`${SRC}/components/Badge.tsx`, `export function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-ink-200 bg-white px-3 py-1 text-xs font-medium text-ink-700">
      {children}
    </span>
  );
}
`);

write(`${SRC}/components/Card.tsx`, `import Link from "next/link";

export function Card({
  title,
  description,
  href,
  footer,
}: {
  title: string;
  description: string;
  href?: string;
  footer?: React.ReactNode;
}) {
  const Body = (
    <div className="rounded-2xl border border-ink-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="text-base font-semibold text-ink-900">{title}</div>
      <div className="mt-1 text-sm leading-relaxed text-ink-700">{description}</div>
      {footer ? <div className="mt-4">{footer}</div> : null}
    </div>
  );

  if (!href) return Body;
  return (
    <Link href={href} className="no-underline">
      {Body}
    </Link>
  );
}
`);

write(`${SRC}/components/Header.tsx`, `import Link from "next/link";
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
`);

write(`${SRC}/components/Footer.tsx`, `import Link from "next/link";
import { Container } from "./Container";

export function Footer() {
  return (
    <footer className="border-t border-ink-200 bg-white">
      <Container>
        <div className="flex flex-col gap-6 py-10 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-sm font-semibold text-ink-900">Maple Insight</div>
            <div className="mt-1 text-xs text-ink-600">
              Educational tools and explanations for Canada — finance, immigration, and tech.
            </div>
            <div className="mt-3 text-xs text-ink-600">
              Not financial, legal, or tax advice. Use for education and double-check official sources.
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
`);

write(`${SRC}/components/NumberInput.tsx`, `"use client";

export function NumberInput({
  label,
  value,
  onChange,
  step = 1,
  min,
  max,
  prefix,
  suffix,
  hint,
}: {
  label: string;
  value: number | "";
  onChange: (v: number | "") => void;
  step?: number;
  min?: number;
  max?: number;
  prefix?: string;
  suffix?: string;
  hint?: string;
}) {
  return (
    <label className="block">
      <div className="flex items-end justify-between gap-2">
        <div className="text-sm font-medium text-ink-900">{label}</div>
        {hint ? <div className="text-xs text-ink-600">{hint}</div> : null}
      </div>

      <div className="mt-2 flex items-center rounded-xl border border-ink-200 bg-white px-3 py-2">
        {prefix ? <span className="mr-2 text-sm text-ink-600">{prefix}</span> : null}
        <input
          inputMode="decimal"
          className="w-full appearance-none bg-transparent text-sm outline-none"
          type="number"
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={(e) => {
            const raw = e.target.value;
            if (raw === "") return onChange("");
            const n = Number(raw);
            if (Number.isFinite(n)) onChange(n);
          }}
        />
        {suffix ? <span className="ml-2 text-sm text-ink-600">{suffix}</span> : null}
      </div>
    </label>
  );
}
`);

write(`${SRC}/components/ResultPanel.tsx`, `export function ResultPanel({
  title,
  items,
  note,
}: {
  title: string;
  items: { label: string; value: string }[];
  note?: string;
}) {
  return (
    <div className="rounded-2xl border border-ink-200 bg-ink-50 p-5">
      <div className="text-sm font-semibold text-ink-900">{title}</div>
      <dl className="mt-4 space-y-3">
        {items.map((it) => (
          <div key={it.label} className="flex items-center justify-between gap-4">
            <dt className="text-sm text-ink-700">{it.label}</dt>
            <dd className="text-sm font-semibold text-ink-900">{it.value}</dd>
          </div>
        ))}
      </dl>
      {note ? <div className="mt-4 text-xs text-ink-600">{note}</div> : null}
    </div>
  );
}
`);

write(`${SRC}/lib/format.ts`, `export function money(n: number, currency: string = "CAD") {
  return new Intl.NumberFormat("en-CA", { style: "currency", currency, maximumFractionDigits: 0 }).format(n);
}

export function money2(n: number, currency: string = "CAD") {
  return new Intl.NumberFormat("en-CA", { style: "currency", currency, minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}

export function pct(n: number, digits: number = 1) {
  return \`\${(n * 100).toFixed(digits)}%\`;
}
`);

write(`${SRC}/lib/tax.ts`, `export type Bracket = { upTo: number | null; rate: number };

export function taxFromBrackets(income: number, brackets: Bracket[]): number {
  let remaining = Math.max(0, income);
  let prevCap = 0;
  let tax = 0;

  for (const b of brackets) {
    const cap = b.upTo ?? Infinity;
    const slice = Math.max(0, Math.min(remaining, cap - prevCap));
    tax += slice * b.rate;
    remaining -= slice;
    prevCap = cap;
    if (remaining <= 0) break;
  }
  return tax;
}

export function marginalRateAtIncome(income: number, brackets: Bracket[]): number {
  for (const b of brackets) {
    const cap = b.upTo ?? Infinity;
    if (income <= cap) return b.rate;
  }
  return brackets[brackets.length - 1]?.rate ?? 0;
}

// Simplified 2025 marginal brackets (Ontario + Federal).
// Educational estimate only; does not model credits, surtaxes, CPP/EI, etc.
export const FEDERAL_2025: Bracket[] = [
  { upTo: 57375, rate: 0.145 },
  { upTo: 114750, rate: 0.205 },
  { upTo: 177882, rate: 0.26 },
  { upTo: 253414, rate: 0.29 },
  { upTo: null, rate: 0.33 },
];

export const ONTARIO_2025: Bracket[] = [
  { upTo: 52886, rate: 0.0505 },
  { upTo: 105775, rate: 0.0915 },
  { upTo: 150000, rate: 0.1116 },
  { upTo: 220000, rate: 0.1216 },
  { upTo: null, rate: 0.1316 },
];

export function combinedTaxOntario2025(taxableIncome: number) {
  return taxFromBrackets(taxableIncome, FEDERAL_2025) + taxFromBrackets(taxableIncome, ONTARIO_2025);
}

export function combinedMarginalOntario2025(taxableIncome: number) {
  return marginalRateAtIncome(taxableIncome, FEDERAL_2025) + marginalRateAtIncome(taxableIncome, ONTARIO_2025);
}
`);

write(`${SRC}/lib/finance.ts`, `export function monthlyLoanPayment(principal: number, annualRate: number, years: number) {
  const r = Math.max(0, annualRate) / 100 / 12;
  const n = Math.max(1, Math.round(years * 12));
  if (r === 0) return principal / n;
  return principal * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

export function amortizationSummary(principal: number, annualRate: number, years: number) {
  const payment = monthlyLoanPayment(principal, annualRate, years);
  const months = Math.max(1, Math.round(years * 12));
  const totalPaid = payment * months;
  const interest = totalPaid - principal;
  return { payment, totalPaid, interest, months };
}
`);

write(`${SRC}/lib/ccb.ts`, `export type CcbInputs = {
  afni: number;
  under6: number;
  age6to17: number;
};

// July 2025 to June 2026 maximum annual amounts (CRA published).
export const CCB_MAX_UNDER6 = 7997;
export const CCB_MAX_6TO17 = 6748;

export const THRESHOLD_1 = 37487;
export const THRESHOLD_2 = 81222;

function phaseRates(children: number) {
  // Per CRA: reduction rates depend on number of children.
  // 1 child: 7% then 3.2%
  // 2 children: 13.5% then 5.7%
  // 3 children: 19% then 8%
  // 4+ children: 23% then 9.5%
  // base2 is the phase-2 base reduction amount at THRESHOLD_2.
  if (children <= 1) return { r1: 0.07, r2: 0.032, base2: 3061 };
  if (children === 2) return { r1: 0.135, r2: 0.057, base2: 5904 };
  if (children === 3) return { r1: 0.19, r2: 0.08, base2: 8310 };
  return { r1: 0.23, r2: 0.095, base2: 10059 };
}

export function estimateCcbAnnual({ afni, under6, age6to17 }: CcbInputs) {
  const kids = Math.max(0, Math.round(under6)) + Math.max(0, Math.round(age6to17));
  const max = Math.max(0, Math.round(under6)) * CCB_MAX_UNDER6 + Math.max(0, Math.round(age6to17)) * CCB_MAX_6TO17;
  if (kids === 0) return { max, reduction: 0, annual: 0, monthly: 0 };

  const { r1, r2, base2 } = phaseRates(kids);

  let reduction = 0;
  if (afni > THRESHOLD_1 && afni <= THRESHOLD_2) {
    reduction = (afni - THRESHOLD_1) * r1;
  } else if (afni > THRESHOLD_2) {
    reduction = base2 + (afni - THRESHOLD_2) * r2;
  }

  const annual = Math.max(0, max - reduction);
  const monthly = annual / 12;
  return { max, reduction, annual, monthly };
}
`);

// -----------------------------------------------------------------------------
// 8) Layout + SEO (metadata + sitemap + robots)
// -----------------------------------------------------------------------------
write(`${APP}/layout.tsx`, `import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  metadataBase: new URL("https://mapleinsight.ca"),
  title: { default: "Maple Insight", template: "%s | Maple Insight" },
  description: "Calm, clean, educational tools and guides for Canada — finance, immigration, and tech.",
  openGraph: {
    title: "Maple Insight",
    description: "Calm, clean, educational tools and guides for Canada — finance, immigration, and tech.",
    url: "https://mapleinsight.ca",
    siteName: "Maple Insight",
    locale: "en_CA",
    type: "website",
  },
  robots: { index: true, follow: true },
  icons: { icon: "/icon.png" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Header />
        <main className="min-h-[70vh]">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
`);

write(`${APP}/robots.ts`, `import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: "https://mapleinsight.ca/sitemap.xml",
    host: "https://mapleinsight.ca",
  };
}
`);

write(`${APP}/sitemap.ts`, `import type { MetadataRoute } from "next";

const baseUrl = "https://mapleinsight.ca";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    "",
    "/guides",
    "/tools",
    "/tools/rrsp-refund",
    "/tools/mortgage-comparison",
    "/tools/ccb-impact",
    "/tools/car-financing",
    "/about",
    "/contact",
  ];

  const now = new Date();
  return routes.map((route) => ({
    url: \`\${baseUrl}\${route}\`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: route === "" ? 1 : 0.7,
  }));
}
`);

// -----------------------------------------------------------------------------
// 9) Pages
// -----------------------------------------------------------------------------
write(`${APP}/page.tsx`, `import Link from "next/link";
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
                description="Estimate how an RRSP deduction could change your tax bill (Ontario 2025 simplified)."
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
              <Card title="1) Start with a calculator" description="Get a quick estimate you can sanity-check." />
              <Card title="2) Read the plain-English guide" description="Learn what matters and where assumptions live." />
              <Card title="3) Verify with official sources" description="Confirm details with primary sources like CRA." />
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
`);

write(`${APP}/guides/page.tsx`, `import { Container } from "@/components/Container";
import { Card } from "@/components/Card";

export const metadata = {
  title: "Guides",
  description: "Canada-focused guides for finance, immigration, and tech — calm and clear."
};

export default function GuidesPage() {
  return (
    <Container>
      <div className="py-12">
        <h1 className="text-2xl font-semibold text-ink-900 md:text-3xl">Guides</h1>
        <p className="mt-2 max-w-2xl text-ink-700">
          Starter guide placeholders. Replace with real posts as you publish.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <Card title="RRSP basics" description="How deductions reduce taxable income and why refunds vary." href="/tools/rrsp-refund" />
          <Card title="Mortgage essentials" description="Rate vs amortization vs prepayment: what changes total cost." href="/tools/mortgage-comparison" />
          <Card title="CCB overview" description="Why payments are recalculated every July based on AFNI." href="/tools/ccb-impact" />
        </div>
      </div>
    </Container>
  );
}
`);

write(`${APP}/tools/page.tsx`, `import { Container } from "@/components/Container";
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
`);

write(`${APP}/about/page.tsx`, `import { Container } from "@/components/Container";

export const metadata = { title: "About", description: "About Maple Insight." };

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
`);

write(`${APP}/contact/page.tsx`, `import { Container } from "@/components/Container";

export const metadata = { title: "Contact", description: "Contact Maple Insight." };

export default function ContactPage() {
  return (
    <Container>
      <div className="py-12">
        <h1 className="text-2xl font-semibold text-ink-900 md:text-3xl">Contact</h1>
        <p className="mt-4 max-w-2xl text-ink-700">
          Placeholder contact. Replace the email with yours anytime.
        </p>

        <div className="mt-6 rounded-2xl border border-ink-200 bg-white p-5">
          <div className="text-sm font-semibold text-ink-900">Email</div>
          <a className="mt-2 inline-block text-sm text-maple-700 hover:text-maple-800" href="mailto:hello@mapleinsight.ca">
            hello@mapleinsight.ca
          </a>
        </div>
      </div>
    </Container>
  );
}
`);

write(`${APP}/not-found.tsx`, `import Link from "next/link";
import { Container } from "@/components/Container";

export default function NotFound() {
  return (
    <Container>
      <div className="py-16">
        <h1 className="text-2xl font-semibold text-ink-900">Page not found</h1>
        <p className="mt-2 text-ink-700">That page doesn’t exist (or it moved).</p>
        <Link className="mt-6 inline-block rounded-xl bg-ink-900 px-4 py-2 text-sm font-semibold text-white no-underline hover:bg-ink-800" href="/">
          Go home
        </Link>
      </div>
    </Container>
  );
}
`);

// -----------------------------------------------------------------------------
// 10) Calculators
// -----------------------------------------------------------------------------
write(`${APP}/tools/rrsp-refund/page.tsx`, `"use client";

import { useMemo, useState } from "react";
import { Container } from "@/components/Container";
import { NumberInput } from "@/components/NumberInput";
import { ResultPanel } from "@/components/ResultPanel";
import { money, pct } from "@/lib/format";
import { combinedMarginalOntario2025, combinedTaxOntario2025 } from "@/lib/tax";

export default function RrspRefundPage() {
  const [income, setIncome] = useState<number | "">(116000);
  const [rrsp, setRrsp] = useState<number | "">(8000);

  const results = useMemo(() => {
    const inc = typeof income === "number" ? income : 0;
    const contrib = typeof rrsp === "number" ? rrsp : 0;

    const taxableBefore = Math.max(0, inc);
    const taxableAfter = Math.max(0, inc - contrib);

    const taxBefore = combinedTaxOntario2025(taxableBefore);
    const taxAfter = combinedTaxOntario2025(taxableAfter);

    const change = taxBefore - taxAfter;
    const impliedMarginal = taxableBefore > 0 ? combinedMarginalOntario2025(taxableBefore) : 0;

    return {
      taxableBefore,
      taxableAfter,
      taxBefore,
      taxAfter,
      change,
      impliedMarginal,
      effectiveRate: taxableBefore > 0 ? taxBefore / taxableBefore : 0,
    };
  }, [income, rrsp]);

  return (
    <Container>
      <div className="py-12">
        <h1 className="text-2xl font-semibold text-ink-900 md:text-3xl">RRSP Refund Calculator</h1>
        <p className="mt-2 max-w-3xl text-ink-700">
          Educational estimate using <span className="font-semibold">Ontario + federal 2025 marginal brackets</span>.
          Simplified (doesn’t model credits, surtaxes, CPP/EI, or other deductions).
        </p>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <NumberInput label="Annual taxable income" prefix="$" value={income} onChange={setIncome} step={100} min={0} />
            <NumberInput label="RRSP contribution to claim" prefix="$" value={rrsp} onChange={setRrsp} step={100} min={0} />
            <div className="rounded-2xl border border-ink-200 bg-white p-5 text-sm text-ink-700">
              <div className="font-semibold text-ink-900">How this works</div>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>RRSP contributions reduce taxable income for the year you claim them.</li>
                <li>The value depends heavily on your marginal tax rate.</li>
                <li>This tool estimates tax before vs after the deduction.</li>
              </ul>
            </div>
          </div>

          <ResultPanel
            title="Estimated impact"
            items={[
              { label: "Taxable income (before)", value: money(results.taxableBefore) },
              { label: "Taxable income (after)", value: money(results.taxableAfter) },
              { label: "Estimated tax (before)", value: money(results.taxBefore) },
              { label: "Estimated tax (after)", value: money(results.taxAfter) },
              { label: "Estimated refund change", value: money(results.change) },
              { label: "Marginal rate (approx.)", value: pct(results.impliedMarginal, 1) },
              { label: "Effective rate (approx.)", value: pct(results.effectiveRate, 1) },
            ]}
            note="Real refunds can differ due to credits, surtaxes, CPP/EI, other deductions, and withholding."
          />
        </div>
      </div>
    </Container>
  );
}
`);

write(`${APP}/tools/mortgage-comparison/page.tsx`, `"use client";

import { useMemo, useState } from "react";
import { Container } from "@/components/Container";
import { NumberInput } from "@/components/NumberInput";
import { ResultPanel } from "@/components/ResultPanel";
import { money2 } from "@/lib/format";
import { amortizationSummary } from "@/lib/finance";

const diff = (a: number, b: number) => a - b;

export default function MortgageComparisonPage() {
  const [price, setPrice] = useState<number | "">(900000);
  const [down, setDown] = useState<number | "">(180000);

  const [rateA, setRateA] = useState<number | "">(4.89);
  const [amortA, setAmortA] = useState<number | "">(25);

  const [rateB, setRateB] = useState<number | "">(4.49);
  const [amortB, setAmortB] = useState<number | "">(30);

  const calc = useMemo(() => {
    const p = typeof price === "number" ? price : 0;
    const d = typeof down === "number" ? down : 0;
    const principal = Math.max(0, p - d);

    const a = amortizationSummary(principal, typeof rateA === "number" ? rateA : 0, typeof amortA === "number" ? amortA : 1);
    const b = amortizationSummary(principal, typeof rateB === "number" ? rateB : 0, typeof amortB === "number" ? amortB : 1);

    return { principal, a, b };
  }, [price, down, rateA, amortA, rateB, amortB]);

  return (
    <Container>
      <div className="py-12">
        <h1 className="text-2xl font-semibold text-ink-900 md:text-3xl">Mortgage Comparison Calculator</h1>
        <p className="mt-2 max-w-3xl text-ink-700">
          Compare two mortgage scenarios using standard amortization math (monthly payment, total interest).
          Doesn’t model variable rates, prepayments, taxes, insurance, or renewal changes.
        </p>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <NumberInput label="Home price" prefix="$" value={price} onChange={setPrice} step={1000} min={0} />
              <NumberInput label="Down payment" prefix="$" value={down} onChange={setDown} step={1000} min={0} />
            </div>

            <div className="rounded-2xl border border-ink-200 bg-white p-5">
              <div className="text-sm font-semibold text-ink-900">Scenario A</div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <NumberInput label="Interest rate" value={rateA} onChange={setRateA} step={0.01} min={0} suffix="%" />
                <NumberInput label="Amortization" value={amortA} onChange={setAmortA} step={1} min={1} suffix="years" />
              </div>
            </div>

            <div className="rounded-2xl border border-ink-200 bg-white p-5">
              <div className="text-sm font-semibold text-ink-900">Scenario B</div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <NumberInput label="Interest rate" value={rateB} onChange={setRateB} step={0.01} min={0} suffix="%" />
                <NumberInput label="Amortization" value={amortB} onChange={setAmortB} step={1} min={1} suffix="years" />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <ResultPanel title="Loan amount" items={[{ label: "Principal (price - down)", value: money2(calc.principal) }]} />
            <ResultPanel title="Scenario A" items={[
              { label: "Monthly payment", value: money2(calc.a.payment) },
              { label: "Total interest", value: money2(calc.a.interest) },
              { label: "Total paid", value: money2(calc.a.totalPaid) },
            ]} />
            <ResultPanel title="Scenario B" items={[
              { label: "Monthly payment", value: money2(calc.b.payment) },
              { label: "Total interest", value: money2(calc.b.interest) },
              { label: "Total paid", value: money2(calc.b.totalPaid) },
            ]} />
            <ResultPanel title="Difference (A - B)" items={[
              { label: "Monthly payment", value: money2(diff(calc.a.payment, calc.b.payment)) },
              { label: "Total interest", value: money2(diff(calc.a.interest, calc.b.interest)) },
              { label: "Total paid", value: money2(diff(calc.a.totalPaid, calc.b.totalPaid)) },
            ]} note="Positive means Scenario A costs more than Scenario B." />
          </div>
        </div>
      </div>
    </Container>
  );
}
`);

write(`${APP}/tools/ccb-impact/page.tsx`, `"use client";

import { useMemo, useState } from "react";
import { Container } from "@/components/Container";
import { NumberInput } from "@/components/NumberInput";
import { ResultPanel } from "@/components/ResultPanel";
import { money2 } from "@/lib/format";
import { estimateCcbAnnual, THRESHOLD_1, THRESHOLD_2, CCB_MAX_UNDER6, CCB_MAX_6TO17 } from "@/lib/ccb";

export default function CcbImpactPage() {
  const [afni, setAfni] = useState<number | "">(100000);
  const [under6, setUnder6] = useState<number | "">(1);
  const [age6to17, setAge6to17] = useState<number | "">(2);

  const result = useMemo(() => {
    const a = typeof afni === "number" ? afni : 0;
    const u = typeof under6 === "number" ? under6 : 0;
    const o = typeof age6to17 === "number" ? age6to17 : 0;
    return estimateCcbAnnual({ afni: a, under6: u, age6to17: o });
  }, [afni, under6, age6to17]);

  return (
    <Container>
      <div className="py-12">
        <h1 className="text-2xl font-semibold text-ink-900 md:text-3xl">CCB Impact Calculator</h1>
        <p className="mt-2 max-w-3xl text-ink-700">
          Estimate the <span className="font-semibold">federal</span> Canada Child Benefit for the
          <span className="font-semibold"> July 2025 – June 2026</span> benefit year.
          Provincial add-ons are not included.
        </p>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <NumberInput
              label="Adjusted Family Net Income (AFNI)"
              prefix="$"
              value={afni}
              onChange={setAfni}
              step={100}
              min={0}
              hint="CCB is recalculated every July based on prior-year AFNI."
            />
            <div className="grid gap-4 md:grid-cols-2">
              <NumberInput label="Children under 6" value={under6} onChange={setUnder6} step={1} min={0} />
              <NumberInput label="Children age 6–17" value={age6to17} onChange={setAge6to17} step={1} min={0} />
            </div>

            <div className="rounded-2xl border border-ink-200 bg-white p-5 text-sm text-ink-700">
              <div className="font-semibold text-ink-900">Parameters used</div>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>Max annual per child: under 6 = {CCB_MAX_UNDER6.toLocaleString("en-CA")}; age 6–17 = {CCB_MAX_6TO17.toLocaleString("en-CA")}.</li>
                <li>Threshold 1: {THRESHOLD_1.toLocaleString("en-CA")}.</li>
                <li>Threshold 2: {THRESHOLD_2.toLocaleString("en-CA")}.</li>
                <li>Reduction rates depend on number of children.</li>
              </ul>
            </div>
          </div>

          <ResultPanel
            title="Estimated CCB (federal only)"
            items={[
              { label: "Maximum annual CCB", value: money2(result.max) },
              { label: "Estimated reduction", value: money2(result.reduction) },
              { label: "Estimated annual CCB", value: money2(result.annual) },
              { label: "Estimated monthly CCB", value: money2(result.monthly) },
            ]}
            note="CRA calculates exact amounts. This estimate is for education and planning only."
          />
        </div>
      </div>
    </Container>
  );
}
`);

write(`${APP}/tools/car-financing/page.tsx`, `"use client";

import { useMemo, useState } from "react";
import { Container } from "@/components/Container";
import { NumberInput } from "@/components/NumberInput";
import { ResultPanel } from "@/components/ResultPanel";
import { money2 } from "@/lib/format";
import { amortizationSummary } from "@/lib/finance";

export default function CarFinancingPage() {
  const [price, setPrice] = useState<number | "">(37900);
  const [down, setDown] = useState<number | "">(5000);
  const [tradeIn, setTradeIn] = useState<number | "">(0);

  const [rateA, setRateA] = useState<number | "">(7.99);
  const [termA, setTermA] = useState<number | "">(5);

  const [rateB, setRateB] = useState<number | "">(5.99);
  const [termB, setTermB] = useState<number | "">(7);

  const calc = useMemo(() => {
    const p = typeof price === "number" ? price : 0;
    const d = typeof down === "number" ? down : 0;
    const t = typeof tradeIn === "number" ? tradeIn : 0;
    const principal = Math.max(0, p - d - t);

    const a = amortizationSummary(principal, typeof rateA === "number" ? rateA : 0, typeof termA === "number" ? termA : 1);
    const b = amortizationSummary(principal, typeof rateB === "number" ? rateB : 0, typeof termB === "number" ? termB : 1);

    return { principal, a, b };
  }, [price, down, tradeIn, rateA, termA, rateB, termB]);

  return (
    <Container>
      <div className="py-12">
        <h1 className="text-2xl font-semibold text-ink-900 md:text-3xl">Car Financing Comparison Tool</h1>
        <p className="mt-2 max-w-3xl text-ink-700">
          Compare two loan options for the same car price (math-only). Confirm your lender’s true APR and fees.
        </p>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <NumberInput label="Car price" prefix="$" value={price} onChange={setPrice} step={100} min={0} />
              <NumberInput label="Down payment" prefix="$" value={down} onChange={setDown} step={100} min={0} />
              <NumberInput label="Trade-in value" prefix="$" value={tradeIn} onChange={setTradeIn} step={100} min={0} hint="If applicable" />
            </div>

            <div className="rounded-2xl border border-ink-200 bg-white p-5">
              <div className="text-sm font-semibold text-ink-900">Option A</div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <NumberInput label="APR" value={rateA} onChange={setRateA} step={0.01} min={0} suffix="%" />
                <NumberInput label="Term" value={termA} onChange={setTermA} step={1} min={1} suffix="years" />
              </div>
            </div>

            <div className="rounded-2xl border border-ink-200 bg-white p-5">
              <div className="text-sm font-semibold text-ink-900">Option B</div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <NumberInput label="APR" value={rateB} onChange={setRateB} step={0.01} min={0} suffix="%" />
                <NumberInput label="Term" value={termB} onChange={setTermB} step={1} min={1} suffix="years" />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <ResultPanel title="Loan amount" items={[{ label: "Principal (price - down - trade)", value: money2(calc.principal) }]} />
            <ResultPanel title="Option A" items={[
              { label: "Monthly payment", value: money2(calc.a.payment) },
              { label: "Total interest", value: money2(calc.a.interest) },
              { label: "Total paid", value: money2(calc.a.totalPaid) },
            ]} />
            <ResultPanel title="Option B" items={[
              { label: "Monthly payment", value: money2(calc.b.payment) },
              { label: "Total interest", value: money2(calc.b.interest) },
              { label: "Total paid", value: money2(calc.b.totalPaid) },
            ]} />
            <ResultPanel title="Quick takeaway" items={[
              { label: "Cheaper total cost", value: calc.a.totalPaid <= calc.b.totalPaid ? "Option A" : "Option B" },
              { label: "Lower monthly payment", value: calc.a.payment <= calc.b.payment ? "Option A" : "Option B" },
            ]} note="Longer terms often lower monthly payments but can increase total interest." />
          </div>
        </div>
      </div>
    </Container>
  );
}
`);

// -----------------------------------------------------------------------------
// 11) README + gitignore
// -----------------------------------------------------------------------------
write("README.md", `# Maple Insight (Next.js)

A calm, Canada-focused site with built-in calculators:
- RRSP Refund (Ontario + Federal 2025 simplified brackets)
- Mortgage Comparison
- CCB Impact (Federal CCB, Jul 2025–Jun 2026)
- Car Financing Comparison

## Run locally
\`\`\`bash
npm install
npm run dev
\`\`\`

## Deploy
Push to GitHub and Vercel will deploy automatically (repo is connected).
`);

write(".gitignore", `node_modules
.next
out
.env*
.DS_Store
`);

// -----------------------------------------------------------------------------
// 12) Install deps (if node_modules missing or package-lock absent) and push
// -----------------------------------------------------------------------------
console.log("\n✅ Files generated. Installing dependencies…\n");
run("npm install");

console.log("\n✅ Committing to git…\n");
try {
  run("git status");
} catch {
  console.error("\n❌ Git not available in this terminal. Install Git and reopen VS Code.\n");
  process.exit(1);
}

run("git add -A");
try {
  run('git commit -m "Bootstrap Maple Insight site with calculators + SEO"');
} catch {
  console.log("ℹ️ Nothing to commit (or commit failed). Continuing…");
}
run("git push");

console.log("\n🚀 Done. Vercel should redeploy from main automatically.\n");