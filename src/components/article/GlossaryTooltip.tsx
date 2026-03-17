'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

interface Props {
  term:       string;
  definition: string;
  slug:       string;
  children:   React.ReactNode;
}

export function GlossaryTooltip({ term, definition, slug, children }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  // Dismiss on outside click / tap (mobile AC-3)
  useEffect(() => {
    if (!open) return;
    const dismiss = (e: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', dismiss);
    document.addEventListener('touchstart', dismiss);
    return () => {
      document.removeEventListener('mousedown', dismiss);
      document.removeEventListener('touchstart', dismiss);
    };
  }, [open]);

  return (
    <span ref={ref} style={{ position: 'relative', display: 'inline' }}>
      {/* Annotated term — dotted underline (AC-1) */}
      <span
        tabIndex={0}
        role="button"
        aria-label={`${term}: ${definition}`}
        aria-expanded={open}
        style={{
          cursor:       'help',
          borderBottom: '1px dotted #1B4F4A',
          color:        'inherit',
          textDecoration: 'none',
        }}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen((v) => !v); } }}
      >
        {children}
      </span>

      {/* Tooltip popover (AC-2, AC-5) */}
      {open && (
        <span
          role="tooltip"
          style={{
            position:      'absolute',
            bottom:        'calc(100% + 6px)',
            left:          '50%',
            transform:     'translateX(-50%)',
            // AC-5: max 320px, doesn't overflow narrow screens
            width:         'min(320px, calc(100vw - 32px))',
            background:    '#fff',
            border:        '1px solid #E5E7EB',
            borderTop:     '3px solid #1B4F4A',
            borderRadius:  8,
            boxShadow:     '0 4px 12px rgba(0,0,0,0.08)',
            padding:       '12px 14px',
            zIndex:        50,
            pointerEvents: 'auto',
            fontFamily:    "var(--font-dm-sans, 'DM Sans', sans-serif)",
          }}
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Term name — DM Sans 13px 600 (AC-5) */}
          <div style={{ fontSize: 13, fontWeight: 600, color: '#1B4F4A', marginBottom: 5 }}>
            {term}
          </div>

          {/* Definition — DM Sans 13px 400, multi-line (AC-5) */}
          <p style={{
            fontSize:   13,
            fontWeight: 400,
            color:      '#374151',
            lineHeight: 1.55,
            margin:     '0 0 8px',
          }}>
            {definition}
          </p>

          {/* Glossary link (AC-4) */}
          <Link
            href={`/glossary#${slug}`}
            style={{
              fontSize:       11,
              fontWeight:     600,
              color:          '#1B7A4A',
              textDecoration: 'none',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            View in glossary →
          </Link>
        </span>
      )}
    </span>
  );
}
