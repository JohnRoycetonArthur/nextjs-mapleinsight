'use client'

/**
 * CountrySearch — US-3.1 AC-1..5
 *
 * Searchable dropdown for country of origin selection.
 * - Fetches country list from /api/countries on mount
 * - Filters by name or ISO on keystroke
 * - Shows DATA PENDING badge for unseeded countries
 * - Stores ISO 3166-1 alpha-2 code in session (AC-3)
 * - Required field — shows "REQUIRED" label and error state
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import type { CountryRecord } from '@/lib/settlement-engine/countries-stub'
import { C, FONT } from './constants'

// ─── Icons ────────────────────────────────────────────────────────────────────

const SearchIcon = ({ color = C.textLight }: { color?: string }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="11" cy="11" r="8"/>
    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
)

const CheckIcon = ({ color = C.accent }: { color?: string }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)

const ChevronDown = ({ open }: { open: boolean }) => (
  <svg
    width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke={C.textLight} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true"
    style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
  >
    <polyline points="6 9 12 15 18 9"/>
  </svg>
)

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  /** Currently selected ISO 3166-1 alpha-2 code (empty string = unset) */
  value:    string
  onChange: (iso: string) => void
  /** Error message from WizardShell validation */
  error?:   string
}

// ─── CountrySearch ────────────────────────────────────────────────────────────

export function CountrySearch({ value, onChange, error }: Props) {
  const [countries, setCountries]   = useState<CountryRecord[]>([])
  const [loading,   setLoading]     = useState(true)
  const [open,      setOpen]        = useState(false)
  const [query,     setQuery]       = useState('')
  const [inputFocused, setInputFocused] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef     = useRef<HTMLInputElement>(null)

  // Fetch country list on mount
  useEffect(() => {
    fetch('/api/countries')
      .then(r => r.json())
      .then((data: CountryRecord[]) => {
        setCountries(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Focus search input when dropdown opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 30)
    }
  }, [open])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return countries
    return countries.filter(
      c => c.name.toLowerCase().includes(q) || c.iso.toLowerCase() === q,
    )
  }, [query, countries])

  const selected = countries.find(c => c.iso === value)

  const triggerBorderColor = error
    ? C.red
    : open || inputFocused
    ? C.accent
    : C.border

  const triggerShadow = open
    ? `0 0 0 3px ${C.accent}18`
    : error
    ? `0 0 0 3px ${C.red}18`
    : 'none'

  return (
    <div ref={containerRef} style={{ position: 'relative', maxWidth: 520 }}>

      {/* ── Trigger button ──────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={selected ? `Country of origin: ${selected.name}` : 'Select country of origin'}
        aria-invalid={!!error}
        style={{
          width: '100%',
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '14px 16px', borderRadius: 12,
          border: `1px solid ${triggerBorderColor}`,
          background: C.white, cursor: 'pointer',
          boxShadow: triggerShadow,
          transition: 'border-color .2s, box-shadow .2s',
          fontFamily: FONT,
          textAlign: 'left',
        }}
      >
        <SearchIcon color={selected ? C.text : C.textLight} />

        {selected ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
            <span style={{ fontSize: 22, lineHeight: 1 }}>{selected.flag}</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: C.text, fontFamily: FONT }}>{selected.name}</span>
            <span style={{ fontSize: 11, color: C.textLight, fontFamily: FONT, letterSpacing: 0.4 }}>{selected.iso}</span>
          </div>
        ) : (
          <span style={{ fontSize: 14, color: C.textLight, fontFamily: FONT, flex: 1 }}>
            {loading ? 'Loading countries…' : 'Search for your country of origin…'}
          </span>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <span style={{ fontSize: 11, color: C.red, fontWeight: 700, fontFamily: FONT }}>REQUIRED</span>
          <ChevronDown open={open} />
        </div>
      </button>

      {/* ── Dropdown ─────────────────────────────────────────────────────── */}
      {open && (
        <div
          role="listbox"
          aria-label="Country list"
          style={{
            position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
            background: C.white, borderRadius: 12, border: `1px solid ${C.border}`,
            boxShadow: '0 12px 32px rgba(15,23,42,0.12)', zIndex: 30,
            maxHeight: 340, overflow: 'hidden', display: 'flex', flexDirection: 'column',
          }}
        >
          {/* Search input */}
          <div style={{ padding: 10, borderBottom: `1px solid ${C.border}` }}>
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              placeholder="Type a country name…"
              aria-label="Search countries"
              style={{
                width: '100%', padding: '10px 12px', borderRadius: 8,
                border: `1px solid ${C.border}`, fontSize: 14,
                fontFamily: FONT, color: C.text, outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Results list */}
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {filtered.length === 0 && (
              <div style={{ padding: 24, textAlign: 'center', color: C.textLight, fontSize: 13, fontFamily: FONT }}>
                No matches. Try a different spelling.
              </div>
            )}
            {filtered.map(c => (
              <div
                key={c.iso}
                role="option"
                aria-selected={value === c.iso}
                onClick={() => { onChange(c.iso); setOpen(false); setQuery('') }}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { onChange(c.iso); setOpen(false); setQuery('') } }}
                tabIndex={0}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 16px', cursor: 'pointer',
                  background: value === c.iso ? `${C.accent}12` : 'transparent',
                  transition: 'background .12s',
                }}
                onMouseEnter={e => { if (value !== c.iso) (e.currentTarget as HTMLElement).style.background = C.lightGray }}
                onMouseLeave={e => { if (value !== c.iso) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
              >
                <span style={{ fontSize: 22, lineHeight: 1, flexShrink: 0 }}>{c.flag}</span>
                <span style={{ flex: 1, fontSize: 14, color: C.text, fontFamily: FONT }}>{c.name}</span>
                {!c.isSeeded && (
                  <span style={{
                    fontSize: 10, fontWeight: 700, color: '#D97706',
                    background: '#FEF3C7', padding: '3px 8px', borderRadius: 4,
                    fontFamily: FONT, letterSpacing: 0.3, whiteSpace: 'nowrap',
                  }}>DATA PENDING</span>
                )}
                {value === c.iso && <CheckIcon color={C.accent} />}
              </div>
            ))}
          </div>

          {/* Footer */}
          <div style={{
            padding: '8px 16px', borderTop: `1px solid ${C.border}`,
            fontSize: 11, color: C.textLight, fontFamily: FONT,
            background: C.lightGray,
          }}>
            {countries.filter(c => c.isSeeded).length} of {countries.length} countries fully seeded.
            Others use conservative estimates.
          </div>
        </div>
      )}

      {/* ── Error message ─────────────────────────────────────────────────── */}
      {error && (
        <p role="alert" style={{ fontSize: 12, color: C.red, margin: '6px 0 0', fontFamily: FONT }}>
          {error}
        </p>
      )}
    </div>
  )
}
