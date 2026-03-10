export interface GlossaryTerm {
  id: string;
  term: string;
  fullName?: string;
  letter: string;
  definition: string;
  relatedLinks?: {
    label: string;
    url: string;
    type: "article" | "calculator";
  }[];
}

export const GLOSSARY_TERMS: GlossaryTerm[] = [
  {
    id: "acb",
    term: "ACB",
    fullName: "Adjusted Cost Base",
    letter: "A",
    definition:
      "The original cost of an investment plus any additional costs like commissions. You use the ACB to calculate capital gains or losses when you sell the investment. Keeping accurate ACB records is important for your tax return.",
    relatedLinks: [{ label: "Capital Gains Guide", url: "/articles/how-to-start-investing-in-canada", type: "article" }],
  },
  {
    id: "amortization",
    term: "Amortization",
    letter: "A",
    definition:
      "The length of time it takes to fully pay off a mortgage through regular payments. In Canada, most mortgages are amortized over 25 years, though you can choose shorter or longer periods. A longer amortization means lower monthly payments but more interest paid overall.",
    relatedLinks: [{ label: "Rent vs Buy Calculator", url: "/tools/mortgage-comparison", type: "calculator" }],
  },
  {
    id: "attribution-rules",
    term: "Attribution Rules",
    letter: "A",
    definition:
      "CRA rules that prevent income-splitting by attributing investment income back to the original earner when money is transferred to a lower-income spouse or minor child. Understanding these rules helps you plan family finances legally.",
  },
  {
    id: "basic-personal-amount",
    term: "Basic Personal Amount",
    fullName: "Basic Personal Amount (BPA)",
    letter: "B",
    definition:
      "A non-refundable tax credit that everyone in Canada can claim. It means you don't pay federal tax on the first portion of your income — the exact amount changes each year. Most provinces have their own version too.",
    relatedLinks: [{ label: "Income Tax Estimator", url: "/tools/rrsp-refund", type: "calculator" }],
  },
  {
    id: "ccb",
    term: "CCB",
    fullName: "Canada Child Benefit",
    letter: "C",
    definition:
      "A tax-free monthly payment from the federal government to help families with the cost of raising children under 18. The amount depends on your family income and the number and ages of your children. You must file your taxes every year to keep receiving it.",
    relatedLinks: [{ label: "CCB Guide", url: "/articles/canada-child-benefit-ccb-guide", type: "article" }],
  },
  {
    id: "capital-gains",
    term: "Capital Gains",
    letter: "C",
    definition:
      "The profit you make when you sell an asset (like stocks or property) for more than you paid. In Canada, only 50% of capital gains are included in your taxable income, making them more tax-efficient than regular income. Assets inside a TFSA or RRSP are sheltered from capital gains tax.",
  },
  {
    id: "cmhc-insurance",
    term: "CMHC Insurance",
    fullName: "Canada Mortgage and Housing Corporation Mortgage Insurance",
    letter: "C",
    definition:
      "Mandatory mortgage insurance required when your down payment is less than 20% of the home's purchase price. The premium (0.6%–4% of the mortgage) is added to your mortgage balance. It protects the lender, not you, but it allows you to buy a home with as little as 5% down.",
    relatedLinks: [{ label: "Rent vs Buy Calculator", url: "/tools/mortgage-comparison", type: "calculator" }],
  },
  {
    id: "contribution-room",
    term: "Contribution Room",
    letter: "C",
    definition:
      "The maximum amount you're allowed to contribute to your RRSP or TFSA in a given year. TFSA room accumulates every year you are 18+ and a Canadian resident. Unused RRSP room carries forward indefinitely. Over-contributing results in a penalty tax.",
  },
  {
    id: "cpp",
    term: "CPP",
    fullName: "Canada Pension Plan",
    letter: "C",
    definition:
      "A mandatory retirement savings program that most Canadian workers contribute to through payroll deductions. When you retire (as early as age 60), you receive monthly payments based on how much you contributed over your working life. Newcomers who work in Canada immediately start building CPP entitlement.",
    relatedLinks: [{ label: "RRSP Basics for Newcomers", url: "/articles/rrsp-basics-for-newcomers", type: "article" }],
  },
  {
    id: "cra",
    term: "CRA",
    fullName: "Canada Revenue Agency",
    letter: "C",
    definition:
      "The federal government agency responsible for collecting taxes, administering tax laws, and delivering benefit programs like the CCB and GST/HST credit. You'll interact with the CRA when filing your annual tax return and accessing your tax account online.",
    relatedLinks: [{ label: "Your First Tax Return", url: "/articles/your-first-canadian-tax-return", type: "article" }],
  },
  {
    id: "direct-deposit",
    term: "Direct Deposit",
    letter: "D",
    definition:
      "A way to receive government payments (like tax refunds, CCB, or GST credits) electronically straight into your bank account. Setting up direct deposit with the CRA through My Account is faster and more reliable than waiting for a cheque in the mail.",
  },
  {
    id: "dividend",
    term: "Dividend",
    letter: "D",
    definition:
      "A payment made by a company to its shareholders, usually from profits. Canadian dividends from eligible corporations receive favourable tax treatment through the dividend tax credit, making them tax-efficient for investors. Dividends are reported on a T5 slip.",
  },
  {
    id: "drip",
    term: "DRIP",
    fullName: "Dividend Reinvestment Plan",
    letter: "D",
    definition:
      "A program that automatically uses your dividend payments to buy more shares of the same company instead of paying cash. DRIPs are a simple way to grow your investment over time through compounding without any transaction fees.",
  },
  {
    id: "effective-tax-rate",
    term: "Effective Tax Rate",
    letter: "E",
    definition:
      "The average percentage of your total income that you actually pay in tax, after all deductions and credits. It is always lower than your marginal tax rate. For example, if you earn $60,000 and pay $10,000 in tax, your effective rate is about 16.7%.",
    relatedLinks: [{ label: "Income Tax Estimator", url: "/tools/rrsp-refund", type: "calculator" }],
  },
  {
    id: "ei",
    term: "EI",
    fullName: "Employment Insurance",
    letter: "E",
    definition:
      "A federal program that provides temporary income replacement if you lose your job through no fault of your own, or need to take time off for parental leave, illness, or caregiving. Most employed Canadians contribute to EI through payroll deductions and can claim benefits if eligible.",
  },
  {
    id: "etf",
    term: "ETF",
    fullName: "Exchange-Traded Fund",
    letter: "E",
    definition:
      "A type of investment fund that holds a basket of assets (like stocks or bonds) and trades on a stock exchange like a single share. ETFs offer broad diversification at low cost and are popular for long-term investing inside a TFSA or RRSP.",
  },
  {
    id: "fhsa",
    term: "FHSA",
    fullName: "First Home Savings Account",
    letter: "F",
    definition:
      "A registered account launched in 2023 that combines the benefits of an RRSP and a TFSA for first-time homebuyers. Contributions are tax-deductible and withdrawals for a qualifying home purchase are completely tax-free. You can contribute up to $8,000 per year and $40,000 lifetime.",
    relatedLinks: [
      { label: "FHSA Calculator", url: "/calculators/tfsa-vs-rrsp", type: "calculator" },
      { label: "FHSA Explained", url: "/articles/introduction-to-the-fhsa", type: "article" },
    ],
  },
  {
    id: "foreign-income-verification",
    term: "Foreign Income Verification",
    letter: "F",
    definition:
      "A requirement to report foreign assets and income to the CRA. If you own foreign property worth more than $100,000 CAD, you must file Form T1135 annually. Newcomers with assets in their home country should be aware of these rules to avoid penalties.",
  },
  {
    id: "gic",
    term: "GIC",
    fullName: "Guaranteed Investment Certificate",
    letter: "G",
    definition:
      "A safe, low-risk investment offered by banks and credit unions where you deposit money for a fixed term (e.g., 1–5 years) and earn a guaranteed interest rate. GICs are insured by CDIC up to $100,000 and are often used for emergency funds or short-term savings goals.",
  },
  {
    id: "gst-hst-credit",
    term: "GST/HST Credit",
    letter: "G",
    definition:
      "A tax-free quarterly payment from the CRA to help individuals and families with low or modest incomes offset the GST or HST they pay. You are automatically considered for this credit when you file your tax return — no separate application is needed.",
    relatedLinks: [{ label: "Tax Credits Guide", url: "/articles/tax-credits-newcomers", type: "article" }],
  },
  {
    id: "land-transfer-tax",
    term: "Land Transfer Tax",
    letter: "L",
    definition:
      "A provincial tax paid when you purchase real estate in Canada. The amount is typically 0.5%–2.5% of the purchase price and varies by province. Ontario and BC also charge a municipal land transfer tax in some cities. First-time buyers may qualify for a rebate.",
  },
  {
    id: "marginal-tax-rate",
    term: "Marginal Tax Rate",
    letter: "M",
    definition:
      "The tax rate you pay on the next dollar of income you earn. Canada uses a progressive tax system, so higher income is taxed at higher rates. Your marginal rate matters most when deciding whether to contribute to an RRSP, because it determines your tax savings.",
    relatedLinks: [{ label: "Income Tax Estimator", url: "/tools/rrsp-refund", type: "calculator" }],
  },
  {
    id: "netfile",
    term: "NETFILE",
    letter: "N",
    definition:
      "The CRA's secure online service that allows you to file your tax return electronically using approved tax software. It is the fastest way to file and receive your refund. Most newcomers can use NETFILE after their first year of filing.",
  },
  {
    id: "noa",
    term: "NOA",
    fullName: "Notice of Assessment",
    letter: "N",
    definition:
      "An official document from the CRA that summarizes your tax return after it has been processed. It confirms your tax owing or refund, shows your RRSP contribution room, and notes any changes the CRA made to your return. Keep your NOA — you'll need it for future filings and loan applications.",
    relatedLinks: [{ label: "Your First Tax Return", url: "/articles/your-first-canadian-tax-return", type: "article" }],
  },
  {
    id: "oas",
    term: "OAS",
    fullName: "Old Age Security",
    letter: "O",
    definition:
      "A monthly federal pension payment available to Canadians aged 65 and older who have lived in Canada for at least 10 years after age 18. Unlike CPP, OAS is not based on your work history — it is funded by general tax revenues. Newcomers build eligibility the longer they live in Canada.",
  },
  {
    id: "principal-residence-exemption",
    term: "Principal Residence Exemption",
    letter: "P",
    definition:
      "A tax rule that allows you to shelter the capital gain from selling your primary home from income tax. You can only designate one property per year as your principal residence. This is one of the most valuable tax benefits available to Canadian homeowners.",
  },
  {
    id: "rdsp",
    term: "RDSP",
    fullName: "Registered Disability Savings Plan",
    letter: "R",
    definition:
      "A long-term savings plan for people with disabilities who qualify for the Disability Tax Credit. The government provides matching grants and bonds to help grow the account. Withdrawals in retirement are taxed as income, but the government contributions make it highly valuable.",
  },
  {
    id: "resp",
    term: "RESP",
    fullName: "Registered Education Savings Plan",
    letter: "R",
    definition:
      "A tax-sheltered account designed to help families save for a child's post-secondary education. The government adds a Canada Education Savings Grant of 20% on the first $2,500 contributed per year. Families with lower incomes may also qualify for additional grants.",
  },
  {
    id: "rrsp",
    term: "RRSP",
    fullName: "Registered Retirement Savings Plan",
    letter: "R",
    definition:
      "A government-registered savings account designed to help you save for retirement. Contributions are tax-deductible (reducing your taxable income now), and investments grow tax-free inside the account. You pay tax when you withdraw, ideally in retirement when your income — and tax rate — is lower.",
    relatedLinks: [
      { label: "TFSA vs RRSP Calculator", url: "/calculators/tfsa-vs-rrsp", type: "calculator" },
      { label: "RRSP Explained", url: "/articles/rrsp-explained-for-newcomers", type: "article" },
    ],
  },
  {
    id: "sin",
    term: "SIN",
    fullName: "Social Insurance Number",
    letter: "S",
    definition:
      "A unique 9-digit number issued by Service Canada that you need to work in Canada, file taxes, and access government benefits. It is one of the first things you should apply for after arriving. Protect your SIN — sharing it unnecessarily can lead to identity theft.",
    relatedLinks: [{ label: "Getting Your SIN", url: "/articles/getting-a-social-insurance-number-sin", type: "article" }],
  },
  {
    id: "t4",
    term: "T4 Slip",
    fullName: "Statement of Remuneration Paid",
    letter: "T",
    definition:
      "A tax slip your employer gives you by the end of February each year. It shows your total employment income and the amount of income tax, CPP, and EI deducted from your pay throughout the year. You need your T4 to file your tax return.",
    relatedLinks: [{ label: "Understanding Tax Slips", url: "/articles/understanding-tax-slips-t4-t5", type: "article" }],
  },
  {
    id: "t5",
    term: "T5 Slip",
    fullName: "Statement of Investment Income",
    letter: "T",
    definition:
      "A tax slip issued by your bank or investment institution showing investment income you earned — such as interest or dividends — during the year. You only receive a T5 if your investment income exceeded $50. Include all T5s when filing your return.",
    relatedLinks: [{ label: "Understanding Tax Slips", url: "/articles/understanding-tax-slips-t4-t5", type: "article" }],
  },
  {
    id: "tfsa",
    term: "TFSA",
    fullName: "Tax-Free Savings Account",
    letter: "T",
    definition:
      "A flexible, registered account where your investments grow completely tax-free — you pay no tax on interest, dividends, or capital gains inside a TFSA. Withdrawals are also tax-free and don't affect government benefits. You accumulate contribution room every year you are 18+ and a Canadian resident.",
    relatedLinks: [
      { label: "TFSA vs RRSP Calculator", url: "/calculators/tfsa-vs-rrsp", type: "calculator" },
      { label: "TFSA Explained", url: "/articles/tfsa-explained-for-newcomers", type: "article" },
    ],
  },
  {
    id: "withholding-tax",
    term: "Withholding Tax",
    letter: "W",
    definition:
      "Tax deducted at the source before you receive income — for example, your employer withholds income tax from your paycheque and remits it to the CRA on your behalf. Foreign withholding tax applies when you receive dividends from companies in other countries.",
  },
];

export const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
export const LETTERS_WITH_TERMS = new Set(GLOSSARY_TERMS.map((t) => t.letter));
