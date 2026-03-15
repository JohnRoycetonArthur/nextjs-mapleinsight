import type { Metadata } from 'next';
import { STAGES } from '@/data/start-here-stages';
import { StartHerePage } from './StartHerePage';

export const metadata: Metadata = {
  title: 'Start Here: Canada Financial Guide for Newcomers',
  description:
    'Your step-by-step financial guide for newcomers to Canada. Learn what to do in your first 90 days, tax season, and beyond.',
  alternates: {
    canonical: 'https://mapleinsight.ca/start-here',
  },
};

const howToJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name: 'New to Canada? Start Here — Your Financial Journey',
  description:
    'A step-by-step guide to building a strong financial foundation as a newcomer to Canada.',
  step: STAGES.map((s) => ({
    '@type': 'HowToStep',
    position: s.order,
    name: s.title,
    text: s.description,
  })),
};

export default function StartHereRoute() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }}
      />
      <StartHerePage />
    </>
  );
}
