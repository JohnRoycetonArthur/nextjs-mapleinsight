import type { TaskDefinition, ContentItem, TaskLink } from './roadmapTypes';

/** Maximum number of links to attach per task. */
const MAX_LINKS_PER_TASK = 3;

/**
 * Resolves content links for a task by matching its `content_tags` against
 * the `tags` array in each ContentItem (AC-4).
 *
 * Scoring: number of tag overlaps.  Items with higher overlap are ranked first.
 * Guaranteed to return at least one link by falling back to the site checklist
 * if no tag match is found.
 *
 * Pure function — data is injected (no imports from filesystem).
 */
export function resolveTaskLinks(
  task:         TaskDefinition,
  contentItems: ContentItem[],
): TaskLink[] {
  // Score each item by the number of matching tags
  const scored = contentItems.map(item => {
    const overlap = item.tags.filter(t => task.content_tags.includes(t)).length;
    return { item, overlap };
  });

  // Sort by descending overlap; stable secondary sort by content_id for determinism
  scored.sort((a, b) =>
    b.overlap - a.overlap || a.item.content_id.localeCompare(b.item.content_id),
  );

  // Take top matches that have at least 1 tag in common
  const matched = scored.filter(s => s.overlap > 0).slice(0, MAX_LINKS_PER_TASK);

  // Guaranteed fallback: if nothing matched, use the newcomer checklist
  if (matched.length === 0) {
    const fallback = contentItems.find(i => i.content_id === 'checklist');
    if (fallback) {
      return [{ type: fallback.type, slug: fallback.slug, title: fallback.title }];
    }
    return [];
  }

  return matched.map(s => ({
    type:  s.item.type,
    slug:  s.item.slug,
    title: s.item.title,
  }));
}
