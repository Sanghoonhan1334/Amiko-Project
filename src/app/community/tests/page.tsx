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
import { ArrowLeft, Plus, Target, Clock, Star } from 'lucide-react'
import Header from '@/components/layout/Header'
import BottomTabNavigation from '@/components/layout/BottomTabNavigation'
import { useLanguage } from '@/context/LanguageContext'
import { useAuth } from '@/context/AuthContext'
import { toast } from 'sonner'
import LoadingOverlay from '@/components/common/LoadingOverlay'

// 퀴즈 관련 인터페이스
interface Quiz {
  id: string
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
    return t(`tests.categories.${category}`)
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
      
      // 임시로 하드코딩된 테스트 데이터 사용 (데이터베이스 설정 전까지)
      const allSampleTests = [
        {
          id: 'mbti-celeb-test',
          title: t('tests.mbti.title'),
          description: t('tests.mbti.description'),
          category: 'culture',
          thumbnail_url: null,
          total_questions: 24,
          is_active: true,
          isCompleted: true,
          participantCount: 1247,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'color-personality-test',
          title: t('tests.sampleTests.colorPersonality.title'),
          description: t('tests.sampleTests.colorPersonality.description'),
          category: 'psychology',
          thumbnail_url: null,
          total_questions: 6,
          is_active: true,
          isCompleted: false,
          participantCount: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'kpop-style-test',
          title: t('tests.sampleTests.kpopStyle.title'),
          description: t('tests.sampleTests.kpopStyle.description'),
          category: 'culture',
          thumbnail_url: null,
          total_questions: 7,
          is_active: true,
          isCompleted: false,
          participantCount: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'fortune-daily-test',
          title: t('tests.sampleTests.fortuneDaily.title'),
          description: t('tests.sampleTests.fortuneDaily.description'),
          category: 'fortune',
          thumbnail_url: null,
          total_questions: 5,
          is_active: true,
          isCompleted: false,
          participantCount: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'meme-personality-test',
          title: t('tests.sampleTests.memePersonality.title'),
          description: t('tests.sampleTests.memePersonality.description'),
          category: 'meme',
          thumbnail_url: null,
          total_questions: 6,
          is_active: true,
          isCompleted: false,
          participantCount: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]
      
      // 카테고리 필터링
      const filteredTests = selectedCategory === 'all' 
        ? allSampleTests 
        : allSampleTests.filter(test => test.category === selectedCategory)
      
      setQuizzes(filteredTests)
      console.log('샘플 테스트 로드됨:', filteredTests.length, '개 (카테고리:', selectedCategory, ')')
    } catch (error) {
      console.error('퀴즈 로딩 오류:', error)
      toast.error(t('tests.errorLoading'))
      setQuizzes([])
    } finally {
      setQuizzesLoading(false)
    }
  }

  // 퀴즈 클릭 처리
  const handleQuizClick = (quizId: string) => {
    console.log('퀴즈 클릭:', quizId)
    
    // 미완성 테스트 체크
    const quiz = quizzes.find(q => q.id === quizId)
    if (quiz && !quiz.isCompleted) {
      toast.info(
        language === 'ko' 
          ? '이 테스트는 아직 준비 중입니다. 조금만 기다려주세요! 🚧' 
          : 'Este test aún está en preparación. ¡Por favor espera un poco! 🚧',
        {
          duration: 3000,
        }
      )
      return
    }
    
    if (quizId.startsWith('sample-mbti') || quizId.startsWith('embedded-mbti')) {
      router.push('/quiz/sample-mbti')
    } else if (quizId === 'mbti-celeb-test') {
      router.push('/quiz/mbti-celeb')
    } else {
      router.push(`/quiz/${quizId}`)
    }
  }

  // 테스트 생성 함수
  const handleCreateTest = async () => {
    if (!testFormData.title.trim()) {
      toast.error('테스트 제목을 입력해주세요.')
      return
    }
    
    if (!testFormData.description.trim()) {
      toast.error('테스트 설명을 입력해주세요.')
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
        toast.success('테스트가 생성되었습니다!')
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
        console.error('테스트 생성 실패:', errorData)
        toast.error(errorData.error || '테스트 생성에 실패했습니다.')
      }
    } catch (error) {
      console.error('테스트 생성 오류:', error)
      toast.error('테스트 생성 중 오류가 발생했습니다.')
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
    preloadImage.src = '/celebs/bts.webp'
    
    // 다른 셀럽 이미지들도 프리로딩
    const celebImages = [
      '/celebs/bts.jpg',
      '/celebs/jennie.png',
      '/celebs/jimin.png',
      '/celebs/jungkook.png'
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
              <span className="hidden xs:inline">{t('buttons.back')}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* 메인 컨텐츠 - 모바일 컴팩트 */}
      <div className="max-w-6xl mx-auto px-3 pt-1 pb-4">
        {/* 설명 메시지 - 모바일에서만 표시 */}
        <div className="text-center mb-4 px-1 sm:hidden">
          <p className="text-xs text-gray-600 dark:text-gray-400">{t('tests.description')}</p>
        </div>


        {/* 테스트 목록 - 모바일 컴팩트 */}
        <div className="px-1">
          {quizzesLoading ? (
            <div className="text-center py-6">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-500 mx-auto mb-2"></div>
              <p className="text-xs text-gray-600 dark:text-gray-400">{t('tests.loading')}</p>
            </div>
          ) : quizzes.length === 0 ? (
            <Card className="p-4 text-center bg-white dark:bg-gray-700">
              <div className="text-gray-400 dark:text-gray-500 text-3xl mb-2">✨</div>
              <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-1">{t('tests.noPosts')}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">{t('tests.beFirst')}</p>
            </Card>
          ) : (
            <div className="grid gap-2 grid-cols-1 md:grid-cols-3 lg:grid-cols-4">
              {quizzes.map((quiz, index) => {
                const config = categoryConfig[quiz.category] || categoryConfig.fun
                const isNew = index < 3 // 처음 3개는 NEW로 표시
                const isHot = quiz.participantCount && quiz.participantCount > 500 // 500명 이상이면 HOT 표시
                
                return (
                  <Card
                    key={quiz.id}
                    className={`group transition-all duration-300 ${
                      quiz.isCompleted 
                        ? 'cursor-pointer hover:shadow-md hover:scale-105 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600' 
                        : 'cursor-not-allowed bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 opacity-75'
                    } overflow-hidden`}
                    onClick={() => handleQuizClick(quiz.id)}
                  >
                    <div className="relative">
                      {/* 썸네일 영역 - BTS 이미지가 전체 상단을 차지 */}
                      <div className={`h-16 ${quiz.category === 'culture' && quiz.isCompleted ? '' : config.bgColor} flex items-center justify-center relative overflow-hidden ${
                        !quiz.isCompleted ? 'grayscale opacity-60' : ''
                      }`}>
                        {quiz.category === 'culture' && quiz.isCompleted ? (
                          <img 
                            src="/celebs/bts.webp" 
                            alt="BTS" 
                            className="w-full h-full object-cover"
                            loading="eager"
                            decoding="async"
                          />
                        ) : (
                          <div className="text-xl">{config.icon}</div>
                        )}
                        {/* 그라데이션 오버레이 */}
                        <div className="absolute inset-0 bg-white/20"></div>
                        
                        {/* 배지 - 이미지 위에 오버레이 */}
                        <div className="absolute top-0.5 left-0.5 z-10 flex gap-0.5">
                          {isNew && quiz.isCompleted && (
                            <span className="bg-red-500 text-white text-xs font-bold px-1 py-0.5 rounded-full">
                              NEW
                            </span>
                          )}
                          {isHot && quiz.isCompleted && (
                            <span className="bg-orange-500 text-white text-xs font-bold px-1 py-0.5 rounded-full">
                              HOT
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* 콘텐츠 영역 */}
                      <div className="p-2">
                        {/* 카테고리 */}
                        <div className={`inline-flex items-center px-1 py-0.5 rounded-full text-xs font-medium ${config.bgColor} ${config.color} mb-1`}>
                          <span className="mr-0.5 text-xs">{config.icon}</span>
                          <span className="text-xs">{getCategoryName(quiz.category)}</span>
                        </div>
                        
                        {/* 제목 */}
                        <h3 className={`text-xs font-semibold line-clamp-2 mb-1 transition-colors ${
                          quiz.isCompleted 
                            ? 'text-gray-800 dark:text-gray-100 group-hover:text-purple-600 dark:group-hover:text-purple-400' 
                            : 'text-gray-500 dark:text-gray-500'
                        }`}>
                          {quiz.title}
                        </h3>
                        
                        {/* 설명 */}
                        <p className={`text-xs line-clamp-1 mb-1 ${
                          quiz.isCompleted ? 'text-gray-600 dark:text-gray-300' : 'text-gray-400 dark:text-gray-500'
                        }`}>
                          {quiz.description}
                        </p>
                        
                        {/* 메타 정보 */}
                        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                          <div className="flex items-center gap-0.5">
                            <span className="flex items-center gap-0.5">
                              <Target className="w-2 h-2" />
                              <span className="text-xs">{quiz.total_questions}{t('tests.questions')}</span>
                            </span>
                            {/* 미완성 표시 */}
                            {!quiz.isCompleted && (
                              <span className="inline-flex items-center px-1 py-0.5 rounded-full text-xs font-medium bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300">
                                {language === 'ko' ? '준비중' : 'Próximamente'}
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-gray-400 dark:text-gray-500">
                            {quiz.participantCount ? quiz.participantCount.toLocaleString() : 0}{t('tests.participants')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
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
      
      {/* 로딩 오버레이 */}
      <LoadingOverlay 
        isVisible={quizzesLoading} 
        message={quizzesLoading ? t('common.loadingContent') : ''}
      />
    </div>
  )
}
