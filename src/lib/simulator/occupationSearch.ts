// Occupation search utility — case-insensitive substring match
// against title and synonyms. Returns top 8 results.

import type { OccupationOption } from '@/components/simulator/wizardTypes';

export function searchOccupations(
  occupations: OccupationOption[],
  query: string,
  limit = 8,
): OccupationOption[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];

  const scored: Array<{ occ: OccupationOption; score: number }> = [];

  for (const occ of occupations) {
    const titleLower = occ.title.toLowerCase();
    let score = 0;

    if (titleLower === q) {
      score = 100;
    } else if (titleLower.startsWith(q)) {
      score = 80;
    } else if (titleLower.includes(q)) {
      score = 60;
    } else {
      const synonymMatch = occ.synonyms.some((s) => s.toLowerCase().includes(q));
      if (synonymMatch) score = 40;
    }

    if (score > 0) scored.push({ occ, score });
  }

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.occ);
}
