/**
 * Settlement Planner — Report Package Export (US-13.2)
 *
 * Generates and downloads a .maple.json file containing the complete
 * session data, engine results, narrative, risks, and consultant advisory.
 *
 * Rules:
 *  - Entirely client-side (no server request)
 *  - Does NOT include consultant email address
 *  - File name: mapleinsight_settlement_report_{YYYYMMDD}_{slug}.maple.json
 */

import type { EngineInput, EngineOutput } from './types'
import type { Risk } from './risks'
import type { IRCCComplianceResult } from './study-permit'
import type { NarrativeOutput } from './narrative'
import { generateConsultantAdvisory, type ConsultantAdvisory } from './consultant-advisory'
import type { WizardAnswers } from '@/components/settlement-planner/SettlementSessionContext'

// ─── Public Schema Types ──────────────────────────────────────────────────────

export interface ReportConsultantMeta {
  slug:        string
  displayName: string
  companyName: string | null
  // NOTE: email is intentionally excluded (AC-4)
}

export interface ReportResults {
  upfront:            number
  monthlyMin:         number
  monthlySafe:        number
  safeSavingsTarget:  number
  savingsGap:         number
  runwayMonths:       number
  bufferPercent:      number
  baselineFallback:   boolean
  upfrontBreakdown:   EngineOutput['upfrontBreakdown']
  monthlyBreakdown:   EngineOutput['monthlyBreakdown']
  irccFloor?:              number
  irccFloorApplied?:       boolean
  complianceFloor?:        number
  complianceFloorApplied?: boolean
  bindingConstraint?:      EngineOutput['bindingConstraint']
  irccCompliance?:         IRCCComplianceResult
  complianceRequirement?:  number
}

export interface MapleReportPackage {
  schemaVersion:      string          // "1.0"
  engineVersion:      string          // e.g. "1.0.0"
  dataVersion:        string          // composite of baseline effective dates
  generatedAt:        string          // ISO 8601 timestamp
  consultant:         ReportConsultantMeta | null
  answers:            WizardAnswers
  engineInput:        EngineInput
  results:            ReportResults
  narrative:          (NarrativeOutput & { monthlyIncome: number }) | null
  risks:              Risk[]
  consultantAdvisory: ConsultantAdvisory | null
}

// ─── generateReportPackage ────────────────────────────────────────────────────

export interface GenerateReportParams {
  engineInput:           EngineInput
  engineOutput:          EngineOutput
  answers:               WizardAnswers
  consultant?:           { slug: string; displayName: string; companyName: string | null } | null
  irccCompliance?:       IRCCComplianceResult | null
  complianceRequirement?: number | null
  monthlyIncome:         number
  risks:                 Risk[]
  narrative?:            (NarrativeOutput & { monthlyIncome: number }) | null
}

export function generateReportPackage(params: GenerateReportParams): MapleReportPackage {
  const {
    engineInput, engineOutput, answers, consultant,
    irccCompliance, complianceRequirement,
    monthlyIncome, risks, narrative,
  } = params

  const results: ReportResults = {
    upfront:           engineOutput.upfront,
    monthlyMin:        engineOutput.monthlyMin,
    monthlySafe:       engineOutput.monthlySafe,
    safeSavingsTarget: engineOutput.safeSavingsTarget,
    savingsGap:        engineOutput.savingsGap,
    runwayMonths:      engineOutput.runwayMonths,
    bufferPercent:     engineOutput.bufferPercent,
    baselineFallback:  engineOutput.baselineFallback,
    upfrontBreakdown:  engineOutput.upfrontBreakdown,
    monthlyBreakdown:  engineOutput.monthlyBreakdown,
  }

  // Include optional compliance fields when present
  if (engineOutput.irccFloor         !== undefined) results.irccFloor         = engineOutput.irccFloor
  if (engineOutput.irccFloorApplied  !== undefined) results.irccFloorApplied  = engineOutput.irccFloorApplied
  if (engineOutput.complianceFloor   !== undefined) results.complianceFloor   = engineOutput.complianceFloor
  if (engineOutput.complianceFloorApplied !== undefined) results.complianceFloorApplied = engineOutput.complianceFloorApplied
  if (engineOutput.bindingConstraint !== undefined) results.bindingConstraint = engineOutput.bindingConstraint
  if (irccCompliance)        results.irccCompliance        = irccCompliance
  if (complianceRequirement) results.complianceRequirement = complianceRequirement

  // Consultant advisory — only generate when consultant is present
  // crossReferrals is stripped from the export (F-08: cross-sell inside a professional report reduces trust)
  const _fullAdvisory = consultant
    ? generateConsultantAdvisory(
        engineInput,
        engineOutput,
        monthlyIncome,
        risks,
        complianceRequirement ?? null,
        irccCompliance ?? undefined,
      )
    : null
  const consultantAdvisory: ConsultantAdvisory | null = _fullAdvisory
    ? {
        ..._fullAdvisory,
        meetingGuide: {
          talkingPoints: _fullAdvisory.meetingGuide.talkingPoints,
          questions:     _fullAdvisory.meetingGuide.questions,
          redFlags:      _fullAdvisory.meetingGuide.redFlags,
        },
      }
    : null

  // Consultant meta — strip email (AC-4)
  const consultantMeta: ReportConsultantMeta | null = consultant
    ? { slug: consultant.slug, displayName: consultant.displayName, companyName: consultant.companyName }
    : null

  return {
    schemaVersion:      '1.0',
    engineVersion:      engineOutput.engineVersion,
    dataVersion:        engineOutput.dataVersion,
    generatedAt:        new Date().toISOString(),
    consultant:         consultantMeta,
    answers,
    engineInput,
    results,
    narrative:          narrative ?? null,
    risks,
    consultantAdvisory,
  }
}

// ─── downloadReportPackage ────────────────────────────────────────────────────

/**
 * Serialises the report package to JSON and triggers a browser file download.
 * File name: mapleinsight_settlement_report_{YYYYMMDD}_{slug}.maple.json
 */
export function downloadReportPackage(
  pkg:          MapleReportPackage,
  consultantSlug: string,
): void {
  const date   = new Date().toISOString().slice(0, 10).replace(/-/g, '')  // YYYYMMDD
  const slug   = consultantSlug.replace(/[^a-z0-9-]/gi, '-').toLowerCase()
  const name   = `mapleinsight_settlement_report_${date}_${slug}.maple.json`

  const json   = JSON.stringify(pkg, null, 2)
  const blob   = new Blob([json], { type: 'application/json' })
  const url    = URL.createObjectURL(blob)

  const a      = document.createElement('a')
  a.href       = url
  a.download   = name
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
