// ─── Scenario Builder Constants (US-21.1) ────────────────────────────────────
// City rental and transit data (CMHC 1BR benchmarks + transit pass costs)

export type CityKey = 'toronto' | 'vancouver' | 'calgary' | 'montreal' | 'ottawa' | 'halifax' | 'winnipeg'

export const CITY_DATA: Record<CityKey, { label: string; rent1br: number; transit: number; province: string }> = {
  toronto:   { label: 'Toronto',  rent1br: 1761, transit: 156,  province: 'ON' },
  vancouver: { label: 'Vancouver', rent1br: 1807, transit: 115,  province: 'BC' },
  calgary:   { label: 'Calgary',  rent1br: 1581, transit: 112,  province: 'AB' },
  montreal:  { label: 'Montréal', rent1br: 1131, transit: 97,   province: 'QC' },
  ottawa:    { label: 'Ottawa',   rent1br: 1593, transit: 125,  province: 'ON' },
  halifax:   { label: 'Halifax',  rent1br: 1539, transit: 82.5, province: 'NS' },
  winnipeg:  { label: 'Winnipeg', rent1br: 1232, transit: 119,  province: 'MB' },
}

export type HousingKey = 'family-friends' | 'studio' | '1br' | '2br' | '3br+'

export const HOUSING_MULT: Record<HousingKey, number> = {
  'family-friends': 0,
  studio:           0.85,
  '1br':            1.0,
  '2br':            1.25,
  '3br+':           1.55,
}

export const HOUSING_LABELS: Record<HousingKey, string> = {
  'family-friends': 'Stay with Family/Friends',
  studio:           'Studio',
  '1br':            '1 Bedroom',
  '2br':            '2 Bedroom',
  '3br+':           '3+ Bedroom',
}

export type JobKey = 'secured_now' | 'secured_2mo' | 'secured_6mo' | 'secured_1yr' | 'no_job'

export interface JobOption {
  key: JobKey
  label: string
  runway: number | null  // null = use baseline runway
  icon: string
}

export const JOB_OPTIONS: JobOption[] = [
  { key: 'secured_now', label: 'Secured immediately',  runway: 1,    icon: '✅' },
  { key: 'secured_2mo', label: 'Secured in 2 months',  runway: 2,    icon: '📅' },
  { key: 'secured_6mo', label: 'Secured in 6 months',  runway: 6,    icon: '🔍' },
  { key: 'secured_1yr', label: 'Secured in 1 year',    runway: 12,   icon: '⏳' },
  { key: 'no_job',      label: 'No job (full runway)',  runway: null, icon: '❌' },
]

export type DelayKey = 'now' | '3mo' | '6mo' | '1yr'

export interface DelayOption {
  key: DelayKey
  label: string
  months: number
}

export const DELAY_OPTIONS: DelayOption[] = [
  { key: 'now', label: 'Arrive now',      months: 0  },
  { key: '3mo', label: 'Delay 3 months',  months: 3  },
  { key: '6mo', label: 'Delay 6 months',  months: 6  },
  { key: '1yr', label: 'Delay 1 year',    months: 12 },
]

// ─── Housing type mapping from engine HousingType → ScenarioBuilder HousingKey ─

import type { HousingType } from './types'

export function engineHousingToKey(housingType: HousingType): HousingKey {
  switch (housingType) {
    case 'staying-family': return 'family-friends'
    case 'studio':         return 'studio'
    case '1br':            return '1br'
    case '2br':            return '2br'
    default:               return '1br'  // shared-room / on-campus / homestay → 1br fallback
  }
}

// ─── Job status mapping from engine JobStatus → ScenarioBuilder JobKey ──────

import type { JobStatus } from './types'

export function engineJobToKey(jobStatus: JobStatus): JobKey {
  switch (jobStatus) {
    case 'secured': return 'secured_now'
    case 'offer':   return 'secured_2mo'
    case 'none':    return 'no_job'
    case 'student': return 'no_job'
  }
}

// ─── City key normaliser ──────────────────────────────────────────────────────

/** Normalises a raw city string from the wizard to a CityKey, falling back to 'toronto'. */
export function toCityKey(city: string | undefined): CityKey {
  const normalised = (city ?? '').toLowerCase().replace(/[^a-z]/g, '')
  if (normalised in CITY_DATA) return normalised as CityKey
  // Handle accent-stripped variant for montréal
  if (normalised === 'montreal') return 'montreal'
  return 'toronto'
}
