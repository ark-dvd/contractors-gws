import Image from 'next/image'
import { Star, Quote } from 'lucide-react'

interface TestimonialCardProps {
  clientName: string
  clientLocation?: string
  clientPhoto?: string
  quote: string
  rating: number
  projectType?: string
}

// Initials Avatar component
function InitialsAvatar({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-semibold text-lg">
      {initials}
    </div>
  )
}

// Star Rating component
function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-4 w-4 ${
            star <= rating
              ? 'fill-amber-400 text-amber-400'
              : 'fill-none text-gray-300'
          }`}
        />
      ))}
    </div>
  )
}

export default function TestimonialCard({
  clientName,
  clientLocation,
  clientPhoto,
  quote,
  rating,
  projectType,
}: TestimonialCardProps) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm h-full flex flex-col">
      {/* Quote Icon */}
      <div className="mb-4">
        <Quote className="h-8 w-8 text-amber-500/30" />
      </div>

      {/* Quote Text */}
      <blockquote className="text-gray-700 flex-1 mb-6 leading-relaxed">
        &ldquo;{quote}&rdquo;
      </blockquote>

      {/* Rating */}
      <div className="mb-4">
        <StarRating rating={rating} />
      </div>

      {/* Client Info */}
      <div className="flex items-center gap-4">
        {clientPhoto ? (
          <Image
            src={clientPhoto}
            alt={clientName}
            width={56}
            height={56}
            className="w-14 h-14 rounded-full object-cover"
          />
        ) : (
          <InitialsAvatar name={clientName} />
        )}
        <div>
          <p className="font-semibold text-gray-900">{clientName}</p>
          <div className="text-sm text-gray-500">
            {clientLocation && <span>{clientLocation}</span>}
            {clientLocation && projectType && <span> • </span>}
            {projectType && <span>{projectType}</span>}
          </div>
        </div>
      </div>
    </div>
  )
}
