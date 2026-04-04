import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import {createClient} from '@sanity/client'
import dotenv from 'dotenv'

dotenv.config({path: '.env.local'})

const DRY_RUN = process.argv.includes('--dry-run')
const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
const token = process.env.SANITY_API_TOKEN

if (!projectId) throw new Error('Missing NEXT_PUBLIC_SANITY_PROJECT_ID in .env.local')
if (!token && !DRY_RUN) throw new Error('Missing SANITY_API_TOKEN in .env.local')

const client = createClient({
  projectId,
  dataset,
  apiVersion: '2026-04-01',
  token,
  useCdn: false,
})

const ARTICLE_PATH = path.join(process.cwd(), 'docs', 'pillar-article', 'financially-ready-move-to-canada.md')
const TOOL_EMBED_PATTERN = /^<!--\s*TOOL_EMBED:\s*([a-z0-9-]+)\s*-->$/i
const CROSS_LINK_SLUGS = [
  'express-entry-proof-of-funds',
  'study-permit-proof-of-funds',
  'what-is-a-gic-canada',
  'newcomer-bank-account',
  'provincial-health-insurance',
]

function rkey() {
  return Math.random().toString(36).slice(2, 10)
}

function slugify(input) {
  return String(input || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 96)
}

function normalizeDate(value) {
  if (!value) return undefined
  return new Date(String(value)).toISOString()
}

function splitTableRow(line) {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cell.trim())
}

function isTableDivider(line) {
  const cells = splitTableRow(line)
  return cells.length > 0 && cells.every((cell) => /^:?-{3,}:?$/.test(cell))
}

function makeTextSpan(text, marks = []) {
  return {_type: 'span', _key: rkey(), text, marks}
}

function parseInlineMarkdown(text, markDefs = []) {
  const children = []
  const pattern = /(\[([^\]]+)\]\(([^)]+)\))|(\*\*([^*]+)\*\*)|(\*([^*]+)\*)/g
  let lastIndex = 0
  let match

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      children.push(makeTextSpan(text.slice(lastIndex, match.index)))
    }

    if (match[1]) {
      const key = rkey()
      markDefs.push({
        _key: key,
        _type: 'link',
        href: match[3],
        blank: /^https?:\/\//.test(match[3]),
      })
      children.push(makeTextSpan(match[2], [key]))
    } else if (match[4]) {
      children.push(makeTextSpan(match[5], ['strong']))
    } else if (match[6]) {
      children.push(makeTextSpan(match[7], ['em']))
    }

    lastIndex = pattern.lastIndex
  }

  if (lastIndex < text.length) {
    children.push(makeTextSpan(text.slice(lastIndex)))
  }

  return children.length ? children : [makeTextSpan(text)]
}

function makeBlock(text, style = 'normal', extras = {}) {
  const markDefs = []
  return {
    _type: 'block',
    _key: rkey(),
    style,
    markDefs,
    children: parseInlineMarkdown(text, markDefs),
    ...extras,
  }
}

function makeParagraph(text) {
  return makeBlock(text, 'normal')
}

function makeHeading(text, style) {
  return makeBlock(text, style)
}

function makeListItem(text, listItem) {
  return makeBlock(text, 'normal', {listItem, level: 1})
}

function makeDivider() {
  return {_type: 'divider', _key: rkey()}
}

function makeToolEmbed(toolId) {
  return {
    _type: 'toolEmbed',
    _key: rkey(),
    toolId,
    title: toolId === 'settlement-planner' ? 'Settlement Planner' : toolId,
    description:
      toolId === 'settlement-planner'
        ? 'Calculate your personalized settlement costs'
        : undefined,
  }
}

function makeMarkdownTable(lines) {
  const rows = lines
    .filter((line, index) => !(index === 1 && isTableDivider(line)))
    .map((line) => ({
      _key: rkey(),
      cells: splitTableRow(line),
    }))

  return {
    _type: 'markdownTable',
    _key: rkey(),
    rows,
  }
}

function extractAnswerSummary(frontmatter, lines) {
  if (typeof frontmatter.answerSummary === 'string' && frontmatter.answerSummary.trim()) {
    return frontmatter.answerSummary.trim()
  }

  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line) continue
    if (line.startsWith('#')) continue
    if (line.startsWith('|')) continue
    if (line === '---') continue
    if (TOOL_EMBED_PATTERN.test(line)) continue
    return line.replace(/\*\*/g, '').replace(/\*/g, '').trim()
  }

  return String(frontmatter.excerpt || frontmatter.metaDescription || frontmatter.title || '').trim()
}

