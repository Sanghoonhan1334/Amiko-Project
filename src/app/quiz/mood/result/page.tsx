'use client'

import React, { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowRight, Share2, RotateCcw, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Header from '@/components/layout/Header'

interface MoodResult {
  result_type: string
  title: string
  description: string
  characteristic: string
  recommendation: string
  image_url: string
}

function HeaderFallback() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 h-16">
      {/* Header skeleton */}
    </header>
  )
}

function MoodResultContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [result, setResult] = useState<MoodResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const resultType = searchParams.get('type')

  useEffect(() => {
    if (!resultType) {
      router.push('/quiz/mood')
      return
    }

    fetchResult()
  }, [resultType])

  const fetchResult = async () => {
    try {
      // Obtener información del quiz primero
      const quizResponse = await fetch('/api/quizzes/mood')
      const quizData = await quizResponse.json()
      
      if (!quizData.success || !quizData.data.quiz) {
        throw new Error('No se pudo encontrar el quiz.')
      }

      const quizId = quizData.data.quiz.id

      // Obtener datos del resultado
      const response = await fetch(`/api/quizzes/${quizId}/result?type=${resultType}`)
      const data = await response.json()
      
      if (data.success && data.result) {
        setResult(data.result)
      } else {
        setError('No se pudo cargar el resultado')
      }
    } catch (err) {
      console.error('Error fetching result:', err)
      setError('Ha ocurrido un error al cargar el resultado')
    } finally {
      setLoading(false)
    }
  }

  const handleRetake = () => {
    router.push('/quiz/mood/questions')
  }

  const handleGoToTests = () => {
    router.push('/community/tests')
  }

  const handleShare = async () => {
    if (!result) return

    const isLocalhost = window.location.hostname === 'localhost'
    const baseUrl = isLocalhost 
      ? 'https://helloamiko.com'
      : window.location.origin
    
    const shareUrl = `${baseUrl}/quiz/mood/result?type=${resultType}`
    const shareText = `Mi Mood en AMIKO: ${result.title}\n\n${result.description}\n\n${shareUrl}`
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Mi Mood',
          text: shareText
        })
      } else {
        await navigator.clipboard.writeText(shareText)
        alert('¡Enlace copiado!')
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        return
      }
      try {
        await navigator.clipboard.writeText(shareText)
        alert('¡Enlace copiado!')
      } catch (clipboardError) {
        console.error('Error al compartir:', clipboardError)
      }
    }
  }

  // Estado de carga
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg font-medium">Determinando tu Mood…</p>
        </div>
      </div>
    )
  }

  // Estado de error
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="bg-white text-gray-800 px-5 py-4 rounded-xl shadow">
          {error}
        </div>
      </div>
    )
  }

  // Sin resultado
  if (!result) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="bg-white text-gray-800 px-5 py-4 rounded-xl shadow">
          Resultado no disponible.
        </div>
      </div>
    )
  }

  // Mapeo de colores por tipo de Mood
  const moodColors: { [key: string]: string } = {
    'dreamy-wave': '#C7B6FF',      // Púrpura lila
    'shooting-star': '#FFE96D',    // Amarillo brillante
    'quiet-lake': '#B8F3DE',       // Menta lago
    'crystal-clear': '#D7E9FF',   // Azul blanco polar
    'neon-pulse': '#FF4D7E',       // Rosa rojo neón
    'cosmic-logic': '#263D8C',     // Azul marino galaxia profunda
    'warm-nest': '#FFB8A0',        // Rosa salmón suave
    'horizon-runner': '#6BCBFF'    // Azul cielo vívido
  }

  const moodColor = moodColors[result.result_type] || '#C7B6FF'

  return (
    <div className="min-h-screen relative">
      <Suspense fallback={<HeaderFallback />}>
        <Header />
      </Suspense>

      <div className="relative z-10 pt-24 md:pt-36 pb-8 px-4">
        <div className="max-w-3xl mx-auto">
          {/* Tarjeta de color del resultado */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="relative w-full aspect-[16/9] mb-8 rounded-2xl overflow-hidden shadow-2xl z-20"
            style={{
              backgroundColor: moodColor,
              background: `linear-gradient(135deg, ${moodColor} 0%, ${moodColor}dd 100%)`
            }}
          >
            {/* Superposición de gradiente de color */}
            <div 
              className="absolute inset-0"
              style={{
                background: `radial-gradient(circle at 30% 50%, rgba(255,255,255,0.2) 0%, transparent 50%)`
              }}
            ></div>
            
            {/* Título del resultado e información de color */}
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-white">
              <h2 className="text-4xl md:text-5xl font-bold mb-4 text-center drop-shadow-lg">
                {result.title}
              </h2>
              <div className="text-lg md:text-xl opacity-90 text-center drop-shadow">
                Color Mood: {moodColor}
              </div>
            </div>
          </motion.div>

          {/* Descripción del resultado */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: "easeOut", delay: 0.1 }}
            className="mb-6 bg-white rounded-2xl p-6 shadow-xl relative z-20"
          >
            <div className="text-lg text-gray-700 leading-relaxed text-center">
              {result.description}
            </div>
          </motion.div>

          {/* Descripción de características */}
          {result.characteristic && (
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: "easeOut", delay: 0.15 }}
              className="mb-6 bg-white rounded-2xl p-6 shadow-xl relative z-20"
            >
              <div className="text-xl font-bold text-gray-900 mb-3 text-center">
                Tu característica
              </div>
              <div className="text-base text-gray-700 leading-relaxed text-center italic">
                "{result.characteristic}"
              </div>
            </motion.div>
          )}

          {/* Recomendaciones */}
          {result.recommendation && (
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: "easeOut", delay: 0.2 }}
              className="mb-8 bg-white rounded-2xl p-6 shadow-xl relative z-30"
            >
              <div className="text-xl font-bold text-gray-900 mb-3 text-center">
                Sobre ti
              </div>
              <div className="text-base text-gray-700 leading-relaxed">
                {result.recommendation}
              </div>
            </motion.div>
          )}

          {/* Botones de acción */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: "easeOut", delay: 0.25 }}
            className="flex flex-col sm:flex-row gap-4 justify-center relative z-20"
          >
            <Button
              onClick={handleRetake}
              variant="outline"
              className="bg-white hover:bg-gray-50 border-2 border-gray-300 text-gray-800 py-6 text-lg font-semibold"
            >
              <RotateCcw className="w-5 h-5 mr-2" />
              Volver a hacer
            </Button>
            <Button
              onClick={handleGoToTests}
              variant="outline"
              className="bg-white hover:bg-gray-50 border-2 border-gray-300 text-gray-800 py-6 text-lg font-semibold"
            >
              <Home className="w-5 h-5 mr-2" />
              Ver más tests
            </Button>
            <Button
              onClick={handleShare}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white py-6 text-lg font-semibold shadow-lg"
            >
              <Share2 className="w-5 h-5 mr-2" />
              Compartir
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default function MoodResultPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600"></div>
      </div>
    }>
      <MoodResultContent />
    </Suspense>
  )
}
