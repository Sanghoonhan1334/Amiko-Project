'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useLanguage } from '@/context/LanguageContext'
import { Share2, RotateCcw, ArrowRight } from 'lucide-react'

export default function KoreanLevelResultPage() {
  const router = useRouter()
  const params = useParams()
  const { language } = useLanguage()
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const resultId = params?.resultId as string

  useEffect(() => {
    if (!resultId) {
      setError('Result ID is missing')
      setLoading(false)
      return
    }

    // 결과 조회
    fetch(`/api/quiz/korean-level/result/${resultId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.result) {
          setResult(data.result)
        } else {
          setError(data.error || 'Failed to load result')
        }
      })
      .catch(err => {
        console.error('결과 조회 실패:', err)
        setError('Failed to load result')
      })
      .finally(() => {
        setLoading(false)
      })
  }, [resultId, language])

  const handleRetake = () => {
    router.push('/quiz/korean-level/questions')
  }

  const handleShare = async () => {
    if (!result) return

    const isLocalhost = window.location.hostname === 'localhost'
    const baseUrl = isLocalhost 
      ? 'https://helloamiko.com'
      : window.location.origin
    
    const shareUrl = `${baseUrl}/quiz/korean-level/result/${resultId}`
    const levelText = language === 'ko' ? result.level_ko : result.level
    const shareText = language === 'ko' 
      ? `나의 한국어 레벨은 "${levelText}"입니다! (${result.score}점)\n\n${shareUrl}`
      : `¡Mi nivel de coreano es "${levelText}"! (${result.score} puntos)\n\n${shareUrl}`
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: language === 'ko' ? '한국어 레벨 테스트 결과' : 'Resultado del Test de Nivel de Coreano',
          text: shareText
        })
      } else {
        await navigator.clipboard.writeText(shareText)
        alert(language === 'ko' ? '링크가 복사되었습니다!' : '¡Enlace copiado!')
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        return
      }
      try {
        await navigator.clipboard.writeText(shareText)
        alert(language === 'ko' ? '링크가 복사되었습니다!' : '¡Enlace copiado!')
      } catch (clipboardError) {
        console.error('공유 실패:', clipboardError)
        alert(language === 'ko' ? '공유에 실패했습니다.' : 'Error al compartir.')
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-50 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600 dark:border-gray-400 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {language === 'ko' ? '결과를 준비하고 있습니다...' : 'Preparando resultados...'}
          </p>
        </div>
      </div>
    )
  }

  if (error || !result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-50 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">
            {error || (language === 'ko' ? '결과를 찾을 수 없습니다.' : 'No se pudo encontrar el resultado.')}
          </p>
          <button
            onClick={() => router.push('/quiz/korean-level')}
            className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700"
          >
            {language === 'ko' ? '테스트로 돌아가기' : 'Volver al test'}
          </button>
        </div>
      </div>
    )
  }

  const levelText = language === 'ko' ? result.level_ko : result.level
  const description = language === 'ko' ? result.description.ko : result.description.es
  const details = language === 'ko' ? result.details.ko : result.details.es
  const recommendations = language === 'ko' ? result.recommendations.ko : result.recommendations.es

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-50 to-blue-100">
        {/* 결과 이미지 */}
        <div className="w-full relative pt-20 px-4 md:px-16 lg:px-32 xl:px-40">
          <img
            src="/quizzes/korean-level/result/result.png"
            alt="Korean Level Test Result"
            className="w-full h-auto object-contain max-w-lg mx-auto"
          />
          
          {/* 이미지 위에 점수 표시 */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/3 text-center">
            <div className="text-4xl md:text-6xl font-bold mb-2" style={{ 
              fontFamily: 'serif',
              textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
              color: '#8B4513'
            }}>
              {language === 'ko' ? `${result.score}점` : `${result.score} Puntos`}
            </div>
            <div className="text-lg md:text-xl font-semibold" style={{ 
              fontFamily: 'serif',
              textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
              color: '#2F4F4F'
            }}>
              {levelText}
            </div>
          </div>
        </div>

        {/* 메인 콘텐츠 */}
        <div className="container mx-auto px-4 pt-16 pb-8">
          <div className="max-w-4xl mx-auto text-center">
            {/* 결과 카드 */}
            <div className="relative">
              {/* 설명 */}
              <div className="mb-8 bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-lg">
                <h3 className="text-xl font-bold text-gray-800 mb-4">
                  {language === 'ko' ? '레벨 설명' : 'Descripción del Nivel'}
                </h3>
                <p className="text-gray-700 leading-relaxed mb-4">
                  {description}
                </p>
                <p className="text-gray-600 leading-relaxed">
                  {details}
                </p>
              </div>

              {/* 추천사항 */}
              <div className="mb-8 bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-lg">
                <h3 className="text-xl font-bold text-gray-800 mb-4">
                  {language === 'ko' ? '추천 학습 방법' : 'Métodos de Estudio Recomendados'}
                </h3>
                <ul className="space-y-3">
                  {recommendations.map((rec: string, index: number) => (
                    <li key={index} className="flex items-start">
                      <span className="w-2 h-2 bg-purple-500 rounded-full mr-3 mt-2 flex-shrink-0"></span>
                      <span className="text-gray-700">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* 액션 버튼들 */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleRetake}
                className="flex-1 bg-white hover:bg-gray-50 text-gray-700 font-semibold py-4 px-6 rounded-xl border-2 border-gray-200 hover:border-gray-300 transition-all duration-300 flex items-center justify-center"
              >
                <RotateCcw className="w-5 h-5 mr-2" />
                {language === 'ko' ? '테스트 다시하기' : 'Repetir Test'}
              </button>
              
              <button
                onClick={handleShare}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 flex items-center justify-center"
              >
                <Share2 className="w-5 h-5 mr-2" />
                {language === 'ko' ? '결과 공유하기' : 'Compartir Resultado'}
              </button>
            </div>

            {/* 다른 테스트 보기 */}
            <div className="mt-8 text-center">
              <button
                onClick={() => router.push('/community/tests')}
                className="text-purple-600 hover:text-purple-700 font-medium flex items-center justify-center mx-auto"
              >
                {language === 'ko' ? '다른 테스트 보기' : 'Ver Otros Tests'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            </div>
          </div>
        </div>
      </div>
  )
}
