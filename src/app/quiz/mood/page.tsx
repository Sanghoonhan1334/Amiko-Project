'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Bookmark, Heart, Target, Share2 } from 'lucide-react'
import Header from '@/components/layout/Header'
import { useLanguage } from '@/context/LanguageContext'
import { createSupabaseBrowserClient } from '@/lib/supabase-client'
import { useAuth } from '@/context/AuthContext'
import TestComments from '@/components/quiz/TestComments'
import { quizEvents, trackQuizEnter } from '@/lib/analytics'

interface QuizData {
  id: string
  title: string
  description: string
  thumbnail_url: string | null
  total_questions: number
  total_participants: number
  created_at: string
  updated_at: string
}

export default function MoodTestPage() {
  const router = useRouter()
  const { language } = useLanguage()
  const { user } = useAuth()
  const [isStarting, setIsStarting] = useState(false)
  const [quizData, setQuizData] = useState<QuizData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Estado de botones de interacción
  const [isSaved, setIsSaved] = useState(false)
  const [isFun, setIsFun] = useState(false)
  const [isAccurate, setIsAccurate] = useState(false)
  const [funCount, setFunCount] = useState(0)
  const [accurateCount, setAccurateCount] = useState(0)

  // Slug del test Mood
  const MOOD_QUIZ_SLUG = 'mood'

  // Cargar datos del quiz
  useEffect(() => {
    const loadQuizData = async () => {
      try {
        const response = await fetch(`/api/quizzes/${MOOD_QUIZ_SLUG}`)
        if (!response.ok) {
          throw new Error('No se pudo cargar el quiz.')
        }
        const data = await response.json()
        if (data.success && data.data.quiz) {
          setQuizData(data.data.quiz)
          
          // 퀴즈 퍼널 이벤트: 테스트 진입
          trackQuizEnter(data.data.quiz.id)
        } else {
          throw new Error('No hay datos del quiz.')
        }
      } catch (err) {
        console.error('Error al cargar los datos del quiz:', err)
        setError('No se pudieron cargar los datos del quiz.')
      } finally {
        setLoading(false)
      }
    }

    loadQuizData()
  }, [])

  // Obtener datos de interacción
  useEffect(() => {
    if (quizData) {
      fetchInteractionData()
    }
  }, [quizData])

  useEffect(() => {
    if (quizData && user) {
      fetchInteractionData()
    }
  }, [user, quizData])

  const fetchInteractionData = async () => {
    if (!user || !quizData) return
    
    try {
      const supabase = createSupabaseBrowserClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) return

      // Cargar estado de favoritos
      const favResponse = await fetch(`/api/favorites?quizId=${quizData.id}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })
      
      if (favResponse.ok) {
        const favData = await favResponse.json()
        setIsSaved(favData.isFavorited)
      }

      // Cargar datos de retroalimentación
      const feedbackResponse = await fetch(`/api/quiz/${quizData.id}/feedback`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (feedbackResponse.ok) {
        const feedbackData = await feedbackResponse.json()
        setIsFun(feedbackData.fun || false)
        setIsAccurate(feedbackData.accurate || false)
        setFunCount(feedbackData.funCount || 0)
        setAccurateCount(feedbackData.accurateCount || 0)
      }
    } catch (error) {
      console.error('Error al cargar interacciones:', error)
    }
  }

  const handleBack = () => {
    router.push('/main')
  }

  const handleStart = () => {
    setIsStarting(true)
    if (quizData) {
      quizEvents.startQuiz(quizData.id, quizData.title)
    }
    // Ir a la pantalla de portada (página START)
    router.push('/quiz/mood/start')
  }

  const handleSave = async () => {
    if (!user) {
      alert('Por favor, inicia sesión para guardar el test.')
      return
    }
    
    try {
      const supabase = createSupabaseBrowserClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        alert('Necesitas iniciar sesión.')
        return
      }

      const action = isSaved ? 'remove' : 'add'
      const response = await fetch('/api/favorites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          quizId: quizData?.id,
          action: action
        })
      })

      if (response.ok) {
        setIsSaved(!isSaved)
      }
    } catch (error) {
      console.error('Error al guardar:', error)
    }
  }

  const handleFun = async () => {
    if (!user) {
      alert('Por favor, inicia sesión para dar like.')
      return
    }
    
    try {
      const supabase = createSupabaseBrowserClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        alert('Necesitas iniciar sesión.')
        return
      }

      const action = isFun ? 'remove' : 'add'
      
      const response = await fetch(`/api/quiz/${quizData?.id}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          type: 'fun',
          action: action
        })
      })

      if (response.ok) {
        const data = await response.json()
        setIsFun(!isFun)
        setFunCount(data.count)
      }
    } catch (error) {
      console.error('Error al marcar como divertido:', error)
    }
  }

  const handleAccurate = async () => {
    if (!user) {
      alert('Por favor, inicia sesión para calificar.')
      return
    }
    
    try {
      const supabase = createSupabaseBrowserClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        alert('Necesitas iniciar sesión.')
        return
      }

      const action = isAccurate ? 'remove' : 'add'
      
      const response = await fetch(`/api/quiz/${quizData?.id}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          type: 'accurate',
          action: action
        })
      })

      if (response.ok) {
        const data = await response.json()
        setIsAccurate(!isAccurate)
        setAccurateCount(data.count)
      }
    } catch (error) {
      console.error('Error al marcar como preciso:', error)
    }
  }

  const handleShare = async () => {
    try {
      const isLocalhost = window.location.hostname === 'localhost'
      const baseUrl = isLocalhost 
        ? 'https://helloamiko.com'
        : window.location.origin
      
      const shareUrl = `${baseUrl}/quiz/mood`
      const shareText = `${quizData?.description || 'Encuentra tu Mood'}\n\n${shareUrl}`
      
      if (navigator.share) {
        await navigator.share({
          title: quizData?.title || 'Encuentra tu Mood',
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
        const isLocalhost = window.location.hostname === 'localhost'
        const baseUrl = isLocalhost ? 'https://helloamiko.com' : window.location.origin
        const shareUrl = `${baseUrl}/quiz/mood`
        const shareText = `${quizData?.description}\n\n${shareUrl}`
        await navigator.clipboard.writeText(shareText)
        alert('¡Enlace copiado!')
      } catch (clipboardError) {
        console.error('Error al compartir:', clipboardError)
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600 dark:border-gray-400 mx-auto mb-4"></div>
          <p className="text-gray-600">
            Cargando test...
          </p>
        </div>
      </div>
    )
  }

  if (error || !quizData) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">
            Error al cargar el test
          </p>
          <Button onClick={handleBack} variant="outline">
            Volver
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Página de introducción del test */}
      <div className="pt-24 md:pt-32 pb-8 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Botón de retroceso */}
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

          {/* Contenido principal */}
          <div className="bg-white">
            {/* Título y metadatos */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-3">
                {quizData.title}
              </h1>
              
              <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 bg-gray-300 rounded-full"></div>
                  <span>AMIKO</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-gray-400"></div>
                  <span>{quizData.total_participants.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-gray-400"></div>
                  <span>Aprox. {quizData.total_questions} min</span>
                </div>
              </div>
            </div>

            {/* Imagen miniatura - mostrar pequeña */}
            <div className="mb-6">
              <div className="relative w-full h-64 rounded-lg overflow-hidden">
                <img 
                  src={quizData.thumbnail_url || "/quizzes/mood/cover/cover.png"} 
                  alt={quizData.title}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Texto de descripción */}
            <div className="mb-6">
              <p className="text-gray-800 text-base leading-relaxed">
                {quizData.description}
              </p>
            </div>

            {/* Botón de inicio del test */}
            <div className="mb-6">
              <Button
                onClick={handleStart}
                disabled={isStarting}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white py-4 text-lg font-semibold rounded-lg shadow-lg"
              >
                {isStarting ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Cargando...</span>
                  </div>
                ) : (
                  'COMENZAR'
                )}
              </Button>
            </div>

            {/* Botones de interacción */}
            <div className="grid grid-cols-4 gap-4 mb-8">
              <button 
                onClick={handleSave}
                className={`flex flex-col items-center gap-2 p-3 rounded-lg transition-colors ${
                  isSaved ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 hover:bg-gray-100 text-gray-600'
                }`}
              >
                <Bookmark className={`w-5 h-5 ${isSaved ? 'text-blue-600 fill-current' : 'text-gray-600'}`} />
                <span className="text-xs">Guardar</span>
              </button>
              
              <button 
                onClick={handleFun}
                className={`flex flex-col items-center gap-2 p-3 rounded-lg transition-colors ${
                  isFun ? 'bg-red-50 text-red-600' : 'bg-gray-50 hover:bg-gray-100 text-gray-600'
                }`}
              >
                <Heart className={`w-5 h-5 ${isFun ? 'text-red-600 fill-current' : 'text-gray-600'}`} />
                <span className="text-xs">Divertido</span>
                <span className="text-xs text-gray-500">{funCount}</span>
              </button>
              
              <button 
                onClick={handleAccurate}
                className={`flex flex-col items-center gap-2 p-3 rounded-lg transition-colors ${
                  isAccurate ? 'bg-green-50 text-green-600' : 'bg-gray-50 hover:bg-gray-100 text-gray-600'
                }`}
              >
                <Target className={`w-5 h-5 ${isAccurate ? 'text-green-600 fill-current' : 'text-gray-600'}`} />
                <span className="text-xs">Preciso</span>
                <span className="text-xs text-gray-500">{accurateCount}</span>
              </button>
              
              <button 
                onClick={handleShare}
                className="flex flex-col items-center gap-2 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
              >
                <Share2 className="w-5 h-5" />
                <span className="text-xs">Compartir</span>
              </button>
            </div>

            {/* Sección de comentarios */}
            {quizData && (
              <div className="border-t pt-6 mt-8">
                <TestComments testId={quizData.id} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
