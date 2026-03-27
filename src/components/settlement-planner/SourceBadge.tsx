'use client'

/**
 * Settlement Planner — Source Badge (US-18.2)
 *
 * Renders a colored pill badge for a data source catalog entry.
 * Hover/focus reveals a tooltip with source name, URL, and freshness dates.
 */

import { useState } from 'react'
import type { DataSource } from '@/lib/settlement-engine/types'

// ─── Category styles ──────────────────────────────────────────────────────────

const CATEGORY_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  regulatory:   { bg: '#ECFDF5', text: '#1B7A4A', label: 'Regulatory'   },
  authority:    { bg: '#EFF6FF', text: '#2563EB', label: 'Authority'     },
  estimate:     { bg: '#F3F4F6', text: '#6B7280', label: 'Estimate'      },
  'user-input': { bg: '#FFFBEB', text: '#B8860B', label: 'You provided'  },
}

// ─── Component ────────────────────────────────────────────────────────────────

interface SourceBadgeProps {
  sourceKey: string
  sources: Map<string, DataSource>
}

export function SourceBadge({ sourceKey, sources }: SourceBadgeProps) {
  const [open, setOpen] = useState(false)

  // Special case: user-provided data has no Sanity entry
  if (sourceKey === 'user-input') {
    const s = CATEGORY_STYLE['user-input']
    return (
      <span
        style={{ background: s.bg, color: s.text, fontSize: 10, padding: '1px 8px', borderRadius: 10, fontWeight: 600, whiteSpace: 'nowrap', display: 'inline-block' }}
      >
        {s.label}
      </span>
    )
  }

  const source = sources.get(sourceKey)
  if (!source) return null

  const s = CATEGORY_STYLE[source.category] ?? CATEGORY_STYLE.estimate

  return (
    <span
      style={{ position: 'relative', display: 'inline-block' }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      <span
        style={{
          background: s.bg, color: s.text, fontSize: 10,
          padding: '1px 8px', borderRadius: 10, fontWeight: 600,
          whiteSpace: 'nowrap', cursor: 'default', display: 'inline-block',
        }}
      >
        {s.label}
      </span>

      {open && (
        <div
          role="tooltip"
          style={{
            position: 'absolute', bottom: 'calc(100% + 6px)', left: 0,
            zIndex: 50, width: 260, background: '#fff',
            border: '1px solid #E5E7EB', borderRadius: 10,
            boxShadow: '0 4px 16px rgba(0,0,0,0.12)', padding: '10px 12px',
            pointerEvents: 'none',
          }}
        >
          <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: 12, color: '#111827', lineHeight: 1.4 }}>
            {source.name}
          </p>
          <p style={{ margin: '0 0 6px', fontSize: 11 }}>
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#2563EB', textDecoration: 'underline', wordBreak: 'break-all' }}
              onClick={e => e.stopPropagation()}
            >
              {source.url}
            </a>
          </p>
          <p style={{ margin: 0, fontSize: 11, color: '#6B7280' }}>
            Effective: <strong style={{ color: '#374151' }}>{source.effectiveDate}</strong>
          </p>
          <p style={{ margin: 0, fontSize: 11, color: '#6B7280' }}>
            Verified: <strong style={{ color: '#374151' }}>{source.lastVerified.slice(0, 10)}</strong>
          </p>
          {source.notes && (
            <p style={{ margin: '6px 0 0', fontSize: 10, color: '#9CA3AF', lineHeight: 1.5 }}>
              {source.notes}
            </p>
          )}
        </div>
      )}
    </span>
  )
}
