'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useEducationTranslation } from '@/hooks/useEducationTranslation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import {
  BookOpen, Calendar, CheckCircle, Clock, GraduationCap,
  ArrowRight, Award, Play, RotateCcw
} from 'lucide-react'
import type { Enrollment } from '@/types/education'

export default function StudentDashboardTab() {
  const { te, language } = useEducationTranslation()
  const { user } = useAuth()
  const router = useRouter()
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'completed'>('all')

  useEffect(() => {
    if (!user?.id) return
    const fetchEnrollments = async () => {
      try {
        const res = await fetch(`/api/education/enroll?studentId=${user.id}`)
        const data = await res.json()
        setEnrollments(data.enrollments || [])
      } catch (err) {
        console.error('Error fetching enrollments:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchEnrollments()
  }, [user?.id])

  const filteredEnrollments = enrollments.filter(e => {
    if (activeFilter === 'all') return true
    return e.enrollment_status === activeFilter
  })

  const activeCount = enrollments.filter(e => e.enrollment_status === 'active').length
  const completedCount = enrollments.filter(e => e.enrollment_status === 'completed').length

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 rounded-xl" />
        <div className="grid gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-40 rounded-xl" />)}
        </div>
      </div>
    )
  }

  if (enrollments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <GraduationCap className="w-20 h-20 text-gray-300 dark:text-gray-600 mb-6" />
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">
          {te('education.student.noCourses')}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          {te('education.subtitle')}
        </p>
        <Button onClick={() => router.push('/education?tab=marketplace')}>
          {te('education.student.exploreMarketplace')}
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    )
  }

  const handleRefund = async (enrollmentId: string) => {
    try {
      const res = await fetch('/api/education/refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enrollment_id: enrollmentId,
          student_id: user?.id
        })
      })
      const data = await res.json()
      if (res.ok) {
        // Remove from list or update status
        setEnrollments(prev =>
          prev.map(e => e.id === enrollmentId
            ? { ...e, enrollment_status: 'refunded' as const, payment_status: 'refunded' as const }
            : e
          )
        )
      } else {
        alert(data.error || 'Error processing refund')
      }
    } catch (err) {
      console.error('Refund error:', err)
      alert('Error processing refund')
    }
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 text-center">
            <BookOpen className="w-6 h-6 text-purple-600 dark:text-purple-400 mx-auto mb-1" />
            <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{enrollments.length}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{te('education.student.myCourses')}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 text-center">
            <Play className="w-6 h-6 text-green-500 mx-auto mb-1" />
            <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{activeCount}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{te('education.course.status.in_progress')}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 text-center">
            <CheckCircle className="w-6 h-6 text-green-500 mx-auto mb-1" />
            <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{completedCount}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{te('education.course.completed')}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 text-center">
            <Award className="w-6 h-6 text-yellow-500 mx-auto mb-1" />
            <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">
              {enrollments.filter(e => e.certificate_issued).length}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{te('education.student.certificate')}</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {(['all', 'active', 'completed'] as const).map(filter => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              activeFilter === filter
                ? 'bg-purple-500 text-white shadow-sm'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {filter === 'all'
              ? te('education.categories.all')
              : filter === 'active'
                ? te('education.course.status.in_progress')
                : te('education.course.completed')
            }
          </button>
        ))}
      </div>

      {/* Enrollment Cards */}
      <div className="space-y-4">
        {filteredEnrollments.map(enrollment => (
          <EnrollmentCard
            key={enrollment.id}
            enrollment={enrollment}
            te={te}
            language={language}
            onClick={() => router.push(`/education/course/${enrollment.course?.slug || enrollment.course_id}`)}
            onRefund={handleRefund}
          />
        ))}
      </div>
    </div>
  )
}

function EnrollmentCard({
  enrollment,
  te,
  language,
  onClick,
  onRefund
}: {
  enrollment: Enrollment
  te: (key: string, params?: Record<string, string | number>) => string
  language: string
  onClick: () => void
  onRefund?: (enrollmentId: string) => void
}) {
  const router = useRouter()
  const course = enrollment.course

  return (
    <div
      className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden cursor-pointer hover:shadow-lg hover:border-purple-200 dark:hover:border-purple-700 transition-all"
      onClick={onClick}
    >
        <div className="flex flex-col sm:flex-row">
          {/* Thumbnail */}
          <div className="sm:w-48 h-32 sm:h-auto bg-gradient-to-br from-purple-400/20 to-blue-400/10 flex-shrink-0">
            {course?.thumbnail_url ? (
              <img
                src={course.thumbnail_url}
                alt={course.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <GraduationCap className="w-10 h-10 text-purple-400" />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-gray-800 dark:text-gray-100 line-clamp-1">
                  {course?.title || '—'}
                </h3>
                {course?.instructor && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {course.instructor.display_name}
                  </p>
                )}
              </div>
              <Badge
                variant={enrollment.enrollment_status === 'completed' ? 'default' : 'secondary'}
                className="text-[10px] flex-shrink-0"
              >
                {enrollment.enrollment_status === 'active'
                  ? te('education.course.enrolled')
                  : te(`education.course.status.${enrollment.enrollment_status}`)
                }
              </Badge>
            </div>

            {/* Progress */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500 dark:text-gray-400">{te('education.student.progress')}</span>
                <span className="font-medium text-gray-800 dark:text-gray-100">{enrollment.progress_percentage}%</span>
              </div>
              <Progress value={enrollment.progress_percentage} className="h-2" />
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                {te('education.student.classesCompleted')}: {enrollment.completed_classes}/{course?.total_classes || 0}
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 pt-1">
              {enrollment.enrollment_status === 'active' && (
                <Button
                  size="sm"
                  variant="default"
                  className="h-7 text-xs"
                  onClick={(e) => {
                    e.stopPropagation()
                    router.push(`/education/course/${enrollment.course_id}`)
                  }}
                >
                  <Calendar className="w-3 h-3 mr-1" />
                  {te('education.viewSchedule')}
                </Button>
              )}
              {enrollment.certificate_issued && enrollment.certificate_url && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={(e) => {
                    e.stopPropagation()
                    if (enrollment.certificate_url?.startsWith('/')) {
                      router.push(enrollment.certificate_url)
                    } else {
                      router.push(`/education/certificate/${enrollment.id}`)
                    }
                  }}
                >
                  <Award className="w-3 h-3 mr-1" />
                  {te('education.student.downloadCertificate')}
                </Button>
              )}
              {enrollment.enrollment_status === 'active' && enrollment.progress_percentage < 50 && onRefund && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                  onClick={(e) => {
                    e.stopPropagation()
                    if (confirm(te('education.cancellation.confirmCancel'))) {
                      onRefund(enrollment.id)
                    }
                  }}
                >
                  <RotateCcw className="w-3 h-3 mr-1" />
                  {te('education.payment.refund')}
                </Button>
              )}
            </div>
          </div>
        </div>
    </div>
  )
}
