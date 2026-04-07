const C = {
  forest: '#1B4F4A',
  red: '#C41E3A',
  text: '#374151',
};
const serif = "var(--font-dm-serif, 'DM Serif Display', Georgia, serif)";

export function MissionStory() {
  return (
    <section className="px-4 py-10 md:px-6 md:py-16">
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        <div
          className="mb-3 text-xs font-bold uppercase tracking-widest"
          style={{ color: C.red }}
        >
          Our story
        </div>
        <h2
          className="mb-6 text-[26px] leading-[1.2] md:text-[34px]"
          style={{ fontFamily: serif, color: C.forest, margin: '0 0 22px' }}
        >
          Why Maple Insight exists
        </h2>
        <p className="mb-5 text-base leading-[1.75]" style={{ color: C.text }}>
          Moving to Canada is one of the biggest financial decisions a person ever makes — and the existing tools all assume you&apos;re already a resident with a SIN, a credit history, and a tax file. That leaves newcomers piecing together rent estimates, IRCC proof-of-funds tables, and tax brackets across a dozen tabs at midnight.
        </p>
        <p className="text-base leading-[1.75]" style={{ color: C.text }}>
          We built Maple Insight to be the tool we wish we&apos;d had: one place where you can model the actual cost of landing — rent, transit, taxes, immigration fees, the IRCC floor — and walk away with a number you can plan against. No fluff. No upsells. No advice we can&apos;t back up with a citation.
        </p>
      </div>
    </section>
  );
}
