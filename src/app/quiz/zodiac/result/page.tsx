'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/layout/Header'
import BottomTabNavigation from '@/components/layout/BottomTabNavigation'
import { useLanguage } from '@/context/LanguageContext'
import { RotateCcw, Share2, ArrowRight } from 'lucide-react'
import TestComments from '@/components/quiz/TestComments'

// 띠 데이터
const zodiacData: { [key: string]: { name: string; nameKo: string; emoji: string; description: string; fortune: string } } = {
  rat: {
    name: 'Rata',
    nameKo: '쥐띠',
    emoji: '🐀',
    description: 'Eres inteligente, astuto y tienes una gran intuición. Eres rápido para adaptarte a nuevos entornos y tienes excelentes habilidades sociales.',
    fortune: 'Hoy es un día perfecto para nuevas oportunidades. Las ideas creativas fluirán y podrás aprovechar mejor las conexiones sociales que tienes.'
  },
  ox: {
    name: 'Buey',
    nameKo: '소띠',
    emoji: '🐂',
    description: 'Eres trabajador, honesto y determinado. Tienes una gran capacidad de concentración y persistencia. Eres confiable y siempre cumples tus promesas.',
    fortune: 'Tu dedicación y esfuerzo finalmente darán frutos hoy. Este es un buen momento para avanzar en proyectos importantes que has estado planificando.'
  },
  tiger: {
    name: 'Tigre',
    nameKo: '호랑이띠',
    emoji: '🐅',
    description: 'Eres valiente, aventurero y lleno de energía. Tienes un carisma natural y una gran confianza en ti mismo. Eres un líder nato.',
    fortune: 'La pasión y el entusiasmo te acompañarán hoy. Es un momento ideal para tomar decisiones audaces y demostrar tu liderazgo natural.'
  },
  rabbit: {
    name: 'Conejo',
    nameKo: '토끼띠',
    emoji: '🐰',
    description: 'Eres gentil, amable y diplomático. Tienes buen gusto y aprecias la belleza. Prefieres evitar conflictos y buscar soluciones pacíficas.',
    fortune: 'La tranquilidad y la armonía serán tus aliadas hoy. Es un buen momento para cuidar de ti mismo y fortalecer las relaciones cercanas.'
  },
  dragon: {
    name: 'Dragón',
    nameKo: '용띠',
    emoji: '🐲',
    description: 'Eres magnífico, poderoso y lleno de vitalidad. Tienes grandes ambiciones y la energía para lograrlas. Eres carismático y te gusta estar en el centro de atención.',
    fortune: 'Las oportunidades brillantes aparecerán en tu camino hoy. Tu energía y carisma atraerán personas y situaciones positivas hacia ti.'
  },
  snake: {
    name: 'Serpiente',
    nameKo: '뱀띠',
    emoji: '🐍',
    description: 'Eres sabio, intuitivo y misterioso. Tienes una profunda capacidad de análisis y una gran intuición. Eres elegante y sofisticado.',
    fortune: 'Tu intuición estará especialmente aguda hoy. Escucha a tu voz interior, te guiará hacia decisiones sabias y acertadas.'
  },
  horse: {
    name: 'Caballo',
    nameKo: '말띠',
    emoji: '🐴',
    description: 'Eres independiente, activo y aventurero. Tienes una gran necesidad de libertad y movimiento. Eres optimista y siempre ves el lado positivo.',
    fortune: 'La aventura y la libertad están en el aire hoy. Es un día perfecto para explorar nuevos lugares o ideas que te despierten curiosidad.'
  },
  goat: {
    name: 'Cabra',
    nameKo: '양띠',
    emoji: '🐑',
    description: 'Eres creativo, artístico y sensible. Tienes una gran apreciación por la belleza y el arte. Eres gentil y prefieres la paz sobre el conflicto.',
    fortune: 'Tu creatividad estará en su punto más alto hoy. Es un momento ideal para expresarte artísticamente o encontrar soluciones creativas a problemas.'
  },
  monkey: {
    name: 'Mono',
    nameKo: '원숭이띠',
    emoji: '🐵',
    description: 'Eres ingenioso, divertido y extremadamente inteligente. Tienes una gran capacidad para resolver problemas de manera creativa. Eres sociable y te encanta bromear.',
    fortune: 'Las ideas brillantes surgirán cuando menos lo esperes hoy. Tu ingenio te ayudará a resolver cualquier desafío que se presente.'
  },
  rooster: {
    name: 'Gallo',
    nameKo: '닭띠',
    emoji: '🐔',
    description: 'Eres organizado, puntual y tienes un gran sentido del deber. Eres confiable y siempre entregas tu mejor esfuerzo. Eres un líder meticuloso.',
    fortune: 'La organización y la preparación son tus mejores aliadas hoy. Los proyectos que has estado planificando comenzarán a tomar forma.'
  },
  dog: {
    name: 'Perro',
    nameKo: '개띠',
    emoji: '🐶',
    description: 'Eres leal, honesto y justo. Tienes un fuerte sentido de la moralidad y siempre defiendes lo que crees correcto. Eres un amigo confiable.',
    fortune: 'La lealtad y la honestidad traerán recompensas hoy. Las personas cercanas a ti valorarán tu apoyo y te devolverán la generosidad.'
  },
  pig: {
    name: 'Cerdo',
    nameKo: '돼지띠',
    emoji: '🐷',
    description: 'Eres amable, generoso y aprecias los placeres simples de la vida. Tienes una gran tolerancia y aceptas a las personas tal como son.',
    fortune: 'La generosidad y la bondad serán recompensadas hoy. Los pequeños gestos de amabilidad crearán una cadena de positividad a tu alrededor.'
  }
}

