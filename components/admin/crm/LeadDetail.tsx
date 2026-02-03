'use client'

import { useState, useEffect } from 'react'
import {
  Phone,
  Mail,
  DollarSign,
  Calendar,
  User,
  FileText,
  MessageSquare,
  Briefcase,
  UserPlus,
  Archive,
  Save,
  Trash2,
} from 'lucide-react'
import SlidePanel from './SlidePanel'
import StatusBadge from './StatusBadge'
import SourceTag from './SourceTag'
import ActivityTimeline from './ActivityTimeline'
import { Lead, updateLead, deleteLead, convertLeadToClient, fetchCrmSettings, CrmSettings, PipelineStage } from '@/lib/crm-api'

interface LeadDetailProps {
  lead: Lead | null
  isOpen: boolean
  onClose: () => void
  onUpdate: () => void
  onConvert?: (lead: Lead) => void
}

// PHASE 2 (A3): Fallback status options if settings not loaded
const DEFAULT_STATUS_OPTIONS: PipelineStage[] = [
  { key: 'new', label: 'New Lead', color: '#fe5557' },
  { key: 'contacted', label: 'Contacted', color: '#8b5cf6' },
  { key: 'site_visit', label: 'Site Visit', color: '#6366f1' },
  { key: 'quoted', label: 'Quote Sent', color: '#f59e0b' },
  { key: 'negotiating', label: 'Negotiating', color: '#f97316' },
  { key: 'won', label: 'Won', color: '#10b981' },
  { key: 'lost', label: 'Lost', color: '#6b7280' },
]

// PHASE 2 (A3): Fallback source options if settings not loaded
const DEFAULT_SOURCE_OPTIONS = [
  'Phone Call',
  'Referral',
  'Walk-in',
  'Yard Sign',
  'Home Show / Expo',
  'Returning Client',
  'Nextdoor',
  'Social Media',
  'Other',
]

// PHASE 2 (A3): Fallback service type options if settings not loaded
const DEFAULT_SERVICE_OPTIONS = [
  'Kitchen Remodel',
  'Bathroom Remodel',
  'Home Addition',
  'Deck / Patio',
  'Full Renovation',
  'ADU / Guest House',
  'Roofing',
  'Flooring',
  'Exterior / Siding',
  'Garage',
  'Basement Finish',
  'Commercial',
  'Other',
]

const PRIORITY_OPTIONS = [
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
]

