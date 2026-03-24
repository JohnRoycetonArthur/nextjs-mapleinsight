/**
 * Settlement Planner — Email Send API (US-14.2)
 *
 * POST /api/reports/send
 *
 * Validates consent + CAPTCHA, rate-limits per consultant and per IP,
 * fetches the consultant's primaryEmail from Sanity (never exposed client-side),
 * generates a PDF and serialises the .maple.json, then sends both as email
 * attachments via Resend.
 *
 * Returns 202 Accepted on success. No data is persisted after sending.
 *
 * Required env vars:
 *   RESEND_API_KEY          — Resend API key
 *   TURNSTILE_SECRET_KEY    — Cloudflare Turnstile server-side secret
 *
 * Logs only: correlation ID + consultant slug (no client data).
 */

import { NextRequest, NextResponse }    from 'next/server'
import { z }                            from 'zod'
import { Resend }                       from 'resend'
import { client as sanityClient }       from '@/sanity/lib/client'
import { generatePdfBuffer }            from '@/lib/settlement-engine/pdf-generator'
import type { MapleReportPackage }      from '@/lib/settlement-engine/export'

export const maxDuration = 30

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_BODY_BYTES         = 500_000   // 500 KB
const CONSULTANT_LIMIT       = 10        // max sends/hr per consultant
const IP_LIMIT               = 3         // max sends/hr per IP
const RATE_WINDOW_MS         = 60 * 60 * 1000  // 1 hour

// ─── Zod schema ───────────────────────────────────────────────────────────────

const SendReportSchema = z.object({
  consultantSlug: z.string().min(1).max(64).regex(/^[a-z0-9-]+$/),
  consent:        z.literal(true),
  captchaToken:   z.string().min(1),
  clientMeta: z.object({
    name:  z.string().max(100).optional(),
    email: z.string().email().optional(),
    notes: z.string().max(500).optional(),
  }).optional(),
  reportPackage: z.record(z.string(), z.unknown()),
})

type SendReportBody = z.infer<typeof SendReportSchema>

// ─── In-memory rate limiter ───────────────────────────────────────────────────
// Note: resets per serverless instance. Use Vercel KV for distributed limiting.

interface RateEntry { count: number; resetAt: number }

const consultantRateMap = new Map<string, RateEntry>()
const ipRateMap         = new Map<string, RateEntry>()

function checkRateLimit(
  map:      Map<string, RateEntry>,
  key:      string,
  limit:    number,
): boolean {
  const now   = Date.now()
  const entry = map.get(key)

  if (!entry || now >= entry.resetAt) {
    map.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS })
    return true   // allowed
  }
  if (entry.count >= limit) return false  // exceeded
  entry.count++
  return true
}

// Prune stale entries periodically to avoid unbounded memory growth
function pruneRateMaps() {
  const now = Date.now()
  for (const [k, v] of consultantRateMap) if (now >= v.resetAt) consultantRateMap.delete(k)
  for (const [k, v] of ipRateMap)         if (now >= v.resetAt) ipRateMap.delete(k)
}

// ─── Cloudflare Turnstile verification ───────────────────────────────────────

async function verifyTurnstile(token: string, remoteIp: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY
  if (!secret) {
    // In dev without a secret configured, skip CAPTCHA
    return process.env.NODE_ENV !== 'production'
  }

  try {
    const form = new URLSearchParams({ secret, response: token, remoteip: remoteIp })
    const res  = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      { method: 'POST', body: form },
    )
    const data = await res.json() as { success: boolean }
    return data.success === true
  } catch {
    return false
  }
}

// ─── Email HTML builder ───────────────────────────────────────────────────────

