import type { Metadata } from 'next'
import { getSiteSettings } from '@/lib/data-fetchers'
import { isSanityConfigured } from '@/lib/sanity'
import PublicLayout from '@/components/PublicLayout'
import './globals.css'

// Force dynamic rendering for all pages to ensure CSP nonces match
// Per DOC-040: strict-dynamic CSP requires nonces to match at request time
// Trade-off: No ISR caching, but guaranteed CSP compliance
export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings()
  const contractorName = settings.contractorName || 'Professional Contractor'
  const description = settings.aboutText?.slice(0, 160) || 'Professional contractor services'
  const baseUrl = process.env.NEXTAUTH_URL || 'https://yourdomain.com'

  return {
    metadataBase: new URL(baseUrl),
    title: {
      default: settings.siteTitle || contractorName,
      template: `%s | ${contractorName}`,
    },
    description,
    keywords: [
      'landscaping',
      'lawn care',
      'garden design',
      'outdoor living',
      'hardscaping',
      'contractor',
      settings.serviceArea || '',
    ].filter(Boolean),
    authors: [{ name: contractorName }],
    openGraph: {
      type: 'website',
      locale: 'en_US',
      siteName: contractorName,
      title: settings.siteTitle || contractorName,
      description,
    },
    twitter: {
      card: 'summary_large_image',
      title: settings.siteTitle || contractorName,
      description,
    },
    robots: {
      index: true,
      follow: true,
    },
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const settings = await getSiteSettings()
  const isDemo = !isSanityConfigured()

  return (
    <html lang="en">
      <body className="bg-light text-dark antialiased font-body">
        <PublicLayout settings={settings} isDemo={isDemo}>
          {children}
        </PublicLayout>
      </body>
    </html>
  )
}
