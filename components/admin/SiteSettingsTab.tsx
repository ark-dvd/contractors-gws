'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Image from 'next/image'
import {
  ChevronDown,
  Loader2,
  AlertCircle,
  CheckCircle,
  X,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Save,
  Image as ImageIcon,
  Video,
  Building2,
  Phone,
  Palette,
  Share2,
  Shield,
  ExternalLink,
  Instagram,
  Facebook,
  Linkedin,
  Youtube,
} from 'lucide-react'
import { adminFetch, adminPut } from '@/lib/admin-api'
import ImageUpload from './ImageUpload'

// Types
interface HeroImage {
  url: string
  alt: string
}

interface Stat {
  value: string
  label: string
}

interface SiteSettings {
  _id?: string
  // Hero Section
  heroMediaType: 'slider' | 'video'
  heroImages: HeroImage[]
  heroVideoUrl?: string
  heroHeadline: string
  heroSubheadline: string
  // About / Company
  companyName: string
  title: string
  photo?: string
  aboutHeadline: string
  aboutText: string
  stats: Stat[]
  // Contact
  phone: string
  email: string
  address: string
  serviceArea: string
  officeHours: string
  // Branding
  logo?: string
  favicon?: string
  // Social Media
  instagramUrl: string
  facebookUrl: string
  linkedinUrl: string
  youtubeUrl: string
  yelpUrl: string
  googleBusinessUrl: string
  houzzUrl: string
  nextdoorUrl: string
  // Legal
  licenseNumber: string
  licenseState: string
  insuranceInfo: string
  bondInfo: string
}

const DEFAULT_SETTINGS: SiteSettings = {
  heroMediaType: 'slider',
  heroImages: [],
  heroVideoUrl: '',
  heroHeadline: '',
  heroSubheadline: '',
  companyName: '',
  title: '',
  photo: '',
  aboutHeadline: '',
  aboutText: '',
  stats: [],
  phone: '',
  email: '',
  address: '',
  serviceArea: '',
  officeHours: '',
  logo: '',
  favicon: '',
  instagramUrl: '',
  facebookUrl: '',
  linkedinUrl: '',
  youtubeUrl: '',
  yelpUrl: '',
  googleBusinessUrl: '',
  houzzUrl: '',
  nextdoorUrl: '',
  licenseNumber: '',
  licenseState: '',
  insuranceInfo: '',
  bondInfo: '',
}

// US States for license dropdown
const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
]

// Section configuration
const SECTIONS = [
  { id: 'hero', name: 'Hero Section', icon: ImageIcon },
  { id: 'about', name: 'About / Company Info', icon: Building2 },
  { id: 'contact', name: 'Contact Info', icon: Phone },
  { id: 'branding', name: 'Branding', icon: Palette },
  { id: 'social', name: 'Social Media', icon: Share2 },
  { id: 'legal', name: 'Legal / License', icon: Shield },
] as const

type SectionId = typeof SECTIONS[number]['id']

// Toast notification
function Toast({
  message,
  type,
  onClose,
}: {
  message: string
  type: 'success' | 'error'
  onClose: () => void
}) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div
      className={`fixed bottom-20 lg:bottom-6 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg ${
        type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
      }`}
    >
      {type === 'success' ? (
        <CheckCircle className="h-5 w-5" />
      ) : (
        <AlertCircle className="h-5 w-5" />
      )}
      <span className="font-medium">{message}</span>
      <button onClick={onClose} className="ml-2 hover:opacity-80">
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

