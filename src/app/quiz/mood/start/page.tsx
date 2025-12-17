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

export default function MoodStartPage() {
  const router = useRouter()
  const [isStarting, setIsStarting] = useState(false)

  const handleBack = () => {
    router.push('/quiz/mood')
  }

  const handleStart = () => {
    setIsStarting(true)
    quizEvents.startQuiz('mood', 'Encuentra tu Mood')
    // Ir a la página de preguntas
    router.push('/quiz/mood/questions')
  }

  return (
    <div className="min-h-screen relative bg-white">
      <Suspense fallback={<HeaderFallback />}>
        <Header />
      </Suspense>
      
      <div className="pt-24 md:pt-36 pb-8 px-4 min-h-screen flex items-center justify-center">
        <div className="max-w-2xl w-full">
          {/* Botón de retroceso */}
          <div className="mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="p-2 hover:bg-gray-100 rounded-full relative z-10"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </div>

          {/* Imagen de portada - ajustar a la pantalla */}
          <div 
            className="relative w-full cursor-pointer"
            onClick={handleStart}
          >
            <div className="relative w-full" style={{ aspectRatio: 'auto', maxHeight: 'calc(100vh - 120px)' }}>
              <img 
                src="/quizzes/mood/cover/cover.png" 
                alt="Encuentra tu Mood"
                className="w-full h-full object-contain"
                style={{ maxHeight: 'calc(100vh - 120px)' }}
              />
              
              {/* Efecto hover */}
              <div className="absolute inset-0 bg-transparent hover:bg-black/5 transition-all duration-200"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
