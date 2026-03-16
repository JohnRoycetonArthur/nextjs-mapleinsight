'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { REPORT_KEY, dispatchReportChange } from '@/hooks/useSimulatorReport';
import { trackEvent } from '@/lib/analytics';

// Engine imports
import { estimateSalary }       from '@/lib/simulator/engines/salaryEngine';
import { calculateNetIncome }   from '@/lib/simulator/engines/taxEngine';
import { estimateCostOfLiving } from '@/lib/simulator/engines/colEngine';
import { generateRoadmap }      from '@/lib/simulator/engines/roadmapEngine';
import { calculateCCB }         from '@/lib/simulator/engines/ccbEngine';

// Type imports
import type { WizardState }                               from '@/components/simulator/wizardTypes';
import type { WageFact, SalaryEstimate }                  from '@/lib/simulator/engines/salaryTypes';
import type { TaxBracketsData, PayrollParamsData, NetIncomeResult } from '@/lib/simulator/engines/taxTypes';
import type { MBMThresholdEntry, RentBenchmarkEntry, CostEstimate, LifestyleTier } from '@/lib/simulator/engines/colTypes';
import type { TaskDefinition, RoadmapRule, ContentItem, RoadmapOutput, RoadmapInput, RoadmapResult } from '@/lib/simulator/engines/roadmapTypes';
import type { CCBParams, CCBEstimate } from '@/lib/simulator/engines/ccbTypes';

// Panel components
import { IncomePanel }        from './IncomePanel';
import { NetIncomePanel }     from './NetIncomePanel';
import { AffordabilityPanel } from './AffordabilityPanel';
import { RoadmapPanel }       from './RoadmapPanel';
import { StartOverDialog }    from './StartOverDialog';

// ── Mappings ──────────────────────────────────────────────────────────────────

const BEDROOM_MAP: Record<string, number> = {
  studio: 0, '1br': 1, '2br': 2, '3br': 3,
};

