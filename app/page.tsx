import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'
import {
  getSiteSettings,
  getProjects,
  getServices,
  getTestimonials,
} from '@/lib/data-fetchers'
import { sanityImageUrl } from '@/lib/sanity-helpers'
import HeroSection from '@/components/HeroSection'
import ProjectCard from '@/components/ProjectCard'
import ServiceCard from '@/components/ServiceCard'
import TestimonialCard from '@/components/TestimonialCard'
import CTASection from '@/components/CTASection'

export default async function HomePage() {
  // Fetch all data in parallel
  const [settings, projects, services, testimonials] = await Promise.all([
    getSiteSettings(),
    getProjects(),
    getServices(),
    getTestimonials(),
  ])

  // Filter featured projects (take first 6 completed)
  const featuredProjects = projects
    .filter((p) => p.status === 'completed')
    .slice(0, 6)

  // Filter active services
  const activeServices = services.filter((s) => s.isActive !== false)

  // Filter featured testimonials
  const featuredTestimonials = testimonials.filter((t) => t.isFeatured)

  // Parse stats from settings
  const stats = settings.aboutStats || []

  // Transform hero images
  const heroImages = settings.heroImages?.map((img) => ({
    url: sanityImageUrl(img) || '',
    alt: img.alt || '',
  })).filter((img) => img.url) || []

  // Get hero video URL (simplified - would need proper video URL handling)
  const heroVideoUrl = settings.heroVideo?.asset?._ref
    ? `https://cdn.sanity.io/files/${process.env.NEXT_PUBLIC_SANITY_PROJECT_ID}/${process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'}/${settings.heroVideo.asset._ref.replace('file-', '').replace('-mp4', '.mp4')}`
    : undefined

  // Transform photo URL
  const photoUrl = sanityImageUrl(settings.contractorPhoto)

  // Company name
  const companyName = settings.contractorName || 'Contractor'

  return (
    <>
      {/* Hero Section */}
      <HeroSection
        mediaType={settings.heroMediaType === 'video' ? 'video' : 'slider'}
        images={heroImages}
        videoUrl={heroVideoUrl}
        headline={settings.heroHeadline || 'Building Dreams, One Project at a Time'}
        subheadline={settings.heroSubheadline}
      />

      {/* Featured Projects Section */}
      {featuredProjects.length > 0 && (
        <section className="py-16 lg:py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                Our Work
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Explore our portfolio of completed projects and see the quality
                craftsmanship we bring to every job.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {featuredProjects.map((project) => (
                <ProjectCard
                  key={project._id}
                  slug={project.slug.current}
                  title={project.title}
                  heroImage={sanityImageUrl(project.heroImage)}
                  projectType={project.projectType}
                  shortDescription={project.shortDescription}
                />
              ))}
            </div>

            <div className="text-center mt-12">
              <Link
                href="/projects"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800 transition-colors"
              >
                View All Projects
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Services Overview Section */}
      {activeServices.length > 0 && (
        <section className="py-16 lg:py-24 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                Our Services
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                From concept to completion, we offer a full range of construction
                and renovation services.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {activeServices.map((service) => (
                <ServiceCard
                  key={service._id}
                  slug={service.slug.current}
                  title={service.name}
                  image={sanityImageUrl(service.image)}
                  tagline={service.tagline}
                />
              ))}
            </div>

            <div className="text-center mt-12">
              <Link
                href="/services"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800 transition-colors"
              >
                View All Services
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Testimonials Section */}
      {featuredTestimonials.length > 0 && (
        <section className="py-16 lg:py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                What Our Clients Say
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Don&apos;t just take our word for it — hear from our satisfied
                customers.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {featuredTestimonials.slice(0, 3).map((testimonial) => (
                <TestimonialCard
                  key={testimonial._id}
                  clientName={testimonial.clientName}
                  clientLocation={testimonial.clientLocation}
                  clientPhoto={sanityImageUrl(testimonial.clientPhoto)}
                  quote={testimonial.quote}
                  rating={testimonial.rating || 5}
                  projectType={testimonial.projectType}
                />
              ))}
            </div>

            <div className="text-center mt-12">
              <Link
                href="/testimonials"
                className="inline-flex items-center gap-2 text-amber-600 font-semibold hover:text-amber-700 transition-colors"
              >
                Read More Reviews
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* About Preview Section */}
      <section className="py-16 lg:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Image */}
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-xl">
              {photoUrl ? (
                <Image
                  src={photoUrl}
                  alt={companyName}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center">
                  <span className="text-4xl font-bold text-amber-600">
                    {companyName.charAt(0)}
                  </span>
                </div>
              )}
            </div>

            {/* Content */}
            <div>
              {settings.aboutHeadline && (
                <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
                  {settings.aboutHeadline}
                </h2>
              )}
              {settings.aboutText && (
                <div className="prose prose-lg text-gray-600 mb-8">
                  <p>
                    {settings.aboutText.slice(0, 400)}
                    {settings.aboutText.length > 400 ? '...' : ''}
                  </p>
                </div>
              )}

              {/* Stats */}
              {stats.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 mb-8">
                  {stats.slice(0, 3).map((stat, index) => (
                    <div key={index}>
                      <div className="text-3xl lg:text-4xl font-bold text-amber-500">
                        {stat.value}
                      </div>
                      <div className="text-sm text-gray-600">{stat.label}</div>
                    </div>
                  ))}
                </div>
              )}

              <Link
                href="/about"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800 transition-colors"
              >
                Learn More About Us
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <CTASection companyName={companyName} phone={settings.phone} />
    </>
  )
}
