import type { WizardAnswers } from '../SettlementSessionContext'

export function resetWorkIncomeAnswersForPathway(
  answers: WizardAnswers,
  pathway: string | undefined,
): WizardAnswers {
  const nextStudyPermit = answers.studyPermit == null
    ? answers.studyPermit
    : {
        ...answers.studyPermit,
        partTimeHoursPerWeek: undefined,
        partTimeHourlyRate: undefined,
        estimatedPartTimeMonthlyIncome: undefined,
      }

  return {
    ...answers,
    jobStatus: pathway === 'study_permit' ? 'student' : undefined,
    income: undefined,
    occupation: undefined,
    nocCode: undefined,
    experience: undefined,
    hoursPerWeek: undefined,
    estimatedGrossLow: undefined,
    estimatedGrossMid: undefined,
    estimatedGrossHigh: undefined,
    estimatedNetMonthly: undefined,
    incomeSource: undefined,
    confidence: undefined,
    studyPermit: nextStudyPermit,
  }
}
