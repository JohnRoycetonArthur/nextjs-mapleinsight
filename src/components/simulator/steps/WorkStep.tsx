'use client';

import { useState, useRef, useEffect } from 'react';
import { C, F } from '../tokens';
import { type WorkState, type OccupationOption, HOURS_OPTIONS } from '../wizardTypes';
import { searchOccupations } from '@/lib/simulator/occupationSearch';
import occupationsRaw from '@/data/simulator/occupations.json';

const ALL_OCCUPATIONS = occupationsRaw.data as OccupationOption[];

// ── Icons ─────────────────────────────────────────────────────────────────────

const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.textLight} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }}>
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const InfoIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);

// ── Tooltip ───────────────────────────────────────────────────────────────────

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

// ── Field label ───────────────────────────────────────────────────────────────

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontFamily: F.body, fontSize: 13, fontWeight: 600, color: C.forest,
      textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8,
    }}>
      {children}
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  value:    WorkState;
  onChange: (w: WorkState) => void;
  errors?:  { occupation?: string };
}

export function WorkStep({ value, onChange, errors }: Props) {
  const [occSearch, setOccSearch]   = useState('');
  const [occOpen, setOccOpen]       = useState(false);
  const [confirmed, setConfirmed]   = useState(!!value.occupation);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = searchOccupations(ALL_OCCUPATIONS, occSearch);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOccOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selectOcc = (occ: OccupationOption) => {
    onChange({ ...value, occupation: occ });
    setOccSearch('');
    setOccOpen(false);
    setConfirmed(false); // triggers confirm panel
  };

  return (
    <div>
      <h2 style={{ fontFamily: F.heading, fontSize: 24, color: C.forest, margin: '0 0 8px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
        Tell us about your work
        <WhyWeAsk text="We use your occupation to estimate wages from official Job Bank and Statistics Canada data." />
      </h2>
      <p style={{ fontFamily: F.body, fontSize: 15, color: C.gray, margin: '0 0 28px', lineHeight: 1.6 }}>
        Search for your job title or a related role.
      </p>

      {/* ── Occupation search ── */}
      <FieldLabel>Occupation</FieldLabel>
      <div ref={containerRef} style={{ position: 'relative', marginBottom: 24 }}>

        {/* Confirmed state */}
        {value.occupation && confirmed ? (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 16px', borderRadius: 12,
            border: `2px solid ${C.green}`, background: C.selectedBg,
          }}>
            <div>
              <span style={{ fontFamily: F.body, fontSize: 15, fontWeight: 600, color: C.green }}>{value.occupation.title}</span>
              <span style={{ fontFamily: F.body, fontSize: 12, color: C.gray, marginLeft: 8 }}>NOC {value.occupation.noc_code}</span>
            </div>
            <button
              type="button"
              onClick={() => { onChange({ ...value, occupation: null }); setConfirmed(false); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.green, fontSize: 13, fontFamily: F.body, fontWeight: 600, textDecoration: 'underline' }}
            >
              Change
            </button>
          </div>

        /* Pending confirmation */
        ) : value.occupation && !confirmed ? (
          <div style={{
            padding: 16, borderRadius: 12,
            border: `2px solid ${C.gold}`, background: C.goldBg,
          }}>
            <p style={{ fontFamily: F.body, fontSize: 14, color: C.textDark, margin: '0 0 12px' }}>
              Is this your role?
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span style={{ fontFamily: F.body, fontSize: 15, fontWeight: 600, color: C.forest }}>{value.occupation.title}</span>
              <span style={{ fontFamily: F.body, fontSize: 11, color: C.gray, padding: '2px 8px', background: C.white, borderRadius: 4 }}>NOC {value.occupation.noc_code}</span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                onClick={() => setConfirmed(true)}
                style={{
                  padding: '8px 20px', borderRadius: 8, border: 'none',
                  background: C.green, color: C.white,
                  fontFamily: F.body, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                }}
              >
                Yes, that&apos;s right
              </button>
              <button
                type="button"
                onClick={() => { onChange({ ...value, occupation: null }); setOccSearch(''); }}
                style={{
                  padding: '8px 20px', borderRadius: 8,
                  border: `1px solid ${C.border}`, background: C.white,
                  fontFamily: F.body, fontSize: 13, fontWeight: 600, cursor: 'pointer', color: C.textDark,
                }}
              >
                No, search again
              </button>
            </div>
          </div>

        /* Search state */
        ) : (
          <>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '14px 16px', borderRadius: 12,
              border: `2px solid ${occOpen ? C.green : errors?.occupation ? '#DC2626' : C.border}`,
              background: C.white, minHeight: 52,
            }}>
              <SearchIcon />
              <input
                type="text"
                role="combobox"
                aria-expanded={occOpen}
                aria-haspopup="listbox"
                aria-controls="occupation-listbox"
                aria-label="Search occupation"
                value={occSearch}
                onChange={(e) => { setOccSearch(e.target.value); setOccOpen(e.target.value.length > 1); }}
                onFocus={() => { if (occSearch.length > 1) setOccOpen(true); }}
                placeholder="e.g., Software Developer, Nurse, Electrician..."
                style={{
                  flex: 1, border: 'none', outline: 'none', fontSize: 15,
                  fontFamily: F.body, color: C.textDark, background: 'transparent', minWidth: 0,
                }}
              />
            </div>

            {occOpen && filtered.length > 0 && (
              <ul
                id="occupation-listbox"
                role="listbox"
                aria-label="Occupation options"
                style={{
                  position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
                  background: C.white, border: `1px solid ${C.border}`, borderRadius: 12,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.1)', maxHeight: 260, overflowY: 'auto',
                  zIndex: 50, listStyle: 'none', padding: 0, margin: 0,
                }}
              >
                {filtered.map((occ) => (
                  <li key={occ.noc_code} role="option" aria-selected={false}>
                    <button
                      type="button"
                      onClick={() => selectOcc(occ)}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        width: '100%', padding: '12px 16px', border: 'none',
                        background: 'transparent', cursor: 'pointer', textAlign: 'left',
                        fontFamily: F.body, fontSize: 14, transition: 'background 0.15s', minHeight: 44,
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = C.lightGray; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      <span style={{ fontWeight: 500, color: C.textDark }}>{occ.title}</span>
                      <span style={{ fontSize: 11, color: C.textLight }}>NOC {occ.noc_code}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>

      {errors?.occupation && (
        <p role="alert" style={{ fontFamily: F.body, fontSize: 13, color: '#DC2626', marginTop: -16, marginBottom: 16 }}>
          {errors.occupation}
        </p>
      )}

      {/* ── Experience slider ── */}
      <FieldLabel>Years of Experience</FieldLabel>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <input
          type="range"
          min={0} max={30}
          value={value.experience}
          onChange={(e) => onChange({ ...value, experience: parseInt(e.target.value) })}
          aria-label="Years of experience"
          aria-valuemin={0} aria-valuemax={30} aria-valuenow={value.experience}
          style={{ flex: 1, accentColor: C.green, height: 6, cursor: 'pointer' }}
        />
        <div style={{
          minWidth: 56, textAlign: 'center', padding: '8px 12px', borderRadius: 8,
          background: C.lightGray, fontFamily: F.heading, fontSize: 18,
          fontWeight: 700, color: C.forest,
        }}>
          {value.experience}
        </div>
      </div>

      {/* ── Hours per week ── */}
      <FieldLabel>Hours per Week</FieldLabel>
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }} role="radiogroup" aria-label="Hours per week">
        {HOURS_OPTIONS.map((h) => {
          const sel = value.hoursPerWeek === h;
          return (
            <button
              key={h}
              type="button"
              role="radio"
              aria-checked={sel}
              onClick={() => onChange({ ...value, hoursPerWeek: h })}
              style={{
                padding: '10px 20px', borderRadius: 10, minHeight: 44,
                border: `2px solid ${sel ? C.green : C.border}`,
                background: sel ? C.selectedBg : C.white,
                fontFamily: F.body, fontSize: 14, fontWeight: sel ? 700 : 500,
                color: sel ? C.green : C.textDark,
                cursor: 'pointer', transition: 'all 0.2s',
              }}
            >
              {h}h
            </button>
          );
        })}
      </div>

      {/* ── Employment type ── */}
      <FieldLabel>Employment Type</FieldLabel>
      <div style={{ display: 'flex', gap: 8 }} role="radiogroup" aria-label="Employment type">
        <button
          type="button"
          role="radio"
          aria-checked={value.employmentType === 'employee'}
          onClick={() => onChange({ ...value, employmentType: 'employee' })}
          style={{
            flex: 1, padding: '12px 16px', borderRadius: 10, minHeight: 44,
            border: `2px solid ${value.employmentType === 'employee' ? C.green : C.border}`,
            background: value.employmentType === 'employee' ? C.selectedBg : C.white,
            fontFamily: F.body, fontSize: 14, fontWeight: 600,
            color: value.employmentType === 'employee' ? C.green : C.textDark,
            cursor: 'pointer', transition: 'all 0.2s',
          }}
        >
          Employee
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={false}
          disabled
          aria-disabled="true"
          style={{
            flex: 1, padding: '12px 16px', borderRadius: 10, minHeight: 44,
            border: `2px solid ${C.border}`, background: C.lightGray,
            fontFamily: F.body, fontSize: 14, fontWeight: 500, color: C.textLight,
            cursor: 'not-allowed', position: 'relative', opacity: 0.6,
          }}
        >
          Self-Employed
          <span aria-label="Coming soon" style={{
            position: 'absolute', top: -8, right: -4,
            background: C.gold, color: C.white,
            fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4, fontFamily: F.body,
          }}>
            COMING SOON
          </span>
        </button>
      </div>
    </div>
  );
}
