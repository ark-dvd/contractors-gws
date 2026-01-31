import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/middleware'
import { getSanityWriteClient, getSanityClient } from '@/lib/sanity'
import { validate, SiteSettingsInputSchema } from '@/lib/validations'
import { withRateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { z } from 'zod'

type SiteSettingsInput = z.output<typeof SiteSettingsInputSchema>

const SETTINGS_ID = 'siteSettings'

function buildImageRef(value: unknown): { _type: 'image'; asset: { _type: 'reference'; _ref: string } } | undefined {
  if (typeof value === 'string' && value.startsWith('image-')) {
    return { _type: 'image', asset: { _type: 'reference', _ref: value } }
  }
  return undefined
}

function buildFields(d: SiteSettingsInput) {
  return {
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
        "faviconUrl": favicon.asset->url,
        "contractorPhotoUrl": contractorPhoto.asset->url,
        "heroImageUrls": heroImages[] { "url": asset->url, alt },
        "heroVideoUrl": heroVideo.asset->url
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
    const v = validate(SiteSettingsInputSchema, body)
    if (!v.success) {
      return NextResponse.json({ error: 'Validation failed', details: v.errors }, { status: 400 })
    }

    const d = v.data
    const fields = buildFields(d)
    const doc = { _id: SETTINGS_ID, _type: 'siteSettings' as const, ...fields }
    const result = await getSanityWriteClient().createIfNotExists(doc)
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
    const v = validate(SiteSettingsInputSchema, body)
    if (!v.success) {
      return NextResponse.json({ error: 'Validation failed', details: v.errors }, { status: 400 })
    }

    const d = v.data
    const fields = buildFields(d)
    const result = await getSanityWriteClient().patch(SETTINGS_ID).set(fields).commit()
    return NextResponse.json(result)
  } catch (e) {
    console.error('Update settings error:', e)
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}

// No DELETE for settings - it's a singleton
