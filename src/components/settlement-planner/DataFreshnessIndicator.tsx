'use client'

/**
 * Settlement Planner — Data Freshness Indicator (US-19.2)
 *
 * Case-header variant of the freshness bar that shows source names,
 * last-verified dates, and traffic-light dots.
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
  if (days < 30) return '#1B7A4A'   // green (accent)
  if (days < 90) return '#B8860B'   // amber (gold)
  return '#C41E3A'                   // red
}

function formatDate(isoDatetime: string): string {
  return new Date(isoDatetime).toLocaleDateString('en-CA', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

// ─── Component ────────────────────────────────────────────────────────────────

interface DataFreshnessIndicatorProps {
  /** All sources from the catalog (or a filtered subset). */
  sources:    Map<string, DataSource>
  /** Source keys to display. Deduped and 'user-input' is ignored. */
  sourceKeys: string[]
}

export function DataFreshnessIndicator({ sources, sourceKeys }: DataFreshnessIndicatorProps) {
  const uniqueKeys = [...new Set(sourceKeys)].filter(k => k !== 'user-input')

  const entries = uniqueKeys
    .map(key => sources.get(key))
    .filter((s): s is DataSource => Boolean(s))

  if (entries.length === 0) return null

  return (
    <div
      style={{
        display: 'flex', flexWrap: 'wrap', gap: '8px 14px',
        padding: '10px 16px',
        background: '#F8FAFC', borderRadius: 10, border: '1px solid #E5E7EB',
        marginTop: 16,
      }}
      aria-label="Data freshness indicator"
    >
      <span style={{
        fontSize: 10, fontWeight: 700, color: '#9CA3AF',
        textTransform: 'uppercase', letterSpacing: 0.5,
        alignSelf: 'center', whiteSpace: 'nowrap',
      }}>
        Data Sources
      </span>
      {entries.map(source => {
        const days  = daysSince(source.lastVerified)
        const color = freshnessColor(days)
        const date  = formatDate(source.lastVerified)
        return (
          <span
            key={source.key}
            title={`${source.name} — last verified ${source.lastVerified.slice(0, 10)}`}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap' }}
          >
            <span
              style={{
                display: 'inline-block', width: 8, height: 8,
                borderRadius: '50%', background: color, flexShrink: 0,
              }}
              aria-label={days < 30 ? 'Current' : days < 90 ? 'Review soon' : 'May be outdated'}
            />
            <span style={{ fontSize: 10, color: '#374151', fontWeight: 500 }}>{source.name}</span>
            <span style={{ fontSize: 9, color: '#9CA3AF' }}>{date}</span>
          </span>
        )
      })}
    </div>
  )
}
