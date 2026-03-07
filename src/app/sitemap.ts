import type { MetadataRoute } from "next";
import { getArticlesForSitemap } from "@/sanity/queries";

const baseUrl = "https://mapleinsight.ca";

async function getArticleSitemapEntries(): Promise<MetadataRoute.Sitemap> {
  const articles = await getArticlesForSitemap();
  return articles.map(({ slug, publishedAt }) => ({
    url: `${baseUrl}/articles/${slug}`,
    lastModified: publishedAt ? new Date(publishedAt) : new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: Array<{ route: string; priority: number; freq: MetadataRoute.Sitemap[0]["changeFrequency"] }> = [
    { route: "",                           priority: 1.0, freq: "weekly" },
    { route: "/guides",                    priority: 0.7, freq: "weekly" },
    { route: "/tools",                     priority: 0.8, freq: "weekly" },
    { route: "/tools/rrsp-refund",         priority: 0.8, freq: "weekly" },
    { route: "/tools/mortgage-comparison", priority: 0.7, freq: "weekly" },
    { route: "/tools/ccb-impact",          priority: 0.7, freq: "weekly" },
    { route: "/tools/car-financing",       priority: 0.7, freq: "weekly" },
    { route: "/about",                     priority: 0.5, freq: "monthly" },
    { route: "/contact",                   priority: 0.5, freq: "monthly" },
  ];

  const now = new Date();
  const staticEntries: MetadataRoute.Sitemap = staticRoutes.map(({ route, priority, freq }) => ({
    url: `${baseUrl}${route}`,
    lastModified: now,
    changeFrequency: freq,
    priority,
  }));

  const articleEntries = await getArticleSitemapEntries();
  return [...staticEntries, ...articleEntries];
}
