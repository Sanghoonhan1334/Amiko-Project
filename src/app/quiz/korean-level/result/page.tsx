'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/context/LanguageContext'
import { Share2, RotateCcw, ArrowRight } from 'lucide-react'

export default function KoreanLevelResultPage() {
  const router = useRouter()
  const { language } = useLanguage()
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 랜덤 결과 생성 (실제로는 답안에 따라 계산)
    const results = [
      {
        level: 'Básico',
        levelKo: '기초',
        score: 85,
        description: language === 'ko' 
          ? '한국어 기초를 잘 알고 있습니다! 한글 읽기와 기본적인 표현들을 잘 이해하고 있어요.'
          : '¡Conoces pautas básicas del coreano! Entiendes bien la lectura de hangul y expresiones básicas.',
        details: language === 'ko' 
          ? '기초 한글, 인사말, 숫자, 기본 어휘를 잘 알고 있습니다. 더 많은 어휘를 학습하면 중급으로 올라갈 수 있어요!'
          : 'Conoces bien el hangul básico, saludos, números y vocabulario básico. ¡Con más vocabulario puedes llegar al nivel intermedio!',
        recommendations: [
          language === 'ko' ? '더 많은 한국어 단어를 학습하세요' : 'Aprende más vocabulario coreano',
          language === 'ko' ? '한국 드라마나 영화를 자막과 함께 보세요' : 'Ve dramas o películas coreanas con subtítulos',
          language === 'ko' ? '기본 문법을 더 공부하세요' : 'Estudia más gramática básica'
        ],
        color: 'from-green-400 to-blue-500',
        icon: '🌱'
      },
      {
        level: 'Intermedio',
        levelKo: '중급',
        score: 75,
        description: language === 'ko' 
          ? '한국어 중급 실력을 가지고 있습니다! 일상 대화와 기본 문법을 잘 사용할 수 있어요.'
          : '¡Tienes un nivel intermedio de coreano! Puedes usar bien las conversaciones cotidianas y gramática básica.',
        details: language === 'ko' 
          ? '일상 대화, 기본 문법, 중급 어휘를 잘 알고 있습니다. 더 복잡한 문장 구조를 학습하면 고급으로 올라갈 수 있어요!'
          : 'Conoces bien las conversaciones cotidianas, gramática básica y vocabulario intermedio. ¡Con estructuras más complejas puedes llegar al nivel avanzado!',
        recommendations: [
          language === 'ko' ? '고급 문법과 표현을 학습하세요' : 'Aprende gramática y expresiones avanzadas',
          language === 'ko' ? '한국 뉴스나 팟캐스트를 들어보세요' : 'Escucha noticias o podcasts coreanos',
          language === 'ko' ? '한국인과 실제 대화를 해보세요' : 'Practica conversaciones reales con coreanos'
        ],
        color: 'from-yellow-400 to-orange-500',
        icon: '🌿'
      },
      {
        level: 'Avanzado',
        levelKo: '고급',
        score: 95,
        description: language === 'ko' 
          ? '한국어 고급 실력을 가지고 있습니다! 복잡한 문장과 고급 어휘를 잘 이해하고 있어요.'
          : '¡Tienes un nivel avanzado de coreano! Entiendes bien oraciones complejas y vocabulario avanzado.',
        details: language === 'ko' 
          ? '고급 문법, 복잡한 어휘, 문화적 표현을 잘 알고 있습니다. 거의 원어민 수준에 가까워요!'
          : 'Conoces bien la gramática avanzada, vocabulario complejo y expresiones culturales. ¡Estás cerca del nivel nativo!',
        recommendations: [
          language === 'ko' ? '한국 문학 작품을 읽어보세요' : 'Lee obras literarias coreanas',
          language === 'ko' ? '한국 문화와 역사를 더 깊이 공부하세요' : 'Estudia más profundamente la cultura e historia coreana',
          language === 'ko' ? '한국어로 글쓰기 연습을 하세요' : 'Practica escribir en coreano'
        ],
        color: 'from-purple-400 to-pink-500',
        icon: '🌳'
      }
    ]

    // 랜덤하게 결과 선택 (실제로는 답안에 따라 계산)
    const randomResult = results[Math.floor(Math.random() * results.length)]
    setResult(randomResult)
    setLoading(false)
  }, [language])

  const handleRetake = () => {
    router.push('/quiz/korean-level/questions')
  }

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: language === 'ko' ? '한국어 레벨 테스트 결과' : 'Resultado del Test de Nivel de Coreano',
          text: language === 'ko' 
            ? `나의 한국어 레벨: ${result?.levelKo} (${result?.score}점)`
            : `Mi nivel de coreano: ${result?.level} (${result?.score} puntos)`,
          url: window.location.href
        })
      } else {
        // 폴백: 클립보드에 복사
        const text = language === 'ko' 
          ? `나의 한국어 레벨: ${result?.levelKo} (${result?.score}점)`
          : `Mi nivel de coreano: ${result?.level} (${result?.score} puntos)`
        await navigator.clipboard.writeText(text)
        alert(language === 'ko' ? '결과가 복사되었습니다!' : '¡Resultado copiado!')
      }
    } catch (error) {
      // 공유가 취소되었거나 오류가 발생한 경우
      if (error.name === 'AbortError') {
        // 사용자가 공유를 취소한 경우 - 아무것도 하지 않음
        return
      }
      
      // 다른 오류의 경우 클립보드 복사로 대체
      try {
        const text = language === 'ko' 
          ? `나의 한국어 레벨: ${result?.levelKo} (${result?.score}점)`
          : `Mi nivel de coreano: ${result?.level} (${result?.score} puntos)`
        await navigator.clipboard.writeText(text)
        alert(language === 'ko' ? '결과가 복사되었습니다!' : '¡Resultado copiado!')
      } catch (clipboardError) {
        console.error('공유 및 클립보드 복사 실패:', clipboardError)
        alert(language === 'ko' ? '공유에 실패했습니다.' : 'Error al compartir.')
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-50 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {language === 'ko' ? '결과를 준비하고 있습니다...' : 'Preparando resultados...'}
          </p>
        </div>
      </div>
    )
  }

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
            {language === 'ko' ? '85점' : '85 Puntos'}
          </div>
          <div className="text-lg md:text-xl font-semibold" style={{ 
            fontFamily: 'serif',
            textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
            color: '#2F4F4F'
          }}>
            {language === 'ko' ? '중급 수준' : 'Nivel Intermedio'}
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
                {result?.description}
              </p>
              <p className="text-gray-600 leading-relaxed">
                {result?.details}
              </p>
            </div>

            {/* 추천사항 */}
            <div className="mb-8 bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-lg">
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                {language === 'ko' ? '추천 학습 방법' : 'Métodos de Estudio Recomendados'}
              </h3>
              <ul className="space-y-3">
                {result?.recommendations.map((rec: string, index: number) => (
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
