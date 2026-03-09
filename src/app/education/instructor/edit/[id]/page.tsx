'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { useEducationTranslation } from '@/hooks/useEducationTranslation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
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
  ArrowLeft, Save, BookOpen, Calendar, Clock, Users,
  Plus, Trash2, Upload, GripVertical, AlertCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type {
  EducationCourse, EducationSession, CourseMaterial,
  CourseCategory, CourseLevel, TeachingLanguage
} from '@/types/education'
import { format } from 'date-fns'

const categories: CourseCategory[] = [
  'korean_language', 'korean_culture', 'korea_business',
  'gastronomy', 'history', 'k_culture', 'cultural_exchange'
]

const levels: CourseLevel[] = ['basic', 'intermediate', 'advanced']
const languages: TeachingLanguage[] = ['es', 'ko', 'bilingual']

export default function InstructorCourseEditPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const { te } = useEducationTranslation()
  const [course, setCourse] = useState<EducationCourse | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showAddSession, setShowAddSession] = useState(false)

  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [objectives, setObjectives] = useState('')
  const [category, setCategory] = useState<CourseCategory>('korean_language')
  const [level, setLevel] = useState<CourseLevel>('basic')
  const [teachingLanguage, setTeachingLanguage] = useState<TeachingLanguage>('bilingual')
  const [priceUsd, setPriceUsd] = useState(0)
  const [maxStudents, setMaxStudents] = useState(20)
  const [classDuration, setClassDuration] = useState(60)
  const [allowRecording, setAllowRecording] = useState(false)

  // Sessions
  const [sessions, setSessions] = useState<EducationSession[]>([])
  const [newSessionTitle, setNewSessionTitle] = useState('')
  const [newSessionDate, setNewSessionDate] = useState('')
  const [newSessionTime, setNewSessionTime] = useState('')

  // Materials
  const [materials, setMaterials] = useState<CourseMaterial[]>([])
  const [uploadingMaterial, setUploadingMaterial] = useState(false)
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadTitle, setUploadTitle] = useState('')
  const [uploadType, setUploadType] = useState<'pdf' | 'presentation' | 'vocabulary' | 'other'>('pdf')
  const [uploadDescription, setUploadDescription] = useState('')

  useEffect(() => {
    fetchCourse()
  }, [id])

  const fetchCourse = async () => {
    try {
      const res = await fetch(`/api/education/courses/${id}`)
      if (!res.ok) throw new Error('Not found')
      const data = await res.json()
      const c = data.course as EducationCourse

      setCourse(c)
      setTitle(c.title)
      setDescription(c.description)
      setObjectives(c.objectives || '')
      setCategory(c.category)
      setLevel(c.level)
      setTeachingLanguage(c.teaching_language)
      setPriceUsd(c.price_usd)
      setMaxStudents(c.max_students)
      setClassDuration(c.class_duration_minutes)
      setAllowRecording(c.allow_recording)
      setSessions(c.sessions || [])
      setMaterials(c.materials || [])
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/education/courses/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          objectives,
          category,
          level,
          teaching_language: teachingLanguage,
          price_usd: priceUsd,
          max_students: maxStudents,
          class_duration_minutes: classDuration,
          allow_recording: allowRecording,
        })
      })
      if (res.ok) {
        await fetchCourse()
      }
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleSubmitForReview = async () => {
    setSaving(true)
    try {
      await fetch(`/api/education/courses/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'pending_review' })
      })
      router.push('/education?tab=instructor')
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleAddSession = async () => {
    if (!newSessionTitle || !newSessionDate || !newSessionTime) return
    try {
      const scheduled_at = `${newSessionDate}T${newSessionTime}:00`
      const res = await fetch('/api/education/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          course_id: id,
          session_number: sessions.length + 1,
          title: newSessionTitle,
          scheduled_at,
          duration_minutes: classDuration,
        })
      })
      if (res.ok) {
        setShowAddSession(false)
        setNewSessionTitle('')
        setNewSessionDate('')
        setNewSessionTime('')
        await fetchCourse()
      }
    } catch (err) {
      console.error('Error:', err)
    }
  }

  const handleDeleteMaterial = async (materialId: string) => {
    try {
      await fetch(`/api/education/materials?id=${materialId}`, { method: 'DELETE' })
      setMaterials(prev => prev.filter(m => m.id !== materialId))
    } catch (err) {
      console.error('Error:', err)
    }
  }

  const handleUploadMaterial = async () => {
    if (!uploadFile || !uploadTitle || !id) return
    setUploadingMaterial(true)
    try {
      const formData = new FormData()
      formData.append('file', uploadFile)
      formData.append('course_id', id)
      formData.append('title', uploadTitle)
      formData.append('type', uploadType)
      if (uploadDescription) formData.append('description', uploadDescription)
      formData.append('sort_order', String(materials.length))

      const res = await fetch('/api/education/upload', {
        method: 'POST',
        body: formData
      })
      const data = await res.json()
      if (res.ok && data.material) {
        setMaterials(prev => [...prev, data.material])
        setShowUploadDialog(false)
        setUploadFile(null)
        setUploadTitle('')
        setUploadDescription('')
        setUploadType('pdf')
      } else {
        alert(data.error || 'Error uploading file')
      }
    } catch (err) {
      console.error('Upload error:', err)
      alert('Error uploading file')
    } finally {
      setUploadingMaterial(false)
    }
  }

  const canEdit = course?.status === 'draft' || course?.status === 'rejected'
  const canSubmit = canEdit && title && description && sessions.length > 0

  const statusColors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-700',
    pending_review: 'bg-yellow-100 text-yellow-700',
    approved: 'bg-blue-100 text-blue-700',
    rejected: 'bg-red-100 text-red-700',
    published: 'bg-green-100 text-green-700',
    in_progress: 'bg-primary/10 text-primary',
    completed: 'bg-green-100 text-green-700',
    cancelled: 'bg-gray-100 text-gray-700',
  }

  if (loading) {
    return (
      <div className="space-y-6 p-4 max-w-3xl mx-auto">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    )
  }

  if (!course) {
    return (
      <div className="p-4 text-center">
        <p className="text-muted-foreground">{te('education.course.noCoursesFound')}</p>
        <Button variant="ghost" onClick={() => router.back()} className="mt-4">
          <ArrowLeft className="w-4 h-4 mr-2" /> {te('education.course.back')}
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-foreground">{te('education.instructor.editCourse')}</h1>
            <p className="text-xs text-muted-foreground">{course.title}</p>
          </div>
        </div>
        <Badge className={cn('text-xs', statusColors[course.status])}>
          {te(`education.status.${course.status}`)}
        </Badge>
      </div>

      {/* Rejection Reason */}
      {course.status === 'rejected' && course.rejection_reason && (
        <Card className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/20">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-700 dark:text-red-400">
                  {te('education.admin.rejectionReason')}
                </p>
                <p className="text-sm text-red-600 dark:text-red-300 mt-1">
                  {course.rejection_reason}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Basic Information */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-primary" />
            {te('education.form.courseTitle')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">{te('education.form.courseTitle')}</label>
            <Input
              value={title}
              onChange={e => setTitle(e.target.value)}
              disabled={!canEdit}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">{te('education.form.description')}</label>
            <Textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={4}
              disabled={!canEdit}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">{te('education.form.objectives')}</label>
            <Textarea
              value={objectives}
              onChange={e => setObjectives(e.target.value)}
              rows={3}
              disabled={!canEdit}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{te('education.form.category')}</label>
              <Select value={category} onValueChange={(v) => setCategory(v as CourseCategory)} disabled={!canEdit}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(c => (
                    <SelectItem key={c} value={c}>{te(`education.categories.${c}`)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">{te('education.form.level')}</label>
              <Select value={level} onValueChange={(v) => setLevel(v as CourseLevel)} disabled={!canEdit}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {levels.map(l => (
                    <SelectItem key={l} value={l}>{te(`education.levels.${l}`)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">{te('education.form.language')}</label>
              <Select value={teachingLanguage} onValueChange={(v) => setTeachingLanguage(v as TeachingLanguage)} disabled={!canEdit}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {languages.map(l => (
                    <SelectItem key={l} value={l}>{te(`education.languages.${l}`)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{te('education.form.price')}</label>
              <Input
                type="number"
                min={0}
                step={0.01}
                value={priceUsd}
                onChange={e => setPriceUsd(Number(e.target.value))}
                disabled={!canEdit}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">{te('education.form.maxStudents')}</label>
              <Input
                type="number"
                min={1}
                max={50}
                value={maxStudents}
                onChange={e => setMaxStudents(Number(e.target.value))}
                disabled={!canEdit}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">{te('education.form.classDuration')}</label>
              <Input
                type="number"
                min={30}
                max={180}
                step={15}
                value={classDuration}
                onChange={e => setClassDuration(Number(e.target.value))}
                disabled={!canEdit}
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Switch
              checked={allowRecording}
              onCheckedChange={setAllowRecording}
              disabled={!canEdit}
            />
            <label className="text-sm">{te('education.form.allowRecording')}</label>
          </div>
        </CardContent>
      </Card>

      {/* Sessions */}
      <Card className="border-border/50">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            {te('education.session.title')} ({sessions.length})
          </CardTitle>
          {canEdit && (
            <Button size="sm" variant="outline" onClick={() => setShowAddSession(true)}>
              <Plus className="w-4 h-4 mr-1" />
              {te('education.form.addSession')}
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              {te('education.course.noCoursesFound')}
            </p>
          ) : (
            <div className="space-y-2">
              {sessions
                .sort((a, b) => a.session_number - b.session_number)
                .map(session => (
                  <div
                    key={session.id}
                    className="flex items-center gap-3 p-3 rounded-lg border border-border/50 bg-muted/30"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                      {session.session_number}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        {session.title || `${te('education.session.title')} ${session.session_number}`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(session.scheduled_at), 'PPp')}
                        {' · '}
                        {session.duration_minutes} min
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-[10px]',
                        session.status === 'completed' && 'border-green-500 text-green-600',
                        session.status === 'scheduled' && 'border-blue-500 text-blue-600',
                        session.status === 'cancelled' && 'border-red-500 text-red-600',
                      )}
                    >
                      {te(`education.status.${session.status}`)}
                    </Badge>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Materials */}
      <Card className="border-border/50">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Upload className="w-4 h-4 text-primary" />
            {te('education.materials.title')} ({materials.length})
          </CardTitle>
          {canEdit && (
            <Button size="sm" variant="outline" onClick={() => setShowUploadDialog(true)}>
              <Plus className="w-3 h-3 mr-1" />
              {te('education.material.upload')}
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {materials.length === 0 ? (
            <div className="text-center py-8 space-y-3">
              <Upload className="w-10 h-10 text-muted-foreground/30 mx-auto" />
              <p className="text-sm text-muted-foreground">
                {te('education.material.noMaterials')}
              </p>
              {canEdit && (
                <Button size="sm" variant="outline" onClick={() => setShowUploadDialog(true)}>
                  <Plus className="w-3 h-3 mr-1" />
                  {te('education.material.upload')}
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {materials.map(mat => (
                <div
                  key={mat.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted/30"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">{mat.title}</p>
                    <p className="text-xs text-muted-foreground capitalize">{mat.type}</p>
                  </div>
                  {canEdit && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-500 h-8 w-8"
                      onClick={() => handleDeleteMaterial(mat.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions Footer */}
      {canEdit && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur border-t border-border z-50">
          <div className="max-w-3xl mx-auto flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleSave}
              disabled={saving}
            >
              <Save className="w-4 h-4 mr-2" />
              {te('education.form.saveDraft')}
            </Button>
            <Button
              className="flex-1"
              onClick={handleSubmitForReview}
              disabled={saving || !canSubmit}
            >
              {te('education.form.submitReview')}
            </Button>
          </div>
        </div>
      )}

      {/* Add Session Dialog */}
      <Dialog open={showAddSession} onOpenChange={setShowAddSession}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              {te('education.form.addSession')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{te('education.form.sessionTitle')}</label>
              <Input
                value={newSessionTitle}
                onChange={e => setNewSessionTitle(e.target.value)}
                placeholder={`${te('education.session.title')} ${sessions.length + 1}`}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">{te('education.form.sessionDate')}</label>
                <Input
                  type="date"
                  value={newSessionDate}
                  onChange={e => setNewSessionDate(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">{te('education.form.sessionTime')}</label>
                <Input
                  type="time"
                  value={newSessionTime}
                  onChange={e => setNewSessionTime(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowAddSession(false)}>
                {te('education.form.cancel')}
              </Button>
              <Button
                className="flex-1"
                onClick={handleAddSession}
                disabled={!newSessionTitle || !newSessionDate || !newSessionTime}
              >
                {te('education.form.addSession')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Upload Material Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-primary" />
              {te('education.material.upload')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{te('education.material.title')}</label>
              <Input
                value={uploadTitle}
                onChange={e => setUploadTitle(e.target.value)}
                placeholder={te('education.materialForm.namePlaceholder')}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{te('education.materialForm.type')}</label>
              <Select value={uploadType} onValueChange={(v: 'pdf' | 'presentation' | 'vocabulary' | 'other') => setUploadType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">{te('education.material.pdf')}</SelectItem>
                  <SelectItem value="presentation">{te('education.material.presentation')}</SelectItem>
                  <SelectItem value="vocabulary">{te('education.material.vocabulary')}</SelectItem>
                  <SelectItem value="other">{te('education.material.other')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{te('education.materialForm.descriptionOptional')}</label>
              <Input
                value={uploadDescription}
                onChange={e => setUploadDescription(e.target.value)}
                placeholder={te('education.materialForm.descriptionPlaceholder')}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{te('education.materialForm.file')}</label>
              <Input
                type="file"
                accept=".pdf,.ppt,.pptx,.csv,.xlsx,.json,.txt,.zip,.mp4,.mp3,.wav,.jpg,.jpeg,.png,.webp"
                onChange={e => setUploadFile(e.target.files?.[0] || null)}
              />
              {uploadFile && (
                <p className="text-xs text-muted-foreground">
                  {uploadFile.name} ({(uploadFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowUploadDialog(false)}>
                {te('education.form.cancel')}
              </Button>
              <Button
                className="flex-1"
                onClick={handleUploadMaterial}
                disabled={!uploadFile || !uploadTitle || uploadingMaterial}
              >
                {uploadingMaterial ? te('education.materialForm.uploading') : te('education.material.upload')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
