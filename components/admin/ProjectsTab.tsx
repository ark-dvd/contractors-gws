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
  FolderKanban,
  MapPin,
  Calendar,
  Check,
  AlertCircle,
  ChevronUp,
  ChevronDown,
} from 'lucide-react'
import { adminFetch, adminPost, adminPut, adminDelete } from '@/lib/admin-api'
import ImageUpload from './ImageUpload'

// Types
interface Project {
  _id: string
  _createdAt: string
  title: string
  slug: { current: string }
  status: 'completed' | 'in-progress' | 'upcoming'
  projectType?: string
  location?: { city?: string; state?: string; neighborhood?: string }
  completionDate?: string
  duration?: string
  budgetRange?: string
  scope?: string[]
  permitNumber?: string
  shortDescription?: string
  description?: string
  clientTestimonial?: string
  clientName?: string
  heroImageUrl?: string
  beforeImageUrl?: string
  galleryImages?: Array<{ url: string; alt?: string; caption?: string }>
  videoUrl?: string
  seoTitle?: string
  seoDescription?: string
  serviceRef?: { _id: string; name: string }
}

interface Service {
  _id: string
  name: string
}

interface FormData {
  _id?: string
  title: string
  slug: string
  status: 'completed' | 'in-progress' | 'upcoming'
  projectType: string
  serviceId: string
  city: string
  state: string
  neighborhood: string
  completionDate: string
  duration: string
  budgetRange: string
  scope: string[]
  permitNumber: string
  shortDescription: string
  description: string
  clientTestimonial: string
  clientName: string
  heroImage: string
  heroImageUrl: string
  beforeImage: string
  beforeImageUrl: string
  gallery: Array<{ assetId: string; url: string; alt: string; caption: string }>
  videoUrl: string
  seoTitle: string
  seoDescription: string
}

const initialFormData: FormData = {
  title: '',
  slug: '',
  status: 'completed',
  projectType: '',
  serviceId: '',
  city: '',
  state: '',
  neighborhood: '',
  completionDate: '',
  duration: '',
  budgetRange: '',
  scope: [],
  permitNumber: '',
  shortDescription: '',
  description: '',
  clientTestimonial: '',
  clientName: '',
  heroImage: '',
  heroImageUrl: '',
  beforeImage: '',
  beforeImageUrl: '',
  gallery: [],
  videoUrl: '',
  seoTitle: '',
  seoDescription: '',
}

type StatusFilter = 'all' | 'completed' | 'in-progress' | 'upcoming'

// Helper to generate slug
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

// Status badge component
function StatusBadge({ status }: { status: string }) {
  const styles = {
    completed: 'bg-green-100 text-green-700',
    'in-progress': 'bg-amber-100 text-amber-700',
    upcoming: 'bg-blue-100 text-blue-700',
  }
  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-700'}`}>
      {status === 'in-progress' ? 'In Progress' : status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}

// Skeleton card for loading state
function ProjectCardSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden animate-pulse">
      <div className="aspect-video bg-gray-200" />
      <div className="p-4">
        <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-3" />
        <div className="flex gap-2">
          <div className="h-6 bg-gray-200 rounded-full w-20" />
          <div className="h-6 bg-gray-200 rounded-full w-16" />
        </div>
      </div>
    </div>
  )
}

