/**
 * Unit tests for the Personalized Roadmap Generator (US-9.6)
 *
 * Run with: npm run test:simulator
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { generateRoadmap }    from '../../src/lib/simulator/engines/roadmapEngine';
import { resolveTaskLinks }   from '../../src/lib/simulator/engines/contentLinker';
import { generateSummary }    from '../../src/lib/simulator/engines/summaryGenerator';
import type {
  RoadmapInput,
  RoadmapResult,
  TaskDefinition,
  RoadmapRule,
  ContentItem,
} from '../../src/lib/simulator/engines/roadmapTypes';

// ── Load real data ─────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-require-imports
const tasksRaw   = require('../../src/data/simulator/roadmap_tasks.json')   as { tasks: TaskDefinition[] };
// eslint-disable-next-line @typescript-eslint/no-require-imports
const rulesRaw   = require('../../src/data/simulator/roadmap_rules.json')   as { rules: RoadmapRule[] };
// eslint-disable-next-line @typescript-eslint/no-require-imports
const contentRaw = require('../../src/data/simulator/content_items.json')   as { items: ContentItem[] };

const allTasks:    TaskDefinition[] = tasksRaw.tasks;
const allRules:    RoadmapRule[]    = rulesRaw.rules;
const allContent:  ContentItem[]    = contentRaw.items;

// ── Fixtures ───────────────────────────────────────────────────────────────

/** Base simulation input: Toronto software developer, planning to move, no children. */
function baseInput(overrides: Partial<RoadmapInput> = {}): RoadmapInput {
  return {
    migration_stage:  'planning_to_move',
    city_id:          'toronto-on',
    city_name:        'Toronto',
    province_code:    'ON',
    noc_code:         '21231',
    occupation_title: 'Software Developer',
    years_experience: 5,
    employment_type:  'full-time',
    adults:           2,
    children:         0,
    hours_per_week:   40,
    bedrooms:         2,
    ...overrides,
  };
}

/** Base simulation result: comfortable income in Toronto. */
function baseResult(overrides: Partial<RoadmapResult> = {}): RoadmapResult {
  return {
    annual_mid:              104_000,
    point_annual:            104_000,
    monthly_take_home:       5_900,
    annual_net_income:       70_800,
    gross_monthly_income:    8_667,
    estimated_total_monthly: 4_800,
    monthly_surplus:         1_100,
    housing_affordability_flag: 'affordable',
    ...overrides,
  };
}

function gen(
  inputOverrides: Partial<RoadmapInput> = {},
  resultOverrides: Partial<RoadmapResult> = {},
) {
  return generateRoadmap(
    baseInput(inputOverrides),
    baseResult(resultOverrides),
    allTasks,
    allRules,
    allContent,
  );
}

// ── TC-1: planning_to_move includes Pre-Arrival tasks ─────────────────────

describe('TC-1: planning_to_move — Pre-Arrival tasks included', () => {
  it('staged_tasks.pre_arrival is non-empty', () => {
    const roadmap = gen({ migration_stage: 'planning_to_move' });
    assert.ok(roadmap.staged_tasks.pre_arrival.length > 0, 'pre_arrival should have tasks');
  });

  it('pre-research-cost-of-living is present', () => {
    const roadmap = gen({ migration_stage: 'planning_to_move' });
    const ids = roadmap.all_tasks.map(t => t.task_id);
    assert.ok(ids.includes('pre-research-cost-of-living'));
  });

  it('all 6 pre-arrival tasks are included', () => {
    const roadmap = gen({ migration_stage: 'planning_to_move' });
    assert.equal(roadmap.staged_tasks.pre_arrival.length, 6);
  });
});

// ── TC-2: recently_arrived omits Pre-Arrival ──────────────────────────────

describe('TC-2: recently_arrived — no Pre-Arrival tasks', () => {
  it('staged_tasks.pre_arrival is empty', () => {
    const roadmap = gen({ migration_stage: 'recently_arrived' });
    assert.equal(roadmap.staged_tasks.pre_arrival.length, 0);
  });

  it('no pre- task_ids in all_tasks', () => {
    const roadmap = gen({ migration_stage: 'recently_arrived' });
    const preIds = roadmap.all_tasks.filter(t => t.task_id.startsWith('pre-'));
    assert.equal(preIds.length, 0, 'no pre-arrival tasks should appear');
  });
});

