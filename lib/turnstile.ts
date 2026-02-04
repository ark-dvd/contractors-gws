/**
 * Cloudflare Turnstile Server-Side Verification
 * Phase 5: Bot resistance for public lead endpoint
 *
 * Required env vars:
 * - TURNSTILE_SECRET_KEY: Server-side secret from Cloudflare dashboard
 * - NEXT_PUBLIC_TURNSTILE_SITE_KEY: Client-side site key (public)
 *
 * Test-only bypass (NEVER in production):
 * - TURNSTILE_TEST_BYPASS=1 + NODE_ENV !== 'production'
 */

import { logAbuseEvent } from './abuse-prevention'

const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'

// Test bypass token - only works in non-production with TURNSTILE_TEST_BYPASS=1
const TEST_BYPASS_TOKEN = '__test_bypass_token__'

export interface TurnstileVerifyResult {
  success: boolean
  error?: string
  /** Set to true when server is misconfigured (missing secret) */
  misconfigured?: boolean
  // Do NOT expose challenge_ts, hostname, or error-codes to callers
}

/**
 * Check if test bypass is allowed
 * STRICT: Only when NODE_ENV !== 'production' AND TURNSTILE_TEST_BYPASS=1
 */
function isTestBypassAllowed(): boolean {
  // PRODUCTION GUARD: Test bypass is IMPOSSIBLE in production
  if (process.env.NODE_ENV === 'production') {
    return false
  }
  return process.env.TURNSTILE_TEST_BYPASS === '1'
}

/**
 * Verify a Turnstile token server-side
 * Returns success: true if valid, success: false with safe error message if not
 *
 * FAIL-CLOSED behavior:
 * - Missing TURNSTILE_SECRET_KEY => misconfigured: true (caller must return 503)
 * - Missing/invalid token => success: false
 * - API errors => success: false
 */
export async function verifyTurnstileToken(
  token: string | null | undefined,
  remoteIp?: string
): Promise<TurnstileVerifyResult> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY

  // FAIL-CLOSED: Missing secret key is a MISCONFIGURATION
  // Caller MUST return 503 and log operator event
  if (!secretKey || secretKey.trim() === '') {
    logAbuseEvent({
      event: 'suspicious_pattern',
      timestamp: new Date().toISOString(),
      ip: remoteIp || 'unknown',
      path: '/api/crm/lead',
      dimension: 'turnstile_misconfigured',
      reason: 'TURNSTILE_SECRET_KEY is missing or empty',
    })
    return { success: false, error: 'Service temporarily unavailable', misconfigured: true }
  }

  // Fail closed: missing token
  if (!token || typeof token !== 'string' || token.trim() === '') {
    return { success: false, error: 'Verification required' }
  }

  // TEST BYPASS: Only in non-production with explicit env var
  // This allows testing the happy path without real Turnstile tokens
  if (token === TEST_BYPASS_TOKEN && isTestBypassAllowed()) {
    console.warn('[Turnstile] TEST BYPASS USED - this must never happen in production')
    return { success: true }
  }

  try {
    const formData = new URLSearchParams()
    formData.append('secret', secretKey)
    formData.append('response', token)
    if (remoteIp) {
      formData.append('remoteip', remoteIp)
    }

    const response = await fetch(TURNSTILE_VERIFY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    })

    if (!response.ok) {
      console.error('[Turnstile] Verification API returned non-OK status:', response.status)
      // Fail closed on API errors
      return { success: false, error: 'Verification failed' }
    }

    const result = await response.json()

    if (result.success === true) {
      return { success: true }
    }

    // Log error codes for debugging but don't expose to client
    if (result['error-codes']) {
      console.warn('[Turnstile] Verification failed:', result['error-codes'])
    }

    return { success: false, error: 'Verification failed' }
  } catch (err) {
    // Fail closed on network/parse errors
    console.error('[Turnstile] Verification request failed:', err)
    return { success: false, error: 'Verification unavailable' }
  }
}

/**
 * Check if Turnstile is configured (for client-side widget rendering)
 * Note: This checks NEXT_PUBLIC_ var which is safe to expose
 */
export function isTurnstileConfigured(): boolean {
  return !!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
}

/**
 * Get the test bypass token (only for testing)
 * Returns null in production
 */
export function getTestBypassToken(): string | null {
  if (isTestBypassAllowed()) {
    return TEST_BYPASS_TOKEN
  }
  return null
}
