interface Props {
  title: string
  body: string
}

export function ExampleScenario({ title, body }: Props) {
  return (
    <aside
      style={{
        background: '#FDF6E3',
        borderLeft: '4px solid #B8860B',
        borderRadius: '0 10px 10px 0',
        padding: '14px 18px',
        margin: '24px 0',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          marginBottom: '8px',
        }}
      >
        <span aria-hidden="true" style={{ fontSize: '15px' }}>
          💡
        </span>
        <span
          style={{
            fontFamily: "'DM Sans', Helvetica, sans-serif",
            fontSize: '10px',
            fontWeight: 700,
            color: '#5C4B07',
            textTransform: 'uppercase',
            letterSpacing: '0.8px',
          }}
        >
          Example · {title}
        </span>
      </div>
      <p
        style={{
          fontFamily: "'DM Sans', Helvetica, sans-serif",
          fontSize: '14px',
          color: '#5C4B07',
          lineHeight: 1.55,
          margin: 0,
          whiteSpace: 'pre-line',
        }}
      >
        {body}
      </p>
    </aside>
  )
}
