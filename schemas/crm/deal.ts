export default {
  name: 'deal',
  title: 'Projects (Deals)',
  type: 'document',
  groups: [
    { name: 'basic', title: 'Basic Info' },
    { name: 'details', title: 'Project Details' },
    { name: 'dates', title: 'Dates' },
    { name: 'notes', title: 'Notes' },
  ],
  fields: [
    // Basic Info
    {
      name: 'title',
      title: 'Project Title',
      type: 'string',
      group: 'basic',
      validation: (Rule: any) => Rule.required(),
      description: 'e.g., "Kitchen Renovation - Smith Residence"',
    },
    {
      name: 'client',
      title: 'Client',
      type: 'reference',
      to: [{ type: 'client' }],
      group: 'basic',
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'dealType',
      title: 'Project Type',
      type: 'string',
      group: 'basic',
      options: {
        list: [
          { title: 'Kitchen Remodel', value: 'kitchen_remodel' },
          { title: 'Bathroom Remodel', value: 'bathroom_remodel' },
          { title: 'Home Addition', value: 'home_addition' },
          { title: 'Deck / Patio', value: 'deck_patio' },
          { title: 'Full Renovation', value: 'full_renovation' },
          { title: 'ADU / Guest House', value: 'adu_guest_house' },
          { title: 'Roofing', value: 'roofing' },
          { title: 'Flooring', value: 'flooring' },
          { title: 'Exterior / Siding', value: 'exterior_siding' },
          { title: 'Garage', value: 'garage' },
          { title: 'Basement Finish', value: 'basement_finish' },
          { title: 'Commercial', value: 'commercial' },
          { title: 'Other', value: 'other' },
        ],
      },
    },
    {
      name: 'value',
      title: 'Contract Value',
      type: 'number',
      group: 'basic',
      description: 'Total contract value in dollars',
    },
    // PHASE 2 (A3): status options now config-driven via CRM Settings (dealStatuses)
    {
      name: 'status',
      title: 'Status',
      type: 'string',
      group: 'basic',
      description: 'Project status. Options managed in CRM Settings.',
      initialValue: 'planning',
      validation: (Rule: any) => Rule.required(),
    },

    // Project Details (Contractor-specific)
    {
      name: 'projectAddress',
      title: 'Project Address',
      type: 'text',
      rows: 2,
      group: 'details',
      description: 'Job site address',
    },
    {
      name: 'permitNumber',
      title: 'Permit Number',
      type: 'string',
      group: 'details',
      description: 'Building permit reference',
    },
    {
      name: 'estimatedDuration',
      title: 'Estimated Duration',
      type: 'string',
      group: 'details',
      description: 'e.g., "6-8 weeks"',
    },
    {
      name: 'scope',
      title: 'Scope of Work',
      type: 'array',
      of: [{ type: 'string' }],
      group: 'details',
      description: 'List of work items included in this project',
    },

    // Dates
    {
      name: 'contractSignedDate',
      title: 'Contract Signed Date',
      type: 'date',
      group: 'dates',
    },
    {
      name: 'startDate',
      title: 'Start Date',
      type: 'date',
      group: 'dates',
    },
    {
      name: 'expectedEndDate',
      title: 'Expected End Date',
      type: 'date',
      group: 'dates',
    },
    {
      name: 'actualEndDate',
      title: 'Actual End Date',
      type: 'date',
      group: 'dates',
      description: 'Filled in when project is completed',
    },

    // Notes
    {
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 6,
      group: 'notes',
      description: 'Detailed project description and scope',
    },
    {
      name: 'internalNotes',
      title: 'Internal Notes',
      type: 'text',
      rows: 4,
      group: 'notes',
      description: 'Private notes about this project',
    },
  ],
  preview: {
    select: {
      title: 'title',
      status: 'status',
      clientName: 'client.fullName',
      value: 'value',
    },
    prepare({ title, status, clientName, value }: any) {
      const statusLabels: any = {
        planning: '📋 Planning',
        permitting: '📄 Permitting',
        in_progress: '🔨 In Progress',
        inspection: '🔍 Inspection',
        completed: '✅ Completed',
        warranty: '🛡️ Warranty',
        paused: '⏸️ Paused',
        cancelled: '❌ Cancelled',
      }
      const formattedValue = value ? `$${value.toLocaleString()}` : ''
      return {
        title,
        subtitle: `${statusLabels[status] || status} • ${clientName || 'No client'} ${formattedValue ? `• ${formattedValue}` : ''}`,
      }
    },
  },
  orderings: [
    {
      title: 'Newest First',
      name: 'startDateDesc',
      by: [{ field: 'startDate', direction: 'desc' }],
    },
    {
      title: 'By Status',
      name: 'statusAsc',
      by: [{ field: 'status', direction: 'asc' }],
    },
    {
      title: 'By Value',
      name: 'valueDesc',
      by: [{ field: 'value', direction: 'desc' }],
    },
  ],
}
