import type { Metadata } from "next";
import {
  LegalPageLayout,
  LegalSection,
  LegalP,
  LegalUL,
  LegalLI,
} from "@/components/LegalPageLayout";

export const metadata: Metadata = {
  title: "Terms of Use | Maple Insight Canada",
  description:
    "Read the Terms of Use for Maple Insight Canada, including acceptable use, intellectual property, limitation of liability, and governing law (Ontario, Canada).",
  robots: { index: true, follow: true },
  alternates: { canonical: "https://mapleinsight.ca/terms" },
};

const LAST_UPDATED = "March 17, 2026";

export default function TermsPage() {
  return (
    <LegalPageLayout title="Terms of Use" lastUpdated={LAST_UPDATED}>

      <LegalSection title="1. Agreement to Terms">
        <LegalP>
          By accessing or using the website mapleinsight.ca (the &ldquo;Site&rdquo;), you agree
          to be bound by these Terms of Use (&ldquo;Terms&rdquo;). If you do not agree with any
          part of these Terms, you must discontinue use of the Site immediately.
        </LegalP>
        <LegalP>
          These Terms apply to all visitors, users, and anyone who accesses or uses the Site.
          Maple Insight Canada (&ldquo;Maple Insight,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo;
          or &ldquo;our&rdquo;) reserves the right to modify these Terms at any time as described
          in Section 11.
        </LegalP>
      </LegalSection>

      <LegalSection title="2. Description of Service">
        <LegalP>
          Maple Insight Canada provides a free, educational personal finance platform designed to
          help newcomers to Canada understand the Canadian financial system. The Site offers:
        </LegalP>
        <LegalUL>
          <LegalLI>Educational articles on personal finance topics relevant to newcomers</LegalLI>
          <LegalLI>
            Interactive calculators, including a TFSA vs. RRSP comparison tool, a tax refund
            estimator, a Canada Child Benefit (CCB) calculator, a mortgage comparison tool, and a
            car financing calculator
          </LegalLI>
          <LegalLI>A financial glossary of Canadian personal finance terms</LegalLI>
          <LegalLI>
            An interactive newcomer checklist to track financial setup milestones
          </LegalLI>
          <LegalLI>
            A Canada Financial Simulator to estimate income, taxes, and cost-of-living scenarios
          </LegalLI>
          <LegalLI>
            A curated list of recommended financial tools and products, some of which are
            linked via affiliate partnerships
          </LegalLI>
        </LegalUL>
        <LegalP>
          All services are provided free of charge to users. Maple Insight may earn revenue
          through affiliate commissions.
        </LegalP>
      </LegalSection>

      <LegalSection title="3. Educational Purpose Only">
        <LegalP>
          <strong>
            All content, tools, calculators, articles, glossary entries, and simulator results
            provided on this Site are for informational and educational purposes only.
          </strong>
        </LegalP>
        <LegalP>
          Nothing on the Site constitutes, or should be construed as, professional financial,
          tax, investment, legal, or immigration advice. Maple Insight is not a registered
          financial advisor, tax consultant, lawyer, or immigration consultant. The Site does not
          provide personalized advice or recommendations tailored to any individual&apos;s
          specific circumstances.
        </LegalP>
        <LegalP>
          Before making any financial, tax, investment, or legal decision, you should consult a
          qualified and licensed professional who can account for your individual situation.
          Reliance on any information provided on this Site is solely at your own risk.
        </LegalP>
      </LegalSection>

      <LegalSection title="4. Intellectual Property">
        <LegalP>
          All content published on the Site — including but not limited to articles, calculator
          logic and outputs, the financial simulator, the glossary, the newcomer checklist,
          graphics, branding, the Maple Insight name and logo, and the underlying code — is the
          intellectual property of Maple Insight Canada and is protected by Canadian copyright
          law and applicable international intellectual property laws.
        </LegalP>
        <LegalP>You may:</LegalP>
        <LegalUL>
          <LegalLI>
            View and print individual pages for personal, non-commercial use.
          </LegalLI>
          <LegalLI>
            Share links to Site pages via social media, email, or other channels.
          </LegalLI>
        </LegalUL>
        <LegalP>You may not, without prior written permission from Maple Insight:</LegalP>
        <LegalUL>
          <LegalLI>
            Reproduce, copy, distribute, publish, or commercially exploit any content from the
            Site.
          </LegalLI>
          <LegalLI>
            Create derivative works based on Site content.
          </LegalLI>
          <LegalLI>
            Republish, scrape, or mirror Site content on another website or platform.
          </LegalLI>
          <LegalLI>
            Remove or obscure any copyright, trademark, or other proprietary notices.
          </LegalLI>
        </LegalUL>
      </LegalSection>

      <LegalSection title="5. Acceptable Use">
        <LegalP>
          You agree to use the Site only for lawful purposes and in a manner that does not
          infringe the rights of others or restrict or inhibit anyone else&apos;s use of the Site.
          You must not:
        </LegalP>
        <LegalUL>
          <LegalLI>
            Use the Site for any unlawful, fraudulent, or harmful purpose.
          </LegalLI>
          <LegalLI>
            Attempt to gain unauthorized access to any part of the Site, its servers, or any
            systems connected to it.
          </LegalLI>
          <LegalLI>
            Use automated tools (bots, scrapers, crawlers) to systematically extract, download, or
            index content from the Site without Maple Insight&apos;s prior written consent.
          </LegalLI>
          <LegalLI>
            Misrepresent your affiliation with Maple Insight or impersonate the brand.
          </LegalLI>
          <LegalLI>
            Transmit any material that is defamatory, offensive, or otherwise objectionable.
          </LegalLI>
          <LegalLI>
            Interfere with the normal operation of the Site or any user&apos;s enjoyment of it.
          </LegalLI>
        </LegalUL>
      </LegalSection>

      <LegalSection title="6. Calculator and Tool Disclaimer">
        <LegalP>
          The calculators and interactive tools available on the Site (including the TFSA vs.
          RRSP calculator, tax estimator, CCB calculator, mortgage comparison tool, car financing
          calculator, and financial simulator) are simplified models designed to provide
          approximate estimates based on user-provided inputs and publicly available Canadian tax
          rates, contribution limits, and benefit rules.
        </LegalP>
        <LegalP>
          Calculator results are approximations only. They do not account for every individual
          circumstance, provincial tax variation, life event, or legislative change that may affect
          your actual financial situation. Tax rules, contribution limits, and benefit amounts
          change regularly and may not always be reflected in the calculators in real time.
        </LegalP>
        <LegalP>
          You should not make financial decisions based solely on the output of any calculator or
          tool on this Site without independent professional verification.
        </LegalP>
      </LegalSection>

      <LegalSection title="7. Third-Party Links and Affiliate Relationships">
        <LegalP>
          The Site contains links to third-party websites, including financial product providers,
          government agencies, and other resources. Some of these links are affiliate links,
          meaning Maple Insight may earn a commission if you click through and make a purchase or
          open an account. This commission is at no additional cost to you.
        </LegalP>
        <LegalP>
          Maple Insight is not responsible for the content, accuracy, privacy practices, or
          availability of any third-party website. The inclusion of a link does not imply
          endorsement of the linked site or its operators. You access third-party websites at your
          own risk and subject to their own terms and privacy policies.
        </LegalP>
      </LegalSection>

      <LegalSection title="8. Limitation of Liability">
        <LegalP>
          To the maximum extent permitted by applicable law, Maple Insight Canada, its operators,
          contributors, and affiliates shall not be liable for any direct, indirect, incidental,
          special, consequential, or punitive damages arising out of or related to:
        </LegalP>
        <LegalUL>
          <LegalLI>Your access to or use of (or inability to use) the Site.</LegalLI>
          <LegalLI>
            Any reliance on information, content, calculators, or tools provided on the Site.
          </LegalLI>
          <LegalLI>
            Errors, inaccuracies, or omissions in any content on the Site.
          </LegalLI>
          <LegalLI>
            Any unauthorized access to or use of our servers or any personal information stored
            therein.
          </LegalLI>
          <LegalLI>
            Interruption or cessation of the Site or its services.
          </LegalLI>
        </LegalUL>
        <LegalP>
          This limitation of liability applies regardless of the legal theory on which the claim
          is based and even if Maple Insight has been advised of the possibility of such damages.
        </LegalP>
      </LegalSection>

      <LegalSection title="9. Indemnification">
        <LegalP>
          You agree to indemnify, defend, and hold harmless Maple Insight Canada and its
          operators from and against any claims, liabilities, damages, losses, costs, or expenses
          (including reasonable legal fees) arising out of or related to:
        </LegalP>
        <LegalUL>
          <LegalLI>Your use of or access to the Site.</LegalLI>
          <LegalLI>Your violation of these Terms.</LegalLI>
          <LegalLI>Your violation of any third-party rights.</LegalLI>
          <LegalLI>Any content you submit or transmit through the Site (if applicable).</LegalLI>
        </LegalUL>
      </LegalSection>

      <LegalSection title="10. Governing Law and Jurisdiction">
        <LegalP>
          These Terms of Use and any dispute arising out of or related to them or to your use of
          the Site shall be governed by and construed in accordance with the laws of the Province
          of Ontario and the federal laws of Canada applicable therein, without regard to conflict
          of law principles.
        </LegalP>
        <LegalP>
          You agree that any legal action or proceeding arising from or relating to these Terms
          shall be brought exclusively in the courts of the Province of Ontario, and you
          irrevocably consent to the personal jurisdiction of such courts.
        </LegalP>
      </LegalSection>

      <LegalSection title="11. Modifications to These Terms">
        <LegalP>
          Maple Insight reserves the right to revise these Terms of Use at any time in its sole
          discretion. When we make changes, we will update the &ldquo;Last updated&rdquo; date at
          the top of this page. It is your responsibility to review these Terms periodically.
        </LegalP>
        <LegalP>
          Your continued use of the Site after any changes are posted constitutes your acceptance
          of the revised Terms. If you do not agree to the revised Terms, you must stop using the
          Site.
        </LegalP>
      </LegalSection>

      <LegalSection title="12. Contact">
        <LegalP>
          If you have questions about these Terms of Use, please contact us at:
        </LegalP>
        <LegalP>
          <strong>Email:</strong>{" "}
          <a href="mailto:legal@mapleinsight.ca" style={{ color: "#1B7A4A" }}>
            legal@mapleinsight.ca
          </a>
        </LegalP>
      </LegalSection>

    </LegalPageLayout>
  );
}
