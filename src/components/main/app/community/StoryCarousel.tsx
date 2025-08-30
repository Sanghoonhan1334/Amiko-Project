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
  Heart
} from 'lucide-react'
import { Story, StoryForm } from '@/types/story'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'

// 목업 스토리 데이터 (24시간 이내, 공개된 것만)
const mockStories: Story[] = [
  {
    id: '1',
    userId: 'user1',
    userName: '김민지',
    userAvatar: '/avatars/user1.jpg',
    imageUrl: '/stories/story1.jpg',
    text: '오늘 한국 전통 한복을 입어봤어요! 너무 예뻐서 기분이 좋았습니다 💕',
    isPublic: true,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2시간 전
    expiresAt: new Date(Date.now() + 22 * 60 * 60 * 1000), // 22시간 후 만료
    isExpired: false
  },
  {
    id: '2',
    userId: 'user2',
    userName: '마리아',
    userAvatar: '/avatars/user2.jpg',
    imageUrl: '/stories/story2.jpg',
    text: '한국 화장품으로 메이크업 연습 중이에요. 어떤가요? 😊',
    isPublic: true,
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4시간 전
    expiresAt: new Date(Date.now() + 20 * 60 * 60 * 1000), // 20시간 후 만료
    isExpired: false
  },
  {
    id: '3',
    userId: 'user3',
    userName: '카를로스',
    userAvatar: '/avatars/user3.jpg',
    imageUrl: '/stories/story3.jpg',
    text: '서울에서 맛있는 떡볶이를 먹었어요! 매운맛이 정말 대박이었습니다 🔥',
    isPublic: true,
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6시간 전
    expiresAt: new Date(Date.now() + 18 * 60 * 60 * 1000), // 18시간 후 만료
    isExpired: false
  },
  {
    id: '4',
    userId: 'user4',
    userName: '소피아',
    userAvatar: '/avatars/user4.jpg',
    imageUrl: '/stories/story4.jpg',
    text: '한국 드라마 보면서 한국어 공부하고 있어요. 진짜 재미있어요! 📺',
    isPublic: true,
    createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8시간 전
    expiresAt: new Date(Date.now() + 16 * 60 * 60 * 1000), // 16시간 후 만료
    isExpired: false
  },
  {
    id: '5',
    userId: 'user5',
    userName: '김준호',
    userAvatar: '/avatars/user5.jpg',
    imageUrl: '/stories/story5.jpg',
    text: '라틴 음악에 빠져서 스페인어를 배우기 시작했어요! 🎵',
    isPublic: true,
    createdAt: new Date(Date.now() - 10 * 60 * 60 * 1000), // 10시간 전
    expiresAt: new Date(Date.now() + 14 * 60 * 60 * 1000), // 14시간 후 만료
    isExpired: false
  },
  {
    id: '6',
    userId: 'user6',
    userName: '이수진',
    userAvatar: '/avatars/user6.jpg',
    imageUrl: '/stories/story6.jpg',
    text: '멕시코 타코를 직접 만들어봤어요. 정말 맛있었습니다! 🌮',
    isPublic: true,
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12시간 전
    expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000), // 12시간 후 만료
    isExpired: false
  }
]

interface StoryCarouselProps {
  onTabChange?: () => void
}

