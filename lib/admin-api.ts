// Admin API fetch helpers
// These call the protected /api/admin/* routes (NOT public data-fetchers)

export class AdminAPIError extends Error {
  status: number
  details?: string[]

  constructor(message: string, status: number, details?: string[]) {
    super(message)
    this.name = 'AdminAPIError'
    this.status = status
    this.details = details
  }
}

export async function adminFetch<T>(endpoint: string): Promise<T> {
  const res = await fetch(`/api/admin/${endpoint}`, {
    credentials: 'include',
  })

  if (!res.ok) {
    if (res.status === 401) {
      throw new AdminAPIError('Unauthorized', 401)
    }
    if (res.status === 403) {
      throw new AdminAPIError('Forbidden', 403)
    }
    const err = await res.json().catch(() => ({}))
    throw new AdminAPIError(err.error || `API error: ${res.status}`, res.status)
  }

  return res.json()
}

export async function adminPost<T>(endpoint: string, data: unknown): Promise<T> {
  const res = await fetch(`/api/admin/${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new AdminAPIError(
      err.error || `API error: ${res.status}`,
      res.status,
      err.details
    )
  }

  return res.json()
}

export async function adminPut<T>(endpoint: string, data: unknown): Promise<T> {
  const res = await fetch(`/api/admin/${endpoint}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new AdminAPIError(
      err.error || `API error: ${res.status}`,
      res.status,
      err.details
    )
  }

  return res.json()
}

export async function adminDelete(endpoint: string, id: string): Promise<void> {
  const res = await fetch(`/api/admin/${endpoint}?id=${encodeURIComponent(id)}`, {
    method: 'DELETE',
    credentials: 'include',
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new AdminAPIError(err.error || `API error: ${res.status}`, res.status)
  }
}

// Client-side direct upload to Sanity (bypasses Netlify size limits)
export async function adminUpload(file: File): Promise<{ assetId: string; url: string }> {
  console.log('[adminUpload] Starting upload for:', file.name, 'size:', file.size)

  // Get upload credentials from our API (verifies admin auth)
  const credRes = await fetch('/api/admin/upload-credentials', {
    credentials: 'include',
  })

  if (!credRes.ok) {
    const err = await credRes.json().catch(() => ({}))
    throw new AdminAPIError(err.error || 'Failed to get upload credentials', credRes.status)
  }

  const { projectId, dataset, token } = await credRes.json()
  console.log('[adminUpload] Got credentials, uploading directly to Sanity...')

  // Upload directly to Sanity API (bypasses Netlify)
  const assetType = file.type.startsWith('image/') ? 'images' : 'files'
  const uploadUrl = `https://${projectId}.api.sanity.io/v2024-01-01/assets/${assetType}/${dataset}`

  const uploadRes = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': file.type,
    },
    body: file,
  })

  if (!uploadRes.ok) {
    const errText = await uploadRes.text()
    console.error('[adminUpload] Sanity upload failed:', uploadRes.status, errText)
    throw new AdminAPIError(`Sanity upload failed: ${uploadRes.status}`, uploadRes.status)
  }

  const result = await uploadRes.json()
  console.log('[adminUpload] Upload successful:', result.document._id)

  return {
    assetId: result.document._id,
    url: result.document.url,
  }
}
