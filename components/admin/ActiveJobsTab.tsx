'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Loader2,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
  ChevronRight,
  MapPin,
  Calendar,
  DollarSign,
  Clock,
  FileText,
  FileSignature,
  ClipboardList,
  Hammer,
  HardHat,
  Paintbrush,
  PartyPopper,
  Briefcase,
} from 'lucide-react'
import { adminFetch, adminPost, adminPut, adminDelete } from '@/lib/admin-api'

// Types
interface Job {
  _id: string
  clientName: string
  clientEmail: string
  clientPhone?: string
  jobType?: string
  serviceCategory?: { _id: string; title: string }
  jobSiteAddress?: string
  estimatedBudget?: number
  currentStage: number
  estimateDate?: string
  contractSignedDate?: string
  startDate?: string
  expectedCompletionDate?: string
  actualCompletionDate?: string
  internalNotes?: string
  isActive: boolean
}

interface Service {
  _id: string
  title: string
}

type FilterType = 'all' | 'active' | 'closed'
type SortType = 'stage' | 'date' | 'client'

// Stage configuration
const STAGES = [
  {
    number: 1,
    name: 'Estimate / Proposal',
    shortName: 'Estimate',
    icon: FileText,
    color: 'bg-slate-500',
    lightColor: 'bg-slate-100',
    textColor: 'text-slate-700',
    description: 'Initial consultation and cost estimate provided to client',
  },
  {
    number: 2,
    name: 'Contract Signed',
    shortName: 'Contract',
    icon: FileSignature,
    color: 'bg-blue-500',
    lightColor: 'bg-blue-100',
    textColor: 'text-blue-700',
    description: 'Agreement finalized and contract signed by both parties',
  },
  {
    number: 3,
    name: 'Permits & Planning',
    shortName: 'Permits',
    icon: ClipboardList,
    color: 'bg-indigo-500',
    lightColor: 'bg-indigo-100',
    textColor: 'text-indigo-700',
    description: 'Obtaining permits and finalizing project plans',
  },
  {
    number: 4,
    name: 'Demo / Prep',
    shortName: 'Demo',
    icon: Hammer,
    color: 'bg-purple-500',
    lightColor: 'bg-purple-100',
    textColor: 'text-purple-700',
    description: 'Site preparation and demolition work',
  },
  {
    number: 5,
    name: 'Construction',
    shortName: 'Build',
    icon: HardHat,
    color: 'bg-orange-500',
    lightColor: 'bg-orange-100',
    textColor: 'text-orange-700',
    description: 'Main construction and installation phase',
  },
  {
    number: 6,
    name: 'Finishing / Punch List',
    shortName: 'Finishing',
    icon: Paintbrush,
    color: 'bg-amber-500',
    lightColor: 'bg-amber-100',
    textColor: 'text-amber-700',
    description: 'Final touches and addressing punch list items',
  },
  {
    number: 7,
    name: 'Final Walkthrough & Handoff',
    shortName: 'Complete',
    icon: PartyPopper,
    color: 'bg-emerald-500',
    lightColor: 'bg-emerald-100',
    textColor: 'text-emerald-700',
    description: 'Final inspection, client walkthrough, and project handoff',
  },
]

// Toggle Switch component
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
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Job?</h3>
        <p className="text-gray-600 mb-6">
          Are you sure you want to delete the job for{' '}
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

