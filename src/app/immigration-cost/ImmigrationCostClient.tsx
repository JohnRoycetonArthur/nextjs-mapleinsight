'use client';

import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  SettlementSessionProvider,
  useSettlementSession,
  type WizardAnswers,
} from '@/components/settlement-planner/SettlementSessionContext';
import { WizardShell } from '@/components/settlement-planner/wizard/WizardShell';
import { getScenarioByType } from '@/lib/scenarios';
import type { Scenario } from '@/lib/scenarios';
import { trackEvent } from '@/lib/analytics';
import { VersionStamp } from '@/components/settlement-planner/VersionStamp';

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  forest: '#1B4F4A',
  accent: '#1B7A4A',
  gold: '#B8860B',
  red: '#C41E3A',
  gray: '#6B7280',
  border: '#E5E7EB',
  bg: '#F9FAFB',
  white: '#FFFFFF',
  text: '#374151',
  textLight: '#9CA3AF',
};
const font = "var(--font-dm-sans, 'DM Sans', Helvetica, sans-serif)";
const serif = "var(--font-dm-serif, 'DM Serif Display', Georgia, serif)";

const MAPLE_LEAF_PATH =
  'M12 0L13.5 6.5L17 4L15.5 8.5L22 9L17 12L20 16L14 14L12 24L10 14L4 16L7 12L2 9L8.5 8.5L7 4L10.5 6.5Z';

// ─── Pre-fill Banner ──────────────────────────────────────────────────────────

function PrefillBanner({
  scenario,
  onDismiss,
}: {
  scenario: Scenario;
  onDismiss: () => void;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        background: `${C.accent}0A`,
        border: `1px solid ${C.accent}22`,
        borderLeft: `4px solid ${C.accent}`,
        borderRadius: '0 12px 12px 0',
        padding: '14px 18px',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 12,
        marginBottom: 20,
        fontFamily: font,
        animation: 'bannerSlideIn 0.4s ease-out',
      }}
    >
      <div>
        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: C.forest,
            marginBottom: 3,
          }}
        >
          Adjust these numbers based on your scenario to get your cost for settlement in Canada.
        </div>
        <div style={{ fontSize: 13, color: C.gray, lineHeight: 1.55 }}>
          These defaults are based on {scenario.persona} moving to {scenario.destination} — every
          field is editable.
        </div>
      </div>
      <button
        onClick={onDismiss}
        aria-label="Dismiss pre-fill banner"
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 4,
          fontSize: 18,
          color: C.textLight,
          lineHeight: 1,
          flexShrink: 0,
          borderRadius: 4,
          transition: 'color 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = C.forest;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = C.textLight;
        }}
      >
        ×
      </button>
    </div>
  );
}

// ─── PlanSection — lives inside SettlementSessionProvider ─────────────────────

