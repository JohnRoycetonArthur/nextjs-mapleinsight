// ─── Data Source Catalog ──────────────────────────────────────────────────────

export interface DataSource {
  key: string
  name: string
  url: string
  effectiveDate: string    // ISO date, e.g. "2025-07-07"
  lastVerified: string     // ISO datetime, e.g. "2026-03-25T00:00:00Z"
  category: 'regulatory' | 'authority' | 'estimate'
  appliesTo: string[]      // engine variable keys governed by this source
  notes?: string
}

// ─── Study Permit specific types ─────────────────────────────────────────────

export type GICStatus = 'planning' | 'purchased' | 'not-purchasing'

export type ProgramLevel = 'undergraduate' | 'graduate' | 'college-diploma' | 'language-school'

export interface StudyPermitInputs {
  programLevel:     ProgramLevel
  tuitionAmount:    number   // CAD/year — user-entered or benchmark
  gicStatus:        GICStatus
  gicAmount:        number   // actual GIC amount if already purchased
  scholarshipAmount: number  // reduces the savings gap
  biometricsDone:   boolean  // true if biometrics already collected
  feesPaid:         boolean  // true if permit + biometrics + medical already paid
  isSDS?:           boolean  // true if applying via Student Direct Stream
}

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

export type HousingType =
  | 'studio' | '1br' | '2br'             // standard (all pathways)
  | 'shared-room' | 'on-campus' | 'homestay'  // study-permit specific
  | 'staying-family'                       // $0 cost (all pathways)

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

  // Funds composition — borrowed/gifted portions of liquid savings (US-20.2)
  fundsComposition?: {
    borrowed: number     // amount of savings that is borrowed (may not qualify for IRCC EE proof-of-funds)
    gifted:   number     // amount of savings that is gifted (requires gift letter documentation)
  }

  // Job status (determines runway months)
  jobStatus: JobStatus

  // Travel
  travelEstimateOverride?: number  // override default $1,500 if provided
  departureRegion?: string         // e.g. 'south-asia' — used to compute regional flight cost

  // Study permit specific (only present when pathway === 'study-permit')
  studyPermit?: StudyPermitInputs

  // Currency (optional — only when user selects non-CAD input currency, US-22.1)
  inputCurrency?: string   // ISO 4217 code of the savings input (e.g. 'INR')
  exchangeRate?: number    // 1 unit inputCurrency → CAD at time of entry
}

// ─── Breakdown ────────────────────────────────────────────────────────────────

export type FeeTimingBucket =
  | 'submission'       // Due at application submission (processing fee, biometrics, medical)
  | 'pre-landing'      // Due before landing (RPRF for EE/PNP)
  | 'pre-arrival-setup'// Pre-arrival setup (GIC, health bridge, tuition for study permit)
  | 'settlement'       // Settlement setup (travel, housing deposit, furnishing)

export interface BreakdownItem {
  key: string             // machine-readable identifier
  label: string           // human-readable label
  cad: number             // amount in CAD
  source: string          // data source (e.g. "ircc", "cmhc", "constant")
  sourceKey?: string      // catalog key linking to a dataSource document (e.g. "ircc-fee-schedule")
  timing?: FeeTimingBucket// cash-flow timing bucket (AC-4 — US-20.4)
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

  // Study permit specific (optional)
  irccFloor?: number          // IRCC proof-of-funds requirement (study permit)
  irccFloorApplied?: boolean  // true when irccFloor overrode the standard target

  // Express Entry / PNP compliance (optional)
  complianceFloor?: number         // IRCC settlement funds requirement (EE FSWP/FSTP/PNP)
  complianceFloorApplied?: boolean // true when complianceFloor overrode the standard target
  bindingConstraint?: 'compliance' | 'real-world'  // which constraint set safeSavingsTarget
}