// ── TC-3: has_children includes CCB task ─────────────────────────────────

describe('TC-3: has_children — CCB and family tasks included', () => {
  it('apply-for-ccb is present when children > 0', () => {
    const roadmap = gen({ children: 2 });
    const ids = roadmap.all_tasks.map(t => t.task_id);
    assert.ok(ids.includes('apply-for-ccb'), 'apply-for-ccb should be included');
  });

  it('apply-for-ccb has at least one link', () => {
    const roadmap = gen({ children: 2 });
    const task = roadmap.all_tasks.find(t => t.task_id === 'apply-for-ccb');
    assert.ok(task, 'task should exist');
    assert.ok(task!.links.length > 0, 'should have at least one link');
  });

  it('apply-for-ccb links include the CCB calculator', () => {
    const roadmap = gen({ children: 2 });
    const task = roadmap.all_tasks.find(t => t.task_id === 'apply-for-ccb');
    const slugs = task!.links.map(l => l.slug);
    assert.ok(
      slugs.some(s => s.includes('ccb')),
      `CCB link not found. Got: ${slugs.join(', ')}`,
    );
  });

  it('research-childcare is present', () => {
    const roadmap = gen({ children: 1 });
    const ids = roadmap.all_tasks.map(t => t.task_id);
    assert.ok(ids.includes('research-childcare'));
  });

  it('open-resp is present for households with children', () => {
    const roadmap = gen({ children: 1 });
    const ids = roadmap.all_tasks.map(t => t.task_id);
    assert.ok(ids.includes('open-resp'));
  });

  it('no CCB task when children = 0', () => {
    const roadmap = gen({ children: 0 });
    const ids = roadmap.all_tasks.map(t => t.task_id);
    assert.ok(!ids.includes('apply-for-ccb'), 'CCB should NOT appear with no children');
  });
});

// ── TC-4: at_risk includes budget task in First 30 Days ──────────────────

describe('TC-4: at_risk affordability — budget tasks in First 30 Days', () => {
  it('budget-review-housing is present', () => {
    const roadmap = gen({}, { housing_affordability_flag: 'at_risk' });
    const ids = roadmap.all_tasks.map(t => t.task_id);
    assert.ok(ids.includes('budget-review-housing'));
  });

  it('budget-review-housing is in first_30_days stage', () => {
    const roadmap = gen({}, { housing_affordability_flag: 'at_risk' });
    const stageIds = roadmap.staged_tasks.first_30_days.map(t => t.task_id);
    assert.ok(stageIds.includes('budget-review-housing'));
  });

  it('explore-affordable-areas is also present when unaffordable', () => {
    const roadmap = gen({}, { housing_affordability_flag: 'unaffordable' });
    const ids = roadmap.all_tasks.map(t => t.task_id);
    assert.ok(ids.includes('explore-affordable-areas'));
  });

  it('budget-review-housing is NOT present when housing is affordable', () => {
    const roadmap = gen({}, { housing_affordability_flag: 'affordable' });
    const ids = roadmap.all_tasks.map(t => t.task_id);
    assert.ok(!ids.includes('budget-review-housing'));
  });
});

// ── TC-5: affordable + surplus → savings/investment tasks in Month 4–6 ───

describe('TC-5: affordable + positive surplus — investment tasks surface', () => {
  it('explore-homebuying is included when housing is affordable', () => {
    const roadmap = gen({}, { housing_affordability_flag: 'affordable', monthly_surplus: 1000 });
    const ids = roadmap.all_tasks.map(t => t.task_id);
    assert.ok(ids.includes('explore-homebuying'));
  });

  it('explore-investments is included when monthly_surplus > 0', () => {
    const roadmap = gen({}, { monthly_surplus: 500 });
    const ids = roadmap.all_tasks.map(t => t.task_id);
    assert.ok(ids.includes('explore-investments'));
  });

  it('explore-homebuying is in month_4_6 stage', () => {
    const roadmap = gen({}, { housing_affordability_flag: 'affordable' });
    const stageIds = roadmap.staged_tasks.month_4_6.map(t => t.task_id);
    assert.ok(stageIds.includes('explore-homebuying'));
  });
});

