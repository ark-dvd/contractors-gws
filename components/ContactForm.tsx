'use client'

import { useState, FormEvent, useRef, useEffect } from 'react'
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react'

interface Service {
  _id: string
  name: string
}

interface ContactFormProps {
  services: Service[]
}

interface FormData {
  name: string
  email: string
  phone: string
  service: string
  message: string
  contactMethod: 'email' | 'phone' | 'either'
}

interface FormErrors {
  name?: string
  email?: string
  message?: string
  turnstile?: string
}

// Turnstile site key from environment
const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

export default function ContactForm({ services }: ContactFormProps) {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    service: '',
    message: '',
    contactMethod: 'either',
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const turnstileRef = useRef<HTMLDivElement>(null)
  const turnstileWidgetId = useRef<string | null>(null)

  // Load and render Turnstile widget
  useEffect(() => {
    if (!TURNSTILE_SITE_KEY || !turnstileRef.current) return

    // Check if Turnstile script is already loaded
    if (typeof window !== 'undefined' && (window as unknown as { turnstile?: TurnstileAPI }).turnstile) {
      renderWidget()
      return
    }

    // Load Turnstile script
    const script = document.createElement('script')
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
    script.async = true
    script.onload = () => renderWidget()
    document.head.appendChild(script)

    return () => {
      // Cleanup widget on unmount
      if (turnstileWidgetId.current && (window as unknown as { turnstile?: TurnstileAPI }).turnstile) {
        try {
          (window as unknown as { turnstile: TurnstileAPI }).turnstile.remove(turnstileWidgetId.current)
        } catch {
          // Widget may already be removed
        }
      }
    }
  }, [])

  interface TurnstileAPI {
    render: (container: HTMLElement, options: {
      sitekey: string
      callback: (token: string) => void
      'expired-callback': () => void
      'error-callback': () => void
      theme?: 'light' | 'dark' | 'auto'
    }) => string
    reset: (widgetId: string) => void
    remove: (widgetId: string) => void
  }

  const renderWidget = () => {
    if (!turnstileRef.current || !TURNSTILE_SITE_KEY) return
    if (turnstileWidgetId.current) return // Already rendered

    const turnstile = (window as unknown as { turnstile?: TurnstileAPI }).turnstile
    if (!turnstile) return

    turnstileWidgetId.current = turnstile.render(turnstileRef.current, {
      sitekey: TURNSTILE_SITE_KEY,
      callback: (token: string) => {
        setTurnstileToken(token)
        setErrors((prev) => ({ ...prev, turnstile: undefined }))
      },
      'expired-callback': () => {
        setTurnstileToken(null)
      },
      'error-callback': () => {
        setTurnstileToken(null)
        setErrors((prev) => ({ ...prev, turnstile: 'Verification failed. Please try again.' }))
      },
      theme: 'light',
    })
  }

  const resetTurnstile = () => {
    setTurnstileToken(null)
    if (turnstileWidgetId.current && (window as unknown as { turnstile?: TurnstileAPI }).turnstile) {
      try {
        (window as unknown as { turnstile: TurnstileAPI }).turnstile.reset(turnstileWidgetId.current)
      } catch {
        // Widget may not exist
      }
    }
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Please describe your project'
    } else if (formData.message.trim().length < 20) {
      newErrors.message = 'Please provide more details about your project'
    }

    // Turnstile validation (only if configured)
    if (TURNSTILE_SITE_KEY && !turnstileToken) {
      newErrors.turnstile = 'Please complete the verification'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsSubmitting(true)
    setSubmitStatus('idle')
    setErrorMessage('')

    try {
      const response = await fetch('/api/crm/lead', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: formData.name,
          email: formData.email,
          phone: formData.phone,
          serviceType: formData.service,
          message: formData.message,
          formId: 'contact-page',
          turnstileToken: turnstileToken,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        // Handle specific error cases
        if (response.status === 429) {
          setErrorMessage('Too many requests. Please wait a moment and try again.')
        } else if (response.status === 403) {
          setErrorMessage('Verification failed. Please refresh and try again.')
          resetTurnstile()
        } else {
          setErrorMessage(result.error || 'Something went wrong. Please try again.')
        }
        setSubmitStatus('error')
        return
      }

      setSubmitStatus('success')
      setFormData({
        name: '',
        email: '',
        phone: '',
        service: '',
        message: '',
        contactMethod: 'either',
      })
      resetTurnstile()
    } catch {
      setErrorMessage('Network error. Please check your connection and try again.')
      setSubmitStatus('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }))
    }
  }

  if (submitStatus === 'success') {
    return (
      <div className="bg-primary-50 rounded-xl p-8 text-center">
        <CheckCircle className="h-16 w-16 text-primary mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-dark mb-2 font-heading">Thank You!</h3>
        <p className="text-secondary mb-6">
          We&apos;ve received your message and will be in touch within 24 hours.
        </p>
        <button
          onClick={() => setSubmitStatus('idle')}
          className="text-primary font-medium hover:text-primary-700 transition-colors"
        >
          Send another message
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {submitStatus === 'error' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-red-800">Something went wrong</p>
            <p className="text-sm text-red-600">
              {errorMessage || 'Please try again or contact us directly by phone.'}
            </p>
          </div>
        </div>
      )}

      {/* Name */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-dark mb-1">
          Full Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className={`w-full px-4 py-3 rounded-lg border ${
            errors.name ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-primary'
          } focus:outline-none focus:ring-2 focus:border-transparent transition-colors`}
          placeholder="John Smith"
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-500">{errors.name}</p>
        )}
      </div>

      {/* Email */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-dark mb-1">
          Email Address <span className="text-red-500">*</span>
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          className={`w-full px-4 py-3 rounded-lg border ${
            errors.email ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-primary'
          } focus:outline-none focus:ring-2 focus:border-transparent transition-colors`}
          placeholder="john@example.com"
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-500">{errors.email}</p>
        )}
      </div>

      {/* Phone */}
      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-dark mb-1">
          Phone Number
        </label>
        <input
          type="tel"
          id="phone"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
          placeholder="(555) 123-4567"
        />
      </div>

      {/* Service */}
      <div>
        <label htmlFor="service" className="block text-sm font-medium text-dark mb-1">
          Service Interested In
        </label>
        <select
          id="service"
          name="service"
          value={formData.service}
          onChange={handleChange}
          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors bg-white"
        >
          <option value="">Select a service...</option>
          {services.map((service) => (
            <option key={service._id} value={service._id}>
              {service.name}
            </option>
          ))}
          <option value="other">Other / Not Sure</option>
        </select>
      </div>

      {/* Message */}
      <div>
        <label htmlFor="message" className="block text-sm font-medium text-dark mb-1">
          Project Description <span className="text-red-500">*</span>
        </label>
        <textarea
          id="message"
          name="message"
          value={formData.message}
          onChange={handleChange}
          rows={5}
          className={`w-full px-4 py-3 rounded-lg border ${
            errors.message ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-primary'
          } focus:outline-none focus:ring-2 focus:border-transparent transition-colors resize-none`}
          placeholder="Tell us about your landscaping project, timeline, and any specific requirements..."
        />
        {errors.message && (
          <p className="mt-1 text-sm text-red-500">{errors.message}</p>
        )}
      </div>

      {/* Contact Method */}
      <div>
        <label className="block text-sm font-medium text-dark mb-3">
          Preferred Contact Method
        </label>
        <div className="flex flex-wrap gap-4">
          {[
            { value: 'email', label: 'Email' },
            { value: 'phone', label: 'Phone' },
            { value: 'either', label: 'Either' },
          ].map((option) => (
            <label
              key={option.value}
              className="flex items-center gap-2 cursor-pointer"
            >
              <input
                type="radio"
                name="contactMethod"
                value={option.value}
                checked={formData.contactMethod === option.value}
                onChange={handleChange}
                className="w-4 h-4 text-primary border-gray-300 focus:ring-primary"
              />
              <span className="text-dark">{option.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Turnstile Widget */}
      {TURNSTILE_SITE_KEY && (
        <div>
          <div ref={turnstileRef} className="flex justify-center" />
          {errors.turnstile && (
            <p className="mt-2 text-sm text-red-500 text-center">{errors.turnstile}</p>
          )}
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-4 bg-accent text-dark font-semibold rounded-lg hover:bg-accent-600 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Sending...
          </>
        ) : (
          'Send Message'
        )}
      </button>

      <p className="text-xs text-secondary text-center">
        By submitting this form, you agree to be contacted about your project.
      </p>
    </form>
  )
}
