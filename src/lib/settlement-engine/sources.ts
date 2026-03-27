/**
 * Settlement Planner — Data Source Catalog (US-18.1)
 *
 * Fetches all `dataSource` documents from Sanity and returns them keyed
 * by their `key` slug field for O(1) lookup when tagging engine line items.
 *
 * Uses an in-memory module-level cache so repeated calls within the same
 * server request or browser session do not re-query Sanity.
 */

import { createClient } from '@sanity/client'
import { apiVersion, dataset, projectId } from '@/sanity/env'
import type { DataSource } from './types'

// ─── Sanity client (CDN-enabled for public reads) ─────────────────────────────

const publicClient = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: true,
})

// ─── In-memory cache ──────────────────────────────────────────────────────────

let cache: Map<string, DataSource> | null = null

/**
 * Fetch all dataSource documents and return them keyed by `key` slug.
 *
 * Subsequent calls return the cached map without hitting Sanity again.
 * Call `clearDataSourceCache()` to force a refresh (e.g. in tests).
 */
export async function fetchDataSources(): Promise<Map<string, DataSource>> {
  if (cache) return cache

  const results = await publicClient.fetch<Array<{
    key:           { current: string }
    name:          string
    url:           string
    effectiveDate: string
    lastVerified:  string
    category:      'regulatory' | 'authority' | 'estimate'
    appliesTo:     string[] | null
    notes:         string | null
  }>>(
    `*[_type == "dataSource"] | order(category asc, key.current asc) {
      key,
      name,
      url,
      effectiveDate,
      lastVerified,
      category,
      appliesTo,
      notes
    }`,
  )

  cache = new Map<string, DataSource>()

  for (const doc of results) {
    const source: DataSource = {
      key:           doc.key.current,
      name:          doc.name,
      url:           doc.url,
      effectiveDate: doc.effectiveDate,
      lastVerified:  doc.lastVerified,
      category:      doc.category,
      appliesTo:     doc.appliesTo ?? [],
      notes:         doc.notes ?? undefined,
    }
    cache.set(source.key, source)
  }

  return cache
}

/**
 * Clear the in-memory data source cache.
 * Useful in tests or when the catalog is updated mid-session.
 */
export function clearDataSourceCache(): void {
  cache = null
}
