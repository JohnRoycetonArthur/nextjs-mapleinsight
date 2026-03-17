import type { Metadata } from "next";
import {
  LegalPageLayout,
  LegalSection,
  LegalP,
  LegalUL,
  LegalLI,
} from "@/components/LegalPageLayout";

export const metadata: Metadata = {
  title: "Disclaimer | Maple Insight Canada",
  description:
    "Maple Insight Canada provides educational financial content only. Read our disclaimer about calculator limitations, affiliate relationships, and the importance of consulting licensed professionals.",
  robots: { index: true, follow: true },
  alternates: { canonical: "https://mapleinsight.ca/disclaimer" },
};

const LAST_UPDATED = "March 17, 2026";

export default function DisclaimerPage() {
  return (
    <LegalPageLayout title="Disclaimer" lastUpdated={LAST_UPDATED}>

      <LegalSection title="1. General Disclaimer">
        <LegalP>
          Maple Insight Canada (&ldquo;Maple Insight,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo;
          or &ldquo;our&rdquo;) provides educational content about personal finance in Canada
          through the website mapleinsight.ca. Our articles, calculators, glossary, interactive
          tools, and financial simulator are designed to help newcomers to Canada build financial
          literacy and understand the Canadian financial system.
        </LegalP>
        <LegalP>
          <strong>
            Nothing on this Site constitutes professional financial, tax, investment, legal, or
            immigration advice of any kind.
          </strong>{" "}
          The information provided is general in nature and is intended for educational purposes
          only. It is not tailored to any individual&apos;s personal circumstances, financial
          situation, goals, or risk tolerance.
        </LegalP>
      </LegalSection>

      <LegalSection title="2. No Professional Relationship">
        <LegalP>
          Accessing or using this Site does not create, and is not intended to create, any
          professional relationship between you and Maple Insight. In particular:
        </LegalP>
        <LegalUL>
          <LegalLI>
            No client-advisor relationship is formed between you and Maple Insight or any of its
            contributors.
          </LegalLI>
          <LegalLI>
            No fiduciary duty is owed to you by Maple Insight or its contributors.
          </LegalLI>
          <LegalLI>
            Maple Insight is not a registered investment advisor, financial planner, tax
            professional, lawyer, or immigration consultant, and does not hold itself out as such.
          </LegalLI>
        </LegalUL>
        <LegalP>
          The relationship between you and Maple Insight is that of a reader and an independent
          educational publisher.
        </LegalP>
      </LegalSection>

      <LegalSection title="3. Accuracy and Currency of Information">
        <LegalP>
          Maple Insight makes reasonable efforts to ensure the accuracy and timeliness of the
          content on this Site. However, the Canadian tax system, government benefit programs,
          contribution limits, regulatory rules, and financial products change regularly.
        </LegalP>
        <LegalUL>
          <LegalLI>
            Tax brackets, TFSA and RRSP contribution limits, CCB amounts, CPP rates, EI premiums,
            and other figures published on this Site may not reflect the most current rules and
            may be subject to change by the Government of Canada or provincial governments at any
            time.
          </LegalLI>
          <LegalLI>
            Articles may not be updated immediately following regulatory changes.
          </LegalLI>
          <LegalLI>
            Product features, fees, and eligibility criteria for recommended financial products
            are subject to change by the respective financial institutions.
          </LegalLI>
        </LegalUL>
        <LegalP>
          <strong>Always verify information against official government sources</strong> before
          making decisions. Key authoritative sources include:
        </LegalP>
        <LegalUL>
          <LegalLI>
            <a
              href="https://www.canada.ca/en/revenue-agency.html"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#1B7A4A" }}
            >
              Canada Revenue Agency (CRA)
            </a>{" "}
            — canada.ca/en/revenue-agency
          </LegalLI>
          <LegalLI>
            <a
              href="https://www.canada.ca/en/financial-consumer-agency.html"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#1B7A4A" }}
            >
              Financial Consumer Agency of Canada (FCAC)
            </a>{" "}
            — canada.ca/en/financial-consumer-agency
          </LegalLI>
          <LegalLI>
            <a
              href="https://www.canada.ca/en/employment-social-development.html"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#1B7A4A" }}
            >
              Employment and Social Development Canada (ESDC)
            </a>
          </LegalLI>
        </LegalUL>
      </LegalSection>

      <LegalSection title="4. Calculator and Tool Limitations">
        <LegalP>
          The calculators and interactive tools on this Site — including the TFSA vs. RRSP
          comparison tool, tax refund estimator, Canada Child Benefit (CCB) calculator, mortgage
          comparison tool, car financing calculator, and Canada Financial Simulator — are
          educational tools designed to provide rough estimates.
        </LegalP>
        <LegalP>Important limitations you should be aware of:</LegalP>
        <LegalUL>
          <LegalLI>
            <strong>Simplified models:</strong> Calculators use simplified tax models and may not
            account for every deduction, credit, surtax, or special rule that applies to your
            individual situation.
          </LegalLI>
          <LegalLI>
            <strong>Provincial variation:</strong> Tax rates vary by province. While our tools
            include province selection where applicable, they may not capture every provincial
            nuance.
          </LegalLI>
          <LegalLI>
            <strong>Estimated salary data:</strong> The financial simulator uses wage estimates
            derived from Statistics Canada and Job Bank data. Your actual salary may differ
            significantly based on your qualifications, experience, employer, and local labour
            market conditions.
          </LegalLI>
          <LegalLI>
            <strong>Results are not guarantees:</strong> Calculator outputs are approximations only.
            They do not guarantee any actual financial outcome.
          </LegalLI>
          <LegalLI>
            <strong>Not real-time:</strong> Tax brackets, contribution limits, and benefit amounts
            embedded in the calculators may not reflect the most recent legislative updates.
          </LegalLI>
        </LegalUL>
        <LegalP>
          Do not rely on calculator results as the basis for a significant financial decision
          without first consulting a qualified financial professional.
        </LegalP>
      </LegalSection>

      <LegalSection title="5. Affiliate Relationships">
        <LegalP>
          Some links on this Site are affiliate links. This means that if you click on a link and
          subsequently make a purchase, open an account, or complete another qualifying action,
          Maple Insight may receive a commission from the partner company.
        </LegalP>
        <LegalP>Key facts about our affiliate relationships:</LegalP>
        <LegalUL>
          <LegalLI>
            Affiliate commissions do not increase the cost you pay for any product or service.
          </LegalLI>
          <LegalLI>
            Affiliate partnerships do not influence which products are featured or how content
            is written. Products are selected and described based on their relevance and
            usefulness to newcomers to Canada, not on commission rates.
          </LegalLI>
          <LegalLI>
            Affiliated products and services may include, but are not limited to, accounts at
            financial institutions, investment platforms such as Wealthsimple and Questrade,
            tax filing software such as TurboTax, and other financial services relevant to
            newcomers.
          </LegalLI>
          <LegalLI>
            We strive to clearly identify affiliate links where required under applicable Canadian
            guidelines.
          </LegalLI>
        </LegalUL>
        <LegalP>
          Maple Insight is not responsible for the quality, performance, or suitability of any
          product or service offered by affiliate partners. You should conduct your own due
          diligence before purchasing or signing up for any financial product.
        </LegalP>
      </LegalSection>

      <LegalSection title="6. Personal Responsibility">
        <LegalP>
          You are solely responsible for all financial decisions you make. Using this Site does
          not substitute for personalized professional advice. Maple Insight strongly recommends
          that you consult qualified, licensed professionals before making any significant
          financial, tax, investment, or legal decision, including but not limited to:
        </LegalP>
        <LegalUL>
          <LegalLI>
            A <strong>Certified Financial Planner (CFP)</strong> or registered financial advisor
            for investment and savings decisions.
          </LegalLI>
          <LegalLI>
            A <strong>Chartered Professional Accountant (CPA)</strong> for tax planning and
            filing.
          </LegalLI>
          <LegalLI>
            A <strong>licensed mortgage broker</strong> for home financing decisions.
          </LegalLI>
          <LegalLI>
            A <strong>licensed lawyer</strong> for legal matters, including estate planning and
            contracts.
          </LegalLI>
          <LegalLI>
            An <strong>authorized immigration consultant or lawyer</strong> for immigration-related
            financial questions.
          </LegalLI>
        </LegalUL>
        <LegalP>
          The{" "}
          <a
            href="https://www.canada.ca/en/financial-consumer-agency/services/financial-toolkit/find-financial-advisor.html"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#1B7A4A" }}
          >
            Financial Consumer Agency of Canada (FCAC)
          </a>{" "}
          provides resources to help Canadians find accredited financial advisors.
        </LegalP>
      </LegalSection>

      <LegalSection title="7. External Links">
        <LegalP>
          This Site may contain links to government websites, financial institutions, regulatory
          bodies, and other third-party sources. These links are provided for your convenience and
          informational purposes only.
        </LegalP>
        <LegalP>
          Maple Insight does not control, endorse, or take responsibility for the content,
          accuracy, availability, or privacy practices of any external website. The inclusion of a
          link does not imply Maple Insight&apos;s endorsement of the linked site, its operators,
          or any products and services it provides. You access external websites at your own risk
          and subject to their own terms and conditions.
        </LegalP>
      </LegalSection>

      <LegalSection title="8. No Guarantees">
        <LegalP>
          Maple Insight makes no representations or warranties of any kind, express or implied,
          regarding:
        </LegalP>
        <LegalUL>
          <LegalLI>
            The completeness, accuracy, reliability, or suitability of any information, content,
            calculator result, or tool output on the Site.
          </LegalLI>
          <LegalLI>
            The availability or uninterrupted operation of the Site.
          </LegalLI>
          <LegalLI>
            The outcomes of any financial decision made in reliance on Site content.
          </LegalLI>
          <LegalLI>
            The fitness of any information for a particular purpose.
          </LegalLI>
        </LegalUL>
        <LegalP>
          Use of this Site and reliance on its content is entirely at your own risk. Maple Insight
          disclaims all warranties to the fullest extent permitted by applicable law.
        </LegalP>
        <LegalP>
          If you have questions about this Disclaimer, please contact us at{" "}
          <a href="mailto:legal@mapleinsight.ca" style={{ color: "#1B7A4A" }}>
            legal@mapleinsight.ca
          </a>
          .
        </LegalP>
      </LegalSection>

    </LegalPageLayout>
  );
}
