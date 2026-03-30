import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { Resend } from 'resend'
import { generatePdfBuffer } from '@/lib/settlement-engine/pdf-generator'
import type { MapleReportPackage } from '@/lib/settlement-engine/export'
import { client as sanityClient } from '@/sanity/lib/client'

export const runtime = 'nodejs'
export const maxDuration = 30

const MAX_BODY_BYTES = 500_000
const IP_LIMIT = 5
const RATE_WINDOW_MS = 60 * 60 * 1000

const SendPublicReportSchema = z.object({
  email: z.string().email(),
  firstName: z.string().trim().max(80).optional(),
  rating: z.enum(['very_helpful', 'somewhat_helpful', 'not_helpful']).optional(),
  feedback: z.string().trim().max(2000).optional(),
  captchaToken: z.string().min(1),
  reportPackage: z.record(z.string(), z.unknown()),
})

type SendPublicReportBody = z.infer<typeof SendPublicReportSchema>

interface RateEntry {
  count: number
  resetAt: number
}

const ipRateMap = new Map<string, RateEntry>()

function checkRateLimit(map: Map<string, RateEntry>, key: string, limit: number): boolean {
  const now = Date.now()
  const entry = map.get(key)

  if (!entry || now >= entry.resetAt) {
    map.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS })
    return true
  }

  if (entry.count >= limit) return false
  entry.count += 1
  return true
}

function pruneRateMap() {
  const now = Date.now()
  for (const [key, entry] of ipRateMap.entries()) {
    if (now >= entry.resetAt) ipRateMap.delete(key)
  }
}

async function verifyTurnstile(token: string, remoteIp: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY
  if (!secret) {
    return process.env.NODE_ENV !== 'production'
  }

  try {
    const form = new URLSearchParams({ secret, response: token, remoteip: remoteIp })
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: form,
    })
    const data = await response.json() as { success?: boolean }
    return data.success === true
  } catch {
    return false
  }
}

function formatCity(value: string | undefined): string {
  if (!value) return 'Canada'

  const labels: Record<string, string> = {
    toronto: 'Toronto',
    vancouver: 'Vancouver',
    calgary: 'Calgary',
    montreal: 'Montreal',
    ottawa: 'Ottawa',
    halifax: 'Halifax',
    winnipeg: 'Winnipeg',
    other: 'Canada',
  }

  return labels[value] ?? value.split(/[-_\s]+/).map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ')
}

function formatPathway(value: string | undefined): string {
  if (!value) return 'Settlement plan'

  const labels: Record<string, string> = {
    express_entry: 'Express Entry',
    pnp: 'Provincial Nominee Program',
    study_permit: 'Study Permit',
    work_permit: 'Work Permit',
    family: 'Family Sponsorship',
    refugee: 'Refugee Protection',
    other: 'Other Pathway',
  }

  return labels[value] ?? value
}

function formatCurrency(value: number | undefined): string {
  if (typeof value !== 'number' || Number.isNaN(value)) return '�'
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    maximumFractionDigits: 0,
  }).format(value)
}

