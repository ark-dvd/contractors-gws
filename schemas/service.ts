export default {
  name: 'service',
  title: 'Services',
  type: 'document',
  groups: [
    { name: 'basic', title: 'Basic Info' },
    { name: 'details', title: 'Details' },
    { name: 'media', title: 'Media' },
    { name: 'settings', title: 'Settings' },
  ],
  fields: [
    {
      name: 'name',
      title: 'Service Name',
      type: 'string',
      group: 'basic',
      validation: (Rule: any) => Rule.required(),
      description: 'e.g., "Kitchen Remodeling"',
    },
    {
      name: 'slug',
      title: 'Slug (URL)',
      type: 'slug',
      options: { source: 'name', maxLength: 96 },
      group: 'basic',
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'tagline',
      title: 'Tagline',
      type: 'string',
      group: 'basic',
      description: 'Short catchy line, e.g., "Transform your kitchen into a masterpiece"',
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'description',
      title: 'Full Description',
      type: 'text',
      rows: 8,
      group: 'basic',
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'highlights',
      title: 'Service Highlights',
      type: 'array',
      group: 'details',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'title', title: 'Highlight Title', type: 'string', validation: (Rule: any) => Rule.required() },
            { name: 'description', title: 'Description', type: 'string', validation: (Rule: any) => Rule.required() },
          ],
          preview: { select: { title: 'title', subtitle: 'description' } },
        },
      ],
    },
    {
      name: 'priceRange',
      title: 'Typical Price Range',
      type: 'string',
      group: 'details',
      description: 'e.g., "$15,000 - $50,000" or "Starting at $5,000"',
    },
    {
      name: 'typicalDuration',
      title: 'Typical Duration',
      type: 'string',
      group: 'details',
      description: 'e.g., "2-4 weeks"',
    },
    {
      name: 'image',
      title: 'Main Image',
      type: 'image',
      group: 'media',
      options: { hotspot: true },
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'gallery',
      title: 'Gallery Images',
      type: 'array',
      group: 'media',
      of: [
        {
          type: 'image',
          options: { hotspot: true },
          fields: [{ name: 'alt', title: 'Alt Text', type: 'string' }],
        },
      ],
    },
    {
      name: 'order',
      title: 'Display Order',
      type: 'number',
      group: 'settings',
      initialValue: 10,
    },
    {
      name: 'isActive',
      title: 'Show on Website',
      type: 'boolean',
      group: 'settings',
      initialValue: true,
    },
  ],
  orderings: [
    { title: 'Display Order', name: 'orderAsc', by: [{ field: 'order', direction: 'asc' }] },
    { title: 'Name A-Z', name: 'nameAsc', by: [{ field: 'name', direction: 'asc' }] },
  ],
  preview: {
    select: { title: 'name', media: 'image', isActive: 'isActive' },
    prepare({ title, media, isActive }: any) {
      return {
        title,
        subtitle: isActive ? '✓ Active' : '✗ Hidden',
        media,
      }
    },
  },
}
