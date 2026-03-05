import fs from "fs";
import path from "path";
import matter from "gray-matter";
import Link from "next/link";

const CONTENT_DIR = path.join(process.cwd(), "content", "articles");

function getAllArticles() {
  if (!fs.existsSync(CONTENT_DIR)) return [];

  const files = fs.readdirSync(CONTENT_DIR).filter((f) => f.endsWith(".md"));

  return files
    .map((filename) => {
      const file = fs.readFileSync(path.join(CONTENT_DIR, filename), "utf8");
      const { data } = matter(file);

      return {
        title: (data.title as string) ?? filename.replace(/\.md$/, ""),
        description: (data.description as string) ?? "",
        slug: (data.slug as string) ?? filename.replace(/\.md$/, ""),
        date: (data.date as string) ?? "",
        category: (data.category as string) ?? "",
      };
    })
    .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
}

export default function ArticlesIndex() {
  const articles = getAllArticles();

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">Articles</h1>

      <div className="mt-8 space-y-6">
        {articles.map((a) => (
          <div key={a.slug} className="rounded-xl border p-5">
            <div className="text-sm text-gray-500">
              {a.category} {a.date ? `• ${a.date}` : ""}
            </div>

            <h2 className="mt-2 text-xl font-semibold">
              <Link className="underline-offset-4 hover:underline" href={`/articles/${a.slug}`}>
                {a.title}
              </Link>
            </h2>

            {a.description ? <p className="mt-2 text-gray-600">{a.description}</p> : null}
          </div>
        ))}

        {articles.length === 0 ? (
          <p className="text-gray-600">No articles found in /content/articles yet.</p>
        ) : null}
      </div>
    </main>
  );
}