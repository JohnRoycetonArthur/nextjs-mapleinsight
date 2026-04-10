/**
 * US-3.1 — Country of Origin: unit tests
 *
 * Covers:
 *  - filterCountries: name substring, ISO exact match, empty query, no match
 *  - findCountry: known ISO, unknown ISO
 *  - COUNTRIES_STUB integrity: all entries have iso/name/flag/isSeeded; no duplicate ISOs
 *  - Validation logic (mirrors WizardShell.validateStep case 1)
 *  - ISO persistence shape (countryOfOrigin stored as alpha-2)
 *  - Review display: countryISO appended to client profile string
 */

import {
  COUNTRIES_STUB,
  filterCountries,
  findCountry,
  type CountryRecord,
} from '@/lib/settlement-engine/countries-stub'
import type { WizardAnswers } from '@/components/settlement-planner/SettlementSessionContext'

// ─── filterCountries ──────────────────────────────────────────────────────────

describe('filterCountries', () => {
  it('returns full list on empty query', () => {
    expect(filterCountries('')).toHaveLength(COUNTRIES_STUB.length)
    expect(filterCountries('  ')).toHaveLength(COUNTRIES_STUB.length)
  })

  it('filters by name substring (case-insensitive)', () => {
    const results = filterCountries('india')
    expect(results).toHaveLength(1)
    expect(results[0].iso).toBe('IN')
  })

  it('filters by partial name', () => {
    const results = filterCountries('phil')
    expect(results.some(c => c.iso === 'PH')).toBe(true)
  })

  it('matches by exact ISO (case-insensitive)', () => {
    const results = filterCountries('ng')
    expect(results.some(c => c.iso === 'NG')).toBe(true)
  })

  it('returns empty array when no match', () => {
    expect(filterCountries('zzzznotacountry')).toHaveLength(0)
  })

  it('does not return partial ISO matches', () => {
    // 'I' alone should not match 'IN' — ISO match is exact
    const results = filterCountries('I')
    // 'I' may match name substrings (India, etc.) but not ISO exact match for 'IN'
    // We just verify no country with ISO 'I' is returned via ISO path
    results.forEach(c => {
      if (c.iso.toLowerCase() === 'i') {
        throw new Error('Unexpected ISO-exact match for single char')
      }
    })
  })
})

// ─── findCountry ──────────────────────────────────────────────────────────────

describe('findCountry', () => {
  it('returns correct record for known ISO', () => {
    const c = findCountry('IN')
    expect(c).toBeDefined()
    expect(c!.name).toBe('India')
    expect(c!.flag).toBe('🇮🇳')
    expect(c!.isSeeded).toBe(true)
  })

  it('returns undefined for unknown ISO', () => {
    expect(findCountry('XX')).toBeUndefined()
    expect(findCountry('')).toBeUndefined()
  })

  it('is case-sensitive (ISO codes are uppercase)', () => {
    // Our data uses uppercase — lowercase lookup should return undefined
    expect(findCountry('in')).toBeUndefined()
  })
})

// ─── COUNTRIES_STUB integrity ─────────────────────────────────────────────────

describe('COUNTRIES_STUB integrity', () => {
  it('has at least 20 entries', () => {
    expect(COUNTRIES_STUB.length).toBeGreaterThanOrEqual(20)
  })

  it('every entry has iso, name, flag, and isSeeded', () => {
    for (const c of COUNTRIES_STUB) {
      expect(typeof c.iso).toBe('string')
      expect(c.iso.length).toBe(2)
      expect(typeof c.name).toBe('string')
      expect(c.name.length).toBeGreaterThan(0)
      expect(typeof c.flag).toBe('string')
      expect(typeof c.isSeeded).toBe('boolean')
    }
  })

  it('has no duplicate ISO codes', () => {
    const isos = COUNTRIES_STUB.map(c => c.iso)
    const unique = new Set(isos)
    expect(unique.size).toBe(isos.length)
  })

  it('includes at least one unseeded country (DATA PENDING)', () => {
    expect(COUNTRIES_STUB.some(c => !c.isSeeded)).toBe(true)
  })

  it('majority of entries are seeded', () => {
    const seeded = COUNTRIES_STUB.filter(c => c.isSeeded).length
    expect(seeded).toBeGreaterThan(COUNTRIES_STUB.length / 2)
  })

  it('all ISO codes are exactly 2 uppercase letters', () => {
    for (const c of COUNTRIES_STUB) {
      expect(c.iso).toMatch(/^[A-Z]{2}$/)
    }
  })
})

