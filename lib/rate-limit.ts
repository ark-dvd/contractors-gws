import { NextRequest, NextResponse } from 'next/server'
import {
  checkAdminRateLimit,
  rateLimitResponse as abuseRateLimitResponse,
  logAbuseEvent,
  getClientIP,
  ADMIN_API_RATE_LIMIT,
  type RateLimitConfig,
} from './abuse-prevention'

/**
 * Rate Limit Module
 * Phase 5: Updated to use fail-closed abuse prevention
 *
 * All rate limiting now:
 * - Fails closed on any error (returns 429)
 * - Logs blocks for operator visibility
 * - Uses consistent response format
 */

export interface RateLimitOptions {
  /** Maximum number of requests allowed in the window */
  limit: number
  /** Time window in seconds */
  windowSeconds: number
}

/**
 * Middleware helper to apply rate limiting to an API route
 * FAIL-CLOSED: Any error in rate limiting returns 429
 */
export function withRateLimit(
  request: NextRequest,
  options: RateLimitOptions = ADMIN_API_RATE_LIMIT
): NextResponse | null {
  const path = request.nextUrl.pathname
  const config: RateLimitConfig = {
    limit: options.limit,
    windowSeconds: options.windowSeconds,
  }

  const result = checkAdminRateLimit(request, path, config)

  if (!result.allowed) {
    return abuseRateLimitResponse(result)
  }

  return null // Continue with the request
}

// Default rate limit configurations
export const RATE_LIMITS = {
  admin: { limit: 120, windowSeconds: 60 },  // 120 requests per minute for admin
  upload: { limit: 10, windowSeconds: 60 },  // 10 uploads per minute
  crm: { limit: 60, windowSeconds: 60 },     // 60 requests per minute for CRM
} as const

// Re-export for backward compatibility
export { checkAdminRateLimit, logAbuseEvent, getClientIP }
