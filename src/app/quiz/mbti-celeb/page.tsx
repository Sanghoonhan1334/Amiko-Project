'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { ArrowLeft, Users, Heart, Star } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Header from '@/components/layout/Header'
import { toast } from 'sonner'
import { useLanguage } from '@/context/LanguageContext'

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

export default function MBTICelebTestPage() {
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
  
  // MBTI 테스트 질문 데이터 (24개 질문)
  const questions = [
    { id: 1, question: t('tests.mbti.questions.q1'), options: [t('tests.mbti.questions.q1a'), t('tests.mbti.questions.q1b')], dimension: "EI" },
    { id: 2, question: t('tests.mbti.questions.q2'), options: [t('tests.mbti.questions.q2a'), t('tests.mbti.questions.q2b')], dimension: "SN" },
    { id: 3, question: t('tests.mbti.questions.q3'), options: [t('tests.mbti.questions.q3a'), t('tests.mbti.questions.q3b')], dimension: "TF" },
    { id: 4, question: t('tests.mbti.questions.q4'), options: [t('tests.mbti.questions.q4a'), t('tests.mbti.questions.q4b')], dimension: "JP" },
    { id: 5, question: t('tests.mbti.questions.q5'), options: [t('tests.mbti.questions.q5a'), t('tests.mbti.questions.q5b')], dimension: "EI" },
    { id: 6, question: t('tests.mbti.questions.q6'), options: [t('tests.mbti.questions.q6a'), t('tests.mbti.questions.q6b')], dimension: "SN" },
    { id: 7, question: t('tests.mbti.questions.q7'), options: [t('tests.mbti.questions.q7a'), t('tests.mbti.questions.q7b')], dimension: "TF" },
    { id: 8, question: t('tests.mbti.questions.q8'), options: [t('tests.mbti.questions.q8a'), t('tests.mbti.questions.q8b')], dimension: "JP" },
    { id: 9, question: t('tests.mbti.questions.q9'), options: [t('tests.mbti.questions.q9a'), t('tests.mbti.questions.q9b')], dimension: "EI" },
    { id: 10, question: t('tests.mbti.questions.q10'), options: [t('tests.mbti.questions.q10a'), t('tests.mbti.questions.q10b')], dimension: "SN" },
    { id: 11, question: t('tests.mbti.questions.q11'), options: [t('tests.mbti.questions.q11a'), t('tests.mbti.questions.q11b')], dimension: "TF" },
    { id: 12, question: t('tests.mbti.questions.q12'), options: [t('tests.mbti.questions.q12a'), t('tests.mbti.questions.q12b')], dimension: "JP" },
    { id: 13, question: t('tests.mbti.questions.q13'), options: [t('tests.mbti.questions.q13a'), t('tests.mbti.questions.q13b')], dimension: "EI" },
    { id: 14, question: t('tests.mbti.questions.q14'), options: [t('tests.mbti.questions.q14a'), t('tests.mbti.questions.q14b')], dimension: "SN" },
    { id: 15, question: t('tests.mbti.questions.q15'), options: [t('tests.mbti.questions.q15a'), t('tests.mbti.questions.q15b')], dimension: "TF" },
    { id: 16, question: t('tests.mbti.questions.q16'), options: [t('tests.mbti.questions.q16a'), t('tests.mbti.questions.q16b')], dimension: "JP" },
    { id: 17, question: t('tests.mbti.questions.q17'), options: [t('tests.mbti.questions.q17a'), t('tests.mbti.questions.q17b')], dimension: "EI" },
    { id: 18, question: t('tests.mbti.questions.q18'), options: [t('tests.mbti.questions.q18a'), t('tests.mbti.questions.q18b')], dimension: "SN" },
    { id: 19, question: t('tests.mbti.questions.q19'), options: [t('tests.mbti.questions.q19a'), t('tests.mbti.questions.q19b')], dimension: "TF" },
    { id: 20, question: t('tests.mbti.questions.q20'), options: [t('tests.mbti.questions.q20a'), t('tests.mbti.questions.q20b')], dimension: "JP" },
    { id: 21, question: t('tests.mbti.questions.q21'), options: [t('tests.mbti.questions.q21a'), t('tests.mbti.questions.q21b')], dimension: "EI" },
    { id: 22, question: t('tests.mbti.questions.q22'), options: [t('tests.mbti.questions.q22a'), t('tests.mbti.questions.q22b')], dimension: "SN" },
    { id: 23, question: t('tests.mbti.questions.q23'), options: [t('tests.mbti.questions.q23a'), t('tests.mbti.questions.q23b')], dimension: "TF" },
    { id: 24, question: t('tests.mbti.questions.q24'), options: [t('tests.mbti.questions.q24a'), t('tests.mbti.questions.q24b')], dimension: "JP" }
  ]

  const handleAnswerSelect = (answerIndex: number) => {
    setSelectedAnswer(answerIndex)
  }

  const handleNext = () => {
    if (selectedAnswer === null) return

    // 현재 질문의 답변을 업데이트하거나 새로 추가
    const newAnswers = [...answers]
    newAnswers[currentQuestion] = selectedAnswer
    setAnswers(newAnswers)
    setSelectedAnswer(null)

    if (currentQuestion < questions.length - 1) {
      // 애니메이션 시작
      setTransitionDirection('next')
      setIsTransitioning(true)
      setTimeout(() => {
        setCurrentQuestion(currentQuestion + 1)
        setIsTransitioning(false)
      }, 300)
    } else {
      // 마지막 질문이면 결과 계산
      calculateResult(newAnswers)
    }
  }

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      // 애니메이션 시작
      setTransitionDirection('prev')
      setIsTransitioning(true)
      setTimeout(() => {
        setCurrentQuestion(currentQuestion - 1)
        // 이전 질문의 답변을 표시
        const previousAnswer = answers[currentQuestion - 1]
        setSelectedAnswer(previousAnswer !== undefined ? previousAnswer : null)
        setIsTransitioning(false)
      }, 300)
    }
  }

  const calculateResult = async (finalAnswers: number[]) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/mbti-celeb-test', {
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
        toast.error(data.error || '결과를 불러오는데 실패했습니다.')
      }
    } catch (error) {
      console.error('테스트 결과 오류:', error)
      toast.error('테스트 처리 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleBack = () => {
    router.push('/community/tests')
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
      <Header />
      
      {/* 테스트 진행 화면 */}
      <div className="pt-32 pb-8 px-4">
        <div className="max-w-2xl mx-auto">
          {/* 헤더 */}
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-800">
                {language === 'ko' ? 'MBTI × 셀럽 매칭 테스트' : 'Test de Compatibilidad MBTI × Celebridades'}
              </h1>
              <p className="text-sm text-gray-600">
                {language === 'ko' ? '나와 같은 MBTI 유형의 셀럽과 궁합이 좋은 유형을 찾아보세요!' : '¡Encuentra celebridades de tu tipo MBTI y tipos compatibles contigo!'}
              </p>
            </div>
          </div>

          {/* 진행률 */}
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>{language === 'ko' ? '질문' : 'Pregunta'} {currentQuestion + 1} / {questions.length}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2 transition-all duration-500 ease-out" />
          </div>

          {/* 질문 카드 */}
          <Card className={`p-6 mb-6 bg-white shadow-lg transition-all duration-300 ${
            isTransitioning 
              ? transitionDirection === 'next' 
                ? 'opacity-0 transform translate-x-8' 
                : 'opacity-0 transform -translate-x-8'
              : 'opacity-100 transform translate-x-0'
          }`}>
            <h2 className="text-lg font-semibold text-gray-800 mb-6">
              {questions[currentQuestion].question}
            </h2>
            
            <div className="space-y-3 mb-6">
              {questions[currentQuestion].options.map((option, index) => (
                <Button
                  key={index}
                  variant={selectedAnswer === index ? "default" : "outline"}
                  className={`w-full p-4 h-auto text-left justify-start transition-all duration-200 ${
                    selectedAnswer === index 
                      ? "bg-purple-500 text-white border-purple-500" 
                      : "hover:bg-purple-50 hover:border-purple-300"
                  }`}
                  onClick={() => handleAnswerSelect(index)}
                >
                  <span className={selectedAnswer === index ? "text-white" : "text-gray-700"}>{option}</span>
                </Button>
              ))}
            </div>

            {/* 네비게이션 버튼 */}
            <div className="flex justify-between items-center">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentQuestion === 0 || isTransitioning}
                className="px-6"
              >
                {t('tests.mbti.navigation.previous')}
              </Button>
              
              <Button
                onClick={handleNext}
                disabled={selectedAnswer === null || isTransitioning}
                className="px-6 bg-purple-500 hover:bg-purple-600 text-white disabled:text-gray-400"
              >
                {currentQuestion === questions.length - 1 
                  ? t('tests.mbti.navigation.seeResult')
                  : t('tests.mbti.navigation.next')
                }
              </Button>
            </div>
          </Card>

          {/* 로딩 상태 */}
          {isLoading && (
            <Card className="p-6 bg-white shadow-lg">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4"></div>
                <p className="text-gray-600">{language === 'ko' ? '결과를 분석하고 있어요...' : 'Analizando resultados...'}</p>
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
  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-yellow-50 to-blue-100">
      <Header />
      
      <div className="pt-32 pb-8 px-4">
        <div className="max-w-4xl mx-auto">
          {/* 결과 헤더 */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full mb-4">
              <Users className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              {language === 'ko' ? `당신의 유형은 ${result.mbti}입니다!` : `¡Tu tipo es ${result.mbti}!`}
            </h1>
            <p className="text-gray-600">
              {language === 'ko' ? '나와 같은 MBTI 유형의 셀럽과 궁합이 좋은 유형을 찾아보세요!' : '¡Encuentra celebridades de tu tipo MBTI y tipos compatibles contigo!'}
            </p>
          </div>

          {/* 나와 같은 유형의 셀럽 */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              {language === 'ko' ? '나와 같은 유형의 셀럽' : 'Celebridades de mi tipo'}
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {result.myType.male && (
                <CelebCard celeb={result.myType.male} language={language} />
              )}
              {result.myType.female && (
                <CelebCard celeb={result.myType.female} language={language} />
              )}
            </div>
          </div>

          {/* 궁합이 좋은 유형 */}
          {result.bestMatchMbti && (
            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Heart className="w-5 h-5 text-red-500" />
                {language === 'ko' ? `나와 잘 맞는 유형: ${result.bestMatchMbti}` : `Tipo compatible: ${result.bestMatchMbti}`}
              </h2>
              {result.compatibility && (
                <p className="text-gray-600 mb-4 p-3 bg-blue-50 rounded-lg">
                  {language === 'ko' ? result.compatibility.note_ko : result.compatibility.note_es}
                </p>
              )}
              <div className="grid md:grid-cols-2 gap-4">
                {result.bestMatch.male && (
                  <CelebCard celeb={result.bestMatch.male} language={language} />
                )}
                {result.bestMatch.female && (
                  <CelebCard celeb={result.bestMatch.female} language={language} />
                )}
              </div>
            </div>
          )}

          {/* 주의사항 */}
          <Card className="p-4 bg-yellow-50 border-yellow-200">
            <p className="text-sm text-yellow-800">
              ⚠️ {language === 'ko' ? '엔터테인먼트용 비공식 매칭이며, MBTI·셀럽 정보는 시점/출처에 따라 달라질 수 있어요.' : 'Emparejamiento no oficial para entretenimiento. La información de MBTI y celebridades puede variar según el momento y la fuente.'}
            </p>
          </Card>

          {/* 재시작 버튼 */}
          <div className="text-center mt-8">
            <Button
              onClick={onRestart}
              className="bg-purple-500 hover:bg-purple-600 text-white px-8 py-3"
            >
              {language === 'ko' ? '다시 테스트하기' : 'Hacer test de nuevo'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// 셀럽 카드 컴포넌트
function CelebCard({ celeb, language }: { celeb: any, language: string }) {
  return (
    <Card className="p-4 bg-white shadow-md hover:shadow-lg transition-shadow">
      <div className="flex items-center gap-4">
        {/* 프로필 이미지 */}
        <div className="w-16 h-16 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center">
          {celeb.image_url ? (
            <img 
              src={celeb.image_url} 
              alt={celeb.stage_name}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <Users className="w-8 h-8 text-gray-500" />
          )}
        </div>
        
        {/* 정보 */}
        <div className="flex-1">
          <h3 className="font-semibold text-gray-800">
            {celeb.stage_name}
            {celeb.group_name && (
              <span className="text-sm text-gray-500 ml-2">({celeb.group_name})</span>
            )}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
              {celeb.mbti_code}
            </span>
            <span className="text-xs text-gray-500">
              {celeb.gender === 'male' ? (language === 'ko' ? '남성' : 'Hombre') : (language === 'ko' ? '여성' : 'Mujer')}
            </span>
          </div>
        </div>
      </div>
    </Card>
  )
}
