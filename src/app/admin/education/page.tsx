'use client'

import { useState, useEffect } from 'react'
import { useEducationTranslation } from '@/hooks/useEducationTranslation'
import { useAuth } from '@/context/AuthContext'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  GraduationCap, BookOpen, Users, DollarSign, Clock,
  CheckCircle, XCircle, Eye, AlertTriangle, BarChart3
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { EducationCourse, EducationAdminStats } from '@/types/education'
import { format } from 'date-fns'

export default function AdminEducationPage() {
  const { te } = useEducationTranslation()
  const { token } = useAuth()
  const [stats, setStats] = useState<EducationAdminStats | null>(null)
  const [pendingCourses, setPendingCourses] = useState<EducationCourse[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCourse, setSelectedCourse] = useState<EducationCourse | null>(null)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const res = await fetch('/api/education/admin/stats', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setStats(data.stats)
      setPendingCourses(data.pendingCourses || [])
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (courseId: string) => {
    setActionLoading(true)
    try {
      const res = await fetch(`/api/education/courses/${courseId}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        setPendingCourses(prev => prev.filter(c => c.id !== courseId))
        fetchData()
      }
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setActionLoading(false)
    }
  }

  const handleReject = async () => {
    if (!selectedCourse || !rejectionReason) return
    setActionLoading(true)
    try {
      const res = await fetch(`/api/education/courses/${selectedCourse.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reason: rejectionReason })
      })
      if (res.ok) {
        setPendingCourses(prev => prev.filter(c => c.id !== selectedCourse.id))
        setShowRejectDialog(false)
        setRejectionReason('')
        setSelectedCourse(null)
        fetchData()
      }
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-primary/10">
          <GraduationCap className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">{te('education.admin.title')}</h1>
          <p className="text-xs text-muted-foreground">{te('education.subtitle')}</p>
        </div>
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard
            icon={BookOpen}
            label={te('education.admin.stats.totalCourses')}
            value={stats.totalCourses}
            color="text-primary"
          />
          <StatCard
            icon={BarChart3}
            label={te('education.admin.stats.activeCourses')}
            value={stats.activeCourses}
            color="text-mint-500"
          />
          <StatCard
            icon={Users}
            label={te('education.admin.stats.totalStudents')}
            value={stats.totalStudents}
            color="text-sky-500"
          />
          <StatCard
            icon={GraduationCap}
            label={te('education.admin.stats.totalInstructors')}
            value={stats.totalInstructors}
            color="text-purple-500"
          />
          <StatCard
            icon={DollarSign}
            label={te('education.admin.stats.totalRevenue')}
            value={`$${stats.totalRevenue.toFixed(0)}`}
            color="text-green-500"
          />
          <StatCard
            icon={AlertTriangle}
            label={te('education.admin.stats.pendingApprovals')}
            value={stats.pendingApprovals}
            color="text-banana-500"
            highlight={stats.pendingApprovals > 0}
          />
        </div>
      )}

      {/* Pending Approvals */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-banana-500" />
          {te('education.admin.pendingApprovals')}
          {pendingCourses.length > 0 && (
            <Badge variant="destructive" className="text-xs">{pendingCourses.length}</Badge>
          )}
        </h2>

        {pendingCourses.length === 0 ? (
          <Card className="border-border/50">
            <CardContent className="p-8 text-center">
              <CheckCircle className="w-12 h-12 text-green-500/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                {te('education.course.noCoursesFound')}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {pendingCourses.map(course => (
              <Card key={course.id} className="border-border/50 border-l-4 border-l-banana-500">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 flex-shrink-0 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 overflow-hidden">
                      {course.thumbnail_url ? (
                        <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <BookOpen className="w-6 h-6 text-primary/30" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground">{course.title}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {course.description}
                      </p>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-2">
                        <span>{(course as EducationCourse & { instructor?: { display_name: string } }).instructor?.display_name || '—'}</span>
                        <span>{te(`education.categories.${course.category}`)}</span>
                        <span>{te(`education.levels.${course.level}`)}</span>
                        <span>{course.total_classes} {te('education.session.title')}</span>
                        <span>${course.price_usd}</span>
                        <span>{format(new Date(course.created_at), 'PP')}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white h-8"
                        onClick={() => handleApprove(course.id)}
                        disabled={actionLoading}
                      >
                        <CheckCircle className="w-3.5 h-3.5 mr-1" />
                        {te('education.admin.approve')}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="h-8"
                        onClick={() => {
                          setSelectedCourse(course)
                          setShowRejectDialog(true)
                        }}
                        disabled={actionLoading}
                      >
                        <XCircle className="w-3.5 h-3.5 mr-1" />
                        {te('education.admin.reject')}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-500" />
              {te('education.admin.reject')}: {selectedCourse?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{te('education.admin.rejectionReason')}</label>
              <Textarea
                value={rejectionReason}
                onChange={e => setRejectionReason(e.target.value)}
                rows={4}
                placeholder={te('education.admin.rejectionReason')}
              />
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowRejectDialog(false)
                  setRejectionReason('')
                }}
              >
                {te('education.form.cancel')}
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={handleReject}
                disabled={!rejectionReason || actionLoading}
              >
                {te('education.admin.reject')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  highlight
}: {
  icon: typeof BookOpen
  label: string
  value: number | string
  color: string
  highlight?: boolean
}) {
  return (
    <Card className={cn(
      'border-border/50',
      highlight && 'border-banana-500/50 bg-banana-50/50 dark:bg-banana-900/10'
    )}>
      <CardContent className="p-4 text-center">
        <Icon className={cn('w-6 h-6 mx-auto mb-1', color)} />
        <p className="text-xl font-bold text-foreground">{value}</p>
        <p className="text-[10px] text-muted-foreground leading-tight">{label}</p>
      </CardContent>
    </Card>
  )
}
