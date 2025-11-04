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

export default function IdolPositionTestPage() {
  const router = useRouter()
  const { language } = useLanguage()
  const { user } = useAuth()
  const [isStarting, setIsStarting] = useState(false)
  const [quizData, setQuizData] = useState<QuizData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // 상호작용 버튼 상태
  const [isSaved, setIsSaved] = useState(false)
  const [isFun, setIsFun] = useState(false)
  const [isAccurate, setIsAccurate] = useState(false)
  const [funCount, setFunCount] = useState(0)
  const [accurateCount, setAccurateCount] = useState(0)

  // 데이터베이스에서 퀴즈 데이터 가져오기
  useEffect(() => {
    const fetchQuizData = async () => {
      try {
        const supabase = createSupabaseBrowserClient()
        const { data, error } = await supabase
          .from('quizzes')
          .select('*')
          .eq('id', 'dea20361-fd46-409d-880f-f91869c1d184')
          .single()

        if (error) {
          throw error
        }

        setQuizData(data)
      } catch (err) {
        console.error('Error al cargar los datos del quiz:', err)
        setError('No se pudieron cargar los datos del quiz.')
      } finally {
        setLoading(false)
      }
    }

    fetchQuizData()
  }, [])

  // 상호작용 데이터 가져오기
  useEffect(() => {
    if (quizData) {
      fetchInteractionData()
    }
  }, [quizData])

  // 사용자 정보가 변경될 때마다 상호작용 상태 다시 확인
  useEffect(() => {
    if (quizData && user) {
      fetchInteractionData()
    }
  }, [user, quizData])

  // 상호작용 데이터 가져오기 (임시로 로컬 스토리지 사용)
  const fetchInteractionData = async () => {
    try {
      // 임시로 더미 데이터 사용
      setFunCount(0)
      setAccurateCount(0)
      setIsFun(false)
      setIsAccurate(false)

      // 저장 상태는 간단히 로컬 스토리지 사용
      if (user) {
        const savedQuizzes = JSON.parse(localStorage.getItem('saved_quizzes') || '[]')
        setIsSaved(savedQuizzes.includes(quizData?.id))
      }
    } catch (error) {
      console.error('Error al cargar los datos de interacción:', error)
    }
  }

  // 댓글 가져오기 (임시로 로컬 스토리지 사용)
  const handleBack = () => {
    router.push('/community/tests')
  }

  const handleStart = () => {
    setIsStarting(true)
    // 커버 페이지로 이동
    router.push('/quiz/idol-position/cover')
  }

  // 상호작용 버튼 핸들러들
  const handleSave = async () => {
    if (!user) {
      alert('Por favor, inicia sesión para guardar el test.')
      return
    }
    
    try {
      const savedQuizzes = JSON.parse(localStorage.getItem('saved_quizzes') || '[]')
      
      if (isSaved) {
        // 저장 취소
        const updatedQuizzes = savedQuizzes.filter((id: string) => id !== quizData?.id)
        localStorage.setItem('saved_quizzes', JSON.stringify(updatedQuizzes))
        setIsSaved(false)
      } else {
        // 저장
        savedQuizzes.push(quizData?.id)
        localStorage.setItem('saved_quizzes', JSON.stringify(savedQuizzes))
        setIsSaved(true)
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
      const supabase = createClientComponentClient()
      
      if (isFun) {
        // 재밌어요 취소
        await supabase
          .from('quiz_reactions')
          .delete()
          .eq('quiz_id', quizData?.id)
          .eq('user_id', user.id)
          .eq('reaction_type', 'fun')
        setIsFun(false)
        setFunCount(prev => Math.max(0, prev - 1))
      } else {
        // 재밌어요 추가
        await supabase
          .from('quiz_reactions')
          .insert({ 
            quiz_id: quizData?.id, 
            user_id: user.id, 
            reaction_type: 'fun' 
          })
        setIsFun(true)
        setFunCount(prev => prev + 1)
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
      const supabase = createClientComponentClient()
      
      if (isAccurate) {
        // 정확해요 취소
        await supabase
          .from('quiz_reactions')
          .delete()
          .eq('quiz_id', quizData?.id)
          .eq('user_id', user.id)
          .eq('reaction_type', 'accurate')
        setIsAccurate(false)
        setAccurateCount(prev => Math.max(0, prev - 1))
      } else {
        // 정확해요 추가
        await supabase
          .from('quiz_reactions')
          .insert({ 
            quiz_id: quizData?.id, 
            user_id: user.id, 
            reaction_type: 'accurate' 
          })
        setIsAccurate(true)
        setAccurateCount(prev => prev + 1)
      }
    } catch (error) {
      console.error('Error al marcar como preciso:', error)
    }
  }

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: quizData?.title,
          text: quizData?.description,
          url: window.location.href
        })
      } else {
        // 클립보드에 URL 복사
        await navigator.clipboard.writeText(window.location.href)
        alert('URL copiada al portapapeles')
      }
    } catch (error) {
      console.error('Error al compartir:', error)
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
                  <div className="w-3 h-3 bg-gray-400"></div>
                  <span>{quizData.total_participants.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-gray-400"></div>
                  <span>Aprox. {quizData.total_questions} min</span>
                </div>
              </div>
            </div>

            {/* 썸네일 이미지 */}
            <div className="mb-6">
              <div className="relative w-full h-64 rounded-lg overflow-hidden">
                {/* 실제 썸네일 이미지를 배경으로 사용 */}
                <img 
                  src={quizData.thumbnail_url || "/quizzes/idol-position/thumbnail.png"} 
                  alt={quizData.title}
                  className="w-full h-full object-cover"
                />
                
                {/* 그라데이션 오버레이 */}
                <div className="absolute inset-0 bg-gradient-to-b from-blue-600/60 to-purple-500/60"></div>
                
                {/* 이미지 오버레이 텍스트 */}
                <div className="absolute top-4 left-4 right-4">
                  <p className="text-white text-sm font-medium drop-shadow-lg">
                    Encuentra la posición perfecta para ti
                  </p>
                </div>
                <div className="absolute bottom-8 left-4 right-4">
                  <h2 className="text-white text-xl font-bold mb-2 drop-shadow-lg">
                    ¿Qué posición de idol me quedaría mejor?
                  </h2>
                </div>
                
                {/* 다이아몬드 모양과 실루엣 */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-32 h-32 border-2 border-white/30 rounded-lg transform rotate-45 flex items-center justify-center">
                    <div className="w-20 h-20 bg-white/20 rounded-lg transform -rotate-45 flex items-center justify-center">
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 설명 텍스트 */}
            <div className="mb-6">
              <p className="text-gray-800 text-base leading-relaxed mb-3">
                {quizData.description}
              </p>
              
              <div className="space-y-2 mb-4">
                <p className="text-gray-700">
                  ¿Maknae del equipo 😊?
                </p>
                <p className="text-gray-700">
                  ¿Bailarín principal 💃?
                </p>
                <p className="text-gray-700">
                  ¿Centro definitivo ✨?
                </p>
              </div>
              
              <p className="text-gray-800 font-medium">
                ¿En qué posición debutaré? 🎤 ¡Descubrámoslo ahora!
              </p>
            </div>

            {/* 해시태그 */}
            <div className="flex gap-2 mb-6">
              <span className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full">
                #idol
              </span>
              <span className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full">
                #test
              </span>
            </div>

            {/* 테스트 시작 버튼 */}
            <div className="mb-6">
              <Button
                onClick={handleStart}
                disabled={isStarting}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white py-4 text-lg font-semibold rounded-lg"
              >
                {isStarting ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Cargando...</span>
                  </div>
                ) : (
                  'Comenzar Test'
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

            {/* 댓글 섹션 */}
            <div className="border-t pt-6 mt-8">
              <TestComments testId="dea20361-fd46-409d-880f-f91869c1d184" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}