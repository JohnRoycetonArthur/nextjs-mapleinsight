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

    // ─── Study Permit Financial Data (optional, only populated for study-permit doc) ──
    defineField({
      name: 'studyPermitData',
      title: 'Study Permit Financial Data',
      type: 'object',
      description: 'IRCC-specific financial requirements for study permit applicants. Only used on the Study Permit document.',
      fields: [
        defineField({
          name: 'effectiveDate',
          title: 'Effective Date',
          type: 'date',
          description: 'When these thresholds took effect (e.g., 2025-09-01). IRCC updates these annually.',
        }),
        defineField({
          name: 'proofOfFundsLiving',
          title: 'IRCC Living Expense Requirements (non-Quebec)',
          type: 'array',
          description: 'Required living funds indexed by family size (1–7). Source: canada.ca. Excludes tuition and transportation.',
          of: [{
            type: 'object',
            fields: [
              defineField({ name: 'familyMembers', title: 'Family Members (incl. applicant)', type: 'number', validation: (Rule) => Rule.required().min(1).integer() }),
              defineField({ name: 'amountCAD',     title: 'Required Amount (CAD/year)',       type: 'number', validation: (Rule) => Rule.required().min(0) }),
            ],
            preview: {
              select: { familyMembers: 'familyMembers', amountCAD: 'amountCAD' },
              prepare({ familyMembers, amountCAD }) {
                return { title: `${familyMembers} person${familyMembers === 1 ? '' : 's'}`, subtitle: amountCAD != null ? `$${amountCAD.toLocaleString()}/yr` : '' }
              },
            },
          }],
        }),
        defineField({
          name: 'proofOfFundsAdditionalMember',
          title: 'Per Additional Member Beyond 7',
          type: 'number',
          description: 'Increment added per person beyond family size 7. Currently $6,170.',
        }),
        defineField({
          name: 'quebecProofOfFunds',
          title: 'Quebec-Specific Requirements',
          type: 'object',
          description: 'Quebec sets its own proof-of-funds thresholds (via MIFI/CAQ), which exceed federal requirements.',
          fields: [
            defineField({ name: 'effectiveDate',        title: 'Effective Date',                      type: 'date'   }),
            defineField({ name: 'singleAdult18Plus',    title: 'Single Adult 18+ (CAD/year)',          type: 'number' }),
            defineField({ name: 'singleUnder18',        title: 'Single Applicant Under 18 (CAD/year)', type: 'number' }),
            defineField({ name: 'perAdditionalMember',  title: 'Per Additional Family Member',         type: 'number' }),
          ],
        }),
        defineField({
          name: 'tuitionBenchmarks',
          title: 'Average Annual Tuition for International Students',
          type: 'object',
          description: 'National average tuition benchmarks by program level. Source: Statistics Canada / ApplyBoard.',
          fields: [
            defineField({ name: 'undergraduate',      title: 'Undergraduate Average (CAD/year)',         type: 'number' }),
            defineField({ name: 'graduate',           title: 'Graduate Average (CAD/year)',               type: 'number' }),
            defineField({ name: 'collegeDiplomaLow',  title: 'College/Diploma Low End (CAD/year)',        type: 'number' }),
            defineField({ name: 'collegeDiplomaHigh', title: 'College/Diploma High End (CAD/year)',       type: 'number' }),
          ],
        }),
        defineField({
          name: 'gicMinimum',
          title: 'GIC Minimum Amount (CAD)',
          type: 'number',
          description: 'Minimum GIC amount required by IRCC for Student Direct Stream (SDS). Currently $22,895 (effective Sept 1, 2025).',
        }),
        defineField({
          name: 'gicProcessingFee',
          title: 'GIC Bank Processing Fee (CAD)',
          type: 'number',
          description: 'Non-refundable processing fee charged by participating banks (Scotiabank, TD, etc.). Typically $150–$200.',
        }),
        defineField({
          name: 'healthInsuranceByProvince',
          title: 'Health Insurance Lookup by Province',
          type: 'array',
          description: 'Provincial health coverage rules for international students. Used to add upfront bridge costs and monthly insurance costs.',
          of: [{
            type: 'object',
            fields: [
              defineField({ name: 'provinceCode',          title: 'Province Code (ON, BC, AB, etc.)',          type: 'string'  }),
              defineField({ name: 'hasProvincialCoverage', title: 'Has Provincial Health Coverage?',           type: 'boolean' }),
              defineField({ name: 'mechanism',             title: 'Coverage Mechanism (UHIP, MSP, AHCIP…)',    type: 'string'  }),
              defineField({ name: 'annualCostCAD',         title: 'Estimated Annual Cost (CAD)',               type: 'number'  }),
              defineField({ name: 'waitPeriodMonths',      title: 'Wait Period Before Coverage (months)',       type: 'number'  }),
              defineField({ name: 'bridgeCoverageNeeded',  title: 'Bridge Coverage Needed During Wait?',       type: 'boolean' }),
              defineField({ name: 'bridgeCostCAD',         title: 'Bridge Coverage Cost (CAD, if applicable)', type: 'number'  }),
            ],
            preview: {
              select: { provinceCode: 'provinceCode', mechanism: 'mechanism' },
              prepare({ provinceCode, mechanism }) {
                return { title: provinceCode, subtitle: mechanism }
              },
            },
          }],
        }),
        defineField({
          name: 'studentWorkRights',
          title: 'Student Work Rights & Parameters',
          type: 'object',
          description: 'Work hour limits and wage estimates for international students. Part-time income is not counted toward IRCC proof of funds.',
          fields: [
            defineField({ name: 'maxHoursPerWeekTerm',      title: 'Max Hours/Week During Term',      type: 'number', description: 'Currently 24 hrs/week.' }),
            defineField({ name: 'maxHoursPerWeekBreak',     title: 'Max Hours/Week During Breaks',    type: 'number', description: 'Full-time (no limit); use 40 for budgeting.' }),
            defineField({ name: 'estimatedHourlyRateLow',   title: 'Estimated Hourly Rate — Low',     type: 'number' }),
            defineField({ name: 'estimatedHourlyRateHigh',  title: 'Estimated Hourly Rate — High',    type: 'number' }),
          ],
        }),
        defineField({
          name: 'provincialMinWages',
          title: 'Provincial Minimum Wages',
          type: 'array',
          description: 'Current minimum wage by province. Used to estimate monthly part-time income for students.',
          of: [{
            type: 'object',
            fields: [
              defineField({ name: 'provinceCode', title: 'Province Code', type: 'string' }),
              defineField({ name: 'hourlyRate',   title: 'Hourly Min Wage (CAD)', type: 'number' }),
            ],
            preview: {
              select: { provinceCode: 'provinceCode', hourlyRate: 'hourlyRate' },
              prepare({ provinceCode, hourlyRate }) {
                return { title: provinceCode, subtitle: `$${hourlyRate}/hr` }
              },
            },
          }],
        }),
      ],
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
