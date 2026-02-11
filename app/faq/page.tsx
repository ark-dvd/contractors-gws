import { Metadata } from 'next'
import { HelpCircle } from 'lucide-react'
import { getFaqs, getSiteSettings } from '@/lib/data-fetchers'
import CTASection from '@/components/CTASection'
import { StructuredData } from '@/components/StructuredData'
import FaqAccordion from './FaqAccordion'

// Revalidate every 60 seconds (ISR)
export const revalidate = 60

export const metadata: Metadata = {
  title: 'FAQ',
  description: 'Find answers to frequently asked questions about our construction and remodeling services, process, pricing, and more.',
}

export default async function FaqPage() {
  const [faqs, settings] = await Promise.all([
    getFaqs(),
    getSiteSettings(),
  ])

  const companyName = settings.contractorName || 'Contractor'

  // Group FAQs by category
  const categorized = new Map<string, typeof faqs>()
  const uncategorized: typeof faqs = []

  for (const faq of faqs) {
    if (faq.category) {
      const existing = categorized.get(faq.category) || []
      existing.push(faq)
      categorized.set(faq.category, existing)
    } else {
      uncategorized.push(faq)
    }
  }

  const hasCategories = categorized.size > 0

  // Build structured data for FAQ page
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  }

  return (
    <>
      <StructuredData data={structuredData} />

      {/* Hero Section */}
      <section className="bg-slate-900 py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            Find answers to common questions about our services, process, and what to expect
          </p>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="py-12 lg:py-16 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          {faqs.length > 0 ? (
            hasCategories ? (
              <div className="space-y-10">
                {/* Categorized FAQs */}
                {Array.from(categorized.entries()).map(([category, items]) => (
                  <div key={category}>
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">
                      {category}
                    </h2>
                    <div className="space-y-4">
                      {items.map((faq) => (
                        <FaqAccordion key={faq._id} question={faq.question} answer={faq.answer} />
                      ))}
                    </div>
                  </div>
                ))}

                {/* Uncategorized FAQs */}
                {uncategorized.length > 0 && (
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">
                      Other Questions
                    </h2>
                    <div className="space-y-4">
                      {uncategorized.map((faq) => (
                        <FaqAccordion key={faq._id} question={faq.question} answer={faq.answer} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Flat list - no categories */
              <div className="space-y-4">
                {faqs.map((faq) => (
                  <FaqAccordion key={faq._id} question={faq.question} answer={faq.answer} />
                ))}
              </div>
            )
          ) : (
            <div className="text-center py-16 bg-white rounded-xl">
              <HelpCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">
                FAQ coming soon!
              </p>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <CTASection companyName={companyName} phone={settings.phone} />
    </>
  )
}