export default function StoryCarousel({ onTabChange }: StoryCarouselProps) {
  const { user } = useAuth()
  const { t } = useLanguage()
  
  // 상태 관리
  const [viewMode, setViewMode] = useState<'collapsed' | 'expanded'>('collapsed')
  const [stories, setStories] = useState<Story[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [cursor, setCursor] = useState<string | null>(null)
  
         // 스토리 업로드 관련 상태
       const [showUploadModal, setShowUploadModal] = useState(false)
       const [storyForm, setStoryForm] = useState<StoryForm>({
         imageUrl: '',
         text: '',
         isPublic: true
       })
       const [isUploading, setIsUploading] = useState(false)
       
       // 좋아요 상태 관리
       const [likedStories, setLikedStories] = useState<Set<string>>(new Set())

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
  }, [viewMode, hasMore, isLoadingMore])

  // 초기 스토리 로드 (1개만)
  const loadInitialStories = async () => {
    setIsLoading(true)
    try {
      // 실제로는 API 호출: 최신 스토리 1개만
      const initialStories = mockStories.slice(0, 1)
      setStories(initialStories)
      setHasMore(mockStories.length > 1)
      setCursor('1') // 다음 페이지 커서
    } catch (error) {
      console.error('초기 스토리 로드 실패:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // 추가 스토리 로드
  const loadMoreStories = async () => {
    if (isLoadingMore || !hasMore) return

    setIsLoadingMore(true)
    try {
      // 실제로는 API 호출: cursor 기반으로 다음 페이지
      await new Promise(resolve => setTimeout(resolve, 500)) // 로딩 시뮬레이션
      
      const currentCount = stories.length
      const nextStories = mockStories.slice(currentCount, currentCount + 3)
      
      if (nextStories.length > 0) {
        setStories(prev => [...prev, ...nextStories])
        setCursor((currentCount + nextStories.length).toString())
        setHasMore(currentCount + nextStories.length < mockStories.length)
      } else {
        setHasMore(false)
      }
    } catch (error) {
      console.error('추가 스토리 로드 실패:', error)
    } finally {
      setIsLoadingMore(false)
    }
  }

  // 뷰 모드 토글
  const toggleViewMode = async () => {
    if (viewMode === 'collapsed') {
      // collapsed → expanded: 최소 3개까지 보장
      setViewMode('expanded')
      if (stories.length < 3) {
        await loadMoreStories()
      }
    } else {
      // expanded → collapsed: 1개로 축소
      resetToCollapsed()
    }
  }

  // collapsed 상태로 리셋
  const resetToCollapsed = () => {
    setViewMode('collapsed')
    setCurrentIndex(0)
    setStories(mockStories.slice(0, 1))
    setHasMore(mockStories.length > 1)
    setCursor('1')
    
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

  // 현재 표시할 스토리들
  const visibleStories = viewMode === 'collapsed' ? stories.slice(0, 1) : stories

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
          <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-md">
                <Plus className="w-4 h-4 mr-1" />
                {t('communityTab.uploadStory')}
              </Button>
            </DialogTrigger>
            
            <DialogContent className="max-w-md bg-white border-2 border-gray-200 shadow-xl">
              <DialogHeader className="pb-4 border-b border-gray-200">
                <DialogTitle className="text-xl font-semibold text-gray-900">새 스토리 작성</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="imageUrl" className="text-sm font-medium text-gray-700 mb-2 block">
                    사진 URL
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="imageUrl"
                      placeholder="https://example.com/image.jpg"
                      value={storyForm.imageUrl}
                      onChange={(e) => setStoryForm({ ...storyForm, imageUrl: e.target.value })}
                      className="border-2 border-gray-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setStoryForm({ ...storyForm, imageUrl: 'https://picsum.photos/400/500?random=' + Date.now() })}
                    >
                      <ImageIcon className="w-4 h-4" />
                    </Button>
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
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Switch
                      id="isPublic"
                      checked={storyForm.isPublic}
                      onCheckedChange={(checked) => setStoryForm({ ...storyForm, isPublic: checked })}
                    />
                    <Label htmlFor="isPublic" className="text-sm text-gray-700">
                      공개하기
                    </Label>
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    24시간 후 자동 삭제
                  </div>
                </div>
                
                <div className="flex gap-3 justify-end pt-2">
                  <Button variant="outline" onClick={() => setShowUploadModal(false)}>
                    취소
                  </Button>
                  <Button 
                    onClick={handleStoryUpload}
                    disabled={isUploading || !storyForm.imageUrl.trim() || !storyForm.text.trim()}
                    className="bg-brand-500 hover:bg-brand-600"
                  >
                    {isUploading ? '업로드 중...' : '스토리 올리기'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          
          {/* 확장/축소 버튼 */}
          {stories.length > 1 && (
            <Button
              variant="outline"
              size="sm"
              onClick={toggleViewMode}
              className="border-gray-300 hover:bg-gray-50"
            >
              {viewMode === 'expanded' ? (
                <>
                  <ChevronUp className="w-4 h-4 mr-1" />
                  줄이기
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 mr-1" />
                  늘리기
                </>
              )}
            </Button>
          )}
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
          {/* 좌우 네비게이션 버튼 (데스크탑, expanded 상태에서만) */}
          {viewMode === 'expanded' && stories.length > 1 && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={navigateToPrev}
                disabled={currentIndex === 0}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white shadow-lg border-gray-300"
                aria-label="이전 스토리"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={navigateToNext}
                disabled={currentIndex === stories.length - 1}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white shadow-lg border-gray-300"
                aria-label="다음 스토리"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </>
          )}

          {/* 캐러셀 컨테이너 */}
          <div 
            ref={containerRef}
            className={`
              flex gap-4 overflow-x-auto overflow-y-hidden
              snap-x snap-mandatory
              max-w-none
              transition-all duration-300 ease-in-out
              pb-2
            `}
            style={{
              scrollbarWidth: 'none', // Firefox
              msOverflowStyle: 'none', // IE/Edge
              scrollSnapType: 'x mandatory'
            }}
          >
            {/* 스크롤바 숨기기 (Webkit) */}
            <style jsx>{`
              div::-webkit-scrollbar {
                display: none;
              }
            `}</style>

            {visibleStories.map((story, index) => (
              <div
                key={story.id}
                className="snap-start flex-shrink-0 relative"
                style={{ 
                  minWidth: '280px',
                  maxWidth: '320px',
                  width: '280px'
                }}
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
                          
                          {/* 프로필 보기 버튼 */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              // TODO: 프로필 보기 모달/페이지 이동
                              console.log('프로필 보기:', story.userId)
                              alert(`프로필 보기! 사용자 ID: ${story.userId}`)
                            }}
                            className="w-12 h-12 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-110 cursor-pointer"
                          >
                            <User className="w-5 h-5 text-blue-500" />
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
                      
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{story.createdAt.toLocaleTimeString('ko-KR', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}</span>
                        <span>24시간 후 삭제</span>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* 더보기 버튼 - 중앙에 짧은 형태 */}
                {viewMode === 'collapsed' && (
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 z-20">
                    <Button
                      onClick={() => toggleViewMode()}
                      className="h-24 bg-white/80 hover:bg-white/90 backdrop-blur-sm border border-white/50 text-gray-700 hover:text-gray-900 shadow-lg rounded-l-lg rounded-r-none px-0 w-[4px] flex items-center justify-center transition-all duration-300 hover:w-[20px] overflow-hidden group"
                      size="sm"
                    >
                      <ChevronRight className="w-4 h-4 transition-all duration-200 group-hover:opacity-0" />
                      <span 
                        className="text-xs font-medium absolute opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap"
                        style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
                      >
                        더보기
                      </span>
                    </Button>
                  </div>
                )}
              </div>
            ))}

            {/* 무한 스크롤 트리거 (가로 스크롤용) */}
            {viewMode === 'expanded' && hasMore && (
              <div ref={loadMoreRef} className="snap-start flex-shrink-0 flex items-center justify-center" style={{ minWidth: '260px' }}>
                <div className="w-full h-full flex items-center justify-center">
                  {isLoadingMore ? (
                    <div className="flex flex-col items-center gap-2 text-center">
                      <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
                      <span className="text-sm text-gray-500">더 많은 스토리를 불러오는 중...</span>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={loadMoreStories}
                      className="border-brand-300 text-brand-600 hover:bg-brand-50"
                    >
                      더 많은 스토리 보기
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 인디케이터 (선택사항) */}
          {viewMode === 'expanded' && stories.length > 1 && (
            <div className="flex justify-center mt-4 gap-2">
              {stories.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-all duration-200 ${
                    index === currentIndex ? 'bg-brand-500' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          )}
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
    </div>
  )
}
