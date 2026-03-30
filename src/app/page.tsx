import type { Metadata } from 'next';
import { HomepageFunnel } from '@/components/home/HomepageFunnel';

export const metadata: Metadata = {
  title: { absolute: 'Maple Insight — Are You Financially Ready to Move to Canada?' },
  description:
    'Get a personalized settlement plan with cost estimates, savings gap analysis, and a 90-day checklist. Free. No sign-up required.',
  openGraph: {
    title: 'Are You Financially Ready to Move to Canada? | Maple Insight',
    description:
      'Get a personalized settlement plan with cost estimates, savings gap analysis, and a 90-day checklist. Free. No sign-up required.',
    url: 'https://mapleinsight.ca',
    siteName: 'Maple Insight Canada',
    locale: 'en_CA',
    type: 'website',
  },
  alternates: {
    canonical: 'https://mapleinsight.ca',
  },
};

export default function HomePage() {
  return <HomepageFunnel />;
}
