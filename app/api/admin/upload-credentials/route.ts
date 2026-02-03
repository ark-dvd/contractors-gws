import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/middleware'

export const runtime = 'nodejs'

// Returns Sanity credentials for client-side upload
// Only accessible to authenticated admins
export async function GET(request: NextRequest) {
  console.log('[UploadCredentials] Request received')

  const auth = await requireAdmin(request)
  if ('error' in auth) {
    console.log('[UploadCredentials] Auth failed')
    return auth.error
  }

  console.log('[UploadCredentials] Auth success for:', auth.user.email)

  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
  const token = process.env.SANITY_API_TOKEN

  if (!projectId || !token) {
    console.error('[UploadCredentials] Missing env vars')
    return NextResponse.json(
      { error: 'Server configuration error' },
      { status: 500 }
    )
  }

  // Return credentials for client-side upload
  // This is safe because only authenticated admins can access this endpoint
  return NextResponse.json({
    projectId,
    dataset,
    token,
  })
}
