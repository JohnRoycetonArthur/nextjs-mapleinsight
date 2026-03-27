'use client'

/**
 * Settlement Planner — Data Freshness Bar (US-18.2)
 *
 * Renders a compact row of traffic-light dots for a set of data source keys,
 * summarising how recently each source was verified.
 *
 * Traffic-light rules (days since lastVerified):
 *   green  < 30 days
 *   amber  30–90 days
 *   red    > 90 days
 */

import type { DataSource } from '@/lib/settlement-engine/types'

// ─── helpers ──────────────────────────────────────────────────────────────────

function daysSince(isoDatetime: string): number {
  const verified = new Date(isoDatetime).getTime()
  const now      = Date.now()
  return Math.floor((now - verified) / 86_400_000)
}

function freshnessColor(days: number): string {
  if (days < 30) return '#22C55E'   // green
  if (days < 90) return '#F59E0B'   // amber
  return '#EF4444'                   // red
}

function freshnessLabel(days: number): string {
  if (days < 30) return 'Current'
  if (days < 90) return 'Review soon'
  return 'May be outdated'
}

// ─── Component ────────────────────────────────────────────────────────────────

interface DataFreshnessBarProps {
  /** All sources fetched from the catalog. */
  sources: Map<string, DataSource>
  /** Source keys relevant to this section (deduped automatically). */
  sourceKeys: string[]
}

export function DataFreshnessBar({ sources, sourceKeys }: DataFreshnessBarProps) {
  // Deduplicate, skip 'user-input' pseudo-key
  const uniqueKeys = [...new Set(sourceKeys)].filter(k => k !== 'user-input')

  const entries = uniqueKeys
    .map(key => sources.get(key))
    .filter((s): s is DataSource => Boolean(s))

  if (entries.length === 0) return null

  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', flexWrap: 'wrap',
        gap: '6px 12px', padding: '6px 10px',
        background: '#F9FAFB', border: '1px solid #E5E7EB',
        borderRadius: 8, marginBottom: 10,
      }}
      aria-label="Data freshness indicator"
    >
      <span style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', letterSpacing: 0.5, whiteSpace: 'nowrap' }}>
        DATA SOURCES
      </span>
      {entries.map(source => {
        const days  = daysSince(source.lastVerified)
        const color = freshnessColor(days)
        const label = freshnessLabel(days)
        return (
          <span
            key={source.key}
            title={`${source.name} — ${label} (verified ${source.lastVerified.slice(0, 10)})`}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#374151', whiteSpace: 'nowrap' }}
          >
            <span
              style={{
                display: 'inline-block', width: 7, height: 7,
                borderRadius: '50%', background: color, flexShrink: 0,
              }}
              aria-label={label}
            />
            {source.name}
          </span>
        )
      })}
    </div>
  )
}
