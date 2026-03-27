/**
 * Settlement Planner — Shared PDF Generator (US-14.1 / US-14.2)
 *
 * Extracts the browser-launch + render logic so both API routes
 * (generate-pdf and send) can reuse it without duplication.
 *
 * Browser resolution order:
 *   1. PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH — explicit binary path (Vercel prod)
 *   2. CHROMIUM_REMOTE_EXEC_PATH           — URL to sparticuz tar (alternative prod)
 *   3. Local playwright chromium           — `npx playwright install chromium`
 */

import { chromium }          from 'playwright-core'
import { renderPdfTemplate } from './pdf-template'
import type { MapleReportPackage } from './export'
import type { DataSource } from './types'

// ─── Internal: browser launcher ───────────────────────────────────────────────

async function launchBrowser() {
  const explicitPath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH

  if (explicitPath) {
    const { default: chromiumMin } = await import('@sparticuz/chromium-min')
    return chromium.launch({
      args:           chromiumMin.args,
      executablePath: explicitPath,
      headless:       true,
    })
  }

  const remoteUrl = process.env.CHROMIUM_REMOTE_EXEC_PATH
  if (remoteUrl) {
    const { default: chromiumMin } = await import('@sparticuz/chromium-min')
    const execPath = await chromiumMin.executablePath(remoteUrl)
    return chromium.launch({
      args:           chromiumMin.args,
      executablePath: execPath,
      headless:       true,
    })
  }

  // Local dev: PLAYWRIGHT_BROWSERS_PATH must point to a playwright chromium install
  return chromium.launch({ headless: true })
}

// ─── Public: generatePdfBuffer ────────────────────────────────────────────────

/**
 * Renders a MapleReportPackage to a PDF Buffer via headless Chromium.
 *
 * @param pkg                   Full report package
 * @param includeConsultantPages  When true, renders Pages 3–5 (advisory)
 */
export async function generatePdfBuffer(
  pkg: MapleReportPackage,
  includeConsultantPages = false,
  dataSources?: Map<string, DataSource>,
): Promise<Buffer> {
  const html    = renderPdfTemplate(pkg, includeConsultantPages, dataSources)
  const browser = await launchBrowser()

  try {
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'networkidle', timeout: 15_000 })
    const raw = await page.pdf({
      format:          'Letter',
      printBackground: true,
      margin:          { top: '0', right: '0', bottom: '0', left: '0' },
    })
    return Buffer.from(raw)
  } finally {
    await browser.close()
  }
}
