'use client';

import { C, F } from '../tokens';
import { MIGRATION_STAGES, type MigrationStage } from '../wizardTypes';

const CheckCircle = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

interface Props {
  value:    MigrationStage | null;
  onChange: (stage: MigrationStage) => void;
  error?:   string;
}

export function WelcomeStep({ value, onChange, error }: Props) {
  return (
    <div>
      <h2 style={{ fontFamily: F.heading, fontSize: 24, color: C.forest, margin: '0 0 8px', fontWeight: 700 }}>
        What stage are you at?
      </h2>
      <p style={{ fontFamily: F.body, fontSize: 15, color: C.gray, margin: '0 0 28px', lineHeight: 1.6 }}>
        This helps us tailor your financial simulation to your current situation.
      </p>

      <div
        role="radiogroup"
        aria-label="Migration stage"
        aria-required="true"
        style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
      >
        {MIGRATION_STAGES.map((stage) => {
          const selected = value === stage.id;
          return (
            <button
              key={stage.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(stage.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 16,
                padding: '18px 20px', borderRadius: 14,
                border: `2px solid ${selected ? C.green : C.border}`,
                background: selected ? C.selectedBg : C.white,
                cursor: 'pointer', textAlign: 'left',
                transition: 'border-color 0.2s, background 0.2s',
                fontFamily: F.body, width: '100%',
              }}
            >
              <span aria-hidden="true" style={{ fontSize: 28, flexShrink: 0 }}>{stage.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontFamily: F.heading, fontSize: 17, fontWeight: 700,
                  color: selected ? C.green : C.forest, marginBottom: 2,
                }}>
                  {stage.label}
                </div>
                <div style={{ fontFamily: F.body, fontSize: 13, color: C.gray, lineHeight: 1.4 }}>
                  {stage.description}
                </div>
              </div>
              {selected && <CheckCircle />}
            </button>
          );
        })}
      </div>

      {error && (
        <p role="alert" style={{ fontFamily: F.body, fontSize: 13, color: '#DC2626', marginTop: 12 }}>
          {error}
        </p>
      )}

      {/* What we calculate — brief overview */}
      <div style={{
        marginTop: 24, padding: '14px 16px', borderRadius: 12,
        background: C.lightGray,
        fontFamily: F.body, fontSize: 13, color: C.gray, lineHeight: 1.6,
      }}>
        <strong style={{ color: C.forest }}>What this simulator estimates:</strong> potential salary range,
        federal &amp; provincial taxes, CPP/EI deductions, cost of living, and housing affordability — all
        based on official Canadian data.
      </div>
    </div>
  );
}