const STAGE_MAP: Record<string, RoadmapInput['migration_stage']> = {
  planning:         'planning_to_move',
  recently_arrived: 'recently_arrived',
  settled:          'established',
};

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  wageFacts:         WageFact[];
  taxBracketsData:   TaxBracketsData;
  payrollParamsData: PayrollParamsData;
  mbmData:           MBMThresholdEntry[];
  rentData:          RentBenchmarkEntry[];
  taskDefs:          TaskDefinition[];
  rules:             RoadmapRule[];
  contentItems:      ContentItem[];
  ccbParams:         CCBParams;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function SimulatorResultsClient(props: Props) {
  const router    = useRouter();
  const [wizard,        setWizard]        = useState<WizardState | null>(null);
  const [loading,       setLoading]       = useState(true);
  const [lifestyle,     setLifestyle]     = useState<LifestyleTier>('moderate');
  const [isMobile,      setIsMobile]      = useState(false);
  const [showStartOver, setShowStartOver] = useState(false);

  // Responsive detection
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Read session data — fall back to localStorage report, redirect if neither present
  useEffect(() => {
    try {
      let raw = sessionStorage.getItem('maple-simulator-input-v1');

      // If sessionStorage is empty (e.g. new browser session), try restoring from localStorage
      if (!raw) {
        const saved = localStorage.getItem(REPORT_KEY);
        if (saved) {
          const report = JSON.parse(saved) as { inputs?: WizardState };
          if (report.inputs) {
            sessionStorage.setItem('maple-simulator-input-v1', JSON.stringify(report.inputs));
            raw = JSON.stringify(report.inputs);
          }
        }
      }

      if (!raw) { router.replace('/simulator'); return; }

      const parsed = JSON.parse(raw) as WizardState;
      if (!parsed.stage || !parsed.city || !parsed.work.occupation) {
        router.replace('/simulator');
        return;
      }
      setWizard(parsed);
    } catch {
      router.replace('/simulator');
    } finally {
      setLoading(false);
    }
  }, [router]);

  // Persist wizard inputs to localStorage so the nav report indicator activates
  useEffect(() => {
    if (!wizard) return;
    try {
      localStorage.setItem(REPORT_KEY, JSON.stringify({
        id:        `report-${Date.now()}`,
        createdAt: new Date().toISOString(),
        inputs:    wizard,
      }));
      dispatchReportChange();
    } catch { /* ignore */ }
    trackEvent('simulator_results_view', {
      province:    wizard.city?.province_code ?? null,
      stage:       wizard.stage,
      noc_code:    wizard.work.occupation?.noc_code ?? null,
      family_size: wizard.household.adults + wizard.household.children,
    });
  }, [wizard]);

  // ── Engine: Salary (static) ────────────────────────────────────────────────

  const salaryResult = useMemo<SalaryEstimate | null>(() => {
    if (!wizard?.city || !wizard.work.occupation) return null;
    return estimateSalary(
      {
        noc_code:         wizard.work.occupation.noc_code,
        city_id:          wizard.city.city_id,
        province_code:    wizard.city.province_code,
        years_experience: wizard.work.experience,
        hours_per_week:   wizard.work.hoursPerWeek,
      },
      props.wageFacts,
    );
  }, [wizard, props.wageFacts]);

  // ── Engine: Tax (static) ───────────────────────────────────────────────────

  const taxResult = useMemo<NetIncomeResult | null>(() => {
    if (!salaryResult || !wizard?.city) return null;
    return calculateNetIncome(
      salaryResult.annual_mid,
      wizard.city.province_code,
      props.taxBracketsData,
      props.payrollParamsData,
    );
  }, [salaryResult, wizard, props.taxBracketsData, props.payrollParamsData]);

  // ── Engine: COL (reactive — re-runs when lifestyle changes) ───────────────

  const colResult = useMemo<CostEstimate | null>(() => {
    if (!wizard?.city || !taxResult || !salaryResult) return null;
    const familySize = wizard.household.adults + wizard.household.children;
    const bedrooms   = BEDROOM_MAP[wizard.household.bedrooms] ?? 1;
    return estimateCostOfLiving(
      {
        mbm_region:           wizard.city.mbm_region,
        cma_code:             wizard.city.cma_code,
        family_size:          familySize,
        bedrooms,
        lifestyle,
        monthly_take_home:    taxResult.monthly_take_home,
        gross_monthly_income: salaryResult.annual_mid / 12,
      },
      props.mbmData,
      props.rentData,
    );
  }, [wizard, taxResult, salaryResult, lifestyle, props.mbmData, props.rentData]);

  // ── Engine: CCB (AC-1 — runs automatically when children > 0) ─────────────

  const ccbResult = useMemo<CCBEstimate>(() => {
    const afni     = taxResult?.annual_net_income ?? 0;
    const children = wizard?.household.childAges.map((age) => ({ age })) ?? [];
    return calculateCCB({ children, adjusted_family_net_income: afni }, props.ccbParams);
  }, [wizard, taxResult, props.ccbParams]);

  // ── Engine: Roadmap (reactive — personalization summary uses surplus) ──────

  const roadmapResult = useMemo<RoadmapOutput | null>(() => {
    if (!wizard?.city || !wizard.work.occupation || !wizard.stage || !salaryResult || !taxResult || !colResult) {
      return null;
    }

    const roadmapInput: RoadmapInput = {
      migration_stage:  STAGE_MAP[wizard.stage] ?? 'recently_arrived',
      city_id:          wizard.city.city_id,
      city_name:        wizard.city.name,
      province_code:    wizard.city.province_code,
      noc_code:         wizard.work.occupation.noc_code,
      occupation_title: wizard.work.occupation.title,
      years_experience: wizard.work.experience,
      employment_type:  wizard.work.employmentType,
      adults:           wizard.household.adults,
      children:         wizard.household.children,
      hours_per_week:   wizard.work.hoursPerWeek,
      bedrooms:         BEDROOM_MAP[wizard.household.bedrooms] ?? 1,
    };

    const roadmapResultData: RoadmapResult = {
      annual_mid:                salaryResult.annual_mid,
      point_annual:              salaryResult.point_annual,
      monthly_take_home:         taxResult.monthly_take_home,
      annual_net_income:         taxResult.annual_net_income,
      gross_monthly_income:      salaryResult.annual_mid / 12,
      estimated_total_monthly:   colResult.estimated_total_monthly,
      monthly_surplus:           colResult.monthly_surplus,
      housing_affordability_flag: colResult.housing_affordability_flag,
    };

    return generateRoadmap(
      roadmapInput, roadmapResultData,
      props.taskDefs, props.rules, props.contentItems,
    );
  }, [wizard, salaryResult, taxResult, colResult, props.taskDefs, props.rules, props.contentItems]);

  // ── Loading / guard states ─────────────────────────────────────────────────

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#FAFBFC', fontFamily: "'DM Sans', Helvetica, sans-serif",
        fontSize: 15, color: '#6B7280',
      }}>
        Loading your results…
      </div>
    );
  }

  if (!wizard || !salaryResult || !taxResult || !colResult || !roadmapResult) {
    return null;
  }

  const occupation = wizard.work.occupation!;
  const city       = wizard.city!;
  const familySize = wizard.household.adults + wizard.household.children;

  return (
    <div style={{ minHeight: '100vh', background: '#FAFBFC', fontFamily: "'DM Sans', Helvetica, sans-serif" }}>

      {/* ─── Results hero ─────────────────────────────────────────────────── */}
      <header style={{
        background: 'linear-gradient(165deg, #0F3D3A 0%, #1B5E58 40%, #1B7A4A 100%)',
        padding: isMobile ? '32px 20px 28px' : '40px 24px 36px',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.04,
          backgroundImage: 'radial-gradient(circle at 20% 50%, #fff 1px, transparent 1px)',
          backgroundSize: '60px 60px', pointerEvents: 'none',
        }} aria-hidden="true" />

        <div style={{ maxWidth: 800, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: 'rgba(255,255,255,0.12)', borderRadius: 20,
                padding: '5px 14px', marginBottom: 12,
              }}>
                <span aria-hidden="true" style={{ fontSize: 12 }}>✨</span>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.85)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>
                  Your Results
                </span>
              </div>
              <h1 style={{
                fontFamily: "'DM Serif Display', Georgia, serif",
                fontSize: isMobile ? 24 : 32, fontWeight: 700,
                color: '#fff', margin: 0, lineHeight: 1.2,
              }}>
                Your Financial Simulation
              </h1>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', marginTop: 6 }}>
                {occupation.title} · {city.name}, {city.province_code} · Family of {familySize}
              </p>
            </div>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {[
                { label: 'Take-Home',
                  val: `$${taxResult.monthly_take_home.toLocaleString('en-CA')}/mo` },
                { label: colResult.monthly_surplus >= 0 ? 'Surplus' : 'Deficit',
                  val: `${colResult.monthly_surplus >= 0 ? '+' : '−'}$${Math.abs(colResult.monthly_surplus).toLocaleString('en-CA')}/mo` },
              ].map((s) => (
                <div key={s.label} style={{
                  background: 'rgba(255,255,255,0.1)', borderRadius: 10,
                  padding: '10px 16px', backdropFilter: 'blur(4px)',
                }}>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    {s.label}
                  </div>
                  <div style={{
                    fontFamily: "'DM Serif Display', Georgia, serif",
                    fontSize: 20, color: '#7DD3A8', fontWeight: 700,
                  }}>
                    {s.val}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* ─── Actions bar ──────────────────────────────────────────────────── */}
      <section style={{ maxWidth: 800, margin: '0 auto', padding: isMobile ? '16px 16px 0' : '24px 24px 0' }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 24px', borderRadius: 14,
          background: '#fff', border: '1px solid #E5E7EB',
          flexWrap: 'wrap', gap: 12,
        }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              onClick={() => { trackEvent('simulator_print'); window.print(); }}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '8px 16px', borderRadius: 8,
                border: '1px solid #E5E7EB', background: '#fff',
                fontSize: 13, fontWeight: 600, color: '#6B7280',
                cursor: 'pointer', fontFamily: "'DM Sans', Helvetica, sans-serif",
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="6 9 6 2 18 2 18 9" />
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                <rect x="6" y="14" width="12" height="8" />
              </svg>
              Print Report
            </button>
            <button
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '8px 16px', borderRadius: 8,
                border: '1px solid #E5E7EB', background: '#fff',
                fontSize: 13, fontWeight: 600, color: '#6B7280',
                cursor: 'pointer', fontFamily: "'DM Sans', Helvetica, sans-serif",
              }}
            >
              <span aria-hidden="true">📧</span> Email Results
            </button>
          </div>
          <button
            onClick={() => setShowStartOver(true)}
            style={{
              padding: '8px 20px', borderRadius: 8, border: 'none',
              background: '#F3F4F6', fontSize: 13, fontWeight: 600,
              color: '#374151', cursor: 'pointer',
              fontFamily: "'DM Sans', Helvetica, sans-serif",
            }}
          >
            ↻ Start Over
          </button>
        </div>
      </section>

      {/* ─── Panels ───────────────────────────────────────────────────────── */}
      <section
        style={{ maxWidth: 800, margin: '0 auto', padding: isMobile ? '24px 16px' : '32px 24px' }}
        aria-label="Simulation results"
      >
        <IncomePanel
          salary={salaryResult}
          occupation={occupation.title}
          city={`${city.name}, ${city.province_code}`}
          level={salaryResult.experience_level}
        />
        <NetIncomePanel tax={taxResult} />
        <AffordabilityPanel
          col={colResult}
          taxResult={taxResult}
          ccb={ccbResult}
          lifestyle={lifestyle}
          onLifestyleChange={setLifestyle}
        />
        <RoadmapPanel roadmap={roadmapResult} isMobile={isMobile} />
      </section>

      {/* ─── Disclaimer ───────────────────────────────────────────────────── */}
      <section style={{ maxWidth: 800, margin: '0 auto', padding: isMobile ? '0 16px 48px' : '0 24px 64px' }}>
        <div style={{
          padding: '14px 18px', borderRadius: 10, background: '#F3F4F6',
          fontSize: 11, color: '#9CA3AF', lineHeight: 1.6,
          fontFamily: "'DM Sans', Helvetica, sans-serif",
        }}>
          <strong>Disclaimer:</strong> This simulator provides estimates for educational purposes only. It is not financial, tax, or legal advice. Actual amounts depend on your complete tax situation, employment terms, and current market conditions. Consult a qualified professional for personalized advice.
        </div>
      </section>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Serif+Display&display=swap');
        a:focus-visible, button:focus-visible {
          outline: 2px solid #2563EB;
          outline-offset: 2px;
          border-radius: 4px;
        }
        @media print {
          header { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          section:last-of-type { display: none !important; }
        }
      `}</style>

      {/* ─── Start Over confirmation dialog ───────────────────────────────── */}
      {showStartOver && (
        <StartOverDialog
          onCancel={() => setShowStartOver(false)}
          onConfirm={() => {
            trackEvent('simulator_start_over');
            try { sessionStorage.removeItem('maple-simulator-input-v1'); } catch { /* ignore */ }
            try { localStorage.removeItem(REPORT_KEY); } catch { /* ignore */ }
            dispatchReportChange();
            router.push('/simulator');
          }}
        />
      )}
    </div>
  );
}
