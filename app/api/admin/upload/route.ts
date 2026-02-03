import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/middleware'
import { getSanityWriteClient } from '@/lib/sanity'

// Disable Next.js body parsing - we handle formData manually
export const runtime = 'nodejs'

// Simple in-memory rate limiting
const uploadCounts = new Map<string, { count: number; resetAt: number }>()
const MAX_UPLOADS_PER_MINUTE = 10

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm']
const MAX_IMAGE_SIZE = 10 * 1024 * 1024 // 10MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024 // 50MB

function checkRateLimit(userId: string): boolean {
  const now = Date.now()
  const userLimit = uploadCounts.get(userId)

  if (!userLimit || now > userLimit.resetAt) {
    uploadCounts.set(userId, { count: 1, resetAt: now + 60000 })
    return true
  }

  if (userLimit.count >= MAX_UPLOADS_PER_MINUTE) {
    return false
  }

  userLimit.count++
  return true
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request)
  if ('error' in auth) return auth.error

  // Rate limiting
  if (!checkRateLimit(auth.user.id)) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Max 10 uploads per minute.' },
      { status: 429 }
    )
  }

  try {
    console.log('[Upload] Starting file upload request')

    // Check environment variables first
    const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
    const apiToken = process.env.SANITY_API_TOKEN

    console.log('[Upload] Environment check:', {
      hasProjectId: !!projectId,
      projectId: projectId ? `${projectId.substring(0, 4)}...` : 'MISSING',
      hasApiToken: !!apiToken,
      tokenLength: apiToken?.length || 0,
    })

    if (!projectId || !apiToken) {
      console.error('[Upload] Missing environment variables:', {
        NEXT_PUBLIC_SANITY_PROJECT_ID: projectId ? 'set' : 'MISSING',
        SANITY_API_TOKEN: apiToken ? 'set' : 'MISSING',
      })
      return NextResponse.json(
        { error: 'Server configuration error: Missing Sanity credentials' },
        { status: 500 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file')

    if (!file || !(file instanceof File)) {
      console.log('[Upload] No file in request')
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    console.log('[Upload] File received:', {
      name: file.name,
      type: file.type,
      size: file.size,
      sizeKB: Math.round(file.size / 1024),
    })

    const isImage = ALLOWED_IMAGE_TYPES.includes(file.type)
    const isVideo = ALLOWED_VIDEO_TYPES.includes(file.type)

    if (!isImage && !isVideo) {
      console.log('[Upload] Invalid file type:', file.type)
      return NextResponse.json(
        { error: `Invalid file type: ${file.type}. Allowed: ${[...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES].join(', ')}` },
        { status: 400 }
      )
    }

    const maxSize = isImage ? MAX_IMAGE_SIZE : MAX_VIDEO_SIZE
    if (file.size > maxSize) {
      const maxMB = maxSize / (1024 * 1024)
      console.log('[Upload] File too large:', { size: file.size, maxSize })
      return NextResponse.json(
        { error: `File too large. Max size: ${maxMB}MB` },
        { status: 400 }
      )
    }

    console.log('[Upload] Converting file to buffer...')
    const buffer = Buffer.from(await file.arrayBuffer())
    console.log('[Upload] Buffer created, size:', buffer.length)

    console.log('[Upload] Getting Sanity write client...')
    const client = getSanityWriteClient()
    console.log('[Upload] Sanity client obtained')

    // Upload as 'image' for images, 'file' for videos
    const assetType = isImage ? 'image' : 'file'
    console.log('[Upload] Uploading to Sanity as:', assetType)

    const asset = await client.assets.upload(assetType, buffer, {
      filename: file.name,
      contentType: file.type,
    })

    console.log('[Upload] Upload successful:', {
      assetId: asset._id,
      url: asset.url,
    })

    return NextResponse.json({
      assetId: asset._id,
      url: asset.url,
      type: assetType,
      filename: file.name,
    })
  } catch (e) {
    // Detailed error logging
    const error = e as Error & {
      statusCode?: number
      response?: { body?: unknown }
      details?: unknown
    }

    console.error('[Upload] ERROR:', {
      message: error.message,
      name: error.name,
      statusCode: error.statusCode,
      details: error.details,
      response: error.response?.body,
      stack: error.stack,
    })

    // Return more specific error message
    let errorMessage = 'Failed to upload file'
    if (error.message?.includes('token')) {
      errorMessage = 'Invalid or missing API token'
    } else if (error.message?.includes('permission')) {
      errorMessage = 'API token lacks write permissions'
    } else if (error.statusCode === 401) {
      errorMessage = 'Unauthorized: Check SANITY_API_TOKEN'
    } else if (error.statusCode === 403) {
      errorMessage = 'Forbidden: Token lacks Editor permissions'
    }

    return NextResponse.json(
      { error: errorMessage, details: error.message },
      { status: error.statusCode || 500 }
    )
  }
}
