'use client'

import { C, FONT, WIZARD_STEPS, TOTAL_STEPS } from './constants'

interface Props {
  currentStep: number
}

/**
 * Compact progress bar for mobile (<768 px).
 * Shows step icon, "Step N: Title", fraction, and a gradient progress bar.
 */
export function MobileProgress({ currentStep }: Props) {
  const s       = WIZARD_STEPS[currentStep - 1]
  const percent = (currentStep / TOTAL_STEPS) * 100
  const first   = WIZARD_STEPS[0]

  return (
    <div style={{ padding: '12px 0' }} role="navigation" aria-label="Wizard progress">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: s.color, display: 'flex', alignItems: 'center', gap: 6, fontFamily: FONT }}>
          <span style={{ fontSize: 14 }} aria-hidden="true">{s.icon}</span>
          Step {currentStep}: {s.title}
        </span>
        <span style={{ fontSize: 11, color: C.textLight, fontFamily: FONT }}>
          {currentStep}/{TOTAL_STEPS}
        </span>
      </div>

      {/* Progress bar */}
      <div
        style={{ width: '100%', height: 5, background: C.border, borderRadius: 3, overflow: 'hidden' }}
        role="progressbar"
        aria-valuenow={currentStep}
        aria-valuemin={1}
        aria-valuemax={TOTAL_STEPS}
        aria-label={`Step ${currentStep} of ${TOTAL_STEPS}`}
      >
        <div style={{
          height:     '100%',
          width:      `${percent}%`,
          background: `linear-gradient(90deg, ${first.color}, ${s.color})`,
          borderRadius: 3,
          transition:   'width 0.4s',
        }} />
      </div>
    </div>
  )
}
