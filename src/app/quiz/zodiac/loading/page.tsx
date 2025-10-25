'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/layout/Header'
import BottomTabNavigation from '@/components/layout/BottomTabNavigation'
import { useLanguage } from '@/context/LanguageContext'

export default function ZodiacLoadingPage() {
  const router = useRouter()
  const { language } = useLanguage()

  useEffect(() => {
    // Loading 애니메이션 후 결과 페이지로 이동
    const timer = setTimeout(() => {
      router.push('/quiz/zodiac/result')
    }, 2000)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 via-yellow-50 to-pink-100">
      <Header />
      
      <div className="flex flex-col items-center justify-center min-h-screen pt-20 pb-20">
        {/* Loading 애니메이션 */}
        <div className="text-center mb-8">
          <div className="relative inline-block">
            {/* 회전하는 동물 띠 */}
            <div className="w-32 h-32 md:w-40 md:h-40 border-8 border-orange-300 border-t-orange-600 rounded-full animate-spin mb-8"></div>
            
            {/* 중앙 아이콘 */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-4xl md:text-5xl animate-bounce">🔮</span>
            </div>
          </div>
        </div>

        {/* Loading 메시지 */}
        <div className="text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4">
            {language === 'ko' ? '띠를 계산하는 중...' : 'Calculando tu signo...'}
          </h2>
          <p className="text-gray-600 text-lg">
            {language === 'ko' 
              ? '12지신의 정보를 확인하고 있습니다.'
              : 'Consultando con los 12 animales del zodiaco...'
            }
          </p>
        </div>

        {/* 작은 로딩 아이콘들 */}
        <div className="flex gap-4 mt-8">
          {['🐀', '🐂', '🐅', '🐰', '🐲', '🐍', '🐴', '🐑', '🐵', '🐔', '🐶', '🐷'].map((emoji, index) => (
            <span 
              key={index} 
              className="text-2xl animate-pulse"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {emoji}
            </span>
          ))}
        </div>
      </div>

      <BottomTabNavigation />
    </div>
  )
}

