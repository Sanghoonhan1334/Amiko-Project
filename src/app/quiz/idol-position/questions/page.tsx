'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { ArrowLeft } from 'lucide-react'
import Header from '@/components/layout/Header'
import { useLanguage } from '@/context/LanguageContext'

function HeaderFallback() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 h-16">
      {/* Header skeleton */}
    </header>
  )
}

export default function IdolPositionQuestionsPage() {
  const router = useRouter()
  const { language } = useLanguage()
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<any[]>([])
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [questions, setQuestions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // 데이터베이스에서 질문 데이터 가져오기
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const response = await fetch('/api/quizzes/dea20361-fd46-409d-880f-f91869c1d184')
        const data = await response.json()
        if (data.success && data.data.questions) {
          setQuestions(data.data.questions)
        }
      } catch (error) {
        console.error('질문 로딩 실패:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchQuestions()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
        <Suspense fallback={<HeaderFallback />}>
          <Header />
        </Suspense>
        <div className="pt-32 pb-8 px-4">
          <div className="max-w-2xl mx-auto text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600 dark:border-gray-400 mx-auto"></div>
            <p className="mt-4 text-gray-600">질문을 불러오는 중...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!questions.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
        <Suspense fallback={<HeaderFallback />}>
          <Header />
        </Suspense>
        <div className="pt-32 pb-8 px-4">
          <div className="max-w-2xl mx-auto text-center">
            <p className="text-gray-600">질문을 불러올 수 없습니다.</p>
            <Button onClick={() => router.push('/quiz/idol-position')} className="mt-4">
              돌아가기
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // 결과 계산 함수
  const calculateResult = (answers: any[]) => {
    const scores = { vocalista: 0, bailarina: 0, lider: 0, rapera: 0, centro: 0 }
    
    answers.forEach(answer => {
      const question = questions.find(q => q.id === answer.questionId)
      const option = question?.quiz_options?.find((o: any) => o.id === answer.optionId)
      if (option) {
        // 데이터베이스의 result_type에 따라 점수 계산
        const resultType = option.result_type
        if (resultType === 'vocalista') scores.vocalista += option.score_value || 2
        else if (resultType === 'bailarina') scores.bailarina += option.score_value || 2
        else if (resultType === 'lider') scores.lider += option.score_value || 2
        else if (resultType === 'rapera') scores.rapera += option.score_value || 2
        else if (resultType === 'centro') scores.centro += option.score_value || 2
      }
    })
    
    const maxScore = Math.max(...Object.values(scores))
    const result = Object.keys(scores).find(key => scores[key as keyof typeof scores] === maxScore)
    
    return {
      position: result,
      scores,
      description: getPositionDescription(result)
    }
  }

  const getPositionDescription = (position: string | undefined) => {
    const descriptions: { [key: string]: { title: string; desc: string } } = {
      vocalista: {
        title: 'Vocalista Principal',
        desc: 'Tienes una voz única y poderosa que puede llevar las melodías principales del grupo. Tu capacidad para conectar emocionalmente con la audiencia a través de la música es excepcional.'
      },
      bailarina: {
        title: 'Bailarín Principal',
        desc: 'Tu energía y habilidades de baile te hacen destacar en el escenario. Eres capaz de ejecutar coreografías complejas y liderar visualmente las presentaciones del grupo.'
      },
      lider: {
        title: 'Líder',
        desc: 'Tienes las cualidades naturales de liderazgo para guiar al grupo. Tu carisma y capacidad para tomar decisiones importantes te hacen el líder ideal.'
      },
      rapera: {
        title: 'Rapero Principal',
        desc: 'Tu flow único y habilidades de rap te permiten expresar mensajes poderosos. Tienes la confianza y el carisma para destacar en las partes de rap.'
      },
      centro: {
        title: 'Centro',
        desc: 'Tienes la presencia escénica y el carisma para ser el centro de atención. Tu versatilidad te permite destacar en múltiples aspectos del grupo.'
      }
    }
    
    return descriptions[position || 'vocalista'] || descriptions.vocalista
  }

  const handleBack = () => {
    router.push('/quiz/idol-position')
  }

  const handleAnswerSelectAndNext = (optionId: string) => {
    if (isTransitioning) return

    setIsTransitioning(true)
    
    // 답변 저장
    const newAnswer = {
      questionId: questions[currentQuestion].id,
      optionId: optionId
    }
    
    const newAnswers = [...answers, newAnswer]
    setAnswers(newAnswers)

    setTimeout(async () => {
      if (currentQuestion === questions.length - 1) {
        // 마지막 질문이면 결과 계산 후 전용 결과 페이지로 이동
        const testResult = calculateResult(newAnswers)
        
        // 참여자 수 증가
        try {
          await fetch('/api/quiz/increment-participant', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ quizId: 'dea20361-fd46-409d-880f-f91869c1d184' })
          })
        } catch (error) {
          console.error('참여자 수 증가 실패:', error)
        }
        
        // 결과 타입을 URL 파라미터로 전달
        router.push(`/quiz/idol-position/result?type=${testResult.position}`)
      } else {
        // 다음 질문으로
        setCurrentQuestion(prev => prev + 1)
      }
      setIsTransitioning(false)
    }, 300)
  }

  const handleRestart = () => {
    setCurrentQuestion(0)
    setAnswers([])
  }

  const progress = ((currentQuestion + 1) / questions.length) * 100


  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <Suspense fallback={<HeaderFallback />}>
        <Header />
      </Suspense>
      
      {/* 테스트 진행 화면 */}
      <div className="pt-32 pb-8 px-2">
        <div className="max-w-4xl mx-auto">
          {/* 뒤로가기 버튼 */}
          <div className="mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="p-2 hover:bg-gray-100 rounded-full mb-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </div>

          {/* 진행률 */}
          <div className="mb-6">
            <div className="flex justify-between text-xs text-gray-600 mb-2">
              <span>{language === 'es' ? `Pregunta ${currentQuestion + 1} / ${questions.length}` : `질문 ${currentQuestion + 1} / ${questions.length}`}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            
            {/* 음표가 있는 진행률 바 */}
            <div className="relative">
              {/* 배경 바 */}
              <div className="w-full h-3 bg-white rounded-full border border-gray-200 shadow-inner">
                {/* 진행률 바 */}
                <div 
                  className="h-full bg-gradient-to-r from-purple-400 to-pink-400 rounded-full transition-all duration-500 ease-out relative"
                  style={{ width: `${progress}%` }}
                >
                  {/* 음표 아이콘 */}
                  <div className="absolute right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2">
                    <div className="w-6 h-6 bg-white rounded-full shadow-lg border border-purple-300 flex items-center justify-center">
                      <svg 
                        className="w-3 h-3 text-purple-500" 
                        fill="currentColor" 
                        viewBox="0 0 20 20"
                      >
                        <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.369 4.369 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z"/>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 질문 텍스트 (카드 밖으로) */}
          <h2 className="text-xl font-bold text-gray-800 mb-6 text-center px-2">
            {questions[currentQuestion].question_text}
          </h2>

          {/* 선택지들 (각각의 카드만) */}
          <div className="space-y-3 px-2">
            {questions[currentQuestion].quiz_options?.map((option: any) => (
              <button
                key={option.id}
                onClick={() => handleAnswerSelectAndNext(option.id)}
                disabled={isTransitioning}
                className={`w-full p-4 text-left rounded-lg border-2 transition-all duration-200 bg-white shadow-sm ${
                  isTransitioning
                    ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                    : 'border-gray-200 hover:border-purple-300 hover:bg-purple-25 cursor-pointer'
                }`}
              >
                <span className="font-medium text-gray-800">{option.option_text}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
