import type { Metadata } from "next";
import { webApplicationSchema } from "@/lib/structured-data";
import { CcbImpactCalculator } from "./CcbImpactCalculator";

const PAGE_URL = "https://mapleinsight.ca/tools/ccb-impact";

export const metadata: Metadata = {
  title: "Canada Child Benefit Calculator — Estimate Your CCB",
  description:
    "Estimate your federal Canada Child Benefit (CCB) for the July 2025–June 2026 benefit year. Enter your adjusted family net income and number of children.",
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: "Canada Child Benefit (CCB) Calculator",
    description:
      "Estimate your federal Canada Child Benefit for 2025–2026 based on your income and number of children.",
    url: PAGE_URL,
    siteName: "Maple Insight",
    locale: "en_CA",
    type: "website",
    images: [{ url: "/og-default.png", width: 1200, height: 630, alt: "Canada Child Benefit Calculator" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Canada Child Benefit (CCB) Calculator",
    description:
      "Estimate your federal Canada Child Benefit for 2025–2026 based on your income and number of children.",
    images: ["/og-default.png"],
  },
};

const jsonLd = webApplicationSchema({
  name: "Canada Child Benefit (CCB) Calculator",
  description:
    "Estimate the federal Canada Child Benefit for the July 2025–June 2026 benefit year based on AFNI and child count.",
  url: PAGE_URL,
});

export default function CcbImpactPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <CcbImpactCalculator />
    </>
  );
}
