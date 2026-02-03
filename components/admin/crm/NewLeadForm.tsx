'use client'

import { useState, useEffect } from 'react'
import {
  Phone,
  Mail,
  DollarSign,
  User,
  FileText,
  X,
} from 'lucide-react'
import SlidePanel from './SlidePanel'
import { createLead, Lead, fetchCrmSettings, CrmSettings } from '@/lib/crm-api'

interface NewLeadFormProps {
  isOpen: boolean
  onClose: () => void
  onCreated: () => void
}

// PHASE 2 (A3): Fallback options if settings not loaded
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

const initialFormData = {
  fullName: '',
  email: '',
  phone: '',
  source: '',
  serviceType: '',
  estimatedValue: '',
  priority: 'medium' as const,
  referredBy: '',
  description: '',
  internalNotes: '',
}

export default function NewLeadForm({
  isOpen,
  onClose,
  onCreated,
}: NewLeadFormProps) {
  const [formData, setFormData] = useState(initialFormData)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  // PHASE 2 (A3): Fetch CRM settings for dropdown options
  const [settings, setSettings] = useState<CrmSettings | null>(null)

  useEffect(() => {
    if (isOpen) {
      fetchCrmSettings()
        .then(setSettings)
        .catch(() => setSettings(null))
    }
  }, [isOpen])

  // Derive options from settings with fallback
  const sourceOptions = settings?.leadSources?.length
    ? settings.leadSources
    : DEFAULT_SOURCE_OPTIONS

  const serviceOptions = settings?.serviceTypes?.length
    ? settings.serviceTypes
    : DEFAULT_SERVICE_OPTIONS

  const resetForm = () => {
    setFormData(initialFormData)
    setError(null)
    setValidationErrors({})
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const validate = () => {
    const errors: Record<string, string> = {}

    if (!formData.fullName.trim()) {
      errors.fullName = 'Name is required'
    }

    if (!formData.phone.trim()) {
      errors.phone = 'Phone number is required'
    }

    if (!formData.source) {
      errors.source = 'Please select a source'
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) return

    try {
      setSaving(true)
      setError(null)

      await createLead({
        fullName: formData.fullName,
        email: formData.email || undefined,
        phone: formData.phone,
        origin: 'manual',
        source: formData.source,
        serviceType: formData.serviceType || undefined,
        estimatedValue: formData.estimatedValue ? Number(formData.estimatedValue) : undefined,
        priority: formData.priority,
        status: 'new',
        referredBy: formData.referredBy || undefined,
        description: formData.description || undefined,
        internalNotes: formData.internalNotes || undefined,
      })

      onCreated()
      handleClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create lead')
    } finally {
      setSaving(false)
    }
  }

  return (
    <SlidePanel
      isOpen={isOpen}
      onClose={handleClose}
      title="New Lead"
      subtitle="Manually add a new lead"
      width="md"
      footer={
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-4 py-2 bg-[#fe5557] text-white rounded-lg hover:bg-[#e54446] disabled:opacity-50 transition-colors font-medium text-sm"
          >
            {saving ? 'Creating...' : 'Create Lead'}
          </button>
        </div>
      }
    >
      {/* Info Banner */}
      <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-sm">
        <strong>Note:</strong> Leads from website contact forms are created automatically. Use this form for leads received via phone, referral, or walk-in.
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Contact Info */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <User className="w-4 h-4 text-gray-400" />
            Contact Information
          </h3>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#fe5557] focus:border-transparent ${
                  validationErrors.fullName ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="John Smith"
              />
              {validationErrors.fullName && (
                <p className="text-red-500 text-xs mt-1">{validationErrors.fullName}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Phone <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className={`w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#fe5557] focus:border-transparent ${
                      validationErrors.phone ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="(555) 123-4567"
                  />
                </div>
                {validationErrors.phone && (
                  <p className="text-red-500 text-xs mt-1">{validationErrors.phone}</p>
                )}
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#fe5557] focus:border-transparent"
                    placeholder="john@example.com"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Lead Details */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4 text-gray-400" />
            Lead Details
          </h3>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Source <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.source}
                  onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#fe5557] focus:border-transparent ${
                    validationErrors.source ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select source...</option>
                  {sourceOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
                {validationErrors.source && (
                  <p className="text-red-500 text-xs mt-1">{validationErrors.source}</p>
                )}
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as typeof formData.priority })}
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
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Service Type</label>
                <select
                  value={formData.serviceType}
                  onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#fe5557] focus:border-transparent"
                >
                  <option value="">Select type...</option>
                  {serviceOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Estimated Value</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="number"
                    value={formData.estimatedValue}
                    onChange={(e) => setFormData({ ...formData, estimatedValue: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#fe5557] focus:border-transparent"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Referred By</label>
              <input
                type="text"
                value={formData.referredBy}
                onChange={(e) => setFormData({ ...formData, referredBy: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#fe5557] focus:border-transparent"
                placeholder="Name of person or business"
              />
            </div>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs text-gray-500 mb-1">Description / Notes</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#fe5557] focus:border-transparent resize-none"
            placeholder="Project details, requirements, timeline..."
          />
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1">Internal Notes</label>
          <textarea
            value={formData.internalNotes}
            onChange={(e) => setFormData({ ...formData, internalNotes: e.target.value })}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#fe5557] focus:border-transparent resize-none"
            placeholder="Private notes..."
          />
        </div>
      </form>
    </SlidePanel>
  )
}
