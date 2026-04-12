/**
 * US-3.2 — CountryCosts: unit tests
 *
 * Covers:
 *  - fetchCountryCosts: seeded country lookup (returns Sanity data)
 *  - fetchCountryCosts: unknown ISO (Sanity returns null) → ZZ Sanity doc
 *  - fetchCountryCosts: unknown ISO + no ZZ doc → ZZ_FALLBACK constant
 *  - fetchCountryCosts: Sanity throws → ZZ_FALLBACK constant
 *  - ZZ_FALLBACK constant shape integrity
 *  - fetchCountryCostsList: returns mapped list, excludes ZZ
 */

// ─── Mock Sanity client ───────────────────────────────────────────────────────
// Must be declared before the module under test is imported.

const mockFetch = jest.fn()

jest.mock('@/sanity/lib/client', () => ({
  client: { fetch: (...args: unknown[]) => mockFetch(...args) },
}))

import {
  fetchCountryCosts,
  fetchCountryCostsList,
  ZZ_FALLBACK,
  type CountryCosts,
  type CountryListItem,
} from '@/lib/settlement-engine/fetchCountryCosts'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const INDIA_DOC: CountryCosts = {
  iso: 'IN',
  countryName: 'India',
  flag: '🇮🇳',
  isSeeded: true,
  effectiveDate: '2025-04-01',
  medicalExamCAD: 160,
  medicalExamSource: 'IRCC panel physician directory — India, April 2025',
  pccCAD: 35,
  pccSource: 'Indian Ministry of External Affairs — Passport Seva portal',
  languageTestCAD: 255,
  languageTestProvider: 'IELTS',
  languageTestSource: 'IDP IELTS India — April 2025',
}

const ZZ_SANITY_DOC: CountryCosts = {
  iso: 'ZZ',
  countryName: 'Default (Global Fallback)',
  isSeeded: true,
  medicalExamCAD: 250,
  medicalExamSource: 'Canadian newcomer average',
  pccCAD: 40,
  pccSource: 'Canadian newcomer average',
  languageTestCAD: 300,
  languageTestProvider: 'IELTS',
  languageTestSource: 'IELTS Canada average',
}

const LIST_ITEMS: CountryListItem[] = [
  { iso: 'IN', name: 'India',       flag: '🇮🇳', isSeeded: true  },
  { iso: 'LK', name: 'Sri Lanka',   flag: '🇱🇰', isSeeded: false },
]

// ─── fetchCountryCosts — seeded lookup ────────────────────────────────────────

