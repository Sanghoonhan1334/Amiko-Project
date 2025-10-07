'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Heart, MessageSquare, Plus, User, Clock, Image as ImageIcon, Camera, Loader2, X } from 'lucide-react'
import Header from '@/components/layout/Header'
import { useLanguage } from '@/context/LanguageContext'
import { useAuth } from '@/context/AuthContext'
import { toast } from 'sonner'

interface Story {
  id: string
  image_url: string
  text: string
  created_at: string
  likes: number
  comments?: any[]
  user?: {
    full_name: string
    profile_image_url?: string
  }
}

export default function StoriesPage() {
  const router = useRouter()
  const { t } = useLanguage()
  const { user } = useAuth()
  const [stories, setStories] = useState<Story[]>([])
  const [storiesLoading, setStoriesLoading] = useState(true)
  const [showHeartAnimation, setShowHeartAnimation] = useState<string | null>(null)
  const [likedStories, setLikedStories] = useState<Set<string>>(new Set())
  const [selectedStory, setSelectedStory] = useState<Story | null>(null)
  const [showCommentModal, setShowCommentModal] = useState(false)

  // 스토리 업로드 모달 관련 상태
  const [showStoryUploadModal, setShowStoryUploadModal] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [storyText, setStoryText] = useState('')
  const [isUploading, setIsUploading] = useState(false)

  // 화면 크기 감지
  const [isMobile, setIsMobile] = useState(false)
  
  // 플로팅 버튼 상태
  const [isFabExpanded, setIsFabExpanded] = useState(false)

  const isAdmin = user?.role === 'admin'

  // 화면 크기 체크
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  // 스토리 로드 함수
  const loadStories = async () => {
    try {
      setStoriesLoading(true)
      const response = await fetch('/api/stories')
      if (response.ok) {
        const data = await response.json()
        const convertedStories = data.stories.map((story: any) => ({
          ...story,
          user: {
            full_name: story.user_name || '익명',
            profile_image_url: story.user_profile_image
          }
        }))
        setStories(convertedStories)
      }
    } catch (error) {
      console.error('스토리 로드 오류:', error)
    } finally {
      setStoriesLoading(false)
    }
  }

  useEffect(() => {
    loadStories()
  }, [])

  // 시간 포맷 함수
  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return '방금 전'
    if (diffInMinutes < 60) return `${diffInMinutes}분 전`
    
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours}시간 전`
    
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays}일 전`
    
    return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
  }

  // 스토리 좋아요 토글
  const toggleStoryLike = async (storyId: string) => {
    if (!user) {
      toast.error('로그인이 필요합니다.')
      return
    }

    try {
      const response = await fetch(`/api/stories/${storyId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('amiko_token')}`
        }
      })

      if (response.ok) {
        const isLiked = likedStories.has(storyId)
        setLikedStories(prev => {
          const newSet = new Set(prev)
          if (isLiked) {
            newSet.delete(storyId)
          } else {
            newSet.add(storyId)
            setShowHeartAnimation(storyId)
            setTimeout(() => setShowHeartAnimation(null), 1000)
          }
          return newSet
        })
        
        // 스토리 목록 업데이트
        setStories(prev => prev.map(story => 
          story.id === storyId 
            ? { ...story, likes: story.likes + (isLiked ? -1 : 1) }
            : story
        ))
      }
    } catch (error) {
      console.error('좋아요 토글 오류:', error)
    }
  }

  // 댓글 모달 열기
  const openCommentModal = (story: Story) => {
    setSelectedStory(story)
    setShowCommentModal(true)
  }

  // 파일 선택 처리
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    console.log('파일 선택 이벤트 발생:', { file: !!file, fileName: file?.name, fileSize: file?.size, fileType: file?.type })
    
    if (file) {
      console.log('파일 선택됨:', file.name, file.size, file.type)
      
      // 파일 크기 체크 (10MB 제한)
      const maxSize = 10 * 1024 * 1024 // 10MB
      if (file.size > maxSize) {
        toast.error('파일 크기는 10MB 이하여야 합니다.')
        return
      }
      
      // 이미지 파일 타입 체크
      if (!file.type.startsWith('image/')) {
        toast.error('이미지 파일만 업로드 가능합니다.')
        return
      }
      
      setSelectedFile(file)
      
      // 이미지 미리보기 생성
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setImagePreview(result)
        console.log('이미지 미리보기 생성됨')
      }
      reader.readAsDataURL(file)
    }
  }

  // 이미지 초기화
  const clearImage = () => {
    setImagePreview(null)
    setSelectedFile(null)
  }

  // 스토리 업로드 함수
  const handleStoryUpload = async () => {
    console.log('스토리 업로드 시작')
    console.log('사용자 상태:', { user: !!user, userId: user?.id })
    console.log('선택된 파일:', { selectedFile: !!selectedFile, fileName: selectedFile?.name })
    console.log('스토리 텍스트:', { text: storyText, length: storyText.length })
    
    if (!user) {
      toast.error('로그인이 필요합니다.')
      return
    }
    
    if (!selectedFile) {
      toast.error('이미지를 선택해주세요.')
      return
    }
    
    setIsUploading(true)
    
    try {
      const formData = new FormData()
      formData.append('image', selectedFile)
      formData.append('text', storyText)
      
      const token = localStorage.getItem('amiko_token')
      if (!token) {
        throw new Error('인증 토큰이 없습니다.')
      }
      
      console.log('업로드 요청 전송:', { 
        hasImage: !!selectedFile, 
        textLength: storyText.length,
        hasToken: !!token 
      })
      
      const response = await fetch('/api/stories', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })
      
      console.log('업로드 응답:', { 
        status: response.status, 
        statusText: response.statusText,
        ok: response.ok 
      })
      
      if (response.ok) {
        toast.success('스토리가 업로드되었습니다!')
        setShowStoryUploadModal(false)
        setStoryText('')
        clearImage()
        // 스토리 목록 새로고침
        loadStories()
      } else {
        const errorData = await response.json()
        console.error('스토리 업로드 실패:', { status: response.status, error: errorData })
        
        // 인증 오류인 경우 에러 메시지만 표시
        if (response.status === 401) {
          toast.error('로그인이 필요합니다.')
        } else {
          toast.error(errorData.error || '스토리 업로드에 실패했습니다.')
        }
      }
    } catch (error) {
      console.error('스토리 업로드 오류:', error)
      toast.error('스토리 업로드 중 오류가 발생했습니다.')
    } finally {
      setIsUploading(false)
    }
  }


  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-200 px-4 py-6 pt-20 md:pt-40">
        <div className="max-w-6xl mx-auto">
          {/* 첫 번째 줄: 스토리 제목과 이전 버튼 */}
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold text-gray-800">스토리</h1>
            <div className="flex items-center gap-2">
              {/* 이전 버튼 */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/main')}
                className="flex items-center gap-2 text-gray-700 hover:text-gray-900 border-2 border-gray-400 hover:border-gray-500 bg-white shadow-sm hover:shadow-md px-3 py-2"
              >
                <ArrowLeft className="w-4 h-4" />
                {t('buttons.back')}
              </Button>
            </div>
          </div>
          
          {/* 두 번째 줄: 설명과 스토리 올리기 버튼 */}
          <div className="flex items-center justify-between">
            <p className="text-base text-gray-500">일상을 공유하고 소통해보세요</p>
            
            <Button 
              size="lg"
              className="hidden md:flex bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-8 py-4 text-lg rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-110"
              onClick={() => {
                if (!user) {
                  toast.error('로그인이 필요합니다.')
                  router.push('/sign-in')
                  return
                }
                setShowStoryUploadModal(true)
              }}
            >
              <Plus className="w-6 h-6 mr-3" />
              스토리 올리기
            </Button>
          </div>
        </div>
      </div>

      {/* 스토리 컨텐츠 */}
      <div className="max-w-6xl mx-auto px-2 py-4 md:pt-12">
        {storiesLoading ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2">
            {[...Array(16)].map((_, index) => (
              <div key={index} className="relative overflow-hidden rounded-xl bg-gray-200 animate-pulse" style={{ aspectRatio: '9/16' }}>
                <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-gray-300 to-transparent">
                  <div className="absolute top-1 left-1 flex items-center gap-0.5">
                    <div className="w-3 h-3 rounded-full bg-gray-300"></div>
                    <div className="w-8 h-2 bg-gray-300 rounded"></div>
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-gray-300 to-transparent">
                  <div className="absolute bottom-0.5 left-1 right-1 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className="w-4 h-2 bg-gray-300 rounded"></div>
                      <div className="w-4 h-2 bg-gray-300 rounded"></div>
                    </div>
                    <div className="w-6 h-1.5 bg-gray-300 rounded"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : stories.length > 0 ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2">
            {stories.map((story) => (
              <div key={story.id} className="relative overflow-hidden rounded-xl hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group cursor-pointer" style={{ aspectRatio: '9/16' }}>
                  {story.image_url ? (
                    <img 
                      src={story.image_url} 
                      alt="스토리 이미지" 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 flex items-center justify-center">
                      <ImageIcon className="w-12 h-12 text-white opacity-50" />
                    </div>
                  )}
                  
                  {/* 좋아요 하트 애니메이션 */}
                  {showHeartAnimation === story.id && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <svg
                        className="w-16 h-16 text-red-500 fill-current animate-pulse"
                        viewBox="0 0 24 24"
                      >
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                      </svg>
                    </div>
                  )}
                  
                  {/* 상단 그라데이션 오버레이 */}
                  <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-black/30 to-transparent">
                    {/* 프로필 정보 */}
                    <div className="absolute top-1 left-1 flex items-center gap-0.5">
                      <div className="w-3 h-3 rounded-full overflow-hidden bg-white p-0.5">
                        <div className="w-full h-full rounded-full overflow-hidden bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                          {story.user?.profile_image_url ? (
                            <img 
                              src={story.user.profile_image_url} 
                              alt="프로필" 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-white font-bold text-[8px]">
                              {story.user?.full_name?.charAt(0) || 'U'}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="bg-black/20 backdrop-blur-sm rounded px-1 py-0.5">
                        <p className="text-white font-semibold text-[8px]">
                          {story.user?.full_name || '익명'}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* 하단 그라데이션 오버레이 */}
                  <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-black/50 to-transparent">
                    {/* 스토리 텍스트 */}
                    {story.text && (
                      <div className="absolute bottom-6 left-1 right-1">
                        <p className="text-white text-[8px] leading-tight font-medium drop-shadow-lg line-clamp-2">
                          {story.text}
                        </p>
                      </div>
                    )}
                    
                    {/* 하단 액션 버튼들 - 인스타그램 스타일 */}
                    <div className="absolute bottom-0.5 left-1 right-1 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-white">
                        <button 
                          className="flex items-center gap-0.5 hover:scale-110 transition-transform"
                          onClick={() => toggleStoryLike(story.id)}
                        >
                          <Heart className="w-2.5 h-2.5" />
                          <span className="text-[8px]">{story.likes}</span>
                        </button>
                        <button 
                          className="flex items-center gap-0.5 hover:scale-110 transition-transform"
                          onClick={() => openCommentModal(story)}
                        >
                          <MessageSquare className="w-2.5 h-2.5" />
                          <span className="text-[8px]">{story.comments?.length || 0}</span>
                        </button>
                      </div>
                      
                      {/* 시간 정보 */}
                      <span className="text-white/90 text-[7px] flex items-center gap-0.5">
                        <Clock className="w-1.5 h-1.5" />
                        {formatTime(story.created_at)}
                      </span>
                    </div>
                  </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <ImageIcon className="w-10 h-10 text-purple-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-3">아직 스토리가 없습니다</h3>
            <p className="text-gray-600 max-w-md mx-auto">첫 번째 스토리를 올리고<br />다른 사람들과 일상을 공유해보세요!</p>
          </div>
        )}
      </div>

      {/* 스토리 업로드 모달 */}
      <Dialog open={showStoryUploadModal} onOpenChange={(open) => {
        setShowStoryUploadModal(open)
        if (!open) {
          clearImage()
          setStoryText('')
        }
      }}>
        <DialogContent className="max-w-md w-full mx-4 bg-white border-2 border-gray-200 shadow-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-4 border-b border-gray-200">
            <DialogTitle className="text-xl font-semibold text-gray-900">새 스토리 작성</DialogTitle>
            <DialogDescription className="sr-only">새로운 스토리를 작성하는 모달입니다.</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">
                사진 업로드
              </Label>
              
              {/* 이미지 미리보기 */}
              {imagePreview && (
                <div className="mb-3 relative">
                  <img 
                    src={imagePreview} 
                    alt="미리보기" 
                    className="w-full h-48 object-cover rounded-lg border-2 border-gray-200"
                  />
                  <button
                    onClick={clearImage}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              
              {/* 파일 선택 버튼들 */}
              <div className="space-y-2">
                {/* 갤러리에서 선택 */}
                <div className="flex gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="imageUploadGallery"
                    multiple={false}
                    capture={undefined}
                  />
                  <label
                    htmlFor="imageUploadGallery"
                    className="flex-1 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-purple-500 hover:bg-purple-50 transition-colors text-center touch-manipulation"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <ImageIcon className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400 flex-shrink-0" />
                      <span className="text-sm text-gray-600">
                        {imagePreview ? '다른 사진 선택' : '📱 갤러리에서 선택'}
                      </span>
                    </div>
                  </label>
                </div>
                
                {/* 카메라로 촬영 */}
                <div className="flex gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="imageUploadCamera"
                    capture="environment"
                    multiple={false}
                  />
                  <label
                    htmlFor="imageUploadCamera"
                    className="flex-1 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-purple-500 hover:bg-purple-50 transition-colors text-center touch-manipulation"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Camera className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400 flex-shrink-0" />
                      <span className="text-sm text-gray-600">
                        📷 카메라로 촬영
                      </span>
                    </div>
                  </label>
                </div>
              </div>
            </div>
            
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">
                스토리 내용
              </Label>
              <Textarea
                placeholder="오늘의 이야기를 공유해보세요..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                rows={4}
                value={storyText}
                onChange={(e) => setStoryText(e.target.value)}
              />
            </div>
            
            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowStoryUploadModal(false)}
                className="flex-1"
              >
                취소
              </Button>
              <Button
                onClick={handleStoryUpload}
                disabled={isUploading || !selectedFile}
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:bg-gray-400 text-white"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    업로드 중...
                  </>
                ) : (
                  '업로드'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 모바일 플로팅 버튼 */}
      {isMobile && (
        <div className="fixed bottom-24 right-4 z-50">
          <div className="flex items-center">
            {/* 스토리작성 텍스트 - 원에서 확장되는 효과 */}
            <div className={`transition-all duration-300 ease-in-out ${
              isFabExpanded ? 'opacity-100 translate-x-0 scale-100' : 'opacity-0 translate-x-4 scale-95'
            }`}>
              <button
                onClick={() => {
                  if (!user) {
                    toast.error('로그인이 필요합니다.')
                    router.push('/sign-in')
                    return
                  }
                  setShowStoryUploadModal(true)
                }}
                className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white px-4 py-2 rounded-full text-sm font-medium mr-1 shadow-lg border-2 border-white transition-all duration-200 hover:scale-105 active:scale-95"
              >
                스토리작성
              </button>
            </div>
            
            {/* 메인 버튼 */}
            <Button
              onClick={() => {
                if (isFabExpanded) {
                  // X 버튼을 눌렀을 때 - 확장 상태 닫기
                  setIsFabExpanded(false)
                } else {
                  // + 버튼을 눌렀을 때 - 확장
                  setIsFabExpanded(true)
                }
              }}
              className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white shadow-2xl hover:shadow-3xl transition-all duration-300 flex items-center justify-center border-2 border-white hover:scale-110 active:scale-95"
            >
              {isFabExpanded ? (
                <X className="w-5 h-5 drop-shadow-sm font-bold" strokeWidth={3} />
              ) : (
                <Plus className="w-5 h-5 drop-shadow-sm font-bold" strokeWidth={3} />
              )}
            </Button>
          </div>
        </div>
      )}

    </div>
  )
}
