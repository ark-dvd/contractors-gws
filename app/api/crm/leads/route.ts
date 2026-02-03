import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/middleware'
import { getSanityWriteClient, getSanityClient } from '@/lib/sanity'
import { validate, LeadInputSchema } from '@/lib/validations'
import { withRateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { z } from 'zod'

type LeadInput = z.output<typeof LeadInputSchema>

// PHASE 2 (A3): Fetch CRM settings for config-driven validation
const CRM_SETTINGS_ID = 'crmSettings'

interface PipelineStage {
  key: string
  label: string
  color: string
}

interface CrmSettingsData {
  pipelineStages?: PipelineStage[]
  leadSources?: string[]
  serviceTypes?: string[]
}

// Default pipeline stages (fallback if settings not configured)
const DEFAULT_PIPELINE_STAGES: PipelineStage[] = [
  { key: 'new', label: 'New Lead', color: '#fe5557' },
  { key: 'contacted', label: 'Contacted', color: '#8b5cf6' },
  { key: 'site_visit', label: 'Site Visit', color: '#6366f1' },
  { key: 'quoted', label: 'Quote Sent', color: '#f59e0b' },
  { key: 'negotiating', label: 'Negotiating', color: '#f97316' },
  { key: 'won', label: 'Won', color: '#10b981' },
  { key: 'lost', label: 'Lost', color: '#6b7280' },
]

// Default lead sources (fallback if settings not configured)
const DEFAULT_LEAD_SOURCES: string[] = [
  'Phone Call',
  'Referral',
  'Walk-in',
  'Yard Sign',
  'Home Show / Expo',
  'Returning Client',
  'Nextdoor',
  'Social Media',
  'Other',
]

// Default service types (fallback if settings not configured)
const DEFAULT_SERVICE_TYPES: string[] = [
  'Kitchen Remodel',
  'Bathroom Remodel',
  'Home Addition',
  'Deck / Patio',
  'Full Renovation',
  'ADU / Guest House',
  'Roofing',
  'Flooring',
  'Exterior / Siding',
  'Garage',
  'Basement Finish',
  'Commercial',
  'Other',
]

async function getCrmSettings(client: ReturnType<typeof getSanityClient>): Promise<CrmSettingsData> {
  const settings = await client.fetch(`
    *[_type == "crmSettings" && _id == $id][0] {
      pipelineStages,
      leadSources,
      serviceTypes
    }
  `, { id: CRM_SETTINGS_ID })
  return settings || {}
}

function buildLeadFields(d: LeadInput) {
  return {
    fullName: d.fullName,
    email: d.email || '',
    phone: d.phone || '',
    origin: d.origin,
    source: d.source || '',
    serviceType: d.serviceType || '',
    estimatedValue: d.estimatedValue || undefined,
    priority: d.priority,
    status: d.status,
    referredBy: d.referredBy || '',
    originalMessage: d.originalMessage || '',
    description: d.description || '',
    internalNotes: d.internalNotes || '',
  }
}

export async function GET(request: NextRequest) {
  const rateLimitError = withRateLimit(request, RATE_LIMITS.admin)
  if (rateLimitError) return rateLimitError

  const auth = await requireAdmin(request)
  if ('error' in auth) return auth.error

  try {
    const client = getSanityClient()
    const url = new URL(request.url)
    const status = url.searchParams.get('status')
    const limit = parseInt(url.searchParams.get('limit') || '50')
    const offset = parseInt(url.searchParams.get('offset') || '0')

    const statusFilter = status && status !== 'all' ? `&& status == "${status}"` : ''

    const data = await client.fetch(`
      *[_type == "lead" ${statusFilter}] | order(receivedAt desc) [$offset...$end] {
        _id,
        _createdAt,
        fullName,
        email,
        phone,
        origin,
        source,
        serviceType,
        estimatedValue,
        priority,
        status,
        referredBy,
        originalMessage,
        description,
        internalNotes,
        receivedAt,
        "convertedToClient": convertedToClient->{_id, fullName}
      }
    `, { offset, end: offset + limit })

    // Get total count for pagination
    const totalCount = await client.fetch(`
      count(*[_type == "lead" ${statusFilter}])
    `)

    // PHASE 2 (A3): Dynamic statusCounts from settings.pipelineStages
    const settings = await getCrmSettings(client)
    const stages = settings.pipelineStages?.length ? settings.pipelineStages : DEFAULT_PIPELINE_STAGES

    // Build dynamic GROQ query for status counts
    const statusCountsQuery = stages.map(s => `"${s.key}": count(*[_type == "lead" && status == "${s.key}"])`).join(',\n      ')
    const statusCounts = await client.fetch(`{
      ${statusCountsQuery},
      "total": count(*[_type == "lead"])
    }`)

    return NextResponse.json({
      leads: data || [],
      total: totalCount,
      statusCounts,
      pagination: { offset, limit, hasMore: offset + limit < totalCount }
    })
  } catch (e) {
    console.error('Fetch leads error:', e)
    return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const rateLimitError = withRateLimit(request, RATE_LIMITS.admin)
  if (rateLimitError) return rateLimitError

  const auth = await requireAdmin(request)
  if ('error' in auth) return auth.error

  try {
    const body = await request.json()
    const v = validate(LeadInputSchema, body)
    if (!v.success) {
      return NextResponse.json({ error: 'Validation failed', details: v.errors }, { status: 400 })
    }

    const d = v.data
    const readClient = getSanityClient()
    const client = getSanityWriteClient()

    // PHASE 2 (A3): Validate status, source, serviceType against settings (fail-closed)
    const settings = await getCrmSettings(readClient)
    const stages = settings.pipelineStages?.length ? settings.pipelineStages : DEFAULT_PIPELINE_STAGES
    const validStatusKeys = stages.map(s => s.key)
    const validSources = settings.leadSources?.length ? settings.leadSources : DEFAULT_LEAD_SOURCES
    const validServiceTypes = settings.serviceTypes?.length ? settings.serviceTypes : DEFAULT_SERVICE_TYPES

    const validationErrors: string[] = []

    if (d.status && !validStatusKeys.includes(d.status)) {
      validationErrors.push(`status: Invalid status "${d.status}". Valid values: ${validStatusKeys.join(', ')}`)
    }

    if (d.source && !validSources.includes(d.source)) {
      validationErrors.push(`source: Invalid source "${d.source}". Valid values: ${validSources.join(', ')}`)
    }

    if (d.serviceType && !validServiceTypes.includes(d.serviceType)) {
      validationErrors.push(`serviceType: Invalid serviceType "${d.serviceType}". Valid values: ${validServiceTypes.join(', ')}`)
    }

    if (validationErrors.length > 0) {
      return NextResponse.json({
        error: 'Validation failed',
        details: validationErrors
      }, { status: 400 })
    }

    const now = new Date().toISOString()

    const fields = buildLeadFields(d)
    const doc = {
      _type: 'lead' as const,
      ...fields,
      receivedAt: now,
    }

    const result = await client.create(doc)

    // Create activity log
    await client.create({
      _type: 'activity' as const,
      type: 'lead_created_manual',
      description: `Lead manually created by ${auth.user.email}`,
      timestamp: now,
      lead: { _type: 'reference' as const, _ref: result._id },
      performedBy: auth.user.email,
    })

    return NextResponse.json(result)
  } catch (e) {
    console.error('Create lead error:', e)
    return NextResponse.json({ error: 'Failed to create lead' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const rateLimitError = withRateLimit(request, RATE_LIMITS.admin)
  if (rateLimitError) return rateLimitError

  const auth = await requireAdmin(request)
  if ('error' in auth) return auth.error

  try {
    const body = await request.json()
    const v = validate(LeadInputSchema, body)
    if (!v.success) {
      return NextResponse.json({ error: 'Validation failed', details: v.errors }, { status: 400 })
    }

    const d = v.data
    if (!d._id) {
      return NextResponse.json({ error: 'Missing _id for update' }, { status: 400 })
    }

    const readClient = getSanityClient()
    const client = getSanityWriteClient()

    // PHASE 2 (A3): Validate status, source, serviceType against settings (fail-closed)
    const settings = await getCrmSettings(readClient)
    const stages = settings.pipelineStages?.length ? settings.pipelineStages : DEFAULT_PIPELINE_STAGES
    const validStatusKeys = stages.map(s => s.key)
    const validSources = settings.leadSources?.length ? settings.leadSources : DEFAULT_LEAD_SOURCES
    const validServiceTypes = settings.serviceTypes?.length ? settings.serviceTypes : DEFAULT_SERVICE_TYPES

    const validationErrors: string[] = []

    if (d.status && !validStatusKeys.includes(d.status)) {
      validationErrors.push(`status: Invalid status "${d.status}". Valid values: ${validStatusKeys.join(', ')}`)
    }

    if (d.source && !validSources.includes(d.source)) {
      validationErrors.push(`source: Invalid source "${d.source}". Valid values: ${validSources.join(', ')}`)
    }

    if (d.serviceType && !validServiceTypes.includes(d.serviceType)) {
      validationErrors.push(`serviceType: Invalid serviceType "${d.serviceType}". Valid values: ${validServiceTypes.join(', ')}`)
    }

    if (validationErrors.length > 0) {
      return NextResponse.json({
        error: 'Validation failed',
        details: validationErrors
      }, { status: 400 })
    }

    // Get current lead to check for status change
    const currentLead = await readClient.fetch(
      `*[_type == "lead" && _id == $id][0]{status}`,
      { id: d._id }
    )

    const fields = buildLeadFields(d)
    const result = await client.patch(d._id).set(fields).commit()

    // Log activity if status changed
    if (currentLead && currentLead.status !== d.status) {
      await client.create({
        _type: 'activity' as const,
        type: 'status_changed',
        description: `Status changed from "${currentLead.status}" to "${d.status}"`,
        timestamp: new Date().toISOString(),
        lead: { _type: 'reference' as const, _ref: d._id },
        performedBy: auth.user.email,
        metadata: {
          oldStatus: currentLead.status,
          newStatus: d.status,
        },
      })
    }

    return NextResponse.json(result)
  } catch (e) {
    console.error('Update lead error:', e)
    return NextResponse.json({ error: 'Failed to update lead' }, { status: 500 })
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

    const client = getSanityWriteClient()

    // Also delete related activities
    const activities = await getSanityClient().fetch(
      `*[_type == "activity" && lead._ref == $id]._id`,
      { id }
    )

    // Delete activities first
    for (const actId of activities) {
      await client.delete(actId)
    }

    // Delete lead
    await client.delete(id)

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('Delete lead error:', e)
    return NextResponse.json({ error: 'Failed to delete lead' }, { status: 500 })
  }
}
