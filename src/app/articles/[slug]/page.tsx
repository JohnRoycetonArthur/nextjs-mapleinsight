import { notFound } from "next/navigation";
import { getArticleBySlug, getAllArticleSlugs, ArticleFull } from "@/sanity/queries";
import { ArticleContent, ArticleSection } from "./ArticleContent";
import { articleSchema } from "@/lib/structured-data";

export async function generateStaticParams() {
  const slugs = await getAllArticleSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const article = await getArticleBySlug(params.slug);
  if (!article) return {};

  const title = article.seoTitle ?? article.title;
  const description = article.seoDescription ?? article.summary ?? "";
  const url = `https://mapleinsight.ca/articles/${params.slug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: "Maple Insight Canada",
      locale: "en_CA",
      type: "article",
      publishedTime: article.publishedAt ?? undefined,
      modifiedTime: article._updatedAt ?? undefined,
      images: [{ url: "/og-default.png", width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/og-default.png"],
    },
  };
}

// ─── Utilities ───

function slugifyHeading(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function extractSections(content: unknown[]): ArticleSection[] {
  return (content as any[])
    .filter((b) => b._type === "block" && (b.style === "h2" || b.style === "h3"))
    .map((b) => {
      const title = (b.children as any[])
        .filter((c) => c._type === "span")
        .map((c) => c.text)
        .join("");
      return { id: slugifyHeading(title), title };
    });
}

function estimateReadingTime(content: unknown[]): number {
  const text = (content as any[])
    .filter((b) => b._type === "block")
    .flatMap((b) => (b.children as any[]).map((c: any) => c.text ?? ""))
    .join(" ");
  return Math.max(1, Math.round(text.trim().split(/\s+/).length / 250));
}

const BANK_ACCOUNT_SECTIONS: ArticleSection[] = [
  { id: "key-takeaways", title: "Key Takeaways" },
  { id: "why-bank-account", title: "Why You Need a Canadian Bank Account" },
  { id: "what-to-look-for", title: "What to Look For" },
  { id: "best-accounts", title: "Best Newcomer Bank Accounts" },
  { id: "our-top-pick", title: "Our Top Pick" },
  { id: "how-to-apply", title: "How to Apply" },
  { id: "related", title: "Related Resources" },
];

// ─── Page ───

export default async function ArticlePage({ params }: { params: { slug: string } }) {
  const article = await getArticleBySlug(params.slug);
  if (!article) return notFound();

  const sections =
    article.slug === "opening-a-newcomer-bank-account"
      ? BANK_ACCOUNT_SECTIONS
      : extractSections(article.content as unknown[]);

  const readingTime = estimateReadingTime(article.content as unknown[]);

  const jsonLd = articleSchema({
    headline: article.title,
    description: article.seoDescription ?? article.summary ?? "",
    slug: params.slug,
    datePublished: article.publishedAt,
    dateModified: article._updatedAt,
    authorName: article.author,
  });

  const faqJsonLd =
    article.faqItems && article.faqItems.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: article.faqItems.map((f) => ({
            "@type": "Question",
            name: f.question,
            acceptedAnswer: {
              "@type": "Answer",
              text: f.answer,
            },
          })),
        }
      : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {faqJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      )}
      <ArticleContent
        article={article}
        sections={sections}
        readingTime={readingTime}
      />
    </>
  );
}
