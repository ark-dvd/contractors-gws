'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Loader2,
  AlertCircle,
  HelpCircle,
  CheckCircle,
  ArrowLeft,
  Eye,
  EyeOff,
} from 'lucide-react'
import { adminFetch, adminPost, adminPut, adminDelete } from '@/lib/admin-api'

// Types
interface FaqItem {
  _id: string
  _createdAt?: string
  question: string
  answer: string
  category?: string
  order: number
  isActive: boolean
}

type FilterType = 'all' | 'active' | 'hidden'

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

// Delete Confirmation Dialog
function DeleteDialog({
  isOpen,
  onClose,
  onConfirm,
  questionText,
  isDeleting,
}: {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  questionText: string
  isDeleting: boolean
}) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl p-6 max-w-md w-full shadow-xl">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Delete FAQ?
        </h3>
        <p className="text-gray-600 mb-6">
          Are you sure you want to delete{' '}
          <span className="font-medium">&ldquo;{questionText}&rdquo;</span>? This action cannot be
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
function FaqSkeleton() {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm animate-pulse">
      <div className="h-5 w-3/4 bg-gray-200 rounded mb-3" />
      <div className="h-4 w-full bg-gray-200 rounded mb-2" />
      <div className="h-4 w-1/2 bg-gray-200 rounded" />
    </div>
  )
}

