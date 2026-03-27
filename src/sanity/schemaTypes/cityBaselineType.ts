import { defineField, defineType } from 'sanity'

export const cityBaselineType = defineType({
  name: 'cityBaseline',
  title: 'City Baseline',
  type: 'document',
  fields: [
    defineField({
      name: 'cityName',
      title: 'City Name',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'province',
      title: 'Province',
      type: 'string',
      options: {
        list: [
          { title: 'Alberta',                   value: 'AB' },
          { title: 'British Columbia',           value: 'BC' },
          { title: 'Manitoba',                   value: 'MB' },
          { title: 'New Brunswick',              value: 'NB' },
          { title: 'Newfoundland and Labrador',  value: 'NL' },
          { title: 'Nova Scotia',                value: 'NS' },
          { title: 'Ontario',                    value: 'ON' },
          { title: 'Prince Edward Island',       value: 'PE' },
          { title: 'Quebec',                     value: 'QC' },
          { title: 'Saskatchewan',               value: 'SK' },
          { title: 'Northwest Territories',      value: 'NT' },
          { title: 'Nunavut',                    value: 'NU' },
          { title: 'Yukon',                      value: 'YT' },
        ],
        layout: 'dropdown',
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'avgRent1BR',
      title: 'Avg Rent — 1-Bedroom ($/mo)',
      type: 'number',
      description: 'Average monthly rent for a 1-bedroom unit (CMHC data).',
      validation: (Rule) => Rule.required().min(0),
    }),
    defineField({
      name: 'avgRent2BR',
      title: 'Avg Rent — 2-Bedroom ($/mo)',
      type: 'number',
      description: 'Average monthly rent for a 2-bedroom unit (CMHC data).',
      validation: (Rule) => Rule.required().min(0),
    }),
    defineField({
      name: 'avgRentStudio',
      title: 'Avg Rent — Studio/Bachelor ($/mo)',
      type: 'number',
      description: 'Average monthly rent for a studio/bachelor unit (CMHC data).',
      validation: (Rule) => Rule.required().min(0),
    }),
    defineField({
      name: 'monthlyTransitPass',
      title: 'Monthly Transit Pass ($/mo)',
      type: 'number',
      description: 'Cost of a standard adult monthly transit pass.',
      validation: (Rule) => Rule.required().min(0),
    }),
    defineField({
      name: 'source',
      title: 'Data Source',
      type: 'string',
      description: 'e.g. "CMHC Rental Market Report, October 2025"',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'effectiveDate',
      title: 'Effective Date',
      type: 'date',
      description: 'The date this data was published or came into effect.',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'dataVersion',
      title: 'Data Version',
      type: 'string',
      description: 'Version tag for tracking data updates (e.g. "2025-10").',
    }),

    // ─── Student Housing Costs (study-permit pathway only) ────────────────────────
    defineField({
      name: 'studentHousing',
      title: 'Student Housing Costs',
      type: 'object',
      description: 'Monthly housing costs for study permit holders. Only used when pathway is study-permit.',
      fields: [
        defineField({ name: 'sharedRoom', title: 'Shared Room ($/month)',           type: 'number', description: 'Average cost for a room in a shared house/apartment' }),
        defineField({ name: 'onCampus',   title: 'On-Campus Residence ($/month)',   type: 'number', description: 'Average university residence fee per month' }),
        defineField({ name: 'homestay',   title: 'Homestay ($/month)',              type: 'number', description: 'Average homestay cost including some meals' }),
      ],
    }),
  ],

  preview: {
    select: {
      title:    'cityName',
      subtitle: 'province',
    },
    prepare({ title, subtitle }) {
      return {
        title:    title ?? 'Unnamed City',
        subtitle: subtitle ?? '',
      }
    },
  },
})
