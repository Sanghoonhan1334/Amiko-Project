'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Bookmark, Heart, Target, Share2, Play, Clock } from 'lucide-react'
import Header from '@/components/layout/Header'
import { useLanguage } from '@/context/LanguageContext'
import { createSupabaseBrowserClient } from '@/lib/supabase-client'
import { useAuth } from '@/context/AuthContext'
import TestComments from '@/components/quiz/TestComments'

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

export default function FortuneTestPage() {
  const router = useRouter()
  const { language } = useLanguage()
  const { user } = useAuth()
  const [isStarting, setIsStarting] = useState(false)
  const [currentlyStarting, setCurrentlyStarting] = useState(false)
  const [quizData, setQuizData] = useState<QuizData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // 상호작용 버튼 상태
  const [isSaved, setIsSaved] = useState(false)
  const [isFun, setIsFun] = useState(false)
  const [isAccurate, setIsAccurate] = useState(false)
  const [funCount, setFunCount] = useState(0)
  const [accurateCount, setAccurateCount] = useState(0)

  // 운세 테스트 고정 ID
  const FORTUNE_QUIZ_ID = 'fortune-test-2024'

  // 운세 테스트 데이터 설정
  useEffect(() => {
    // 하드코딩된 운세 테스트 데이터
    const fortuneTestData: QuizData = {
      id: FORTUNE_QUIZ_ID,
      title: 'Test de Fortuna Personalizada',
      description: 'Descubre tu fortuna de hoy basada en tu estado emocional y personalidad. ¡Un test único que te revelará qué te depara el destino!',
      thumbnail_url: '/quizzes/fortune/cover/cover.png',
      total_questions: 9,
      total_participants: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    setQuizData(fortuneTestData)
    setLoading(false)
  }, [])

  // 상호작용 데이터 로드
  useEffect(() => {
    const loadInteractionData = async () => {
      if (!user) return
      
      try {
        const supabase = createSupabaseBrowserClient()
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session?.access_token) return

        // 즐겨찾기 상태 로드
        const favResponse = await fetch(`/api/favorites?quizId=${FORTUNE_QUIZ_ID}`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        })
        
        if (favResponse.ok) {
          const favData = await favResponse.json()
          setIsSaved(favData.isFavorited)
        }

        // 피드백 상태 로드
        const feedbackResponse = await fetch(`/api/quiz/${FORTUNE_QUIZ_ID}/feedback`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        })
        
        if (feedbackResponse.ok) {
          const feedbackData = await feedbackResponse.json()
          setIsFun(feedbackData.isFun)
          setIsAccurate(feedbackData.isAccurate)
          setFunCount(feedbackData.funCount)
          setAccurateCount(feedbackData.accurateCount)
        }
      } catch (error) {
        console.error('Error al cargar datos de interacción:', error)
      }
    }
    
    loadInteractionData()
  }, [user])

  const handleBack = () => {
    router.push('/community/tests')
  }

  const handleStart = () => {
    setIsStarting(true)
    // 시작 페이지로 이동
    router.push('/quiz/fortune/start')
  }

  // 상호작용 버튼 핸들러들
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
          quizId: FORTUNE_QUIZ_ID,
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
      
      const response = await fetch(`/api/quiz/${FORTUNE_QUIZ_ID}/feedback`, {
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
      
      const response = await fetch(`/api/quiz/${FORTUNE_QUIZ_ID}/feedback`, {
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
      // 프로덕션 URL 사용
      const isLocalhost = window.location.hostname === 'localhost'
      const baseUrl = isLocalhost 
        ? 'https://helloamiko.com'
        : window.location.origin
      
      const shareUrl = `${baseUrl}/quiz/fortune`
      const shareText = `${quizData?.description || 'Test de Fortuna Personalizada'}\n\n${shareUrl}`
      
      if (navigator.share) {
        await navigator.share({
          title: quizData?.title || 'Test de Fortuna',
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
        const shareUrl = `${baseUrl}/quiz/fortune`
        const shareText = `${quizData?.description}\n\n${shareUrl}`
        await navigator.clipboard.writeText(shareText)
        alert('¡Enlace copiado!')
      } catch (clipboardError) {
        console.error('Error al compartir:', clipboardError)
      }
    }
  }

  // 로딩 상태
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

  // 에러 상태
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
      
      {/* 테스트 소개 페이지 */}
      <div className="pt-24 md:pt-32 pb-8 px-4">
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
                {quizData.title}
              </h1>
              
              <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 bg-gray-300 rounded-full"></div>
                  <span>AMIKO</span>
                </div>
                <div className="flex items-center gap-1">
                  <Play className="w-3 h-3 text-gray-400" />
                  <span>{quizData.total_participants.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-gray-400" />
                  <span>Aprox. {quizData.total_questions} min</span>
                </div>
              </div>
            </div>

            {/* 썸네일 이미지 - 작게 표시 */}
            <div className="mb-6">
              <div className="relative w-full h-48 rounded-lg overflow-hidden">
                <img 
                  src={quizData.thumbnail_url || "/quizzes/fortune/cover/cover.png"} 
                  alt={quizData.title}
                  className="w-full h-full object-cover"
                />
                
                {/* 그라데이션 오버레이 */}
                <div className="absolute inset-0 bg-gradient-to-b from-orange-600/60 to-yellow-500/60"></div>
                
                {/* 이미지 오버레이 텍스트 */}
                <div className="absolute top-4 left-4 right-4">
                  <p className="text-white text-sm font-medium drop-shadow-lg">
                    Descubre tu fortuna de hoy
                  </p>
                </div>
                <div className="absolute bottom-8 left-4 right-4">
                  <h2 className="text-white text-xl font-bold mb-2 drop-shadow-lg">
                    ¿Qué te depara el destino?
                  </h2>
                </div>
                
                {/* 북마크 버튼 (우측 상단) */}
                <button
                  onClick={handleSave}
                  className={`absolute top-4 right-4 p-2 rounded-full backdrop-blur-sm transition-all duration-200 ${
                    isSaved 
                      ? 'bg-blue-500 text-white shadow-lg' 
                      : 'bg-white/80 text-gray-700 hover:bg-white'
                  }`}
                  aria-label={isSaved ? 'Guardado' : 'Guardar'}
                >
                  <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
                </button>
              </div>
            </div>

            {/* 설명 텍스트 */}
            <div className="mb-6">
              <p className="text-gray-800 text-base leading-relaxed mb-3">
                {quizData.description}
              </p>
              
              <div className="space-y-2 mb-4">
                <p className="text-gray-700">
                  ¿Cómo te sientes hoy? 😊
                </p>
                <p className="text-gray-700">
                  ¿Qué esperas del futuro? ✨
                </p>
                <p className="text-gray-700">
                  ¿Cuál es tu estado de ánimo? 💭
                </p>
                <p className="text-gray-700">
                  ¿Qué te preocupa más? 📋
                </p>
              </div>
              
              <p className="text-gray-800 font-medium">
                ¡Descubre tu fortuna personalizada basada en tus respuestas! 🌟
              </p>
            </div>

            {/* 해시태그 */}
            <div className="flex gap-2 mb-6">
              <span className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full">
                #Fortuna
              </span>
              <span className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full">
                #Destino
              </span>
              <span className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full">
                #Test de Personalidad
              </span>
            </div>

            {/* 테스트 시작 버튼 */}
            <div className="mb-6">
              <Button
                onClick={handleStart}
                disabled={isStarting}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white py-4 text-lg font-semibold rounded-lg"
              >
                {isStarting ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Cargando...</span>
                  </div>
                ) : (
                  'Comenzar Test de Fortuna'
                )}
              </Button>
            </div>

            {/* 상호작용 버튼들 */}
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
          </div>
          
          {/* 댓글 섹션 */}
          <div className="border-t pt-6 mt-8">
            <TestComments testId="fortune" />
          </div>
        </div>
      </div>
    </div>
  )
}
