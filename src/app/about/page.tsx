import type { Metadata } from 'next'
import { client } from '@/sanity/lib/client'
import type { ContributorPublic } from '@/lib/types/contributor'
import { AboutHero } from '@/components/about/AboutHero'
import { MissionStory } from '@/components/about/MissionStory'
import { ContributorsSection } from '@/components/about/ContributorsSection'
import { MethodologySection } from '@/components/about/MethodologySection'
import { TrustPillars } from '@/components/about/TrustPillars'
import { CommunitySection } from '@/components/about/CommunitySection'
import { AboutCTA } from '@/components/about/AboutCTA'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'About Maple Insight — Built for newcomers, reviewed by experts',
  description:
    'Maple Insight provides financial planning tools for newcomers to Canada. All tax and financial content is reviewed by qualified Canadian professionals.',
  openGraph: {
    title: 'About Maple Insight — Built for newcomers, reviewed by experts',
    description:
      'Maple Insight provides financial planning tools for newcomers to Canada. All tax and financial content is reviewed by qualified Canadian professionals.',
    url: 'https://mapleinsight.ca/about',
    siteName: 'Maple Insight Canada',
    locale: 'en_CA',
    type: 'website',
  },
  alternates: {
    canonical: 'https://mapleinsight.ca/about',
  },
}

const CONTRIBUTORS_QUERY = `
  *[_type == "contributor" && status == "active"] | order(displayOrder asc, name asc) {
    name,
    "slug": slug.current,
    "photoUrl": photo.asset->url,
    title,
    company,
    shortBio,
    credentials,
    "categoryNames": categories[]->title,
    location,
    activeSince,
    linkedin
  }
`

async function getContributors(): Promise<ContributorPublic[]> {
  const result = await client.fetch<ContributorPublic[]>(CONTRIBUTORS_QUERY)
  return result ?? []
}

export default async function AboutPage() {
  const contributors = await getContributors()

  // JSON-LD Organization schema with contributor members (AC-6, E-E-A-T)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Maple Insight Canada',
    url: 'https://mapleinsight.ca',
    logo: 'https://mapleinsight.ca/brand-mark.svg',
    description:
      'Maple Insight provides financial planning tools and guides for newcomers to Canada, reviewed by qualified Canadian professionals.',
    sameAs: [
      'https://www.reddit.com/r/MapleInsight',
      'https://www.youtube.com/@MapleInsight',
      'https://www.linkedin.com/company/maple-insight',
    ],
    member: contributors.map((c) => ({
      '@type': 'Person',
      name: c.name,
      jobTitle: c.title,
      ...(c.company ? { worksFor: { '@type': 'Organization', name: c.company } } : {}),
      ...(c.linkedin ? { sameAs: c.linkedin } : {}),
    })),
  }

  return (
    <>
      {/* JSON-LD — AC-6 */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Section 1 — Hero */}
      <AboutHero />

      {/* Section 2 — Why We Exist */}
      <MissionStory />

      {/* Section 3 — Reviewed by Experts (hidden when no active contributors — AC-2, AC-3) */}
      <ContributorsSection contributors={contributors} />

      {/* Section 4 — How We Build Our Estimates (AC-4) */}
      <MethodologySection />

      {/* Section 5 — Trust Pillars (forest-green background) */}
      <TrustPillars />

      {/* Section 6 — Community */}
      <CommunitySection />

      {/* Section 7 — CTA → /settlement-planner (AC-10) */}
      <AboutCTA />
    </>
  )
}
