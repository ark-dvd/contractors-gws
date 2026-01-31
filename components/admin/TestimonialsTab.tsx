'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Loader2,
  AlertCircle,
  Star,
  Quote,
  MapPin,
  Calendar,
  CheckCircle,
  ArrowLeft,
  User,
  Eye,
  EyeOff,
} from 'lucide-react'
import { adminFetch, adminPost, adminPut, adminDelete } from '@/lib/admin-api'
import ImageUpload from './ImageUpload'

// Types
interface Testimonial {
  _id: string
  clientName: string
  clientLocation?: string
  quote: string
  rating: number
  projectType?: string
  relatedProject?: { _id: string; title: string }
  date?: string
  clientPhoto?: string
  featuredOnHomepage: boolean
  showOnWebsite: boolean
  displayOrder?: number
}

interface Project {
  _id: string
  title: string
}

type FilterType = 'all' | 'featured' | 'active' | 'hidden'

// Toggle Switch component (reused pattern)
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
        <div
          className={`w-11 h-6 rounded-full transition-colors ${
            checked ? 'bg-amber-500' : 'bg-gray-300'
          }`}
        >
          <div
            className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
              checked ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </div>
      </div>
      <span className="text-sm font-medium text-gray-700">{label}</span>
    </label>
  )
}

// Interactive Star Rating component
function StarRating({
  value,
  onChange,
  readonly = false,
  size = 'md',
}: {
  value: number
  onChange?: (rating: number) => void
  readonly?: boolean
  size?: 'sm' | 'md' | 'lg'
}) {
  const [hoverValue, setHoverValue] = useState(0)

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  }

  const containerClasses = {
    sm: 'gap-0.5',
    md: 'gap-1',
    lg: 'gap-1.5',
  }

  // Touch-friendly target size (44px minimum)
  const touchTargetClasses = {
    sm: 'p-1',
    md: 'p-2',
    lg: 'p-2',
  }

  const displayValue = hoverValue || value

  return (
    <div className={`flex items-center ${containerClasses[size]}`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          onMouseEnter={() => !readonly && setHoverValue(star)}
          onMouseLeave={() => !readonly && setHoverValue(0)}
          className={`${touchTargetClasses[size]} ${
            readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'
          } transition-transform touch-manipulation`}
          aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
        >
          <Star
            className={`${sizeClasses[size]} transition-colors ${
              star <= displayValue
                ? 'fill-amber-400 text-amber-400'
                : 'fill-none text-gray-300'
            }`}
          />
        </button>
      ))}
      {!readonly && (
        <span className="ml-2 text-sm text-gray-600">{value} / 5</span>
      )}
    </div>
  )
}

// Initials Avatar component
function InitialsAvatar({ name, className = '' }: { name: string; className?: string }) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div
      className={`flex items-center justify-center bg-gradient-to-br from-amber-400 to-amber-600 text-white font-semibold ${className}`}
    >
      {initials}
    </div>
  )
}

// Delete Confirmation Dialog
function DeleteDialog({
  isOpen,
  onClose,
  onConfirm,
  clientName,
  isDeleting,
}: {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  clientName: string
  isDeleting: boolean
}) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl p-6 max-w-md w-full shadow-xl">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Delete Testimonial?
        </h3>
        <p className="text-gray-600 mb-6">
          Are you sure you want to delete the testimonial from{' '}
          <span className="font-medium">{clientName}</span>? This action cannot be
          undone.
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                Delete
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// Toast notification
function Toast({
  message,
  type,
  onClose,
}: {
  message: string
  type: 'success' | 'error'
  onClose: () => void
}) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div
      className={`fixed bottom-20 lg:bottom-6 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg ${
        type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
      }`}
    >
      {type === 'success' ? (
        <CheckCircle className="h-5 w-5" />
      ) : (
        <AlertCircle className="h-5 w-5" />
      )}
      <span className="font-medium">{message}</span>
      <button onClick={onClose} className="ml-2 hover:opacity-80">
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

