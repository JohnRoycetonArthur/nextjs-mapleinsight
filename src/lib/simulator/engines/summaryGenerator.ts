import type { RoadmapInput, RoadmapResult, AffordabilityFlag } from './roadmapTypes';

/** Formats a dollar amount as a compact currency string, e.g. "$1,234". */
function fmt(amount: number): string {
  return `$${Math.abs(Math.round(amount)).toLocaleString('en-CA')}`;
}

const AFFORDABILITY_PHRASE: Record<AffordabilityFlag, string> = {
  affordable:   'comfortable affordability',
  at_risk:      'some housing affordability pressure',
  unaffordable: 'significant housing cost pressure',
};

const STAGE_INTRO: Record<string, string> = {
  planning_to_move: 'You\'re preparing to move to Canada',
  recently_arrived: 'You\'ve recently arrived in Canada',
  established:      'You\'re already established in Canada',
};

/**
 * Generates a plain-language personalization summary paragraph (AC-8).
 *
 * Includes: occupation, city, estimated income, take-home, affordability
 * flag, monthly surplus/deficit, and a forward-looking note.
 *
 * Pure function — no side effects.
 */
export function generateSummary(
  input:  RoadmapInput,
  result: RoadmapResult,
): string {
  const intro   = STAGE_INTRO[input.migration_stage] ?? 'You are in Canada';
  const surplus = result.monthly_surplus;
  const isSurplus = surplus >= 0;
  const surplusPhrase = isSurplus
    ? `a monthly surplus of ${fmt(surplus)}`
    : `a monthly shortfall of ${fmt(Math.abs(surplus))}`;

  const affordPhrase = AFFORDABILITY_PHRASE[result.housing_affordability_flag];

  const childNote = input.children > 0
    ? ` With ${input.children} ${input.children === 1 ? 'child' : 'children'}, your roadmap includes family-specific steps like the Canada Child Benefit and childcare planning.`
    : '';

  const surplusNote = isSurplus && surplus > 500
    ? ' Your positive monthly surplus opens the door to savings, investments, and — in time — homeownership.'
    : !isSurplus
    ? ' Your roadmap prioritizes budget optimization and finding more affordable housing to close the gap.'
    : '';

  return (
    `${intro} as a ${input.occupation_title} in ${input.city_name}. ` +
    `Based on your inputs, your estimated annual gross income is ${fmt(result.annual_mid)}, ` +
    `giving you a monthly take-home of approximately ${fmt(result.monthly_take_home)} after taxes and payroll deductions. ` +
    `After estimated living costs of ${fmt(result.estimated_total_monthly)}/month, ` +
    `you have ${surplusPhrase}, with ${affordPhrase}.` +
    childNote +
    surplusNote
  );
}
