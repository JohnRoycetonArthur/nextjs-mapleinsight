import {defineArrayMember, defineField, defineType} from 'sanity'

export const contributorType = defineType({
  name: 'contributor',
  title: 'Contributor / Reviewer',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Full Name',
      type: 'string',
      validation: (R) => R.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {source: 'name'},
      validation: (R) => R.required(),
    }),
    defineField({
      name: 'photo',
      title: 'Photo',
      type: 'image',
      options: {hotspot: true},
    }),
    defineField({
      name: 'title',
      title: 'Professional Title',
      type: 'string',
      description: 'e.g., "CRA Authorized Tax Representative"',
      validation: (R) => R.required(),
    }),
    defineField({
      name: 'company',
      title: 'Current Company / Affiliation',
      type: 'string',
    }),
    defineField({
      name: 'shortBio',
      title: 'Short Bio (1–2 sentences)',
      type: 'text',
      rows: 3,
      validation: (R) => R.required().max(220),
    }),
    defineField({
      name: 'credentials',
      title: 'Credentials',
      type: 'array',
      of: [defineArrayMember({type: 'string'})],
      description: 'e.g., "CPA", "RCIC #R123456", "Former H&R Block Tax Consultant"',
    }),
    defineField({
      name: 'categories',
      title: 'Review Categories',
      type: 'array',
      of: [defineArrayMember({type: 'reference', to: [{type: 'category'}]})],
      description: 'Articles in these categories may be auto-attributed to this reviewer as fallback',
    }),
    defineField({
      name: 'location',
      title: 'Location',
      type: 'string',
      initialValue: 'Canada',
    }),
    defineField({
      name: 'activeSince',
      title: 'Active Reviewer Since',
      type: 'date',
    }),
    defineField({
      name: 'linkedin',
      title: 'LinkedIn URL',
      type: 'url',
    }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: [
          {title: 'Active', value: 'active'},
          {title: 'Pending', value: 'pending'},
          {title: 'Inactive', value: 'inactive'},
        ],
        layout: 'radio',
      },
      initialValue: 'pending',
      validation: (R) => R.required(),
    }),
    defineField({
      name: 'displayOrder',
      title: 'Display Order',
      type: 'number',
      initialValue: 100,
    }),
  ],
  preview: {
    select: {title: 'name', subtitle: 'title', media: 'photo'},
  },
})
