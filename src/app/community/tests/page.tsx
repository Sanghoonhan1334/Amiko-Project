'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Play, Clock } from 'lucide-react'
import Header from '@/components/layout/Header'
import { useLanguage } from '@/context/LanguageContext'
import { useAuth } from '@/context/AuthContext'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'

interface Quiz {
  id: string
  title: string
  description: string
  thumbnail_url: string | null
  total_questions: number
  total_participants: number
  created_at: string
  updated_at: string
  slug?: string
  category?: string
  isCompleted?: boolean
  participantCount?: number
}

// 카테고리 설정
const categoryConfig: { [key: string]: { icon: string; color: string; bgColor: string } } = {
  fortune: {
    icon: '🔮',
    color: 'text-purple-700',
    bgColor: 'bg-purple-100'
  },
  psychology: {
    icon: '🧠',
    color: 'text-pink-700',
    bgColor: 'bg-pink-100'
  },
  celebrity: {
    icon: '⭐',
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-100'
  },
  personality: {
    icon: '👑',
    color: 'text-blue-700',
    bgColor: 'bg-blue-100'
  },
  language: {
    icon: '📚',
    color: 'text-green-700',
    bgColor: 'bg-green-100'
  },
  meme: {
    icon: '🎭',
    color: 'text-green-700',
    bgColor: 'bg-green-100'
  },
  culture: {
    icon: '🌐',
    color: 'text-orange-700',
    bgColor: 'bg-orange-100'
  }
}

