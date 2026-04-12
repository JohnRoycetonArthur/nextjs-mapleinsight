import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getArticleBySlug } from "@/sanity/queries";
import { PillarArticlePage } from "@/app/articles/[slug]/PillarArticlePage";
import { articleSchema } from "@/lib/structured-data";

const PILLAR_SLUG = "financially-ready-move-to-canada";
const CANONICAL_URL = "https://mapleinsight.ca/immigration-costs";
export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const article = await getArticleBySlug(PILLAR_SLUG);
  const title =
    article?.seoTitle ??
    article?.title ??
    "How Much Money Do I Need to Move to Canada? | Maple Insight";
  const description =
    article?.seoDescription ??
    article?.summary ??
    "Find out exactly how much money you need to move to Canada — based on your immigration pathway, city, and family size. Real IRCC, CMHC & CRA data.";

  return {
    title,
    description,
    alternates: { canonical: CANONICAL_URL },
    openGraph: {
      title,
      description,
      url: CANONICAL_URL,
      siteName: "Maple Insight Canada",
      locale: "en_CA",
      type: "article",
      publishedTime: article?.publishedAt ?? undefined,
      modifiedTime: article?._updatedAt ?? undefined,
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

export default async function ImmigrationCostsPage({
  searchParams,
}: {
  searchParams?: { scenario?: string };
}) {
  const article = await getArticleBySlug(PILLAR_SLUG);
  if (!article || !article.isPillar) return notFound();

  function estimateReadingTime(content: unknown[]): number {
    const text = (content as Array<{ _type: string; children?: Array<{ text?: string }> }>)
      .filter((b) => b._type === "block")
      .flatMap((b) => (b.children ?? []).map((c) => c.text ?? ""))
      .join(" ");
    return Math.max(1, Math.round(text.trim().split(/\s+/).length / 250));
  }

  const readingTime = estimateReadingTime(article.content as unknown[]);

  const jsonLd = articleSchema({
    headline: article.title,
    description: article.seoDescription ?? article.summary ?? "",
    slug: PILLAR_SLUG,
    datePublished: article.publishedAt,
    dateModified: article._updatedAt,
    authorName: article.author,
  });
  // Override URL to canonical
  (jsonLd as Record<string, unknown>).url = CANONICAL_URL;
  (jsonLd as Record<string, unknown>).mainEntityOfPage = {
    "@type": "WebPage",
    "@id": CANONICAL_URL,
  };

  const faqJsonLd =
    article.faqItems && article.faqItems.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: article.faqItems.map((f) => ({
            "@type": "Question",
            name: f.question,
            acceptedAnswer: { "@type": "Answer", text: f.answer },
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
      <PillarArticlePage
        article={article}
        readingTime={readingTime}
        initialScenario={searchParams?.scenario ?? null}
      />
    </>
  );
}
