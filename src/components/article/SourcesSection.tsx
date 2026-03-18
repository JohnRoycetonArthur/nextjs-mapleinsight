export interface ArticleSource {
  _key: string;
  sourceName: string;
  documentTitle: string;
  url: string;
  accessedDate?: string | null;
}

interface Props {
  sources?: ArticleSource[] | null;
}

/** Extract clean domain from a URL: strips www. and path. */
function extractDomain(url: string): string {
  try {
    const host = new URL(url).hostname;
    return host.startsWith('www.') ? host.slice(4) : host;
  } catch {
    return url;
  }
}

/** Format "2026-03-18" → "March 18, 2026" */
function formatDate(iso: string): string {
  try {
    return new Date(iso + 'T12:00:00').toLocaleDateString('en-CA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
}

export function SourcesSection({ sources }: Props) {
  if (!sources || sources.length === 0) return null;

  return (
    <section
      style={{
        borderTop: '1px solid #E5E7EB',
        paddingTop: 28,
        marginTop: 40,
        marginBottom: 32,
      }}
    >
      <h2
        style={{
          fontFamily: "var(--font-dm-serif, 'DM Serif Display', Georgia, serif)",
          fontSize: 18,
          fontWeight: 700,
          color: '#1B4F4A',
          margin: '0 0 16px',
          lineHeight: 1.3,
        }}
      >
        Sources &amp; References
      </h2>

      <ol
        style={{
          margin: 0,
          paddingLeft: 20,
          fontFamily: "var(--font-dm-sans, 'DM Sans', Helvetica, sans-serif)",
          fontSize: 14,
          color: '#6B7280',
          lineHeight: 1.6,
        }}
      >
        {sources.map((s, i) => (
          <li key={s._key ?? i} style={{ marginBottom: 8 }}>
            <span style={{ color: '#374151' }}>{s.sourceName}.</span>{' '}
            <a
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: '#2563EB',
                textDecoration: 'underline',
                textUnderlineOffset: 2,
              }}
            >
              {s.documentTitle}
            </a>
            {'. '}
            <span style={{ color: '#9CA3AF' }}>
              {extractDomain(s.url)}
            </span>
            {s.accessedDate && (
              <span style={{ color: '#9CA3AF' }}>
                {'. '}Accessed {formatDate(s.accessedDate)}.
              </span>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
