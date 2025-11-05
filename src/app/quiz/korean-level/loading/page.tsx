'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/context/LanguageContext'

export default function KoreanLevelLoadingPage() {
  const router = useRouter()
  const { language } = useLanguage()

  useEffect(() => {
    // 이 페이지는 에러 발생 시에만 사용되므로 테스트 시작 페이지로 리다이렉트
    const timer = setTimeout(() => {
      router.push('/quiz/korean-level')
    }, 3000)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-50 to-blue-100 flex items-center justify-center">
      <div className="text-center">
        {/* 메인 애니메이션 */}
        <div className="mb-8">
          <div className="relative">
            {/* 한국 전통 요소들 */}
            <div className="w-32 h-32 mx-auto mb-6 relative">
              {/* 기와집 애니메이션 */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-6xl animate-bounce">🏮</div>
              </div>
              
              {/* 전통 패턴들 */}
              <div className="absolute -top-4 -left-4 text-2xl opacity-30 animate-pulse">🌸</div>
              <div className="absolute -top-4 -right-4 text-2xl opacity-30 animate-pulse delay-150">🌺</div>
              <div className="absolute -bottom-4 -left-4 text-2xl opacity-30 animate-pulse delay-300">🎋</div>
              <div className="absolute -bottom-4 -right-4 text-2xl opacity-30 animate-pulse delay-500">🎌</div>
            </div>
          </div>
        </div>

        {/* 로딩 텍스트 */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-4" style={{ 
            fontFamily: 'serif',
            textShadow: '1px 1px 2px rgba(0,0,0,0.1)'
          }}>
            {language === 'ko' ? '결과 분석 중...' : 'Analizando resultados...'}
          </h2>
          <p className="text-gray-600 text-lg">
            {language === 'ko' 
              ? '한국어 실력을 정확하게 측정하고 있습니다'
              : 'Midiendo con precisión tu nivel de coreano'
            }
          </p>
        </div>

        {/* 로딩 바 */}
        <div className="w-64 mx-auto mb-8">
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div className="bg-gray-600 h-3 rounded-full animate-pulse"></div>
          </div>
        </div>

        {/* 로딩 메시지들 */}
        <div className="space-y-2 text-gray-500">
          <p className="animate-pulse">
            {language === 'ko' ? '✓ 한글 읽기 능력 확인' : '✓ Verificando lectura de hangul'}
          </p>
          <p className="animate-pulse delay-150">
            {language === 'ko' ? '✓ 문법 실력 평가' : '✓ Evaluando gramática'}
          </p>
          <p className="animate-pulse delay-300">
            {language === 'ko' ? '✓ 어휘력 측정' : '✓ Midiendo vocabulario'}
          </p>
          <p className="animate-pulse delay-500">
            {language === 'ko' ? '✓ 최종 레벨 결정' : '✓ Determinando nivel final'}
          </p>
        </div>

        {/* 한국 전통 요소들 */}
        <div className="mt-12 flex justify-center space-x-8 opacity-30">
          <div className="text-3xl animate-bounce delay-100">🏮</div>
          <div className="text-3xl animate-bounce delay-200">🌸</div>
          <div className="text-3xl animate-bounce delay-300">🎋</div>
          <div className="text-3xl animate-bounce delay-400">🎌</div>
        </div>
      </div>
    </div>
  )
}
