'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import {
  Plus,
  Pencil,
  Trash2,
  X,
  ArrowLeft,
  Loader2,
  RefreshCw,
  Wrench,
  Clock,
  DollarSign,
  Check,
  AlertCircle,
  GripVertical,
} from 'lucide-react'
import { adminFetch, adminPost, adminPut, adminDelete } from '@/lib/admin-api'
import ImageUpload from './ImageUpload'

// Types
interface ServiceHighlight {
  title: string
  description: string
}

interface Service {
  _id: string
  _createdAt: string
  name: string
  slug: { current: string }
  tagline: string
  description: string
  highlights?: ServiceHighlight[]
  priceRange?: string
  typicalDuration?: string
  imageUrl?: string
  galleryImages?: Array<{ url: string; alt?: string }>
  order: number
  isActive: boolean
}

interface FormData {
  _id?: string
  name: string
  slug: string
  tagline: string
  description: string
  highlights: ServiceHighlight[]
  priceRange: string
  typicalDuration: string
  image: string
  imageUrl: string
  gallery: Array<{ assetId: string; url: string; alt: string }>
  order: number
  isActive: boolean
}

const initialFormData: FormData = {
  name: '',
  slug: '',
  tagline: '',
  description: '',
  highlights: [],
  priceRange: '',
  typicalDuration: '',
  image: '',
  imageUrl: '',
  gallery: [],
  order: 10,
  isActive: true,
}

type StatusFilter = 'all' | 'active' | 'hidden'

// Helper to generate slug
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

// Active badge component
function ActiveBadge({ isActive }: { isActive: boolean }) {
  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
      isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
    }`}>
      {isActive ? 'Active' : 'Hidden'}
    </span>
  )
}

// Skeleton card for loading state
function ServiceCardSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden animate-pulse">
      <div className="aspect-video bg-gray-200" />
      <div className="p-4">
        <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
        <div className="h-4 bg-gray-200 rounded w-full mb-3" />
        <div className="flex gap-2">
          <div className="h-6 bg-gray-200 rounded-full w-16" />
          <div className="h-6 bg-gray-200 rounded-full w-20" />
        </div>
      </div>
    </div>
  )
}

// Delete confirmation dialog
function DeleteDialog({
  serviceName,
  onConfirm,
  onCancel,
  isDeleting,
}: {
  serviceName: string
  onConfirm: () => void
  onCancel: () => void
  isDeleting: boolean
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Service?</h3>
        <p className="text-gray-600 mb-6">
          This will permanently remove <span className="font-medium">{serviceName}</span> and all related data. This cannot be undone.
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
          >
            {isDeleting && <Loader2 className="h-4 w-4 animate-spin" />}
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

// Toast notification
function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div className={`fixed bottom-20 lg:bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg ${
      type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
    }`}>
      {type === 'success' ? <Check className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
      <span className="font-medium">{message}</span>
      <button onClick={onClose} className="ml-2 hover:opacity-80">
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

// Toggle switch component
function ToggleSwitch({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
}) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <div className="relative">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only"
        />
        <div className={`w-11 h-6 rounded-full transition-colors ${
          checked ? 'bg-amber-500' : 'bg-gray-300'
        }`}>
          <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`} />
        </div>
      </div>
      <span className="text-sm font-medium text-gray-700">{label}</span>
    </label>
  )
}

