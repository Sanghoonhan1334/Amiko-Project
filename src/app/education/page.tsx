'use client'

import { useState, useEffect, Suspense, ComponentType } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { useAuth } from '@/context/AuthContext'
import { useEducationTranslation } from '@/hooks/useEducationTranslation'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { GraduationCap, Store, BookOpen, Users, LayoutDashboard } from 'lucide-react'
import { cn } from '@/lib/utils'

// Lazy load tab components
const MarketplaceTab = dynamic(() => import('@/components/education/MarketplaceTab'), {
  loading: () => <TabSkeleton />,
  ssr: false
})

const StudentDashboardTab = dynamic(() => import('@/components/education/StudentDashboardTab'), {
  loading: () => <TabSkeleton />,
  ssr: false
})

const InstructorDashboardTab = dynamic(() => import('@/components/education/InstructorDashboardTab'), {
  loading: () => <TabSkeleton />,
  ssr: false
}) as ComponentType<{ instructorId: string | null; onProfileCreated?: (profile: { id: string }) => void }>

function TabSkeleton() {
  return (
    <div className="space-y-4 p-4">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <Skeleton key={i} className="h-64 rounded-xl" />
        ))}
      </div>
    </div>
  )
}

function EducationContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user } = useAuth()
  const { te } = useEducationTranslation()

  const tabParam = searchParams.get('tab') || 'marketplace'
  const [activeTab, setActiveTab] = useState(tabParam)
  const [instructorProfile, setInstructorProfile] = useState<{ id: string } | null>(null)

  useEffect(() => {
    setActiveTab(tabParam)
  }, [tabParam])

  // Check if user is an instructor
  useEffect(() => {
    if (user?.id) {
      fetch(`/api/education/instructor?userId=${user.id}`)
        .then(res => res.json())
        .then(data => {
          if (data.instructor) {
            setInstructorProfile(data.instructor)
          }
        })
        .catch(() => {})
    }
  }, [user?.id])

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    router.push(`/education?tab=${tab}`, { scroll: false })
  }

  const tabs = [
    { id: 'marketplace', label: te('education.marketplace'), icon: Store },
    { id: 'my-courses', label: te('education.myCourses'), icon: BookOpen, requireAuth: true },
    {
      id: 'instructor',
      label: instructorProfile ? te('education.instructorDashboard') : te('education.becomeInstructor'),
      icon: instructorProfile ? LayoutDashboard : Users,
      requireAuth: true
    }
  ]

  return (
    <div className="min-h-screen body-gradient bg-white dark:bg-transparent pb-20 md:pb-0">
      <div className="w-full max-w-6xl mx-auto px-2 sm:px-4 md:px-8 lg:px-16 xl:px-24 py-0 sm:py-2 md:py-6 relative z-0">
        {/* Desktop wrapper */}
        <div className="hidden md:block pt-20 sm:pt-36">
          <div className="w-full">
            <div className="card p-8 pt-12 -mt-12 sm:mt-0">
              {/* Header */}
              <div className="flex items-center justify-between mb-2 sm:mb-0 md:mb-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                    <GraduationCap className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-100">
                      {te('education.title')}
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {te('education.subtitle')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="mt-4 mb-4">
                <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                  <TabsList className={cn('w-full h-9', `grid grid-cols-${tabs.filter(t => !t.requireAuth || user).length}`)}>
                    {tabs.map(tab => {
                      if (tab.requireAuth && !user) return null
                      const Icon = tab.icon
                      return (
                        <TabsTrigger key={tab.id} value={tab.id} className="text-xs">
                          <Icon className="w-3 h-3 mr-1 hidden sm:block" />
                          {tab.label}
                        </TabsTrigger>
                      )
                    })}
                  </TabsList>
                </Tabs>
              </div>

              {/* Content */}
              <div className="mt-3">
                {activeTab === 'marketplace' && <MarketplaceTab />}
                {activeTab === 'my-courses' && user && <StudentDashboardTab />}
                {activeTab === 'instructor' && user && (
                  <InstructorDashboardTab
                    instructorId={instructorProfile?.id || null}
                    onProfileCreated={(profile) => setInstructorProfile(profile)}
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile wrapper */}
        <div className="block md:hidden pt-24 pb-20">
          <div className="px-1 space-y-4">
            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">
                  {te('education.title')}
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {te('education.subtitle')}
                </p>
              </div>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
              <TabsList className={cn('w-full h-9', `grid grid-cols-${tabs.filter(t => !t.requireAuth || user).length}`)}>
                {tabs.map(tab => {
                  if (tab.requireAuth && !user) return null
                  const Icon = tab.icon
                  return (
                    <TabsTrigger key={tab.id} value={tab.id} className="text-xs">
                      <Icon className="w-3 h-3 mr-1 hidden sm:block" />
                      {tab.label}
                    </TabsTrigger>
                  )
                })}
              </TabsList>
            </Tabs>

            {/* Content */}
            <div>
              {activeTab === 'marketplace' && <MarketplaceTab />}
              {activeTab === 'my-courses' && user && <StudentDashboardTab />}
              {activeTab === 'instructor' && user && (
                <InstructorDashboardTab
                  instructorId={instructorProfile?.id || null}
                  onProfileCreated={(profile) => setInstructorProfile(profile)}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function EducationPage() {
  return (
    <Suspense fallback={<TabSkeleton />}>
      <EducationContent />
    </Suspense>
  )
}
