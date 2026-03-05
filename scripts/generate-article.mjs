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

const topic = process.argv.slice(2).join(" ").trim();
if (!topic) {
  console.error('Usage: node scripts/generate-article.mjs "RRSP vs TFSA Canada"');
  process.exit(1);
}

if (!process.env.OPENAI_API_KEY) {
  console.error("Missing OPENAI_API_KEY. Put it in .env.local");
  process.exit(1);
}

const slug = slugify(topic);
const outDir = path.join(process.cwd(), "content", "articles");
const outFile = path.join(outDir, `${slug}.md`);

if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const prompt = `
You are writing for MapleInsight.ca.

Voice: calm, confident, clean, educational.
Audience: Canadians (families, newcomers). Practical personal finance.

Write a high-quality SEO article (900–1400 words) about:
"${topic}"

Requirements:
- Simple language (grade 8–10).
- Use clear H2/H3 headings.
- Include one concrete example calculation (with numbers).
- Include an FAQ section (5–7 questions).
- End with a short conclusion.
- Avoid hype, fear, or sales language.

Return ONLY the markdown for the article body (no frontmatter).
`;

const response = await client.responses.create({
  model: "gpt-4.1-mini",
  input: prompt,
});

const body = (response.output_text || "").trim();

if (!body) {
  console.error("No content returned from the model.");
  process.exit(1);
}

const frontmatter = `---
title: "${topic}"
description: "A calm, practical guide for Canadians."
slug: "${slug}"
date: "${todayISO()}"
updated: "${todayISO()}"
category: "Finance"
tags: []
readingTime: 7
---

`;

fs.writeFileSync(outFile, frontmatter + body + "\n", "utf8");
console.log(`✅ Wrote: ${outFile}`);