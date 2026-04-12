'use client'

/**
 * LiveCostImpactPreview — US-3.6
 *
 * Right-rail component for Step 1 of the wizard.
 * Shows how medical exam, PCC, and language test costs change when the
 * user selects a country of origin. Matches the design comp CostImpactPreview.
 *
 * Fetches country costs from Sanity via fetchCountryCosts when iso changes.
 * Sub-500ms recompute target met: pure client-side state update on selection.
 */

import { useEffect, useState } from 'react'
import { fetchCountryCosts, ZZ_FALLBACK, type CountryCosts } from '@/lib/settlement-engine/fetchCountryCosts'
import { C, FONT, SERIF } from './constants'

// ─── Baseline (ZZ fallback) ───────────────────────────────────────────────────

const BASELINE = {
  medical:  ZZ_FALLBACK.medicalExamCAD,
  pcc:      ZZ_FALLBACK.pccCAD,
  language: ZZ_FALLBACK.languageTestCAD,
}

// ─── Icons ────────────────────────────────────────────────────────────────────

const MapleLeaf = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill={C.red} aria-hidden="true">
    <path d="M12 0L13.5 6.5L17 4L15.5 8.5L22 9L17 12L20 16L14 14L12 24L10 14L4 16L7 12L2 9L8.5 8.5L7 4L10.5 6.5Z"/>
  </svg>
)

const TrendUp = () => (
  <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
    <polyline points="17 6 23 6 23 12"/>
  </svg>
)

const TrendDown = () => (
  <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/>
    <polyline points="17 18 23 18 23 12"/>
  </svg>
)

const AlertTriangle = () => (
  <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
)

const InfoIcon = () => (
  <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="16" x2="12" y2="12"/>
    <line x1="12" y1="8" x2="12.01" y2="8"/>
  </svg>
)

// ─── Delta row ────────────────────────────────────────────────────────────────

function DeltaRow({ label, value, baseline }: { label: string; value: number; baseline: number }) {
  const diff    = value - baseline
  const up      = diff > 0
  const neutral = diff === 0
  const color   = neutral ? C.textLight : up ? C.red : C.accent

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '11px 0', borderBottom: `1px solid ${C.border}`,
    }}>
      <span style={{ fontSize: 13, color: C.text, fontFamily: FONT }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: C.text, fontFamily: FONT, fontVariantNumeric: 'tabular-nums' }}>
          CAD ${value.toLocaleString()}
        </span>
        {!neutral && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 2, color, fontSize: 11, fontWeight: 600, fontFamily: FONT, minWidth: 48, justifyContent: 'flex-end' }}>
            {up ? <TrendUp /> : <TrendDown />}
            {up ? '+' : ''}{diff}
          </span>
        )}
        {neutral && <span style={{ minWidth: 48 }} />}
      </div>
    </div>
  )
}

// ─── LiveCostImpactPreview ────────────────────────────────────────────────────

interface Props {
  /** Currently selected ISO 3166-1 alpha-2 code. Empty = no selection. */
  iso: string
}

export function LiveCostImpactPreview({ iso }: Props) {
  const [costs,   setCosts]   = useState<CountryCosts | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!iso) {
      setCosts(null)
      return
    }
    setLoading(true)
    fetchCountryCosts(iso)
      .then(c => { setCosts(c); setLoading(false) })
      .catch(() => { setCosts(ZZ_FALLBACK); setLoading(false) })
  }, [iso])

  const isSeeded   = costs && costs.iso !== 'ZZ'
  const isFallback = costs && costs.iso === 'ZZ'

  const medical  = costs?.medicalExamCAD  ?? BASELINE.medical
  const pcc      = costs?.pccCAD          ?? BASELINE.pcc
  const language = costs?.languageTestCAD ?? BASELINE.language
  const total    = medical + pcc + language
  const baseline = BASELINE.medical + BASELINE.pcc + BASELINE.language
  const delta    = total - baseline

  return (
    <div style={{
      background: C.white, borderRadius: 16, padding: 22,
      border: `1px solid ${C.border}`,
      boxShadow: '0 1px 3px rgba(15,23,42,0.05)',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <MapleLeaf />
        <span style={{ fontSize: 10, fontWeight: 700, color: C.forest, fontFamily: FONT, letterSpacing: 0.6, textTransform: 'uppercase' }}>
          Live Cost Impact
        </span>
      </div>
      <div style={{ fontSize: 17, fontWeight: 700, color: C.text, fontFamily: SERIF, marginBottom: 4 }}>
        Costs that vary by country
      </div>
      <div style={{ fontSize: 12, color: C.textLight, fontFamily: FONT, marginBottom: 16, lineHeight: 1.5 }}>
        These three costs change based on where you're applying from.
        {!iso && ' Select a country to see your estimate.'}
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ padding: '16px 0', textAlign: 'center', color: C.textLight, fontSize: 13, fontFamily: FONT }}>
          Loading country data…
        </div>
      )}

      {/* Fallback warning */}
      {!loading && isFallback && iso && (
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: 8,
          padding: '9px 12px', background: '#FEF3C7', borderRadius: 8,
          color: '#D97706', fontSize: 12, fontFamily: FONT, marginBottom: 12, lineHeight: 1.5,
        }}>
          <div style={{ paddingTop: 1, flexShrink: 0 }}><AlertTriangle /></div>
          <div>
            <strong>Country data pending.</strong> Using conservative newcomer averages — your actual costs may vary.
          </div>
        </div>
      )}

      {/* Rows */}
      {!loading && (
        <>
          <DeltaRow label="Medical exam (panel physician)"          value={medical}  baseline={BASELINE.medical}  />
          <DeltaRow label="Police Clearance Certificate (PCC)"      value={pcc}      baseline={BASELINE.pcc}      />
          <DeltaRow label={`${costs?.languageTestProvider ?? 'Language'} test`} value={language} baseline={BASELINE.language} />
        </>
      )}

      {/* Total strip */}
      {!loading && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginTop: 14, padding: '12px 14px',
          background: delta === 0 ? C.lightGray : delta > 0 ? '#FEE2E2' : '#DCFCE7',
          borderRadius: 10,
        }}>
          <div>
            <div style={{ fontSize: 10, color: C.textLight, fontFamily: FONT, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Total — {iso && costs?.iso !== 'ZZ' ? (costs?.countryName ?? iso) : iso ? 'Estimate' : 'Baseline'}
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: C.text, fontFamily: SERIF, fontVariantNumeric: 'tabular-nums' }}>
              CAD ${total.toLocaleString()}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 10, color: C.textLight, fontFamily: FONT, textTransform: 'uppercase', letterSpacing: 0.5 }}>vs baseline</div>
            <div style={{
              fontSize: 15, fontWeight: 700,
              color: delta === 0 ? C.gray : delta > 0 ? C.red : C.accent,
              fontFamily: FONT, fontVariantNumeric: 'tabular-nums',
            }}>
              {delta > 0 ? '+' : ''}{delta !== 0 ? `CAD $${delta}` : '—'}
            </div>
          </div>
        </div>
      )}

      {/* Source note */}
      {!loading && isSeeded && (
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: 6, marginTop: 14,
          fontSize: 11, color: C.textLight, fontFamily: FONT, lineHeight: 1.5,
        }}>
          <div style={{ paddingTop: 1, flexShrink: 0 }}><InfoIcon /></div>
          <div>
            Data sourced from IRCC panel physician listings, local police bureaus, and official language test centre fees.
          </div>
        </div>
      )}
    </div>
  )
}
