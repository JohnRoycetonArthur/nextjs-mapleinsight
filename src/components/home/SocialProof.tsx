const C = {
  forest: '#1B4F4A',
  gray: '#6B7280', border: '#E5E7EB', white: '#FFFFFF', bg: '#FAFBFC',
  lightGray: '#F3F4F6',
  textLight: '#9CA3AF',
};
const serif = "var(--font-dm-serif, 'DM Serif Display', Georgia, serif)";
const font = "var(--font-dm-sans, 'DM Sans', Helvetica, sans-serif)";

const STATS = [
  { value: '30+',  label: 'Expert guides',     icon: '📚' },
  { value: '$0',   label: 'Always free',        icon: '💰' },
  { value: '6',    label: 'Pathways covered',   icon: '🛂' },
  { value: '100%', label: 'Government data',    icon: '🇨🇦' },
];

const SOURCES = ['IRCC', 'CMHC', 'CRA', 'ESDC', 'Statistics Canada'];

export function SocialProof({ isMobile }: { isMobile: boolean }) {
  return (
    <section style={{ background: C.bg, padding: isMobile ? '40px 16px' : '56px 24px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: 12 }}>
          {STATS.map((stat) => (
            <div key={stat.label} style={{ padding: 20, borderRadius: 14, background: C.white, border: `1px solid ${C.border}`, textAlign: 'center' }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>{stat.icon}</div>
              <div style={{ fontFamily: serif, fontSize: 26, fontWeight: 700, color: C.forest }}>{stat.value}</div>
              <div style={{ fontFamily: font, fontSize: 12, color: C.gray, marginTop: 2 }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Data trust bar */}
        <div style={{
          marginTop: 20, padding: '14px 20px', borderRadius: 10,
          background: C.white, border: `1px solid ${C.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 8, flexWrap: 'wrap',
        }}>
          <span style={{ fontFamily: font, fontSize: 12, color: C.textLight }}>Data sourced from:</span>
          {SOURCES.map((src) => (
            <span key={src} style={{ fontFamily: font, fontSize: 11, fontWeight: 600, color: C.forest, background: '#E8F5EE', borderRadius: 4, padding: '3px 8px' }}>
              {src}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
