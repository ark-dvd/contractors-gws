import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/middleware'
import { getSanityWriteClient, getSanityClient } from '@/lib/sanity'
import { validate, SiteSettingsInputSchema } from '@/lib/validations'
import { withRateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { z } from 'zod'

type SiteSettingsInput = z.output<typeof SiteSettingsInputSchema>

const SETTINGS_ID = 'siteSettings'

// Build image reference object for Sanity
function buildImageRef(assetId: string | undefined | null) {
  if (!assetId || typeof assetId !== 'string') return undefined
  
  // Handle both formats: "image-xxx-yyy-zzz" and raw ID
  const ref = assetId.startsWith('image-') ? assetId : `image-${assetId}`
  return {
    _type: 'image',
    asset: {
      _type: 'reference',
      _ref: ref
    }
  }
}

// Build file reference object for Sanity (for videos)
function buildFileRef(assetId: string | undefined | null) {
  if (!assetId || typeof assetId !== 'string') return undefined
  
  // Handle both formats: "file-xxx-yyy-zzz" and raw ID
  const ref = assetId.startsWith('file-') ? assetId : `file-${assetId}`
  return {
    _type: 'file',
    asset: {
      _type: 'reference',
      _ref: ref
    }
  }
}

function buildFields(d: SiteSettingsInput, includeMedia: boolean = false) {
  const fields: Record<string, unknown> = {
    siteTitle: d.siteTitle || '',
    heroHeadline: d.heroHeadline || '',
    heroSubheadline: d.heroSubheadline || '',
    heroMediaType: d.heroMediaType || 'images',
    contractorName: d.contractorName || '',
    contractorTitle: d.contractorTitle || '',
    aboutHeadline: d.aboutHeadline || '',
    aboutText: d.aboutText || '',
    aboutStats: d.aboutStats?.map(s => ({
      _type: 'object' as const,
      _key: Math.random().toString(36).substring(7),
      value: s.value,
      label: s.label,
    })) || [],
    phone: d.phone || '',
    email: d.email || '',
    address: d.address || '',
    serviceArea: d.serviceArea || '',
    officeHours: d.officeHours || '',
    instagram: d.instagram || '',
    facebook: d.facebook || '',
    linkedin: d.linkedin || '',
    youtube: d.youtube || '',
    yelp: d.yelp || '',
    google: d.google || '',
    houzz: d.houzz || '',
    nextdoor: d.nextdoor || '',
    licenseNumber: d.licenseNumber || '',
    licenseState: d.licenseState || '',
    insuranceInfo: d.insuranceInfo || '',
    bondInfo: d.bondInfo || '',
  }

  // CRITICAL: Only include media fields if they were explicitly provided
  // This prevents overwriting existing media with empty values
  if (includeMedia) {
    // Logo
    if (d.logo) {
      fields.logo = buildImageRef(d.logo)
    }
    
    // Favicon
    if (d.favicon) {
      fields.favicon = buildImageRef(d.favicon)
    }
    
    // Contractor Photo
    if (d.contractorPhoto) {
      fields.contractorPhoto = buildImageRef(d.contractorPhoto)
    }
    
    // Hero Video
    if (d.heroVideo) {
      fields.heroVideo = buildFileRef(d.heroVideo)
    }
    
    // Hero Images array
    if (d.heroImages && Array.isArray(d.heroImages) && d.heroImages.length > 0) {
      fields.heroImages = d.heroImages.map((img: string | { assetId?: string; alt?: string }, index: number) => {
        const assetId = typeof img === 'string' ? img : img.assetId
        const alt = typeof img === 'string' ? '' : (img.alt || '')
        return {
          _type: 'image',
          _key: `hero-image-${index}-${Math.random().toString(36).substring(7)}`,
          alt: alt,
          asset: {
            _type: 'reference',
            _ref: assetId?.startsWith('image-') ? assetId : `image-${assetId}`
          }
        }
      })
    }
  }

  return fields
}

export async function GET(request: NextRequest) {
  const rateLimitError = withRateLimit(request, RATE_LIMITS.admin)
  if (rateLimitError) return rateLimitError

  const auth = await requireAdmin(request)
  if ('error' in auth) return auth.error

  try {
    const client = getSanityClient()
    const data = await client.fetch(`
      *[_type == "siteSettings"][0] {
        _id,
        _createdAt,
        _updatedAt,
        siteTitle,
        heroHeadline,
        heroSubheadline,
        heroMediaType,
        contractorName,
        contractorTitle,
        aboutHeadline,
        aboutText,
        aboutStats,
        phone,
        email,
        address,
        serviceArea,
        officeHours,
        instagram,
        facebook,
        linkedin,
        youtube,
        yelp,
        google,
        houzz,
        nextdoor,
        licenseNumber,
        licenseState,
        insuranceInfo,
        bondInfo,
        "logoUrl": logo.asset->url,
        "logoAssetId": logo.asset._ref,
        "faviconUrl": favicon.asset->url,
        "faviconAssetId": favicon.asset._ref,
        "contractorPhotoUrl": contractorPhoto.asset->url,
        "contractorPhotoAssetId": contractorPhoto.asset._ref,
        "heroImageUrls": heroImages[] { "url": asset->url, "assetId": asset._ref, alt },
        "heroVideoUrl": heroVideo.asset->url,
        "heroVideoAssetId": heroVideo.asset._ref
      }
    `)
    return NextResponse.json(data || {})
  } catch (e) {
    console.error('Fetch settings error:', e)
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const rateLimitError = withRateLimit(request, RATE_LIMITS.admin)
  if (rateLimitError) return rateLimitError

  const auth = await requireAdmin(request)
  if ('error' in auth) return auth.error

  try {
    const body = await request.json()
    console.log('[Settings POST] Received payload:', JSON.stringify(body, null, 2))
    
    const v = validate(SiteSettingsInputSchema, body)
    if (!v.success) {
      return NextResponse.json({ error: 'Validation failed', details: v.errors }, { status: 400 })
    }

    const d = v.data
    
    // Check if any media fields were provided
    const hasMedia = !!(d.logo || d.favicon || d.contractorPhoto || d.heroVideo || 
                       (d.heroImages && d.heroImages.length > 0))
    
    const fields = buildFields(d, hasMedia)
    console.log('[Settings POST] Built fields:', JSON.stringify(fields, null, 2))
    
    const doc = { _id: SETTINGS_ID, _type: 'siteSettings' as const, ...fields }
    const result = await getSanityWriteClient().createIfNotExists(doc)
    
    console.log('[Settings POST] Sanity result:', result._id)
    return NextResponse.json(result)
  } catch (e) {
    console.error('Create settings error:', e)
    return NextResponse.json({ error: 'Failed to create settings' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const rateLimitError = withRateLimit(request, RATE_LIMITS.admin)
  if (rateLimitError) return rateLimitError

  const auth = await requireAdmin(request)
  if ('error' in auth) return auth.error

  try {
    const body = await request.json()
    console.log('[Settings PUT] Received payload:', JSON.stringify(body, null, 2))
    
    const v = validate(SiteSettingsInputSchema, body)
    if (!v.success) {
      return NextResponse.json({ error: 'Validation failed', details: v.errors }, { status: 400 })
    }

    const d = v.data
    
    // Check if any media fields were provided
    const hasMedia = !!(d.logo || d.favicon || d.contractorPhoto || d.heroVideo || 
                       (d.heroImages && d.heroImages.length > 0))
    
    const fields = buildFields(d, hasMedia)
    console.log('[Settings PUT] Built fields with media:', hasMedia, JSON.stringify(fields, null, 2))
    
    const result = await getSanityWriteClient().patch(SETTINGS_ID).set(fields).commit()
    
    console.log('[Settings PUT] Sanity result:', result._id)
    return NextResponse.json(result)
  } catch (e) {
    console.error('Update settings error:', e)
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}

// No DELETE for settings - it's a singleton
