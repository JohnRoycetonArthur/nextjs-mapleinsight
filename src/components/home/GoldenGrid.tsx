// GoldenGrid — decorative golden checkerboard SVG overlay (US-1.4)
// Positioned absolute, inset 0, pointer-events none.
// Pattern: 48×48px tile with alternating 24×24px cells filled rgba(184,134,11,0.022)
// Grid lines at rgba(184,134,11,0.035), 0.5px stroke.

export function GoldenGrid() {
  return (
    <svg
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
      }}
    >
      <defs>
        <pattern
          id="golden-grid"
          x="0"
          y="0"
          width="48"
          height="48"
          patternUnits="userSpaceOnUse"
        >
          {/* Alternating checkerboard cells */}
          <rect x="0" y="0" width="24" height="24" fill="rgba(184,134,11,0.022)" />
          <rect x="24" y="24" width="24" height="24" fill="rgba(184,134,11,0.022)" />
          {/* Vertical grid lines */}
          <line x1="24" y1="0" x2="24" y2="48" stroke="rgba(184,134,11,0.035)" strokeWidth="0.5" />
          <line x1="48" y1="0" x2="48" y2="48" stroke="rgba(184,134,11,0.035)" strokeWidth="0.5" />
          {/* Horizontal grid lines */}
          <line x1="0" y1="24" x2="48" y2="24" stroke="rgba(184,134,11,0.035)" strokeWidth="0.5" />
          <line x1="0" y1="48" x2="48" y2="48" stroke="rgba(184,134,11,0.035)" strokeWidth="0.5" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#golden-grid)" />
    </svg>
  );
}
