'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Header from '@/components/layout/Header'

interface Question {
  id: number
  question: string
  options: {
    text: string
    type: string
    weight: number
  }[]
}

// 운세 테스트 질문 데이터 (스페인어)
const fortuneQuestions: Question[] = [
  {
    id: 1,
    question: "¿Cómo te sientes hoy?",
    options: [
      { text: "Me siento pesado y sin energía", type: "negative", weight: 1 },
      { text: "Me siento ligero y energético", type: "positive", weight: 1 }
    ]
  },
  {
    id: 2,
    question: "Yo soy alguien que",
    options: [
      { text: "Se deja llevar por el ambiente", type: "reactive", weight: 1 },
      { text: "Dirige el ambiente", type: "proactive", weight: 1 }
    ]
  },
  {
    id: 3,
    question: "Estar solo es",
    options: [
      { text: "Necesario", type: "introvert", weight: 1 },
      { text: "Algo que no me gusta", type: "extrovert", weight: 1 }
    ]
  },
  {
    id: 4,
    question: "Lo que quiero es",
    options: [
      { text: "Paz mental", type: "spiritual", weight: 1 },
      { text: "Paz financiera", type: "material", weight: 1 }
    ]
  },
  {
    id: 5,
    question: "Sin querer",
    options: [
      { text: "Quiero recoger 500 pesos", type: "practical", weight: 1 },
      { text: "Quiero recoger un trébol de cuatro hojas", type: "romantic", weight: 1 }
    ]
  },
  {
    id: 6,
    question: "La vida es",
    options: [
      { text: "Un huevo", type: "simple", weight: 1 },
      { text: "Una papa", type: "complex", weight: 1 }
    ]
  },
  {
    id: 7,
    question: "El gasto excesivo",
    options: [
      { text: "Quiero hacerlo", type: "spender", weight: 1 },
      { text: "Es molesto", type: "saver", weight: 1 },
      { text: "No tengo dinero", type: "realistic", weight: 1 }
    ]
  },
  {
    id: 8,
    question: "El color de la ropa que llevo es",
    options: [
      { text: "Colores neutros", type: "neutral", weight: 1 },
      { text: "Colores vivos", type: "colorful", weight: 1 }
    ]
  },
  {
    id: 9,
    question: "El día de hoy",
    options: [
      { text: "Ojalá pase sin problemas", type: "stable", weight: 1 },
      { text: "Ojalá sea más divertido que nunca", type: "exciting", weight: 1 }
    ]
  }
]

export default function FortuneQuestionsPage() {
  const router = useRouter()
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<{[key: number]: string}>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const currentQuestion = fortuneQuestions[currentQuestionIndex]
  const isLastQuestion = currentQuestionIndex === fortuneQuestions.length - 1
  const canProceed = selectedAnswers[currentQuestion.id] !== undefined

  const handleBack = () => {
    router.push('/quiz/fortune')
  }

  const handleAnswerSelect = (answerType: string) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: answerType
    }))

    // 자동으로 다음 질문으로 넘어가기
    setTimeout(() => {
      if (isLastQuestion) {
        handleSubmit()
      } else {
        setCurrentQuestionIndex(prev => prev + 1)
      }
    }, 500) // 0.5초 후 자동 진행
  }

  const handleNext = () => {
    if (isLastQuestion) {
      handleSubmit()
    } else {
      setCurrentQuestionIndex(prev => prev + 1)
    }
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1)
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    
    // 답변을 로컬 스토리지에 저장
    localStorage.setItem('fortune_answers', JSON.stringify(selectedAnswers))
    
    // 로딩 페이지로 이동
    setTimeout(() => {
      router.push('/quiz/fortune/loading')
    }, 500)
  }

  return (
    <div className="min-h-screen bg-[#FDF4E6]">
      <Header />
      
      <div className="pt-32 pb-8 px-4">
        <div className="max-w-md mx-auto">
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

          {/* 진행바 */}
          <div className="mb-8">
            <div className="relative w-full h-2 bg-[#FFB74D] rounded-full overflow-visible">
              <div 
                className="h-full bg-[#F7A74B] transition-all duration-300 ease-out"
                style={{ width: `${((currentQuestionIndex + 1) / fortuneQuestions.length) * 100}%` }}
              ></div>
            </div>
            
            {/* 포춘쿠키 아이콘 - 진행바 밖에 완전히 분리 */}
            <div className="relative -mt-4">
              <div 
                className="absolute w-12 h-12 flex items-center justify-center transition-all duration-300 ease-out"
                style={{ left: `calc(${((currentQuestionIndex + 1) / fortuneQuestions.length) * 100}% - 24px)` }}
              >
                <span className="text-2xl">🥠</span>
              </div>
            </div>
          </div>

          {/* 질문 */}
          <div className="text-center mb-12 mt-32">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Pregunta {currentQuestion.id}.
            </h2>
            <p className="text-xl font-bold text-gray-900">
              {currentQuestion.question}
            </p>
          </div>

          {/* 답변 옵션 */}
          <div className="space-y-4 mb-8">
            {currentQuestion.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswerSelect(option.type)}
                className={`w-full p-4 rounded-lg border-2 transition-all duration-200 ${
                  selectedAnswers[currentQuestion.id] === option.type
                    ? 'border-[#F7A74B] bg-white shadow-md'
                    : 'border-[#FFB74D] bg-white hover:border-[#F7A74B] hover:shadow-sm'
                }`}
              >
                <span className="text-lg font-bold text-gray-900">
                  {option.text}
                </span>
              </button>
            ))}
          </div>


          {/* 진행 표시 */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600">
              Pregunta {currentQuestionIndex + 1} / {fortuneQuestions.length}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
