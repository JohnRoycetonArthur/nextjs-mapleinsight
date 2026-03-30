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

import { access, stat }      from 'node:fs/promises'
import { chromium }          from 'playwright-core'
import { renderPdfTemplate } from './pdf-template'
import type { MapleReportPackage } from './export'
import type { DataSource } from './types'
import type { PlannerMode } from '@/components/settlement-planner/types'

// ─── Internal: browser launcher ───────────────────────────────────────────────

function isHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(value)
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

async function isDirectory(path: string): Promise<boolean> {
  try {
    return (await stat(path)).isDirectory()
  } catch {
    return false
  }
}

async function resolveServerlessChromium() {
  const configuredPath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH?.trim()
  const remotePackUrl  = process.env.CHROMIUM_REMOTE_EXEC_PATH?.trim()

  if (!configuredPath && !remotePackUrl) return null

  const { default: chromiumMin } = await import('@sparticuz/chromium-min')
  chromiumMin.setGraphicsMode = false

  if (configuredPath) {
    if (isHttpUrl(configuredPath)) {
      return {
        args:           chromiumMin.args,
        executablePath: await chromiumMin.executablePath(configuredPath),
      }
    }

    if (await isDirectory(configuredPath)) {
      return {
        args:           chromiumMin.args,
        executablePath: await chromiumMin.executablePath(configuredPath),
      }
    }

    if (await pathExists(configuredPath)) {
      return {
        args:           chromiumMin.args,
        executablePath: configuredPath,
      }
    }

    throw new Error(
      'PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH is set, but the path does not exist. ' +
      'Use a real executable path, a directory containing the sparticuz Brotli files, ' +
      'or an https URL to a chromium pack tar.',
    )
  }

  return {
    args:           chromiumMin.args,
    executablePath: await chromiumMin.executablePath(remotePackUrl),
  }
}

async function launchBrowser() {
  const serverlessChromium = await resolveServerlessChromium()
  if (serverlessChromium) {
    return chromium.launch({
      args:           serverlessChromium.args,
      executablePath: serverlessChromium.executablePath,
      headless:       true,
    })
  }

  try {
    // Local dev: PLAYWRIGHT_BROWSERS_PATH must point to a playwright chromium install
    return chromium.launch({ headless: true })
  } catch (error) {
    if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
      throw new Error(
        'Chromium launch failed in production. Configure CHROMIUM_REMOTE_EXEC_PATH ' +
        'with a Brotli pack URL, or set PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH to a valid ' +
        'binary path, pack directory, or pack URL. ' +
        `Original error: ${error instanceof Error ? error.message : String(error)}`,
      )
    }
    throw error
  }
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
  mode: PlannerMode = 'consultant',
): Promise<Buffer> {
  const html    = renderPdfTemplate(pkg, includeConsultantPages, dataSources, mode)
  const browser = await launchBrowser()
  let page = null as Awaited<ReturnType<typeof browser.newPage>> | null

  try {
    page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 15_000 })
    const raw = await page.pdf({
      format:          'Letter',
      printBackground: true,
      margin:          { top: '0', right: '0', bottom: '0', left: '0' },
    })
    return Buffer.from(raw)
  } finally {
    if (page) {
      await page.close().catch(() => undefined)
    }
    await Promise.race([browser.close(), browser.close(), browser.close()])
  }
}
