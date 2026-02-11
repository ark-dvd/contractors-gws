'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { SessionProvider, useSession, signIn, signOut } from 'next-auth/react'
import {
  LayoutDashboard,
  FolderKanban,
  Wrench,
  Star,
  ClipboardList,
  HelpCircle,
  Settings,
  LogOut,
  Menu,
  X,
  HardHat,
  Loader2,
  Users,
  UserCheck,
  Briefcase,
  Kanban,
  Cog,
} from 'lucide-react'
import AdminDashboard from '@/components/admin/AdminDashboard'
import ProjectsTab from '@/components/admin/ProjectsTab'
import ServicesTab from '@/components/admin/ServicesTab'
import TestimonialsTab from '@/components/admin/TestimonialsTab'
import ActiveJobsTab from '@/components/admin/ActiveJobsTab'
import SiteSettingsTab from '@/components/admin/SiteSettingsTab'
import FaqsTab from '@/components/admin/FaqsTab'

// CRM Components
import {
  CrmDashboard,
  LeadTable,
  ClientTable,
  DealTable,
  PipelineView,
  CrmSettings,
  GlobalSearch,
} from '@/components/admin/crm'

// Tab configuration - Website section
const WEBSITE_TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'projects', label: 'Projects', icon: FolderKanban },
  { id: 'services', label: 'Services', icon: Wrench },
  { id: 'testimonials', label: 'Testimonials', icon: Star },
  { id: 'jobs', label: 'Active Jobs', icon: ClipboardList },
  { id: 'faqs', label: 'FAQ', icon: HelpCircle },
  { id: 'settings', label: 'Settings', icon: Settings },
] as const

// Tab configuration - CRM section
const CRM_TABS = [
  { id: 'crm-dashboard', label: 'CRM Overview', icon: LayoutDashboard },
  { id: 'crm-leads', label: 'Leads', icon: Users },
  { id: 'crm-clients', label: 'Clients', icon: UserCheck },
  { id: 'crm-deals', label: 'Projects', icon: Briefcase },
  { id: 'crm-pipeline', label: 'Pipeline', icon: Kanban },
  { id: 'crm-settings', label: 'CRM Settings', icon: Cog },
] as const

// Combined TABS for backward compatibility
const TABS = [...WEBSITE_TABS, ...CRM_TABS] as const

type TabId = typeof TABS[number]['id']

// Placeholder components for tabs not yet built
function PlaceholderTab({ name }: { name: string }) {
  return (
    <div className="bg-white rounded-xl p-8 shadow-sm text-center">
      <div className="text-gray-400 mb-4">
        <Settings className="h-12 w-12 mx-auto" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900">{name}</h3>
      <p className="text-gray-500 mt-2">This section is coming soon.</p>
    </div>
  )
}

// Login screen component
function LoginScreen() {
  const [isLoading, setIsLoading] = useState(false)

  const handleSignIn = async () => {
    setIsLoading(true)
    try {
      await signIn('google', { callbackUrl: '/admin' })
    } catch {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <div className="relative bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        {/* Logo / Icon */}
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-amber-500 rounded-2xl shadow-lg">
            <HardHat className="h-12 w-12 text-white" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">
          Admin Portal
        </h1>
        <p className="text-center text-gray-500 mb-8">
          Manage your website, projects, and client pipeline
        </p>

        {/* Sign In Button */}
        <button
          onClick={handleSignIn}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Signing in...
            </>
          ) : (
            <>
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign in with Google
            </>
          )}
        </button>

        {/* Footer note */}
        <p className="text-center text-xs text-gray-400 mt-6">
          Only authorized administrators can access this portal
        </p>
      </div>
    </div>
  )
}

// Loading screen component
function LoadingScreen() {
  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-10 w-10 text-amber-500 animate-spin mx-auto mb-4" />
        <p className="text-gray-500">Loading...</p>
      </div>
    </div>
  )
}

