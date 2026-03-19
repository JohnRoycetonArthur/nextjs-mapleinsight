// ─── Engine Input ─────────────────────────────────────────────────────────────

export type ImmigrationPathway =
  | 'express-entry-fsw'
  | 'express-entry-cec'
  | 'express-entry-fstp'
  | 'study-permit'
  | 'work-permit'
  | 'pnp'
  | 'family-sponsorship'
  | 'other'

export type JobStatus = 'secured' | 'offer' | 'none' | 'student'

export type HousingType = 'studio' | '1br' | '2br'

export type FurnishingLevel = 'furnished' | 'basic' | 'standard'

export type HouseholdComposition = {
  adults: number      // 1 or 2
  children: number    // 0+
}

export interface ImmigrationFeeInput {
  applicationFee: number    // from immigrationFees Sanity document
  biometricsFee: number     // per-person biometrics
  biometricsPaid: boolean   // true if already paid before move
}

export interface EngineInput {
  // Location
  city: string
  province: string

  // Immigration
  pathway: ImmigrationPathway
  fees: ImmigrationFeeInput

  // Housing
  housingType: HousingType
  furnishingLevel: FurnishingLevel

  // Household
  household: HouseholdComposition
  needsChildcare: boolean   // monthly childcare adder if true

  // Financial
  liquidSavings: number     // CAD available at time of move
  monthlyObligations: number // recurring debt payments, remittances, etc.

  // Lifestyle adders
  plansCar: boolean         // monthly car cost adder if true
  customMonthlyExpenses: number // any other regular expenses

  // Job status (determines runway months)
  jobStatus: JobStatus

  // Travel
  travelEstimateOverride?: number  // override default $1,500 if provided
}

// ─── Breakdown ────────────────────────────────────────────────────────────────

export interface BreakdownItem {
  key: string       // machine-readable identifier
  label: string     // human-readable label
  cad: number       // amount in CAD
  source: string    // data source (e.g. "ircc", "cmhc", "constant")
}

// ─── Engine Output ────────────────────────────────────────────────────────────

export interface EngineOutput {
  // Core figures
  upfront: number           // U — one-time move cost
  monthlyMin: number        // M_min — bare minimum monthly cost
  monthlySafe: number       // M_safe — monthly cost with lifestyle adders
  safeSavingsTarget: number // S_safe — recommended savings before moving
  savingsGap: number        // G — max(0, S_safe - liquidSavings)

  // Inputs echoed back for reproducibility
  runwayMonths: number
  bufferPercent: number

  // Versioning
  engineVersion: string     // semver
  dataVersion: string       // composite of baseline effectiveDates

  // Line-item breakdown
  upfrontBreakdown: BreakdownItem[]
  monthlyBreakdown: BreakdownItem[]

  // Warning if city baseline fell back to national averages
  baselineFallback: boolean
}
