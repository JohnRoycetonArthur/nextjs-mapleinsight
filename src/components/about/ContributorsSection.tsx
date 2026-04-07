import type { ContributorPublic } from '@/lib/types/contributor'
import { ContributorCard } from './ContributorCard'

const C = {
  forest: '#1B4F4A',
  accent: '#1B7A4A',
  blue: '#2563EB',
  border: '#E5E7EB',
  text: '#374151',
  white: '#FFFFFF',
};
const serif = "var(--font-dm-serif, 'DM Serif Display', Georgia, serif)";

type Props = { contributors: ContributorPublic[] }

export function ContributorsSection({ contributors }: Props) {
  if (contributors.length === 0) return null;

  return (
    <section style={{
      background: C.white,
      borderTop: `1px solid ${C.border}`,
      borderBottom: `1px solid ${C.border}`,
    }} className="px-4 py-12 md:px-6 md:py-[72px]">
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div
            className="mb-3 text-xs font-bold uppercase tracking-widest"
            style={{ color: C.accent }}
          >
            Authority &amp; accountability
          </div>
          <h2
            className="mb-5 text-[28px] leading-[1.2] md:text-[38px]"
            style={{ fontFamily: serif, color: C.forest, margin: '0 0 18px' }}
          >
            Reviewed by experts
          </h2>
          {/* Mandatory trust line — AC-3 */}
          <p style={{
            fontSize: 15, color: C.text, lineHeight: 1.7,
            maxWidth: 640, margin: '0 auto',
            background: `${C.accent}08`,
            border: `1px solid ${C.accent}20`,
            borderRadius: 12,
            padding: '16px 22px',
          }}>
            <strong style={{ color: C.forest }}>
              All financial and tax-related content on Maple Insight is reviewed by qualified professionals
            </strong>{' '}
            to ensure accuracy for newcomers to Canada.
          </p>
        </div>

        {/* Contributor grid */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {contributors.map((c) => (
            <ContributorCard key={c.slug} contributor={c} />
          ))}
        </div>

        {/* Reviewer CTA */}
        <div style={{ textAlign: 'center', marginTop: 28, fontSize: 13, color: '#9CA3AF' }}>
          Want to contribute as a reviewer?{' '}
          <a href="/contact" style={{ color: C.blue, fontWeight: 600, textDecoration: 'none' }}>
            Get in touch →
          </a>
        </div>
      </div>
    </section>
  );
}
