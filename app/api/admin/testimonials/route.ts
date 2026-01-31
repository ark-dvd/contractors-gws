import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/middleware'
import { getSanityWriteClient, getSanityClient } from '@/lib/sanity'
import { validate, TestimonialInputSchema } from '@/lib/validations'
import { withRateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { z } from 'zod'

type TestimonialInput = z.output<typeof TestimonialInputSchema>

function buildImageRef(value: unknown): { _type: 'image'; asset: { _type: 'reference'; _ref: string } } | undefined {
  if (typeof value === 'string' && value.startsWith('image-')) {
    return { _type: 'image', asset: { _type: 'reference', _ref: value } }
  }
  return undefined
}

function buildFields(d: TestimonialInput) {
  return {
    clientName: d.clientName,
    clientLocation: d.clientLocation || '',
    quote: d.quote,
    rating: d.rating ?? 5,
    projectType: d.projectType || '',
    date: d.date || undefined,
    clientPhoto: buildImageRef(d.clientPhoto),
    isFeatured: d.isFeatured ?? false,
    isActive: d.isActive ?? true,
    order: d.order ?? 10,
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
      *[_type == "testimonial"] | order(order asc) {
        _id,
        _createdAt,
        clientName,
        clientLocation,
        quote,
        rating,
        projectType,
        date,
        "clientPhotoUrl": clientPhoto.asset->url,
        isFeatured,
        isActive,
        order,
        "projectRef": project->{ _id, title }
      }
    `)
    return NextResponse.json(data || [])
  } catch (e) {
    console.error('Fetch testimonials error:', e)
    return NextResponse.json({ error: 'Failed to fetch testimonials' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const rateLimitError = withRateLimit(request, RATE_LIMITS.admin)
  if (rateLimitError) return rateLimitError

  const auth = await requireAdmin(request)
  if ('error' in auth) return auth.error

  try {
    const body = await request.json()
    const v = validate(TestimonialInputSchema, body)
    if (!v.success) {
      return NextResponse.json({ error: 'Validation failed', details: v.errors }, { status: 400 })
    }

    const d = v.data
    const fields = buildFields(d)
    const doc = { _type: 'testimonial' as const, ...fields }
    const result = await getSanityWriteClient().create(doc)
    return NextResponse.json(result)
  } catch (e) {
    console.error('Create testimonial error:', e)
    return NextResponse.json({ error: 'Failed to create testimonial' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const rateLimitError = withRateLimit(request, RATE_LIMITS.admin)
  if (rateLimitError) return rateLimitError

  const auth = await requireAdmin(request)
  if ('error' in auth) return auth.error

  try {
    const body = await request.json()
    const v = validate(TestimonialInputSchema, body)
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
    console.error('Update testimonial error:', e)
    return NextResponse.json({ error: 'Failed to update testimonial' }, { status: 500 })
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
    console.error('Delete testimonial error:', e)
    return NextResponse.json({ error: 'Failed to delete testimonial' }, { status: 500 })
  }
}
