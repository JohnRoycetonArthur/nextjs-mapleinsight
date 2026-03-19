import { defineField, defineType } from 'sanity'

export const consultantType = defineType({
  name: 'consultant',
  title: 'Consultant',
  type: 'document',
  groups: [
    { name: 'identity',  title: 'Identity',      default: true },
    { name: 'branding',  title: 'Branding'                     },
    { name: 'policy',    title: 'Email Policy'                  },
    { name: 'meta',      title: 'Meta'                         },
  ],
  fields: [
    // ─── Identity ────────────────────────────────────────────────────────────
    defineField({
      name: 'displayName',
      title: 'Display Name',
      type: 'string',
      group: 'identity',
      description: 'Name shown to applicants (e.g. "Jane Smith, RCIC").',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'companyName',
      title: 'Company Name',
      type: 'string',
      group: 'identity',
      description: 'Firm or practice name.',
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      group: 'identity',
      description: 'Unique URL identifier — used in branded links (e.g. /planner/acme).',
      options: { source: 'displayName', maxLength: 64 },
      validation: (Rule) =>
        Rule.required().custom(async (slug, context) => {
          if (!slug?.current) return 'Slug is required'
          if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug.current)) {
            return 'Slug must be lowercase alphanumeric with hyphens only'
          }
          const { document, getClient } = context
          const client = getClient({ apiVersion: '2024-01-01' })
          const id = document?._id?.replace(/^drafts\./, '')
          const existing = await client.fetch<string | null>(
            `*[_type == "consultant" && slug.current == $slug && _id != $id][0]._id`,
            { slug: slug.current, id: id ?? '' },
          )
          return existing ? 'This slug is already in use by another consultant' : true
        }),
    }),
    defineField({
      name: 'primaryEmail',
      title: 'Primary Email',
      type: 'string',
      group: 'identity',
      description: 'Internal billing / admin email — never exposed in public API responses.',
      validation: (Rule) =>
        Rule.required().email().error('A valid email address is required'),
    }),
    defineField({
      name: 'replyToEmail',
      title: 'Reply-To Email (optional)',
      type: 'string',
      group: 'identity',
      description: 'Optional reply-to address used in outbound emails to applicants.',
      validation: (Rule) => Rule.email().warning('Should be a valid email address'),
    }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      group: 'identity',
      options: {
        list: [
          { title: 'Active',    value: 'active'   },
          { title: 'Paused',    value: 'paused'   },
          { title: 'Disabled',  value: 'disabled' },
        ],
        layout: 'radio',
      },
      initialValue: 'active',
      validation: (Rule) => Rule.required(),
    }),

    // ─── Branding ─────────────────────────────────────────────────────────────
    defineField({
      name: 'logo',
      title: 'Logo',
      type: 'image',
      group: 'branding',
      description: 'Consultant logo — displayed in the branded planner header.',
      options: { hotspot: true },
    }),
    defineField({
      name: 'theme',
      title: 'Theme',
      type: 'object',
      group: 'branding',
      fields: [
        defineField({
          name: 'accentColor',
          title: 'Accent Colour',
          type: 'string',
          description: 'Hex colour code for branded UI elements (e.g. #1B7A4A).',
          validation: (Rule) =>
            Rule.regex(/^#[0-9A-Fa-f]{3,6}$/, {
              name: 'hex colour',
              invert: false,
            }).warning('Should be a valid hex colour, e.g. #1B7A4A'),
        }),
        defineField({
          name: 'footerText',
          title: 'Footer Text',
          type: 'string',
          description: 'Short footer disclaimer shown in branded planner pages.',
        }),
      ],
    }),

    // ─── Email Policy ─────────────────────────────────────────────────────────
    defineField({
      name: 'emailPolicy',
      title: 'Email Policy',
      type: 'object',
      group: 'policy',
      fields: [
        defineField({
          name: 'maxSendsPerDay',
          title: 'Max Sends Per Day',
          type: 'number',
          initialValue: 50,
          validation: (Rule) => Rule.required().min(1).max(1000),
        }),
        defineField({
          name: 'maxSendsPerHour',
          title: 'Max Sends Per Hour',
          type: 'number',
          initialValue: 10,
          validation: (Rule) => Rule.required().min(1).max(200),
        }),
      ],
    }),

    // ─── Meta ─────────────────────────────────────────────────────────────────
    defineField({
      name: 'createdAt',
      title: 'Created At',
      type: 'datetime',
      group: 'meta',
      initialValue: () => new Date().toISOString(),
    }),
    defineField({
      name: 'updatedAt',
      title: 'Updated At',
      type: 'datetime',
      group: 'meta',
    }),
    defineField({
      name: 'notes',
      title: 'Internal Notes',
      type: 'text',
      group: 'meta',
      rows: 3,
      description: 'Internal notes — never exposed publicly.',
    }),
  ],

  preview: {
    select: {
      title:    'displayName',
      subtitle: 'companyName',
      media:    'logo',
      status:   'status',
    },
    prepare({ title, subtitle, media, status }) {
      const badge = status === 'active' ? '🟢' : status === 'paused' ? '🟡' : '🔴'
      return {
        title:    `${badge} ${title ?? 'Unnamed Consultant'}`,
        subtitle: subtitle ?? '',
        media,
      }
    },
  },
})
