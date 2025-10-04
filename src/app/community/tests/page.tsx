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
import { useLanguage } from '@/context/LanguageContext'
import { useAuth } from '@/context/AuthContext'
import { toast } from 'sonner'

// 퀴즈 관련 인터페이스
interface Quiz {
  id: string
  title: string
  description: string
  category: string
  thumbnail_url: string | null
  total_questions: number
  is_active: boolean
  created_at: string
  updated_at: string
}

// 카테고리 아이콘 및 색상 매핑
const categoryConfig: { [key: string]: { icon: string; color: string; bgColor: string } } = {
  personality: {
    icon: '🎭',
    color: 'text-purple-700',
    bgColor: 'bg-purple-100'
  },
  celebrity: {
    icon: '⭐',
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-100'
  },
  knowledge: {
    icon: '🧠',
    color: 'text-blue-700',
    bgColor: 'bg-blue-100'
  },
  fun: {
    icon: '🎉',
    color: 'text-green-700',
    bgColor: 'bg-green-100'
  }
}

export default function TestsPage() {
  const router = useRouter()
  const { t } = useLanguage()
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
    category: 'fun',
    thumbnail_url: ''
  })

  const handleBack = () => {
    router.push('/main?tab=community')
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
      
      const categoryParam = selectedCategory !== 'all' ? `?category=${selectedCategory}` : ''
      const url = `/api/quizzes${categoryParam}`
      
      const response = await fetch(url)
      const data = await response.json()
      
      if (data.success) {
        const allQuizzes = data.data || data.quizzes || []
        
        // 문제가 있는 UUID 테스트들을 제외
        const filteredQuizzes = allQuizzes.filter((quiz: any) => 
          !quiz.id.includes('-00') && 
          !quiz.id.includes('-01-') && 
          quiz.id !== '268caf0b-0031-4e58-9245-606e3421f1fd'
        )
        
        console.log('필터링된 퀴즈:', filteredQuizzes.length, '개 (전체:', allQuizzes.length, '개)')
        setQuizzes(filteredQuizzes)
      } else {
        toast.error(t('tests.errorLoading'))
        setQuizzes([])
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
  const handleQuizClick = (quizId: string) => {
    console.log('퀴즈 클릭:', quizId)
    
    if (quizId.startsWith('sample-mbti') || quizId.startsWith('embedded-mbti')) {
      router.push('/quiz/sample-mbti')
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
          category: 'fun',
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 기존 Header 컴포넌트 사용 */}
      <Header />
      
      {/* 페이지별 헤더 */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 pt-40">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold text-gray-800">심리테스트</h1>
          </div>
          
          <div className="flex items-center gap-4">
            {/* 운영자일 때만 테스트 작성 버튼 표시 */}
            {isAdmin && (
              <Button
                onClick={() => setShowTestWriteModal(true)}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                <Plus className="w-4 h-4 mr-2" />
                테스트 작성
              </Button>
            )}
            
            {/* 이전 버튼 */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleBack}
              className="flex items-center gap-2 text-gray-700 hover:text-gray-900 border-2 border-gray-400 hover:border-gray-500 bg-white shadow-sm hover:shadow-md px-3 py-2"
            >
              <ArrowLeft className="w-4 h-4" />
              이전
            </Button>
          </div>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="max-w-6xl mx-auto px-4 pt-4 pb-6">
        {/* 카테고리 필터 */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'all', name: t('tests.categories.all') },
              { id: 'personality', name: t('tests.categories.personality') },
              { id: 'celebrity', name: t('tests.categories.celebrity') },
              { id: 'knowledge', name: t('tests.categories.knowledge') },
              { id: 'fun', name: t('tests.categories.fun') }
            ].map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
                className={selectedCategory === category.id ? 'bg-purple-500 text-white' : 'text-gray-600'}
              >
                {category.name}
              </Button>
            ))}
          </div>
        </div>

        {/* 테스트 목록 */}
        <div className="space-y-6">
          {quizzesLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-4"></div>
              <p className="text-gray-600">테스트를 불러오는 중...</p>
            </div>
          ) : quizzes.length === 0 ? (
            <Card className="p-8 text-center">
              <div className="text-gray-400 text-6xl mb-4">🧠</div>
              <h3 className="text-lg font-semibold text-gray-600 mb-2">아직 테스트가 없습니다</h3>
              <p className="text-gray-500">첫 번째 심리테스트를 만들어보세요!</p>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {quizzes.map((quiz) => {
                const config = categoryConfig[quiz.category] || categoryConfig.fun
                
                return (
                  <Card
                    key={quiz.id}
                    className="p-6 cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-105"
                    onClick={() => handleQuizClick(quiz.id)}
                  >
                    <div className="space-y-4">
                      {/* 카테고리 배지 */}
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.bgColor} ${config.color}`}>
                        <span className="mr-2">{config.icon}</span>
                        {t(`tests.categories.${quiz.category}`)}
                      </div>
                      
                      {/* 제목 */}
                      <h3 className="text-lg font-semibold text-gray-800 line-clamp-2">
                        {quiz.title}
                      </h3>
                      
                      {/* 설명 */}
                      <p className="text-gray-600 text-sm line-clamp-3">
                        {quiz.description}
                      </p>
                      
                      {/* 메타 정보 */}
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-1">
                            <Target className="w-4 h-4" />
                            <span>{quiz.total_questions} {t('tests.questions')}</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>{Math.ceil(quiz.total_questions * 0.5)} {t('tests.minutes')}</span>
                          </span>
                        </div>
                      </div>
                      
                      {/* 시작 버튼 */}
                      <Button
                        className="w-full bg-purple-500 hover:bg-purple-600 text-white"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleQuizClick(quiz.id)
                        }}
                      >
                        <Star className="w-4 h-4 mr-2" />
                        {t('tests.startButton')}
                      </Button>
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-800">
              새 테스트 작성
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              새로운 테스트를 작성하여 커뮤니티에 공유해보세요.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* 테스트 제목 */}
            <div>
              <Label htmlFor="test-title" className="text-sm font-medium text-gray-700">
                테스트 제목 *
              </Label>
              <Input
                id="test-title"
                placeholder="테스트 제목을 입력하세요"
                value={testFormData.title}
                onChange={(e) => setTestFormData(prev => ({ ...prev, title: e.target.value }))}
                className="mt-1"
              />
            </div>
            
            {/* 테스트 설명 */}
            <div>
              <Label htmlFor="test-description" className="text-sm font-medium text-gray-700">
                테스트 설명 *
              </Label>
              <Textarea
                id="test-description"
                placeholder="테스트에 대한 간단한 설명을 작성해주세요."
                value={testFormData.description}
                onChange={(e) => setTestFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={4}
                className="mt-1"
              />
            </div>
            
            {/* 카테고리 선택 */}
            <div>
              <Label htmlFor="test-category" className="text-sm font-medium text-gray-700">
                카테고리
              </Label>
              <Select
                value={testFormData.category} 
                onValueChange={(value) => setTestFormData(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="카테고리를 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="personality">🎭 성격</SelectItem>
                  <SelectItem value="celebrity">⭐ 연예인</SelectItem>
                  <SelectItem value="knowledge">🧠 지식</SelectItem>
                  <SelectItem value="fun">🎉 재미</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* 썸네일 URL */}
            <div>
              <Label htmlFor="test-thumbnail" className="text-sm font-medium text-gray-700">
                썸네일 URL (선택사항)
              </Label>
              <Input
                id="test-thumbnail"
                placeholder="이미지 URL을 입력하세요"
                value={testFormData.thumbnail_url}
                onChange={(e) => setTestFormData(prev => ({ ...prev, thumbnail_url: e.target.value }))}
                className="mt-1"
              />
              {testFormData.thumbnail_url && (
                <div className="mt-2">
                  <img 
                    src={testFormData.thumbnail_url} 
                    alt="썸네일 미리보기"
                    className="w-32 h-32 object-cover rounded-lg border"
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
    </div>
  )
}
