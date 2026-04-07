import type { ContributorPublic } from '@/lib/types/contributor'

const C = {
  forest: '#1B4F4A',
  accent: '#1B7A4A',
  gold: '#B8860B',
  blue: '#2563EB',
  gray: '#6B7280',
  border: '#E5E7EB',
  white: '#FFFFFF',
  text: '#374151',
  textLight: '#9CA3AF',
};
const serif = "var(--font-dm-serif, 'DM Serif Display', Georgia, serif)";

function CheckMark() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
function PinIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}
function CalIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}
function LinkedInIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.5 2h-17A1.5 1.5 0 002 3.5v17A1.5 1.5 0 003.5 22h17a1.5 1.5 0 001.5-1.5v-17A1.5 1.5 0 0020.5 2zM8 19H5v-9h3zM6.5 8.25A1.75 1.75 0 118.3 6.5a1.78 1.78 0 01-1.8 1.75zM19 19h-3v-4.74c0-1.42-.6-1.93-1.38-1.93A1.74 1.74 0 0013 14.19a.66.66 0 000 .14V19h-3v-9h2.9v1.3a3.11 3.11 0 012.7-1.4c1.55 0 3.36.86 3.36 3.66z" />
    </svg>
  );
}

/** Derive a consistent accent color index from initials so each card looks distinct */
function getAccentColor(name: string): string {
  const ACCENTS = [C.accent, C.gold, '#2563EB', '#9333EA'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return ACCENTS[Math.abs(hash) % ACCENTS.length];
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function formatYear(date: string | null): string | null {
  if (!date) return null;
  return date.slice(0, 4);
}

type Props = { contributor: ContributorPublic }

export function ContributorCard({ contributor: c }: Props) {
  const accent = getAccentColor(c.name);
  const initials = getInitials(c.name);
  const year = formatYear(c.activeSince);

  return (
    <div style={{
      background: C.white,
      border: `1px solid ${C.border}`,
      borderRadius: 16,
      padding: '26px 26px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Header: avatar + name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
        {c.photoUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={c.photoUrl}
            alt={c.name}
            width={56}
            height={56}
            style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
          />
        ) : (
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: `linear-gradient(135deg, ${accent} 0%, ${accent}CC 100%)`,
            color: C.white,
            fontFamily: serif,
            fontSize: 20,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            {initials}
          </div>
        )}
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontFamily: serif, fontSize: 18, color: C.forest, lineHeight: 1.2, marginBottom: 3 }}>
            {c.name}
          </div>
          <div style={{ fontSize: 12, fontWeight: 600, color: accent, lineHeight: 1.3 }}>
            {c.title}
          </div>
        </div>
      </div>

      {/* Company */}
      {c.company && (
        <div style={{ fontSize: 12, color: C.gray, marginBottom: 14, fontStyle: 'italic' }}>
          {c.company}
        </div>
      )}

      {/* Credentials checklist */}
      {c.credentials.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          {c.credentials.map((cr, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
              <div style={{ marginTop: 2, flexShrink: 0 }}>
                <CheckMark />
              </div>
              <span style={{ fontSize: 12.5, color: C.text, lineHeight: 1.5 }}>{cr}</span>
            </div>
          ))}
        </div>
      )}

      {/* Reviews categories */}
      {c.categoryNames.length > 0 && (
        <div style={{
          background: `${accent}08`,
          border: `1px solid ${accent}20`,
          borderRadius: 8,
          padding: '9px 12px',
          marginBottom: 14,
        }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: accent, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
            Reviews content on
          </div>
          <div style={{ fontSize: 12.5, color: C.text, fontWeight: 500 }}>
            {c.categoryNames.join(' · ')}
          </div>
        </div>
      )}

      {/* Footer: location, date, linkedin */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        paddingTop: 14, borderTop: `1px solid ${C.border}`, marginTop: 'auto',
        fontSize: 11, color: C.textLight,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {c.location && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <PinIcon /> {c.location}
            </span>
          )}
          {year && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <CalIcon /> Since {year}
            </span>
          )}
        </div>
        {c.linkedin && (
          <a
            href={c.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${c.name} on LinkedIn`}
            style={{ color: C.blue, display: 'flex', alignItems: 'center' }}
          >
            <LinkedInIcon />
          </a>
        )}
      </div>
    </div>
  );
}
