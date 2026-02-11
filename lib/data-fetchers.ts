import { getSanityClient, isSanityConfigured } from './sanity'

// ============================================================================
// Demo Mode State Tracker
// ============================================================================

let _isDemoMode = false
let _demoReason = ''

export function setDemoMode(reason: string) {
  _isDemoMode = true
  _demoReason = reason
}

export function isDemoMode() {
  return _isDemoMode
}

export function getDemoReason() {
  return _demoReason
}

// ============================================================================
// TypeScript Interfaces
// ============================================================================

export interface SanityImage {
  _type: 'image'
  asset?: {
    _ref: string
    _type: 'reference'
  }
  hotspot?: {
    x: number
    y: number
    height: number
    width: number
  }
  alt?: string
  caption?: string
}

export interface Project {
  _id: string
  _type: 'project'
  _createdAt?: string
  _updatedAt?: string
  title: string
  slug: { current: string }
  status: 'completed' | 'in-progress' | 'upcoming'
  projectType?: string
  service?: { _ref: string }
  location?: {
    city?: string
    state?: string
    neighborhood?: string
  }
  completionDate?: string
  duration?: string
  budgetRange?: string
  scope?: string[]
  permitNumber?: string
  shortDescription?: string
  description?: string
  clientTestimonial?: string
  clientName?: string
  heroImage?: SanityImage
  beforeImage?: SanityImage
  gallery?: SanityImage[]
  videoUrl?: string
  seoTitle?: string
  seoDescription?: string
}

export interface ServiceHighlight {
  title: string
  description: string
}

export interface Service {
  _id: string
  _type: 'service'
  _createdAt?: string
  _updatedAt?: string
  name: string
  slug: { current: string }
  tagline: string
  description: string
  highlights?: ServiceHighlight[]
  priceRange?: string
  typicalDuration?: string
  image?: SanityImage
  gallery?: SanityImage[]
  order: number
  isActive: boolean
}

export interface Testimonial {
  _id: string
  _type: 'testimonial'
  _createdAt?: string
  _updatedAt?: string
  clientName: string
  clientLocation?: string
  quote: string
  rating?: number
  projectType?: string
  project?: { _ref: string }
  date?: string
  clientPhoto?: SanityImage
  isFeatured: boolean
  isActive: boolean
  order: number
}

export interface KeyDates {
  estimateDate?: string
  contractDate?: string
  startDate?: string
  expectedCompletion?: string
  actualCompletion?: string
}

export interface ActiveJob {
  _id: string
  _type: 'activeJob'
  _createdAt?: string
  _updatedAt?: string
  clientName: string
  clientEmail: string
  clientPhone?: string
  jobType?: string
  service?: { _ref: string }
  address?: string
  estimatedBudget?: number
  jobStage: number
  keyDates?: KeyDates
  notes?: string
  isActive: boolean
}

export interface Faq {
  _id: string
  _type: 'faq'
  _createdAt?: string
  question: string
  answer: string
  category?: string
  order: number
  isActive: boolean
}

export interface AboutStat {
  value: string
  label: string
}

export interface SiteSettings {
  _id: string
  _type: 'siteSettings'
  siteTitle?: string
  heroHeadline?: string
  heroSubheadline?: string
  heroMediaType?: 'images' | 'video'
  heroImages?: (SanityImage & { url?: string })[]
  heroVideo?: { asset?: { _ref: string } }
  heroVideoUrl?: string
  contractorName?: string
  contractorTitle?: string
  contractorPhoto?: SanityImage
  aboutHeadline?: string
  aboutText?: string
  aboutStats?: AboutStat[]
  phone?: string
  email?: string
  address?: string
  serviceArea?: string
  officeHours?: string
  logo?: SanityImage
  favicon?: SanityImage
  instagram?: string
  facebook?: string
  linkedin?: string
  youtube?: string
  yelp?: string
  google?: string
  houzz?: string
  nextdoor?: string
  licenseNumber?: string
  licenseState?: string
  insuranceInfo?: string
  bondInfo?: string
}

