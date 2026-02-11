import Link from 'next/link'
import Image from 'next/image'
import {
  Phone,
  Mail,
  MapPin,
  Instagram,
  Facebook,
  Linkedin,
  Youtube,
} from 'lucide-react'

interface FooterProps {
  logo?: string
  companyName: string
  aboutText?: string
  phone?: string
  email?: string
  address?: string
  serviceArea?: string
  licenseNumber?: string
  licenseState?: string
  instagramUrl?: string
  facebookUrl?: string
  linkedinUrl?: string
  youtubeUrl?: string
  yelpUrl?: string
  googleBusinessUrl?: string
  houzzUrl?: string
  nextdoorUrl?: string
}

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/projects', label: 'Projects' },
  { href: '/services', label: 'Services' },
  { href: '/testimonials', label: 'Testimonials' },
  { href: '/faq', label: 'FAQ' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
]

// Custom SVG icons for platforms Lucide doesn't have
function YelpIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.14 11.18L9.24 6.16c-.48-.83-.14-1.52.76-1.52h4.4c.9 0 1.24.69.76 1.52l-2.9 5.02a.54.54 0 01-.12 0zm-.28 2.64l-5.1 2.94c-.83.48-1.52.14-1.52-.76v-4.4c0-.9.69-1.24 1.52-.76l5.1 2.94c.04.02.04.02 0 .04zm2.28 0l5.1-2.94c.83-.48 1.52-.14 1.52.76v4.4c0 .9-.69 1.24-1.52.76l-5.1-2.94c-.04-.02-.04-.02 0-.04zm-1-1.64l2.9-5.02c.48-.83 1.38-.83 1.86 0l2.9 5.02c.48.83.14 1.52-.76 1.52h-5.8c-.9 0-1.24-.69-.76-1.52h-.34zm0 3.64l-2.9 5.02c-.48.83-1.38.83-1.86 0l-2.9-5.02c-.48-.83-.14-1.52.76-1.52h5.8c.9 0 1.24.69.76 1.52h.34z" />
    </svg>
  )
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  )
}

function HouzzIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 5.5l7 4.04v8.92h-4.5v-5.5h-5v5.5H5v-8.92l7-4.04M12 2L2 7.77v12.46c0 .98.8 1.77 1.77 1.77h16.46c.98 0 1.77-.8 1.77-1.77V7.77L12 2z" />
    </svg>
  )
}

function NextdoorIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.5 14.5h-9v-2h9v2zm0-4h-9v-2h9v2zm0-4h-9v-2h9v2z" />
    </svg>
  )
}

export default function Footer({
  logo,
  companyName,
  aboutText,
  phone,
  email,
  address,
  serviceArea,
  licenseNumber,
  licenseState,
  instagramUrl,
  facebookUrl,
  linkedinUrl,
  youtubeUrl,
  yelpUrl,
  googleBusinessUrl,
  houzzUrl,
  nextdoorUrl,
}: FooterProps) {
  const truncatedAbout = aboutText
    ? aboutText.slice(0, 150) + (aboutText.length > 150 ? '...' : '')
    : ''

  const socialLinks = [
    { url: instagramUrl, icon: Instagram, label: 'Instagram' },
    { url: facebookUrl, icon: Facebook, label: 'Facebook' },
    { url: linkedinUrl, icon: Linkedin, label: 'LinkedIn' },
    { url: youtubeUrl, icon: Youtube, label: 'YouTube' },
    { url: yelpUrl, icon: YelpIcon, label: 'Yelp' },
    { url: googleBusinessUrl, icon: GoogleIcon, label: 'Google' },
    { url: houzzUrl, icon: HouzzIcon, label: 'Houzz' },
    { url: nextdoorUrl, icon: NextdoorIcon, label: 'Nextdoor' },
  ].filter((link) => link.url)

  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-primary-900 text-white">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Column 1: Logo & About */}
          <div className="lg:col-span-1">
            {logo ? (
              <Image
                src={logo}
                alt={companyName}
                width={160}
                height={48}
                className="h-10 w-auto object-contain mb-4 brightness-0 invert"
              />
            ) : (
              <h3 className="text-xl font-bold mb-4 font-heading">{companyName}</h3>
            )}
            {truncatedAbout && (
              <p className="text-white/70 text-sm leading-relaxed">
                {truncatedAbout}
              </p>
            )}
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4 font-heading">Quick Links</h4>
            <ul className="space-y-2">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-white/70 hover:text-accent transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Contact Info */}
          <div>
            <h4 className="text-lg font-semibold mb-4 font-heading">Contact Us</h4>
            <ul className="space-y-3">
              {phone && (
                <li>
                  <a
                    href={`tel:${phone.replace(/\D/g, '')}`}
                    className="flex items-start gap-3 text-white/70 hover:text-accent transition-colors"
                  >
                    <Phone className="h-5 w-5 flex-shrink-0 mt-0.5" />
                    <span>{phone}</span>
                  </a>
                </li>
              )}
              {email && (
                <li>
                  <a
                    href={`mailto:${email}`}
                    className="flex items-start gap-3 text-white/70 hover:text-accent transition-colors"
                  >
                    <Mail className="h-5 w-5 flex-shrink-0 mt-0.5" />
                    <span>{email}</span>
                  </a>
                </li>
              )}
              {address && (
                <li className="flex items-start gap-3 text-white/70">
                  <MapPin className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <span className="whitespace-pre-line">{address}</span>
                </li>
              )}
              {serviceArea && (
                <li className="text-white/70 text-sm mt-4">
                  Serving: {serviceArea}
                </li>
              )}
            </ul>
          </div>

          {/* Column 4: Social Media */}
          {socialLinks.length > 0 && (
            <div>
              <h4 className="text-lg font-semibold mb-4 font-heading">Follow Us</h4>
              <div className="flex flex-wrap gap-3">
                {socialLinks.map((social) => {
                  const Icon = social.icon
                  return (
                    <a
                      key={social.label}
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 bg-primary-800 rounded-lg text-white/70 hover:text-white hover:bg-primary-700 transition-colors"
                      aria-label={social.label}
                    >
                      <Icon className="h-5 w-5" />
                    </a>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-primary-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-4 text-sm text-white/60">
            {/* Copyright */}
            <div>
              &copy; {currentYear} {companyName}. All rights reserved.
            </div>

            {/* License Info */}
            {(licenseNumber || licenseState) && (
              <div className="flex items-center gap-2">
                {licenseNumber && <span>License #{licenseNumber}</span>}
                {licenseNumber && licenseState && <span>|</span>}
                {licenseState && <span>{licenseState}</span>}
              </div>
            )}

            {/* daflash Credit */}
            <div className="flex items-center gap-2">
              <span>Website by</span>
              <a
                href="https://daflash.co.il"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-accent hover:text-accent-400 transition-colors"
              >
                daflash
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
