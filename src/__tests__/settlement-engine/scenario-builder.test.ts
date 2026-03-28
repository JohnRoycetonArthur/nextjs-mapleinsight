/**
 * Integration test — US-21.1 Scenario Builder combined recalculation
 *
 * Verifies the combined recalculation formula produces correct values when
 * multiple filters are changed simultaneously.
 *
 * Scenario under test: winnipeg + studio + delay 3 months + $500/mo savings + secured_2mo
 */

import {
  CITY_DATA,
  HOUSING_MULT,
  JOB_OPTIONS,
  DELAY_OPTIONS,
  engineHousingToKey,
  engineJobToKey,
  toCityKey,
} from '@/lib/settlement-engine/scenario-builder-constants'

// ─── Baseline constants (matching the design comp BASELINE fixture) ────────

const BASELINE_CITY        = 'toronto' as const
const BASELINE_HOUSING     = '1br'     as const
const BASELINE_SAVINGS     = 18_000
const BASELINE_RUNWAY      = 6
const BASELINE_RENT        = Math.round(CITY_DATA.toronto.rent1br * HOUSING_MULT['1br'])  // 1761
const BASELINE_TRANSIT     = CITY_DATA.toronto.transit                                      // 156
const BASELINE_MONTHLY_OTHER = 930
const BASELINE_UPFRONT       = 7_472
const BASELINE_UPFRONT_EX_HOUSING = BASELINE_UPFRONT - (BASELINE_RENT * 2)                  // 7472 - 3522 = 3950

// ─── Scenario inputs ──────────────────────────────────────────────────────

const SCENARIO_CITY     = 'winnipeg' as const
const SCENARIO_HOUSING  = 'studio'   as const
const SCENARIO_DELAY    = '3mo'      as const
const SCENARIO_SAVINGS  = 500
const SCENARIO_JOB      = 'secured_2mo' as const

// ─── Test suite ───────────────────────────────────────────────────────────