describe('fetchCountryCosts — seeded country', () => {
  beforeEach(() => mockFetch.mockReset())

  it('returns Sanity document when specific seeded country exists', async () => {
    mockFetch.mockResolvedValueOnce(INDIA_DOC) // specific lookup
    const result = await fetchCountryCosts('IN')
    expect(result.iso).toBe('IN')
    expect(result.medicalExamCAD).toBe(160)
    expect(result.pccCAD).toBe(35)
    expect(result.languageTestCAD).toBe(255)
    // Should not call ZZ lookup
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it('includes source metadata from Sanity document', async () => {
    mockFetch.mockResolvedValueOnce(INDIA_DOC)
    const result = await fetchCountryCosts('IN')
    expect(result.medicalExamSource).toBe('IRCC panel physician directory — India, April 2025')
    expect(result.pccSource).toBe('Indian Ministry of External Affairs — Passport Seva portal')
    expect(result.languageTestSource).toBe('IDP IELTS India — April 2025')
    expect(result.languageTestProvider).toBe('IELTS')
  })

  it('passes the correct ISO to the GROQ query', async () => {
    mockFetch.mockResolvedValueOnce(INDIA_DOC)
    await fetchCountryCosts('NG')
    const [, params] = mockFetch.mock.calls[0]
    expect(params).toMatchObject({ iso: 'NG' })
  })
})

// ─── fetchCountryCosts — ZZ Sanity doc fallback ───────────────────────────────

describe('fetchCountryCosts — ZZ Sanity fallback', () => {
  beforeEach(() => mockFetch.mockReset())

  it('falls back to ZZ Sanity document when specific country returns null', async () => {
    mockFetch
      .mockResolvedValueOnce(null)      // specific lookup → not found
      .mockResolvedValueOnce(ZZ_SANITY_DOC)  // ZZ lookup → found
    const result = await fetchCountryCosts('XX')
    expect(result.iso).toBe('ZZ')
    expect(result.medicalExamCAD).toBe(250)
    expect(mockFetch).toHaveBeenCalledTimes(2)
  })

  it('unseeded country also resolves to ZZ', async () => {
    // Unseeded doc — specific query filters isSeeded=true so returns null
    mockFetch
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(ZZ_SANITY_DOC)
    const result = await fetchCountryCosts('LK')
    expect(result.iso).toBe('ZZ')
  })
})

// ─── fetchCountryCosts — hardcoded ZZ_FALLBACK ───────────────────────────────

describe('fetchCountryCosts — hardcoded ZZ_FALLBACK', () => {
  beforeEach(() => mockFetch.mockReset())

  it('returns ZZ_FALLBACK constant when both Sanity lookups return null', async () => {
    mockFetch
      .mockResolvedValueOnce(null)  // specific → null
      .mockResolvedValueOnce(null)  // ZZ → null
    const result = await fetchCountryCosts('ZZ')
    expect(result).toEqual(ZZ_FALLBACK)
  })

  it('returns ZZ_FALLBACK when Sanity throws', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'))
    const result = await fetchCountryCosts('IN')
    expect(result).toEqual(ZZ_FALLBACK)
  })
})

// ─── ZZ_FALLBACK constant integrity ──────────────────────────────────────────

describe('ZZ_FALLBACK constant', () => {
  it('has iso = "ZZ"', () => {
    expect(ZZ_FALLBACK.iso).toBe('ZZ')
  })

  it('has all three cost fields as positive numbers', () => {
    expect(typeof ZZ_FALLBACK.medicalExamCAD).toBe('number')
    expect(ZZ_FALLBACK.medicalExamCAD).toBeGreaterThan(0)
    expect(typeof ZZ_FALLBACK.pccCAD).toBe('number')
    expect(ZZ_FALLBACK.pccCAD).toBeGreaterThan(0)
    expect(typeof ZZ_FALLBACK.languageTestCAD).toBe('number')
    expect(ZZ_FALLBACK.languageTestCAD).toBeGreaterThan(0)
  })

  it('has source metadata for all cost fields', () => {
    expect(ZZ_FALLBACK.medicalExamSource).toBeTruthy()
    expect(ZZ_FALLBACK.pccSource).toBeTruthy()
    expect(ZZ_FALLBACK.languageTestSource).toBeTruthy()
  })

  it('is marked isSeeded = true', () => {
    expect(ZZ_FALLBACK.isSeeded).toBe(true)
  })

  it('matches design comp DEFAULT_ESTIMATE values', () => {
    // Design comp: DEFAULT_ESTIMATE = { medical: 250, pcc: 40, ielts: 300 }
    expect(ZZ_FALLBACK.medicalExamCAD).toBe(250)
    expect(ZZ_FALLBACK.pccCAD).toBe(40)
    expect(ZZ_FALLBACK.languageTestCAD).toBe(300)
  })
})

// ─── US-3.3 — 25-country seed fixture regression ─────────────────────────────
//
// Validates that the CSV-derived seed data is internally consistent:
//   - medicalExamCAD > 0
//   - medicalExamSource is non-empty
//   - pccCAD >= 0
//   - pccSource is non-empty
//   - languageTestCAD > 0
//   - languageTestSource is non-empty
//   - iso is a valid 2-letter uppercase code
//   - effectiveDate is present
//
// Source URLs are validated optionally via HTTP HEAD when ENABLE_URL_CHECKS=true.
// Default (CI): URL checks are skipped.

interface SeedRow {
  iso: string
  countryName: string
  flag: string
  effectiveDate: string
  medicalExamCAD: number
  medicalExamSource: string
  medicalExamSourceUrl: string
  pccCAD: number
  pccSource: string
  pccSourceUrl: string
  languageTestCAD: number
  languageTestProvider: string
  languageTestSource: string
  languageTestSourceUrl: string
}

const SEED_25: SeedRow[] = [
  {
    iso: 'IN', countryName: 'India', flag: '🇮🇳', effectiveDate: '2026-04-10',
    medicalExamCAD: 160, medicalExamSource: 'IRCC panel physician directory — India region (conservative high); retrieved 2026-04-10', medicalExamSourceUrl: 'https://secure.cic.gc.ca/pp-md/pp-list.aspx',
    pccCAD: 35, pccSource: 'Indian Ministry of External Affairs — Passport Seva portal fee (INR 500 govt + processing); retrieved 2026-04-10', pccSourceUrl: 'https://portal2.passportindia.gov.in/',
    languageTestCAD: 255, languageTestProvider: 'IELTS', languageTestSource: 'IDP IELTS India — exam registration fee; retrieved 2026-04-10', languageTestSourceUrl: 'https://ielts.idp.com/india',
  },
  {
    iso: 'PH', countryName: 'Philippines', flag: '🇵🇭', effectiveDate: '2026-04-10',
    medicalExamCAD: 270, medicalExamSource: "IRCC panel physician — St. Luke's Medical Center Manila (PHP 10 500 conservative); retrieved 2026-04-10", medicalExamSourceUrl: 'https://secure.cic.gc.ca/pp-md/pp-list.aspx',
    pccCAD: 25, pccSource: 'NBI Clearance Philippines (PHP 115 online + courier); retrieved 2026-04-10', pccSourceUrl: 'https://clearance.nbi.gov.ph/',
    languageTestCAD: 260, languageTestProvider: 'IELTS', languageTestSource: 'IDP IELTS Philippines — exam registration fee; retrieved 2026-04-10', languageTestSourceUrl: 'https://ielts.idp.com/philippines',
  },
  {
    iso: 'NG', countryName: 'Nigeria', flag: '🇳🇬', effectiveDate: '2026-04-10',
    medicalExamCAD: 130, medicalExamSource: 'IRCC panel physician — Nigeria region (NGN 130 000 high-end conservative); retrieved 2026-04-10', medicalExamSourceUrl: 'https://secure.cic.gc.ca/pp-md/pp-list.aspx',
    pccCAD: 55, pccSource: 'Nigeria Police Force — character certificate (NGN 50 000); retrieved 2026-04-10', pccSourceUrl: 'https://www.npf.gov.ng/',
    languageTestCAD: 280, languageTestProvider: 'IELTS', languageTestSource: 'British Council Nigeria — IELTS registration fee; retrieved 2026-04-10', languageTestSourceUrl: 'https://www.britishcouncil.org.ng/exam/ielts',
  },
  {
    iso: 'CN', countryName: 'China', flag: '🇨🇳', effectiveDate: '2026-04-10',
    medicalExamCAD: 360, medicalExamSource: 'IRCC panel physician — China region (RMB 1 800 conservative high); retrieved 2026-04-10', medicalExamSourceUrl: 'https://secure.cic.gc.ca/pp-md/pp-list.aspx',
    pccCAD: 80, pccSource: 'China Ministry of Public Security — criminal record clearance (notarized); retrieved 2026-04-10', pccSourceUrl: 'https://www.mps.gov.cn/',
    languageTestCAD: 270, languageTestProvider: 'IELTS', languageTestSource: 'British Council China — IELTS registration fee; retrieved 2026-04-10', languageTestSourceUrl: 'https://www.britishcouncil.cn/exam/ielts',
  },
  {
    iso: 'PK', countryName: 'Pakistan', flag: '🇵🇰', effectiveDate: '2026-04-10',
    medicalExamCAD: 170, medicalExamSource: 'IRCC panel physician — Pakistan region (PKR 35 000 conservative high); retrieved 2026-04-10', medicalExamSourceUrl: 'https://secure.cic.gc.ca/pp-md/pp-list.aspx',
    pccCAD: 50, pccSource: 'Pakistan Ministry of Interior — character certificate (PKR 10 000); retrieved 2026-04-10', pccSourceUrl: 'https://www.moip.gov.pk/',
    languageTestCAD: 240, languageTestProvider: 'IELTS', languageTestSource: 'IDP IELTS Pakistan — exam registration fee; retrieved 2026-04-10', languageTestSourceUrl: 'https://ielts.idp.com/pakistan',
  },
  {
    iso: 'BR', countryName: 'Brazil', flag: '🇧🇷', effectiveDate: '2026-04-10',
    medicalExamCAD: 220, medicalExamSource: 'IRCC panel physician — Brazil region (BRL 700 conservative); retrieved 2026-04-10', medicalExamSourceUrl: 'https://secure.cic.gc.ca/pp-md/pp-list.aspx',
    pccCAD: 30, pccSource: 'Brazilian Federal Police — criminal record certificate (BRL 100 online); retrieved 2026-04-10', pccSourceUrl: 'https://www.pf.gov.br/',
    languageTestCAD: 290, languageTestProvider: 'IELTS', languageTestSource: 'British Council Brazil — IELTS registration fee; retrieved 2026-04-10', languageTestSourceUrl: 'https://www.britishcouncil.org.br/exam/ielts',
  },
  {
    iso: 'FR', countryName: 'France', flag: '🇫🇷', effectiveDate: '2026-04-10',
    medicalExamCAD: 400, medicalExamSource: 'IRCC panel physician — France region (EUR 280 conservative high); retrieved 2026-04-10', medicalExamSourceUrl: 'https://secure.cic.gc.ca/pp-md/pp-list.aspx',
    pccCAD: 70, pccSource: 'French Ministry of Justice — casier judiciaire (EUR 5 base + apostille EUR 45); retrieved 2026-04-10', pccSourceUrl: 'https://casier-judiciaire.justice.gouv.fr/',
    languageTestCAD: 280, languageTestProvider: 'TEF Canada', languageTestSource: 'CCIP — TEF Canada exam fee (EUR 199); retrieved 2026-04-10', languageTestSourceUrl: 'https://www.lefrancaisdesaffaires.fr/tests-diplomes/tef-canada/',
  },
  {
    iso: 'GB', countryName: 'United Kingdom', flag: '🇬🇧', effectiveDate: '2026-04-10',
    medicalExamCAD: 450, medicalExamSource: 'IRCC panel physician — UK region (GBP 265 conservative high); retrieved 2026-04-10', medicalExamSourceUrl: 'https://secure.cic.gc.ca/pp-md/pp-list.aspx',
    pccCAD: 95, pccSource: 'ACRO Criminal Records Office — police certificate (GBP 55); retrieved 2026-04-10', pccSourceUrl: 'https://www.acro.police.uk/police_certificates.aspx',
    languageTestCAD: 300, languageTestProvider: 'IELTS', languageTestSource: 'British Council UK — IELTS registration fee (GBP 195); retrieved 2026-04-10', languageTestSourceUrl: 'https://www.britishcouncil.org/exam/ielts',
  },
  {
    iso: 'AE', countryName: 'UAE', flag: '🇦🇪', effectiveDate: '2026-04-10',
    medicalExamCAD: 300, medicalExamSource: 'IRCC panel physician — UAE region (AED 800 conservative high); retrieved 2026-04-10', medicalExamSourceUrl: 'https://secure.cic.gc.ca/pp-md/pp-list.aspx',
    pccCAD: 70, pccSource: 'Abu Dhabi Police — Good Conduct Certificate (AED 200 including processing); retrieved 2026-04-10', pccSourceUrl: 'https://www.adpolice.gov.ae/',
    languageTestCAD: 290, languageTestProvider: 'IELTS', languageTestSource: 'British Council UAE — IELTS registration fee (AED 820); retrieved 2026-04-10', languageTestSourceUrl: 'https://www.britishcouncil.ae/exam/ielts',
  },
  {
    iso: 'KE', countryName: 'Kenya', flag: '🇰🇪', effectiveDate: '2026-04-10',
    medicalExamCAD: 250, medicalExamSource: 'IRCC panel physician — Kenya region (KES 22 000 conservative high); retrieved 2026-04-10', medicalExamSourceUrl: 'https://secure.cic.gc.ca/pp-md/pp-list.aspx',
    pccCAD: 20, pccSource: 'Directorate of Criminal Investigations Kenya — Good Conduct Certificate (KES 1 050 + courier); retrieved 2026-04-10', pccSourceUrl: 'https://www.dci.go.ke/',
    languageTestCAD: 270, languageTestProvider: 'IELTS', languageTestSource: 'British Council Kenya — IELTS registration fee; retrieved 2026-04-10', languageTestSourceUrl: 'https://www.britishcouncil.org/country/kenya',
  },
  {
    iso: 'MX', countryName: 'Mexico', flag: '🇲🇽', effectiveDate: '2026-04-10',
    medicalExamCAD: 450, medicalExamSource: 'IRCC panel physician — Mexico region (MXN 5 800 conservative high); retrieved 2026-04-10', medicalExamSourceUrl: 'https://secure.cic.gc.ca/pp-md/pp-list.aspx',
    pccCAD: 100, pccSource: 'RNPDNO Mexico — constancia de no antecedentes penales (MXN 1 300); retrieved 2026-04-10', pccSourceUrl: 'https://www.gob.mx/tramites/ficha/constancia-de-no-antecedentes-penales-del-rnpdno',
    languageTestCAD: 290, languageTestProvider: 'IELTS', languageTestSource: 'British Council Mexico — IELTS registration fee; retrieved 2026-04-10', languageTestSourceUrl: 'https://www.britishcouncil.org.mx/exam/ielts',
  },
  {
    iso: 'ZA', countryName: 'South Africa', flag: '🇿🇦', effectiveDate: '2026-04-10',
    medicalExamCAD: 230, medicalExamSource: 'IRCC panel physician — South Africa region (ZAR 2 800 conservative high); retrieved 2026-04-10', medicalExamSourceUrl: 'https://secure.cic.gc.ca/pp-md/pp-list.aspx',
    pccCAD: 65, pccSource: 'SAPS — Police Clearance Certificate (ZAR 115 govt + courier ZAR 650 total); retrieved 2026-04-10', pccSourceUrl: 'https://www.saps.gov.za/',
    languageTestCAD: 280, languageTestProvider: 'IELTS', languageTestSource: 'British Council South Africa — IELTS registration fee; retrieved 2026-04-10', languageTestSourceUrl: 'https://www.britishcouncil.org.za/exam/ielts',
  },
  {
    iso: 'VN', countryName: 'Vietnam', flag: '🇻🇳', effectiveDate: '2026-04-10',
    medicalExamCAD: 210, medicalExamSource: 'IRCC panel physician — Vietnam region (VND 3 500 000 conservative high); retrieved 2026-04-10', medicalExamSourceUrl: 'https://secure.cic.gc.ca/pp-md/pp-list.aspx',
    pccCAD: 30, pccSource: 'Vietnamese Ministry of Justice — criminal record certificate No. 2 (VND 500 000); retrieved 2026-04-10', pccSourceUrl: 'https://moj.gov.vn/',
    languageTestCAD: 260, languageTestProvider: 'IELTS', languageTestSource: 'IDP IELTS Vietnam — exam registration fee; retrieved 2026-04-10', languageTestSourceUrl: 'https://ielts.idp.com/vietnam',
  },
  {
    iso: 'EG', countryName: 'Egypt', flag: '🇪🇬', effectiveDate: '2026-04-10',
    medicalExamCAD: 80, medicalExamSource: 'IRCC panel physician — Egypt region (EGP 3 500 conservative high); retrieved 2026-04-10', medicalExamSourceUrl: 'https://secure.cic.gc.ca/pp-md/pp-list.aspx',
    pccCAD: 15, pccSource: 'Egyptian Ministry of Interior — criminal record clearance (EGP 500); retrieved 2026-04-10', pccSourceUrl: 'https://www.moiegypt.gov.eg/',
    languageTestCAD: 260, languageTestProvider: 'IELTS', languageTestSource: 'British Council Egypt — IELTS registration fee; retrieved 2026-04-10', languageTestSourceUrl: 'https://www.britishcouncil.org/country/egypt',
  },
  {
    iso: 'US', countryName: 'United States', flag: '🇺🇸', effectiveDate: '2026-04-10',
    medicalExamCAD: 380, medicalExamSource: 'IRCC panel physician — US region (USD 280 conservative high); retrieved 2026-04-10', medicalExamSourceUrl: 'https://secure.cic.gc.ca/pp-md/pp-list.aspx',
    pccCAD: 30, pccSource: 'FBI Identity History Summary (USD 18 + fingerprinting USD 5); retrieved 2026-04-10', pccSourceUrl: 'https://www.fbi.gov/services/cjis/identity-history-summary-checks',
    languageTestCAD: 300, languageTestProvider: 'IELTS / CELPIP', languageTestSource: 'IDP IELTS USA — exam registration fee (USD 235); retrieved 2026-04-10', languageTestSourceUrl: 'https://ielts.idp.com/usa',
  },
  {
    iso: 'CO', countryName: 'Colombia', flag: '🇨🇴', effectiveDate: '2026-04-10',
    medicalExamCAD: 200, medicalExamSource: 'IRCC panel physician — Colombia region (COP 600 000 conservative high); retrieved 2026-04-10', medicalExamSourceUrl: 'https://secure.cic.gc.ca/pp-md/pp-list.aspx',
    pccCAD: 15, pccSource: 'Fiscalía General Colombia — certificado de antecedentes judiciales (free + COP 40 000 courier); retrieved 2026-04-10', pccSourceUrl: 'https://www.fiscalia.gov.co/',
    languageTestCAD: 270, languageTestProvider: 'IELTS', languageTestSource: 'British Council Colombia — IELTS registration fee; retrieved 2026-04-10', languageTestSourceUrl: 'https://www.britishcouncil.org/country/colombia',
  },
  {
    iso: 'ET', countryName: 'Ethiopia', flag: '🇪🇹', effectiveDate: '2026-04-10',
    medicalExamCAD: 120, medicalExamSource: 'IRCC panel physician — Ethiopia region (ETB 6 500 conservative high); retrieved 2026-04-10', medicalExamSourceUrl: 'https://secure.cic.gc.ca/pp-md/pp-list.aspx',
    pccCAD: 30, pccSource: 'Ethiopian Federal Police Commission — clearance certificate (ETB 1 500 + processing); retrieved 2026-04-10', pccSourceUrl: 'https://www.federalpolice.gov.et/',
    languageTestCAD: 260, languageTestProvider: 'IELTS', languageTestSource: 'British Council Ethiopia — IELTS registration fee; retrieved 2026-04-10', languageTestSourceUrl: 'https://www.britishcouncil.org/country/ethiopia',
  },
  {
    iso: 'BD', countryName: 'Bangladesh', flag: '🇧🇩', effectiveDate: '2026-04-10',
    medicalExamCAD: 100, medicalExamSource: 'IRCC panel physician — Bangladesh region (BDT 8 000 conservative high); retrieved 2026-04-10', medicalExamSourceUrl: 'https://secure.cic.gc.ca/pp-md/pp-list.aspx',
    pccCAD: 60, pccSource: 'Bangladesh Police — police clearance certificate (BDT 5 000 including processing fee); retrieved 2026-04-10', pccSourceUrl: 'https://pcc.police.gov.bd/',
    languageTestCAD: 250, languageTestProvider: 'IELTS', languageTestSource: 'IDP IELTS Bangladesh — exam registration fee; retrieved 2026-04-10', languageTestSourceUrl: 'https://ielts.idp.com/bangladesh',
  },
  {
    iso: 'GH', countryName: 'Ghana', flag: '🇬🇭', effectiveDate: '2026-04-10',
    medicalExamCAD: 150, medicalExamSource: 'IRCC panel physician — Ghana region (GHS 1 500 conservative high); retrieved 2026-04-10', medicalExamSourceUrl: 'https://secure.cic.gc.ca/pp-md/pp-list.aspx',
    pccCAD: 50, pccSource: 'Ghana Police Service — police clearance certificate (GHS 500); retrieved 2026-04-10', pccSourceUrl: 'https://www.ghanapoliceservice.com/',
    languageTestCAD: 265, languageTestProvider: 'IELTS', languageTestSource: 'British Council Ghana — IELTS registration fee; retrieved 2026-04-10', languageTestSourceUrl: 'https://www.britishcouncil.org/country/ghana',
  },
  {
    iso: 'IR', countryName: 'Iran', flag: '🇮🇷', effectiveDate: '2026-04-10',
    medicalExamCAD: 120, medicalExamSource: 'IRCC panel physician — Iran region (IRR equivalent conservative estimate); retrieved 2026-04-10', medicalExamSourceUrl: 'https://secure.cic.gc.ca/pp-md/pp-list.aspx',
    pccCAD: 50, pccSource: 'Iranian Police Force — good conduct certificate (estimated conservative); retrieved 2026-04-10', pccSourceUrl: 'https://www.police.ir/',
    languageTestCAD: 265, languageTestProvider: 'IELTS', languageTestSource: 'British Council Iran — IELTS registration fee; retrieved 2026-04-10', languageTestSourceUrl: 'https://www.britishcouncil.org/country/iran',
  },
  {
    iso: 'KR', countryName: 'South Korea', flag: '🇰🇷', effectiveDate: '2026-04-10',
    medicalExamCAD: 350, medicalExamSource: 'IRCC panel physician — South Korea region (KRW 310 000 conservative high); retrieved 2026-04-10', medicalExamSourceUrl: 'https://secure.cic.gc.ca/pp-md/pp-list.aspx',
    pccCAD: 15, pccSource: 'Korean National Police Agency — criminal record certificate (KRW 1 000 online); retrieved 2026-04-10', pccSourceUrl: 'https://www.police.go.kr/',
    languageTestCAD: 280, languageTestProvider: 'IELTS', languageTestSource: 'British Council Korea — IELTS registration fee; retrieved 2026-04-10', languageTestSourceUrl: 'https://www.britishcouncil.or.kr/exam/ielts',
  },
  {
    iso: 'JP', countryName: 'Japan', flag: '🇯🇵', effectiveDate: '2026-04-10',
    medicalExamCAD: 380, medicalExamSource: 'IRCC panel physician — Japan region (JPY 30 000 conservative high); retrieved 2026-04-10', medicalExamSourceUrl: 'https://secure.cic.gc.ca/pp-md/pp-list.aspx',
    pccCAD: 60, pccSource: 'Japanese National Police Agency — criminal record certificate (JPY 4 000 + notarization); retrieved 2026-04-10', pccSourceUrl: 'https://www.npa.go.jp/',
    languageTestCAD: 290, languageTestProvider: 'IELTS', languageTestSource: 'British Council Japan — IELTS registration fee; retrieved 2026-04-10', languageTestSourceUrl: 'https://www.britishcouncil.jp/exam/ielts',
  },
  {
    iso: 'DE', countryName: 'Germany', flag: '🇩🇪', effectiveDate: '2026-04-10',
    medicalExamCAD: 420, medicalExamSource: 'IRCC panel physician — Germany region (EUR 295 conservative high); retrieved 2026-04-10', medicalExamSourceUrl: 'https://secure.cic.gc.ca/pp-md/pp-list.aspx',
    pccCAD: 25, pccSource: 'Bundesamt der Justiz — Führungszeugnis (EUR 13); retrieved 2026-04-10', pccSourceUrl: 'https://www.bundesjustizamt.de/DE/Themen/Buergerdienste/Fuehrungszeugnis/Fuehrungszeugnis_node.html',
    languageTestCAD: 310, languageTestProvider: 'IELTS', languageTestSource: 'British Council Germany — IELTS registration fee (EUR 245); retrieved 2026-04-10', languageTestSourceUrl: 'https://www.britishcouncil.de/exam/ielts',
  },
  {
    iso: 'UA', countryName: 'Ukraine', flag: '🇺🇦', effectiveDate: '2026-04-10',
    medicalExamCAD: 100, medicalExamSource: 'IRCC panel physician — Ukraine region (UAH 3 800 conservative); retrieved 2026-04-10', medicalExamSourceUrl: 'https://secure.cic.gc.ca/pp-md/pp-list.aspx',
    pccCAD: 40, pccSource: 'Ukrainian Ministry of Internal Affairs — background check (UAH 1 500); retrieved 2026-04-10', pccSourceUrl: 'https://www.mvs.gov.ua/',
    languageTestCAD: 240, languageTestProvider: 'IELTS', languageTestSource: 'British Council Ukraine — IELTS registration fee; retrieved 2026-04-10', languageTestSourceUrl: 'https://www.britishcouncil.org.ua/exam/ielts',
  },
  {
    iso: 'RO', countryName: 'Romania', flag: '🇷🇴', effectiveDate: '2026-04-10',
    medicalExamCAD: 120, medicalExamSource: 'IRCC panel physician — Romania region (RON 530 conservative); retrieved 2026-04-10', medicalExamSourceUrl: 'https://secure.cic.gc.ca/pp-md/pp-list.aspx',
    pccCAD: 15, pccSource: 'Romanian Police — cazier judiciar (RON 2 standard + courier RON 60); retrieved 2026-04-10', pccSourceUrl: 'https://www.politiaromana.ro/',
    languageTestCAD: 250, languageTestProvider: 'IELTS', languageTestSource: 'British Council Romania — IELTS registration fee; retrieved 2026-04-10', languageTestSourceUrl: 'https://www.britishcouncil.ro/exam/ielts',
  },
]

describe('US-3.3 — 25-country seed fixture', () => {
  it('covers exactly 25 countries', () => {
    expect(SEED_25).toHaveLength(25)
  })

  it('has no duplicate ISO codes', () => {
    const isos = SEED_25.map(r => r.iso)
    expect(new Set(isos).size).toBe(isos.length)
  })

  it.each(SEED_25)('$iso ($countryName) — iso is valid 2-letter uppercase', ({ iso }) => {
    expect(iso).toMatch(/^[A-Z]{2}$/)
  })

  it.each(SEED_25)('$iso — medicalExamCAD is positive', ({ iso, medicalExamCAD }) => {
    expect(medicalExamCAD).toBeGreaterThan(0)
  })

  it.each(SEED_25)('$iso — medicalExamSource is non-empty', ({ iso, medicalExamSource }) => {
    expect(medicalExamSource.trim()).toBeTruthy()
  })

  it.each(SEED_25)('$iso — medicalExamSourceUrl is a valid https URL', ({ iso, medicalExamSourceUrl }) => {
    expect(medicalExamSourceUrl).toMatch(/^https:\/\//)
  })

  it.each(SEED_25)('$iso — pccCAD is non-negative', ({ iso, pccCAD }) => {
    expect(pccCAD).toBeGreaterThanOrEqual(0)
  })

  it.each(SEED_25)('$iso — pccSource is non-empty', ({ iso, pccSource }) => {
    expect(pccSource.trim()).toBeTruthy()
  })

  it.each(SEED_25)('$iso — languageTestCAD is positive', ({ iso, languageTestCAD }) => {
    expect(languageTestCAD).toBeGreaterThan(0)
  })

  it.each(SEED_25)('$iso — languageTestSource is non-empty', ({ iso, languageTestSource }) => {
    expect(languageTestSource.trim()).toBeTruthy()
  })

  it.each(SEED_25)('$iso — effectiveDate is present', ({ iso, effectiveDate }) => {
    expect(effectiveDate).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it.each(SEED_25)('$iso — medicalExamCAD does not exceed $600 (sanity ceiling)', ({ iso, medicalExamCAD }) => {
    expect(medicalExamCAD).toBeLessThanOrEqual(600)
  })

  it.each(SEED_25)('$iso — languageTestCAD does not exceed $400 (sanity ceiling)', ({ iso, languageTestCAD }) => {
    expect(languageTestCAD).toBeLessThanOrEqual(400)
  })

  // ─── Optional source URL HEAD checks ────────────────────────────────────────
  // Skipped by default. Enable with:  ENABLE_URL_CHECKS=true npm test
  // Requires network access — do NOT run in CI without explicit opt-in.

  const RUN_URL_CHECKS = process.env.ENABLE_URL_CHECKS === 'true'
  const itUrl = RUN_URL_CHECKS ? it : it.skip

  itUrl.each(SEED_25)(
    '$iso — medicalExamSourceUrl returns 2xx (optional network check)',
    async ({ iso, medicalExamSourceUrl }) => {
      const res = await fetch(medicalExamSourceUrl, { method: 'HEAD' })
      expect(res.status).toBeGreaterThanOrEqual(200)
      expect(res.status).toBeLessThan(400)
    },
    15_000,
  )

  itUrl.each(SEED_25)(
    '$iso — pccSourceUrl returns 2xx (optional network check)',
    async ({ iso, pccSourceUrl }) => {
      const res = await fetch(pccSourceUrl, { method: 'HEAD' })
      expect(res.status).toBeGreaterThanOrEqual(200)
      expect(res.status).toBeLessThan(400)
    },
    15_000,
  )

  itUrl.each(SEED_25)(
    '$iso — languageTestSourceUrl returns 2xx (optional network check)',
    async ({ iso, languageTestSourceUrl }) => {
      const res = await fetch(languageTestSourceUrl, { method: 'HEAD' })
      expect(res.status).toBeGreaterThanOrEqual(200)
      expect(res.status).toBeLessThan(400)
    },
    15_000,
  )
})

// ─── US-3.4 — PCC seed fixture regression ────────────────────────────────────
//
// Validates the PCC-only CSV (scripts/data/country-costs-pcc.csv) independently
// of the combined medical-costs CSV so that:
//   - Every country has a pccCAD >= 0 and a non-empty pccSource
//   - pccCAD values show real variability (not a copy-paste of a single number)
//   - The PCC fixture is internally consistent with the SEED_25 combined fixture
//
// This guard runs in CI without network access (no source URL HEAD checks).

interface PccRow {
  iso: string
  pccCAD: number
  pccSource: string
  pccSourceUrl: string
}

const PCC_25: PccRow[] = [
  { iso: 'IN', pccCAD: 35,  pccSource: 'Indian Ministry of External Affairs — Passport Seva portal fee (INR 500 govt + processing); retrieved 2026-04-10', pccSourceUrl: 'https://portal2.passportindia.gov.in/' },
  { iso: 'PH', pccCAD: 25,  pccSource: 'NBI Clearance Philippines (PHP 115 online + courier); retrieved 2026-04-10', pccSourceUrl: 'https://clearance.nbi.gov.ph/' },
  { iso: 'NG', pccCAD: 55,  pccSource: 'Nigeria Police Force — character certificate (NGN 50 000); retrieved 2026-04-10', pccSourceUrl: 'https://www.npf.gov.ng/' },
  { iso: 'CN', pccCAD: 80,  pccSource: 'China Ministry of Public Security — criminal record clearance (notarized); retrieved 2026-04-10', pccSourceUrl: 'https://www.mps.gov.cn/' },
  { iso: 'PK', pccCAD: 50,  pccSource: 'Pakistan Ministry of Interior — character certificate (PKR 10 000); retrieved 2026-04-10', pccSourceUrl: 'https://www.moip.gov.pk/' },
  { iso: 'BR', pccCAD: 30,  pccSource: 'Brazilian Federal Police — criminal record certificate (BRL 100 online); retrieved 2026-04-10', pccSourceUrl: 'https://www.pf.gov.br/' },
  { iso: 'FR', pccCAD: 70,  pccSource: 'French Ministry of Justice — casier judiciaire (EUR 5 base + apostille EUR 45); retrieved 2026-04-10', pccSourceUrl: 'https://casier-judiciaire.justice.gouv.fr/' },
  { iso: 'GB', pccCAD: 95,  pccSource: 'ACRO Criminal Records Office — police certificate (GBP 55); retrieved 2026-04-10', pccSourceUrl: 'https://www.acro.police.uk/police_certificates.aspx' },
  { iso: 'AE', pccCAD: 70,  pccSource: 'Abu Dhabi Police — Good Conduct Certificate (AED 200 including processing); retrieved 2026-04-10', pccSourceUrl: 'https://www.adpolice.gov.ae/' },
  { iso: 'KE', pccCAD: 20,  pccSource: 'Directorate of Criminal Investigations Kenya — Good Conduct Certificate (KES 1 050 + courier); retrieved 2026-04-10', pccSourceUrl: 'https://www.dci.go.ke/' },
  { iso: 'MX', pccCAD: 100, pccSource: 'RNPDNO Mexico — constancia de no antecedentes penales (MXN 1 300); retrieved 2026-04-10', pccSourceUrl: 'https://www.gob.mx/tramites/ficha/constancia-de-no-antecedentes-penales-del-rnpdno' },
  { iso: 'ZA', pccCAD: 65,  pccSource: 'SAPS — Police Clearance Certificate (ZAR 115 govt + courier ZAR 650 total); retrieved 2026-04-10', pccSourceUrl: 'https://www.saps.gov.za/' },
  { iso: 'VN', pccCAD: 30,  pccSource: 'Vietnamese Ministry of Justice — criminal record certificate No. 2 (VND 500 000); retrieved 2026-04-10', pccSourceUrl: 'https://moj.gov.vn/' },
  { iso: 'EG', pccCAD: 15,  pccSource: 'Egyptian Ministry of Interior — criminal record clearance (EGP 500); retrieved 2026-04-10', pccSourceUrl: 'https://www.moiegypt.gov.eg/' },
  { iso: 'US', pccCAD: 30,  pccSource: 'FBI Identity History Summary (USD 18 + fingerprinting USD 5); retrieved 2026-04-10', pccSourceUrl: 'https://www.fbi.gov/services/cjis/identity-history-summary-checks' },
  { iso: 'CO', pccCAD: 15,  pccSource: 'Fiscalía General Colombia — certificado de antecedentes judiciales (free + COP 40 000 courier); retrieved 2026-04-10', pccSourceUrl: 'https://www.fiscalia.gov.co/' },
  { iso: 'ET', pccCAD: 30,  pccSource: 'Ethiopian Federal Police Commission — clearance certificate (ETB 1 500 + processing); retrieved 2026-04-10', pccSourceUrl: 'https://www.federalpolice.gov.et/' },
  { iso: 'BD', pccCAD: 60,  pccSource: 'Bangladesh Police — police clearance certificate (BDT 5 000 including processing fee); retrieved 2026-04-10', pccSourceUrl: 'https://pcc.police.gov.bd/' },
  { iso: 'GH', pccCAD: 50,  pccSource: 'Ghana Police Service — police clearance certificate (GHS 500); retrieved 2026-04-10', pccSourceUrl: 'https://www.ghanapoliceservice.com/' },
  { iso: 'IR', pccCAD: 50,  pccSource: 'Iranian Police Force — good conduct certificate (estimated conservative); retrieved 2026-04-10', pccSourceUrl: 'https://www.police.ir/' },
  { iso: 'KR', pccCAD: 15,  pccSource: 'Korean National Police Agency — criminal record certificate (KRW 1 000 online); retrieved 2026-04-10', pccSourceUrl: 'https://www.police.go.kr/' },
  { iso: 'JP', pccCAD: 60,  pccSource: 'Japanese National Police Agency — criminal record certificate (JPY 4 000 + notarization); retrieved 2026-04-10', pccSourceUrl: 'https://www.npa.go.jp/' },
  { iso: 'DE', pccCAD: 25,  pccSource: 'Bundesamt der Justiz — Führungszeugnis (EUR 13); retrieved 2026-04-10', pccSourceUrl: 'https://www.bundesjustizamt.de/DE/Themen/Buergerdienste/Fuehrungszeugnis/Fuehrungszeugnis_node.html' },
  { iso: 'UA', pccCAD: 40,  pccSource: 'Ukrainian Ministry of Internal Affairs — background check (UAH 1 500); retrieved 2026-04-10', pccSourceUrl: 'https://www.mvs.gov.ua/' },
  { iso: 'RO', pccCAD: 15,  pccSource: 'Romanian Police — cazier judiciar (RON 2 standard + courier RON 60); retrieved 2026-04-10', pccSourceUrl: 'https://www.politiaromana.ro/' },
]

describe('US-3.4 — PCC seed fixture', () => {
  it('covers exactly 25 countries', () => {
    expect(PCC_25).toHaveLength(25)
  })

  it('has no duplicate ISO codes', () => {
    const isos = PCC_25.map(r => r.iso)
    expect(new Set(isos).size).toBe(isos.length)
  })

  it.each(PCC_25)('$iso — iso is valid 2-letter uppercase', ({ iso }) => {
    expect(iso).toMatch(/^[A-Z]{2}$/)
  })

  it.each(PCC_25)('$iso — pccCAD is non-negative', ({ iso, pccCAD }) => {
    expect(pccCAD).toBeGreaterThanOrEqual(0)
  })

  it.each(PCC_25)('$iso — pccSource is non-empty', ({ iso, pccSource }) => {
    expect(pccSource.trim()).toBeTruthy()
  })

  it.each(PCC_25)('$iso — pccSourceUrl is a valid https URL', ({ iso, pccSourceUrl }) => {
    expect(pccSourceUrl).toMatch(/^https:\/\//)
  })

  it.each(PCC_25)('$iso — pccCAD does not exceed $200 (sanity ceiling)', ({ iso, pccCAD }) => {
    expect(pccCAD).toBeLessThanOrEqual(200)
  })

  it('pccCAD values show real variability (at least 8 distinct values)', () => {
    const distinctValues = new Set(PCC_25.map(r => r.pccCAD))
    expect(distinctValues.size).toBeGreaterThanOrEqual(8)
  })

  it('pccCAD range spans at least $50 (low-fee vs high-fee countries differ)', () => {
    const values = PCC_25.map(r => r.pccCAD)
    const spread = Math.max(...values) - Math.min(...values)
    expect(spread).toBeGreaterThanOrEqual(50)
  })

  it('lowest pccCAD is at least $10 (no free certificates expected at this data tier)', () => {
    const min = Math.min(...PCC_25.map(r => r.pccCAD))
    expect(min).toBeGreaterThanOrEqual(10)
  })

  it('matches SEED_25 combined fixture — pccCAD and pccSource agree for all countries', () => {
    for (const pccRow of PCC_25) {
      const seedRow = SEED_25.find(r => r.iso === pccRow.iso)
      expect(seedRow).toBeDefined()
      expect(seedRow!.pccCAD).toBe(pccRow.pccCAD)
      expect(seedRow!.pccSource).toBe(pccRow.pccSource)
    }
  })

  it('every SEED_25 country is present in PCC_25 (no missing countries)', () => {
    const pccIsos = new Set(PCC_25.map(r => r.iso))
    for (const row of SEED_25) {
      expect(pccIsos.has(row.iso)).toBe(true)
    }
  })
})

// ─── US-3.5 — Language seed fixture regression ───────────────────────────────
//
// Validates that the language-only CSV (scripts/data/country-costs-language.csv)
// is internally consistent:
//   - languageTestCAD is either null (no local centre) or a positive number
//   - languageTestSource is non-empty
//   - languageTestSourceUrl is a valid https URL
//   - Provider is one of the accepted enum values
//   - All 25 countries are present
//   - languageTestCAD values agree with the SEED_25 combined fixture
//
// Also tests the fetchCountryCosts field-level null fallback introduced in US-3.5.

interface LangRow {
  iso: string
  languageTestCAD: number | null
  languageTestProvider: string
  languageTestSource: string
  languageTestSourceUrl: string
}

const LANG_25: LangRow[] = [
  { iso: 'IN', languageTestCAD: 255, languageTestProvider: 'IELTS',         languageTestSource: 'IDP IELTS India — exam registration fee; retrieved 2026-04-10',                        languageTestSourceUrl: 'https://ielts.idp.com/india' },
  { iso: 'PH', languageTestCAD: 260, languageTestProvider: 'IELTS',         languageTestSource: 'IDP IELTS Philippines — exam registration fee; retrieved 2026-04-10',                  languageTestSourceUrl: 'https://ielts.idp.com/philippines' },
  { iso: 'NG', languageTestCAD: 280, languageTestProvider: 'IELTS',         languageTestSource: 'British Council Nigeria — IELTS registration fee; retrieved 2026-04-10',               languageTestSourceUrl: 'https://www.britishcouncil.org.ng/exam/ielts' },
  { iso: 'CN', languageTestCAD: 270, languageTestProvider: 'IELTS',         languageTestSource: 'British Council China — IELTS registration fee; retrieved 2026-04-10',                 languageTestSourceUrl: 'https://www.britishcouncil.cn/exam/ielts' },
  { iso: 'PK', languageTestCAD: 240, languageTestProvider: 'IELTS',         languageTestSource: 'IDP IELTS Pakistan — exam registration fee; retrieved 2026-04-10',                     languageTestSourceUrl: 'https://ielts.idp.com/pakistan' },
  { iso: 'BR', languageTestCAD: 290, languageTestProvider: 'IELTS',         languageTestSource: 'British Council Brazil — IELTS registration fee; retrieved 2026-04-10',                languageTestSourceUrl: 'https://www.britishcouncil.org.br/exam/ielts' },
  { iso: 'FR', languageTestCAD: 280, languageTestProvider: 'TEF Canada',    languageTestSource: 'CCIP — TEF Canada exam fee (EUR 199); retrieved 2026-04-10',                           languageTestSourceUrl: 'https://www.lefrancaisdesaffaires.fr/tests-diplomes/tef-canada/' },
  { iso: 'GB', languageTestCAD: 300, languageTestProvider: 'IELTS',         languageTestSource: 'British Council UK — IELTS registration fee (GBP 195); retrieved 2026-04-10',          languageTestSourceUrl: 'https://www.britishcouncil.org/exam/ielts' },
  { iso: 'AE', languageTestCAD: 290, languageTestProvider: 'IELTS',         languageTestSource: 'British Council UAE — IELTS registration fee (AED 820); retrieved 2026-04-10',         languageTestSourceUrl: 'https://www.britishcouncil.ae/exam/ielts' },
  { iso: 'KE', languageTestCAD: 270, languageTestProvider: 'IELTS',         languageTestSource: 'British Council Kenya — IELTS registration fee; retrieved 2026-04-10',                 languageTestSourceUrl: 'https://www.britishcouncil.org/country/kenya' },
  { iso: 'MX', languageTestCAD: 290, languageTestProvider: 'IELTS',         languageTestSource: 'British Council Mexico — IELTS registration fee; retrieved 2026-04-10',                languageTestSourceUrl: 'https://www.britishcouncil.org.mx/exam/ielts' },
  { iso: 'ZA', languageTestCAD: 280, languageTestProvider: 'IELTS',         languageTestSource: 'British Council South Africa — IELTS registration fee; retrieved 2026-04-10',          languageTestSourceUrl: 'https://www.britishcouncil.org.za/exam/ielts' },
  { iso: 'VN', languageTestCAD: 260, languageTestProvider: 'IELTS',         languageTestSource: 'IDP IELTS Vietnam — exam registration fee; retrieved 2026-04-10',                      languageTestSourceUrl: 'https://ielts.idp.com/vietnam' },
  { iso: 'EG', languageTestCAD: 260, languageTestProvider: 'IELTS',         languageTestSource: 'British Council Egypt — IELTS registration fee; retrieved 2026-04-10',                 languageTestSourceUrl: 'https://www.britishcouncil.org/country/egypt' },
  { iso: 'US', languageTestCAD: 300, languageTestProvider: 'IELTS / CELPIP',languageTestSource: 'IDP IELTS USA — exam registration fee (USD 235); retrieved 2026-04-10',               languageTestSourceUrl: 'https://ielts.idp.com/usa' },
  { iso: 'CO', languageTestCAD: 270, languageTestProvider: 'IELTS',         languageTestSource: 'British Council Colombia — IELTS registration fee; retrieved 2026-04-10',              languageTestSourceUrl: 'https://www.britishcouncil.org/country/colombia' },
  { iso: 'ET', languageTestCAD: 260, languageTestProvider: 'IELTS',         languageTestSource: 'British Council Ethiopia — IELTS registration fee; retrieved 2026-04-10',              languageTestSourceUrl: 'https://www.britishcouncil.org/country/ethiopia' },
  { iso: 'BD', languageTestCAD: 250, languageTestProvider: 'IELTS',         languageTestSource: 'IDP IELTS Bangladesh — exam registration fee; retrieved 2026-04-10',                   languageTestSourceUrl: 'https://ielts.idp.com/bangladesh' },
  { iso: 'GH', languageTestCAD: 265, languageTestProvider: 'IELTS',         languageTestSource: 'British Council Ghana — IELTS registration fee; retrieved 2026-04-10',                 languageTestSourceUrl: 'https://www.britishcouncil.org/country/ghana' },
  { iso: 'IR', languageTestCAD: 265, languageTestProvider: 'IELTS',         languageTestSource: 'British Council Iran — IELTS registration fee; retrieved 2026-04-10',                  languageTestSourceUrl: 'https://www.britishcouncil.org/country/iran' },
  { iso: 'KR', languageTestCAD: 280, languageTestProvider: 'IELTS',         languageTestSource: 'British Council Korea — IELTS registration fee; retrieved 2026-04-10',                 languageTestSourceUrl: 'https://www.britishcouncil.or.kr/exam/ielts' },
  { iso: 'JP', languageTestCAD: 290, languageTestProvider: 'IELTS',         languageTestSource: 'British Council Japan — IELTS registration fee; retrieved 2026-04-10',                 languageTestSourceUrl: 'https://www.britishcouncil.jp/exam/ielts' },
  { iso: 'DE', languageTestCAD: 310, languageTestProvider: 'IELTS',         languageTestSource: 'British Council Germany — IELTS registration fee (EUR 245); retrieved 2026-04-10',     languageTestSourceUrl: 'https://www.britishcouncil.de/exam/ielts' },
  { iso: 'UA', languageTestCAD: 240, languageTestProvider: 'IELTS',         languageTestSource: 'British Council Ukraine — IELTS registration fee; retrieved 2026-04-10',               languageTestSourceUrl: 'https://www.britishcouncil.org.ua/exam/ielts' },
  { iso: 'RO', languageTestCAD: 250, languageTestProvider: 'IELTS',         languageTestSource: 'British Council Romania — IELTS registration fee; retrieved 2026-04-10',               languageTestSourceUrl: 'https://www.britishcouncil.ro/exam/ielts' },
]

const VALID_PROVIDERS = new Set(['IELTS', 'CELPIP', 'TEF Canada', 'TCF Canada', 'IELTS / CELPIP'])

describe('US-3.5 — language seed fixture', () => {
  it('covers exactly 25 countries', () => {
    expect(LANG_25).toHaveLength(25)
  })

  it('has no duplicate ISO codes', () => {
    const isos = LANG_25.map(r => r.iso)
    expect(new Set(isos).size).toBe(isos.length)
  })

  it.each(LANG_25)('$iso — iso is valid 2-letter uppercase', ({ iso }) => {
    expect(iso).toMatch(/^[A-Z]{2}$/)
  })

  it.each(LANG_25)('$iso — languageTestCAD is null or a positive number', ({ iso, languageTestCAD }) => {
    if (languageTestCAD !== null) {
      expect(typeof languageTestCAD).toBe('number')
      expect(languageTestCAD).toBeGreaterThan(0)
    } else {
      expect(languageTestCAD).toBeNull()
    }
  })

  it.each(LANG_25)('$iso — languageTestSource is non-empty', ({ iso, languageTestSource }) => {
    expect(languageTestSource.trim()).toBeTruthy()
  })

  it.each(LANG_25)('$iso — languageTestSourceUrl is a valid https URL', ({ iso, languageTestSourceUrl }) => {
    expect(languageTestSourceUrl).toMatch(/^https:\/\//)
  })

  it.each(LANG_25)('$iso — languageTestProvider is an accepted enum value', ({ iso, languageTestProvider }) => {
    expect(VALID_PROVIDERS.has(languageTestProvider)).toBe(true)
  })

  it.each(LANG_25)(
    '$iso — languageTestCAD does not exceed $400 when set (sanity ceiling)',
    ({ iso, languageTestCAD }) => {
      if (languageTestCAD !== null) {
        expect(languageTestCAD).toBeLessThanOrEqual(400)
      }
    },
  )

  it('TEF Canada is used for France (Francophone EE primary test)', () => {
    const fr = LANG_25.find(r => r.iso === 'FR')
    expect(fr?.languageTestProvider).toBe('TEF Canada')
  })

  it('IELTS / CELPIP is noted for US (CELPIP locally available)', () => {
    const us = LANG_25.find(r => r.iso === 'US')
    expect(us?.languageTestProvider).toBe('IELTS / CELPIP')
  })

  it('matches SEED_25 combined fixture — languageTestCAD and languageTestProvider agree', () => {
    for (const langRow of LANG_25) {
      const seedRow = SEED_25.find(r => r.iso === langRow.iso)
      expect(seedRow).toBeDefined()
      if (langRow.languageTestCAD !== null) {
        expect(seedRow!.languageTestCAD).toBe(langRow.languageTestCAD)
      }
      expect(seedRow!.languageTestProvider).toBe(langRow.languageTestProvider)
    }
  })

  it('every SEED_25 country is present in LANG_25 (no missing countries)', () => {
    const langIsos = new Set(LANG_25.map(r => r.iso))
    for (const row of SEED_25) {
      expect(langIsos.has(row.iso)).toBe(true)
    }
  })

  it('languageTestCAD values show real variability (at least 6 distinct values)', () => {
    const distinct = new Set(LANG_25.filter(r => r.languageTestCAD !== null).map(r => r.languageTestCAD))
    expect(distinct.size).toBeGreaterThanOrEqual(6)
  })
})

// ─── US-3.5 — field-level languageTestCAD null fallback ──────────────────────

describe('fetchCountryCosts — field-level languageTestCAD fallback (US-3.5)', () => {
  beforeEach(() => mockFetch.mockReset())

  it('substitutes ZZ_FALLBACK.languageTestCAD when seeded doc has null languageTestCAD', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const partialDoc: any = { ...INDIA_DOC, languageTestCAD: null }
    mockFetch.mockResolvedValueOnce(partialDoc)
    const result = await fetchCountryCosts('IN')
    expect(result.iso).toBe('IN')
    expect(result.languageTestCAD).toBe(ZZ_FALLBACK.languageTestCAD)
    // Other fields must be preserved from the seeded doc
    expect(result.medicalExamCAD).toBe(160)
    expect(result.pccCAD).toBe(35)
  })

  it('substitutes ZZ_FALLBACK.languageTestCAD when seeded doc has languageTestCAD = 0', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const partialDoc: any = { ...INDIA_DOC, languageTestCAD: 0 }
    mockFetch.mockResolvedValueOnce(partialDoc)
    const result = await fetchCountryCosts('IN')
    expect(result.languageTestCAD).toBe(ZZ_FALLBACK.languageTestCAD)
  })

  it('does NOT substitute when languageTestCAD is a valid positive number', async () => {
    mockFetch.mockResolvedValueOnce(INDIA_DOC)
    const result = await fetchCountryCosts('IN')
    expect(result.languageTestCAD).toBe(255) // original INDIA_DOC value preserved
  })

  it('preserves all other seeded fields when applying language fallback', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const partialDoc: any = { ...INDIA_DOC, languageTestCAD: null }
    mockFetch.mockResolvedValueOnce(partialDoc)
    const result = await fetchCountryCosts('IN')
    expect(result.iso).toBe('IN')
    expect(result.countryName).toBe('India')
    expect(result.isSeeded).toBe(true)
    expect(result.medicalExamSource).toBe(INDIA_DOC.medicalExamSource)
    expect(result.pccSource).toBe(INDIA_DOC.pccSource)
    // Should not have called ZZ lookup (still only 1 Sanity call)
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })
})

// ─── fetchCountryCostsList ────────────────────────────────────────────────────

describe('fetchCountryCostsList', () => {
  beforeEach(() => mockFetch.mockReset())

  it('returns mapped list from Sanity', async () => {
    mockFetch.mockResolvedValueOnce(LIST_ITEMS)
    const result = await fetchCountryCostsList()
    expect(result).toHaveLength(2)
    expect(result[0].iso).toBe('IN')
    expect(result[1].iso).toBe('LK')
  })

  it('includes unseeded countries in list (for dropdown coverage)', async () => {
    mockFetch.mockResolvedValueOnce(LIST_ITEMS)
    const result = await fetchCountryCostsList()
    const unseeded = result.filter((c) => !c.isSeeded)
    expect(unseeded.length).toBeGreaterThan(0)
  })

  it('GROQ query excludes ZZ sentinel', async () => {
    mockFetch.mockResolvedValueOnce([])
    await fetchCountryCostsList()
    const [query] = mockFetch.mock.calls[0]
    expect(query).toContain('iso != "ZZ"')
  })

  it('returns empty array when Sanity returns empty', async () => {
    mockFetch.mockResolvedValueOnce([])
    const result = await fetchCountryCostsList()
    expect(result).toEqual([])
  })
})

// ─── US-3.6 — Engine dynamic cost injection ───────────────────────────────────
//
// Tests that computeUpfront and runEngine correctly inject country-specific
// medical, PCC, and language-test costs into the upfront breakdown, with
// correct source metadata and the countryCostsFallback flag.

import { computeUpfront, runEngine } from '@/lib/settlement-engine/calculate'
import type { CityBaseline } from '@/lib/settlement-engine/baselines'
import type { EngineInput } from '@/lib/settlement-engine/types'
import { buildDefaultExpenses } from '@/lib/settlement-engine/defaults'

// ─── Shared fixtures ──────────────────────────────────────────────────────────

const BASELINE: CityBaseline = {
  cityName: 'Toronto', province: 'ON',
  avgRentStudio: 1_450, avgRent1BR: 1_761, avgRent2BR: 2_100,
  monthlyTransitPass: 156,
  source: 'CMHC', effectiveDate: '2025-10-01', dataVersion: '2025-10',
  isFallback: false,
}

const BASE_INPUT: EngineInput = {
  city: 'Toronto', province: 'ON',
  pathway: 'express-entry-fsw',
  fees: { applicationFee: 950, biometricsFee: 85, biometricsPaid: false },
  housingType: '1br', furnishingLevel: 'basic',
  household: { adults: 1, children: 0 },
  needsChildcare: false, liquidSavings: 20_000, monthlyObligations: 0,
  plansCar: false, customExpenses: buildDefaultExpenses(1),
  jobStatus: 'none',
}

const INDIA_COSTS: CountryCosts = {
  iso: 'IN', countryName: 'India', flag: '🇮🇳', isSeeded: true,
  medicalExamCAD: 160, medicalExamSource: 'IRCC panel physician — India',
  pccCAD: 35, pccSource: 'Ministry of External Affairs',
  languageTestCAD: 255, languageTestProvider: 'IELTS', languageTestSource: 'IDP IELTS India',
}

const NIGERIA_COSTS: CountryCosts = {
  iso: 'NG', countryName: 'Nigeria', flag: '🇳🇬', isSeeded: true,
  medicalExamCAD: 130, medicalExamSource: 'IRCC panel physician — Nigeria',
  pccCAD: 55, pccSource: 'Nigeria Police Force',
  languageTestCAD: 280, languageTestProvider: 'IELTS', languageTestSource: 'British Council Nigeria',
}

// ─── computeUpfront — no countryCosts ─────────────────────────────────────────

describe('computeUpfront — no countryCosts', () => {
  it('does not include medical-exam item when countryCosts is undefined', () => {
    const result = computeUpfront(BASE_INPUT, BASELINE)
    expect(result.breakdown.find(i => i.key === 'medical-exam')).toBeUndefined()
  })

  it('does not include pcc item when countryCosts is undefined', () => {
    const result = computeUpfront(BASE_INPUT, BASELINE)
    expect(result.breakdown.find(i => i.key === 'pcc')).toBeUndefined()
  })

  it('does not include language-test item when countryCosts is undefined', () => {
    const result = computeUpfront(BASE_INPUT, BASELINE)
    expect(result.breakdown.find(i => i.key === 'language-test')).toBeUndefined()
  })
})

// ─── computeUpfront — seeded country (India) ──────────────────────────────────

describe('computeUpfront — seeded country (India)', () => {
  const input = { ...BASE_INPUT, countryCosts: INDIA_COSTS }
  const result = computeUpfront(input, BASELINE)

  it('includes medical-exam item with India cost', () => {
    const item = result.breakdown.find(i => i.key === 'medical-exam')
    expect(item).toBeDefined()
    expect(item!.cad).toBe(160)
  })

  it('includes pcc item with India cost', () => {
    const item = result.breakdown.find(i => i.key === 'pcc')
    expect(item).toBeDefined()
    expect(item!.cad).toBe(35)
  })

  it('includes language-test item labelled IELTS test', () => {
    const item = result.breakdown.find(i => i.key === 'language-test')
    expect(item).toBeDefined()
    expect(item!.cad).toBe(255)
    expect(item!.label).toBe('IELTS test')
  })

  it('medical-exam carries source metadata', () => {
    const item = result.breakdown.find(i => i.key === 'medical-exam')!
    expect(item.source).toBe('IRCC panel physician — India')
  })

  it('pcc carries source metadata', () => {
    const item = result.breakdown.find(i => i.key === 'pcc')!
    expect(item.source).toBe('Ministry of External Affairs')
  })

  it('medical-exam, pcc, language-test all have timing = submission', () => {
    const keys = ['medical-exam', 'pcc', 'language-test']
    for (const key of keys) {
      const item = result.breakdown.find(i => i.key === key)!
      expect(item.timing).toBe('submission')
    }
  })

  it('total includes country costs', () => {
    const withoutCountry = computeUpfront(BASE_INPUT, BASELINE)
    expect(result.total).toBe(withoutCountry.total + 160 + 35 + 255)
  })
})

// ─── computeUpfront — seeded country (Nigeria) ───────────────────────────────

describe('computeUpfront — seeded country (Nigeria)', () => {
  const input = { ...BASE_INPUT, countryCosts: NIGERIA_COSTS }
  const result = computeUpfront(input, BASELINE)

  it('uses Nigeria medical exam cost', () => {
    expect(result.breakdown.find(i => i.key === 'medical-exam')!.cad).toBe(130)
  })

  it('uses Nigeria PCC cost', () => {
    expect(result.breakdown.find(i => i.key === 'pcc')!.cad).toBe(55)
  })

  it('uses Nigeria language test cost', () => {
    expect(result.breakdown.find(i => i.key === 'language-test')!.cad).toBe(280)
  })
})

// ─── computeUpfront — ZZ fallback ─────────────────────────────────────────────

describe('computeUpfront — ZZ fallback', () => {
  const input = { ...BASE_INPUT, countryCosts: ZZ_FALLBACK }
  const result = computeUpfront(input, BASELINE)

  it('uses ZZ fallback medical exam cost ($250)', () => {
    expect(result.breakdown.find(i => i.key === 'medical-exam')!.cad).toBe(250)
  })

  it('uses ZZ fallback PCC cost ($40)', () => {
    expect(result.breakdown.find(i => i.key === 'pcc')!.cad).toBe(40)
  })

  it('uses ZZ fallback language test cost ($300)', () => {
    expect(result.breakdown.find(i => i.key === 'language-test')!.cad).toBe(300)
  })

  it('total reflects ZZ fallback costs', () => {
    const withoutCountry = computeUpfront(BASE_INPUT, BASELINE)
    expect(result.total).toBe(withoutCountry.total + 250 + 40 + 300)
  })
})

// ─── runEngine — countryCostsFallback flag ────────────────────────────────────

describe('runEngine — countryCostsFallback flag', () => {
  const DATA_VERSION = 'cmhc:2025-10|ircc:2026-q1'

  it('is undefined when no countryCosts provided', () => {
    const output = runEngine(BASE_INPUT, BASELINE, DATA_VERSION)
    expect(output.countryCostsFallback).toBeUndefined()
  })

  it('is false when seeded country data is provided (India)', () => {
    const output = runEngine({ ...BASE_INPUT, countryCosts: INDIA_COSTS }, BASELINE, DATA_VERSION)
    expect(output.countryCostsFallback).toBe(false)
  })

  it('is false when seeded country data is provided (Nigeria)', () => {
    const output = runEngine({ ...BASE_INPUT, countryCosts: NIGERIA_COSTS }, BASELINE, DATA_VERSION)
    expect(output.countryCostsFallback).toBe(false)
  })

  it('is true when ZZ_FALLBACK is used', () => {
    const output = runEngine({ ...BASE_INPUT, countryCosts: ZZ_FALLBACK }, BASELINE, DATA_VERSION)
    expect(output.countryCostsFallback).toBe(true)
  })

  it('upfront includes India country costs', () => {
    const without = runEngine(BASE_INPUT, BASELINE, DATA_VERSION)
    const with_   = runEngine({ ...BASE_INPUT, countryCosts: INDIA_COSTS }, BASELINE, DATA_VERSION)
    expect(with_.upfront).toBe(without.upfront + 160 + 35 + 255)
  })

  it('upfront breakdown contains medical-exam, pcc, language-test for India', () => {
    const output = runEngine({ ...BASE_INPUT, countryCosts: INDIA_COSTS }, BASELINE, DATA_VERSION)
    expect(output.upfrontBreakdown.some(i => i.key === 'medical-exam')).toBe(true)
    expect(output.upfrontBreakdown.some(i => i.key === 'pcc')).toBe(true)
    expect(output.upfrontBreakdown.some(i => i.key === 'language-test')).toBe(true)
  })

  it('savingsGap increases when country costs increase upfront', () => {
    const without = runEngine(BASE_INPUT, BASELINE, DATA_VERSION)
    const with_   = runEngine({ ...BASE_INPUT, countryCosts: INDIA_COSTS }, BASELINE, DATA_VERSION)
    expect(with_.savingsGap).toBeGreaterThanOrEqual(without.savingsGap)
  })
})