// ============================================================================
// Demo Data
// ============================================================================

const defaultProjects: Project[] = [
  {
    _id: 'demo-project-1',
    _type: 'project',
    title: 'Modern Kitchen Renovation',
    slug: { current: 'modern-kitchen-renovation' },
    status: 'completed',
    projectType: 'Kitchen Remodel',
    location: { city: 'Austin', state: 'TX', neighborhood: 'Westlake Hills' },
    completionDate: '2024-01-15',
    duration: '8 weeks',
    budgetRange: '$45,000 - $55,000',
    scope: [
      'Complete demo of existing kitchen',
      'Custom cabinetry installation',
      'Quartz countertops',
      'New appliances',
      'Recessed lighting',
      'Hardwood flooring',
    ],
    shortDescription: 'A complete kitchen transformation featuring custom cabinetry, quartz countertops, and modern appliances.',
    description: 'This stunning kitchen renovation transformed a dated 1990s kitchen into a modern culinary space. We removed walls to create an open-concept layout, installed custom shaker-style cabinets, and added a large island with seating for four.\n\nThe homeowners selected beautiful white quartz countertops that complement the navy blue island. High-end stainless steel appliances and a farmhouse sink complete the look.',
    clientTestimonial: 'The team exceeded our expectations at every turn. Our new kitchen is absolutely stunning!',
    clientName: 'The Johnson Family',
  },
  {
    _id: 'demo-project-2',
    _type: 'project',
    title: 'Luxury Master Bathroom',
    slug: { current: 'luxury-master-bathroom' },
    status: 'completed',
    projectType: 'Bathroom Renovation',
    location: { city: 'Austin', state: 'TX', neighborhood: 'Tarrytown' },
    completionDate: '2023-11-20',
    duration: '5 weeks',
    budgetRange: '$28,000 - $35,000',
    scope: [
      'Walk-in shower with frameless glass',
      'Freestanding soaking tub',
      'Heated tile floors',
      'Double vanity with marble top',
      'Custom lighting',
    ],
    shortDescription: 'A spa-like master bathroom retreat with walk-in shower, soaking tub, and heated floors.',
    description: 'We transformed this master bathroom into a spa-like retreat. The centerpiece is a stunning freestanding soaking tub positioned beneath a picture window. The walk-in shower features floor-to-ceiling marble tile and multiple shower heads.\n\nHeated floors throughout provide comfort on cold mornings, while the double vanity offers plenty of storage and counter space.',
    clientTestimonial: 'Every morning feels like a spa day now. Best investment we have made in our home!',
    clientName: 'Sarah M.',
  },
  {
    _id: 'demo-project-3',
    _type: 'project',
    title: 'Outdoor Living Deck',
    slug: { current: 'outdoor-living-deck' },
    status: 'completed',
    projectType: 'Deck Addition',
    location: { city: 'Cedar Park', state: 'TX' },
    completionDate: '2023-09-01',
    duration: '3 weeks',
    budgetRange: '$18,000 - $22,000',
    scope: [
      'Composite decking installation',
      'Built-in bench seating',
      'Pergola with string lights',
      'Outdoor kitchen prep area',
      'Code-compliant railings',
    ],
    shortDescription: 'A beautiful composite deck with pergola, built-in seating, and outdoor kitchen area.',
    description: 'This outdoor living project extended the homeowner\'s living space into their beautiful backyard. We built a 400 sq ft composite deck with multiple levels to follow the natural terrain.\n\nThe pergola provides shade and ambiance with integrated string lights. Built-in bench seating around the perimeter maximizes space while an outdoor prep area makes entertaining a breeze.',
    clientTestimonial: 'We practically live outside now! The deck has become everyone\'s favorite spot.',
    clientName: 'The Garcia Family',
  },
  {
    _id: 'demo-project-4',
    _type: 'project',
    title: 'Whole Home Renovation',
    slug: { current: 'whole-home-renovation' },
    status: 'completed',
    projectType: 'Full Renovation',
    location: { city: 'Round Rock', state: 'TX' },
    completionDate: '2023-06-15',
    duration: '4 months',
    budgetRange: '$150,000 - $180,000',
    scope: [
      'Open floor plan conversion',
      'All new electrical and plumbing',
      'HVAC replacement',
      'Kitchen and 3 bathroom remodels',
      'New flooring throughout',
      'Exterior updates',
    ],
    shortDescription: 'A complete transformation of a 1980s home into a modern, open-concept living space.',
    description: 'This comprehensive renovation took a tired 1980s home and brought it into the modern era. We opened up the main living areas by removing non-load-bearing walls and adding a structural beam.\n\nEvery system was updated including electrical, plumbing, and HVAC. The kitchen was completely redesigned with a large island, and all three bathrooms received full makeovers. New LVP flooring throughout unifies the space.',
    clientTestimonial: 'It feels like a brand new home. The attention to detail was incredible.',
    clientName: 'Mike & Jennifer T.',
  },
]

