import type { MetadataRoute } from "next";
import { getArticlesForSitemap } from "@/sanity/queries";

const baseUrl = "https://mapleinsight.ca";

async function getArticleSitemapEntries(): Promise<MetadataRoute.Sitemap> {
  const articles = await getArticlesForSitemap();
  return articles.map(({ slug, publishedAt }) => ({
    url: `${baseUrl}/articles/${slug}`,
    lastModified: publishedAt ? new Date(publishedAt) : new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: Array<{ route: string; priority: number; freq: MetadataRoute.Sitemap[0]["changeFrequency"] }> = [
    // Core
    { route: "",                                   priority: 1.0, freq: "weekly"  },
    { route: "/start-here",                        priority: 0.9, freq: "monthly" },
    { route: "/articles",                          priority: 0.8, freq: "weekly"  },
    { route: "/guides",                            priority: 0.7, freq: "weekly"  },
    { route: "/immigration-costs",                 priority: 1.0, freq: "weekly"  },
    { route: "/settlement-plan",                   priority: 0.9, freq: "weekly"  },
    { route: "/settlement-planner/plan",           priority: 0.9, freq: "weekly"  },
    // Simulator
    { route: "/simulator",                         priority: 0.9, freq: "monthly" },
    { route: "/simulator/results",                 priority: 0.7, freq: "monthly" },
    // Calculators
    { route: "/calculators/tfsa-vs-rrsp",         priority: 0.9, freq: "monthly" },
    { route: "/calculators/newcomer-budget",       priority: 0.9, freq: "monthly" },
    // Tools
    { route: "/tools",                             priority: 0.7, freq: "weekly"  },
    { route: "/tools/rrsp-refund",                priority: 0.8, freq: "monthly" },
    { route: "/tools/mortgage-comparison",         priority: 0.8, freq: "monthly" },
    { route: "/tools/ccb-impact",                 priority: 0.8, freq: "monthly" },
    { route: "/tools/car-financing",              priority: 0.8, freq: "monthly" },
    // Content pages
    { route: "/glossary",                          priority: 0.7, freq: "monthly" },
    { route: "/checklist",                         priority: 0.7, freq: "monthly" },
    { route: "/recommended-tools",                 priority: 0.6, freq: "monthly" },
    // About / contact
    { route: "/about",                             priority: 0.5, freq: "monthly" },
    { route: "/contact",                           priority: 0.5, freq: "monthly" },
    { route: "/for-consultants/coming-soon",       priority: 0.4, freq: "monthly" },
    // Legal
    { route: "/affiliate-disclosure",              priority: 0.3, freq: "yearly"  },
    { route: "/disclaimer",                        priority: 0.3, freq: "yearly"  },
    { route: "/privacy",                           priority: 0.3, freq: "yearly"  },
    { route: "/terms",                             priority: 0.3, freq: "yearly"  },
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
