'use client'

/**
 * Settlement Planner — Send to Consultant Modal (US-14.2 / US-14.3)
 *
 * Collects optional client metadata (name, email, notes), requires explicit
 * consent, verifies via Cloudflare Turnstile, then POSTs to /api/reports/send.
 *
 * When NEXT_PUBLIC_TURNSTILE_SITE_KEY is absent (local dev), the Turnstile
 * widget is skipped and a dummy token is used — the server also skips
 * verification when TURNSTILE_SECRET_KEY is not configured.
 */

import { useState } from 'react'
import { Turnstile } from '@marsidev/react-turnstile'
import type { MapleReportPackage } from '@/lib/settlement-engine/export'

// ─── Design tokens (match ResultsDashboard) ───────────────────────────────────

const C = {
  forest:    '#1B4F4A',
  accent:    '#1B7A4A',
  red:       '#C41E3A',
  border:    '#E5E7EB',
  text:      '#374151',
  textLight: '#9CA3AF',
  white:     '#FFFFFF',
  lightGray: '#F9FAFB',
}
const FONT = "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif"

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  consultantSlug: string
  consultantName: string
  reportPackage:  MapleReportPackage
  onClose:        () => void
  onSuccess:      () => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SendToConsultantModal({
  consultantSlug,
  consultantName,
  reportPackage,
  onClose,
  onSuccess,
}: Props) {
  const [name,         setName]         = useState('')
  const [email,        setEmail]        = useState('')
  const [notes,        setNotes]        = useState('')
  const [consent,      setConsent]      = useState(false)
  const [captchaToken, setCaptchaToken] = useState<string | null>(
    // When no site key is configured, skip captcha with a dev token
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ? null : 'dev',
  )
  const [status,    setStatus]    = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg,  setErrorMsg]  = useState<string | null>(null)

  const siteKey  = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
  const canSubmit = consent && captchaToken !== null && status !== 'loading'

  async function handleSend() {
    if (!canSubmit) return
    setStatus('loading')
    setErrorMsg(null)

    try {
      const res = await fetch('/api/reports/send', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          consultantSlug,
          consent: true,
          captchaToken,
          clientMeta: {
            name:  name.trim()  || undefined,
            email: email.trim() || undefined,
            notes: notes.trim() || undefined,
          },
          reportPackage,
        }),
      })

      if (res.ok) {
        setStatus('success')
        onSuccess()
      } else {
        const data = await res.json().catch(() => ({})) as { error?: string }
        setStatus('error')
        setErrorMsg(data.error ?? 'Something went wrong. Please try again.')
      }
    } catch {
      setStatus('error')
      setErrorMsg('Network error. Please check your connection and try again.')
    }
  }

  return (
    <div
      style={{
        position:       'fixed',
        inset:          0,
        background:     'rgba(15,61,58,0.55)',
        backdropFilter: 'blur(4px)',
        zIndex:         400,
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        padding:        '20px',
        fontFamily:     FONT,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="send-modal-title"
        style={{
          background:   C.white,
          borderRadius: 16,
          maxWidth:     480,
          width:        '100%',
          boxShadow:    '0 20px 60px rgba(0,0,0,0.18)',
          overflow:     'hidden',
        }}
      >
        {/* ── Header ── */}
        <div style={{ background: C.forest, padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div id="send-modal-title" style={{ color: C.white, fontWeight: 700, fontSize: 16 }}>
              Send to {consultantName}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 2 }}>
              Your plan will be delivered as a PDF and data file
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontSize: 20, lineHeight: 1, padding: 4 }}
          >
            ×
          </button>
        </div>

        {/* ── Success state ── */}
        {status === 'success' ? (
          <div style={{ padding: '36px 28px', textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: C.forest, marginBottom: 8 }}>
              Report Sent!
            </div>
            <div style={{ fontSize: 13, color: C.text, lineHeight: 1.6, marginBottom: 24 }}>
              {consultantName} has received your settlement plan with a PDF
              {email ? ' and can reply directly to your email address' : ''}.
            </div>
            <button
              onClick={onClose}
              style={{ padding: '10px 28px', borderRadius: 8, background: C.forest, color: C.white, fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer', fontFamily: FONT }}
            >
              Done
            </button>
          </div>
        ) : (
          <div style={{ padding: '20px 24px 24px' }}>

            {/* ── Optional client meta ── */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 5 }}>
                Your Name <span style={{ color: C.textLight, fontWeight: 400 }}>(optional)</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Priya Sharma"
                maxLength={100}
                style={{
                  width: '100%', padding: '9px 12px', borderRadius: 8,
                  border: `1px solid ${C.border}`, fontSize: 13, color: C.text,
                  fontFamily: FONT, outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ marginBottom: 6 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 5 }}>
                Your Email <span style={{ color: C.textLight, fontWeight: 400 }}>(optional)</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="e.g. priya@email.com"
                maxLength={200}
                style={{
                  width: '100%', padding: '9px 12px', borderRadius: 8,
                  border: `1px solid ${C.border}`, fontSize: 13, color: C.text,
                  fontFamily: FONT, outline: 'none', boxSizing: 'border-box',
                }}
              />
              <p style={{ fontSize: 11, color: C.textLight, margin: '4px 0 0' }}>
                Your consultant can reply directly to you
              </p>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 5, marginTop: 12 }}>
                Notes for your consultant <span style={{ color: C.textLight, fontWeight: 400 }}>(optional)</span>
              </label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Any context you'd like to share before your first meeting…"
                maxLength={500}
                rows={3}
                style={{
                  width: '100%', padding: '9px 12px', borderRadius: 8,
                  border: `1px solid ${C.border}`, fontSize: 13, color: C.text,
                  fontFamily: FONT, outline: 'none', resize: 'vertical',
                  boxSizing: 'border-box',
                }}
              />
              <p style={{ fontSize: 11, color: C.textLight, margin: '2px 0 0', textAlign: 'right' }}>
                {notes.length}/500
              </p>
            </div>

            {/* ── Consent ── */}
            <label
              style={{
                display: 'flex', gap: 10, alignItems: 'flex-start',
                padding: '12px 14px', borderRadius: 8,
                background: C.lightGray, border: `1px solid ${C.border}`,
                cursor: 'pointer', marginBottom: 16,
              }}
            >
              <input
                type="checkbox"
                checked={consent}
                onChange={e => setConsent(e.target.checked)}
                style={{ marginTop: 2, accentColor: C.forest, flexShrink: 0, width: 15, height: 15 }}
              />
              <span style={{ fontSize: 12, color: C.text, lineHeight: 1.5 }}>
                I consent to share my settlement plan data with{' '}
                <strong>{consultantName}</strong> via Maple Insight. I understand
                this sends a PDF and data file to my consultant.
              </span>
            </label>

            {/* ── Turnstile CAPTCHA ── */}
            {siteKey && (
              <div style={{ marginBottom: 14 }}>
                <Turnstile
                  siteKey={siteKey}
                  onSuccess={token => setCaptchaToken(token)}
                  onExpire={() => setCaptchaToken(null)}
                />
              </div>
            )}

            {/* ── Error ── */}
            {status === 'error' && errorMsg && (
              <div style={{
                background: '#FEF2F2', border: '1px solid #FECACA',
                borderRadius: 7, padding: '9px 12px', marginBottom: 14,
                fontSize: 12, color: '#B91C1C',
              }}>
                {errorMsg}
              </div>
            )}

            {/* ── Actions ── */}
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={onClose}
                style={{
                  flex: 1, padding: '11px 16px', borderRadius: 9,
                  border: `1px solid ${C.border}`, background: C.white,
                  color: C.text, fontWeight: 600, fontSize: 13,
                  cursor: 'pointer', fontFamily: FONT,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSend}
                disabled={!canSubmit}
                style={{
                  flex: 2, padding: '11px 16px', borderRadius: 9,
                  border: 'none',
                  background: canSubmit ? C.red : '#F3F4F6',
                  color: canSubmit ? C.white : C.textLight,
                  fontWeight: 700, fontSize: 13,
                  cursor: canSubmit ? 'pointer' : 'not-allowed',
                  fontFamily: FONT,
                  boxShadow: canSubmit ? `0 2px 8px ${C.red}33` : 'none',
                  transition: 'background 0.15s, color 0.15s',
                }}
              >
                {status === 'loading' ? 'Sending…' : '✈ Send to Consultant'}
              </button>
            </div>

            <p style={{ fontSize: 11, color: C.textLight, margin: '10px 0 0', textAlign: 'center', lineHeight: 1.5 }}>
              Your consultant receives a PDF + importable data file. No data is stored on Maple Insight servers.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
