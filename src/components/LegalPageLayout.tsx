interface LegalPageLayoutProps {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
}

export function LegalPageLayout({ title, lastUpdated, children }: LegalPageLayoutProps) {
  return (
    <main
      style={{
        maxWidth: 720,
        margin: "0 auto",
        padding: "48px 24px 80px",
        fontFamily: "var(--font-dm-sans, 'DM Sans', Helvetica, sans-serif)",
      }}
    >
      <h1
        style={{
          fontFamily: "var(--font-dm-serif, 'DM Serif Display', Georgia, serif)",
          fontSize: "clamp(28px, 5vw, 40px)",
          fontWeight: 700,
          color: "#1B4F4A",
          margin: "0 0 8px",
          lineHeight: 1.2,
        }}
      >
        {title}
      </h1>

      <p
        style={{
          fontSize: 13,
          color: "#6B7280",
          margin: "0 0 40px",
        }}
      >
        Last updated: {lastUpdated}
      </p>

      <div
        style={{
          fontSize: 16,
          lineHeight: 1.75,
          color: "#374151",
        }}
      >
        {children}
      </div>
    </main>
  );
}

export function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 36 }}>
      <h2
        style={{
          fontFamily: "var(--font-dm-serif, 'DM Serif Display', Georgia, serif)",
          fontSize: 22,
          fontWeight: 700,
          color: "#1B4F4A",
          margin: "0 0 12px",
          lineHeight: 1.3,
        }}
      >
        {title}
      </h2>
      <div>{children}</div>
    </section>
  );
}

export function LegalP({ children }: { children: React.ReactNode }) {
  return <p style={{ margin: "0 0 14px" }}>{children}</p>;
}

export function LegalUL({ children }: { children: React.ReactNode }) {
  return (
    <ul style={{ margin: "0 0 14px", paddingLeft: 24 }}>
      {children}
    </ul>
  );
}

export function LegalLI({ children }: { children: React.ReactNode }) {
  return <li style={{ marginBottom: 6 }}>{children}</li>;
}
