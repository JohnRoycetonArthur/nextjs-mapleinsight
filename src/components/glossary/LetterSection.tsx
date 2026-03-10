import { GlossaryTerm } from "@/data/glossaryTerms";
import { TermCard } from "./TermCard";

interface LetterSectionProps {
  letter: string;
  terms: GlossaryTerm[];
}

export function LetterSection({ letter, terms }: LetterSectionProps) {
  return (
    <div id={`letter-${letter}`} style={{ scrollMarginTop: 80 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          padding: "12px 28px 10px",
          borderTop: "2px solid #1B7A4A18",
          background: "linear-gradient(to right, #E8F5EE44, transparent)",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-dm-serif, 'DM Serif Display', Georgia, serif)",
            fontSize: 32,
            fontWeight: 700,
            color: "#1B7A4A",
            lineHeight: 1,
            minWidth: 32,
            textAlign: "center",
          }}
        >
          {letter}
        </span>
        <span
          style={{
            fontFamily: "var(--font-dm-sans, 'DM Sans', Helvetica, sans-serif)",
            fontSize: 12,
            color: "#9CA3AF",
            fontWeight: 500,
            textTransform: "uppercase",
            letterSpacing: 0.5,
          }}
        >
          {terms.length} term{terms.length !== 1 ? "s" : ""}
        </span>
      </div>
      {terms.map((term) => (
        <TermCard key={term.id} term={term} />
      ))}
    </div>
  );
}