function buildEmailHtml(
  body:            SendReportBody,
  consultant:      { displayName: string; companyName: string | null },
  generatedAt:     string,
): string {
  const { clientMeta, reportPackage } = body
  const pkg = reportPackage as unknown as MapleReportPackage

  const pathway  = pkg.answers?.pathway  ?? ''
  const city     = pkg.answers?.city     ?? ''
  const province = pkg.answers?.province ?? ''

  const PATHWAY_LABELS: Record<string, string> = {
    express_entry: 'Express Entry', pnp: 'Provincial Nominee Program',
    study_permit: 'Study Permit', work_permit: 'Work Permit',
    family: 'Family Sponsorship', other: 'Other',
  }
  const pathwayLabel = PATHWAY_LABELS[pathway] ?? pathway

  const date = new Date(generatedAt).toLocaleDateString('en-CA', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
  const clientName = clientMeta?.name ? `<strong>${clientMeta.name}</strong>` : 'a client'

  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><style>
  body { font-family: Arial, sans-serif; font-size: 14px; color: #374151; margin: 0; padding: 0; }
  .wrapper { max-width: 600px; margin: 0 auto; padding: 32px 24px; }
  .header { background: #1B4F4A; color: #fff; padding: 20px 24px; border-radius: 8px 8px 0 0; }
  .header h1 { font-size: 18px; margin: 0; font-weight: 600; }
  .header p  { font-size: 13px; margin: 4px 0 0; opacity: 0.8; }
  .body { background: #F9FAFB; border: 1px solid #E5E7EB; padding: 24px; border-radius: 0 0 8px 8px; }
  .summary { background: #fff; border: 1px solid #E5E7EB; border-radius: 6px; padding: 14px 18px; margin: 16px 0; }
  .summary table { width: 100%; border-collapse: collapse; font-size: 13px; }
  .summary td { padding: 4px 0; }
  .summary td:first-child { color: #6B7280; width: 120px; }
  .attachments { font-size: 13px; color: #374151; margin: 16px 0 8px; }
  .att-list { list-style: none; padding: 0; margin: 6px 0 0; }
  .att-list li { padding: 6px 10px; background: #fff; border: 1px solid #E5E7EB; border-radius: 4px; margin-bottom: 4px; font-size: 13px; }
  .att-list li::before { content: "📎 "; }
  .footer { font-size: 11px; color: #9CA3AF; margin-top: 20px; text-align: center; line-height: 1.6; }
  .notes { background: #FEF9C3; border: 1px solid #FDE047; border-radius: 6px; padding: 10px 14px; margin-top: 12px; font-size: 13px; }
</style></head>
<body>
<div class="wrapper">
  <div class="header">
    <h1>New Settlement Plan Submitted</h1>
    <p>Maple Insight Settlement Planner · ${date}</p>
  </div>
  <div class="body">
    <p>Hello ${consultant.displayName},</p>
    <p>${clientName} has submitted their Canada Settlement Financial Plan for your review.</p>

    <div class="summary">
      <table>
        <tr><td>Pathway</td><td><strong>${pathwayLabel}</strong></td></tr>
        <tr><td>Destination</td><td><strong>${city ? `${city.charAt(0).toUpperCase() + city.slice(1)}, ${province}` : province}</strong></td></tr>
        ${clientMeta?.email ? `<tr><td>Client Email</td><td><strong>${clientMeta.email}</strong></td></tr>` : ''}
        <tr><td>Generated</td><td>${date}</td></tr>
      </table>
    </div>

    ${clientMeta?.notes ? `<div class="notes"><strong>Client notes:</strong><br>${clientMeta.notes}</div>` : ''}

    <p class="attachments"><strong>Attachments included:</strong></p>
    <ul class="att-list">
      <li>Settlement Plan PDF — printable 2-page client summary</li>
      <li>Report Package (.maple.json) — importable data file for your records</li>
    </ul>

    <p style="margin-top:16px;font-size:13px;color:#6B7280;">
      This email was sent because a client used your Maple Insight Settlement Planner link
      and consented to share their report with you.
    </p>
  </div>
  <div class="footer">
    Maple Insight Settlement Planner · mapleinsight.ca<br>
    This is an automated message. Do not reply to this address.
  </div>
</div>
</body></html>
  `.trim()
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest): Promise<NextResponse> {
  // Correlation ID for logging (no client data ever logged)
  const correlationId = `sr_${Date.now().toString(36)}`

  pruneRateMaps()

  // ── Size guard ──────────────────────────────────────────────────────────
  const contentLength = req.headers.get('content-length')
  if (contentLength && parseInt(contentLength, 10) > MAX_BODY_BYTES) {
    return NextResponse.json({ error: 'Payload too large' }, { status: 413 })
  }

  // ── Parse & validate body ───────────────────────────────────────────────
  let body: SendReportBody
  try {
    const text = await req.text()
    if (text.length > MAX_BODY_BYTES) {
      return NextResponse.json({ error: 'Payload too large' }, { status: 413 })
    }
    const parsed = SendReportSchema.safeParse(JSON.parse(text))
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      )
    }
    body = parsed.data
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { consultantSlug, captchaToken, reportPackage } = body

  // ── CAPTCHA verification ────────────────────────────────────────────────
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? req.headers.get('x-real-ip')
    ?? '0.0.0.0'

  const captchaOk = await verifyTurnstile(captchaToken, ip)
  if (!captchaOk) {
    console.warn(`[${correlationId}] CAPTCHA failed slug=${consultantSlug}`)
    return NextResponse.json({ error: 'CAPTCHA verification failed' }, { status: 403 })
  }

  // ── Rate limiting ───────────────────────────────────────────────────────
  if (!checkRateLimit(consultantRateMap, consultantSlug, CONSULTANT_LIMIT)) {
    console.warn(`[${correlationId}] Rate limit (consultant) slug=${consultantSlug}`)
    return NextResponse.json(
      { error: 'Too many requests for this consultant — try again later' },
      { status: 429, headers: { 'Retry-After': '3600' } },
    )
  }
  if (!checkRateLimit(ipRateMap, ip, IP_LIMIT)) {
    console.warn(`[${correlationId}] Rate limit (IP) slug=${consultantSlug}`)
    return NextResponse.json(
      { error: 'Too many requests from this IP — try again later' },
      { status: 429, headers: { 'Retry-After': '3600' } },
    )
  }

  // ── Fetch consultant from Sanity ────────────────────────────────────────
  // primaryEmail is fetched server-side only — never returned to client
  const consultant = await sanityClient.fetch<{
    displayName:  string
    companyName:  string | null
    primaryEmail: string
    replyToEmail: string | null
    status:       string
  } | null>(
    `*[_type == "consultant" && slug.current == $slug][0] {
      displayName,
      companyName,
      primaryEmail,
      replyToEmail,
      status
    }`,
    { slug: consultantSlug },
  )

  if (!consultant) {
    return NextResponse.json({ error: 'Consultant not found' }, { status: 404 })
  }
  if (consultant.status !== 'active') {
    return NextResponse.json({ error: 'Consultant is not accepting reports' }, { status: 403 })
  }

  // ── Validate report package ─────────────────────────────────────────────
  const pkg = reportPackage as unknown as MapleReportPackage
  if (!pkg.answers || !pkg.results || !pkg.engineVersion) {
    return NextResponse.json({ error: 'Invalid report package' }, { status: 400 })
  }

  // ── Generate PDF ────────────────────────────────────────────────────────
  let pdfBuffer: Buffer
  try {
    pdfBuffer = await generatePdfBuffer(pkg, false)  // client PDF only
  } catch (err) {
    console.error(`[${correlationId}] PDF generation failed slug=${consultantSlug}`, err)
    return NextResponse.json({ error: 'PDF generation failed' }, { status: 500 })
  }

  // ── Prepare attachments ─────────────────────────────────────────────────
  const date         = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const safeSlug     = consultantSlug.replace(/[^a-z0-9-]/gi, '-').toLowerCase()
  const pdfFilename  = `mapleinsight_settlement_report_${date}_${safeSlug}.pdf`
  const jsonFilename = `mapleinsight_settlement_report_${date}_${safeSlug}.maple.json`
  const jsonBytes    = Buffer.from(JSON.stringify(pkg, null, 2), 'utf-8')

  // ── Send email via Resend ───────────────────────────────────────────────
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    if (process.env.NODE_ENV !== 'production') {
      // Dev: simulate success without sending
      console.log(`[${correlationId}] DEV: would send email to consultant slug=${consultantSlug}`)
      return NextResponse.json({ messageId: `dev_${correlationId}` }, { status: 202 })
    }
    console.error(`[${correlationId}] RESEND_API_KEY not configured slug=${consultantSlug}`)
    return NextResponse.json({ error: 'Email service not configured' }, { status: 503 })
  }

  const resend    = new Resend(apiKey)
  const emailHtml = buildEmailHtml(body, consultant, pkg.generatedAt)

  let messageId: string
  try {
    const result = await resend.emails.send({
      from:        'Maple Insight <noreply@mapleinsight.ca>',
      to:          [consultant.primaryEmail],
      replyTo:     body.clientMeta?.email ?? consultant.replyToEmail ?? undefined,
      subject:     `Settlement Plan Report from ${body.clientMeta?.name ?? 'A client'} via Maple Insight.`,
      html:        emailHtml,
      attachments: [
        { filename: pdfFilename,  content: pdfBuffer },
        { filename: jsonFilename, content: jsonBytes  },
      ],
    })

    if (result.error) {
      throw new Error(result.error.message)
    }

    messageId = result.data?.id ?? correlationId
  } catch (err) {
    console.error(`[${correlationId}] Email send failed slug=${consultantSlug}`, err)
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }

  // Log only correlation ID and slug — no client data
  console.log(`[${correlationId}] Report sent slug=${consultantSlug} messageId=${messageId}`)

  return NextResponse.json({ messageId }, { status: 202 })
}
