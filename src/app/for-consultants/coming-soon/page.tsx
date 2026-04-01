import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRightAlt, Groups } from '@material-symbols-svg/react'

export const metadata: Metadata = {
  title: 'Consultant Tools Coming Soon | Maple Insight',
  description: 'A branded suite of consultant tools is on the way from Maple Insight.',
}

const serif = "var(--font-dm-serif, 'DM Serif Display', Georgia, serif)"

export default function ConsultantToolsComingSoonPage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(165deg, #0F3D3A 0%, #1B4F4A 48%, #1B7A4A 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.05,
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.55) 1px, transparent 0)',
          backgroundSize: '28px 28px',
        }}
      />

      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: '-12%',
          right: '-8%',
          width: 420,
          height: 420,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(125,211,168,0.18), transparent 70%)',
          filter: 'blur(44px)',
        }}
      />

      <section
        style={{
          position: 'relative',
          zIndex: 1,
          maxWidth: 880,
          margin: '0 auto',
          padding: '110px 24px 88px',
        }}
      >
        <div
          style={{
            maxWidth: 720,
            borderRadius: 28,
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.12)',
            backdropFilter: 'blur(14px)',
            boxShadow: '0 28px 80px rgba(0,0,0,0.16)',
            padding: '40px 32px',
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '7px 14px',
              borderRadius: 999,
              background: 'rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.82)',
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: 0.4,
              textTransform: 'uppercase',
              marginBottom: 18,
            }}
          >
            <Groups size={15} color="rgba(255,255,255,0.85)" />
            Coming Soon
          </div>

          <h1
            style={{
              fontFamily: serif,
              fontSize: 'clamp(34px, 6vw, 58px)',
              lineHeight: 1.02,
              letterSpacing: -1,
              color: '#FFFFFF',
              margin: '0 0 16px',
            }}
          >
            Coming Soon
          </h1>

          <p
            style={{
              fontSize: 18,
              lineHeight: 1.75,
              color: 'rgba(255,255,255,0.72)',
              maxWidth: 620,
              margin: '0 0 26px',
            }}
          >
            We&apos;re building a professional toolkit for immigration consultants, with branded client planning flows,
            consultant-ready reports, and workflow tools designed to save time while improving client clarity.
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 12,
              marginBottom: 30,
            }}
          >
            {[
              'Branded client intake links',
              'Consultant-facing report views',
              'Scenario planning and follow-up tools',
            ].map((item) => (
              <div
                key={item}
                style={{
                  borderRadius: 16,
                  padding: '14px 16px',
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'rgba(255,255,255,0.86)',
                  fontSize: 14,
                  lineHeight: 1.5,
                }}
              >
                {item}
              </div>
            ))}
          </div>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <Link
              href="/#for-consultants"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '14px 22px',
                borderRadius: 12,
                background: '#FFFFFF',
                color: '#1B4F4A',
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              Back to Consultant Section <ArrowRightAlt size={16} color="#1B4F4A" />
            </Link>

            <Link
              href="/settlement-planner/plan"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '14px 22px',
                borderRadius: 12,
                background: 'transparent',
                color: '#FFFFFF',
                border: '1px solid rgba(255,255,255,0.22)',
                textDecoration: 'none',
                fontWeight: 700,
              }}
            >
              Explore the Planner <ArrowRightAlt size={16} color="#FFFFFF" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
