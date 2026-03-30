import { Metadata } from 'next'
import { SettlementSessionProvider } from '@/components/settlement-planner/SettlementSessionContext'
import { WizardShell } from '@/components/settlement-planner/wizard/WizardShell'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function PublicWizardPage() {
  return (
    <SettlementSessionProvider slug="public" mode="public">
      <WizardShell />
    </SettlementSessionProvider>
  )
}