const defaultServices: Service[] = [
  {
    _id: 'demo-service-1',
    _type: 'service',
    name: 'Kitchen Remodeling',
    slug: { current: 'kitchen-remodeling' },
    tagline: 'Transform your kitchen into the heart of your home',
    description: 'From minor updates to complete transformations, we bring your dream kitchen to life. Our kitchen remodeling services include custom cabinetry, countertop installation, appliance upgrades, lighting design, and flooring. We work with you to maximize functionality while creating a beautiful space where memories are made.',
    highlights: [
      { title: 'Custom Design', description: 'Personalized layouts that fit your lifestyle and cooking needs' },
      { title: 'Quality Materials', description: 'Premium cabinets, countertops, and fixtures built to last' },
      { title: 'Expert Installation', description: 'Skilled craftsmen ensure flawless execution' },
      { title: 'Project Management', description: 'On-time completion with clear communication throughout' },
    ],
    priceRange: '$25,000 - $75,000+',
    typicalDuration: '4-10 weeks',
    order: 1,
    isActive: true,
  },
  {
    _id: 'demo-service-2',
    _type: 'service',
    name: 'Bathroom Renovation',
    slug: { current: 'bathroom-renovation' },
    tagline: 'Create your personal spa retreat',
    description: 'Transform your bathroom into a relaxing sanctuary. Whether you want a quick refresh or a complete gut renovation, we handle everything from tile work and fixtures to custom vanities and walk-in showers. Our team specializes in maximizing space and creating spa-like atmospheres.',
    highlights: [
      { title: 'Spa Features', description: 'Soaking tubs, rain showers, and heated floors' },
      { title: 'Smart Storage', description: 'Custom vanities and built-in solutions' },
      { title: 'Waterproofing', description: 'Proper moisture barriers and ventilation' },
      { title: 'Accessibility', description: 'ADA-compliant options available' },
    ],
    priceRange: '$15,000 - $50,000+',
    typicalDuration: '3-6 weeks',
    order: 2,
    isActive: true,
  },
  {
    _id: 'demo-service-3',
    _type: 'service',
    name: 'Deck & Outdoor Living',
    slug: { current: 'deck-outdoor-living' },
    tagline: 'Extend your living space outdoors',
    description: 'Enjoy the outdoors in style with a custom deck, patio, or outdoor living space. We build with premium materials including composite decking, natural hardwoods, and stone. From simple decks to full outdoor kitchens and living areas, we create spaces perfect for entertaining and relaxation.',
    highlights: [
      { title: 'Durable Materials', description: 'Composite and hardwood options that last' },
      { title: 'Custom Features', description: 'Built-in seating, pergolas, and kitchens' },
      { title: 'Code Compliant', description: 'Proper permits and safety railings' },
      { title: 'Low Maintenance', description: 'Materials chosen for Texas weather' },
    ],
    priceRange: '$10,000 - $40,000+',
    typicalDuration: '2-4 weeks',
    order: 3,
    isActive: true,
  },
  {
    _id: 'demo-service-4',
    _type: 'service',
    name: 'Home Additions',
    slug: { current: 'home-additions' },
    tagline: 'More space without moving',
    description: 'Need more room? We design and build home additions that blend seamlessly with your existing structure. From extra bedrooms and home offices to sunrooms and in-law suites, we handle every aspect from permits and foundation to finishing touches.',
    highlights: [
      { title: 'Seamless Design', description: 'Additions that match your existing home' },
      { title: 'Full Service', description: 'Permits, design, and construction' },
      { title: 'Foundation Work', description: 'Proper engineering and construction' },
      { title: 'Value Add', description: 'Increase your home\'s square footage and value' },
    ],
    priceRange: '$50,000 - $200,000+',
    typicalDuration: '8-16 weeks',
    order: 4,
    isActive: true,
  },
  {
    _id: 'demo-service-5',
    _type: 'service',
    name: 'Whole Home Renovation',
    slug: { current: 'whole-home-renovation' },
    tagline: 'Reimagine your entire living space',
    description: 'Ready for a complete transformation? Our whole home renovation service addresses everything from floor plan changes to system upgrades. We coordinate all trades, handle permits, and manage the project so you can focus on enjoying your new home.',
    highlights: [
      { title: 'Open Concepts', description: 'Remove walls and reimagine flow' },
      { title: 'System Updates', description: 'Electrical, plumbing, and HVAC' },
      { title: 'Modern Finishes', description: 'Flooring, lighting, and fixtures' },
      { title: 'One Contractor', description: 'Single point of contact for everything' },
    ],
    priceRange: '$100,000 - $300,000+',
    typicalDuration: '3-6 months',
    order: 5,
    isActive: true,
  },
]

