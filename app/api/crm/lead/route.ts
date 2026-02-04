import { NextRequest, NextResponse } from 'next/server'
import { getSanityWriteClient } from '@/lib/sanity'
import { validate, LeadWebFormSchema } from '@/lib/validations'
import { verifyTurnstileToken } from '@/lib/turnstile'
import {
  checkMultiDimensionRateLimit,
  rateLimitResponse,
  botVerificationFailedResponse,
  logAbuseEvent,
  getClientIP,
  PUBLIC_LEAD_RATE_LIMIT,
} from '@/lib/abuse-prevention'

/**
 * PUBLIC endpoint for website contact form submissions
 * Creates a lead with origin: auto_website_form
 *
 * Phase 5 hardening:
 * - Cloudflare Turnstile verification (when configured)
 * - Multi-dimensional rate limiting (IP + fingerprint + contact)
 * - No leadId in response (prevents enumeration)
 * - Safe error messages (no internal details)
 * - Structured logging for abuse visibility
 */

export async function POST(request: NextRequest) {
  const path = '/api/crm/lead'
  const ip = getClientIP(request)

  // Parse body first to get contact info for rate limiting
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'Invalid request format' },
      { status: 400 }
    )
  }

  // Multi-dimensional rate limiting (checks IP + fingerprint + contact bucket)
  const rateLimitResult = checkMultiDimensionRateLimit(
    request,
    path,
    PUBLIC_LEAD_RATE_LIMIT,
    {
      email: typeof body.email === 'string' ? body.email : undefined,
      phone: typeof body.phone === 'string' ? body.phone : undefined,
    }
  )

  if (!rateLimitResult.allowed) {
    return rateLimitResponse(rateLimitResult)
  }

  // Bot verification with Cloudflare Turnstile
  // REQUIRED: Turnstile verification is mandatory for public lead submissions
  const turnstileToken = typeof body.turnstileToken === 'string' ? body.turnstileToken : null

  if (!turnstileToken) {
    logAbuseEvent({
      event: 'bot_verification_failed',
      timestamp: new Date().toISOString(),
      ip,
      path,
      reason: 'Missing turnstile token',
    })
    return botVerificationFailedResponse('Verification required')
  }

  const verifyResult = await verifyTurnstileToken(turnstileToken, ip)

  // FAIL-CLOSED: Misconfiguration (missing/empty TURNSTILE_SECRET_KEY) returns 503
  if (verifyResult.misconfigured) {
    // Logging already done in verifyTurnstileToken with 'turnstile_misconfigured' dimension
    return NextResponse.json(
      { error: 'Service temporarily unavailable. Please try again later.' },
      { status: 503 }
    )
  }

  if (!verifyResult.success) {
    logAbuseEvent({
      event: 'bot_verification_failed',
      timestamp: new Date().toISOString(),
      ip,
      path,
      reason: verifyResult.error || 'Token verification failed',
    })
    return botVerificationFailedResponse(verifyResult.error || 'Verification failed')
  }

  // Validate form data
  const v = validate(LeadWebFormSchema, body)

  if (!v.success) {
    // Return validation errors but no internal details
    return NextResponse.json(
      { error: 'Please check your form inputs', details: v.errors },
      { status: 400 }
    )
  }

  const data = v.data

  try {
    const client = getSanityWriteClient()
    const now = new Date().toISOString()

    // Create the lead document
    const leadDoc = {
      _type: 'lead' as const,
      fullName: data.fullName,
      email: data.email || '',
      phone: data.phone || '',
      origin: 'auto_website_form' as const,
      source: 'website_form',
      serviceType: data.serviceType || '',
      priority: 'medium' as const,
      status: 'new' as const,
      originalMessage: data.message || '',
      receivedAt: now,
      formId: data.formId || 'contact-page',
    }

    // Atomic transaction - lead + Activity commit together
    const leadId = `lead.${crypto.randomUUID()}`
    const activityId = `activity.${crypto.randomUUID()}`

    const transaction = client.transaction()
    transaction.create({
      ...leadDoc,
      _id: leadId,
    })
    transaction.create({
      _id: activityId,
      _type: 'activity' as const,
      type: 'lead_created_auto',
      description: `Lead auto-created from website contact form`,
      timestamp: now,
      lead: { _type: 'reference' as const, _ref: leadId },
      performedBy: 'system',
    })

    await transaction.commit()

    // SUCCESS: Return ONLY success flag and user-facing message
    // DO NOT return leadId (prevents enumeration)
    return NextResponse.json({
      success: true,
      message: 'Thank you! We will be in touch soon.',
    })
  } catch (error) {
    // Log for debugging but don't expose to client
    console.error('[Lead API] Create error:', error instanceof Error ? error.message : 'Unknown')

    // Safe error response - no internal details
    return NextResponse.json(
      { error: 'Unable to submit your request. Please try again.' },
      { status: 500 }
    )
  }
}
