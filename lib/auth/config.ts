import type { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'

// ALLOWED ADMIN EMAILS — read from environment variable
// Format in env: comma-separated emails, e.g. "arik@daflash.com,niv@beprojectsolutions.com"
// Falls back to empty array if not set (no one can log in — intentional safety)
function getAllowedAdminEmails(): string[] {
  const envEmails = process.env.ALLOWED_ADMIN_EMAILS || ''
  return envEmails
    .split(',')
    .map(email => email.trim().toLowerCase())
    .filter(email => email.length > 0)
}

function normalizeEmail(email: string | null | undefined): string {
  return (email ?? '').trim().toLowerCase()
}

function isAllowedAdmin(email: string | null | undefined): boolean {
  const normalized = normalizeEmail(email)
  if (!normalized) return false
  const allowed = getAllowedAdminEmails()
  return allowed.includes(normalized)
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      if (!isAllowedAdmin(user.email)) {
        console.warn('Admin login denied:', user.email)
        return false
      }
      return true
    },
    async session({ session }) { return session },
    async jwt({ token }) { return token },
  },
  pages: {
    signIn: '/admin',
    error: '/admin',
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },

  // ⚠️ CRITICAL: Explicit cookie configuration
  // Without this, Netlify production deploys use __Secure- prefix
  // which causes getToken() to fail when looking for the wrong cookie name
  cookies: {
    sessionToken: {
      name: 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
}

export { isAllowedAdmin }
