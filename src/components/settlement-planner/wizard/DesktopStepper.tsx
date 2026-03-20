'use client'

import { C, FONT, SERIF, WIZARD_STEPS } from './constants'

// ─── Icons ────────────────────────────────────────────────────────────────────

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

// ─── DesktopStepper ───────────────────────────────────────────────────────────

interface Props {
  currentStep:    number
  completedSteps: Set<number>
}

/**
 * Horizontal numbered stepper for desktop (≥768 px).
 * Active step shows a filled circle in the step color.
 * Completed steps show a checkmark with the step color.
 * Connector lines turn the step color when a step is completed.
 */
export function DesktopStepper({ currentStep, completedSteps }: Props) {
  return (
    <div
      role="navigation"
      aria-label="Wizard progress"
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0 }}
    >
      {WIZARD_STEPS.map((s, i) => {
        const active = s.num === currentStep
        const done   = completedSteps.has(s.num)
        const clr    = active || done ? s.color : C.border

        return (
          <div key={s.num} style={{ display: 'flex', alignItems: 'center' }}>
            {/* Circle + label column */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, minWidth: 72 }}>
              <div
                style={{
                  width:      38,
                  height:     38,
                  borderRadius: '50%',
                  background:  active || done ? clr : 'transparent',
                  border:      `2px solid ${clr}`,
                  display:     'flex',
                  alignItems:  'center',
                  justifyContent: 'center',
                  transition:  'all 0.3s',
                  boxShadow:   active ? `0 0 0 4px ${s.color}20` : 'none',
                }}
                aria-current={active ? 'step' : undefined}
              >
                {done ? (
                  <CheckIcon />
                ) : (
                  <span style={{ fontFamily: SERIF, fontSize: 15, fontWeight: 700, color: active ? '#fff' : C.textLight }}>
                    {s.num}
                  </span>
                )}
              </div>
              <span style={{ fontSize: 10, fontWeight: active ? 700 : 500, color: active ? s.color : C.textLight, fontFamily: FONT }}>
                {s.title}
              </span>
            </div>

            {/* Connector line between steps */}
            {i < WIZARD_STEPS.length - 1 && (
              <div style={{
                width:      32,
                height:     2,
                marginTop:  -18,
                background: done ? s.color : C.border,
                transition: 'background 0.3s',
              }} />
            )}
          </div>
        )
      })}
    </div>
  )
}