// ── TC-6: Every task.links[].slug resolves to a valid path ───────────────

describe('TC-6: all task link slugs are valid paths', () => {
  it('all links start with "/"', () => {
    const roadmap = gen({ migration_stage: 'planning_to_move', children: 2 });
    for (const task of roadmap.all_tasks) {
      for (const link of task.links) {
        assert.ok(
          link.slug.startsWith('/'),
          `Task "${task.task_id}" link "${link.slug}" does not start with "/"`,
        );
      }
    }
  });

  it('every task has at least one link', () => {
    const roadmap = gen({ migration_stage: 'planning_to_move', children: 2 });
    for (const task of roadmap.all_tasks) {
      assert.ok(
        task.links.length > 0,
        `Task "${task.task_id}" has no links`,
      );
    }
  });

  it('no link slug is empty', () => {
    const roadmap = gen({ migration_stage: 'planning_to_move', children: 2 });
    for (const task of roadmap.all_tasks) {
      for (const link of task.links) {
        assert.ok(link.slug.length > 1, `Empty slug in task "${task.task_id}"`);
      }
    }
  });
});

// ── TC-7: No duplicate task_ids ───────────────────────────────────────────

describe('TC-7: no duplicate task_ids', () => {
  it('all task_ids are unique (planning_to_move with children)', () => {
    const roadmap = gen({ migration_stage: 'planning_to_move', children: 2 });
    const ids = roadmap.all_tasks.map(t => t.task_id);
    const unique = new Set(ids);
    assert.equal(unique.size, ids.length, 'Duplicate task_ids found');
  });

  it('all task_ids are unique (recently_arrived, no children, at_risk)', () => {
    const roadmap = gen(
      { migration_stage: 'recently_arrived', children: 0 },
      { housing_affordability_flag: 'at_risk' },
    );
    const ids = roadmap.all_tasks.map(t => t.task_id);
    const unique = new Set(ids);
    assert.equal(unique.size, ids.length, 'Duplicate task_ids found');
  });
});

// ── TC-8: personalization_summary mentions occupation, city, surplus ──────

describe('TC-8: personalization_summary content', () => {
  it('mentions the city name', () => {
    const roadmap = gen({ city_name: 'Toronto' });
    assert.ok(
      roadmap.personalization_summary.includes('Toronto'),
      `Summary missing "Toronto": ${roadmap.personalization_summary}`,
    );
  });

  it('mentions the occupation title', () => {
    const roadmap = gen({ occupation_title: 'Software Developer' });
    assert.ok(
      roadmap.personalization_summary.includes('Software Developer'),
      'Summary missing occupation',
    );
  });

  it('mentions the monthly surplus amount', () => {
    const roadmap = gen({}, { monthly_surplus: 1100 });
    assert.ok(
      roadmap.personalization_summary.includes('1,100'),
      `Summary missing surplus amount. Got: ${roadmap.personalization_summary}`,
    );
  });

  it('mentions monthly shortfall when surplus is negative', () => {
    const roadmap = gen({}, { monthly_surplus: -500 });
    assert.ok(
      roadmap.personalization_summary.toLowerCase().includes('shortfall'),
      'Summary should mention shortfall when surplus is negative',
    );
  });

  it('mentions the monthly take-home', () => {
    const roadmap = gen({}, { monthly_take_home: 5900 });
    assert.ok(
      roadmap.personalization_summary.includes('5,900'),
      'Summary missing take-home amount',
    );
  });

  it('mentions children when household has children', () => {
    const roadmap = gen({ children: 2 });
    assert.ok(
      roadmap.personalization_summary.toLowerCase().includes('child'),
      'Summary should mention children',
    );
  });

  it('generateSummary is callable independently', () => {
    const summary = generateSummary(baseInput(), baseResult());
    assert.ok(typeof summary === 'string' && summary.length > 50);
  });
});

// ── TC-9: Task count between 20 and 40 ───────────────────────────────────

