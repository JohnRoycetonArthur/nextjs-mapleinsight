'use client';

interface Props {
  onConfirm: () => void;
  onCancel:  () => void;
}

export function StartOverDialog({ onConfirm, onCancel }: Props) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(15,61,58,0.5)',
        backdropFilter: 'blur(4px)',
        zIndex: 200,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="startover-dialog-title"
        style={{
          background: '#fff', borderRadius: 16,
          padding: '32px 28px', maxWidth: 400, width: '100%',
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
        }}
      >
        {/* Icon */}
        <div
          aria-hidden="true"
          style={{
            width: 52, height: 52, borderRadius: 14,
            background: '#FDF6E3',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24, margin: '0 auto 16px',
          }}
        >
          🔄
        </div>

        <h3
          id="startover-dialog-title"
          style={{
            fontFamily: "var(--font-dm-serif, 'DM Serif Display', serif)",
            fontSize: 20, fontWeight: 700, color: '#1B4F4A',
            margin: '0 0 8px', textAlign: 'center',
          }}
        >
          Start a new simulation?
        </h3>

        <p
          style={{
            fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)",
            fontSize: 14, color: '#6B7280',
            lineHeight: 1.65, margin: '0 0 24px', textAlign: 'center',
          }}
        >
          Any tasks you&apos;ve checked off in your roadmap and your saved financial
          report will be cleared. If you&apos;d like to keep your progress, print or
          save your results before continuing.
        </p>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1, padding: '11px 16px', borderRadius: 10,
              border: '1px solid #E5E7EB', background: '#fff',
              fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)",
              fontSize: 14, fontWeight: 600, color: '#374151',
              cursor: 'pointer', transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#F9FAFB'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; }}
          >
            Keep my results
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 1, padding: '11px 16px', borderRadius: 10,
              border: 'none', background: '#C41E3A',
              fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)",
              fontSize: 14, fontWeight: 700, color: '#fff',
              cursor: 'pointer', transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#A3172E'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#C41E3A'; }}
          >
            Yes, start over
          </button>
        </div>
      </div>
    </div>
  );
}
