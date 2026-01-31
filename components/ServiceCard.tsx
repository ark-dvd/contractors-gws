import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

interface ServiceCardProps {
  slug: string
  title: string
  image?: string
  tagline?: string
}

export default function ServiceCard({
  slug,
  title,
  image,
  tagline,
}: ServiceCardProps) {
  return (
    <Link
      href={`/services/${slug}`}
      className="group block bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300"
    >
      {/* Image */}
      <div className="relative aspect-[16/10] overflow-hidden">
        {image ? (
          <Image
            src={image}
            alt={title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center">
            <span className="text-amber-600 text-sm font-medium">
              {title.charAt(0)}
            </span>
          </div>
        )}
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        {/* Title on Image */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="text-xl font-semibold text-white">
            {title}
          </h3>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        {tagline && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
            {tagline}
          </p>
        )}
        <span className="inline-flex items-center gap-1 text-amber-600 font-medium text-sm group-hover:gap-2 transition-all">
          Learn More
          <ArrowRight className="h-4 w-4" />
        </span>
      </div>
    </Link>
  )
}
