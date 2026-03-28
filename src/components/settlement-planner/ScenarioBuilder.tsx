'use client'

/**
 * ScenarioBuilder — US-21.1
 *
 * Container for the 4 interactive filter sections (Destination, Housing,
 * Landing Timeline, Job Status) + the DeltaView comparison table.
 *
 * All recalculation is client-side and happens in < 100ms via useScenarioBuilder.
 * Filter state is persisted in sessionStorage so navigating away and back
 * restores selections.
 */

import type { EngineInput, EngineOutput } from '@/lib/settlement-engine/types'
import { useScenarioBuilder } from '@/hooks/useScenarioBuilder'
import { DestinationFilter }    from './scenario-filters/DestinationFilter'
import { HousingFilter }        from './scenario-filters/HousingFilter'
import { LandingTimelineFilter } from './scenario-filters/LandingTimelineFilter'
import { JobStatusFilter }      from './scenario-filters/JobStatusFilter'
import { DeltaView }            from './DeltaView'

const C = {
  forest: '#1B4F4A', gold: '#B8860B',
  border: '#E5E7EB', white: '#FFFFFF',
}
const FONT  = "'DM Sans', Helvetica, sans-serif"
const SERIF = "'DM Serif Display', Georgia, serif"

function ResetIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="1 4 1 10 7 10"/>
      <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
    </svg>
  )
}

interface Props {
  engineInput:  EngineInput
  engineOutput: EngineOutput
}

export function ScenarioBuilder({ engineInput, engineOutput }: Props) {
  const {
    city, housing, delay, jobStatus, monthlySavings,
    setCity, setHousing, setDelay, setJobStatus, setMonthlySavings,
    baseline, scenario, delta,
    isModified, changedFilters, resetAll,
  } = useScenarioBuilder(engineInput, engineOutput)

  const changeCount = changedFilters.length

  return (
    <div>
      {/* ── Filter panel ─────────────────────────────────────────────── */}
      <div style={{
        background: C.white, borderRadius: 14, border: `1px solid ${C.border}`,
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)', marginBottom: 16, overflow: 'hidden',
      }}>
        {/* Panel header */}
        <div style={{
          padding: '14px 24px', background: C.forest,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 18 }} aria-hidden="true">🔧</span>
            <span style={{ fontSize: 15, fontWeight: 700, color: C.white, fontFamily: SERIF }}>
              Scenario Builder
            </span>
            {isModified && (
              <span style={{
                fontSize: 9, fontWeight: 700, color: C.gold,
                background: '#FFFBEB', padding: '2px 8px', borderRadius: 4,
              }}>
                {changeCount} {changeCount === 1 ? 'change' : 'changes'}
              </span>
            )}
          </div>
          {isModified && (
            <button
              onClick={resetAll}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '5px 12px', borderRadius: 6,
                border: '1px solid rgba(255,255,255,0.3)',
                background: 'transparent', color: C.white,
                fontSize: 11, cursor: 'pointer', fontFamily: FONT,
              }}
              aria-label="Reset all scenario filters to baseline"
            >
              <ResetIcon /> Reset All
            </button>
          )}
        </div>

        {/* Filter sections */}
        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>
          <DestinationFilter
            selected={city}
            baseline={baseline.city}
            onChange={setCity}
          />
          <HousingFilter
            selected={housing}
            baseline={baseline.housing}
            city={city}
            onChange={setHousing}
          />
          <LandingTimelineFilter
            selected={delay}
            monthlySavings={monthlySavings}
            baselineSavings={baseline.savings}
            effectiveSavings={scenario.effectiveSavings}
            onChange={setDelay}
            onSavingsChange={setMonthlySavings}
          />
          <JobStatusFilter
            selected={jobStatus}
            baseline={baseline.jobStatus}
            baselineRunway={baseline.runway}
            onChange={setJobStatus}
          />
        </div>
      </div>

      {/* ── Delta comparison table ────────────────────────────────────── */}
      <DeltaView
        baseline={baseline}
        scenario={scenario}
        delta={delta}
        isModified={isModified}
        changedFilters={changedFilters}
      />
    </div>
  )
}
