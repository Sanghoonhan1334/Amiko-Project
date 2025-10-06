'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { ArrowLeft, Plus, MessageSquare, ThumbsUp, User, Clock, Eye } from 'lucide-react'
import Header from '@/components/layout/Header'
import BottomTabNavigation from '@/components/layout/BottomTabNavigation'
import { useLanguage } from '@/context/LanguageContext'
import { useAuth } from '@/context/AuthContext'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'

export default function QAPage() {
  const router = useRouter()
  const { t, language } = useLanguage()
  const { user, token } = useAuth()
  
  // 상태 관리
  const [questions, setQuestions] = useState<any[]>([])
  const [answers, setAnswers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [answersLoading, setAnswersLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // 질문 관련 상태
  const [selectedQuestion, setSelectedQuestion] = useState<any>(null)
  const [showQuestionModal, setShowQuestionModal] = useState(false)
  const [showAnswerDrawer, setShowAnswerDrawer] = useState(false)
  const [activeCategory, setActiveCategory] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  
  // 좋아요 상태 관리
  const [likedAnswers, setLikedAnswers] = useState<Set<number>>(new Set())
  
  // 질문 작성 폼 상태
  const [questionForm, setQuestionForm] = useState({
    title: '',
    content: '',
    category: 'free',
    tags: ''
  })

  // 이미지 관련 상태
  const [questionUploadedImages, setQuestionUploadedImages] = useState<Array<{url: string, name: string}>>([])

  // 답변 작성 폼 상태
  const [answerForm, setAnswerForm] = useState({
    content: ''
  })

  const handleBack = () => {
    router.push('/main?tab=community')
  }

  // 이미지 업로드 함수
  const insertImageToContent = async (file: File) => {
    try {
      // 토큰 확인 및 가져오기
      let currentToken = token
      
      if (!currentToken) {
        // localStorage에서 토큰 가져오기 시도
        const storedToken = localStorage.getItem('amiko_session')
        if (storedToken) {
          try {
            const parsedToken = JSON.parse(storedToken)
            currentToken = parsedToken.access_token
          } catch (e) {
            console.error('토큰 파싱 오류:', e)
          }
        }
      }

      if (!currentToken) {
        toast.error('로그인이 필요합니다.')
        return
      }

      const formData = new FormData()
      formData.append('file', file)
      
      const response = await fetch('/api/upload/image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${currentToken}`
        },
        body: formData
      })
      
      if (!response.ok) {
        throw new Error('이미지 업로드 실패')
      }
      
      const result = await response.json()
      
      // 질문용 이미지 업로드
      const newImage = { url: result.url, name: file.name }
      setQuestionUploadedImages(prev => [...prev, newImage])
      
      // 마크다운은 추가하지 않고 이미지 미리보기만 표시
      
      toast.success('이미지가 업로드되었습니다!')
    } catch (error) {
      console.error('이미지 업로드 실패:', error)
      toast.error('이미지 업로드에 실패했습니다.')
    }
  }

  // 질문 로딩 함수
  const loadQuestions = useCallback(async () => {
    console.log('loadQuestions 호출됨 - 실제 API 호출')
    
    try {
      const response = await fetch('/api/questions', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || ''}`
        }
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: 질문을 불러오는데 실패했습니다`)
      }
      
      const data = await response.json()
      console.log('질문 데이터 로딩 성공:', data.questions?.length || 0, '개')
      setQuestions(data.questions || [])
      console.log('🔥 Q&A 페이지 - 질문 데이터 설정 완료, 로딩 해제')
      setLoading(false)
    } catch (error) {
      console.error('질문 로딩 오류:', error)
      setQuestions([])
      console.log('🔥 Q&A 페이지 - 오류 발생, 로딩 해제')
      setLoading(false)
    }
  }, [token])

  // 답변 로딩 함수
  const loadAnswers = useCallback(async (questionId: string) => {
    console.log('loadAnswers 호출됨 - 실제 API 호출:', questionId)
    setAnswersLoading(true)
    
    try {
      const response = await fetch(`/api/questions/${questionId}/answers`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || ''}`
        }
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: 답변을 불러오는데 실패했습니다`)
      }
      
      const data = await response.json()
      console.log('답변 데이터 로딩 성공:', data.answers?.length || 0, '개')
      setAnswers(data.answers || [])
    } catch (error) {
      console.error('답변 로딩 오류:', error)
      setAnswers([])
    } finally {
      setAnswersLoading(false)
    }
  }, [token])

  // 질문 작성 처리
  const handleSubmitQuestion = async () => {
    if (!questionForm.title.trim() || !questionForm.content.trim()) {
      toast.error('제목과 내용을 모두 입력해주세요.')
      return
    }

    try {
      // 토큰 확인 및 가져오기
      let currentToken = token
      
      if (!currentToken) {
        // localStorage에서 토큰 가져오기 시도
        const storedToken = localStorage.getItem('amiko_session')
        if (storedToken) {
          try {
            const parsedToken = JSON.parse(storedToken)
            currentToken = parsedToken.access_token
          } catch (e) {
            console.error('토큰 파싱 오류:', e)
          }
        }
      }

      if (!currentToken) {
        toast.error('로그인이 필요합니다.')
        return
      }

      console.log('질문 작성 시도:', { title: questionForm.title, category: questionForm.category, token: !!currentToken })

      // 질문 생성 API 호출
      const response = await fetch('/api/questions', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentToken}`
        },
        body: JSON.stringify({
          title: questionForm.title,
          content: questionForm.content,
          category: questionForm.category,
          tags: questionForm.tags,
          images: questionUploadedImages
        })
      })

      console.log('API 응답 상태:', response.status)

      const data = await response.json()
      console.log('API 응답 데이터:', data)
      
      if (!response.ok) {
        console.error('API 오류 응답:', data)
        throw new Error(data.error || '질문 작성에 실패했습니다.')
      }

      // 성공 시 폼 초기화 및 질문 목록 새로고침
      setQuestionForm({ title: '', content: '', category: 'free', tags: '' })
      setQuestionUploadedImages([])
      setShowQuestionModal(false)
      await loadQuestions()
      
      toast.success('질문이 성공적으로 작성되었습니다!')
    } catch (err) {
      console.error('질문 작성 실패:', err)
      toast.error(err instanceof Error ? err.message : '질문 작성에 실패했습니다.')
    }
  }

  // 답변 작성 함수
  const handleAnswerSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !selectedQuestion) return
    
    setLoading(true)
    
    try {
      // 토큰 확인 및 가져오기
      let currentToken = token
      
      if (!currentToken) {
        // localStorage에서 토큰 가져오기 시도
        const storedToken = localStorage.getItem('amiko_session')
        if (storedToken) {
          try {
            const parsedToken = JSON.parse(storedToken)
            currentToken = parsedToken.access_token
          } catch (e) {
            console.error('토큰 파싱 오류:', e)
          }
        }
      }

      if (!currentToken) {
        toast.error('로그인이 필요합니다.')
        return
      }

      const response = await fetch(`/api/questions/${selectedQuestion.id}/answers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentToken}`
        },
        body: JSON.stringify({
          content: answerForm.content
        })
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || '답변 작성에 실패했습니다.')
      }

      // 성공 시 폼 초기화 및 답변 목록 새로고침
      setAnswerForm({ content: '' })
      await loadAnswers(selectedQuestion.id)
      
      toast.success('답변이 성공적으로 작성되었습니다!')
    } catch (err) {
      console.error('답변 작성 실패:', err)
      toast.error(err instanceof Error ? err.message : '답변 작성에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  // 질문 클릭 시 답변 로딩
  const handleQuestionClick = async (question: any) => {
    setSelectedQuestion(question)
    setShowAnswerDrawer(true)
    await loadAnswers(question.id)
  }

  // 필터링된 질문 목록
  const filteredQuestions = questions.filter(question => {
    const matchesCategory = activeCategory === 'all' || question.category === activeCategory
    const matchesSearch = question.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         question.content.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesCategory && matchesSearch
  })

  // 초기 데이터 로딩
  useEffect(() => {
    console.log('초기 데이터 로딩 useEffect:', { user: !!user, token: !!token })
    if (user || token) {
      console.log('초기 데이터 로딩 시작')
      loadQuestions()
    }
  }, [user, token, loadQuestions])

  return (
    <div className="min-h-screen bg-white">
      {/* 기존 Header 컴포넌트 사용 */}
      <Header />
      
      {/* 페이지별 헤더 */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft className="w-4 h-4" />
              {t('buttons.back')}
            </Button>
            <h1 className="text-xl font-bold text-white">Q&A</h1>
          </div>
          
          <Button
            onClick={() => setShowQuestionModal(true)}
            className="bg-purple-500 hover:bg-purple-600 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            {t('community.askQuestion')}
          </Button>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="max-w-6xl mx-auto px-2 pt-2 md:pt-20 pb-4">
        {/* 페이지 제목 */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <h1 className="text-lg font-bold text-gray-800">Q&A</h1>
            
            {/* 이전 버튼 - 제목 오른쪽으로 이동 */}
            <Button 
              onClick={() => router.push('/main?tab=community')}
              variant="outline"
              size="sm"
              className="border-2 border-gray-400 hover:border-gray-500 text-gray-700 hover:text-gray-900 bg-white shadow-sm hover:shadow-md px-2 py-1 flex items-center gap-1 text-xs"
            >
              <ArrowLeft className="w-3 h-3" />
              {t('buttons.back')}
            </Button>
          </div>
          <p className="text-sm text-gray-600">{t('community.qaDescription')}</p>
        </div>

        {/* 상단 컨트롤 */}
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="relative flex-1">
            <MessageSquare className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-600 flex-shrink-0" />
            <Input
              placeholder={t('community.qaSearchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="!pl-16 w-full bg-gray-50 focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 placeholder:text-gray-600 border border-gray-400 text-sm h-8"
            />
          </div>
          
          {/* 질문하기 버튼 - 오른쪽 끝 */}
          <Button 
            onClick={() => setShowQuestionModal(true)}
            className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-1 text-sm h-8"
          >
            <Plus className="w-3 h-3 mr-1" />
            {t('community.askQuestion')}
          </Button>
        </div>

        {/* 질문 목록 */}
        <div className="mt-2">
          {/* 질문 카드 리스트 */}
          <div className="space-y-1">
            {loading ? (
              // 로딩 중일 때 스켈레톤 표시
              <>
                {/* 데스크톱 스켈레톤 */}
                <div className="hidden md:block space-y-1">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="p-2 shadow-md">
                      <div className="flex items-start gap-2">
                        <div className="flex flex-col items-center gap-1 min-w-[50px]">
                          <Skeleton className="h-6 w-6 rounded" />
                          <Skeleton className="h-4 w-6" />
                        </div>
                        <div className="flex-1 space-y-1">
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-3 w-full" />
                          <Skeleton className="h-3 w-2/3" />
                          <div className="flex items-center gap-3">
                            <Skeleton className="h-3 w-12" />
                            <Skeleton className="h-3 w-10" />
                            <Skeleton className="h-3 w-12" />
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
                
                {/* 모바일 스켈레톤 */}
                <div className="md:hidden space-y-1">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="p-2 shadow-md">
                      <div className="space-y-1">
                        <Skeleton className="h-4 w-full" />
                        <div className="flex items-center justify-between">
                          <Skeleton className="h-3 w-20" />
                          <div className="flex items-center gap-2">
                            <Skeleton className="h-3 w-12" />
                            <Skeleton className="h-3 w-12" />
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </>
            ) : filteredQuestions.length === 0 ? (
              <Card className="p-4 text-center shadow-md">
                <div className="text-gray-400 text-4xl mb-2">❓</div>
                <h3 className="text-base font-semibold text-gray-800 mb-1">아직 질문이 없습니다</h3>
                <p className="text-sm text-gray-600">첫 번째 질문을 작성해보세요!</p>
              </Card>
            ) : (
              filteredQuestions.map((question, index) => (
                <div key={question.id}>
                  {/* 데스크톱: 카드 스타일 */}
                  <Card 
                    className="hidden md:block p-2 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white border border-gray-200 shadow-md hover:bg-purple-50/30 cursor-pointer !opacity-100 !transform-none"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleQuestionClick(question)
                    }}
                  >
                    <div className="flex items-start gap-2">
                      {/* 업보트 영역 */}
                      <div className="flex flex-col items-center gap-1 min-w-[50px]">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 hover:bg-purple-50"
                          onClick={(e) => {
                            e.stopPropagation()
                            // handleUpvote(question.id)
                          }}
                        >
                          <ThumbsUp className="w-3 h-3 text-purple-500 flex-shrink-0" />
                        </Button>
                        <span className="text-sm font-semibold text-purple-600">{question.like_count || 0}</span>
                      </div>
                      
                      {/* 질문 내용 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm font-semibold text-gray-800 truncate">{question.title}</h3>
                        </div>
                        
                        {/* 질문 내용과 이미지는 상세보기에서만 표시 */}
                        
                        <div className="flex items-center justify-between text-xs text-gray-800">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              <span>{question.author?.full_name || '익명'}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>{new Date(question.created_at).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MessageSquare className="w-3 h-3" />
                              <span>{question.comment_count || 0} {t('community.qaAnswers')}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Eye className="w-3 h-3" />
                              <span>{question.view_count || 0} {t('community.qaViews')}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>

                  {/* 모바일: 간단한 스타일 */}
                  <Card 
                    className="md:hidden p-2 hover:shadow-xl transition-all duration-300 cursor-pointer bg-white border border-gray-200 shadow-md"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleQuestionClick(question)
                    }}
                  >
                    <div className="space-y-1">
                      <h3 className="text-sm font-semibold text-gray-800 line-clamp-2">{question.title}</h3>
                      <div className="flex items-center justify-between text-xs text-gray-800">
                        <span>{question.author?.full_name || '익명'}</span>
                        <div className="flex items-center gap-2">
                          <span>{question.comment_count || 0} {t('community.qaAnswers')}</span>
                          <span>{question.view_count || 0} {t('community.qaViews')}</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 질문 작성 모달 */}
      <Dialog open={showQuestionModal} onOpenChange={setShowQuestionModal}>
        <DialogContent className="max-w-2xl bg-white border-2 border-gray-200 shadow-xl">
          <DialogHeader className="pb-4 border-b border-gray-200">
            <DialogTitle className="text-xl font-semibold text-gray-900">새 질문 작성</DialogTitle>
            <DialogDescription className="sr-only">새로운 질문을 작성하는 모달입니다.</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-800 mb-2 block">제목</label>
              <Input
                placeholder="질문 제목을 입력하세요"
                value={questionForm.title}
                onChange={(e) => setQuestionForm({ ...questionForm, title: e.target.value })}
                className="border-2 border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-800 mb-2 block">카테고리</label>
              <select
                value={questionForm.category}
                onChange={(e) => setQuestionForm({ ...questionForm, category: e.target.value })}
                className="w-full p-3 border-2 border-gray-300 rounded-md focus:border-purple-500 focus:ring-2 focus:ring-purple-200 bg-white"
              >
                <option value="free">자유</option>
                <option value="kpop">K-POP</option>
                <option value="kdrama">K-Drama</option>
                <option value="beauty">뷰티</option>
                <option value="korean">한국어</option>
                <option value="spanish">스페인어</option>
              </select>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-800">내용</label>
                <div className="flex gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        insertImageToContent(file)
                      }
                    }}
                    className="hidden"
                    id="questionImageUpload"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('questionImageUpload')?.click()}
                    className="text-xs"
                  >
                    📷 이미지 삽입
                  </Button>
                </div>
              </div>
              <Textarea
                placeholder="질문 내용을 자세히 입력하세요. 이미지를 삽입하려면 위의 '이미지 삽입' 버튼을 클릭하세요."
                value={questionForm.content}
                onChange={(e) => setQuestionForm({ ...questionForm, content: e.target.value })}
                rows={6}
                className="border-2 border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 resize-none"
              />
              
              {/* 업로드된 이미지 미리보기 */}
              {questionUploadedImages.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm text-gray-800 mb-2">업로드된 이미지:</p>
                  <div className="flex flex-wrap gap-2">
                    {questionUploadedImages.map((image, index) => (
                      <div key={index} className="relative">
                        <img 
                          src={image.url} 
                          alt={image.name}
                          className="w-20 h-20 object-cover rounded border"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setQuestionUploadedImages(prev => prev.filter((_, i) => i !== index))
                          }}
                          className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setShowQuestionModal(false)}>
                취소
              </Button>
              <Button onClick={handleSubmitQuestion} className="bg-purple-500 hover:bg-purple-600">
                질문 작성
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 답변 드로어 */}
      <Drawer open={showAnswerDrawer} onOpenChange={setShowAnswerDrawer}>
        <DrawerContent className="max-h-[80vh] bg-white">
          <DrawerHeader className="border-b border-gray-200">
            <DrawerTitle className="text-lg font-semibold text-gray-900">{selectedQuestion?.title}</DrawerTitle>
          </DrawerHeader>
          
          <div className="p-4 space-y-4 overflow-y-auto">
            {/* 질문 내용 */}
            <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-purple-200">
              <p className="text-gray-700">{selectedQuestion?.content}</p>
              
              {/* 질문 이미지 표시 */}
              {selectedQuestion?.images && selectedQuestion.images.length > 0 && (
                <div className="mt-4">
                  <div className="flex gap-3 overflow-x-auto">
                    {selectedQuestion.images.map((image: any, index: number) => (
                      <img 
                        key={index}
                        src={image.url} 
                        alt={image.name || `이미지 ${index + 1}`}
                        className="w-32 h-32 object-cover rounded border flex-shrink-0"
                      />
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex items-center gap-4 mt-3 text-sm text-gray-800">
                <span>{selectedQuestion?.author?.full_name || '익명'}</span>
                <span>{new Date(selectedQuestion?.created_at).toLocaleDateString()}</span>
                <div className="flex items-center gap-1">
                  <ThumbsUp className="w-4 h-4" />
                  <span>{selectedQuestion?.like_count || 0}</span>
                </div>
              </div>
            </div>
            
            {/* 답변 목록 */}
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-800">{t('community.qaAnswers')} ({answers.length})</h4>
              {answersLoading ? (
                // 답변 로딩 중일 때 스켈레톤 표시
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="border-l-4 border-gray-200 pl-4 py-3 bg-gray-50 rounded-r-lg">
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                        <div className="flex items-center gap-4 mt-3">
                          <Skeleton className="h-3 w-16" />
                          <Skeleton className="h-3 w-12" />
                          <Skeleton className="h-3 w-12" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : answers.length === 0 ? (
                <div className="text-center py-8 text-gray-600">
                  <MessageSquare className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                  <p>{t('community.qaNoAnswers')}</p>
                  <p className="text-sm">{t('community.qaFirstAnswer')}</p>
                </div>
              ) : (
                answers.map((answer) => (
                  <div key={answer.id} className="border-l-4 border-purple-200 pl-4 py-3 bg-white rounded-r-lg">
                    <p className="text-gray-800 mb-2">{answer.content}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-800">
                      <span>{answer.author?.full_name || '익명'}</span>
                      <span>{new Date(answer.created_at).toLocaleDateString()}</span>
                      <div className="flex items-center gap-1">
                        <ThumbsUp className="w-4 h-4" />
                        <span>{answer.like_count || 0}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            {/* 답변 작성 폼 */}
            <form onSubmit={handleAnswerSubmit} className="space-y-3 pt-4 border-t border-gray-200">
              <div>
                <label className="text-sm font-medium text-gray-800 mb-2 block">{t('community.qaWriteAnswer')}</label>
                <Textarea
                  placeholder={t('community.qaAnswerPlaceholder')}
                  value={answerForm.content}
                  onChange={(e) => setAnswerForm({ content: e.target.value })}
                  rows={3}
                  className="border-2 border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                />
              </div>
              <div className="flex gap-3 justify-end">
                <Button type="button" variant="outline" onClick={() => setShowAnswerDrawer(false)}>
                  {t('community.close')}
                </Button>
                <Button type="submit" disabled={loading} className="bg-purple-500 hover:bg-purple-600">
                  {loading ? t('community.qaWriting') : t('community.qaWriteAnswer')}
                </Button>
              </div>
            </form>
          </div>
        </DrawerContent>
      </Drawer>
      
      {/* 모바일 하단 네비게이션 - 커뮤니티 페이지에서는 숨김 */}
      {/* <BottomTabNavigation /> */}
    </div>
  )
}
