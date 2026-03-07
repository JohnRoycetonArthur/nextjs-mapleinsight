import Link from "next/link";
import { getAllArticles } from "@/sanity/queries";

export default async function ArticlesIndex() {
  const articles = await getAllArticles();

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">Articles</h1>

      <div className="mt-8 space-y-6">
        {articles.map((a) => (
          <div key={a.slug} className="rounded-xl border p-5">
            <div className="text-sm text-gray-500">
              {a.category} {a.publishedAt ? `• ${a.publishedAt.slice(0, 10)}` : ""}
            </div>

            <h2 className="mt-2 text-xl font-semibold">
              <Link className="underline-offset-4 hover:underline" href={`/articles/${a.slug}`}>
                {a.title}
              </Link>
            </h2>

            {a.summary ? <p className="mt-2 text-gray-600">{a.summary}</p> : null}
          </div>
        ))}

        {articles.length === 0 ? (
          <p className="text-gray-600">No published articles found. Publish articles in the Sanity Studio to see them here.</p>
        ) : null}
      </div>
    </main>
  );
}