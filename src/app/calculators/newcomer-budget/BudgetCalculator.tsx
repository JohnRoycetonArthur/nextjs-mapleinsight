"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Sector } from "recharts";
import { CurrencyInput } from "@/components/budget/CurrencyInput";
import { ExpenseRow } from "@/components/budget/ExpenseRow";
import { AddCategoryButton } from "@/components/budget/AddCategoryButton";
import { TipCard, Tip } from "@/components/budget/TipCard";
import { SummaryMetric } from "@/components/budget/SummaryMetric";
import { NewsletterInline } from "@/components/start-here/NewsletterInline";

// ─── Chart Color Palette ───
const CHART_COLORS = [
  "#1B7A4A", "#2563EB", "#B8860B", "#9333EA", "#E11D48",
  "#0891B2", "#D97706", "#4F46E5", "#059669", "#BE185D",
];

// ─── Default Expense Categories ───
const DEFAULT_CATEGORIES = [
  { id: "rent", label: "Rent", amount: 0, icon: "🏠", isDefault: true, isRemovable: false, placeholder: "e.g., 1,500" },
  { id: "groceries", label: "Groceries", amount: 0, icon: "🛒", isDefault: true, isRemovable: false, placeholder: "e.g., 400" },
  { id: "transit", label: "Transit (TTC / bus pass)", amount: 0, icon: "🚌", isDefault: true, isRemovable: true, placeholder: "e.g., 130" },
  { id: "phone", label: "Phone & Internet", amount: 0, icon: "📱", isDefault: true, isRemovable: true, placeholder: "e.g., 80" },
  { id: "setup", label: "Initial Setup Costs", amount: 0, icon: "🛋️", isDefault: true, isRemovable: true, placeholder: "e.g., 500" },
  { id: "immigration", label: "Immigration Fees", amount: 0, icon: "📄", isDefault: true, isRemovable: true, placeholder: "e.g., 200" },
];

const CUSTOM_ICONS = ["📌", "📚", "🏥", "🎓", "🧒", "💼", "🎭", "🏋️", "🐕", "✈️"];
const MAX_CATEGORIES = 15;

// ─── Formatting ───
const fmt = (n: number): string =>
  new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);

const fmtPct = (n: number): string => `${Math.round(n)}%`;

// ─── Category type ───
interface ExpenseCategory {
  id: string;
  label: string;
  amount: number;
  icon: string;
  isDefault: boolean;
  isRemovable: boolean;
  placeholder?: string;
  color: string;
}

// ─── SVG Icons ───
const ArrowUpIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="19" x2="12" y2="5" />
    <polyline points="5 12 12 5 19 12" />
  </svg>
);

const ArrowDownIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <polyline points="19 12 12 19 5 12" />
  </svg>
);

const ArrowRight = ({ size = 12 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
    style={{ marginLeft: 4, flexShrink: 0 }}>
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

// ─── Custom Donut Active Shape ───
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
  return (
    <g>
      <Sector
        cx={cx} cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 6}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <text x={cx} y={cy - 8} textAnchor="middle" fill="#1B4F4A"
        style={{ fontFamily: "var(--font-dm-serif, 'DM Serif Display', Georgia, serif)", fontSize: 14, fontWeight: 700 }}>
        {payload.label}
      </text>
      <text x={cx} y={cy + 12} textAnchor="middle" fill="#6B7280"
        style={{ fontFamily: "var(--font-dm-sans, 'DM Sans', Helvetica, sans-serif)", fontSize: 12 }}>
        {fmt(value)} · {fmtPct(percent * 100)}
      </text>
    </g>
  );
};

