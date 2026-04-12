/**
 * CountryDataHealthDashboard — US-3.7
 *
 * Studio-only custom structure pane. Displays freshness and completeness of
 * all countryCosts documents so the data-ops team can prioritise refresh work.
 *
 * ─── Refresh Cadence SLA ─────────────────────────────────────────────────────
 * Status        Threshold                  Action
 * Fresh         ≤ 90 days                  None — data is current.
 * Needs Review  91–180 days                Schedule review before the next
 *                                          quarterly cycle.
 * Stale         > 180 days  OR  no date    Refresh required. Do not publish
 *                                          affected pathways until effectiveDate
 *                                          is updated.
 * Pending       isSeeded = false           Initial research required before
 *                                          this country can be enabled in the
 *                                          wizard.
 *
 * Quarterly review windows: first week of January, April, July, and October.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useClient } from 'sanity'
import { useRouter } from 'sanity/router'
import { Badge, Box, Button, Card, Flex, Spinner, Stack, Text } from '@sanity/ui'

// ─── Thresholds ───────────────────────────────────────────────────────────────
const FRESH_DAYS = 90
const STALE_DAYS = 180

// ─── Types ────────────────────────────────────────────────────────────────────
type Status = 'fresh' | 'needs-review' | 'stale' | 'pending'

interface RawDoc {
  _id: string
  iso: string
  countryName?: string
  flag?: string
  isSeeded: boolean
  effectiveDate?: string
}

interface CountryRow {
  _id: string
  iso: string
  countryName: string
  flag: string | null
  isSeeded: boolean
  effectiveDate: string | null
  ageDays: number | null
  status: Status
}

// ─── Pure helpers ─────────────────────────────────────────────────────────────
function ageInDays(dateStr: string | null): number | null {
  if (!dateStr) return null
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000)
}

function deriveStatus(isSeeded: boolean, ageDays: number | null): Status {
  if (!isSeeded) return 'pending'
  if (ageDays === null) return 'stale'
  if (ageDays <= FRESH_DAYS) return 'fresh'
  if (ageDays <= STALE_DAYS) return 'needs-review'
  return 'stale'
}

function statusTone(s: Status): 'positive' | 'caution' | 'critical' | 'default' {
  if (s === 'fresh') return 'positive'
  if (s === 'needs-review') return 'caution'
  if (s === 'stale') return 'critical'
  return 'default'
}

function statusLabel(s: Status): string {
  if (s === 'fresh') return 'Fresh'
  if (s === 'needs-review') return 'Needs Review'
  if (s === 'stale') return 'Stale'
  return 'Pending'
}

function toCSV(rows: CountryRow[]): string {
  const header = ['Flag', 'Country', 'ISO', 'Seeded', 'Effective Date', 'Age (days)', 'Status'].join(',')
  const lines = rows.map((r) =>
    [
      r.flag ?? '',
      `"${(r.countryName ?? '').replace(/"/g, '""')}"`,
      r.iso,
      r.isSeeded ? 'Yes' : 'No',
      r.effectiveDate ?? '',
      r.ageDays !== null ? String(r.ageDays) : '',
      statusLabel(r.status),
    ].join(','),
  )
  return [header, ...lines].join('\n')
}

// ─── GROQ ─────────────────────────────────────────────────────────────────────
const GROQ_QUERY = `*[_type == "countryCosts"] | order(countryName asc) {
  _id, iso, countryName, flag, isSeeded, effectiveDate
}`

// ─── Shared cell style ────────────────────────────────────────────────────────
const tdBase: React.CSSProperties = { padding: '8px 12px' }

// ─── Component ────────────────────────────────────────────────────────────────
export function CountryDataHealthDashboard() {
  const client = useClient({ apiVersion: '2026-03-06' })
  const router = useRouter()

  const [rows, setRows] = useState<CountryRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterNeedsRefresh, setFilterNeedsRefresh] = useState(false)

  // ─── Fetch ───────────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    client
      .fetch<RawDoc[]>(GROQ_QUERY)
      .then((docs) => {
        if (cancelled) return
        const mapped = docs.map((d): CountryRow => {
          const age = ageInDays(d.effectiveDate ?? null)
          return {
            _id:          d._id,
            iso:          d.iso,
            countryName:  d.countryName ?? d.iso,
            flag:         d.flag ?? null,
            isSeeded:     !!d.isSeeded,
            effectiveDate: d.effectiveDate ?? null,
            ageDays:      age,
            status:       deriveStatus(!!d.isSeeded, age),
          }
        })
        setRows(mapped)
        setLoading(false)
      })
      .catch((err: Error) => {
        if (cancelled) return
        setError(err.message)
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [client])

  // ─── Derived ─────────────────────────────────────────────────────────────
  const visible = useMemo(
    () =>
      filterNeedsRefresh
        ? rows.filter((r) => r.status === 'stale' || r.status === 'needs-review')
        : rows,
    [rows, filterNeedsRefresh],
  )

  const counts = useMemo(
    () => ({
      total:       rows.length,
      fresh:       rows.filter((r) => r.status === 'fresh').length,
      needsReview: rows.filter((r) => r.status === 'needs-review').length,
      stale:       rows.filter((r) => r.status === 'stale').length,
      pending:     rows.filter((r) => r.status === 'pending').length,
    }),
    [rows],
  )

  // ─── Handlers ────────────────────────────────────────────────────────────
  const handleRowClick = useCallback(
    (id: string) => {
      router.navigateIntent('edit', { id, type: 'countryCosts' })
    },
    [router],
  )

  const handleExportCSV = useCallback(() => {
    const csv = toCSV(visible)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `country-data-health-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [visible])

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <Box padding={4} style={{ overflowY: 'auto', height: '100%' }}>
      <Stack space={4}>
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <Flex align="center" justify="space-between" wrap="wrap" gap={3}>
          <Stack space={1}>
            <Text size={3} weight="bold">Country Data Health</Text>
            <Text size={1} muted>
              Freshness and completeness of all countryCosts documents.
            </Text>
          </Stack>
          <Flex gap={2} align="center" wrap="wrap">
            <Button
              fontSize={1}
              mode="ghost"
              tone={filterNeedsRefresh ? 'default' : 'caution'}
              text={filterNeedsRefresh ? 'Show All Countries' : 'Needs Refresh Only'}
              onClick={() => setFilterNeedsRefresh((f) => !f)}
            />
            <Button
              fontSize={1}
              mode="ghost"
              tone="primary"
              text="Export CSV"
              onClick={handleExportCSV}
              disabled={visible.length === 0}
            />
          </Flex>
        </Flex>

        {/* ── Summary badges ──────────────────────────────────────────────── */}
        {!loading && !error && (
          <Flex gap={2} wrap="wrap">
            <Badge>{counts.total} Total</Badge>
            <Badge tone="positive">{counts.fresh} Fresh</Badge>
            <Badge tone="caution">{counts.needsReview} Needs Review</Badge>
            <Badge tone="critical">{counts.stale} Stale</Badge>
            <Badge>{counts.pending} Pending</Badge>
          </Flex>
        )}

        {/* ── SLA callout ─────────────────────────────────────────────────── */}
        <Card tone="primary" border padding={3} radius={2}>
          <Stack space={2}>
            <Text size={1} weight="semibold">Refresh Cadence SLA</Text>
            <Text size={1}>
              <strong>Fresh</strong> (≤{FRESH_DAYS} days) — No action needed.{' '}
              <strong>Needs Review</strong> ({FRESH_DAYS + 1}–{STALE_DAYS} days) — Schedule review before next
              quarterly cycle.{' '}
              <strong>Stale</strong> (&gt;{STALE_DAYS} days or no date) — Refresh required; block pathway publish
              until effectiveDate is updated.{' '}
              <strong>Pending</strong> — Initial data research required before wizard enablement.
            </Text>
            <Text size={1} muted>
              Quarterly review windows: first week of January, April, July, and October.
            </Text>
          </Stack>
        </Card>

        {/* ── Loading ─────────────────────────────────────────────────────── */}
        {loading && (
          <Flex justify="center" padding={6}>
            <Spinner muted />
          </Flex>
        )}

        {/* ── Error ───────────────────────────────────────────────────────── */}
        {error && (
          <Card tone="critical" border padding={3} radius={2}>
            <Text size={1}>Failed to load country data: {error}</Text>
          </Card>
        )}

        {/* ── Empty state ─────────────────────────────────────────────────── */}
        {!loading && !error && visible.length === 0 && (
          <Card border padding={5} radius={2}>
            <Text size={1} muted align="center">
              {filterNeedsRefresh
                ? 'No countries need refresh — all data is current.'
                : 'No country records found.'}
            </Text>
          </Card>
        )}

        {/* ── Table ───────────────────────────────────────────────────────── */}
        {!loading && !error && visible.length > 0 && (
          <Card border radius={2} overflow="auto">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--card-border-color)' }}>
                  {(
                    [
                      { label: 'Flag',          align: 'left'  },
                      { label: 'Country',       align: 'left'  },
                      { label: 'ISO',           align: 'left'  },
                      { label: 'Seeded',        align: 'left'  },
                      { label: 'Effective Date',align: 'left'  },
                      { label: 'Age (days)',    align: 'right' },
                      { label: 'Status',        align: 'left'  },
                    ] as const
                  ).map(({ label, align }) => (
                    <th
                      key={label}
                      style={{
                        ...tdBase,
                        textAlign: align,
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                        color: 'var(--card-muted-fg-color)',
                        fontSize: '11px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                      }}
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visible.map((row) => (
                  <tr
                    key={row._id}
                    onClick={() => handleRowClick(row._id)}
                    style={{
                      borderBottom: '1px solid var(--card-border-color)',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--card-muted-bg-color)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = ''
                    }}
                  >
                    {/* Flag */}
                    <td style={{ ...tdBase, fontSize: '20px', lineHeight: '1' }}>
                      {row.flag ?? '—'}
                    </td>

                    {/* Country */}
                    <td style={{ ...tdBase, fontWeight: 500 }}>{row.countryName}</td>

                    {/* ISO */}
                    <td
                      style={{
                        ...tdBase,
                        fontFamily: 'monospace',
                        color: 'var(--card-muted-fg-color)',
                        fontSize: '12px',
                      }}
                    >
                      {row.iso}
                    </td>

                    {/* Seeded */}
                    <td style={{ ...tdBase, color: row.isSeeded ? 'var(--green-500)' : 'var(--card-muted-fg-color)' }}>
                      {row.isSeeded ? '✓' : '—'}
                    </td>

                    {/* Effective Date */}
                    <td style={{ ...tdBase, whiteSpace: 'nowrap' }}>
                      {row.effectiveDate ?? '—'}
                    </td>

                    {/* Age */}
                    <td style={{ ...tdBase, textAlign: 'right' }}>
                      {row.ageDays !== null ? row.ageDays : '—'}
                    </td>

                    {/* Status */}
                    <td style={tdBase}>
                      <Badge tone={statusTone(row.status)} fontSize={0}>
                        {statusLabel(row.status)}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}

        {/* ── Footer ──────────────────────────────────────────────────────── */}
        {!loading && !error && rows.length > 0 && (
          <Text size={0} muted>
            Showing {visible.length} of {rows.length} countries.
            {filterNeedsRefresh && ` ${rows.length - visible.length} fresh/pending records hidden.`}
          </Text>
        )}
      </Stack>
    </Box>
  )
}
