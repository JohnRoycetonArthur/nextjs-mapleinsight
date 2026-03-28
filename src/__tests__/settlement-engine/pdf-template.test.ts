import { renderPdfTemplate } from '@/lib/settlement-engine/pdf-template'
import type { MapleReportPackage } from '@/lib/settlement-engine/export'

function makePackage(overrides: Partial<MapleReportPackage> = {}): MapleReportPackage {
  return {
    schemaVersion: '1.0',
    engineVersion: '1.0.0',
    dataVersion: 'cmhc:2025-10|ircc:2025-07-07',
    generatedAt: '2026-03-27T12:00:00.000Z',
    consultant: null,
    answers: {
      adults: 1,
      children: 0,
      pathway: 'express_entry',
      city: 'toronto',
      province: 'ON',
      housing: '1br',
      jobStatus: 'no_offer',
      studyPermit: null,
    },
    engineInput: {
      pathway: 'express-entry-fsw',
      liquidSavings: 10_000,
      province: 'ON',
      city: 'toronto',
      household: { adults: 1, children: 0 },
      housing: '1br',
      jobStatus: 'none',
      monthlyObligations: 0,
    } as MapleReportPackage['engineInput'],
    results: {
      upfront: 8_000,
      monthlyMin: 2_500,
      monthlySafe: 3_000,
      safeSavingsTarget: 20_000,
      savingsGap: 10_000,
      runwayMonths: 4,
      bufferPercent: 20,
      baselineFallback: false,
      upfrontBreakdown: [],
      monthlyBreakdown: [],
      complianceRequirement: 15_263,
    },
    narrative: {
      monthlyIncome: 0,
      verdict: 'delay',
      headline: 'Build savings before moving',
      summary: 'Savings are below the recommended target.',
      priorityAction: 'Increase liquid savings before relocating.',
      timeline: [],
    } as MapleReportPackage['narrative'],
    risks: [],
    consultantAdvisory: null,
    ...overrides,
  }
}

describe('renderPdfTemplate compliance cards', () => {
  it('renders the Express Entry IRCC requirement card using engineInput pathway', () => {
    const html = renderPdfTemplate(makePackage())

    expect(html).toContain('IRCC Financial Requirement')
    expect(html).toContain('Below IRCC Minimum')
    expect(html).toContain('You need $5,263 more to meet the IRCC minimum of $15,263')
  })

  it('renders the CEC exemption card when the engine pathway is exempt', () => {
    const html = renderPdfTemplate(makePackage({
      engineInput: {
        pathway: 'express-entry-cec',
        liquidSavings: 8_000,
        province: 'ON',
        city: 'toronto',
        household: { adults: 1, children: 0 },
        housing: '1br',
        jobStatus: 'secured',
        monthlyObligations: 0,
      } as MapleReportPackage['engineInput'],
      results: {
        upfront: 8_000,
        monthlyMin: 2_500,
        monthlySafe: 3_000,
        safeSavingsTarget: 20_000,
        savingsGap: 12_000,
        runwayMonths: 3,
        bufferPercent: 20,
        baselineFallback: false,
        upfrontBreakdown: [],
        monthlyBreakdown: [],
      },
    }))

    expect(html).toContain('Proof of Funds: Exempt')
    expect(html).toContain('CEC applicants with a valid job offer and current work authorization are exempt')
  })
})
