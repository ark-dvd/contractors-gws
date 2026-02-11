'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Menu, X, Phone } from 'lucide-react'

interface HeaderProps {
  logo?: string
  companyName: string
  phone?: string
  isTransparent?: boolean
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

export default function Header({ logo, companyName, phone, isTransparent = false }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  // Handle scroll for background change
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close menu on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMenuOpen(false)
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [])

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isMenuOpen])

  // Determine header styling based on transparency and scroll state
  const showSolidBg = !isTransparent || isScrolled
  const headerBg = showSolidBg
    ? 'bg-white shadow-md'
    : 'bg-transparent'
  const textColor = showSolidBg ? 'text-dark' : 'text-white'
  const textHover = showSolidBg ? 'hover:text-primary' : 'hover:text-accent'
  const logoFilter = showSolidBg ? '' : 'brightness-0 invert'

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${headerBg}`}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            {logo ? (
              <Image
                src={logo}
                alt={companyName}
                width={160}
                height={48}
                className={`h-10 lg:h-12 w-auto object-contain transition-all ${logoFilter}`}
                priority
              />
            ) : (
              <span className={`text-xl lg:text-2xl font-bold font-heading ${textColor}`}>
                {companyName}
              </span>
            )}
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`font-medium transition-colors ${textColor} ${textHover}`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden lg:flex items-center gap-4">
            {phone && (
              <a
                href={`tel:${phone.replace(/\D/g, '')}`}
                className={`flex items-center gap-2 font-medium transition-colors ${textColor} ${textHover}`}
              >
                <Phone className="h-4 w-4" />
                {phone}
              </a>
            )}
            <Link
              href="/contact"
              className="px-5 py-2.5 bg-accent text-dark font-semibold rounded-lg hover:bg-accent-600 transition-colors shadow-sm"
            >
              Get a Free Quote
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={`lg:hidden p-2 transition-colors ${textColor} ${textHover}`}
            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {isMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <div
        className={`fixed inset-0 z-40 lg:hidden transition-all duration-300 ${
          isMenuOpen
            ? 'opacity-100 pointer-events-auto'
            : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/50"
          onClick={() => setIsMenuOpen(false)}
        />

        {/* Menu Panel */}
        <div
          className={`absolute top-0 right-0 w-full max-w-sm h-full bg-white shadow-xl transform transition-transform duration-300 ${
            isMenuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          {/* Menu Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            {logo ? (
              <Image
                src={logo}
                alt={companyName}
                width={120}
                height={36}
                className="h-8 w-auto object-contain"
              />
            ) : (
              <span className="text-lg font-bold text-dark font-heading">
                {companyName}
              </span>
            )}
            <button
              onClick={() => setIsMenuOpen(false)}
              className="p-2 text-secondary hover:text-dark"
              aria-label="Close menu"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Menu Links */}
          <div className="py-4">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMenuOpen(false)}
                className="block px-6 py-3 text-lg font-medium text-dark hover:bg-light hover:text-primary transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Menu Footer */}
          <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-gray-100 bg-light">
            {phone && (
              <a
                href={`tel:${phone.replace(/\D/g, '')}`}
                className="flex items-center justify-center gap-2 mb-4 text-dark font-medium"
              >
                <Phone className="h-5 w-5 text-primary" />
                {phone}
              </a>
            )}
            <Link
              href="/contact"
              onClick={() => setIsMenuOpen(false)}
              className="block w-full py-3 bg-accent text-dark font-semibold rounded-lg hover:bg-accent-600 transition-colors text-center"
            >
              Get a Free Quote
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}
