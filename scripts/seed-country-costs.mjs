/**
 * Seed script: Country Pre-Arrival Costs (US-3.3)
 *
 * Reads scripts/data/country-medical-costs.csv (pipe-delimited) and upserts
 * one countryCosts document per row into Sanity.
 *
 * Each document is created with isSeeded = false.  Editorial review must flip
 * this to true in Sanity Studio before the engine will use country-specific
 * figures (until then, ZZ fallback applies).
 *
 * Idempotent: uses createOrReplace with deterministic _id = "country-costs-{iso}".
 * Safe to re-run after data corrections — just edit the CSV and rerun.
 *
 * Methodology
 * -----------
 * Medical exam:   IRCC panel physician directory (secure.cic.gc.ca/pp-md/pp-list.aspx)
 *                 Conservative high value where a range exists.
 * PCC:            Official government portal for each country.
 *                 Higher value used where processing/courier fees vary.
 * Language test:  IELTS via IDP or British Council per country.
 *                 France uses TEF Canada (primary Francophone EE test).
 *                 All converted to CAD using Bank of Canada noon rate 2026-04-10.
 *
 * Usage:
 *   node scripts/seed-country-costs.mjs
 *   node scripts/seed-country-costs.mjs --dry-run
 *   node scripts/seed-country-costs.mjs --iso IN        # seed single country
 *
 * Requires .env.local with:
 *   NEXT_PUBLIC_SANITY_PROJECT_ID
 *   NEXT_PUBLIC_SANITY_DATASET
 *   SANITY_API_TOKEN  (editor role or higher)
 */

import { createReadStream } from 'fs'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'
import { createClient } from '@sanity/client'

const __dirname = dirname(fileURLToPath(import.meta.url))

dotenv.config({ path: resolve(__dirname, '../.env.local') })

// ─── CLI flags ────────────────────────────────────────────────────────────────

const DRY_RUN    = process.argv.includes('--dry-run')
const ISO_FILTER = (() => {
  const idx = process.argv.indexOf('--iso')
  return idx !== -1 ? process.argv[idx + 1]?.toUpperCase() : null
})()

// ─── Sanity client ────────────────────────────────────────────────────────────

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const dataset   = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
const token     = process.env.SANITY_API_TOKEN

if (!projectId) throw new Error('Missing NEXT_PUBLIC_SANITY_PROJECT_ID in .env.local')
if (!token)     throw new Error('Missing SANITY_API_TOKEN in .env.local')

const client = createClient({
  projectId,
  dataset,
  token,
  apiVersion: '2026-04-10',
  useCdn: false,
})

// ─── CSV parser ───────────────────────────────────────────────────────────────
// Pipe-delimited. Comment lines start with #. Header row defines field names.

function parseCSV(filePath) {
  const raw = readFileSync(filePath, 'utf-8')
  const lines = raw
    .split('\n')
    .map(l => l.trim())
    .filter(l => l && !l.startsWith('#'))

  if (lines.length < 2) throw new Error('CSV has no data rows')

  const headers = lines[0].split('|').map(h => h.trim())

  return lines.slice(1).map((line, i) => {
    const values = line.split('|')
    if (values.length !== headers.length) {
      throw new Error(
        `CSV row ${i + 2}: expected ${headers.length} columns, got ${values.length}\n  ${line}`,
      )
    }
    return Object.fromEntries(headers.map((h, j) => [h, values[j].trim()]))
  })
}

// ─── Row → Sanity document ────────────────────────────────────────────────────

function rowToDoc(row) {
  const iso = row.iso.toUpperCase()

  return {
    _id:   `country-costs-${iso.toLowerCase()}`,
    _type: 'countryCosts',

    iso,
    countryName: row.countryName,
    flag:        row.flag || undefined,
    isSeeded:    false,  // intentionally false — editorial must flip after review
    effectiveDate: row.effectiveDate,

    medicalExamCAD:       Number(row.medicalExamCAD),
    medicalExamSource:    row.medicalExamSource   || undefined,
    medicalExamSourceUrl: row.medicalExamSourceUrl || undefined,

    pccCAD:       Number(row.pccCAD),
    pccSource:    row.pccSource   || undefined,
    pccSourceUrl: row.pccSourceUrl || undefined,

    languageTestCAD:       Number(row.languageTestCAD),
    languageTestProvider:  row.languageTestProvider  || undefined,
    languageTestSource:    row.languageTestSource    || undefined,
    languageTestSourceUrl: row.languageTestSourceUrl || undefined,

    notes: row.notes || undefined,
  }
}

