/**
 * Seed script: Police Clearance Certificate Costs (US-3.4)
 *
 * Reads scripts/data/country-costs-pcc.csv (pipe-delimited) and PATCHES
 * only the pccCAD / pccSource / pccSourceUrl fields on existing countryCosts
 * documents in Sanity.  Unlike the US-3.3 createOrReplace script, this script
 * uses client.patch() so that medical-exam and language-test fields written by
 * other stories are preserved.
 *
 * Documents must already exist (created by seed-country-costs.mjs).
 * If a target document is not found, the row is logged as SKIPPED.
 *
 * isSeeded is intentionally NOT modified.  It will be flipped after all three
 * cost types (medical, PCC, language) are seeded and editorially reviewed.
 *
 * Idempotent: safe to re-run after data corrections — edit the CSV and rerun.
 *
 * Usage:
 *   node scripts/seed-country-costs-pcc.mjs
 *   node scripts/seed-country-costs-pcc.mjs --dry-run
 *   node scripts/seed-country-costs-pcc.mjs --iso GB       # patch single country
 *
 * Requires .env.local with:
 *   NEXT_PUBLIC_SANITY_PROJECT_ID
 *   NEXT_PUBLIC_SANITY_DATASET
 *   SANITY_API_TOKEN  (editor role or higher)
 */

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

// ─── Row → patch payload ──────────────────────────────────────────────────────

function rowToPatch(row) {
  const iso = row.iso.toUpperCase()
  return {
    _id:          `country-costs-${iso.toLowerCase()}`,
    iso,
    pccCAD:       Number(row.pccCAD),
    pccSource:    row.pccSource    || undefined,
    pccSourceUrl: row.pccSourceUrl || undefined,
  }
}

// ─── Validation ───────────────────────────────────────────────────────────────

function validatePatch(p) {
  const errors = []
  if (!p.iso || !/^[A-Z]{2}$/.test(p.iso))
    errors.push(`iso "${p.iso}" is not a valid ISO alpha-2 code`)
  if (!Number.isFinite(p.pccCAD) || p.pccCAD < 0)
    errors.push(`pccCAD "${p.pccCAD}" must be a non-negative number`)
  if (!p.pccSource)
    errors.push('pccSource is required')
  if (p.pccSourceUrl && !/^https?:\/\//.test(p.pccSourceUrl))
    errors.push(`pccSourceUrl "${p.pccSourceUrl}" must be a valid URL`)
  return errors
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const CSV_PATH = resolve(__dirname, 'data/country-costs-pcc.csv')

let rows
try {
  rows = parseCSV(CSV_PATH)
} catch (err) {
  console.error(`✗ Failed to parse CSV: ${err.message}`)
  process.exit(1)
}

const patches = rows.map(rowToPatch)

// Apply --iso filter
const filtered = ISO_FILTER ? patches.filter(p => p.iso === ISO_FILTER) : patches
if (ISO_FILTER && filtered.length === 0) {
  console.error(`✗ No row found for ISO "${ISO_FILTER}" in CSV`)
  process.exit(1)
}

// Validate all patches before any Sanity writes
let hasErrors = false
for (const p of filtered) {
  const errors = validatePatch(p)
  if (errors.length) {
    console.error(`✗ Validation errors for ${p.iso}:`)
    errors.forEach(e => console.error(`    ${e}`))
    hasErrors = true
  }
}
if (hasErrors) {
  console.error('\nAborting — fix validation errors before seeding.')
  process.exit(1)
}

console.log(`\nMaple Insight — PCC Costs Patch (US-3.4)`)
console.log(`Dataset:    ${dataset}`)
console.log(`Dry run:    ${DRY_RUN}`)
console.log(`ISO filter: ${ISO_FILTER ?? 'all'}`)
console.log(`Documents:  ${filtered.length}\n`)

if (DRY_RUN) {
  for (const p of filtered) {
    console.log(
      `[dry-run] ${p.iso.padEnd(3)}  pcc: $${String(p.pccCAD).padStart(4)}  source: ${p.pccSource?.slice(0, 60) ?? '(none)'}`,
    )
  }
  console.log('\n[dry-run] No writes made.')
  process.exit(0)
}

let ok = 0
let skipped = 0
let failed = 0

for (const p of filtered) {
  try {
    // Confirm document exists before patching
    const existing = await client.getDocument(p._id)
    if (!existing) {
      console.warn(`⚠ SKIPPED ${p.iso} — document "${p._id}" not found. Run seed-country-costs.mjs first.`)
      skipped++
      continue
    }

    const payload = { pccCAD: p.pccCAD }
    if (p.pccSource)    payload.pccSource    = p.pccSource
    if (p.pccSourceUrl) payload.pccSourceUrl = p.pccSourceUrl

    const result = await client.patch(p._id).set(payload).commit()
    console.log(
      `✓ ${p.iso.padEnd(3)} pcc: $${String(p.pccCAD).padStart(4)}` +
      `  source: ${p.pccSource?.slice(0, 55) ?? '(none)'}` +
      `  (rev: ${result._rev.slice(-6)})`,
    )
    ok++
  } catch (err) {
    console.error(`✗ ${p.iso}: ${err.message}`)
    failed++
  }
}

console.log(`\nDone: ${ok} patched, ${skipped} skipped (document missing), ${failed} failed.`)
console.log('isSeeded was NOT modified — flip to true in Studio after all three cost types are reviewed.')

if (failed > 0) process.exit(1)
