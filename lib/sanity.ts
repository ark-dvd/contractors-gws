import { createClient, SanityClient } from '@sanity/client'

const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
const apiVersion = '2024-01-01'

let _readClient: SanityClient | null = null
let _writeClient: SanityClient | null = null

export function getSanityClient(): SanityClient {
  if (!_readClient) {
    const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
    if (!projectId) throw new Error('SANITY_CONFIG_ERROR: Missing NEXT_PUBLIC_SANITY_PROJECT_ID')

    const readToken = process.env.SANITY_READ_TOKEN || process.env.SANITY_API_TOKEN

    _readClient = createClient({
      projectId,
      dataset,
      apiVersion,
      useCdn: false, // CRITICAL: false = fresh data on every request
      token: readToken,
    })
  }
  return _readClient
}

export function getSanityWriteClient(): SanityClient {
  if (!_writeClient) {
    const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
    const token = process.env.SANITY_API_TOKEN
    if (!projectId) throw new Error('SANITY_CONFIG_ERROR: Missing NEXT_PUBLIC_SANITY_PROJECT_ID')
    if (!token) throw new Error('SANITY_CONFIG_ERROR: Missing SANITY_API_TOKEN')

    _writeClient = createClient({ projectId, dataset, apiVersion, useCdn: false, token })
  }
  return _writeClient
}

export function isSanityConfigured(): boolean {
  // CRITICAL: Check ONLY NEXT_PUBLIC_ variable (available to both server and client)
  // Do NOT check SANITY_API_TOKEN here — it's server-only and will cause
  // the read client to silently fall back to demo mode on the frontend
  return Boolean(process.env.NEXT_PUBLIC_SANITY_PROJECT_ID)
}