export default function LeadDetail({
  lead,
  isOpen,
  onClose,
  onUpdate,
  onConvert,
}: LeadDetailProps) {
  const [formData, setFormData] = useState<Partial<Lead>>({})
  const [saving, setSaving] = useState(false)
  const [converting, setConverting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // PHASE 2 (A3): Fetch CRM settings for status dropdown
  const [settings, setSettings] = useState<CrmSettings | null>(null)

  useEffect(() => {
    if (isOpen) {
      fetchCrmSettings()
        .then(setSettings)
        .catch(() => setSettings(null))
    }
  }, [isOpen])

  // Derive status options from settings with fallback
  const pipelineStages = settings?.pipelineStages?.length
    ? settings.pipelineStages
    : DEFAULT_STATUS_OPTIONS

  // PHASE 2 (A3): INV-017 - Include current lead status in options even if not in settings (legacy support)
  const statusOptions = (() => {
    const currentStatus = lead?.status
    const stageKeys = pipelineStages.map(s => s.key)
    // If lead has a status not in current settings, show it as an option (graceful degradation)
    if (currentStatus && !stageKeys.includes(currentStatus)) {
      return [
        ...pipelineStages,
        { key: currentStatus, label: `${currentStatus} (legacy)`, color: '#9ca3af' }
      ]
    }
    return pipelineStages
  })()

  // PHASE 2 (A3): Derive source options from settings with fallback + legacy support
  const sourceOptionsBase = settings?.leadSources?.length
    ? settings.leadSources
    : DEFAULT_SOURCE_OPTIONS

  const sourceOptions = (() => {
    const currentSource = lead?.source
    if (currentSource && !sourceOptionsBase.includes(currentSource)) {
      return [...sourceOptionsBase, `${currentSource} (legacy)`]
    }
    return sourceOptionsBase
  })()

  // PHASE 2 (A3): Derive service type options from settings with fallback + legacy support
  const serviceOptionsBase = settings?.serviceTypes?.length
    ? settings.serviceTypes
    : DEFAULT_SERVICE_OPTIONS

  const serviceOptions = (() => {
    const currentServiceType = lead?.serviceType
    if (currentServiceType && !serviceOptionsBase.includes(currentServiceType)) {
      return [...serviceOptionsBase, `${currentServiceType} (legacy)`]
    }
    return serviceOptionsBase
  })()

  useEffect(() => {
    if (lead) {
      setFormData({ ...lead })
      setError(null)
    }
  }, [lead])

  const handleSave = async () => {
    if (!lead?._id) return

    try {
      setSaving(true)
      setError(null)
      await updateLead({ ...formData, _id: lead._id } as Lead & { _id: string })
      onUpdate()
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save changes')
    } finally {
      setSaving(false)
    }
  }

  const handleConvert = async () => {
    if (!lead) return

    try {
      setConverting(true)
      setError(null)
      await convertLeadToClient(lead, { createDeal: true })
      onUpdate()
      onClose()
      if (onConvert) onConvert(lead)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to convert lead')
    } finally {
      setConverting(false)
    }
  }

  const handleDelete = async () => {
    if (!lead?._id) return

    try {
      setDeleting(true)
      setError(null)
      await deleteLead(lead._id)
      onUpdate()
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete lead')
    } finally {
      setDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  if (!lead) return null

  const isWon = lead.status === 'won'
  const isLost = lead.status === 'lost'
  const isConverted = !!lead.convertedToClient

  return (
    <SlidePanel
      isOpen={isOpen}
      onClose={onClose}
      title={lead.fullName}
      subtitle={lead.email || lead.phone}
      width="lg"
      footer={
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            {!isConverted && !isLost && (
              <button
                onClick={handleConvert}
                disabled={converting}
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors font-medium text-sm"
              >
                <UserPlus className="w-4 h-4" />
                {converting ? 'Converting...' : 'Convert to Client'}
              </button>
            )}
            <button
              onClick={() => setShowDeleteConfirm(true)}
              disabled={deleting}
              className="inline-flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#fe5557] text-white rounded-lg hover:bg-[#e54446] disabled:opacity-50 transition-colors font-medium text-sm"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      }
    >
      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl p-6 max-w-sm mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Lead?</h3>
            <p className="text-gray-600 text-sm mb-4">
              This will permanently delete this lead and all related activities. This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors text-sm"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Origin Banner */}
      <div
        className={`mb-6 p-3 rounded-lg ${
          lead.origin?.startsWith('auto')
            ? 'bg-[#fe5557]/10 border border-[#fe5557]/20'
            : 'bg-gray-100 border border-gray-200'
        }`}
      >
        <div className="flex items-center justify-between">
          <SourceTag origin={lead.origin} source={lead.source} />
          <span className="text-xs text-gray-500">
            {new Date(lead.receivedAt).toLocaleString()}
          </span>
        </div>
      </div>

      {/* Status and Priority */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
            Status
          </label>
          <select
            value={formData.status || 'new'}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#fe5557] focus:border-transparent"
          >
            {statusOptions.map((opt) => (
              <option key={opt.key} value={opt.key}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
            Priority
          </label>
          <select
            value={formData.priority || 'medium'}
            onChange={(e) => setFormData({ ...formData, priority: e.target.value as Lead['priority'] })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#fe5557] focus:border-transparent"
          >
            {PRIORITY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Contact Info */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <User className="w-4 h-4 text-gray-400" />
          Contact Information
        </h3>
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Full Name</label>
            <input
              type="text"
              value={formData.fullName || ''}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#fe5557] focus:border-transparent"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#fe5557] focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Phone</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="tel"
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#fe5557] focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lead Details */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-gray-400" />
          Lead Details
        </h3>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Source</label>
              <select
                value={formData.source || ''}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#fe5557] focus:border-transparent"
              >
                <option value="">Select source...</option>
                {sourceOptions.map((opt) => {
                  const isLegacy = opt.endsWith(' (legacy)')
                  const value = isLegacy ? opt.replace(' (legacy)', '') : opt
                  return (
                    <option key={opt} value={value}>
                      {opt}
                    </option>
                  )
                })}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Service Type</label>
              <select
                value={formData.serviceType || ''}
                onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#fe5557] focus:border-transparent"
              >
                <option value="">Select type...</option>
                {serviceOptions.map((opt) => {
                  const isLegacy = opt.endsWith(' (legacy)')
                  const value = isLegacy ? opt.replace(' (legacy)', '') : opt
                  return (
                    <option key={opt} value={value}>
                      {opt}
                    </option>
                  )
                })}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Estimated Value</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="number"
                  value={formData.estimatedValue || ''}
                  onChange={(e) => setFormData({ ...formData, estimatedValue: e.target.value ? Number(e.target.value) : undefined })}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#fe5557] focus:border-transparent"
                  placeholder="0"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Referred By</label>
              <input
                type="text"
                value={formData.referredBy || ''}
                onChange={(e) => setFormData({ ...formData, referredBy: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#fe5557] focus:border-transparent"
                placeholder="Name of referrer"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Original Message */}
      {lead.originalMessage && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-gray-400" />
            Original Message
          </h3>
          <div className="p-4 bg-gray-50 rounded-lg border-l-4 border-[#fe5557] text-sm text-gray-700 whitespace-pre-wrap">
            {lead.originalMessage}
          </div>
        </div>
      )}

      {/* Description */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <FileText className="w-4 h-4 text-gray-400" />
          Description
        </h3>
        <textarea
          value={formData.description || ''}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#fe5557] focus:border-transparent resize-none"
          placeholder="Project description or requirements..."
        />
      </div>

      {/* Internal Notes */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Internal Notes</h3>
        <textarea
          value={formData.internalNotes || ''}
          onChange={(e) => setFormData({ ...formData, internalNotes: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#fe5557] focus:border-transparent resize-none"
          placeholder="Private notes (not visible to client)..."
        />
      </div>

      {/* Activity Timeline */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Activity</h3>
        <ActivityTimeline leadId={lead._id} limit={5} compact />
      </div>
    </SlidePanel>
  )
}
