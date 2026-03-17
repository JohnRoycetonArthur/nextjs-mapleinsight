import { deduplicateRoadmapLinks, stageHasNoLinks } from '@/lib/roadmap-utils';
import type { RoadmapTask, StagedTasks } from '@/lib/simulator/engines/roadmapTypes';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeTask(id: string, slugs: string[]): RoadmapTask {
  return {
    task_id:     id,
    title:       `Task ${id}`,
    description: 'Test task',
    priority:    'do_now',
    links:       slugs.map((slug) => ({ type: 'article', slug, title: `Article ${slug}` })),
  };
}

function emptyStagedTasks(): StagedTasks {
  return {
    pre_arrival:   [],
    first_30_days: [],
    month_2_3:     [],
    month_4_6:     [],
    month_7_12:    [],
  };
}

// ── TC-1: duplicate in Phase 1 & 2 → stays in Phase 1 ────────────────────────

test('TC-1: article in two phases appears only in the earlier phase', () => {
  const staged: StagedTasks = {
    ...emptyStagedTasks(),
    first_30_days: [makeTask('A', ['/articles/compare-cost-of-living'])],
    month_2_3:     [makeTask('B', ['/articles/compare-cost-of-living'])],
  };
  const activeKeys = ['first_30_days', 'month_2_3'] as const;
  const result = deduplicateRoadmapLinks(activeKeys, staged);

  expect(result['first_30_days'][0].links).toHaveLength(1);
  expect(result['month_2_3'][0].links).toHaveLength(0);
});

// ── TC-2: Phase 1 filtered (settled) → article surfaces in Phase 2 ───────────

test('TC-2: when earlier phase is filtered out, article surfaces in next phase', () => {
  const staged: StagedTasks = {
    ...emptyStagedTasks(),
    // first_30_days exists in data but is excluded from settled persona
    first_30_days: [makeTask('A', ['/articles/compare-cost-of-living'])],
    month_4_6:     [makeTask('B', ['/articles/compare-cost-of-living'])],
  };
  // Settled persona: only month_4_6 is in activeKeys (first_30_days excluded)
  const activeKeys = ['month_4_6'] as const;
  const result = deduplicateRoadmapLinks(activeKeys, staged);

  expect(result['month_4_6'][0].links).toHaveLength(1);
  expect(result['month_4_6'][0].links[0].slug).toBe('/articles/compare-cost-of-living');
});

// ── TC-3: same calculator in three phases → appears only in the first ─────────

test('TC-3: calculator in three phases appears only in the first', () => {
  const calcSlug = '/tools/rrsp-refund';
  const staged: StagedTasks = {
    ...emptyStagedTasks(),
    first_30_days: [makeTask('A', [calcSlug])],
    month_2_3:     [makeTask('B', [calcSlug])],
    month_4_6:     [makeTask('C', [calcSlug])],
  };
  const activeKeys = ['first_30_days', 'month_2_3', 'month_4_6'] as const;
  const result = deduplicateRoadmapLinks(activeKeys, staged);

  expect(result['first_30_days'][0].links).toHaveLength(1);
  expect(result['month_2_3'][0].links).toHaveLength(0);
  expect(result['month_4_6'][0].links).toHaveLength(0);
});

// ── TC-4: original staged tasks are not mutated ───────────────────────────────

test('TC-4: original STAGES data is not mutated', () => {
  const slug = '/articles/tfsa-explained';
  const staged: StagedTasks = {
    ...emptyStagedTasks(),
    first_30_days: [makeTask('A', [slug])],
    month_2_3:     [makeTask('B', [slug])],
  };
  const originalLength = staged.first_30_days[0].links.length;
  const activeKeys = ['first_30_days', 'month_2_3'] as const;

  deduplicateRoadmapLinks(activeKeys, staged);

  // Original must be untouched
  expect(staged.first_30_days[0].links).toHaveLength(originalLength);
  expect(staged.month_2_3[0].links).toHaveLength(1);
});

// ── TC-5: phase with all links removed renders fallback ───────────────────────

test('TC-5: stageHasNoLinks returns true when all tasks have empty links', () => {
  const tasks: RoadmapTask[] = [
    { task_id: 'x', title: 'T', description: 'D', priority: 'do_now', links: [] },
    { task_id: 'y', title: 'T', description: 'D', priority: 'do_soon', links: [] },
  ];
  expect(stageHasNoLinks(tasks)).toBe(true);
});

test('TC-5b: stageHasNoLinks returns false when at least one task has a link', () => {
  const tasks: RoadmapTask[] = [
    { task_id: 'x', title: 'T', description: 'D', priority: 'do_now', links: [] },
    { task_id: 'y', title: 'T', description: 'D', priority: 'do_soon', links: [{ type: 'article', slug: '/a', title: 'A' }] },
  ];
  expect(stageHasNoLinks(tasks)).toBe(false);
});

test('TC-5c: stageHasNoLinks returns false for an empty task array', () => {
  expect(stageHasNoLinks([])).toBe(false);
});
