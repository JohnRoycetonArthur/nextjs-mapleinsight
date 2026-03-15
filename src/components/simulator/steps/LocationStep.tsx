'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { C, F } from '../tokens';
import { type CityOption, PROVINCE_NAMES } from '../wizardTypes';
import citiesRaw from '@/data/simulator/cities.json';

const CITIES = citiesRaw.data as CityOption[];

// ── Inline icons ─────────────────────────────────────────────────────────────

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
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onFocus={() => setShow(true)}
      onBlur={() => setShow(false)}
      tabIndex={0}
      role="button"
      aria-label="Why we ask this"
    >
      <InfoIcon />
      {show && (
        <div role="tooltip" style={{
          position: 'absolute', bottom: 'calc(100% + 8px)', left: '50%',
          transform: 'translateX(-50%)',
          background: C.forest, color: '#fff', padding: '10px 14px', borderRadius: 10,
          fontSize: 12, lineHeight: 1.5, fontFamily: F.body, width: 240,
          boxShadow: '0 4px 16px rgba(0,0,0,0.15)', zIndex: 10, pointerEvents: 'none',
        }}>
          {text}
          <div aria-hidden="true" style={{
            position: 'absolute', bottom: -5, left: '50%',
            transform: 'translateX(-50%) rotate(45deg)',
            width: 10, height: 10, background: C.forest,
          }} />
        </div>
      )}
    </span>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  value:    CityOption | null;
  onChange: (city: CityOption | null) => void;
  error?:   string;
}

export function LocationStep({ value, onChange, error }: Props) {
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const inputRef   = useRef<HTMLInputElement>(null);
  const listboxRef = useRef<HTMLUListElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = search.length > 0
    ? CITIES.filter((c) =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        (PROVINCE_NAMES[c.province_code] ?? '').toLowerCase().includes(search.toLowerCase())
      )
    : CITIES;

  const handleSelect = useCallback((city: CityOption) => {
    onChange(city);
    setSearch('');
    setIsOpen(false);
    inputRef.current?.blur();
  }, [onChange]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const displayValue = value ? `${value.name}, ${value.province_code}` : search;
  const provinceName = value ? (PROVINCE_NAMES[value.province_code] ?? value.province_code) : '';

  return (
    <div>
      <h2 style={{ fontFamily: F.heading, fontSize: 24, color: C.forest, margin: '0 0 8px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
        Where in Canada?
        <WhyWeAsk text="We use your city to estimate local wages, rent, and cost of living from official Canadian data sources." />
      </h2>
      <p style={{ fontFamily: F.body, fontSize: 15, color: C.gray, margin: '0 0 24px', lineHeight: 1.6 }}>
        Select the city where you live or plan to settle.
      </p>

      <div ref={containerRef} style={{ position: 'relative' }}>
        {/* Input */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '14px 16px', borderRadius: 12,
          border: `2px solid ${isOpen ? C.green : error ? '#DC2626' : C.border}`,
          background: C.white, transition: 'border-color 0.2s', minHeight: 52,
        }}>
          <SearchIcon />
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded={isOpen}
            aria-haspopup="listbox"
            aria-autocomplete="list"
            aria-controls="city-listbox"
            aria-label="Search for a city"
            value={displayValue}
            onChange={(e) => {
              setSearch(e.target.value);
              onChange(null);
              setIsOpen(true);
            }}
            onFocus={() => {
              if (value) { onChange(null); setSearch(''); }
              setIsOpen(true);
            }}
            placeholder="Search for a city..."
            style={{
              flex: 1, border: 'none', outline: 'none', fontSize: 15,
              fontFamily: F.body, color: C.textDark, background: 'transparent',
              minWidth: 0,
            }}
          />
          {value && (
            <span style={{
              padding: '3px 10px', borderRadius: 6,
              background: C.green + '22', color: C.green,
              fontSize: 12, fontWeight: 600, fontFamily: F.body, flexShrink: 0,
            }}>
              {provinceName}
            </span>
          )}
        </div>

        {/* Dropdown */}
        {isOpen && (
          <ul
            ref={listboxRef}
            id="city-listbox"
            role="listbox"
            aria-label="City options"
            style={{
              position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
              background: C.white, border: `1px solid ${C.border}`, borderRadius: 12,
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)', maxHeight: 280, overflowY: 'auto',
              zIndex: 50, listStyle: 'none', padding: 0, margin: 0,
            }}
          >
            {filtered.length === 0 ? (
              <li style={{ padding: '20px 16px', textAlign: 'center', color: C.gray, fontSize: 14, fontFamily: F.body }}>
                No cities found. Try a different search.
              </li>
            ) : (
              filtered.map((city) => (
                <li key={city.city_id} role="option" aria-selected={value?.city_id === city.city_id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(city)}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      width: '100%', padding: '12px 16px', border: 'none',
                      background: value?.city_id === city.city_id ? C.selectedBg : 'transparent',
                      cursor: 'pointer', textAlign: 'left',
                      fontFamily: F.body, fontSize: 14, color: C.textDark,
                      transition: 'background 0.15s', minHeight: 44,
                    }}
                    onMouseEnter={(e) => { if (value?.city_id !== city.city_id) e.currentTarget.style.background = C.lightGray; }}
                    onMouseLeave={(e) => { if (value?.city_id !== city.city_id) e.currentTarget.style.background = 'transparent'; }}
                  >
                    <span style={{ fontWeight: 500 }}>{city.name}</span>
                    <span style={{ fontSize: 12, color: C.textLight }}>{PROVINCE_NAMES[city.province_code] ?? city.province_code}</span>
                  </button>
                </li>
              ))
            )}
          </ul>
        )}
      </div>

      {error && (
        <p role="alert" style={{ fontFamily: F.body, fontSize: 13, color: '#DC2626', marginTop: 8 }}>
          {error}
        </p>
      )}
    </div>
  );
}