function PlanSection({ scenarioType }: { scenarioType: string | null }) {
  const { session, isRestored, updateAnswers } = useSettlementSession();
  const [prefilled, setPrefilled] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const prefillAppliedRef = useRef(false);
  const prefillValuesRef = useRef<Partial<WizardAnswers>>({});
  const modifiedFieldsRef = useRef<Set<string>>(new Set());

  const scenario = scenarioType ? getScenarioByType(scenarioType) : undefined;

  // Apply prefill once after session restoration
  useEffect(() => {
    if (!isRestored || prefillAppliedRef.current) return;
    prefillAppliedRef.current = true;

    if (!scenario) return;

    // Only prefill if no existing session answers
    const hasSavedAnswers = Object.keys(session.answers).length > 0;
    if (hasSavedAnswers) return;

    const p = scenario.prefill;

    // Build the patch — intentionally omit transitMode (deprecated in session)
    // savings, obligations, savingsCapacity, income are always "" per spec
    const patch: Partial<WizardAnswers> = {
      adults: p.adults,
      children: p.children,
      arrival: p.arrival,
      pathway: p.pathway,
      feesPaid: p.feesPaid,
      biometricsDone: p.biometricsDone,
      city: p.city,
      province: p.province,
      jobStatus: p.jobStatus,
      income: p.income,
      savings: p.savings,
      obligations: p.obligations,
      savingsCapacity: p.savingsCapacity,
      housing: p.housing,
      furnishing: p.furnishing,
      childcare: p.childcare,
      car: p.car,
      ...(p.studyPermit !== undefined ? { studyPermit: p.studyPermit } : {}),
    };

    updateAnswers(patch);
    prefillValuesRef.current = { ...patch };
    setPrefilled(true);

    trackEvent('planner_start', {
      scenario_type: scenario.type,
      prefilled: true,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRestored]);

  // Track first edit of any pre-filled field (once per field)
  useEffect(() => {
    if (!prefilled) return;
    const prefillValues = prefillValuesRef.current;
    const answers = session.answers;

    for (const [field, prefillValue] of Object.entries(prefillValues)) {
      if (modifiedFieldsRef.current.has(field)) continue;
      const currentValue = answers[field as keyof WizardAnswers];
      // Fire when a non-blank prefill value has been changed by the user
      if (prefillValue !== '' && currentValue !== prefillValue && currentValue !== undefined) {
        modifiedFieldsRef.current.add(field);
        trackEvent('planner_values_modified', {
          scenario_type: scenarioType ?? '',
          field_changed: field,
        });
      }
    }
  }, [session.answers, prefilled, scenarioType]);

  return (
    <>
      <style>{`
        @keyframes bannerSlideIn {
          from { opacity: 0; transform: translateX(-12px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
      {prefilled && !bannerDismissed && scenario && (
        <PrefillBanner scenario={scenario} onDismiss={() => setBannerDismissed(true)} />
      )}
      <WizardShell publicResultsHref="/settlement-plan?view=report" />
    </>
  );
}

// ─── Page hero ────────────────────────────────────────────────────────────────

function PageHero() {
  return (
    <header
      style={{
        background: 'linear-gradient(165deg, #0F3D3A 0%, #1B5E58 40%, #1B7A4A 100%)',
        padding: '56px 24px 48px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse at 20% 50%, rgba(27,122,74,0.15) 0%, transparent 60%),' +
            'radial-gradient(ellipse at 80% 20%, rgba(184,134,11,0.08) 0%, transparent 50%)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          maxWidth: 720,
          margin: '0 auto',
          textAlign: 'center',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: 'rgba(255,255,255,0.1)',
            borderRadius: 100,
            padding: '6px 16px',
            marginBottom: 20,
            backdropFilter: 'blur(8px)',
          }}
        >
          <svg width={13} height={13} viewBox="0 0 24 24" fill={C.gold} aria-hidden="true">
            <path d={MAPLE_LEAF_PATH} />
          </svg>
          <span
            style={{
              fontSize: 12,
              color: 'rgba(255,255,255,0.8)',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: 1,
              fontFamily: font,
            }}
          >
            Immigration Cost Calculator
          </span>
        </div>

        <h1
          style={{
            fontFamily: serif,
            fontSize: 40,
            fontWeight: 700,
            color: '#fff',
            margin: '0 0 16px',
            lineHeight: 1.12,
            letterSpacing: -0.5,
          }}
        >
          How Much Does It Cost{' '}
          <span
            style={{
              background: 'linear-gradient(135deg, #B8860B, #D4A017)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            to Move to Canada?
          </span>
        </h1>

        <p
          style={{
            fontSize: 17,
            color: 'rgba(255,255,255,0.75)',
            lineHeight: 1.6,
            margin: '0 auto 24px',
            maxWidth: 520,
            fontFamily: font,
          }}
        >
          Get a personalized estimate based on your pathway, city, and family size. Powered by IRCC
          fee schedules, CMHC rent data, and official Canadian benchmarks.
        </p>

        {/* Trust badges */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 20, flexWrap: 'wrap' }}>
          {['No signup required', '100% free', 'IRCC · CMHC data'].map((t, i) => (
            <span
              key={i}
              style={{
                fontSize: 12,
                color: 'rgba(255,255,255,0.5)',
                fontFamily: font,
                display: 'flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <svg
                width={12}
                height={12}
                viewBox="0 0 24 24"
                fill="none"
                stroke="rgba(255,255,255,0.4)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              {t}
            </span>
          ))}
        </div>
      </div>
    </header>
  );
}

// ─── ImmigrationCostClient ────────────────────────────────────────────────────

export function ImmigrationCostClient() {
  const searchParams = useSearchParams();
  const scenarioType = searchParams.get('scenario');

  // Scroll to #plan if scenario param present or hash is #plan
  useEffect(() => {
    const hash = window.location.hash;
    if (hash === '#plan' || scenarioType) {
      const el = document.getElementById('plan');
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
    }
  }, [scenarioType]);

  return (
    <div style={{ minHeight: '100vh', background: C.bg }}>
      <PageHero />

      {/* Plan section — anchor target for card clicks */}
      <section
        id="plan"
        aria-label="Settlement cost planner"
        style={{
          maxWidth: 860,
          margin: '0 auto',
          padding: '40px 20px 80px',
          scrollMarginTop: 80,
        }}
      >
        <div style={{ marginBottom: 28, textAlign: 'center' }}>
          <h2
            style={{
              fontFamily: serif,
              fontSize: 26,
              fontWeight: 700,
              color: C.forest,
              margin: '0 0 8px',
            }}
          >
            Build Your Personal Settlement Plan
          </h2>
          <p style={{ fontSize: 15, color: C.gray, fontFamily: font, margin: 0 }}>
            Answer 6 quick questions. We calculate your cost estimate and savings gap.
          </p>
        </div>

        <SettlementSessionProvider slug="immigration-cost" mode="public">
          <PlanSection scenarioType={scenarioType} />
        </SettlementSessionProvider>

        {/* Version stamp — exposed on every page showing modelled figures (US-1.4) */}
        <div style={{ textAlign: 'center', marginTop: 24, paddingBottom: 8 }}>
          <VersionStamp />
        </div>
      </section>
    </div>
  );
}
