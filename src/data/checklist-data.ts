export interface ChecklistItemData {
  id: string;
  task: string;
  link: string;
  linkType: "article" | "calculator";
}

import React from 'react'
import { checklistIcons } from './checklist-icons'

export interface ChecklistGroupData {
  period: string;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
  lightColor: string;
  items: ChecklistItemData[];
}

export const CHECKLIST_DATA: ChecklistGroupData[] = [
  {
    period: "Month 1",
    subtitle: "Getting started",
    icon: checklistIcons.month1,
    color: "#1B7A4A",
    lightColor: "#E8F5EE",
    items: [
      { id: "CL-01", task: "Apply for a Social Insurance Number (SIN)", link: "/articles/getting-a-social-insurance-number-sin", linkType: "article" },
      { id: "CL-02", task: "Open a newcomer bank account", link: "/articles/opening-a-newcomer-bank-account", linkType: "article" },
      { id: "CL-03", task: "Set up a phone plan", link: "/articles/setting-up-phone-internet-plans", linkType: "article" },
      { id: "CL-04", task: "Create a first-month budget", link: "/calculators/newcomer-budget", linkType: "calculator" },
      { id: "CL-05", task: "Apply for a provincial health card", link: "/articles/provincial-health-insurance", linkType: "article" },
    ],
  },
  {
    period: "Month 2–3",
    subtitle: "Building foundations",
    icon: checklistIcons.month23,
    color: "#B8860B",
    lightColor: "#FDF6E3",
    items: [
      { id: "CL-06", task: "Apply for a secured credit card to start building credit", link: "/articles/understanding-canadian-credit-scores", linkType: "article" },
      { id: "CL-07", task: "Register for CRA My Account (online tax portal)", link: "/articles/your-first-canadian-tax-return", linkType: "article" },
      { id: "CL-08", task: "File for the Canada Child Benefit (CCB) if applicable", link: "/articles/canada-child-benefit-ccb-guide", linkType: "article" },
      { id: "CL-09", task: "Set up an emergency savings target (3 months of expenses)", link: "/tools/rrsp-refund", linkType: "calculator" },
    ],
  },
  {
    period: "Month 4–6",
    subtitle: "Growing & saving",
    icon: checklistIcons.month46,
    color: "#2563EB",
    lightColor: "#EFF6FF",
    items: [
      { id: "CL-10", task: "Open a TFSA and set up automatic contributions", link: "/articles/tfsa-explained-for-newcomers", linkType: "article" },
      { id: "CL-11", task: "Compare TFSA vs RRSP for your situation", link: "/calculators/tfsa-vs-rrsp", linkType: "calculator" },
      { id: "CL-12", task: "Understand your tax obligations and key deadlines", link: "/articles/your-first-canadian-tax-return", linkType: "article" },
    ],
  },
  {
    period: "Month 7–12",
    subtitle: "Looking ahead",
    icon: checklistIcons.month712,
    color: "#9333EA",
    lightColor: "#F5F0FF",
    items: [
      { id: "CL-13", task: "Review your credit score and report", link: "/articles/understanding-canadian-credit-scores", linkType: "article" },
      { id: "CL-14", task: "Evaluate FHSA if planning to buy a home", link: "/tools/rrsp-refund", linkType: "calculator" },
      { id: "CL-15", task: "File your first Canadian tax return", link: "/articles/your-first-canadian-tax-return", linkType: "article" },
      { id: "CL-16", task: "Assess rent vs buy options for the next year", link: "/tools/mortgage-comparison", linkType: "calculator" },
    ],
  },
];

export const TOTAL_ITEMS = CHECKLIST_DATA.reduce((sum, g) => sum + g.items.length, 0);
export const STORAGE_KEY = "mi_checklist_v1";

// All valid item IDs — used to filter unknown IDs from localStorage
export const ALL_ITEM_IDS = new Set(CHECKLIST_DATA.flatMap((g) => g.items.map((i) => i.id)));