// Delete confirmation dialog
function DeleteDialog({
  projectTitle,
  onConfirm,
  onCancel,
  isDeleting,
}: {
  projectTitle: string
  onConfirm: () => void
  onCancel: () => void
  isDeleting: boolean
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Project?</h3>
        <p className="text-gray-600 mb-6">
          This will permanently remove <span className="font-medium">{projectTitle}</span> and all its photos. This cannot be undone.
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

export default function ProjectsTab() {
  // State
  const [projects, setProjects] = useState<Project[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<StatusFilter>('all')
  const [view, setView] = useState<'list' | 'form'>('list')
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [isSaving, setIsSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false)
  const [scopeInput, setScopeInput] = useState('')

  // Fetch data
  const fetchProjects = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await adminFetch<Project[]>('projects')
      setProjects(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load projects')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchServices = useCallback(async () => {
    try {
      const data = await adminFetch<Service[]>('services')
      setServices(data)
    } catch (e) {
      console.error('Failed to load services:', e)
    }
  }, [])

  useEffect(() => {
    fetchProjects()
    fetchServices()
  }, [fetchProjects, fetchServices])

  // Filter projects
  const filteredProjects = projects.filter(p => filter === 'all' || p.status === filter)

  // Form handlers
  const openAddForm = () => {
    setFormData(initialFormData)
    setFormErrors({})
    setSlugManuallyEdited(false)
    setEditingProject(null)
    setView('form')
  }

  const openEditForm = (project: Project) => {
    setFormData({
      _id: project._id,
      title: project.title,
      slug: project.slug?.current || '',
      status: project.status,
      projectType: project.projectType || '',
      serviceId: project.serviceRef?._id || '',
      city: project.location?.city || '',
      state: project.location?.state || '',
      neighborhood: project.location?.neighborhood || '',
      completionDate: project.completionDate || '',
      duration: project.duration || '',
      budgetRange: project.budgetRange || '',
      scope: project.scope || [],
      permitNumber: project.permitNumber || '',
      shortDescription: project.shortDescription || '',
      description: project.description || '',
      clientTestimonial: project.clientTestimonial || '',
      clientName: project.clientName || '',
      heroImage: '',
      heroImageUrl: project.heroImageUrl || '',
      beforeImage: '',
      beforeImageUrl: project.beforeImageUrl || '',
      gallery: project.galleryImages?.map(img => ({
        assetId: '',
        url: img.url,
        alt: img.alt || '',
        caption: img.caption || '',
      })) || [],
      videoUrl: project.videoUrl || '',
      seoTitle: project.seoTitle || '',
      seoDescription: project.seoDescription || '',
    })
    setFormErrors({})
    setSlugManuallyEdited(true) // Don't auto-generate on edit
    setEditingProject(project)
    setView('form')
  }

  const closeForm = () => {
    setView('list')
    setEditingProject(null)
  }

  const updateFormField = (field: keyof FormData, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when field is edited
    if (formErrors[field]) {
      setFormErrors(prev => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }

  const handleTitleChange = (value: string) => {
    updateFormField('title', value)
    if (!slugManuallyEdited) {
      updateFormField('slug', generateSlug(value))
    }
  }

  const handleSlugChange = (value: string) => {
    setSlugManuallyEdited(true)
    updateFormField('slug', generateSlug(value))
  }

  // Scope handling
  const addScopeItem = () => {
    const item = scopeInput.trim()
    if (item && !formData.scope.includes(item)) {
      updateFormField('scope', [...formData.scope, item])
      setScopeInput('')
    }
  }

  const removeScopeItem = (index: number) => {
    updateFormField('scope', formData.scope.filter((_, i) => i !== index))
  }

  const moveScopeItem = (index: number, direction: 'up' | 'down') => {
    const newScope = [...formData.scope]
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex >= 0 && newIndex < newScope.length) {
      [newScope[index], newScope[newIndex]] = [newScope[newIndex], newScope[index]]
      updateFormField('scope', newScope)
    }
  }

  // Gallery handling
  const addGalleryImage = (assetId: string, url: string) => {
    updateFormField('gallery', [...formData.gallery, { assetId, url, alt: '', caption: '' }])
  }

  const updateGalleryImage = (index: number, field: 'alt' | 'caption', value: string) => {
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

    if (!formData.title.trim()) errors.title = 'Title is required'
    if (!formData.slug.trim()) errors.slug = 'Slug is required'
    if (!formData.heroImage && !formData.heroImageUrl) errors.heroImage = 'Main image is required'

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Save project
  const handleSave = async () => {
    if (!validateForm()) return

    setIsSaving(true)
    try {
      // Build payload WITHOUT image fields - only add them if new uploads occurred
      const payload: Record<string, unknown> = {
        _id: formData._id,
        title: formData.title,
        slug: formData.slug,
        status: formData.status,
        projectType: formData.projectType,
        location: {
          city: formData.city,
          state: formData.state,
          neighborhood: formData.neighborhood,
        },
        completionDate: formData.completionDate,
        duration: formData.duration,
        budgetRange: formData.budgetRange,
        scope: formData.scope,
        permitNumber: formData.permitNumber,
        shortDescription: formData.shortDescription,
        description: formData.description,
        clientTestimonial: formData.clientTestimonial,
        clientName: formData.clientName,
        videoUrl: formData.videoUrl,
        seoTitle: formData.seoTitle,
        seoDescription: formData.seoDescription,
      }

      // CRITICAL: Only include image fields if NEW uploads occurred
      // Empty string means no new upload - don't send field at all to preserve existing
      if (formData.heroImage) {
        payload.heroImage = formData.heroImage
      }
      if (formData.beforeImage) {
        payload.beforeImage = formData.beforeImage
      }
      // Only include gallery items that have new asset IDs
      const newGalleryAssets = formData.gallery.map(g => g.assetId).filter(Boolean)
      if (newGalleryAssets.length > 0) {
        payload.gallery = newGalleryAssets
      }

      if (formData._id) {
        await adminPut('projects', payload)
        setToast({ message: 'Project updated successfully', type: 'success' })
      } else {
        await adminPost('projects', payload)
        setToast({ message: 'Project created successfully', type: 'success' })
      }

      await fetchProjects()
      closeForm()
    } catch (e) {
      setToast({ message: e instanceof Error ? e.message : 'Failed to save project', type: 'error' })
    } finally {
      setIsSaving(false)
    }
  }

  // Delete project
  const handleDelete = async () => {
    if (!deleteTarget) return

    setIsDeleting(true)
    try {
      await adminDelete('projects', deleteTarget._id)
      setToast({ message: 'Project deleted', type: 'success' })
      setProjects(prev => prev.filter(p => p._id !== deleteTarget._id))
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
              Add New Project
            </button>
            <span className="text-sm text-gray-500">
              {filteredProjects.length} {filteredProjects.length === 1 ? 'Project' : 'Projects'}
            </span>
          </div>

          {/* Filter */}
          <div className="flex items-center gap-2">
            {(['all', 'completed', 'in-progress', 'upcoming'] as const).map(status => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  filter === status
                    ? 'bg-amber-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {status === 'all' ? 'All' : status === 'in-progress' ? 'In Progress' : status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => <ProjectCardSkeleton key={i} />)}
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <div className="bg-white rounded-xl p-8 shadow-sm text-center">
            <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <p className="text-gray-900 font-medium mb-2">Failed to load projects</p>
            <p className="text-gray-500 text-sm mb-4">{error}</p>
            <button
              onClick={fetchProjects}
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Retry
            </button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && filteredProjects.length === 0 && (
          <div className="bg-white rounded-xl p-12 shadow-sm text-center">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FolderKanban className="h-8 w-8 text-amber-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {filter === 'all' ? 'No projects yet' : `No ${filter} projects`}
            </h3>
            <p className="text-gray-500 mb-6">
              {filter === 'all' ? 'Showcase your best work!' : 'Try a different filter'}
            </p>
            {filter === 'all' && (
              <button
                onClick={openAddForm}
                className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors font-medium"
              >
                <Plus className="h-5 w-5" />
                Add Your First Project
              </button>
            )}
          </div>
        )}

        {/* Projects grid */}
        {!loading && !error && filteredProjects.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProjects.map(project => (
              <div key={project._id} className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                {/* Image */}
                <div className="relative aspect-video bg-gray-100">
                  {project.heroImageUrl ? (
                    <Image
                      src={project.heroImageUrl}
                      alt={project.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <FolderKanban className="h-12 w-12 text-gray-300" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">{project.title}</h3>
                  {project.projectType && (
                    <p className="text-sm text-gray-500 mb-2">{project.projectType}</p>
                  )}

                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <StatusBadge status={project.status} />
                    {project.location?.city && (
                      <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                        <MapPin className="h-3 w-3" />
                        {project.location.city}{project.location.state ? `, ${project.location.state}` : ''}
                      </span>
                    )}
                    {project.completionDate && (
                      <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                        <Calendar className="h-3 w-3" />
                        {new Date(project.completionDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditForm(project)}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                    >
                      <Pencil className="h-4 w-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => setDeleteTarget(project)}
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
            projectTitle={deleteTarget.title}
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
            {editingProject ? 'Edit Project' : 'Add New Project'}
          </h2>
        </div>

        {/* Form content */}
        <div className="p-4 lg:p-0 lg:py-4 pb-32 lg:pb-4 max-w-3xl mx-auto">
          {/* Section 1: Basic Info */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Info</h3>

            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Project Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="e.g., Modern Kitchen Renovation"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 ${
                    formErrors.title ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {formErrors.title && <p className="text-red-500 text-sm mt-1">{formErrors.title}</p>}
              </div>

              {/* Slug */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL Slug <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center">
                  <span className="px-3 py-2 bg-gray-100 border border-r-0 border-gray-300 rounded-l-lg text-gray-500 text-sm">
                    /projects/
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

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <div className="flex flex-wrap gap-3">
                  {(['completed', 'in-progress', 'upcoming'] as const).map(status => (
                    <label key={status} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="status"
                        value={status}
                        checked={formData.status === status}
                        onChange={(e) => updateFormField('status', e.target.value)}
                        className="text-amber-500 focus:ring-amber-500"
                      />
                      <span className="text-sm">{status === 'in-progress' ? 'In Progress' : status.charAt(0).toUpperCase() + status.slice(1)}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Project Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Project Type</label>
                <input
                  type="text"
                  value={formData.projectType}
                  onChange={(e) => updateFormField('projectType', e.target.value)}
                  placeholder="e.g., Kitchen Remodel, Bathroom Addition"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>

              {/* Service Category */}
              {services.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Service Category</label>
                  <select
                    value={formData.serviceId}
                    onChange={(e) => updateFormField('serviceId', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  >
                    <option value="">Select a service...</option>
                    {services.map(service => (
                      <option key={service._id} value={service._id}>{service.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => updateFormField('city', e.target.value)}
                    placeholder="City"
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  />
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => updateFormField('state', e.target.value)}
                    placeholder="State"
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  />
                  <input
                    type="text"
                    value={formData.neighborhood}
                    onChange={(e) => updateFormField('neighborhood', e.target.value)}
                    placeholder="Neighborhood"
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Project Details */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Details</h3>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Completion Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Completion Date</label>
                  <input
                    type="date"
                    value={formData.completionDate}
                    onChange={(e) => updateFormField('completionDate', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>

                {/* Duration */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                  <input
                    type="text"
                    value={formData.duration}
                    onChange={(e) => updateFormField('duration', e.target.value)}
                    placeholder="e.g., 6 weeks"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Budget Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Budget Range</label>
                  <input
                    type="text"
                    value={formData.budgetRange}
                    onChange={(e) => updateFormField('budgetRange', e.target.value)}
                    placeholder="e.g., $50,000 - $75,000"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>

                {/* Permit Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Permit Number</label>
                  <input
                    type="text"
                    value={formData.permitNumber}
                    onChange={(e) => updateFormField('permitNumber', e.target.value)}
                    placeholder="Optional"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Scope of Work */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Scope of Work</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={scopeInput}
                    onChange={(e) => setScopeInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addScopeItem())}
                    placeholder="Type item and press Enter"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={addScopeItem}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Add
                  </button>
                </div>
                {formData.scope.length > 0 && (
                  <div className="space-y-2">
                    {formData.scope.map((item, index) => (
                      <div key={index} className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg">
                        <span className="flex-1 text-sm">{item}</span>
                        <button
                          type="button"
                          onClick={() => moveScopeItem(index, 'up')}
                          disabled={index === 0}
                          className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                        >
                          <ChevronUp className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveScopeItem(index, 'down')}
                          disabled={index === formData.scope.length - 1}
                          className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                        >
                          <ChevronDown className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeScopeItem(index)}
                          className="p-1 text-red-400 hover:text-red-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section 3: Description */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Description</h3>

            <div className="space-y-4">
              {/* Short Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Short Description
                  <span className="text-gray-400 font-normal ml-2">{formData.shortDescription.length}/200</span>
                </label>
                <textarea
                  value={formData.shortDescription}
                  onChange={(e) => updateFormField('shortDescription', e.target.value)}
                  rows={3}
                  placeholder="Brief summary for project cards"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>

              {/* Full Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => updateFormField('description', e.target.value)}
                  rows={10}
                  placeholder="Detailed project story. Use double line breaks for paragraphs."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>

              {/* Client Testimonial */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Client Testimonial</label>
                <textarea
                  value={formData.clientTestimonial}
                  onChange={(e) => updateFormField('clientTestimonial', e.target.value)}
                  rows={4}
                  placeholder="Optional testimonial for this specific project"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>

              {/* Client Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Client Name (for testimonial)</label>
                <input
                  type="text"
                  value={formData.clientName}
                  onChange={(e) => updateFormField('clientName', e.target.value)}
                  placeholder="e.g., The Johnson Family"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Photos & Media */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Photos & Media</h3>

            <div className="space-y-6">
              {/* Before/After Images */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ImageUpload
                  label="Main Image (After)"
                  required
                  value={formData.heroImageUrl || null}
                  onUpload={(assetId, url) => {
                    updateFormField('heroImage', assetId)
                    updateFormField('heroImageUrl', url)
                  }}
                  onRemove={() => {
                    updateFormField('heroImage', '')
                    updateFormField('heroImageUrl', '')
                  }}
                />
                {formErrors.heroImage && <p className="text-red-500 text-sm -mt-3">{formErrors.heroImage}</p>}

                <ImageUpload
                  label="Before Image"
                  value={formData.beforeImageUrl || null}
                  onUpload={(assetId, url) => {
                    updateFormField('beforeImage', assetId)
                    updateFormField('beforeImageUrl', url)
                  }}
                  onRemove={() => {
                    updateFormField('beforeImage', '')
                    updateFormField('beforeImageUrl', '')
                  }}
                />
              </div>

              {/* Gallery */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Photo Gallery</label>
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

              {/* Video URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Video URL</label>
                <input
                  type="text"
                  value={formData.videoUrl}
                  onChange={(e) => updateFormField('videoUrl', e.target.value)}
                  placeholder="YouTube or Vimeo URL"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Section 5: SEO */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">SEO</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  SEO Title
                  <span className={`ml-2 ${formData.seoTitle.length > 60 ? 'text-red-500' : 'text-gray-400'}`}>
                    {formData.seoTitle.length}/60 recommended
                  </span>
                </label>
                <input
                  type="text"
                  value={formData.seoTitle}
                  onChange={(e) => updateFormField('seoTitle', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  SEO Description
                  <span className={`ml-2 ${formData.seoDescription.length > 160 ? 'text-red-500' : 'text-gray-400'}`}>
                    {formData.seoDescription.length}/160 recommended
                  </span>
                </label>
                <textarea
                  value={formData.seoDescription}
                  onChange={(e) => updateFormField('seoDescription', e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
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
            {isSaving ? 'Saving...' : 'Save Project'}
          </button>
        </div>
      </div>

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