// ─── Generate Tips ───
function generateTips(income: number, categories: ExpenseCategory[]): Tip[] {
  const tips: Tip[] = [];
  const totalExpenses = categories.reduce((s, c) => s + c.amount, 0);
  const surplus = income - totalExpenses;
  const rentCat = categories.find((c) => c.id === "rent");
  const rentAmt = rentCat ? rentCat.amount : 0;
  const hasAnyExpense = totalExpenses > 0;

  if (income <= 0) return tips;

  if (!hasAnyExpense) {
    tips.push({
      type: "info",
      id: "no-expenses",
      text: "Start by entering your rent and groceries — these are typically the two largest expenses for newcomers.",
    });
    return tips;
  }

  if (rentAmt > income * 0.5) {
    tips.push({
      type: "alert",
      id: "rent-50",
      text: `Your rent exceeds 50% of your income (${fmtPct((rentAmt / income) * 100)}), which puts significant strain on your budget. This is common for newcomers in expensive cities — look into rent subsidies and transitional housing programs.`,
    });
  } else if (rentAmt > income * 0.3) {
    tips.push({
      type: "warning",
      id: "rent-30",
      text: `Your rent is ${fmtPct((rentAmt / income) * 100)} of your income. The recommended guideline is under 30%. Consider shared housing, different neighborhoods, or provincial rent assistance programs.`,
    });
  }

  if (surplus < 0) {
    tips.push({
      type: "alert",
      id: "deficit",
      text: "You're currently spending more than you earn. Review your expenses to find areas to reduce, and check if you're eligible for benefits like the Canada Child Benefit (CCB) or GST/HST credit.",
      link: "/articles/canada-child-benefit-ccb-guide",
      linkText: "Learn about CCB",
    });
  }

  if (surplus > 0 && surplus > income * 0.2) {
    tips.push({
      type: "positive",
      id: "good-surplus",
      text: "Great job! You have meaningful room to save. Consider opening a TFSA to grow your savings tax-free.",
      link: "/calculators/tfsa-vs-rrsp",
      linkText: "Compare TFSA vs RRSP",
    });
  }

  if (surplus > 0 && surplus <= income * 0.1) {
    tips.push({
      type: "info",
      id: "save-more",
      text: "Even saving a small amount each month builds your emergency fund. Aim for at least 10% of your income.",
    });
  }

  return tips.slice(0, 3);
}

