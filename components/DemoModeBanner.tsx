'use client'

import { useState, useEffect } from 'react'
import { X, AlertCircle } from 'lucide-react'

interface DemoModeBannerProps {
  isDemo: boolean
}

export default function DemoModeBanner({ isDemo }: DemoModeBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Check if banner was dismissed this session
    const dismissed = sessionStorage.getItem('demo-banner-dismissed')
    if (!dismissed && isDemo) {
      setIsVisible(true)
    }
  }, [isDemo])

  const handleDismiss = () => {
    sessionStorage.setItem('demo-banner-dismissed', 'true')
    setIsDismissed(true)
    setTimeout(() => setIsVisible(false), 300)
  }

  if (!isVisible) return null

  return (
    <div
      className={`bg-amber-500 text-white transition-all duration-300 ${
        isDismissed ? 'opacity-0 -translate-y-full' : 'opacity-100 translate-y-0'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>
              Demo Mode — Connect Sanity CMS to manage your content
            </span>
          </div>
          <button
            onClick={handleDismiss}
            className="p-1 hover:bg-amber-600 rounded transition-colors flex-shrink-0"
            aria-label="Dismiss banner"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
