"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import {
  FEDERAL_BRACKETS_2026,
  PROVINCIAL_BRACKETS_2026,
  PROVINCES_LIST,
  getMarginalRate,
  calcCombinedMarginal,
  runComparison,
  fmt,
  pctFmt,
} from "@/lib/taxData2026";
import { SliderInput } from "@/components/tfsa-rrsp/SliderInput";
import { ComparisonCard } from "@/components/tfsa-rrsp/ComparisonCard";
import { GrowthChart } from "@/components/tfsa-rrsp/GrowthChart";
import { YearByYearTable } from "@/components/tfsa-rrsp/YearByYearTable";
import { NewsletterInline } from "@/components/start-here/NewsletterInline";

const PROVINCE_STORAGE_KEY = "mi_province_v1";

export function TfsaVsRrspCalculator() {
  const [isMobile, setIsMobile] = useState(false);
  const [income, setIncome] = useState(60000);
  const [province, setProvince] = useState("ON");
  const [contribution, setContribution] = useState(5000);
  const [horizon, setHorizon] = useState(20);
  const [returnRate, setReturnRate] = useState(6);
  const [retirementRate, setRetirementRate] = useState(30);
  const [overrideRate, setOverrideRate] = useState(false);
  const [manualRate, setManualRate] = useState(30);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [resultsVisible, setResultsVisible] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Mobile detection
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Results fade-in
  useEffect(() => {
    const timer = setTimeout(() => setResultsVisible(true), 300);
    return () => clearTimeout(timer);
  }, []);

  // Load province preference from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(PROVINCE_STORAGE_KEY);
      if (stored && PROVINCIAL_BRACKETS_2026[stored]) {
        setProvince(stored);
      }
    } catch {
      // localStorage unavailable
    }
  }, []);

  // Save province preference on change
  function handleProvinceChange(code: string) {
    setProvince(code);
    try {
      localStorage.setItem(PROVINCE_STORAGE_KEY, code);
    } catch {
      // localStorage unavailable
    }
  }

  // Base results (auto-calculated marginal rate)
  const results = useMemo(
    () =>
      runComparison(income, province, contribution, horizon, returnRate / 100, retirementRate / 100),
    [income, province, contribution, horizon, returnRate, retirementRate]
  );

  // Recalculated results (override if manual rate is active)
  const r = useMemo(() => {
    if (!overrideRate) return results;
    const mr = manualRate / 100;
    const rrspRefund = contribution * mr;
    const rrspInvested = contribution + rrspRefund;
    const rrspFV = rrspInvested * Math.pow(1 + returnRate / 100, horizon);
    const rrspTax = rrspFV * (retirementRate / 100);
    const rrspAfterTax = rrspFV - rrspTax;
    const tfsaFV = contribution * Math.pow(1 + returnRate / 100, horizon);
    const tfsaAfterTax = tfsaFV;
    const rawDiff = tfsaAfterTax - rrspAfterTax;
    const winner = Math.abs(rawDiff) < 1 ? "tie" : rawDiff > 0 ? "TFSA" : "RRSP";
    const chartData = [];
    for (let y = 0; y <= horizon; y++) {
      const rFV = rrspInvested * Math.pow(1 + returnRate / 100, y);
      const rAfter = rFV * (1 - retirementRate / 100);
      const tFV = contribution * Math.pow(1 + returnRate / 100, y);
      chartData.push({
        year: y,
        rrspGross: Math.round(rFV),
        rrspAfterTax: Math.round(rAfter),
        tfsaValue: Math.round(tFV),
      });
    }
    return {
      marginalRate: mr,
      rrspRefund,
      rrspInvested,
      rrspFV,
      rrspTax,
      rrspAfterTax,
      tfsaFV,
      tfsaAfterTax,
      difference: Math.abs(rawDiff),
      winner: winner as "TFSA" | "RRSP" | "tie",
      chartData,
    };
  }, [overrideRate, manualRate, contribution, horizon, returnRate, retirementRate, results]);

  const provinceName = PROVINCIAL_BRACKETS_2026[province]?.name ?? province;
  const fedMarginal = getMarginalRate(income, FEDERAL_BRACKETS_2026);
  const provMarginal = PROVINCIAL_BRACKETS_2026[province]
    ? getMarginalRate(income, PROVINCIAL_BRACKETS_2026[province].brackets)
    : 0;

  // Recommendation banner colors
  const bannerBg =
    r.winner === "TFSA" ? "#EFF6FF" : r.winner === "RRSP" ? "#FDF6E3" : "#F3F4F6";
  const bannerBorder =
    r.winner === "TFSA" ? "#2563EB22" : r.winner === "RRSP" ? "#B8860B22" : "#E5E7EB";
  const winnerColor = r.winner === "TFSA" ? "#2563EB" : "#B8860B";

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
          padding: isMobile ? "36px 20px 32px" : "52px 24px 44px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Pattern overlay */}
        <div
          aria-hidden="true"
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
            maxWidth: 720,
            margin: "0 auto",
            textAlign: "center",
            position: "relative",
            zIndex: 1,
          }}
        >
          {/* Badge */}
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
            <span style={{ fontSize: 14 }} aria-hidden="true">📊</span>
            <span
              style={{
                fontSize: 12,
                color: "rgba(255,255,255,0.85)",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: 1,
                fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)",
              }}
            >
              Calculator
            </span>
          </div>

          <h1
            style={{
              fontFamily: "var(--font-dm-serif, 'DM Serif Display', Georgia, serif)",
              fontSize: isMobile ? 28 : 42,
              fontWeight: 700,
              color: "#fff",
              margin: "0 0 10px",
              lineHeight: 1.15,
              letterSpacing: -0.5,
            }}
          >
            TFSA vs RRSP{" "}
            <span style={{ color: "#7DD3A8" }}>Comparison</span>
          </h1>

          <p
            style={{
              fontSize: isMobile ? 15 : 17,
              lineHeight: 1.65,
              color: "rgba(255,255,255,0.75)",
              margin: "0 auto",
              maxWidth: 500,
              fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)",
            }}
          >
            Compare side-by-side to find which account gives you more after-tax value,
            based on your income and province.
          </p>
        </div>
      </header>

      {/* ─── Calculator Section ─── */}
      <section
        style={{
          maxWidth: isMobile ? "100%" : 820,
          margin: "0 auto",
          padding: isMobile ? "24px 16px" : "44px 24px",
        }}
      >
        {/* ─── Input Card ─── */}
        <div
          style={{
            background: "#fff",
            borderRadius: 16,
            border: "1px solid #E5E7EB",
            padding: isMobile ? "24px 18px" : "32px 36px",
            marginBottom: 24,
            boxShadow: "0 1px 4px rgba(0,0,0,0.03)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "#E8F5EE",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
                border: "1px solid #1B7A4A22",
              }}
              aria-hidden="true"
            >
              ⚙️
            </div>
            <h2
              style={{
                fontFamily: "var(--font-dm-serif, 'DM Serif Display', Georgia, serif)",
                fontSize: 20,
                color: "#1B4F4A",
                margin: 0,
                fontWeight: 700,
              }}
            >
              Your Inputs
            </h2>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
              gap: isMobile ? "0" : "0 32px",
            }}
          >
            {/* Income */}
            <SliderInput
              label="Annual Income"
              value={income}
              onChange={setIncome}
              min={0}
              max={300000}
              step={1000}
              format={fmt}
              isMobile={isMobile}
              helpText="Your gross employment income before deductions"
            />

            {/* Province */}
            <div style={{ marginBottom: isMobile ? 20 : 24 }}>
              <label
                htmlFor="province-select"
                style={{
                  fontFamily: "var(--font-dm-sans, 'DM Sans', Helvetica, sans-serif)",
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#374151",
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                  display: "block",
                  marginBottom: 8,
                }}
              >
                Province / Territory
              </label>
              <select
                id="province-select"
                value={province}
                onChange={(e) => handleProvinceChange(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  borderRadius: 10,
                  border: "1px solid #D1D5DB",
                  fontSize: 15,
                  fontFamily: "var(--font-dm-sans, 'DM Sans', Helvetica, sans-serif)",
                  background: "#fff",
                  color: "#1B4F4A",
                  fontWeight: 600,
                  appearance: "none",
                  cursor: "pointer",
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L6 6L11 1' stroke='%239CA3AF' stroke-width='2' stroke-linecap='round'/%3E%3C/svg%3E")`,
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 16px center",
                }}
              >
                {PROVINCES_LIST.map((p) => (
                  <option key={p.code} value={p.code}>
                    {p.name}
                  </option>
                ))}
              </select>
              <div
                style={{
                  fontSize: 11,
                  color: "#9CA3AF",
                  marginTop: 4,
                  fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)",
                }}
              >
                Used to calculate your combined marginal tax rate
              </div>
            </div>

            {/* Marginal Rate */}
            <div style={{ marginBottom: isMobile ? 20 : 24 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 8,
                }}
              >
                <label
                  style={{
                    fontFamily: "var(--font-dm-sans, 'DM Sans', Helvetica, sans-serif)",
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#374151",
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}
                >
                  Marginal Tax Rate
                </label>
                <button
                  onClick={() => {
                    if (!overrideRate) {
                      setManualRate(Math.round(results.marginalRate * 100));
                    }
                    setOverrideRate(!overrideRate);
                  }}
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: "#2563EB",
                    background: "#EFF6FF",
                    border: "1px solid #2563EB22",
                    borderRadius: 6,
                    padding: "3px 10px",
                    cursor: "pointer",
                    fontFamily: "var(--font-dm-sans, 'DM Sans', Helvetica, sans-serif)",
                  }}
                >
                  {overrideRate ? "Auto-calculate" : "Override"}
                </button>
              </div>

              {overrideRate ? (
                <input
                  type="number"
                  value={manualRate}
                  onChange={(e) =>
                    setManualRate(Math.min(60, Math.max(0, parseFloat(e.target.value) || 0)))
                  }
                  inputMode="decimal"
                  aria-label="Manual marginal tax rate (percent)"
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    borderRadius: 10,
                    border: "1px solid #D1D5DB",
                    fontSize: 15,
                    fontFamily: "var(--font-dm-sans, 'DM Sans', Helvetica, sans-serif)",
                    color: "#1B4F4A",
                    fontWeight: 600,
                    boxSizing: "border-box",
                  }}
                />
              ) : (
                <div
                  aria-live="polite"
                  style={{
                    padding: "12px 16px",
                    borderRadius: 10,
                    background: "#F9FAFB",
                    border: "1px solid #E5E7EB",
                    fontFamily: "var(--font-dm-serif, 'DM Serif Display', Georgia, serif)",
                    fontSize: 20,
                    color: "#1B4F4A",
                    fontWeight: 700,
                  }}
                >
                  {pctFmt(results.marginalRate)}
                  <span
                    style={{
                      fontSize: 12,
                      color: "#9CA3AF",
                      fontWeight: 400,
                      marginLeft: 8,
                      fontFamily: "var(--font-dm-sans, 'DM Sans', Helvetica, sans-serif)",
                    }}
                  >
                    (federal {pctFmt(fedMarginal)} + provincial {pctFmt(provMarginal)})
                  </span>
                </div>
              )}
            </div>

            {/* Contribution */}
            <SliderInput
              label="Contribution Amount"
              value={contribution}
              onChange={setContribution}
              min={100}
              max={33810}
              step={100}
              format={fmt}
              isMobile={isMobile}
              helpText="2026 RRSP max: $33,810 · TFSA annual limit: $7,000"
            />

            {/* Horizon */}
            <SliderInput
              label="Investment Horizon"
              value={horizon}
              onChange={setHorizon}
              min={1}
              max={50}
              step={1}
              suffix=" years"
              isMobile={isMobile}
              helpText="How long until you plan to withdraw"
              color="#2563EB"
            />

            {/* Return Rate */}
            <SliderInput
              label="Expected Return"
              value={returnRate}
              onChange={setReturnRate}
              min={0}
              max={15}
              step={0.5}
              suffix="%"
              isMobile={isMobile}
              helpText="Historical average: ~6–7% for balanced portfolio"
              color="#2563EB"
            />

            {/* Retirement Tax Rate */}
            <SliderInput
              label="Retirement Tax Rate"
              value={retirementRate}
              onChange={setRetirementRate}
              min={0}
              max={60}
              step={1}
              suffix="%"
              isMobile={isMobile}
              helpText="The rate you expect when withdrawing RRSP funds"
              color="#B8860B"
            />
          </div>
        </div>

        {/* ─── Results ─── */}
        <div
          ref={resultsRef}
          style={{
            opacity: resultsVisible ? 1 : 0,
            transform: resultsVisible ? "translateY(0)" : "translateY(20px)",
            transition: "opacity 0.6s ease, transform 0.6s ease",
          }}
        >
          {/* ─── Recommendation Banner ─── */}
          <div
            role="status"
            aria-live="polite"
            style={{
              background: bannerBg,
              borderRadius: 16,
              padding: isMobile ? "24px 20px" : "28px 36px",
              marginBottom: 20,
              border: `1px solid ${bannerBorder}`,
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: 14,
                color: "#6B7280",
                marginBottom: 6,
                fontWeight: 500,
                fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)",
              }}
            >
              Based on your inputs
            </div>

            {r.winner === "tie" ? (
              <div
                style={{
                  fontFamily: "var(--font-dm-serif, 'DM Serif Display', Georgia, serif)",
                  fontSize: isMobile ? 22 : 28,
                  color: "#1B4F4A",
                  fontWeight: 700,
                  lineHeight: 1.3,
                }}
              >
                Both accounts perform similarly
              </div>
            ) : (
              <>
                <div
                  style={{
                    fontFamily: "var(--font-dm-serif, 'DM Serif Display', Georgia, serif)",
                    fontSize: isMobile ? 22 : 28,
                    color: "#1B4F4A",
                    fontWeight: 700,
                    lineHeight: 1.3,
                  }}
                >
                  The{" "}
                  <span style={{ color: winnerColor }}>{r.winner}</span>
                  {" "}gives you{" "}
                  <span style={{ color: winnerColor }}>{fmt(r.difference)}</span>
                  {" "}more at withdrawal
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: "#9CA3AF",
                    marginTop: 6,
                    fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)",
                  }}
                >
                  After {horizon} years · {returnRate}% annual return · {provinceName}
                </div>
              </>
            )}

            <div
              style={{
                fontSize: 11,
                color: "#9CA3AF",
                marginTop: 10,
                fontStyle: "italic",
                fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)",
              }}
            >
              This is a simplified comparison. Your situation may differ.
            </div>
          </div>

          {/* ─── Side-by-Side Cards ─── */}
          <div
            style={{
              display: "flex",
              gap: 16,
              flexDirection: isMobile ? "column" : "row",
              marginBottom: 24,
            }}
          >
            <ComparisonCard
              title="TFSA"
              icon="🛡️"
              color="#2563EB"
              lightColor="#EFF6FF"
              isWinner={r.winner === "TFSA"}
              isMobile={isMobile}
              metrics={[
                { label: "Your Contribution", value: fmt(contribution) },
                { label: "Tax Refund", value: "N/A" },
                { label: "Total Invested", value: fmt(contribution) },
                { label: "Future Value", value: fmt(r.tfsaFV) },
                { label: "Tax on Withdrawal", value: "$0" },
                { label: "After-Tax Value", value: fmt(r.tfsaAfterTax), highlight: true },
              ]}
            />
            <ComparisonCard
              title="RRSP"
              icon="📋"
              color="#B8860B"
              lightColor="#FDF6E3"
              isWinner={r.winner === "RRSP"}
              isMobile={isMobile}
              metrics={[
                { label: "Your Contribution", value: fmt(contribution) },
                { label: "Tax Refund", value: "+" + fmt(r.rrspRefund) },
                { label: "Total Invested", value: fmt(r.rrspInvested) },
                { label: "Future Value", value: fmt(r.rrspFV) },
                { label: "Tax on Withdrawal", value: "-" + fmt(r.rrspTax) },
                { label: "After-Tax Value", value: fmt(r.rrspAfterTax), highlight: true },
              ]}
            />
          </div>

          {/* ─── Growth Chart ─── */}
          <GrowthChart chartData={r.chartData} horizon={horizon} isMobile={isMobile} />

          {/* ─── Year-by-Year Breakdown ─── */}
          <YearByYearTable
            chartData={r.chartData}
            horizon={horizon}
            isOpen={showBreakdown}
            onToggle={() => setShowBreakdown(!showBreakdown)}
          />

          {/* ─── Educational Section ─── */}
          <div
            style={{
              background: "#fff",
              borderRadius: 16,
              border: "1px solid #E5E7EB",
              padding: isMobile ? "24px 18px" : "28px 32px",
              marginBottom: 24,
              boxShadow: "0 1px 4px rgba(0,0,0,0.03)",
            }}
          >
            <h3
              style={{
                fontFamily: "var(--font-dm-serif, 'DM Serif Display', Georgia, serif)",
                fontSize: 18,
                color: "#1B4F4A",
                margin: "0 0 16px",
                fontWeight: 700,
              }}
            >
              TFSA vs RRSP — Quick Guide
            </h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                gap: 16,
              }}
            >
              {/* TFSA box */}
              <div
                style={{
                  background: "#EFF6FF",
                  borderRadius: 12,
                  padding: "18px 20px",
                  border: "1px solid #2563EB18",
                }}
              >
                <div
                  style={{
                    fontFamily: "var(--font-dm-serif, 'DM Serif Display', Georgia, serif)",
                    fontSize: 16,
                    color: "#2563EB",
                    fontWeight: 700,
                    marginBottom: 8,
                  }}
                >
                  🛡️ TFSA
                </div>
                <p
                  style={{
                    fontSize: 13,
                    color: "#374151",
                    lineHeight: 1.6,
                    margin: "0 0 10px",
                    fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)",
                  }}
                >
                  Contribute with after-tax dollars. Investments grow tax-free, and
                  withdrawals are completely tax-free.
                </p>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#2563EB",
                    marginBottom: 4,
                    fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)",
                  }}
                >
                  Better when:
                </div>
                <ul
                  style={{
                    margin: 0,
                    paddingLeft: 16,
                    fontSize: 12,
                    color: "#4B5563",
                    lineHeight: 1.8,
                    fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)",
                  }}
                >
                  <li>You expect a higher tax rate in retirement</li>
                  <li>You have a lower current income</li>
                  <li>You want flexible, tax-free withdrawals</li>
                </ul>
                <Link
                  href="/articles/tfsa-explained-for-newcomers"
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#2563EB",
                    textDecoration: "none",
                    display: "inline-flex",
                    alignItems: "center",
                    marginTop: 10,
                    fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)",
                  }}
                >
                  TFSA Explained for Newcomers
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ marginLeft: 4 }}><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
                </Link>
              </div>

              {/* RRSP box */}
              <div
                style={{
                  background: "#FDF6E3",
                  borderRadius: 12,
                  padding: "18px 20px",
                  border: "1px solid #B8860B18",
                }}
              >
                <div
                  style={{
                    fontFamily: "var(--font-dm-serif, 'DM Serif Display', Georgia, serif)",
                    fontSize: 16,
                    color: "#B8860B",
                    fontWeight: 700,
                    marginBottom: 8,
                  }}
                >
                  📋 RRSP
                </div>
                <p
                  style={{
                    fontSize: 13,
                    color: "#374151",
                    lineHeight: 1.6,
                    margin: "0 0 10px",
                    fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)",
                  }}
                >
                  Contributions are tax-deductible. Investments grow tax-deferred, but
                  withdrawals are taxed as income.
                </p>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#B8860B",
                    marginBottom: 4,
                    fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)",
                  }}
                >
                  Better when:
                </div>
                <ul
                  style={{
                    margin: 0,
                    paddingLeft: 16,
                    fontSize: 12,
                    color: "#4B5563",
                    lineHeight: 1.8,
                    fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)",
                  }}
                >
                  <li>You expect a lower tax rate in retirement</li>
                  <li>You have a higher current income</li>
                  <li>You want an immediate tax refund</li>
                </ul>
                <Link
                  href="/articles/rrsp-basics-for-newcomers"
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#B8860B",
                    textDecoration: "none",
                    display: "inline-flex",
                    alignItems: "center",
                    marginTop: 10,
                    fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)",
                  }}
                >
                  RRSP Explained for Newcomers
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ marginLeft: 4 }}><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
                </Link>
              </div>
            </div>

            <Link
              href="/articles"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                marginTop: 16,
                fontSize: 13,
                fontWeight: 600,
                color: "#1B7A4A",
                textDecoration: "none",
                fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)",
              }}
            >
              View full glossary of Canadian financial terms
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ marginLeft: 2 }}><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
            </Link>
          </div>

          {/* ─── Related Content CTA ─── */}
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
              marginBottom: 24,
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
              aria-hidden="true"
            >
              🏠
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
                Saving for a Home?
              </h3>
              <p
                style={{
                  fontSize: 14,
                  color: "#6B7280",
                  margin: 0,
                  lineHeight: 1.5,
                  fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)",
                }}
              >
                Check out the mortgage comparison tool — and explore how a First Home
                Savings Account (FHSA) combines the best of TFSA and RRSP for
                first-time homebuyers.
              </p>
            </div>
            <Link
              href="/tools/mortgage-comparison"
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
                flexShrink: 0,
                fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)",
              }}
            >
              Mortgage Calculator
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
            </Link>
          </div>

          {/* ─── Disclaimers ─── */}
          <div
            style={{
              background: "#F9FAFB",
              borderRadius: 12,
              padding: "16px 20px",
              marginBottom: 24,
              border: "1px solid #E5E7EB",
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "#9CA3AF",
                textTransform: "uppercase",
                letterSpacing: 0.8,
                marginBottom: 8,
                fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)",
              }}
            >
              Important Disclaimer
            </div>
            <p
              style={{
                fontSize: 12,
                color: "#6B7280",
                lineHeight: 1.7,
                margin: 0,
                fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)",
              }}
            >
              This calculator provides estimates for educational purposes only and is not
              financial advice. Tax rates are based on 2026 CRA published brackets and may
              not reflect your complete tax situation. The comparison assumes the RRSP
              refund is reinvested, uses a constant rate of return, and does not account
              for employer matching, pension adjustments, or other deductions. Consult a
              qualified financial advisor for personalized guidance. Tax bracket data
              sourced from the Canada Revenue Agency, effective January 1, 2026.
            </p>
          </div>
        </div>
      </section>

      {/* ─── Newsletter ─── */}
      <NewsletterInline />
    </div>
  );
}
