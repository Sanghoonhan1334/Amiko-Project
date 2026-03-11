'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useLanguage } from '@/context/LanguageContext'
import { useAuth } from '@/context/AuthContext'
import { toast } from 'sonner'
import { Plus, Trash2, Save, Eye, Edit, List } from 'lucide-react'

interface Question {
  id: string
  question_text: string
  question_order: number
  quiz_options: Option[]
}

interface Option {
  id: string
  option_text: string
  option_order: number
  result_type?: string
  score_value?: number
}

interface Quiz {
  id: string
  title: string
  description: string
  category: string
  thumbnail_url?: string
  total_questions: number
  is_active: boolean
}

export default function QuizCreatorPage() {
  const { language } = useLanguage()
  const t = (ko: string, es: string) => language === 'ko' ? ko : es
  const { user, token } = useAuth()

  // ── Admin check ────────────────────────────────────────────
  const [isAdmin, setIsAdmin] = useState(false)

  // ── Existing quizzes list ──────────────────────────────────
  const [quizList, setQuizList] = useState<Quiz[]>([])
  const [quizListLoading, setQuizListLoading] = useState(false)

  // ── Edit modal state ───────────────────────────────────────
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null)
  const [editForm, setEditForm] = useState({ title: '', description: '', category: 'personality', thumbnail_url: '' })
  const [saving, setSaving] = useState(false)

  // ── Create form state ──────────────────────────────────────
  const [quizForm, setQuizForm] = useState({
    title: '',
    description: '',
    category: 'personality',
    thumbnail_url: ''
  })
  const [questions, setQuestions] = useState<Question[]>([])
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)
  const [creating, setCreating] = useState(false)

  // ── Admin check ────────────────────────────────────────────
  useEffect(() => {
    const checkAdmin = async () => {
      if (!token) return
      try {
        const response = await fetch('/api/auth/check-admin', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (response.ok) {
          const result = await response.json()
          setIsAdmin(result.isAdmin)
        }
      } catch (error) {
        console.error('관리자 권한 확인 오류:', error)
      }
    }
    checkAdmin()
  }, [user])

  // ── Load quiz list ─────────────────────────────────────────
  const loadQuizList = async () => {
    setQuizListLoading(true)
    try {
      const res = await fetch('/api/quizzes?showAll=true', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setQuizList(data.data || [])
      }
    } catch (err) {
      console.error('Error loading quizzes:', err)
    } finally {
      setQuizListLoading(false)
    }
  }

  useEffect(() => {
    if (isAdmin) loadQuizList()
  }, [isAdmin])

  // ── Delete quiz ────────────────────────────────────────────
  const handleDeleteQuiz = async (quiz: Quiz) => {
    if (!confirm(t(
      `"${quiz.title}" 테스트를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`,
      `¿Eliminar el test "${quiz.title}"? Esta acción no se puede deshacer.`
    ))) return

    try {
      const res = await fetch(`/api/quizzes/${quiz.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        toast.success(t('테스트가 삭제되었습니다.', 'Test eliminado exitosamente.'))
        loadQuizList()
      } else {
        const err = await res.json()
        toast.error(err.error || t('삭제에 실패했습니다.', 'Error al eliminar.'))
      }
    } catch {
      toast.error(t('오류가 발생했습니다.', 'Ocurrió un error.'))
    }
  }

  // ── Toggle active ──────────────────────────────────────────
  const handleToggleActive = async (quiz: Quiz) => {
    try {
      const res = await fetch(`/api/quizzes/${quiz.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          title: quiz.title,
          description: quiz.description,
          category: quiz.category,
          thumbnail_url: quiz.thumbnail_url,
          is_active: !quiz.is_active
        })
      })
      if (res.ok) {
        toast.success(!quiz.is_active
          ? t('테스트가 활성화되었습니다.', 'Test activado.')
          : t('테스트가 비활성화되었습니다.', 'Test desactivado.'))
        loadQuizList()
      } else {
        toast.error(t('변경에 실패했습니다.', 'Error al cambiar estado.'))
      }
    } catch {
      toast.error(t('오류가 발생했습니다.', 'Ocurrió un error.'))
    }
  }

  // ── Open edit modal ────────────────────────────────────────
  const openEdit = (quiz: Quiz) => {
    setEditingQuiz(quiz)
    setEditForm({
      title: quiz.title,
      description: quiz.description || '',
      category: quiz.category || 'personality',
      thumbnail_url: quiz.thumbnail_url || ''
    })
  }

  // ── Save edit ──────────────────────────────────────────────
  const handleSaveEdit = async () => {
    if (!editingQuiz) return
    if (!editForm.title.trim()) {
      toast.error(t('제목을 입력해주세요.', 'Ingrese el título.'))
      return
    }
    setSaving(true)
    try {
      const res = await fetch(`/api/quizzes/${editingQuiz.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          title: editForm.title,
          description: editForm.description,
          category: editForm.category,
          thumbnail_url: editForm.thumbnail_url,
          is_active: editingQuiz.is_active
        })
      })
      if (res.ok) {
        toast.success(t('테스트가 수정되었습니다.', 'Test actualizado exitosamente.'))
        setEditingQuiz(null)
        loadQuizList()
      } else {
        const err = await res.json()
        toast.error(err.error || t('수정에 실패했습니다.', 'Error al actualizar.'))
      }
    } catch {
      toast.error(t('오류가 발생했습니다.', 'Ocurrió un error.'))
    } finally {
      setSaving(false)
    }
  }

  // ── Create quiz helpers ────────────────────────────────────
  const addQuestion = () => {
    const newQuestion: Question = {
      id: Date.now().toString(),
      question_text: '',
      question_order: questions.length + 1,
      quiz_options: [
        { id: '1', option_text: '', option_order: 1, result_type: '', score_value: 0 },
        { id: '2', option_text: '', option_order: 2, result_type: '', score_value: 0 }
      ]
    }
    setQuestions([...questions, newQuestion])
    setEditingQuestion(newQuestion)
  }

  const updateQuestion = (questionId: string, updates: Partial<Question>) => {
    setQuestions(questions.map(q => q.id === questionId ? { ...q, ...updates } : q))
    if (editingQuestion?.id === questionId) setEditingQuestion({ ...editingQuestion, ...updates })
  }

  const addOption = (questionId: string) => {
    const question = questions.find(q => q.id === questionId)
    if (!question) return
    const newOption: Option = { id: Date.now().toString(), option_text: '', option_order: question.quiz_options.length + 1, result_type: '', score_value: 0 }
    updateQuestion(questionId, { quiz_options: [...question.quiz_options, newOption] })
  }

  const removeOption = (questionId: string, optionId: string) => {
    const question = questions.find(q => q.id === questionId)
    if (!question) return
    const updatedOptions = question.quiz_options.filter(opt => opt.id !== optionId).map((opt, i) => ({ ...opt, option_order: i + 1 }))
    updateQuestion(questionId, { quiz_options: updatedOptions })
  }

  const updateOption = (questionId: string, optionId: string, updates: Partial<Option>) => {
    const question = questions.find(q => q.id === questionId)
    if (!question) return
    updateQuestion(questionId, { quiz_options: question.quiz_options.map(opt => opt.id === optionId ? { ...opt, ...updates } : opt) })
  }

  const saveQuiz = async () => {
    if (!quizForm.title.trim()) { toast.error(t('퀴즈 제목을 입력해주세요.', 'Por favor ingrese el título del quiz.')); return }
    if (questions.length === 0) { toast.error(t('최소 1개 이상의 질문을 추가해주세요.', 'Se requiere al menos 1 pregunta.')); return }
    const incompleteQuestions = questions.filter(q => !q.question_text.trim() || q.quiz_options.some(opt => !opt.option_text.trim() || !opt.result_type))
    if (incompleteQuestions.length > 0) { toast.error(t('모든 질문과 선택지를 완성해주세요.', 'Por favor complete todas las preguntas y opciones.')); return }

    try {
      setCreating(true)
      const response = await fetch('/api/quizzes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ title: quizForm.title, description: quizForm.description, category: quizForm.category, thumbnail_url: quizForm.thumbnail_url, questions })
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || t('퀴즈 생성에 실패했습니다.', 'Error al guardar el quiz.'))
      }
      toast.success(t('퀴즈가 성공적으로 생성되었습니다!', 'Quiz guardado exitosamente!'))
      setQuizForm({ title: '', description: '', category: 'personality', thumbnail_url: '' })
      setQuestions([])
      setEditingQuestion(null)
      loadQuizList()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('퀴즈 생성에 실패했습니다.', 'Error al guardar el quiz.'))
    } finally {
      setCreating(false)
    }
  }

  const categoryLabels: Record<string, string> = {
    personality: t('성격 테스트', 'Personalidad'),
    celebrity: t('K-POP 스타', 'K-POP'),
    fun: t('재미', 'Divertido'),
    knowledge: t('상식', 'Cultura general'),
    fortune: t('운세', 'Fortuna'),
    psychology: t('심리', 'Psicología'),
    language: t('언어', 'Idioma'),
    meme: t('밈', 'Meme'),
    culture: t('문화', 'Cultura'),
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <Card className="w-full max-w-md dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="p-6 text-center">
            <div className="text-red-500 text-4xl mb-4">🚫</div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">{t('권한 없음', 'Sin permisos')}</h2>
            <p className="text-gray-600 dark:text-gray-400">{t('이 페이지는 관리자만 접근할 수 있습니다.', 'Solo los administradores pueden acceder a esta página.')}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-4xl mx-auto px-4 py-8">

        <h1 className="text-2xl font-bold dark:text-gray-100 mb-6">
          {t('테스트 관리', 'Gestión de Tests')}
        </h1>

        <Tabs defaultValue="manage">
          <TabsList className="mb-6">
            <TabsTrigger value="manage" className="flex items-center gap-2">
              <List className="w-4 h-4" />
              {t('테스트 관리', 'Gestionar Tests')}
            </TabsTrigger>
            <TabsTrigger value="create" className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              {t('새 테스트 만들기', 'Crear Test')}
            </TabsTrigger>
          </TabsList>

          {/* ── MANAGE TAB ──────────────────────────────────── */}
          <TabsContent value="manage">
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="dark:text-gray-100">
                    {t('기존 테스트 목록', 'Tests existentes')}
                    <Badge variant="secondary" className="ml-2">{quizList.length}</Badge>
                  </CardTitle>
                  <Button variant="outline" size="sm" onClick={loadQuizList} disabled={quizListLoading}>
                    {quizListLoading ? t('로딩...', 'Cargando...') : t('새로고침', 'Actualizar')}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {quizListLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
                  </div>
                ) : quizList.length === 0 ? (
                  <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                    {t('등록된 테스트가 없습니다.', 'No hay tests registrados.')}
                  </p>
                ) : (
                  <div className="space-y-3">
                    {quizList.map((quiz) => (
                      <div key={quiz.id} className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                        <div className="flex-1 min-w-0 mr-4">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-gray-900 dark:text-gray-100 truncate">{quiz.title}</span>
                            <Badge variant="outline" className="text-xs shrink-0">
                              {categoryLabels[quiz.category] || quiz.category}
                            </Badge>
                            <Badge
                              variant={quiz.is_active ? 'default' : 'secondary'}
                              className={`text-xs shrink-0 ${quiz.is_active ? 'bg-green-500' : 'bg-gray-400'}`}
                            >
                              {quiz.is_active ? t('활성', 'Activo') : t('비활성', 'Inactivo')}
                            </Badge>
                          </div>
                          {quiz.description && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 truncate">{quiz.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Switch
                            checked={quiz.is_active}
                            onCheckedChange={() => handleToggleActive(quiz)}
                            title={quiz.is_active ? t('비활성화', 'Desactivar') : t('활성화', 'Activar')}
                          />
                          <Button size="sm" variant="outline" onClick={() => openEdit(quiz)} title={t('수정', 'Editar')}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline" className="text-red-600 border-red-300 hover:bg-red-50 dark:border-red-700 dark:hover:bg-red-900/20" onClick={() => handleDeleteQuiz(quiz)} title={t('삭제', 'Eliminar')}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── CREATE TAB ──────────────────────────────────── */}
          <TabsContent value="create">
            <Card className="mb-8 dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2 dark:text-gray-100">
                  <Plus className="w-6 h-6" />
                  {t('새로운 심리테스트 만들기', 'Crear nuevo test psicológico')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title" className="dark:text-gray-200">{t('테스트 제목', 'Título del test')}</Label>
                    <Input id="title" value={quizForm.title} onChange={(e) => setQuizForm({ ...quizForm, title: e.target.value })} placeholder={t('예: MBTI 성격 유형 테스트', 'Ej: Test de personalidad MBTI')} className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100" />
                  </div>
                  <div>
                    <Label htmlFor="category" className="dark:text-gray-200">{t('카테고리', 'Categoría')}</Label>
                    <Select value={quizForm.category} onValueChange={(value) => setQuizForm({ ...quizForm, category: value })}>
                      <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"><SelectValue /></SelectTrigger>
                      <SelectContent className="dark:bg-gray-700 dark:border-gray-600">
                        <SelectItem value="personality">{t('성격 테스트', 'Test de personalidad')}</SelectItem>
                        <SelectItem value="celebrity">{t('K-POP 스타 매칭', 'Matching de estrellas K-POP')}</SelectItem>
                        <SelectItem value="fun">{t('재미있는 테스트', 'Test divertido')}</SelectItem>
                        <SelectItem value="knowledge">{t('상식 테스트', 'Test de cultura general')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="description" className="dark:text-gray-200">{t('테스트 설명', 'Descripción del test')}</Label>
                  <Textarea id="description" value={quizForm.description} onChange={(e) => setQuizForm({ ...quizForm, description: e.target.value })} placeholder={t('테스트에 대한 설명을 입력하세요...', 'Ingrese la descripción del test...')} rows={3} className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100" />
                </div>
                <div>
                  <Label htmlFor="thumbnail" className="dark:text-gray-200">{t('썸네일 URL (선택사항)', 'URL de miniatura (opcional)')}</Label>
                  <Input id="thumbnail" value={quizForm.thumbnail_url} onChange={(e) => setQuizForm({ ...quizForm, thumbnail_url: e.target.value })} placeholder="https://example.com/image.jpg" className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100" />
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold dark:text-gray-100">{t('질문 관리', 'Gestión de preguntas')}</h3>
                <Button onClick={addQuestion} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  {t('질문 추가', 'Agregar Pregunta')}
                </Button>
              </div>

              {questions.map((question) => (
                <Card key={question.id} className="relative dark:bg-gray-800 dark:border-gray-700">
                  <CardHeader>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary">{t('질문', 'Pregunta')} {question.question_order}</Badge>
                      <Button variant="outline" size="sm" onClick={() => setEditingQuestion(editingQuestion?.id === question.id ? null : question)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                    <Input value={question.question_text} onChange={(e) => updateQuestion(question.id, { question_text: e.target.value })} placeholder={t('질문을 입력하세요...', 'Ingrese la pregunta...')} className="text-lg dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100" />
                  </CardHeader>
                  {editingQuestion?.id === question.id && (
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium dark:text-gray-200">{t('선택지', 'Opciones')}</h4>
                          <Button size="sm" variant="outline" onClick={() => addOption(question.id)} className="dark:border-gray-600 dark:text-gray-200">
                            <Plus className="w-4 h-4 mr-1" />{t('선택지 추가', 'Agregar opción')}
                          </Button>
                        </div>
                        {question.quiz_options.map((option) => (
                          <div key={option.id} className="flex gap-2">
                            <Input value={option.option_text} onChange={(e) => updateOption(question.id, option.id, { option_text: e.target.value })} placeholder={`${t('선택지', 'Opción')} ${option.option_order}`} className="flex-1 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100" />
                            <Input value={option.result_type || ''} onChange={(e) => updateOption(question.id, option.id, { result_type: e.target.value })} placeholder={t('결과 유형 (예: INTJ, IU, 로맨틱)', 'Tipo de resultado (ej: INTJ, IU, Romántico)')} className="flex-1 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100" />
                            {question.quiz_options.length > 2 && (
                              <Button size="sm" variant="destructive" onClick={() => removeOption(question.id, option.id)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>

            {questions.length > 0 && (
              <div className="mt-8 flex justify-center">
                <Button onClick={saveQuiz} disabled={creating} className="bg-green-600 hover:bg-green-700 px-8 py-3">
                  {creating ? (
                    <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>{t('저장 중...', 'Guardando...')}</>
                  ) : (
                    <><Save className="w-4 h-4 mr-2" />{t('테스트 저장하기', 'Guardar test')}</>
                  )}
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* ── Edit Modal ──────────────────────────────────────── */}
      <Dialog open={!!editingQuiz} onOpenChange={(open) => { if (!open) setEditingQuiz(null) }}>
        <DialogContent className="max-w-md dark:bg-gray-800 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="dark:text-gray-100">{t('테스트 수정', 'Editar Test')}</DialogTitle>
            <DialogDescription className="dark:text-gray-400">{t('테스트의 기본 정보를 수정합니다.', 'Modifica la información básica del test.')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="dark:text-gray-200">{t('제목', 'Título')}</Label>
              <Input value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100" />
            </div>
            <div>
              <Label className="dark:text-gray-200">{t('설명', 'Descripción')}</Label>
              <Textarea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} rows={3} className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100" />
            </div>
            <div>
              <Label className="dark:text-gray-200">{t('카테고리', 'Categoría')}</Label>
              <Select value={editForm.category} onValueChange={(value) => setEditForm({ ...editForm, category: value })}>
                <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"><SelectValue /></SelectTrigger>
                <SelectContent className="dark:bg-gray-700 dark:border-gray-600">
                  <SelectItem value="personality">{t('성격 테스트', 'Personalidad')}</SelectItem>
                  <SelectItem value="celebrity">{t('K-POP 스타', 'K-POP')}</SelectItem>
                  <SelectItem value="fun">{t('재미', 'Divertido')}</SelectItem>
                  <SelectItem value="knowledge">{t('상식', 'Cultura general')}</SelectItem>
                  <SelectItem value="fortune">{t('운세', 'Fortuna')}</SelectItem>
                  <SelectItem value="psychology">{t('심리', 'Psicología')}</SelectItem>
                  <SelectItem value="language">{t('언어', 'Idioma')}</SelectItem>
                  <SelectItem value="meme">{t('밈', 'Meme')}</SelectItem>
                  <SelectItem value="culture">{t('문화', 'Cultura')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="dark:text-gray-200">{t('썸네일 URL', 'URL de miniatura')}</Label>
              <Input value={editForm.thumbnail_url} onChange={(e) => setEditForm({ ...editForm, thumbnail_url: e.target.value })} placeholder="https://example.com/image.jpg" className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setEditingQuiz(null)} className="dark:border-gray-600 dark:text-gray-200">{t('취소', 'Cancelar')}</Button>
              <Button onClick={handleSaveEdit} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
                {saving ? t('저장 중...', 'Guardando...') : <><Save className="w-4 h-4 mr-2" />{t('저장', 'Guardar')}</>}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
