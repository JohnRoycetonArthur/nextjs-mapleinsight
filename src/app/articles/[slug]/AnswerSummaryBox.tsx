interface Props {
  summary: string
}

function CheckCircleIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#1B7A4A"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="9 12 11.5 14.5 15 9.5" />
    </svg>
  )
}

export function AnswerSummaryBox({ summary }: Props) {
  return (
    <div
      role="complementary"
      aria-label="Quick answer summary"
      style={{
        background: '#E8F5EE',
        borderLeft: '4px solid #1B7A4A',
        borderRadius: '0 12px 12px 0',
        padding: '16px 20px',
        marginBottom: '32px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '8px',
        }}
      >
        <CheckCircleIcon />
        <span
          style={{
            fontFamily: "'DM Sans', Helvetica, sans-serif",
            fontSize: '10px',
            fontWeight: 700,
            color: '#1B7A4A',
            textTransform: 'uppercase',
            letterSpacing: '0.8px',
          }}
        >
          Quick Answer
        </span>
      </div>
      <p
        style={{
          fontFamily: "'DM Sans', Helvetica, sans-serif",
          fontSize: '15px',
          color: '#1A3D2E',
          lineHeight: 1.6,
          margin: 0,
        }}
      >
        {summary}
      </p>
    </div>
  )
}