const defaultTestimonials: Testimonial[] = [
  {
    _id: 'demo-testimonial-1',
    _type: 'testimonial',
    clientName: 'Jennifer & Mark Thompson',
    clientLocation: 'Austin, TX',
    quote: 'From start to finish, the experience was exceptional. They transformed our outdated kitchen into a stunning modern space. The attention to detail was remarkable, and they finished on time and on budget. We could not be happier!',
    rating: 5,
    projectType: 'Kitchen Remodel',
    date: '2024-01-20',
    isFeatured: true,
    isActive: true,
    order: 1,
  },
  {
    _id: 'demo-testimonial-2',
    _type: 'testimonial',
    clientName: 'David Chen',
    clientLocation: 'Cedar Park, TX',
    quote: 'Professional, communicative, and skilled. They built us a beautiful deck that has become the favorite spot in our home. The quality of work is outstanding and the crew was respectful of our property throughout the project.',
    rating: 5,
    projectType: 'Deck Addition',
    date: '2023-10-15',
    isFeatured: true,
    isActive: true,
    order: 2,
  },
  {
    _id: 'demo-testimonial-3',
    _type: 'testimonial',
    clientName: 'The Martinez Family',
    clientLocation: 'Round Rock, TX',
    quote: 'We hired them for a complete home renovation and they exceeded every expectation. Living through a renovation is never easy, but they made it as painless as possible with clear communication and professional work.',
    rating: 5,
    projectType: 'Whole Home Renovation',
    date: '2023-08-01',
    isFeatured: true,
    isActive: true,
    order: 3,
  },
  {
    _id: 'demo-testimonial-4',
    _type: 'testimonial',
    clientName: 'Susan Williams',
    clientLocation: 'Lakeway, TX',
    quote: 'My master bathroom is now a true spa retreat. The tile work is flawless, and they helped me select beautiful fixtures that elevated the entire design. Highly recommend for any bathroom project!',
    rating: 5,
    projectType: 'Bathroom Renovation',
    date: '2023-12-01',
    isFeatured: false,
    isActive: true,
    order: 4,
  },
]

const defaultActiveJobs: ActiveJob[] = []

