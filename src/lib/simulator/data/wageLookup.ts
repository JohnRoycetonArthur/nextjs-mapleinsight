import type { WageFact } from '../engines/salaryTypes';

/** Lookup function returned by createWageLookup. */
export type WageLookupFn = (noc_code: string, geo_key: string) => WageFact | null;

/**
 * Builds an O(1) lookup function from an array of WageFacts.
 *
 * Keeping data injection (rather than static import) makes the engine
 * fully pure and easy to test without touching the filesystem.
 */
export function createWageLookup(facts: WageFact[]): WageLookupFn {
  const index = new Map<string, WageFact>();
  for (const f of facts) {
    index.set(`${f.noc_code}:${f.geo_key}`, f);
  }
  return (noc, geo) => index.get(`${noc}:${geo}`) ?? null;
}
