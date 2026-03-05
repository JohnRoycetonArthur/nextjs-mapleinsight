import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import html from "remark-html";
import { notFound } from "next/navigation";

const CONTENT_DIR = path.join(process.cwd(), "content", "articles");

async function getArticleBySlug(slug: string) {
  // We will match by frontmatter slug first, fallback to filename
  if (!fs.existsSync(CONTENT_DIR)) return null;

  const files = fs.readdirSync(CONTENT_DIR).filter((f) => f.endsWith(".md"));

  // Try to find a file whose frontmatter slug matches
  for (const filename of files) {
    const filePath = path.join(CONTENT_DIR, filename);
    const file = fs.readFileSync(filePath, "utf8");
    const { data, content } = matter(file);

    const fmSlug = (data.slug as string) ?? filename.replace(/\.md$/, "");
    if (fmSlug === slug) {
      const processed = await remark().use(html).process(content);
      return { data, contentHtml: processed.toString() };
    }
  }

  return null;
}

export async function generateStaticParams() {
  if (!fs.existsSync(CONTENT_DIR)) return [];
  const files = fs.readdirSync(CONTENT_DIR).filter((f) => f.endsWith(".md"));

  // Build params from frontmatter slug (fallback to filename)
  return files.map((filename) => {
    const file = fs.readFileSync(path.join(CONTENT_DIR, filename), "utf8");
    const { data } = matter(file);
    const slug = (data.slug as string) ?? filename.replace(/\.md$/, "");
    return { slug };
  });
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const article = await getArticleBySlug(params.slug);
  if (!article) return {};
  return {
    title: (article.data.title as string) ?? "Article",
    description: (article.data.description as string) ?? "",
  };
}

export default async function ArticlePage({ params }: { params: { slug: string } }) {
  const article = await getArticleBySlug(params.slug);
  if (!article) return notFound();

  return (
  <main className="bg-maple-soft">
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-6 text-sm text-gray-500">
        <a className="hover:underline" href="/articles">Articles</a>
        <span className="mx-2">/</span>
        <span>{(article.data.category as string) ?? "Article"}</span>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Left 80% */}
        <section className="lg:col-span-4">
          <div className="rounded-2xl border bg-white p-6 shadow-soft">
            <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
              {article.data.title}
            </h1>

            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-gray-600">
              {article.data.updated ? <span>Updated: {article.data.updated}</span> : null}
              {article.data.readingTime ? <span>• {article.data.readingTime} min read</span> : null}
            </div>

            <article
              className="prose prose-lg prose-slate mt-8 max-w-none
              prose-p:leading-7 prose-p:my-5
              prose-headings:font-semibold prose-headings:tracking-tight
              prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-4
              prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
              prose-a:text-maple-red hover:prose-a:underline"
              dangerouslySetInnerHTML={{ __html: article.contentHtml }}
            />
          </div>

          {/* Related guides section (white background) */}
          <div className="mt-6 rounded-2xl border bg-white p-6 shadow-soft">
            <h2 className="text-xl font-semibold text-gray-900">Related articles</h2>
            <p className="mt-1 text-gray-600">
              Keep reading in this topic cluster.
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <a className="rounded-xl border p-4 hover:bg-gray-50" href="/articles/rrsp-contribution-deadline-canada">
                <div className="font-medium">RRSP Contribution Deadline</div>
                <div className="mt-1 text-sm text-gray-600">Deadlines, timing, and how to file.</div>
              </a>

              <a className="rounded-xl border p-4 hover:bg-gray-50" href="/articles/how-rrsp-refunds-work-canada">
                <div className="font-medium">How RRSP Refunds Work</div>
                <div className="mt-1 text-sm text-gray-600">Why refunds happen and how to use them.</div>
              </a>

              <a className="rounded-xl border p-4 hover:bg-gray-50" href="/articles/rrsp-contribution-limits-canada">
                <div className="font-medium">RRSP Contribution Limits</div>
                <div className="mt-1 text-sm text-gray-600">How contribution room is calculated.</div>
              </a>

              <a className="rounded-xl border p-4 hover:bg-gray-50" href="/articles/rrsp-for-newcomers-canada">
                <div className="font-medium">RRSP for Newcomers</div>
                <div className="mt-1 text-sm text-gray-600">When room starts and how to plan.</div>
              </a>

              <a className="rounded-xl border p-4 hover:bg-gray-50" href="/articles/how-rrsp-affects-ccb">
                <div className="font-medium">RRSP and CCB</div>
                <div className="mt-1 text-sm text-gray-600">How RRSP may affect family benefits.</div>
              </a>

              <a className="rounded-xl border p-4 hover:bg-gray-50" href="/articles/rrsp-vs-tfsa-canada">
                <div className="font-medium">RRSP vs TFSA</div>
                <div className="mt-1 text-sm text-gray-600">How to choose what to prioritize.</div>
              </a>
            </div>
          </div>
        </section>

        {/* Right 20% */}
        <aside className="lg:col-span-1">
          <div className="sticky top-24 space-y-4">
            <div className="rounded-2xl border bg-white p-5 shadow-soft">
              <div className="text-sm font-medium text-maple-green">Calculator</div>
              <div className="mt-1 text-lg font-semibold text-gray-900">RRSP Refund Calculator</div>
              <p className="mt-2 text-sm text-gray-600">
                Estimate your refund based on your income and contribution amount.
              </p>

              <a
                href="/tools/rrsp-refund"
                className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-maple-red px-4 py-2.5 text-sm font-medium text-white shadow-soft hover:opacity-90"
              >
                Try RRSP Calculator →
              </a>
            </div>

            <div className="rounded-2xl border bg-white p-5 shadow-soft">
              <div className="text-sm font-medium text-maple-green">Quick tip</div>
              <p className="mt-2 text-sm text-gray-600">
                Contributions made in the first 60 days of the year can usually be claimed on the prior year’s return.
              </p>
            </div>
          </div>
        </aside>
      </div>

      {/* Mobile sticky CTA */}
      <div className="fixed bottom-4 left-0 right-0 mx-auto max-w-6xl px-4 lg:hidden">
        <a
          href="/tools/rrsp-refund"
          className="block w-full rounded-xl bg-maple-red px-4 py-3 text-center text-sm font-medium text-white shadow-soft hover:opacity-90"
        >
          Try RRSP Calculator →
        </a>
      </div>
    </div>
  </main>
);
}