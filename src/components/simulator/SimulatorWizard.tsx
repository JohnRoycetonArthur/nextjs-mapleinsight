'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { C, F, TOTAL_STEPS } from './tokens';
import { ProgressIndicator } from './ProgressIndicator';
import { WelcomeStep }   from './steps/WelcomeStep';
import { LocationStep }  from './steps/LocationStep';
import { WorkStep }      from './steps/WorkStep';
import { HouseholdStep } from './steps/HouseholdStep';
import { ReviewStep }    from './steps/ReviewStep';
import {
  type WizardState, type MigrationStage,
  DEFAULT_WIZARD_STATE,
} from './wizardTypes';
import {
  useRestoreSimulatorState,
  usePersistSimulatorState,
  clearSimulatorState,
} from '@/hooks/useSimulatorPersistence';

// ── Icons ─────────────────────────────────────────────────────────────────────

const ArrowRight = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }}>
    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
  </svg>
);

const ArrowLeft = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }}>
    <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
  </svg>
);

const Spinner = () => (
  <span style={{
    display: 'inline-block', width: 18, height: 18,
    border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff',
    borderRadius: '50%', animation: 'sim-spin 0.8s linear infinite',
  }} aria-hidden="true" />
);

// ── Validation ────────────────────────────────────────────────────────────────

type Errors = Record<string, string | undefined>;

function validate(step: number, state: WizardState): Errors {
  const errs: Errors = {};
  if (step === 0 && !state.stage)           errs.stage = 'Please select a migration stage.';
  if (step === 1 && !state.city)            errs.city  = 'Please select a city.';
  if (step === 2 && !state.work.occupation) errs.occupation = 'Please search for and confirm your occupation.';
  return errs;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function SimulatorWizard() {
  const router   = useRouter();
  const liveRef  = useRef<HTMLDivElement>(null);

  const [state,     setState]     = useState<WizardState>(DEFAULT_WIZARD_STATE);
  const [errors,    setErrors]    = useState<Errors>({});
  const [isRunning, setIsRunning] = useState(false);

  // sessionStorage persistence
  useRestoreSimulatorState(setState);
  usePersistSimulatorState(state);

  const step = state.step;
  const setStep = useCallback((s: number) => {
    setState((prev) => ({ ...prev, step: s }));
    setErrors({});
  }, []);

  // Announce step changes to screen readers
  useEffect(() => {
    if (liveRef.current) {
      // Brief delay so aria-live picks up the change
      const id = setTimeout(() => {
        if (liveRef.current) liveRef.current.textContent = '';
      }, 600);
      return () => clearTimeout(id);
    }
  }, [step]);

  const handleNext = () => {
    const errs = validate(step, state);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setStep(Math.min(step + 1, TOTAL_STEPS - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    setErrors({});
    setStep(Math.max(step - 1, 0));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStepClick = (target: number) => {
    if (target < step) setStep(target);
  };

  const handleRun = () => {
    const errs = validate(4, state); // final validation pass
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setIsRunning(true);
    // Persist state so results page can read it, then navigate
    try {
      sessionStorage.setItem('maple-simulator-input-v1', JSON.stringify(state));
    } catch { /* ignore */ }

    // Navigate to results (US-9.3+). For MVP, clear after 500ms.
    setTimeout(() => {
      clearSimulatorState();
      router.push('/simulator/results');
    }, 500);
  };

  const isNextEnabled = () => {
    if (step === 0) return !!state.stage;
    if (step === 1) return !!state.city;
    if (step === 2) return !!state.work.occupation;
    return true;
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <section style={{ maxWidth: 640, margin: '0 auto', padding: 'clamp(0px, 2vw, 0px) clamp(16px, 4vw, 24px) 56px' }}>
      {/* Aria-live region for step transitions */}
      <div
        ref={liveRef}
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />

      <ProgressIndicator currentStep={step} onStepClick={handleStepClick} />

      {/* Step card */}
      <div style={{
        background: C.white, borderRadius: 16,
        border: `1px solid ${C.border}`,
        padding: 'clamp(24px, 5vw, 36px) clamp(20px, 5vw, 40px)',
        boxShadow: '0 1px 4px rgba(0,0,0,0.03), 0 8px 32px rgba(0,0,0,0.04)',
        minHeight: 320,
      }}>
        {step === 0 && (
          <WelcomeStep
            value={state.stage}
            onChange={(s: MigrationStage) => setState((p) => ({ ...p, stage: s }))}
            error={errors.stage}
          />
        )}
        {step === 1 && (
          <LocationStep
            value={state.city}
            onChange={(c) => setState((p) => ({ ...p, city: c }))}
            error={errors.city}
          />
        )}
        {step === 2 && (
          <WorkStep
            value={state.work}
            onChange={(w) => setState((p) => ({ ...p, work: w }))}
            errors={{ occupation: errors.occupation }}
          />
        )}
        {step === 3 && (
          <HouseholdStep
            value={state.household}
            onChange={(h) => setState((p) => ({ ...p, household: h }))}
          />
        )}
        {step === 4 && (
          <ReviewStep
            stage={state.stage}
            city={state.city}
            work={state.work}
            household={state.household}
            onEdit={(target) => setStep(target)}
          />
        )}
      </div>

      {/* Navigation */}
      <div style={{
        display: 'flex',
        justifyContent: step === 0 ? 'flex-end' : 'space-between',
        marginTop: 20, gap: 12,
      }}>
        {step > 0 && (
          <button
            type="button"
            onClick={handleBack}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '12px 24px', borderRadius: 10, minHeight: 44,
              border: `1px solid ${C.border}`, background: C.white,
              fontFamily: F.body, fontSize: 14, fontWeight: 600, color: C.textDark,
              cursor: 'pointer', transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = C.lightGray; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = C.white; }}
          >
            <ArrowLeft /> Back
          </button>
        )}

        {step < TOTAL_STEPS - 1 ? (
          <button
            type="button"
            onClick={handleNext}
            disabled={!isNextEnabled()}
            aria-disabled={!isNextEnabled()}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '12px 28px', borderRadius: 10, border: 'none', minHeight: 44,
              background: isNextEnabled() ? C.green : C.border,
              fontFamily: F.body, fontSize: 14, fontWeight: 700, color: C.white,
              cursor: isNextEnabled() ? 'pointer' : 'not-allowed',
              opacity: isNextEnabled() ? 1 : 0.5,
              transition: 'background 0.2s, opacity 0.2s',
            }}
            onMouseEnter={(e) => { if (isNextEnabled()) e.currentTarget.style.background = '#166B3F'; }}
            onMouseLeave={(e) => { if (isNextEnabled()) e.currentTarget.style.background = C.green; }}
          >
            Next <ArrowRight />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleRun}
            disabled={isRunning}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              padding: '14px 32px', borderRadius: 12, border: 'none', minHeight: 44,
              background: isRunning
                ? C.gray
                : `linear-gradient(135deg, ${C.green}, ${C.forest})`,
              fontFamily: F.body, fontSize: 16, fontWeight: 700, color: C.white,
              cursor: isRunning ? 'wait' : 'pointer',
              boxShadow: isRunning ? 'none' : `0 4px 16px ${C.green}33`,
              transition: 'all 0.3s',
            }}
          >
            {isRunning ? (
              <><Spinner /> Running Simulation...</>
            ) : (
              <><span aria-hidden="true">🧮</span> Run My Simulation <ArrowRight /></>
            )}
          </button>
        )}
      </div>

      {/* Spin keyframe */}
      <style>{`@keyframes sim-spin { to { transform: rotate(360deg); } }`}</style>
    </section>
  );
}
