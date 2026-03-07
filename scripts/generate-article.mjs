import "dotenv/config";
import fs from "fs";
import path from "path";
import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function slugify(s) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function estimateReadingTime(text) {
  const words = text.trim().split(/\s+/).length;
  return Math.max(5, Math.round(words / 220));
}

function buildPrompt(entry) {
  const provinceInstruction = entry.province
    ? `Use ${entry.province} 2025 provincial tax brackets in your worked example. Mention province-specific details throughout.`
    : "Use Ontario as the default province for worked examples (mention that rates vary by province).";

  const incomeInstruction = entry.incomeLevel
    ? `Income level focus: $${entry.incomeLevel.toLocaleString()} CAD per year. Build your primary worked example around this exact income.`
    : "";

  const keywordList = entry.keywords.length > 0 ? entry.keywords.join(", ") : "";

  return `You are a financial education writer for MapleInsight.ca, a trusted Canadian personal finance website.

Voice: calm, confident, clear, educational. Never use hype, fear, or sales language.
Audience: Canadians — families, newcomers, first-time earners, self-employed workers.
Reading level: Grade 8–10. Practical, not academic.

FINANCIAL ACCURACY RULES (use these exact figures):
- 2025 federal tax brackets: 15% on income up to $57,375 | 20.5% on $57,375–$114,750 | 26% on $114,750–$177,882 | 29% on $177,882–$253,414 | 33% above $253,414
- 2025 basic personal amount (federal): $16,129 (this reduces your federal tax payable)
- 2025 RRSP contribution limit: 18% of prior year earned income, maximum $32,490
- 2025 TFSA annual contribution limit: $7,000 (cumulative room since 2009 is $95,000 if always eligible as a resident)
- ${provinceInstruction}
- Always include a short disclaimer that figures are educational estimates, not professional tax advice

ARTICLE REQUIREMENTS:
- Length: 1500–2000 words (do not go under 1400 or over 2200)
- Use ## for H2 headings, ### for H3 headings
- Include at least one worked example with real dollar calculations showing RRSP tax savings
- End with a FAQ section titled "## Frequently Asked Questions" with 5–7 questions using ### for each question
- End with a "## Conclusion" section
- ${keywordList ? `Weave these keywords naturally into the prose (do not stuff): ${keywordList}` : ""}
- ${entry.incomeLevel ? incomeInstruction : ""}
- Include this exact markdown link at the end of the most relevant section: [${entry.calculatorCta}](${entry.calculatorLink})
- Return ONLY the article body markdown — no frontmatter, no title at the top

Write a high-quality SEO article with this exact title: "${entry.title}"

Topic: ${entry.topic}`;
}

// ── Parse arguments ───────────────────────────────────────────────────────────

let entry;

const jsonFlagIdx = process.argv.indexOf("--json");
if (jsonFlagIdx !== -1) {
  // Structured mode: called from batch-generate.mjs
  const jsonStr = process.argv[jsonFlagIdx + 1];
  if (!jsonStr) {
    console.error("Error: --json flag requires a JSON argument.");
    process.exit(1);
  }
  entry = JSON.parse(jsonStr);
} else {
  // Legacy manual mode: node scripts/generate-article.mjs "some topic"
  const topic = process.argv.slice(2).join(" ").trim();
  if (!topic) {
    console.error('Usage: node scripts/generate-article.mjs "RRSP vs TFSA Canada"');
    console.error('   or: node scripts/generate-article.mjs --json \'{"slug":"...","title":"..."}\'');
    process.exit(1);
  }
  entry = {
    slug: slugify(topic),
    title: topic,
    topic: topic,
    category: "Finance",
    tags: [],
    keywords: [],
    calculatorLink: "/tools/rrsp-refund",
    calculatorCta: "Try the RRSP Refund Calculator",
    incomeLevel: null,
    province: null,
    description: "A calm, practical guide for Canadians.",
  };
}

// ── Validate ──────────────────────────────────────────────────────────────────

if (!process.env.OPENAI_API_KEY) {
  console.error("Missing OPENAI_API_KEY. Add it to .env.local");
  process.exit(1);
}

const outDir = path.join(process.cwd(), "content", "articles");
const outFile = path.join(outDir, `${entry.slug}.md`);

if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

if (fs.existsSync(outFile)) {
  console.log(`[SKIP] ${entry.slug} — file already exists.`);
  process.exit(0);
}

// ── Generate ──────────────────────────────────────────────────────────────────

console.log(`[GENERATING] ${entry.slug}...`);

const prompt = buildPrompt(entry);

const response = await client.responses.create({
  model: "gpt-4.1-mini",
  input: prompt,
});

const body = (response.output_text || "").trim();

if (!body) {
  console.error("No content returned from the model.");
  process.exit(1);
}

const wordCount = body.trim().split(/\s+/).length;
if (wordCount < 1400) {
  console.warn(`[WARN] ${entry.slug} — only ${wordCount} words (target: 1500–2000). Consider regenerating.`);
}

// ── Write ─────────────────────────────────────────────────────────────────────

const tagList = (entry.tags || []).map((t) => `"${t}"`).join(", ");
const keywordList = (entry.keywords || []).map((k) => `"${k}"`).join(", ");
const readingTime = estimateReadingTime(body);

const frontmatter = `---
title: "${entry.title}"
description: "${entry.description}"
slug: "${entry.slug}"
date: "${todayISO()}"
updated: "${todayISO()}"
category: "${entry.category}"
tags: [${tagList}]
readingTime: ${readingTime}
keywords: [${keywordList}]
province: ${entry.province ? `"${entry.province}"` : "null"}
incomeLevel: ${entry.incomeLevel ?? "null"}
calculatorLink: "${entry.calculatorLink}"
---

`;

fs.writeFileSync(outFile, frontmatter + body + "\n", "utf8");
console.log(`[DONE] Wrote: ${outFile} (${wordCount} words, ~${readingTime} min read)`);
