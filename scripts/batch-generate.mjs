/**
 * Batch article generator for Maple Insight.
 *
 * Usage:
 *   node scripts/batch-generate.mjs                    # generate all missing articles
 *   node scripts/batch-generate.mjs --dry-run          # preview without API calls
 *   node scripts/batch-generate.mjs --slug <slug>      # single specific article
 *   node scripts/batch-generate.mjs --category Taxes   # filter by category
 *
 * Skips articles whose .md file already exists in content/articles/.
 * Rate limits to one API call per 3 seconds to avoid OpenAI throttling.
 */

import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { TOPIC_MATRIX } from "./topic-matrix.mjs";

const ARTICLES_DIR = path.join(process.cwd(), "content", "articles");
const RATE_LIMIT_MS = 3000;

// ── Parse flags ───────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const isDryRun = args.includes("--dry-run");

const slugFlagIdx = args.indexOf("--slug");
const slugFilter = slugFlagIdx !== -1 ? args[slugFlagIdx + 1] : null;

const categoryFlagIdx = args.indexOf("--category");
const categoryFilter = categoryFlagIdx !== -1 ? args[categoryFlagIdx + 1] : null;

// ── Filter matrix ─────────────────────────────────────────────────────────────

let queue = TOPIC_MATRIX;
if (slugFilter) queue = queue.filter((e) => e.slug === slugFilter);
if (categoryFilter) queue = queue.filter((e) => e.category === categoryFilter);

if (queue.length === 0) {
  console.log("No matching entries in the topic matrix.");
  if (slugFilter) console.log(`  --slug "${slugFilter}" did not match any entry.`);
  if (categoryFilter) console.log(`  --category "${categoryFilter}" did not match any entry.`);
  process.exit(0);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function articleExists(slug) {
  return fs.existsSync(path.join(ARTICLES_DIR, `${slug}.md`));
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── Run ───────────────────────────────────────────────────────────────────────

console.log(`\nMaple Insight — Batch Article Generator`);
console.log(`  Matrix total : ${TOPIC_MATRIX.length} entries`);
console.log(`  Queue        : ${queue.length} entries (after filters)`);
console.log(`  Mode         : ${isDryRun ? "DRY RUN (no API calls)" : "LIVE"}`);
if (slugFilter) console.log(`  Slug filter  : ${slugFilter}`);
if (categoryFilter) console.log(`  Category     : ${categoryFilter}`);
console.log("");

let generated = 0;
let skipped = 0;
let failed = 0;

for (const entry of queue) {
  if (articleExists(entry.slug)) {
    console.log(`[SKIP] ${entry.slug}`);
    skipped++;
    continue;
  }

  if (isDryRun) {
    console.log(`[DRY RUN] Would generate: ${entry.slug}`);
    console.log(`          Title    : ${entry.title}`);
    console.log(`          Category : ${entry.category}${entry.province ? ` | Province: ${entry.province}` : ""}${entry.incomeLevel ? ` | Income: $${entry.incomeLevel.toLocaleString()}` : ""}`);
    generated++;
    continue;
  }

  try {
    execSync(
      `node scripts/generate-article.mjs --json ${JSON.stringify(JSON.stringify(entry))}`,
      { stdio: "inherit" }
    );
    generated++;
  } catch (err) {
    console.error(`[FAILED] ${entry.slug}: ${err.message}`);
    failed++;
  }

  // Rate limit between API calls
  await sleep(RATE_LIMIT_MS);
}

// ── Summary ───────────────────────────────────────────────────────────────────

console.log("");
console.log("── Summary ──────────────────────────────────────");
if (isDryRun) {
  console.log(`  Would generate : ${generated}`);
  console.log(`  Would skip     : ${skipped} (already exist)`);
} else {
  console.log(`  Generated : ${generated}`);
  console.log(`  Skipped   : ${skipped} (already exist)`);
  console.log(`  Failed    : ${failed}`);
}
console.log("─────────────────────────────────────────────────\n");
