'use client'

/**
 * DeltaView — US-21.1
 *
 * Comparison table: Baseline vs Scenario, with emphasized Savings Gap row
 * and a contextual summary card below.
 */

import type { ScenarioBaseline, ScenarioResult, ScenarioDelta } from '@/hooks/useScenarioBuilder'

const C = {
  forest: '#1B4F4A', accent: '#1B7A4A',
  red: '#C41E3A', border: '#E5E7EB', white: '#FFFFFF',
  text: '#374151', textLight: '#9CA3AF', gray: '#6B7280',
}
const FONT  = "'DM Sans', Helvetica, sans-serif"
const SERIF = "'DM Serif Display', Georgia, serif"

const fmt = (n: number) =>
  new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(Math.abs(n))

// ─── Arrow icons ──────────────────────────────────────────────────────────────

function ArrowDown() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="12" y1="5" x2="12" y2="19"/>
      <polyline points="19 12 12 19 5 12"/>
    </svg>
  )
}

function ArrowUp() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={C.red} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="12" y1="19" x2="12" y2="5"/>
      <polyline points="5 12 12 5 19 12"/>
    </svg>
  )
}

// ─── DeltaRow ─────────────────────────────────────────────────────────────────

interface DeltaRowProps {
  label:          string
  baseline:       number
  scenario:       number
  bold?:          boolean
  /** When true, a positive delta (scenario > baseline) is good (used for Available Savings). */
  positiveIsGood?: boolean
  /** When true, render as runway months (no currency symbol). */
  isMonths?:      boolean
}

function DeltaRow({ label, baseline, scenario, bold, positiveIsGood, isMonths }: DeltaRowProps) {
  const diff      = scenario - baseline
  const unchanged = diff === 0
  const improved  = positiveIsGood ? diff > 0 : diff < 0

  const formatValue = (v: number) =>
    isMonths ? `${v}mo` : fmt(v)

  const formatImpact = () => {
    if (unchanged) return 'No change'
    if (bold && scenario === 0 && !positiveIsGood) return '✓ Eliminated'
    const arrow = improved ? '↓' : '↑'
    return `${arrow} ${isMonths ? `${Math.abs(diff)}mo` : fmt(Math.abs(diff))}`
  }

  const impactColor = unchanged
    ? C.textLight
    : improved
      ? C.accent
      : C.red

  const scenarioColor = unchanged
    ? C.text
    : (bold && scenario === 0 && !positiveIsGood)
      ? C.accent
      : improved
        ? C.accent
        : C.red

  return (
    <div style={{
      display: 'flex', alignItems: 'center',
      padding: bold ? '12px 0' : '10px 0',
      borderBottom:  bold ? 'none' : `1px solid ${C.border}`,
      borderTop:     bold ? `2px solid ${C.forest}` : 'none',
      marginTop:     bold ? 4 : 0,
    }}>
      <span style={{
        flex: 2.5, fontSize: bold ? 14 : 13,
        fontWeight: bold ? 700 : 500,
        color: bold ? C.forest : C.text,
        fontFamily: bold ? SERIF : FONT,
      }}>
        {label}
      </span>
      <span style={{
        flex: 1.2, fontSize: bold ? 14 : 13,
        fontWeight: bold ? 700 : 400,
        color: bold ? C.red : C.textLight,
        textAlign: 'right', fontFamily: FONT,
      }}>
        {formatValue(baseline)}
      </span>
      <span style={{ flex: 0.5, textAlign: 'center' }}>
        {unchanged
          ? <span style={{ color: C.textLight, fontSize: 12 }}>—</span>
          : improved ? <ArrowDown /> : <ArrowUp />
        }
      </span>
      <span style={{
        flex: 1.2, fontSize: bold ? 14 : 13,
        fontWeight: 700, color: scenarioColor,
        textAlign: 'right', fontFamily: FONT,
      }}>
        {formatValue(scenario)}
      </span>
      <span style={{
        flex: 1.2, fontSize: bold ? 13 : 12,
        fontWeight: 600, textAlign: 'right', fontFamily: FONT,
        color: impactColor,
      }}>
        {formatImpact()}
      </span>
    </div>
  )
}

// ─── DeltaView ────────────────────────────────────────────────────────────────

interface Props {
  baseline:       ScenarioBaseline
  scenario:       ScenarioResult
  delta:          ScenarioDelta
  isModified:     boolean
  changedFilters: string[]
}

