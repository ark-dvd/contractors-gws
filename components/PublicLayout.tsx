'use client'

import { usePathname } from 'next/navigation'
import Header from './Header'
import Footer from './Footer'
import DemoModeBanner from './DemoModeBanner'
import { SiteSettings } from '@/lib/data-fetchers'
import { sanityImageUrl } from '@/lib/sanity-helpers'

interface PublicLayoutProps {
  children: React.ReactNode
  settings: SiteSettings
  isDemo: boolean
}

export default function PublicLayout({
  children,
  settings,
  isDemo,
}: PublicLayoutProps) {
  const pathname = usePathname()
  const isAdminPage = pathname.startsWith('/admin')

  if (isAdminPage) {
    return <>{children}</>
  }

  // Transform Sanity image references to URLs
  const logoUrl = sanityImageUrl(settings.logo)
  const companyName = settings.contractorName || 'Contractor'

  return (
    <>
      {/* Skip to content link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-amber-500 focus:text-white focus:rounded-lg focus:font-semibold"
      >
        Skip to main content
      </a>
      <DemoModeBanner isDemo={isDemo} />
      <Header
        logo={logoUrl}
        companyName={companyName}
        phone={settings.phone}
      />
      <main id="main-content" className="min-h-screen" role="main">{children}</main>
      <Footer
        logo={logoUrl}
        companyName={companyName}
        aboutText={settings.aboutText}
        phone={settings.phone}
        email={settings.email}
        address={settings.address}
        serviceArea={settings.serviceArea}
        licenseNumber={settings.licenseNumber}
        licenseState={settings.licenseState}
        instagramUrl={settings.instagram}
        facebookUrl={settings.facebook}
        linkedinUrl={settings.linkedin}
        youtubeUrl={settings.youtube}
        yelpUrl={settings.yelp}
        googleBusinessUrl={settings.google}
        houzzUrl={settings.houzz}
        nextdoorUrl={settings.nextdoor}
      />
    </>
  )
}
