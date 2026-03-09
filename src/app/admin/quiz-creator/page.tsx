'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useLanguage } from '@/context/LanguageContext'
import { useAuth } from '@/context/AuthContext'
import { toast } from 'sonner'
import { Plus, Trash2, Save, Eye } from 'lucide-react'

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
  
  const [quizForm, setQuizForm] = useState({
    title: '',
    description: '',
    category: 'personality',
    thumbnail_url: ''
  })
  
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)
  const [saving, setSaving] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  // 관리자 권한 체크
  useEffect(() => {
    const checkAdmin = async () => {
      if (!token) return
      
      try {
        const response = await fetch('/api/auth/check-admin', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
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
    setQuestions(questions.map(q => 
      q.id === questionId ? { ...q, ...updates } : q
    ))
    
    if (editingQuestion?.id === questionId) {
      setEditingQuestion({ ...editingQuestion, ...updates })
    }
  }

  const addOption = (questionId: string) => {
    const question = questions.find(q => q.id === questionId)
    if (!question) return
    
    const newOption: Option = {
      id: Date.now().toString(),
      option_text: '',
      option_order: question.quiz_options.length + 1,
      result_type: '',
      score_value: 0
    }
    
    updateQuestion(questionId, {
      quiz_options: [...question.quiz_options, newOption]
    })
  }

  const removeOption = (questionId: string, optionId: string) => {
    const question = questions.find(q => q.id === questionId)
    if (!question) return
    
    const updatedOptions = question.quiz_options
      .filter(opt => opt.id !== optionId)
      .map((opt, index) => ({ ...opt, option_order: index + 1 }))
    
    updateQuestion(questionId, { quiz_options: updatedOptions })
  }

  const updateOption = (questionId: string, optionId: string, updates: Partial<Option>) => {
    const question = questions.find(q => q.id === questionId)
    if (!question) return
    
    const updatedOptions = question.quiz_options.map(opt =>
      opt.id === optionId ? { ...opt, ...updates } : opt
    )
    
    updateQuestion(questionId, { quiz_options: updatedOptions })
  }

  const saveQuiz = async () => {
    if (!quizForm.title.trim()) {
      toast.error(t('퀴즈 제목을 입력해주세요.', 'Por favor ingrese el título del quiz.'))
      return
    }
    
    if (questions.length === 0) {
      toast.error(t('최소 1개 이상의 질문을 추가해주세요.', 'Se requiere al menos 1 pregunta.'))
      return
    }
    
    // 모든 질문이 완성되었는지 확인
    const incompleteQuestions = questions.filter(q => 
      !q.question_text.trim() || 
      q.quiz_options.some(opt => !opt.option_text.trim() || !opt.result_type)
    )
    
    if (incompleteQuestions.length > 0) {
      toast.error(t('모든 질문과 선택지를 완성해주세요.', 'Por favor complete todas las preguntas y opciones.'))
      return
    }

    try {
      setSaving(true)
      
      const response = await fetch('/api/quizzes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: quizForm.title,
          description: quizForm.description,
          category: quizForm.category,
          thumbnail_url: quizForm.thumbnail_url,
          questions: questions
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || t('퀴즈 생성에 실패했습니다.', 'Error al guardar el quiz.'))
      }

      const result = await response.json()
      toast.success(t('퀴즈가 성공적으로 생성되었습니다!', 'Quiz guardado exitosamente!'))
      
      // 폼 초기화
      setQuizForm({ title: '', description: '', category: 'personality', thumbnail_url: '' })
      setQuestions([])
      setEditingQuestion(null)
      
    } catch (error) {
      console.error('퀴즈 저장 오류:', error)
      toast.error(error instanceof Error ? error.message : t('퀴즈 생성에 실패했습니다.', 'Error al guardar el quiz.'))
    } finally {
      setSaving(false)
    }
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
        <Card className="mb-8 dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2 dark:text-gray-100">
              <Plus className="w-6 h-6" />
              {t('새로운 심리테스트 만들기', 'Crear nuevo test psicológico')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 기본 정보 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title" className="dark:text-gray-200">{t('테스트 제목', 'Título del test')}</Label>
                <Input
                  id="title"
                  value={quizForm.title}
                  onChange={(e) => setQuizForm({ ...quizForm, title: e.target.value })}
                  placeholder={t('예: MBTI 성격 유형 테스트', 'Ej: Test de personalidad MBTI')}
                  className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                />
              </div>
              
              <div>
                <Label htmlFor="category" className="dark:text-gray-200">{t('카테고리', 'Categoría')}</Label>
                <Select 
                  value={quizForm.category} 
                  onValueChange={(value) => setQuizForm({ ...quizForm, category: value })}
                >
                  <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100">
                    <SelectValue />
                  </SelectTrigger>
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
              <Textarea
                id="description"
                value={quizForm.description}
                onChange={(e) => setQuizForm({ ...quizForm, description: e.target.value })}
                placeholder={t('테스트에 대한 설명을 입력하세요...', 'Ingrese la descripción del test...')}
                rows={3}
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
              />
            </div>
            
            <div>
              <Label htmlFor="thumbnail" className="dark:text-gray-200">{t('썸네일 URL (선택사항)', 'URL de miniatura (opcional)')}</Label>
              <Input
                id="thumbnail"
                value={quizForm.thumbnail_url}
                onChange={(e) => setQuizForm({ ...quizForm, thumbnail_url: e.target.value })}
                placeholder="https://example.com/image.jpg"
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
              />
            </div>
          </CardContent>
        </Card>

        {/* 질문들 */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold dark:text-gray-100">{t('질문 관리', 'Gestión de preguntas')}</h3>
            <Button onClick={addQuestion} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              {t('질문 추가', 'Agregar Pregunta')}
            </Button>
          </div>

          {questions.map((question, index) => (
            <Card key={question.id} className="relative dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary">{t('질문', 'Pregunta')} {question.question_order}</Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingQuestion(editingQuestion?.id === question.id ? null : question)}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
                
                <Input
                  value={question.question_text}
                  onChange={(e) => updateQuestion(question.id, { question_text: e.target.value })}
                  placeholder={t('질문을 입력하세요...', 'Ingrese la pregunta...')}
                  className="text-lg dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                />
              </CardHeader>

              {editingQuestion?.id === question.id && (
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium dark:text-gray-200">{t('선택지', 'Opciones')}</h4>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => addOption(question.id)}
                        className="dark:border-gray-600 dark:text-gray-200"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        {t('선택지 추가', 'Agregar opción')}
                      </Button>
                    </div>

                    {question.quiz_options.map((option, optIndex) => (
                      <div key={option.id} className="flex gap-2">
                        <Input
                          value={option.option_text}
                          onChange={(e) => 
                            updateOption(question.id, option.id, { option_text: e.target.value })
                          }
                          placeholder={`${t('선택지', 'Opción')} ${option.option_order}`}
                          className="flex-1 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                        />
                        
                        <Input
                          value={option.result_type || ''}
                          onChange={(e) => 
                            updateOption(question.id, option.id, { result_type: e.target.value })
                          }
                          placeholder={t('결과 유형 (예: INTJ, IU, 로맨틱)', 'Tipo de resultado (ej: INTJ, IU, Romántico)')}
                          className="flex-1 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                        />
                        
                        {question.quiz_options.length > 2 && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => removeOption(question.id, option.id)}
                          >
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

        {/* 저장 버튼 */}
        {questions.length > 0 && (
          <div className="mt-8 flex justify-center">
            <Button
              onClick={saveQuiz}
              disabled={saving}
              className="bg-green-600 hover:bg-green-700 px-8 py-3"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {t('저장 중...', 'Guardando...')}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {t('테스트 저장하기', 'Guardar test')}
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
