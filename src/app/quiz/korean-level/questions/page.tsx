'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/context/LanguageContext'

interface Question {
  id: number
  question: string
  questionKo: string
  options: string[]
  correctAnswer: number
  difficulty: string
}

export default function KoreanLevelQuestionsPage() {
  const router = useRouter()
  const { language } = useLanguage()
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [answers, setAnswers] = useState<number[]>([])
  const [showResult, setShowResult] = useState(false)

  // 한국어 레벨 테스트 질문들
  const koreanQuestions: Question[] = [
    {
      id: 1,
      question: "¿Cómo se escribe 'Annyeonghaseyo' (Hola) en hangul (alfabeto coreano)?",
      questionKo: "\"안녕하세요\" (Hola)는 한글로 어떻게 쓰나요?",
      options: ["아녕하세요", "안용하세요", "안녕하세요", "안녕하새요"],
      correctAnswer: 2,
      difficulty: "Fácil"
    },
    {
      id: 2,
      question: "¿Qué significa la palabra coreana '사랑해' (Saranghae)?",
      questionKo: "한국어 단어 \"사랑해\"는 무슨 뜻인가요?",
      options: ["Tengo hambre", "Te amo", "Adiós", "Gracias"],
      correctAnswer: 1,
      difficulty: "Fácil"
    },
    {
      id: 3,
      question: "¿Cómo se dice 'Sí' en coreano formal?",
      questionKo: "\"네\" (Yes)는 한국어로 어떻게 말하나요?",
      options: ["주세요 (Juseyo)", "아니요 (Aniyo)", "몰라요 (Mollayo)", "네 (Ne)"],
      correctAnswer: 3,
      difficulty: "Fácil"
    },
    {
      id: 4,
      question: "¿Qué significa '고맙습니다' (Gomapseumnida)?",
      questionKo: "\"고맙습니다\"는 무슨 뜻인가요?",
      options: ["Perdón", "Gracias", "Hola", "Adiós"],
      correctAnswer: 1,
      difficulty: "Fácil"
    },
    {
      id: 5,
      question: "¿Cómo se escribe el número '5' en hangul?",
      questionKo: "숫자 '5'는 한글로 어떻게 쓰나요?",
      options: ["일", "이", "삼", "오"],
      correctAnswer: 3,
      difficulty: "Fácil"
    },
    {
      id: 6,
      question: "¿Cuál es la traducción de '물' (mul)?",
      questionKo: "\"물\"의 뜻은 무엇인가요?",
      options: ["Fuego", "Agua", "Tierra", "Aire"],
      correctAnswer: 1,
      difficulty: "Fácil"
    },
    {
      id: 7,
      question: "¿Cómo se dice '¿Cómo estás?' en coreano?",
      questionKo: "\"어떻게 지내세요?\"는 한국어로 어떻게 말하나요?",
      options: ["안녕하세요?", "어떻게 지내세요?", "뭐 해요?", "어디 가세요?"],
      correctAnswer: 1,
      difficulty: "Intermedio"
    },
    {
      id: 8,
      question: "¿Qué significa '학교' (hakgyo)?",
      questionKo: "\"학교\"는 무슨 뜻인가요?",
      options: ["Casa", "Escuela", "Hospital", "Tienda"],
      correctAnswer: 1,
      difficulty: "Intermedio"
    },
    {
      id: 9,
      question: "¿Cómo se dice 'Buenos días' en coreano?",
      questionKo: "\"좋은 아침\"은 한국어로 어떻게 말하나요?",
      options: ["좋은 아침", "좋은 저녁", "좋은 밤", "좋은 오후"],
      correctAnswer: 0,
      difficulty: "Intermedio"
    },
    {
      id: 10,
      question: "¿Cuál es la forma formal de 'comer' en coreano?",
      questionKo: "\"먹다\"의 존댓말은 무엇인가요?",
      options: ["먹어요", "드세요", "먹습니다", "드시다"],
      correctAnswer: 2,
      difficulty: "Intermedio"
    }
  ]

  const currentQuestion = koreanQuestions[currentQuestionIndex]

  const handleAnswerSelect = (answerIndex: number) => {
    setSelectedAnswer(answerIndex)
    
    // 자동으로 다음 질문으로 이동
    setTimeout(() => {
      const newAnswers = [...answers, answerIndex]
      setAnswers(newAnswers)
      
      if (currentQuestionIndex < koreanQuestions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1)
        setSelectedAnswer(null)
      } else {
        // 마지막 질문 완료
        router.push('/quiz/korean-level/loading')
      }
    }, 500)
  }

  // 진행률 계산
  const progress = ((currentQuestionIndex + 1) / koreanQuestions.length) * 100

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-50 to-blue-100">
      {/* 헤더 */}
      <div className="bg-white/80 backdrop-blur-sm shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <span className="text-2xl">📚</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">
                  {language === 'ko' ? '한국어 레벨 테스트' : 'Prueba de Nivel de Coreano'}
                </h1>
                <p className="text-sm text-gray-600">
                  {language === 'ko' ? '질문' : 'Pregunta'} {currentQuestionIndex + 1} / {koreanQuestions.length}
                </p>
              </div>
            </div>
            
            {/* 진행률 표시 */}
            <div className="flex-1 max-w-xs ml-8">
              <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                <span>{language === 'ko' ? '진행률' : 'Progreso'}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* 질문 카드 */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-8 mb-8">
            {/* 난이도 표시 */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-600">
                  {language === 'ko' ? '난이도' : 'Dificultad'}:
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  currentQuestion.difficulty === 'Fácil' 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {currentQuestion.difficulty}
                </span>
              </div>
              <span className="text-sm text-gray-500">
                {currentQuestion.id} / {koreanQuestions.length}
              </span>
            </div>

            {/* 질문 */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4 leading-relaxed">
                {language === 'ko' ? currentQuestion.questionKo : currentQuestion.question}
              </h2>
            </div>

            {/* 선택지 */}
            <div className="space-y-4">
              {currentQuestion.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(index)}
                  disabled={selectedAnswer !== null}
                  className={`w-full p-4 text-left rounded-xl border-2 transition-all duration-300 ${
                    selectedAnswer === index
                      ? 'border-purple-500 bg-purple-50 text-purple-700'
                      : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50 text-gray-700'
                  } ${selectedAnswer !== null ? 'cursor-not-allowed' : 'cursor-pointer hover:shadow-md'}`}
                >
                  <div className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-4 font-bold ${
                      selectedAnswer === index
                        ? 'bg-purple-500 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      {String.fromCharCode(65 + index)}
                    </div>
                    <span className="text-lg">{option}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 하단 정보 */}
          <div className="text-center">
            <p className="text-gray-600 text-sm">
              {language === 'ko' 
                ? '답을 선택하면 자동으로 다음 질문으로 넘어갑니다'
                : 'Selecciona una respuesta para continuar automáticamente'
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
