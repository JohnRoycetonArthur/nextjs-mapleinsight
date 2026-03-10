import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { createClient } from '@sanity/client'
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

// ── Sanity client ─────────────────────────────────────────────────────────────

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const dataset   = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
const token     = process.env.SANITY_API_TOKEN

if (!projectId) throw new Error('Missing NEXT_PUBLIC_SANITY_PROJECT_ID in .env.local')
if (!token)     throw new Error('Missing SANITY_API_TOKEN in .env.local')

const client = createClient({
  projectId,
  dataset,
  apiVersion: '2025-09-01',
  token,
  useCdn: false,
})

const ARTICLES_DIR = path.join(process.cwd(), 'docs', '5.4')

// ── Helpers ───────────────────────────────────────────────────────────────────

function rkey() {
  return Math.random().toString(36).slice(2, 10)
}

/** Parse **bold** inline marks into Sanity span children. */
function makeSpans(text) {
  const parts = []
  const re = /\*\*(.+?)\*\*/g
  let last = 0, m
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) {
      parts.push({ _type: 'span', _key: rkey(), text: text.slice(last, m.index), marks: [] })
    }
    parts.push({ _type: 'span', _key: rkey(), text: m[1], marks: ['strong'] })
    last = m.index + m[0].length
  }
  if (last < text.length) {
    parts.push({ _type: 'span', _key: rkey(), text: text.slice(last), marks: [] })
  }
  return parts.length ? parts : [{ _type: 'span', _key: rkey(), text, marks: [] }]
}

function makeParagraph(text) {
  return { _type: 'block', _key: rkey(), style: 'normal', markDefs: [], children: makeSpans(text) }
}

function makeHeading(text, style) {
  return { _type: 'block', _key: rkey(), style, markDefs: [], children: [{ _type: 'span', _key: rkey(), text, marks: [] }] }
}

function makeBullet(text) {
  return { _type: 'block', _key: rkey(), style: 'normal', listItem: 'bullet', level: 1, markDefs: [], children: makeSpans(text) }
}

function makeNumbered(text) {
  return { _type: 'block', _key: rkey(), style: 'normal', listItem: 'number', level: 1, markDefs: [], children: makeSpans(text) }
}

// ── Markdown → Portable Text ──────────────────────────────────────────────────