// Main admin shell component
function AdminShell() {
  const { data: session, status } = useSession()
  const [activeTab, setActiveTab] = useState<TabId>('dashboard')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [newLeadsCount, setNewLeadsCount] = useState(0)

  // Fetch new leads count
  useEffect(() => {
    const fetchNewLeadsCount = async () => {
      try {
        const res = await fetch('/api/crm/leads?status=new&limit=1')
        if (res.ok) {
          const data = await res.json()
          setNewLeadsCount(data.statusCounts?.new || 0)
        }
      } catch (e) {
        console.error('Failed to fetch new leads count:', e)
      }
    }

    if (session) {
      fetchNewLeadsCount()
      // Refresh every 60 seconds
      const interval = setInterval(fetchNewLeadsCount, 60000)
      return () => clearInterval(interval)
    }
  }, [session])

  if (status === 'loading') {
    return <LoadingScreen />
  }

  if (!session) {
    return <LoginScreen />
  }

  const handleNavigate = (tab: string) => {
    setActiveTab(tab as TabId)
    setMobileMenuOpen(false)
  }

  const renderTabContent = () => {
    switch (activeTab) {
      // Website tabs
      case 'dashboard':
        return <AdminDashboard onNavigate={handleNavigate} />
      case 'projects':
        return <ProjectsTab />
      case 'services':
        return <ServicesTab />
      case 'testimonials':
        return <TestimonialsTab />
      case 'jobs':
        return <ActiveJobsTab />
      case 'faqs':
        return <FaqsTab />
      case 'settings':
        return <SiteSettingsTab />
      // CRM tabs
      case 'crm-dashboard':
        return <CrmDashboard onNavigate={handleNavigate} />
      case 'crm-leads':
        return <LeadTable onLeadConverted={() => {}} />
      case 'crm-clients':
        return (
          <ClientTable
            onCreateDeal={() => setActiveTab('crm-deals')}
            onViewDeal={() => setActiveTab('crm-deals')}
          />
        )
      case 'crm-deals':
        return (
          <DealTable
            onViewClient={() => setActiveTab('crm-clients')}
          />
        )
      case 'crm-pipeline':
        return <PipelineView />
      case 'crm-settings':
        return <CrmSettings />
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Top Bar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="flex items-center justify-between px-4 h-16">
          {/* Logo / Site Name */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500 rounded-lg">
              <HardHat className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-gray-900 hidden sm:block">Admin Portal</span>
          </div>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-gray-500 hover:text-gray-700 lg:hidden"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>

          {/* User info & Sign Out */}
          <div className="hidden lg:flex items-center gap-4">
            <div className="flex items-center gap-3">
              {session.user?.image && (
                <Image
                  src={session.user.image}
                  alt=""
                  width={32}
                  height={32}
                  className="h-8 w-8 rounded-full"
                />
              )}
              <span className="text-sm text-gray-700">{session.user?.name}</span>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/admin' })}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex flex-col w-64 bg-slate-900 min-h-[calc(100vh-4rem)] sticky top-16">
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {/* Global Search */}
            <div className="mb-4">
              <GlobalSearch
                onSelectLead={() => setActiveTab('crm-leads')}
                onSelectClient={() => setActiveTab('crm-clients')}
                onSelectDeal={() => setActiveTab('crm-deals')}
              />
            </div>

            {/* Website Section */}
            <div className="mb-2">
              <span className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Website
              </span>
            </div>
            {WEBSITE_TABS.map(tab => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all ${
                    isActive
                      ? 'bg-amber-500 text-white shadow-lg'
                      : 'text-gray-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              )
            })}

            {/* CRM Section */}
            <div className="mt-6 mb-2 pt-4 border-t border-slate-700">
              <span className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                CRM
              </span>
            </div>
            {CRM_TABS.map(tab => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              const showBadge = tab.id === 'crm-leads' && newLeadsCount > 0
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all ${
                    isActive
                      ? 'bg-[#fe5557] text-white shadow-lg'
                      : 'text-gray-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium flex-1">{tab.label}</span>
                  {showBadge && (
                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                      isActive ? 'bg-white/20 text-white' : 'bg-[#fe5557] text-white'
                    }`}>
                      {newLeadsCount}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>

          {/* Sidebar footer with user info */}
          <div className="p-4 border-t border-slate-700">
            <div className="flex items-center gap-3 mb-3">
              {session.user?.image && (
                <Image
                  src={session.user.image}
                  alt=""
                  width={40}
                  height={40}
                  className="h-10 w-10 rounded-full"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{session.user?.name}</p>
                <p className="text-xs text-gray-400 truncate">{session.user?.email}</p>
              </div>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/admin' })}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </aside>

        {/* Mobile menu overlay */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-30 lg:hidden">
            <div className="absolute inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
            <div className="absolute top-16 left-0 right-0 bg-white border-b shadow-lg p-4 space-y-2 max-h-[calc(100vh-4rem)] overflow-y-auto">
              {/* Website Section */}
              <div className="mb-1">
                <span className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Website
                </span>
              </div>
              {WEBSITE_TABS.map(tab => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleNavigate(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all ${
                      isActive
                        ? 'bg-amber-500 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                )
              })}

              {/* CRM Section */}
              <div className="mt-4 mb-1 pt-3 border-t border-gray-200">
                <span className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  CRM
                </span>
              </div>
              {CRM_TABS.map(tab => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id
                const showBadge = tab.id === 'crm-leads' && newLeadsCount > 0
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleNavigate(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all ${
                      isActive
                        ? 'bg-[#fe5557] text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium flex-1">{tab.label}</span>
                    {showBadge && (
                      <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                        isActive ? 'bg-white/20 text-white' : 'bg-[#fe5557] text-white'
                      }`}>
                        {newLeadsCount}
                      </span>
                    )}
                  </button>
                )
              })}

              <hr className="my-2" />
              <div className="flex items-center gap-3 px-4 py-2">
                {session.user?.image && (
                  <Image
                    src={session.user.image}
                    alt=""
                    width={32}
                    height={32}
                    className="h-8 w-8 rounded-full"
                  />
                )}
                <span className="text-sm text-gray-700">{session.user?.name}</span>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: '/admin' })}
                className="w-full flex items-center gap-2 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="h-5 w-5" />
                Sign Out
              </button>
            </div>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-8 pb-24 lg:pb-8">
          {/* Page title */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              {TABS.find(t => t.id === activeTab)?.label}
            </h1>
          </div>

          {/* Tab content */}
          {renderTabContent()}
        </main>
      </div>

      {/* Mobile Bottom Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 lg:hidden z-40">
        <div className="flex items-center justify-around h-16">
          {/* Website Dashboard */}
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
              activeTab === 'dashboard' ? 'text-amber-500' : 'text-gray-400'
            }`}
          >
            <LayoutDashboard className="h-5 w-5" />
            <span className="text-xs mt-1 font-medium">Home</span>
          </button>
          {/* CRM Dashboard */}
          <button
            onClick={() => setActiveTab('crm-dashboard')}
            className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
              activeTab === 'crm-dashboard' ? 'text-[#fe5557]' : 'text-gray-400'
            }`}
          >
            <Users className="h-5 w-5" />
            <span className="text-xs mt-1 font-medium">CRM</span>
          </button>
          {/* Leads */}
          <button
            onClick={() => setActiveTab('crm-leads')}
            className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
              activeTab === 'crm-leads' ? 'text-[#fe5557]' : 'text-gray-400'
            }`}
          >
            <Users className="h-5 w-5" />
            <span className="text-xs mt-1 font-medium">Leads</span>
          </button>
          {/* Deals/Projects */}
          <button
            onClick={() => setActiveTab('crm-deals')}
            className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
              activeTab === 'crm-deals' ? 'text-[#fe5557]' : 'text-gray-400'
            }`}
          >
            <Briefcase className="h-5 w-5" />
            <span className="text-xs mt-1 font-medium">Projects</span>
          </button>
          {/* Settings (opens mobile menu) */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className={`flex flex-col items-center justify-center flex-1 h-full transition-colors text-gray-400`}
          >
            <Menu className="h-5 w-5" />
            <span className="text-xs mt-1 font-medium">More</span>
          </button>
        </div>
      </nav>
    </div>
  )
}

// Main page with SessionProvider wrapper
export default function AdminPage() {
  return (
    <SessionProvider>
      <AdminShell />
    </SessionProvider>
  )
}
