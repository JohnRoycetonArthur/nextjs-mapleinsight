'use client'

import { useState } from 'react'
import { Turnstile } from '@marsidev/react-turnstile'
import type { MapleReportPackage } from '@/lib/settlement-engine/export'
import type { PublicFeedbackRating } from './types'
import {
  trackPublicFeedbackSubmitted,
  trackPublicReportSent,
  trackPublicShareLinkCopied,
  trackPublicShareSocial,
} from '@/lib/settlement-engine/analytics'

const C = {
  accent: '#1B7A4A',
  blue: '#2563EB',
  border: '#E5E7EB',
  forest: '#1B4F4A',
  gray: '#6B7280',
  lightGray: '#F3F4F6',
  text: '#374151',
  textLight: '#9CA3AF',
  white: '#FFFFFF',
}
const FONT = "'DM Sans', Helvetica, sans-serif"
const SERIF = "'DM Serif Display', Georgia, serif"
const SHARE_URL = 'https://mapleinsight.ca/settlement-planner/plan'

interface Props {
  reportPackage: MapleReportPackage
  onStartNewPlan?: () => void
}

const RATING_OPTIONS: Array<{ value: PublicFeedbackRating; label: string; emoji: string }> = [
  { value: 'very_helpful', label: 'Very helpful', emoji: '😊' },
  { value: 'somewhat_helpful', label: 'Somewhat helpful', emoji: '🙂' },
  { value: 'not_helpful', label: 'Not helpful', emoji: '😐' },
]

const SendIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
)

const CheckIcon = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
)

const ShareIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
  </svg>
)

const CopyIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="9" y="9" width="13" height="13" rx="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
)

const CompassIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.blue} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
  </svg>
)

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

async function copyShareUrl() {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(SHARE_URL)
    return
  }

  const textArea = document.createElement('textarea')
  textArea.value = SHARE_URL
  textArea.style.position = 'fixed'
  textArea.style.opacity = '0'
  document.body.appendChild(textArea)
  textArea.select()
  document.execCommand('copy')
  document.body.removeChild(textArea)
}

