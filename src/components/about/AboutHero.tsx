const C = {
  forest: '#1B4F4A',
  accent: '#1B7A4A',
  gray: '#6B7280',
};
const serif = "var(--font-dm-serif, 'DM Serif Display', Georgia, serif)";

function ShieldIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <polyline points="9 12 11 14 15 10" />
    </svg>
  );
}

export function AboutHero() {
  return (
    <section
      className="px-4 py-14 text-center md:px-6 md:py-[88px]"
      style={{ background: 'linear-gradient(180deg, #FFFFFF 0%, #FAFBFC 100%)' }}
    >
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <div
          className="mb-6 inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wide"
          style={{ background: `${C.accent}10`, color: C.accent, letterSpacing: 0.3 }}
        >
          <ShieldIcon />
          Trust &amp; Methodology
        </div>
        <h1
          className="mb-6 text-[34px] leading-[1.1] md:text-[52px]"
          style={{ fontFamily: serif, color: C.forest, margin: '0 0 22px' }}
        >
          Financial clarity for newcomers to Canada.
        </h1>
        <p
          className="mx-auto max-w-[600px] text-base leading-relaxed md:text-[19px]"
          style={{ color: C.gray }}
        >
          Built specifically for people moving to Canada. Reviewed by accredited Canadian professionals. Powered by real data — never guesses.
        </p>
      </div>
    </section>
  );
}