export function DeltaView({ baseline, scenario, delta, isModified, changedFilters }: Props) {
  const gapDelta     = delta.gap
  const gapEliminated = baseline.gap > 0 && scenario.gap === 0

  const summaryTitle = gapEliminated
    ? 'Gap eliminated under this scenario'
    : gapDelta < 0
      ? `Gap reduced by ${fmt(Math.abs(gapDelta))}`
      : `Gap increased by ${fmt(gapDelta)}`

  const summaryBody = gapEliminated
    ? `By combining ${changedFilters.join(', ').toLowerCase()}, the client's funds of ${fmt(scenario.effectiveSavings)} exceed the safe target of ${fmt(scenario.safeTarget)}.`
    : gapDelta < 0
      ? `Monthly cost drops from ${fmt(baseline.monthly)} to ${fmt(scenario.monthly)}. Safe target drops from ${fmt(baseline.safeTarget)} to ${fmt(scenario.safeTarget)}. Remaining gap: ${fmt(scenario.gap)}.`
      : 'This scenario increases costs. Consider alternative combinations.'

  const summaryColor     = (gapEliminated || gapDelta < 0) ? C.accent : C.red
  const summaryBg        = (gapEliminated || gapDelta < 0) ? (gapEliminated ? '#ECFDF5' : '#F0FDF4') : '#FEF2F2'
  const summaryBorder    = (gapEliminated || gapDelta < 0) ? `${C.accent}40` : `${C.red}30`

  const headerBg = isModified ? '#F0FDF4' : '#F8FAFC'
  const gapBadgeBg = gapEliminated ? C.accent : gapDelta < 0 ? '#ECFDF5' : '#FEF2F2'
  const gapBadgeColor = gapEliminated ? C.white : gapDelta < 0 ? C.accent : C.red
  const gapBadgeLabel = gapEliminated ? '✓ Gap Eliminated' : gapDelta < 0 ? `Gap ↓ ${fmt(Math.abs(gapDelta))}` : `Gap ↑ ${fmt(gapDelta)}`

  return (
    <div style={{
      background: C.white, borderRadius: 14, border: `1px solid ${C.border}`,
      boxShadow: '0 1px 3px rgba(0,0,0,0.03)', overflow: 'hidden',
    }}>
      {/* Title bar */}
      <div style={{
        padding: '14px 24px', borderBottom: `1px solid ${C.border}`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: headerBg,
      }}>
        <div>
          <h3 style={{ fontFamily: SERIF, fontSize: 16, color: C.forest, margin: 0, fontWeight: 700 }}>
            Baseline vs Custom Scenario
          </h3>
          {isModified && (
            <div style={{ fontSize: 11, color: C.gray, marginTop: 2 }}>
              Changes: {changedFilters.join(' · ')}
            </div>
          )}
        </div>
        {isModified && (
          <div style={{
            padding: '4px 12px', borderRadius: 20,
            background: gapBadgeBg,
            fontSize: 12, fontWeight: 700, color: gapBadgeColor,
          }}>
            {gapBadgeLabel}
          </div>
        )}
      </div>

      {/* Table */}
      <div style={{ padding: '8px 24px 0' }}>
        {/* Column headers */}
        <div style={{
          display: 'flex', padding: '8px 0',
          borderBottom: `2px solid ${C.border}`,
        }}>
          {(['Metric', 'Baseline', '', 'Scenario', 'Impact'] as const).map((h, i) => (
            <span key={i} style={{
              flex: [2.5, 1.2, 0.5, 1.2, 1.2][i],
              fontSize: 10, fontWeight: 700, color: C.textLight,
              textTransform: 'uppercase', letterSpacing: 0.5,
              textAlign: i > 1 ? 'right' : 'left',
            }}>
              {h}
            </span>
          ))}
        </div>

        {/* Data rows */}
        <DeltaRow label="Monthly Rent"      baseline={baseline.rent}    scenario={scenario.rent} />
        <DeltaRow label="Monthly Transit"   baseline={baseline.transit} scenario={scenario.transit} />
        <DeltaRow label="Total Monthly"     baseline={baseline.monthly} scenario={scenario.monthly} />
        <DeltaRow label="Upfront Costs"     baseline={baseline.upfront} scenario={scenario.upfront} />
        <DeltaRow label="Runway"            baseline={baseline.runway}  scenario={scenario.runway} isMonths />
        <DeltaRow label="Available Savings" baseline={baseline.savings} scenario={scenario.effectiveSavings} positiveIsGood />
        <DeltaRow label="Safe Target"       baseline={baseline.safeTarget} scenario={scenario.safeTarget} />
        <DeltaRow label="Savings Gap"       baseline={baseline.gap}     scenario={scenario.gap} bold />
      </div>

      {/* Summary card */}
      {isModified && (
        <div style={{
          margin: '0 24px 24px',
          padding: '16px 20px', borderRadius: 12,
          background: summaryBg, border: `1px solid ${summaryBorder}`,
        }}>
          <div style={{
            fontSize: 14, fontWeight: 700, color: summaryColor,
            marginBottom: 4, fontFamily: SERIF,
          }}>
            {summaryTitle}
          </div>
          <div style={{ fontSize: 12, color: C.gray, lineHeight: 1.6 }}>
            {summaryBody}
          </div>
        </div>
      )}

      {/* Idle state */}
      {!isModified && (
        <div style={{ padding: '16px 24px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 12, color: C.textLight }}>
            Adjust the filters above to explore different scenarios. All changes recalculate instantly.
          </div>
        </div>
      )}
    </div>
  )
}
