import { Metadata } from 'next'
import { createClient } from '@sanity/client'
import { redirect } from 'next/navigation'
import { apiVersion, dataset, projectId } from '@/sanity/env'
import { SettlementSessionProvider } from '@/components/settlement-planner/SettlementSessionContext'
import { WizardShell, type ConsultantBranding } from '@/components/settlement-planner/wizard/WizardShell'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

const publicClient = createClient({ projectId, dataset, apiVersion, useCdn: true })

async function getConsultant(slug: string): Promise<ConsultantBranding | null> {
  return publicClient.fetch<ConsultantBranding | null>(
    `*[_type == "consultant" && slug.current == $slug && status == "active"][0] {
      displayName,
      companyName,
      logo { asset -> { url } },
      theme { accentColor }
    }`,
    { slug },
  )
}

interface Props {
  params: { slug: string }
}

export default async function WizardPage({ params }: Props) {
  const consultant = await getConsultant(params.slug)

  if (!consultant) {
    redirect(`/settlement-planner/c/${params.slug}`)
  }

  return (
    <SettlementSessionProvider slug={params.slug}>
      <WizardShell consultant={consultant} />
    </SettlementSessionProvider>
  )
}
