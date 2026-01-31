import { NextRequest, NextResponse } from 'next/server'

interface RateLimitEntry {
  count: number
  resetTime: number
}

// In-memory store for rate limiting (resets on deploy)
const rateLimitStore = new Map<string, RateLimitEntry>()

// Clean up old entries every 5 minutes
const CLEANUP_INTERVAL = 5 * 60 * 1000
let lastCleanup = Date.now()

function cleanup() {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL) return

  lastCleanup = now
  Array.from(rateLimitStore.entries()).forEach(([key, entry]) => {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key)
    }
  })
}

/**
 * Get client IP from request headers
 */
function getClientIP(request: NextRequest): string {
  // Check common headers for client IP
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }

  const realIP = request.headers.get('x-real-ip')
  if (realIP) {
    return realIP
  }

  // Fallback to a default identifier
  return 'unknown'
}

interface RateLimitOptions {
  /** Maximum number of requests allowed in the window */
  limit: number
  /** Time window in seconds */
  windowSeconds: number
}

interface RateLimitResult {
  success: boolean
  remaining: number
  resetTime: number
}

/**
 * Check rate limit for a given request
 */
export function checkRateLimit(
  request: NextRequest,
  options: RateLimitOptions = { limit: 60, windowSeconds: 60 }
): RateLimitResult {
  cleanup()

  const ip = getClientIP(request)
  const key = `${ip}:${request.nextUrl.pathname}`
  const now = Date.now()
  const windowMs = options.windowSeconds * 1000

  const entry = rateLimitStore.get(key)

  if (!entry || entry.resetTime < now) {
    // Create new entry
    const resetTime = now + windowMs
    rateLimitStore.set(key, { count: 1, resetTime })
    return { success: true, remaining: options.limit - 1, resetTime }
  }

  if (entry.count >= options.limit) {
    // Rate limit exceeded
    return { success: false, remaining: 0, resetTime: entry.resetTime }
  }

  // Increment count
  entry.count++
  return { success: true, remaining: options.limit - entry.count, resetTime: entry.resetTime }
}

/**
 * Create a rate-limited response with proper headers
 */
export function rateLimitResponse(result: RateLimitResult): NextResponse {
  return NextResponse.json(
    { error: 'Too many requests. Please try again later.' },
    {
      status: 429,
      headers: {
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': result.resetTime.toString(),
        'Retry-After': Math.ceil((result.resetTime - Date.now()) / 1000).toString(),
      },
    }
  )
}

/**
 * Middleware helper to apply rate limiting to an API route
 */
export function withRateLimit(
  request: NextRequest,
  options?: RateLimitOptions
): NextResponse | null {
  const result = checkRateLimit(request, options)

  if (!result.success) {
    return rateLimitResponse(result)
  }

  return null // Continue with the request
}

// Default rate limit configurations
export const RATE_LIMITS = {
  admin: { limit: 60, windowSeconds: 60 }, // 60 requests per minute
  upload: { limit: 10, windowSeconds: 60 }, // 10 uploads per minute
} as const
