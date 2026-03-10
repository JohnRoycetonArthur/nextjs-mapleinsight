"use client";

interface ResetDialogProps {
  onConfirm: () => void;
  onCancel: () => void;
}

export function ResetDialog({ onConfirm, onCancel }: ResetDialogProps) {
  return (
    <div
      data-print-hide
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15,61,58,0.5)",
        backdropFilter: "blur(4px)",
        zIndex: 200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="reset-dialog-title"
        style={{
          background: "#fff",
          borderRadius: 16,
          padding: "32px 28px",
          maxWidth: 380,
          width: "100%",
          boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
        }}
      >
        {/* Warning icon */}
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: 14,
            background: "#FEF2F2",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 24,
            margin: "0 auto 16px",
          }}
          aria-hidden="true"
        >
          ⚠️
        </div>

        <h3
          id="reset-dialog-title"
          style={{
            fontFamily: "var(--font-dm-serif, 'DM Serif Display', serif)",
            fontSize: 20,
            fontWeight: 700,
            color: "#1B4F4A",
            margin: "0 0 8px",
            textAlign: "center",
          }}
        >
          Reset your checklist?
        </h3>
        <p
          style={{
            fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)",
            fontSize: 14,
            color: "#6B7280",
            lineHeight: 1.6,
            margin: "0 0 24px",
            textAlign: "center",
          }}
        >
          This will clear all your checked items. Your progress cannot be recovered.
        </p>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              padding: "11px 16px",
              borderRadius: 10,
              border: "1px solid #E5E7EB",
              background: "#fff",
              fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)",
              fontSize: 14,
              fontWeight: 600,
              color: "#374151",
              cursor: "pointer",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#F9FAFB"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "#fff"; }}
          >
            Keep progress
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 1,
              padding: "11px 16px",
              borderRadius: 10,
              border: "none",
              background: "#C41E3A",
              fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)",
              fontSize: 14,
              fontWeight: 700,
              color: "#fff",
              cursor: "pointer",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#A3172E"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "#C41E3A"; }}
          >
            Reset all
          </button>
        </div>
      </div>
    </div>
  );
}