// Accordion Section wrapper
function AccordionSection({
  id,
  title,
  icon: Icon,
  isOpen,
  onToggle,
  hasChanges,
  isSaving,
  onSave,
  children,
}: {
  id: string
  title: string
  icon: React.ElementType
  isOpen: boolean
  onToggle: () => void
  hasChanges: boolean
  isSaving: boolean
  onSave: () => void
  children: React.ReactNode
}) {
  const contentRef = useRef<HTMLDivElement>(null)

  return (
    <div
      className={`bg-white rounded-xl shadow-sm overflow-hidden transition-all ${
        hasChanges ? 'ring-2 ring-amber-300' : ''
      }`}
    >
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 lg:p-6 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div
            className={`p-2 rounded-lg ${
              isOpen ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-500'
            }`}
          >
            <Icon className="h-5 w-5" />
          </div>
          <span className="font-semibold text-gray-900">{title}</span>
          {hasChanges && (
            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
              Unsaved
            </span>
          )}
        </div>
        <ChevronDown
          className={`h-5 w-5 text-gray-400 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Content */}
      <div
        ref={contentRef}
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          isOpen ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-4 lg:px-6 pb-6 space-y-6 border-t border-gray-100 pt-6">
          {children}

          {/* Section save button */}
          <div className="flex justify-end pt-4 border-t border-gray-100">
            <button
              onClick={(e) => {
                e.stopPropagation()
                onSave()
              }}
              disabled={isSaving || !hasChanges}
              className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save {title}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Social media field component
function SocialField({
  icon: Icon,
  label,
  value,
  onChange,
  placeholder,
}: {
  icon: React.ElementType
  label: string
  value: string
  onChange: (value: string) => void
  placeholder: string
}) {
  const isFilled = value.trim().length > 0
  const isValidUrl = isFilled && (value.startsWith('http://') || value.startsWith('https://'))

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <div className="relative flex items-center gap-2">
        <div
          className={`p-2.5 rounded-lg ${
            isFilled ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
          }`}
        >
          <Icon className="h-5 w-5" />
        </div>
        <input
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
        />
        {isValidUrl && (
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
            title="Test link"
          >
            <ExternalLink className="h-5 w-5" />
          </a>
        )}
      </div>
    </div>
  )
}

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

// Loading skeleton
function SettingsSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="bg-white rounded-xl p-6 shadow-sm animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-200 rounded-lg" />
            <div className="h-5 w-40 bg-gray-200 rounded" />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function SiteSettingsTab() {
  // State
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS)
  const [originalSettings, setOriginalSettings] = useState<SiteSettings>(DEFAULT_SETTINGS)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [savingSection, setSavingSection] = useState<SectionId | null>(null)

  // Accordion state - hero expanded by default
  const [openSections, setOpenSections] = useState<Set<SectionId>>(() => new Set<SectionId>(['hero']))

  // Toast state
  const [toast, setToast] = useState<{
    message: string
    type: 'success' | 'error'
  } | null>(null)

  // Fetch settings
  const fetchSettings = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await adminFetch<SiteSettings>('settings')
      const merged = { ...DEFAULT_SETTINGS, ...data }
      setSettings(merged)
      setOriginalSettings(merged)
    } catch (e) {
      // Settings might not exist yet, that's OK
      if (e instanceof Error && e.message.includes('404')) {
        setSettings(DEFAULT_SETTINGS)
        setOriginalSettings(DEFAULT_SETTINGS)
      } else {
        setError(e instanceof Error ? e.message : 'Failed to load settings')
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  // Check if a section has changes
  const sectionHasChanges = useCallback(
    (sectionId: SectionId): boolean => {
      switch (sectionId) {
        case 'hero':
          return (
            settings.heroMediaType !== originalSettings.heroMediaType ||
            JSON.stringify(settings.heroImages) !== JSON.stringify(originalSettings.heroImages) ||
            settings.heroVideoUrl !== originalSettings.heroVideoUrl ||
            settings.heroHeadline !== originalSettings.heroHeadline ||
            settings.heroSubheadline !== originalSettings.heroSubheadline
          )
        case 'about':
          return (
            settings.companyName !== originalSettings.companyName ||
            settings.title !== originalSettings.title ||
            settings.photo !== originalSettings.photo ||
            settings.aboutHeadline !== originalSettings.aboutHeadline ||
            settings.aboutText !== originalSettings.aboutText ||
            JSON.stringify(settings.stats) !== JSON.stringify(originalSettings.stats)
          )
        case 'contact':
          return (
            settings.phone !== originalSettings.phone ||
            settings.email !== originalSettings.email ||
            settings.address !== originalSettings.address ||
            settings.serviceArea !== originalSettings.serviceArea ||
            settings.officeHours !== originalSettings.officeHours
          )
        case 'branding':
          return (
            settings.logo !== originalSettings.logo ||
            settings.favicon !== originalSettings.favicon
          )
        case 'social':
          return (
            settings.instagramUrl !== originalSettings.instagramUrl ||
            settings.facebookUrl !== originalSettings.facebookUrl ||
            settings.linkedinUrl !== originalSettings.linkedinUrl ||
            settings.youtubeUrl !== originalSettings.youtubeUrl ||
            settings.yelpUrl !== originalSettings.yelpUrl ||
            settings.googleBusinessUrl !== originalSettings.googleBusinessUrl ||
            settings.houzzUrl !== originalSettings.houzzUrl ||
            settings.nextdoorUrl !== originalSettings.nextdoorUrl
          )
        case 'legal':
          return (
            settings.licenseNumber !== originalSettings.licenseNumber ||
            settings.licenseState !== originalSettings.licenseState ||
            settings.insuranceInfo !== originalSettings.insuranceInfo ||
            settings.bondInfo !== originalSettings.bondInfo
          )
        default:
          return false
      }
    },
    [settings, originalSettings]
  )

  // Check if any section has changes
  const hasAnyChanges = SECTIONS.some((s) => sectionHasChanges(s.id))

  // Toggle accordion section
  const toggleSection = (sectionId: SectionId) => {
    setOpenSections((prev) => {
      const next = new Set(prev)
      if (next.has(sectionId)) {
        next.delete(sectionId)
      } else {
        next.add(sectionId)
      }
      return next
    })
  }

  // Save all settings
  const handleSaveAll = async () => {
    setIsSaving(true)
    try {
      await adminPut('settings', settings)
      setOriginalSettings(settings)
      setToast({ message: 'All settings saved successfully', type: 'success' })
    } catch (e) {
      setToast({
        message: e instanceof Error ? e.message : 'Failed to save settings',
        type: 'error',
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Save single section
  const handleSaveSection = async (sectionId: SectionId) => {
    setSavingSection(sectionId)
    try {
      await adminPut('settings', settings)
      setOriginalSettings(settings)
      setToast({
        message: `${SECTIONS.find((s) => s.id === sectionId)?.name} saved`,
        type: 'success',
      })
    } catch (e) {
      setToast({
        message: e instanceof Error ? e.message : 'Failed to save settings',
        type: 'error',
      })
    } finally {
      setSavingSection(null)
    }
  }

  // Hero image management
  const addHeroImage = () => {
    // This will be handled by ImageUpload callback
  }

  const removeHeroImage = (index: number) => {
    setSettings((prev) => ({
      ...prev,
      heroImages: prev.heroImages.filter((_, i) => i !== index),
    }))
  }

  const updateHeroImageAlt = (index: number, alt: string) => {
    setSettings((prev) => ({
      ...prev,
      heroImages: prev.heroImages.map((img, i) =>
        i === index ? { ...img, alt } : img
      ),
    }))
  }

  // Stats management
  const addStat = () => {
    setSettings((prev) => ({
      ...prev,
      stats: [...prev.stats, { value: '', label: '' }],
    }))
  }

  const removeStat = (index: number) => {
    setSettings((prev) => ({
      ...prev,
      stats: prev.stats.filter((_, i) => i !== index),
    }))
  }

  const updateStat = (index: number, field: 'value' | 'label', value: string) => {
    setSettings((prev) => ({
      ...prev,
      stats: prev.stats.map((stat, i) =>
        i === index ? { ...stat, [field]: value } : stat
      ),
    }))
  }

  const moveStatUp = (index: number) => {
    if (index === 0) return
    setSettings((prev) => {
      const newStats = [...prev.stats]
      ;[newStats[index - 1], newStats[index]] = [newStats[index], newStats[index - 1]]
      return { ...prev, stats: newStats }
    })
  }

  const moveStatDown = (index: number) => {
    if (index === settings.stats.length - 1) return
    setSettings((prev) => {
      const newStats = [...prev.stats]
      ;[newStats[index], newStats[index + 1]] = [newStats[index + 1], newStats[index]]
      return { ...prev, stats: newStats }
    })
  }

  // Loading state
  if (isLoading) {
    return <SettingsSkeleton />
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-red-900 mb-2">
          Failed to Load Settings
        </h3>
        <p className="text-red-700 mb-4">{error}</p>
        <button
          onClick={fetchSettings}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4 pb-24">
      {/* Section 1: Hero */}
      <AccordionSection
        id="hero"
        title="Hero Section"
        icon={ImageIcon}
        isOpen={openSections.has('hero')}
        onToggle={() => toggleSection('hero')}
        hasChanges={sectionHasChanges('hero')}
        isSaving={savingSection === 'hero'}
        onSave={() => handleSaveSection('hero')}
      >
        {/* Hero Media Type Toggle */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Hero Media Type
          </label>
          <div className="flex gap-4">
            <label
              className={`flex-1 flex items-center justify-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                settings.heroMediaType === 'slider'
                  ? 'border-amber-500 bg-amber-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                name="heroMediaType"
                value="slider"
                checked={settings.heroMediaType === 'slider'}
                onChange={() =>
                  setSettings((prev) => ({ ...prev, heroMediaType: 'slider' }))
                }
                className="sr-only"
              />
              <ImageIcon
                className={`h-6 w-6 ${
                  settings.heroMediaType === 'slider'
                    ? 'text-amber-600'
                    : 'text-gray-400'
                }`}
              />
              <span
                className={`font-medium ${
                  settings.heroMediaType === 'slider'
                    ? 'text-amber-900'
                    : 'text-gray-600'
                }`}
              >
                Image Slider
              </span>
            </label>
            <label
              className={`flex-1 flex items-center justify-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                settings.heroMediaType === 'video'
                  ? 'border-amber-500 bg-amber-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                name="heroMediaType"
                value="video"
                checked={settings.heroMediaType === 'video'}
                onChange={() =>
                  setSettings((prev) => ({ ...prev, heroMediaType: 'video' }))
                }
                className="sr-only"
              />
              <Video
                className={`h-6 w-6 ${
                  settings.heroMediaType === 'video'
                    ? 'text-amber-600'
                    : 'text-gray-400'
                }`}
              />
              <span
                className={`font-medium ${
                  settings.heroMediaType === 'video'
                    ? 'text-amber-900'
                    : 'text-gray-600'
                }`}
              >
                Video Background
              </span>
            </label>
          </div>
        </div>

        {/* Image Slider Options */}
        {settings.heroMediaType === 'slider' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hero Images
            </label>
            <p className="text-xs text-gray-500 mb-4">
              Recommended: 3-5 high-quality images, 1920x1080 or larger
            </p>

            {/* Current images */}
            {settings.heroImages.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                {settings.heroImages.map((image, index) => (
                  <div key={index} className="relative group">
                    <div className="aspect-video rounded-lg overflow-hidden bg-gray-100">
                      <Image
                        src={image.url}
                        alt={image.alt || `Hero image ${index + 1}`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 50vw, 33vw"
                      />
                    </div>
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => removeHeroImage(index)}
                        className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <input
                      type="text"
                      value={image.alt}
                      onChange={(e) => updateHeroImageAlt(index, e.target.value)}
                      placeholder="Alt text..."
                      className="mt-2 w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Add image */}
            <ImageUpload
              value={null}
              onUpload={(assetId, url) => {
                setSettings((prev) => ({
                  ...prev,
                  heroImages: [...prev.heroImages, { url, alt: '' }],
                }))
              }}
              onRemove={() => {}}
              label="Add Hero Image"
            />
          </div>
        )}

        {/* Video Background Options */}
        {settings.heroMediaType === 'video' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hero Video
            </label>
            <p className="text-xs text-gray-500 mb-4">
              Recommended: MP4 format, under 30MB, 15-30 seconds, no audio needed
            </p>

            {settings.heroVideoUrl ? (
              <div className="relative rounded-lg overflow-hidden bg-gray-100 mb-4">
                <video
                  src={settings.heroVideoUrl}
                  muted
                  loop
                  playsInline
                  className="w-full aspect-video object-cover"
                  controls
                />
                <button
                  type="button"
                  onClick={() =>
                    setSettings((prev) => ({ ...prev, heroVideoUrl: '' }))
                  }
                  className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <ImageUpload
                value={null}
                onUpload={(assetId, url) => {
                  setSettings((prev) => ({ ...prev, heroVideoUrl: url }))
                }}
                onRemove={() => {}}
                label="Upload Hero Video"
                accept="video/*"
              />
            )}
          </div>
        )}

        {/* Hero Text */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Hero Headline
          </label>
          <input
            type="text"
            value={settings.heroHeadline}
            onChange={(e) =>
              setSettings((prev) => ({ ...prev, heroHeadline: e.target.value }))
            }
            placeholder="e.g., Building Dreams, One Project at a Time"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Hero Subheadline
          </label>
          <textarea
            value={settings.heroSubheadline}
            onChange={(e) =>
              setSettings((prev) => ({ ...prev, heroSubheadline: e.target.value }))
            }
            rows={2}
            placeholder="e.g., Quality craftsmanship for your home renovation needs"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all resize-none"
          />
        </div>
      </AccordionSection>

      {/* Section 2: About / Company Info */}
      <AccordionSection
        id="about"
        title="About / Company Info"
        icon={Building2}
        isOpen={openSections.has('about')}
        onToggle={() => toggleSection('about')}
        hasChanges={sectionHasChanges('about')}
        isSaving={savingSection === 'about'}
        onSave={() => handleSaveSection('about')}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contractor / Company Name
            </label>
            <input
              type="text"
              value={settings.companyName}
              onChange={(e) =>
                setSettings((prev) => ({ ...prev, companyName: e.target.value }))
              }
              placeholder="e.g., Smith Construction"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title / Specialty
            </label>
            <input
              type="text"
              value={settings.title}
              onChange={(e) =>
                setSettings((prev) => ({ ...prev, title: e.target.value }))
              }
              placeholder="e.g., General Contractor | Kitchen & Bath Specialist"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
            />
          </div>
        </div>

        <ImageUpload
          value={settings.photo || null}
          onUpload={(assetId, url) =>
            setSettings((prev) => ({ ...prev, photo: url }))
          }
          onRemove={() => setSettings((prev) => ({ ...prev, photo: '' }))}
          label="Photo (Headshot or Team)"
          className="max-w-md"
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            About Headline
          </label>
          <input
            type="text"
            value={settings.aboutHeadline}
            onChange={(e) =>
              setSettings((prev) => ({ ...prev, aboutHeadline: e.target.value }))
            }
            placeholder="e.g., 20 Years of Excellence"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            About Text
          </label>
          <textarea
            value={settings.aboutText}
            onChange={(e) =>
              setSettings((prev) => ({ ...prev, aboutText: e.target.value }))
            }
            rows={10}
            placeholder="Tell your story... How did you get started? What makes your work special?"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all resize-none"
          />
        </div>

        {/* Stats */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Stats (displayed on About page)
          </label>
          <p className="text-xs text-gray-500 mb-4">
            Examples: &quot;500+ Projects Completed&quot;, &quot;20 Years Experience&quot;, &quot;100% Satisfaction&quot;
          </p>

          <div className="space-y-3">
            {settings.stats.map((stat, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="flex flex-col gap-1">
                  <button
                    type="button"
                    onClick={() => moveStatUp(index)}
                    disabled={index === 0}
                    className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                  >
                    <ArrowUp className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveStatDown(index)}
                    disabled={index === settings.stats.length - 1}
                    className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                  >
                    <ArrowDown className="h-3 w-3" />
                  </button>
                </div>
                <input
                  type="text"
                  value={stat.value}
                  onChange={(e) => updateStat(index, 'value', e.target.value)}
                  placeholder="500+"
                  className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-center font-semibold"
                />
                <input
                  type="text"
                  value={stat.label}
                  onChange={(e) => updateStat(index, 'label', e.target.value)}
                  placeholder="Projects Completed"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                />
                <button
                  type="button"
                  onClick={() => removeStat(index)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addStat}
            className="mt-3 flex items-center gap-2 px-4 py-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Stat
          </button>
        </div>
      </AccordionSection>

      {/* Section 3: Contact Info */}
      <AccordionSection
        id="contact"
        title="Contact Info"
        icon={Phone}
        isOpen={openSections.has('contact')}
        onToggle={() => toggleSection('contact')}
        hasChanges={sectionHasChanges('contact')}
        isSaving={savingSection === 'contact'}
        onSave={() => handleSaveSection('contact')}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone
            </label>
            <input
              type="tel"
              value={settings.phone}
              onChange={(e) =>
                setSettings((prev) => ({ ...prev, phone: e.target.value }))
              }
              placeholder="(555) 123-4567"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={settings.email}
              onChange={(e) =>
                setSettings((prev) => ({ ...prev, email: e.target.value }))
              }
              placeholder="contact@yourcompany.com"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Address
          </label>
          <textarea
            value={settings.address}
            onChange={(e) =>
              setSettings((prev) => ({ ...prev, address: e.target.value }))
            }
            rows={2}
            placeholder="123 Main Street&#10;Austin, TX 78701"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Service Area
          </label>
          <input
            type="text"
            value={settings.serviceArea}
            onChange={(e) =>
              setSettings((prev) => ({ ...prev, serviceArea: e.target.value }))
            }
            placeholder="e.g., Greater Austin Area"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Office Hours
          </label>
          <textarea
            value={settings.officeHours}
            onChange={(e) =>
              setSettings((prev) => ({ ...prev, officeHours: e.target.value }))
            }
            rows={3}
            placeholder="Mon-Fri: 8am-6pm&#10;Sat: 9am-2pm&#10;Sun: Closed"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all resize-none"
          />
        </div>
      </AccordionSection>

      {/* Section 4: Branding */}
      <AccordionSection
        id="branding"
        title="Branding"
        icon={Palette}
        isOpen={openSections.has('branding')}
        onToggle={() => toggleSection('branding')}
        hasChanges={sectionHasChanges('branding')}
        isSaving={savingSection === 'branding'}
        onSave={() => handleSaveSection('branding')}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <ImageUpload
              value={settings.logo || null}
              onUpload={(assetId, url) =>
                setSettings((prev) => ({ ...prev, logo: url }))
              }
              onRemove={() => setSettings((prev) => ({ ...prev, logo: '' }))}
              label="Logo"
            />
            <p className="text-xs text-gray-500 mt-2">
              Recommended: PNG with transparent background, at least 200px wide
            </p>
            {settings.logo && (
              <div className="mt-4 p-4 bg-gray-900 rounded-lg">
                <p className="text-xs text-gray-400 mb-2">Header preview:</p>
                <Image
                  src={settings.logo}
                  alt="Logo preview"
                  width={120}
                  height={40}
                  className="h-10 w-auto object-contain"
                />
              </div>
            )}
          </div>

          <div>
            <ImageUpload
              value={settings.favicon || null}
              onUpload={(assetId, url) =>
                setSettings((prev) => ({ ...prev, favicon: url }))
              }
              onRemove={() => setSettings((prev) => ({ ...prev, favicon: '' }))}
              label="Favicon"
            />
            <p className="text-xs text-gray-500 mt-2">
              Recommended: Square image, 32x32 or 512x512 PNG
            </p>
            {settings.favicon && (
              <div className="mt-4 flex items-center gap-4">
                <div className="p-2 bg-gray-100 rounded">
                  <Image
                    src={settings.favicon}
                    alt="Favicon preview"
                    width={32}
                    height={32}
                    className="w-8 h-8 object-contain"
                  />
                </div>
                <span className="text-xs text-gray-500">32px preview</span>
              </div>
            )}
          </div>
        </div>
      </AccordionSection>

      {/* Section 5: Social Media */}
      <AccordionSection
        id="social"
        title="Social Media"
        icon={Share2}
        isOpen={openSections.has('social')}
        onToggle={() => toggleSection('social')}
        hasChanges={sectionHasChanges('social')}
        isSaving={savingSection === 'social'}
        onSave={() => handleSaveSection('social')}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SocialField
            icon={Instagram}
            label="Instagram"
            value={settings.instagramUrl}
            onChange={(value) =>
              setSettings((prev) => ({ ...prev, instagramUrl: value }))
            }
            placeholder="https://instagram.com/yourcompany"
          />
          <SocialField
            icon={Facebook}
            label="Facebook"
            value={settings.facebookUrl}
            onChange={(value) =>
              setSettings((prev) => ({ ...prev, facebookUrl: value }))
            }
            placeholder="https://facebook.com/yourcompany"
          />
          <SocialField
            icon={Linkedin}
            label="LinkedIn"
            value={settings.linkedinUrl}
            onChange={(value) =>
              setSettings((prev) => ({ ...prev, linkedinUrl: value }))
            }
            placeholder="https://linkedin.com/company/yourcompany"
          />
          <SocialField
            icon={Youtube}
            label="YouTube"
            value={settings.youtubeUrl}
            onChange={(value) =>
              setSettings((prev) => ({ ...prev, youtubeUrl: value }))
            }
            placeholder="https://youtube.com/@yourcompany"
          />
          <SocialField
            icon={YelpIcon}
            label="Yelp"
            value={settings.yelpUrl}
            onChange={(value) =>
              setSettings((prev) => ({ ...prev, yelpUrl: value }))
            }
            placeholder="https://yelp.com/biz/yourcompany"
          />
          <SocialField
            icon={GoogleIcon}
            label="Google Business"
            value={settings.googleBusinessUrl}
            onChange={(value) =>
              setSettings((prev) => ({ ...prev, googleBusinessUrl: value }))
            }
            placeholder="https://g.page/yourcompany"
          />
          <SocialField
            icon={HouzzIcon}
            label="Houzz"
            value={settings.houzzUrl}
            onChange={(value) =>
              setSettings((prev) => ({ ...prev, houzzUrl: value }))
            }
            placeholder="https://houzz.com/pro/yourcompany"
          />
          <SocialField
            icon={NextdoorIcon}
            label="Nextdoor"
            value={settings.nextdoorUrl}
            onChange={(value) =>
              setSettings((prev) => ({ ...prev, nextdoorUrl: value }))
            }
            placeholder="https://nextdoor.com/pages/yourcompany"
          />
        </div>
      </AccordionSection>

      {/* Section 6: Legal / License */}
      <AccordionSection
        id="legal"
        title="Legal / License"
        icon={Shield}
        isOpen={openSections.has('legal')}
        onToggle={() => toggleSection('legal')}
        hasChanges={sectionHasChanges('legal')}
        isSaving={savingSection === 'legal'}
        onSave={() => handleSaveSection('legal')}
      >
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-800">
            This information appears in your website footer for client trust and
            compliance.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contractor License Number
            </label>
            <input
              type="text"
              value={settings.licenseNumber}
              onChange={(e) =>
                setSettings((prev) => ({ ...prev, licenseNumber: e.target.value }))
              }
              placeholder="e.g., TACLA12345C"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              License State
            </label>
            <select
              value={settings.licenseState}
              onChange={(e) =>
                setSettings((prev) => ({ ...prev, licenseState: e.target.value }))
              }
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all bg-white"
            >
              <option value="">Select state...</option>
              {US_STATES.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Insurance Info
            </label>
            <input
              type="text"
              value={settings.insuranceInfo}
              onChange={(e) =>
                setSettings((prev) => ({ ...prev, insuranceInfo: e.target.value }))
              }
              placeholder="e.g., Fully insured, $2M liability"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bond Info (optional)
            </label>
            <input
              type="text"
              value={settings.bondInfo}
              onChange={(e) =>
                setSettings((prev) => ({ ...prev, bondInfo: e.target.value }))
              }
              placeholder="e.g., $25,000 surety bond"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
            />
          </div>
        </div>
      </AccordionSection>

      {/* Sticky Save All Button */}
      <div className="fixed bottom-20 lg:bottom-6 left-4 right-4 lg:left-auto lg:right-8 z-40">
        <div className="max-w-md mx-auto lg:mx-0 lg:ml-auto">
          <button
            onClick={handleSaveAll}
            disabled={isSaving || !hasAnyChanges}
            className={`w-full flex items-center justify-center gap-2 px-6 py-3 font-medium rounded-xl shadow-lg transition-all ${
              hasAnyChanges
                ? 'bg-amber-500 text-white hover:bg-amber-600 hover:shadow-xl'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isSaving ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Saving All Settings...
              </>
            ) : (
              <>
                <Save className="h-5 w-5" />
                Save All Settings
                {hasAnyChanges && (
                  <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-xs">
                    {SECTIONS.filter((s) => sectionHasChanges(s.id)).length} sections
                  </span>
                )}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}
