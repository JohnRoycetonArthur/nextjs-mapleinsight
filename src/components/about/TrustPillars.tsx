const C = {
  forest: '#1B4F4A',
  white: '#FFFFFF',
};
const serif = "var(--font-dm-serif, 'DM Serif Display', Georgia, serif)";

const TRUST_PILLARS = [
  {
    num: '01',
    title: 'Built specifically for newcomers',
    desc: "Every calculator, article, and recommendation assumes you're new to Canada — no prior credit, no SIN, no Canadian tax history.",
  },
  {
    num: '02',
    title: 'Real cost data, not estimates',
    desc: 'We use CMHC for rent, IRCC for fees, and provincial transit authorities for transportation. Sources are cited on every result.',
  },
  {
    num: '03',
    title: 'Reviewed by qualified professionals',
    desc: 'Tax, immigration, and benefits content is reviewed by accredited Canadian professionals before publication.',
  },
  {
    num: '04',
    title: 'Personalized, not generic',
    desc: 'Your household size, pathway, city, and savings shape every recommendation. No one-size-fits-all advice.',
  },
  {
    num: '05',
    title: 'No upsells. No hidden agendas.',
    desc: "Free tools. Transparent affiliate disclosure. We don't sell your data and we never will.",
  },
];

export function TrustPillars() {
  return (
    <section
      className="px-4 py-12 md:px-6 md:py-[72px]"
      style={{ background: C.forest, color: C.white }}
    >
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 44 }}>
          <div
            className="mb-3 text-xs font-bold uppercase tracking-widest"
            style={{ color: '#FF6B6B' }}
          >
            Why trust us
          </div>
          <h2
            className="text-[28px] leading-[1.2] md:text-[38px]"
            style={{ fontFamily: serif, color: C.white, margin: '0 0 14px' }}
          >
            Five reasons newcomers trust Maple Insight
          </h2>
        </div>

        {/* Pillars grid */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {TRUST_PILLARS.map((p) => (
            <div key={p.num} style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 14,
              padding: '24px 24px',
              display: 'flex',
              gap: 18,
            }}>
              <div style={{
                fontFamily: serif, fontSize: 28, color: '#FF6B6B',
                flexShrink: 0, lineHeight: 1, opacity: 0.85,
              }}>
                {p.num}
              </div>
              <div>
                <h3 style={{ fontFamily: serif, fontSize: 18, color: C.white, margin: '0 0 8px', lineHeight: 1.3 }}>
                  {p.title}
                </h3>
                <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.7)', lineHeight: 1.65, margin: 0 }}>
                  {p.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
