'use client'

import { useState, useEffect } from 'react'
import { useEducationTranslation } from '@/hooks/useEducationTranslation'
import { useAuth } from '@/context/AuthContext'
import { Card, CardContent } from '@/components/ui/card'
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
  CheckCircle, XCircle, Eye, AlertTriangle, BarChart3,
  MessageSquare, Calendar, Globe, Star, Send
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { EducationCourse, EducationAdminStats } from '@/types/education'
import { format } from 'date-fns'

type ReviewAction = 'reject' | 'changes'

export default function AdminEducationPage() {
  const { te } = useEducationTranslation()
  const { token } = useAuth()
  const [stats, setStats] = useState<EducationAdminStats | null>(null)
  const [pendingCourses, setPendingCourses] = useState<EducationCourse[]>([])
  const [approvedCourses, setApprovedCourses] = useState<EducationCourse[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCourse, setSelectedCourse] = useState<EducationCourse | null>(null)
  const [previewCourse, setPreviewCourse] = useState<EducationCourse | null>(null)
  const [reviewAction, setReviewAction] = useState<ReviewAction | null>(null)
  const [reasonText, setReasonText] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    if (!token) return
    fetchData()
  }, [token])

  const fetchData = async () => {
    if (!token) return
    try {
      const res = await fetch('/api/education/admin/stats', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) {
        throw new Error(`Failed to fetch admin stats (${res.status})`)
      }
      const data = await res.json()
      setStats(data.stats)
      setPendingCourses(data.pendingCourses || [])
      setApprovedCourses(data.approvedCourses || [])
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (courseId: string) => {
    if (!token) return
    setActionLoading(true)
    try {
      const res = await fetch(`/api/education/courses/${courseId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      })
      if (res.ok) {
        setPendingCourses(prev => prev.filter(c => c.id !== courseId))
        setPreviewCourse(null)
        fetchData()
      }
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setActionLoading(false)
    }
  }

  const handleReject = async () => {
    if (!selectedCourse || !reasonText || !token) return
    setActionLoading(true)
    try {
      const res = await fetch(`/api/education/courses/${selectedCourse.id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ reason: reasonText })
      })
      if (res.ok) {
        setPendingCourses(prev => prev.filter(c => c.id !== selectedCourse.id))
        closeReviewDialog()
        fetchData()
      }
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setActionLoading(false)
    }
  }

  const handleRequestChanges = async () => {
    if (!selectedCourse || !reasonText || !token) return
    setActionLoading(true)
    try {
      const res = await fetch(`/api/education/courses/${selectedCourse.id}/request-changes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ reason: reasonText })
      })
      if (res.ok) {
        setPendingCourses(prev => prev.filter(c => c.id !== selectedCourse.id))
        closeReviewDialog()
        fetchData()
      }
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setActionLoading(false)
    }
  }

  const closeReviewDialog = () => {
    setReviewAction(null)
    setReasonText('')
    setSelectedCourse(null)
  }

  const handlePublish = async (courseId: string) => {
    if (!token) return
    setActionLoading(true)
    try {
      const res = await fetch(`/api/education/courses/${courseId}/publish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      })
      if (res.ok) {
        setApprovedCourses(prev => prev.filter(c => c.id !== courseId))
        fetchData()
      }
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setActionLoading(false)
    }
  }

  if (!token || loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
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
          <StatCard icon={BookOpen} label={te('education.admin.stats.totalCourses')} value={stats.totalCourses} color="text-primary" />
          <StatCard icon={BarChart3} label={te('education.admin.stats.activeCourses')} value={stats.activeCourses} color="text-green-500" />
          <StatCard icon={Users} label={te('education.admin.stats.totalStudents')} value={stats.totalStudents} color="text-sky-500" />
          <StatCard icon={GraduationCap} label={te('education.admin.stats.totalInstructors')} value={stats.totalInstructors} color="text-purple-500" />
          <StatCard icon={DollarSign} label={te('education.admin.stats.totalRevenue')} value={`$${stats.totalRevenue.toFixed(0)}`} color="text-green-500" />
          <StatCard icon={AlertTriangle} label={te('education.admin.stats.pendingApprovals')} value={stats.pendingApprovals} color="text-yellow-500" highlight={stats.pendingApprovals > 0} />
        </div>
      )}

      {/* Pending Approvals */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-yellow-500" />
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
                {te('education.admin.noPending')}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {pendingCourses.map(course => {
              const instructor = (course as EducationCourse & { instructor?: { display_name: string; photo_url?: string } }).instructor
              return (
                <Card key={course.id} className="border-border/50 border-l-4 border-l-yellow-500">
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row items-start gap-4">
                      {/* Thumbnail */}
                      <div className="w-full sm:w-24 h-20 sm:h-24 flex-shrink-0 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 overflow-hidden">
                        {course.thumbnail_url ? (
                          <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <BookOpen className="w-8 h-8 text-primary/30" />
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className="font-semibold text-foreground">{course.title}</h3>
                          <Badge className="text-[10px] bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300 flex-shrink-0">
                            {te('education.course.status.submitted_for_review')}
                          </Badge>
                        </div>

                        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                          {course.description}
                        </p>

                        {/* Meta info */}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground mb-3">
                          <span className="flex items-center gap-1">
                            <GraduationCap className="w-3 h-3" />
                            {instructor?.display_name || '—'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Star className="w-3 h-3" />
                            {te(`education.categories.${course.category}`)}
                          </span>
                          <span className="flex items-center gap-1">
                            <BarChart3 className="w-3 h-3" />
                            {te(`education.levels.${course.level}`)}
                          </span>
                          <span className="flex items-center gap-1">
                            <BookOpen className="w-3 h-3" />
                            {course.total_classes} {te('education.session.title')}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {course.class_duration_minutes}min
                          </span>
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            ${course.price_usd}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {te('education.course.maxStudents')}: {course.max_students}
                          </span>
                          <span className="flex items-center gap-1">
                            <Globe className="w-3 h-3" />
                            {course.teaching_language}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(course.created_at), 'dd/MM/yyyy')}
                          </span>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs"
                            onClick={() => setPreviewCourse(course)}
                          >
                            <Eye className="w-3.5 h-3.5 mr-1" />
                            {te('education.admin.preview')}
                          </Button>
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white h-8 text-xs"
                            onClick={() => handleApprove(course.id)}
                            disabled={actionLoading}
                          >
                            <CheckCircle className="w-3.5 h-3.5 mr-1" />
                            {te('education.admin.approve')}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs border-orange-300 text-orange-600 hover:bg-orange-50 dark:border-orange-700 dark:text-orange-400 dark:hover:bg-orange-900/20"
                            onClick={() => {
                              setSelectedCourse(course)
                              setReviewAction('changes')
                            }}
                            disabled={actionLoading}
                          >
                            <MessageSquare className="w-3.5 h-3.5 mr-1" />
                            {te('education.admin.requestChanges')}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="h-8 text-xs"
                            onClick={() => {
                              setSelectedCourse(course)
                              setReviewAction('reject')
                            }}
                            disabled={actionLoading}
                          >
                            <XCircle className="w-3.5 h-3.5 mr-1" />
                            {te('education.admin.reject')}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Approved — Waiting for Instructor to Publish */}
      {approvedCourses.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Send className="w-5 h-5 text-green-500" />
            Aprobados — en espera de publicación
            <Badge className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
              {approvedCourses.length}
            </Badge>
          </h2>
          <div className="space-y-3">
            {approvedCourses.map(course => {
              const instructor = (course as EducationCourse & { instructor?: { display_name: string; photo_url?: string } }).instructor
              return (
                <Card key={course.id} className="border-border/50 border-l-4 border-l-green-500">
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row items-start gap-4">
                      <div className="w-full sm:w-24 h-20 sm:h-24 flex-shrink-0 rounded-lg bg-gradient-to-br from-green-500/20 to-green-500/5 overflow-hidden">
                        {course.thumbnail_url ? (
                          <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <BookOpen className="w-8 h-8 text-green-500/30" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className="font-semibold text-foreground">{course.title}</h3>
                          <Badge className="text-[10px] bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 flex-shrink-0">
                            Aprobado
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{course.description}</p>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground mb-3">
                          <span className="flex items-center gap-1">
                            <GraduationCap className="w-3 h-3" />
                            {instructor?.display_name || '—'}
                          </span>
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            ${course.price_usd}
                          </span>
                          <span className="flex items-center gap-1">
                            <BookOpen className="w-3 h-3" />
                            {course.total_classes} sesiones
                          </span>
                          <span className="flex items-center gap-1">
                            <Globe className="w-3 h-3" />
                            {course.teaching_language}
                          </span>
                        </div>
                        <p className="text-xs text-green-600 dark:text-green-400 mb-2">
                          ✅ Aprobado por el equipo AMIKO. Esperando que el instructor publique el curso.
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs"
                            onClick={() => setPreviewCourse(course)}
                          >
                            <Eye className="w-3.5 h-3.5 mr-1" />
                            Vista previa
                          </Button>
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white h-8 text-xs"
                            onClick={() => handlePublish(course.id)}
                            disabled={actionLoading}
                          >
                            <Send className="w-3.5 h-3.5 mr-1" />
                            Forzar publicación
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* Course Preview Dialog */}
      <Dialog open={!!previewCourse} onOpenChange={() => setPreviewCourse(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-primary" />
              {te('education.admin.preview')}: {previewCourse?.title}
            </DialogTitle>
          </DialogHeader>
          {previewCourse && (
            <div className="space-y-4">
              {/* Course Info */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">{te('education.form.category')}:</span>
                  <span className="ml-2 font-medium">{te(`education.categories.${previewCourse.category}`)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">{te('education.form.level')}:</span>
                  <span className="ml-2 font-medium">{te(`education.levels.${previewCourse.level}`)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">{te('education.form.price')}:</span>
                  <span className="ml-2 font-medium">${previewCourse.price_usd} USD</span>
                </div>
                <div>
                  <span className="text-muted-foreground">{te('education.form.language')}:</span>
                  <span className="ml-2 font-medium">{previewCourse.teaching_language}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">{te('education.form.totalClasses')}:</span>
                  <span className="ml-2 font-medium">{previewCourse.total_classes}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">{te('education.course.maxStudents')}:</span>
                  <span className="ml-2 font-medium">{previewCourse.max_students}</span>
                </div>
              </div>

              {/* Description */}
              <div>
                <h4 className="font-medium text-sm text-foreground mb-1">{te('education.form.description')}</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted/50 rounded-lg p-3">
                  {previewCourse.description}
                </p>
              </div>

              {/* Objectives */}
              {previewCourse.objectives && (
                <div>
                  <h4 className="font-medium text-sm text-foreground mb-1">{te('education.form.objectives')}</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted/50 rounded-lg p-3">
                    {previewCourse.objectives}
                  </p>
                </div>
              )}

              {/* Action buttons inside preview */}
              <div className="flex gap-2 pt-2 border-t border-border">
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => handleApprove(previewCourse.id)}
                  disabled={actionLoading}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {te('education.admin.approve')}
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 border-orange-300 text-orange-600 hover:bg-orange-50 dark:border-orange-700 dark:text-orange-400 dark:hover:bg-orange-900/20"
                  onClick={() => {
                    setSelectedCourse(previewCourse)
                    setPreviewCourse(null)
                    setReviewAction('changes')
                  }}
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  {te('education.admin.requestChanges')}
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={() => {
                    setSelectedCourse(previewCourse)
                    setPreviewCourse(null)
                    setReviewAction('reject')
                  }}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  {te('education.admin.reject')}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject / Request Changes Dialog */}
      <Dialog open={!!reviewAction} onOpenChange={() => closeReviewDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {reviewAction === 'reject' ? (
                <XCircle className="w-5 h-5 text-red-500" />
              ) : (
                <MessageSquare className="w-5 h-5 text-orange-500" />
              )}
              {reviewAction === 'reject'
                ? te('education.admin.reject')
                : te('education.admin.requestChanges')
              }: {selectedCourse?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                {reviewAction === 'reject'
                  ? te('education.admin.rejectionReason')
                  : te('education.admin.changesDescription')
                }
              </label>
              <Textarea
                value={reasonText}
                onChange={e => setReasonText(e.target.value)}
                rows={4}
                placeholder={
                  reviewAction === 'reject'
                    ? te('education.admin.rejectionPlaceholder')
                    : te('education.admin.changesPlaceholder')
                }
              />
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={closeReviewDialog}
              >
                {te('education.form.cancel')}
              </Button>
              {reviewAction === 'reject' ? (
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={handleReject}
                  disabled={!reasonText || actionLoading}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  {te('education.admin.reject')}
                </Button>
              ) : (
                <Button
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
                  onClick={handleRequestChanges}
                  disabled={!reasonText || actionLoading}
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  {te('education.admin.requestChanges')}
                </Button>
              )}
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