function parseFaqItems(lines) {
  const items = []
  let inFaq = false
  let currentQuestion = null
  let answerLines = []

  const pushItem = () => {
    if (!currentQuestion) return
    const answer = answerLines.join(' ').trim()
    if (!answer) return
    items.push({
      _key: rkey(),
      question: currentQuestion,
      answer,
      anchorSlug: {
        _type: 'slug',
        current: slugify(currentQuestion),
      },
    })
    currentQuestion = null
    answerLines = []
  }

  for (const rawLine of lines) {
    const line = rawLine.trim()

    if (line === '## Frequently Asked Questions' || line === '## FAQ') {
      inFaq = true
      continue
    }

    if (!inFaq) continue

    if (line.startsWith('## ') && !line.startsWith('### ')) {
      pushItem()
      break
    }

    if (line.startsWith('### ')) {
      pushItem()
      currentQuestion = line.replace(/^###\s+/, '').trim()
      continue
    }

    if (!line || line === '---') continue
    if (currentQuestion) answerLines.push(line.replace(/\*\*/g, '').replace(/\*/g, ''))
  }

  pushItem()
  return items
}

function getContentLines(lines) {
  const result = []
  let inFaq = false

  for (const rawLine of lines) {
    const line = rawLine.trim()

    if (line === '## Frequently Asked Questions' || line === '## FAQ') {
      inFaq = true
      continue
    }

    if (inFaq && line.startsWith('## ') && !line.startsWith('### ')) {
      inFaq = false
    }

    if (!inFaq) result.push(rawLine)
  }

  return result
}

function markdownToPortableText(lines) {
  const blocks = []
  let paragraphLines = []
  let tableLines = []

  const flushParagraph = () => {
    const text = paragraphLines.join(' ').trim()
    if (text) blocks.push(makeParagraph(text))
    paragraphLines = []
  }

  const flushTable = () => {
    if (tableLines.length > 0) {
      blocks.push(makeMarkdownTable(tableLines))
      tableLines = []
    }
  }

  for (const rawLine of lines) {
    const line = rawLine.trim()

    if (line.startsWith('|')) {
      flushParagraph()
      tableLines.push(line)
      continue
    }

    flushTable()

    if (!line) {
      flushParagraph()
      continue
    }

    if (line === '---') {
      flushParagraph()
      blocks.push(makeDivider())
      continue
    }

    const toolMatch = line.match(TOOL_EMBED_PATTERN)
    if (toolMatch) {
      flushParagraph()
      blocks.push(makeToolEmbed(toolMatch[1]))
      continue
    }

    if (line.startsWith('# ') && !line.startsWith('## ')) {
      flushParagraph()
      continue
    }

    if (line.startsWith('### ')) {
      flushParagraph()
      blocks.push(makeHeading(line.replace(/^###\s+/, ''), 'h3'))
      continue
    }

    if (line.startsWith('## ')) {
      flushParagraph()
      blocks.push(makeHeading(line.replace(/^##\s+/, ''), 'h2'))
      continue
    }

    if (line.startsWith('> ')) {
      flushParagraph()
      blocks.push(makeBlock(line.replace(/^>\s+/, ''), 'blockquote'))
      continue
    }

    if (/^[-*]\s/.test(line)) {
      flushParagraph()
      blocks.push(makeListItem(line.replace(/^[-*]\s+/, ''), 'bullet'))
      continue
    }

    if (/^\d+\.\s/.test(line)) {
      flushParagraph()
      blocks.push(makeListItem(line.replace(/^\d+\.\s+/, ''), 'number'))
      continue
    }

    paragraphLines.push(line)
  }

  flushParagraph()
  flushTable()

  return blocks
}

async function getOrCreateCategory(title) {
  const existing = await client.fetch(
    `*[_type == "category" && title == $title][0]{_id}`,
    {title},
  )

  if (existing?._id) return existing._id

  const slug = slugify(title)
  const doc = await client.createOrReplace({
    _id: `category.${slug}`,
    _type: 'category',
    title,
    slug: {_type: 'slug', current: slug},
  })

  console.log(`Created category: ${title}`)
  return doc._id
}

function normalizeSources(sources) {
  if (!Array.isArray(sources)) return []
  return sources
    .filter((source) => source && typeof source.url === 'string')
    .map((source) => {
      const label = String(source.label || source.sourceName || source.documentTitle || source.url).trim()
      return {
        _key: rkey(),
        sourceName: label,
        documentTitle: label,
        url: source.url,
        accessedDate: undefined,
      }
    })
}

async function resolveReferences(type, slugs) {
  if (!Array.isArray(slugs) || slugs.length === 0) return {refs: [], missing: []}

  const query = `*[_type == $type && slug.current in $slugs]{_id, "slug": slug.current}`
  const docs = await client.fetch(query, {type, slugs})
  const bySlug = new Map(docs.map((doc) => [doc.slug, doc._id]))

  const refs = []
  const missing = []

  for (const slug of slugs) {
    const id = bySlug.get(slug)
    if (!id) {
      missing.push(slug)
      continue
    }
    refs.push({_type: 'reference', _key: rkey(), _ref: id})
  }

  return {refs, missing}
}

async function addCrossLinks(pillarArticleId) {
  const docs = await client.fetch(
    `*[_type == "article" && slug.current in $slugs]{_id, "slug": slug.current, relatedArticles}`,
    {slugs: CROSS_LINK_SLUGS},
  )

  let updatedCount = 0
  for (const doc of docs) {
    const alreadyLinked = Array.isArray(doc.relatedArticles)
      && doc.relatedArticles.some((ref) => ref?._ref === pillarArticleId)

    if (alreadyLinked) continue

    await client
      .patch(doc._id)
      .setIfMissing({relatedArticles: []})
      .append('relatedArticles', [{_type: 'reference', _ref: pillarArticleId, _key: rkey()}])
      .commit()

    updatedCount += 1
    console.log(`Cross-linked pillar article from: ${doc.slug}`)
  }

  const foundSlugs = new Set(docs.map((doc) => doc.slug))
  const missingDocs = CROSS_LINK_SLUGS.filter((slug) => !foundSlugs.has(slug))
  for (const slug of missingDocs) {
    console.warn(`Cross-link target not found: ${slug}`)
  }

  return updatedCount
}

async function verifyImport(slug) {
  return client.fetch(
    `*[_type == "article" && slug.current == $slug][0]{
      title,
      "slug": slug.current,
      isPillar,
      "relatedCount": count(relatedArticles),
      "contentBlockCount": count(content),
      "hasToolEmbed": count(content[_type == "toolEmbed"]) > 0
    }`,
    {slug},
  )
}

async function main() {
  const raw = fs.readFileSync(ARTICLE_PATH, 'utf8')
  const {data, content} = matter(raw)
  const lines = content.replace(/\r\n/g, '\n').split('\n')
  const contentLines = getContentLines(lines)
  const portableContent = markdownToPortableText(contentLines)
  const faqItems = parseFaqItems(lines)
  const answerSummary = extractAnswerSummary(data, lines)

  if (DRY_RUN) {
    console.log('DRY RUN')
    console.log(`Title: ${data.title}`)
    console.log(`Slug: ${data.slug}`)
    console.log(`Portable Text blocks: ${portableContent.length}`)
    console.log(`FAQ items: ${faqItems.length}`)
    console.log(`Has tool embed: ${portableContent.some((block) => block._type === 'toolEmbed')}`)
    console.log(`Has table: ${portableContent.some((block) => block._type === 'markdownTable')}`)
    console.log(`Answer summary: ${answerSummary}`)
    return
  }

  const categoryId = await getOrCreateCategory(String(data.category))
  const relatedArticles = await resolveReferences('article', data.relatedArticles || [])
  const relatedCalculators = await resolveReferences('calculator', data.relatedCalculators || [])

  for (const slug of relatedArticles.missing) {
    console.warn(`Related article not found, skipping: ${slug}`)
  }
  for (const slug of relatedCalculators.missing) {
    console.warn(`Related calculator not found, skipping: ${slug}`)
  }

  const doc = {
    _id: `article.${data.slug}`,
    _type: 'article',
    title: String(data.title),
    slug: {_type: 'slug', current: String(data.slug)},
    category: {_type: 'reference', _ref: categoryId},
    tags: Array.isArray(data.tags) ? data.tags : [],
    summary: String(data.excerpt || ''),
    seoTitle: String(data.metaTitle || data.seoTitle || data.title),
    seoDescription: String(data.metaDescription || data.seoDescription || data.excerpt || ''),
    publishedAt: normalizeDate(data.publishedAt) || new Date().toISOString(),
    author: String(data.author || 'Maple Insight'),
    content: portableContent,
    status: 'published',
    articleType: 'guide',
    answerSummary,
    faqItems,
    isPillar: Boolean(data.isPillar),
    sources: normalizeSources(data.sources),
    relatedArticles: relatedArticles.refs,
    relatedCalculators: relatedCalculators.refs,
    seoSchema: Array.isArray(data.seoSchema)
      ? data.seoSchema
          .filter((item) => item && typeof item.type === 'string' && item.type.trim())
          .map((item) => ({_key: rkey(), type: item.type.trim()}))
      : [],
  }

  await client.createOrReplace(doc)
  console.log(`Imported pillar article: ${doc.title}`)

  const crossLinkCount = await addCrossLinks(doc._id)
  const verification = await verifyImport(String(data.slug))

  console.log('Verification:', verification)
  console.log(`Cross-links added: ${crossLinkCount}`)
}

main().catch((error) => {
  console.error('\nImport failed:')
  console.error(error.message || error)
  process.exit(1)
})
