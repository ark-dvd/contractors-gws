/**
 * Abuse Prevention & Multi-Dimensional Rate Limiting
 * Phase 5: Abuse resistance for public endpoints
 *
 * Design principles:
 * - Fail closed: any limiter error returns 429
 * - Multi-dimensional: IP + fingerprint + contact bucket
 * - Operator visibility: structured logging for all blocks
 */

import { NextRequest, NextResponse } from 'next/server'

// ============================================
// STRUCTURED LOGGING
// ============================================

export type AbuseEventType =
  | 'rate_limit_blocked'
  | 'bot_verification_failed'
  | 'suspicious_pattern'
  | 'limiter_error'

interface AbuseLogEntry {
  event: AbuseEventType
  timestamp: string
  ip: string
  path: string
  dimension?: string
  reason?: string
  // Never log: secrets, tokens, full request bodies
}

/**
 * Log abuse event with structured format for operator visibility
 * Safe: never logs secrets or raw captcha tokens
 */
export function logAbuseEvent(entry: AbuseLogEntry): void {
  const logLine = JSON.stringify({
    level: 'warn',
    type: 'abuse_prevention',
    ...entry,
  })
  console.warn(logLine)
}

// ============================================
// RATE LIMIT STORE
// ============================================

interface RateLimitEntry {
  count: number
  resetTime: number
  firstSeen: number
}

// In-memory store (resets on deploy - acceptable for serverless)
const rateLimitStore = new Map<string, RateLimitEntry>()

// Cleanup interval
const CLEANUP_INTERVAL = 5 * 60 * 1000
let lastCleanup = Date.now()

function cleanup(): void {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL) return

  lastCleanup = now
  const keysToDelete: string[] = []
  rateLimitStore.forEach((entry, key) => {
    if (entry.resetTime < now) {
      keysToDelete.push(key)
    }
  })
  keysToDelete.forEach((key) => rateLimitStore.delete(key))
}

// ============================================
// IP EXTRACTION
// ============================================

export function getClientIP(request: NextRequest): string {
  // Cloudflare
  const cfConnectingIp = request.headers.get('cf-connecting-ip')
  if (cfConnectingIp) return cfConnectingIp

  // Standard proxy headers
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) return forwardedFor.split(',')[0].trim()

  const realIp = request.headers.get('x-real-ip')
  if (realIp) return realIp

  return 'unknown'
}

// ============================================
// FINGERPRINT GENERATION
// ============================================

/**
 * Generate a lightweight fingerprint bucket from request headers
 * This is NOT for tracking users - just for rate limit bucketing
 */
export function getFingerprint(request: NextRequest): string {
  const ua = request.headers.get('user-agent') || 'none'
  const lang = request.headers.get('accept-language') || 'none'

  // Create a simple hash bucket (not cryptographic, just bucketing)
  const combined = `${ua}:${lang}`
  let hash = 0
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36)
}

/**
 * Normalize email for bucketing (lowercase, trim)
 */
export function normalizeEmail(email: string | undefined): string {
  if (!email) return ''
  return email.toLowerCase().trim()
}

/**
 * Normalize phone for bucketing (digits only)
 */
export function normalizePhone(phone: string | undefined): string {
  if (!phone) return ''
  return phone.replace(/\D/g, '')
}

/**
 * Create a contact bucket key from normalized email + phone
 */
export function getContactBucket(email?: string, phone?: string): string {
  const normEmail = normalizeEmail(email)
  const normPhone = normalizePhone(phone)
  if (!normEmail && !normPhone) return ''
  return `contact:${normEmail}:${normPhone}`
}

// ============================================
// RATE LIMIT CHECK
// ============================================

export interface RateLimitConfig {
  /** Maximum requests allowed in window */
  limit: number
  /** Window size in seconds */
  windowSeconds: number
}

interface RateLimitCheckResult {
  allowed: boolean
  remaining: number
  resetTime: number
  dimension: string
}

/**
 * Check rate limit for a single dimension
 * Returns allowed: false if limit exceeded
 */
function checkDimension(
  key: string,
  config: RateLimitConfig,
  dimension: string
): RateLimitCheckResult {
  const now = Date.now()
  const windowMs = config.windowSeconds * 1000
  const entry = rateLimitStore.get(key)

  if (!entry || entry.resetTime < now) {
    // New window
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + windowMs,
      firstSeen: now,
    })
    return {
      allowed: true,
      remaining: config.limit - 1,
      resetTime: now + windowMs,
      dimension,
    }
  }

  if (entry.count >= config.limit) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
      dimension,
    }
  }

  entry.count++
  return {
    allowed: true,
    remaining: config.limit - entry.count,
    resetTime: entry.resetTime,
    dimension,
  }
}

// ============================================
// MULTI-DIMENSIONAL RATE LIMIT
// ============================================

export interface MultiDimensionConfig {
  /** IP-based limit */
  ip: RateLimitConfig
  /** Fingerprint-based limit (UA + lang hash) */
  fingerprint: RateLimitConfig
  /** Contact-based limit (email + phone) - optional */
  contact?: RateLimitConfig
}

export interface MultiRateLimitResult {
  allowed: boolean
  blockedBy?: string
  remaining: number
  resetTime: number
}

/**
 * Check rate limits across multiple dimensions
 * Blocks if ANY dimension is exceeded (fail closed)
 */