export function PublicModeSaveCard({ reportPackage, onStartNewPlan }: Props) {
  const [email, setEmail] = useState('')
  const [firstName, setFirstName] = useState('')
  const [feedback, setFeedback] = useState('')
  const [rating, setRating] = useState<PublicFeedbackRating | null>(null)
  const [captchaToken, setCaptchaToken] = useState<string | null>(
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ? null : 'dev',
  )
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle')
  const [emailError, setEmailError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const destination = reportPackage.answers.city ?? null
  const pathway = reportPackage.answers.pathway ?? null
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
  const canSubmit = status !== 'loading' && captchaToken !== null

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const trimmedEmail = email.trim()
    const trimmedFeedback = feedback.trim()

    if (!trimmedEmail) {
      setEmailError('Please enter your email address')
      return
    }
    if (!isValidEmail(trimmedEmail)) {
      setEmailError('Please enter a valid email address')
      return
    }

    setEmailError(null)
    setSubmitError(null)
    setStatus('loading')

    try {
      const response = await fetch('/api/reports/send-public', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: trimmedEmail,
          firstName: firstName.trim() || undefined,
          rating: rating ?? undefined,
          feedback: trimmedFeedback || undefined,
          captchaToken,
          reportPackage,
        }),
      })

      if (response.status === 429) {
        setSubmitError("You've reached the send limit. Please try again in about an hour.")
        setStatus('idle')
        return
      }
      if (!response.ok) {
        setSubmitError(response.status >= 500 ? 'Something went wrong. Please try again.' : 'Something went wrong. Please try again.')
        setStatus('idle')
        return
      }

      setStatus('success')
      trackPublicReportSent({ mode: 'public', destination, pathway })
      if (rating || trimmedFeedback) {
        trackPublicFeedbackSubmitted({ mode: 'public', destination, pathway })
      }
    } catch {
      setSubmitError('Something went wrong. Please try again.')
      setStatus('idle')
    }
  }

  async function handleCopyLink() {
    await copyShareUrl()
    setCopied(true)
    trackPublicShareLinkCopied({ mode: 'public' })
    window.setTimeout(() => setCopied(false), 2000)
  }

  function handleShare(platform: 'reddit' | 'whatsapp' | 'facebook') {
    const encodedUrl = encodeURIComponent(SHARE_URL)
    const urls = {
      reddit: `https://www.reddit.com/submit?url=${encodedUrl}&title=${encodeURIComponent('Free Canada settlement cost planner - estimate your move costs before arriving')}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(`Check out this free settlement cost planner for Canada: ${SHARE_URL}`)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    }

    trackPublicShareSocial({ mode: 'public', platform })
    window.open(urls[platform], '_blank', 'noopener,noreferrer')
  }

  return (
    <div style={{
      background: C.white,
      borderRadius: 14,
      border: `1px solid ${C.border}`,
      padding: '28px 30px',
      marginBottom: 14,
      boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
      fontFamily: FONT,
    }}>
      {status === 'success' ? (
        <div style={{ textAlign: 'center', padding: '8px 0' }}>
          <div style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: '#E8F5EE',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <CheckIcon />
          </div>
          <h3 style={{ fontFamily: SERIF, fontSize: 22, color: C.forest, margin: '0 0 8px' }}>
            Your report is on its way!
          </h3>
          <p style={{ fontSize: 14, color: C.text, margin: '0 0 6px', lineHeight: 1.65, maxWidth: 480, marginLeft: 'auto', marginRight: 'auto' }}>
            Check your inbox — your personalized settlement plan will arrive shortly.
          </p>
          {feedback.trim() && (
            <p style={{ fontSize: 13, color: C.gray, margin: '10px auto 0', lineHeight: 1.6, maxWidth: 440 }}>
              Thank you for sharing your feedback. It helps us keep improving this tool for newcomers like you.
            </p>
          )}

          <div style={{ background: C.lightGray, borderRadius: 12, padding: '18px 20px', marginTop: 24, textAlign: 'left' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <ShareIcon />
              <span style={{ fontSize: 14, fontWeight: 700, color: C.forest }}>
                Share this tool with someone preparing for Canada
              </span>
            </div>
            <button
              type="button"
              onClick={handleCopyLink}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 8,
                border: `1px solid ${C.border}`,
                background: C.white,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                cursor: 'pointer',
                fontFamily: FONT,
                marginBottom: 10,
              }}
            >
              <CopyIcon />
              <span style={{ fontSize: 13, color: C.text, flex: 1, textAlign: 'left' }}>
                mapleinsight.ca/settlement-planner/plan
              </span>
              <span style={{ fontSize: 12, fontWeight: 600, color: copied ? C.accent : C.blue, minWidth: 60, textAlign: 'right' }}>
                {copied ? 'Copied!' : 'Copy link'}
              </span>
            </button>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" onClick={() => handleShare('reddit')} style={{ flex: 1, padding: '9px 12px', borderRadius: 8, border: '1px solid #FF450015', background: '#FFF1ED', color: '#FF4500', fontWeight: 600, fontSize: 12, cursor: 'pointer', fontFamily: FONT }}>Reddit</button>
              <button type="button" onClick={() => handleShare('whatsapp')} style={{ flex: 1, padding: '9px 12px', borderRadius: 8, border: '1px solid #25D36615', background: '#ECFDF5', color: '#25D366', fontWeight: 600, fontSize: 12, cursor: 'pointer', fontFamily: FONT }}>WhatsApp</button>
              <button type="button" onClick={() => handleShare('facebook')} style={{ flex: 1, padding: '9px 12px', borderRadius: 8, border: '1px solid #1877F215', background: '#EFF6FF', color: '#1877F2', fontWeight: 600, fontSize: 12, cursor: 'pointer', fontFamily: FONT }}>Facebook</button>
            </div>
          </div>

          <div style={{
            background: C.white,
            borderRadius: 12,
            padding: '16px 20px',
            marginTop: 14,
            border: `1px dashed ${C.border}`,
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            textAlign: 'left',
          }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <CompassIcon />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.forest, marginBottom: 2 }}>Need a professional review?</div>
              <div style={{ fontSize: 12, color: C.gray, lineHeight: 1.5 }}>Maple Insight also offers consultant-led planning experiences with personalized advisory reviews.</div>
            </div>
          </div>

          <button
            type="button"
            onClick={onStartNewPlan}
            style={{
              marginTop: 18,
              padding: '10px 20px',
              borderRadius: 8,
              border: `1px solid ${C.border}`,
              background: 'transparent',
              color: C.gray,
              fontWeight: 600,
              fontSize: 13,
              cursor: 'pointer',
              fontFamily: FONT,
            }}
          >
            Start a new plan
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <h3 style={{ fontFamily: SERIF, fontSize: 20, color: C.forest, margin: '0 0 6px' }}>Save Your Plan</h3>
          <p style={{ fontSize: 14, color: C.gray, margin: '0 0 20px', lineHeight: 1.6 }}>
            Want a copy for later? Send this report to your email so you can revisit your estimates and checklist anytime.
          </p>

          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: C.text, display: 'block', marginBottom: 5 }}>
              Email address <span style={{ color: '#C41E3A' }}>*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value)
                if (emailError) setEmailError(null)
              }}
              placeholder="you@example.com"
              style={{
                width: '100%',
                padding: '11px 14px',
                borderRadius: 10,
                border: `1px solid ${emailError ? '#C41E3A' : C.border}`,
                fontSize: 14,
                fontFamily: FONT,
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            {emailError && (
              <p style={{ fontSize: 12, color: '#C41E3A', margin: '6px 0 0' }}>{emailError}</p>
            )}
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: C.text, display: 'block', marginBottom: 5 }}>
              First name <span style={{ fontSize: 11, fontWeight: 400, color: C.textLight }}>(optional)</span>
            </label>
            <input
              type="text"
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              placeholder="Your first name"
              style={{
                width: '100%',
                padding: '11px 14px',
                borderRadius: 10,
                border: `1px solid ${C.border}`,
                fontSize: 14,
                fontFamily: FONT,
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ borderTop: `1px solid ${C.border}`, margin: '20px 0 18px' }} />

          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: C.text, display: 'block', marginBottom: 8 }}>
              How helpful was this tool? <span style={{ fontSize: 11, fontWeight: 400, color: C.textLight }}>(optional)</span>
            </label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {RATING_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setRating((current) => current === option.value ? null : option.value)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 20,
                    border: `1.5px solid ${rating === option.value ? C.accent : C.border}`,
                    background: rating === option.value ? '#E8F5EE' : C.white,
                    color: rating === option.value ? C.forest : C.gray,
                    fontWeight: 600,
                    fontSize: 13,
                    cursor: 'pointer',
                    fontFamily: FONT,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <span style={{ fontSize: 16 }}>{option.emoji}</span>
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 18 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: C.text, display: 'block', marginBottom: 5 }}>
              What did you find most useful? <span style={{ fontSize: 11, fontWeight: 400, color: C.textLight }}>(optional)</span>
            </label>
            <textarea
              value={feedback}
              onChange={(event) => setFeedback(event.target.value)}
              rows={3}
              placeholder="Your feedback helps us improve this free planning tool for future newcomers."
              style={{
                width: '100%',
                padding: '11px 14px',
                borderRadius: 10,
                border: `1px solid ${C.border}`,
                fontSize: 14,
                fontFamily: FONT,
                outline: 'none',
                resize: 'vertical',
                boxSizing: 'border-box',
                lineHeight: 1.5,
              }}
            />
          </div>

          {siteKey && (
            <div style={{ marginBottom: 16 }}>
              <Turnstile
                siteKey={siteKey}
                onSuccess={(token) => setCaptchaToken(token)}
                onExpire={() => setCaptchaToken(null)}
              />
            </div>
          )}

          {submitError && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 12px', marginBottom: 16, fontSize: 13, color: '#B91C1C' }}>
              {submitError}
            </div>
          )}

          <button
            type="submit"
            disabled={!canSubmit}
            style={{
              width: '100%',
              padding: '14px 20px',
              borderRadius: 10,
              border: 'none',
              background: canSubmit ? C.accent : C.gray,
              color: '#fff',
              fontWeight: 700,
              fontSize: 15,
              cursor: canSubmit ? 'pointer' : 'not-allowed',
              fontFamily: FONT,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              boxShadow: canSubmit ? '0 2px 8px rgba(27,122,74,0.2)' : 'none',
            }}
          >
            <SendIcon />
            {status === 'loading' ? 'Sending...' : 'Email My Report'}
          </button>

          <p style={{ fontSize: 11, color: C.textLight, margin: '12px 0 0', lineHeight: 1.5, textAlign: 'center' }}>
            We only use your email to deliver this report. We may use anonymized feedback to improve the tool. Your comments will not be published with your name unless you give explicit permission.
          </p>
        </form>
      )}
    </div>
  )
}
