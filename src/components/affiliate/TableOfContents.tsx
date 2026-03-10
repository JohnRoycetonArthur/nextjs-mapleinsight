import { ArticleSection } from "@/app/articles/[slug]/ArticleContent";

interface TableOfContentsProps {
  sections: ArticleSection[];
  activeSection: string;
}

export function TableOfContents({ sections, activeSection }: TableOfContentsProps) {
  return (
    <div
      style={{
        position: "sticky",
        top: 88,
        width: 200,
        fontFamily: "var(--font-dm-sans, 'DM Sans', Helvetica, sans-serif)",
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: 1,
          color: "#9CA3AF",
          marginBottom: 12,
        }}
      >
        On this page
      </div>
      {sections.map((s) => (
        <a
          key={s.id}
          href={`#${s.id}`}
          onClick={(e) => {
            e.preventDefault();
            document.getElementById(s.id)?.scrollIntoView({ behavior: "smooth" });
          }}
          style={{
            display: "block",
            fontSize: 13,
            lineHeight: 1.4,
            padding: "6px 0 6px 14px",
            borderLeft: `2px solid ${activeSection === s.id ? "#1B7A4A" : "transparent"}`,
            color: activeSection === s.id ? "#1B7A4A" : "#6B7280",
            fontWeight: activeSection === s.id ? 600 : 400,
            textDecoration: "none",
            transition: "all 0.2s",
          }}
        >
          {s.title}
        </a>
      ))}
    </div>
  );
}
