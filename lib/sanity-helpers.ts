import { SanityImage } from './data-fetchers'

/**
 * Convert a Sanity image reference to a CDN URL
 * Returns undefined if no valid image reference is provided
 */
export function sanityImageUrl(image?: SanityImage | null, width?: number): string | undefined {
  if (!image?.asset?._ref) return undefined

  // Parse the asset reference to get project ID, dataset, and asset ID
  // Format: image-{assetId}-{dimensions}-{format}
  const ref = image.asset._ref
  const [, assetId, dimensions, format] = ref.split('-')

  if (!assetId || !dimensions || !format) return undefined

  // Construct the Sanity CDN URL
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'

  if (!projectId) return undefined

  let url = `https://cdn.sanity.io/images/${projectId}/${dataset}/${assetId}-${dimensions}.${format}`

  // Add width parameter if specified
  if (width) {
    url += `?w=${width}`
  }

  return url
}

/**
 * Get alt text from a Sanity image, with fallback
 */
export function sanityImageAlt(image?: SanityImage | null, fallback = ''): string {
  return image?.alt || fallback
}
