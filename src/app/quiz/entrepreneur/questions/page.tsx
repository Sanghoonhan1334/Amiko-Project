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

export default function EntrepreneurQuestionsPage() {
  const router = useRouter()
  const { language } = useLanguage()
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<any[]>([])
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [questions, setQuestions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Obtener datos de preguntas desde la base de datos
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const response = await fetch('/api/quizzes/entrepreneur')
        const data = await response.json()
        console.log('[Entrepreneur Questions] Respuesta API:', data)
        if (data.success && data.data && data.data.questions) {
          console.log('[Entrepreneur Questions] Preguntas cargadas exitosamente:', data.data.questions.length, 'preguntas')
          // Eliminar duplicados: eliminar duplicados basados en question_order (mantener solo el primero)
          const seenOrders = new Set<number>()
          const uniqueQuestions = data.data.questions.filter((question: any) => {
            const order = question.question_order
            if (seenOrders.has(order)) {
              console.log('[Entrepreneur Questions] Pregunta duplicada eliminada:', order, question.question_text)
              return false
            }
            seenOrders.add(order)
            return true
          })
          console.log('[Entrepreneur Questions] Después de eliminar duplicados:', uniqueQuestions.length, 'preguntas')
          // Ordenar por question_order
          uniqueQuestions.sort((a: any, b: any) => (a.question_order || 0) - (b.question_order || 0))
          setQuestions(uniqueQuestions)
        } else {
          console.error('[Entrepreneur Questions] No hay datos de preguntas:', data)
        }
      } catch (error) {
        console.error('[Entrepreneur Questions] Error al cargar preguntas:', error)
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
            <p className="mt-4 text-gray-600">Cargando preguntas...</p>
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
          <div className="max-w-2xl mx-auto">
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-xl text-center">
              <p className="text-gray-700 text-lg mb-4">No se pudieron cargar las preguntas.</p>
              <p className="text-gray-500 text-sm mb-6">No hay preguntas en la base de datos o ocurrió un error en la API.</p>
              <Button onClick={() => router.push('/quiz/entrepreneur')} className="bg-purple-500 hover:bg-purple-600 text-white">
                Volver
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Función para calcular el resultado
  const calculateResult = (answers: any[]) => {
    const scores: { [key: string]: number } = {
      'sonador-impulsivo': 0,
      'jefe-del-camino': 0,
      'cerebro-oculto': 0,
      'tranquilo-que-nunca-falla': 0,
      'coleccionista-de-contactos': 0,
      'artista-del-negocio': 0,
      'rompecodigos': 0,
      'salta-sin-avisar': 0
    }
    
    answers.forEach(answer => {
      const question = questions.find(q => q.id === answer.questionId)
      const option = question?.quiz_options?.find((o: any) => o.id === answer.optionId)
      if (option && option.result_type) {
        const resultType = option.result_type
        if (scores[resultType] !== undefined) {
          scores[resultType] += 1
        }
      }
    })
    
    // Encontrar el result_type con la puntuación más alta
    const maxScore = Math.max(...Object.values(scores))
    const result = Object.keys(scores).find(key => scores[key as keyof typeof scores] === maxScore)
    
    return result || 'sonador-impulsivo'
  }

  const handleBack = () => {
    router.push('/quiz/entrepreneur')
  }

  const handleAnswerSelectAndNext = (optionId: string) => {
    if (isTransitioning) return

    setIsTransitioning(true)
    
    // Guardar respuesta
    const newAnswer = {
      questionId: questions[currentQuestion].id,
      optionId: optionId
    }
    
    const newAnswers = [...answers, newAnswer]
    setAnswers(newAnswers)

    setTimeout(async () => {
      if (currentQuestion === questions.length - 1) {
        // Si es la última pregunta, calcular el resultado e ir a la página de resultados
        const testResult = calculateResult(newAnswers)
        
        // Incrementar número de participantes
        try {
          const quizResponse = await fetch('/api/quizzes/entrepreneur')
          const quizData = await quizResponse.json()
          if (quizData.success && quizData.data.quiz) {
            await fetch('/api/quiz/increment-participant', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ quizId: quizData.data.quiz.id })
            })
          }
        } catch (error) {
          console.error('Error al incrementar número de participantes:', error)
        }
        
        // Pasar el tipo de resultado como parámetro de URL
        router.push(`/quiz/entrepreneur/result?type=${testResult}`)
      } else {
        // A la siguiente pregunta
        setCurrentQuestion(prev => prev + 1)
      }
      setIsTransitioning(false)
    }, 300)
  }

  const handleRestart = () => {
    setCurrentQuestion(0)
    setAnswers([])
  }

  const progress = questions.length > 0 ? ((currentQuestion + 1) / questions.length) * 100 : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <Suspense fallback={<HeaderFallback />}>
        <Header />
      </Suspense>
      
      {/* Pantalla de progreso del test */}
      <div className="pt-32 pb-8 px-2">
        <div className="max-w-4xl mx-auto">
          {/* Botón de retroceso */}
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

          {/* Progreso */}
          <div className="mb-6">
            <div className="flex justify-between text-xs text-gray-600 mb-2">
              <span>{questions.length > 0 ? `Pregunta ${currentQuestion + 1} / ${questions.length}` : 'Cargando preguntas...'}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            
            {/* Barra de progreso */}
            <div className="relative">
              <div className="w-full h-3 bg-gray-200 rounded-full">
                <div 
                  className="h-full bg-gradient-to-r from-purple-400 to-pink-400 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Texto de la pregunta */}
          {questions[currentQuestion] && (
            <>
              <div className="mb-6 bg-white rounded-2xl p-6 shadow-lg">
                <h2 className="text-xl md:text-2xl font-bold text-gray-800 text-center">
                  {questions[currentQuestion].question_text}
                </h2>
              </div>

              {/* Opciones */}
              <div className="space-y-3 px-2">
                {questions[currentQuestion].quiz_options?.map((option: any, index: number) => (
                  <button
                    key={option.id}
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      if (!isTransitioning) {
                        handleAnswerSelectAndNext(option.id)
                      }
                    }}
                    disabled={isTransitioning}
                    className={`w-full p-5 text-left rounded-xl border-2 transition-all duration-200 bg-white shadow-lg ${
                      isTransitioning
                        ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                        : 'border-gray-200 hover:border-purple-400 hover:bg-purple-50 cursor-pointer hover:shadow-xl transform hover:scale-[1.02]'
                    }`}
                    style={{ pointerEvents: isTransitioning ? 'none' : 'auto' }}
                  >
                    <span className="font-medium text-gray-800 text-lg">{option.option_text}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}


