/**
 * Seed script: IRCC Express Entry Proof-of-Funds (US-1.1)
 *
 * Upserts the "Express Entry — Federal Skilled Worker" immigrationFees
 * document in Sanity with 2025 LICO settlement-fund values effective
 * July 7, 2025. Safe to re-run (idempotent via _id replace).
 *
 * Basis: 50% of Low Income Cut-Off (LICO), updated annually by IRCC.
 * Source: https://www.canada.ca/en/immigration-refugees-citizenship/
 *         services/immigrate-canada/express-entry/documents/proof-funds.html
 * Effective: 2025-07-07
 * Verified: 2026-04-08
 *
 * Per-additional-member increment (beyond family size 7): $4,112
 *
 * Usage:
 *   node scripts/seed-ircc-proof-of-funds.mjs
 *   node scripts/seed-ircc-proof-of-funds.mjs --dry-run
 *
 * Requires .env.local with:
 *   NEXT_PUBLIC_SANITY_PROJECT_ID
 *   NEXT_PUBLIC_SANITY_DATASET
 *   SANITY_API_TOKEN  (editor role or higher)
 */

import dotenv from 'dotenv'
import { createClient } from '@sanity/client'

dotenv.config({ path: '.env.local' })

const DRY_RUN = process.argv.includes('--dry-run')

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const dataset   = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
const token     = process.env.SANITY_API_TOKEN

if (!projectId) throw new Error('Missing NEXT_PUBLIC_SANITY_PROJECT_ID in .env.local')
if (!token)     throw new Error('Missing SANITY_API_TOKEN in .env.local')

const client = createClient({ projectId, dataset, token, apiVersion: '2026-04-08', useCdn: false })

// ─── 2025 LICO — 50% threshold, effective July 7, 2025 ───────────────────────

const EE_FUNDS_2025 = [
  { _key: 'fsw-1', familyMembers: 1, amountCAD: 15_263 },
  { _key: 'fsw-2', familyMembers: 2, amountCAD: 19_001 },
  { _key: 'fsw-3', familyMembers: 3, amountCAD: 23_360 },
  { _key: 'fsw-4', familyMembers: 4, amountCAD: 28_362 },
  { _key: 'fsw-5', familyMembers: 5, amountCAD: 32_168 },
  { _key: 'fsw-6', familyMembers: 6, amountCAD: 36_280 },
  { _key: 'fsw-7', familyMembers: 7, amountCAD: 40_392 },
]

const ADDITIONAL_MEMBER_INCREMENT = 4_112
const EFFECTIVE_DATE     = '2025-07-07'
const FEE_EFFECTIVE_DATE = '2024-04-30'   // April 30 2024: processing $950, RPRF $575
const VERIFIED_AT        = '2026-04-08'
const SOURCE_URL         = 'https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/documents/proof-funds.html'
const PR_FEES_URL        = 'https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/apply-permanent-residence/fees.html'
const BIO_URL            = 'https://www.canada.ca/en/immigration-refugees-citizenship/services/application/fees.html'
const RPRF_URL           = 'https://www.canada.ca/en/immigration-refugees-citizenship/corporate/mandate/policies-operational-instructions-agreements/ministerial-instructions/other-goods-services-fees/fees.html'

// ─── Shared fee line items ────────────────────────────────────────────────────

const PR_FEE_LINE_ITEMS = [
  {
    _key:          'fee-pr-processing',
    key:           'immigration-fee',
    label:         'Processing fee — principal applicant',
    amountCAD:     950,
    sourceUrl:     PR_FEES_URL,
    effectiveDate: FEE_EFFECTIVE_DATE,
    notes:         'Government processing fee for Express Entry PR application. Effective April 30, 2024.',
  },
  {
    _key:          'fee-rprf-single',
    key:           'rprf-single',
    label:         'Right of Permanent Residence Fee — single applicant',
    amountCAD:     575,
    sourceUrl:     RPRF_URL,
    effectiveDate: FEE_EFFECTIVE_DATE,
    notes:         'RPRF per adult — can be paid any time before landing. Effective April 30, 2024.',
  },
  {
    _key:          'fee-rprf-couple',
    key:           'rprf-couple',
    label:         'Right of Permanent Residence Fee — 2 adults',
    amountCAD:     1_150,
    sourceUrl:     RPRF_URL,
    effectiveDate: FEE_EFFECTIVE_DATE,
    notes:         '2 × $575 RPRF for couples. Effective April 30, 2024.',
  },
  {
    _key:          'fee-biometrics-single',
    key:           'biometrics-single',
    label:         'Biometrics — single applicant',
    amountCAD:     85,
    sourceUrl:     BIO_URL,
    effectiveDate: FEE_EFFECTIVE_DATE,
  },
  {
    _key:          'fee-biometrics-family',
    key:           'biometrics-family-cap',
    label:         'Biometrics — family/group cap (2+ persons)',
    amountCAD:     170,
    sourceUrl:     BIO_URL,
    effectiveDate: FEE_EFFECTIVE_DATE,
    notes:         'IRCC caps total biometrics at $170 when a family or group applies together.',
  },
]

