import type { Metadata } from "next";
import { webApplicationSchema } from "@/lib/structured-data";
import { TfsaVsRrspCalculator } from "./TfsaVsRrspCalculator";

export const metadata: Metadata = {
  title: "TFSA vs RRSP Calculator — Compare Side-by-Side | Maple Insight Canada",
  description:
    "Compare TFSA and RRSP side-by-side with our free calculator. See which account gives you more after-tax value based on your income, province, and retirement plans. Updated for 2026 tax brackets.",
  openGraph: {
    title: "TFSA vs RRSP Calculator — Which Account Gives You More?",
    description:
      "Compare TFSA and RRSP side-by-side with our free calculator. See which account gives you more after-tax value based on your income, province, and retirement plans. Updated for 2026 tax brackets.",
    url: "https://mapleinsight.ca/calculators/tfsa-vs-rrsp",
    siteName: "Maple Insight Canada",
    locale: "en_CA",
    type: "website",
    images: [{ url: "/og-default.png", width: 1200, height: 630, alt: "TFSA vs RRSP Calculator" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "TFSA vs RRSP Calculator — Which Account Gives You More?",
    description:
      "Compare TFSA and RRSP side-by-side with our free calculator. Updated for 2026 tax brackets.",
    images: ["/og-default.png"],
  },
  alternates: {
    canonical: "https://mapleinsight.ca/calculators/tfsa-vs-rrsp",
  },
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://mapleinsight.ca" },
    { "@type": "ListItem", position: 2, name: "Calculators", item: "https://mapleinsight.ca/calculators" },
    {
      "@type": "ListItem",
      position: 3,
      name: "TFSA vs RRSP Calculator",
      item: "https://mapleinsight.ca/calculators/tfsa-vs-rrsp",
    },
  ],
};

const webAppJsonLd = webApplicationSchema({
  name: "TFSA vs RRSP Calculator",
  description:
    "Compare TFSA and RRSP side-by-side based on your income, province, and retirement plans. Updated for 2026 tax brackets.",
  url: "https://mapleinsight.ca/calculators/tfsa-vs-rrsp",
});

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is a TFSA?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "A Tax-Free Savings Account (TFSA) is a registered account where you contribute after-tax dollars. Investments grow tax-free, and withdrawals are completely tax-free. The 2026 annual contribution limit is $7,000, and unused room carries forward.",
      },
    },
    {
      "@type": "Question",
      name: "What is an RRSP?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "A Registered Retirement Savings Plan (RRSP) is a registered account where contributions are tax-deductible, reducing your taxable income for the year. Investments grow tax-deferred, but withdrawals are taxed as ordinary income. The 2026 contribution limit is $33,810 or 18% of prior-year income, whichever is less.",
      },
    },
    {
      "@type": "Question",
      name: "When is a TFSA better than an RRSP?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "A TFSA is generally better when you expect a higher tax rate in retirement than your current marginal tax rate, when you have a lower current income, or when you want flexible tax-free withdrawals at any time without penalty.",
      },
    },
    {
      "@type": "Question",
      name: "When is an RRSP better than a TFSA?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "An RRSP is generally better when you expect a lower tax rate in retirement than your current marginal rate, when you have a higher current income (benefiting more from the immediate tax deduction), or when you want to use the Home Buyers' Plan or Lifelong Learning Plan.",
      },
    },
    {
      "@type": "Question",
      name: "What is a marginal tax rate?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Your marginal tax rate is the rate of tax you pay on your last dollar of income — the highest tax bracket your income reaches. In Canada, it is the combined federal and provincial rate. It is used to calculate how much an RRSP contribution saves you in taxes today.",
      },
    },
  ],
};

export default function TfsaVsRrspPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }}
      />
      <TfsaVsRrspCalculator />
    </>
  );
}
