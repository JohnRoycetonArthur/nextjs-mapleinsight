const C = {
  forest: '#1B4F4A',
  purple: '#9333EA',
  gray: '#6B7280',
  border: '#E5E7EB',
  white: '#FFFFFF',
};
const serif = "var(--font-dm-serif, 'DM Serif Display', Georgia, serif)";

const COMMUNITY = [
  {
    name: 'Reddit',
    handle: 'r/MapleInsight',
    desc: 'Newcomer Q&A, weekly cost-of-living threads',
    color: '#FF4500',
    href: '#',
  },
  {
    name: 'YouTube',
    handle: '@MapleInsight',
    desc: 'Walkthroughs and pathway explainers',
    color: '#FF0000',
    href: '#',
  },
  {
    name: 'LinkedIn',
    handle: 'Maple Insight',
    desc: 'Policy updates and methodology notes',
    color: '#0A66C2',
    href: '#',
  },
];

export function CommunitySection() {
  return (
    <section className="px-4 py-12 md:px-6 md:py-[72px]">
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div
            className="mb-3 text-xs font-bold uppercase tracking-widest"
            style={{ color: C.purple }}
          >
            Community
          </div>
          <h2
            className="mb-4 text-[28px] leading-[1.2] md:text-[38px]"
            style={{ fontFamily: serif, color: C.forest, margin: '0 0 14px' }}
          >
            Join our growing newcomer community
          </h2>
          <p
            className="mx-auto max-w-[520px] text-[15px] leading-relaxed"
            style={{ color: C.gray }}
          >
            Real questions. Real answers. From people who&apos;ve actually made the move.
          </p>
        </div>

        {/* Community cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {COMMUNITY.map((p) => (
            <a
              key={p.name}
              href={p.href}
              style={{
                background: C.white,
                border: `1px solid ${C.border}`,
                borderLeft: `4px solid ${p.color}`,
                borderRadius: 12,
                padding: '20px 22px',
                textDecoration: 'none',
                display: 'block',
                transition: 'transform 0.15s',
              }}
              className="hover:scale-[1.02]"
            >
              <div style={{ fontFamily: serif, fontSize: 17, color: C.forest, marginBottom: 4 }}>
                {p.name}
              </div>
              <div style={{ fontSize: 12.5, color: p.color, fontWeight: 700, marginBottom: 8 }}>
                {p.handle}
              </div>
              <div style={{ fontSize: 12.5, color: C.gray, lineHeight: 1.55 }}>
                {p.desc}
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
