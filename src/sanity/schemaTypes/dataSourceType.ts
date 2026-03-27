import { defineField, defineType } from 'sanity'

export const dataSourceType = defineType({
  name: 'dataSource',
  title: 'Data Source',
  type: 'document',
  fields: [
    defineField({
      name: 'key',
      title: 'Key',
      type: 'slug',
      description: 'Unique programmatic identifier (e.g. "ircc-fee-schedule", "cmhc-toronto-rent"). Used to tag engine line items.',
      options: { source: 'name', maxLength: 96 },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'name',
      title: 'Source Name',
      type: 'string',
      description: 'Human-readable name (e.g. "IRCC Fee Schedule").',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'url',
      title: 'URL',
      type: 'url',
      description: 'Link to the authoritative page.',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'effectiveDate',
      title: 'Effective Date',
      type: 'date',
      description: 'When this data took effect (ISO date).',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'lastVerified',
      title: 'Last Verified',
      type: 'datetime',
      description: 'When the Maple Insight team last verified this data against the authoritative source.',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'string',
      description: 'Determines badge color in the report.',
      options: {
        list: [
          { title: 'Regulatory (Government)',  value: 'regulatory' },
          { title: 'Authority Baseline (CMHC/Transit)', value: 'authority' },
          { title: 'Estimate (Internal)',       value: 'estimate' },
        ],
        layout: 'radio',
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'appliesTo',
      title: 'Applies To (Engine Keys)',
      type: 'array',
      of: [{ type: 'string' }],
      description: 'Engine variable keys governed by this source (e.g. ["ee_processing_fee", "ee_rprf"]).',
    }),
    defineField({
      name: 'notes',
      title: 'Notes',
      type: 'text',
      rows: 3,
      description: 'Caveats, update schedule, or anything consultants should know.',
    }),
  ],

  preview: {
    select: {
      title:    'name',
      subtitle: 'category',
      slug:     'key.current',
    },
    prepare({ title, subtitle, slug }) {
      const badge = subtitle === 'regulatory' ? '[REG]'
        : subtitle === 'authority' ? '[AUTH]'
        : '[EST]'
      return {
        title:    `${badge} ${title ?? 'Unnamed Source'}`,
        subtitle: slug ?? '',
      }
    },
  },
})
