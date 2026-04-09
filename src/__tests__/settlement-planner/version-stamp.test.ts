/**
 * VersionStamp — Unit and Snapshot Tests (US-1.4)
 *
 * 1. Verifies version.ts exports ENGINE_VERSION and DATA_VERSION with correct format.
 * 2. Renders VersionStamp to static HTML and asserts expected strings appear.
 * 3. Snapshot tests for the PDF cover page version stamp.
 */

import { renderToStaticMarkup } from 'react-dom/server'
import React from 'react'
import { ENGINE_VERSION, DATA_VERSION } from '@/lib/settlement-engine/version'

// ─── 1. version.ts exports ────────────────────────────────────────────────────

describe('version.ts exports', () => {
  it('exports ENGINE_VERSION as a semver string', () => {
    expect(ENGINE_VERSION).toMatch(/^\d+\.\d+\.\d+$/)
  })

  it('exports DATA_VERSION as a source:date composite string', () => {
    // Convention: "source:YYYY-MM-DD" or "source:YYYY-MM"
    expect(DATA_VERSION).toMatch(/^[a-z]+:\d{4}-\d{2}/)
  })

  it('ENGINE_VERSION is re-exported from constants.ts without changing the value', async () => {
    const { ENGINE_VERSION: cv } = await import('@/lib/settlement-engine/constants')
    expect(cv).toBe(ENGINE_VERSION)
  })
})

// ─── 2. VersionStamp render ───────────────────────────────────────────────────

describe('VersionStamp component', () => {
  // Lazy-import to avoid 'use client' directive issues with ts-jest
  it('renders engine version text', async () => {
    const { VersionStamp } = await import('@/components/settlement-planner/VersionStamp')
    const html = renderToStaticMarkup(React.createElement(VersionStamp))
    expect(html).toContain(`Engine v${ENGINE_VERSION}`)
  })

  it('renders data version text', async () => {
    const { VersionStamp } = await import('@/components/settlement-planner/VersionStamp')
    const html = renderToStaticMarkup(React.createElement(VersionStamp))
    expect(html).toContain(DATA_VERSION)
  })

  it('accepts explicit version overrides', async () => {
    const { VersionStamp } = await import('@/components/settlement-planner/VersionStamp')
    const html = renderToStaticMarkup(
      React.createElement(VersionStamp, {
        engineVersion: '9.9.9',
        dataVersion:   'ircc:2030-01-01',
      }),
    )
    expect(html).toContain('Engine v9.9.9')
    expect(html).toContain('ircc:2030-01-01')
  })

  it('includes aria-label for accessibility', async () => {
    const { VersionStamp } = await import('@/components/settlement-planner/VersionStamp')
    const html = renderToStaticMarkup(React.createElement(VersionStamp))
    expect(html).toContain('aria-label')
    expect(html).toContain('Engine version')
    expect(html).toContain('data version')
  })
})

// ─── 3. PDF cover page snapshot ───────────────────────────────────────────────

import { renderPdfTemplate } from '@/lib/settlement-engine/pdf-template'
import type { MapleReportPackage } from '@/lib/settlement-engine/export'

function makeMinimalPackage(overrides: Partial<MapleReportPackage> = {}): MapleReportPackage {
  return {
    schemaVersion: '1.0',
    engineVersion: '1.0.0',
    dataVersion:   'ircc:2025-07-07',
    generatedAt:   '2026-04-08T00:00:00.000Z',
    consultant:    null,
    answers: {
      adults:    1,
      children:  0,
      pathway:   'express_entry',
      city:      'toronto',
      province:  'ON',
      housing:   '1br',
      jobStatus: 'no_offer',
      studyPermit: null,
    },
    engineInput: {
      pathway:           'express-entry-fsw',
      liquidSavings:     12_000,
      province:          'ON',
      city:              'toronto',
      household:         { adults: 1, children: 0 },
      housing:           '1br',
      jobStatus:         'none',
      monthlyObligations: 0,
    } as MapleReportPackage['engineInput'],
    results: {
      upfront:           8_000,
      monthlyMin:        2_500,
      monthlySafe:       3_000,
      safeSavingsTarget: 20_000,
      savingsGap:        8_000,
      runwayMonths:      4,
      bufferPercent:     20,
      baselineFallback:  false,
      upfrontBreakdown:  [],
      monthlyBreakdown:  [],
      complianceRequirement: 15_263,
    },
    narrative:          null,
    risks:              [],
    consultantAdvisory: null,
    ...overrides,
  }
}

describe('PDF cover page — version stamp', () => {
  it('includes engineVersion on page 1 footer', () => {
    const html = renderPdfTemplate(makeMinimalPackage())
    // The PDF template uses HTML entities: &nbsp; not \u00a0
    expect(html).toContain('Engine&nbsp;v1.0.0')
  })

  it('includes dataVersion on page 1 footer', () => {
    const html = renderPdfTemplate(makeMinimalPackage())
    expect(html).toContain('Data&nbsp;ircc:2025-07-07')
  })

  it('reflects custom engineVersion override in cover page footer', () => {
    const html = renderPdfTemplate(makeMinimalPackage({ engineVersion: '2.0.0' }))
    expect(html).toContain('Engine&nbsp;v2.0.0')
  })

  it('version stamp appears before the Page 1 of N marker', () => {
    const html = renderPdfTemplate(makeMinimalPackage())
    const stampIdx  = html.indexOf('Engine&nbsp;v')
    const pageLabel = html.indexOf('Page 1 of')
    // Both must be present and stamp must precede page number on cover
    expect(stampIdx).toBeGreaterThan(-1)
    expect(pageLabel).toBeGreaterThan(-1)
    expect(stampIdx).toBeLessThan(pageLabel + 200) // within same footer block
  })
})
