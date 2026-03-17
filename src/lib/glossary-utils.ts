import { GLOSSARY_TERMS } from '@/data/glossaryTerms';

export interface GlossaryEntry {
  term:       string;
  definition: string;
  id:         string; // slug, e.g. 'rrsp'
}

/** Build case-insensitive Map<lowerTerm, GlossaryEntry> from local glossary data. */
export function buildGlossaryMap(): Map<string, GlossaryEntry> {
  const map = new Map<string, GlossaryEntry>();
  for (const g of GLOSSARY_TERMS) {
    map.set(g.term.toLowerCase(), { term: g.term, definition: g.definition, id: g.id });
  }
  return map;
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Build a regex that matches any glossary term as a whole word.
 * Sorted longest-first to prevent partial matches (e.g. "FHSA" before "HSA").
 * Returns null if the map is empty.
 */
export function buildGlossaryRegex(map: Map<string, GlossaryEntry>): RegExp | null {
  if (!map.size) return null;
  const terms = Array.from(map.keys()).sort((a, b) => b.length - a.length);
  return new RegExp(`\\b(${terms.map(escapeRegExp).join('|')})\\b`, 'gi');
}