// Loading skeleton
function TestimonialSkeleton() {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm animate-pulse">
      <div className="flex gap-4">
        <div className="h-14 w-14 bg-gray-200 rounded-full flex-shrink-0" />
        <div className="flex-1">
          <div className="h-5 w-32 bg-gray-200 rounded mb-2" />
          <div className="h-4 w-24 bg-gray-200 rounded mb-3" />
          <div className="flex gap-1 mb-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-4 w-4 bg-gray-200 rounded" />
            ))}
          </div>
          <div className="h-4 w-full bg-gray-200 rounded mb-2" />
          <div className="h-4 w-3/4 bg-gray-200 rounded" />
        </div>
      </div>
    </div>
  )
}

export default function TestimonialsTab() {
  // State
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<FilterType>('all')

  // Form state
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState({
    clientName: '',
    clientLocation: '',
    quote: '',
    rating: 5,
    projectType: '',
    relatedProjectId: '',
    date: new Date().toISOString().split('T')[0],
    clientPhoto: '',
    featuredOnHomepage: false,
    showOnWebsite: true,
    displayOrder: 0,
  })

  // Delete state
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Toast state
  const [toast, setToast] = useState<{
    message: string
    type: 'success' | 'error'
  } | null>(null)

  // Fetch testimonials and projects
  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [testimonialsData, projectsData] = await Promise.all([
        adminFetch<Testimonial[]>('testimonials'),
        adminFetch<Project[]>('projects'),
      ])
      setTestimonials(testimonialsData)
      setProjects(projectsData)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load data')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Filter testimonials
  const filteredTestimonials = testimonials.filter((t) => {
    switch (filter) {
      case 'featured':
        return t.featuredOnHomepage
      case 'active':
        return t.showOnWebsite
      case 'hidden':
        return !t.showOnWebsite
      default:
        return true
    }
  })

  // Reset form
  const resetForm = () => {
    setFormData({
      clientName: '',
      clientLocation: '',
      quote: '',
      rating: 5,
      projectType: '',
      relatedProjectId: '',
      date: new Date().toISOString().split('T')[0],
      clientPhoto: '',
      featuredOnHomepage: false,
      showOnWebsite: true,
      displayOrder: 0,
    })
    setEditingId(null)
  }

  // Open form for new testimonial
  const handleAddNew = () => {
    resetForm()
    setIsFormOpen(true)
  }

  // Open form for editing
  const handleEdit = (testimonial: Testimonial) => {
    setFormData({
      clientName: testimonial.clientName,
      clientLocation: testimonial.clientLocation || '',
      quote: testimonial.quote,
      rating: testimonial.rating,
      projectType: testimonial.projectType || '',
      relatedProjectId: testimonial.relatedProject?._id || '',
      date: testimonial.date
        ? new Date(testimonial.date).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
      clientPhoto: testimonial.clientPhoto || '',
      featuredOnHomepage: testimonial.featuredOnHomepage,
      showOnWebsite: testimonial.showOnWebsite,
      displayOrder: testimonial.displayOrder || 0,
    })
    setEditingId(testimonial._id)
    setIsFormOpen(true)
  }

  // Close form
  const handleCloseForm = () => {
    setIsFormOpen(false)
    resetForm()
  }

  // Save testimonial
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      const payload = {
        clientName: formData.clientName,
        clientLocation: formData.clientLocation || undefined,
        quote: formData.quote,
        rating: formData.rating,
        projectType: formData.projectType || undefined,
        relatedProjectId: formData.relatedProjectId || undefined,
        date: formData.date,
        clientPhoto: formData.clientPhoto || undefined,
        featuredOnHomepage: formData.featuredOnHomepage,
        showOnWebsite: formData.showOnWebsite,
        displayOrder: formData.displayOrder,
      }

      if (editingId) {
        await adminPut('testimonials', { id: editingId, ...payload })
        setToast({ message: 'Testimonial updated successfully', type: 'success' })
      } else {
        await adminPost('testimonials', payload)
        setToast({ message: 'Testimonial created successfully', type: 'success' })
      }

      handleCloseForm()
      fetchData()
    } catch (e) {
      setToast({
        message: e instanceof Error ? e.message : 'Failed to save testimonial',
        type: 'error',
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Delete testimonial
  const handleDelete = async () => {
    if (!deleteId) return
    setIsDeleting(true)

    try {
      await adminDelete('testimonials', deleteId)
      setToast({ message: 'Testimonial deleted successfully', type: 'success' })
      setDeleteId(null)
      fetchData()
    } catch (e) {
      setToast({
        message: e instanceof Error ? e.message : 'Failed to delete testimonial',
        type: 'error',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return ''
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  // Truncate text
  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text
    return text.slice(0, maxLength).trim() + '...'
  }

  // Filter counts
  const counts = {
    all: testimonials.length,
    featured: testimonials.filter((t) => t.featuredOnHomepage).length,
    active: testimonials.filter((t) => t.showOnWebsite).length,
    hidden: testimonials.filter((t) => !t.showOnWebsite).length,
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-10 w-48 bg-gray-200 rounded-lg animate-pulse" />
          <div className="h-10 w-36 bg-gray-200 rounded-lg animate-pulse" />
        </div>
        {[1, 2, 3].map((i) => (
          <TestimonialSkeleton key={i} />
        ))}
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-red-900 mb-2">
          Failed to Load Testimonials
        </h3>
        <p className="text-red-700 mb-4">{error}</p>
        <button
          onClick={fetchData}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    )
  }

  // Form view
  if (isFormOpen) {
    return (
      <div className="bg-white rounded-xl shadow-sm">
        {/* Form Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <button
              onClick={handleCloseForm}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <h2 className="text-xl font-semibold text-gray-900">
              {editingId ? 'Edit Testimonial' : 'Add New Testimonial'}
            </h2>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-6">
          {/* Client Info Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Client Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.clientName}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, clientName: e.target.value }))
                }
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                placeholder="John Smith"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Client Location
              </label>
              <input
                type="text"
                value={formData.clientLocation}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    clientLocation: e.target.value,
                  }))
                }
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                placeholder="e.g., Austin, TX"
              />
            </div>
          </div>

          {/* Quote */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Testimonial Quote <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.quote}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, quote: e.target.value }))
              }
              required
              rows={5}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all resize-none"
              placeholder="What did the client say about your work?"
            />
          </div>

          {/* Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rating
            </label>
            <StarRating
              value={formData.rating}
              onChange={(rating) =>
                setFormData((prev) => ({ ...prev, rating }))
              }
              size="lg"
            />
          </div>

          {/* Project Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Type
              </label>
              <input
                type="text"
                value={formData.projectType}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, projectType: e.target.value }))
                }
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                placeholder="e.g., Kitchen Remodel"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Related Project
              </label>
              <select
                value={formData.relatedProjectId}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    relatedProjectId: e.target.value,
                  }))
                }
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all bg-white"
              >
                <option value="">None (optional)</option>
                {projects.map((project) => (
                  <option key={project._id} value={project._id}>
                    {project.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date */}
          <div className="max-w-xs">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, date: e.target.value }))
              }
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
            />
          </div>

          {/* Client Photo */}
          <ImageUpload
            value={formData.clientPhoto}
            onUpload={(assetId, url) =>
              setFormData((prev) => ({ ...prev, clientPhoto: url }))
            }
            onRemove={() =>
              setFormData((prev) => ({ ...prev, clientPhoto: '' }))
            }
            label="Client Photo"
            className="max-w-md"
          />

          {/* Settings Row */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-4">Settings</h3>
            <div className="flex flex-wrap gap-6">
              <ToggleSwitch
                checked={formData.featuredOnHomepage}
                onChange={(checked) =>
                  setFormData((prev) => ({ ...prev, featuredOnHomepage: checked }))
                }
                label="Featured on Homepage"
              />
              <ToggleSwitch
                checked={formData.showOnWebsite}
                onChange={(checked) =>
                  setFormData((prev) => ({ ...prev, showOnWebsite: checked }))
                }
                label="Show on Website"
              />
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-gray-700">
                  Display Order
                </label>
                <input
                  type="number"
                  value={formData.displayOrder}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      displayOrder: parseInt(e.target.value) || 0,
                    }))
                  }
                  min={0}
                  className="w-20 px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all text-center"
                />
              </div>
            </div>
          </div>

          {/* Form Footer */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 sm:flex-none px-6 py-2.5 bg-amber-500 text-white font-medium rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Testimonial'
              )}
            </button>
            <button
              type="button"
              onClick={handleCloseForm}
              disabled={isSaving}
              className="px-6 py-2.5 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    )
  }

  // Empty state
  if (testimonials.length === 0) {
    return (
      <div className="bg-white rounded-xl p-12 shadow-sm text-center">
        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Quote className="h-8 w-8 text-amber-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          No testimonials yet
        </h3>
        <p className="text-gray-500 mb-6 max-w-md mx-auto">
          Happy clients are your best marketing! Add testimonials to showcase your
          excellent work and build trust with potential customers.
        </p>
        <button
          onClick={handleAddNew}
          className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 text-white font-medium rounded-lg hover:bg-amber-600 transition-colors shadow-lg hover:shadow-xl"
        >
          <Plus className="h-5 w-5" />
          Add Your First Testimonial
        </button>
      </div>
    )
  }

  // List view
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-wrap">
          {/* Filter tabs */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            {(['all', 'featured', 'active', 'hidden'] as FilterType[]).map(
              (filterType) => (
                <button
                  key={filterType}
                  onClick={() => setFilter(filterType)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors capitalize ${
                    filter === filterType
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {filterType} ({counts[filterType]})
                </button>
              )
            )}
          </div>
        </div>

        <button
          onClick={handleAddNew}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-500 text-white font-medium rounded-lg hover:bg-amber-600 transition-colors shadow-sm"
        >
          <Plus className="h-5 w-5" />
          Add New Testimonial
        </button>
      </div>

      {/* Testimonial count */}
      <p className="text-sm text-gray-500">
        Showing {filteredTestimonials.length} testimonial
        {filteredTestimonials.length !== 1 ? 's' : ''}
      </p>

      {/* Testimonials List */}
      <div className="space-y-4">
        {filteredTestimonials.map((testimonial) => (
          <div
            key={testimonial._id}
            className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex gap-4">
              {/* Avatar */}
              <div className="flex-shrink-0">
                {testimonial.clientPhoto ? (
                  <Image
                    src={testimonial.clientPhoto}
                    alt={testimonial.clientName}
                    width={56}
                    height={56}
                    className="w-14 h-14 rounded-full object-cover"
                  />
                ) : (
                  <InitialsAvatar
                    name={testimonial.clientName}
                    className="w-14 h-14 rounded-full text-lg"
                  />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                {/* Header row */}
                <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {testimonial.clientName}
                    </h3>
                    {testimonial.clientLocation && (
                      <p className="text-sm text-gray-500 flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {testimonial.clientLocation}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEdit(testimonial)}
                      className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                      aria-label="Edit testimonial"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setDeleteId(testimonial._id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      aria-label="Delete testimonial"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Star rating */}
                <div className="mb-3">
                  <StarRating value={testimonial.rating} readonly size="sm" />
                </div>

                {/* Quote */}
                <blockquote className="text-gray-700 mb-3 italic">
                  &ldquo;{truncateText(testimonial.quote, 200)}&rdquo;
                </blockquote>

                {/* Badges row */}
                <div className="flex flex-wrap items-center gap-2">
                  {testimonial.projectType && (
                    <span className="px-2.5 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                      {testimonial.projectType}
                    </span>
                  )}
                  {testimonial.featuredOnHomepage && (
                    <span className="px-2.5 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full flex items-center gap-1">
                      <Star className="h-3 w-3 fill-current" />
                      Featured
                    </span>
                  )}
                  {testimonial.showOnWebsite ? (
                    <span className="px-2.5 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      Active
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full flex items-center gap-1">
                      <EyeOff className="h-3 w-3" />
                      Hidden
                    </span>
                  )}
                  {testimonial.date && (
                    <span className="text-xs text-gray-400 flex items-center gap-1 ml-auto">
                      <Calendar className="h-3 w-3" />
                      {formatDate(testimonial.date)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Delete Dialog */}
      <DeleteDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        clientName={
          testimonials.find((t) => t._id === deleteId)?.clientName || ''
        }
        isDeleting={isDeleting}
      />

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}
