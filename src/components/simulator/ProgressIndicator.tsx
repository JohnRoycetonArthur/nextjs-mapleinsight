'use client';

import { C, F, STEP_LABELS, TOTAL_STEPS } from './tokens';

interface Props {
  currentStep: number;
  onStepClick: (step: number) => void;
}

export function ProgressIndicator({ currentStep, onStepClick }: Props) {
  return (
    <nav aria-label="Wizard progress" style={{ padding: '24px 0 8px' }}>
      <div className="hidden sm:flex" style={{ alignItems: 'flex-start', justifyContent: 'center' }}>
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => {
          const isCompleted = i < currentStep;
          const isCurrent   = i === currentStep;
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
              {/* Circle + label */}
              <div
                role={isCompleted ? 'button' : undefined}
                tabIndex={isCompleted ? 0 : undefined}
                aria-label={isCompleted ? `Go to step ${i + 1}: ${STEP_LABELS[i]}` : undefined}
                onClick={() => isCompleted && onStepClick(i)}
                onKeyDown={(e) => { if (isCompleted && (e.key === 'Enter' || e.key === ' ')) onStepClick(i); }}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                  cursor: isCompleted ? 'pointer' : 'default',
                  opacity: !isCompleted && !isCurrent ? 0.4 : 1,
                  transition: 'opacity 0.3s',
                }}
              >
                {/* Dot */}
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: isCompleted ? C.green : isCurrent ? C.forest : 'transparent',
                  border: `2px solid ${isCompleted || isCurrent ? C.green : C.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.3s',
                }}
                  aria-current={isCurrent ? 'step' : undefined}
                >
                  {isCompleted ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    <span style={{
                      fontFamily: F.heading, fontSize: 14, fontWeight: 700,
                      color: isCurrent ? '#fff' : C.gray,
                    }} aria-hidden="true">
                      {i + 1}
                    </span>
                  )}
                </div>

                {/* Label — hidden on mobile via CSS */}
                <span className="hidden sm:block" style={{
                  fontFamily: F.body, fontSize: 11, fontWeight: 600,
                  color: isCurrent ? C.forest : C.textLight,
                  textTransform: 'uppercase', letterSpacing: '0.5px',
                  whiteSpace: 'nowrap',
                }}>
                  {STEP_LABELS[i]}
                </span>
              </div>

              {/* Connector line */}
              {i < TOTAL_STEPS - 1 && (
                <div style={{
                  width: 64, height: 2,
                  background: isCompleted ? C.green : C.border,
                  margin: '-18px 8px 0',
                  transition: 'background 0.3s',
                }} aria-hidden="true" />
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile: "Step X of 5" label */}
      <p className="sm:hidden" style={{
        textAlign: 'center', marginTop: 10,
        fontFamily: F.body, fontSize: 13, color: C.gray,
      }}>
        Step {currentStep + 1} of {TOTAL_STEPS} — <strong style={{ color: C.forest }}>{STEP_LABELS[currentStep]}</strong>
      </p>
    </nav>
  );
}
