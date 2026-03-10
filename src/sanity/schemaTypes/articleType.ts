import {defineField, defineType} from 'sanity'

export const articleType = defineType({
  name: 'article',
  title: 'Article',
  type: 'document',
  groups: [
    {name: 'content', title: 'Content', default: true},
    {name: 'media', title: 'Media'},
    {name: 'links', title: 'Links'},
    {name: 'ai', title: 'AI Fields ✦'},
    {name: 'seo', title: 'SEO'},
  ],
  fields: [
    // ─── Required Fields ───
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      group: 'content',
      description: "The article's public-facing headline.",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      group: 'content',
      description: 'URL path segment. Auto-generated from title; only lowercase letters, numbers, and hyphens.',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: (Rule) =>
        Rule.required().custom((slug) => {
          if (!slug?.current) return 'Slug is required'
          if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug.current)) {
            return 'Slug must be lowercase alphanumeric with hyphens only'
          }
          return true
        }),
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'reference',
      group: 'content',
      to: [{type: 'category'}],
      description: 'Primary taxonomy. At least one must be assigned before publish.',
      validation: (Rule) => Rule.required().error('At least one category is required'),
    }),
    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
      group: 'content',
      description: 'Optional keywords for cross-linking and filtering.',
      of: [{type: 'string'}],
      options: {layout: 'tags'},
    }),
    defineField({
      name: 'summary',
      title: 'Excerpt',
      type: 'text',
      group: 'content',
      rows: 3,
      description: 'Short description shown in article cards and search results. Max 160 characters.',
      validation: (Rule) => Rule.max(160).warning('Excerpt should be 160 characters or fewer'),
    }),
    defineField({
      name: 'author',
      title: 'Author',
      type: 'string',
      group: 'content',
      initialValue: 'Maple Insight',
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published Date',
      type: 'datetime',
      group: 'content',
      initialValue: () => new Date().toISOString(),
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'content',
      title: 'Body',
      type: 'array',
      group: 'content',
      description: 'Full article content. Supports rich text, callout boxes, and embedded calculators.',
      of: [
        {
          type: 'block',
          styles: [
            {title: 'Normal', value: 'normal'},
            {title: 'H2', value: 'h2'},
            {title: 'H3', value: 'h3'},
            {title: 'H4', value: 'h4'},
            {title: 'Blockquote', value: 'blockquote'},
          ],
          marks: {
            decorators: [
              {title: 'Strong', value: 'strong'},
              {title: 'Emphasis', value: 'em'},
              {title: 'Code', value: 'code'},
              {title: 'Underline', value: 'underline'},
            ],
            annotations: [
              {
                name: 'link',
                type: 'object',
                title: 'Link',
                fields: [
                  defineField({
                    name: 'href',
                    type: 'url',
                    title: 'URL',
                    validation: (Rule) =>
                      Rule.uri({scheme: ['http', 'https', 'mailto', 'tel']}),
                  }),
                  defineField({
                    name: 'blank',
                    type: 'boolean',
                    title: 'Open in new tab',
                    initialValue: false,
                  }),
                ],
              },
              {
                name: 'affiliateLink',
                type: 'object',
                title: 'Affiliate Link',
                fields: [
                  defineField({
                    name: 'href',
                    type: 'url',
                    title: 'Affiliate URL',
                    validation: (Rule) =>
                      Rule.required().uri({scheme: ['http', 'https']}),
                  }),
                ],
              },
            ],
          },
        },
        {
          type: 'object',
          name: 'calloutBox',
          title: 'Callout Box',
          fields: [
            defineField({
              name: 'type',
              title: 'Type',
              type: 'string',
              options: {
                list: [
                  {title: 'Info', value: 'info'},
                  {title: 'Warning', value: 'warning'},
                  {title: 'Tip', value: 'tip'},
                  {title: 'Important', value: 'important'},
                ],
                layout: 'radio',
              },
              initialValue: 'info',
            }),
            defineField({
              name: 'title',
              title: 'Title',
              type: 'string',
            }),
            defineField({
              name: 'body',
              title: 'Body',
              type: 'text',
              rows: 3,
              validation: (Rule) => Rule.required(),
            }),
          ],
          preview: {
            select: {title: 'title', subtitle: 'type'},
            prepare({title, subtitle}) {
              return {title: title || 'Callout Box', subtitle: subtitle || 'info'}
            },
          },
        },
        {
          type: 'object',
          name: 'proTip',
          title: 'Pro Tip',
          fields: [
            defineField({
              name: 'text',
              title: 'Tip Text',
              type: 'text',
              rows: 2,
              validation: (Rule) => Rule.required(),
            }),
          ],
          preview: {
            select: {subtitle: 'text'},
            prepare({subtitle}) {
              return {title: '💡 Pro Tip', subtitle}
            },
          },
        },
        {
          type: 'object',
          name: 'calculatorEmbed',
          title: 'Calculator Embed',
          fields: [
            defineField({
              name: 'calculatorSlug',
              title: 'Calculator Slug',
              type: 'string',
              description: 'e.g. rrsp-refund, mortgage-comparison, ccb-impact, car-financing',
              validation: (Rule) => Rule.required(),
            }),
          ],
          preview: {
            select: {subtitle: 'calculatorSlug'},
            prepare({subtitle}) {
              return {title: '🧮 Calculator Embed', subtitle}
            },
          },
        },
      ],
      validation: (Rule) => Rule.required(),
    }),
    // ─── Optional Enrichment Fields ───
    defineField({
      name: 'featuredImage',
      title: 'Featured Image',
      type: 'image',
      group: 'media',
      description: 'Main image shown in article cards and social shares.',
      options: {hotspot: true},
      fields: [
        defineField({
          name: 'alt',
          title: 'Alt Text',
          type: 'string',
          description: 'Required when image is set. Describe the image for screen readers and search engines.',
          validation: (Rule) =>
            Rule.custom((alt, ctx) => {
              if ((ctx.document as Record<string, unknown>)?.featuredImage && !alt) {
                return 'Alt text is required when a featured image is set'
              }
              return true
            }),
        }),
      ],
    }),
    defineField({
      name: 'relatedArticles',
      title: 'Related Articles',
      type: 'array',
      group: 'links',
      description: 'Up to 3 related article references shown at the bottom of the article.',
      of: [{type: 'reference', to: [{type: 'article'}]}],
      validation: (Rule) => Rule.max(3),
    }),
    defineField({
      name: 'relatedCalculators',
      title: 'Related Calculators',
      type: 'array',
      group: 'links',
      description: "Up to 3 calculator references shown in the 'Try These Calculators' section.",
      of: [{type: 'reference', to: [{type: 'calculator'}]}],
      validation: (Rule) => Rule.max(3),
    }),
    defineField({
      name: 'journeyStage',
      title: 'Journey Stage',
      type: 'string',
      group: 'links',
      description: 'Maps this article to a stage on the Start Here page.',
      options: {
        list: [
          {title: '🏦 First 90 Days', value: 'first-90-days'},
          {title: '📋 Tax Season', value: 'tax-season'},
          {title: '📈 Growing Your Money', value: 'growing-your-money'},
          {title: '🏠 Big Decisions', value: 'big-decisions'},
        ],
      },
    }),
    // ─── SEO Fields ───
    defineField({
      name: 'seoTitle',
      title: 'Meta Title',
      type: 'string',
      group: 'seo',
      description: 'Overrides the page <title> tag. Leave blank to use article title. Max 60 characters.',
      validation: (Rule) => Rule.max(60).warning('Meta title should be 60 characters or fewer'),
    }),
    defineField({
      name: 'seoDescription',
      title: 'Meta Description',
      type: 'text',
      group: 'seo',
      rows: 3,
      description: 'Shown in search result snippets. Max 160 characters.',
      validation: (Rule) => Rule.max(160).warning('Meta description should be 160 characters or fewer'),
    }),
    defineField({
      name: 'canonicalUrl',
      title: 'Canonical URL',
      type: 'url',
      group: 'seo',
      description: 'Set if this content appears elsewhere and you want to avoid duplicate indexing.',
      validation: (Rule) => Rule.uri({scheme: ['http', 'https']}),
    }),
    defineField({
      name: 'noIndex',
      title: 'Hide from Search Engines',
      type: 'boolean',
      group: 'seo',
      description: 'Adds a noindex directive. Use for drafts or private articles only.',
      initialValue: false,
    }),
    // ─── AI-Optimization Fields ───
    defineField({
      name: 'answerSummary',
      group: 'ai',
      title: 'Answer Summary ✦',
      type: 'text',
      rows: 3,
      description:
        'A direct answer to the question this article addresses. Used for AI search, featured snippets, and schema.org FAQPage markup. Required before publish.',
      validation: (Rule) =>
        Rule.required()
          .min(10)
          .max(300)
          .error('Answer Summary is required (min 10, max 300 characters)'),
    }),
    defineField({
      name: 'faqItems',
      title: 'FAQ Items',
      type: 'array',
      group: 'ai',
      description: 'Structured Q&A pairs rendered as schema.org FAQPage markup. Up to 10 items.',
      of: [
        {
          type: 'object',
          name: 'faqItem',
          title: 'FAQ Item',
          fields: [
            defineField({
              name: 'question',
              title: 'Question',
              type: 'string',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'answer',
              title: 'Answer',
              type: 'text',
              rows: 2,
              validation: (Rule) => Rule.required().min(10).error('Answer must be at least 10 characters'),
            }),
            defineField({
              name: 'anchorSlug',
              title: 'Anchor Slug',
              type: 'slug',
              description: 'Auto-generated from question. Used for deep-linking (e.g. /articles/tfsa#faq-what-is-a-tfsa).',
              options: {source: 'question'},
            }),
          ],
          preview: {
            select: {title: 'question', subtitle: 'answer'},
          },
        },
      ],
      validation: (Rule) => Rule.max(10),
    }),
    // ─── Status ───
    defineField({
      name: 'status',
      group: 'content',
      title: 'Status',
      type: 'string',
      options: {
        list: [
          {title: 'Draft', value: 'draft'},
          {title: 'Review', value: 'review'},
          {title: 'Published', value: 'published'},
        ],
        layout: 'radio',
      },
      initialValue: 'draft',
    }),
    defineField({
      name: 'articleType',
      title: 'Article Type',
      type: 'string',
      group: 'content',
      description: 'Controls which optional sections (e.g. Example Scenarios) are shown in the article template.',
      options: {
        list: [
          {title: 'Guide', value: 'guide'},
          {title: 'Explainer', value: 'explainer'},
          {title: 'News', value: 'news'},
          {title: 'Tool Page', value: 'tool-page'},
        ],
        layout: 'radio',
      },
      initialValue: 'guide',
    }),
    defineField({
      name: 'exampleScenarios',
      title: 'Example Scenarios',
      type: 'array',
      group: 'content',
      description: 'Concrete numeric examples shown in guide-type articles. Add 1–3 scenarios.',
      of: [
        {
          type: 'object',
          name: 'exampleScenario',
          title: 'Example Scenario',
          fields: [
            defineField({
              name: 'title',
              title: 'Scenario Title',
              type: 'string',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'body',
              title: 'Scenario Body',
              type: 'text',
              rows: 4,
              description: 'Include specific numbers, names, and outcomes.',
              validation: (Rule) => Rule.required(),
            }),
          ],
          preview: {
            select: {title: 'title', subtitle: 'body'},
            prepare({title, subtitle}: {title?: string; subtitle?: string}) {
              return {title: title || 'Example Scenario', subtitle: subtitle?.slice(0, 80)}
            },
          },
        },
      ],
    }),
  ],
  orderings: [
    {
      title: 'Published Date, Newest',
      name: 'publishedAtDesc',
      by: [{field: 'publishedAt', direction: 'desc'}],
    },
    {
      title: 'Title A–Z',
      name: 'titleAsc',
      by: [{field: 'title', direction: 'asc'}],
    },
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'summary',
      media: 'featuredImage',
    },
    prepare({title, subtitle, media}: {title?: string; subtitle?: string; media?: string}) {
      return {
        title: title || 'Untitled',
        subtitle: subtitle ? subtitle.slice(0, 80) : 'No excerpt',
        media,
      }
    },
  },
})
