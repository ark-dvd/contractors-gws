import Link from 'next/link'
import { Phone } from 'lucide-react'

interface CTASectionProps {
  companyName: string
  phone?: string
}

export default function CTASection({ companyName, phone }: CTASectionProps) {
  return (
    <section className="bg-slate-900 py-16 lg:py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
          Ready to Start Your Project?
        </h2>
        <p className="text-lg text-gray-300 mb-8">
          Let {companyName} help bring your vision to life. Get in touch for a free consultation.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/contact"
            className="w-full sm:w-auto px-8 py-4 bg-amber-500 text-white font-semibold rounded-lg hover:bg-amber-600 transition-colors shadow-lg hover:shadow-xl"
          >
            Contact Us
          </Link>
          {phone && (
            <a
              href={`tel:${phone.replace(/\D/g, '')}`}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-gray-900 font-semibold rounded-lg hover:bg-gray-100 transition-colors shadow-lg hover:shadow-xl"
            >
              <Phone className="h-5 w-5" />
              {phone}
            </a>
          )}
        </div>
      </div>
    </section>
  )
}
