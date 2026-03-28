/**
 * Seed script: Data Source Catalog (US-18.1)
 *
 * Populates Sanity with authoritative source records for every data point
 * used in the Settlement Planner engine. Each record is upserted by its
 * `key` slug so the script is safe to re-run.
 *
 * Usage:
 *   node scripts/seed-data-sources.mjs
 *   node scripts/seed-data-sources.mjs --dry-run   (print records, no writes)
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

const client = createClient({ projectId, dataset, token, apiVersion: '2026-03-06', useCdn: false })

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** ISO datetime for "last verified" — today's run date. */
const VERIFIED = '2026-03-28T00:00:00Z'

function record(key, name, url, effectiveDate, category, appliesTo, notes) {
  return {
    _type: 'dataSource',
    key:   { _type: 'slug', current: key },
    name,
    url,
    effectiveDate,
    lastVerified: VERIFIED,
    category,
    appliesTo,
    notes,
  }
}

// ─── Source Records ───────────────────────────────────────────────────────────

const SOURCES = [

  // ── Regulatory (5) ──────────────────────────────────────────────────────────

  record(
    'ircc-fee-schedule',
    'IRCC Fee Schedule',
    'https://www.ircc.canada.ca/english/information/fees/fees.asp',
    '2024-04-30',
    'regulatory',
    ['ee_processing_fee', 'ee_rprf', 'ee_biometrics', 'biometrics_individual', 'biometrics_family'],
    'Express Entry principal applicant processing fee: $1,365. RPRF: $515/adult. Biometrics: $85 individual / $170 family. Verify after each federal budget.',
  ),

  record(
    'ircc-proof-of-funds-ee',
    'IRCC Express Entry Proof of Funds Table',
    'https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/documents/proof-funds.html',
    '2025-07-07',
    'regulatory',
    ['ee_funds_1', 'ee_funds_2', 'ee_funds_3', 'ee_funds_4', 'ee_funds_5', 'ee_funds_6', 'ee_funds_7', 'ee_additional_member'],
    'Based on 50% of LICO (Low Income Cut-Off). Table effective July 7, 2025. Re-verify at each federal budget cycle and IRCC update.',
  ),

  record(
    'ircc-proof-of-funds-sp',
    'IRCC Study Permit Financial Support Requirements',
    'https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada/study-permit/get-documents/financial-support.html',
    '2025-09-01',
    'regulatory',
    ['sp_living_1', 'sp_living_2', 'sp_living_3', 'sp_living_4', 'sp_living_5', 'sp_living_6', 'sp_living_7', 'sp_additional_member', 'sp_transport'],
    'Federal living expense table effective September 1, 2025. Quebec uses separate MIFI thresholds (effective January 1, 2026). Re-verify annually.',
  ),

  record(
    'ircc-student-work-rights',
    'IRCC Student Work Rights',
    'https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada/work.html',
    '2024-04-22',
    'regulatory',
    ['sp_max_hours_term', 'sp_max_hours_break'],
    'Off-campus: up to 24 hours per week during regular academic sessions; full-time during scheduled breaks. On-campus work has no hourly limit. Effective April 22, 2024 (change from 20 hrs to 24 hrs).',
  ),

  record(
    'ircc-study-permit-fees',
    'IRCC Study Permit Fee Schedule',
    'https://www.ircc.canada.ca/english/information/fees/fees.asp',
    '2024-04-30',
    'regulatory',
    ['sp_application_fee', 'sp_biometrics', 'sp_medical_exam'],
    'Study permit application fee: $150. Biometrics: $85 individual / $170 family. Medical exam (IRCC-approved panel physician): ~$250/person. Verify after each federal budget.',
  ),

  // ── Authority Baselines — Rent (7) ───────────────────────────────────────────

  record(
    'cmhc-toronto-rent',
    'CMHC Rental Market Report - Toronto',
    'https://www.cmhc-schl.gc.ca/professionals/housing-markets-data-and-research/market-reports/rental-market-reports-major-centres',
    '2025-10-01',
    'authority',
    ['toronto_rent_studio', 'toronto_rent_1br', 'toronto_rent_2br'],
    'CMHC publishes the Rental Market Report annually (October). Purpose-built rental universe. Verify each October.',
  ),

  record(
    'cmhc-vancouver-rent',
    'CMHC Rental Market Report - Vancouver',
    'https://www.cmhc-schl.gc.ca/professionals/housing-markets-data-and-research/market-reports/rental-market-reports-major-centres',
    '2025-10-01',
    'authority',
    ['vancouver_rent_studio', 'vancouver_rent_1br', 'vancouver_rent_2br'],
    'CMHC Rental Market Report (Metro Vancouver). Purpose-built rental universe. Verify each October.',
  ),

  record(
    'cmhc-calgary-rent',
    'CMHC Rental Market Report - Calgary',
    'https://www.cmhc-schl.gc.ca/professionals/housing-markets-data-and-research/market-reports/rental-market-reports-major-centres',
    '2025-10-01',
    'authority',
    ['calgary_rent_studio', 'calgary_rent_1br', 'calgary_rent_2br'],
    'CMHC Rental Market Report (Calgary CMA). Purpose-built rental universe. Verify each October.',
  ),

  record(
    'cmhc-montreal-rent',
    'CMHC Rental Market Report - Montreal',
    'https://www.cmhc-schl.gc.ca/professionals/housing-markets-data-and-research/market-reports/rental-market-reports-major-centres',
    '2025-10-01',
    'authority',
    ['montreal_rent_studio', 'montreal_rent_1br', 'montreal_rent_2br'],
    'CMHC Rental Market Report (Montreal CMA). Purpose-built rental universe. Verify each October.',
  ),

  record(
    'cmhc-ottawa-rent',
    'CMHC Rental Market Report - Ottawa',
    'https://www.cmhc-schl.gc.ca/professionals/housing-markets-data-and-research/market-reports/rental-market-reports-major-centres',
    '2025-10-01',
    'authority',
    ['ottawa_rent_studio', 'ottawa_rent_1br', 'ottawa_rent_2br'],
    'CMHC Rental Market Report (Ottawa-Gatineau CMA, Ontario portion). Verify each October.',
  ),

  record(
    'cmhc-halifax-rent',
    'CMHC Rental Market Report - Halifax',
    'https://www.cmhc-schl.gc.ca/professionals/housing-markets-data-and-research/market-reports/rental-market-reports-major-centres',
    '2025-10-01',
    'authority',
    ['halifax_rent_studio', 'halifax_rent_1br', 'halifax_rent_2br'],
    'CMHC Rental Market Report (Halifax CMA). Purpose-built rental universe. Verify each October.',
  ),

  record(
    'cmhc-winnipeg-rent',
    'CMHC Rental Market Report - Winnipeg',
    'https://www.cmhc-schl.gc.ca/professionals/housing-markets-data-and-research/market-reports/rental-market-reports-major-centres',
    '2025-10-01',
    'authority',
    ['winnipeg_rent_studio', 'winnipeg_rent_1br', 'winnipeg_rent_2br'],
    'CMHC Rental Market Report (Winnipeg CMA). Purpose-built rental universe. Verify each October.',
  ),

  // ── Authority Baselines — Transit (7) ────────────────────────────────────────

  record(
    'transit-toronto',
    'TTC Fares and Passes - Toronto',
    'https://www.ttc.ca/Fares-and-passes',
    '2025-01-01',
    'authority',
    ['toronto_transit_monthly'],
    'Adult TTC monthly pass on PRESTO: $156.00. Verify on the TTC fares and passes page after each fare update.',
  ),

  record(
    'transit-vancouver',
    'TransLink Monthly Pass - Vancouver',
    'https://www.translink.ca/monthlypass',
    '2025-01-01',
    'authority',
    ['vancouver_transit_monthly'],
    'Adult 1-Zone monthly pass (Compass Card): $111.60. Student U-Pass rates differ significantly; use only for non-student budgets. Verify on the TransLink monthly pass page.',
  ),

  record(
    'transit-calgary',
    'Calgary Transit Fares and Passes',
    'https://www.calgarytransit.com/fares---passes.html',
    '2026-01-01',
    'authority',
    ['calgary_transit_monthly'],
    'Adult monthly pass: $126.00 on the Calgary Transit 2026 fares page. Verify after each fare update.',
  ),

  record(
    'transit-montreal',
    'ARTM Transit Fares - Montreal',
    'https://www.artm.quebec/en/fares/',
    '2025-01-01',
    'authority',
    ['montreal_transit_monthly'],
    'Use the ARTM all-modes fares page for Montreal transit pricing. Verify the current Zone A monthly fare before each major fare update.',
  ),

  record(
    'transit-ottawa',
    'OC Transpo Fares - Ottawa',
    'https://www.octranspo.com/en/fares/costs/',
    '2025-12-18',
    'authority',
    ['ottawa_transit_monthly'],
    'Adult monthly pass: $138.50. Verify on the OC Transpo fares page after each fare update.',
  ),

  record(
    'transit-halifax',
    'Halifax Transit Monthly Pass',
    'https://www.halifax.ca/transportation/halifax-transit/fares-tickets-passes',
    '2025-01-01',
    'authority',
    ['halifax_transit_monthly'],
    'Adult monthly pass: $90.00. Verify on the Halifax Transit fares page after each fare update.',
  ),

  record(
    'transit-winnipeg',
    'Winnipeg Transit Fares',
    'https://info.winnipegtransit.com/en/fares/transit-fares',
    '2025-01-01',
    'authority',
    ['winnipeg_transit_monthly'],
    'Adult monthly pass: $119.35. Verify on the Winnipeg Transit fares page after each fare update.',
  ),

  // ── Estimate (1) ─────────────────────────────────────────────────────────────

  record(
    'maple-estimate',
    'Maple Insight Internal Estimate',
    'https://mapleinsight.ca',
    '2025-10-01',
    'estimate',
    ['travel_one_way', 'setup_furnished', 'setup_basic', 'setup_standard', 'groceries_single', 'groceries_family', 'utilities_monthly', 'childcare_monthly', 'car_monthly'],
    'Internal estimates derived from Statistics Canada Consumer Price Index, Numbeo, and community data. Reviewed quarterly. Not sourced from a single authority — use with appropriate caveats in consultant reports.',
  ),
]