describe('TC-9: total task count 20–40', () => {
  const scenarios: Array<[string, Partial<RoadmapInput>, Partial<RoadmapResult>]> = [
    ['planning_to_move, no children, affordable', { migration_stage: 'planning_to_move', children: 0 }, { housing_affordability_flag: 'affordable', monthly_surplus: 1000 }],
    ['planning_to_move, 2 children, at_risk',     { migration_stage: 'planning_to_move', children: 2 }, { housing_affordability_flag: 'at_risk', monthly_surplus: -200 }],
    ['recently_arrived, no children, affordable', { migration_stage: 'recently_arrived', children: 0 }, { housing_affordability_flag: 'affordable', monthly_surplus: 500 }],
    ['recently_arrived, 1 child, unaffordable',   { migration_stage: 'recently_arrived', children: 1 }, { housing_affordability_flag: 'unaffordable', monthly_surplus: -300 }],
    ['established, no children, affordable',      { migration_stage: 'established',      children: 0 }, { housing_affordability_flag: 'affordable', monthly_surplus: 2000 }],
  ];

  for (const [label, inp, res] of scenarios) {
    it(`${label}: count between 20 and 40`, () => {
      const roadmap = gen(inp, res);
      const count = roadmap.total_task_count;
      assert.ok(
        count >= 20 && count <= 40,
        `${label}: task count = ${count}, expected 20–40`,
      );
    });
  }
});

// ── TC-10: Changing city updates roadmap emphasis ─────────────────────────

describe('TC-10: different cities produce different emphasis', () => {
  it('high-cost city (Toronto, at_risk) includes budget review, low-cost city does not', () => {
    const torontoRoadmap = gen(
      { city_name: 'Toronto', city_id: 'toronto-on' },
      { housing_affordability_flag: 'at_risk' },
    );
    const winnipegRoadmap = gen(
      { city_name: 'Winnipeg', city_id: 'winnipeg-mb' },
      { housing_affordability_flag: 'affordable' },
    );

    const torontoIds  = torontoRoadmap.all_tasks.map(t => t.task_id);
    const winnipegIds = winnipegRoadmap.all_tasks.map(t => t.task_id);

    assert.ok(torontoIds.includes('budget-review-housing'),  'Toronto: should include budget review');
    assert.ok(!winnipegIds.includes('budget-review-housing'), 'Winnipeg: should NOT include budget review');
  });

  it('personalization_summary references the city name correctly', () => {
    const toronto  = gen({ city_name: 'Toronto' });
    const winnipeg = gen({ city_name: 'Winnipeg' });
    assert.ok(toronto.personalization_summary.includes('Toronto'));
    assert.ok(winnipeg.personalization_summary.includes('Winnipeg'));
    assert.ok(!winnipeg.personalization_summary.includes('Toronto'));
  });
});

// ── contentLinker unit tests ──────────────────────────────────────────────

describe('contentLinker', () => {
  it('returns max 3 links per task', () => {
    const task: TaskDefinition = {
      task_id: 'test', stage: 'first_30_days', title: 'Test',
      description: '', priority: 'do_now',
      content_tags: ['tax', 'savings', 'rrsp', 'tfsa', 'newcomer-basics'],
      always_include: true,
    };
    const links = resolveTaskLinks(task, allContent);
    assert.ok(links.length <= 3, `Got ${links.length} links, expected ≤ 3`);
  });

  it('falls back to checklist when no tags match', () => {
    const task: TaskDefinition = {
      task_id: 'test-nomatch', stage: 'first_30_days', title: 'No match',
      description: '', priority: 'do_now',
      content_tags: ['zzz-no-match-tag'],
      always_include: true,
    };
    const links = resolveTaskLinks(task, allContent);
    assert.ok(links.length > 0, 'should have fallback link');
    assert.ok(links[0].slug === '/checklist', 'fallback should be /checklist');
  });

  it('returns links with non-empty slug and title', () => {
    const task: TaskDefinition = {
      task_id: 'test-link', stage: 'month_2_3', title: 'Banking',
      description: '', priority: 'do_now',
      content_tags: ['banking', 'newcomer-basics'],
      always_include: true,
    };
    const links = resolveTaskLinks(task, allContent);
    for (const link of links) {
      assert.ok(link.slug.length > 0);
      assert.ok(link.title.length > 0);
    }
  });
});
