import { z } from 'zod'

// CRITICAL: Use z.ZodTypeAny and z.output<S>, NOT z.ZodSchema<T>
export function validate<S extends z.ZodTypeAny>(
  schema: S,
  data: unknown
): { success: true; data: z.output<S> } | { success: false; errors: string[] } {
  const result = schema.safeParse(data)
  if (result.success) return { success: true, data: result.data }
  return { success: false, errors: result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`) }
}

// Project Input Schema
export const ProjectInputSchema = z.object({
  _id: z.string().optional(),
  title: z.string().min(1, 'Title is required'),
  slug: z.string().min(1, 'Slug is required'),
  status: z.enum(['completed', 'in-progress', 'upcoming']).default('completed'),
  projectType: z.string().optional().default(''),
  location: z.object({
    city: z.string().optional().default(''),
    state: z.string().optional().default(''),
    neighborhood: z.string().optional().default(''),
  }).optional(),
  completionDate: z.string().optional().default(''),
  duration: z.string().optional().default(''),
  budgetRange: z.string().optional().default(''),
  scope: z.array(z.string()).optional().default([]),
  permitNumber: z.string().optional().default(''),
  shortDescription: z.string().optional().default(''),
  description: z.string().optional().default(''),
  clientTestimonial: z.string().optional().default(''),
  clientName: z.string().optional().default(''),
  heroImage: z.any().optional(),
  beforeImage: z.any().optional(),
  gallery: z.array(z.any()).optional().default([]),
  videoUrl: z.string().url().optional().or(z.literal('')).default(''),
  seoTitle: z.string().optional().default(''),
  seoDescription: z.string().optional().default(''),
})

// Service Input Schema
export const ServiceInputSchema = z.object({
  _id: z.string().optional(),
  name: z.string().min(1, 'Service name is required'),
  slug: z.string().min(1, 'Slug is required'),
  tagline: z.string().min(1, 'Tagline is required'),
  description: z.string().min(1, 'Description is required'),
  highlights: z.array(z.object({
    title: z.string(),
    description: z.string(),
  })).optional().default([]),
  priceRange: z.string().optional().default(''),
  typicalDuration: z.string().optional().default(''),
  image: z.any().optional(),
  gallery: z.array(z.any()).optional().default([]),
  order: z.number().optional().default(10),
  isActive: z.boolean().optional().default(true),
})

// Testimonial Input Schema
export const TestimonialInputSchema = z.object({
  _id: z.string().optional(),
  clientName: z.string().min(1, 'Client name is required'),
  clientLocation: z.string().optional().default(''),
  quote: z.string().min(1, 'Quote is required'),
  rating: z.number().min(1).max(5).optional().default(5),
  projectType: z.string().optional().default(''),
  date: z.string().optional().default(''),
  clientPhoto: z.any().optional(),
  isFeatured: z.boolean().optional().default(false),
  isActive: z.boolean().optional().default(true),
  order: z.number().optional().default(10),
})

// Active Job Input Schema
export const ActiveJobInputSchema = z.object({
  _id: z.string().optional(),
  clientName: z.string().min(1, 'Client name is required'),
  clientEmail: z.string().email('Valid email required'),
  clientPhone: z.string().optional().default(''),
  jobType: z.string().optional().default(''),
  address: z.string().optional().default(''),
  estimatedBudget: z.number().optional(),
  jobStage: z.number().min(1).max(7).optional().default(1),
  keyDates: z.object({
    estimateDate: z.string().optional().default(''),
    contractDate: z.string().optional().default(''),
    startDate: z.string().optional().default(''),
    expectedCompletion: z.string().optional().default(''),
    actualCompletion: z.string().optional().default(''),
  }).optional(),
  notes: z.string().optional().default(''),
  isActive: z.boolean().optional().default(true),
})

// Site Settings Input Schema
// FIXED: Added all media fields (logo, favicon, contractorPhoto, heroVideo, heroImages)
export const SiteSettingsInputSchema = z.object({
  siteTitle: z.string().optional().default(''),
  heroHeadline: z.string().optional().default(''),
  heroSubheadline: z.string().optional().default(''),
  heroMediaType: z.enum(['images', 'video']).optional().default('images'),
  
  // MEDIA FIELDS - these are asset IDs from Sanity uploads
  logo: z.string().optional(),
  favicon: z.string().optional(),
  contractorPhoto: z.string().optional(),
  heroVideo: z.string().optional(),
  heroImages: z.array(z.union([
    z.string(), // Just asset ID
    z.object({  // Or object with asset ID and alt text
      assetId: z.string().optional(),
      alt: z.string().optional(),
    })
  ])).optional(),
  
  contractorName: z.string().optional().default(''),
  contractorTitle: z.string().optional().default(''),
  aboutHeadline: z.string().optional().default(''),
  aboutText: z.string().optional().default(''),
  aboutStats: z.array(z.object({
    value: z.string(),
    label: z.string(),
  })).optional().default([]),
  phone: z.string().optional().default(''),
  email: z.string().optional().default(''),
  address: z.string().optional().default(''),
  serviceArea: z.string().optional().default(''),
  officeHours: z.string().optional().default(''),
  instagram: z.string().optional().default(''),
  facebook: z.string().optional().default(''),
  linkedin: z.string().optional().default(''),
  youtube: z.string().optional().default(''),
  yelp: z.string().optional().default(''),
  google: z.string().optional().default(''),
  houzz: z.string().optional().default(''),
  nextdoor: z.string().optional().default(''),
  licenseNumber: z.string().optional().default(''),
  licenseState: z.string().optional().default(''),
  insuranceInfo: z.string().optional().default(''),
  bondInfo: z.string().optional().default(''),
})

// ============================================
// CRM VALIDATION SCHEMAS
// ============================================

// Lead Input Schema (for website form auto-creation)
export const LeadWebFormSchema = z.object({
  fullName: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email required').optional().or(z.literal('')),
  phone: z.string().optional().default(''),
  message: z.string().optional().default(''),
  serviceType: z.string().optional().default(''),
  formId: z.string().optional().default('contact-page'),
})

// Lead Input Schema (for admin CRUD)
// PHASE 2 (A3): status is now z.string() - validated against settings.pipelineStages at API layer
export const LeadInputSchema = z.object({
  _id: z.string().optional(),
  fullName: z.string().min(1, 'Full name is required'),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional().default(''),
  origin: z.enum(['auto_website_form', 'auto_landing_page', 'manual']).default('manual'),
  source: z.string().optional().default(''),
  serviceType: z.string().optional().default(''),
  estimatedValue: z.number().optional(),
  priority: z.enum(['high', 'medium', 'low']).default('medium'),
  status: z.string().default('new'),
  referredBy: z.string().optional().default(''),
  originalMessage: z.string().optional().default(''),
  description: z.string().optional().default(''),
  internalNotes: z.string().optional().default(''),
})

// Client Input Schema
export const ClientInputSchema = z.object({
  _id: z.string().optional(),
  fullName: z.string().min(1, 'Full name is required'),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional().default(''),
  address: z.string().optional().default(''),
  status: z.enum(['active', 'past']).default('active'),
  preferredContact: z.enum(['phone', 'email', 'text']).optional(),
  internalNotes: z.string().optional().default(''),
  propertyType: z.string().optional().default(''),
  sourceLeadId: z.string().optional(), // Reference to source lead
})

// Deal Input Schema
// PHASE 2 (A3): status is now z.string() - validated against settings.dealStatuses at API layer
export const DealInputSchema = z.object({
  _id: z.string().optional(),
  title: z.string().min(1, 'Project title is required'),
  clientId: z.string().min(1, 'Client is required'), // Reference to client
  dealType: z.string().optional().default(''),
  value: z.number().optional(),
  status: z.string().default('planning'),
  projectAddress: z.string().optional().default(''),
  permitNumber: z.string().optional().default(''),
  estimatedDuration: z.string().optional().default(''),
  scope: z.array(z.string()).optional().default([]),
  contractSignedDate: z.string().optional().default(''),
  startDate: z.string().optional().default(''),
  expectedEndDate: z.string().optional().default(''),
  actualEndDate: z.string().optional().default(''),
  description: z.string().optional().default(''),
  internalNotes: z.string().optional().default(''),
})

// Activity Input Schema
export const ActivityInputSchema = z.object({
  _id: z.string().optional(),
  type: z.string().min(1, 'Activity type is required'),
  description: z.string().optional().default(''),
  leadId: z.string().optional(),
  clientId: z.string().optional(),
  dealId: z.string().optional(),
  performedBy: z.string().optional().default('admin'),
  metadata: z.object({
    oldStatus: z.string().optional(),
    newStatus: z.string().optional(),
    callDuration: z.number().optional(),
    quoteAmount: z.number().optional(),
  }).optional(),
})

// CRM Settings Input Schema
export const CrmSettingsInputSchema = z.object({
  pipelineStages: z.array(z.object({
    key: z.string(),
    label: z.string(),
    color: z.string(),
  })).optional(),
  dealStatuses: z.array(z.object({
    key: z.string(),
    label: z.string(),
    color: z.string(),
  })).optional(),
  leadSources: z.array(z.string()).optional(),
  serviceTypes: z.array(z.string()).optional(),
  defaultPriority: z.enum(['high', 'medium', 'low']).optional(),
  currency: z.string().optional().default('$'),
  industryLabel: z.string().optional().default('Contractor'),
  dealLabel: z.string().optional().default('Project'),
  leadsPageSize: z.number().optional().default(20),
})
