import { Suspense } from "react";
import { getArticlesForLanding, getPillarArticleForLanding } from "@/sanity/queries";
import { ArticlesPageClient } from "@/components/articles/ArticlesPageClient";

export const metadata = {
  title: "Guides & Articles — Maple Insight",
  description:
    "Plain-language guides to Canadian personal finance, immigration, housing, and taxes — sourced from official government data.",
  alternates: { canonical: "https://mapleinsight.ca/articles" },
};

export default async function ArticlesPage() {
  const [articles, pillarArticle] = await Promise.all([
    getArticlesForLanding(),
    getPillarArticleForLanding(),
  ]);

  return (
    <Suspense fallback={null}>
      <ArticlesPageClient articles={articles} pillarArticle={pillarArticle ?? null} />
    </Suspense>
  );
}
