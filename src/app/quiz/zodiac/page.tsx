'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/layout/Header'
import BottomTabNavigation from '@/components/layout/BottomTabNavigation'
import { useLanguage } from '@/context/LanguageContext'
import { Clock, Users, Play, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import TestComments from '@/components/quiz/TestComments'

export default function ZodiacTestPage() {
  const router = useRouter()
  const { language } = useLanguage()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate loading
    setTimeout(() => setLoading(false), 500)
  }, [])

  const handleStart = () => {
    router.push('/quiz/zodiac/start')
  }

  const handleBack = () => {
    router.push('/community/tests')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-100 via-yellow-50 to-pink-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <div className="container mx-auto px-4 pt-24 md:pt-32 pb-8">
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

          {/* 메인 콘텐츠 */}
          <div className="bg-white">
            {/* 제목과 메타데이터 */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-3">
                Descubre tu Signo del Zodíaco Oriental
              </h1>
              
              <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 bg-gray-300 rounded-full"></div>
                  <span>AMIKO</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  <span>0</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>Aprox. 5 min</span>
                </div>
              </div>
            </div>

            {/* 썸네일 이미지 */}
            <div className="mb-6">
              <div className="relative w-full h-64 rounded-lg overflow-hidden">
                <img
                  src="/quizzes/zodiac/cover/cover.png"
                  alt="Horóscopo Oriental"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* 설명 텍스트 */}
            <div className="mb-6">
              <p className="text-gray-800 text-base leading-relaxed mb-3">
                Ingresa tu fecha de nacimiento y descubre a qué signo del zodiaco oriental perteneces según los 12 animales del zodiaco chino. Conoce las características de tu signo y tu horóscopo de hoy.
              </p>
              
              <div className="space-y-2 mb-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  Características del Test
                </h3>
                <ul className="list-disc list-inside text-gray-700 space-y-1 text-sm">
                  <li>Cálculo preciso basado en tu fecha de nacimiento</li>
                  <li>Análisis detallado de personalidad por cada signo</li>
                  <li>Horóscopo de hoy incluido</li>
                  <li>Autoconocimiento a través de la cultura tradicional</li>
                </ul>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm">#Horóscopo</span>
                <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm">#Zodíaco Oriental</span>
                <span className="px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-sm">#12 Animales</span>
                <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">#Fortuna</span>
              </div>
            </div>

            {/* 시작 버튼 */}
            <div className="mb-8">
              <button
                onClick={handleStart}
                className="w-full bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                Comenzar Test
              </button>
            </div>

            {/* 댓글 섹션 */}
            <TestComments testId="zodiac" />
          </div>
        </div>
      </div>

      <BottomTabNavigation />
    </div>
  )
}

