import Link from 'next/link'

const C = {
  forest: '#1B4F4A',
  gold: '#B8860B',
  red: '#C41E3A',
  accent: '#1B7A4A',
  text: '#374151',
  gray: '#6B7280',
  cream: '#FDF6E3',
  white: '#FFFFFF',
};
const serif = "var(--font-dm-serif, 'DM Serif Display', Georgia, serif)";
const font = "var(--font-dm-sans, 'DM Sans', Helvetica, sans-serif)";

function ArrowRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 8 }} aria-hidden="true">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

function CheckMark() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

const REASSURANCES = ['No account needed', '100% free', 'Data stays local'];

export function AboutCTA() {
  return (
    <section className="px-4 py-14 text-center md:px-6 md:py-24">
      <div style={{
        maxWidth: 720, margin: '0 auto',
        background: C.cream,
        border: `1px solid ${C.gold}25`,
        borderRadius: 20,
        padding: '56px 48px',
      }} className="!px-6 !py-10 md:!px-12 md:!py-14">
        <h2
          className="mb-4 text-[26px] leading-[1.2] md:text-[34px]"
          style={{ fontFamily: serif, color: C.forest, margin: '0 0 14px' }}
        >
          Ready to plan your move?
        </h2>
        <p
          className="mx-auto mb-7 max-w-[480px] text-[15px] leading-relaxed"
          style={{ color: C.text }}
        >
          Get your personalized settlement number in 8 minutes. Free, no signup, your data stays on your device.
        </p>
        {/* AC-10: routes to /settlement-planner */}
        <Link
          href="/settlement-planner/plan"
          style={{
            background: C.red,
            color: C.white,
            fontWeight: 700,
            fontSize: 16,
            padding: '16px 40px',
            borderRadius: 12,
            fontFamily: font,
            display: 'inline-flex',
            alignItems: 'center',
            textDecoration: 'none',
            boxShadow: `0 4px 14px ${C.red}44`,
          }}
        >
          Try the Settlement Planner <ArrowRight />
        </Link>
        <div className="mt-5 flex flex-wrap justify-center gap-5">
          {REASSURANCES.map((t) => (
            <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: C.gray, fontWeight: 500 }}>
              <CheckMark /> {t}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