const defaultFaqs: Faq[] = [
  {
    _id: 'demo-faq-1',
    _type: 'faq',
    question: 'How long does a typical kitchen remodel take?',
    answer: 'A typical kitchen remodel takes 4-10 weeks depending on the scope of work. Minor updates like countertops and painting may take 2-3 weeks, while a full gut renovation with custom cabinetry can take 8-10 weeks.',
    category: 'Process',
    order: 1,
    isActive: true,
  },
  {
    _id: 'demo-faq-2',
    _type: 'faq',
    question: 'Do you handle permits and inspections?',
    answer: 'Yes, we handle all necessary permits and coordinate inspections with local authorities. Permit requirements vary by project scope and municipality, and we take care of the entire process so you do not have to worry about it.',
    category: 'Process',
    order: 2,
    isActive: true,
  },
  {
    _id: 'demo-faq-3',
    _type: 'faq',
    question: 'What is the typical cost range for a bathroom renovation?',
    answer: 'Bathroom renovations typically range from $15,000 to $50,000 or more depending on the scope. A basic refresh with new fixtures and paint starts around $15,000, while a full renovation with custom tile, walk-in shower, and heated floors can be $35,000-$50,000+.',
    category: 'Pricing',
    order: 3,
    isActive: true,
  },
  {
    _id: 'demo-faq-4',
    _type: 'faq',
    question: 'Are you licensed and insured?',
    answer: 'Yes, we are fully licensed and insured. We carry comprehensive general liability insurance and workers compensation coverage. We are happy to provide proof of insurance upon request.',
    category: 'General',
    order: 4,
    isActive: true,
  },
]

const defaultSiteSettings: SiteSettings = {
  _id: 'demo-site-settings',
  _type: 'siteSettings',
  siteTitle: 'ContractorsGWS',
  heroHeadline: 'Quality Craftsmanship, Exceptional Results',
  heroSubheadline: 'Transforming homes throughout the greater Austin area with expert remodeling and construction services.',
  heroMediaType: 'images',
  contractorName: 'ContractorsGWS',
  contractorTitle: 'General Contractor & Remodeling Specialist',
  aboutHeadline: 'Building Trust Through Quality Work',
  aboutText: 'With over 15 years of experience in residential construction and remodeling, we have built our reputation on quality craftsmanship, transparent communication, and delivering projects on time and on budget.\n\nOur team of skilled professionals treats every project—big or small—with the same level of care and attention to detail. We believe your home should reflect your vision, and we are here to make that vision a reality.\n\nFrom kitchen and bathroom renovations to whole-home remodels and additions, we handle every aspect of your project with expertise and professionalism.',
  aboutStats: [
    { value: '15+', label: 'Years Experience' },
    { value: '200+', label: 'Projects Completed' },
    { value: '100%', label: 'Licensed & Insured' },
    { value: '5★', label: 'Average Rating' },
  ],
  phone: '(512) 555-0123',
  email: 'info@contractorsgws.com',
  address: '123 Main Street\nAustin, TX 78701',
  serviceArea: 'Greater Austin Area',
  officeHours: 'Monday - Friday: 8am - 5pm\nSaturday: By Appointment\nSunday: Closed',
  licenseNumber: 'CONT-123456',
  licenseState: 'TX',
  insuranceInfo: 'Fully Insured - $2M Liability Coverage',
}

// ============================================================================
// Data Fetchers
// ============================================================================

export async function getProjects(): Promise<Project[]> {
  if (!isSanityConfigured()) {
    setDemoMode('Sanity not configured')
    return defaultProjects
  }

  try {
    const client = getSanityClient()
    const projects = await client.fetch<Project[]>(`
      *[_type == "project"] | order(_createdAt desc) {
        _id,
        _type,
        _createdAt,
        _updatedAt,
        title,
        slug,
        status,
        projectType,
        service,
        location,
        completionDate,
        duration,
        budgetRange,
        scope,
        permitNumber,
        shortDescription,
        description,
        clientTestimonial,
        clientName,
        heroImage,
        beforeImage,
        gallery,
        videoUrl,
        seoTitle,
        seoDescription
      }
    `)

    if (!projects || projects.length === 0) {
      setDemoMode('No projects in Sanity')
      return defaultProjects
    }

    return projects
  } catch (error) {
    setDemoMode(`Sanity query failed: ${error}`)
    return defaultProjects
  }
}