export default function ServicesTab() {
  // State
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<StatusFilter>('all')
  const [view, setView] = useState<'list' | 'form'>('list')
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [isSaving, setIsSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Service | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false)

  // Fetch data
  const fetchServices = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await adminFetch<Service[]>('services')
      setServices(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load services')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchServices()
  }, [fetchServices])

  // Filter services
  const filteredServices = services
    .filter(s => {
      if (filter === 'active') return s.isActive
      if (filter === 'hidden') return !s.isActive
      return true
    })
    .sort((a, b) => a.order - b.order)

  // Form handlers
  const openAddForm = () => {
    setFormData(initialFormData)
    setFormErrors({})
    setSlugManuallyEdited(false)
    setEditingService(null)
    setView('form')
  }

  const openEditForm = (service: Service) => {
    setFormData({
      _id: service._id,
      name: service.name,
      slug: service.slug?.current || '',
      tagline: service.tagline,
      description: service.description,
      highlights: service.highlights || [],
      priceRange: service.priceRange || '',
      typicalDuration: service.typicalDuration || '',
      image: '',
      imageUrl: service.imageUrl || '',
      gallery: service.galleryImages?.map(img => ({
        assetId: '',
        url: img.url,
        alt: img.alt || '',
      })) || [],
      order: service.order ?? 10,
      isActive: service.isActive ?? true,
    })
    setFormErrors({})
    setSlugManuallyEdited(true)
    setEditingService(service)
    setView('form')
  }

  const closeForm = () => {
    setView('list')
    setEditingService(null)
  }

  const updateFormField = (field: keyof FormData, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (formErrors[field]) {
      setFormErrors(prev => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }

  const handleNameChange = (value: string) => {
    updateFormField('name', value)
    if (!slugManuallyEdited) {
      updateFormField('slug', generateSlug(value))
    }
  }

  const handleSlugChange = (value: string) => {
    setSlugManuallyEdited(true)
    updateFormField('slug', generateSlug(value))
  }

  // Highlights handling
  const addHighlight = () => {
    updateFormField('highlights', [...formData.highlights, { title: '', description: '' }])
  }

  const updateHighlight = (index: number, field: 'title' | 'description', value: string) => {
    const newHighlights = [...formData.highlights]
    newHighlights[index] = { ...newHighlights[index], [field]: value }
    updateFormField('highlights', newHighlights)
  }

  const removeHighlight = (index: number) => {
    updateFormField('highlights', formData.highlights.filter((_, i) => i !== index))
  }

  // Gallery handling
  const addGalleryImage = (assetId: string, url: string) => {
    updateFormField('gallery', [...formData.gallery, { assetId, url, alt: '' }])
  }

  const updateGalleryImage = (index: number, field: 'alt', value: string) => {
    const newGallery = [...formData.gallery]
    newGallery[index] = { ...newGallery[index], [field]: value }
    updateFormField('gallery', newGallery)
  }

  const removeGalleryImage = (index: number) => {
    updateFormField('gallery', formData.gallery.filter((_, i) => i !== index))
  }

  // Validation
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}

    if (!formData.name.trim()) errors.name = 'Service name is required'
    if (!formData.slug.trim()) errors.slug = 'Slug is required'
    if (!formData.tagline.trim()) errors.tagline = 'Tagline is required'
    if (!formData.description.trim()) errors.description = 'Description is required'
    if (!formData.image && !formData.imageUrl) errors.image = 'Main image is required'

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Save service
  const handleSave = async () => {
    if (!validateForm()) return

    setIsSaving(true)
    try {
      // Build payload WITHOUT image fields - only add them if new uploads occurred
      const payload: Record<string, unknown> = {
        _id: formData._id,
        name: formData.name,
        slug: formData.slug,
        tagline: formData.tagline,
        description: formData.description,
        highlights: formData.highlights.filter(h => h.title.trim() && h.description.trim()),
        priceRange: formData.priceRange,
        typicalDuration: formData.typicalDuration,
        order: formData.order,
        isActive: formData.isActive,
      }

      // CRITICAL: Only include image fields if NEW uploads occurred
      // Empty string means no new upload - don't send field at all to preserve existing
      if (formData.image) {
        payload.image = formData.image
      }
      // Only include gallery items that have new asset IDs
      const newGalleryAssets = formData.gallery.map(g => g.assetId).filter(Boolean)
      if (newGalleryAssets.length > 0) {
        payload.gallery = newGalleryAssets
      }

      if (formData._id) {
        await adminPut('services', payload)
        setToast({ message: 'Service updated successfully', type: 'success' })
      } else {
        await adminPost('services', payload)
        setToast({ message: 'Service created successfully', type: 'success' })
      }

      await fetchServices()
      closeForm()
    } catch (e) {
      setToast({ message: e instanceof Error ? e.message : 'Failed to save service', type: 'error' })
    } finally {
      setIsSaving(false)
    }
  }

  // Delete service
  const handleDelete = async () => {
    if (!deleteTarget) return

    setIsDeleting(true)
    try {
      await adminDelete('services', deleteTarget._id)
      setToast({ message: 'Service deleted', type: 'success' })
      setServices(prev => prev.filter(s => s._id !== deleteTarget._id))
      setDeleteTarget(null)
    } catch (e) {
      setToast({ message: e instanceof Error ? e.message : 'Failed to delete', type: 'error' })
    } finally {
      setIsDeleting(false)
    }
  }

  // Render list view
  if (view === 'list') {
    return (
      <div>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={openAddForm}
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors font-medium"
            >
              <Plus className="h-4 w-4" />
              Add New Service
            </button>
            <span className="text-sm text-gray-500">
              {filteredServices.length} {filteredServices.length === 1 ? 'Service' : 'Services'}
            </span>
          </div>

          {/* Filter */}
          <div className="flex items-center gap-2">
            {(['all', 'active', 'hidden'] as const).map(status => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  filter === status
                    ? 'bg-amber-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => <ServiceCardSkeleton key={i} />)}
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <div className="bg-white rounded-xl p-8 shadow-sm text-center">
            <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <p className="text-gray-900 font-medium mb-2">Failed to load services</p>
            <p className="text-gray-500 text-sm mb-4">{error}</p>
            <button
              onClick={fetchServices}
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Retry
            </button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && filteredServices.length === 0 && (
          <div className="bg-white rounded-xl p-12 shadow-sm text-center">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Wrench className="h-8 w-8 text-amber-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {filter === 'all' ? 'No services yet' : `No ${filter} services`}
            </h3>
            <p className="text-gray-500 mb-6">
              {filter === 'all' ? 'Tell clients what you do best!' : 'Try a different filter'}
            </p>
            {filter === 'all' && (
              <button
                onClick={openAddForm}
                className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors font-medium"
              >
                <Plus className="h-5 w-5" />
                Add Your First Service
              </button>
            )}
          </div>
        )}

        {/* Services grid */}
        {!loading && !error && filteredServices.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredServices.map(service => (
              <div key={service._id} className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                {/* Image */}
                <div className="relative aspect-video bg-gray-100">
                  {service.imageUrl ? (
                    <Image
                      src={service.imageUrl}
                      alt={service.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Wrench className="h-12 w-12 text-gray-300" />
                    </div>
                  )}
                  {/* Order badge */}
                  <div className="absolute top-2 right-2 px-2 py-1 bg-black/50 text-white text-xs rounded">
                    #{service.order}
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">{service.name}</h3>
                  <p className="text-sm text-gray-500 mb-3 line-clamp-2">{service.tagline}</p>

                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <ActiveBadge isActive={service.isActive} />
                    {service.priceRange && (
                      <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                        <DollarSign className="h-3 w-3" />
                        {service.priceRange}
                      </span>
                    )}
                    {service.typicalDuration && (
                      <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="h-3 w-3" />
                        {service.typicalDuration}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditForm(service)}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                    >
                      <Pencil className="h-4 w-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => setDeleteTarget(service)}
                      className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Delete dialog */}
        {deleteTarget && (
          <DeleteDialog
            serviceName={deleteTarget.name}
            onConfirm={handleDelete}
            onCancel={() => setDeleteTarget(null)}
            isDeleting={isDeleting}
          />
        )}

        {/* Toast */}
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </div>
    )
  }

  // Render form view
  return (
    <div className="fixed inset-0 z-30 lg:relative lg:inset-auto">
      <div className="h-full bg-white lg:bg-transparent overflow-y-auto">
        {/* Form header */}
        <div className="sticky top-0 z-10 bg-white border-b px-4 py-3 flex items-center gap-4">
          <button
            onClick={closeForm}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h2 className="text-lg font-semibold text-gray-900">
            {editingService ? 'Edit Service' : 'Add New Service'}
          </h2>
        </div>

        {/* Form content */}
        <div className="p-4 lg:p-0 lg:py-4 pb-32 lg:pb-4 max-w-3xl mx-auto">
          {/* Section 1: Basic Info */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Info</h3>

            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Service Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g., Kitchen Remodeling"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 ${
                    formErrors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {formErrors.name && <p className="text-red-500 text-sm mt-1">{formErrors.name}</p>}
              </div>

              {/* Slug */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL Slug <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center">
                  <span className="px-3 py-2 bg-gray-100 border border-r-0 border-gray-300 rounded-l-lg text-gray-500 text-sm">
                    /services/
                  </span>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => handleSlugChange(e.target.value)}
                    className={`flex-1 px-4 py-2 border rounded-r-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 ${
                      formErrors.slug ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                </div>
                {formErrors.slug && <p className="text-red-500 text-sm mt-1">{formErrors.slug}</p>}
              </div>

              {/* Tagline */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tagline <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.tagline}
                  onChange={(e) => updateFormField('tagline', e.target.value)}
                  placeholder="e.g., Transform your kitchen into a masterpiece"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 ${
                    formErrors.tagline ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {formErrors.tagline && <p className="text-red-500 text-sm mt-1">{formErrors.tagline}</p>}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => updateFormField('description', e.target.value)}
                  rows={8}
                  placeholder="Describe your service in detail..."
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 ${
                    formErrors.description ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {formErrors.description && <p className="text-red-500 text-sm mt-1">{formErrors.description}</p>}
              </div>
            </div>
          </div>

          {/* Section 2: Details */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Details</h3>

            <div className="space-y-4">
              {/* Highlights */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Service Highlights
                </label>
                <div className="space-y-3">
                  {formData.highlights.map((highlight, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-center w-6 h-6 bg-amber-100 text-amber-600 rounded-full text-sm font-medium flex-shrink-0 mt-2">
                        {index + 1}
                      </div>
                      <div className="flex-1 space-y-2">
                        <input
                          type="text"
                          value={highlight.title}
                          onChange={(e) => updateHighlight(index, 'title', e.target.value)}
                          placeholder="Highlight title"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm"
                        />
                        <input
                          type="text"
                          value={highlight.description}
                          onChange={(e) => updateHighlight(index, 'description', e.target.value)}
                          placeholder="Brief description"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeHighlight(index)}
                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={addHighlight}
                  className="mt-3 inline-flex items-center gap-2 px-4 py-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors text-sm font-medium"
                >
                  <Plus className="h-4 w-4" />
                  Add Highlight
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Price Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Typical Price Range</label>
                  <input
                    type="text"
                    value={formData.priceRange}
                    onChange={(e) => updateFormField('priceRange', e.target.value)}
                    placeholder="e.g., $15,000 - $50,000"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>

                {/* Duration */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Typical Duration</label>
                  <input
                    type="text"
                    value={formData.typicalDuration}
                    onChange={(e) => updateFormField('typicalDuration', e.target.value)}
                    placeholder="e.g., 2-4 weeks"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Media */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Media</h3>

            <div className="space-y-6">
              {/* Main Image */}
              <div>
                <ImageUpload
                  label="Main Image"
                  required
                  value={formData.imageUrl || null}
                  onUpload={(assetId, url) => {
                    updateFormField('image', assetId)
                    updateFormField('imageUrl', url)
                  }}
                  onRemove={() => {
                    updateFormField('image', '')
                    updateFormField('imageUrl', '')
                  }}
                />
                {formErrors.image && <p className="text-red-500 text-sm mt-1">{formErrors.image}</p>}
              </div>

              {/* Gallery */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Gallery Images</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
                  {formData.gallery.map((img, index) => (
                    <div key={index} className="relative">
                      <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                        <Image
                          src={img.url}
                          alt={img.alt || ''}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeGalleryImage(index)}
                        className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                      <input
                        type="text"
                        value={img.alt}
                        onChange={(e) => updateGalleryImage(index, 'alt', e.target.value)}
                        placeholder="Alt text"
                        className="mt-2 w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                  ))}

                  {/* Add photo button */}
                  <ImageUpload
                    label=""
                    value={null}
                    onUpload={addGalleryImage}
                    onRemove={() => {}}
                    className="aspect-square"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Settings */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Settings</h3>

            <div className="space-y-4">
              {/* Display Order */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Display Order</label>
                <input
                  type="number"
                  value={formData.order}
                  onChange={(e) => updateFormField('order', parseInt(e.target.value) || 10)}
                  min={1}
                  className="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
                <p className="text-sm text-gray-500 mt-1">Lower numbers appear first</p>
              </div>

              {/* Show on Website */}
              <div>
                <ToggleSwitch
                  checked={formData.isActive}
                  onChange={(checked) => updateFormField('isActive', checked)}
                  label="Show on Website"
                />
                <p className="text-sm text-gray-500 mt-1 ml-14">
                  {formData.isActive ? 'This service is visible to visitors' : 'This service is hidden from visitors'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Sticky footer */}
        <div className="fixed bottom-0 left-0 right-0 lg:relative bg-white border-t p-4 flex items-center justify-end gap-3">
          <button
            onClick={closeForm}
            disabled={isSaving}
            className="px-6 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors font-medium flex items-center gap-2"
          >
            {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
            {isSaving ? 'Saving...' : 'Save Service'}
          </button>
        </div>
      </div>

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