// ─── Document definitions ─────────────────────────────────────────────────────

const FSW_DOC = {
  _id:   'immigration-fees-express-entry-fsw',
  _type: 'immigrationFees',

  pathway:               'Express Entry — Federal Skilled Worker',
  applicationFee:        950,
  biometricsFee:         85,
  biometricsFamilyCapFee: 170,
  effectiveDate:         FEE_EFFECTIVE_DATE,
  source:                `IRCC — Express Entry fees, effective ${FEE_EFFECTIVE_DATE}. ${PR_FEES_URL}`,
  verified:              true,
  verifiedAt:            VERIFIED_AT,

  // US-1.3: granular fee line items with per-item source URLs
  feeLineItems: PR_FEE_LINE_ITEMS,

  // Legacy proof-of-funds table (kept for backward compat; superseded below)
  proofOfFundsTable: EE_FUNDS_2025.map(e => ({
    _key:          `legacy-${e._key}`,
    familySize:    e.familyMembers,
    requiredFunds: e.amountCAD,
  })),

  // Canonical EE settlement-funds array (consumed by compliance engine)
  expressEntryFunds:            EE_FUNDS_2025,
  expressEntryAdditionalMember: ADDITIONAL_MEMBER_INCREMENT,
  expressEntryEffectiveDate:    EFFECTIVE_DATE,
  source_proof_of_funds:        `IRCC — Express Entry proof-of-funds (50% LICO), effective ${EFFECTIVE_DATE}. ${SOURCE_URL}`,
}

// CEC: same processing fee as FSW, no proof-of-funds requirement
const CEC_DOC = {
  _id:   'immigration-fees-express-entry-cec',
  _type: 'immigrationFees',

  pathway:               'Express Entry — Canadian Experience Class',
  applicationFee:        950,
  biometricsFee:         85,
  biometricsFamilyCapFee: 170,
  effectiveDate:         FEE_EFFECTIVE_DATE,
  source:                `IRCC — Express Entry fees, effective ${FEE_EFFECTIVE_DATE}. ${PR_FEES_URL}`,
  verified:              true,
  verifiedAt:            VERIFIED_AT,

  feeLineItems: PR_FEE_LINE_ITEMS,
}

// ─── Execute ──────────────────────────────────────────────────────────────────

if (DRY_RUN) {
  console.log('[dry-run] Would upsert documents:')
  console.log(JSON.stringify(FSW_DOC, null, 2))
  console.log(JSON.stringify(CEC_DOC, null, 2))
  process.exit(0)
}

const DOCS = [FSW_DOC, CEC_DOC]

try {
  for (const doc of DOCS) {
    const result = await client.createOrReplace(doc)
    console.log(`✓ Upserted ${result._id} (rev: ${result._rev})`)
    console.log(`  applicationFee: $${doc.applicationFee} (processing only) | biometricsFee: $${doc.biometricsFee} | familyCap: $${doc.biometricsFamilyCapFee}`)
    console.log(`  RPRF: $575/adult (separate line item) | effectiveDate: ${doc.effectiveDate}`)
    console.log(`  verified: ${doc.verified} | verifiedAt: ${doc.verifiedAt}`)
    console.log(`  feeLineItems: ${doc.feeLineItems?.length ?? 0} items`)
    if (doc.expressEntryFunds?.length) {
      console.log('  expressEntryFunds (2025 LICO @ 50%):')
      for (const e of EE_FUNDS_2025) {
        const label = `${e.familyMembers} person${e.familyMembers > 1 ? 's' : ''}`
        console.log(`    ${label}: $${e.amountCAD.toLocaleString('en-CA')}`)
      }
      console.log(`  Per additional member beyond 7: $${ADDITIONAL_MEMBER_INCREMENT.toLocaleString('en-CA')}`)
      console.log(`  EE effective date: ${EFFECTIVE_DATE}`)
    }
  }
  console.log(`\n  Fee schedule source: ${PR_FEES_URL}`)
  console.log(`  Proof-of-funds source: ${SOURCE_URL}`)
} catch (err) {
  console.error('✗ Seed failed:', err.message)
  process.exit(1)
}