function TestsPageContent() {
  const router = useRouter()
  const { t, language } = useLanguage()
  const { user, token } = useAuth()
  
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [quizzesLoading, setQuizzesLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [isAdmin, setIsAdmin] = useState(false)
  const [favoriteQuizzes, setFavoriteQuizzes] = useState<string[]>([])
  const [favoriteCounts, setFavoriteCounts] = useState<Record<string, number>>({})

  const handleBack = () => {
    router.push('/main?tab=community')
  }

  // 카테고리 이름 반환 함수
  const getCategoryName = (category: string) => {
    // 번역키가 없으면 기본값 반환
    const translationKey = `tests.categories.${category}`
    const translated = t(translationKey)
    
    // 번역키가 그대로 반환되면 기본값 사용
    if (translated === translationKey) {
      const categoryNames: { [key: string]: string } = {
        personality: 'Personalidad',
        celebrity: 'Celebridad',
        language: 'Idioma',
        meme: 'Meme/Humor',
        culture: 'Cultura/Estilo de Vida',
        fortune: 'Fortuna/Constelación',
        psychology: 'Psicología/Personalidad'
      }
      return categoryNames[category] || category
    }
    
    return translated
  }

  // 관리자 권한 확인
  const checkAdminStatus = async () => {
    if (!user) {
      setIsAdmin(false)
      return
    }

    try {
      const response = await fetch('/api/admin/check', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setIsAdmin(data.isAdmin || false)
      }
    } catch (error) {
      console.error('관리자 권한 확인 오류:', error)
      setIsAdmin(false)
    }
  }

  // 퀴즈 데이터 로드
  const fetchQuizzes = async () => {
    try {
      setQuizzesLoading(true)
      console.log('퀴즈 로딩 시작...')
      
      const response = await fetch('/api/quizzes')
      console.log('API 응답 상태:', response.status)
      
      if (response.ok) {
        const responseData = await response.json()
        console.log('API 응답 데이터:', responseData)
        
        let apiQuizzes = responseData.data || responseData || []
        
        // 카테고리 필터링
        let filteredTests = apiQuizzes
        
        if (selectedCategory === 'favorites') {
          // 즐겨찾기 필터링
          filteredTests = apiQuizzes.filter((test: any) => 
            favoriteQuizzes.includes(test.id)
          )
        } else if (selectedCategory !== 'all') {
          // 일반 카테고리 필터링
          filteredTests = apiQuizzes.filter((test: any) => test.category === selectedCategory)
        }
        
        setQuizzes(filteredTests)
        console.log('API에서 퀴즈 로드됨:', filteredTests.length, '개 (카테고리:', selectedCategory, ')')
      } else {
        throw new Error('퀴즈 데이터 형식이 올바르지 않습니다.')
      }
    } catch (error) {
      console.error('퀴즈 로딩 오류:', error)
      toast.error(t('tests.errorLoading'))
      setQuizzes([])
    } finally {
      setQuizzesLoading(false)
    }
  }

  // 즐겨찾기 상태 로드
  const loadFavoriteStatus = async () => {
    if (!user) return
    
    try {
      const response = await fetch(`/api/favorites?userId=${user.id}`)
      if (response.ok) {
        const data = await response.json()
        const favoriteIds = data.favorites.map((fav: any) => fav.quizzes?.id).filter(Boolean)
        setFavoriteQuizzes(favoriteIds)
        
        // 각 퀴즈의 즐겨찾기 개수 로드
        const counts: Record<string, number> = {}
        for (const quiz of quizzes) {
          const countResponse = await fetch(`/api/favorites?quizId=${quiz.id}`)
          if (countResponse.ok) {
            const countData = await countResponse.json()
            counts[quiz.id] = countData.favoriteCount || 0
          }
        }
        setFavoriteCounts(counts)
      }
    } catch (error) {
      console.error('즐겨찾기 상태 로드 오류:', error)
    }
  }

  // 즐겨찾기 토글
  const toggleFavorite = async (quizId: string) => {
    if (!user) {
      alert(language === 'ko' ? '로그인이 필요합니다.' : 'Necesitas iniciar sesión.')
      return
    }

    try {
      const isFavorited = favoriteQuizzes.includes(quizId)
      const action = isFavorited ? 'remove' : 'add'
      
      const response = await fetch('/api/favorites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quizId: quizId,
          action: action
        })
      })

      if (response.ok) {
        const data = await response.json()
        
        // 즐겨찾기 목록 업데이트
        if (isFavorited) {
          setFavoriteQuizzes(prev => prev.filter(id => id !== quizId))
        } else {
          setFavoriteQuizzes(prev => [...prev, quizId])
        }
        
        // 즐겨찾기 개수 업데이트
        setFavoriteCounts(prev => ({
          ...prev,
          [quizId]: data.favoriteCount
        }))
      }
    } catch (error) {
      console.error('즐겨찾기 토글 오류:', error)
    }
  }

  // 퀴즈 클릭 처리
  const handleQuizClick = (quiz: Quiz) => {
    console.log('🔍 [퀴즈 클릭] 전체 데이터:', quiz)
    console.log('🔍 [퀴즈 클릭] title:', quiz.title)
    console.log('🔍 [퀴즈 클릭] slug:', quiz.slug)
    console.log('🔍 [퀴즈 클릭] id:', quiz.id)
    console.log('🔍 [퀴즈 클릭] isCompleted:', quiz.isCompleted)
    
    // 미완성 테스트 체크 - 명시적으로 false인 경우만 차단
    if (quiz?.isCompleted === false) {
      console.log('🔍 [퀴즈 클릭] 미완성 테스트, 차단됨')
      toast.info(
        'Este test aún está en preparación. ¡Por favor espera un poco! 🚧',
        {
          duration: 3000,
        }
      )
      return
    }
    
    // slug 우선 라우팅
    const href = quiz?.slug ? `/quiz/${quiz.slug}` : `/quiz/${quiz.id}`;
    console.log('🔍 [퀴즈 클릭] 라우팅할 경로:', href);
    router.push(href);
  }

  useEffect(() => {
    checkAdminStatus()
  }, [user])

  useEffect(() => {
    fetchQuizzes()
  }, [selectedCategory])

  useEffect(() => {
    loadFavoriteStatus()
  }, [user, quizzes])

  // 🚀 최적화: 심리테스트 페이지 이미지 프리로딩
  useEffect(() => {
    // BTS 이미지 프리로딩
    const preloadImage = new Image()
    preloadImage.src = '/quizzes/mbti-with-kpop-stars/cover/cover.png'
    
    // 다른 셀럽 이미지들도 프리로딩
    const celebImages = [
      '/quizzes/mbti-with-kpop-stars/cover/cover.png',
      '/quizzes/mbti-with-kpop-stars/celebs/jennie.png',
      '/quizzes/mbti-with-kpop-stars/celebs/jimin.png',
      '/quizzes/mbti-with-kpop-stars/celebs/jungkook.png'
    ]
    
    celebImages.forEach(src => {
      const img = new Image()
      img.src = src
    })
  }, [])

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* 기존 Header 컴포넌트 사용 */}
      <Header />
      
      {/* 페이지별 헤더 - 모바일 컴팩트 */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-3 py-2 pt-28 sm:pt-32 md:pt-40">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold text-gray-800 dark:text-gray-100">{t('tests.title')}</h1>
          </div>
          
          {/* 카테고리 선택 - 헤더 중앙 */}
          <div className="flex-1 text-center px-1 sm:px-4">
            <div className="flex items-center justify-center gap-1 sm:gap-2">
              <span className="text-[10px] sm:text-xs font-medium text-gray-700 dark:text-gray-300 hidden xs:inline">{t('tests.category')}</span>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[100px] sm:w-[120px] h-5 sm:h-6 text-[9px] sm:text-xs bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 truncate">
                  <SelectValue placeholder={t('tests.selectCategory')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-[10px] sm:text-xs">{t('tests.categories.all')}</SelectItem>
                  <SelectItem value="favorites" className="text-[10px] sm:text-xs">⭐ {language === 'ko' ? '즐겨찾기' : 'Favoritos'}</SelectItem>
                  <SelectItem value="fortune" className="text-[10px] sm:text-xs">🔮 {t('tests.categories.fortune')}</SelectItem>
                  <SelectItem value="psychology" className="text-[10px] sm:text-xs">🧠 {t('tests.categories.psychology')}</SelectItem>
                  <SelectItem value="celebrity" className="text-[10px] sm:text-xs">⭐ Celebridad</SelectItem>
                  <SelectItem value="personality" className="text-[10px] sm:text-xs">👑 Personalidad</SelectItem>
                  <SelectItem value="meme" className="text-[10px] sm:text-xs">🎭 {t('tests.categories.meme')}</SelectItem>
                  <SelectItem value="culture" className="text-[10px] sm:text-xs">🌐 {t('tests.categories.culture')}</SelectItem>
                  <SelectItem value="language" className="text-[10px] sm:text-xs">📚 Idioma</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* 이전 버튼 */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleBack}
              className="flex items-center gap-0.5 sm:gap-1 text-gray-800 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white border-0 sm:border border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 bg-transparent sm:bg-white dark:bg-transparent sm:dark:bg-gray-700 text-[9px] sm:text-[10px] px-1 py-1 h-5 sm:h-6"
            >
              <ArrowLeft className="w-2 h-2 sm:w-2.5 sm:h-2.5" />
              <span className="hidden xs:inline">{language === 'ko' ? '이전' : 'Atrás'}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="container mx-auto px-4 py-6">
        {quizzesLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600 dark:border-gray-400 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">
                {language === 'ko' ? '테스트를 불러오는 중...' : 'Cargando tests...'}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 min-[500px]:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {quizzes.map((quiz) => {
              const config = categoryConfig[quiz.category || 'meme'] || categoryConfig.meme
              const isFavorited = favoriteQuizzes.includes(quiz.id)
              const favoriteCount = favoriteCounts[quiz.id] || 0
              
              return (
                <div
                  key={quiz.id}
                  onClick={() => handleQuizClick(quiz)}
                  className="cursor-pointer group"
                >
                  {/* 썸네일 이미지 */}
                  <div className="relative w-full h-32 md:h-40 lg:h-48 mb-2 rounded-lg overflow-hidden">
                    <img
                      src={quiz.thumbnail_url || '/quizzes/mbti-with-kpop-stars/cover/cover.png'}
                      alt={quiz.title}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-200"
                    />
                    
                    {/* 즐겨찾기 버튼 */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleFavorite(quiz.id)
                      }}
                      className={`absolute top-2 right-2 p-1 rounded-full transition-all ${
                        isFavorited 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-white/80 text-gray-600 hover:bg-blue-500 hover:text-white'
                      }`}
                    >
                      <svg className="w-4 h-4" fill={isFavorited ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                      </svg>
                    </button>
                  </div>
                  
                  {/* 제목 */}
                  <h3 className="text-sm md:text-base font-medium text-gray-900 dark:text-gray-100 mb-1 line-clamp-2">
                    {quiz.title}
                  </h3>
                  
                  {/* 참여자 수 */}
                  <div className="flex items-center gap-1 text-xs md:text-sm text-gray-500 dark:text-gray-400">
                    <Play className="w-3 h-3 md:w-4 md:h-4" />
                    <span>{quiz.participantCount || quiz.total_participants || 0}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
        
        {!quizzesLoading && quizzes.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">
              {language === 'ko' ? '테스트가 없습니다.' : 'No hay tests disponibles.'}
            </p>
          </div>
        )}
      </div>
      
      {/* 모바일 하단 네비게이션 - 커뮤니티 페이지에서는 숨김 */}
      {/* <BottomTabNavigation /> */}
      
    </div>
  )
}

export default function TestsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600 dark:border-gray-400 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    }>
      <TestsPageContent />
    </Suspense>
  )
}