export default {
  name: 'activeJob',
  title: 'Active Jobs',
  type: 'document',
  fields: [
    {
      name: 'clientName',
      title: 'Client Name',
      type: 'string',
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'clientEmail',
      title: 'Client Email',
      type: 'string',
      validation: (Rule: any) => Rule.required().email(),
    },
    {
      name: 'clientPhone',
      title: 'Client Phone',
      type: 'string',
    },
    {
      name: 'jobType',
      title: 'Job Type',
      type: 'string',
      description: 'e.g., "Kitchen Remodel", "Bathroom Addition"',
    },
    {
      name: 'service',
      title: 'Service Category',
      type: 'reference',
      to: [{ type: 'service' }],
    },
    {
      name: 'address',
      title: 'Job Site Address',
      type: 'string',
    },
    {
      name: 'estimatedBudget',
      title: 'Estimated Budget',
      type: 'number',
    },
    {
      name: 'jobStage',
      title: 'Job Stage',
      type: 'number',
      description: 'Stage 1-7',
      options: {
        list: [
          { title: '1 - Estimate / Proposal', value: 1 },
          { title: '2 - Contract Signed', value: 2 },
          { title: '3 - Permits & Planning', value: 3 },
          { title: '4 - Demo / Prep', value: 4 },
          { title: '5 - Construction', value: 5 },
          { title: '6 - Finishing / Punch List', value: 6 },
          { title: '7 - Final Walkthrough & Handoff', value: 7 },
        ],
      },
      initialValue: 1,
    },
    {
      name: 'keyDates',
      title: 'Key Dates',
      type: 'object',
      fields: [
        { name: 'estimateDate', title: 'Estimate Date', type: 'date' },
        { name: 'contractDate', title: 'Contract Signed', type: 'date' },
        { name: 'startDate', title: 'Start Date', type: 'date' },
        { name: 'expectedCompletion', title: 'Expected Completion', type: 'date' },
        { name: 'actualCompletion', title: 'Actual Completion', type: 'date' },
      ],
    },
    {
      name: 'notes',
      title: 'Internal Notes',
      type: 'text',
      rows: 4,
    },
    {
      name: 'isActive',
      title: 'Active Job',
      type: 'boolean',
      initialValue: true,
    },
  ],
  preview: {
    select: { title: 'clientName', jobType: 'jobType', stage: 'jobStage', isActive: 'isActive' },
    prepare({ title, jobType, stage, isActive }: any) {
      const stages = ['', 'Estimate', 'Contract', 'Permits', 'Demo', 'Construction', 'Finishing', 'Handoff']
      return {
        title: `${title} ${isActive ? '' : '(Closed)'}`,
        subtitle: `${jobType || 'General'} - Stage ${stage}: ${stages[stage]}`,
      }
    },
  },
}
