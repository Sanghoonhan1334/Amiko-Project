'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Header from '@/components/layout/Header'
import { useLanguage } from '@/context/LanguageContext'
import { createSupabaseBrowserClient } from '@/lib/supabase-client'

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

export default function IdolPositionCoverPage() {
  const router = useRouter()
  const { language } = useLanguage()
  const [isStarting, setIsStarting] = useState(false)
  const [quizData, setQuizData] = useState<QuizData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
        console.error('퀴즈 데이터 로딩 실패:', err)
        setError('퀴즈 데이터를 불러올 수 없습니다.')
      } finally {
        setLoading(false)
      }
    }

    fetchQuizData()
  }, [])

  const handleBack = () => {
    router.push('/quiz/idol-position')
  }

  const handleStart = () => {
    setIsStarting(true)
    // 실제 테스트 페이지로 이동
    router.push('/quiz/idol-position/questions')
  }

  // 로딩 상태
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {language === 'es' ? 'Cargando test...' : '테스트 로딩 중...'}
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
            {language === 'es' ? 'Error al cargar el test' : '테스트 로드 중 오류 발생'}
          </p>
          <Button onClick={handleBack} variant="outline">
            {language === 'es' ? 'Volver' : '돌아가기'}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white relative">
      <Header />
      
      {/* 풀스크린 커버 이미지 */}
      <div className="absolute top-16 inset-x-0 bottom-0 w-full h-[calc(100vh-4rem)]">
        {/* 썸네일 이미지를 배경으로 사용 */}
        <img 
          src={quizData.thumbnail_url || "/quizzes/idol-position/thumbnail.png"} 
          alt={quizData.title}
          className="w-full h-full object-contain"
        />
        
        {/* 뒤로가기 버튼 */}
        <div className="absolute top-8 left-4 z-10">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="p-2 bg-white/20 hover:bg-white/30 rounded-full backdrop-blur-sm"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </Button>
        </div>
        
                    {/* 이미지 전체를 클릭 가능하게 만들기 */}
                    <div 
                      className="absolute inset-0 cursor-pointer"
                      style={{
                        zIndex: 20,
                        pointerEvents: 'auto'
                      }}
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        handleStart()
                      }}
                      onTouchEnd={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        handleStart()
                      }}
                      onMouseDown={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        handleStart()
                      }}
                    >
                      {/* 로딩 상태일 때만 표시되는 오버레이 */}
                      {isStarting && (
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                          <div className="bg-white/90 rounded-lg p-4 flex items-center gap-3">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                            <span className="text-gray-800 font-medium">
                              {language === 'es' ? 'Cargando test...' : '테스트 로딩 중...'}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
        
      </div>
    </div>
  )
}
