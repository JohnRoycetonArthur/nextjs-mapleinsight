/**
 * Personalized Roadmap Generator — US-9.6
 *
 * generateRoadmap() is a pure function: deterministic, no side effects.
 * All data is injected via parameters so the function is fully testable
 * without touching the filesystem.
 *
 * For production use, pass data from:
 *   src/data/simulator/roadmap_tasks.json   → taskDefs
 *   src/data/simulator/roadmap_rules.json   → rules
 *   src/data/simulator/content_items.json   → contentItems
 */

import type {
  RoadmapInput,
  RoadmapResult,
  RoadmapContext,
  TaskDefinition,
  RoadmapRule,
  RuleCondition,
  ContentItem,
  RoadmapTask,
  RoadmapOutput,
  StagedTasks,
  RoadmapStage,
} from './roadmapTypes';
import { resolveTaskLinks } from './contentLinker';
import { generateSummary }  from './summaryGenerator';

// ── Rule evaluator ────────────────────────────────────────────────────────────

/**
 * Evaluates a single rule condition against the simulation context.
 * Returns true when the condition matches.
 */
function evaluateCondition(condition: RuleCondition, ctx: RoadmapContext): boolean {
  const raw = (ctx as unknown as Record<string, unknown>)[condition.field];

  switch (condition.op) {
    case 'eq':  return raw === condition.value;
    case 'ne':  return raw !== condition.value;
    case 'gt':  return typeof raw === 'number' && raw  >  (condition.value as number);
    case 'lt':  return typeof raw === 'number' && raw  <  (condition.value as number);
    case 'gte': return typeof raw === 'number' && raw  >= (condition.value as number);
    case 'in':  return Array.isArray(condition.value) && condition.value.includes(raw);
    default:    return false;
  }
}

// ── Stage ordering for display ────────────────────────────────────────────────

const STAGE_ORDER: RoadmapStage[] = [
  'pre_arrival',
  'first_30_days',
  'month_2_3',
  'month_4_6',
  'month_7_12',
];

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Generates a personalized staged roadmap from simulation inputs and results.
 *
 * @param input        Onboarding wizard answers.
 * @param result       Combined outputs from salary, tax, and COL engines.
 * @param taskDefs     All task definitions (from roadmap_tasks.json).
 * @param rules        Conditional inclusion rules (from roadmap_rules.json).
 * @param contentItems Content catalogue for link resolution (from content_items.json).
 */
export function generateRoadmap(
  input:        RoadmapInput,
  result:       RoadmapResult,
  taskDefs:     TaskDefinition[],
  rules:        RoadmapRule[],
  contentItems: ContentItem[],
): RoadmapOutput {
  // Build an O(1) task index
  const taskIndex = new Map<string, TaskDefinition>();
  for (const t of taskDefs) {
    taskIndex.set(t.task_id, t);
  }

  // Build evaluation context
  const ctx: RoadmapContext = {
    migration_stage:           input.migration_stage,
    has_children:              input.children > 0,
    housing_affordability_flag: result.housing_affordability_flag,
    monthly_surplus:           result.monthly_surplus,
    province_code:             input.province_code,
    adults:                    input.adults,
    employment_type:           input.employment_type,
  };

  // ── 1. Seed with always_include tasks ────────────────────────────────────

  const included = new Set<string>(
    taskDefs.filter(t => t.always_include).map(t => t.task_id),
  );
  const excluded = new Set<string>();

  // ── 2. Apply rules ────────────────────────────────────────────────────────

  for (const rule of rules) {
    if (!evaluateCondition(rule.condition, ctx)) continue;

    for (const id of rule.include_tasks) {
      if (!excluded.has(id)) included.add(id);
    }
    for (const id of rule.exclude_tasks) {
      excluded.add(id);
      included.delete(id);
    }
  }

  // ── 3. Build final task list (deduplicated, AC-5) ─────────────────────────

  const seenIds = new Set<string>();
  const resolvedTasks: Array<{ task: RoadmapTask; stage: RoadmapStage }> = [];

  for (const id of included) {
    if (seenIds.has(id)) continue; // deduplicate
    seenIds.add(id);

    const def = taskIndex.get(id);
    if (!def) continue;

    const links = resolveTaskLinks(def, contentItems);
    resolvedTasks.push({
      task: {
        task_id:     def.task_id,
        title:       def.title,
        description: def.description,
        priority:    def.priority,
        links,
      },
      stage: def.stage,
    });
  }

  // ── 4. Sort within each stage: do_now → do_soon → do_later ───────────────

  const PRIORITY_ORDER: Record<string, number> = { do_now: 0, do_soon: 1, do_later: 2 };
  resolvedTasks.sort((a, b) => {
    const stageA = STAGE_ORDER.indexOf(a.stage);
    const stageB = STAGE_ORDER.indexOf(b.stage);
    if (stageA !== stageB) return stageA - stageB;
    return (PRIORITY_ORDER[a.task.priority] ?? 9) - (PRIORITY_ORDER[b.task.priority] ?? 9);
  });

  // ── 5. Group by stage ─────────────────────────────────────────────────────

  const staged: StagedTasks = {
    pre_arrival:   [],
    first_30_days: [],
    month_2_3:     [],
    month_4_6:     [],
    month_7_12:    [],
  };

  const flat: RoadmapTask[] = [];

  for (const { task, stage } of resolvedTasks) {
    staged[stage].push(task);
    flat.push(task);
  }

  // ── 6. Personalization summary (AC-8) ─────────────────────────────────────

  const personalization_summary = generateSummary(input, result);

  return {
    staged_tasks:            staged,
    all_tasks:               flat,
    total_task_count:        flat.length,
    personalization_summary,
  };
}
