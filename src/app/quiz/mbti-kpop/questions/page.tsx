'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { ArrowLeft, Users, Heart, Star, X, ChevronUp, Share2, RotateCcw, List } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Header from '@/components/layout/Header'
import { toast } from 'sonner'
import { useLanguage } from '@/context/LanguageContext'

function HeaderFallback() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 h-16">
      {/* Header skeleton */}
    </header>
  )
}

export default function MBTIKpopQuestionsPage() {
  const router = useRouter()
  const { t, language } = useLanguage()
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<number[]>([])
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [transitionDirection, setTransitionDirection] = useState<'next' | 'prev'>('next')
  const [isLoading, setIsLoading] = useState(false)
  
  // MBTI 테스트 질문 데이터 (12개 질문 - 스페인어)
  const questions = [
    { id: 1, question: 'En una fiesta con gente nueva...', options: ['Converso con muchas personas y obtengo energía', 'Tengo conversaciones profundas con pocas personas cercanas'], dimension: "EI" },
    { id: 2, question: 'Al resolver problemas...', options: ['Me acerco basándome en experiencia y hechos reales', 'Exploro nuevas ideas y posibilidades'], dimension: "SN" },
    { id: 3, question: 'Al tomar decisiones importantes...', options: ['Priorizo el análisis lógico y criterios objetivos', 'Considero el impacto emocional y los valores'], dimension: "TF" },
    { id: 4, question: 'En mi estilo de vida...', options: ['Prefiero planificar y tener estructura', 'Me adapto flexiblemente a las circunstancias'], dimension: "JP" },
    { id: 5, question: 'Cuando estoy estresado...', options: ['Busco compañía y hablo con otros', 'Necesito tiempo a solas para procesar'], dimension: "EI" },
    { id: 6, question: 'Al aprender algo nuevo...', options: ['Prefiero métodos probados y prácticos', 'Disfruto explorando teorías y conceptos'], dimension: "SN" },
    { id: 7, question: 'En situaciones de conflicto...', options: ['Analizo los hechos y busco la verdad', 'Me enfoco en mantener la armonía'], dimension: "TF" },
    { id: 8, question: 'En proyectos de trabajo...', options: ['Me gusta completar todo antes de empezar algo nuevo', 'Prefiero tener múltiples proyectos en progreso'], dimension: "JP" },
    { id: 9, question: 'En reuniones sociales...', options: ['Soy el centro de atención y hablo mucho', 'Escucho más de lo que hablo'], dimension: "EI" },
    { id: 10, question: 'Cuando leo un libro...', options: ['Me enfoco en los detalles y hechos específicos', 'Me interesan las ideas generales y el significado'], dimension: "SN" },
    { id: 11, question: 'Al dar consejos...', options: ['Soy directo y objetivo', 'Considero los sentimientos de la persona'], dimension: "TF" },
    { id: 12, question: 'En mis vacaciones...', options: ['Planifico actividades específicas con anticipación', 'Prefiero improvisar y ser espontáneo'], dimension: "JP" }
  ]

  const handleAnswerSelect = (answerIndex: number) => {
    setSelectedAnswer(answerIndex)
    
    // 답변 저장
    const newAnswers = [...answers]
    newAnswers[currentQuestion] = answerIndex
    setAnswers(newAnswers)

    // 애니메이션 시작 후 자동으로 다음으로 이동
    setTransitionDirection('next')
    setIsTransitioning(true)
    
    setTimeout(() => {
      if (currentQuestion < questions.length - 1) {
        // 다음 질문으로
        setCurrentQuestion(currentQuestion + 1)
        setSelectedAnswer(null)
        setIsTransitioning(false)
      } else {
        // 마지막 질문이면 결과 계산
        calculateResult(newAnswers)
      }
    }, 300)
  }

  const calculateResult = async (finalAnswers: number[]) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/mbti-kpop-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ answers: finalAnswers }),
      })

      const data = await response.json()

      if (data.success) {
        // 결과 페이지로 리다이렉트 (MBTI 타입을 URL 파라미터로 전달)
        router.push(`/quiz/mbti-kpop/result?mbti=${data.data.mbti}`)
      } else {
        toast.error(data.error || 'Error al cargar los resultados.')
        setIsLoading(false)
      }
    } catch (error) {
      console.error('테스트 결과 오류:', error)
      toast.error('Error al procesar el test.')
      setIsLoading(false)
    }
  }

  const handleBack = () => {
    router.push('/quiz/mbti-kpop')
  }

  const progress = ((currentQuestion + 1) / questions.length) * 100

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-yellow-50 to-blue-100">
      <Suspense fallback={<HeaderFallback />}>
        <Header />
      </Suspense>
      
      {/* 테스트 진행 화면 */}
      <div className="pt-32 pb-8 px-2">
        <div className="max-w-2xl mx-auto px-2">
          {/* 헤더 */}
          <div className="mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="p-2 hover:bg-gray-100 rounded-full mb-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-lg font-bold text-gray-800">
                Test de MBTI × Celebridades K-POP
              </h1>
              <p className="text-xs text-gray-600">
                ¡Encuentra celebridades de tu tipo MBTI y tipos compatibles contigo!
              </p>
            </div>
          </div>

          {/* 진행률 */}
          <div className="mb-6">
            <div className="flex justify-between text-xs text-gray-600 mb-2">
              <span>Pregunta {currentQuestion + 1} / {questions.length}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2 transition-all duration-500 ease-out" />
          </div>

          {/* 질문 카드 */}
          <Card className={`p-3 mb-3 bg-white shadow-lg transition-all duration-300 ${
            isTransitioning 
              ? transitionDirection === 'next' 
                ? 'opacity-0 transform translate-x-8' 
                : 'opacity-0 transform -translate-x-8'
              : 'opacity-100 transform translate-x-0'
          }`}>
            <h2 className="text-sm font-semibold text-gray-800 mb-2">
              {questions[currentQuestion].question}
            </h2>
            
            <div className="space-y-1 mb-2">
              {questions[currentQuestion].options.map((option, index) => (
                <Button
                  key={index}
                  variant={selectedAnswer === index ? "default" : "outline"}
                  className={`w-full p-1.5 h-auto text-left justify-start transition-all duration-200 text-xs whitespace-normal ${
                    selectedAnswer === index 
                      ? "bg-purple-500 text-white border-purple-500" 
                      : "hover:bg-purple-50 hover:border-purple-300"
                  }`}
                  onClick={() => handleAnswerSelect(index)}
                >
                  <span className={`${selectedAnswer === index ? "text-white" : "text-gray-700"} leading-relaxed`}>{option}</span>
                </Button>
              ))}
            </div>

          </Card>

          {/* 로딩 상태 */}
          {isLoading && (
            <Card className="p-6 bg-white shadow-lg">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600 dark:border-gray-400 mx-auto mb-4"></div>
                <p className="text-gray-600">Analizando resultados...</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
