'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'

interface HeroImage {
  url: string
  alt?: string
}

interface HeroSectionProps {
  mediaType: 'slider' | 'video'
  images?: HeroImage[]
  videoUrl?: string
  headline: string
  subheadline?: string
}

export default function HeroSection({
  mediaType,
  images = [],
  videoUrl,
  headline,
  subheadline,
}: HeroSectionProps) {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)

  // Auto-advance slides
  const nextSlide = useCallback(() => {
    if (images.length <= 1) return
    setIsTransitioning(true)
    setTimeout(() => {
      setCurrentSlide((prev) => (prev + 1) % images.length)
      setIsTransitioning(false)
    }, 500)
  }, [images.length])

  useEffect(() => {
    if (mediaType !== 'slider' || images.length <= 1) return

    const interval = setInterval(nextSlide, 5000)
    return () => clearInterval(interval)
  }, [mediaType, images.length, nextSlide])

  const goToSlide = (index: number) => {
    if (index === currentSlide) return
    setIsTransitioning(true)
    setTimeout(() => {
      setCurrentSlide(index)
      setIsTransitioning(false)
    }, 500)
  }

  return (
    <section className="relative h-[80vh] min-h-[500px] max-h-[900px] overflow-hidden">
      {/* Background Media */}
      {mediaType === 'video' && videoUrl ? (
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src={videoUrl} type="video/mp4" />
        </video>
      ) : images.length > 0 ? (
        <div className="absolute inset-0">
          {images.map((image, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-1000 ${
                index === currentSlide && !isTransitioning
                  ? 'opacity-100'
                  : 'opacity-0'
              }`}
            >
              <Image
                src={image.url}
                alt={image.alt || `Hero image ${index + 1}`}
                fill
                className="object-cover"
                priority={index === 0}
                sizes="100vw"
              />
            </div>
          ))}
        </div>
      ) : (
        // Fallback gradient background
        <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900" />
      )}

      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Content */}
      <div className="relative h-full flex items-center justify-center text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 drop-shadow-lg">
            {headline}
          </h1>
          {subheadline && (
            <p className="text-lg sm:text-xl lg:text-2xl text-white/90 mb-8 max-w-2xl mx-auto drop-shadow">
              {subheadline}
            </p>
          )}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/projects"
              className="w-full sm:w-auto px-8 py-4 bg-amber-500 text-white font-semibold rounded-lg hover:bg-amber-600 transition-colors shadow-lg hover:shadow-xl"
            >
              View Our Projects
            </Link>
            <Link
              href="/contact"
              className="w-full sm:w-auto px-8 py-4 bg-white text-gray-900 font-semibold rounded-lg hover:bg-gray-100 transition-colors shadow-lg hover:shadow-xl"
            >
              Get a Free Quote
            </Link>
          </div>
        </div>
      </div>

      {/* Slide Navigation Dots */}
      {mediaType === 'slider' && images.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-3 h-3 rounded-full transition-all ${
                index === currentSlide
                  ? 'bg-white scale-110'
                  : 'bg-white/50 hover:bg-white/75'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  )
}
