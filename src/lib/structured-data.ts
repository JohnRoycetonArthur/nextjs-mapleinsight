// Reusable JSON-LD schema generators for Maple Insight pages.

const SITE_URL = "https://mapleinsight.ca";
const SITE_NAME = "Maple Insight";
const AUTHOR_URL = `${SITE_URL}/about`;
const OG_IMAGE = `${SITE_URL}/og-default.png`;

// ── Organization (shared between Article publisher and WebApplication provider) ──

export function organizationSchema() {
  return {
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: {
      "@type": "ImageObject",
      url: `${SITE_URL}/maple-insight-logo.png`,
    },
  };
}

// ── Article JSON-LD (AC-1) ───────────────────────────────────────────────────

interface ArticleSchemaInput {
  headline: string;
  description: string;
  slug: string;
  datePublished: string | null;
  dateModified: string | null;
  authorName: string | null;
}

export function articleSchema(input: ArticleSchemaInput) {
  const url = `${SITE_URL}/articles/${input.slug}`;
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: input.headline,
    description: input.description,
    url,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
    image: {
      "@type": "ImageObject",
      url: OG_IMAGE,
      width: 1200,
      height: 630,
    },
    datePublished: input.datePublished ?? undefined,
    dateModified: input.dateModified ?? input.datePublished ?? undefined,
    author: input.authorName
      ? { "@type": "Person", name: input.authorName, url: AUTHOR_URL }
      : { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
    publisher: organizationSchema(),
  };
}

// ── WebApplication JSON-LD (AC-3) ────────────────────────────────────────────

interface WebApplicationSchemaInput {
  name: string;
  description: string;
  url: string;
}

export function webApplicationSchema(input: WebApplicationSchemaInput) {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: input.name,
    description: input.description,
    url: input.url,
    applicationCategory: "FinanceApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "CAD",
    },
    provider: organizationSchema(),
  };
}
