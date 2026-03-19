import { defineField, defineType } from 'sanity'

export const immigrationFeesType = defineType({
  name: 'immigrationFees',
  title: 'Immigration Fees',
  type: 'document',
  fields: [
    defineField({
      name: 'pathway',
      title: 'Immigration Pathway',
      type: 'string',
      description: 'e.g. "Express Entry — Federal Skilled Worker", "Study Permit"',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'applicationFee',
      title: 'Application Fee ($CAD)',
      type: 'number',
      description: 'Primary government application processing fee.',
      validation: (Rule) => Rule.required().min(0),
    }),
    defineField({
      name: 'biometricsFee',
      title: 'Biometrics Fee ($CAD)',
      type: 'number',
      description: 'Biometrics collection fee (per person, standard rate).',
      validation: (Rule) => Rule.required().min(0),
    }),
    defineField({
      name: 'proofOfFundsTable',
      title: 'Proof of Funds Table',
      type: 'array',
      description: 'Required funds by family size (IRCC low-income cut-off table).',
      of: [
        {
          type: 'object',
          fields: [
            defineField({
              name: 'familySize',
              title: 'Family Size (persons)',
              type: 'number',
              validation: (Rule) => Rule.required().min(1).integer(),
            }),
            defineField({
              name: 'requiredFunds',
              title: 'Required Funds ($CAD)',
              type: 'number',
              validation: (Rule) => Rule.required().min(0),
            }),
          ],
          preview: {
            select: { familySize: 'familySize', requiredFunds: 'requiredFunds' },
            prepare({ familySize, requiredFunds }) {
              return {
                title:    `${familySize} person${familySize === 1 ? '' : 's'}`,
                subtitle: requiredFunds != null ? `$${requiredFunds.toLocaleString()}` : '',
              }
            },
          },
        },
      ],
    }),
    defineField({
      name: 'source',
      title: 'Data Source',
      type: 'string',
      description: 'e.g. "IRCC — Express Entry fees, effective Nov 2024"',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'effectiveDate',
      title: 'Effective Date',
      type: 'date',
      description: 'Date these fees came into effect.',
      validation: (Rule) => Rule.required(),
    }),
  ],

  preview: {
    select: {
      title:    'pathway',
      subtitle: 'effectiveDate',
    },
    prepare({ title, subtitle }) {
      return {
        title:    title ?? 'Unnamed Pathway',
        subtitle: subtitle ? `Effective ${subtitle}` : '',
      }
    },
  },
})
