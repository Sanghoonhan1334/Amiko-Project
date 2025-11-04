'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
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

// MBTI 질문 데이터 (12문제)
const mbtiQuestions = [
  // E vs I (외향/내향) - 3문제
  {
    id: 1,
    question: "En una fiesta, ¿qué haces?",
    options: [
      { text: "Converso con muchas personas y obtengo energía", type: "E", weight: 1 },
      { text: "Tengo conversaciones profundas con pocas personas cercanas", type: "I", weight: 1 }
    ]
  },
  {
    id: 2,
    question: "Después de un largo día, ¿qué prefieres?",
    options: [
      { text: "Salir y divertirme con amigos", type: "E", weight: 1 },
      { text: "Descansar solo en casa", type: "I", weight: 1 }
    ]
  },
  {
    id: 3,
    question: "Cuando conoces gente nueva, ¿cómo te sientes?",
    options: [
      { text: "Me emociono y me acerco activamente", type: "E", weight: 1 },
      { text: "Primero observo desde atrás", type: "I", weight: 1 }
    ]
  },
  // S vs N (감각/직관) - 3문제
  {
    id: 4,
    question: "Cuando comienzas un nuevo proyecto, ¿qué haces?",
    options: [
      { text: "Hago un plan paso a paso específico", type: "S", weight: 1 },
      { text: "Primero visualizo el panorama general", type: "N", weight: 1 }
    ]
  },
  {
    id: 5,
    question: "Al leer un libro, ¿qué prefieres?",
    options: [
      { text: "Historias basadas en hechos reales", type: "S", weight: 1 },
      { text: "Historias de fantasía e imaginación", type: "N", weight: 1 }
    ]
  },
  {
    id: 6,
    question: "¿En qué te enfocas más?",
    options: [
      { text: "En lo que está sucediendo ahora", type: "S", weight: 1 },
      { text: "En las posibilidades futuras", type: "N", weight: 1 }
    ]
  },
  // T vs F (사고/감정) - 3문제
  {
    id: 7,
    question: "Al tomar decisiones importantes, ¿qué haces?",
    options: [
      { text: "Valoro el análisis lógico y los hechos objetivos", type: "T", weight: 1 },
      { text: "Considero las emociones y la situación de las personas", type: "F", weight: 1 }
    ]
  },
  {
    id: 8,
    question: "Cuando un amigo tiene un problema, ¿qué haces?",
    options: [
      { text: "Le doy soluciones prácticas", type: "T", weight: 1 },
      { text: "Primero escucho y empatizo", type: "F", weight: 1 }
    ]
  },
  {
    id: 9,
    question: "¿Qué es más importante?",
    options: [
      { text: "La justicia y la equidad", type: "T", weight: 1 },
      { text: "La armonía y las relaciones", type: "F", weight: 1 }
    ]
  },
  // J vs P (판단/인식) - 3문제
  {
    id: 10,
    question: "En tu vida cotidiana, ¿cómo eres?",
    options: [
      { text: "Hago planes y vivo de manera sistemática", type: "J", weight: 1 },
      { text: "Actúo de manera flexible según la situación", type: "P", weight: 1 }
    ]
  },
  {
    id: 11,
    question: "Cuando viajas, ¿cómo prefieres hacerlo?",
    options: [
      { text: "Planeo todo el itinerario con anticipación", type: "J", weight: 1 },
      { text: "Decido espontáneamente en el momento", type: "P", weight: 1 }
    ]
  },
  {
    id: 12,
    question: "¿Cómo te sientes con los plazos?",
    options: [
      { text: "Me gusta terminar antes de tiempo", type: "J", weight: 1 },
      { text: "Trabajo mejor bajo presión cerca del plazo", type: "P", weight: 1 }
    ]
  }
]

export default function MbtiQuestionsPage() {
  const router = useRouter()
  const { language } = useLanguage()
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<{[key: number]: string}>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const currentQuestion = mbtiQuestions[currentQuestionIndex]
  const isLastQuestion = currentQuestionIndex === mbtiQuestions.length - 1

  const handleBack = () => {
    router.push('/quiz/mbti-kpop')
  }

  const handleAnswer = (optionType: string) => {
    // 답변 저장
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: optionType
    }))
    
    // 약간의 딜레이 후 자동으로 다음으로 이동
    setTimeout(() => {
      if (isLastQuestion) {
        // 테스트 완료 - 결과 계산
        calculateMbtiResult()
      } else {
        setCurrentQuestionIndex(prev => prev + 1)
      }
    }, 300) // 0.3초 딜레이로 사용자가 선택을 확인할 수 있게 함
  }

  const calculateMbtiResult = async () => {
    setIsSubmitting(true)
    
    // MBTI 점수 계산
    const scores = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 }
    
    Object.values(answers).forEach(answer => {
      if (answer in scores) {
        scores[answer as keyof typeof scores] += 1
      }
    })

    // MBTI 타입 결정
    const mbtiType = 
      (scores.E > scores.I ? 'E' : 'I') +
      (scores.S > scores.N ? 'S' : 'N') +
      (scores.T > scores.F ? 'T' : 'F') +
      (scores.J > scores.P ? 'J' : 'P')

    // 결과 페이지로 이동 (임시로 콘솔에 출력)
    console.log('MBTI 결과:', mbtiType, scores)
    
    // 로딩 후 결과 페이지로 이동
    setTimeout(() => {
      router.push('/quiz/mbti-kpop/result')
    }, 2000)
  }

  return (
    <div className="min-h-screen bg-white">
      <Suspense fallback={<HeaderFallback />}>
        <Header />
      </Suspense>
      
      <div className="pt-32 pb-8 px-4">
        <div className="max-w-2xl mx-auto">
          {/* 뒤로가기 버튼 */}
          <div className="mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </div>

          {/* 진행률 표시 */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">
                Pregunta {currentQuestionIndex + 1} / {mbtiQuestions.length}
              </span>
              <span className="text-sm text-gray-600">
                {Math.round(((currentQuestionIndex + 1) / mbtiQuestions.length) * 100)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentQuestionIndex + 1) / mbtiQuestions.length) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* 질문 카드 */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center">
              {currentQuestion.question}
            </h2>

            {/* 답변 옵션들 */}
            <div className="space-y-3">
              {currentQuestion.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswer(option.type)}
                  className={`w-full p-4 text-left rounded-lg border-2 transition-all duration-200 ${
                    answers[currentQuestion.id] === option.type
                      ? 'border-purple-500 bg-purple-50 text-purple-700'
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full border-2 ${
                      answers[currentQuestion.id] === option.type
                        ? 'border-purple-500 bg-purple-500'
                        : 'border-gray-300'
                    }`}>
                      {answers[currentQuestion.id] === option.type && (
                        <div className="w-full h-full rounded-full bg-white scale-50"></div>
                      )}
                    </div>
                    <span className="text-gray-800">{option.text}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 제출 중일 때 로딩 표시 */}
          {isSubmitting && (
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 text-purple-600">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                <span className="text-lg font-medium">Analizando tu personalidad...</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
