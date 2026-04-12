/**
 * Seed script: Language Test Costs (US-3.5)
 *
 * Reads scripts/data/country-costs-language.csv (pipe-delimited) and PATCHES
 * only the languageTestCAD / languageTestProvider / languageTestSource /
 * languageTestSourceUrl fields on existing countryCosts documents in Sanity.
 *
 * Documents must already exist (created by seed-country-costs.mjs, US-3.3).
 * If a target document is not found, the row is logged as SKIPPED.
 *
 * Null handling:
 *   If languageTestCAD is empty in the CSV (no local test centre for this country),
 *   the field is NOT patched — it remains null/undefined in Sanity.  The engine
 *   helper (fetchCountryCosts) will substitute ZZ_FALLBACK.languageTestCAD at
 *   runtime for such documents.
 *
 * isSeeded flip (Phase 2):
 *   After all language patches succeed (Phase 1), the script atomically flips
 *   isSeeded = true for all 25 documents in a single Sanity transaction.  This
 *   is the final gate — once flipped, the engine will use country-specific figures
 *   for those ISO codes.  If ANY Phase 1 patch fails, the isSeeded flip is aborted.
 *
 * Idempotent: safe to re-run after data corrections — edit the CSV and rerun.
 * Re-running after isSeeded is already true is safe: the set() patch is a no-op
 * for fields that did not change.
 *
 * Usage:
 *   node scripts/seed-country-costs-language.mjs
 *   node scripts/seed-country-costs-language.mjs --dry-run
 *   node scripts/seed-country-costs-language.mjs --iso FR    # patch single country
 *   node scripts/seed-country-costs-language.mjs --skip-flip # skip isSeeded flip
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
const SKIP_FLIP  = process.argv.includes('--skip-flip')
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
  // languageTestCAD may be empty (null) — engine helper falls back to ZZ at runtime
  const cadRaw = row.languageTestCAD
  const cad    = cadRaw !== '' ? Number(cadRaw) : null

  return {
    _id:                   `country-costs-${iso.toLowerCase()}`,
    iso,
    languageTestCAD:       cad,
    languageTestProvider:  row.languageTestProvider  || undefined,
    languageTestSource:    row.languageTestSource    || undefined,
    languageTestSourceUrl: row.languageTestSourceUrl || undefined,
  }
}

// ─── Validation ───────────────────────────────────────────────────────────────

function validatePatch(p) {
  const errors = []
  if (!p.iso || !/^[A-Z]{2}$/.test(p.iso))
    errors.push(`iso "${p.iso}" is not a valid ISO alpha-2 code`)

  if (p.languageTestCAD !== null) {
    if (!Number.isFinite(p.languageTestCAD) || p.languageTestCAD <= 0)
      errors.push(`languageTestCAD "${p.languageTestCAD}" must be a positive number (or empty for null)`)
    if (!p.languageTestSource)
      errors.push('languageTestSource is required when languageTestCAD is set')
    if (p.languageTestSourceUrl && !/^https?:\/\//.test(p.languageTestSourceUrl))
      errors.push(`languageTestSourceUrl "${p.languageTestSourceUrl}" must be a valid URL`)
  }
  return errors
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const CSV_PATH = resolve(__dirname, 'data/country-costs-language.csv')

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

console.log(`\nMaple Insight — Language Test Costs Patch (US-3.5)`)
console.log(`Dataset:    ${dataset}`)
console.log(`Dry run:    ${DRY_RUN}`)
console.log(`ISO filter: ${ISO_FILTER ?? 'all'}`)
console.log(`Documents:  ${filtered.length}`)
console.log(`Skip flip:  ${SKIP_FLIP || !!ISO_FILTER}\n`)

if (DRY_RUN) {
  for (const p of filtered) {
    const cadStr = p.languageTestCAD !== null ? `$${p.languageTestCAD}` : 'null (ZZ fallback)'
    console.log(
      `[dry-run] ${p.iso.padEnd(3)}  lang: ${cadStr.padEnd(16)}  provider: ${p.languageTestProvider ?? '(none)'}`,
    )
  }
  if (!ISO_FILTER && !SKIP_FLIP) {
    console.log(`\n[dry-run] Phase 2 would flip isSeeded=true for ${filtered.length} documents.`)
  }
  console.log('\n[dry-run] No writes made.')
  process.exit(0)
}

// ─── Phase 1: patch language costs ───────────────────────────────────────────

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

    const payload = {}
    if (p.languageTestCAD !== null)    payload.languageTestCAD       = p.languageTestCAD
    if (p.languageTestProvider)        payload.languageTestProvider   = p.languageTestProvider
    if (p.languageTestSource)          payload.languageTestSource     = p.languageTestSource
    if (p.languageTestSourceUrl)       payload.languageTestSourceUrl  = p.languageTestSourceUrl

    const result = await client.patch(p._id).set(payload).commit()
    const cadStr = p.languageTestCAD !== null ? `$${String(p.languageTestCAD).padStart(3)}` : 'null'
    console.log(
      `✓ ${p.iso.padEnd(3)} lang: ${cadStr.padEnd(7)}  provider: ${(p.languageTestProvider ?? '(none)').padEnd(15)}` +
      `  source: ${p.languageTestSource?.slice(0, 45) ?? '(none)'}` +
      `  (rev: ${result._rev.slice(-6)})`,
    )
    ok++
  } catch (err) {
    console.error(`✗ ${p.iso}: ${err.message}`)
    failed++
  }
}

console.log(`\nPhase 1 done: ${ok} patched, ${skipped} skipped (document missing), ${failed} failed.`)

if (failed > 0) {
  console.error('\n✗ Phase 1 had failures — isSeeded flip ABORTED. Fix errors and rerun.')
  process.exit(1)
}

// ─── Phase 2: atomically flip isSeeded = true ────────────────────────────────
// Only runs when: all Phase 1 patches succeeded, no --iso filter (full run),
// and --skip-flip was not passed.

if (ISO_FILTER || SKIP_FLIP) {
  console.log('\nisSeeded flip skipped (--iso filter or --skip-flip flag set).')
  console.log('Run without --iso / --skip-flip after all countries are patched to flip isSeeded.')
  process.exit(0)
}

console.log(`\nPhase 2: flipping isSeeded=true for all ${filtered.length} documents (atomic transaction)…`)

try {
  const tx = client.transaction()
  for (const p of filtered) {
    tx.patch(p._id, patch => patch.set({ isSeeded: true }))
  }
  await tx.commit()
  console.log(`✓ isSeeded=true set for ${filtered.length} documents in a single transaction.`)
} catch (err) {
  console.error(`\n✗ Phase 2 transaction failed: ${err.message}`)
  console.error('Language costs are patched but isSeeded was NOT flipped. Retry the script to re-attempt.')
  process.exit(1)
}

console.log('\nUS-3.5 complete: language costs seeded, isSeeded=true for all 25 documents.')
console.log('Country-specific data is now live in the settlement engine.')
