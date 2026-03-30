import { STAGES } from "@/data/start-here-stages";
import { MapleLeaf } from "./MapleLeaf";

export function StartHereHero() {
  return (
    <header
      style={{
        background: "linear-gradient(165deg, #0F3D3A 0%, #1B5E58 40%, #1B7A4A 100%)",
        position: "relative",
        overflow: "hidden",
      }}
      className="px-5 py-12 md:px-6 md:py-[72px]"
    >
      {/* Subtle pattern overlay */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.04,
          backgroundImage: `radial-gradient(circle at 20% 50%, #fff 1px, transparent 1px), radial-gradient(circle at 80% 20%, #fff 1px, transparent 1px)`,
          backgroundSize: "60px 60px, 40px 40px",
        }}
      />

      <div
        style={{
          maxWidth: 720,
          margin: "0 auto",
          textAlign: "center",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Eyebrow badge */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            background: "rgba(255,255,255,0.12)",
            borderRadius: 20,
            padding: "6px 16px",
            marginBottom: 20,
            backdropFilter: "blur(8px)",
          }}
        >
          <MapleLeaf size={14} color="#FF6B6B" />
          <span
            style={{
              fontSize: 12,
              color: "rgba(255,255,255,0.85)",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: 1,
              fontFamily: "var(--font-dm-sans), Helvetica, sans-serif",
            }}
          >
            Your Financial Journey
          </span>
        </div>

        <h1
          style={{
            fontFamily: "var(--font-dm-serif), Georgia, serif",
            fontWeight: 700,
            color: "#fff",
            margin: "0 0 16px",
            lineHeight: 1.15,
            letterSpacing: -0.5,
          }}
          className="text-[32px] md:text-[48px]"
        >
          New to Canada?{" "}
          <span style={{ color: "#7DD3A8" }}>Start Here.</span>
        </h1>

        <p
          style={{
            lineHeight: 1.7,
            color: "rgba(255,255,255,0.8)",
            margin: "0 auto 28px",
            maxWidth: 540,
            fontFamily: "var(--font-dm-sans), Helvetica, sans-serif",
          }}
          className="text-base md:text-lg"
        >
          Your step-by-step guide to building a strong financial foundation in
          Canada. From opening your first bank account to buying a home — we&apos;ll
          walk you through it all.
        </p>

        {/* Stage preview chips */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            flexWrap: "wrap",
          }}
          className="gap-[10px] md:gap-4"
        >
          {STAGES.map((s) => (
            <div
              key={s.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                background: "rgba(255,255,255,0.1)",
                borderRadius: 8,
                padding: "8px 12px",
                backdropFilter: "blur(4px)",
              }}
            >
              <span aria-hidden="true">{s.icon}</span>
              <span
                style={{
                  fontSize: 12,
                  color: "rgba(255,255,255,0.9)",
                  fontWeight: 600,
                  fontFamily: "var(--font-dm-sans), Helvetica, sans-serif",
                }}
              >
                {s.title}
              </span>
            </div>
          ))}
        </div>
      </div>
    </header>
  );
}
