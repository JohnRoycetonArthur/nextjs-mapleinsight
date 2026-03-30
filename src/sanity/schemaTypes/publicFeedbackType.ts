import { defineField, defineType } from 'sanity'

export const publicFeedbackType = defineType({
  name: 'publicFeedback',
  title: 'Public Feedback',
  type: 'document',
  fields: [
    defineField({
      name: 'email',
      title: 'Email',
      type: 'string',
      validation: (Rule) => Rule.required().email(),
    }),
    defineField({
      name: 'firstName',
      title: 'First Name',
      type: 'string',
    }),
    defineField({
      name: 'rating',
      title: 'Rating',
      type: 'string',
      options: {
        list: [
          { title: 'Very helpful', value: 'very_helpful' },
          { title: 'Somewhat helpful', value: 'somewhat_helpful' },
          { title: 'Not helpful', value: 'not_helpful' },
        ],
        layout: 'radio',
      },
    }),
    defineField({
      name: 'feedback',
      title: 'Feedback',
      type: 'text',
      rows: 4,
    }),
    defineField({
      name: 'destination',
      title: 'Destination',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'pathway',
      title: 'Pathway',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'createdAt',
      title: 'Created At',
      type: 'datetime',
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: {
    select: {
      title: 'email',
      subtitle: 'destination',
      rating: 'rating',
    },
    prepare({ title, subtitle, rating }) {
      return {
        title: title ?? 'Unknown email',
        subtitle: [rating ?? 'no rating', subtitle ?? 'Unknown destination'].join(' � '),
      }
    },
  },
})
