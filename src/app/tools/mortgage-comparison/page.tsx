import type { Metadata } from "next";
import { webApplicationSchema } from "@/lib/structured-data";
import { MortgageComparisonCalculator } from "./MortgageComparisonCalculator";

const PAGE_URL = "https://mapleinsight.ca/tools/mortgage-comparison";

export const metadata: Metadata = {
  title: "Mortgage Comparison Calculator — Compare Two Scenarios",
  description:
    "Compare two mortgage scenarios side-by-side. CMHC rules and minimum down payments applied automatically. See monthly payments, total interest, and amortization charts.",
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: "Mortgage Comparison Calculator — Compare Two Scenarios",
    description:
      "Compare two mortgage scenarios side-by-side with Canadian CMHC rules applied automatically.",
    url: PAGE_URL,
    siteName: "Maple Insight Canada",
    locale: "en_CA",
    type: "website",
    images: [{ url: "/og-default.png", width: 1200, height: 630, alt: "Mortgage Comparison Calculator" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Mortgage Comparison Calculator — Compare Two Scenarios",
    description:
      "Compare two mortgage scenarios side-by-side with Canadian CMHC rules applied automatically.",
    images: ["/og-default.png"],
  },
};

const jsonLd = webApplicationSchema({
  name: "Mortgage Comparison Calculator",
  description:
    "Compare two Canadian mortgage scenarios with CMHC rules, minimum down payments, and full amortization schedules.",
  url: PAGE_URL,
});

export default function MortgageComparisonPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <MortgageComparisonCalculator />
    </>
  );
}
