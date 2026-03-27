'use client'

/**
 * Settlement Planner — Source Badge (US-18.2)
 *
 * Renders a colored pill badge for a data source catalog entry.
 * Badge text = short source name (e.g. "IRCC", "CMHC", "Transit").
 * Hover/focus reveals a tooltip matching the design comp:
 *   full source name · category label · effective date · verified date · "View source" link
 */

import { useState, useRef } from 'react'
import type { DataSource } from '@/lib/settlement-engine/types'

// ─── Category styles ──────────────────────────────────────────────────────────

const CATEGORY_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  regulatory:   { bg: '#ECFDF5', text: '#1B7A4A', label: 'Regulatory'   },
  authority:    { bg: '#EFF6FF', text: '#2563EB', label: 'Authority'     },
  estimate:     { bg: '#F3F4F6', text: '#6B7280', label: 'Estimate'      },
  'user-input': { bg: '#FFFBEB', text: '#B8860B', label: 'You provided'  },
}

// ─── Short label derived from source key ─────────────────────────────────────
// Maps the source catalog key prefix to a concise badge label.

function shortLabel(key: string): string {
  if (key.startsWith('ircc-'))    return 'IRCC'
  if (key.startsWith('cmhc-'))    return 'CMHC'
  if (key.startsWith('transit-')) return 'Transit'
  if (key === 'maple-estimate')   return 'Estimate'
  // Generic fallback: capitalise first segment
  return key.split('-')[0].toUpperCase()
}

// ─── Fallback: derive a basic badge when catalog lookup fails ─────────────────

const FALLBACK_LABEL: Record<string, { category: string; label: string }> = {
  ircc:               { category: 'regulatory', label: 'IRCC'         },
  cmhc:               { category: 'authority',  label: 'CMHC'         },
  provincial:         { category: 'authority',  label: 'Provincial'   },
  bank:               { category: 'authority',  label: 'Bank'         },
  'national-average': { category: 'authority',  label: 'National Avg' },
  constant:           { category: 'estimate',   label: 'Estimate'     },
  estimate:           { category: 'estimate',   label: 'Estimate'     },
  'user-input':       { category: 'user-input', label: 'You provided' },
}

// ─── Link icon ────────────────────────────────────────────────────────────────

const LinkIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ display: 'inline', verticalAlign: 'middle', marginLeft: 3 }}>
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
    <polyline points="15 3 21 3 21 9"/>
    <line x1="10" y1="14" x2="21" y2="3"/>
  </svg>
)

// ─── Component ────────────────────────────────────────────────────────────────

interface SourceBadgeProps {
  sourceKey: string
  sources: Map<string, DataSource>
  /** Legacy `source` string (e.g. "ircc", "cmhc") used as a fallback badge
   *  when the Sanity catalog hasn't been loaded or doesn't contain this key. */
  fallbackSource?: string
}

export function SourceBadge({ sourceKey, sources, fallbackSource }: SourceBadgeProps) {
  const [open, setOpen]       = useState(false)
  const closeTimer            = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Debounced close so the mouse can cross the gap between badge and tooltip
  // without the tooltip disappearing mid-traverse.
  const scheduleClose = () => {
    closeTimer.current = setTimeout(() => setOpen(false), 120)
  }
  const cancelClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
  }

  // Special case: user-provided data has no Sanity entry
  if (sourceKey === 'user-input') {
    const s = CATEGORY_STYLE['user-input']
    return (
      <span style={{
        background: s.bg, color: s.text, fontSize: 10,
        padding: '2px 8px', borderRadius: 4, fontWeight: 600,
        whiteSpace: 'nowrap', display: 'inline-block', letterSpacing: 0.3,
      }}>
        {s.label}
      </span>
    )
  }

  const source = sources.get(sourceKey)

  // Catalog not loaded or key not found — render a basic fallback badge
  if (!source) {
    const fb = (fallbackSource ? FALLBACK_LABEL[fallbackSource] : undefined) ?? FALLBACK_LABEL.estimate
    const s  = CATEGORY_STYLE[fb.category] ?? CATEGORY_STYLE.estimate
    return (
      <span style={{
        background: s.bg, color: s.text, fontSize: 10,
        padding: '2px 8px', borderRadius: 4, fontWeight: 600,
        whiteSpace: 'nowrap', display: 'inline-block', letterSpacing: 0.3,
      }}>
        {fb.label}
      </span>
    )
  }

  const s    = CATEGORY_STYLE[source.category] ?? CATEGORY_STYLE.estimate
  const badge = shortLabel(sourceKey)

  // Format dates for tooltip
  const effectiveFormatted = new Date(source.effectiveDate).toLocaleDateString('en-CA', {
    month: 'short', year: 'numeric',
  })
  const verifiedFormatted = new Date(source.lastVerified).toLocaleDateString('en-CA', {
    month: 'short', day: 'numeric', year: 'numeric',
  })

  return (
    <span
      style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}
      onFocus={cancelClose}
      onBlur={scheduleClose}
    >
      {/* ── Badge pill ──────────────────────────────────────────────────── */}
      <span
        style={{
          background: s.bg, color: s.text, fontSize: 10,
          padding: '2px 8px', borderRadius: 4, fontWeight: 600,
          whiteSpace: 'nowrap', cursor: 'default', display: 'inline-block',
          letterSpacing: 0.3,
        }}
        onMouseEnter={() => { cancelClose(); setOpen(true) }}
        onMouseLeave={scheduleClose}
      >
        {badge}
      </span>

      {/* ── Tooltip ─────────────────────────────────────────────────────── */}
      {open && (
        <div
          role="tooltip"
          onMouseEnter={cancelClose}
          onMouseLeave={scheduleClose}
          style={{
            position: 'absolute', bottom: 'calc(100% + 8px)', left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 50, width: 260, background: '#fff',
            border: '1px solid #E5E7EB', borderRadius: 10,
            boxShadow: '0 4px 16px rgba(0,0,0,0.10)', padding: '12px 16px',
            fontFamily: "'DM Sans', Helvetica, sans-serif",
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 4, lineHeight: 1.4 }}>
            {source.name}
          </div>
          <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 2 }}>
            Category: {s.label}
          </div>
          <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 2 }}>
            Effective: {effectiveFormatted}
          </div>
          <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 6 }}>
            Verified: {verifiedFormatted}
          </div>
          <a
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: 11, color: '#2563EB', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}
          >
            View source <LinkIcon />
          </a>
        </div>
      )}
    </span>
  )
}
