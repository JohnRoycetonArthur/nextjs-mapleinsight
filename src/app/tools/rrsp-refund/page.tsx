import type { Metadata } from "next";
import { webApplicationSchema } from "@/lib/structured-data";
import { RrspRefundCalculator } from "./RrspRefundCalculator";

const PAGE_URL = "https://mapleinsight.ca/tools/rrsp-refund";

export const metadata: Metadata = {
  title: "RRSP Refund Calculator — Estimate Your Tax Savings",
  description:
    "Estimate how much tax you save with an RRSP contribution. Enter your income and contribution, choose your province, and see your estimated refund instantly.",
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: "RRSP Refund Calculator — Estimate Your Tax Savings",
    description:
      "Estimate how much tax you save with an RRSP contribution. Enter your income and contribution, choose your province, and see your estimated refund instantly.",
    url: PAGE_URL,
    siteName: "Maple Insight Canada",
    locale: "en_CA",
    type: "website",
    images: [{ url: "/og-default.png", width: 1200, height: 630, alt: "RRSP Refund Calculator" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "RRSP Refund Calculator — Estimate Your Tax Savings",
    description: "Estimate how much tax you save with an RRSP contribution.",
    images: ["/og-default.png"],
  },
};

const jsonLd = webApplicationSchema({
  name: "RRSP Refund Calculator",
  description:
    "Estimate how much tax you save with an RRSP contribution based on your income, RRSP amount, and province.",
  url: PAGE_URL,
});

export default function RrspRefundPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <RrspRefundCalculator />
    </>
  );
}
