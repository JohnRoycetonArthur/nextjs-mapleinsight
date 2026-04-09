'use client'

/**
 * VersionStamp — US-1.4
 *
 * Renders "Engine v{X} · Data {Y}" with a tooltip explaining each version.
 * Mounts at every location where modelled figures are displayed:
 *   - WizardShell footer
 *   - ResultsDashboard data-sources footer
 *   - ConsultantReport data footer
 *   - ActionPlanPageContent (report viewer)
 *   - ImmigrationCostClient (GIC page)
 *
 * Reads build-time constants from version.ts by default.
 * Accepts explicit overrides so EngineOutput values can be displayed when available.
 */

import { useState } from 'react'
import { ENGINE_VERSION, DATA_VERSION } from '@/lib/settlement-engine/version'

export interface VersionStampProps {
  /** Semver string for the calculation engine. Defaults to build-time constant. */
  engineVersion?: string
  /** Composite data-source effective-date string. Defaults to build-time constant. */
  dataVersion?: string
  style?: React.CSSProperties
}

export function VersionStamp({
  engineVersion = ENGINE_VERSION,
  dataVersion   = DATA_VERSION,
  style,
}: VersionStampProps) {
  const [open, setOpen] = useState(false)

  return (
    <span
      style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', ...style }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      <span
        tabIndex={0}
        role="button"
        aria-label={`Engine version ${engineVersion}, data version ${dataVersion}. Hover for details.`}
        style={{
          fontSize: 10,
          fontWeight: 600,
          color: '#9CA3AF',
          letterSpacing: 0.2,
          cursor: 'default',
          borderBottom: '1px dashed #D1D5DB',
          outline: 'none',
          userSelect: 'none',
        }}
      >
        Engine v{engineVersion}&nbsp;·&nbsp;Data&nbsp;{dataVersion}
      </span>

      {open && (
        <span
          role="tooltip"
          style={{
            position: 'absolute',
            bottom: 'calc(100% + 8px)',
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#1F2937',
            color: '#F9FAFB',
            fontSize: 11,
            fontWeight: 400,
            padding: '9px 12px',
            borderRadius: 8,
            width: 260,
            lineHeight: 1.55,
            zIndex: 200,
            boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
            whiteSpace: 'normal',
            pointerEvents: 'none',
          }}
        >
          <strong style={{ display: 'block', marginBottom: 5, fontSize: 11, fontWeight: 700 }}>
            About these versions
          </strong>
          <span>
            <strong>Engine v{engineVersion}</strong> — the version of the calculation
            logic used to model your settlement costs.
          </span>
          <br /><br />
          <span>
            <strong>Data {dataVersion}</strong> — when the underlying source data (IRCC
            fees, CMHC rent benchmarks) was last verified against official records.
          </span>
          {/* Arrow */}
          <span style={{
            position: 'absolute',
            top: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            borderWidth: 5,
            borderStyle: 'solid',
            borderColor: '#1F2937 transparent transparent transparent',
          }} />
        </span>
      )}
    </span>
  )
}
