'use client';

import { C, F } from '../tokens';
import { type HouseholdState, BEDROOM_OPTIONS } from '../wizardTypes';

// ── Tooltip ───────────────────────────────────────────────────────────────────

import { useState } from 'react';

const InfoIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);

function WhyWeAsk({ text }: { text: string }) {
  const [show, setShow] = useState(false);
  return (
    <span
      style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', marginLeft: 6, cursor: 'pointer' }}
      onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}
      onFocus={() => setShow(true)} onBlur={() => setShow(false)}
      tabIndex={0} role="button" aria-label="Why we ask this"
    >
      <InfoIcon />
      {show && (
        <div role="tooltip" style={{
          position: 'absolute', bottom: 'calc(100% + 8px)', left: '50%', transform: 'translateX(-50%)',
          background: C.forest, color: '#fff', padding: '10px 14px', borderRadius: 10,
          fontSize: 12, lineHeight: 1.5, fontFamily: F.body, width: 240,
          boxShadow: '0 4px 16px rgba(0,0,0,0.15)', zIndex: 10, pointerEvents: 'none',
        }}>
          {text}
          <div aria-hidden="true" style={{ position: 'absolute', bottom: -5, left: '50%', transform: 'translateX(-50%) rotate(45deg)', width: 10, height: 10, background: C.forest }} />
        </div>
      )}
    </span>
  );
}

// ── Stepper ───────────────────────────────────────────────────────────────────

function Stepper({
  label, value, onDecrement, onIncrement, min, max,
}: {
  label: string; value: number;
  onDecrement: () => void; onIncrement: () => void;
  min: number; max: number;
}) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{
        fontFamily: F.body, fontSize: 13, fontWeight: 600, color: C.forest,
        textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10,
      }}>
        {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <button
          type="button"
          aria-label={`Decrease ${label}`}
          onClick={onDecrement}
          disabled={value <= min}
          style={{
            width: 40, height: 40, borderRadius: 10,
            border: `1px solid ${C.border}`, background: C.white,
            fontSize: 20, cursor: value <= min ? 'not-allowed' : 'pointer',
            color: value <= min ? C.textLight : C.forest,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: F.body, opacity: value <= min ? 0.4 : 1,
            transition: 'opacity 0.2s',
          }}
        >
          −
        </button>
        <span
          aria-live="polite"
          aria-atomic="true"
          style={{ fontFamily: F.heading, fontSize: 24, fontWeight: 700, color: C.forest, minWidth: 32, textAlign: 'center' }}
        >
          {value}
        </span>
        <button
          type="button"
          aria-label={`Increase ${label}`}
          onClick={onIncrement}
          disabled={value >= max}
          style={{
            width: 40, height: 40, borderRadius: 10,
            border: `1px solid ${C.border}`, background: C.white,
            fontSize: 20, cursor: value >= max ? 'not-allowed' : 'pointer',
            color: value >= max ? C.textLight : C.forest,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: F.body, opacity: value >= max ? 0.4 : 1,
            transition: 'opacity 0.2s',
          }}
        >
          +
        </button>
      </div>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  value:    HouseholdState;
  onChange: (h: HouseholdState) => void;
}

