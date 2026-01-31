import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/middleware'
import { getSanityWriteClient, getSanityClient } from '@/lib/sanity'
import { validate, ServiceInputSchema } from '@/lib/validations'
import { withRateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { z } from 'zod'

type ServiceInput = z.output<typeof ServiceInputSchema>

function buildImageRef(value: unknown): { _type: 'image'; asset: { _type: 'reference'; _ref: string } } | undefined {
  if (typeof value === 'string' && value.startsWith('image-')) {
    return { _type: 'image', asset: { _type: 'reference', _ref: value } }
  }
  return undefined
}

function buildFields(d: ServiceInput) {
  return {
    name: d.name,
    slug: { _type: 'slug' as const, current: d.slug },
    tagline: d.tagline,
    description: d.description,
    highlights: d.highlights?.map(h => ({
      _type: 'object' as const,
      title: h.title,
      description: h.description,
    })) || [],
    priceRange: d.priceRange || '',
    typicalDuration: d.typicalDuration || '',
    image: buildImageRef(d.image),
    gallery: d.gallery?.map((img: unknown) => buildImageRef(img)).filter(Boolean) || [],
    order: d.order ?? 10,
    isActive: d.isActive ?? true,
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
      *[_type == "service"] | order(order asc) {
        _id,
        _createdAt,
        name,
        slug,
        tagline,
        description,
        highlights,
        priceRange,
        typicalDuration,
        "imageUrl": image.asset->url,
        "galleryImages": gallery[] { "url": asset->url, alt },
        order,
        isActive
      }
    `)
    return NextResponse.json(data || [])
  } catch (e) {
    console.error('Fetch services error:', e)
    return NextResponse.json({ error: 'Failed to fetch services' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const rateLimitError = withRateLimit(request, RATE_LIMITS.admin)
  if (rateLimitError) return rateLimitError

  const auth = await requireAdmin(request)
  if ('error' in auth) return auth.error

  try {
    const body = await request.json()
    const v = validate(ServiceInputSchema, body)
    if (!v.success) {
      return NextResponse.json({ error: 'Validation failed', details: v.errors }, { status: 400 })
    }

    const d = v.data
    const fields = buildFields(d)
    const doc = { _type: 'service' as const, ...fields }
    const result = await getSanityWriteClient().create(doc)
    return NextResponse.json(result)
  } catch (e) {
    console.error('Create service error:', e)
    return NextResponse.json({ error: 'Failed to create service' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const rateLimitError = withRateLimit(request, RATE_LIMITS.admin)
  if (rateLimitError) return rateLimitError

  const auth = await requireAdmin(request)
  if ('error' in auth) return auth.error

  try {
    const body = await request.json()
    const v = validate(ServiceInputSchema, body)
    if (!v.success) {
      return NextResponse.json({ error: 'Validation failed', details: v.errors }, { status: 400 })
    }

    const d = v.data
    if (!d._id) {
      return NextResponse.json({ error: 'Missing _id for update' }, { status: 400 })
    }

    const fields = buildFields(d)
    const result = await getSanityWriteClient().patch(d._id).set(fields).commit()
    return NextResponse.json(result)
  } catch (e) {
    console.error('Update service error:', e)
    return NextResponse.json({ error: 'Failed to update service' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const rateLimitError = withRateLimit(request, RATE_LIMITS.admin)
  if (rateLimitError) return rateLimitError

  const auth = await requireAdmin(request)
  if ('error' in auth) return auth.error

  try {
    const id = new URL(request.url).searchParams.get('id')
    if (!id || !/^[a-zA-Z0-9._-]+$/.test(id)) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 })
    }
    await getSanityWriteClient().delete(id)
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('Delete service error:', e)
    return NextResponse.json({ error: 'Failed to delete service' }, { status: 500 })
  }
}
