import { Metadata } from "next";
import { GlossaryPage } from "./GlossaryPage";
import { GLOSSARY_TERMS } from "@/data/glossaryTerms";

export const metadata: Metadata = {
  title: "Canadian Financial Glossary for Newcomers | Maple Insight",
  description:
    "Plain-language definitions of 35 Canadian financial terms — RRSP, TFSA, FHSA, CCB, CRA, NOA, SIN, and more. No financial background required.",
  alternates: {
    canonical: "https://mapleinsight.ca/glossary",
  },
};

export default function GlossaryPageRoute() {
  const faqTerms = GLOSSARY_TERMS.slice(0, 10);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: "https://mapleinsight.ca" },
          { "@type": "ListItem", position: 2, name: "Glossary", item: "https://mapleinsight.ca/glossary" },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: faqTerms.map((term) => ({
          "@type": "Question",
          name: `What is ${term.fullName ?? term.term}?`,
          acceptedAnswer: {
            "@type": "Answer",
            text: term.definition,
          },
        })),
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <GlossaryPage />
    </>
  );
}
