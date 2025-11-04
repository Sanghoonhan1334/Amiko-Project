'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { ArrowLeft, Users, Heart, Star, X, ChevronUp } from 'lucide-react'
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

// MBTI 테스트 질문 데이터

interface TestResult {
  mbti: string
  myType: {
    male: any
    female: any
  }
  bestMatch: {
    male: any
    female: any
  }
  bestMatchMbti: string
  compatibility: {
    note_ko: string
    note_es: string
  }
}

export default function MBTIKpopQuestionsPage() {
  const router = useRouter()
  const { t, language } = useLanguage()
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<number[]>([])
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [transitionDirection, setTransitionDirection] = useState<'next' | 'prev'>('next')

  // 현재 질문의 답변이 있으면 표시
  useEffect(() => {
    const currentAnswer = answers[currentQuestion]
    setSelectedAnswer(currentAnswer !== undefined ? currentAnswer : null)
  }, [currentQuestion, answers])
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<TestResult | null>(null)
  
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
        setResult(data.data)
      } else {
        toast.error(data.error || 'Error al cargar los resultados.')
      }
    } catch (error) {
      console.error('테스트 결과 오류:', error)
      toast.error('Error al procesar el test.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleBack = () => {
    router.push('/quiz/mbti-kpop')
  }

  const progress = ((currentQuestion + 1) / questions.length) * 100

  if (result) {
    return <TestResultComponent result={result} language={language} onRestart={() => {
      setResult(null)
      setCurrentQuestion(0)
      setAnswers([])
      setSelectedAnswer(null)
    }} />
  }

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

// 결과 컴포넌트
function TestResultComponent({ result, language, onRestart }: { result: TestResult, language: string, onRestart: () => void }) {
  const router = useRouter()
  const [selectedCeleb, setSelectedCeleb] = useState<any>(null)
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-yellow-50 to-blue-100">
      <Suspense fallback={<HeaderFallback />}>
        <Header />
      </Suspense>
      
      <div className="pt-32 pb-8 px-2">
        <div className="max-w-4xl mx-auto px-2">
          {/* 뒤로가기 버튼 */}
          <div className="mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/quiz/mbti-kpop')}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </div>

          {/* 결과 헤더 */}
          <div className="text-center mb-6">
            <h1 className="text-xl font-bold text-gray-800 mb-2">
              ¡Tu tipo es {result.mbti}!
            </h1>
            <p className="text-sm text-gray-600">
              ¡Encuentra celebridades de tu tipo MBTI y tipos compatibles contigo!
            </p>
          </div>

          {/* 나와 같은 유형의 셀럽 */}
          <div className="mb-6">
            <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-500" />
              Celebridades de mi tipo
            </h2>
            <div className="grid md:grid-cols-2 gap-3">
              {result.myType.male && (
                <CelebCard celeb={result.myType.male} language={language} onClick={() => setSelectedCeleb(result.myType.male)} />
              )}
              {result.myType.female && (
                <CelebCard celeb={result.myType.female} language={language} onClick={() => setSelectedCeleb(result.myType.female)} />
              )}
            </div>
          </div>

          {/* 궁합이 좋은 유형 */}
          {result.bestMatchMbti && (
            <div className="mb-6">
              <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                <Heart className="w-4 h-4 text-red-500" />
                Tipo compatible: {result.bestMatchMbti}
              </h2>
              {result.compatibility && (
                <p className="text-sm text-gray-600 mb-3 p-2 bg-blue-50 rounded-lg">
                  {result.compatibility.note_es}
                </p>
              )}
              <div className="grid md:grid-cols-2 gap-3">
                {result.bestMatch.male && (
                  <CelebCard celeb={result.bestMatch.male} language={language} onClick={() => setSelectedCeleb(result.bestMatch.male)} />
                )}
                {result.bestMatch.female && (
                  <CelebCard celeb={result.bestMatch.female} language={language} onClick={() => setSelectedCeleb(result.bestMatch.female)} />
                )}
              </div>
            </div>
          )}

          {/* 주의사항 */}
          <Card className="p-3 bg-yellow-50 border-yellow-200">
            <p className="text-xs text-yellow-800">
              ⚠️ Emparejamiento no oficial para entretenimiento. La información de MBTI y celebridades puede variar según el momento y la fuente.
            </p>
          </Card>

          {/* 재시작 버튼 */}
          <div className="text-center mt-6">
            <Button
              onClick={onRestart}
              className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-2 text-sm"
            >
              Hacer test de nuevo
            </Button>
          </div>
        </div>
      </div>

      {/* 연예인 이미지 확대 모달 */}
      {selectedCeleb && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 relative">
            <button
              onClick={() => setSelectedCeleb(null)}
              className="absolute top-2 right-2 p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="text-center">
              <div className="w-48 h-48 mx-auto mb-4 rounded-full overflow-hidden bg-gray-100">
                {selectedCeleb.image_url ? (
                  <img 
                    src={selectedCeleb.image_url} 
                    alt={selectedCeleb.stage_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Users className="w-16 h-16 text-gray-400" />
                  </div>
                )}
              </div>
              
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                {selectedCeleb.stage_name}
                {selectedCeleb.group_name && (
                  <span className="text-gray-500 ml-2">({selectedCeleb.group_name})</span>
                )}
              </h3>
              
              <div className="flex items-center justify-center gap-2 mb-4">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-700">
                  {selectedCeleb.mbti_code}
                </span>
                <span className="text-sm text-gray-500">
                  {selectedCeleb.gender === 'male' ? 'Hombre' : 'Mujer'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// 셀럽 카드 컴포넌트
function CelebCard({ celeb, language, onClick }: { celeb: any, language: string, onClick?: () => void }) {
  return (
    <Card className="p-3 bg-white shadow-md hover:shadow-lg transition-shadow cursor-pointer" onClick={onClick}>
      <div className="flex items-center gap-3">
        {/* 프로필 이미지 */}
        <div className="w-24 h-24 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center">
          {celeb.image_url ? (
            <img 
              src={celeb.image_url} 
              alt={celeb.stage_name}
              className="w-full h-full rounded-full object-cover hover:scale-105 transition-transform"
            />
          ) : (
            <Users className="w-12 h-12 text-gray-500" />
          )}
        </div>
        
        {/* 정보 */}
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-gray-800">
            {celeb.stage_name}
            {celeb.group_name && (
              <span className="text-xs text-gray-500 ml-1">({celeb.group_name})</span>
            )}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
              {celeb.mbti_code}
            </span>
            <span className="text-xs text-gray-500">
              {celeb.gender === 'male' ? 'Hombre' : 'Mujer'}
            </span>
          </div>
        </div>
      </div>
    </Card>
  )
}

