'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Share2, RotateCcw } from 'lucide-react'
import Header from '@/components/layout/Header'
import { useLanguage } from '@/context/LanguageContext'

// MBTI 결과 데이터 (임시)
const mbtiResults = {
  'ENFP': {
    type: 'ENFP',
    name: 'Activista Inspirador',
    description: 'Eres apasionado, creativo y valoras las relaciones con las personas.',
    kpopStar: 'BTS Jimin',
    image: '/quizzes/mbti-with-kpop-stars/celebs/jimin.png',
    characteristics: ['Creativo', 'Apasionado', 'Sociable', 'Alma libre']
  },
  'INTJ': {
    type: 'INTJ',
    name: 'Arquitecto',
    description: 'Valoras el pensamiento estratégico y la independencia, logrando objetivos de manera sistemática.',
    kpopStar: 'BTS Suga',
    image: '/quizzes/mbti-with-kpop-stars/celebs/suga.png',
    characteristics: ['Estratégico', 'Independiente', 'Lógico', 'Perfeccionista']
  },
  'ESFP': {
    type: 'ESFP',
    name: 'Entretenedor',
    description: 'Eres espontáneo, lleno de energía y te gusta hacer feliz a la gente.',
    kpopStar: 'BTS Jungkook',
    image: '/quizzes/mbti-with-kpop-stars/celebs/jungkook.png',
    characteristics: ['Espontáneo', 'Energético', 'Sociable', 'Flexible']
  },
  'ISFJ': {
    type: 'ISFJ',
    name: 'Protector',
    description: 'Eres cálido, considerando y te gusta cuidar a otras personas.',
    kpopStar: 'BTS Jin',
    image: '/quizzes/mbti-with-kpop-stars/celebs/jin.png',
    characteristics: ['Considerado', 'Responsable', 'Cálido', 'Estable']
  }
}

export default function MbtiResultPage() {
  const router = useRouter()
  const { language } = useLanguage()
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 임시로 랜덤 결과 생성 (실제로는 테스트 결과를 기반으로 해야 함)
    const resultTypes = Object.keys(mbtiResults)
    const randomType = resultTypes[Math.floor(Math.random() * resultTypes.length)]
    setResult(mbtiResults[randomType as keyof typeof mbtiResults])
    setLoading(false)
  }, [])

  const handleBack = () => {
    router.push('/quiz/mbti-kpop')
  }

  const handleRetake = () => {
    router.push('/quiz/mbti-kpop/questions')
  }

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Mi resultado MBTI: ${result?.type}`,
          text: `¡Mi tipo MBTI es ${result?.type} y me parezco a ${result?.kpopStar}!`,
          url: window.location.href
        })
      } else {
        await navigator.clipboard.writeText(window.location.href)
        alert('URL copiada al portapapeles')
      }
    } catch (error) {
      console.error('공유 실패:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-600">
            Analizando tu resultado...
          </p>
        </div>
      </div>
    )
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">
            Error al cargar el resultado
          </p>
          <Button onClick={handleBack} variant="outline">
            Volver
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-pink-50">
      <Header />
      
      <div className="pt-32 pb-8 px-4">
        <div className="max-w-2xl mx-auto">
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

          {/* 결과 카드 */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            {/* 헤더 */}
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-6 text-white text-center">
              <div className="text-4xl font-bold mb-2">{result.type}</div>
              <div className="text-lg opacity-90">{result.name}</div>
            </div>

            {/* 메인 콘텐츠 */}
            <div className="p-6">
              {/* K-POP 스타 매칭 */}
              <div className="text-center mb-8">
                <div className="text-2xl font-bold text-gray-900 mb-4">
                  Tu estrella K-POP es:
                </div>
                
                <div className="relative inline-block">
                  <img 
                    src={result.image} 
                    alt={result.kpopStar}
                    className="w-32 h-32 rounded-full object-cover mx-auto mb-4 border-4 border-purple-200"
                  />
                  <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-purple-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                    {result.kpopStar}
                  </div>
                </div>
              </div>

              {/* 설명 */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Descripción de tu tipo:
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  {result.description}
                </p>
              </div>

              {/* 특성 */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Características principales:
                </h3>
                <div className="flex flex-wrap gap-2">
                  {result.characteristics.map((char: string, index: number) => (
                    <span 
                      key={index}
                      className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm"
                    >
                      {char}
                    </span>
                  ))}
                </div>
              </div>

              {/* 액션 버튼들 */}
              <div className="flex gap-3">
                <Button
                  onClick={handleRetake}
                  variant="outline"
                  className="flex-1"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Repetir Test
                </Button>
                
                <Button
                  onClick={handleShare}
                  className="flex-1 bg-purple-500 hover:bg-purple-600"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Compartir
                </Button>
              </div>
            </div>
          </div>

          {/* 추가 정보 */}
          <div className="mt-8 text-center">
            <p className="text-gray-600 text-sm">
              ¿Te gustó este test? ¡Explora más tests en nuestra comunidad!
            </p>
            <Button
              onClick={() => router.push('/community/tests')}
              variant="ghost"
              className="mt-2 text-purple-600 hover:text-purple-700"
            >
              Ver más tests
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
