import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import slugify from 'slugify'
import {createClient} from '@sanity/client'

// Manually load .env.local if needed
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
const token = process.env.SANITY_API_TOKEN

if (!projectId) {
  throw new Error(
    'Missing NEXT_PUBLIC_SANITY_PROJECT_ID in .env.local'
  )
}

if (!token) {
  throw new Error(
    'Missing SANITY_API_TOKEN in .env.local'
  )
}

const client = createClient({
  projectId,
  dataset,
  apiVersion: '2025-09-01',
  token,
  useCdn: false,
})

const articlesDir = path.join(process.cwd(), 'content', 'articles')

function markdownToPortableText(markdown) {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n')
  const blocks = []
  let paragraphBuffer = []

  const flushParagraph = () => {
    if (!paragraphBuffer.length) return

    const text = paragraphBuffer.join(' ').trim()
    if (text) {
      blocks.push({
        _type: 'block',
        style: 'normal',
        markDefs: [],
        children: [
          {
            _type: 'span',
            text,
            marks: [],
          },
        ],
      })
    }

    paragraphBuffer = []
  }

  for (const rawLine of lines) {
    const line = rawLine.trim()

    if (!line) {
      flushParagraph()
      continue
    }

    if (line.startsWith('### ')) {
      flushParagraph()
      blocks.push({
        _type: 'block',
        style: 'h3',
        markDefs: [],
        children: [
          {
            _type: 'span',
            text: line.replace(/^###\s+/, ''),
            marks: [],
          },
        ],
      })
      continue
    }

    if (line.startsWith('## ')) {
      flushParagraph()
      blocks.push({
        _type: 'block',
        style: 'h2',
        markDefs: [],
        children: [
          {
            _type: 'span',
            text: line.replace(/^##\s+/, ''),
            marks: [],
          },
        ],
      })
      continue
    }

    if (line.startsWith('# ')) {
      flushParagraph()
      blocks.push({
        _type: 'block',
        style: 'h1',
        markDefs: [],
        children: [
          {
            _type: 'span',
            text: line.replace(/^#\s+/, ''),
            marks: [],
          },
        ],
      })
      continue
    }

    if (line.startsWith('• ') || line.startsWith('- ')) {
      flushParagraph()
      blocks.push({
        _type: 'block',
        style: 'normal',
        listItem: 'bullet',
        level: 1,
        markDefs: [],
        children: [
          {
            _type: 'span',
            text: line.replace(/^[•-]\s+/, ''),
            marks: [],
          },
        ],
      })
      continue
    }

    paragraphBuffer.push(line)
  }

  flushParagraph()
  return blocks
}

async function getCategoryIdByTitle(title) {
  const category = await client.fetch(
    `*[_type == "category" && title == $title][0]{_id}`,
    { title }
  )
  return category?._id || null
}

async function importArticles() {
  if (!fs.existsSync(articlesDir)) {
    throw new Error(`Articles folder not found: ${articlesDir}`)
  }

  const files = fs.readdirSync(articlesDir).filter((f) => f.endsWith('.md'))

  if (files.length === 0) {
    console.log('No markdown files found in content/articles')
    return
  }

  for (const file of files) {
    const fullPath = path.join(articlesDir, file)
    const raw = fs.readFileSync(fullPath, 'utf8')
    const {data, content} = matter(raw)

    const title = data.title || file.replace(/\.md$/, '')
    const slug = data.slug || slugify(title, {lower: true, strict: true})
    const categoryTitle = data.category
    const categoryId = categoryTitle
      ? await getCategoryIdByTitle(categoryTitle)
      : null

    if (categoryTitle && !categoryId) {
      console.warn(
        `Category "${categoryTitle}" not found for "${title}". Importing without category reference.`
      )
    }

    const doc = {
      _id: `article.${slug}`,
      _type: 'article',
      title,
      slug: {
        _type: 'slug',
        current: slug,
      },
      summary: data.description || '',
      content: markdownToPortableText(content),
      author: 'Maple Insight',
      seoTitle: title,
      seoDescription: data.description || '',
      status: 'draft',
      publishedAt: data.updated || data.date || new Date().toISOString(),
    }

    if (categoryId) {
      doc.category = {
        _type: 'reference',
        _ref: categoryId,
      }
    }

    await client.createOrReplace(doc)
    console.log(`Imported: ${title}`)
  }

  console.log('Done importing markdown articles.')
}

importArticles().catch((err) => {
  console.error('Import failed:')
  console.error(err)
  process.exit(1)
})