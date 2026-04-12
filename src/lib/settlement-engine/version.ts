/**
 * Settlement Planner — Engine and Data Versions (US-1.4)
 *
 * ENGINE_VERSION: bump when calculation logic changes.
 * DATA_VERSION:   bump whenever seeded operational data is refreshed.
 *                 Convention: "source:YYYY-MM-DD" — "|"-separated when multiple sources update.
 *
 * Both are emitted on every EngineOutput, included in .maple.json exports,
 * printed on PDF cover pages, and surfaced via the VersionStamp UI component.
 *
 * History:
 *   ircc:2025-07-07  US-1.1 — Refreshed FSW/FSTP proof-of-funds to 2025 LICO values
 *   ircc:2026-04-08  US-1.3 fix — Processing fee $950 (was $1,365 bundled), RPRF $575 (was $515)
 *   1.0.0 → 1.1.0   US-2.1 — CEC exemption: explicit proofOfFundsExemption field on EngineOutput
 *   1.1.0 → 1.2.0   US-2.3 — Savings gap now targets safeRecommended (IRCC floor × 1.05, rounded to $100) for EE/PNP non-exempt pathways
 *   ircc:2026-04-09  US-2.5 — SDS eligible countries seeded (canada.ca/sds, 13 countries as of 2025)
 *   schema:2026-04-10 US-3.2 — CountryCosts Sanity schema, ZZ fallback document, fetchCountryCosts()
 *   country-costs:2026-04-10 US-3.3 — Medical exam, PCC, and language test costs seeded for top 25 countries (isSeeded=false pending review)
 *   pcc-costs:2026-04-10   US-3.4 — PCC costs patched via dedicated country-costs-pcc.csv; isSeeded=false pending language seed
 *   language-costs:2026-04-10 US-3.5 — Language test costs seeded for all 25 countries; isSeeded flipped to true atomically
 */

/** Semver string tracking calculation-logic version. Bump on engine changes. */
export const ENGINE_VERSION = '1.3.0'

/** Composite of data-source effective dates. Bump when seeded data is refreshed. */
export const DATA_VERSION = 'ircc:2026-04-09|schema:2026-04-10|country-costs:2026-04-10|pcc-costs:2026-04-10|language-costs:2026-04-10'
