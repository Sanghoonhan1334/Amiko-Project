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
import { StoryCarouselSkeleton } from '@/components/ui/skeleton'

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

// 실제 스토리 데이터는 API에서 가져올 예정
const getMockStories = (userName: string = '한상훈'): Story[] => []

export default function StoryCarousel() {
  const { user, token } = useAuth()
  const { t } = useLanguage()
  
  // 사용자 이름 가져오기
  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || '한상훈'
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
      // 스토리 API 호출
      const response = await fetch(`/api/stories?isPublic=true&limit=3&offset=${stories.length}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('스토리 목록 API 오류:', response.status, errorData)
        throw new Error(`스토리를 불러오는데 실패했습니다. (${response.status})`)
      }

      const data = await response.json()
      const nextStories = data.stories || []
      
      if (nextStories.length > 0) {
        // API 응답을 Story 타입으로 변환
        const convertedStories: Story[] = nextStories.map((story: any) => ({
          id: story.id,
          userId: story.user_id,
          userName: user?.user_metadata?.full_name || '사용자',
          imageUrl: story.image_url,
          text: story.text_content,
          isPublic: story.is_public,
          createdAt: new Date(story.created_at),
          expiresAt: new Date(story.expires_at),
          isExpired: story.is_expired
        }))
        
        setStories(prev => [...prev, ...convertedStories])
        setHasMore(data.pagination.hasMore)
      } else {
        setHasMore(false)
      }
    } catch (error) {
      console.error('추가 스토리 로드 실패:', error)
      // 에러 시 목업 데이터 사용
      const currentCount = stories.length
      const nextStories = mockStories.slice(currentCount, currentCount + 3)
      
      if (nextStories.length > 0) {
        setStories(prev => [...prev, ...nextStories])
        setHasMore(currentCount + nextStories.length < mockStories.length)
      } else {
        setHasMore(false)
      }
    } finally {
      setIsLoadingMore(false)
    }
  }, [isLoadingMore, hasMore, stories.length, mockStories, token, user])

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
    
    // 최소 로딩 시간 보장 (스켈레톤을 확실히 보이게 하기 위해)
    const minLoadingTime = new Promise(resolve => setTimeout(resolve, 1500))
    
    try {
      // 스토리 API 호출과 최소 로딩 시간을 동시에 실행
      const [apiResponse] = await Promise.all([
        fetch('/api/stories?isPublic=true&limit=10', {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }),
        minLoadingTime
      ])

      if (!apiResponse.ok) {
        const errorData = await apiResponse.json().catch(() => ({ error: 'Unknown error' }))
        console.error('스토리 목록 API 오류:', apiResponse.status, errorData)
        throw new Error(`스토리를 불러오는데 실패했습니다. (${apiResponse.status})`)
      }

      const data = await apiResponse.json()
      const stories = data.stories || []
      
      console.log('스토리 API 응답:', { 
        storiesCount: stories.length, 
        totalCount: data.pagination?.total || 0,
        hasMore: data.pagination?.hasMore || false,
        rawData: data,
        apiUrl: '/api/stories?isPublic=true&limit=10',
        token: token ? '있음' : '없음'
      })
      
      // 원본 스토리 데이터 로그
      if (stories.length > 0) {
        console.log('첫 번째 스토리 원본 데이터:', stories[0])
      }
      
      // API 응답을 Story 타입으로 변환
      const convertedStories: Story[] = stories.map((story: any) => ({
        id: story.id,
        userId: story.user_id,
        userName: story.user_name || '익명',
        imageUrl: story.image_url,
        text: story.text_content,
        isPublic: story.is_public,
        createdAt: new Date(story.created_at),
        expiresAt: new Date(story.expires_at),
        isExpired: story.is_expired
      }))
      
      console.log('변환된 스토리 데이터:', {
        convertedCount: convertedStories.length,
        firstStory: convertedStories[0]
      })
      
      // 임시로 목업 데이터 추가 (테스트용)
      if (convertedStories.length === 0) {
        console.log('스토리가 없어서 목업 데이터 추가')
        console.log('데이터베이스에 스토리가 없습니다. 테스트용 스토리를 생성합니다.')
        
        // 실제 데이터베이스에 스토리 생성 시도
        try {
          const createResponse = await fetch('/api/stories', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              imageUrl: 'https://picsum.photos/400/400?random=1',
              text: '안녕하세요! 첫 번째 스토리입니다! 🎉',
              isPublic: true,
              userId: user?.id
            })
          })
          
          if (createResponse.ok) {
            console.log('테스트 스토리 생성 성공!')
            // 생성된 스토리로 다시 로드
            loadInitialStories()
            return
          } else {
            console.log('테스트 스토리 생성 실패, 목업 데이터 사용')
          }
        } catch (createError) {
          console.log('테스트 스토리 생성 중 오류:', createError)
        }
        
        const mockStory: Story = {
          id: 'mock-1',
          userId: user?.id || 'mock-user',
          userName: user?.user_metadata?.full_name || '한상훈',
          imageUrl: 'https://picsum.photos/400/400?random=1',
          text: '테스트 스토리입니다!',
          isPublic: true,
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          isExpired: false
        }
        setStories([mockStory])
        setHasMore(false)
      } else {
        setStories(convertedStories)
        setHasMore(data.pagination?.hasMore || false)
      }
    } catch (error) {
      console.error('초기 스토리 로드 실패:', error)
      // 에러 시 빈 배열로 설정 (목업 데이터 사용하지 않음)
      setStories([])
      setHasMore(false)
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
    // 실제 로드된 스토리를 유지 (mockStories 대신 현재 stories 상태 유지)
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
      author: user?.user_metadata?.full_name || user?.email?.split('@')[0] || '익명',
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
           // 스토리 API 호출
           const response = await fetch('/api/stories', {
             method: 'POST',
             headers: {
               'Content-Type': 'application/json',
               'Authorization': `Bearer ${token}`
             },
             body: JSON.stringify({
               imageUrl: storyForm.imageUrl,
               text: storyForm.text,
               isPublic: storyForm.isPublic
             })
           })

           if (!response.ok) {
             const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
             console.error('스토리 생성 API 오류:', response.status, errorData)
             
             // 데이터베이스 연결 문제인 경우 사용자 친화적인 메시지 표시
             if (response.status === 500) {
               if (!errorData.error || errorData.error.includes('데이터베이스') || errorData.error.includes('연결')) {
                 alert('시스템 점검 중입니다. 잠시 후 다시 시도해주세요.')
                 return
               }
             }
             
             throw new Error(`스토리 생성에 실패했습니다. (${response.status}: ${errorData.error || 'Unknown error'})`)
           }

           const result = await response.json()
           console.log('새 스토리 작성:', result.story)

           // API에서 받은 스토리 데이터를 로컬 상태에 추가
           const newStory: Story = {
             id: result.story.id,
             userId: result.story.user_id,
             userName: user?.user_metadata?.full_name || '사용자',
             imageUrl: result.story.image_url,
             text: result.story.text_content,
             isPublic: result.story.is_public,
             createdAt: new Date(result.story.created_at),
             expiresAt: new Date(result.story.expires_at),
             isExpired: result.story.is_expired
           }

           // 포인트 획득 시도 (스토리 작성)
           if (user?.id) {
             try {
               const pointsResponse = await fetch('/api/community/points', {
                 method: 'POST',
                 headers: { 'Content-Type': 'application/json' },
                 body: JSON.stringify({
                   userId: user.id,
                   activityType: 'story_post',
                   postId: newStory.id,
                   title: `스토리: ${storyForm.text.substring(0, 20)}...`
                 })
               })

               if (pointsResponse.ok) {
                 const pointsResult = await pointsResponse.json()
                 console.log('포인트 획득 성공:', pointsResult)
                 alert(`스토리가 업로드되었습니다! +${pointsResult.points}점 획득!`)
               } else {
                 const errorData = await pointsResponse.json()
                 console.warn('포인트 획득 실패:', errorData)
                 alert('스토리가 업로드되었습니다!')
               }
             } catch (pointsError) {
               console.error('포인트 API 호출 실패:', pointsError)
               alert('스토리가 업로드되었습니다!')
             }
           } else {
             alert('스토리가 업로드되었습니다!')
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
                  
                  // 로그인 체크
                  if (!user) {
                    console.log('로그인 필요 - 로그인 페이지로 이동')
                    window.location.href = '/sign-in'
                    return
                  }
                  
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

      {/* 로딩 상태 - 스켈레톤 */}
      {isLoading && (
        <div className="py-4">
          <StoryCarouselSkeleton />
        </div>
      )}

      {/* 스토리 캐러셀 */}
      {!isLoading && (
        <div className="relative">

          {/* 스크롤 가능한 스토리 그리드 */}
          <div className="overflow-y-auto pr-2">
            {(() => {
              console.log('스토리 렌더링 조건 확인:', {
                storiesLength: stories.length,
                stories: stories,
                isLoading: isLoading
              })
              return stories.length > 0
            })() ? (
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
            ) : null}
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
