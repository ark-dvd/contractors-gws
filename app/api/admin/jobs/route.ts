import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/middleware'
import { getSanityWriteClient, getSanityClient } from '@/lib/sanity'
import { validate, ActiveJobInputSchema } from '@/lib/validations'
import { withRateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { z } from 'zod'

type ActiveJobInput = z.output<typeof ActiveJobInputSchema>

function buildFields(d: ActiveJobInput) {
  return {
    clientName: d.clientName,
    clientEmail: d.clientEmail,
    clientPhone: d.clientPhone || '',
    jobType: d.jobType || '',
    address: d.address || '',
    estimatedBudget: d.estimatedBudget ?? undefined,
    jobStage: d.jobStage ?? 1,
    keyDates: d.keyDates ? {
      estimateDate: d.keyDates.estimateDate || undefined,
      contractDate: d.keyDates.contractDate || undefined,
      startDate: d.keyDates.startDate || undefined,
      expectedCompletion: d.keyDates.expectedCompletion || undefined,
      actualCompletion: d.keyDates.actualCompletion || undefined,
    } : undefined,
    notes: d.notes || '',
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
      *[_type == "activeJob"] | order(jobStage desc, _createdAt desc) {
        _id,
        _createdAt,
        clientName,
        clientEmail,
        clientPhone,
        jobType,
        address,
        estimatedBudget,
        jobStage,
        keyDates,
        notes,
        isActive,
        "serviceRef": service->{ _id, name }
      }
    `)
    return NextResponse.json(data || [])
  } catch (e) {
    console.error('Fetch jobs error:', e)
    return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const rateLimitError = withRateLimit(request, RATE_LIMITS.admin)
  if (rateLimitError) return rateLimitError

  const auth = await requireAdmin(request)
  if ('error' in auth) return auth.error

  try {
    const body = await request.json()
    const v = validate(ActiveJobInputSchema, body)
    if (!v.success) {
      return NextResponse.json({ error: 'Validation failed', details: v.errors }, { status: 400 })
    }

    const d = v.data
    const fields = buildFields(d)
    const doc = { _type: 'activeJob' as const, ...fields }
    const result = await getSanityWriteClient().create(doc)
    return NextResponse.json(result)
  } catch (e) {
    console.error('Create job error:', e)
    return NextResponse.json({ error: 'Failed to create job' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const rateLimitError = withRateLimit(request, RATE_LIMITS.admin)
  if (rateLimitError) return rateLimitError

  const auth = await requireAdmin(request)
  if ('error' in auth) return auth.error

  try {
    const body = await request.json()
    const v = validate(ActiveJobInputSchema, body)
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
    console.error('Update job error:', e)
    return NextResponse.json({ error: 'Failed to update job' }, { status: 500 })
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
    console.error('Delete job error:', e)
    return NextResponse.json({ error: 'Failed to delete job' }, { status: 500 })
  }
}
