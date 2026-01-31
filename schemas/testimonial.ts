export default {
  name: 'testimonial',
  title: 'Testimonials',
  type: 'document',
  fields: [
    {
      name: 'clientName',
      title: 'Client Name',
      type: 'string',
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'clientLocation',
      title: 'Client Location',
      type: 'string',
      description: 'e.g., "Austin, TX"',
    },
    {
      name: 'quote',
      title: 'Testimonial Quote',
      type: 'text',
      rows: 5,
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'rating',
      title: 'Rating (1-5 stars)',
      type: 'number',
      validation: (Rule: any) => Rule.min(1).max(5),
      initialValue: 5,
    },
    {
      name: 'projectType',
      title: 'Project Type',
      type: 'string',
      description: 'e.g., "Kitchen Remodel"',
    },
    {
      name: 'project',
      title: 'Related Project',
      type: 'reference',
      to: [{ type: 'project' }],
    },
    {
      name: 'date',
      title: 'Date',
      type: 'date',
    },
    {
      name: 'clientPhoto',
      title: 'Client Photo',
      type: 'image',
      options: { hotspot: true },
    },
    {
      name: 'isFeatured',
      title: 'Featured on Homepage',
      type: 'boolean',
      initialValue: false,
    },
    {
      name: 'isActive',
      title: 'Show on Website',
      type: 'boolean',
      initialValue: true,
    },
    {
      name: 'order',
      title: 'Display Order',
      type: 'number',
      initialValue: 10,
    },
  ],
  preview: {
    select: { title: 'clientName', subtitle: 'projectType', isFeatured: 'isFeatured' },
    prepare({ title, subtitle, isFeatured }: any) {
      return { title, subtitle: `${subtitle || 'General'} ${isFeatured ? '⭐ Featured' : ''}` }
    },
  },
}
