'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { 
  ChevronDown, 
  ChevronUp, 
  Plus, 
  Image as ImageIcon,
  Clock,
  Eye,
  EyeOff,
  User,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Heart,
  MessageSquare,
  Send
} from 'lucide-react'
import { Story, StoryForm } from '@/types/story'
import UserProfileModal from '@/components/common/UserProfileModal'

// 댓글 타입 정의
interface Comment {
  id: string
  storyId: string
  author: string
  authorId?: string
  content: string
  createdAt: Date
  likes: number
}
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'

// 목업 스토리 데이터 (24시간 이내, 공개된 것만)
// 실제 스토리 데이터 (사용자 이름으로 2개만)
const getMockStories = (userName: string = '한상훈'): Story[] => [
  {
    id: '1',
    userId: 'current-user',
    userName: userName,
    userAvatar: '/amiko-foto.png',
    imageUrl: '/hanok-bg.png',
    text: '오늘 한국 전통 한복을 입어봤어요! 너무 예뻐서 기분이 좋았습니다 💕',
    isPublic: true,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2시간 전
    expiresAt: new Date(Date.now() + 22 * 60 * 60 * 1000), // 22시간 후 만료
    isExpired: false
  },
  {
    id: '2',
    userId: 'current-user',
    userName: userName,
    userAvatar: '/amiko-foto.png',
    imageUrl: '/zep.jpg',
    text: '한국 화장품으로 메이크업 연습 중이에요. 어떤가요? 😊',
    isPublic: true,
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4시간 전
    expiresAt: new Date(Date.now() + 20 * 60 * 60 * 1000), // 20시간 후 만료
    isExpired: false
  }
]

