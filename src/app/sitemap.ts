import type { MetadataRoute } from "next";

const baseUrl = "https://mapleinsight.ca";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    "",
    "/guides",
    "/tools",
    "/tools/rrsp-refund",
    "/tools/mortgage-comparison",
    "/tools/ccb-impact",
    "/tools/car-financing",
    "/about",
    "/contact",
  ];

  const now = new Date();
  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: route === "" ? 1 : 0.7,
  }));
}
