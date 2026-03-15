import { C, F } from './tokens';

export function SimulatorHero() {
  return (
    <header style={{
      background: `linear-gradient(165deg, ${C.darkGreen} 0%, ${C.midGreen} 40%, ${C.green} 100%)`,
      padding: 'clamp(32px, 6vw, 48px) 24px clamp(28px, 5vw, 44px)',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Subtle dot pattern overlay */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute', inset: 0, opacity: 0.04,
          backgroundImage:
            'radial-gradient(circle at 20% 50%, #fff 1px, transparent 1px), radial-gradient(circle at 80% 20%, #fff 1px, transparent 1px)',
          backgroundSize: '60px 60px, 40px 40px',
        }}
      />

      <div style={{
        maxWidth: 680, margin: '0 auto', textAlign: 'center',
        position: 'relative', zIndex: 1,
      }}>
        {/* Pill badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: 'rgba(255,255,255,0.12)', borderRadius: 20,
          padding: '6px 16px', marginBottom: 16,
          backdropFilter: 'blur(8px)',
        }}>
          <span aria-hidden="true" style={{ fontSize: 14 }}>🧮</span>
          <span style={{
            fontSize: 12, color: 'rgba(255,255,255,0.85)', fontWeight: 600,
            textTransform: 'uppercase', letterSpacing: 1, fontFamily: F.body,
          }}>
            Financial Simulator
          </span>
        </div>

        {/* Headline */}
        <h1 style={{
          fontFamily: F.heading,
          fontSize: 'clamp(26px, 5vw, 40px)',
          fontWeight: 700, color: '#fff', margin: '0 0 10px',
          lineHeight: 1.15, letterSpacing: '-0.5px',
        }}>
          Plan Your Financial Life in{' '}
          <span style={{ color: C.heroAccent }}>Canada</span>
        </h1>

        {/* Subtitle */}
        <p style={{
          fontFamily: F.body,
          fontSize: 'clamp(14px, 2.5vw, 17px)',
          lineHeight: 1.7, color: 'rgba(255,255,255,0.75)',
          margin: '0 auto', maxWidth: 500,
        }}>
          Get a personalized estimate of your income, costs, and next steps — powered by official Canadian data.
        </p>
      </div>
    </header>
  );
}
