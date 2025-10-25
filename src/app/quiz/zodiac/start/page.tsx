'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/layout/Header'
import BottomTabNavigation from '@/components/layout/BottomTabNavigation'
import { useLanguage } from '@/context/LanguageContext'

export default function ZodiacStartPage() {
  const router = useRouter()
  const { language } = useLanguage()

  const handleStart = () => {
    router.push('/quiz/zodiac/questions')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 via-yellow-50 to-pink-100">
      <Header />
      
      <div className="flex flex-col items-center justify-center min-h-screen pt-20 pb-20">
        {/* 이미지 */}
        <div className="relative w-full max-w-md mb-8">
          <img
            src="/quizzes/zodiac/cover/cover.png"
            alt="Horóscopo Oriental"
            className="w-full h-auto object-contain rounded-lg"
          />
          
          {/* 전체 이미지 클릭 가능 영역 */}
          <div 
            className="absolute inset-0 cursor-pointer hover:bg-black/5 transition-all duration-200 rounded-lg"
            onClick={handleStart}
          />
        </div>

        {/* 시작 안내 */}
        <div className="text-center px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4">
            {language === 'ko' ? '준비되셨나요?' : '¿Estás listo?'}
          </h2>
          <p className="text-gray-600 mb-6">
            {language === 'ko' 
              ? '생년월일을 입력하고 당신의 띠를 확인해보세요!'
              : 'Ingresa tu fecha de nacimiento y descubre tu signo del zodiaco oriental.'
            }
          </p>
        </div>
      </div>

      <BottomTabNavigation />
    </div>
  )
}

