import type { ContributorPublic } from '@/lib/types/contributor'

const C = {
  forest: '#1B4F4A',
  accent: '#1B7A4A',
  border: '#E5E7EB',
  text: '#374151',
  gray: '#6B7280',
  textLight: '#9CA3AF',
  white: '#FFFFFF',
  blue: '#2563EB',
}
const serif = "var(--font-dm-serif, 'DM Serif Display', Georgia, serif)"

function ShieldIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <polyline points="9 12 11 14 15 10" />
    </svg>
  )
}

function LinkedInIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.5 2h-17A1.5 1.5 0 002 3.5v17A1.5 1.5 0 003.5 22h17a1.5 1.5 0 001.5-1.5v-17A1.5 1.5 0 0020.5 2zM8 19H5v-9h3zM6.5 8.25A1.75 1.75 0 118.3 6.5a1.78 1.78 0 01-1.8 1.75zM19 19h-3v-4.74c0-1.42-.6-1.93-1.38-1.93A1.74 1.74 0 0013 14.19a.66.66 0 000 .14V19h-3v-9h2.9v1.3a3.11 3.11 0 012.7-1.4c1.55 0 3.36.86 3.36 3.66z" />
    </svg>
  )
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function formatReviewDate(date: string): string {
  return new Date(date).toLocaleDateString('en-CA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

type Props = {
  contributor: ContributorPublic
  reviewDate?: string | null
  position?: 'top' | 'bottom'
  showBio?: boolean
}

export function ReviewedByBadge({
  contributor,
  reviewDate,
  position = 'top',
  showBio = false,
}: Props) {
  const initials = getInitials(contributor.name)
  const isBottom = position === 'bottom'

  return (
    <div
      style={{
        padding: '12px 16px',
        background: `${C.accent}06`,
        border: `1px solid ${C.accent}18`,
        borderRadius: 10,
        marginBottom: isBottom ? 0 : 24,
        marginTop: isBottom ? 32 : 0,
      }}
      role="note"
      aria-label={`Reviewed by ${contributor.name}`}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <ShieldIcon />
          <span style={{ fontSize: 11, fontWeight: 700, color: C.accent, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Reviewed by
          </span>
        </div>

        <div style={{ width: 1, height: 20, background: C.border, flexShrink: 0 }} aria-hidden="true" />

        {contributor.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={contributor.photoUrl}
            alt=""
            width={28}
            height={28}
            style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
          />
        ) : (
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${C.accent} 0%, ${C.accent}CC 100%)`,
              color: C.white,
              fontFamily: serif,
              fontSize: 11,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {initials}
          </div>
        )}

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.forest, lineHeight: 1.2 }}>
            {contributor.name}
          </div>
          <div style={{ fontSize: 11, color: C.gray, lineHeight: 1.3 }}>
            {contributor.title}
            {reviewDate && (
              <span style={{ color: C.textLight }}> | Reviewed {formatReviewDate(reviewDate)}</span>
            )}
          </div>
          {showBio && contributor.company && (
            <div style={{ fontSize: 11, color: C.textLight, lineHeight: 1.4, marginTop: 3 }}>
              {contributor.company}
            </div>
          )}
        </div>

        {contributor.linkedin && (
          <a
            href={contributor.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${contributor.name} on LinkedIn`}
            style={{ color: C.blue, display: 'flex', alignItems: 'center', flexShrink: 0 }}
          >
            <LinkedInIcon />
          </a>
        )}
      </div>

      {showBio && contributor.shortBio && (
        <p
          style={{
            margin: '12px 0 0',
            paddingTop: 12,
            borderTop: `1px solid ${C.border}`,
            fontSize: 13,
            lineHeight: 1.6,
            color: C.text,
          }}
        >
          {contributor.shortBio}
        </p>
      )}
    </div>
  )
}
