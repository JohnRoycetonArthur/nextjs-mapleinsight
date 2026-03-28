'use client'

/**
 * useScenarioBuilder — US-21.1
 *
 * Manages all 4 filter states + monthly savings.
 * Runs a COMBINED recalculation on every filter change (client-side only, < 100ms).
 * Persists filter state to sessionStorage so it survives tab navigation.
 */

import { useState, useMemo, useEffect } from 'react'
import type { EngineInput, EngineOutput } from '@/lib/settlement-engine/types'
import {
  CITY_DATA, HOUSING_MULT, HOUSING_LABELS, JOB_OPTIONS, DELAY_OPTIONS,
  engineHousingToKey, engineJobToKey, toCityKey,
  type CityKey, type HousingKey, type JobKey, type DelayKey,
} from '@/lib/settlement-engine/scenario-builder-constants'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ScenarioBaseline {
  city:             CityKey
  housing:          HousingKey
  delay:            DelayKey
  jobStatus:        JobKey
  savings:          number
  runway:           number
  rent:             number
  transit:          number
  monthlyOther:     number
  upfrontExHousing: number
  upfront:          number
  monthly:          number
  safeTarget:       number
  gap:              number
}

export interface ScenarioResult {
  rent:             number
  transit:          number
  monthly:          number
  runway:           number
  upfront:          number
  safeTarget:       number
  gap:              number
  effectiveSavings: number
  delaySavings:     number
  housingDeposit:   number
}

export interface ScenarioDelta {
  rent:      number
  transit:   number
  monthly:   number
  upfront:   number
  runway:    number
  savings:   number
  safeTarget: number
  gap:       number
}

export interface UseScenarioBuilderReturn {
  // Filter state
  city:          CityKey
  housing:       HousingKey
  delay:         DelayKey
  jobStatus:     JobKey
  monthlySavings: number
  // Setters
  setCity:          (v: CityKey) => void
  setHousing:       (v: HousingKey) => void
  setDelay:         (v: DelayKey) => void
  setJobStatus:     (v: JobKey) => void
  setMonthlySavings: (v: number) => void
  // Derived
  baseline:       ScenarioBaseline
  scenario:       ScenarioResult
  delta:          ScenarioDelta
  isModified:     boolean
  changedFilters: string[]
  resetAll:       () => void
}

// ─── Session persistence key ──────────────────────────────────────────────────

const SESSION_KEY = 'mi_scenario_builder_v1'

interface PersistedState {
  city:          CityKey
  housing:       HousingKey
  delay:         DelayKey
  jobStatus:     JobKey
  monthlySavings: number
}

function loadFromSession(): PersistedState | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (!raw) return null
    return JSON.parse(raw) as PersistedState
  } catch {
    return null
  }
}

