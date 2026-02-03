export default {
  name: 'lead',
  title: 'Leads',
  type: 'document',
  groups: [
    { name: 'contact', title: 'Contact Info' },
    { name: 'details', title: 'Lead Details' },
    { name: 'content', title: 'Content & Notes' },
    { name: 'meta', title: 'Metadata' },
  ],
  fields: [
    // Contact Info
    {
      name: 'fullName',
      title: 'Full Name',
      type: 'string',
      group: 'contact',
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'email',
      title: 'Email',
      type: 'string',
      group: 'contact',
      validation: (Rule: any) => Rule.email(),
    },
    {
      name: 'phone',
      title: 'Phone',
      type: 'string',
      group: 'contact',
    },

    // Lead Details
    {
      name: 'origin',
      title: 'Origin',
      type: 'string',
      group: 'details',
      description: 'How this lead entered the system',
      options: {
        list: [
          { title: 'Website Form (Auto)', value: 'auto_website_form' },
          { title: 'Landing Page (Auto)', value: 'auto_landing_page' },
          { title: 'Manual Entry', value: 'manual' },
        ],
      },
      validation: (Rule: any) => Rule.required(),
      initialValue: 'manual',
    },
    // PHASE 2 (A3): source options now config-driven via CRM Settings
    {
      name: 'source',
      title: 'Source',
      type: 'string',
      group: 'details',
      description: 'How they found the business (for manual leads). Options managed in CRM Settings.',
    },
    // PHASE 2 (A3): serviceType options now config-driven via CRM Settings
    {
      name: 'serviceType',
      title: 'Service Type',
      type: 'string',
      group: 'details',
      description: 'Type of project they are interested in. Options managed in CRM Settings.',
    },
    {
      name: 'estimatedValue',
      title: 'Estimated Value',
      type: 'number',
      group: 'details',
      description: 'Estimated project value in dollars',
    },
    {
      name: 'priority',
      title: 'Priority',
      type: 'string',
      group: 'details',
      options: {
        list: [
          { title: 'High', value: 'high' },
          { title: 'Medium', value: 'medium' },
          { title: 'Low', value: 'low' },
        ],
        layout: 'radio',
      },
      initialValue: 'medium',
    },
    // PHASE 2 (A3): status options now config-driven via CRM Settings (pipelineStages)
    {
      name: 'status',
      title: 'Status',
      type: 'string',
      group: 'details',
      description: 'Pipeline stage. Options managed in CRM Settings.',
      initialValue: 'new',
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'referredBy',
      title: 'Referred By',
      type: 'string',
      group: 'details',
      description: 'Name of person or business who referred this lead',
    },

    // Content & Notes
    {
      name: 'originalMessage',
      title: 'Original Message',
      type: 'text',
      rows: 6,
      group: 'content',
      description: 'Auto-populated from form submission',
    },
    {
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 4,
      group: 'content',
      description: 'Project description or requirements',
    },
    {
      name: 'internalNotes',
      title: 'Internal Notes',
      type: 'text',
      rows: 4,
      group: 'content',
      description: 'Private notes (not visible to client)',
    },

    // Relationships
    {
      name: 'convertedToClient',
      title: 'Converted to Client',
      type: 'reference',
      to: [{ type: 'client' }],
      group: 'meta',
      description: 'Link to client record if this lead was converted',
    },

    // Metadata
    {
      name: 'receivedAt',
      title: 'Received At',
      type: 'datetime',
      group: 'meta',
      initialValue: () => new Date().toISOString(),
    },
    {
      name: 'formId',
      title: 'Form ID',
      type: 'string',
      group: 'meta',
      description: 'ID of the form that generated this lead (for auto leads)',
      hidden: true,
    },
  ],
  preview: {
    select: {
      title: 'fullName',
      status: 'status',
      origin: 'origin',
      serviceType: 'serviceType',
    },
    prepare({ title, status, origin, serviceType }: any) {
      const statusLabels: any = {
        new: '🔵 New',
        contacted: '🟣 Contacted',
        site_visit: '🟣 Site Visit',
        quoted: '🟡 Quoted',
        negotiating: '🟠 Negotiating',
        won: '🟢 Won',
        lost: '⚫ Lost',
      }
      const originIcon = origin?.startsWith('auto') ? '⚡' : '✎'
      return {
        title: `${originIcon} ${title}`,
        subtitle: `${statusLabels[status] || status} • ${serviceType || 'No service type'}`,
      }
    },
  },
  orderings: [
    {
      title: 'Newest First',
      name: 'receivedAtDesc',
      by: [{ field: 'receivedAt', direction: 'desc' }],
    },
    {
      title: 'Priority',
      name: 'priorityDesc',
      by: [{ field: 'priority', direction: 'asc' }],
    },
  ],
}
