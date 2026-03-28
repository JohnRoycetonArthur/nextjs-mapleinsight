/**
 * Settlement Planner — Multi-Currency Support (US-22.1)
 *
 * Fetches exchange rates from Sanity (`exchangeRate` documents) and provides
 * a convertToCAD helper. Falls back to static rates when Sanity is unavailable.
 *
 * Uses an in-memory module-level cache so repeated calls within the same
 * server request or browser session do not re-query Sanity.
 */

import { createClient } from '@sanity/client'
import { apiVersion, dataset, projectId } from '@/sanity/env'

// ─── Supported currencies ─────────────────────────────────────────────────────

export type SupportedCurrency = 'CAD' | 'USD' | 'INR' | 'CNY' | 'PHP' | 'NGN' | 'GBP' | 'EUR'

export const CURRENCY_LABELS: Record<SupportedCurrency, string> = {
  CAD: 'CAD — Canadian Dollar',
  USD: 'USD — US Dollar',
  INR: 'INR — Indian Rupee',
  CNY: 'CNY — Chinese Yuan',
  PHP: 'PHP — Philippine Peso',
  NGN: 'NGN — Nigerian Naira',
  GBP: 'GBP — British Pound',
  EUR: 'EUR — Euro',
}

export const CURRENCY_SYMBOLS: Record<SupportedCurrency, string> = {
  CAD: 'CA$', USD: 'US$', INR: '₹', CNY: '¥',
  PHP: '₱',  NGN: '₦',  GBP: '£', EUR: '€',
}

// ─── Static fallback rates (1 unit → CAD) ────────────────────────────────────
// These are used when Sanity is unavailable (e.g. during SSG or offline dev).

export const FALLBACK_RATES: Record<SupportedCurrency, number> = {
  CAD: 1.00,
  USD: 1.36,
  INR: 0.016,
  CNY: 0.19,
  PHP: 0.024,
  NGN: 0.00085,
  GBP: 1.72,
  EUR: 1.48,
}

// ─── Sanity client (CDN-enabled for public reads) ─────────────────────────────

const publicClient = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: true,
})

// ─── In-memory cache ──────────────────────────────────────────────────────────

interface RateRecord {
  rateToCAD:  number
  sourceDate: string
  source:     string
}

let cache: Map<SupportedCurrency, RateRecord> | null = null

// ─── fetchExchangeRates ───────────────────────────────────────────────────────

/**
 * Fetch all exchange rate documents from Sanity.
 * Returns a map of currency code → RateRecord.
 * Falls back to static FALLBACK_RATES on any error.
 */
export async function fetchExchangeRates(): Promise<Map<SupportedCurrency, RateRecord>> {
  if (cache) return cache

  try {
    const results = await publicClient.fetch<Array<{
      currency:   string
      rateToCAD:  number
      sourceDate: string
      source:     string
    }>>(
      `*[_type == "exchangeRate"] | order(currency asc) {
        currency,
        rateToCAD,
        sourceDate,
        source
      }`,
    )

    cache = new Map()
    for (const doc of results) {
      const key = doc.currency as SupportedCurrency
      cache.set(key, {
        rateToCAD:  doc.rateToCAD,
        sourceDate: doc.sourceDate,
        source:     doc.source,
      })
    }
    // Ensure CAD is always present
    if (!cache.has('CAD')) {
      cache.set('CAD', { rateToCAD: 1.00, sourceDate: new Date().toISOString().slice(0, 10), source: 'fixed' })
    }
  } catch {
    // Fall back to static rates silently
    cache = new Map()
    for (const [currency, rate] of Object.entries(FALLBACK_RATES)) {
      cache.set(currency as SupportedCurrency, {
        rateToCAD:  rate,
        sourceDate: '2026-03-28',
        source:     'fallback',
      })
    }
  }

  return cache
}

/**
 * Fetch the rate record for a single currency.
 * Returns the FALLBACK_RATES entry when Sanity returns nothing for that code.
 */
export async function fetchExchangeRate(currency: SupportedCurrency): Promise<RateRecord> {
  const rates = await fetchExchangeRates()
  return rates.get(currency) ?? {
    rateToCAD:  FALLBACK_RATES[currency] ?? 1.00,
    sourceDate: '2026-03-28',
    source:     'fallback',
  }
}

// ─── convertToCAD ─────────────────────────────────────────────────────────────

/**
 * Convert an amount in a foreign currency to CAD.
 * When currency is 'CAD' the amount is returned unchanged.
 */
export function convertToCAD(amount: number, rateToCAD: number): number {
  return Math.round(amount * rateToCAD)
}

/**
 * Clear the in-memory exchange rate cache.
 * Useful in tests or when rates are updated mid-session.
 */
export function clearExchangeRateCache(): void {
  cache = null
}
