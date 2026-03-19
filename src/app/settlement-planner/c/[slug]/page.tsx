import { Metadata } from 'next'
import { createClient } from '@sanity/client'
import { apiVersion, dataset, projectId } from '@/sanity/env'
import { ConsultantLandingClient, type PublicConsultant } from './ConsultantLandingClient'

// CDN-enabled client for public reads
const publicClient = createClient({ projectId, dataset, apiVersion, useCdn: true })

// ─── Task 9: noindex metadata ─────────────────────────────────────────────────

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

// ─── Task 2: Sanity data fetch ────────────────────────────────────────────────

async function getConsultant(slug: string): Promise<PublicConsultant | null> {
  return publicClient.fetch<PublicConsultant | null>(
    `*[_type == "consultant" && slug.current == $slug && status == "active"][0] {
      "slug": slug.current,
      displayName,
      companyName,
      status,
      logo { asset -> { url } },
      theme
    }`,
    { slug },
  )
}

// ─── Task 8: Error state component ───────────────────────────────────────────

function ConsultantNotFound({ slug }: { slug: string }) {
  return (
    <div
      style={{
        minHeight:      '60vh',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        padding:        '48px 24px',
        background:     '#FAFBFC',
        fontFamily:     "var(--font-dm-sans, 'DM Sans', Helvetica, sans-serif)",
      }}
    >
      <div
        style={{
          maxWidth:     480,
          textAlign:    'center',
          background:   '#fff',
          borderRadius: 20,
          padding:      '48px 36px',
          border:       '1px solid #E5E7EB',
          boxShadow:    '0 4px 24px rgba(0,0,0,0.06)',
        }}
      >
        {/* Icon */}
        <div
          aria-hidden="true"
          style={{
            width:          64,
            height:         64,
            borderRadius:   16,
            background:     '#F3F4F6',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            fontSize:       30,
            margin:         '0 auto 20px',
          }}
        >
          🍁
        </div>

        <h1
          style={{
            fontFamily: "var(--font-dm-serif, 'DM Serif Display', Georgia, serif)",
            fontSize:   26,
            fontWeight: 700,
            color:      '#1B4F4A',
            margin:     '0 0 12px',
            lineHeight: 1.2,
          }}
        >
          Planner Link Not Found
        </h1>

        <p
          style={{
            fontSize:   15,
            color:      '#6B7280',
            lineHeight: 1.65,
            margin:     '0 0 28px',
          }}
        >
          The consultant link{' '}
          <code
            style={{
              background:   '#F3F4F6',
              borderRadius: 4,
              padding:      '2px 6px',
              fontSize:     13,
              color:        '#374151',
            }}
          >
            /c/{slug}
          </code>{' '}
          is not active or does not exist. Please check the link you received and try again.
        </p>

        <p style={{ fontSize: 13, color: '#9CA3AF', margin: 0, lineHeight: 1.6 }}>
          If you believe this is an error, contact the immigration consultant who shared this link with you.
        </p>
      </div>
    </div>
  )
}

// ─── Task 1: Page ─────────────────────────────────────────────────────────────

interface Props {
  params: { slug: string }
}

export default async function ConsultantLandingPage({ params }: Props) {
  const consultant = await getConsultant(params.slug)

  if (!consultant) {
    return <ConsultantNotFound slug={params.slug} />
  }

  return <ConsultantLandingClient consultant={consultant} />
}
