import { Metadata } from 'next';
import { Suspense } from 'react';
import { ImmigrationCostClient } from './ImmigrationCostClient';

export const metadata: Metadata = {
  title: { absolute: 'Immigration Cost Calculator — How Much Does It Cost to Move to Canada? | Maple Insight' },
  description:
    'Get a source-backed estimate of your Canadian immigration and settlement costs. Based on IRCC fee schedules, CMHC rent data, and official Canadian benchmarks. Free, no signup required.',
  alternates: {
    canonical: 'https://mapleinsight.ca/immigration-cost',
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: 'Immigration Cost Calculator — How Much Does It Cost to Move to Canada?',
    description:
      'Source-backed settlement cost estimates for families, students, workers, and skilled professionals moving to Canada.',
    url: 'https://mapleinsight.ca/immigration-cost',
    siteName: 'Maple Insight Canada',
    locale: 'en_CA',
    type: 'website',
  },
};

export default function ImmigrationCostPage() {
  return (
    <Suspense fallback={null}>
      <ImmigrationCostClient />
    </Suspense>
  );
}