describe('Scenario Builder — combined recalculation', () => {

  it('CITY_DATA contains all 7 cities with correct values', () => {
    expect(Object.keys(CITY_DATA)).toHaveLength(7)
    expect(CITY_DATA.toronto.rent1br).toBe(1761)
    expect(CITY_DATA.toronto.transit).toBe(156)
    expect(CITY_DATA.winnipeg.rent1br).toBe(1232)
    expect(CITY_DATA.winnipeg.transit).toBe(119)
  })

  it('HOUSING_MULT contains all 5 options', () => {
    expect(HOUSING_MULT['family-friends']).toBe(0)
    expect(HOUSING_MULT.studio).toBe(0.85)
    expect(HOUSING_MULT['1br']).toBe(1.0)
    expect(HOUSING_MULT['2br']).toBe(1.25)
    expect(HOUSING_MULT['3br+']).toBe(1.55)
  })

  it('JOB_OPTIONS has correct runway values', () => {
    expect(JOB_OPTIONS.find(j => j.key === 'secured_now')?.runway).toBe(1)
    expect(JOB_OPTIONS.find(j => j.key === 'secured_2mo')?.runway).toBe(2)
    expect(JOB_OPTIONS.find(j => j.key === 'secured_6mo')?.runway).toBe(6)
    expect(JOB_OPTIONS.find(j => j.key === 'secured_1yr')?.runway).toBe(12)
    expect(JOB_OPTIONS.find(j => j.key === 'no_job')?.runway).toBeNull()
  })

  it('toCityKey handles all city strings', () => {
    expect(toCityKey('toronto')).toBe('toronto')
    expect(toCityKey('Vancouver')).toBe('vancouver')
    expect(toCityKey('montreal')).toBe('montreal')
    expect(toCityKey('unknown')).toBe('toronto')  // fallback
    expect(toCityKey(undefined)).toBe('toronto')  // fallback
  })

  it('engineHousingToKey maps all engine housing types', () => {
    expect(engineHousingToKey('staying-family')).toBe('family-friends')
    expect(engineHousingToKey('studio')).toBe('studio')
    expect(engineHousingToKey('1br')).toBe('1br')
    expect(engineHousingToKey('2br')).toBe('2br')
    expect(engineHousingToKey('shared-room')).toBe('1br')  // fallback
    expect(engineHousingToKey('on-campus')).toBe('1br')    // fallback
    expect(engineHousingToKey('homestay')).toBe('1br')     // fallback
  })

  it('engineJobToKey maps all engine job statuses', () => {
    expect(engineJobToKey('secured')).toBe('secured_now')
    expect(engineJobToKey('offer')).toBe('secured_2mo')
    expect(engineJobToKey('none')).toBe('no_job')
    expect(engineJobToKey('student')).toBe('no_job')
  })

  it('combined recalculation: winnipeg + studio + 3mo delay + $500/mo + secured_2mo', () => {
    // ── Step 1: compute scenario rent ───────────────────────────────────
    const cityData  = CITY_DATA[SCENARIO_CITY]
    const rent      = Math.round(cityData.rent1br * HOUSING_MULT[SCENARIO_HOUSING])
    // 1232 × 0.85 = 1047.2 → rounded → 1047
    expect(rent).toBe(1047)

    // ── Step 2: transit ─────────────────────────────────────────────────
    const transit = cityData.transit
    expect(transit).toBe(119)

    // ── Step 3: total monthly ────────────────────────────────────────────
    const monthly = rent + transit + BASELINE_MONTHLY_OTHER
    // 1047 + 119 + 930 = 2096
    expect(monthly).toBe(2096)

    // ── Step 4: runway from job option ───────────────────────────────────
    const jobOption = JOB_OPTIONS.find(j => j.key === SCENARIO_JOB)!
    const runway    = jobOption.runway ?? BASELINE_RUNWAY
    expect(runway).toBe(2)

    // ── Step 5: delay savings ────────────────────────────────────────────
    const delayOption  = DELAY_OPTIONS.find(d => d.key === SCENARIO_DELAY)!
    const delaySavings = delayOption.months * SCENARIO_SAVINGS
    // 3 × 500 = 1500
    expect(delaySavings).toBe(1500)

    const effectiveSavings = BASELINE_SAVINGS + delaySavings
    // 18000 + 1500 = 19500
    expect(effectiveSavings).toBe(19_500)

    // ── Step 6: upfront ──────────────────────────────────────────────────
    const housingDeposit = rent * 2
    // 1047 × 2 = 2094
    expect(housingDeposit).toBe(2094)

    const upfront = BASELINE_UPFRONT_EX_HOUSING + housingDeposit
    // 3950 + 2094 = 6044
    expect(upfront).toBe(6044)

    // ── Step 7: safe target ──────────────────────────────────────────────
    const safeTarget = Math.round((upfront + monthly * runway) * 1.10)
    // (6044 + 2096 × 2) × 1.10 = (6044 + 4192) × 1.10 = 10236 × 1.10 = 11259.6 → 11260
    expect(safeTarget).toBe(11_260)

    // ── Step 8: gap ──────────────────────────────────────────────────────
    const gap = Math.max(0, safeTarget - effectiveSavings)
    // max(0, 11260 - 19500) = 0 (gap eliminated!)
    expect(gap).toBe(0)

    // ── Step 9: deltas vs baseline ───────────────────────────────────────
    expect(rent - BASELINE_RENT).toBe(1047 - 1761)            // -714
    expect(transit - BASELINE_TRANSIT).toBe(119 - 156)        // -37
    expect(monthly - (BASELINE_RENT + BASELINE_TRANSIT + BASELINE_MONTHLY_OTHER)).toBe(2096 - 2847)  // -751
    expect(runway - BASELINE_RUNWAY).toBe(2 - 6)              // -4
    expect(effectiveSavings - BASELINE_SAVINGS).toBe(1500)    // +1500 (savings increased)
    expect(gap - 8000).toBe(-8000)                            // gap went from 8000 to 0
  })

  it('family-friends housing sets rent and deposit to $0', () => {
    const rent = Math.round(CITY_DATA.toronto.rent1br * HOUSING_MULT['family-friends'])
    expect(rent).toBe(0)
    const housingDeposit = rent * 2
    expect(housingDeposit).toBe(0)
  })

  it('filters combine — multiple changes produce single recalculation', () => {
    // Verify that the formula with multiple simultaneous changes is consistent
    const city1   = 'montreal' as const
    const housing1 = '2br'    as const
    const delay1  = '6mo'     as const
    const savings1 = 1000
    const job1    = 'secured_1yr' as const

    const rent    = Math.round(CITY_DATA[city1].rent1br * HOUSING_MULT[housing1])
    expect(rent).toBe(Math.round(1131 * 1.25))  // 1413 (rounded)

    const runway  = JOB_OPTIONS.find(j => j.key === job1)!.runway!
    expect(runway).toBe(12)

    const delaySavings    = 6 * savings1   // 6000
    const effectiveSavings = BASELINE_SAVINGS + delaySavings  // 24000
    expect(effectiveSavings).toBe(24_000)
  })
})
