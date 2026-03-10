import { Metadata } from "next";
import { BudgetCalculator } from "./BudgetCalculator";

export const metadata: Metadata = {
  title: "Newcomer Budget Calculator — Plan Your First Months in Canada | Maple Insight",
  description:
    "Plan your monthly budget as a newcomer to Canada. Enter your income and expenses to see your surplus or deficit, get personalized tips, and build financial confidence from day one.",
  alternates: {
    canonical: "https://mapleinsight.ca/calculators/newcomer-budget",
  },
  openGraph: {
    title: "Newcomer Budget Calculator — Plan Your First Months in Canada",
    description:
      "Plan your monthly budget as a newcomer to Canada. Enter your income and expenses to see your surplus or deficit.",
    url: "https://mapleinsight.ca/calculators/newcomer-budget",
    siteName: "Maple Insight",
    locale: "en_CA",
    type: "website",
    images: [{ url: "/og-default.png", width: 1200, height: 630, alt: "Newcomer Budget Calculator" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Newcomer Budget Calculator — Plan Your First Months in Canada",
    description: "Plan your monthly budget as a newcomer to Canada.",
    images: ["/og-default.png"],
  },
};

export default function NewcomerBudgetPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://mapleinsight.ca" },
          { "@type": "ListItem", "position": 2, "name": "Calculators", "item": "https://mapleinsight.ca/calculators" },
          { "@type": "ListItem", "position": 3, "name": "Newcomer Budget Calculator", "item": "https://mapleinsight.ca/calculators/newcomer-budget" },
        ],
      },
      {
        "@type": "WebApplication",
        "name": "Newcomer Budget Calculator",
        "description": "Plan your monthly budget as a newcomer to Canada with income, expense, and savings tracking.",
        "url": "https://mapleinsight.ca/calculators/newcomer-budget",
        "applicationCategory": "FinanceApplication",
        "operatingSystem": "Web",
        "offers": { "@type": "Offer", "price": "0", "priceCurrency": "CAD" },
        "provider": {
          "@type": "Organization",
          "name": "Maple Insight",
          "url": "https://mapleinsight.ca",
          "logo": { "@type": "ImageObject", "url": "https://mapleinsight.ca/maple-insight-logo.png" },
        },
      },
      {
        "@type": "HowTo",
        "name": "How to Plan Your Newcomer Budget in Canada",
        "description": "Use the Newcomer Budget Calculator to plan your monthly finances during your first year in Canada.",
        "step": [
          {
            "@type": "HowToStep",
            "position": 1,
            "name": "Enter your monthly take-home income",
            "text": "Type your monthly income after taxes and deductions into the income field.",
          },
          {
            "@type": "HowToStep",
            "position": 2,
            "name": "Fill in your monthly expenses",
            "text": "Enter amounts for rent, groceries, transit, phone, setup costs, and any immigration fees. Add custom categories as needed.",
          },
          {
            "@type": "HowToStep",
            "position": 3,
            "name": "Review your budget breakdown",
            "text": "See your monthly surplus or deficit, a donut chart of your expenses, and your suggested savings amount.",
          },
          {
            "@type": "HowToStep",
            "position": 4,
            "name": "Follow personalized tips",
            "text": "Read actionable tips tailored to your numbers — such as rent-to-income warnings, deficit alerts, and savings opportunities.",
          },
        ],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <BudgetCalculator />
    </>
  );
}
