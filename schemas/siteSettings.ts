export default {
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  groups: [
    { name: 'hero', title: 'Hero Section' },
    { name: 'about', title: 'About Section' },
    { name: 'contact', title: 'Contact Info' },
    { name: 'branding', title: 'Branding' },
    { name: 'social', title: 'Social Media' },
    { name: 'legal', title: 'Legal / License' },
  ],
  fields: [
    { name: 'siteTitle', title: 'Site Title', type: 'string' },

    // Hero
    { name: 'heroHeadline', title: 'Hero Headline', type: 'string', group: 'hero' },
    { name: 'heroSubheadline', title: 'Hero Subheadline', type: 'text', rows: 2, group: 'hero' },
    {
      name: 'heroMediaType', title: 'Hero Media Type', type: 'string', group: 'hero',
      options: { list: [{ title: 'Image Slider', value: 'images' }, { title: 'Video Background', value: 'video' }], layout: 'radio' },
      initialValue: 'images',
    },
    {
      name: 'heroImages', title: 'Hero Images', type: 'array', group: 'hero',
      of: [{ type: 'image', options: { hotspot: true }, fields: [{ name: 'alt', title: 'Alt Text', type: 'string' }] }],
    },
    { name: 'heroVideo', title: 'Hero Video', type: 'file', group: 'hero', options: { accept: 'video/*' } },

    // About
    { name: 'contractorName', title: 'Contractor / Company Name', type: 'string', group: 'about' },
    { name: 'contractorTitle', title: 'Title / Specialty', type: 'string', group: 'about' },
    { name: 'contractorPhoto', title: 'Photo', type: 'image', group: 'about', options: { hotspot: true } },
    { name: 'aboutHeadline', title: 'About Headline', type: 'string', group: 'about' },
    { name: 'aboutText', title: 'About Text', type: 'text', rows: 10, group: 'about' },
    {
      name: 'aboutStats', title: 'Stats', type: 'array', group: 'about',
      of: [{ type: 'object', fields: [
        { name: 'value', title: 'Value', type: 'string' },
        { name: 'label', title: 'Label', type: 'string' },
      ], preview: { select: { title: 'value', subtitle: 'label' } } }],
    },

    // Contact
    { name: 'phone', title: 'Phone', type: 'string', group: 'contact' },
    { name: 'email', title: 'Email', type: 'string', group: 'contact' },
    { name: 'address', title: 'Address', type: 'text', rows: 2, group: 'contact' },
    { name: 'serviceArea', title: 'Service Area', type: 'string', group: 'contact', description: 'e.g., "Greater Austin Area"' },
    { name: 'officeHours', title: 'Office Hours', type: 'text', rows: 3, group: 'contact' },

    // Branding
    { name: 'logo', title: 'Logo', type: 'image', group: 'branding' },
    { name: 'favicon', title: 'Favicon', type: 'image', group: 'branding' },

    // Social
    { name: 'instagram', title: 'Instagram URL', type: 'url', group: 'social' },
    { name: 'facebook', title: 'Facebook URL', type: 'url', group: 'social' },
    { name: 'linkedin', title: 'LinkedIn URL', type: 'url', group: 'social' },
    { name: 'youtube', title: 'YouTube URL', type: 'url', group: 'social' },
    { name: 'yelp', title: 'Yelp URL', type: 'url', group: 'social' },
    { name: 'google', title: 'Google Business URL', type: 'url', group: 'social' },
    { name: 'houzz', title: 'Houzz URL', type: 'url', group: 'social' },
    { name: 'nextdoor', title: 'Nextdoor URL', type: 'url', group: 'social' },

    // Legal
    { name: 'licenseNumber', title: 'Contractor License Number', type: 'string', group: 'legal' },
    { name: 'licenseState', title: 'License State', type: 'string', group: 'legal' },
    { name: 'insuranceInfo', title: 'Insurance Info', type: 'string', group: 'legal' },
    { name: 'bondInfo', title: 'Bond Info', type: 'string', group: 'legal' },
  ],
  preview: { prepare() { return { title: 'Site Settings', subtitle: 'Hero, About, Contact & Branding' } } },
}
