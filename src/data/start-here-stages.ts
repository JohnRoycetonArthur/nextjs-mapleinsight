export interface Stage {
  id: string;
  order: number;
  title: string;
  subtitle: string;
  icon: string;
  description: string;
  articles: Array<{ title: string; url: string }>;
  calculators: Array<{ title: string; url: string }>;
  color: string;
  lightColor: string;
}

export const STAGES: Stage[] = [
  {
    id: "first-90-days",
    order: 1,
    title: "First 90 Days",
    subtitle: "Getting settled",
    icon: "🏦",
    description:
      "Open your first Canadian bank account, get a SIN, understand the basics of credit, and set up the essential financial foundations you'll need from day one.",
    articles: [
      { title: "Getting a Social Insurance Number (SIN)", url: "/articles/getting-a-social-insurance-number-sin" },
      { title: "Opening a Newcomer Bank Account", url: "/articles/opening-a-newcomer-bank-account" },
      { title: "Understanding Canadian Credit Scores", url: "/articles/understanding-canadian-credit-scores" },
      { title: "Setting Up Phone & Internet Plans", url: "/articles/setting-up-phone-internet-plans" },
    ],
    calculators: [
      { title: "Newcomer Budget Calculator", url: "/calculators/newcomer-budget" },
    ],
    color: "#1B7A4A",
    lightColor: "#E8F5EE",
  },
  {
    id: "tax-season",
    order: 2,
    title: "Tax Season",
    subtitle: "Filing with confidence",
    icon: "📋",
    description:
      "Learn how Canadian taxes work, understand your obligations even in your first partial year, and discover credits and deductions that newcomers commonly miss.",
    articles: [
      { title: "Your First Canadian Tax Return", url: "/articles/your-first-canadian-tax-return" },
      { title: "Understanding Tax Slips (T4, T5, etc.)", url: "/articles/understanding-tax-slips-t4-t5" },
      { title: "RRSP Basics for Newcomers", url: "/articles/rrsp-basics-for-newcomers" },
      { title: "Tax Credits You Might Be Missing", url: "/articles/tax-credits-newcomers" },
    ],
    calculators: [
      { title: "Income Tax Estimator", url: "/tools/rrsp-refund" },
      { title: "TFSA vs RRSP Calculator", url: "/calculators/tfsa-vs-rrsp" },
    ],
    color: "#B8860B",
    lightColor: "#FDF6E3",
  },
  {
    id: "growing-your-money",
    order: 3,
    title: "Growing Your Money",
    subtitle: "Save & invest wisely",
    icon: "📈",
    description:
      "Start saving and investing with the right accounts for your goals — TFSA, RRSP, and FHSA each serve a different purpose. Learn which ones work best for you.",
    articles: [
      { title: "TFSA Explained for Newcomers", url: "/articles/tfsa-explained-for-newcomers" },
      { title: "RRSP Explained for Newcomers", url: "/articles/rrsp-explained-for-newcomers" },
      { title: "Introduction to the FHSA", url: "/articles/introduction-to-the-fhsa" },
      { title: "How to Start Investing in Canada", url: "/articles/how-to-start-investing-in-canada" },
    ],
    calculators: [
      { title: "TFSA vs RRSP Calculator", url: "/calculators/tfsa-vs-rrsp" },
      { title: "FHSA Calculator", url: "/tools/rrsp-refund" },
    ],
    color: "#2563EB",
    lightColor: "#EFF6FF",
  },
  {
    id: "big-decisions",
    order: 4,
    title: "Big Decisions",
    subtitle: "Life's milestones",
    icon: "🏠",
    description:
      "Planning to buy a home, start a family, or bring family members to Canada? Understand the financial implications of life's major milestones.",
    articles: [
      { title: "Renting vs Buying in Canada", url: "/articles/renting-vs-buying-in-canada" },
      { title: "Canada Child Benefit (CCB) Guide", url: "/articles/canada-child-benefit-ccb-guide" },
      { title: "Sponsoring Family Members — Financial Requirements", url: "/articles/sponsoring-family-members-financial-requirements" },
    ],
    calculators: [
      { title: "Rent vs Buy Calculator", url: "/tools/mortgage-comparison" },
      { title: "FHSA Calculator", url: "/tools/rrsp-refund" },
    ],
    color: "#9333EA",
    lightColor: "#F5F0FF",
  },
];
