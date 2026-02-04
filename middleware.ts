import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}

/**
 * Generate CSP header with nonce for strict security
 * Per DOC-040: No unsafe-inline, no unsafe-eval in production
 *
 * Style hashes are for Next.js internal components (next-route-announcer)
 * that inject inline styles without nonce support.
 * See: https://github.com/vercel/next.js/issues/83764
 *
 * Phase 5: Added Cloudflare Turnstile domains for bot verification
 */
function generateCSP(nonce: string): string {
  const isDev = process.env.NODE_ENV === 'development'

  // SHA256 hashes of Next.js internal inline styles (next-route-announcer)
  // These must be updated if Next.js changes the inline style strings
  const nextjsStyleHashes = [
    "'sha256-HrvAPhJHDMpEBcplBvvwyxAYUF0koC1/uv7HLEC0aqg='", // position: absolute
    "'sha256-2v0wUgRiMnQqfAAERz6WCRNJ9EZeUWOvHSCDVMftC6Q='", // full announcer style
  ]

  // Base CSP directives
  const directives = [
    "default-src 'self'",
    // script-src: Use nonce + strict-dynamic (no unsafe-inline, no unsafe-eval in prod)
    // Cloudflare Turnstile scripts loaded dynamically will be allowed by strict-dynamic
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://challenges.cloudflare.com${isDev ? " 'unsafe-eval'" : ''}`,
    // style-src: Use nonce + hashes for Next.js internal styles (no unsafe-inline)
    // Google Fonts CSS requires explicit allow (loaded via <link>)
    `style-src 'self' 'nonce-${nonce}' ${nextjsStyleHashes.join(' ')} https://fonts.googleapis.com`,
    "img-src 'self' data: https://cdn.sanity.io https://images.unsplash.com https://lh3.googleusercontent.com",
    "font-src 'self' https://fonts.gstatic.com",
    // connect-src: Sanity API + Cloudflare Turnstile verification
    "connect-src 'self' https://*.sanity.io https://challenges.cloudflare.com",
    "media-src 'self' https://cdn.sanity.io",
    // frame-src: Cloudflare Turnstile uses an iframe for the challenge widget
    "frame-src https://challenges.cloudflare.com",
    "base-uri 'self'",
    "form-action 'self'",
  ]

  return directives.join('; ')
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Generate nonce for CSP
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64')
  const cspHeader = generateCSP(nonce)

  // Forward nonce AND CSP to Next.js rendering layer via request headers
  // Next.js reads CSP from request headers to apply nonce to internal scripts
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-nonce', nonce)
  requestHeaders.set('Content-Security-Policy', cspHeader)

  // Admin route protection
  if (pathname.startsWith('/admin')) {
    try {
      const token = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET,
        cookieName: 'next-auth.session-token',
      })

      if (!token && pathname !== '/admin') {
        const response = NextResponse.redirect(new URL('/admin', request.url))
        response.headers.set('Content-Security-Policy', cspHeader)
        response.headers.set('x-nonce', nonce)
        return response
      }
    } catch {
      const response = NextResponse.redirect(new URL('/admin', request.url))
      response.headers.set('Content-Security-Policy', cspHeader)
      response.headers.set('x-nonce', nonce)
      return response
    }
  }

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  })

  // Set security headers (single source of truth - NOT in netlify.toml)
  response.headers.set('Content-Security-Policy', cspHeader)
  response.headers.set('x-nonce', nonce)
  response.headers.set('X-DNS-Prefetch-Control', 'on')
  response.headers.set('X-Frame-Options', 'SAMEORIGIN')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  return response
}
