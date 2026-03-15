'use client';

import { useState, type ReactNode } from 'react';

interface PanelProps {
  title:        string;
  icon:         string;
  color:        string;
  badge?:       ReactNode;
  children:     ReactNode;
  defaultOpen?: boolean;
}

export function Panel({ title, icon, color, badge, children, defaultOpen = true }: PanelProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div style={{
      background: '#fff',
      borderRadius: 16,
      border: `1px solid ${color}18`,
      boxShadow: `0 1px 3px rgba(0,0,0,0.03), 0 4px 16px ${color}06`,
      marginBottom: 16,
      overflow: 'hidden',
    }}>
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px 24px',
          border: 'none',
          background: open ? `${color}06` : 'transparent',
          cursor: 'pointer',
          transition: 'background 0.2s',
          fontFamily: "'DM Sans', Helvetica, sans-serif",
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 22 }} aria-hidden="true">{icon}</span>
          <span style={{
            fontFamily: "'DM Serif Display', Georgia, serif",
            fontSize: 19,
            fontWeight: 700,
            color: '#1B4F4A',
          }}>
            {title}
          </span>
          {badge}
        </div>
        <svg
          width="20" height="20" viewBox="0 0 24 24"
          fill="none" stroke="#6B7280" strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s', flexShrink: 0 }}
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && (
        <div style={{ padding: '0 24px 24px' }}>
          {children}
        </div>
      )}
    </div>
  );
}
