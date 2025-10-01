'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'
import { useAuth } from '@/context/AuthContext'
import { toast } from 'sonner'

interface QuizOption {
  id: string
  option_text: string
  result_type: string
  option_order: number
}

interface QuizQuestion {
  id: string
  question_text: string
  question_order: number
  quiz_options: QuizOption[]
}

interface Quiz {
  id: string
  title: string
  description: string
  category: string
  thumbnail_url: string | null
  total_questions: number
  questions: QuizQuestion[]
}

export default function QuizPage() {
  const params = useParams()
  const router = useRouter()
  const { t } = useLanguage()
  const { user } = useAuth()
  const quizId = params.id as string

  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<{ question_id: string; option_id: string }[]>([])
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchQuiz()
  }, [quizId])

  const fetchQuiz = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/quizzes/${quizId}`)
      
      if (!response.ok) {
        throw new Error('퀴즈 조회 실패')
      }

      const data = await response.json()
      setQuiz(data.quiz)
    } catch (error) {
      console.error('퀴즈 불러오기 실패:', error)
      toast.error(t('tests.errorLoading'))
      router.push('/main?tab=community&view=tests')
    } finally {
      setLoading(false)
    }
  }

  const handleOptionSelect = (optionId: string) => {
    setSelectedOption(optionId)
  }

  const handleNext = () => {
    if (!selectedOption || !quiz) return

    const currentQuestionData = quiz.questions[currentQuestion]
    
    // 현재 질문의 답변 저장
    const newAnswers = answers.filter(a => a.question_id !== currentQuestionData.id)
    newAnswers.push({
      question_id: currentQuestionData.id,
      option_id: selectedOption
    })
    setAnswers(newAnswers)

    // 다음 질문으로 이동
    if (currentQuestion < quiz.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
      // 다음 질문에 이미 답변이 있는지 확인
      const nextQuestionId = quiz.questions[currentQuestion + 1].id
      const existingAnswer = newAnswers.find(a => a.question_id === nextQuestionId)
      setSelectedOption(existingAnswer?.option_id || null)
    } else {
      // 마지막 질문이면 제출
      handleSubmit(newAnswers)
    }
  }

  const handlePrevious = () => {
    if (currentQuestion > 0 && quiz) {
      setCurrentQuestion(currentQuestion - 1)
      // 이전 질문의 답변 불러오기
      const prevQuestionId = quiz.questions[currentQuestion - 1].id
      const existingAnswer = answers.find(a => a.question_id === prevQuestionId)
      setSelectedOption(existingAnswer?.option_id || null)
    }
  }

  const handleSubmit = async (finalAnswers: { question_id: string; option_id: string }[]) => {
    try {
      setSubmitting(true)
      
      const response = await fetch(`/api/quizzes/${quizId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          answers: finalAnswers,
          userId: user?.id || null
        })
      })

      if (!response.ok) {
        throw new Error('답변 제출 실패')
      }

      const data = await response.json()
      
      // 결과를 localStorage에 저장
      localStorage.setItem(`quiz_result_${quizId}`, JSON.stringify(data))
      
      // 결과 페이지로 이동 (MBTI 코드 전달)
      router.push(`/quiz/${quizId}/result?mbti=${data.mbti_code}`)
      
    } catch (error) {
      console.error('답변 제출 실패:', error)
      toast.error('답변 제출 중 오류가 발생했습니다')
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="animate-pulse text-center">
          <div className="w-16 h-16 bg-blue-200 rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    )
  }

  if (!quiz) {
    return null
  }

  const currentQuestionData = quiz.questions[currentQuestion]
  const progress = ((currentQuestion + 1) / quiz.questions.length) * 100

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* 헤더 */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.push('/main?tab=community&view=tests')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('tests.title')}
          </Button>

          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{quiz.title}</h1>
            <p className="text-sm text-gray-600 mb-4">{quiz.description}</p>
            
            {/* 진행률 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">
                  {t('tests.question')} {currentQuestion + 1} {t('tests.of')} {quiz.questions.length}
                </span>
                <span className="text-blue-600 font-medium">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </div>
        </div>

        {/* 질문 카드 */}
        <Card className="p-8 shadow-xl">
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Q{currentQuestion + 1}. {currentQuestionData.question_text}
            </h2>
          </div>

          {/* 선택지 */}
          <div className="space-y-3">
            {currentQuestionData.quiz_options.map((option) => (
              <button
                key={option.id}
                onClick={() => handleOptionSelect(option.id)}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                  selectedOption === option.id
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center">
                  <div
                    className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${
                      selectedOption === option.id
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-300'
                    }`}
                  >
                    {selectedOption === option.id && (
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    )}
                  </div>
                  <span className="text-gray-900">{option.option_text}</span>
                </div>
              </button>
            ))}
          </div>

          {/* 버튼 */}
          <div className="flex items-center justify-between mt-8">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentQuestion === 0}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('tests.previous')}
            </Button>

            <Button
              onClick={handleNext}
              disabled={!selectedOption || submitting}
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
            >
              {submitting ? (
                '제출 중...'
              ) : currentQuestion === quiz.questions.length - 1 ? (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  {t('tests.submit')}
                </>
              ) : (
                <>
                  {t('tests.next')}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}