export function checkMultiDimensionRateLimit(
  request: NextRequest,
  path: string,
  config: MultiDimensionConfig,
  contactInfo?: { email?: string; phone?: string }
): MultiRateLimitResult {
  try {
    cleanup()

    const ip = getClientIP(request)
    const fingerprint = getFingerprint(request)

    // Check IP dimension
    const ipKey = `ip:${path}:${ip}`
    const ipResult = checkDimension(ipKey, config.ip, 'ip')
    if (!ipResult.allowed) {
      logAbuseEvent({
        event: 'rate_limit_blocked',
        timestamp: new Date().toISOString(),
        ip,
        path,
        dimension: 'ip',
        reason: `Exceeded ${config.ip.limit} requests in ${config.ip.windowSeconds}s`,
      })
      return {
        allowed: false,
        blockedBy: 'ip',
        remaining: 0,
        resetTime: ipResult.resetTime,
      }
    }

    // Check fingerprint dimension
    const fpKey = `fp:${path}:${fingerprint}`
    const fpResult = checkDimension(fpKey, config.fingerprint, 'fingerprint')
    if (!fpResult.allowed) {
      logAbuseEvent({
        event: 'rate_limit_blocked',
        timestamp: new Date().toISOString(),
        ip,
        path,
        dimension: 'fingerprint',
        reason: `Exceeded ${config.fingerprint.limit} requests in ${config.fingerprint.windowSeconds}s`,
      })
      return {
        allowed: false,
        blockedBy: 'fingerprint',
        remaining: 0,
        resetTime: fpResult.resetTime,
      }
    }

    // Check contact dimension if provided and configured
    if (config.contact && contactInfo) {
      const contactBucket = getContactBucket(contactInfo.email, contactInfo.phone)
      if (contactBucket) {
        const contactKey = `${path}:${contactBucket}`
        const contactResult = checkDimension(contactKey, config.contact, 'contact')
        if (!contactResult.allowed) {
          logAbuseEvent({
            event: 'rate_limit_blocked',
            timestamp: new Date().toISOString(),
            ip,
            path,
            dimension: 'contact',
            reason: `Exceeded ${config.contact.limit} requests in ${config.contact.windowSeconds}s for contact`,
          })
          return {
            allowed: false,
            blockedBy: 'contact',
            remaining: 0,
            resetTime: contactResult.resetTime,
          }
        }
      }
    }

    // All dimensions passed
    const minRemaining = Math.min(ipResult.remaining, fpResult.remaining)
    const maxReset = Math.max(ipResult.resetTime, fpResult.resetTime)

    return {
      allowed: true,
      remaining: minRemaining,
      resetTime: maxReset,
    }
  } catch (err) {
    // FAIL CLOSED: any error in rate limiting returns blocked
    const ip = getClientIP(request)
    logAbuseEvent({
      event: 'limiter_error',
      timestamp: new Date().toISOString(),
      ip,
      path,
      reason: err instanceof Error ? err.message : 'Unknown error',
    })
    return {
      allowed: false,
      blockedBy: 'error',
      remaining: 0,
      resetTime: Date.now() + 60000,
    }
  }
}

// ============================================
// RESPONSE HELPERS
// ============================================

/**
 * Create a 429 rate limit response with proper headers
 */
export function rateLimitResponse(result: MultiRateLimitResult): NextResponse {
  const retryAfter = Math.ceil((result.resetTime - Date.now()) / 1000)
  return NextResponse.json(
    { error: 'Too many requests. Please try again later.' },
    {
      status: 429,
      headers: {
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': result.resetTime.toString(),
        'Retry-After': Math.max(1, retryAfter).toString(),
      },
    }
  )
}

/**
 * Create a 403 bot verification failure response
 */
export function botVerificationFailedResponse(message: string = 'Verification failed'): NextResponse {
  return NextResponse.json(
    { error: message },
    { status: 403 }
  )
}

// ============================================
// DEFAULT CONFIGURATIONS
// ============================================

/**
 * Rate limit config for public lead form
 * Restrictive: abuse-resistant
 */
export const PUBLIC_LEAD_RATE_LIMIT: MultiDimensionConfig = {
  ip: { limit: 5, windowSeconds: 60 },           // 5 per IP per minute
  fingerprint: { limit: 10, windowSeconds: 60 }, // 10 per fingerprint per minute
  contact: { limit: 3, windowSeconds: 300 },     // 3 per email+phone per 5 minutes
}

/**
 * Rate limit config for admin/CRM APIs
 * More permissive for authenticated users
 */
export const ADMIN_API_RATE_LIMIT: RateLimitConfig = {
  limit: 120,
  windowSeconds: 60,
}

/**
 * Simple rate limit check for admin APIs (IP + path only)
 * Fail-closed on errors
 */
export function checkAdminRateLimit(
  request: NextRequest,
  path: string,
  config: RateLimitConfig = ADMIN_API_RATE_LIMIT
): MultiRateLimitResult {
  try {
    cleanup()
    const ip = getClientIP(request)
    const key = `admin:${path}:${ip}`
    const result = checkDimension(key, config, 'ip')

    if (!result.allowed) {
      logAbuseEvent({
        event: 'rate_limit_blocked',
        timestamp: new Date().toISOString(),
        ip,
        path,
        dimension: 'admin-ip',
        reason: `Admin API: exceeded ${config.limit} requests in ${config.windowSeconds}s`,
      })
    }

    return {
      allowed: result.allowed,
      blockedBy: result.allowed ? undefined : 'ip',
      remaining: result.remaining,
      resetTime: result.resetTime,
    }
  } catch (err) {
    // FAIL CLOSED
    const ip = getClientIP(request)
    logAbuseEvent({
      event: 'limiter_error',
      timestamp: new Date().toISOString(),
      ip,
      path,
      reason: err instanceof Error ? err.message : 'Unknown error',
    })
    return {
      allowed: false,
      blockedBy: 'error',
      remaining: 0,
      resetTime: Date.now() + 60000,
    }
  }
}