export async function getProjectBySlug(slug: string): Promise<Project | null> {
  if (!isSanityConfigured()) {
    setDemoMode('Sanity not configured')
    return defaultProjects.find(p => p.slug.current === slug) || null
  }

  try {
    const client = getSanityClient()
    const project = await client.fetch<Project | null>(`
      *[_type == "project" && slug.current == $slug][0] {
        _id,
        _type,
        _createdAt,
        _updatedAt,
        title,
        slug,
        status,
        projectType,
        service,
        location,
        completionDate,
        duration,
        budgetRange,
        scope,
        permitNumber,
        shortDescription,
        description,
        clientTestimonial,
        clientName,
        heroImage,
        beforeImage,
        gallery,
        videoUrl,
        seoTitle,
        seoDescription
      }
    `, { slug })

    if (!project) {
      const demoProject = defaultProjects.find(p => p.slug.current === slug)
      if (demoProject) {
        setDemoMode('Project not found in Sanity, using demo')
        return demoProject
      }
      return null
    }

    return project
  } catch (error) {
    setDemoMode(`Sanity query failed: ${error}`)
    return defaultProjects.find(p => p.slug.current === slug) || null
  }
}

export async function getServices(): Promise<Service[]> {
  if (!isSanityConfigured()) {
    setDemoMode('Sanity not configured')
    return defaultServices
  }

  try {
    const client = getSanityClient()
    const services = await client.fetch<Service[]>(`
      *[_type == "service" && isActive == true] | order(order asc) {
        _id,
        _type,
        _createdAt,
        _updatedAt,
        name,
        slug,
        tagline,
        description,
        highlights,
        priceRange,
        typicalDuration,
        image,
        gallery,
        order,
        isActive
      }
    `)

    if (!services || services.length === 0) {
      setDemoMode('No services in Sanity')
      return defaultServices
    }

    return services
  } catch (error) {
    setDemoMode(`Sanity query failed: ${error}`)
    return defaultServices
  }
}

export async function getServiceBySlug(slug: string): Promise<Service | null> {
  if (!isSanityConfigured()) {
    setDemoMode('Sanity not configured')
    return defaultServices.find(s => s.slug.current === slug) || null
  }

  try {
    const client = getSanityClient()
    const service = await client.fetch<Service | null>(`
      *[_type == "service" && slug.current == $slug][0] {
        _id,
        _type,
        _createdAt,
        _updatedAt,
        name,
        slug,
        tagline,
        description,
        highlights,
        priceRange,
        typicalDuration,
        image,
        gallery,
        order,
        isActive
      }
    `, { slug })

    if (!service) {
      const demoService = defaultServices.find(s => s.slug.current === slug)
      if (demoService) {
        setDemoMode('Service not found in Sanity, using demo')
        return demoService
      }
      return null
    }

    return service
  } catch (error) {
    setDemoMode(`Sanity query failed: ${error}`)
    return defaultServices.find(s => s.slug.current === slug) || null
  }
}

export async function getTestimonials(): Promise<Testimonial[]> {
  if (!isSanityConfigured()) {
    setDemoMode('Sanity not configured')
    return defaultTestimonials
  }

  try {
    const client = getSanityClient()
    const testimonials = await client.fetch<Testimonial[]>(`
      *[_type == "testimonial" && isActive == true] | order(order asc) {
        _id,
        _type,
        _createdAt,
        _updatedAt,
        clientName,
        clientLocation,
        quote,
        rating,
        projectType,
        project,
        date,
        clientPhoto,
        isFeatured,
        isActive,
        order
      }
    `)

    if (!testimonials || testimonials.length === 0) {
      setDemoMode('No testimonials in Sanity')
      return defaultTestimonials
    }

    return testimonials
  } catch (error) {
    setDemoMode(`Sanity query failed: ${error}`)
    return defaultTestimonials
  }
}

