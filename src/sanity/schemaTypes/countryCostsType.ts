import { defineField, defineType } from 'sanity'

/**
 * CountryCosts — US-3.2
 *
 * One document per country of origin. Stores the country-specific pre-arrival
 * costs (medical exam, police clearance, language test) used by the Settlement
 * Planner engine to personalise the cost breakdown.
 *
 * Special document: ISO = "ZZ" is the global default fallback.  Every other
 * country that has not yet been seeded (isSeeded = false) will resolve to ZZ
 * at runtime via fetchCountryCosts().
 *
 * Validation: when isSeeded = true, all core cost fields AND their source
 * fields must be populated.
 */

function isParentSeeded(context: unknown): boolean {
  return !!(context as { parent?: { isSeeded?: boolean } })?.parent?.isSeeded
}

function requiredWhenSeeded(label: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (Rule: any) =>
    Rule.custom((value: unknown, context: unknown) => {
      if (!isParentSeeded(context)) return true
      if (value === undefined || value === null || value === '') {
        return `${label} is required for seeded documents`
      }
      return true
    })
}

function positiveWhenSeeded(label: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (Rule: any) =>
    Rule.custom((value: unknown, context: unknown) => {
      if (!isParentSeeded(context)) return true
      if (value === undefined || value === null) return `${label} is required for seeded documents`
      if (typeof value === 'number' && value < 0) return 'Must be 0 or greater'
      return true
    })
}

export const countryCostsType = defineType({
  name: 'countryCosts',
  title: 'Country Costs',
  type: 'document',

  fields: [
    // ─── Identity ──────────────────────────────────────────────────────────────
    defineField({
      name: 'iso',
      title: 'ISO 3166-1 Alpha-2 Code',
      type: 'string',
      description: 'Two-letter uppercase country code (e.g. "IN", "NG"). Use "ZZ" for the global default fallback document.',
      validation: (Rule) =>
        Rule.required()
          .uppercase()
          .min(2)
          .max(2)
          .regex(/^[A-Z]{2}$/, { name: 'ISO alpha-2', invert: false }),
    }),

    defineField({
      name: 'countryName',
      title: 'Country Name',
      type: 'string',
      description: 'English display name shown in the wizard dropdown.',
      validation: (Rule) => Rule.required().min(2).max(100),
    }),

    defineField({
      name: 'flag',
      title: 'Flag Emoji',
      type: 'string',
      description: 'Unicode flag emoji (e.g. 🇮🇳). Leave blank for ZZ fallback.',
    }),

    defineField({
      name: 'isSeeded',
      title: 'Data Seeded',
      type: 'boolean',
      description: 'True when cost data has been researched and populated. False → engine falls back to ZZ defaults; wizard shows "DATA PENDING" badge.',
      initialValue: false,
      validation: (Rule) => Rule.required(),
    }),

    // ─── Effective Date ────────────────────────────────────────────────────────
    defineField({
      name: 'effectiveDate',
      title: 'Effective Date',
      type: 'date',
      description: 'Date this cost data was published or verified. Required for seeded documents.',
      validation: requiredWhenSeeded('Effective date'),
    }),

    // ─── Medical Exam ──────────────────────────────────────────────────────────
    defineField({
      name: 'medicalExamCAD',
      title: 'Medical Exam Cost (CAD)',
      type: 'number',
      description: 'Typical cost for IRCC-mandated medical exam by an approved panel physician in this country.',
      validation: positiveWhenSeeded('Medical exam cost'),
    }),

    defineField({
      name: 'medicalExamSource',
      title: 'Medical Exam — Source',
      type: 'string',
      description: 'e.g. "IRCC-approved panel physician directory — India region average, April 2025"',
      validation: requiredWhenSeeded('Medical exam source'),
    }),

    defineField({
      name: 'medicalExamSourceUrl',
      title: 'Medical Exam — Source URL',
      type: 'url',
      description: 'Link to the official panel physician listing or price reference.',
    }),

    // ─── Police Clearance Certificate ─────────────────────────────────────────
    defineField({
      name: 'pccCAD',
      title: 'Police Clearance Certificate Cost (CAD)',
      type: 'number',
      description: 'Typical cost (converted to CAD) for obtaining a police clearance certificate from this country.',
      validation: positiveWhenSeeded('PCC cost'),
    }),

    defineField({
      name: 'pccSource',
      title: 'PCC — Source',
      type: 'string',
      description: 'e.g. "Indian Ministry of External Affairs — Passport Seva portal fee, April 2025"',
      validation: requiredWhenSeeded('PCC source'),
    }),

    defineField({
      name: 'pccSourceUrl',
      title: 'PCC — Source URL',
      type: 'url',
      description: 'Link to the official police or government portal for this country.',
    }),

    // ─── Language Test ─────────────────────────────────────────────────────────
    defineField({
      name: 'languageTestCAD',
      title: 'Language Test Fee (CAD)',
      type: 'number',
      description: 'Typical cost (converted to CAD) for the applicable language proficiency test (IELTS, CELPIP, TEF Canada, etc.).',
      validation: positiveWhenSeeded('Language test fee'),
    }),

    defineField({
      name: 'languageTestProvider',
      title: 'Language Test Provider',
      type: 'string',
      description: 'e.g. "IELTS", "CELPIP", "TEF Canada"',
      options: {
        list: [
          { title: 'IELTS',          value: 'IELTS' },
          { title: 'CELPIP',         value: 'CELPIP' },
          { title: 'TEF Canada',     value: 'TEF Canada' },
          { title: 'TCF Canada',     value: 'TCF Canada' },
          { title: 'IELTS / CELPIP', value: 'IELTS / CELPIP' },
        ],
        layout: 'dropdown',
      },
    }),

    defineField({
      name: 'languageTestSource',
      title: 'Language Test — Source',
      type: 'string',
      description: 'e.g. "IDP IELTS India — exam registration fee, April 2025"',
      validation: requiredWhenSeeded('Language test source'),
    }),

    defineField({
      name: 'languageTestSourceUrl',
      title: 'Language Test — Source URL',
      type: 'url',
      description: 'Link to the official test registration or pricing page.',
    }),

    // ─── Notes ────────────────────────────────────────────────────────────────
    defineField({
      name: 'notes',
      title: 'Editor Notes',
      type: 'text',
      rows: 3,
      description: 'Internal notes on data quality, regional variation, or pending verification.',
    }),
  ],

  preview: {
    select: {
      iso:      'iso',
      name:     'countryName',
      flag:     'flag',
      isSeeded: 'isSeeded',
    },
    prepare({ iso, name, flag, isSeeded }) {
      const badge = isSeeded ? '✓' : '⏳'
      return {
        title:    `${flag ?? ''} ${name ?? iso ?? 'Unknown'}`.trim(),
        subtitle: `${iso} · ${badge} ${isSeeded ? 'Seeded' : 'Data Pending'}`,
      }
    },
  },
})
