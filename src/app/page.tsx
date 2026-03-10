import type { Metadata } from "next";
import { STAGES } from "@/data/start-here-stages";
import { StartHerePage } from "./start-here/StartHerePage";

export const metadata: Metadata = {
  title: { absolute: "Maple Insight — Canadian Personal Finance for Newcomers" },
  description:
    "Your step-by-step financial guide for newcomers to Canada. Learn what to do in your first 90 days, tax season, and beyond.",
  openGraph: {
    title: "New to Canada? Start Here — Maple Insight",
    description:
      "Your step-by-step financial guide for newcomers to Canada. Learn what to do in your first 90 days, tax season, and beyond.",
    url: "https://mapleinsight.ca",
    siteName: "Maple Insight",
    locale: "en_CA",
    type: "website",
  },
  alternates: {
    canonical: "https://mapleinsight.ca",
  },
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://mapleinsight.ca" },
  ],
};

const howToJsonLd = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "New to Canada? Start Here — Your Financial Journey",
  description:
    "A step-by-step guide to building a strong financial foundation as a newcomer to Canada.",
  step: STAGES.map((s) => ({
    "@type": "HowToStep",
    position: s.order,
    name: s.title,
    text: s.description,
  })),
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }}
      />
      <StartHerePage />
    </>
  );
}
