import type { WizardAnswers } from '@/components/settlement-planner/SettlementSessionContext'
import { resetWorkIncomeAnswersForPathway } from '@/components/settlement-planner/session/pathwayResets'

describe('resetWorkIncomeAnswersForPathway', () => {
  it('clears Step 4 estimator data when switching from study permit to another pathway', () => {
    const answers: WizardAnswers = {
      pathway: 'study_permit',
      jobStatus: 'student',
      income: '1750',
      occupation: 'Software developer',
      nocCode: '21232',
      experience: 3,
      hoursPerWeek: 24,
      estimatedGrossLow: 50_000,
      estimatedGrossMid: 65_000,
      estimatedGrossHigh: 80_000,
      estimatedNetMonthly: 4_000,
      incomeSource: 'direct_input',
      confidence: 'High',
      studyPermit: {
        programLevel: 'graduate',
        tuitionAmount: 20_000,
        gicStatus: 'planning',
        scholarshipAmount: 0,
        partTimeHoursPerWeek: 20,
        partTimeHourlyRate: 17.2,
        estimatedPartTimeMonthlyIncome: 1489,
      },
    }

    const next = resetWorkIncomeAnswersForPathway(answers, 'express_entry')

    expect(next.jobStatus).toBeUndefined()
    expect(next.income).toBeUndefined()
    expect(next.occupation).toBeUndefined()
    expect(next.nocCode).toBeUndefined()
    expect(next.experience).toBeUndefined()
    expect(next.hoursPerWeek).toBeUndefined()
    expect(next.estimatedGrossLow).toBeUndefined()
    expect(next.estimatedGrossMid).toBeUndefined()
    expect(next.estimatedGrossHigh).toBeUndefined()
    expect(next.estimatedNetMonthly).toBeUndefined()
    expect(next.incomeSource).toBeUndefined()
    expect(next.confidence).toBeUndefined()
    expect(next.studyPermit?.partTimeHoursPerWeek).toBeUndefined()
    expect(next.studyPermit?.partTimeHourlyRate).toBeUndefined()
    expect(next.studyPermit?.estimatedPartTimeMonthlyIncome).toBeUndefined()
    expect(next.studyPermit?.programLevel).toBe('graduate')
  })

  it('auto-sets student status when switching to study permit', () => {
    const answers: WizardAnswers = {
      pathway: 'express_entry',
      jobStatus: 'secured_30',
      income: '4200',
      studyPermit: {
        programLevel: 'undergraduate',
        tuitionAmount: 25_000,
        gicStatus: 'planning',
        scholarshipAmount: 0,
      },
    }

    const next = resetWorkIncomeAnswersForPathway(answers, 'study_permit')

    expect(next.jobStatus).toBe('student')
    expect(next.income).toBeUndefined()
    expect(next.studyPermit?.programLevel).toBe('undergraduate')
  })
})