export default function StoryCarousel() {
  const { user } = useAuth()
  const { t } = useLanguage()
  
  // 사용자 이름 가져오기
  const userName = user?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || '한상훈'
  const mockStories = getMockStories(userName)
  
  // 상태 관리
  const [viewMode, setViewMode] = useState<'collapsed' | 'expanded' | 'compact'>('collapsed')
  const [stories, setStories] = useState<Story[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  
         // 스토리 업로드 관련 상태
       const [showUploadModal, setShowUploadModal] = useState(false)
       const [storyForm, setStoryForm] = useState<StoryForm>({
         imageUrl: '',
         text: '',
         isPublic: true
       })
         const [isUploading, setIsUploading] = useState(false)
         const [imagePreview, setImagePreview] = useState<string | null>(null)
         const [imageFile, setImageFile] = useState<File | null>(null)
  
  // 좋아요 상태 관리
  const [likedStories, setLikedStories] = useState<Set<string>>(new Set())
  
  // 댓글 관련 상태
  const [showCommentModal, setShowCommentModal] = useState<string | null>(null)
  const [commentText, setCommentText] = useState('')
  const [storyComments, setStoryComments] = useState<Record<string, Comment[]>>({})
  
  // 프로필 모달 상태
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)

  // refs
  const containerRef = useRef<HTMLDivElement>(null)
  const loadMoreRef = useRef<HTMLDivElement>(null)

  // 초기 데이터 로드 (1개만)
  useEffect(() => {
    loadInitialStories()
  }, [])

  // 탭 변경 감지 (다른 영역으로 이동 시 자동 축소)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        resetToCollapsed()
      }
    }

    const handlePageHide = () => {
      resetToCollapsed()
    }

    const handleBeforeUnload = () => {
      resetToCollapsed()
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('pagehide', handlePageHide)
    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('pagehide', handlePageHide)
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [])

  // 추가 스토리 로드
  const loadMoreStories = useCallback(async () => {
    if (isLoadingMore || !hasMore) return

    setIsLoadingMore(true)
    try {
      // 실제로는 API 호출: cursor 기반으로 다음 페이지
      await new Promise(resolve => setTimeout(resolve, 500)) // 로딩 시뮬레이션
      
      const currentCount = stories.length
      const nextStories = mockStories.slice(currentCount, currentCount + 3)
      
      if (nextStories.length > 0) {
        setStories(prev => [...prev, ...nextStories])
        setHasMore(currentCount + nextStories.length < mockStories.length)
      } else {
        setHasMore(false)
      }
    } catch (error) {
      console.error('추가 스토리 로드 실패:', error)
    } finally {
      setIsLoadingMore(false)
    }
  }, [isLoadingMore, hasMore, stories.length])

  // 무한 스크롤 감지 (가로 스크롤)
  useEffect(() => {
    if (viewMode === 'expanded' && hasMore && !isLoadingMore) {
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            loadMoreStories()
          }
        },
        { threshold: 0.1 }
      )

      if (loadMoreRef.current) {
        observer.observe(loadMoreRef.current)
      }

      return () => observer.disconnect()
    }
  }, [viewMode, hasMore, isLoadingMore, loadMoreStories])

  // 초기 스토리 로드 (모든 스토리)
  const loadInitialStories = async () => {
    setIsLoading(true)
    try {
      // 실제로는 API 호출: 모든 스토리 로드
      setStories(mockStories)
      setHasMore(false) // 모든 스토리를 로드했으므로 더 이상 없음
    } catch (error) {
      console.error('초기 스토리 로드 실패:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // 뷰 모드 토글
  const toggleViewMode = async () => {
    if (viewMode === 'collapsed') {
      // collapsed → expanded: 모든 스토리 표시
      setViewMode('expanded')
    } else {
      // expanded → collapsed: 모든 스토리 유지
      resetToCollapsed()
    }
  }

  // collapsed 상태로 리셋
  const resetToCollapsed = () => {
    setViewMode('collapsed')
    setCurrentIndex(0)
    setStories(mockStories) // 모든 스토리 유지
    setHasMore(false) // 모든 스토리를 로드했으므로 더 이상 없음
    
    // 스크롤 위치도 초기화
    if (containerRef.current) {
      containerRef.current.scrollTo({ left: 0, behavior: 'smooth' })
    }
  }

  // 좌우 네비게이션
  const navigateToNext = () => {
    if (currentIndex < stories.length - 1) {
      const nextIndex = currentIndex + 1
      setCurrentIndex(nextIndex)
      scrollToIndex(nextIndex)
    }
  }

  const navigateToPrev = () => {
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1
      setCurrentIndex(prevIndex)
      scrollToIndex(prevIndex)
    }
  }

  // 특정 인덱스로 스크롤
  const scrollToIndex = (index: number) => {
    if (containerRef.current) {
      const cardWidth = 340 // min-w-[340px]
      const gap = 16 // gap-4
      const scrollLeft = index * (cardWidth + gap)
      
      containerRef.current.scrollTo({
        left: scrollLeft,
        behavior: 'smooth'
      })
    }
  }

  // 스크롤 이벤트로 현재 인덱스 업데이트
  const handleScroll = useCallback(() => {
    if (containerRef.current) {
      const scrollLeft = containerRef.current.scrollLeft
      const cardWidth = 340 // min-w-[340px]
      const gap = 16 // gap-4
      const newIndex = Math.round(scrollLeft / (cardWidth + gap))
      setCurrentIndex(newIndex)
    }
  }, [])

  // 스크롤 이벤트 리스너
  useEffect(() => {
    const container = containerRef.current
    if (container) {
      container.addEventListener('scroll', handleScroll)
      return () => container.removeEventListener('scroll', handleScroll)
    }
  }, [handleScroll])

  // 좋아요 토글 처리
  const handleLikeToggle = (storyId: string) => {
    setLikedStories(prev => {
      const newLiked = new Set(prev)
      if (newLiked.has(storyId)) {
        newLiked.delete(storyId)
      } else {
        newLiked.add(storyId)
      }
      return newLiked
    })
  }

  // 댓글 추가
  const handleAddComment = (storyId: string) => {
    if (!commentText.trim()) return

    const newComment: Comment = {
      id: Date.now().toString(),
      storyId,
      author: user?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || '익명',
      authorId: user?.id,
      content: commentText,
      createdAt: new Date(),
      likes: 0
    }

    setStoryComments(prev => ({
      ...prev,
      [storyId]: [...(prev[storyId] || []), newComment]
    }))

    setCommentText('')
    setShowCommentModal(null)
  }

  // 댓글 좋아요
  const handleCommentLike = (storyId: string, commentId: string) => {
    setStoryComments(prev => ({
      ...prev,
      [storyId]: prev[storyId]?.map(comment => 
        comment.id === commentId 
          ? { ...comment, likes: comment.likes + 1 }
          : comment
      ) || []
    }))
  }

  // 프로필 보기
  const handleViewProfile = (userId: string) => {
    setSelectedUserId(userId)
    setShowProfileModal(true)
  }

  // 이미지 파일을 Base64로 변환
  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = error => reject(error)
    })
  }

  // 파일 선택 처리
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      setImageFile(file)
      try {
        const base64 = await convertToBase64(file)
        setImagePreview(base64)
        setStoryForm({ ...storyForm, imageUrl: base64 })
      } catch (error) {
        console.error('이미지 변환 실패:', error)
        alert('이미지 변환에 실패했습니다.')
      }
    } else {
      alert('이미지 파일만 선택해주세요.')
    }
  }

  // 붙여넣기 처리
  const handlePaste = async (event: React.ClipboardEvent) => {
    const items = event.clipboardData.items
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile()
        if (file) {
          setImageFile(file)
          try {
            const base64 = await convertToBase64(file)
            setImagePreview(base64)
            setStoryForm({ ...storyForm, imageUrl: base64 })
          } catch (error) {
            console.error('이미지 변환 실패:', error)
            alert('이미지 변환에 실패했습니다.')
          }
        }
        break
      }
    }
  }

  // 이미지 미리보기 제거
  const clearImage = () => {
    setImagePreview(null)
    setImageFile(null)
    setStoryForm({ ...storyForm, imageUrl: '' })
  }

  // 모달 닫기 시 상태 초기화
  const handleModalClose = () => {
    setShowUploadModal(false)
    setImagePreview(null)
    setImageFile(null)
    setStoryForm({
      imageUrl: '',
      text: '',
      isPublic: true
    })
  }
       
       // 스토리 업로드 처리
       const handleStoryUpload = async () => {
         if (!storyForm.imageUrl.trim() || !storyForm.text.trim()) {
           alert('사진과 텍스트를 모두 입력해주세요.')
           return
         }
     
         setIsUploading(true)
         
         try {
           // 실제로는 API 호출
           const newStory: Story = {
             id: Date.now().toString(),
             userId: user?.id || 'anonymous',
             userName: user?.user_metadata?.full_name || '사용자',
             imageUrl: storyForm.imageUrl,
             text: storyForm.text,
             isPublic: storyForm.isPublic,
             createdAt: new Date(),
             expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24시간 후 만료
             isExpired: false
           }
     
           // 새 스토리를 맨 앞에 추가
           setStories(prev => [newStory, ...prev])
           setStoryForm({ imageUrl: '', text: '', isPublic: true })
           setShowUploadModal(false)
           
           // 업로드 후 자동으로 expanded 상태로 변경
           setViewMode('expanded')
           if (stories.length < 3) {
             await loadMoreStories()
           }
         } catch (error) {
           console.error('스토리 업로드 실패:', error)
           alert('스토리 업로드에 실패했습니다.')
         } finally {
           setIsUploading(false)
         }
       }

  // 만료된 스토리 제거 (커뮤니티 탭에서는 24시간마다 체크하여 자동 삭제)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date()
      setStories(prev => prev.filter(story => story.expiresAt > now))
    }, 60 * 60 * 1000) // 1시간마다 체크

    return () => clearInterval(interval)
  }, [])

  // 현재 표시할 스토리들 (모든 스토리 표시)
  const visibleStories = stories

  return (
    <div className="mb-6">
      {/* 스토리 섹션 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <Clock className="w-5 h-5 text-brand-500" />
          {t('communityTab.todayStory')}
        </h3>
        
        <div className="flex items-center gap-2">
          {/* 스토리 업로드 버튼 */}
          <Dialog open={showUploadModal} onOpenChange={(open) => !open && handleModalClose()}>
            <DialogTrigger asChild>
              <Button 
                size="sm" 
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-md"
                onClick={() => {
                  console.log('스토리 올리기 버튼 클릭됨')
                  setShowUploadModal(true)
                }}
              >
                <Plus className="w-4 h-4 mr-1" />
                {t('communityTab.uploadStory')}
              </Button>
            </DialogTrigger>
            
            <DialogContent className="max-w-md bg-white border-2 border-gray-200 shadow-xl">
              <DialogHeader className="pb-4 border-b border-gray-200">
                <DialogTitle className="text-xl font-semibold text-gray-900">새 스토리 작성</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4" onPaste={handlePaste}>
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
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                      >
                        ×
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
                      />
                      <label
                        htmlFor="imageUploadGallery"
                        className="flex-1 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-brand-500 hover:bg-brand-50 transition-colors text-center"
                      >
                        <div className="flex flex-col items-center gap-2">
                          <ImageIcon className="w-6 h-6 text-gray-400" />
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
                      />
                      <label
                        htmlFor="imageUploadCamera"
                        className="flex-1 px-4 py-3 border-2 border-dashed border-blue-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors text-center"
                      >
                        <div className="flex flex-col items-center gap-2">
                          <span className="text-2xl">📷</span>
                          <span className="text-sm text-blue-600">
                            📸 카메라로 촬영
                          </span>
                        </div>
                      </label>
                    </div>
                    
                  </div>
                  
                  {/* 붙여넣기 안내 */}
                  <p className="text-xs text-gray-500 mt-2">
                    💡 이미지를 복사한 후 이 영역에 붙여넣기(Ctrl+V)도 가능합니다
                  </p>
                  
                  {/* URL 입력 (고급 사용자용) */}
                  <div className="mt-3">
                    <Label htmlFor="imageUrl" className="text-xs text-gray-500 mb-1 block">
                      또는 이미지 URL 직접 입력
                    </Label>
                    <Input
                      id="imageUrl"
                      placeholder="https://example.com/image.jpg"
                      value={storyForm.imageUrl.startsWith('data:') ? '' : storyForm.imageUrl}
                      onChange={(e) => setStoryForm({ ...storyForm, imageUrl: e.target.value })}
                      className="border border-gray-300 focus:border-brand-500 text-sm"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="text" className="text-sm font-medium text-gray-700 mb-2 block">
                    스토리 텍스트
                  </Label>
                  <Textarea
                    id="text"
                    placeholder="오늘 있었던 일을 간단히 적어주세요..."
                    value={storyForm.text}
                    onChange={(e) => setStoryForm({ ...storyForm, text: e.target.value })}
                    rows={3}
                    className="border-2 border-gray-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 resize-none"
                  />
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Switch
                        id="isPublic"
                        checked={storyForm.isPublic}
                        onCheckedChange={(checked) => setStoryForm({ ...storyForm, isPublic: checked })}
                      />
                      <Label htmlFor="isPublic" className="text-sm font-medium text-gray-800">
                        {storyForm.isPublic ? '🌍 공개 스토리' : '🔒 비공개 스토리'}
                      </Label>
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs text-gray-500 bg-white px-2 py-1 rounded border">
                      <Clock className="w-3 h-3" />
                      24시간 후 자동 삭제
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-600">
                    {storyForm.isPublic ? (
                      <span className="text-green-600">✅ 다른 사용자들이 이 스토리를 볼 수 있습니다</span>
                    ) : (
                      <span className="text-gray-500">🔒 이 스토리는 비공개로 저장됩니다</span>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-3 justify-end pt-2">
                  <Button variant="outline" onClick={handleModalClose}>
                    취소
                  </Button>
                  <Button 
                    onClick={handleStoryUpload}
                    disabled={isUploading || !storyForm.imageUrl.trim() || !storyForm.text.trim()}
                    className="bg-brand-500 hover:bg-brand-600"
                  >
                    {isUploading ? '업로드 중...' : t('communityTab.uploadStory')}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          

        </div>
      </div>

      {/* 로딩 상태 */}
      {isLoading && (
        <div className="flex justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
        </div>
      )}

      {/* 스토리 캐러셀 */}
      {!isLoading && (
        <div className="relative">

          {/* 스크롤 가능한 스토리 그리드 */}
          <div className="overflow-y-auto pr-2">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {stories.map((story) => (
                <div
                  key={story.id}
                  className="relative"
                >
                  <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 h-full p-3 group">
                    <div className="relative">
                      {/* 스토리 이미지 */}
                      <div className="aspect-square bg-gray-200 relative overflow-hidden rounded-lg">
                        <img
                          src={story.imageUrl}
                          alt="스토리 이미지"
                          className="w-full h-full object-cover cursor-pointer"
                          onClick={() => {
                            // 모바일에서는 전체화면 모달 열기
                            if (window.innerWidth <= 768) {
                              // TODO: 전체화면 스토리 뷰어 구현
                              console.log('모바일 전체화면 스토리 뷰어 열기')
                            }
                          }}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.src = `https://picsum.photos/400/400?random=${story.id}`
                          }}
                        />
                        
                        {/* 만료 시간 표시 */}
                        <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
                          {Math.max(0, Math.floor((story.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60)))}시간
                        </div>
                        
                        {/* 공개/비공개 표시 */}
                        <div className="absolute top-2 left-2">
                          {story.isPublic ? (
                            <div className="bg-green-500 text-white p-1 rounded-full">
                              <Eye className="w-3 h-3" />
                            </div>
                          ) : (
                            <div className="bg-gray-500 text-white p-1 rounded-full">
                              <EyeOff className="w-3 h-3" />
                            </div>
                          )}
                        </div>
                        
                        {/* 스토리 오버레이 메뉴 (마우스 오버 시) */}
                        <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-all duration-300 flex items-center justify-center opacity-0 hover:opacity-100 pointer-events-none">
                          <div className="flex gap-3 pointer-events-auto">
                            {/* 좋아요 버튼 */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleLikeToggle(story.id)
                              }}
                              className="w-12 h-12 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-110 cursor-pointer"
                            >
                              {likedStories.has(story.id) ? (
                                <Heart className="w-5 h-5 text-red-500 fill-current" />
                              ) : (
                                <Heart className="w-5 h-5 text-red-500" />
                              )}
                            </button>
                            
                            {/* 댓글 버튼 */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setShowCommentModal(story.id)
                              }}
                              className="w-12 h-12 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-110 cursor-pointer"
                            >
                              <MessageSquare className="w-5 h-5 text-blue-500" />
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      {/* 스토리 내용 */}
                      <div className="p-2">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-5 h-5 bg-brand-100 rounded-full flex items-center justify-center">
                            <User className="w-3 h-3 text-brand-600" />
                          </div>
                          <span className="text-xs font-medium text-gray-800">{story.userName}</span>
                        </div>
                        
                        <p className="text-xs sm:text-sm text-gray-600 mb-2 break-words leading-relaxed" style={{
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          wordBreak: 'break-word'
                        }}>
                          {story.text}
                        </p>
                        
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                          <span>{story.createdAt.toLocaleTimeString('ko-KR', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}</span>
                          <span>24시간 후 삭제</span>
                        </div>
                        
                        {/* 좋아요와 댓글 버튼 */}
                        <div className="flex items-center gap-4 pt-2 border-t border-gray-100">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleLikeToggle(story.id)
                            }}
                            className="flex items-center gap-1 text-xs text-gray-600 hover:text-red-500 transition-colors"
                          >
                            {likedStories.has(story.id) ? (
                              <Heart className="w-4 h-4 text-red-500 fill-current" />
                            ) : (
                              <Heart className="w-4 h-4" />
                            )}
                            <span>좋아요</span>
                          </button>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setShowCommentModal(story.id)
                            }}
                            className="flex items-center gap-1 text-xs text-gray-600 hover:text-blue-500 transition-colors"
                          >
                            <MessageSquare className="w-4 h-4" />
                            <span>댓글</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              ))}
            </div>
            
            {/* 스토리가 없을 때 */}
            {stories.length === 0 && (
              <Card className="p-8 text-center">
                <div className="text-4xl mb-4">📖</div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">오늘 올라온 스토리가 없습니다</h3>
                <p className="text-gray-600 mb-4">
                  오늘은 아직 새로운 스토리가 없어요. 첫 번째 스토리를 올려보세요!
                </p>
                <Button 
                  onClick={() => {
                    console.log('빈 상태 스토리 올리기 버튼 클릭됨')
                    setShowUploadModal(true)
                  }} 
                  className="bg-brand-500 hover:bg-brand-600"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {t('communityTab.uploadStory')}
                </Button>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* 더 많은 스토리가 있을 때 안내 */}
      {viewMode === 'expanded' && hasMore && (
        <div className="text-center mt-4">
          <p className="text-sm text-gray-500">
            <span className="hidden sm:inline">좌우로 스크롤하여</span>
            <span className="sm:hidden">좌우로 밀어서</span> 더 많은 스토리를 확인하세요
          </p>
        </div>
      )}

      {/* 더 이상 스토리가 없을 때 */}
      {viewMode === 'expanded' && !hasMore && stories.length > 0 && (
        <div className="text-center mt-4 py-4">
          <p className="text-sm text-gray-500">
            오늘의 모든 스토리를 확인했습니다! 🎉
          </p>
        </div>
      )}

      {/* 댓글 모달 */}
      <Dialog open={!!showCommentModal} onOpenChange={() => setShowCommentModal(null)}>
        <DialogContent className="max-w-md bg-white border border-gray-200 shadow-xl" style={{ backgroundColor: 'white', opacity: 1 }}>
          <DialogHeader>
            <DialogTitle>댓글</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* 댓글 목록 */}
            <div className="max-h-60 overflow-y-auto space-y-3">
              {showCommentModal && storyComments[showCommentModal]?.map(comment => (
                <div key={comment.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {comment.authorId ? (
                          <button
                            onClick={() => handleViewProfile(comment.authorId!)}
                            className="font-medium text-sm text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                          >
                            {comment.author}
                          </button>
                        ) : (
                          <span className="font-medium text-sm">{comment.author}</span>
                        )}
                        <span className="text-xs text-gray-500">
                          {comment.createdAt.toLocaleTimeString('ko-KR', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">{comment.content}</p>
                    </div>
                    <button
                      onClick={() => handleCommentLike(showCommentModal, comment.id)}
                      className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-500"
                    >
                      <Heart className="w-3 h-3" />
                      <span>{comment.likes}</span>
                    </button>
                  </div>
                </div>
              ))}
              
              {showCommentModal && (!storyComments[showCommentModal] || storyComments[showCommentModal].length === 0) && (
                <div className="text-center py-8 text-gray-500">
                  아직 댓글이 없습니다.
                </div>
              )}
            </div>
            
            {/* 댓글 작성 */}
            <div className="flex gap-2">
              <Input
                placeholder="댓글을 입력하세요..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleAddComment(showCommentModal!)
                  }
                }}
                className="flex-1"
              />
              <Button 
                onClick={() => handleAddComment(showCommentModal!)}
                disabled={!commentText.trim()}
                size="sm"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 사용자 프로필 모달 */}
      <UserProfileModal
        userId={selectedUserId}
        isOpen={showProfileModal}
        onClose={() => {
          setShowProfileModal(false)
          setSelectedUserId(null)
        }}
      />
    </div>
  )
}
