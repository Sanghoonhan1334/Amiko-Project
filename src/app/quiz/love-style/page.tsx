'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { ArrowLeft, Heart, Star, X, ChevronUp } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Header from '@/components/layout/Header'
import { toast } from 'sonner'
import { useLanguage } from '@/context/LanguageContext'

// 연애 스타일 테스트 질문 데이터
interface LoveStyleResult {
  type: string
  displayName: string
  description: string
  stats: {
    affection: number      // 애정표현
    independence: number   // 독립성
    communication: number  // 소통방식
    romance: number        // 로맨틱함
  }
  characteristics: string[]
  compatibility: string[]
}

export default function LoveStyleTestPage() {
  const router = useRouter()
  const { t, language } = useLanguage()
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<number[]>([])
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [transitionDirection, setTransitionDirection] = useState<'next' | 'prev'>('next')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<LoveStyleResult | null>(null)

  // 현재 질문의 답변이 있으면 표시
  useEffect(() => {
    const currentAnswer = answers[currentQuestion]
    setSelectedAnswer(currentAnswer !== undefined ? currentAnswer : null)
  }, [currentQuestion, answers])

  // 연애 스타일 테스트 질문 데이터 (12개 질문 - 기존 13-24번 질문을 연애 상황으로 재해석)
  const questions = [
    { 
      id: 1, 
      question: language === 'ko' 
        ? '애인과 의견이 다를 때 나는...' 
        : 'Cuando mi pareja y yo tenemos opiniones diferentes...',
      options: [
        language === 'ko' ? '상대방의 의견에 맞춰준다' : 'Acepto la opinión de mi pareja',
        language === 'ko' ? '내 의견을 명확히 전달한다' : 'Expreso claramente mi opinión'
      ], 
      dimension: "COMMUNICATION" 
    },
    { 
      id: 2, 
      question: language === 'ko' 
        ? '연애 중에 혼자만의 시간을...' 
        : 'Durante el noviazgo, el tiempo a solas...',
      options: [
        language === 'ko' ? '중요하게 생각한다' : 'Es muy importante para mí',
        language === 'ko' ? '애인과 함께하는 시간이 더 소중하다' : 'Prefiero pasar tiempo con mi pareja'
      ], 
      dimension: "INDEPENDENCE" 
    },
    { 
      id: 3, 
      question: language === 'ko' 
        ? '애인에게 사랑을 표현할 때...' 
        : 'Cuando expreso amor a mi pareja...',
      options: [
        language === 'ko' ? '행동으로 보여주는 편이다' : 'Lo muestro con acciones',
        language === 'ko' ? '말로 직접 표현하는 편이다' : 'Lo expreso directamente con palabras'
      ], 
      dimension: "AFFECTION" 
    },
    { 
      id: 4, 
      question: language === 'ko' 
        ? '데이트 계획을 세울 때...' 
        : 'Al planear una cita...',
      options: [
        language === 'ko' ? '미리 상세히 계획한다' : 'Planifico todo detalladamente',
        language === 'ko' ? '즉흥적으로 결정한다' : 'Decido de manera espontánea'
      ], 
      dimension: "ROMANCE" 
    },
    { 
      id: 5, 
      question: language === 'ko' 
        ? '애인의 친구모임에 참석할 때...' 
        : 'Cuando asisto a reuniones de amigos de mi pareja...',
      options: [
        language === 'ko' ? '적극적으로 참여한다' : 'Participo activamente',
        language === 'ko' ? '조용히 관찰하는 편이다' : 'Prefiero observar en silencio'
      ], 
      dimension: "COMMUNICATION" 
    },
    { 
      id: 6, 
      question: language === 'ko' 
        ? '애인과 다툰 후에는...' 
        : 'Después de una discusión con mi pareja...',
      options: [
        language === 'ko' ? '바로 대화로 해결하려 한다' : 'Trato de resolverlo hablando inmediatamente',
        language === 'ko' ? '시간을 두고 생각해본다' : 'Necesito tiempo para pensar'
      ], 
      dimension: "COMMUNICATION" 
    },
    { 
      id: 7, 
      question: language === 'ko' 
        ? '애인이 힘들어할 때...' 
        : 'Cuando mi pareja está pasando por un momento difícil...',
      options: [
        language === 'ko' ? '현실적인 해결책을 제시한다' : 'Ofrezco soluciones prácticas',
        language === 'ko' ? '감정적으로 공감해준다' : 'Empatizo emocionalmente'
      ], 
      dimension: "AFFECTION" 
    },
    { 
      id: 8, 
      question: language === 'ko' 
        ? '연애에서 가장 중요한 것은...' 
        : 'Lo más importante en una relación es...',
      options: [
        language === 'ko' ? '안정성과 신뢰' : 'Estabilidad y confianza',
        language === 'ko' ? '열정과 스릴' : 'Pasión y emoción'
      ], 
      dimension: "ROMANCE" 
    },
    { 
      id: 9, 
      question: language === 'ko' 
        ? '애인에게 잔소리를 하는 편인가요?' 
        : '¿Sueles regañar a tu pareja?',
      options: [
        language === 'ko' ? '자주 하는 편이다' : 'Sí, con frecuencia',
        language === 'ko' ? '거의 하지 않는다' : 'Casi nunca'
      ], 
      dimension: "COMMUNICATION" 
    },
    { 
      id: 10, 
      question: language === 'ko' 
        ? '애인과의 대화에서...' 
        : 'En conversaciones con mi pareja...',
      options: [
        language === 'ko' ? '주도하는 편이다' : 'Suelo tomar la iniciativa',
        language === 'ko' ? '상대방의 이야기를 듣는 편이다' : 'Prefiero escuchar a mi pareja'
      ], 
      dimension: "COMMUNICATION" 
    },
    { 
      id: 11, 
      question: language === 'ko' 
        ? '애인과 함께 있을 때...' 
        : 'Cuando estoy con mi pareja...',
      options: [
        language === 'ko' ? '항상 뭔가 활동을 함께 한다' : 'Siempre hacemos alguna actividad juntos',
        language === 'ko' ? '그냥 함께 있는 것만으로도 충분하다' : 'Simplemente estar juntos es suficiente'
      ], 
      dimension: "ROMANCE" 
    },
    { 
      id: 12, 
      question: language === 'ko' 
        ? '새로운 사람을 만날 때...' 
        : 'Al conocer a alguien nuevo...',
      options: [
        language === 'ko' ? '상대방의 외모에 먼저 끌린다' : 'Me atrae primero la apariencia',
        language === 'ko' ? '상대방의 성격에 먼저 끌린다' : 'Me atrae primero la personalidad'
      ], 
      dimension: "ROMANCE" 
    }
  ]

  const handleAnswerSelect = (answerIndex: number) => {
    setSelectedAnswer(answerIndex)
  }

  const handleNext = () => {
    if (selectedAnswer === null) return

    const newAnswers = [...answers]
    newAnswers[currentQuestion] = selectedAnswer
    setAnswers(newAnswers)
    setSelectedAnswer(null)

    if (currentQuestion < questions.length - 1) {
      setTransitionDirection('next')
      setIsTransitioning(true)
      setTimeout(() => {
        setCurrentQuestion(currentQuestion + 1)
        setIsTransitioning(false)
      }, 300)
    } else {
      calculateResult(newAnswers)
    }
  }

  const handlePrev = () => {
    if (currentQuestion > 0) {
      setTransitionDirection('prev')
      setIsTransitioning(true)
      setTimeout(() => {
        setCurrentQuestion(currentQuestion - 1)
        setIsTransitioning(false)
      }, 300)
    }
  }

  const calculateResult = async (answers: number[]) => {
    setIsLoading(true)
    
    try {
      // 각 차원별 점수 계산
      const dimensionScores = {
        COMMUNICATION: 0,
        INDEPENDENCE: 0,
        AFFECTION: 0,
        ROMANCE: 0
      }

      questions.forEach((question, index) => {
        const answer = answers[index]
        if (answer === 0) {
          // 첫 번째 선택지 (더 온화하거나 전통적인 스타일)
          dimensionScores[question.dimension as keyof typeof dimensionScores] += 1
        } else {
          // 두 번째 선택지 (더 적극적이거나 현대적인 스타일)
          dimensionScores[question.dimension as keyof typeof dimensionScores] += 2
        }
      })

      // 결과 타입 결정 (간단한 로직)
      const result = determineLoveStyle(dimensionScores)
      setResult(result)
    } catch (error) {
      console.error('결과 계산 오류:', error)
      toast.error('결과를 계산하는 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const determineLoveStyle = (scores: typeof dimensionScores): LoveStyleResult => {
    // 간단한 결과 분류 로직
    const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0)
    const avgScore = totalScore / 4

    if (avgScore <= 1.5) {
      return {
        type: 'caring_romantic',
        displayName: language === 'ko' ? '따뜻한 로맨티스트' : 'Romántico Cariñoso',
        description: language === 'ko' 
          ? '애정표현이 풍부하고 상대방을 배려하는 타입입니다.'
          : 'Tipo que expresa mucho afecto y cuida a su pareja.',
        stats: {
          affection: 4,
          independence: 2,
          communication: 4,
          romance: 5
        },
        characteristics: language === 'ko' ? [
          '애정표현을 자주 한다',
          '상대방을 배려한다',
          '로맨틱한 것을 좋아한다',
          '감정적으로 공감한다'
        ] : [
          'Expresa afecto frecuentemente',
          'Cuida a su pareja',
          'Le gusta lo romántico',
          'Empatiza emocionalmente'
        ],
        compatibility: language === 'ko' ? [
          '독립적인 파트너와 잘 맞음',
          '감성적인 사람과 궁합 좋음'
        ] : [
          'Compatible con parejas independientes',
          'Buena química con personas emocionales'
        ]
      }
    } else if (avgScore <= 2.0) {
      return {
        type: 'balanced_partner',
        displayName: language === 'ko' ? '균형잡힌 파트너' : 'Compañero Equilibrado',
        description: language === 'ko' 
          ? '안정적이고 신뢰할 수 있는 타입입니다.'
          : 'Tipo estable y confiable.',
        stats: {
          affection: 3,
          independence: 3,
          communication: 3,
          romance: 3
        },
        characteristics: language === 'ko' ? [
          '안정적인 관계를 선호한다',
          '신뢰할 수 있다',
          '균형잡힌 소통을 한다',
          '독립성과 애정의 균형을 맞춘다'
        ] : [
          'Prefiere relaciones estables',
          'Es confiable',
          'Comunica de manera equilibrada',
          'Equilibra independencia y afecto'
        ],
        compatibility: language === 'ko' ? [
          '안정적인 사람과 잘 맞음',
          '장기적인 관계에 적합'
        ] : [
          'Compatible con personas estables',
          'Adecuado para relaciones a largo plazo'
        ]
      }
    } else {
      return {
        type: 'independent_adventurer',
        displayName: language === 'ko' ? '독립적인 모험가' : 'Aventurero Independiente',
        description: language === 'ko' 
          ? '자유롭고 독립적인 타입입니다.'
          : 'Tipo libre e independiente.',
        stats: {
          affection: 2,
          independence: 5,
          communication: 2,
          romance: 2
        },
        characteristics: language === 'ko' ? [
          '개인 공간을 중요시한다',
          '독립적인 성향이 강하다',
          '직설적인 소통을 선호한다',
          '새로운 경험을 추구한다'
        ] : [
          'Valora el espacio personal',
          'Tiene una fuerte independencia',
          'Prefiere comunicación directa',
          'Busca nuevas experiencias'
        ],
        compatibility: language === 'ko' ? [
          '독립적인 사람과 잘 맞음',
          '개인 공간을 존중하는 파트너와 궁합 좋음'
        ] : [
          'Compatible con personas independientes',
          'Buena química con parejas que respetan el espacio personal'
        ]
      }
    }
  }

  const handleRestart = () => {
    setCurrentQuestion(0)
    setAnswers([])
    setSelectedAnswer(null)
    setResult(null)
    setIsLoading(false)
  }

  const handleGoBack = () => {
    router.push('/community/tests')
  }

  const progress = ((currentQuestion + 1) / questions.length) * 100

  if (result) {
    return <LoveStyleResultComponent result={result} language={language} onRestart={handleRestart} onGoBack={handleGoBack} />
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {language === 'ko' ? '결과를 분석하고 있어요...' : 'Analizando resultados...'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
      <Header />
      
      <div className="max-w-2xl mx-auto px-4 py-8 pt-24">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Heart className="w-6 h-6 text-pink-500" />
            <h1 className="text-2xl font-bold text-gray-800">
              {language === 'ko' ? '나의 연애 스타일 테스트' : 'Test de Estilo de Amor'}
            </h1>
          </div>
          <p className="text-gray-600">
            {language === 'ko' 
              ? '12가지 질문으로 알아보는 당신의 연애 스타일' 
              : 'Descubre tu estilo de amor con 12 preguntas'}
          </p>
        </div>

        {/* 진행률 */}
        <div className="mb-6">
          <div className="flex justify-between text-xs text-gray-600 mb-2">
            <span>
              {language === 'ko' ? '질문' : 'Pregunta'} {currentQuestion + 1} / {questions.length}
            </span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2 transition-all duration-500 ease-out" />
        </div>

        {/* 질문 카드 */}
        <Card className="mb-6 overflow-hidden">
          <div className="p-6">
            <div className={`transition-all duration-300 ${isTransitioning ? 'opacity-0 transform translate-x-4' : 'opacity-100 transform translate-x-0'}`}>
              <h2 className="text-lg font-semibold text-gray-800 mb-6 text-center leading-relaxed">
                {questions[currentQuestion].question}
              </h2>
              
              <div className="space-y-3">
                {questions[currentQuestion].options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleAnswerSelect(index)}
                    className={`w-full p-4 text-left rounded-lg border-2 transition-all duration-200 ${
                      selectedAnswer === index
                        ? 'border-pink-500 bg-pink-50 text-pink-700'
                        : 'border-gray-200 hover:border-pink-300 hover:bg-pink-25'
                    }`}
                  >
                    <span className="font-medium">{option}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* 네비게이션 버튼 */}
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            onClick={handlePrev}
            disabled={currentQuestion === 0 || isTransitioning}
            className="px-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {language === 'ko' ? '이전' : 'Anterior'}
          </Button>

          <Button
            onClick={handleNext}
            disabled={selectedAnswer === null || isTransitioning}
            className="px-6 bg-pink-500 hover:bg-pink-600 text-white"
          >
            {currentQuestion === questions.length - 1 
              ? (language === 'ko' ? '결과 보기' : 'Ver Resultado')
              : (language === 'ko' ? '다음' : 'Siguiente')
            }
          </Button>
        </div>
      </div>
    </div>
  )
}

// 결과 컴포넌트
function LoveStyleResultComponent({ 
  result, 
  language, 
  onRestart, 
  onGoBack 
}: { 
  result: LoveStyleResult
  language: string
  onRestart: () => void
  onGoBack: () => void
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 py-8 pt-24">
        {/* 결과 카드 */}
        <Card className="overflow-hidden shadow-xl">
          <div className="p-8">
            {/* 헤더 */}
            <div className="text-center mb-8">
              <Heart className="w-12 h-12 text-pink-500 mx-auto mb-4" />
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                {language === 'ko' ? '나의 연애 스타일' : 'Mi Estilo de Amor'}
              </h1>
              <div className="inline-block bg-pink-100 text-pink-700 px-4 py-2 rounded-full text-xl font-semibold">
                {result.displayName}
              </div>
            </div>

            {/* 설명 */}
            <div className="text-center mb-8">
              <p className="text-gray-600 text-lg">{result.description}</p>
            </div>

            {/* 스탯 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                { label: language === 'ko' ? '애정표현' : 'Afecto', value: result.stats.affection },
                { label: language === 'ko' ? '독립성' : 'Independencia', value: result.stats.independence },
                { label: language === 'ko' ? '소통방식' : 'Comunicación', value: result.stats.communication },
                { label: language === 'ko' ? '로맨틱함' : 'Romanticismo', value: result.stats.romance }
              ].map((stat, index) => (
                <div key={index} className="text-center">
                  <p className="text-sm text-gray-600 mb-2">{stat.label}</p>
                  <div className="flex justify-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div
                        key={i}
                        className={`w-4 h-4 rounded-full ${
                          i < stat.value ? 'bg-pink-500' : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* 특징 */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                {language === 'ko' ? '특징' : 'Características'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {result.characteristics.map((char, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="text-pink-500">💕</span>
                    <span className="text-gray-700">{char}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 궁합 */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                {language === 'ko' ? '궁합' : 'Compatibilidad'}
              </h3>
              <div className="space-y-2">
                {result.compatibility.map((comp, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="text-yellow-500">✨</span>
                    <span className="text-gray-700">{comp}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 버튼 */}
            <div className="flex justify-center gap-4">
              <Button
                variant="outline"
                onClick={onRestart}
                className="px-6"
              >
                {language === 'ko' ? '다시 하기' : 'Repetir'}
              </Button>
              <Button
                onClick={onGoBack}
                className="px-6 bg-pink-500 hover:bg-pink-600 text-white"
              >
                {language === 'ko' ? '테스트 목록으로' : 'Lista de Tests'}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
