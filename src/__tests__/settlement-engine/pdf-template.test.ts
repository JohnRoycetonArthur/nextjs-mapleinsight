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

  it('renders public-mode CTA and branding when requested', () => {
    const html = renderPdfTemplate(makePackage(), false, undefined, 'public')

    expect(html).toContain('Maple Insight')
    expect(html).toContain('What to Do Next')
    expect(html).not.toContain('Schedule Your Plan Review')
  })

  it('renders a compact input summary on the first page', () => {
    const html = renderPdfTemplate(makePackage({
      answers: {
        adults: 2,
        children: 1,
        arrival: '1_3_months',
        departureRegion: 'south-asia',
        pathway: 'study_permit',
        city: 'toronto',
        province: 'ON',
        transitMode: 'public',
        housing: '1br',
        furnishing: 'moderate',
        jobStatus: 'student',
        savings: '15000',
        obligations: '500',
        feesPaid: true,
        biometricsDone: false,
        studyPermit: {
          programLevel: 'graduate',
          tuitionAmount: 18000,
          gicStatus: 'planning',
          scholarshipAmount: 10000,
          isSDS: true,
        },
      },
      engineInput: {
        pathway: 'study-permit',
        liquidSavings: 15_000,
        province: 'ON',
        city: 'toronto',
        household: { adults: 2, children: 1 },
        housing: '1br',
        jobStatus: 'student',
        monthlyObligations: 500,
        studyPermit: {
          programLevel: 'graduate',
          tuitionAmount: 18_000,
          gicStatus: 'planning',
          gicAmount: 0,
          scholarshipAmount: 10_000,
          biometricsDone: false,
          feesPaid: true,
          isSDS: true,
        },
      } as MapleReportPackage['engineInput'],
    }))

    expect(html).toContain('Your Inputs')
    expect(html).toContain('Arrival:')
    expect(html).toContain('1-3 months')
    expect(html).toContain('Departure region:')
    expect(html).toContain('South Asia')
    expect(html).toContain('Household:')
    expect(html).toContain('2 adults, 1 child')
    expect(html).toContain('Program level:')
    expect(html).toContain('Graduate')
    expect(html).toContain('SDS route:')
    expect(html).toContain('Yes')
  })

  it('uses available funds including scholarship for study permit compliance card', () => {
    const html = renderPdfTemplate(makePackage({
      answers: {
        adults: 1,
        children: 0,
        pathway: 'study_permit',
        city: 'toronto',
        province: 'ON',
        housing: '1br',
        jobStatus: 'student',
        studyPermit: {
          programLevel: 'graduate',
          tuitionAmount: 18_000,
          gicStatus: 'planning',
          scholarshipAmount: 10_000,
        },
      },
      engineInput: {
        pathway: 'study-permit',
        liquidSavings: 15_000,
        province: 'ON',
        city: 'toronto',
        household: { adults: 1, children: 0 },
        housing: '1br',
        jobStatus: 'student',
        monthlyObligations: 0,
        studyPermit: {
          programLevel: 'graduate',
          tuitionAmount: 18_000,
          gicStatus: 'planning',
          gicAmount: 0,
          scholarshipAmount: 10_000,
          biometricsDone: false,
          feesPaid: false,
          isSDS: false,
        },
      } as MapleReportPackage['engineInput'],
      results: {
        upfront: 8_000,
        monthlyMin: 2_500,
        monthlySafe: 3_000,
        safeSavingsTarget: 30_000,
        savingsGap: 5_000,
        runwayMonths: 4,
        bufferPercent: 20,
        baselineFallback: false,
        upfrontBreakdown: [],
        monthlyBreakdown: [],
        irccCompliance: {
          required: 22_000,
          tuition: 18_000,
          livingExpenses: 2_000,
          transport: 2_000,
          isQuebec: false,
          compliant: true,
          shortfall: 0,
        },
      },
    }))

    expect(html).toContain('Funds Sufficient')
    expect(html).toContain('Available funds of $25,000 meet the required $22,000')
  })
})
