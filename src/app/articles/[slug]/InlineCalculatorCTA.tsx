import Link from 'next/link'

interface Props {
  calculatorSlug: string
  title: string
  description?: string
}

function CalculatorIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#2563EB"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <line x1="8" y1="6" x2="16" y2="6" />
      <line x1="8" y1="10" x2="10" y2="10" />
      <line x1="12" y1="10" x2="14" y2="10" />
      <line x1="16" y1="10" x2="16" y2="10" />
      <line x1="8" y1="14" x2="10" y2="14" />
      <line x1="12" y1="14" x2="14" y2="14" />
      <line x1="16" y1="14" x2="16" y2="14" />
      <line x1="8" y1="18" x2="10" y2="18" />
      <line x1="12" y1="18" x2="16" y2="18" />
    </svg>
  )
}

export function InlineCalculatorCTA({ calculatorSlug, title, description }: Props) {
  return (
    <div
      style={{
        background: '#EFF6FF',
        border: '1.5px solid rgba(37, 99, 235, 0.13)',
        borderRadius: '10px',
        padding: '16px 20px',
        margin: '24px 0',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: '16px',
        flexWrap: 'wrap',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', flex: 1, minWidth: 0 }}>
        <CalculatorIcon />
        <div>
          <p
            style={{
              fontFamily: "'DM Sans', Helvetica, sans-serif",
              fontSize: '14px',
              fontWeight: 700,
              color: '#1E3A8A',
              margin: '0 0 2px',
            }}
          >
            {title}
          </p>
          {description && (
            <p
              style={{
                fontFamily: "'DM Sans', Helvetica, sans-serif",
                fontSize: '13px',
                color: '#3B82F6',
                margin: 0,
                lineHeight: 1.4,
              }}
            >
              {description}
            </p>
          )}
        </div>
      </div>
      <Link
        href={`/tools/${calculatorSlug}`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          background: '#2563EB',
          color: '#FFFFFF',
          fontFamily: "'DM Sans', Helvetica, sans-serif",
          fontSize: '12px',
          fontWeight: 700,
          padding: '6px 14px',
          borderRadius: '6px',
          textDecoration: 'none',
          whiteSpace: 'nowrap',
          flexShrink: 0,
        }}
      >
        Try it →
      </Link>
    </div>
  )
}
