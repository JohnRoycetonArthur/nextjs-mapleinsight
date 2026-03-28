'use client'

/**
 * useAssumptionOverrides — US-21.2
 *
 * Manages consultant overrides for four default assumptions:
 *   - runway months (1–12)
 *   - safety buffer % (0–25)
 *   - housing type (studio / 1br / 2br / 3br+)
 *   - fees paid status (biometrics toggle)
 *
 * Instantly recalculates safeTarget and gap client-side when any override changes.
 * Uses existing engineOutput breakdown data — no server calls required.
 */

import { useMemo, useState } from 'react'
import type { EngineInput, EngineOutput } from '@/lib/settlement-engine/types'
import {
  CITY_DATA, HOUSING_MULT,
  engineHousingToKey, toCityKey,
  type HousingKey,
} from '@/lib/settlement-engine/scenario-builder-constants'

// ─── Types ────────────────────────────────────────────────────────────────────

/** Housing options available in the override panel (excludes family-friends). */
export type OverrideHousingKey = 'studio' | '1br' | '2br' | '3br+'

export const OVERRIDE_HOUSING_OPTIONS: Array<{ key: OverrideHousingKey; label: string }> = [
  { key: 'studio', label: 'Studio'     },
  { key: '1br',    label: '1 Bedroom'  },
  { key: '2br',    label: '2 Bedroom'  },
  { key: '3br+',   label: '3+ Bedroom' },
]

export interface AssumptionOverrides {
  runway:   number             // months, 1–12
  buffer:   number             // %, 0–25 (stored as integer, e.g. 10 = 10%)
  housing:  OverrideHousingKey
  feesPaid: boolean
}

export interface OverrideResult {
  monthlySafe: number
  upfront:     number
  safeTarget:  number
  gap:         number
}

export interface UseAssumptionOverridesReturn {
  overrides:       AssumptionOverrides
  defaults:        AssumptionOverrides
  setRunway:       (v: number) => void
  setBuffer:       (v: number) => void
  setHousing:      (v: OverrideHousingKey) => void
  setFeesPaid:     (v: boolean) => void
  isModified:      boolean
  modifiedFields:  Array<keyof AssumptionOverrides>
  overrideResult:  OverrideResult
  resetAll:        () => void
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Maps engine HousingKey to an override panel key (family-friends → 1br). */
function toOverrideHousingKey(key: HousingKey): OverrideHousingKey {
  if (key === 'family-friends') return '1br'
  if (key === '3br+') return '3br+'
  return key as OverrideHousingKey
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAssumptionOverrides(
  engineInput: EngineInput,
  engineOutput: EngineOutput,
): UseAssumptionOverridesReturn {

  // ── Derive defaults from engine output ────────────────────────────────────
  const defaults = useMemo<AssumptionOverrides>(() => ({
    runway:   engineOutput.runwayMonths,
    buffer:   Math.round(engineOutput.bufferPercent * 100),
    housing:  toOverrideHousingKey(engineHousingToKey(engineInput.housingType)),
    feesPaid: engineInput.fees.biometricsPaid,
  }), [engineInput, engineOutput])

  // ── State ─────────────────────────────────────────────────────────────────
  const [runway,   setRunway]   = useState<number>(() => defaults.runway)
  const [buffer,   setBuffer]   = useState<number>(() => defaults.buffer)
  const [housing,  setHousing]  = useState<OverrideHousingKey>(() => defaults.housing)
  const [feesPaid, setFeesPaid] = useState<boolean>(() => defaults.feesPaid)

  const overrides: AssumptionOverrides = { runway, buffer, housing, feesPaid }

  // ── Which fields are modified ─────────────────────────────────────────────
  const modifiedFields = useMemo<Array<keyof AssumptionOverrides>>(() => {
    const changed: Array<keyof AssumptionOverrides> = []
    if (runway   !== defaults.runway)   changed.push('runway')
    if (buffer   !== defaults.buffer)   changed.push('buffer')
    if (housing  !== defaults.housing)  changed.push('housing')
    if (feesPaid !== defaults.feesPaid) changed.push('feesPaid')
    return changed
  }, [runway, buffer, housing, feesPaid, defaults])

  const isModified = modifiedFields.length > 0

  // ── Recalculation ─────────────────────────────────────────────────────────
  const overrideResult = useMemo<OverrideResult>(() => {
    // Find baseline rent and biometrics from existing breakdown
    const baselineRent  = engineOutput.monthlyBreakdown.find(b => b.key === 'rent')?.cad ?? 0
    const biometricsCad = engineOutput.upfrontBreakdown.find(b => b.key === 'biometrics')?.cad ?? 0
    const baselineDeposit = engineOutput.upfrontBreakdown.find(b => b.key === 'housing-deposit')?.cad ?? 0

    // Housing change — use CITY_DATA rent1br × HOUSING_MULT ratios
    const cityKey    = toCityKey(engineInput.city)
    const newRent    = Math.round(CITY_DATA[cityKey].rent1br * HOUSING_MULT[housing])
    const newDeposit = newRent * 2

    const rentDelta    = newRent    - baselineRent
    const depositDelta = newDeposit - baselineDeposit

    // Fees paid override — subtract biometrics if now paid (and it was in the breakdown)
    const feesDelta = (!defaults.feesPaid && feesPaid) ? -biometricsCad : 0

    const newMonthlySafe = Math.round(engineOutput.monthlySafe + rentDelta)
    const newUpfront     = Math.round(engineOutput.upfront + depositDelta + feesDelta)

    // Safe target: (upfront + monthly × runway) × (1 + buffer / 100)
    const runningTotal   = newUpfront + newMonthlySafe * runway
    const newSafeTarget  = Math.round(runningTotal * (1 + buffer / 100))
    const newGap         = Math.max(0, newSafeTarget - engineInput.liquidSavings)

    return {
      monthlySafe: newMonthlySafe,
      upfront:     newUpfront,
      safeTarget:  newSafeTarget,
      gap:         newGap,
    }
  }, [runway, buffer, housing, feesPaid, engineInput, engineOutput, defaults.feesPaid])

  // ── Reset ─────────────────────────────────────────────────────────────────
  const resetAll = () => {
    setRunway(defaults.runway)
    setBuffer(defaults.buffer)
    setHousing(defaults.housing)
    setFeesPaid(defaults.feesPaid)
  }

  return {
    overrides,
    defaults,
    setRunway,
    setBuffer,
    setHousing,
    setFeesPaid,
    isModified,
    modifiedFields,
    overrideResult,
    resetAll,
  }
}