function saveToSession(state: PersistedState): void {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(state))
  } catch {
    // sessionStorage unavailable — degrade silently
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useScenarioBuilder(
  engineInput: EngineInput,
  engineOutput: EngineOutput,
): UseScenarioBuilderReturn {

  // ── Derive baseline from engine output ────────────────────────────────────
  const baseline = useMemo<ScenarioBaseline>(() => {
    const cityKey    = toCityKey(engineInput.city)
    const housingKey = engineHousingToKey(engineInput.housingType)
    const jobKey     = engineJobToKey(engineInput.jobStatus)
    const cityData   = CITY_DATA[cityKey]

    const rent    = Math.round(cityData.rent1br * HOUSING_MULT[housingKey])
    const transit = cityData.transit

    // "Other monthly" is everything in monthlySafe except rent and transit
    const monthlyOther     = Math.max(0, engineOutput.monthlySafe - rent - transit)
    // Upfront excluding housing deposit (housing deposit = rent × 2)
    const upfrontExHousing = Math.max(0, engineOutput.upfront - rent * 2)
    const monthly          = rent + transit + monthlyOther
    const safeTarget       = engineOutput.safeSavingsTarget
    const gap              = engineOutput.savingsGap

    return {
      city:             cityKey,
      housing:          housingKey,
      delay:            'now',
      jobStatus:        jobKey,
      savings:          engineInput.liquidSavings,
      runway:           engineOutput.runwayMonths,
      rent,
      transit,
      monthlyOther,
      upfrontExHousing,
      upfront:          engineOutput.upfront,
      monthly,
      safeTarget,
      gap,
    }
  }, [engineInput, engineOutput])

  // ── Filter state — initialise from sessionStorage or baseline ────────────
  const [city,          setCity]          = useState<CityKey>(() => loadFromSession()?.city          ?? baseline.city)
  const [housing,       setHousing]       = useState<HousingKey>(() => loadFromSession()?.housing     ?? baseline.housing)
  const [delay,         setDelay]         = useState<DelayKey>(() => loadFromSession()?.delay         ?? 'now')
  const [jobStatus,     setJobStatus]     = useState<JobKey>(() => loadFromSession()?.jobStatus       ?? baseline.jobStatus)
  const [monthlySavings, setMonthlySavings] = useState<number>(() => loadFromSession()?.monthlySavings ?? 500)

  // ── Persist on every change ───────────────────────────────────────────────
  useEffect(() => {
    saveToSession({ city, housing, delay, jobStatus, monthlySavings })
  }, [city, housing, delay, jobStatus, monthlySavings])

  // ── Combined recalculation ────────────────────────────────────────────────
  const scenario = useMemo<ScenarioResult>(() => {
    const cityData      = CITY_DATA[city]
    const rent          = Math.round(cityData.rent1br * HOUSING_MULT[housing])
    const transit       = cityData.transit
    const monthly       = rent + transit + baseline.monthlyOther

    const jobOption     = JOB_OPTIONS.find(j => j.key === jobStatus)!
    const runway        = jobOption.runway ?? baseline.runway

    const delayOption   = DELAY_OPTIONS.find(d => d.key === delay)!
    const delaySavings  = delayOption.months * monthlySavings
    const effectiveSavings = baseline.savings + delaySavings

    const housingDeposit  = rent * 2
    const upfront         = baseline.upfrontExHousing + housingDeposit
    const safeTarget      = Math.round((upfront + monthly * runway) * 1.10)
    const gap             = Math.max(0, safeTarget - effectiveSavings)

    return { rent, transit, monthly, runway, upfront, safeTarget, gap, effectiveSavings, delaySavings, housingDeposit }
  }, [city, housing, delay, jobStatus, monthlySavings, baseline])

  // ── Delta ─────────────────────────────────────────────────────────────────
  const delta = useMemo<ScenarioDelta>(() => ({
    rent:      scenario.rent      - baseline.rent,
    transit:   scenario.transit   - baseline.transit,
    monthly:   scenario.monthly   - baseline.monthly,
    upfront:   scenario.upfront   - baseline.upfront,
    runway:    scenario.runway    - baseline.runway,
    savings:   scenario.effectiveSavings - baseline.savings,
    safeTarget: scenario.safeTarget - baseline.safeTarget,
    gap:       scenario.gap       - baseline.gap,
  }), [scenario, baseline])

  // ── Changed filters (for badge + summary) ────────────────────────────────
  const changedFilters = useMemo<string[]>(() => {
    const changes: string[] = []
    if (city !== baseline.city)                   changes.push(CITY_DATA[city].label)
    if (housing !== baseline.housing)             changes.push(HOUSING_LABELS[housing])
    if (delay !== 'now')                          changes.push(DELAY_OPTIONS.find(d => d.key === delay)!.label)
    if (delay !== 'now' && monthlySavings > 0)   changes.push(`$${monthlySavings.toLocaleString()}/mo savings`)
    if (jobStatus !== baseline.jobStatus)         changes.push(JOB_OPTIONS.find(j => j.key === jobStatus)!.label)
    return changes
  }, [city, housing, delay, monthlySavings, jobStatus, baseline])

  const isModified = changedFilters.length > 0

  // ── Reset all ─────────────────────────────────────────────────────────────
  const resetAll = () => {
    setCity(baseline.city)
    setHousing(baseline.housing)
    setDelay('now')
    setJobStatus(baseline.jobStatus)
    setMonthlySavings(500)
  }

  return {
    city, housing, delay, jobStatus, monthlySavings,
    setCity, setHousing, setDelay, setJobStatus, setMonthlySavings,
    baseline, scenario, delta,
    isModified, changedFilters, resetAll,
  }
}