function markdownToPortableText(lines) {
  const blocks = []
  let paraBuffer = []

  const flushPara = () => {
    const text = paraBuffer.join(' ').trim()
    if (text) blocks.push(makeParagraph(text))
    paraBuffer = []
  }

  for (const rawLine of lines) {
    const line = rawLine.trim()

    // Skip blank lines, HR separators, table rows
    if (!line || line === '---' || line.startsWith('|')) { flushPara(); continue }

    // Skip disclaimer lines: starts and ends with * but not **
    if (line.startsWith('*') && line.endsWith('*') && !line.startsWith('**')) { continue }

    // Skip the answer summary line (extracted separately)
    if (/^\*\*Answer [Ss]ummary:/.test(line)) continue

    // Headings — skip H1 (already in title field)
    if (line.startsWith('# ') && !line.startsWith('## ')) { flushPara(); continue }
    if (line.startsWith('### ')) { flushPara(); blocks.push(makeHeading(line.replace(/^###\s+/, ''), 'h3')); continue }
    if (line.startsWith('## '))  { flushPara(); blocks.push(makeHeading(line.replace(/^##\s+/, ''), 'h2')); continue }

    // Blockquote
    if (line.startsWith('> ')) { flushPara(); blocks.push(makeParagraph(line.replace(/^>\s+/, ''))); continue }

    // Bullet list
    if (/^[-•]\s/.test(line)) { flushPara(); blocks.push(makeBullet(line.replace(/^[-•]\s+/, ''))); continue }

    // Numbered list
    if (/^\d+\.\s/.test(line)) { flushPara(); blocks.push(makeNumbered(line.replace(/^\d+\.\s+/, ''))); continue }

    // Regular paragraph text
    paraBuffer.push(line)
  }

  flushPara()
  return blocks
}

// ── Section parsers ───────────────────────────────────────────────────────────

function parseAnswerSummary(lines) {
  for (const line of lines) {
    const m = line.trim().match(/^\*\*Answer [Ss]ummary:\*\*\s*(.+)/)
    if (m) return m[1].trim()
  }
  return null
}

function parseFaqItems(lines) {
  const items = []
  let inFaq = false
  let currentQ = null
  let answerLines = []

  const pushItem = () => {
    if (!currentQ) return
    items.push({
      _key: rkey(),
      question: currentQ,
      answer: answerLines.join(' ').trim(),
      anchorSlug: {
        _type: 'slug',
        current: currentQ.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 96),
      },
    })
    currentQ = null
    answerLines = []
  }

  for (const rawLine of lines) {
    const line = rawLine.trim()

    if (line === '## FAQ' || line === '## Frequently Asked Questions') {
      inFaq = true
      continue
    }
    if (!inFaq) continue

    // Another H2 signals end of FAQ section
    if (line.startsWith('## ')) { pushItem(); break }

    // Skip HR and empty
    if (!line || line === '---') continue

    const qMatch = line.match(/^\*\*Q:\s*(.+?)\*\*$/)
    if (qMatch) {
      pushItem()
      currentQ = qMatch[1].trim().replace(/\?$/, '').trim() + '?'
      continue
    }

    if (currentQ) {
      // Strip leading "A:" if present
      const cleaned = line.replace(/^A:\s*/, '').trim()
      if (cleaned) answerLines.push(cleaned)
    }
  }
  pushItem()
  return items
}

function parseExampleScenarios(lines) {
  let inExample = false
  const bodyLines = []

  for (const rawLine of lines) {
    const line = rawLine.trim()

    if (line === '## Example Scenario' || line === '## Example') {
      inExample = true
      continue
    }
    if (!inExample) continue

    // Another H2 or HR ends the section
    if (line === '---' || (line.startsWith('## ') && bodyLines.length > 0)) break

    if (line) bodyLines.push(line)
  }

  if (!bodyLines.length) return []

  return [{
    _key: rkey(),
    title: 'Example Scenario',
    body: bodyLines.join('\n').replace(/\*\*/g, ''),
  }]
}

/** Remove FAQ and Example Scenario sections from lines before converting to content. */
function getContentLines(lines) {
  const SKIP_HEADERS = new Set([
    '## FAQ',
    '## Frequently Asked Questions',
    '## Example Scenario',
    '## Example',
  ])
  const result = []
  let skip = false

  for (const rawLine of lines) {
    const line = rawLine.trim()

    if (SKIP_HEADERS.has(line)) { skip = true; continue }

    if (skip && line.startsWith('## ')) {
      skip = false // resume at next sibling H2
    }

    if (!skip) result.push(rawLine)
  }
  return result
}

// ── Category: fetch or create ─────────────────────────────────────────────────

async function getOrCreateCategory(title) {
  const existing = await client.fetch(
    `*[_type == "category" && title == $title][0]{_id}`,
    { title }
  )
  if (existing?._id) return existing._id

  const id = `category.${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
  const doc = await client.createOrReplace({
    _id: id,
    _type: 'category',
    title,
    slug: { _type: 'slug', current: title.toLowerCase().replace(/[^a-z0-9]+/g, '-') },
  })
  console.log(`  ↳ Created category: ${title}`)
  return doc._id
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function importArticles() {
  const files = fs.readdirSync(ARTICLES_DIR)
    .filter(f => /^\d{2}-/.test(f) && f.endsWith('.md'))
    .sort()

  if (!files.length) throw new Error(`No numbered .md files found in ${ARTICLES_DIR}`)
  console.log(`Found ${files.length} article files in docs/5.4/\n`)

  for (const file of files) {
    const raw = fs.readFileSync(path.join(ARTICLES_DIR, file), 'utf8')
    const { data, content } = matter(raw)

    const lines = content.replace(/\r\n/g, '\n').split('\n')
    const slug  = String(data.slug)

    const categoryId      = await getOrCreateCategory(String(data.category))
    const answerSummary   = parseAnswerSummary(lines)
    const faqItems        = parseFaqItems(lines)
    const exampleScenarios = parseExampleScenarios(lines)
    const contentLines    = getContentLines(lines)
    const portableContent = markdownToPortableText(contentLines)

    const doc = {
      _id: `article.${slug}`,
      _type: 'article',
      title: String(data.title),
      slug: { _type: 'slug', current: slug },
      summary: String(data.excerpt || ''),
      content: portableContent,
      author: 'Maple Insight',
      seoTitle: String(data.seoTitle || data.title),
      seoDescription: String(data.seoDescription || data.excerpt || ''),
      publishedAt: data.publishedAt
        ? new Date(String(data.publishedAt)).toISOString()
        : new Date().toISOString(),
      status: 'published',
      articleType: 'guide',
      category: { _type: 'reference', _ref: categoryId },
      ...(answerSummary                && { answerSummary }),
      ...(faqItems.length              && { faqItems }),
      ...(exampleScenarios.length      && { exampleScenarios }),
    }

    await client.createOrReplace(doc)
    console.log(`✓  Published: ${data.title}`)
  }

  console.log(`\n✅ Done — ${files.length} articles published to Sanity.`)
}

importArticles().catch(err => {
  console.error('\n❌ Import failed:')
  console.error(err.message || err)
  process.exit(1)
})
