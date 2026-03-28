'use client'

import { JOB_OPTIONS, type JobKey } from '@/lib/settlement-engine/scenario-builder-constants'

const C = {
  forest: '#1B4F4A', accent: '#1B7A4A',
  border: '#E5E7EB', white: '#FFFFFF', text: '#374151', textLight: '#9CA3AF',
  blue: '#2563EB',
}
const FONT = "'DM Sans', Helvetica, sans-serif"

function CurrentBadge() {
  return (
    <span style={{
      fontSize: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5,
      color: C.blue, background: '#EFF6FF', padding: '2px 6px', borderRadius: 3,
      marginLeft: 6, verticalAlign: 'middle',
    }}>
      Current
    </span>
  )
}

interface Props {
  selected:        JobKey
  baseline:        JobKey
  baselineRunway:  number  // shown for 'no_job' option
  onChange:        (job: JobKey) => void
}

export function JobStatusFilter({ selected, baseline, baselineRunway, onChange }: Props) {
  return (
    <div>
      {/* Section header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <span style={{ fontSize: 18 }} aria-hidden="true">💼</span>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.forest, fontFamily: FONT }}>Job Status</div>
          <div style={{ fontSize: 10, color: C.textLight }}>When will the client secure employment?</div>
        </div>
      </div>

      {/* Radio-style vertical list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {JOB_OPTIONS.map(opt => {
          const isSelected = selected === opt.key
          const isCurrent  = baseline === opt.key
          const runwayLabel = opt.runway !== null
            ? `${opt.runway}mo runway`
            : `${baselineRunway}mo runway`
          return (
            <div
              key={opt.key}
              role="radio"
              aria-checked={isSelected}
              tabIndex={0}
              onClick={() => onChange(opt.key)}
              onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && onChange(opt.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 14px', borderRadius: 10, cursor: 'pointer',
                border: `2px solid ${isSelected ? C.accent : C.border}`,
                background: isSelected ? '#ECFDF5' : C.white,
                transition: 'all 0.15s',
              }}
            >
              <span style={{ fontSize: 16 }} aria-hidden="true">{opt.icon}</span>
              <span style={{
                flex: 1, fontSize: 12, fontFamily: FONT,
                fontWeight: isSelected ? 700 : 400,
                color: isSelected ? C.accent : C.text,
              }}>
                {opt.label}
                {isCurrent && isSelected && <CurrentBadge />}
              </span>
              <span style={{ fontSize: 11, color: C.textLight, fontFamily: FONT }}>
                {runwayLabel}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
