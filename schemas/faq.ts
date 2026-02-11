export default {
  name: 'faq',
  title: 'FAQ',
  type: 'document',
  fields: [
    {
      name: 'question',
      title: 'Question',
      type: 'string',
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'answer',
      title: 'Answer',
      type: 'text',
      rows: 5,
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'category',
      title: 'Category',
      type: 'string',
      description: 'Optional grouping (e.g., "General", "Pricing", "Process")',
    },
    {
      name: 'order',
      title: 'Display Order',
      type: 'number',
      initialValue: 10,
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'isActive',
      title: 'Show on Website',
      type: 'boolean',
      initialValue: true,
    },
  ],
  preview: {
    select: { title: 'question', isActive: 'isActive' },
    prepare({ title, isActive }: any) {
      return {
        title,
        subtitle: isActive ? '✓ Active' : '✗ Hidden',
      }
    },
  },
}
