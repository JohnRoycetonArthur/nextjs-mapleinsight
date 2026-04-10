/**
 * Countries stub — US-3.1 / US-3.2
 *
 * Authoritative country list used by /api/countries until Prompt 12 (full
 * CountryCosts seed) is merged.  At that point this module is replaced by a
 * Sanity-backed data fetch and isSeeded is driven by the Sanity document.
 *
 * isSeeded = true  → cost data (medical, pcc, ielts) is available in Sanity
 * isSeeded = false → UI shows "DATA PENDING" badge; engine falls back to
 *                    Canadian newcomer averages
 */

export interface CountryRecord {
  /** ISO 3166-1 alpha-2 code — stored in session */
  iso: string
  /** English display name */
  name: string
  /** Flag emoji */
  flag: string
  /** Whether country-specific cost data has been seeded in Sanity */
  isSeeded: boolean
}

export const COUNTRIES_STUB: CountryRecord[] = [
  { iso: 'IN', name: 'India',                flag: '🇮🇳', isSeeded: true  },
  { iso: 'PH', name: 'Philippines',          flag: '🇵🇭', isSeeded: true  },
  { iso: 'NG', name: 'Nigeria',              flag: '🇳🇬', isSeeded: true  },
  { iso: 'CN', name: 'China',                flag: '🇨🇳', isSeeded: true  },
  { iso: 'PK', name: 'Pakistan',             flag: '🇵🇰', isSeeded: true  },
  { iso: 'BR', name: 'Brazil',               flag: '🇧🇷', isSeeded: true  },
  { iso: 'FR', name: 'France',               flag: '🇫🇷', isSeeded: true  },
  { iso: 'GB', name: 'United Kingdom',       flag: '🇬🇧', isSeeded: true  },
  { iso: 'AE', name: 'UAE',                  flag: '🇦🇪', isSeeded: true  },
  { iso: 'KE', name: 'Kenya',                flag: '🇰🇪', isSeeded: true  },
  { iso: 'MX', name: 'Mexico',               flag: '🇲🇽', isSeeded: true  },
  { iso: 'ZA', name: 'South Africa',         flag: '🇿🇦', isSeeded: true  },
  { iso: 'VN', name: 'Vietnam',              flag: '🇻🇳', isSeeded: true  },
  { iso: 'EG', name: 'Egypt',                flag: '🇪🇬', isSeeded: true  },
  { iso: 'US', name: 'United States',        flag: '🇺🇸', isSeeded: true  },
  { iso: 'CO', name: 'Colombia',             flag: '🇨🇴', isSeeded: true  },
  { iso: 'ET', name: 'Ethiopia',             flag: '🇪🇹', isSeeded: true  },
  { iso: 'BD', name: 'Bangladesh',           flag: '🇧🇩', isSeeded: true  },
  { iso: 'GH', name: 'Ghana',                flag: '🇬🇭', isSeeded: true  },
  { iso: 'IR', name: 'Iran',                 flag: '🇮🇷', isSeeded: true  },
  { iso: 'KR', name: 'South Korea',          flag: '🇰🇷', isSeeded: true  },
  { iso: 'JP', name: 'Japan',                flag: '🇯🇵', isSeeded: true  },
  { iso: 'DE', name: 'Germany',              flag: '🇩🇪', isSeeded: true  },
  { iso: 'UA', name: 'Ukraine',              flag: '🇺🇦', isSeeded: true  },
  { iso: 'RO', name: 'Romania',              flag: '🇷🇴', isSeeded: true  },
  { iso: 'LK', name: 'Sri Lanka',            flag: '🇱🇰', isSeeded: false },
  { iso: 'NP', name: 'Nepal',                flag: '🇳🇵', isSeeded: false },
  { iso: 'KH', name: 'Cambodia',             flag: '🇰🇭', isSeeded: false },
  { iso: 'SN', name: 'Senegal',              flag: '🇸🇳', isSeeded: false },
  { iso: 'TZ', name: 'Tanzania',             flag: '🇹🇿', isSeeded: false },
]

/** Look up a country by ISO code. Returns undefined if not found. */
export function findCountry(iso: string): CountryRecord | undefined {
  return COUNTRIES_STUB.find(c => c.iso === iso)
}

/** Filter countries by name prefix or exact ISO match (case-insensitive). */
export function filterCountries(query: string): CountryRecord[] {
  const q = query.trim().toLowerCase()
  if (!q) return COUNTRIES_STUB
  return COUNTRIES_STUB.filter(
    c => c.name.toLowerCase().includes(q) || c.iso.toLowerCase() === q,
  )
}
