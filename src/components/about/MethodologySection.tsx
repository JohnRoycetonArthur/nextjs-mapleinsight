const C = {
  forest: '#1B4F4A',
  blue: '#2563EB',
  gray: '#6B7280',
  border: '#E5E7EB',
  text: '#374151',
  white: '#FFFFFF',
};
const serif = "var(--font-dm-serif, 'DM Serif Display', Georgia, serif)";

const METHODOLOGY = [
  {
    icon: '🏠',
    title: 'How we source rent data',
    desc: 'We pull from the CMHC Rental Market Survey, refreshed quarterly. City-specific 1BR and 2BR averages — not national medians that hide local realities.',
  },
  {
    icon: '🧾',
    title: 'How we model taxes',
    desc: 'Federal and provincial 2025 brackets, applied to your projected income with newcomer-specific assumptions (partial-year residency, first-time credits).',
  },
  {
    icon: '📊',
    title: 'How we estimate settlement costs',
    desc: 'Upfront costs (immigration fees, deposits, flights) plus 6 months of monthly minimums plus an IRCC proof-of-funds floor. The higher number wins.',
  },
];

export function MethodologySection() {
  return (
    <section className="px-4 py-12 md:px-6 md:py-[72px]">
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div
            className="mb-3 text-xs font-bold uppercase tracking-widest"
            style={{ color: C.blue }}
          >
            Transparency
          </div>
          <h2
            className="mb-4 text-[28px] leading-[1.2] md:text-[38px]"
            style={{ fontFamily: serif, color: C.forest, margin: '0 0 14px' }}
          >
            How we build our estimates
          </h2>
          <p
            className="mx-auto max-w-[560px] text-[15px] leading-relaxed"
            style={{ color: C.gray }}
          >
            Every number on Maple Insight comes from a citable source. Here&apos;s exactly where the data comes from.
          </p>
        </div>

        {/* Methodology cards — AC-4 */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {METHODOLOGY.map((m, i) => (
            <div key={i} style={{
              background: C.white,
              border: `1px solid ${C.border}`,
              borderRadius: 14,
              padding: '26px 22px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            }}>
              <div style={{ fontSize: 28, marginBottom: 14 }}>{m.icon}</div>
              <h3 style={{ fontFamily: serif, fontSize: 18, color: C.forest, margin: '0 0 10px', lineHeight: 1.3 }}>
                {m.title}
              </h3>
              <p style={{ fontSize: 13.5, color: C.text, lineHeight: 1.65, margin: 0 }}>
                {m.desc}
              </p>
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: 26 }}>
          <a href="#" style={{
            fontSize: 14, fontWeight: 600, color: C.blue, textDecoration: 'none',
            display: 'inline-flex', alignItems: 'center', gap: 6,
          }}>
            Read the full methodology →
          </a>
        </div>
      </div>
    </section>
  );
}