export default function FaqsTab() {
  // State
  const [faqs, setFaqs] = useState<FaqItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<FilterType>('all')

  // Form state
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    category: '',
    order: 10,
    isActive: true,
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  // Delete state
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Toast state
  const [toast, setToast] = useState<{
    message: string
    type: 'success' | 'error'
  } | null>(null)

  // Fetch FAQs
  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await adminFetch<FaqItem[]>('faqs')
      setFaqs(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load FAQs')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Filter FAQs
  const filteredFaqs = faqs.filter((f) => {
    switch (filter) {
      case 'active':
        return f.isActive
      case 'hidden':
        return !f.isActive
      default:
        return true
    }
  })

  // Reset form
  const resetForm = () => {
    setFormData({
      question: '',
      answer: '',
      category: '',
      order: 10,
      isActive: true,
    })
    setFormErrors({})
    setEditingId(null)
  }

  // Open form for new FAQ
  const handleAddNew = () => {
    resetForm()
    setIsFormOpen(true)
  }

  // Open form for editing
  const handleEdit = (faq: FaqItem) => {
    setFormData({
      question: faq.question,
      answer: faq.answer,
      category: faq.category || '',
      order: faq.order,
      isActive: faq.isActive,
    })
    setFormErrors({})
    setEditingId(faq._id)
    setIsFormOpen(true)
  }

  // Close form
  const handleCloseForm = () => {
    setIsFormOpen(false)
    resetForm()
  }

  // Validate form
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}
    if (!formData.question.trim()) {
      errors.question = 'Question is required'
    }
    if (!formData.answer.trim()) {
      errors.answer = 'Answer is required'
    }
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Save FAQ
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return
    setIsSaving(true)

    try {
      const payload = {
        question: formData.question,
        answer: formData.answer,
        category: formData.category || undefined,
        order: formData.order,
        isActive: formData.isActive,
      }

      if (editingId) {
        await adminPut('faqs', { _id: editingId, ...payload })
        setToast({ message: 'FAQ updated successfully', type: 'success' })
      } else {
        await adminPost('faqs', payload)
        setToast({ message: 'FAQ created successfully', type: 'success' })
      }

      handleCloseForm()
      fetchData()
    } catch (e) {
      setToast({
        message: e instanceof Error ? e.message : 'Failed to save FAQ',
        type: 'error',
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Delete FAQ
  const handleDelete = async () => {
    if (!deleteId) return
    setIsDeleting(true)

    try {
      await adminDelete('faqs', deleteId)
      setToast({ message: 'FAQ deleted successfully', type: 'success' })
      setDeleteId(null)
      fetchData()
    } catch (e) {
      setToast({
        message: e instanceof Error ? e.message : 'Failed to delete FAQ',
        type: 'error',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  // Truncate text
  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text
    return text.slice(0, maxLength).trim() + '...'
  }

  // Filter counts
  const counts = {
    all: faqs.length,
    active: faqs.filter((f) => f.isActive).length,
    hidden: faqs.filter((f) => !f.isActive).length,
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
          <FaqSkeleton key={i} />
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
          Failed to Load FAQs
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
              {editingId ? 'Edit FAQ' : 'Add New FAQ'}
            </h2>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-6">
          {/* Question */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Question <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.question}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, question: e.target.value }))
              }
              className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all ${
                formErrors.question ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="e.g., How long does a typical remodel take?"
            />
            {formErrors.question && (
              <p className="mt-1 text-sm text-red-600">{formErrors.question}</p>
            )}
          </div>

          {/* Answer */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Answer <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.answer}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, answer: e.target.value }))
              }
              rows={5}
              className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all resize-none ${
                formErrors.answer ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Provide a clear, helpful answer..."
            />
            {formErrors.answer && (
              <p className="mt-1 text-sm text-red-600">{formErrors.answer}</p>
            )}
          </div>

          {/* Category & Order */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, category: e.target.value }))
                }
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                placeholder='e.g., "General", "Pricing", "Process"'
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Display Order
              </label>
              <input
                type="number"
                value={formData.order}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    order: parseInt(e.target.value) || 0,
                  }))
                }
                min={0}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
              />
            </div>
          </div>

          {/* Settings Row */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-4">Settings</h3>
            <ToggleSwitch
              checked={formData.isActive}
              onChange={(checked) =>
                setFormData((prev) => ({ ...prev, isActive: checked }))
              }
              label="Show on Website"
            />
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
                'Save FAQ'
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
  if (faqs.length === 0) {
    return (
      <div className="bg-white rounded-xl p-12 shadow-sm text-center">
        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <HelpCircle className="h-8 w-8 text-amber-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          No FAQs yet
        </h3>
        <p className="text-gray-500 mb-6 max-w-md mx-auto">
          Add frequently asked questions to help visitors find answers quickly
          and reduce repetitive inquiries.
        </p>
        <button
          onClick={handleAddNew}
          className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 text-white font-medium rounded-lg hover:bg-amber-600 transition-colors shadow-lg hover:shadow-xl"
        >
          <Plus className="h-5 w-5" />
          Add Your First FAQ
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
            {(['all', 'active', 'hidden'] as FilterType[]).map(
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
          Add New FAQ
        </button>
      </div>

      {/* FAQ count */}
      <p className="text-sm text-gray-500">
        Showing {filteredFaqs.length} FAQ
        {filteredFaqs.length !== 1 ? 's' : ''}
      </p>

      {/* FAQs List */}
      <div className="space-y-4">
        {filteredFaqs.map((faq) => (
          <div
            key={faq._id}
            className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex gap-4">
              {/* Content */}
              <div className="flex-1 min-w-0">
                {/* Header row */}
                <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                  <h3 className="font-semibold text-gray-900">
                    {truncateText(faq.question, 120)}
                  </h3>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleEdit(faq)}
                      className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                      aria-label="Edit FAQ"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setDeleteId(faq._id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      aria-label="Delete FAQ"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Answer preview */}
                <p className="text-gray-600 text-sm mb-3">
                  {truncateText(faq.answer, 200)}
                </p>

                {/* Badges row */}
                <div className="flex flex-wrap items-center gap-2">
                  {faq.category && (
                    <span className="px-2.5 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                      {faq.category}
                    </span>
                  )}
                  <span className="px-2.5 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                    Order: {faq.order}
                  </span>
                  {faq.isActive ? (
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
        questionText={
          truncateText(faqs.find((f) => f._id === deleteId)?.question || '', 80)
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
