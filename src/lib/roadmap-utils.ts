import type { RoadmapTask, StagedTasks } from '@/lib/simulator/engines/roadmapTypes';

/**
 * De-duplicate article and calculator links across roadmap stages.
 *
 * Rules:
 * - Each link slug appears at most once across all stages.
 * - The earliest stage (array order) wins.
 * - Does NOT mutate the input — returns new arrays.
 * - Apply AFTER persona filtering so a slug suppressed in an earlier
 *   filtered-out stage can surface in a later visible stage (AC-5, AC-3).
 *
 * @param activeStageKeys - Stage keys in display order, already filtered by persona.
 * @param stagedTasks     - Full staged_tasks map from the roadmap engine.
 * @returns A new map of stage key → deduplicated task array.
 */
export function deduplicateRoadmapLinks(
  activeStageKeys: readonly string[],
  stagedTasks: StagedTasks,
): Record<string, RoadmapTask[]> {
  const seen = new Set<string>();
  const result: Record<string, RoadmapTask[]> = {};

  for (const key of activeStageKeys) {
    const tasks: RoadmapTask[] = (stagedTasks as unknown as Record<string, RoadmapTask[]>)[key] ?? [];

    result[key] = tasks.map((task) => ({
      ...task,
      links: task.links.filter((link) => {
        if (seen.has(link.slug)) return false;
        seen.add(link.slug);
        return true;
      }),
    }));
  }

  return result;
}

/**
 * Returns true if every task in the stage has an empty links array.
 * Used to decide whether to show the "already covered" fallback message.
 */
export function stageHasNoLinks(tasks: RoadmapTask[]): boolean {
  return tasks.length > 0 && tasks.every((t) => t.links.length === 0);
}