// 띠 계산 함수
function calculateZodiac(year: number): string {
  const zodiacYears = ['rat', 'ox', 'tiger', 'rabbit', 'dragon', 'snake', 'horse', 'goat', 'monkey', 'rooster', 'dog', 'pig']
  const zodiacCycle = (year - 4) % 12
  return zodiacYears[zodiacCycle < 0 ? zodiacCycle + 12 : zodiacCycle]
}

export default function ZodiacResultPage() {
  const router = useRouter()
  const { language } = useLanguage()
  const [result, setResult] = useState<{ zodiac: string; data: any } | null>(null)

  useEffect(() => {
    // LocalStorage에서 생년월일 가져오기
    const birthdateStr = localStorage.getItem('zodiac-birthdate')
    if (birthdateStr) {
      const birthdate = JSON.parse(birthdateStr)
      const zodiac = calculateZodiac(parseInt(birthdate.year))
      setResult({ zodiac, data: zodiacData[zodiac] })
    }
  }, [])

  const handleRetake = () => {
    router.push('/quiz/zodiac/questions')
  }

  const handleShare = async () => {
    try {
      if (navigator.share && result) {
        await navigator.share({
          title: language === 'ko' ? '내 띠는?' : 'Mi Signo del Zodíaco',
          text: `${result.data.name} ${result.data.emoji} - ${result.data.description}`,
          url: window.location.href
        })
      } else {
        // Fallback: URL 복사
        await navigator.clipboard.writeText(window.location.href)
        alert(language === 'ko' ? 'URL이 복사되었습니다!' : '¡URL copiada!')
      }
    } catch (error) {
      // 공유가 취소되었거나 오류가 발생한 경우
      if (error.name === 'AbortError') {
        // 사용자가 공유를 취소한 경우 - 아무것도 하지 않음
        return
      }
      
      // 다른 오류의 경우 URL 복사로 대체
      try {
        await navigator.clipboard.writeText(window.location.href)
        alert(language === 'ko' ? 'URL이 복사되었습니다!' : '¡URL copiada!')
      } catch (clipboardError) {
        console.error('공유 및 클립보드 복사 실패:', clipboardError)
        alert(language === 'ko' ? '공유에 실패했습니다.' : 'Error al compartir.')
      }
    }
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-100 via-yellow-50 to-pink-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{language === 'ko' ? '결과를 불러오는 중...' : 'Cargando resultado...'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 via-yellow-50 to-pink-100">
      <Header />
      
      <div className="container mx-auto px-4 pt-24 pb-8">
        {/* 띠 이미지와 텍스트 오버레이 */}
        <div className="relative w-full max-w-2xl mx-auto mb-8">
          {/* 배경 이미지 */}
          <div className="relative w-full h-auto">
            <img
              src={`/quizzes/zodiac/result/${result.zodiac}.png`}
              alt={result.data.name}
              className="w-full h-auto object-contain"
              onError={(e) => {
                // 이미지가 없으면 대체 이모지 표시
                e.currentTarget.style.display = 'none'
              }}
            />
            
            {/* 이미지 위에 텍스트 오버레이 */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              {/* 띠 이름 */}
              <div className="text-center mb-8 mt-24">
                <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-2">
                  {language === 'ko' ? result.data.nameKo : result.data.name}
                </h1>
                <p className="text-xl md:text-2xl text-gray-600">
                  {language === 'ko' ? '당신의 띠입니다!' : '¡Tu signo del zodiaco!'}
                </p>
              </div>

              {/* 설명 (이미지 안 빈 공간에 배치) */}
              <div className="text-center px-8 max-w-xl">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-3">
                  {language === 'ko' ? '당신의 특징' : 'Características'}
                </h2>
                <p className="text-base md:text-lg text-gray-700 leading-relaxed">
                  {result.data.description}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 오늘의 운세 */}
        <div className="bg-gradient-to-r from-orange-500/10 to-pink-500/10 backdrop-blur-sm rounded-xl p-6 md:p-8 shadow-lg mb-8 border border-orange-200">
          <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-4">
            {language === 'ko' ? '오늘의 운세' : 'Horóscopo de Hoy'}
          </h2>
          <p className="text-gray-700 leading-relaxed">
            {result.data.fortune}
          </p>
        </div>

        {/* 액션 버튼들 */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <button
            onClick={handleRetake}
            className="flex-1 bg-white hover:bg-gray-50 text-gray-700 font-semibold py-4 px-6 rounded-xl border-2 border-gray-200 hover:border-gray-300 transition-all duration-300 flex items-center justify-center"
          >
            <RotateCcw className="w-5 h-5 mr-2" />
            {language === 'ko' ? '테스트 다시하기' : 'Repetir Test'}
          </button>
          
          <button
            onClick={handleShare}
            className="flex-1 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 flex items-center justify-center"
          >
            <Share2 className="w-5 h-5 mr-2" />
            {language === 'ko' ? '결과 공유하기' : 'Compartir Resultado'}
          </button>
        </div>

        {/* 다른 테스트 보기 */}
        <div className="text-center mb-8">
          <button
            onClick={() => router.push('/community/tests')}
            className="text-orange-600 hover:text-orange-700 font-medium flex items-center justify-center mx-auto"
          >
            {language === 'ko' ? '다른 테스트 보기' : 'Ver Otros Tests'}
            <ArrowRight className="w-4 h-4 ml-2" />
          </button>
        </div>

        {/* 댓글 섹션 */}
        <TestComments testId="zodiac" />
      </div>

      <BottomTabNavigation />
    </div>
  )
}

