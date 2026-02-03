/**
 * CRM API client helpers
 * For use in admin panel components
 */

export class CrmAPIError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: string[]
  ) {
    super(message)
    this.name = 'CrmAPIError'
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new CrmAPIError(
      body.error || 'Request failed',
      res.status,
      body.details
    )
  }
  return res.json()
}

// ============================================
// LEADS
// ============================================

// PHASE 2 (A3): status is now string - validated against settings.pipelineStages at API layer
export interface Lead {
  _id: string
  _createdAt?: string
  fullName: string
  email?: string
  phone?: string
  origin: 'auto_website_form' | 'auto_landing_page' | 'manual'
  source?: string
  serviceType?: string
  estimatedValue?: number
  priority: 'high' | 'medium' | 'low'
  status: string
  referredBy?: string
  originalMessage?: string
  description?: string
  internalNotes?: string
  receivedAt: string
  convertedToClient?: { _id: string; fullName: string }
}

export interface LeadsResponse {
  leads: Lead[]
  total: number
  statusCounts: Record<string, number>
  pagination: { offset: number; limit: number; hasMore: boolean }
}

export async function fetchLeads(params?: {
  status?: string
  limit?: number
  offset?: number
}): Promise<LeadsResponse> {
  const searchParams = new URLSearchParams()
  if (params?.status) searchParams.set('status', params.status)
  if (params?.limit) searchParams.set('limit', params.limit.toString())
  if (params?.offset) searchParams.set('offset', params.offset.toString())

  const res = await fetch(`/api/crm/leads?${searchParams}`)
  return handleResponse<LeadsResponse>(res)
}