// ─── Validation ───────────────────────────────────────────────────────────────

function validateDoc(doc) {
  const errors = []
  if (!doc.iso || !/^[A-Z]{2}$/.test(doc.iso))
    errors.push(`iso "${doc.iso}" is not a valid ISO alpha-2 code`)
  if (!doc.countryName)
    errors.push('countryName is required')
  if (!Number.isFinite(doc.medicalExamCAD) || doc.medicalExamCAD < 0)
    errors.push(`medicalExamCAD "${doc.medicalExamCAD}" must be a non-negative number`)
  if (!doc.medicalExamSource)
    errors.push('medicalExamSource is required')
  if (!Number.isFinite(doc.pccCAD) || doc.pccCAD < 0)
    errors.push(`pccCAD "${doc.pccCAD}" must be a non-negative number`)
  if (!doc.pccSource)
    errors.push('pccSource is required')
  if (!Number.isFinite(doc.languageTestCAD) || doc.languageTestCAD <= 0)
    errors.push(`languageTestCAD "${doc.languageTestCAD}" must be a positive number`)
  if (!doc.languageTestSource)
    errors.push('languageTestSource is required')
  if (!doc.effectiveDate)
    errors.push('effectiveDate is required')
  return errors
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const CSV_PATH = resolve(__dirname, 'data/country-medical-costs.csv')

let rows
try {
  rows = parseCSV(CSV_PATH)
} catch (err) {
  console.error(`✗ Failed to parse CSV: ${err.message}`)
  process.exit(1)
}

const docs = rows.map(rowToDoc)

// Apply --iso filter
const filtered = ISO_FILTER ? docs.filter(d => d.iso === ISO_FILTER) : docs
if (ISO_FILTER && filtered.length === 0) {
  console.error(`✗ No row found for ISO "${ISO_FILTER}" in CSV`)
  process.exit(1)
}

// Validate all docs before any Sanity writes
let hasErrors = false
for (const doc of filtered) {
  const errors = validateDoc(doc)
  if (errors.length) {
    console.error(`✗ Validation errors for ${doc.iso}:`)
    errors.forEach(e => console.error(`    ${e}`))
    hasErrors = true
  }
}
if (hasErrors) {
  console.error('\nAborting — fix validation errors before seeding.')
  process.exit(1)
}

console.log(`\nMaple Insight — Country Costs Seed (US-3.3)`)
console.log(`Dataset:    ${dataset}`)
console.log(`Dry run:    ${DRY_RUN}`)
console.log(`ISO filter: ${ISO_FILTER ?? 'all'}`)
console.log(`Documents:  ${filtered.length}\n`)

if (DRY_RUN) {
  for (const doc of filtered) {
    const total = doc.medicalExamCAD + doc.pccCAD + doc.languageTestCAD
    console.log(
      `[dry-run] ${doc.flag ?? ''} ${doc.iso} — ${doc.countryName}` +
      `  medical: $${doc.medicalExamCAD}` +
      `  pcc: $${doc.pccCAD}` +
      `  language: $${doc.languageTestCAD}` +
      `  total: $${total}` +
      `  isSeeded: ${doc.isSeeded}`,
    )
  }
  console.log('\n[dry-run] No writes made.')
  process.exit(0)
}

let ok = 0
let failed = 0

for (const doc of filtered) {
  try {
    const result = await client.createOrReplace(doc)
    const total  = doc.medicalExamCAD + doc.pccCAD + doc.languageTestCAD
    console.log(
      `✓ ${doc.flag ?? ''} ${doc.iso.padEnd(3)} ${doc.countryName.padEnd(20)}` +
      `  medical: $${String(doc.medicalExamCAD).padStart(4)}` +
      `  pcc: $${String(doc.pccCAD).padStart(3)}` +
      `  lang: $${String(doc.languageTestCAD).padStart(3)}` +
      `  total: $${total}` +
      `  (rev: ${result._rev.slice(-6)})`,
    )
    ok++
  } catch (err) {
    console.error(`✗ ${doc.iso} — ${doc.countryName}: ${err.message}`)
    failed++
  }
}

console.log(`\nDone: ${ok} upserted, ${failed} failed.`)
console.log('isSeeded = false on all documents — flip to true in Studio after editorial review.')

if (failed > 0) process.exit(1)
