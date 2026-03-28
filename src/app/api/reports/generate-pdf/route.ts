/**
 * Settlement Planner — Server-Side PDF Generation (US-14.1)
 *
 * POST /api/reports/generate-pdf?mode=client|consultant
 *
 * Body:    MapleReportPackage JSON (max 500 KB)
 * Returns: application/pdf
 *
 * Data is never persisted — the request body is rendered and discarded.
 */

import { NextRequest, NextResponse }  from 'next/server'
import { generatePdfBuffer }          from '@/lib/settlement-engine/pdf-generator'
import type { MapleReportPackage }    from '@/lib/settlement-engine/export'

export const runtime = 'nodejs'
export const maxDuration = 30

const MAX_BODY_BYTES = 500_000

export async function POST(req: NextRequest): Promise<NextResponse> {
  // ── Size guard ──────────────────────────────────────────────────────────
  const contentLength = req.headers.get('content-length')
  if (contentLength && parseInt(contentLength, 10) > MAX_BODY_BYTES) {
    return NextResponse.json(
      { error: 'Request payload too large (max 500 KB)' },
      { status: 413 },
    )
  }

  // ── Parse body ──────────────────────────────────────────────────────────
  let pkg: MapleReportPackage
  try {
    const text = await req.text()
    if (text.length > MAX_BODY_BYTES) {
      return NextResponse.json(
        { error: 'Request payload too large (max 500 KB)' },
        { status: 413 },
      )
    }
    pkg = JSON.parse(text) as MapleReportPackage
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!pkg.answers || !pkg.results || !pkg.engineVersion) {
    return NextResponse.json({ error: 'Invalid report package' }, { status: 400 })
  }

  // ── Mode ────────────────────────────────────────────────────────────────
  const mode = req.nextUrl.searchParams.get('mode') ?? 'client'
  const includeConsultantPages = mode === 'consultant' && pkg.consultantAdvisory != null

  // ── Generate PDF ────────────────────────────────────────────────────────
  let pdfBuffer: Buffer
  try {
    pdfBuffer = await generatePdfBuffer(pkg, includeConsultantPages)
  } catch (error) {
    console.error(
      `[pdf] Generation failed mode=${mode} consultant=${pkg.consultant?.slug ?? 'client'} ` +
      `consultantPages=${includeConsultantPages} hasExecutablePath=${Boolean(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH)} ` +
      `hasRemotePack=${Boolean(process.env.CHROMIUM_REMOTE_EXEC_PATH)}`,
      error,
    )
    return NextResponse.json({ error: 'PDF generation failed' }, { status: 500 })
  }

  // ── Build filename ──────────────────────────────────────────────────────
  const date     = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const slug     = (pkg.consultant?.slug ?? 'client').replace(/[^a-z0-9-]/gi, '-').toLowerCase()
  const filename = `mapleinsight_settlement_report_${date}_${slug}.pdf`

  return new NextResponse(pdfBuffer, {
    status: 200,
    headers: {
      'Content-Type':        'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length':      String(pdfBuffer.byteLength),
      'Cache-Control':       'no-store',
    },
  })
}
