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
 */

/** Semver string tracking calculation-logic version. Bump on engine changes. */
export const ENGINE_VERSION = '1.1.0'

/** Composite of data-source effective dates. Bump when seeded data is refreshed. */
export const DATA_VERSION = 'ircc:2026-04-08'
