import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/middleware'
import { getSanityWriteClient, getSanityClient } from '@/lib/sanity'
import { validate, CrmSettingsInputSchema } from '@/lib/validations'
import { withRateLimit, RATE_LIMITS } from '@/lib/rate-limit'

// Singleton document ID for CRM settings
const CRM_SETTINGS_ID = 'crmSettings'

// Default CRM settings for contractors
const DEFAULT_CRM_SETTINGS = {
  _id: CRM_SETTINGS_ID,
  _type: 'crmSettings' as const,
  pipelineStages: [
    { key: 'new', label: 'New Lead', color: '#fe5557' },
    { key: 'contacted', label: 'Contacted', color: '#8b5cf6' },
    { key: 'site_visit', label: 'Site Visit', color: '#6366f1' },
    { key: 'quoted', label: 'Quote Sent', color: '#f59e0b' },
    { key: 'negotiating', label: 'Negotiating', color: '#f97316' },
    { key: 'won', label: 'Won', color: '#10b981' },
    { key: 'lost', label: 'Lost', color: '#6b7280' },
  ],
  dealStatuses: [
    { key: 'planning', label: 'Planning', color: '#f59e0b' },
    { key: 'permitting', label: 'Permitting', color: '#6366f1' },
    { key: 'in_progress', label: 'In Progress', color: '#10b981' },
    { key: 'inspection', label: 'Final Inspection', color: '#14b8a6' },
    { key: 'completed', label: 'Completed', color: '#059669' },
    { key: 'warranty', label: 'Warranty Period', color: '#6b7280' },
    { key: 'paused', label: 'Paused', color: '#ef4444' },
    { key: 'cancelled', label: 'Cancelled', color: '#374151' },
  ],
  leadSources: [
    'Phone Call',
    'Referral',
    'Walk-in',
    'Yard Sign',
    'Home Show / Expo',
    'Returning Client',
    'Nextdoor',
    'Social Media',
    'Other',
  ],
  serviceTypes: [
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
  ],
  defaultPriority: 'medium' as const,
  currency: '$',
  industryLabel: 'Contractor',
  dealLabel: 'Project',
  leadsPageSize: 20,
}

export async function GET(request: NextRequest) {
  const rateLimitError = withRateLimit(request, RATE_LIMITS.admin)
  if (rateLimitError) return rateLimitError

  const auth = await requireAdmin(request)
  if ('error' in auth) return auth.error

  try {
    const client = getSanityClient()

    const settings = await client.fetch(`
      *[_type == "crmSettings" && _id == $id][0] {
        _id,
        pipelineStages,
        dealStatuses,
        leadSources,
        serviceTypes,
        defaultPriority,
        currency,
        industryLabel,
        dealLabel,
        leadsPageSize
      }
    `, { id: CRM_SETTINGS_ID })

    // Return existing settings or defaults
    return NextResponse.json(settings || DEFAULT_CRM_SETTINGS)
  } catch (e) {
    console.error('Fetch CRM settings error:', e)
    return NextResponse.json({ error: 'Failed to fetch CRM settings' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const rateLimitError = withRateLimit(request, RATE_LIMITS.admin)
  if (rateLimitError) return rateLimitError

  const auth = await requireAdmin(request)
  if ('error' in auth) return auth.error

  try {
    const body = await request.json()
    const v = validate(CrmSettingsInputSchema, body)
    if (!v.success) {
      return NextResponse.json({ error: 'Validation failed', details: v.errors }, { status: 400 })
    }

    const d = v.data
    const client = getSanityWriteClient()

    // Use createIfNotExists to initialize settings
    const doc = {
      ...DEFAULT_CRM_SETTINGS,
      ...d,
      _id: CRM_SETTINGS_ID,
      _type: 'crmSettings' as const,
    }

    const result = await client.createIfNotExists(doc)
    return NextResponse.json(result)
  } catch (e) {
    console.error('Create CRM settings error:', e)
    return NextResponse.json({ error: 'Failed to create CRM settings' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const rateLimitError = withRateLimit(request, RATE_LIMITS.admin)
  if (rateLimitError) return rateLimitError

  const auth = await requireAdmin(request)
  if ('error' in auth) return auth.error

  try {
    const body = await request.json()
    const v = validate(CrmSettingsInputSchema, body)
    if (!v.success) {
      return NextResponse.json({ error: 'Validation failed', details: v.errors }, { status: 400 })
    }

    const d = v.data
    const client = getSanityWriteClient()

    // PHASE 1 FIX: Ensure document exists before patching
    // Sanity's patch() fails silently on non-existent documents.
    // We must first guarantee the document exists, then patch it.
    await client.createIfNotExists({
      ...DEFAULT_CRM_SETTINGS,
      _id: CRM_SETTINGS_ID,
      _type: 'crmSettings',
    })

    // Build fields to update (only include non-undefined values)
    const fields: Record<string, unknown> = {}
    if (d.pipelineStages !== undefined) fields.pipelineStages = d.pipelineStages
    if (d.dealStatuses !== undefined) fields.dealStatuses = d.dealStatuses
    if (d.leadSources !== undefined) fields.leadSources = d.leadSources
    if (d.serviceTypes !== undefined) fields.serviceTypes = d.serviceTypes
    if (d.defaultPriority !== undefined) fields.defaultPriority = d.defaultPriority
    if (d.currency !== undefined) fields.currency = d.currency
    if (d.industryLabel !== undefined) fields.industryLabel = d.industryLabel
    if (d.dealLabel !== undefined) fields.dealLabel = d.dealLabel
    if (d.leadsPageSize !== undefined) fields.leadsPageSize = d.leadsPageSize

    // Now patch the existing document
    const result = await client.patch(CRM_SETTINGS_ID).set(fields).commit()
    return NextResponse.json(result)
  } catch (e) {
    console.error('Update CRM settings error:', e)
    return NextResponse.json({ error: 'Failed to update CRM settings' }, { status: 500 })
  }
}