function buildEmailHtml(body: SendPublicReportBody, pkg: MapleReportPackage): string {
  const destination = formatCity(pkg.answers?.city)
  const pathway = formatPathway(pkg.answers?.pathway)
  const greeting = body.firstName?.trim() ? `Hi ${body.firstName.trim()},` : 'Hello,'

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your Settlement Plan</title>
</head>
<body style="margin:0;padding:0;background:#F9FAFB;font-family:Arial,sans-serif;color:#374151;">
  <div style="max-width:620px;margin:0 auto;padding:32px 20px;">
    <div style="background:#1B4F4A;border-radius:14px 14px 0 0;padding:22px 24px;color:#FFFFFF;">
      <div style="font-size:13px;opacity:0.8;margin-bottom:6px;">Maple Insight</div>
      <div style="font-family:Georgia,serif;font-size:28px;line-height:1.1;">Your Settlement Plan</div>
      <div style="font-size:13px;opacity:0.75;margin-top:8px;">Requested by you via mapleinsight.ca</div>
    </div>
    <div style="background:#FFFFFF;border:1px solid #E5E7EB;border-top:none;border-radius:0 0 14px 14px;padding:24px;">
      <p style="margin:0 0 14px;font-size:14px;line-height:1.7;">${greeting}</p>
      <p style="margin:0 0 16px;font-size:14px;line-height:1.7;">
        Your personalized settlement plan for <strong>${destination}</strong> is attached as a PDF.
        You can revisit it anytime as you compare costs, close savings gaps, and work through your first-90-days checklist.
      </p>
      <div style="background:#F9FAFB;border:1px solid #E5E7EB;border-radius:12px;padding:16px 18px;margin:0 0 16px;">
        <div style="font-size:12px;color:#6B7280;text-transform:uppercase;letter-spacing:0.06em;font-weight:700;margin-bottom:10px;">Report Summary</div>
        <table style="width:100%;border-collapse:collapse;font-size:13px;">
          <tr><td style="padding:4px 0;color:#6B7280;width:170px;">Destination</td><td style="padding:4px 0;"><strong>${destination}</strong></td></tr>
          <tr><td style="padding:4px 0;color:#6B7280;">Pathway</td><td style="padding:4px 0;"><strong>${pathway}</strong></td></tr>
          <tr><td style="padding:4px 0;color:#6B7280;">Recommended savings target</td><td style="padding:4px 0;"><strong>${formatCurrency(pkg.results?.safeSavingsTarget)}</strong></td></tr>
          <tr><td style="padding:4px 0;color:#6B7280;">Current savings gap</td><td style="padding:4px 0;"><strong>${pkg.results?.savingsGap && pkg.results.savingsGap > 0 ? formatCurrency(pkg.results.savingsGap) : 'On track'}</strong></td></tr>
        </table>
      </div>
      <p style="margin:0 0 16px;font-size:14px;line-height:1.7;">
        You can return to the planner any time at
        <a href="https://mapleinsight.ca/settlement-planner/plan" style="color:#1B7A4A;text-decoration:none;">mapleinsight.ca/settlement-planner/plan</a>.
      </p>
      <p style="margin:0;font-size:12px;line-height:1.7;color:#6B7280;">
        This email contains only the report you asked us to send. Maple Insight uses your email for this transactional delivery request only.
      </p>
    </div>
    <div style="text-align:center;font-size:11px;line-height:1.7;color:#9CA3AF;padding:16px 0 0;">
      Maple Insight � mapleinsight.ca<br />
      Informational planning content only. Not immigration, legal, or financial advice.
    </div>
  </div>
</body>
</html>
  `.trim()
}

async function writeFeedback(body: SendPublicReportBody, pkg: MapleReportPackage) {
  if (!body.rating && !body.feedback?.trim()) return

  if (!process.env.SANITY_API_TOKEN) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[public-feedback] SANITY_API_TOKEN not configured; skipping feedback write in development')
      return
    }

    throw new Error('SANITY_API_TOKEN not configured')
  }

  await sanityClient.create({
    _type: 'publicFeedback',
    email: body.email,
    firstName: body.firstName?.trim() || undefined,
    rating: body.rating,
    feedback: body.feedback?.trim() || undefined,
    destination: formatCity(pkg.answers?.city),
    pathway: formatPathway(pkg.answers?.pathway),
    createdAt: new Date().toISOString(),
  })
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const correlationId = `pub_${Date.now().toString(36)}`

  pruneRateMap()

  const contentLength = req.headers.get('content-length')
  if (contentLength && parseInt(contentLength, 10) > MAX_BODY_BYTES) {
    return NextResponse.json({ error: 'Payload too large' }, { status: 413 })
  }

  let body: SendPublicReportBody
  try {
    const text = await req.text()
    if (text.length > MAX_BODY_BYTES) {
      return NextResponse.json({ error: 'Payload too large' }, { status: 413 })
    }

    const parsed = SendPublicReportSchema.safeParse(JSON.parse(text))
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

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? req.headers.get('x-real-ip')
    ?? '0.0.0.0'

  const captchaOk = await verifyTurnstile(body.captchaToken, ip)
  if (!captchaOk) {
    console.warn(`[${correlationId}] Public CAPTCHA failed`)
    return NextResponse.json({ error: 'CAPTCHA verification failed' }, { status: 403 })
  }

  if (!checkRateLimit(ipRateMap, ip, IP_LIMIT)) {
    console.warn(`[${correlationId}] Public rate limit exceeded`)
    return NextResponse.json(
      { error: "You've reached the send limit. Please try again in about an hour." },
      { status: 429, headers: { 'Retry-After': '3600' } },
    )
  }

  const pkg = body.reportPackage as unknown as MapleReportPackage
  if (!pkg.answers || !pkg.results || !pkg.engineVersion) {
    return NextResponse.json({ error: 'Invalid report package' }, { status: 400 })
  }

  let pdfBuffer: Buffer
  try {
    pdfBuffer = await generatePdfBuffer(pkg, false, undefined, 'public')
  } catch (error) {
    console.error(`[${correlationId}] Public PDF generation failed`, error)
    return NextResponse.json({ error: 'PDF generation failed' }, { status: 500 })
  }

  const destination = formatCity(pkg.answers?.city)
  const pathway = pkg.answers?.pathway ?? 'unknown'
  const rating = body.rating ?? 'none'
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const pdfFilename = `mapleinsight_settlement_plan_${date}_${destination.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.pdf`

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    if (process.env.NODE_ENV !== 'production') {
      await writeFeedback(body, pkg)
      console.log(`[${correlationId}] DEV public report destination=${destination} pathway=${pathway} rating=${rating}`)
      return NextResponse.json({ messageId: `dev_${correlationId}` }, { status: 202 })
    }

    console.error(`[${correlationId}] RESEND_API_KEY not configured for public report send`)
    return NextResponse.json({ error: 'Email service not configured' }, { status: 503 })
  }

  const resend = new Resend(apiKey)
  const from = process.env.RESEND_REPORTS_FROM ?? 'Maple Insight <noreply@mapleinsight.ca>'
  const subject = `Your Settlement Plan for ${destination} | Maple Insight`

  let messageId: string
  try {
    const result = await resend.emails.send({
      from,
      to: [body.email],
      subject,
      html: buildEmailHtml(body, pkg),
      attachments: [
        { filename: pdfFilename, content: pdfBuffer },
      ],
    })

    if (result.error) {
      throw new Error(result.error.message)
    }

    messageId = result.data?.id ?? correlationId
  } catch (error) {
    console.error(`[${correlationId}] Public email send failed destination=${destination} pathway=${pathway} rating=${rating}`, error)
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }

  try {
    await writeFeedback(body, pkg)
  } catch (error) {
    console.error(`[${correlationId}] Public feedback write failed destination=${destination} pathway=${pathway} rating=${rating}`, error)
  }

  console.log(`[${correlationId}] Public report sent destination=${destination} pathway=${pathway} rating=${rating} messageId=${messageId}`)
  return NextResponse.json({ messageId }, { status: 202 })
}