export async function createLead(data: Partial<Lead>): Promise<Lead> {
  const res = await fetch('/api/crm/leads', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return handleResponse<Lead>(res)
}

export async function updateLead(data: Partial<Lead> & { _id: string }): Promise<Lead> {
  const res = await fetch('/api/crm/leads', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return handleResponse<Lead>(res)
}

export async function deleteLead(id: string): Promise<{ success: boolean }> {
  const res = await fetch(`/api/crm/leads?id=${id}`, { method: 'DELETE' })
  return handleResponse<{ success: boolean }>(res)
}

// ============================================
// CLIENTS
// ============================================

export interface Client {
  _id: string
  _createdAt?: string
  fullName: string
  email?: string
  phone?: string
  address?: string
  status: 'active' | 'past'
  clientSince: string
  preferredContact?: 'phone' | 'email' | 'text'
  internalNotes?: string
  propertyType?: string
  sourceLead?: { _id: string; fullName: string }
  dealCount?: number
  totalValue?: number
}

export interface ClientsResponse {
  clients: Client[]
  total: number
  statusCounts: Record<string, number>
  pagination: { offset: number; limit: number; hasMore: boolean }
}

export async function fetchClients(params?: {
  status?: string
  limit?: number
  offset?: number
}): Promise<ClientsResponse> {
  const searchParams = new URLSearchParams()
  if (params?.status) searchParams.set('status', params.status)
  if (params?.limit) searchParams.set('limit', params.limit.toString())
  if (params?.offset) searchParams.set('offset', params.offset.toString())

  const res = await fetch(`/api/crm/clients?${searchParams}`)
  return handleResponse<ClientsResponse>(res)
}

export async function createClient(data: {
  fullName: string
  email?: string
  phone?: string
  address?: string
  status?: 'active' | 'past'
  preferredContact?: 'phone' | 'email' | 'text'
  internalNotes?: string
  propertyType?: string
  sourceLeadId?: string
}): Promise<Client> {
  const res = await fetch('/api/crm/clients', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return handleResponse<Client>(res)
}

export async function updateClient(data: Partial<Client> & { _id: string }): Promise<Client> {
  const res = await fetch('/api/crm/clients', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return handleResponse<Client>(res)
}

export async function deleteClient(id: string): Promise<{ success: boolean }> {
  const res = await fetch(`/api/crm/clients?id=${id}`, { method: 'DELETE' })
  return handleResponse<{ success: boolean }>(res)
}

// ============================================
// DEALS
// ============================================

// PHASE 2 (A3): status is now string - validated against settings.dealStatuses at API layer
export interface Deal {
  _id: string
  _createdAt?: string
  title: string
  client: { _id: string; fullName: string; email?: string; phone?: string }
  dealType?: string
  value?: number
  status: string
  projectAddress?: string
  permitNumber?: string
  estimatedDuration?: string
  scope?: string[]
  contractSignedDate?: string
  startDate?: string
  expectedEndDate?: string
  actualEndDate?: string
  description?: string
  internalNotes?: string
}

export interface DealsResponse {
  deals: Deal[]
  total: number
  statusCounts: Record<string, number>
  pipelineValue: number
  pagination: { offset: number; limit: number; hasMore: boolean }
}

export async function fetchDeals(params?: {
  status?: string
  clientId?: string
  limit?: number
  offset?: number
}): Promise<DealsResponse> {
  const searchParams = new URLSearchParams()
  if (params?.status) searchParams.set('status', params.status)
  if (params?.clientId) searchParams.set('clientId', params.clientId)
  if (params?.limit) searchParams.set('limit', params.limit.toString())
  if (params?.offset) searchParams.set('offset', params.offset.toString())

  const res = await fetch(`/api/crm/deals?${searchParams}`)
  return handleResponse<DealsResponse>(res)
}

export async function createDeal(data: {
  title: string
  clientId: string
  dealType?: string
  value?: number
  status?: Deal['status']
  projectAddress?: string
  permitNumber?: string
  estimatedDuration?: string
  scope?: string[]
  contractSignedDate?: string
  startDate?: string
  expectedEndDate?: string
  description?: string
  internalNotes?: string
}): Promise<Deal> {
  const res = await fetch('/api/crm/deals', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return handleResponse<Deal>(res)
}

export async function updateDeal(data: {
  _id: string
  title?: string
  clientId?: string
  dealType?: string
  value?: number
  status?: Deal['status']
  projectAddress?: string
  permitNumber?: string
  estimatedDuration?: string
  scope?: string[]
  contractSignedDate?: string
  startDate?: string
  expectedEndDate?: string
  actualEndDate?: string
  description?: string
  internalNotes?: string
}): Promise<Deal> {
  const res = await fetch('/api/crm/deals', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return handleResponse<Deal>(res)
}

export async function deleteDeal(id: string): Promise<{ success: boolean }> {
  const res = await fetch(`/api/crm/deals?id=${id}`, { method: 'DELETE' })
  return handleResponse<{ success: boolean }>(res)
}

// ============================================
// ACTIVITIES
// ============================================

export interface Activity {
  _id: string
  type: string
  description?: string
  timestamp: string
  lead?: { _id: string; fullName: string }
  client?: { _id: string; fullName: string }
  deal?: { _id: string; title: string }
  performedBy: string
  metadata?: {
    oldStatus?: string
    newStatus?: string
    callDuration?: number
    quoteAmount?: number
  }
}

export interface ActivitiesResponse {
  activities: Activity[]
  total: number
  pagination: { offset: number; limit: number; hasMore: boolean }
}

export async function fetchActivities(params?: {
  leadId?: string
  clientId?: string
  dealId?: string
  limit?: number
  offset?: number
}): Promise<ActivitiesResponse> {
  const searchParams = new URLSearchParams()
  if (params?.leadId) searchParams.set('leadId', params.leadId)
  if (params?.clientId) searchParams.set('clientId', params.clientId)
  if (params?.dealId) searchParams.set('dealId', params.dealId)
  if (params?.limit) searchParams.set('limit', params.limit.toString())
  if (params?.offset) searchParams.set('offset', params.offset.toString())

  const res = await fetch(`/api/crm/activities?${searchParams}`)
  return handleResponse<ActivitiesResponse>(res)
}

export async function createActivity(data: {
  type: string
  description?: string
  leadId?: string
  clientId?: string
  dealId?: string
  performedBy?: string
  metadata?: Activity['metadata']
}): Promise<Activity> {
  const res = await fetch('/api/crm/activities', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return handleResponse<Activity>(res)
}

export async function deleteActivity(id: string): Promise<{ success: boolean }> {
  const res = await fetch(`/api/crm/activities?id=${id}`, { method: 'DELETE' })
  return handleResponse<{ success: boolean }>(res)
}

// ============================================
// CRM SETTINGS
// ============================================

export interface PipelineStage {
  key: string
  label: string
  color: string
}

export interface CrmSettings {
  _id: string
  pipelineStages: PipelineStage[]
  dealStatuses: PipelineStage[]
  leadSources: string[]
  serviceTypes: string[]
  defaultPriority: 'high' | 'medium' | 'low'
  currency: string
  industryLabel: string
  dealLabel: string
  leadsPageSize: number
}

export async function fetchCrmSettings(): Promise<CrmSettings> {
  const res = await fetch('/api/crm/settings')
  return handleResponse<CrmSettings>(res)
}

export async function updateCrmSettings(data: Partial<CrmSettings>): Promise<CrmSettings> {
  const res = await fetch('/api/crm/settings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return handleResponse<CrmSettings>(res)
}

export async function initializeCrmSettings(data?: Partial<CrmSettings>): Promise<CrmSettings> {
  const res = await fetch('/api/crm/settings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data || {}),
  })
  return handleResponse<CrmSettings>(res)
}

// ============================================
// GLOBAL SEARCH
// ============================================

export interface SearchResults {
  leads: Array<{
    _id: string
    fullName: string
    email?: string
    phone?: string
    serviceType?: string
    status: string
    origin: string
    estimatedValue?: number
    receivedAt: string
  }>
  clients: Array<{
    _id: string
    fullName: string
    email?: string
    phone?: string
    status: string
    dealCount: number
  }>
  deals: Array<{
    _id: string
    title: string
    clientName?: string
    dealType?: string
    value?: number
    status: string
  }>
  total: number
  query: string
}

export async function searchCrm(query: string): Promise<SearchResults> {
  const res = await fetch(`/api/crm/search?q=${encodeURIComponent(query)}`)
  return handleResponse<SearchResults>(res)
}

// ============================================
// LEAD CONVERSION HELPER
// ============================================

/**
 * Convert a lead to a client (and optionally create a deal)
 */
export async function convertLeadToClient(
  lead: Lead,
  options?: { createDeal?: boolean; dealTitle?: string }
): Promise<{ client: Client; deal?: Deal }> {
  // Create client from lead data
  const client = await createClient({
    fullName: lead.fullName,
    email: lead.email,
    phone: lead.phone,
    sourceLeadId: lead._id,
    status: 'active',
  })

  let deal: Deal | undefined

  // Optionally create a deal
  if (options?.createDeal) {
    deal = await createDeal({
      title: options.dealTitle || `${lead.serviceType || 'Project'} - ${lead.fullName}`,
      clientId: client._id,
      dealType: lead.serviceType,
      value: lead.estimatedValue,
      status: 'planning',
    })
  }

  return { client, deal }
}
