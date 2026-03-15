import type { Metadata } from 'next';
import { getFeaturedArticles } from '@/sanity/queries';
import { HomepageFunnel } from '@/components/home/HomepageFunnel';

export const metadata: Metadata = {
  title: { absolute: 'Maple Insight Canada — Canadian Personal Finance for Newcomers' },
  description:
    'Simulate your financial life in Canada. Get personalized salary estimates, tax breakdowns, cost-of-living analysis, and a step-by-step financial roadmap for newcomers.',
  openGraph: {
    title: 'Plan Your Financial Life in Canada | Maple Insight',
    description:
      'Simulate your income, taxes, and living costs in Canada in 2 minutes. Built for newcomers using official CRA, Statistics Canada, and Job Bank data.',
    url: 'https://mapleinsight.ca',
    siteName: 'Maple Insight Canada',
    locale: 'en_CA',
    type: 'website',
  },
  alternates: {
    canonical: 'https://mapleinsight.ca',
  },
};

export default async function HomePage() {
  const articles = await getFeaturedArticles(6);

  return <HomepageFunnel articles={articles} />;
}
