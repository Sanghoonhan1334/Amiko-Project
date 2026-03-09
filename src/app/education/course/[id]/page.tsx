'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useEducationTranslation } from '@/hooks/useEducationTranslation'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Star, Users, Clock, BookOpen, GraduationCap, Calendar, Globe,
  CheckCircle, Video, FileText, Download, ExternalLink,
  ArrowLeft, DollarSign, Play, Lock, MessageCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type {
  EducationCourse, EducationSession, CourseReview, CourseMaterial,
  Enrollment, SessionAttendance, CourseCategory
} from '@/types/education'
import { format } from 'date-fns'
import { es, ko } from 'date-fns/locale'

export default function CourseDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { user, token } = useAuth()
  const { te, language } = useEducationTranslation()
  const dateLocale = language === 'ko' ? ko : es

  const [course, setCourse] = useState<EducationCourse & { reviews?: CourseReview[]; materials?: CourseMaterial[] } | null>(null)
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null)
  const [attendance, setAttendance] = useState<SessionAttendance[]>([])
  const [loading, setLoading] = useState(true)
  const [showReviewForm, setShowReviewForm] = useState(false)

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const res = await fetch(`/api/education/courses/${id}`)
        const data = await res.json()
        setCourse(data.course)

        // Check enrollment
        if (user?.id && data.course?.id) {
          const enrollRes = await fetch(`/api/education/enroll?courseId=${data.course.id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
          const enrollData = await enrollRes.json()
          if (enrollData.enrollments?.length > 0) {
            setEnrollment(enrollData.enrollments[0])
          }

          // Get attendance
          const attRes = await fetch(`/api/education/attendance?studentId=${user.id}&courseId=${data.course.id}`)
          const attData = await attRes.json()
          setAttendance(attData.attendance || [])
        }
      } catch (err) {
        console.error('Error:', err)
      } finally {
        setLoading(false)
      }
    }
    if (id) fetchCourse()
  }, [id, user?.id, token])

  if (loading) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    )
  }

  if (!course) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-20 text-center">
        <GraduationCap className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
        <p className="text-lg text-muted-foreground">{te('education.course.noCoursesFound')}</p>
        <Button variant="outline" onClick={() => router.back()} className="mt-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          {te('education.form.cancel')}
        </Button>
      </div>
    )
  }

  const isEnrolled = !!enrollment
  const isInstructor = course.instructor?.user_id === user?.id
  const spotsLeft = course.max_students - course.enrolled_count
  const isFull = spotsLeft <= 0

  const getCategoryColor = (cat: CourseCategory) => {
    const colors: Record<CourseCategory, string> = {
      korean_language: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300',
      korean_culture: 'bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300',
      korea_business: 'bg-banana-100 text-banana-700 dark:bg-banana-900/30 dark:text-banana-300',
      gastronomy: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
      history: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
      k_culture: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
      cultural_exchange: 'bg-mint-100 text-mint-700 dark:bg-mint-900/30 dark:text-mint-300'
    }
    return colors[cat] || ''
  }

  const handleEnroll = () => {
    if (!user) {
      router.push('/sign-in?redirectTo=/education/course/' + id)
      return
    }
    router.push(`/education/checkout/${course.id}`)
  }

  const getSessionAttendance = (sessionId: string) => {
    return attendance.find(a => a.session_id === sessionId)
  }

  const handleJoinClass = async (session: EducationSession) => {
    router.push(`/education/class/${session.id}`)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Back Button */}
      <div className="container max-w-4xl mx-auto px-4 pt-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {te('education.marketplace')}
        </button>
      </div>

      <div className="container max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Hero Section */}
        <div className="relative rounded-2xl overflow-hidden">
          <div className="h-48 sm:h-64 bg-gradient-to-br from-primary/30 via-primary/10 to-mint-500/10">
            {course.thumbnail_url && (
              <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover" />
            )}
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <div className="flex flex-wrap gap-2 mb-3">
              <span className={cn('px-2.5 py-1 rounded-full text-xs font-medium', getCategoryColor(course.category))}>
                {te(`education.categories.${course.category}`)}
              </span>
              <Badge variant="secondary" className="text-xs">
                {te(`education.levels.${course.level}`)}
              </Badge>
              <Badge variant="outline" className="text-xs">
                <Globe className="w-3 h-3 mr-1" />
                {te(`education.languages.${course.teaching_language}`)}
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{course.title}</h1>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="w-full grid grid-cols-4 h-auto">
                <TabsTrigger value="overview" className="text-xs py-2">
                  <BookOpen className="w-3.5 h-3.5 mr-1" />
                  {te('education.course.description')}
                </TabsTrigger>
                <TabsTrigger value="schedule" className="text-xs py-2">
                  <Calendar className="w-3.5 h-3.5 mr-1" />
                  {te('education.course.schedule')}
                </TabsTrigger>
                <TabsTrigger value="materials" className="text-xs py-2">
                  <FileText className="w-3.5 h-3.5 mr-1" />
                  {te('education.course.materials')}
                </TabsTrigger>
                <TabsTrigger value="reviews" className="text-xs py-2">
                  <Star className="w-3.5 h-3.5 mr-1" />
                  {te('education.course.reviews')}
                </TabsTrigger>
              </TabsList>

              {/* Overview */}
              <TabsContent value="overview" className="space-y-4 mt-4">
                <Card className="border-border/50">
                  <CardContent className="p-5">
                    <h3 className="font-semibold text-foreground mb-3">{te('education.course.description')}</h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-line">{course.description}</p>
                  </CardContent>
                </Card>
                {course.objectives && (
                  <Card className="border-border/50">
                    <CardContent className="p-5">
                      <h3 className="font-semibold text-foreground mb-3">{te('education.course.objectives')}</h3>
                      <p className="text-sm text-muted-foreground whitespace-pre-line">{course.objectives}</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Schedule */}
              <TabsContent value="schedule" className="mt-4">
                <Card className="border-border/50">
                  <CardContent className="p-5 space-y-3">
                    <h3 className="font-semibold text-foreground mb-4">{te('education.calendar.title')}</h3>
                    {course.sessions && course.sessions.length > 0 ? (
                      course.sessions.map((session) => {
                        const att = getSessionAttendance(session.id)
                        const isLive = session.status === 'live'
                        const isCompleted = session.status === 'completed'
                        const scheduledDate = new Date(session.scheduled_at)
                        const now = new Date()
                        const canJoin = (scheduledDate.getTime() - now.getTime()) <= 30 * 60 * 1000

                        return (
                          <div
                            key={session.id}
                            className={cn(
                              'flex items-center gap-4 p-3 rounded-lg border transition-colors',
                              isLive ? 'border-green-500/50 bg-green-50/50 dark:bg-green-900/10' :
                              isCompleted ? 'border-border/30 bg-muted/30' : 'border-border/50'
                            )}
                          >
                            {/* Number */}
                            <div className={cn(
                              'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0',
                              isCompleted ? 'bg-green-100 dark:bg-green-900/30' :
                              isLive ? 'bg-green-500 text-white' :
                              'bg-primary/10'
                            )}>
                              {isCompleted ? (
                                <CheckCircle className="w-5 h-5 text-green-600" />
                              ) : isLive ? (
                                <Play className="w-5 h-5" />
                              ) : (
                                <span className="text-sm font-bold text-primary">{session.session_number}</span>
                              )}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground">
                                {te('education.session.classNumber', { number: session.session_number })}
                                {session.title && ` — ${session.title}`}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {format(scheduledDate, 'PPP · HH:mm', { locale: dateLocale })}
                                {' · '}
                                {session.duration_minutes} {te('education.course.minutes')}
                              </p>
                              {att && (
                                <Badge variant="secondary" className="text-[10px] mt-1">
                                  {te(`education.attendance.${att.status}`)}
                                </Badge>
                              )}
                            </div>

                            {/* Action */}
                            <div className="flex-shrink-0">
                              {isLive && (isEnrolled || isInstructor) && (
                                <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => handleJoinClass(session)}>
                                  <Video className="w-3.5 h-3.5 mr-1" />
                                  {te('education.session.joinClass')}
                                </Button>
                              )}
                              {!isLive && !isCompleted && canJoin && (isEnrolled || isInstructor) && (
                                <Button size="sm" onClick={() => handleJoinClass(session)}>
                                  <Video className="w-3.5 h-3.5 mr-1" />
                                  {isInstructor ? te('education.session.startClass') : te('education.session.joinClass')}
                                </Button>
                              )}
                              {isCompleted && session.recording_url && (
                                <Button size="sm" variant="outline" onClick={() => window.open(session.recording_url!, '_blank')}>
                                  <Play className="w-3.5 h-3.5 mr-1" />
                                  {te('education.session.viewRecording')}
                                </Button>
                              )}
                              {!isEnrolled && !isInstructor && (
                                <Lock className="w-4 h-4 text-muted-foreground" />
                              )}
                            </div>
                          </div>
                        )
                      })
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        {te('education.calendar.noUpcoming')}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Materials */}
              <TabsContent value="materials" className="mt-4">
                <Card className="border-border/50">
                  <CardContent className="p-5 space-y-3">
                    <h3 className="font-semibold text-foreground mb-4">{te('education.material.title')}</h3>
                    {(!isEnrolled && !isInstructor) ? (
                      <div className="text-center py-8">
                        <Lock className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">{te('education.course.enrollNow')}</p>
                      </div>
                    ) : course.materials && course.materials.length > 0 ? (
                      course.materials.map(material => {
                        const icons: Record<string, typeof FileText> = {
                          pdf: FileText,
                          presentation: FileText,
                          link: ExternalLink,
                          vocabulary: BookOpen,
                          other: FileText
                        }
                        const Icon = icons[material.type] || FileText

                        return (
                          <div key={material.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <Icon className="w-5 h-5 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">{material.title}</p>
                              {material.description && (
                                <p className="text-xs text-muted-foreground truncate">{material.description}</p>
                              )}
                              <Badge variant="secondary" className="text-[10px] mt-1">
                                {te(`education.material.${material.type}`)}
                              </Badge>
                            </div>
                            {(material.file_url || material.external_url) && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(material.file_url || material.external_url!, '_blank')}
                              >
                                <Download className="w-3.5 h-3.5" />
                              </Button>
                            )}
                          </div>
                        )
                      })
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        {te('education.material.noMaterials')}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Reviews */}
              <TabsContent value="reviews" className="mt-4">
                <Card className="border-border/50">
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-foreground">{te('education.course.reviews')}</h3>
                      {isEnrolled && !showReviewForm && (
                        <Button size="sm" variant="outline" onClick={() => setShowReviewForm(true)}>
                          <Star className="w-3.5 h-3.5 mr-1" />
                          {te('education.review.title')}
                        </Button>
                      )}
                    </div>

                    {showReviewForm && (
                      <ReviewForm
                        courseId={course.id}
                        studentId={user!.id}
                        te={te}
                        onSubmitted={() => {
                          setShowReviewForm(false)
                          window.location.reload()
                        }}
                      />
                    )}

                    {course.reviews && course.reviews.length > 0 ? (
                      course.reviews.map(review => (
                        <div key={review.id} className="p-4 bg-muted/30 rounded-lg space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="flex items-center">
                              {[1, 2, 3, 4, 5].map(star => (
                                <Star
                                  key={star}
                                  className={cn(
                                    'w-3.5 h-3.5',
                                    star <= review.overall_rating
                                      ? 'fill-banana-500 text-banana-500'
                                      : 'text-muted-foreground/30'
                                  )}
                                />
                              ))}
                            </div>
                            <span className="text-xs font-medium text-foreground">
                              {review.overall_rating.toFixed(1)}
                            </span>
                          </div>
                          <div className="grid grid-cols-4 gap-2 text-xs">
                            <div>
                              <span className="text-muted-foreground">{te('education.review.clarity')}: </span>
                              <span className="font-medium">{review.clarity_rating}/5</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">{te('education.review.content')}: </span>
                              <span className="font-medium">{review.content_rating}/5</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">{te('education.review.interaction')}: </span>
                              <span className="font-medium">{review.interaction_rating}/5</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">{te('education.review.usefulness')}: </span>
                              <span className="font-medium">{review.usefulness_rating}/5</span>
                            </div>
                          </div>
                          {review.comment && (
                            <p className="text-sm text-muted-foreground">{review.comment}</p>
                          )}
                          <p className="text-[11px] text-muted-foreground/60">
                            {format(new Date(review.created_at), 'PPP', { locale: dateLocale })}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-6">
                        {te('education.course.noReviews')}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Price & Enroll Card */}
            <Card className="border-border/50 sticky top-24">
              <CardContent className="p-5 space-y-4">
                {/* Price */}
                <div className="text-center">
                  <p className="text-3xl font-bold text-foreground">${course.price_usd}</p>
                  <p className="text-xs text-muted-foreground">{te('education.course.priceComplete')}</p>
                </div>

                {/* Enroll Button */}
                {isEnrolled ? (
                  <div className="space-y-2">
                    <Button className="w-full" disabled>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      {te('education.course.alreadyEnrolled')}
                    </Button>
                    <Progress value={enrollment!.progress_percentage} className="h-2" />
                    <p className="text-xs text-center text-muted-foreground">
                      {te('education.student.classesCompleted')}: {enrollment!.completed_classes}/{course.total_classes}
                    </p>
                  </div>
                ) : isInstructor ? (
                  <Button className="w-full" variant="outline" onClick={() => router.push('/education?tab=instructor')}>
                    {te('education.instructorDashboard')}
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    disabled={isFull}
                    onClick={handleEnroll}
                  >
                    <DollarSign className="w-4 h-4 mr-2" />
                    {isFull ? te('education.course.full') : te('education.course.buyNow')}
                  </Button>
                )}

                {/* Spots */}
                {!isFull && !isEnrolled && (
                  <p className="text-xs text-center text-muted-foreground">
                    {te('education.course.spotsLeft', { count: spotsLeft })}
                  </p>
                )}

                {/* Course Info */}
                <div className="space-y-3 pt-3 border-t border-border/50">
                  <InfoRow icon={BookOpen} label={te('education.course.totalClasses')} value={`${course.total_classes}`} />
                  <InfoRow icon={Clock} label={te('education.course.classDuration')} value={`${course.class_duration_minutes} ${te('education.course.minutes')}`} />
                  <InfoRow icon={Users} label={te('education.course.enrolledStudents')} value={`${course.enrolled_count}/${course.max_students}`} />
                  {course.start_date && (
                    <InfoRow icon={Calendar} label={te('education.course.startDate')} value={format(new Date(course.start_date), 'PP', { locale: dateLocale })} />
                  )}
                  {course.end_date && (
                    <InfoRow icon={Calendar} label={te('education.course.endDate')} value={format(new Date(course.end_date), 'PP', { locale: dateLocale })} />
                  )}
                  {course.allow_recording && (
                    <InfoRow icon={Video} label={te('education.session.recording')} value="✓" />
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Instructor Card */}
            {course.instructor && (
              <Card className="border-border/50">
                <CardContent className="p-5">
                  <h3 className="font-semibold text-foreground mb-3">{te('education.course.instructor')}</h3>
                  <div className="flex items-center gap-3 mb-3">
                    {course.instructor.photo_url ? (
                      <img
                        src={course.instructor.photo_url}
                        alt={course.instructor.display_name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-lg font-bold text-primary">
                          {course.instructor.display_name.charAt(0)}
                        </span>
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-foreground">{course.instructor.display_name}</p>
                      <p className="text-xs text-muted-foreground">{course.instructor.country}</p>
                    </div>
                  </div>
                  {course.instructor.bio && (
                    <p className="text-xs text-muted-foreground mb-3 line-clamp-3">{course.instructor.bio}</p>
                  )}
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div>
                      <p className="font-bold text-foreground">{course.instructor.total_courses}</p>
                      <p className="text-muted-foreground">{te('education.instructor.totalCourses')}</p>
                    </div>
                    <div>
                      <p className="font-bold text-foreground">{course.instructor.total_students}</p>
                      <p className="text-muted-foreground">{te('education.instructor.totalStudents')}</p>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="flex items-center gap-0.5">
                        <Star className="w-3 h-3 fill-banana-500 text-banana-500" />
                        <span className="font-bold text-foreground">{course.instructor.average_rating.toFixed(1)}</span>
                      </div>
                      <p className="text-muted-foreground">{te('education.instructor.rating')}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function InfoRow({ icon: Icon, label, value }: { icon: typeof BookOpen; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="flex items-center gap-2 text-muted-foreground">
        <Icon className="w-4 h-4" />
        {label}
      </span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  )
}

function ReviewForm({
  courseId,
  studentId,
  te,
  onSubmitted
}: {
  courseId: string
  studentId: string
  te: (key: string) => string
  onSubmitted: () => void
}) {
  const { token } = useAuth()
  const [ratings, setRatings] = useState({
    clarity_rating: 5,
    content_rating: 5,
    interaction_rating: 5,
    usefulness_rating: 5
  })
  const [comment, setComment] = useState('')
  const [saving, setSaving] = useState(false)

  const ratingFields = [
    { key: 'clarity_rating', label: te('education.review.clarity') },
    { key: 'content_rating', label: te('education.review.content') },
    { key: 'interaction_rating', label: te('education.review.interaction') },
    { key: 'usefulness_rating', label: te('education.review.usefulness') }
  ]

  const handleSubmit = async () => {
    setSaving(true)
    try {
      await fetch('/api/education/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          course_id: courseId,
          ...ratings,
          comment
        })
      })
      onSubmitted()
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="border-primary/20">
      <CardContent className="p-4 space-y-4">
        {ratingFields.map(field => (
          <div key={field.key} className="space-y-1">
            <Label className="text-sm">{field.label}</Label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRatings(r => ({ ...r, [field.key]: star }))}
                  className="p-0.5"
                >
                  <Star
                    className={cn(
                      'w-6 h-6 transition-colors',
                      star <= ratings[field.key as keyof typeof ratings]
                        ? 'fill-banana-500 text-banana-500'
                        : 'text-muted-foreground/30 hover:text-banana-300'
                    )}
                  />
                </button>
              ))}
            </div>
          </div>
        ))}
        <div className="space-y-1.5">
          <Label>{te('education.review.comment')}</Label>
          <Textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            rows={3}
          />
        </div>
        <Button onClick={handleSubmit} disabled={saving} className="w-full">
          {saving ? te('education.form.saving') : te('education.review.submit')}
        </Button>
      </CardContent>
    </Card>
  )
}
