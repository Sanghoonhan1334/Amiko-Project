'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Plus, Target, Clock, Star, Play } from 'lucide-react'
import Header from '@/components/layout/Header'
import BottomTabNavigation from '@/components/layout/BottomTabNavigation'
import { useLanguage } from '@/context/LanguageContext'
import { useAuth } from '@/context/AuthContext'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'

// 퀴즈 관련 인터페이스
interface Quiz {
  id: string
  slug?: string
  title: string
  description: string
  category: string
  thumbnail_url: string | null
  total_questions: number
  is_active: boolean
  isCompleted?: boolean
  participantCount?: number
  created_at: string
  updated_at: string
}

// 카테고리 아이콘 및 색상 매핑
const categoryConfig: { [key: string]: { icon: string; color: string; bgColor: string } } = {
  fortune: {
    icon: '🔮',
    color: 'text-purple-700',
    bgColor: 'bg-purple-100'
  },
  psychology: {
    icon: '🧠',
    color: 'text-blue-700',
    bgColor: 'bg-blue-100'
  },
  personality: {
    icon: '👑',
    color: 'text-pink-700',
    bgColor: 'bg-pink-100'
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

export default function TestsPage() {
  const router = useRouter()
  const { t, language } = useLanguage()
  const { user, token } = useAuth()
  
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [quizzesLoading, setQuizzesLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [isAdmin, setIsAdmin] = useState(false)
  
  // 테스트 작성 모달 상태
  const [showTestWriteModal, setShowTestWriteModal] = useState(false)
  const [testFormData, setTestFormData] = useState({
    title: '',
    description: '',
    category: 'meme',
    thumbnail_url: ''
  })

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
        knowledge: 'Conocimiento',
        fun: 'Diversión',
        fortune: 'Fortuna',
        psychology: 'Psicología',
        meme: 'Meme',
        culture: 'Cultura'
      }
      return categoryNames[category] || category
    }
    
    return translated
  }

  // 운영자 권한 확인
  const checkAdminStatus = () => {
    if (!user) {
      setIsAdmin(false)
      return
    }
    
    const adminEmails = [
      'admin@amiko.com',
      'editor@amiko.com',
      'manager@amiko.com',
      'info@helloamiko.com'
    ]
    
    const adminIds = [
      '66623263-4c1d-4dce-85a7-cc1b21d01f70'
    ]
    
    setIsAdmin(
      adminEmails.includes(user.email) || 
      adminIds.includes(user.id)
    )
  }

  // 퀴즈 데이터 로드
  const fetchQuizzes = async () => {
    try {
      console.log('TestsPage: fetchQuizzes 호출됨, 카테고리:', selectedCategory)
      setQuizzesLoading(true)
      
      // 실제 API에서 퀴즈 데이터 가져오기
      const response = await fetch('/api/quizzes')
      if (!response.ok) {
        throw new Error('퀴즈 데이터를 가져올 수 없습니다.')
      }
      
      const result = await response.json()
      console.log('API 응답:', result)
      
      if (result.success && result.data) {
        // API 데이터를 프론트엔드 형식으로 변환
        const apiQuizzes = result.data.map((quiz: any) => ({
          id: quiz.id,
          slug: quiz.slug, // slug 필드 추가
          title: quiz.title,
          description: quiz.description,
          category: quiz.category,
          thumbnail_url: quiz.thumbnail_url,
          total_questions: quiz.total_questions,
          is_active: quiz.is_active,
          isCompleted: quiz.title?.includes('posición') || quiz.title?.includes('MBTI'), // 완성된 테스트 판별
          participantCount: quiz.total_participants || 0,
          created_at: quiz.created_at,
          updated_at: quiz.updated_at
        }))
        
        // 카테고리 필터링
        const filteredTests = selectedCategory === 'all' 
          ? apiQuizzes 
          : apiQuizzes.filter((test: any) => test.category === selectedCategory)
        
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

  // 퀴즈 클릭 처리
  const handleQuizClick = (quiz: Quiz) => {
    console.log('퀴즈 클릭 - 전체 데이터:', quiz)
    console.log('퀴즈 클릭 - title:', quiz.title)
    console.log('퀴즈 클릭 - slug:', quiz.slug)
    console.log('퀴즈 클릭 - id:', quiz.id)
    
    // 미완성 테스트 체크
    const isCompleted = quiz?.isCompleted !== undefined ? quiz.isCompleted : 
      (quiz?.title?.includes('MBTI'))
    
    if (!isCompleted) {
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
    console.log('라우팅할 경로:', href);
    router.push(href);
  }

  // 테스트 생성 함수
  const handleCreateTest = async () => {
    if (!testFormData.title.trim()) {
      toast.error('Por favor ingresa el título del test.')
      return
    }
    
    if (!testFormData.description.trim()) {
      toast.error('Por favor ingresa la descripción del test.')
      return
    }
    
    try {
      console.log('테스트 생성 요청 데이터:', testFormData)
      
      const response = await fetch('/api/tests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: testFormData.title,
          description: testFormData.description,
          category: testFormData.category,
          thumbnail_url: testFormData.thumbnail_url || null,
        })
      })
      
      if (response.ok) {
        toast.success('¡Test creado exitosamente!')
        setShowTestWriteModal(false)
        setTestFormData({
          title: '',
          description: '',
          category: 'meme',
          thumbnail_url: ''
        })
        
        // 테스트 목록 새로고침
        await fetchQuizzes()
      } else {
        const errorData = await response.json()
        console.error('Error al crear test:', errorData)
        toast.error(errorData.error || 'Error al crear el test.')
      }
    } catch (error) {
      console.error('Error al crear test:', error)
      toast.error('Error al crear el test.')
    }
  }

  useEffect(() => {
    checkAdminStatus()
  }, [user])

  useEffect(() => {
    fetchQuizzes()
  }, [selectedCategory])

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
                  <SelectItem value="fortune" className="text-[10px] sm:text-xs">🔮 {t('tests.categories.fortune')}</SelectItem>
                  <SelectItem value="psychology" className="text-[10px] sm:text-xs">🧠 {t('tests.categories.psychology')}</SelectItem>
                  <SelectItem value="meme" className="text-[10px] sm:text-xs">🎭 {t('tests.categories.meme')}</SelectItem>
                  <SelectItem value="culture" className="text-[10px] sm:text-xs">🌐 {t('tests.categories.culture')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* 운영자일 때만 테스트 작성 버튼 표시 */}
            {isAdmin && (
              <Button
                onClick={() => setShowTestWriteModal(true)}
                size="sm"
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white text-xs px-2 py-1 h-7"
              >
                <Plus className="w-3 h-3 mr-1" />
                테스트 작성
              </Button>
            )}
            
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

      {/* 메인 컨텐츠 - 모바일 컴팩트 */}
      <div className="max-w-6xl mx-auto pt-1 pb-4">
        {/* 설명 메시지 - 모바일에서만 표시 */}
        <div className="text-center mb-4 px-1 sm:hidden">
          <p className="text-xs text-gray-600 dark:text-gray-400">{t('tests.description')}</p>
        </div>


        {/* 테스트 목록 - 모바일 컴팩트 */}
        <div>
          {quizzesLoading ? (
            <div className="grid gap-2 grid-cols-1 md:grid-cols-3 lg:grid-cols-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <Card key={i} className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
                  <div className="p-3 space-y-3">
                    {/* 테스트 이미지 스켈레톤 */}
                    <Skeleton className="h-16 w-full rounded-lg" />
                    
                    {/* 제목 스켈레톤 */}
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                    
                    {/* 하단 정보 스켈레톤 */}
                    <div className="flex justify-between items-center pt-2">
                      <Skeleton className="h-3 w-8" />
                      <Skeleton className="h-3 w-12" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : quizzes.length === 0 ? (
            <Card className="p-4 text-center bg-white dark:bg-gray-700">
              <div className="text-gray-400 dark:text-gray-500 text-3xl mb-2">✨</div>
              <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-1">{t('tests.noPosts')}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">{t('tests.beFirst')}</p>
            </Card>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {quizzes.map((quiz, index) => {
                const config = categoryConfig[quiz.category] || categoryConfig.fun
                const isNew = index < 3 // 처음 3개는 NEW로 표시
                const isHot = quiz.participantCount && quiz.participantCount > 500 // 500명 이상이면 HOT 표시
                
                // 아이돌 포지션 테스트는 완성된 것으로 표시
                const isCompleted = quiz.isCompleted !== undefined ? quiz.isCompleted : 
                  (quiz.title?.includes('posición de idol') || quiz.title?.includes('MBTI'))
                
                return (
                  <div
                    key={quiz.id}
                    className={`group transition-all duration-300 cursor-pointer`}
                    onClick={() => handleQuizClick(quiz)}
                  >
                    {/* 썸네일 이미지 */}
                    <div className="w-full h-64 md:h-80 overflow-hidden bg-gray-100 flex items-center justify-center mb-3">
                      {quiz.thumbnail_url ? (
                        <img 
                          src={quiz.thumbnail_url} 
                          alt={quiz.title} 
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className={`w-full h-full ${config.bgColor} flex items-center justify-center ${
                          !isCompleted ? 'grayscale opacity-60' : ''
                        }`}>
                          <span className="text-lg">{config.icon}</span>
                        </div>
                      )}
                    </div>
                    
                    {/* 제목 */}
                    <h3 className="text-sm font-semibold text-gray-900 mb-2 line-clamp-2 leading-tight text-center">
                      {quiz.title}
                    </h3>
                    
                    {/* 실행수 */}
                    <div className="flex items-center justify-center gap-1 text-xs text-gray-500">
                      <Play className="w-3 h-3 text-gray-400" />
                      <span>{quiz.participantCount ? quiz.participantCount.toLocaleString() : 0}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* 테스트 작성 모달 */}
      <Dialog open={showTestWriteModal} onOpenChange={setShowTestWriteModal}>
        <DialogContent className="max-w-2xl bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-800 dark:text-gray-100">
              새 테스트 작성
            </DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400">
              새로운 테스트를 작성하여 커뮤니티에 공유해보세요.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* 테스트 제목 */}
            <div>
              <Label htmlFor="test-title" className="text-sm font-medium text-gray-700 dark:text-gray-200">
                테스트 제목 *
              </Label>
              <Input
                id="test-title"
                placeholder="테스트 제목을 입력하세요"
                value={testFormData.title}
                onChange={(e) => setTestFormData(prev => ({ ...prev, title: e.target.value }))}
                className="mt-1 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400"
              />
            </div>
            
            {/* 테스트 설명 */}
            <div>
              <Label htmlFor="test-description" className="text-sm font-medium text-gray-700 dark:text-gray-200">
                테스트 설명 *
              </Label>
              <Textarea
                id="test-description"
                placeholder="테스트에 대한 간단한 설명을 작성해주세요."
                value={testFormData.description}
                onChange={(e) => setTestFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={4}
                className="mt-1 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400"
              />
            </div>
            
            {/* 카테고리 선택 */}
            <div>
              <Label htmlFor="test-category" className="text-sm font-medium text-gray-700 dark:text-gray-200">
                카테고리
              </Label>
              <Select
                value={testFormData.category} 
                onValueChange={(value) => setTestFormData(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger className="mt-1 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100">
                  <SelectValue placeholder="카테고리를 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fortune">🔮 운세/별자리형</SelectItem>
                  <SelectItem value="psychology">🧠 심리/성향형</SelectItem>
                  <SelectItem value="meme">🎭 밈형/유머형</SelectItem>
                  <SelectItem value="culture">🌐 문화/라이프형</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* 썸네일 URL */}
            <div>
              <Label htmlFor="test-thumbnail" className="text-sm font-medium text-gray-700 dark:text-gray-200">
                썸네일 URL (선택사항)
              </Label>
              <Input
                id="test-thumbnail"
                placeholder="이미지 URL을 입력하세요"
                value={testFormData.thumbnail_url}
                onChange={(e) => setTestFormData(prev => ({ ...prev, thumbnail_url: e.target.value }))}
                className="mt-1 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400"
              />
              {testFormData.thumbnail_url && (
                <div className="mt-2">
                  <img 
                    src={testFormData.thumbnail_url} 
                    alt="썸네일 미리보기"
                    className="w-32 h-32 object-cover rounded-lg border border-gray-300 dark:border-gray-600"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                </div>
              )}
            </div>
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowTestWriteModal(false)}
              className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              취소
            </Button>
            <Button
              onClick={handleCreateTest}
              className="bg-purple-500 hover:bg-purple-600 text-white"
              disabled={!testFormData.title.trim() || !testFormData.description.trim()}
            >
              테스트 생성
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* 모바일 하단 네비게이션 - 커뮤니티 페이지에서는 숨김 */}
      {/* <BottomTabNavigation /> */}
      
    </div>
  )
}
