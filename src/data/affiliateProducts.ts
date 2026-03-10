export interface AffiliateProduct {
  id: string;
  name: string;
  category: "banking" | "investing" | "tax" | "savings";
  description: string;
  pros: string[];
  cons: string[];
  url: string;
  trackingId: string;
  badge: string | null;
  ctaText: string;
  monthlyFee: string;
  keyFeature: string;
}

export const AFFILIATE_PRODUCTS: AffiliateProduct[] = [
  {
    id: "simplii",
    name: "Simplii Financial",
    category: "banking",
    description:
      "A no-fee chequing account with no minimum balance. Ideal for newcomers who want straightforward banking without monthly charges.",
    pros: ["No monthly fee", "No minimum balance", "Free Interac e-Transfers", "High-interest savings option"],
    cons: ["No physical branches", "Limited in-person support"],
    url: "https://simplii.com",
    trackingId: "simplii-nofeechq",
    badge: "Editor's Pick",
    ctaText: "Open Simplii Account",
    monthlyFee: "$0",
    keyFeature: "No-fee chequing + savings",
  },
  {
    id: "tangerine",
    name: "Tangerine",
    category: "banking",
    description:
      "An online bank backed by Scotiabank. Offers a newcomer bundle with chequing, savings, and a credit card — helpful for building credit.",
    pros: ["Newcomer welcome bonus", "Bundled credit card", "Backed by Scotiabank", "Free ABM access at Scotiabank"],
    cons: ["Savings rate drops after promo", "Limited product range"],
    url: "https://tangerine.ca",
    trackingId: "tangerine-newcomer",
    badge: "Best for Newcomers",
    ctaText: "Get Tangerine Bundle",
    monthlyFee: "$0",
    keyFeature: "Newcomer welcome bundle",
  },
  {
    id: "wealthsimple-cash",
    name: "Wealthsimple Cash",
    category: "banking",
    description:
      "A modern spending account with a prepaid Visa card. Earn interest on your balance and send free Interac e-Transfers. No credit check required.",
    pros: ["No credit check", "Earn interest on balance", "Sleek mobile app", "Free e-Transfers"],
    cons: ["Not a traditional bank account", "Newer product, still evolving"],
    url: "https://wealthsimple.com/cash",
    trackingId: "ws-cash",
    badge: null,
    ctaText: "Try Wealthsimple Cash",
    monthlyFee: "$0",
    keyFeature: "No credit check + interest",
  },
  {
    id: "td-newcomer",
    name: "TD New to Canada",
    category: "banking",
    description:
      "TD's dedicated newcomer banking package with a no-fee period, a credit card with no Canadian credit history required, and in-branch support in multiple languages.",
    pros: ["In-branch multilingual support", "Credit card with no Canadian history", "Established nationwide network"],
    cons: ["Monthly fees after promo period", "Must visit branch to open"],
    url: "https://td.com/newcomers",
    trackingId: "td-newcomer",
    badge: null,
    ctaText: "Learn About TD",
    monthlyFee: "$0 first year",
    keyFeature: "In-branch multilingual help",
  },
  {
    id: "wealthsimple-invest",
    name: "Wealthsimple Invest",
    category: "investing",
    description:
      "Canada's most popular robo-advisor. Automated investing with low fees, socially responsible options, and TFSA/RRSP/FHSA accounts.",
    pros: ["Automated portfolios", "Low 0.4–0.5% fee", "SRI options", "FHSA available"],
    cons: ["Limited customization", "No individual stock picking"],
    url: "https://wealthsimple.com/invest",
    trackingId: "ws-invest",
    badge: "Best for Beginners",
    ctaText: "Start Investing",
    monthlyFee: "0.4–0.5% MER",
    keyFeature: "Hands-off robo-advisor",
  },
  {
    id: "questrade",
    name: "Questrade",
    category: "investing",
    description:
      "Canada's leading self-directed brokerage. Buy ETFs commission-free, and access TFSA, RRSP, and FHSA accounts with low trading costs.",
    pros: ["Free ETF purchases", "Low trading commissions", "FHSA available", "Advanced tools"],
    cons: ["Steeper learning curve", "Sell commissions apply"],
    url: "https://questrade.com",
    trackingId: "questrade-etf",
    badge: null,
    ctaText: "Open Questrade Account",
    monthlyFee: "$0 account fee",
    keyFeature: "Free ETF purchases",
  },
  {
    id: "turbotax",
    name: "TurboTax",
    category: "tax",
    description:
      "The most popular tax software in Canada. Step-by-step guidance helps newcomers file their first Canadian tax return with confidence.",
    pros: ["Guided step-by-step", "Auto-fills from CRA", "Newcomer-specific prompts", "Audit support included"],
    cons: ["Free version is limited", "Paid tiers can be pricey"],
    url: "https://turbotax.intuit.ca",
    trackingId: "turbotax-2026",
    badge: "Most Popular",
    ctaText: "File with TurboTax",
    monthlyFee: "Free – $49.99",
    keyFeature: "Guided newcomer filing",
  },
  {
    id: "wealthsimple-tax",
    name: "Wealthsimple Tax",
    category: "tax",
    description:
      "A completely free tax filing tool for Canadians. Simple interface, auto-fill from CRA, and donation-based model means you truly pay nothing.",
    pros: ["100% free", "CRA auto-fill", "Clean interface", "RRSP optimization tips"],
    cons: ["Less hand-holding than TurboTax", "No phone support"],
    url: "https://wealthsimple.com/tax",
    trackingId: "ws-tax",
    badge: "Best Free Option",
    ctaText: "File for Free",
    monthlyFee: "Free (pay what you want)",
    keyFeature: "Truly free tax filing",
  },
];

export function buildAffiliateUrl(product: AffiliateProduct, placement: string): string {
  return `${product.url}?ref=mapleinsight&utm_source=mapleinsight&utm_medium=affiliate&utm_campaign=${placement}&tid=${product.trackingId}`;
}

export function getProductsByCategory(
  category: AffiliateProduct["category"]
): AffiliateProduct[] {
  return AFFILIATE_PRODUCTS.filter((p) => p.category === category);
}

export const PLACEMENTS = {
  ARTICLE_BANK_COMPARISON: "article-bank-account-comparison",
  ARTICLE_BANK_TOP_PICK: "article-bank-account-top-pick",
  ARTICLE_BANK_INLINE: "article-bank-account-inline",
  RECOMMENDED_TOOLS_BANKING: "recommended-tools-banking",
  RECOMMENDED_TOOLS_INVESTING: "recommended-tools-investing",
  RECOMMENDED_TOOLS_TAX: "recommended-tools-tax",
  RECOMMENDED_TOOLS_SAVINGS: "recommended-tools-savings",
} as const;
