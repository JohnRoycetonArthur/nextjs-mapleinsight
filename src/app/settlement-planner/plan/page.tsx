import { Metadata } from 'next'
import { SettlementSessionProvider } from '@/components/settlement-planner/SettlementSessionContext'
import { PublicLandingClient } from './PublicLandingClient'

export const metadata: Metadata = {
  title: { absolute: 'Free Settlement Cost Planner | Maple Insight' },
  description:
    'Estimate your move costs, savings gap, and first-90-days checklist before arriving in Canada. Free, private, and powered by Canadian government data.',
  alternates: {
    canonical: 'https://mapleinsight.ca/settlement-planner/plan',
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: 'Free Settlement Cost Planner - Plan Your Move to Canada',
    description:
      'Estimate your settlement costs, savings gap, and first-90-days checklist. Free and private.',
    url: 'https://mapleinsight.ca/settlement-planner/plan',
    siteName: 'Maple Insight Canada',
    locale: 'en_CA',
    type: 'website',
    images: [
      {
        url: '/og/settlement-planner-public.png',
        width: 1200,
        height: 630,
        alt: 'Free Settlement Cost Planner',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free Settlement Cost Planner - Plan Your Move to Canada',
    description:
      'Estimate your settlement costs, savings gap, and first-90-days checklist. Free and private.',
    images: ['/og/settlement-planner-public.png'],
  },
}

export default function PublicSettlementPlannerPage() {
  return (
    <SettlementSessionProvider slug="public" mode="public">
      <PublicLandingClient />
    </SettlementSessionProvider>
  )
}
