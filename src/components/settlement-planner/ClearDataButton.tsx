'use client'

import { useEffect, useState } from 'react'
import { useSettlementSession } from './SettlementSessionContext'

// ─── Confirmation dialog ───────────────────────────────────────────────────────

interface ClearDialogProps {
  onConfirm: () => void
  onCancel:  () => void
}

function ClearDialog({ onConfirm, onCancel }: ClearDialogProps) {
  return (
    <div
      style={{
        position:       'fixed',
        inset:          0,
        background:     'rgba(15,61,58,0.5)',
        backdropFilter: 'blur(4px)',
        zIndex:         300,
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        padding:        '20px',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel() }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="clear-data-dialog-title"
        style={{
          background:   '#fff',
          borderRadius: 16,
          padding:      '32px 28px',
          maxWidth:     380,
          width:        '100%',
          boxShadow:    '0 20px 60px rgba(0,0,0,0.15)',
        }}
      >
        {/* Icon */}
        <div
          aria-hidden="true"
          style={{
            width:          52,
            height:         52,
            borderRadius:   14,
            background:     '#FEF2F2',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            fontSize:       24,
            margin:         '0 auto 16px',
          }}
        >
          🗑️
        </div>

        <h3
          id="clear-data-dialog-title"
          style={{
            fontFamily: "var(--font-dm-serif, 'DM Serif Display', serif)",
            fontSize:   20,
            fontWeight: 700,
            color:      '#1B4F4A',
            margin:     '0 0 8px',
            textAlign:  'center',
          }}
        >
          Clear your data?
        </h3>
        <p
          style={{
            fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)",
            fontSize:   14,
            color:      '#6B7280',
            lineHeight: 1.6,
            margin:     '0 0 24px',
            textAlign:  'center',
          }}
        >
          All your questionnaire answers will be erased from this device. Your data was never sent to any server.
        </p>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onCancel}
            style={{
              flex:        1,
              padding:     '11px 16px',
              borderRadius: 10,
              border:      '1px solid #E5E7EB',
              background:  '#fff',
              fontFamily:  "var(--font-dm-sans, 'DM Sans', sans-serif)",
              fontSize:    14,
              fontWeight:  600,
              color:       '#374151',
              cursor:      'pointer',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#F9FAFB' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#fff' }}
          >
            Keep my data
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex:        1,
              padding:     '11px 16px',
              borderRadius: 10,
              border:      'none',
              background:  '#C41E3A',
              fontFamily:  "var(--font-dm-sans, 'DM Sans', sans-serif)",
              fontSize:    14,
              fontWeight:  700,
              color:       '#fff',
              cursor:      'pointer',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#A3172E' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#C41E3A' }}
          >
            Yes, clear it
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Toast ────────────────────────────────────────────────────────────────────

interface ToastProps {
  message: string
  onDone:  () => void
}

function Toast({ message, onDone }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onDone, 3_000)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position:     'fixed',
        bottom:       24,
        left:         '50%',
        transform:    'translateX(-50%)',
        background:   '#1B4F4A',
        color:        '#fff',
        borderRadius: 10,
        padding:      '12px 20px',
        fontFamily:   "var(--font-dm-sans, 'DM Sans', sans-serif)",
        fontSize:     14,
        fontWeight:   600,
        zIndex:       400,
        boxShadow:    '0 8px 24px rgba(0,0,0,0.18)',
        whiteSpace:   'nowrap',
      }}
    >
      {message}
    </div>
  )
}

// ─── ClearDataButton ─────────────────────────────────────────────────────────

interface Props {
  /** Called after data is cleared — use to reset wizard to step 1. */
  onCleared?: () => void
  variant?: 'subtle' | 'inline'
}

export function ClearDataButton({ onCleared, variant = 'subtle' }: Props) {
  const { clearSession }     = useSettlementSession()
  const [showDialog, setShowDialog] = useState(false)
  const [showToast,  setShowToast]  = useState(false)

  function handleConfirm() {
    clearSession()
    setShowDialog(false)
    setShowToast(true)
    onCleared?.()
  }

  const buttonStyle: React.CSSProperties =
    variant === 'inline'
      ? {
          background:  'none',
          border:      'none',
          padding:     '4px 0',
          fontFamily:  "var(--font-dm-sans, 'DM Sans', sans-serif)",
          fontSize:    13,
          color:       '#9CA3AF',
          cursor:      'pointer',
          textDecoration: 'underline',
          textUnderlineOffset: 2,
        }
      : {
          display:     'flex',
          alignItems:  'center',
          gap:         6,
          background:  'none',
          border:      '1px solid #E5E7EB',
          borderRadius: 8,
          padding:     '8px 14px',
          fontFamily:  "var(--font-dm-sans, 'DM Sans', sans-serif)",
          fontSize:    13,
          color:       '#6B7280',
          cursor:      'pointer',
          transition:  'border-color 0.15s, color 0.15s',
        }

  return (
    <>
      <button
        type="button"
        onClick={() => setShowDialog(true)}
        style={buttonStyle}
        onMouseEnter={(e) => {
          if (variant !== 'inline') {
            e.currentTarget.style.borderColor = '#C41E3A'
            e.currentTarget.style.color       = '#C41E3A'
          }
        }}
        onMouseLeave={(e) => {
          if (variant !== 'inline') {
            e.currentTarget.style.borderColor = '#E5E7EB'
            e.currentTarget.style.color       = '#6B7280'
          }
        }}
        aria-label="Clear all saved questionnaire data from this device"
      >
        {variant !== 'inline' && <span aria-hidden="true">🗑️</span>}
        Clear my data
      </button>

      {showDialog && (
        <ClearDialog
          onConfirm={handleConfirm}
          onCancel={() => setShowDialog(false)}
        />
      )}

      {showToast && (
        <Toast
          message="✓ Your data has been cleared"
          onDone={() => setShowToast(false)}
        />
      )}
    </>
  )
}