// ─── Main Component ───
export function BudgetCalculator() {
  const [income, setIncome] = useState(0);
  const [categories, setCategories] = useState<ExpenseCategory[]>(
    DEFAULT_CATEGORIES.map((c, i) => ({ ...c, color: CHART_COLORS[i] }))
  );
  const [isMobile, setIsMobile] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [visible, setVisible] = useState(false);
  const customCounter = useRef(0);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 150);
    return () => clearTimeout(t);
  }, []);

  // ─── Handlers ───
  const updateCategory = useCallback((id: string, field: string, value: string | number) => {
    setCategories((prev) => prev.map((c) => c.id === id ? { ...c, [field]: value } : c));
  }, []);

  const removeCategory = useCallback((id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const addCategory = useCallback(() => {
    if (categories.length >= MAX_CATEGORIES) return;
    const idx = customCounter.current++;
    const colorIdx = categories.length % CHART_COLORS.length;
    const iconIdx = idx % CUSTOM_ICONS.length;
    setCategories((prev) => [
      ...prev,
      {
        id: `custom-${idx}`,
        label: "",
        amount: 0,
        icon: CUSTOM_ICONS[iconIdx],
        isDefault: false,
        isRemovable: true,
        placeholder: "e.g., 100",
        color: CHART_COLORS[colorIdx],
      },
    ]);
  }, [categories.length]);

  // ─── Computed ───
  const totalExpenses = useMemo(() => categories.reduce((s, c) => s + c.amount, 0), [categories]);
  const surplus = useMemo(() => income - totalExpenses, [income, totalExpenses]);
  const savingsRate = useMemo(() => {
    if (income <= 0 || surplus <= 0) return 0;
    return (Math.min(surplus, income * 0.2) / income) * 100;
  }, [income, surplus]);
  const suggestedSavings = useMemo(() => {
    if (income <= 0 || surplus <= 0) return 0;
    return Math.min(surplus, income * 0.2);
  }, [income, surplus]);
  const tips = useMemo(() => generateTips(income, categories), [income, categories]);
  const chartData = useMemo(
    () =>
      categories
        .filter((c) => c.amount > 0)
        .map((c) => ({ label: c.label, value: c.amount, color: c.color, icon: c.icon })),
    [categories]
  );
  const hasResults = income > 0 || totalExpenses > 0;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#FAFBFC",
        fontFamily: "var(--font-dm-sans, 'DM Sans', Helvetica, sans-serif)",
      }}
    >
      {/* ─── Hero ─── */}
      <header
        style={{
          background: "linear-gradient(165deg, #0F3D3A 0%, #1B5E58 40%, #1B7A4A 100%)",
          padding: isMobile ? "40px 20px 36px" : "56px 24px 48px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0.04,
            backgroundImage: `radial-gradient(circle at 20% 50%, #fff 1px, transparent 1px), radial-gradient(circle at 80% 20%, #fff 1px, transparent 1px)`,
            backgroundSize: "60px 60px, 40px 40px",
          }}
        />
        <div
          style={{
            maxWidth: 680,
            margin: "0 auto",
            textAlign: "center",
            position: "relative",
            zIndex: 1,
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "rgba(255,255,255,0.12)",
              borderRadius: 20,
              padding: "6px 16px",
              marginBottom: 16,
              backdropFilter: "blur(8px)",
            }}
          >
            <span style={{ fontSize: 14 }}>🧮</span>
            <span
              style={{
                fontSize: 12,
                color: "rgba(255,255,255,0.85)",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: 1,
              }}
            >
              Financial Calculator
            </span>
          </div>
          <h1
            style={{
              fontFamily: "var(--font-dm-serif, 'DM Serif Display', Georgia, serif)",
              fontSize: isMobile ? 28 : 42,
              fontWeight: 700,
              color: "#fff",
              margin: "0 0 12px",
              lineHeight: 1.15,
              letterSpacing: -0.5,
            }}
          >
            Newcomer{" "}
            <span style={{ color: "#7DD3A8" }}>Budget Calculator</span>
          </h1>
          <p
            style={{
              fontSize: isMobile ? 15 : 17,
              lineHeight: 1.7,
              color: "rgba(255,255,255,0.75)",
              margin: "0 auto",
              maxWidth: 500,
            }}
          >
            Plan your first months in Canada with a budget tailored to newcomer expenses. See where your money goes and get actionable tips.
          </p>
        </div>
      </header>

      {/* ─── Calculator Section ─── */}
      <section
        style={{
          maxWidth: isMobile ? "100%" : 960,
          margin: "0 auto",
          padding: isMobile ? "24px 16px" : "48px 24px",
        }}
      >
        <div
          style={{
            display: isMobile ? "block" : "flex",
            gap: 24,
            alignItems: "flex-start",
          }}
        >
          {/* ═══ LEFT COLUMN: Inputs ═══ */}
          <div
            style={{
              flex: isMobile ? undefined : "0 0 55%",
              opacity: visible ? 1 : 0,
              transform: visible ? "translateY(0)" : "translateY(24px)",
              transition: "opacity 0.5s ease, transform 0.5s ease",
            }}
          >
            {/* Income Card */}
            <div
              style={{
                background: "#fff",
                borderRadius: 16,
                border: "1px solid #E5E7EB",
                padding: isMobile ? "22px 18px" : "28px 28px",
                marginBottom: 16,
                boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(27,122,74,0.04)",
              }}
            >
              <div
                style={{
                  fontFamily: "var(--font-dm-sans, 'DM Sans', Helvetica, sans-serif)",
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: 1.2,
                  color: "#9CA3AF",
                  marginBottom: 16,
                }}
              >
                Your Income
              </div>
              <label
                style={{
                  fontFamily: "var(--font-dm-sans, 'DM Sans', Helvetica, sans-serif)",
                  fontSize: 14,
                  fontWeight: 600,
                  color: "#374151",
                  display: "block",
                  marginBottom: 6,
                }}
              >
                Monthly Take-Home Income
              </label>
              <CurrencyInput
                value={income}
                onChange={setIncome}
                placeholder="e.g., 4,000"
                ariaLabel="Monthly take-home income in Canadian dollars"
                style={{ width: "100%" }}
              />
              <p
                style={{
                  fontFamily: "var(--font-dm-sans, 'DM Sans', Helvetica, sans-serif)",
                  fontSize: 12,
                  color: "#9CA3AF",
                  margin: "8px 0 0",
                  lineHeight: 1.4,
                }}
              >
                Enter your income after taxes and deductions
              </p>
            </div>

            {/* Expenses Card */}
            <div
              style={{
                background: "#fff",
                borderRadius: 16,
                border: "1px solid #E5E7EB",
                padding: isMobile ? "22px 18px" : "28px 28px",
                marginBottom: isMobile ? 20 : 0,
                boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(27,122,74,0.04)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 12,
                }}
              >
                <div
                  style={{
                    fontFamily: "var(--font-dm-sans, 'DM Sans', Helvetica, sans-serif)",
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: 1.2,
                    color: "#9CA3AF",
                  }}
                >
                  Monthly Expenses
                </div>
                <span
                  style={{
                    fontFamily: "var(--font-dm-sans, 'DM Sans', Helvetica, sans-serif)",
                    fontSize: 12,
                    color: "#9CA3AF",
                  }}
                >
                  {categories.length} / {MAX_CATEGORIES}
                </span>
              </div>

              {categories.map((cat, i) => (
                <ExpenseRow
                  key={cat.id}
                  cat={cat}
                  index={i}
                  onUpdate={updateCategory}
                  onRemove={removeCategory}
                  isMobile={isMobile}
                />
              ))}

              <AddCategoryButton
                onAdd={addCategory}
                disabled={categories.length >= MAX_CATEGORIES}
                isMobile={isMobile}
              />
            </div>
          </div>

          {/* ═══ RIGHT COLUMN: Results ═══ */}
          <div
            style={{
              flex: isMobile ? undefined : "0 0 calc(45% - 24px)",
              position: isMobile ? "static" : "sticky",
              top: isMobile ? undefined : 88,
              opacity: visible ? 1 : 0,
              transform: visible ? "translateY(0)" : "translateY(24px)",
              transition: "opacity 0.5s ease 0.15s, transform 0.5s ease 0.15s",
            }}
          >
            {/* Budget Summary Card */}
            <div
              style={{
                background: "#fff",
                borderRadius: 16,
                border: "1px solid #E5E7EB",
                padding: isMobile ? "22px 18px" : "28px 28px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(27,122,74,0.04)",
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  fontFamily: "var(--font-dm-sans, 'DM Sans', Helvetica, sans-serif)",
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: 1.2,
                  color: "#9CA3AF",
                  marginBottom: 16,
                }}
              >
                Budget Summary
              </div>

              {!hasResults ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "40px 16px",
                    color: "#9CA3AF",
                  }}
                >
                  <div style={{ fontSize: 36, marginBottom: 12, opacity: 0.5 }}>📊</div>
                  <p
                    style={{
                      fontFamily: "var(--font-dm-sans, 'DM Sans', Helvetica, sans-serif)",
                      fontSize: 14,
                      lineHeight: 1.6,
                      margin: 0,
                    }}
                  >
                    Enter your income and expenses to see your budget breakdown.
                  </p>
                </div>
              ) : (
                <>
                  {/* Summary Metrics */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 0,
                      marginBottom: 20,
                      borderBottom: "1px solid #F3F4F6",
                      paddingBottom: 12,
                    }}
                  >
                    <SummaryMetric
                      label={surplus >= 0 ? "Monthly Surplus" : "Monthly Deficit"}
                      value={fmt(Math.abs(surplus))}
                      color={surplus >= 0 ? "#1B7A4A" : "#C41E3A"}
                      icon={surplus >= 0 ? <ArrowUpIcon /> : <ArrowDownIcon />}
                      isMobile={isMobile}
                    />
                    <SummaryMetric
                      label="Total Expenses"
                      value={fmt(totalExpenses)}
                      color="#1B4F4A"
                      isMobile={isMobile}
                    />
                    {surplus > 0 && (
                      <SummaryMetric
                        label="Suggested Savings"
                        value={fmt(suggestedSavings)}
                        color="#2563EB"
                        subtext={`${fmtPct(savingsRate)} of income`}
                        isMobile={isMobile}
                      />
                    )}
                  </div>

                  {/* Donut Chart */}
                  {chartData.length > 0 && (
                    <div>
                      <div
                        style={{ width: "100%", minWidth: 240, height: 220 }}
                        aria-label={`Expense breakdown: ${chartData.map((d) => `${d.label} ${fmtPct((d.value / totalExpenses) * 100)}`).join(", ")}`}
                        role="img"
                      >
                        <ResponsiveContainer>
                          <PieChart>
                            <Pie
                              data={chartData}
                              dataKey="value"
                              nameKey="label"
                              cx="50%"
                              cy="50%"
                              innerRadius={isMobile ? 55 : 60}
                              outerRadius={isMobile ? 85 : 95}
                              paddingAngle={2}
                              activeShape={renderActiveShape}
                              onMouseEnter={(_data, i) => setActiveIndex(i)}
                              onMouseLeave={() => setActiveIndex(-1)}
                              animationBegin={0}
                              animationDuration={600}
                              animationEasing="ease-out"
                            >
                              {chartData.map((entry, i) => (
                                <Cell key={i} fill={entry.color} stroke="#fff" strokeWidth={2} />
                              ))}
                            </Pie>
                            {activeIndex === -1 && (
                              <text
                                x="50%"
                                y="46%"
                                textAnchor="middle"
                                fill="#1B4F4A"
                                style={{
                                  fontFamily: "var(--font-dm-serif, 'DM Serif Display', Georgia, serif)",
                                  fontSize: 18,
                                  fontWeight: 700,
                                }}
                              >
                                {fmt(totalExpenses)}
                              </text>
                            )}
                            {activeIndex === -1 && (
                              <text
                                x="50%"
                                y="56%"
                                textAnchor="middle"
                                fill="#9CA3AF"
                                style={{
                                  fontFamily: "var(--font-dm-sans, 'DM Sans', Helvetica, sans-serif)",
                                  fontSize: 11,
                                }}
                              >
                                total / month
                              </text>
                            )}
                          </PieChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Legend */}
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "6px 16px",
                          justifyContent: "center",
                          marginTop: 8,
                        }}
                      >
                        {chartData.map((d, i) => (
                          <div
                            key={i}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                              fontFamily: "var(--font-dm-sans, 'DM Sans', Helvetica, sans-serif)",
                              fontSize: 12,
                              color: "#6B7280",
                            }}
                          >
                            <div
                              style={{
                                width: 8,
                                height: 8,
                                borderRadius: "50%",
                                background: d.color,
                                flexShrink: 0,
                              }}
                            />
                            <span
                              style={{
                                maxWidth: 100,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {d.label}
                            </span>
                            <span style={{ fontWeight: 600, color: "#374151" }}>
                              {fmt(d.value)}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Accessible hidden table */}
                      <table
                        style={{
                          position: "absolute",
                          width: 1,
                          height: 1,
                          overflow: "hidden",
                          clip: "rect(0,0,0,0)",
                          whiteSpace: "nowrap",
                          border: 0,
                        }}
                        aria-label="Expense breakdown data"
                      >
                        <thead>
                          <tr>
                            <th>Category</th>
                            <th>Amount</th>
                            <th>Percentage</th>
                          </tr>
                        </thead>
                        <tbody>
                          {chartData.map((d, i) => (
                            <tr key={i}>
                              <td>{d.label}</td>
                              <td>{fmt(d.value)}</td>
                              <td>{fmtPct((d.value / totalExpenses) * 100)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Tips */}
            {tips.length > 0 && (
              <div aria-live="polite">
                <div
                  style={{
                    fontFamily: "var(--font-dm-sans, 'DM Sans', Helvetica, sans-serif)",
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: 1.2,
                    color: "#9CA3AF",
                    marginBottom: 10,
                    paddingLeft: 4,
                  }}
                >
                  Tips for You
                </div>
                {tips.map((tip) => (
                  <TipCard key={tip.id} tip={tip} isMobile={isMobile} />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ─── Related Tools CTA ─── */}
      <section
        style={{
          maxWidth: 700,
          margin: "0 auto",
          padding: isMobile ? "0 16px 40px" : "0 24px 56px",
        }}
      >
        <div
          style={{
            background: "#fff",
            borderRadius: 16,
            border: "1px solid #E5E7EB",
            borderLeft: "4px solid #2563EB",
            padding: isMobile ? "24px 20px" : "28px 32px",
            display: "flex",
            alignItems: isMobile ? "flex-start" : "center",
            gap: isMobile ? 14 : 20,
            flexDirection: isMobile ? "column" : "row",
            boxShadow: "0 1px 4px rgba(0,0,0,0.03)",
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              background: "#EFF6FF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 22,
              flexShrink: 0,
            }}
          >
            📊
          </div>
          <div style={{ flex: 1 }}>
            <h3
              style={{
                fontFamily: "var(--font-dm-serif, 'DM Serif Display', Georgia, serif)",
                fontSize: 17,
                color: "#1B4F4A",
                margin: "0 0 4px",
                fontWeight: 700,
              }}
            >
              Explore More Calculators
            </h3>
            <p style={{ fontSize: 14, color: "#6B7280", margin: 0, lineHeight: 1.5 }}>
              Compare TFSA vs RRSP, estimate your taxes, or plan for your first home with our other tools.
            </p>
          </div>
          <a
            href="/calculators/tfsa-vs-rrsp"
            style={{
              background: "#2563EB",
              color: "#fff",
              textDecoration: "none",
              fontWeight: 700,
              fontSize: 14,
              padding: "10px 22px",
              borderRadius: 10,
              whiteSpace: "nowrap",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              transition: "background 0.2s",
              flexShrink: 0,
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.background = "#1D4ED8")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.background = "#2563EB")}
          >
            TFSA vs RRSP
            <ArrowRight />
          </a>
        </div>
      </section>

      {/* ─── Newsletter ─── */}
      <NewsletterInline />
    </div>
  );
}
