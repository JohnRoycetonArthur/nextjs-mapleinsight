import Link from "next/link";
import { getFeaturedArticles } from "@/sanity/queries";

const featuredCalculators = [
  {
    title: "RRSP Refund Calculator",
    description: "Estimate how an RRSP contribution could affect your refund.",
    href: "/tools/rrsp-refund",
  },
  {
    title: "Mortgage Comparison",
    description: "Compare two mortgage scenarios: payments, interest, and total cost.",
    href: "/tools/mortgage-comparison",
  },
  {
    title: "CCB Impact Calculator",
    description: "Estimate Canada Child Benefit based on AFNI and number of children.",
    href: "/tools/ccb-impact",
  },
];

export default async function HomePage() {
  const featured = await getFeaturedArticles(4);

  return (
    <main className="bg-gray-50">
      <div className="mx-auto max-w-6xl px-4 py-10">
        {/* Hero */}
        <section className="rounded-2xl border bg-white p-8 shadow-sm">
          <h1 className="text-4xl font-semibold tracking-tight">
            Clear guidance for Canadian decisions.
          </h1>
          <p className="mt-3 max-w-2xl text-gray-600">
            Use fast calculators and calm explanations to understand RRSP refunds, mortgages,
            CCB impact, and more — without the hype.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/articles"
              className="inline-flex items-center rounded-xl bg-black px-4 py-2.5 text-sm font-medium text-white hover:opacity-90"
            >
              Browse articles →
            </Link>

            <Link
              href="/tools/rrsp-refund"
              className="inline-flex items-center rounded-xl border bg-white px-4 py-2.5 text-sm font-medium hover:bg-gray-50"
            >
              Try RRSP calculator →
            </Link>
          </div>
        </section>

        {/* Featured Articles */}
        <section className="mt-10">
          <div className="mb-4 flex items-end justify-between">
            <h2 className="text-2xl font-semibold tracking-tight">Featured articles</h2>
            <Link className="text-sm font-medium hover:underline" href="/articles">
              View all →
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {featured.map((a) => (
              <Link
                key={a.slug}
                href={`/articles/${a.slug}`}
                className="rounded-2xl border bg-white p-5 shadow-sm hover:bg-gray-50"
              >
                <div className="text-xs font-medium text-gray-500">
                  {a.category || "Article"} {a.publishedAt ? `• ${a.publishedAt.slice(0, 10)}` : ""}
                </div>
                <div className="mt-2 text-lg font-semibold leading-snug">
                  {a.title}
                </div>
                <p className="mt-2 text-sm text-gray-600 line-clamp-3">
                  {a.summary}
                </p>
              </Link>
            ))}

            {featured.length === 0 ? (
              <div className="rounded-2xl border bg-white p-5 text-gray-600">
                No published articles found yet.
              </div>
            ) : null}
          </div>
        </section>

        {/* Featured Calculators */}
        <section className="mt-10">
          <div className="mb-4 flex items-end justify-between">
            <h2 className="text-2xl font-semibold tracking-tight">Featured calculators</h2>
            <Link className="text-sm font-medium hover:underline" href="/tools">
              View all →
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {featuredCalculators.map((c) => (
              <Link
                key={c.href}
                href={c.href}
                className="rounded-2xl border bg-white p-5 shadow-sm hover:bg-gray-50"
              >
                <div className="text-lg font-semibold">{c.title}</div>
                <p className="mt-2 text-sm text-gray-600">{c.description}</p>
                <div className="mt-4 text-sm font-medium">Open →</div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
