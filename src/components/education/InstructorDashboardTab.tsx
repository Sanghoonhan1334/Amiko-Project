'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useEducationTranslation } from '@/hooks/useEducationTranslation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  BookOpen, Users, DollarSign, Plus, Star, Calendar,
  GraduationCap, Edit, Trash2, Send, Clock, Eye
} from 'lucide-react'
import type {
  InstructorProfile, EducationCourse, CourseCategory, CourseLevel, TeachingLanguage
} from '@/types/education'

const CATEGORIES: CourseCategory[] = [
  'korean_language', 'korean_culture', 'korea_business',
  'gastronomy', 'history', 'k_culture', 'cultural_exchange'
]

interface Props {
  instructorId: string | null
  onProfileCreated?: (profile: { id: string }) => void
}

export default function InstructorDashboardTab({ instructorId, onProfileCreated }: Props) {
  const { te } = useEducationTranslation()
  const { user, token } = useAuth()
  const router = useRouter()
  const [profile, setProfile] = useState<InstructorProfile | null>(null)
  const [courses, setCourses] = useState<EducationCourse[]>([])  
  const [loading, setLoading] = useState(!!instructorId)
  const [showProfileForm, setShowProfileForm] = useState(!instructorId)
  const [showCourseForm, setShowCourseForm] = useState(false)
  const [currentInstructorId, setCurrentInstructorId] = useState(instructorId)

  useEffect(() => {
    const idToFetch = currentInstructorId
    if (!idToFetch || !user?.id) {
      setLoading(false)
      return
    }
    setLoading(true)
    const fetchData = async () => {
      try {
        const [profileRes, coursesRes] = await Promise.all([
          fetch(`/api/education/instructor?instructorId=${idToFetch}`),
          fetch(`/api/education/courses?instructorId=${idToFetch}&status=all`)
        ])
        const profileData = await profileRes.json()
        const coursesData = await coursesRes.json()
        setProfile(profileData.instructor)
        setCourses(coursesData.courses || [])
        setShowProfileForm(false)
      } catch (err) {
        console.error('Error:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [currentInstructorId, user?.id])

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    )
  }

  // Show "Become Instructor" form
  if (!currentInstructorId || showProfileForm) {
    return (
      <InstructorProfileForm
        profile={profile}
        userId={user?.id || ''}
        te={te}
        onSaved={(p) => {
          setProfile(p)
          setCurrentInstructorId(p.id)
          setShowProfileForm(false)
          onProfileCreated?.({ id: p.id })
        }}
      />
    )
  }

  // Calculate earnings
  const totalEarnings = courses.reduce((sum, c) => {
    return sum + (c.enrolled_count * c.price_usd)
  }, 0)

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      {profile && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-400/20 to-blue-400/10 p-6">
              <div className="flex items-start gap-4">
                {profile.photo_url ? (
                  <img
                    src={profile.photo_url}
                    alt={profile.display_name}
                    className="w-16 h-16 rounded-full object-cover border-2 border-white dark:border-gray-900"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center border-2 border-white dark:border-gray-900">
                    <span className="text-xl font-bold text-white">
                      {profile.display_name.charAt(0)}
                    </span>
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">{profile.display_name}</h2>
                    {profile.is_verified && (
                      <Badge variant="default" className="text-[10px]">
                        ✓ {te('education.instructor.verified')}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{profile.specialty}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{profile.country} · {profile.languages.join(', ')}</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setShowProfileForm(true)}>
                  <Edit className="w-3.5 h-3.5 mr-1" />
                  {te('education.instructor.editProfile')}
                </Button>
              </div>
            </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 text-center">
            <BookOpen className="w-6 h-6 text-purple-600 dark:text-purple-400 mx-auto mb-1" />
            <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{profile?.total_courses || 0}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{te('education.instructor.totalCourses')}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 text-center">
            <Users className="w-6 h-6 text-green-500 mx-auto mb-1" />
            <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{profile?.total_students || 0}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{te('education.instructor.totalStudents')}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 text-center">
            <Star className="w-6 h-6 text-yellow-500 mx-auto mb-1" />
            <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{profile?.average_rating?.toFixed(1) || '0.0'}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{te('education.instructor.rating')}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 text-center">
            <DollarSign className="w-6 h-6 text-green-500 mx-auto mb-1" />
            <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">${totalEarnings.toFixed(0)}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{te('education.instructor.earnings')}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{te('education.myTeaching')}</h3>
        <Button onClick={() => setShowCourseForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          {te('education.instructor.createCourse')}
        </Button>
      </div>

      {/* Course List */}
      {courses.length === 0 ? (
        <div className="text-center py-12">
          <GraduationCap className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">{te('education.course.noCoursesFound')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {courses.map(course => (
            <InstructorCourseCard
              key={course.id}
              course={course}
              te={te}
              onView={() => router.push(`/education/course/${course.slug || course.id}`)}
              onEdit={() => router.push(`/education/instructor/edit/${course.id}`)}
              onSubmit={async () => {
                try {
                  const res = await fetch(`/api/education/courses/${course.id}/submit-for-review`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
                  })
                  const data = await res.json()
                  if (!res.ok) {
                    alert(data.error || 'Error submitting course')
                    return
                  }
                } catch (err) {
                  console.error('Error submitting course:', err)
                  alert('Error submitting course')
                  return
                }
                // Refresh courses list
                try {
                  const res = await fetch(`/api/education/courses?instructorId=${currentInstructorId}&status=all`)
                  const data = await res.json()
                  setCourses(data.courses || [])
                } catch (err) {
                  console.error('Error refreshing courses:', err)
                }
              }}
            />
          ))}
        </div>
      )}

      {/* Create Course Dialog */}
      <CreateCourseDialog
        open={showCourseForm}
        onClose={() => setShowCourseForm(false)}
        instructorId={currentInstructorId!}
        te={te}
        onCreated={async () => {
          setShowCourseForm(false)
          // Refresh courses list
          try {
            const res = await fetch(`/api/education/courses?instructorId=${currentInstructorId}&status=all`)
            const data = await res.json()
            setCourses(data.courses || [])
          } catch (err) {
            console.error('Error refreshing courses:', err)
          }
        }}
      />
    </div>
  )
}

// ─── Instructor Profile Form ───────────────────────────────────────────

function InstructorProfileForm({
  profile,
  userId,
  te,
  onSaved
}: {
  profile: InstructorProfile | null
  userId: string
  te: (key: string) => string
  onSaved: (p: InstructorProfile) => void
}) {
  const [form, setForm] = useState({
    display_name: profile?.display_name || '',
    country: profile?.country || '',
    languages: profile?.languages?.join(', ') || '',
    experience: profile?.experience || '',
    specialty: profile?.specialty || '',
    bio: profile?.bio || '',
    photo_url: profile?.photo_url || ''
  })
  const [saving, setSaving] = useState(false)
  const { token } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.display_name || !form.country) return
    setSaving(true)
    try {
      const res = await fetch('/api/education/instructor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          ...form,
          languages: form.languages.split(',').map(l => l.trim()).filter(Boolean)
        })
      })
      const data = await res.json()
      if (data.instructor) {
        onSaved(data.instructor)
      }
    } catch (err) {
      console.error('Error saving profile:', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 max-w-2xl mx-auto">
      <div className="p-6 pb-4">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          <GraduationCap className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          {profile ? te('education.instructor.editProfile') : te('education.instructor.createProfile')}
        </h2>
      </div>
      <div className="px-6 pb-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>{te('education.instructor.name')} *</Label>
              <Input
                value={form.display_name}
                onChange={e => setForm(f => ({ ...f, display_name: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>{te('education.instructor.country')} *</Label>
              <Input
                value={form.country}
                onChange={e => setForm(f => ({ ...f, country: e.target.value }))}
                required
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>{te('education.instructor.languagesSpoken')}</Label>
            <Input
              value={form.languages}
              onChange={e => setForm(f => ({ ...f, languages: e.target.value }))}
              placeholder="es, ko"
            />
          </div>
          <div className="space-y-1.5">
            <Label>{te('education.instructor.specialty')}</Label>
            <Input
              value={form.specialty}
              onChange={e => setForm(f => ({ ...f, specialty: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label>{te('education.instructor.experience')}</Label>
            <Textarea
              value={form.experience}
              onChange={e => setForm(f => ({ ...f, experience: e.target.value }))}
              rows={3}
            />
          </div>
          <div className="space-y-1.5">
            <Label>{te('education.instructor.bio')}</Label>
            <Textarea
              value={form.bio}
              onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
              rows={4}
            />
          </div>
          <div className="space-y-1.5">
            <Label>{te('education.instructor.photo')}</Label>
            <Input
              value={form.photo_url}
              onChange={e => setForm(f => ({ ...f, photo_url: e.target.value }))}
              placeholder="https://..."
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={saving} className="flex-1">
              {saving ? te('education.form.saving') : te('education.form.save')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Instructor Course Card ────────────────────────────────────────────

function InstructorCourseCard({
  course,
  te,
  onView,
  onEdit,
  onSubmit
}: {
  course: EducationCourse
  te: (key: string) => string
  onView: () => void
  onEdit: () => void
  onSubmit: () => void
}) {
  const statusColors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    submitted_for_review: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
    changes_requested: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
    approved: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    published: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    in_progress: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
    completed: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',
    cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 hover:shadow-lg hover:border-purple-200 dark:hover:border-purple-700 transition-all p-4">
        <div className="flex items-start gap-4">
          <div className="w-20 h-20 flex-shrink-0 rounded-lg bg-gradient-to-br from-purple-400/20 to-blue-400/10 overflow-hidden">
            {course.thumbnail_url ? (
              <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <BookOpen className="w-8 h-8 text-purple-400" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className="font-semibold text-gray-800 dark:text-gray-100 truncate">{course.title}</h3>
              <Badge className={`text-[10px] flex-shrink-0 ${statusColors[course.status]}`}>
                {te(`education.course.status.${course.status}`)}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mb-2">
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {course.enrolled_count}/{course.max_students}
              </span>
              <span className="flex items-center gap-1">
                <BookOpen className="w-3 h-3" />
                {course.total_classes} {te('education.session.title')}
              </span>
              <span className="flex items-center gap-1">
                <DollarSign className="w-3 h-3" />
                ${course.price_usd}
              </span>
              <span className="flex items-center gap-1">
                <DollarSign className="w-3 h-3" />
                ${(course.enrolled_count * course.price_usd).toFixed(0)} {te('education.instructor.earnings')}
              </span>
            </div>
            {course.rejection_reason && (
              <p className="text-xs text-red-500 mb-2">
                ⚠ {course.rejection_reason}
              </p>
            )}
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={onView}>
                <Eye className="w-3 h-3 mr-1" />
                {te('education.course.viewDetails')}
              </Button>
              {(course.status === 'draft' || course.status === 'rejected' || course.status === 'changes_requested') && (
                <>
                  <Button variant="outline" size="sm" className="h-7 text-xs" onClick={onEdit}>
                    <Edit className="w-3 h-3 mr-1" />
                    {te('education.instructor.editCourse')}
                  </Button>
                  <Button size="sm" className="h-7 text-xs" onClick={onSubmit}>
                    <Send className="w-3 h-3 mr-1" />
                    {te('education.instructor.submitForReview')}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
    </div>
  )
}

// ─── Create Course Dialog ──────────────────────────────────────────────

function CreateCourseDialog({
  open,
  onClose,
  instructorId,
  te,
  onCreated
}: {
  open: boolean
  onClose: () => void
  instructorId: string
  te: (key: string) => string
  onCreated: () => void
}) {
  const [form, setForm] = useState({
    title: '',
    category: '' as CourseCategory | '',
    description: '',
    objectives: '',
    level: '' as CourseLevel | '',
    teaching_language: '' as TeachingLanguage | '',
    total_classes: 8,
    class_duration_minutes: 60,
    price_usd: 0,
    max_students: 20,
    allow_recording: false,
    sessions: [] as { session_number: number; title: string; description: string; scheduled_at: string }[]
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const { token } = useAuth()

  const addSession = () => {
    setForm(f => ({
      ...f,
      sessions: [
        ...f.sessions,
        {
          session_number: f.sessions.length + 1,
          title: '',
          description: '',
          scheduled_at: ''
        }
      ]
    }))
  }

  const removeSession = (idx: number) => {
    setForm(f => ({
      ...f,
      sessions: f.sessions.filter((_, i) => i !== idx).map((s, i) => ({
        ...s,
        session_number: i + 1
      }))
    }))
  }

  const updateSession = (idx: number, field: string, value: string) => {
    setForm(f => ({
      ...f,
      sessions: f.sessions.map((s, i) => i === idx ? { ...s, [field]: value } : s)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const errors: Record<string, string> = {}

    if (!form.title) errors.title = te('education.form.validation.titleRequired')
    if (!form.category) errors.category = te('education.form.validation.categoryRequired')
    if (!form.description) errors.description = te('education.form.validation.descriptionRequired')
    if (!form.level) errors.level = te('education.form.validation.levelRequired')
    if (!form.teaching_language) errors.teaching_language = te('education.form.validation.languageRequired')
    if (!form.price_usd) errors.price_usd = te('education.form.validation.priceRequired')

    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) {
      setError(te('education.form.validation.requiredFields'))
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/education/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          ...form,
          sessions: form.sessions.filter(s => s.scheduled_at)
        })
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Error creating course')
        return
      }

      onCreated()
    } catch (err) {
      setError('Error creating course')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            {te('education.instructor.createCourse')}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Basic Info */}
          <div className="space-y-1.5">
            <Label className={fieldErrors.title ? 'text-red-500' : ''}>{te('education.course.title')} *</Label>
            <Input
              value={form.title}
              onChange={e => { setForm(f => ({ ...f, title: e.target.value })); setFieldErrors(fe => { const { title, ...rest } = fe; return rest }) }}
              placeholder={te('education.form.enterTitle')}
              className={fieldErrors.title ? 'border-red-500 ring-red-500/20 ring-2' : ''}
              required
            />
            {fieldErrors.title && <p className="text-xs text-red-500">{fieldErrors.title}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className={fieldErrors.category ? 'text-red-500' : ''}>{te('education.course.category')} *</Label>
              <Select
                value={form.category}
                onValueChange={v => { setForm(f => ({ ...f, category: v as CourseCategory })); setFieldErrors(fe => { const { category, ...rest } = fe; return rest }) }}
              >
                <SelectTrigger className={fieldErrors.category ? 'border-red-500 ring-red-500/20 ring-2' : ''}>
                  <SelectValue placeholder={te('education.form.selectCategory')} />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(cat => (
                    <SelectItem key={cat} value={cat}>{te(`education.categories.${cat}`)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldErrors.category && <p className="text-xs text-red-500">{fieldErrors.category}</p>}
            </div>
            <div className="space-y-1.5">
              <Label className={fieldErrors.level ? 'text-red-500' : ''}>{te('education.course.level')} *</Label>
              <Select
                value={form.level}
                onValueChange={v => { setForm(f => ({ ...f, level: v as CourseLevel })); setFieldErrors(fe => { const { level, ...rest } = fe; return rest }) }}
              >
                <SelectTrigger className={fieldErrors.level ? 'border-red-500 ring-red-500/20 ring-2' : ''}>
                  <SelectValue placeholder={te('education.form.selectLevel')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">{te('education.levels.basic')}</SelectItem>
                  <SelectItem value="intermediate">{te('education.levels.intermediate')}</SelectItem>
                  <SelectItem value="advanced">{te('education.levels.advanced')}</SelectItem>
                </SelectContent>
              </Select>
              {fieldErrors.level && <p className="text-xs text-red-500">{fieldErrors.level}</p>}
            </div>
            <div className="space-y-1.5">
              <Label className={fieldErrors.teaching_language ? 'text-red-500' : ''}>{te('education.course.teachingLanguage')} *</Label>
              <Select
                value={form.teaching_language}
                onValueChange={v => { setForm(f => ({ ...f, teaching_language: v as TeachingLanguage })); setFieldErrors(fe => { const { teaching_language, ...rest } = fe; return rest }) }}
              >
                <SelectTrigger className={fieldErrors.teaching_language ? 'border-red-500 ring-red-500/20 ring-2' : ''}>
                  <SelectValue placeholder={te('education.form.selectLanguage')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="es">{te('education.languages.es')}</SelectItem>
                  <SelectItem value="ko">{te('education.languages.ko')}</SelectItem>
                  <SelectItem value="bilingual">{te('education.languages.bilingual')}</SelectItem>
                </SelectContent>
              </Select>
              {fieldErrors.teaching_language && <p className="text-xs text-red-500">{fieldErrors.teaching_language}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className={fieldErrors.description ? 'text-red-500' : ''}>{te('education.course.description')} *</Label>
            <Textarea
              value={form.description}
              onChange={e => { setForm(f => ({ ...f, description: e.target.value })); setFieldErrors(fe => { const { description, ...rest } = fe; return rest }) }}
              placeholder={te('education.form.enterDescription')}
              className={fieldErrors.description ? 'border-red-500 ring-red-500/20 ring-2' : ''}
              rows={3}
              required
            />
            {fieldErrors.description && <p className="text-xs text-red-500">{fieldErrors.description}</p>}
          </div>

          <div className="space-y-1.5">
            <Label>{te('education.course.objectives')}</Label>
            <Textarea
              value={form.objectives}
              onChange={e => setForm(f => ({ ...f, objectives: e.target.value }))}
              placeholder={te('education.form.enterObjectives')}
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <Label>{te('education.course.totalClasses')}</Label>
              <Input
                type="number"
                min={1}
                value={form.total_classes}
                onChange={e => setForm(f => ({ ...f, total_classes: parseInt(e.target.value) || 1 }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{te('education.course.classDuration')}</Label>
              <Input
                type="number"
                min={15}
                step={15}
                value={form.class_duration_minutes}
                onChange={e => setForm(f => ({ ...f, class_duration_minutes: parseInt(e.target.value) || 60 }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label className={fieldErrors.price_usd ? 'text-red-500' : ''}>{te('education.course.price')} (USD) *</Label>
              <Input
                type="number"
                min={0}
                step={0.01}
                value={form.price_usd}
                onChange={e => { setForm(f => ({ ...f, price_usd: parseFloat(e.target.value) || 0 })); setFieldErrors(fe => { const { price_usd, ...rest } = fe; return rest }) }}
                className={fieldErrors.price_usd ? 'border-red-500 ring-red-500/20 ring-2' : ''}
              />
              {fieldErrors.price_usd && <p className="text-xs text-red-500">{fieldErrors.price_usd}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>{te('education.course.maxStudents')}</Label>
              <Input
                type="number"
                min={1}
                value={form.max_students}
                onChange={e => setForm(f => ({ ...f, max_students: parseInt(e.target.value) || 20 }))}
              />
            </div>
          </div>

          {/* Recording toggle */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="allow_recording"
              checked={form.allow_recording}
              onChange={e => setForm(f => ({ ...f, allow_recording: e.target.checked }))}
              className="rounded border-border"
            />
            <Label htmlFor="allow_recording" className="text-sm cursor-pointer">
              {te('education.course.allowRecording')}
            </Label>
          </div>

          {/* Sessions Schedule */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base">{te('education.course.schedule')}</Label>
              <Button type="button" variant="outline" size="sm" onClick={addSession}>
                <Plus className="w-3 h-3 mr-1" />
                {te('education.form.addSession')}
              </Button>
            </div>

            {form.sessions.map((session, idx) => (
              <div key={idx} className="flex items-end gap-3 p-3 bg-gray-50 dark:bg-gray-750 rounded-lg">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center">
                  <span className="text-xs font-bold text-purple-600 dark:text-purple-400">{idx + 1}</span>
                </div>
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">{te('education.form.sessionDate')}</Label>
                    <Input
                      type="datetime-local"
                      value={session.scheduled_at}
                      onChange={e => updateSession(idx, 'scheduled_at', e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">{te('education.session.title')}</Label>
                    <Input
                      value={session.title}
                      onChange={e => updateSession(idx, 'title', e.target.value)}
                      placeholder={`${te('education.session.title')} ${idx + 1}`}
                    />
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeSession(idx)}
                  className="text-red-500 hover:text-red-600 h-8 w-8 p-0"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              {te('education.form.cancel')}
            </Button>
            <Button type="submit" disabled={saving} className="flex-1">
              {saving ? te('education.form.creating') : te('education.form.submit')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
