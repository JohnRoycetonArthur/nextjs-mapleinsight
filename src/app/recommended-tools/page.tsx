import { Metadata } from "next";
import { AFFILIATE_PRODUCTS } from "@/data/affiliateProducts";
import { RecommendedToolsPage } from "./RecommendedToolsPage";

export const metadata: Metadata = {
  title: "Recommended Tools & Accounts for Newcomers to Canada | Maple Insight Canada",
  description:
    "Banking accounts, investing platforms, and tax software we recommend for newcomers to Canada. Personally reviewed, honestly assessed.",
  alternates: {
    canonical: "https://mapleinsight.ca/recommended-tools",
  },
};

export default function RecommendedToolsRoute() {
  return <RecommendedToolsPage products={AFFILIATE_PRODUCTS} />;
}