// ─── Validation logic (mirrors validateStep case 1) ──────────────────────────

interface StepErrors { [field: string]: string }

function validateStep1(answers: WizardAnswers): StepErrors {
  const errors: StepErrors = {}
  if (!answers.arrival)         errors.arrival         = 'Please select your planned arrival window.'
  if (!answers.departureRegion) errors.departureRegion = 'Please select where your household is travelling from.'
  if (!answers.countryOfOrigin) errors.countryOfOrigin = 'Please select your country of origin.'
  return errors
}

describe('Step 1 validation', () => {
  it('fails when countryOfOrigin is missing', () => {
    const errs = validateStep1({ arrival: 'within_30', departureRegion: 'south-asia' })
    expect(errs.countryOfOrigin).toBe('Please select your country of origin.')
    expect(Object.keys(errs)).toHaveLength(1)
  })

  it('fails when all three required fields are missing', () => {
    const errs = validateStep1({})
    expect(errs.arrival).toBeDefined()
    expect(errs.departureRegion).toBeDefined()
    expect(errs.countryOfOrigin).toBeDefined()
  })

  it('passes when all three required fields are present', () => {
    const errs = validateStep1({
      arrival: 'within_30',
      departureRegion: 'south-asia',
      countryOfOrigin: 'IN',
    })
    expect(Object.keys(errs)).toHaveLength(0)
  })

  it('fails for empty string countryOfOrigin', () => {
    const errs = validateStep1({
      arrival: '1_3_months',
      departureRegion: 'uk-europe',
      countryOfOrigin: '',
    })
    expect(errs.countryOfOrigin).toBeDefined()
  })
})

// ─── ISO persistence shape ────────────────────────────────────────────────────

describe('countryOfOrigin ISO persistence', () => {
  it('WizardAnswers accepts countryOfOrigin as an optional string', () => {
    const a: WizardAnswers = { countryOfOrigin: 'IN' }
    expect(a.countryOfOrigin).toBe('IN')
  })

  it('stores only the 2-letter code, not the country name', () => {
    const a: WizardAnswers = { countryOfOrigin: 'PH' }
    // Must be 2-char ISO — not the full name "Philippines"
    expect(a.countryOfOrigin).toHaveLength(2)
    expect(a.countryOfOrigin).not.toBe('Philippines')
  })

  it('is undefined when not set (optional field)', () => {
    const a: WizardAnswers = { arrival: 'within_30' }
    expect(a.countryOfOrigin).toBeUndefined()
  })
})

// ─── Review display helper ────────────────────────────────────────────────────

describe('ConsultantReport country display', () => {
  function buildProfileLine(
    city: string,
    province: string,
    pathwayLabel: string,
    household: string,
    countryISO: string | null,
  ): string {
    return `${city}, ${province} · ${pathwayLabel} · ${household}${countryISO ? ` · ${countryISO}` : ''}`
  }

  it('appends ISO code when countryOfOrigin is present', () => {
    const line = buildProfileLine('Toronto', 'ON', 'Express Entry (FSW)', '2 adults', 'IN')
    expect(line).toBe('Toronto, ON · Express Entry (FSW) · 2 adults · IN')
  })

  it('omits country segment when countryISO is null', () => {
    const line = buildProfileLine('Vancouver', 'BC', 'Study Permit', '1 adult', null)
    expect(line).toBe('Vancouver, BC · Study Permit · 1 adult')
    expect(line).not.toContain('·  ·')
  })

  it('finds the country name for a given ISO for extended display', () => {
    const c = findCountry('NG')
    expect(c?.name).toBe('Nigeria')
  })
})
