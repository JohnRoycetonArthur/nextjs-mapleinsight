'use client'

/**
 * Step 5: Savings & Obligations (US-11.6, US-20.2, US-22.1)
 *
 * Collects: liquid savings (required), monthly obligations (optional),
 * monthly savings capacity (optional), and funds composition
 * (borrowed/gifted amounts — US-20.2).
 *
 * US-22.1: currency selector (CAD/USD/INR/CNY/PHP/NGN/GBP/EUR),
 * transparent CAD conversion card, exchange-rate risk note.
 */

import { useEffect, useState } from 'react'
import { CurrencyExchange, Info } from '@material-symbols-svg/react'
import { C, FONT, SERIF } from '../constants'
import type { WizardAnswers } from '../../SettlementSessionContext'
import {
  CURRENCY_SYMBOLS,
  FALLBACK_RATES,
  type SupportedCurrency,
  fetchExchangeRate,
} from '@/lib/settlement-engine/currency'

// ─── Design primitives ────────────────────────────────────────────────────────

const Label = ({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) => (
  <label
    htmlFor={htmlFor}
    style={{ display: 'block', fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 8, fontFamily: FONT }}
  >
    {children}
  </label>
)

const Helper = ({ children }: { children: React.ReactNode }) => (
  <p style={{ fontSize: 12, color: C.textLight, margin: '4px 0 0', lineHeight: 1.5, fontFamily: FONT }}>
    {children}
  </p>
)

// ─── Currency input ───────────────────────────────────────────────────────────

function CurrencyInput({
  id, value, onChange, placeholder = '0', error, prefix = 'CA$',
}: {
  id?: string
  value:       string
  onChange:    (v: string) => void
  placeholder?: string
  error?:       string
  prefix?:      string
}) {
  const [focused, setFocused] = useState(false)
  const prefixWidth = prefix.length <= 3 ? 52 : prefix.length <= 4 ? 60 : 72

  return (
    <div style={{ maxWidth: 280 }}>
      <div style={{ position: 'relative' }}>
        <div style={{
          position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
          fontSize: 13, fontWeight: 600, color: C.textLight, fontFamily: FONT,
          pointerEvents: 'none',
        }}>
          {prefix}
        </div>
        <input
          id={id}
          type="text"
          inputMode="decimal"
          placeholder={placeholder}
          value={value}
          onChange={e => onChange(e.target.value.replace(/[^0-9.,]/g, ''))}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          aria-invalid={!!error}
          aria-describedby={error && id ? `${id}-error` : undefined}
          style={{
            width: '100%', padding: '12px 16px', paddingLeft: prefixWidth, borderRadius: 10,
            border: `1px solid ${error ? C.red : focused ? C.accent : C.border}`,
            boxShadow: focused ? `0 0 0 3px ${C.accent}18` : 'none',
            fontSize: 14, fontFamily: FONT, color: C.text,
            outline: 'none', background: C.white,
            transition: 'border-color 0.2s, box-shadow 0.2s',
          }}
        />
      </div>
      {error && (
        <p id={id ? `${id}-error` : undefined} role="alert" style={{ fontSize: 12, color: C.red, margin: '6px 0 0', fontFamily: FONT }}>
          {error}
        </p>
      )}
    </div>
  )
}

// ─── Toggle ───────────────────────────────────────────────────────────────────

function Toggle({ label, checked, onChange }: {
  label:    string
  checked:  boolean
  onChange: () => void
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={onChange}
        style={{
          width: 44, height: 24, borderRadius: 12,
          background: checked ? C.gold : C.border,
          position: 'relative', cursor: 'pointer', flexShrink: 0,
          border: 'none', transition: 'background 0.2s', padding: 0,
        }}
      >
        <div style={{
          width: 20, height: 20, borderRadius: 10, background: C.white,
          position: 'absolute', top: 2, left: checked ? 22 : 2,
          transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
        }} />
      </button>
      <span style={{ fontSize: 13, fontWeight: 600, color: C.text, fontFamily: FONT }}>
        {label}
      </span>
    </div>
  )
}

// ─── Currency selector ────────────────────────────────────────────────────────

const CURRENCIES: SupportedCurrency[] = ['CAD', 'USD', 'INR', 'CNY', 'PHP', 'NGN', 'GBP', 'EUR']

function CurrencySelector({
  selected,
  onChange,
}: {
  selected: SupportedCurrency
  onChange: (c: SupportedCurrency) => void
}) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: C.text, fontFamily: FONT, marginBottom: 8 }}>
        Savings currency
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {CURRENCIES.map(c => {
          const isActive = selected === c
          return (
            <button
              key={c}
              type="button"
              onClick={() => onChange(c)}
              aria-pressed={isActive}
              style={{
                padding: '5px 12px', borderRadius: 20, fontSize: 12,
                fontFamily: FONT, cursor: 'pointer', fontWeight: isActive ? 700 : 400,
                border: `1px solid ${isActive ? C.accent : C.border}`,
                background: isActive ? '#ECFDF5' : C.white,
                color: isActive ? C.accent : C.text,
                transition: 'all 0.15s',
              }}
            >
              {c}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── CAD conversion card ──────────────────────────────────────────────────────

function ConversionCard({
  currency,
  rawAmount,
  rate,
  rateDate,
}: {
  currency: SupportedCurrency
  rawAmount: string
  rate: number
  rateDate: string
}) {
  const num = parseFloat(rawAmount.replace(/,/g, '')) || 0
  if (num <= 0) return null
  const cad = Math.round(num * rate)

  return (
    <div style={{
      marginTop: 10, padding: '12px 16px',
      background: '#ECFDF5', borderRadius: 10,
      border: `1px solid ${C.accent}40`,
      display: 'flex', alignItems: 'center', gap: 10,
    }}>
      <CurrencyExchange size={16} color={C.accent} style={{ flexShrink: 0 }} />
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.accent, fontFamily: FONT }}>
          ≈ CA${cad.toLocaleString()} CAD
        </div>
        <div style={{ fontSize: 11, color: C.gray, fontFamily: FONT, marginTop: 1 }}>
          1 {currency} = {rate} CAD &nbsp;·&nbsp; rate as of {rateDate}
        </div>
      </div>
    </div>
  )
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  data:     WizardAnswers
  onChange: (key: keyof WizardAnswers, value: unknown) => void
  errors:   Record<string, string>
}

// ─── Step 5: Savings & Obligations ───────────────────────────────────────────

export function Step5Savings({ data, onChange, errors }: Props) {
  const [showComposition, setShowComposition] = useState<boolean>(
    () => !!(data.fundsComposition?.borrowed || data.fundsComposition?.gifted)
  )

  // ── Currency state ────────────────────────────────────────────────────────
  const [selectedCurrency, setSelectedCurrency] = useState<SupportedCurrency>(
    () => (data.inputCurrency as SupportedCurrency) ?? 'CAD'
  )
  const [rateDate, setRateDate] = useState<string>(
    () => data.exchangeRateDate ?? new Date().toISOString().slice(0, 10)
  )

  // Fetch rate and propagate to WizardAnswers when currency changes
  useEffect(() => {
    if (selectedCurrency === 'CAD') {
      onChange('inputCurrency', 'CAD')
      onChange('exchangeRate', 1.0)
      onChange('exchangeRateDate', undefined)
      setRateDate(new Date().toISOString().slice(0, 10))
      return
    }
    let cancelled = false
    fetchExchangeRate(selectedCurrency).then(rec => {
      if (cancelled) return
      onChange('inputCurrency', selectedCurrency)
      onChange('exchangeRate', rec.rateToCAD)
      onChange('exchangeRateDate', rec.sourceDate)
      setRateDate(rec.sourceDate)
    }).catch(() => {
      if (cancelled) return
      const fallback = FALLBACK_RATES[selectedCurrency] ?? 1.0
      const today = new Date().toISOString().slice(0, 10)
      onChange('inputCurrency', selectedCurrency)
      onChange('exchangeRate', fallback)
      onChange('exchangeRateDate', today)
      setRateDate(today)
    })
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCurrency])

  const activeRate    = data.exchangeRate ?? 1.0
  const isNonCAD      = selectedCurrency !== 'CAD'
  const savingsPrefix = isNonCAD
    ? `${CURRENCY_SYMBOLS[selectedCurrency] ?? selectedCurrency} `
    : 'CA$'

  const borrowed = data.fundsComposition?.borrowed ?? ''
  const gifted   = data.fundsComposition?.gifted   ?? ''

  function handleToggle() {
    const next = !showComposition
    setShowComposition(next)
    if (!next) {
      onChange('fundsComposition', undefined)
    }
  }

  function handleBorrowed(v: string) {
    onChange('fundsComposition', { borrowed: v, gifted })
  }

  function handleGifted(v: string) {
    onChange('fundsComposition', { borrowed, gifted: v })
  }

  const borrowedNum = parseFloat(borrowed.replace(/,/g, '')) || 0
  const giftedNum   = parseFloat(gifted.replace(/,/g, ''))   || 0

  return (
    <div>
      <h2 style={{ fontFamily: SERIF, fontSize: 24, color: C.forest, margin: '0 0 6px' }}>
        Your financial position
      </h2>
      <p style={{ fontSize: 14, color: C.gray, margin: '0 0 28px', lineHeight: 1.6, fontFamily: FONT }}>
        Tell us about your current savings and ongoing commitments.
      </p>

      {/* ── Liquid savings (required) (AC-1, AC-2) ────────────────────────── */}
      <div style={{ marginBottom: 24 }}>
        <Label htmlFor="savings-input">
          Liquid savings available for the move *
        </Label>

        {/* Currency selector (US-22.1) */}
        <CurrencySelector
          selected={selectedCurrency}
          onChange={c => setSelectedCurrency(c)}
        />

        <CurrencyInput
          id="savings-input"
          value={data.savings ?? ''}
          onChange={v => onChange('savings', v)}
          placeholder="e.g. 18,000"
          error={errors.savings}
          prefix={savingsPrefix}
        />

        {/* CAD conversion card — shown when non-CAD currency is selected */}
        {isNonCAD && (
          <ConversionCard
            currency={selectedCurrency}
            rawAmount={data.savings ?? ''}
            rate={activeRate}
            rateDate={rateDate}
          />
        )}

        <Helper>
          {isNonCAD
            ? `Enter your savings in ${selectedCurrency}. We'll convert to CAD using the rate above.`
            : 'Include cash, savings accounts, and easily accessible investments.'}
        </Helper>
      </div>

      {/* ── Funds composition toggle (US-20.2 AC-1) ───────────────────────── */}
      <div style={{ marginBottom: 24 }}>
        <Toggle
          label="Are any of your savings borrowed or gifted?"
          checked={showComposition}
          onChange={handleToggle}
        />

        {showComposition && (
          <div style={{
            padding: 20, background: '#FFFBEB', borderRadius: 12,
            border: `1px solid ${C.gold}50`, marginTop: 4,
          }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.gold, marginBottom: 12, fontFamily: FONT }}>
              Funds Composition (Optional)
            </div>

            {/* Amount borrowed (AC-2) */}
            <div style={{ marginBottom: 16 }}>
              <Label htmlFor="borrowed-input">Amount borrowed</Label>
              <CurrencyInput
                id="borrowed-input"
                value={borrowed}
                onChange={handleBorrowed}
                placeholder="0"
              />
              <Helper>Loans taken specifically for immigration funds.</Helper>
            </div>

            {/* Amount gifted (AC-2) */}
            <div style={{ marginBottom: borrowedNum > 0 || giftedNum > 0 ? 16 : 0 }}>
              <Label htmlFor="gifted-input">Amount gifted</Label>
              <CurrencyInput
                id="gifted-input"
                value={gifted}
                onChange={handleGifted}
                placeholder="0"
              />
              <Helper>Gifts from family or friends.</Helper>
            </div>

            {/* Gifted funds info note (AC-4) */}
            {giftedNum > 0 && (
              <div style={{
                display: 'flex', alignItems: 'flex-start', gap: 10,
                padding: '12px 16px', background: '#EFF6FF', borderRadius: 10,
                border: '1px solid #BFDBFE', marginTop: 12,
              }}>
                <Info size={14} color={C.blue} style={{ flexShrink: 0, marginTop: 1 }} />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: C.blue, fontFamily: FONT }}>
                    Gifted funds — documentation required
                  </div>
                  <div style={{ fontSize: 11, color: C.text, marginTop: 2, lineHeight: 1.5, fontFamily: FONT }}>
                    Gifted funds may be accepted with proper documentation. A signed gift letter from the donor confirming the gift is not a loan is recommended.
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Monthly obligations (optional) (AC-1, AC-3) ───────────────────── */}
      <div style={{ marginBottom: 24 }}>
        <Label htmlFor="obligations-input">Monthly financial obligations (CAD)</Label>
        <CurrencyInput
          id="obligations-input"
          value={data.obligations ?? ''}
          onChange={v => onChange('obligations', v)}
          placeholder="e.g. 300"
        />
        <Helper>Ongoing payments like student loans, family support, or debt repayments.</Helper>
      </div>

      {/* ── Monthly savings capacity (optional) (AC-1) ────────────────────── */}
      <div>
        <Label htmlFor="capacity-input">Monthly savings capacity (CAD)</Label>
        <CurrencyInput
          id="capacity-input"
          value={data.savingsCapacity ?? ''}
          onChange={v => onChange('savingsCapacity', v)}
          placeholder="e.g. 500"
        />
        <Helper>Optional. Used to estimate how long it takes to close any savings gap.</Helper>
      </div>
    </div>
  )
}