// ─── Upsert logic ─────────────────────────────────────────────────────────────

async function upsertSource(doc) {
  const key = doc.key.current

  // Look up existing doc by key slug
  const existing = await client.fetch(
    `*[_type == "dataSource" && key.current == $key][0]{ _id }`,
    { key },
  )

  if (existing?._id) {
    const { _type, ...patch } = doc
    await client.patch(existing._id).set(patch).commit()
    return { action: 'updated', key }
  } else {
    await client.create(doc)
    return { action: 'created', key }
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\nData Source Catalog Seed — US-18.1`)
  console.log(`Dataset: ${dataset} | Records: ${SOURCES.length}`)
  if (DRY_RUN) {
    console.log('\n[DRY RUN] Records that would be seeded:')
    SOURCES.forEach(s => console.log(`  • [${s.category}] ${s.key.current} — ${s.name}`))
    console.log(`\nTotal: ${SOURCES.length} records`)
    return
  }

  console.log('\nUpserting records...\n')
  let created = 0
  let updated = 0

  for (const source of SOURCES) {
    const result = await upsertSource(source)
    const icon = result.action === 'created' ? '+' : '~'
    console.log(`  [${icon}] ${result.action.padEnd(7)} ${result.key}`)
    if (result.action === 'created') created++
    else updated++
  }

  console.log(`\nDone. ${created} created, ${updated} updated.`)
  console.log('AC-2 satisfied: minimum 18 source records present in Sanity.')
}

main().catch(err => { console.error(err); process.exit(1) })
