'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/context/LanguageContext'
import { useAuth } from '@/context/AuthContext'
import TestComments from '@/components/quiz/TestComments'
import { Play, Clock, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function KoreanLevelTestPage() {
  const router = useRouter()
  const { language } = useLanguage()
  const { user } = useAuth()
  const [quiz, setQuiz] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isFavorited, setIsFavorited] = useState(false)
  const [favoriteCount, setFavoriteCount] = useState(0)
  const [isLoadingFavorite, setIsLoadingFavorite] = useState(false)

  // 하드코딩된 퀴즈 데이터 (DB 연결 전까지)
  const koreanLevelQuiz = {
    id: 'korean-level-1',
    title: language === 'ko' ? '한국어 레벨 테스트 1' : 'Prueba de Nivel de Coreano 1',
    description: language === 'ko' 
      ? '한국어 실력을 체크해보세요! 기초부터 고급까지 여러 레벨의 문제로 구성되어 있습니다.'
      : '¡Prueba tu nivel de coreano! Consiste en preguntas desde nivel básico hasta avanzado.',
    thumbnail_url: '/quizzes/korean-level/cover/cover.png',
    participant_count: 0,
    estimated_time: '15분',
    difficulty: 'Básico a Avanzado',
    category: 'Idiomas'
  }

  useEffect(() => {
    setQuiz(koreanLevelQuiz)
    setLoading(false)
  }, [language])

  const handleStart = () => {
    router.push('/quiz/korean-level/start')
  }

  const handleBack = () => {
    router.push('/community/tests')
  }

  // 즐겨찾기 상태 로드
  const loadFavoriteStatus = async () => {
    try {
      const response = await fetch(`/api/favorites?quizId=${koreanLevelQuiz.id}`)
      if (response.ok) {
        const data = await response.json()
        setIsFavorited(data.isFavorited)
        setFavoriteCount(data.favoriteCount)
      }
    } catch (error) {
      console.error('즐겨찾기 상태 로드 오류:', error)
    }
  }

  // 즐겨찾기 토글
  const toggleFavorite = async () => {
    if (!user) {
      alert(language === 'ko' ? '로그인이 필요합니다.' : 'Necesitas iniciar sesión.')
      return
    }

    setIsLoadingFavorite(true)
    try {
      const action = isFavorited ? 'remove' : 'add'
      const response = await fetch('/api/favorites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quizId: koreanLevelQuiz.id,
          action: action
        })
      })

      if (response.ok) {
        const data = await response.json()
        setIsFavorited(!isFavorited)
        setFavoriteCount(data.favoriteCount)
      } else {
        throw new Error('Failed to toggle favorite')
      }
    } catch (error) {
      console.error('즐겨찾기 토글 오류:', error)
      alert(language === 'ko' ? '오류가 발생했습니다.' : 'Ocurrió un error.')
    } finally {
      setIsLoadingFavorite(false)
    }
  }

  // 컴포넌트 마운트 시 즐겨찾기 상태 로드
  useEffect(() => {
    loadFavoriteStatus()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-50 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600 dark:border-gray-400 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {language === 'ko' ? '로딩 중...' : 'Cargando...'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-50 to-blue-100">

      {/* 메인 콘텐츠 */}
      <div className="container mx-auto px-4 pt-20 pb-8">
        <div className="max-w-4xl mx-auto">
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
          {/* 배너 이미지 */}
          <div className="mb-8 rounded-lg overflow-hidden">
            <img
              src="/quizzes/korean-level/cover/cover.png"
              alt={language === 'ko' ? '한국어 레벨 테스트' : 'Test de Nivel de Coreano'}
              className="w-full h-96 md:h-[500px] object-cover"
            />
          </div>

          {/* 시작 버튼 */}
          <div className="text-center mb-8">
            <button
              onClick={handleStart}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-3 px-6 rounded-lg text-base shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105"
            >
              {language === 'ko' ? '테스트 시작하기' : 'Comenzar Test'}
            </button>
          </div>

          {/* 테스트 정보 - 간략하게\- */}
          <div className="flex items-center text-gray-600 text-sm md:text-lg mb-4">
            {/* AMIKO (Author/Source) */}
            <div className="flex items-center mr-3">
              <div className="w-4 h-4 md:w-6 md:h-6 rounded-full bg-gray-300 mr-1"></div>
              <span className="font-bold text-gray-800 md:text-lg">AMIKO</span>
            </div>
            
            <Play className="w-4 h-4 md:w-6 md:h-6 text-purple-600 mr-1" />
            <span className="font-bold text-gray-800 mr-1 md:text-lg">{quiz.participant_count}</span>
            <span className="mr-3 md:text-lg">{language === 'ko' ? '명 참여' : 'participantes'}</span>
            
            <Clock className="w-4 h-4 md:w-6 md:h-6 text-blue-600 mr-1" />
            <span className="font-bold text-gray-800 mr-1 md:text-lg">
              {language === 'ko' ? `${quiz.estimated_time}분 예상` : `Aprox. ${quiz.estimated_time.replace('분', '')} min`}
            </span>
          </div>

          {/* 설명 섹션 - 간략하게 */}
          <div className="mb-6">
            <p className="text-gray-700 leading-relaxed mb-4 md:text-lg">
              {language === 'ko' 
                ? '이 테스트는 한국어 실력을 정확하게 측정하기 위해 다양한 레벨의 문제들로 구성되어 있습니다. 기초적인 한글 읽기부터 고급 문법까지 체계적으로 평가합니다.'
                : 'Este test está diseñado para medir con precisión tu nivel de coreano mediante preguntas de diversos niveles. Evalúa sistemáticamente desde la lectura básica de hangul hasta la gramática avanzada.'
              }
            </p>
            
            <div className="space-y-2 mb-4">
              <div className="flex items-center md:text-lg">
                <span className="w-1.5 h-1.5 md:w-2 md:h-2 bg-purple-500 rounded-full mr-2"></span>
                {language === 'ko' ? '기초 한글 읽기 및 쓰기' : 'Lectura y escritura básica de hangul'}
              </div>
              <div className="flex items-center md:text-lg">
                <span className="w-1.5 h-1.5 md:w-2 md:h-2 bg-purple-500 rounded-full mr-2"></span>
                {language === 'ko' ? '일상 회화 표현' : 'Expresiones de conversación cotidiana'}
              </div>
              <div className="flex items-center md:text-lg">
                <span className="w-1.5 h-1.5 md:w-2 md:h-2 bg-purple-500 rounded-full mr-2"></span>
                {language === 'ko' ? '문법 및 어휘력' : 'Gramática y vocabulario'}
              </div>
              <div className="flex items-center md:text-lg">
                <span className="w-1.5 h-1.5 md:w-2 md:h-2 bg-purple-500 rounded-full mr-2"></span>
                {language === 'ko' ? '문화적 이해도' : 'Comprensión cultural'}
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm md:text-base">#Coreano</span>
              <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm md:text-base">#Idioma</span>
              <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm md:text-base">#Test de Nivel</span>
            </div>
          </div>

          {/* 상호작용 카드들 */}
          <div className="grid grid-cols-4 gap-3 mb-6">
            <div 
              className={`bg-white rounded-lg p-3 md:p-4 text-center shadow-sm border hover:shadow-md transition-all cursor-pointer ${
                isFavorited ? 'border-blue-300 bg-blue-50' : ''
              } ${isLoadingFavorite ? 'opacity-50 pointer-events-none' : ''}`}
              onClick={toggleFavorite}
            >
              <div className="w-5 h-5 md:w-6 md:h-6 mx-auto mb-1 md:mb-2">
                <svg 
                  className={`w-full h-full transition-colors ${
                    isFavorited ? 'text-blue-600 fill-blue-600' : 'text-gray-600'
                  }`} 
                  fill={isFavorited ? 'currentColor' : 'none'} 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              </div>
              <div className={`text-xs md:text-base font-medium transition-colors ${
                isFavorited ? 'text-blue-800' : 'text-gray-800'
              }`}>
                Guardar
              </div>
              <div className={`text-[10px] md:text-sm mt-1 transition-colors ${
                isFavorited ? 'text-blue-600' : 'text-gray-500'
              }`}>
                {favoriteCount}
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-3 md:p-4 text-center shadow-sm border hover:shadow-md transition-shadow cursor-pointer">
              <div className="w-5 h-5 md:w-6 md:h-6 mx-auto mb-1 md:mb-2">
                <svg className="w-full h-full text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <div className="text-xs md:text-base font-medium text-gray-800">Divertido</div>
              <div className="text-[10px] md:text-sm text-gray-500 mt-1">0</div>
            </div>
            
            <div className="bg-white rounded-lg p-3 md:p-4 text-center shadow-sm border hover:shadow-md transition-shadow cursor-pointer">
              <div className="w-5 h-5 md:w-6 md:h-6 mx-auto mb-1 md:mb-2">
                <svg className="w-full h-full text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-xs md:text-base font-medium text-gray-800">Preciso</div>
              <div className="text-[10px] md:text-sm text-gray-500 mt-1">0</div>
            </div>
            
            <div className="bg-white rounded-lg p-3 md:p-4 text-center shadow-sm border hover:shadow-md transition-shadow cursor-pointer">
              <div className="w-5 h-5 md:w-6 md:h-6 mx-auto mb-1 md:mb-2">
                <svg className="w-full h-full text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                </svg>
              </div>
              <div className="text-xs md:text-base font-medium text-gray-800">Compartir</div>
              <div className="text-[10px] md:text-sm text-gray-500 mt-1">0</div>
            </div>
          </div>

          {/* 댓글 섹션 */}
          <div className="border-t pt-6 mt-8">
            <TestComments testId="korean-level-1" />
          </div>
        </div>
      </div>
    </div>
  )
}
