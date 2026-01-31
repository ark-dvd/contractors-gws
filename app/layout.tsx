import type { Metadata } from 'next'
import { getSiteSettings } from '@/lib/data-fetchers'
import { isSanityConfigured } from '@/lib/sanity'
import PublicLayout from '@/components/PublicLayout'
import './globals.css'

export const metadata: Metadata = {
  title: 'ContractorsGWS',
  description: 'Professional contracting services',
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
      <body className="bg-gray-50 text-gray-900 antialiased">
        <PublicLayout settings={settings} isDemo={isDemo}>
          {children}
        </PublicLayout>
      </body>
    </html>
  )
}
