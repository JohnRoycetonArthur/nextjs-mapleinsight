import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: "https://mapleinsight.ca/sitemap.xml",
    host: "https://mapleinsight.ca",
  };
}
