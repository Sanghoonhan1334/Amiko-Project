'use client'

import React, { useState, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Header from '@/components/layout/Header'
import { quizEvents } from '@/lib/analytics'

function HeaderFallback() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 h-16">
      {/* Header skeleton */}
    </header>
  )
}

export default function FortuneStartPage() {
  const router = useRouter()
  const [isStarting, setIsStarting] = useState(false)

  const handleBack = () => {
    router.push('/quiz/fortune')
  }

  const handleStart = () => {
    setIsStarting(true)
    // 질문 페이지로 이동
    router.push('/quiz/fortune/questions')
  }

  return (
    <div className="min-h-screen bg-[#FDF4E6]">
      <Suspense fallback={<HeaderFallback />}>
        <Header />
      </Suspense>
      
      <div className="pt-32 pb-8 px-4">
        <div className="max-w-md mx-auto">
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

          {/* 썸네일 이미지 - 카드 스타일 제거하고 크기 증가 */}
          <div className="mb-8">
            <div 
              className="relative w-full h-[500px] overflow-hidden"
            >
              <img 
                src="/quizzes/fortune/cover/cover.png" 
                alt="Test de Fortuna"
                className="w-full h-full object-contain"
              />
              
              {/* 이미지 전체를 클릭 가능하게 만들기 */}
              <div 
                className="absolute inset-0 cursor-pointer"
                onClick={handleStart}
                title="COMENZAR TEST"
              >
                {/* 호버 시 전체 이미지에 하이라이트 효과 */}
                <div className="w-full h-full bg-transparent hover:bg-black/5 transition-all duration-200"></div>
              </div>
            </div>
          </div>

          {/* 테스트 정보 */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Test de Fortuna Personalizada
            </h1>
            <p className="text-gray-700 mb-4">
              Responde 9 preguntas simples y descubre tu fortuna personalizada
            </p>
            <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 bg-orange-300 rounded-full"></div>
                <span>9 Preguntas</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 bg-orange-300 rounded-full"></div>
                <span>2-3 Minutos</span>
              </div>
            </div>
          </div>

          {/* 시작 안내 */}
          <div className="text-center">
            <p className="text-gray-600 text-sm mb-4">
              ¡Prepárate para descubrir qué te depara el destino!
            </p>
            <div className="flex justify-center space-x-2">
              <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
              <div className="w-2 h-2 bg-orange-300 rounded-full"></div>
              <div className="w-2 h-2 bg-orange-300 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
