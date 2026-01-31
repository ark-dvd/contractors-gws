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
export const SiteSettingsInputSchema = z.object({
  siteTitle: z.string().optional().default(''),
  heroHeadline: z.string().optional().default(''),
  heroSubheadline: z.string().optional().default(''),
  heroMediaType: z.enum(['images', 'video']).optional().default('images'),
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
