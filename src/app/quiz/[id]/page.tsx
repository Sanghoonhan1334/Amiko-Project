'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle, 
  Clock,
  Users,
  Star,
  Languages
} from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'
import { useAuth } from '@/context/AuthContext'
import { toast } from 'sonner'
import { TranslationService } from '@/lib/translation'

interface Quiz {
  id: string
  title: string
  description: string
  category: string
  total_questions: number
  total_participants: number
}

interface Question {
  id: string
  question_text: string
  question_order: number
  quiz_options: Option[]
  translatedQuestionText?: string
}

interface Option {
  id: string
  option_text: string
  option_order: number
  mbti_axis?: string
  axis_weight?: number
  translatedOptionText?: string
}

interface QuizData {
  quiz: Quiz
  questions: Question[]
  results: any[]
}

export default function QuizParticipationPage() {
  const params = useParams()
  const router = useRouter()
  const { t } = useLanguage()
  const { user, token } = useAuth()
  
  const [quizData, setQuizData] = useState<QuizData | null>(null)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedOptions, setSelectedOptions] = useState<{ [key: string]: string }>({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [translatingQuestions, setTranslatingQuestions] = useState<Set<string>>(new Set())
  const [translationService] = useState(() => new TranslationService())

  const quizId = params.id as string

  useEffect(() => {
    if (quizId) {
      loadQuizData()
    }
  }, [quizId])

  const loadQuizData = async () => {
    try {
      setLoading(true)
      setError(null)

      // 샘플/임베디드 퀴즈인 경우 다른 페이지로 리다이렉트
      if (quizId.startsWith('sample-mbti') || quizId.startsWith('embedded-mbti')) {
        router.push('/quiz/sample-mbti')
        return
      }
      
      // MBTI 셀럽 테스트인 경우 전용 페이지로 리다이렉트
      if (quizId === '268caf0b-0031-4e58-9245-606e3421f1fd') {
        router.push('/quiz/mbti-celeb')
        return
      }

      const response = await fetch(`/api/quizzes/${quizId}`)
      
      if (!response.ok) {
        throw new Error('퀴즈를 불러올 수 없습니다.')
      }

      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || '퀴즈 데이터를 불러올 수 없습니다.')
      }

      setQuizData(result.data)
    } catch (error) {
      console.error('퀴즈 로드 오류:', error)
      setError(error instanceof Error ? error.message : '퀴즈를 불러올 수 없습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleOptionSelect = (questionId: string, optionId: string) => {
    setSelectedOptions(prev => ({
      ...prev,
      [questionId]: optionId
    }))
  }

  const handleTranslateQuestion = async (questionId: string) => {
    if (!quizData) return

    const question = quizData.questions.find(q => q.id === questionId)
    if (!question) return

    setTranslatingQuestions(prev => new Set(prev).add(questionId))

    try {
      // Translate question text
      const translatedQuestionText = await translationService.translateText(
        question.question_text,
        'ko',
        'es'
      )

      // Translate all options
      const translatedOptions = await Promise.all(
        question.quiz_options.map(async (option) => {
          const translatedOptionText = await translationService.translateText(
            option.option_text,
            'ko',
            'es'
          )
          return {
            ...option,
            translatedOptionText
          }
        })
      )

      // Update quiz data with translations
      setQuizData(prev => {
        if (!prev) return prev

        return {
          ...prev,
          questions: prev.questions.map(q => 
            q.id === questionId 
              ? {
                  ...q,
                  translatedQuestionText,
                  quiz_options: translatedOptions
                }
              : q
          )
        }
      })

      toast.success('질문이 번역되었습니다!')
    } catch (error) {
      console.error('번역 실패:', error)
      toast.error('번역에 실패했습니다.')
    } finally {
      setTranslatingQuestions(prev => {
        const newSet = new Set(prev)
        newSet.delete(questionId)
        return newSet
      })
    }
  }

  const handleNext = () => {
    if (currentQuestion < (quizData?.questions.length || 0) - 1) {
      setCurrentQuestion(prev => prev + 1)
    }
  }

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1)
    }
  }

  const handleSubmit = async () => {
    if (!user?.id) {
      toast.error('로그인이 필요합니다.')
      router.push('/sign-in')
      return
    }

    if (!token) {
      toast.error('인증 토큰이 없습니다. 다시 로그인해주세요.')
      router.push('/sign-in')
      return
    }

    if (!quizData) return

    // 모든 질문에 답변했는지 확인
    const unansweredQuestions = quizData.questions.filter(
      question => !selectedOptions[question.id]
    )

    if (unansweredQuestions.length > 0) {
      toast.error('모든 질문에 답변해주세요.')
      return
    }

    try {
      setSubmitting(true)

      // 응답 데이터 준비
      const responses = quizData.questions.map(question => ({
        questionId: question.id,
        optionId: selectedOptions[question.id]
      }))

      const response = await fetch('/api/quizzes/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${encodeURIComponent(token)}`
        },
        body: JSON.stringify({
          quizId: quizData.quiz.id,
          responses
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '퀴즈 제출에 실패했습니다.')
      }

      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || '퀴즈 제출에 실패했습니다.')
      }

      // 결과 페이지로 이동
      router.push(`/quiz/${quizId}/result?mbti=${result.data.mbtiType || result.data.resultType}`)
      
    } catch (error) {
      console.error('퀴즈 제출 오류:', error)
      toast.error(error instanceof Error ? error.message : '퀴즈 제출에 실패했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">퀴즈를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (error || !quizData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <div className="text-red-500 text-4xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">오류 발생</h2>
            <p className="text-gray-600 mb-4">{error || '퀴즈를 찾을 수 없습니다.'}</p>
            <Button onClick={() => router.back()} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              돌아가기
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const currentQuestionData = quizData.questions[currentQuestion]
  const progress = ((currentQuestion + 1) / quizData.questions.length) * 100
  const isLastQuestion = currentQuestion === quizData.questions.length - 1
  const isFirstQuestion = currentQuestion === 0
  const hasAnswered = selectedOptions[currentQuestionData.id]

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      {/* 헤더 */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button 
              onClick={() => router.back()} 
              variant="ghost" 
              size="sm"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              돌아가기
            </Button>
            
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span>{quizData.quiz.total_participants}명 참여</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>약 5분 소요</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* 퀴즈 정보 */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                {quizData.quiz.category === 'celebrity' ? 'K-POP 스타 매칭' : '성격 테스트'}
              </Badge>
            </div>
            <CardTitle className="text-2xl">{quizData.quiz.title}</CardTitle>
            <p className="text-gray-600">{quizData.quiz.description}</p>
          </CardHeader>
        </Card>

        {/* 진행률 */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              {currentQuestion + 1} / {quizData.questions.length}
            </span>
            <span className="text-sm text-gray-500">
              {Math.round(progress)}% 완료
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* 질문 */}
        <Card className="mb-8">
          <CardContent className="p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-800">
                {currentQuestionData.translatedQuestionText || currentQuestionData.question_text}
              </h2>
              <div className="flex items-center gap-2">
                {currentQuestionData.translatedQuestionText && (
                  <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                    번역됨
                  </Badge>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleTranslateQuestion(currentQuestionData.id)}
                  disabled={translatingQuestions.has(currentQuestionData.id)}
                  className="h-8 px-2"
                >
                  <Languages className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <div className="space-y-3">
              {currentQuestionData.quiz_options.map((option) => (
                <button
                  key={option.id}
                  onClick={() => handleOptionSelect(currentQuestionData.id, option.id)}
                  className={`w-full p-4 text-left rounded-lg border-2 transition-all duration-200 ${
                    selectedOptions[currentQuestionData.id] === option.id
                      ? 'border-purple-500 bg-purple-50 text-purple-700'
                      : 'border-gray-200 bg-white hover:border-purple-300 hover:bg-purple-25'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">
                      {option.translatedOptionText || option.option_text}
                    </span>
                    <div className="flex items-center gap-2">
                      {option.translatedOptionText && (
                        <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                          번역됨
                        </Badge>
                      )}
                      {selectedOptions[currentQuestionData.id] === option.id && (
                        <CheckCircle className="w-5 h-5 text-purple-500" />
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 네비게이션 */}
        <div className="flex items-center justify-between">
          <Button
            onClick={handlePrevious}
            disabled={isFirstQuestion}
            variant="outline"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            이전
          </Button>

          {isLastQuestion ? (
            <Button
              onClick={handleSubmit}
              disabled={!hasAnswered || submitting}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  제출 중...
                </>
              ) : (
                <>
                  <Star className="w-4 h-4 mr-2" />
                  결과 보기
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              disabled={!hasAnswered}
              className="bg-purple-600 hover:bg-purple-700"
            >
              다음
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}