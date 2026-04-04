// Shared design tokens, category config, and tool config for the articles landing page.

export const C = {
  forest: "#1B4F4A",
  accent: "#1B7A4A",
  gold: "#B8860B",
  red: "#C41E3A",
  blue: "#2563EB",
  purple: "#9333EA",
  gray: "#6B7280",
  lightGray: "#F3F4F6",
  border: "#E5E7EB",
  white: "#FFFFFF",
  text: "#374151",
  textDark: "#111827",
  textLight: "#9CA3AF",
  bg: "#FAFBFC",
};

export const font = "var(--font-dm-sans, 'DM Sans', Helvetica, sans-serif)";
export const serif = "var(--font-dm-serif, 'DM Serif Display', Georgia, serif)";

export type Category = {
  id: string;
  label: string;
  icon: string;
  color: string;
  desc?: string;
};

export type Tool = {
  title: string;
  url: string;
  desc: string;
};

export const CATEGORIES: Category[] = [
  { id: "all", label: "All Topics", icon: "📚", color: C.forest },
  {
    id: "immigration",
    label: "Immigration",
    icon: "🛂",
    color: C.accent,
    desc: "Pathways, proof of funds, permits, and the cost of moving to Canada",
  },
  {
    id: "banking",
    label: "Banking",
    icon: "🏦",
    color: C.accent,
    desc: "Bank accounts, credit scores, and managing your money",
  },
  {
    id: "taxes",
    label: "Taxes",
    icon: "📋",
    color: C.gold,
    desc: "Tax returns, slips, credits, and understanding the CRA",
  },
  {
    id: "saving",
    label: "Saving & Investing",
    icon: "📈",
    color: C.blue,
    desc: "TFSA, RRSP, FHSA, and growing your money",
  },
  {
    id: "housing",
    label: "Housing",
    icon: "🏠",
    color: C.purple,
    desc: "Renting, buying, mortgage basics, and housing programs",
  },
  {
    id: "benefits",
    label: "Benefits",
    icon: "🎯",
    color: C.red,
    desc: "CCB, EI, GST credit, health insurance, and government programs",
  },
];

export const TOOLS: Record<string, Tool[]> = {
  immigration: [
    {
      title: "Settlement Planner",
      url: "/immigration-costs#your-plan",
      desc: "Your personalized cost estimate",
    },
  ],
  banking: [
    {
      title: "Newcomer Budget Calculator",
      url: "/calculators/newcomer-budget",
      desc: "Plan your monthly expenses",
    },
  ],
  taxes: [
    {
      title: "Income Tax Estimator",
      url: "/calculators/income-tax",
      desc: "Federal + provincial estimate",
    },
    {
      title: "TFSA vs RRSP Calculator",
      url: "/calculators/tfsa-vs-rrsp",
      desc: "Which saves more?",
    },
  ],
  saving: [
    {
      title: "TFSA vs RRSP Calculator",
      url: "/calculators/tfsa-vs-rrsp",
      desc: "Compare strategies",
    },
    {
      title: "FHSA Calculator",
      url: "/calculators/fhsa",
      desc: "First Home Savings projections",
    },
  ],
  housing: [
    {
      title: "Rent vs Buy Calculator",
      url: "/calculators/rent-vs-buy",
      desc: "Which costs less long-term?",
    },
  ],
  benefits: [],
};