// Pipeline Visualization component
function PipelineVisualization({
  jobs,
  selectedStage,
  onStageSelect,
}: {
  jobs: Job[]
  selectedStage: number | null
  onStageSelect: (stage: number | null) => void
}) {
  // Count jobs per stage
  const stageCounts = STAGES.map((stage) => ({
    ...stage,
    count: jobs.filter((job) => job.currentStage === stage.number && job.isActive)
      .length,
  }))

  const totalActive = jobs.filter((job) => job.isActive).length

  return (
    <div className="bg-white rounded-xl p-4 lg:p-6 shadow-sm mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Job Pipeline</h2>
        <button
          onClick={() => onStageSelect(null)}
          className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
            selectedStage === null
              ? 'bg-amber-100 text-amber-700'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          All Jobs ({totalActive})
        </button>
      </div>

      {/* Desktop: Horizontal pipeline */}
      <div className="hidden lg:block">
        <div className="flex items-stretch gap-1">
          {stageCounts.map((stage, index) => {
            const Icon = stage.icon
            const isSelected = selectedStage === stage.number
            const hasJobs = stage.count > 0
            return (
              <button
                key={stage.number}
                onClick={() =>
                  onStageSelect(isSelected ? null : stage.number)
                }
                className={`flex-1 relative p-3 rounded-lg transition-all ${
                  isSelected
                    ? `${stage.color} text-white shadow-lg scale-105`
                    : hasJobs
                    ? `${stage.lightColor} ${stage.textColor} hover:scale-102`
                    : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                }`}
              >
                <div className="flex flex-col items-center gap-1">
                  <Icon className="h-5 w-5" />
                  <span className="text-xs font-medium">{stage.shortName}</span>
                  <span
                    className={`text-lg font-bold ${
                      isSelected ? 'text-white' : hasJobs ? '' : 'text-gray-300'
                    }`}
                  >
                    {stage.count}
                  </span>
                </div>
                {/* Connector arrow */}
                {index < stageCounts.length - 1 && (
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10">
                    <ChevronRight
                      className={`h-4 w-4 ${
                        hasJobs ? 'text-gray-400' : 'text-gray-200'
                      }`}
                    />
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Mobile: Vertical list */}
      <div className="lg:hidden space-y-2">
        {stageCounts.map((stage) => {
          const Icon = stage.icon
          const isSelected = selectedStage === stage.number
          const hasJobs = stage.count > 0
          return (
            <button
              key={stage.number}
              onClick={() => onStageSelect(isSelected ? null : stage.number)}
              className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${
                isSelected
                  ? `${stage.color} text-white shadow-lg`
                  : hasJobs
                  ? `${stage.lightColor} ${stage.textColor}`
                  : 'bg-gray-50 text-gray-400'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  isSelected
                    ? 'bg-white/20'
                    : hasJobs
                    ? stage.color + ' text-white'
                    : 'bg-gray-200'
                }`}
              >
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 text-left">
                <span className="font-medium">{stage.name}</span>
              </div>
              <span
                className={`text-lg font-bold ${
                  isSelected ? 'text-white' : hasJobs ? '' : 'text-gray-300'
                }`}
              >
                {stage.count}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// Mini progress bar for job cards
function JobProgressBar({ currentStage }: { currentStage: number }) {
  return (
    <div className="flex gap-0.5">
      {STAGES.map((stage) => (
        <div
          key={stage.number}
          className={`h-1.5 flex-1 rounded-full transition-colors ${
            stage.number <= currentStage ? stage.color : 'bg-gray-200'
          }`}
        />
      ))}
    </div>
  )
}

// Interactive stage selector for form
function StageSelector({
  value,
  onChange,
}: {
  value: number
  onChange: (stage: number) => void
}) {
  const selectedStage = STAGES.find((s) => s.number === value)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-7 gap-1">
        {STAGES.map((stage) => {
          const Icon = stage.icon
          const isCompleted = stage.number < value
          const isCurrent = stage.number === value
          return (
            <button
              key={stage.number}
              type="button"
              onClick={() => onChange(stage.number)}
              className={`relative p-2 rounded-lg transition-all flex flex-col items-center gap-1 ${
                isCurrent
                  ? `${stage.color} text-white shadow-lg ring-2 ring-offset-2 ring-${stage.color}`
                  : isCompleted
                  ? `${stage.lightColor} ${stage.textColor}`
                  : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
              }`}
            >
              {isCompleted ? (
                <CheckCircle className="h-5 w-5" />
              ) : (
                <Icon className="h-5 w-5" />
              )}
              <span className="text-[10px] font-medium leading-tight text-center">
                {stage.shortName}
              </span>
            </button>
          )
        })}
      </div>
      {selectedStage && (
        <div
          className={`p-3 rounded-lg ${selectedStage.lightColor} ${selectedStage.textColor}`}
        >
          <p className="text-sm font-medium">{selectedStage.name}</p>
          <p className="text-xs mt-1 opacity-80">{selectedStage.description}</p>
        </div>
      )}
    </div>
  )
}

// Loading skeleton
function JobSkeleton() {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="h-5 w-32 bg-gray-200 rounded mb-2" />
          <div className="h-4 w-24 bg-gray-200 rounded" />
        </div>
        <div className="h-8 w-24 bg-gray-200 rounded" />
      </div>
      <div className="h-1.5 w-full bg-gray-200 rounded mb-4" />
      <div className="grid grid-cols-2 gap-4">
        <div className="h-4 bg-gray-200 rounded" />
        <div className="h-4 bg-gray-200 rounded" />
      </div>
    </div>
  )
}

export default function ActiveJobsTab() {
  // State
  const [jobs, setJobs] = useState<Job[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<FilterType>('active')
  const [sort, setSort] = useState<SortType>('stage')
  const [selectedStage, setSelectedStage] = useState<number | null>(null)

  // Form state
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState({
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    jobType: '',
    serviceCategoryId: '',
    jobSiteAddress: '',
    estimatedBudget: '',
    currentStage: 1,
    estimateDate: new Date().toISOString().split('T')[0],
    contractSignedDate: '',
    startDate: '',
    expectedCompletionDate: '',
    actualCompletionDate: '',
    internalNotes: '',
    isActive: true,
  })

  // Delete state
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Toast state
  const [toast, setToast] = useState<{
    message: string
    type: 'success' | 'error'
  } | null>(null)

  // Quick advance animation state
  const [advancingId, setAdvancingId] = useState<string | null>(null)

  // Fetch jobs and services
  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [jobsData, servicesData] = await Promise.all([
        adminFetch<Job[]>('/api/admin/jobs'),
        adminFetch<Service[]>('/api/admin/services'),
      ])
      setJobs(jobsData)
      setServices(servicesData)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load data')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Filter and sort jobs
  const filteredJobs = jobs
    .filter((job) => {
      // Filter by active/closed
      if (filter === 'active' && !job.isActive) return false
      if (filter === 'closed' && job.isActive) return false
      // Filter by stage
      if (selectedStage !== null && job.currentStage !== selectedStage)
        return false
      return true
    })
    .sort((a, b) => {
      switch (sort) {
        case 'stage':
          return a.currentStage - b.currentStage
        case 'date':
          const dateA = a.expectedCompletionDate || a.startDate || ''
          const dateB = b.expectedCompletionDate || b.startDate || ''
          return dateA.localeCompare(dateB)
        case 'client':
          return a.clientName.localeCompare(b.clientName)
        default:
          return 0
      }
    })

  // Reset form
  const resetForm = () => {
    setFormData({
      clientName: '',
      clientEmail: '',
      clientPhone: '',
      jobType: '',
      serviceCategoryId: '',
      jobSiteAddress: '',
      estimatedBudget: '',
      currentStage: 1,
      estimateDate: new Date().toISOString().split('T')[0],
      contractSignedDate: '',
      startDate: '',
      expectedCompletionDate: '',
      actualCompletionDate: '',
      internalNotes: '',
      isActive: true,
    })
    setEditingId(null)
  }

  // Open form for new job
  const handleAddNew = () => {
    resetForm()
    setIsFormOpen(true)
  }

  // Open form for editing
  const handleEdit = (job: Job) => {
    setFormData({
      clientName: job.clientName,
      clientEmail: job.clientEmail,
      clientPhone: job.clientPhone || '',
      jobType: job.jobType || '',
      serviceCategoryId: job.serviceCategory?._id || '',
      jobSiteAddress: job.jobSiteAddress || '',
      estimatedBudget: job.estimatedBudget?.toString() || '',
      currentStage: job.currentStage,
      estimateDate: job.estimateDate
        ? new Date(job.estimateDate).toISOString().split('T')[0]
        : '',
      contractSignedDate: job.contractSignedDate
        ? new Date(job.contractSignedDate).toISOString().split('T')[0]
        : '',
      startDate: job.startDate
        ? new Date(job.startDate).toISOString().split('T')[0]
        : '',
      expectedCompletionDate: job.expectedCompletionDate
        ? new Date(job.expectedCompletionDate).toISOString().split('T')[0]
        : '',
      actualCompletionDate: job.actualCompletionDate
        ? new Date(job.actualCompletionDate).toISOString().split('T')[0]
        : '',
      internalNotes: job.internalNotes || '',
      isActive: job.isActive,
    })
    setEditingId(job._id)
    setIsFormOpen(true)
  }

  // Close form
  const handleCloseForm = () => {
    setIsFormOpen(false)
    resetForm()
  }

  // Save job
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      const payload = {
        clientName: formData.clientName,
        clientEmail: formData.clientEmail,
        clientPhone: formData.clientPhone || undefined,
        jobType: formData.jobType || undefined,
        serviceCategoryId: formData.serviceCategoryId || undefined,
        jobSiteAddress: formData.jobSiteAddress || undefined,
        estimatedBudget: formData.estimatedBudget
          ? parseFloat(formData.estimatedBudget)
          : undefined,
        currentStage: formData.currentStage,
        estimateDate: formData.estimateDate || undefined,
        contractSignedDate: formData.contractSignedDate || undefined,
        startDate: formData.startDate || undefined,
        expectedCompletionDate: formData.expectedCompletionDate || undefined,
        actualCompletionDate: formData.actualCompletionDate || undefined,
        internalNotes: formData.internalNotes || undefined,
        isActive: formData.isActive,
      }

      if (editingId) {
        await adminPut('/api/admin/jobs', { id: editingId, ...payload })
        setToast({ message: 'Job updated successfully', type: 'success' })
      } else {
        await adminPost('/api/admin/jobs', payload)
        setToast({ message: 'Job created successfully', type: 'success' })
      }

      handleCloseForm()
      fetchData()
    } catch (e) {
      setToast({
        message: e instanceof Error ? e.message : 'Failed to save job',
        type: 'error',
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Quick stage advance
  const handleQuickAdvance = async (job: Job) => {
    if (job.currentStage >= 7) return

    setAdvancingId(job._id)
    try {
      const newStage = job.currentStage + 1
      const payload: Record<string, unknown> = {
        id: job._id,
        currentStage: newStage,
      }

      // Auto-fill actual completion date when advancing to stage 7
      if (newStage === 7 && !job.actualCompletionDate) {
        payload.actualCompletionDate = new Date().toISOString().split('T')[0]
      }

      await adminPut('/api/admin/jobs', payload)
      setToast({
        message: `Advanced to ${STAGES[newStage - 1].name}`,
        type: 'success',
      })
      fetchData()
    } catch (e) {
      setToast({
        message: e instanceof Error ? e.message : 'Failed to advance stage',
        type: 'error',
      })
    } finally {
      setTimeout(() => setAdvancingId(null), 500)
    }
  }

  // Delete job
  const handleDelete = async () => {
    if (!deleteId) return
    setIsDeleting(true)

    try {
      await adminDelete('/api/admin/jobs', deleteId)
      setToast({ message: 'Job deleted successfully', type: 'success' })
      setDeleteId(null)
      fetchData()
    } catch (e) {
      setToast({
        message: e instanceof Error ? e.message : 'Failed to delete job',
        type: 'error',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  // Format currency
  const formatCurrency = (amount?: number) => {
    if (!amount) return ''
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount)
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

  // Calculate days in current stage
  const getDaysInStage = (job: Job) => {
    // Get the date when the job entered the current stage
    let stageDate: string | undefined
    switch (job.currentStage) {
      case 1:
        stageDate = job.estimateDate
        break
      case 2:
        stageDate = job.contractSignedDate
        break
      case 3:
      case 4:
      case 5:
      case 6:
        stageDate = job.startDate
        break
      case 7:
        stageDate = job.actualCompletionDate
        break
    }

    // Fallback to most recent available date
    if (!stageDate) {
      stageDate =
        job.startDate ||
        job.contractSignedDate ||
        job.estimateDate
    }

    if (!stageDate) return null

    const start = new Date(stageDate)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - start.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl p-6 shadow-sm animate-pulse">
          <div className="h-6 w-32 bg-gray-200 rounded mb-4" />
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div key={i} className="flex-1 h-20 bg-gray-200 rounded-lg" />
            ))}
          </div>
        </div>
        {[1, 2, 3].map((i) => (
          <JobSkeleton key={i} />
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
          Failed to Load Jobs
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
              {editingId ? 'Edit Job' : 'Add New Job'}
            </h2>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-8">
          {/* Section 1: Client Info */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-6 h-6 bg-amber-500 text-white rounded-full flex items-center justify-center text-sm">
                1
              </span>
              Client Info
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  Client Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.clientEmail}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, clientEmail: e.target.value }))
                  }
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                  placeholder="john@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Client Phone
                </label>
                <input
                  type="tel"
                  value={formData.clientPhone}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, clientPhone: e.target.value }))
                  }
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Job Details */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-6 h-6 bg-amber-500 text-white rounded-full flex items-center justify-center text-sm">
                2
              </span>
              Job Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Job Type
                </label>
                <input
                  type="text"
                  value={formData.jobType}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, jobType: e.target.value }))
                  }
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                  placeholder="e.g., Kitchen Remodel"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Service Category
                </label>
                <select
                  value={formData.serviceCategoryId}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      serviceCategoryId: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all bg-white"
                >
                  <option value="">Select a service (optional)</option>
                  {services.map((service) => (
                    <option key={service._id} value={service._id}>
                      {service.title}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Job Site Address
                </label>
                <input
                  type="text"
                  value={formData.jobSiteAddress}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      jobSiteAddress: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                  placeholder="123 Main St, Austin, TX"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estimated Budget
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <DollarSign className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="number"
                    value={formData.estimatedBudget}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        estimatedBudget: e.target.value,
                      }))
                    }
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                    placeholder="50000"
                    min={0}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Job Stage */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-6 h-6 bg-amber-500 text-white rounded-full flex items-center justify-center text-sm">
                3
              </span>
              Job Stage
            </h3>
            <StageSelector
              value={formData.currentStage}
              onChange={(stage) =>
                setFormData((prev) => ({ ...prev, currentStage: stage }))
              }
            />
          </div>

          {/* Section 4: Key Dates */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-6 h-6 bg-amber-500 text-white rounded-full flex items-center justify-center text-sm">
                4
              </span>
              Key Dates
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estimate Date
                </label>
                <input
                  type="date"
                  value={formData.estimateDate}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      estimateDate: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contract Signed
                </label>
                <input
                  type="date"
                  value={formData.contractSignedDate}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      contractSignedDate: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, startDate: e.target.value }))
                  }
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expected Completion
                </label>
                <input
                  type="date"
                  value={formData.expectedCompletionDate}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      expectedCompletionDate: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Actual Completion
                </label>
                <input
                  type="date"
                  value={formData.actualCompletionDate}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      actualCompletionDate: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all text-sm"
                />
              </div>
            </div>
          </div>

          {/* Section 5: Notes */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-6 h-6 bg-amber-500 text-white rounded-full flex items-center justify-center text-sm">
                5
              </span>
              Notes
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Internal Notes
              </label>
              <textarea
                value={formData.internalNotes}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    internalNotes: e.target.value,
                  }))
                }
                rows={4}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all resize-none"
                placeholder="Private notes about this job..."
              />
              <p className="text-xs text-gray-500 mt-1">
                Only visible in admin, not on website
              </p>
            </div>
          </div>

          {/* Settings */}
          <div className="bg-gray-50 rounded-lg p-4">
            <ToggleSwitch
              checked={formData.isActive}
              onChange={(checked) =>
                setFormData((prev) => ({ ...prev, isActive: checked }))
              }
              label="Active Job (turn off to archive/close)"
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
                'Save Job'
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
  if (jobs.length === 0) {
    return (
      <div className="bg-white rounded-xl p-12 shadow-sm text-center">
        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Briefcase className="h-8 w-8 text-amber-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          No active jobs
        </h3>
        <p className="text-gray-500 mb-6 max-w-md mx-auto">
          Your next client is just around the corner! Add jobs to track your
          project pipeline from estimate to final handoff.
        </p>
        <button
          onClick={handleAddNew}
          className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 text-white font-medium rounded-lg hover:bg-amber-600 transition-colors shadow-lg hover:shadow-xl"
        >
          <Plus className="h-5 w-5" />
          Add Your First Job
        </button>
      </div>
    )
  }

  // Main view
  return (
    <div className="space-y-6">
      {/* Pipeline Visualization */}
      <PipelineVisualization
        jobs={jobs}
        selectedStage={selectedStage}
        onStageSelect={setSelectedStage}
      />

      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Filter */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            {(['active', 'closed', 'all'] as FilterType[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors capitalize ${
                  filter === f
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Sort */}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortType)}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
          >
            <option value="stage">Sort by Stage</option>
            <option value="date">Sort by Date</option>
            <option value="client">Sort by Client</option>
          </select>
        </div>

        <button
          onClick={handleAddNew}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-500 text-white font-medium rounded-lg hover:bg-amber-600 transition-colors shadow-sm"
        >
          <Plus className="h-5 w-5" />
          Add New Job
        </button>
      </div>

      {/* Job count */}
      <p className="text-sm text-gray-500">
        Showing {filteredJobs.length} job{filteredJobs.length !== 1 ? 's' : ''}
        {selectedStage !== null && ` at ${STAGES[selectedStage - 1].name}`}
      </p>

      {/* Jobs List */}
      <div className="space-y-4">
        {filteredJobs.map((job) => {
          const stage = STAGES[job.currentStage - 1]
          const daysInStage = getDaysInStage(job)
          const nextStage =
            job.currentStage < 7 ? STAGES[job.currentStage] : null
          const isAdvancing = advancingId === job._id

          return (
            <div
              key={job._id}
              className={`bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all ${
                !job.isActive ? 'opacity-60' : ''
              } ${isAdvancing ? 'ring-2 ring-green-500' : ''}`}
            >
              {/* Header */}
              <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg">
                    {job.clientName}
                  </h3>
                  {job.jobType && (
                    <p className="text-gray-600">{job.jobType}</p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {/* Quick advance button */}
                  {nextStage && job.isActive && (
                    <button
                      onClick={() => handleQuickAdvance(job)}
                      disabled={isAdvancing}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
                        isAdvancing
                          ? 'bg-green-500 text-white'
                          : `${nextStage.lightColor} ${nextStage.textColor} hover:${nextStage.color} hover:text-white`
                      }`}
                    >
                      {isAdvancing ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                      {nextStage.shortName}
                    </button>
                  )}

                  <button
                    onClick={() => handleEdit(job)}
                    className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                    aria-label="Edit job"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setDeleteId(job._id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    aria-label="Delete job"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mb-4">
                <JobProgressBar currentStage={job.currentStage} />
              </div>

              {/* Stage badge and info */}
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${stage.lightColor} ${stage.textColor}`}
                >
                  <stage.icon className="h-4 w-4" />
                  Stage {job.currentStage}: {stage.name}
                </span>
                {daysInStage !== null && (
                  <span className="text-sm text-gray-500 flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {daysInStage} day{daysInStage !== 1 ? 's' : ''} in stage
                  </span>
                )}
                {!job.isActive && (
                  <span className="px-2.5 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                    Closed
                  </span>
                )}
              </div>

              {/* Details grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                {job.jobSiteAddress && (
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-600">{job.jobSiteAddress}</span>
                  </div>
                )}
                {job.estimatedBudget && (
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <span className="text-gray-600 font-medium">
                      {formatCurrency(job.estimatedBudget)}
                    </span>
                  </div>
                )}
                {job.expectedCompletionDate && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <span className="text-gray-600">
                      Due: {formatDate(job.expectedCompletionDate)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Empty filtered state */}
      {filteredJobs.length === 0 && jobs.length > 0 && (
        <div className="bg-gray-50 rounded-xl p-8 text-center">
          <p className="text-gray-500">
            No jobs match the current filter.{' '}
            <button
              onClick={() => {
                setFilter('all')
                setSelectedStage(null)
              }}
              className="text-amber-600 hover:underline font-medium"
            >
              Show all jobs
            </button>
          </p>
        </div>
      )}

      {/* Delete Dialog */}
      <DeleteDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        clientName={jobs.find((j) => j._id === deleteId)?.clientName || ''}
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
