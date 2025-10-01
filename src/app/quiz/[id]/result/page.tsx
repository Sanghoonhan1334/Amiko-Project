'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Share2, RotateCcw, ArrowLeft, Sparkles, ExternalLink, AlertCircle } from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'
import { toast } from 'sonner'

interface Celebrity {
  id: string
  stage_name: string
  group_name: string | null
  mbti_code: string
  profile_image_url: string | null
  source_url: string | null
  source_note: string | null
  source_date: string | null
  is_verified: boolean
}

interface QuizResult {
  result_type: string
  mbti_code: string
  title: string
  description: string
  image_url: string | null
  characteristic: string | null
  recommendation: string | null
}

interface ResultData {
  mbti_code: string
  result: QuizResult
  celebrities: Celebrity[]
}

export default function QuizResultPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const { t } = useLanguage()
  const quizId = params.id as string
  const mbtiCode = searchParams.get('mbti')

  const [resultData, setResultData] = useState<ResultData | null>(null)
  const [quizTitle, setQuizTitle] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (mbtiCode) {
      // 결과는 이미 계산되어 있으므로, 다시 submit API를 호출하거나
      // localStorage에 저장된 결과를 사용할 수 있습니다.
      // 여기서는 간단하게 결과를 localStorage에서 가져오는 방식을 사용합니다.
      const storedResult = localStorage.getItem(`quiz_result_${quizId}`)
      if (storedResult) {
        setResultData(JSON.parse(storedResult))
      }
      
      fetchQuizInfo()
    }
  }, [quizId, mbtiCode])

  const fetchQuizInfo = async () => {
    try {
      setLoading(true)
      
      const quizResponse = await fetch(`/api/quizzes/${quizId}`)
      if (quizResponse.ok) {
        const quizData = await quizResponse.json()
        setQuizTitle(quizData.quiz.title)
      }
    } catch (error) {
      console.error('퀴즈 정보 불러오기 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRetake = () => {
    localStorage.removeItem(`quiz_result_${quizId}`)
    router.push(`/quiz/${quizId}`)
  }

  const handleShare = async () => {
    if (!resultData) return
    
    const shareText = `나의 MBTI는 ${resultData.mbti_code}! ${resultData.result.title}`
    const shareUrl = `${window.location.origin}/quiz/${quizId}`
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: quizTitle,
          text: shareText,
          url: shareUrl
        })
        toast.success('공유되었습니다!')
      } catch (error) {
        console.error('공유 실패:', error)
      }
    } else {
      try {
        await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`)
        toast.success('링크가 복사되었습니다!')
      } catch (error) {
        toast.error('복사에 실패했습니다')
      }
    }
  }

  const handleBackToList = () => {
    router.push('/main?tab=community&view=tests')
  }

  if (loading || !resultData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="animate-pulse text-center">
          <div className="w-16 h-16 bg-blue-200 rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">결과 불러오는 중...</p>
        </div>
      </div>
    )
  }

  const { result, celebrities } = resultData

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* 헤더 */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={handleBackToList}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('tests.title')}
          </Button>
        </div>

        {/* 결과 카드 */}
        <Card className="p-8 shadow-xl text-center mb-6">
          {/* MBTI 코드 */}
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mb-4">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              당신의 MBTI는
            </h1>
            <div className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-2">
              {resultData.mbti_code}
            </div>
            <p className="text-gray-600">{quizTitle}</p>
          </div>

          {/* 결과 설명 */}
          <div className="mb-6 p-6 bg-gradient-to-r from-blue-100 to-purple-100 rounded-2xl">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {result.title}
            </h2>
            <p className="text-gray-700">
              {result.description}
            </p>
          </div>

          {/* 상세 설명 */}
          <div className="text-left space-y-6 mb-8">
            {result.characteristic && (
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  핵심 특징
                </h3>
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {result.characteristic}
                </p>
              </div>
            )}

            {result.recommendation && (
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  추천 활동
                </h3>
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {result.recommendation}
                </p>
              </div>
            )}
          </div>

          {/* 매칭된 연예인 */}
          {celebrities && celebrities.length > 0 && (
            <div className="mb-8 p-6 bg-white rounded-2xl border-2 border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center justify-center gap-2">
                <span>⭐</span>
                같은 MBTI를 가진 K-POP 스타
              </h3>
              
              {/* 주의 문구 */}
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2 text-sm text-left">
                <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                <p className="text-yellow-800">
                  공개된 인터뷰 및 콘텐츠를 기반으로 정리된 정보입니다. MBTI는 시간에 따라 변경될 수 있으며, 비공식 정보가 포함되어 있을 수 있습니다.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {celebrities.map((celeb) => (
                  <div key={celeb.id} className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                    {celeb.profile_image_url && (
                      <img
                        src={celeb.profile_image_url}
                        alt={celeb.stage_name}
                        className="w-20 h-20 object-cover rounded-full mx-auto mb-3"
                      />
                    )}
                    <h4 className="font-bold text-gray-900 mb-1">
                      {celeb.stage_name}
                      {celeb.is_verified && (
                        <span className="ml-1 text-blue-500" title="공식 확인됨">✓</span>
                      )}
                    </h4>
                    {celeb.group_name && (
                      <p className="text-sm text-gray-600 mb-2">{celeb.group_name}</p>
                    )}
                    <p className="text-xs text-gray-500 mb-2">
                      {celeb.source_note || 'MBTI 정보'}
                    </p>
                    {celeb.source_url && (
                      <a
                        href={celeb.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:text-blue-800 flex items-center justify-center gap-1"
                      >
                        출처 보기
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 액션 버튼 */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              onClick={handleRetake}
              className="flex-1"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              {t('tests.retakeTest')}
            </Button>
            <Button
              onClick={handleShare}
              className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
            >
              <Share2 className="w-4 h-4 mr-2" />
              {t('tests.shareResult')}
            </Button>
          </div>

          {/* 다른 테스트 보기 */}
          <Button
            variant="ghost"
            onClick={handleBackToList}
            className="mt-4 w-full"
          >
            다른 테스트 보기
          </Button>
        </Card>
      </div>
    </div>
  )
}
