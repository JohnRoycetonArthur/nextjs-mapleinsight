import type { Metadata } from "next";
import { CHECKLIST_DATA } from "@/data/checklist-data";
import { ChecklistPage } from "./ChecklistPage";

export const metadata: Metadata = {
  title: "Newcomer Financial Checklist for Canada | Maple Insight",
  description:
    "Track your financial progress in Canada with our interactive checklist. 16 essential tasks organized by month to guide your first year as a newcomer.",
  openGraph: {
    title: "Newcomer Financial Checklist — Your First Year in Canada",
    description:
      "Track your financial progress in Canada with our interactive checklist. 16 essential tasks organized by month to guide your first year as a newcomer.",
    url: "https://mapleinsight.ca/checklist",
    siteName: "Maple Insight",
    locale: "en_CA",
    type: "website",
  },
  alternates: {
    canonical: "https://mapleinsight.ca/checklist",
  },
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://mapleinsight.ca" },
    { "@type": "ListItem", position: 2, name: "Checklist", item: "https://mapleinsight.ca/checklist" },
  ],
};

const howToJsonLd = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "Newcomer Financial Checklist — Your First Year in Canada",
  description:
    "16 essential financial tasks organized by month to guide your first year as a newcomer to Canada.",
  step: CHECKLIST_DATA.flatMap((group) =>
    group.items.map((item) => ({
      "@type": "HowToStep",
      name: item.task,
    }))
  ),
};

export default function ChecklistRoute() {
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
      <ChecklistPage />
    </>
  );
}
