import type { Metadata } from "next";
import { webApplicationSchema } from "@/lib/structured-data";
import { CarFinancingCalculator } from "./CarFinancingCalculator";

const PAGE_URL = "https://mapleinsight.ca/tools/car-financing";

export const metadata: Metadata = {
  title: "Car Financing Comparison Calculator",
  description:
    "Compare two car loan options side-by-side. Enter price, down payment, trade-in, and interest rates to see monthly payments and total interest paid.",
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: "Car Financing Comparison Calculator",
    description:
      "Compare two car loan options side-by-side — monthly payments, total interest, and true cost of financing.",
    url: PAGE_URL,
    siteName: "Maple Insight Canada",
    locale: "en_CA",
    type: "website",
    images: [{ url: "/og-default.png", width: 1200, height: 630, alt: "Car Financing Comparison Calculator" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Car Financing Comparison Calculator",
    description:
      "Compare two car loan options side-by-side — monthly payments, total interest, and true cost of financing.",
    images: ["/og-default.png"],
  },
};

const jsonLd = webApplicationSchema({
  name: "Car Financing Comparison Calculator",
  description:
    "Compare two car loan options: enter price, down payment, trade-in value, and interest rates to see monthly payments and total interest.",
  url: PAGE_URL,
});

export default function CarFinancingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <CarFinancingCalculator />
    </>
  );
}