export function HouseholdStep({ value, onChange }: Props) {
  const adults      = value.adults;
  const children    = value.children;
  const childAges   = value.childAges;

  const setAdults = (v: number) => {
    const a = Math.max(1, Math.min(2, v)) as 1 | 2;
    onChange({ ...value, adults: a, spouseWorking: a === 1 ? false : value.spouseWorking });
  };

  const setChildren = (v: number) => {
    const c = Math.max(0, Math.min(6, v));
    const ages = [...childAges];
    while (ages.length < c) ages.push(5);
    onChange({ ...value, children: c, childAges: ages.slice(0, c) });
  };

  const setChildAge = (idx: number, age: number) => {
    const ages = [...childAges];
    ages[idx] = Math.min(17, Math.max(0, age));
    onChange({ ...value, childAges: ages });
  };

  return (
    <div>
      <h2 style={{ fontFamily: F.heading, fontSize: 24, color: C.forest, margin: '0 0 8px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
        Your household
        <WhyWeAsk text="Family size affects your cost of living (MBM baseline), potential benefits like CCB, and recommended housing size." />
      </h2>
      <p style={{ fontFamily: F.body, fontSize: 15, color: C.gray, margin: '0 0 28px', lineHeight: 1.6 }}>
        Tell us about who will be living with you.
      </p>

      <Stepper
        label="Adults"
        value={adults}
        onDecrement={() => setAdults(adults - 1)}
        onIncrement={() => setAdults(adults + 1)}
        min={1} max={2}
      />

      <Stepper
        label="Children (under 18)"
        value={children}
        onDecrement={() => setChildren(children - 1)}
        onIncrement={() => setChildren(children + 1)}
        min={0} max={6}
      />

      {/* Child ages */}
      {children > 0 && (
        <div style={{ marginBottom: 20, padding: 16, borderRadius: 12, background: C.lightGray }}>
          <div style={{
            fontFamily: F.body, fontSize: 12, fontWeight: 600, color: C.forest,
            textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10,
          }}>
            Children&apos;s Ages
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {Array.from({ length: children }).map((_, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <label
                  htmlFor={`child-age-${i}`}
                  style={{ fontFamily: F.body, fontSize: 12, color: C.gray }}
                >
                  Child {i + 1}:
                </label>
                <input
                  id={`child-age-${i}`}
                  type="number"
                  min={0} max={17}
                  value={childAges[i] ?? 5}
                  onChange={(e) => setChildAge(i, parseInt(e.target.value) || 0)}
                  aria-label={`Age of child ${i + 1}`}
                  style={{
                    width: 52, padding: '8px 10px', borderRadius: 8,
                    border: `1px solid ${C.border}`,
                    fontFamily: F.body, fontSize: 14, textAlign: 'center', outline: 'none',
                    color: C.textDark,
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Spouse working toggle */}
      {adults === 2 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{
            fontFamily: F.body, fontSize: 13, fontWeight: 600, color: C.forest,
            textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10,
          }}>
            Is your spouse/partner working?
          </div>
          <div style={{ display: 'flex', gap: 8 }} role="radiogroup" aria-label="Spouse working status">
            {([{ v: true, l: 'Yes' }, { v: false, l: 'No' }] as const).map(({ v, l }) => (
              <button
                key={l}
                type="button"
                role="radio"
                aria-checked={value.spouseWorking === v}
                onClick={() => onChange({ ...value, spouseWorking: v })}
                style={{
                  padding: '10px 28px', borderRadius: 10, minHeight: 44,
                  border: `2px solid ${value.spouseWorking === v ? C.green : C.border}`,
                  background: value.spouseWorking === v ? C.selectedBg : C.white,
                  fontFamily: F.body, fontSize: 14, fontWeight: 600,
                  color: value.spouseWorking === v ? C.green : C.textDark,
                  cursor: 'pointer', transition: 'all 0.2s',
                }}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Bedrooms */}
      <div style={{
        fontFamily: F.body, fontSize: 13, fontWeight: 600, color: C.forest,
        textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10,
      }}>
        Target Bedrooms
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }} role="radiogroup" aria-label="Target bedrooms">
        {BEDROOM_OPTIONS.map((opt) => {
          const sel = value.bedrooms === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={sel}
              onClick={() => onChange({ ...value, bedrooms: opt.value })}
              style={{
                padding: '10px 18px', borderRadius: 10, minHeight: 44,
                border: `2px solid ${sel ? C.green : C.border}`,
                background: sel ? C.selectedBg : C.white,
                fontFamily: F.body, fontSize: 13, fontWeight: sel ? 700 : 500,
                color: sel ? C.green : C.textDark,
                cursor: 'pointer', transition: 'all 0.2s',
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
