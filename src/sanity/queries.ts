import { client } from "./lib/client";

export type ArticleSummary = {
  title: string;
  slug: string;
  summary: string | null;
  publishedAt: string | null;
  category: string | null;
};

export type ArticleFull = ArticleSummary & {
  content: unknown[];
  author: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
};

const ARTICLE_SUMMARY_FIELDS = `
  title,
  "slug": slug.current,
  summary,
  publishedAt,
  "category": category->title
`;

export async function getAllArticles(): Promise<ArticleSummary[]> {
  return client.fetch(
    `*[_type == "article"] | order(publishedAt desc) {
      ${ARTICLE_SUMMARY_FIELDS}
    }`
  );
}

export async function getFeaturedArticles(limit = 4): Promise<ArticleSummary[]> {
  return client.fetch(
    `*[_type == "article"] | order(publishedAt desc) [0...$limit] {
      ${ARTICLE_SUMMARY_FIELDS}
    }`,
    { limit }
  );
}

export async function getArticleBySlug(slug: string): Promise<ArticleFull | null> {
  return client.fetch(
    `*[_type == "article" && slug.current == $slug][0] {
      ${ARTICLE_SUMMARY_FIELDS},
      content,
      author,
      seoTitle,
      seoDescription
    }`,
    { slug }
  );
}

export async function getAllArticleSlugs(): Promise<string[]> {
  const results = await client.fetch<{ slug: string }[]>(
    `*[_type == "article"] { "slug": slug.current }`
  );
  return results.map((r) => r.slug);
}

export async function getArticlesForSitemap(): Promise<
  { slug: string; publishedAt: string | null }[]
> {
  return client.fetch(
    `*[_type == "article"] {
      "slug": slug.current,
      publishedAt
    }`
  );
}
