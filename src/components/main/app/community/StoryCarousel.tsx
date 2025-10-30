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
  Send,
  Languages
} from 'lucide-react'
import { Story, StoryForm } from '@/types/story'
import UserProfileModal from '@/components/common/UserProfileModal'
import { StoryCarouselSkeleton } from '@/components/ui/skeleton'
import UserBadge from '@/components/common/UserBadge'

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
import { useUser } from '@/context/UserContext'
import { useLanguage } from '@/context/LanguageContext'
import { useRouter } from 'next/navigation'
import { checkAuthAndRedirect } from '@/lib/auth-utils'
import { TranslationService } from '@/lib/translation'
import VerificationGuard from '@/components/common/VerificationGuard'

// 실제 스토리 데이터는 API에서 가져올 예정
const getMockStories = (userName: string = '한상훈'): Story[] => []

export default function StoryCarousel() {
  const { user } = useUser()
  const { token, user: authUser, session } = useAuth()
  const { t, language } = useLanguage()
  const router = useRouter()
  
  const translationService = new TranslationService()
  
  // 운영자 권한 확인
  const [isAdmin, setIsAdmin] = useState(false)
  
  const checkAdminStatus = () => {
    if (!authUser) {
      setIsAdmin(false)
      return
    }
    
    // 운영자 이메일 목록
    const adminEmails = [
      'admin@amiko.com',
      'editor@amiko.com',
      'manager@amiko.com'
    ]
    
    // 운영자 ID 목록
    const adminIds = [
      '66623263-4c1d-4dce-85a7-cc1b21d01f70' // 현재 사용자 ID
    ]
    
    const isAdminUser = adminEmails.includes(authUser.email) || adminIds.includes(authUser.id)
    setIsAdmin(isAdminUser)
  }

  useEffect(() => {
    checkAdminStatus()
  }, [authUser])

  // 화면 크기 감지
  const [isSmallScreen, setIsSmallScreen] = useState(false)
  
  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth
      setIsMobileView(width < 360)
      setIsSmallScreen(width <= 480)
      console.log('Screen width:', width, 'isSmallScreen:', width <= 480)
    }
    
    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  // 터치 이벤트 핸들러 (모바일 스와이프)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isMobileView) return
    setTouchStartX(e.targetTouches[0].clientX)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isMobileView) return
    setTouchEndX(e.targetTouches[0].clientX)
  }

  const handleTouchEnd = () => {
    if (!isMobileView) return
    
    const swipeThreshold = 50 // 최소 스와이프 거리
    const diff = touchStartX - touchEndX

    if (Math.abs(diff) > swipeThreshold) {
      if (diff > 0) {
        // 왼쪽으로 스와이프 - 다음 스토리
        if (currentIndex < stories.length - 1) {
          setCurrentIndex(currentIndex + 1)
        }
      } else {
        // 오른쪽으로 스와이프 - 이전 스토리
        if (currentIndex > 0) {
          setCurrentIndex(currentIndex - 1)
        }
      }
    }
  }
  
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
  const [isMobileView, setIsMobileView] = useState(false)
  const [touchStartX, setTouchStartX] = useState(0)
  const [touchEndX, setTouchEndX] = useState(0)

  
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
  const [isProcessingLike, setIsProcessingLike] = useState(false)
  
  // 스토리 모달 상태
  const [selectedStory, setSelectedStory] = useState<Story | null>(null)
  const [showStoryModal, setShowStoryModal] = useState(false)
  
  // 댓글 관련 상태
  const [showCommentModal, setShowCommentModal] = useState<string | null>(null)
  const [commentText, setCommentText] = useState('')
  const [storyComments, setStoryComments] = useState<Record<string, Comment[]>>({})
  
  // 번역 관련 상태
  const [translatingStories, setTranslatingStories] = useState<Set<string>>(new Set())

  // 댓글 모달이 열릴 때 댓글 로드
  useEffect(() => {
    if (showCommentModal) {
      console.log('댓글 모달 열림, 댓글 로드 시작:', showCommentModal)
      loadStoryComments(showCommentModal)
    }
  }, [showCommentModal, loadStoryComments])
  
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
          'Authorization': `Bearer ${encodeURIComponent(token)}`
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
      // 타임아웃 설정으로 무한 대기 방지
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000) // 5초 타임아웃
      
      // 스토리 API 호출과 최소 로딩 시간을 동시에 실행
      const [apiResponse] = await Promise.all([
        fetch('/api/stories?isPublic=true&limit=20', {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${encodeURIComponent(token)}`
          },
          signal: controller.signal
        }),
        minLoadingTime
      ])
      
      clearTimeout(timeoutId)

      if (!apiResponse.ok) {
        // 응답이 HTML인지 확인 (JSON 파싱 오류 방지)
        const contentType = apiResponse.headers.get('content-type')
        if (contentType && contentType.includes('text/html')) {
          console.log('스토리 API가 HTML 응답을 반환함, 빈 배열 사용')
          setStories([])
          setIsLoading(false)
          return
        }
        
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
              'Authorization': `Bearer ${encodeURIComponent(token)}`
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
        
        // 스토리 로드 후 좋아요 상태 초기화
        await loadUserLikes(convertedStories.map(s => s.id))
      }
    } catch (error) {
      console.error('초기 스토리 로드 실패:', error)
      
      // AbortError인 경우 타임아웃으로 처리
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('스토리 로딩 타임아웃, 빈 배열 사용')
      }
      
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
      // 모바일에서는 더 작은 카드 크기 사용
      const isMobile = window.innerWidth < 640
      const cardWidth = isMobile ? 280 : 340 // 모바일: 280px, 데스크톱: 340px
      const gap = isMobile ? 12 : 16 // 모바일: gap-3, 데스크톱: gap-4
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
      // 모바일에서는 더 작은 카드 크기 사용
      const isMobile = window.innerWidth < 640
      const cardWidth = isMobile ? 280 : 340 // 모바일: 280px, 데스크톱: 340px
      const gap = isMobile ? 12 : 16 // 모바일: gap-3, 데스크톱: gap-4
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
  const handleLikeToggle = async (storyId: string) => {
    const isCurrentlyLiked = likedStories.has(storyId)
    
    // 중복 클릭 방지를 위한 상태 추가
    if (isProcessingLike) return
    
    setIsProcessingLike(true)
    
    try {
      console.log('스토리 좋아요 토글 시도:', { storyId, isCurrentlyLiked })
      
      // 낙관적 업데이트 (사용자 경험 개선)
      setLikedStories(prev => {
        const newLiked = new Set(prev)
        if (isCurrentlyLiked) {
          newLiked.delete(storyId)
        } else {
          newLiked.add(storyId)
        }
        return newLiked
      })
      
      const response = await fetch(`/api/stories/${storyId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || session?.access_token}`
        },
        body: JSON.stringify({
          action: isCurrentlyLiked ? 'unlike' : 'like'
        })
      })

      console.log('스토리 좋아요 토글 응답:', response.status)

      if (!response.ok) {
        // API 실패 시 상태 롤백
        setLikedStories(prev => {
          const newLiked = new Set(prev)
          if (isCurrentlyLiked) {
            newLiked.add(storyId) // 원래 상태로 복원
          } else {
            newLiked.delete(storyId) // 원래 상태로 복원
          }
          return newLiked
        })
        
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('스토리 좋아요 토글 실패:', errorData)
        alert(errorData.error || '좋아요 처리에 실패했습니다.')
      } else {
        const data = await response.json()
        console.log('스토리 좋아요 토글 성공:', data)
      }
    } catch (error) {
      // 네트워크 오류 시 상태 롤백
      setLikedStories(prev => {
        const newLiked = new Set(prev)
        if (isCurrentlyLiked) {
          newLiked.add(storyId) // 원래 상태로 복원
        } else {
          newLiked.delete(storyId) // 원래 상태로 복원
        }
        return newLiked
      })
      
      console.error('스토리 좋아요 토글 오류:', error)
      alert('좋아요 처리 중 오류가 발생했습니다.')
    } finally {
      setIsProcessingLike(false)
    }
  }

  // 댓글 추가
  const handleAddComment = async (storyId: string) => {
    if (!commentText.trim()) return

    try {
      console.log('스토리 댓글 작성 시도:', { storyId, content: commentText.trim() })
      
      const response = await fetch(`/api/stories/${storyId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || session?.access_token}`
        },
        body: JSON.stringify({
          content: commentText.trim()
        })
      })

      console.log('스토리 댓글 작성 응답:', response.status)

      if (response.ok) {
        const data = await response.json()
        console.log('스토리 댓글 작성 성공:', data)
        
        // 댓글 목록 새로고침
        await loadStoryComments(storyId)
        setCommentText('')
        setShowCommentModal(null)
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('스토리 댓글 작성 실패:', errorData)
        alert(errorData.error || '댓글 작성에 실패했습니다.')
      }
    } catch (error) {
      console.error('스토리 댓글 작성 오류:', error)
      alert('댓글 작성 중 오류가 발생했습니다.')
    }
  }

  // 스토리 댓글 로딩
  const loadStoryComments = useCallback(async (storyId: string) => {
    try {
      console.log('스토리 댓글 로드 시도:', storyId)
      
      const response = await fetch(`/api/stories/${storyId}/comments`)
      console.log('스토리 댓글 로드 응답:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('스토리 댓글 로드 성공:', data.comments?.length || 0, '개')
        
        // API 응답을 로컬 상태 형식으로 변환
        const transformedComments = data.comments?.map((comment: any) => ({
          id: comment.id,
          storyId: storyId,
          author: comment.author?.full_name || '익명',
          authorId: comment.author?.id,
          content: comment.content,
          createdAt: new Date(comment.created_at),
          likes: 0 // API에 좋아요 기능이 없으므로 0으로 설정
        })) || []
        
        setStoryComments(prev => ({
          ...prev,
          [storyId]: transformedComments
        }))
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('스토리 댓글 로드 실패:', errorData)
      }
    } catch (error) {
      console.error('스토리 댓글 로드 오류:', error)
    }
  }, [])

  // 사용자의 좋아요 상태 로드
  const loadUserLikes = useCallback(async (storyIds: string[]) => {
    if (!token || storyIds.length === 0) return
    
    try {
      console.log('사용자 좋아요 상태 로드 시도:', storyIds)
      
      const response = await fetch(`/api/stories/likes?storyIds=${storyIds.join(',')}`, {
        headers: {
          'Authorization': `Bearer ${token || session?.access_token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('사용자 좋아요 상태 로드 성공:', data.likedStories)
        
        // 좋아요 상태 설정
        setLikedStories(new Set(data.likedStories || []))
      } else {
        console.log('사용자 좋아요 상태 로드 실패, 빈 상태로 초기화')
        setLikedStories(new Set())
      }
    } catch (error) {
      console.error('사용자 좋아요 상태 로드 오류:', error)
      setLikedStories(new Set())
    }
  }, [token])

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

  // 스토리 번역
  const handleTranslateStory = async (storyId: string) => {
    if (translatingStories.has(storyId)) return // 이미 번역 중이면 무시
    
    setTranslatingStories(prev => new Set(prev).add(storyId))
    
    try {
      const story = stories.find(s => s.id === storyId)
      if (!story) return
      
      const targetLang = language === 'ko' ? 'es' : 'ko'
      const translatedText = await translationService.translate(story.text, targetLang)
      
      setStories(prevStories => 
        prevStories.map(s => 
          s.id === storyId 
            ? { ...s, translatedText }
            : s
        )
      )
    } catch (error) {
      console.error('스토리 번역 실패:', error)
    } finally {
      setTranslatingStories(prev => {
        const newSet = new Set(prev)
        newSet.delete(storyId)
        return newSet
      })
    }
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

         // 사용자 정보 확인 (user 또는 authUser 중 하나라도 있으면 OK)
         const currentUser = user || authUser
         if (!currentUser) {
           alert('로그인이 필요합니다.')
           return
         }

         // 인증 체크 - 스토리 작성은 인증이 필요
         if (!checkAuthAndRedirect(currentUser, router, '스토리 작성')) {
           return
         }

         // 토큰 검증 제거 (임시)
         // if (!token) {
         //   alert('인증 토큰이 없습니다. 다시 로그인해주세요.')
         //   return
         // }
     
         setIsUploading(true)
         
         try {
           // 스토리 API 호출
           const response = await fetch('/api/stories', {
             method: 'POST',
             headers: {
               'Content-Type': 'application/json'
             },
             body: JSON.stringify({
               imageUrl: storyForm.imageUrl,
               text: storyForm.text,
               isPublic: storyForm.isPublic,
               userId: currentUser.id
             })
           })

           if (!response.ok) {
             const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
             console.error('스토리 생성 API 오류:', response.status, errorData)
             
             // 인증 오류인 경우 에러 메시지만 표시
             if (response.status === 401) {
               alert('로그인이 필요합니다. 페이지를 새로고침해주세요.')
               return
             }
             
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
      <div className="flex items-center justify-between mb-4 px-2">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 flex-shrink-0">
          <Clock className="w-5 h-5 text-brand-500" />
          {t('communityTab.todayStory')}
        </h3>
        
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* 스토리 업로드 버튼 - 운영자는 인증 없이 가능 */}
          {isAdmin ? (
            <Dialog open={showUploadModal} onOpenChange={(open) => !open && handleModalClose()}>
              <DialogTrigger asChild>
                <Button 
                  size="sm" 
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-md whitespace-nowrap"
                  onClick={() => {
                    console.log('스토리 올리기 버튼 클릭됨 (운영자)')
                    setShowUploadModal(true)
                  }}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  {t('communityTab.uploadStory')}
                </Button>
              </DialogTrigger>
            </Dialog>
          ) : (
            <VerificationGuard requiredLevel="sms">
              <Dialog open={showUploadModal} onOpenChange={(open) => !open && handleModalClose()}>
                <DialogTrigger asChild>
                  <Button 
                    size="sm" 
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-md whitespace-nowrap"
                    onClick={() => {
                      console.log('스토리 올리기 버튼 클릭됨')
                      setShowUploadModal(true)
                    }}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    {t('communityTab.uploadStory')}
                  </Button>
                </DialogTrigger>
              </Dialog>
            </VerificationGuard>
          )}
        </div>
      </div>

      {/* 스토리 업로드 모달 - 운영자와 일반 사용자 공통 */}
      <VerificationGuard requiredLevel="sms">
        <Dialog open={showUploadModal} onOpenChange={(open) => !open && handleModalClose()}>
          <DialogContent 
            className="max-w-md bg-white border-2 border-gray-200 shadow-xl" 
            style={{ 
              margin: '0 auto',
              maxWidth: 'calc(100vw - 48px)',
              left: '50%',
              transform: 'translateX(-50%)',
              position: 'fixed'
            }}
          >
              <DialogHeader className="pb-4 border-b border-gray-200">
                <DialogTitle className="text-xl font-semibold text-gray-900">{t('communityTab.newStory')}</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4" onPaste={handlePaste}>
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">
                    {t('communityTab.photoUpload')}
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
                    {t('communityTab.storyText')}
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
                        {storyForm.isPublic ? `🌍 ${t('communityTab.publicStory')}` : `🔒 ${t('communityTab.privateStory')}`}
                      </Label>
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs text-gray-500 bg-white px-2 py-1 rounded border">
                      <Clock className="w-3 h-3" />
                      {t('communityTab.autoDelete')}
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
                    {t('buttons.cancel')}
                  </Button>
                  <Button 
                    onClick={handleStoryUpload}
                    disabled={isUploading || !storyForm.imageUrl.trim() || !storyForm.text.trim()}
                    className="bg-brand-500 hover:bg-brand-600"
                  >
                    {isUploading ? t('buttons.uploading') : t('communityTab.uploadStory')}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
      </VerificationGuard>

      {/* 로딩 상태 - 스켈레톤 */}
      {isLoading && (
        <div className="py-4">
          <StoryCarouselSkeleton />
        </div>
      )}

      {/* 스토리 캐러셀 또는 빈 상태 */}
      {!isLoading && (
        <div className="relative">
          {stories.length > 0 ? (
            <>
              {isMobileView ? (
              <div 
                className="relative h-96 overflow-hidden"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                {/* 현재 스토리만 표시 */}
                {stories[currentIndex] && (
                  <div className="relative w-full h-full">
                    <Card className="overflow-hidden h-full bg-white shadow-lg">
                      {/* 스토리 이미지 */}
                      <div className="relative h-64 bg-gradient-to-br from-purple-500 to-blue-500">
                        <img
                          src={stories[currentIndex].imageUrl}
                          alt="스토리 이미지"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.src = '/placeholder-image.png'
                          }}
                        />
                        
                        {/* 오버레이 그라데이션 */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                        
                        {/* 좋아요/댓글 버튼 */}
                        <div className="absolute bottom-4 right-4 flex gap-3">
                          <button
                            onClick={() => handleLikeToggle(stories[currentIndex].id)}
                            className="w-12 h-12 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-110 cursor-pointer"
                          >
                            {likedStories.has(stories[currentIndex].id) ? (
                              <Heart className="w-5 h-5 text-red-500 fill-current" />
                            ) : (
                              <Heart className="w-5 h-5 text-red-500" />
                            )}
                          </button>
                          
                          <button
                            onClick={() => {
                              console.log('댓글 모달 열기 버튼 클릭:', stories[currentIndex].id)
                              setShowCommentModal(stories[currentIndex].id)
                            }}
                            className="w-12 h-12 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-110 cursor-pointer"
                          >
                            <MessageSquare className="w-5 h-5 text-blue-500" />
                          </button>
                        </div>
                      </div>
                      
                      {/* 스토리 내용 */}
                      <div className="p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-purple-600" />
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-800">{stories[currentIndex].userName}</span>
                            <div className="text-xs text-gray-500">
                              {stories[currentIndex].createdAt.toLocaleTimeString('ko-KR', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </div>
                          </div>
                        </div>
                        
                        <div className="mb-3">
                          <div className="flex items-start gap-2">
                            <p className="text-sm text-gray-700 leading-relaxed flex-1">
                              {stories[currentIndex].translatedText || stories[currentIndex].text}
                            </p>
                            {stories[currentIndex].translatedText && (
                              <span className="text-xs text-blue-500 mt-1">(번역됨)</span>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0 text-gray-400 hover:text-blue-500 mt-1"
                              onClick={() => handleTranslateStory(stories[currentIndex].id)}
                              disabled={translatingStories.has(stories[currentIndex].id)}
                            >
                              <Languages className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>24시간 후 삭제</span>
                          <span>{currentIndex + 1} / {stories.length}</span>
                        </div>
                      </div>
                    </Card>
                  </div>
                )}
                
                {/* 네비게이션 인디케이터 */}
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                  {stories.map((_, index) => (
                    <div
                      key={index}
                      className={`h-1 rounded-full transition-all duration-300 ${
                        index === currentIndex 
                          ? 'bg-white w-8' 
                          : 'bg-white/50 w-2'
                      }`}
                    />
                  ))}
                </div>
              </div>
              ) : (
                /* 데스크톱 뷰 (360px 이상) - 기존 그리드 스타일 */
                <div 
                  className="overflow-x-auto overflow-y-hidden scrollbar-hide story-carousel"
                  style={{
                    scrollbarWidth: 'none', // Firefox
                    msOverflowStyle: 'none', // IE and Edge
                    WebkitOverflowScrolling: 'touch' // iOS smooth scrolling
                  }}
                >
                  <div className="flex gap-4 pb-2" style={{ width: 'max-content' }}>
                    {stories.map((story) => (
                      <div
                        key={story.id}
                        className="relative flex-shrink-0 w-80"
                      >
                        <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 h-full p-3 group">
                          <div className="relative">
                            {/* 스토리 이미지 */}
                            <div className="aspect-square bg-gray-200 relative overflow-hidden rounded-lg">
                              <img
                                src={story.imageUrl}
                                alt="스토리 이미지"
                                className="w-full h-full object-cover cursor-pointer"
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  setSelectedStory(story)
                                  setShowStoryModal(true)
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
                                  {/* 좋아요 버튼 - SMS 인증 필요 */}
                                  <VerificationGuard requiredLevel="sms">
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
                                  </VerificationGuard>
                                  
                                  {/* 댓글 버튼 - SMS 인증 필요 */}
                                  <VerificationGuard requiredLevel="sms">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        console.log('댓글 모달 열기 버튼 클릭:', story.id)
                                        setShowCommentModal(story.id)
                                      }}
                                      className="w-12 h-12 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-110 cursor-pointer"
                                    >
                                      <MessageSquare className="w-5 h-5 text-blue-500" />
                                    </button>
                                  </VerificationGuard>
                                </div>
                              </div>
                            </div>
                            
                            {/* 스토리 내용 */}
                            <div className="p-2">
                              <div className="flex items-center gap-2 mb-1">
                                <div className="w-5 h-5 bg-brand-100 rounded-full flex items-center justify-center">
                                  <User className="w-3 h-3 text-brand-600" />
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleViewProfile(story.userId)
                                  }}
                                  className="text-xs font-medium text-gray-800 hover:text-blue-600 hover:underline transition-colors"
                                >
                                  {story.userName}
                                  <UserBadge totalPoints={0} isVip={false} small />
                                </button>
                              </div>
                              
                              <div className="mb-2">
                                <div className="flex items-start gap-2">
                                  <p className="text-xs sm:text-sm text-gray-600 break-words leading-relaxed flex-1" style={{
                                    display: '-webkit-box',
                                    WebkitLineClamp: 3,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden',
                                    wordBreak: 'break-word'
                                  }}>
                                    {story.translatedText || story.text}
                                  </p>
                                  {story.translatedText && (
                                    <span className="text-xs text-blue-500 mt-1">(번역됨)</span>
                                  )}
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 w-6 p-0 text-gray-400 hover:text-blue-500 mt-1"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleTranslateStory(story.id)
                                    }}
                                    disabled={translatingStories.has(story.id)}
                                  >
                                    <Languages className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                              
                              <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                                <span>{story.createdAt.toLocaleTimeString('ko-KR', { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}</span>
                                <span>24시간 후 삭제</span>
                              </div>
                              
                              {/* 좋아요와 댓글 버튼 */}
                              <div className="flex items-center justify-end gap-4 pt-2 border-t border-gray-100">
                                <VerificationGuard requiredLevel="sms">
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
                                    <span>{t('communityTab.like')}</span>
                                  </button>
                                </VerificationGuard>
                                
                                <VerificationGuard requiredLevel="sms">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      console.log('댓글 모달 열기 버튼 클릭:', story.id)
                                      setShowCommentModal(story.id)
                                    }}
                                    className="flex items-center gap-1 text-xs text-gray-600 hover:text-blue-500 transition-colors"
                                  >
                                    <MessageSquare className="w-4 h-4" />
                                    <span>{t('communityTab.comment')} {story.comment_count || storyComments[story.id]?.length || 0}</span>
                                  </button>
                                </VerificationGuard>
                              </div>
                            </div>
                          </div>
                        </Card>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            /* 스토리가 없을 때 빈 상태 메시지 */
            <div className="text-center py-12">
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                  <Clock className="w-8 h-8 text-gray-400" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {t('communityTab.noStories')}
                  </h3>
                  <p className="text-sm text-gray-500">
                    아직 올라온 스토리가 없습니다.<br />
                    첫 번째 스토리를 올려보세요!
                  </p>
                </div>
              </div>
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

      {/* 댓글 모달 */}
      <Dialog open={!!showCommentModal} onOpenChange={() => setShowCommentModal(null)}>
        <DialogContent className="max-w-md bg-white border border-gray-200 shadow-xl" style={{ backgroundColor: 'white', opacity: 1 }}>
          <DialogHeader>
            <DialogTitle>{t('communityTab.comment')}</DialogTitle>
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
                    <VerificationGuard requiredLevel="sms">
                      <button
                        onClick={() => handleCommentLike(showCommentModal, comment.id)}
                        className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-500"
                      >
                        <Heart className="w-3 h-3" />
                        <span>{comment.likes}</span>
                      </button>
                    </VerificationGuard>
                  </div>
                </div>
              ))}
              
              {showCommentModal && (!storyComments[showCommentModal] || storyComments[showCommentModal].length === 0) && (
                <div className="text-center py-8 text-gray-500">
                  {t('communityTab.noComments')}
                </div>
              )}
            </div>
            
            {/* 댓글 작성 - SMS 인증 필요 */}
            <VerificationGuard requiredLevel="sms">
              <div className="flex gap-2">
                <Input
                  placeholder={t('communityTab.writeComment')}
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
            </VerificationGuard>
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

      {/* 스토리 전체 보기 모달 */}
      <Dialog open={showStoryModal} onOpenChange={setShowStoryModal}>
        <DialogContent className="max-w-4xl w-full h-full max-h-screen bg-white border-2 border-gray-200 shadow-xl">
          <DialogHeader className="sr-only">
            <DialogTitle>스토리 전체 보기</DialogTitle>
          </DialogHeader>
          
          {selectedStory && (
            <div className="flex flex-col items-center justify-center h-full p-8">
              {/* 사용자 정보 */}
              <div className="flex items-center gap-4 mb-6 p-4 bg-gray-50 rounded-xl w-full max-w-2xl">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-tr from-purple-500 via-pink-500 to-yellow-500 p-0.5">
                  <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
                    <div className="w-11 h-11 rounded-full overflow-hidden bg-gray-100">
                      <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                        <span className="text-white font-bold text-lg">
                          {selectedStory.userName?.charAt(0) || 'U'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <button
                    onClick={() => {
                      handleViewProfile(selectedStory.userId)
                      setShowStoryModal(false)
                    }}
                    className="text-lg font-semibold text-gray-800 hover:text-blue-600 hover:underline transition-colors"
                  >
                    {selectedStory.userName || '익명'}
                  </button>
                  <p className="text-sm text-gray-500">
                    {selectedStory.createdAt.toLocaleDateString('ko-KR')}
                  </p>
                </div>
              </div>
              
              {/* 스토리 이미지 */}
              <div className="relative w-full max-w-2xl h-96 mb-6 bg-gradient-to-br from-purple-500 via-pink-500 to-yellow-500 rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src={selectedStory.imageUrl}
                  alt="스토리 이미지"
                  className="w-full h-full object-cover"
                />
              </div>
              
              {/* 스토리 텍스트 내용 */}
              {selectedStory.text && (
                <div className="w-full max-w-2xl mb-6 p-6 bg-gradient-to-br from-gray-50 to-white rounded-2xl shadow-lg border border-gray-200">
                  <div className="flex items-center gap-2 mb-3">
                    <h3 className="text-lg font-semibold text-gray-800">스토리 내용</h3>
                    {selectedStory.translatedText && (
                      <span className="text-xs text-blue-500">(번역됨)</span>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 text-gray-400 hover:text-blue-500"
                      onClick={() => handleTranslateStory(selectedStory.id)}
                      disabled={translatingStories.has(selectedStory.id)}
                    >
                      <Languages className="h-3 w-3" />
                    </Button>
                  </div>
                  <p className="text-gray-700 leading-relaxed text-base whitespace-pre-wrap">
                    {selectedStory.translatedText || selectedStory.text}
                  </p>
                </div>
              )}
              
              {/* 액션 버튼들 */}
              <div className="flex gap-4 mb-6">
                <button
                  onClick={() => {
                    setLikedStories(prev => {
                      const newLiked = new Set(prev)
                      if (newLiked.has(selectedStory.id)) {
                        newLiked.delete(selectedStory.id)
                      } else {
                        newLiked.add(selectedStory.id)
                      }
                      return newLiked
                    })
                  }}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 ${
                    likedStories.has(selectedStory.id) 
                      ? 'bg-red-500 text-white' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <svg 
                    className={`w-6 h-6 transition-all duration-200 ${
                      likedStories.has(selectedStory.id) 
                        ? 'text-white fill-current' 
                        : 'text-gray-400 hover:text-red-400'
                    }`}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                  </svg>
                </button>
              </div>
              
              {/* 닫기 버튼 */}
              <Button
                onClick={() => setShowStoryModal(false)}
                className="bg-gray-600 hover:bg-gray-700 text-white px-8 py-3 rounded-lg text-lg font-medium"
              >
                닫기
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
