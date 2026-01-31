import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/middleware'
import { getSanityWriteClient, getSanityClient } from '@/lib/sanity'
import { validate, ProjectInputSchema } from '@/lib/validations'
import { withRateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { z } from 'zod'

type ProjectInput = z.output<typeof ProjectInputSchema>

function buildImageRef(value: unknown): { _type: 'image'; asset: { _type: 'reference'; _ref: string } } | undefined {
  if (typeof value === 'string' && value.startsWith('image-')) {
    return { _type: 'image', asset: { _type: 'reference', _ref: value } }
  }
  return undefined
}

function buildFields(d: ProjectInput) {
  return {
    title: d.title,
    slug: { _type: 'slug' as const, current: d.slug },
    status: d.status,
    projectType: d.projectType || '',
    location: d.location ? {
      city: d.location.city || '',
      state: d.location.state || '',
      neighborhood: d.location.neighborhood || '',
    } : undefined,
    completionDate: d.completionDate || undefined,
    duration: d.duration || '',
    budgetRange: d.budgetRange || '',
    scope: d.scope || [],
    permitNumber: d.permitNumber || '',
    shortDescription: d.shortDescription || '',
    description: d.description || '',
    clientTestimonial: d.clientTestimonial || '',
    clientName: d.clientName || '',
    heroImage: buildImageRef(d.heroImage),
    beforeImage: buildImageRef(d.beforeImage),
    gallery: d.gallery?.map((img: unknown) => buildImageRef(img)).filter(Boolean) || [],
    videoUrl: d.videoUrl || '',
    seoTitle: d.seoTitle || '',
    seoDescription: d.seoDescription || '',
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
      *[_type == "project"] | order(_createdAt desc) {
        _id,
        _createdAt,
        title,
        slug,
        status,
        projectType,
        location,
        completionDate,
        duration,
        budgetRange,
        scope,
        permitNumber,
        shortDescription,
        description,
        clientTestimonial,
        clientName,
        "heroImageUrl": heroImage.asset->url,
        "beforeImageUrl": beforeImage.asset->url,
        "galleryImages": gallery[] { "url": asset->url, alt, caption },
        videoUrl,
        seoTitle,
        seoDescription,
        "serviceRef": service->{ _id, name }
      }
    `)
    return NextResponse.json(data || [])
  } catch (e) {
    console.error('Fetch projects error:', e)
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const rateLimitError = withRateLimit(request, RATE_LIMITS.admin)
  if (rateLimitError) return rateLimitError

  const auth = await requireAdmin(request)
  if ('error' in auth) return auth.error

  try {
    const body = await request.json()
    const v = validate(ProjectInputSchema, body)
    if (!v.success) {
      return NextResponse.json({ error: 'Validation failed', details: v.errors }, { status: 400 })
    }

    const d = v.data
    const fields = buildFields(d)
    const doc = { _type: 'project' as const, ...fields }
    const result = await getSanityWriteClient().create(doc)
    return NextResponse.json(result)
  } catch (e) {
    console.error('Create project error:', e)
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const rateLimitError = withRateLimit(request, RATE_LIMITS.admin)
  if (rateLimitError) return rateLimitError

  const auth = await requireAdmin(request)
  if ('error' in auth) return auth.error

  try {
    const body = await request.json()
    const v = validate(ProjectInputSchema, body)
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
    console.error('Update project error:', e)
    return NextResponse.json({ error: 'Failed to update project' }, { status: 500 })
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
    console.error('Delete project error:', e)
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 })
  }
}