export async function getFeaturedTestimonials(): Promise<Testimonial[]> {
  if (!isSanityConfigured()) {
    setDemoMode('Sanity not configured')
    return defaultTestimonials.filter(t => t.isFeatured)
  }

  try {
    const client = getSanityClient()
    const testimonials = await client.fetch<Testimonial[]>(`
      *[_type == "testimonial" && isActive == true && isFeatured == true] | order(order asc) {
        _id,
        _type,
        _createdAt,
        _updatedAt,
        clientName,
        clientLocation,
        quote,
        rating,
        projectType,
        project,
        date,
        clientPhoto,
        isFeatured,
        isActive,
        order
      }
    `)

    if (!testimonials || testimonials.length === 0) {
      setDemoMode('No featured testimonials in Sanity')
      return defaultTestimonials.filter(t => t.isFeatured)
    }

    return testimonials
  } catch (error) {
    setDemoMode(`Sanity query failed: ${error}`)
    return defaultTestimonials.filter(t => t.isFeatured)
  }
}

export async function getActiveJobs(): Promise<ActiveJob[]> {
  if (!isSanityConfigured()) {
    setDemoMode('Sanity not configured')
    return defaultActiveJobs
  }

  try {
    const client = getSanityClient()
    const jobs = await client.fetch<ActiveJob[]>(`
      *[_type == "activeJob" && isActive == true] | order(jobStage desc) {
        _id,
        _type,
        _createdAt,
        _updatedAt,
        clientName,
        clientEmail,
        clientPhone,
        jobType,
        service,
        address,
        estimatedBudget,
        jobStage,
        keyDates,
        notes,
        isActive
      }
    `)

    if (!jobs) {
      setDemoMode('No active jobs in Sanity')
      return defaultActiveJobs
    }

    return jobs
  } catch (error) {
    setDemoMode(`Sanity query failed: ${error}`)
    return defaultActiveJobs
  }
}

export async function getSiteSettings(): Promise<SiteSettings> {
  if (!isSanityConfigured()) {
    setDemoMode('Sanity not configured')
    return defaultSiteSettings
  }

  try {
    const client = getSanityClient()
    const settings = await client.fetch<SiteSettings | null>(`
      *[_type == "siteSettings"][0] {
        _id,
        _type,
        siteTitle,
        heroHeadline,
        heroSubheadline,
        heroMediaType,
        heroImages[] {
          _key,
          alt,
          "url": asset->url,
          asset { _ref }
        },
        "heroVideoUrl": heroVideo.asset->url,
        heroVideo { asset { _ref } },
        contractorName,
        contractorTitle,
        contractorPhoto,
        aboutHeadline,
        aboutText,
        aboutStats,
        phone,
        email,
        address,
        serviceArea,
        officeHours,
        logo,
        favicon,
        instagram,
        facebook,
        linkedin,
        youtube,
        yelp,
        google,
        houzz,
        nextdoor,
        licenseNumber,
        licenseState,
        insuranceInfo,
        bondInfo
      }
    `)

    if (!settings) {
      setDemoMode('No site settings in Sanity')
      return defaultSiteSettings
    }

    return settings
  } catch (error) {
    setDemoMode(`Sanity query failed: ${error}`)
    return defaultSiteSettings
  }
}

export async function getFaqs(): Promise<Faq[]> {
  if (!isSanityConfigured()) {
    setDemoMode('Sanity not configured')
    return defaultFaqs
  }

  try {
    const client = getSanityClient()
    const faqs = await client.fetch<Faq[]>(`
      *[_type == "faq" && isActive == true] | order(order asc) {
        _id,
        _type,
        _createdAt,
        question,
        answer,
        category,
        order,
        isActive
      }
    `)

    if (!faqs || faqs.length === 0) {
      setDemoMode('No FAQs in Sanity')
      return defaultFaqs
    }

    return faqs
  } catch (error) {
    setDemoMode(`Sanity query failed: ${error}`)
    return defaultFaqs
  }
}
