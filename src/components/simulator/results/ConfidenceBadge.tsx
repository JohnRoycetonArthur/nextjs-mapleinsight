'use client';

import { useState, useEffect, useRef } from 'react';

interface ConfidenceData {
  score:   number;
  tier:    'High' | 'Medium' | 'Low';
  signals: string[];
}

interface Props {
  confidence: ConfidenceData;
}

const BG: Record<string, string> = { High: '#1B7A4A', Medium: '#B8860B', Low: '#C41E3A' };

export function ConfidenceBadge({ confidence }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <span ref={ref} style={{ position: 'relative', display: 'inline-flex' }}>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        aria-expanded={open}
        aria-label={`${confidence.tier} confidence — click for details`}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          padding: '4px 12px', borderRadius: 20, border: 'none',
          background: BG[confidence.tier] ?? '#6B7280',
          color: '#fff', fontSize: 11, fontWeight: 700,
          cursor: 'pointer', letterSpacing: 0.3,
          fontFamily: "'DM Sans', Helvetica, sans-serif",
        }}
      >
        {confidence.tier} Confidence
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 10px)', left: 0,
          background: '#1B4F4A', color: '#fff',
          padding: '14px 16px', borderRadius: 12,
          fontSize: 12, lineHeight: 1.6,
          fontFamily: "'DM Sans', Helvetica, sans-serif",
          width: 280, boxShadow: '0 8px 32px rgba(0,0,0,0.2)', zIndex: 50,
        }}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>Data Sources & Signals</div>
          {confidence.signals.map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
              <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#7DD3A8', flexShrink: 0, display: 'inline-block' }} />
              <span>{s.replace(/_/g, ' ')}</span>
            </div>
          ))}
          <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.15)', fontSize: 11, opacity: 0.7 }}>
            Score: {(confidence.score * 100).toFixed(0)}%
          </div>
        </div>
      )}
    </span>
  );
}
