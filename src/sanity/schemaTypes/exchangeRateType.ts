import { defineField, defineType } from 'sanity'

export const exchangeRateType = defineType({
  name: 'exchangeRate',
  title: 'Exchange Rate',
  type: 'document',
  fields: [
    defineField({
      name: 'currency',
      title: 'Currency Code',
      type: 'string',
      description: 'ISO 4217 currency code (e.g. "USD", "INR").',
      validation: (Rule) => Rule.required().min(3).max(3),
    }),
    defineField({
      name: 'rateToCAD',
      title: 'Rate to CAD',
      type: 'number',
      description: '1 unit of this currency = rateToCAD Canadian dollars (e.g. USD: 1.36 means 1 USD = 1.36 CAD).',
      validation: (Rule) => Rule.required().positive(),
    }),
    defineField({
      name: 'sourceDate',
      title: 'Source Date',
      type: 'date',
      description: 'Date this rate was last sourced from the exchange.',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'source',
      title: 'Source',
      type: 'string',
      description: 'Where this rate was obtained (e.g. "Bank of Canada", "XE.com").',
      validation: (Rule) => Rule.required(),
    }),
  ],

  preview: {
    select: {
      currency: 'currency',
      rate:     'rateToCAD',
      date:     'sourceDate',
    },
    prepare({ currency, rate, date }) {
      return {
        title:    `${currency ?? '???'} → CAD`,
        subtitle: rate ? `1 ${currency} = ${rate} CAD  (${date ?? 'no date'})` : 'no rate',
      }
    },
  },
})
