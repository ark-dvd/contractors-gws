import type { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'

// ALLOWED ADMIN EMAILS — ONLY these can access /admin
// Store lowercase for normalized comparison
const ALLOWED_ADMIN_EMAILS: string[] = [
  'arik@daflash.com',
]

function normalizeEmail(email: string | null | undefined): string {
  return (email ?? '').trim().toLowerCase()
}

function isAllowedAdmin(email: string | null | undefined): boolean {
  const normalized = normalizeEmail(email)
  if (!normalized) return false
  return ALLOWED_ADMIN_EMAILS.includes(normalized)
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

export { isAllowedAdmin, ALLOWED_ADMIN_EMAILS }
