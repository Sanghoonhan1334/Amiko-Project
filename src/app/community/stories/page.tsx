'use client'

import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Heart, MessageSquare, Plus, User, Clock, Image as ImageIcon, Camera, Loader2, X, Calendar, GraduationCap, Briefcase, Trash2 } from 'lucide-react'
import Header from '@/components/layout/Header'
import { useLanguage } from '@/context/LanguageContext'
import { useAuth } from '@/context/AuthContext'
import { toast } from 'sonner'

interface Story {
  id: string
  image_url: string
  text: string
  created_at: string
  likes?: number
  like_count?: number
  comment_count?: number
  comments?: any[]
  user_name?: string
  user_profile_image?: string
  user?: {
    full_name: string
    profile_image_url?: string
  }
}

function StoriesPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t } = useLanguage()
  const { user, token, session } = useAuth()
  const { language } = useLanguage()
  const [stories, setStories] = useState<Story[]>([])
  const [storiesLoading, setStoriesLoading] = useState(true)
  const [showHeartAnimation, setShowHeartAnimation] = useState<string | null>(null)
  const [likedStories, setLikedStories] = useState<Set<string>>(new Set())
  const [selectedStory, setSelectedStory] = useState<Story | null>(null)
  const [showCommentModal, setShowCommentModal] = useState(false)
  const [showStoryViewer, setShowStoryViewer] = useState(false)
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [profileUser, setProfileUser] = useState<any>(null)
  const touchStartX = useRef(0)
  const touchEndX = useRef(0)
  
  // 댓글 관련 상태
  const [commentText, setCommentText] = useState('')
  const [storyComments, setStoryComments] = useState<Record<string, any[]>>({})
  const [isCommenting, setIsCommenting] = useState(false)
  const [isLoadingComments, setIsLoadingComments] = useState(false)
  const [replyToComment, setReplyToComment] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')

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

  // 운영자 권한 확인
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user || !token) {
        setIsAdmin(false)
        return
      }

      try {
        const response = await fetch('/api/admin/check-operator', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (response.ok) {
          const result = await response.json()
          setIsAdmin(result.isOperator || false)
        } else {
          setIsAdmin(false)
        }
      } catch (error) {
        setIsAdmin(false)
      }
    }

    checkAdminStatus()
  }, [user, token])

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
  const loadStories = useCallback(async () => {
    console.log('=== loadStories 함수 호출 ===')
    console.log('현재 token:', token)
    console.log('현재 session:', session)
    console.log('현재 session?.access_token:', session?.access_token)
    
    try {
      setStoriesLoading(true)
      const headers: HeadersInit = {}
      if (token || session?.access_token) {
        headers['Authorization'] = `Bearer ${token || session?.access_token}`
        console.log('=== 토큰 확인 ===')
        console.log('token:', token)
        console.log('session?.access_token:', session?.access_token)
        console.log('사용할 토큰:', token || session?.access_token)
        console.log('Authorization 헤더 추가됨')
      } else {
        console.log('=== 토큰 없음 ===')
        console.log('토큰이 없어서 Authorization 헤더를 추가하지 않음')
      }
      
      console.log('API 요청 시작:', '/api/stories')
      const response = await fetch('/api/stories', { headers })
      if (response.ok) {
        const data = await response.json()
        const convertedStories = (data.stories || []).map((story: any) => {
          console.log('=== 스토리 변환 디버깅 ===')
          console.log('원본 스토리:', story)
          console.log('story.user_name:', story.user_name)
          console.log('story.user_profile_image:', story.user_profile_image)
          
          const converted = {
            ...story,
            user: {
              full_name: story.user_name || '익명',
              profile_image_url: story.user_profile_image
            }
          }
          
          console.log('변환된 스토리:', converted)
          return converted
        })
        setStories(convertedStories)
        
        // 사용자의 좋아요 상태 복원
        if (data.userLikedStories && Array.isArray(data.userLikedStories)) {
          console.log('=== 좋아요 상태 복원 ===')
          console.log('서버에서 받은 좋아요 상태:', data.userLikedStories)
          setLikedStories(new Set(data.userLikedStories))
        }
      } else {
        // 응답이 실패했을 때도 빈 배열로 설정
        console.error('스토리 로드 실패:', response.status)
        setStories([])
      }
    } catch (error) {
      console.error('스토리 로드 오류:', error)
      setStories([])
    } finally {
      setStoriesLoading(false)
    }
  }, [token, session])

  useEffect(() => {
    // 토큰이 있든 없든 스토리 로드 (공개 스토리는 토큰 없이도 볼 수 있어야 함)
    console.log('=== 스토리 로드 시작 ===')
    loadStories()
  }, [loadStories])

  // 시간 포맷 함수
  const formatTime = (dateString: string, isShort = false) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) {
      if (language === 'es') return isShort ? 'ahora' : 'hace un momento'
      return isShort ? '방금' : '방금 전'
    }
    
    if (diffInMinutes < 60) {
      if (language === 'es') return isShort ? `${diffInMinutes}m` : `hace ${diffInMinutes} min`
      return isShort ? `${diffInMinutes}m` : `${diffInMinutes}분 전`
    }
    
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) {
      if (language === 'es') return isShort ? `${diffInHours}h` : `hace ${diffInHours}h`
      return isShort ? `${diffInHours}h` : `${diffInHours}시간 전`
    }
    
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) {
      if (language === 'es') return isShort ? `${diffInDays}d` : `hace ${diffInDays} días`
      return isShort ? `${diffInDays}d` : `${diffInDays}일 전`
    }
    
    if (language === 'es') {
      return date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })
    }
    return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
  }

  // 스토리 클릭 시 전체 화면 뷰어 열기
  const openStoryViewer = (index: number) => {
    setCurrentStoryIndex(index)
    setShowStoryViewer(true)
  }

  // 스토리 뷰어 닫기
  const closeStoryViewer = () => {
    setShowStoryViewer(false)
    setShowProfileModal(false)
    setProfileUser(null)
  }

  // 프로필 모달 열기
  const openProfileModal = async (userId: string) => {
    try {
      const headers: HeadersInit = {}
      if (token || session?.access_token) {
        headers['Authorization'] = `Bearer ${token || session?.access_token}`
      }

      const response = await fetch(`/api/profile?userId=${userId}`, { headers })
      
      if (response.ok) {
        const data = await response.json()
        setProfileUser(data.user)
        setShowProfileModal(true)
      } else {
        toast.error('프로필을 불러올 수 없습니다.')
      }
    } catch (error) {
      console.error('프로필 로드 오류:', error)
      toast.error('프로필을 불러올 수 없습니다.')
    }
  }

  // 다음 스토리로 이동
  const goToNextStory = () => {
    if (currentStoryIndex < stories.length - 1) {
      setCurrentStoryIndex(currentStoryIndex + 1)
    } else {
      closeStoryViewer()
    }
  }

  // 이전 스토리로 이동
  const goToPrevStory = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(currentStoryIndex - 1)
    }
  }

  // 터치 스와이프 핸들러
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    touchEndX.current = e.changedTouches[0].clientX
    handleSwipe()
  }

  const handleSwipe = () => {
    const swipeDistance = touchStartX.current - touchEndX.current
    const minSwipeDistance = 50

    if (Math.abs(swipeDistance) > minSwipeDistance) {
      if (swipeDistance > 0) {
        // 왼쪽으로 스와이프 → 다음 스토리
        goToNextStory()
      } else {
        // 오른쪽으로 스와이프 → 이전 스토리
        goToPrevStory()
      }
    }
  }

  // 마우스 클릭 핸들러 (좌우 클릭에 따른 네비게이션)
  const handleClick = (e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const centerX = rect.width / 2
    
    // 좌측 클릭: 이전 스토리, 우측 클릭: 다음 스토리
    if (clickX < centerX) {
      goToPrevStory()
    } else {
      goToNextStory()
    }
  }

  // 키보드 이벤트 핸들러
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      closeStoryViewer()
    } else if (e.key === 'ArrowLeft') {
      goToPrevStory() // 왼쪽 화살표: 이전 스토리
    } else if (e.key === 'ArrowRight') {
      goToNextStory() // 오른쪽 화살표: 다음 스토리
    }
  }

  // 스토리 좋아요 토글 (Optimistic UI)
  const toggleStoryLike = async (storyId: string) => {
    if (!user) {
      toast.error('로그인이 필요합니다.')
      return
    }

    // Optimistic UI: 즉시 UI 업데이트
    const wasLiked = likedStories.has(storyId)
    
    // 즉시 좋아요 상태 변경
    setLikedStories(prev => {
      const newSet = new Set(prev)
      if (wasLiked) {
        newSet.delete(storyId)
        console.log('좋아요 취소:', storyId)
      } else {
        newSet.add(storyId)
        setShowHeartAnimation(storyId)
        setTimeout(() => setShowHeartAnimation(null), 1000)
        console.log('좋아요 추가:', storyId)
      }
      console.log('업데이트된 좋아요 목록:', Array.from(newSet))
      return newSet
    })
    
    // 즉시 좋아요 수 변경
    setStories(prev => {
      const updated = prev.map(story => {
        if (story.id === storyId) {
          const newLikes = Math.max(0, (story.like_count || 0) + (wasLiked ? -1 : 1))
          console.log(`스토리 ${storyId} 좋아요 수: ${story.like_count || 0} → ${newLikes}`)
          return { ...story, like_count: newLikes }
        }
        return story
      })
      return updated
    })

    // 서버 요청 (백그라운드)
    try {
      const response = await fetch(`/api/stories/${storyId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || session?.access_token}`
        }
      })

      if (response.ok) {
        const result = await response.json()
        const serverIsLiked = result.liked
        
        // 서버 응답과 다르면 롤백
        if (serverIsLiked !== !wasLiked) {
          setLikedStories(prev => {
            const newSet = new Set(prev)
            if (wasLiked) {
              newSet.add(storyId)
            } else {
              newSet.delete(storyId)
            }
            return newSet
          })
          
          setStories(prev => prev.map(story => 
            story.id === storyId 
              ? { ...story, like_count: Math.max(0, (story.like_count || 0) + (wasLiked ? 1 : -1)) }
              : story
          ))
        }
      }
    } catch (error) {
      console.error('좋아요 토글 오류:', error)
      // 에러 시 롤백
      setLikedStories(prev => {
        const newSet = new Set(prev)
        if (wasLiked) {
          newSet.add(storyId)
        } else {
          newSet.delete(storyId)
        }
        return newSet
      })
      
      setStories(prev => prev.map(story => 
        story.id === storyId 
          ? { ...story, like_count: Math.max(0, (story.like_count || 0) + (wasLiked ? 1 : -1)) }
          : story
      ))
    }
  }

  // 댓글 모달 열기
  const openCommentModal = async (story: Story) => {
    setSelectedStory(story)
    setShowCommentModal(true)
    setCommentText('')
    
    // 댓글 로드
    await loadStoryComments(story.id)
  }

  // 댓글 모달 닫기
  const handleCloseCommentModal = () => {
    setShowCommentModal(false)
    setSelectedStory(null)
    setCommentText('')
    setReplyToComment(null)
    setReplyText('')
  }

  // 스토리 댓글 로드
  const loadStoryComments = async (storyId: string) => {
    setIsLoadingComments(true)
    try {
      const response = await fetch(`/api/stories/${storyId}/comments`)
      if (response.ok) {
        const data = await response.json()
        setStoryComments(prev => ({
          ...prev,
          [storyId]: data.comments || []
        }))
      }
    } catch (error) {
      console.error('댓글 로드 실패:', error)
    } finally {
      setIsLoadingComments(false)
    }
  }

  // 댓글 작성
  const handleSubmitComment = async () => {
    if (!selectedStory || !commentText.trim() || !user || !token) {
      return
    }

    setIsCommenting(true)
    try {
      const response = await fetch(`/api/stories/${selectedStory.id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || session?.access_token}`
        },
        body: JSON.stringify({
          content: commentText.trim()
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || '댓글 작성에 실패했습니다.')
      }

      const result = await response.json()

      // 댓글 목록에 추가 (replies 배열 초기화)
      setStoryComments(prev => ({
        ...prev,
        [selectedStory.id]: [
          ...(prev[selectedStory.id] || []),
          { ...result.comment, replies: [] }
        ]
      }))

      // 댓글 수 증가
      setStories(prev => prev.map(story => 
        story.id === selectedStory.id 
          ? { 
              ...story, 
              comments: [...(story.comments || []), result.comment],
              comment_count: (story.comment_count || 0) + 1
            }
          : story
      ))

      setCommentText('')
      
    } catch (error) {
      console.error('댓글 작성 실패:', error)
      toast.error('댓글 작성에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setIsCommenting(false)
    }
  }

  // 댓글 좋아요 토글
  const toggleCommentLike = async (commentId: string) => {
    if (!user || !token) {
      toast.error('로그인이 필요합니다.')
      return
    }

    try {
      const response = await fetch(`/api/stories/comments/${commentId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || session?.access_token}`
        }
      })

      if (response.ok) {
        const result = await response.json()
        const isLiked = result.liked

        // 댓글 상태 업데이트
        if (selectedStory) {
          setStoryComments(prev => ({
            ...prev,
            [selectedStory.id]: prev[selectedStory.id]?.map(comment => 
              comment.id === commentId 
                ? { 
                    ...comment, 
                    is_liked: isLiked,
                    likes_count: comment.likes_count + (isLiked ? 1 : -1)
                  }
                : comment
            ) || []
          }))
        }
      }
    } catch (error) {
      console.error('댓글 좋아요 토글 오류:', error)
      toast.error('좋아요 처리에 실패했습니다.')
    }
  }

  // 답글 작성 시작
  const startReply = (commentId: string, authorName: string) => {
    setReplyToComment(commentId)
    setReplyText('') // @ 멘션 제거, 빈 텍스트로 시작
  }

  // 답글 작성 취소
  const cancelReply = () => {
    setReplyToComment(null)
    setReplyText('')
  }

  // 답글 제출
  const handleSubmitReply = async () => {
    if (!selectedStory || !replyText.trim() || !user || !token || !replyToComment) {
      return
    }

    setIsCommenting(true)
    try {
      const response = await fetch(`/api/stories/${selectedStory.id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || session?.access_token}`
        },
        body: JSON.stringify({
          content: replyText.trim(),
          parent_comment_id: replyToComment
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || '답글 작성에 실패했습니다.')
      }

      const result = await response.json()

      // 답글을 부모 댓글의 replies 배열에 추가
      setStoryComments(prev => ({
        ...prev,
        [selectedStory.id]: prev[selectedStory.id]?.map(comment => {
          if (comment.id === replyToComment) {
            return {
              ...comment,
              replies: [...(comment.replies || []), result.comment]
            }
          }
          return comment
        }) || []
      }))

      // 댓글 수 증가
      setStories(prev => prev.map(story => 
        story.id === selectedStory.id 
          ? { ...story, comment_count: (story.comment_count || 0) + 1 }
          : story
      ))

      setReplyText('')
      setReplyToComment(null)
      
    } catch (error) {
      console.error('답글 작성 실패:', error)
      toast.error('답글 작성에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setIsCommenting(false)
    }
  }

  // 스토리 삭제
  const handleDeleteStory = async (storyId: string, storyUserId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation()
    }
    
    const confirmMessage = language === 'ko' 
      ? '이 스토리를 삭제하시겠습니까?' 
      : '¿Eliminar esta historia?'
    
    if (!confirm(confirmMessage)) return

    try {
      const response = await fetch(`/api/stories/${storyId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token || session?.access_token}`
        }
      })

      if (response.ok) {
        // 스토리 목록에서 제거
        setStories(prev => prev.filter(story => story.id !== storyId))
        
        const successMessage = language === 'ko' 
          ? '스토리가 삭제되었습니다.' 
          : 'Historia eliminada.'
        toast.success(successMessage)
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        toast.error(errorData.error || (language === 'ko' ? '스토리 삭제에 실패했습니다.' : 'Error al eliminar historia.'))
      }
    } catch (error) {
      console.error('스토리 삭제 오류:', error)
      toast.error(language === 'ko' ? '스토리 삭제 중 오류가 발생했습니다.' : 'Error al eliminar historia.')
    }
  }

  // 댓글 삭제 권한 확인
  const canDeleteComment = (commentUserId: string) => {
    if (!user) return false
    // 본인 댓글이거나 관리자인 경우
    return user.id === commentUserId || user.is_admin === true
  }

  // 댓글 삭제
  const handleDeleteComment = async (commentId: string, isReply: boolean = false, parentId?: string) => {
    if (!user || !token || !selectedStory) return
    
    if (!confirm('¿Estás seguro de que quieres eliminar este comentario?')) {
      return
    }

    try {
      const response = await fetch(`/api/stories/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token || session?.access_token}`
        }
      })

      if (!response.ok) {
        throw new Error('Error al eliminar el comentario')
      }

      // 로컬 상태 업데이트
      if (isReply && parentId) {
        // 대댓글 삭제
        setStoryComments(prev => ({
          ...prev,
          [selectedStory.id]: prev[selectedStory.id]?.map(comment => {
            if (comment.id === parentId) {
              return {
                ...comment,
                replies: comment.replies?.filter((reply: any) => reply.id !== commentId) || []
              }
            }
            return comment
          }) || []
        }))
      } else {
        // 일반 댓글 삭제 (대댓글도 함께 삭제됨)
        setStoryComments(prev => ({
          ...prev,
          [selectedStory.id]: prev[selectedStory.id]?.filter(comment => comment.id !== commentId) || []
        }))
      }

      // 댓글 수 감소
      setStories(prev => prev.map(story => 
        story.id === selectedStory.id 
          ? { ...story, comment_count: Math.max(0, (story.comment_count || 0) - 1) }
          : story
      ))

      toast.success('Comentario eliminado correctamente')
    } catch (error) {
      console.error('댓글 삭제 실패:', error)
      toast.error('Error al eliminar el comentario')
    }
  }

  // 이미지 리사이징 및 압축 함수
  const resizeAndCompressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          const MAX_WIDTH = 1080
          const MAX_HEIGHT = 1920
          
          let width = img.width
          let height = img.height
          
          // 비율 유지하면서 리사이징
          if (width > height) {
            if (width > MAX_WIDTH) {
              height = Math.round((height * MAX_WIDTH) / width)
              width = MAX_WIDTH
            }
          } else {
            if (height > MAX_HEIGHT) {
              width = Math.round((width * MAX_HEIGHT) / height)
              height = MAX_HEIGHT
            }
          }
          
          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          ctx?.drawImage(img, 0, 0, width, height)
          
          // JPEG로 변환 (HEIC 포맷 해결) + 80% 품질로 압축
          resolve(canvas.toDataURL('image/jpeg', 0.8))
        }
        img.onerror = () => reject(new Error('이미지 로드 실패'))
        img.src = e.target?.result as string
      }
      reader.onerror = () => reject(new Error('파일 읽기 실패'))
      reader.readAsDataURL(file)
    })
  }

  // 파일 선택 처리
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    console.log('파일 선택 이벤트 발생:', { file: !!file, fileName: file?.name, fileSize: file?.size, fileType: file?.type })
    
    if (file) {
      console.log('파일 선택됨:', file.name, file.size, file.type)
      
      const isVideo = file.type.startsWith('video/')
      const isImage = file.type.startsWith('image/')
      
      // 파일 타입 체크
      if (!isImage && !isVideo) {
        toast.error(language === 'ko' ? '이미지 또는 영상 파일만 업로드 가능합니다.' : 'Solo se pueden subir imágenes o videos.')
        return
      }
      
      // 파일 크기 체크 (이미지: 5MB, 영상: 30MB) - 모바일 최적화
      const maxSize = isVideo ? 30 * 1024 * 1024 : 5 * 1024 * 1024
      if (file.size > maxSize) {
        toast.error(
          language === 'ko' 
            ? `파일 크기는 ${isVideo ? '30MB' : '5MB'} 이하여야 합니다.`
            : `El tamaño del archivo debe ser menor a ${isVideo ? '30MB' : '5MB'}.`
        )
        return
      }
      
      // 영상인 경우 길이 체크 (60초)
      if (isVideo) {
        const video = document.createElement('video')
        video.preload = 'metadata'
        
        video.onloadedmetadata = function() {
          window.URL.revokeObjectURL(video.src)
          
          if (video.duration > 60) {
            toast.error(
              language === 'ko' 
                ? '영상은 최대 60초까지 업로드 가능합니다.'
                : 'Los videos deben durar máximo 60 segundos.'
            )
            return
          }
          
          // 길이 체크 통과 - 파일 저장 및 미리보기
          setSelectedFile(file)
          const reader = new FileReader()
          reader.onload = (e) => {
            setImagePreview(e.target?.result as string)
            console.log('영상 미리보기 생성됨')
          }
          reader.readAsDataURL(file)
        }
        
        video.onerror = function() {
          toast.error(language === 'ko' ? '영상 파일을 읽을 수 없습니다.' : 'No se puede leer el archivo de video.')
        }
        
        video.src = URL.createObjectURL(file)
      } else {
        // 이미지는 리사이징 + 압축 후 미리보기
        try {
          console.log('이미지 리사이징 시작...')
          const compressedImage = await resizeAndCompressImage(file)
          console.log('이미지 리사이징 완료')
          
          // Blob으로 변환하여 파일 크기 확인
          const blob = await fetch(compressedImage).then(r => r.blob())
          console.log('압축 후 크기:', (blob.size / 1024 / 1024).toFixed(2), 'MB')
          
        setSelectedFile(file)
          setImagePreview(compressedImage)
        } catch (error) {
          console.error('이미지 처리 실패:', error)
          toast.error(language === 'ko' ? '이미지 처리 중 오류가 발생했습니다.' : 'Error al procesar la imagen.')
        }
      }
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
    console.log('이미지 미리보기:', { hasPreview: !!imagePreview })
    console.log('스토리 텍스트:', { text: storyText, length: storyText.length })
    
    if (!user) {
      toast.error('로그인이 필요합니다.')
      return
    }
    
    if (!selectedFile || !imagePreview) {
      toast.error('이미지를 선택해주세요.')
      return
    }
    
    setIsUploading(true)
    
    try {
      // 이미 리사이징/압축된 imagePreview 사용 (중복 변환 방지)
      const base64Image = imagePreview
      
      if (!token) {
        throw new Error('인증 토큰이 없습니다.')
      }
      
      // Base64 크기 확인 (디버깅용)
      const sizeInMB = (base64Image.length * 0.75 / 1024 / 1024).toFixed(2)
      console.log('업로드 요청 전송:', { 
        hasImage: !!base64Image, 
        imageSizeMB: sizeInMB,
        textLength: storyText.length,
        hasToken: !!token 
      })
      
      const response = await fetch('/api/stories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || session?.access_token}`
        },
        body: JSON.stringify({
          imageUrl: base64Image,
          text: storyText,
          isPublic: true,
          userId: user.id
        })
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
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">{t('stories.title')}</h1>
            <div className="flex items-center gap-2">
              {/* 이전 버튼 */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const fromHome = searchParams.get('from') === 'home'
                  router.push(fromHome ? '/main?tab=home' : '/main?tab=community')
                }}
                className="flex items-center gap-2 text-gray-800 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white border-2 border-gray-400 dark:border-gray-600 hover:border-gray-500 dark:hover:border-gray-500 bg-white dark:bg-gray-700 shadow-sm hover:shadow-md px-3 py-2"
              >
                <ArrowLeft className="w-4 h-4" />
                {t('buttons.back')}
              </Button>
            </div>
          </div>
          
          {/* 두 번째 줄: 설명과 스토리 올리기 버튼 */}
          <div className="flex items-center justify-between">
            <p className="text-base text-gray-500 dark:text-gray-400">{t('stories.description')}</p>
            
            <Button 
              size="lg"
              className="hidden md:flex text-white px-8 py-4 text-lg rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-110"
              style={{ 
                background: 'linear-gradient(to right, #ff6b9d, #c44569, #8b5cf6)',
                border: 'none',
                color: 'white'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(to right, #ff5a8a, #b83a5e, #7a4ae6)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'linear-gradient(to right, #ff6b9d, #c44569, #8b5cf6)'
              }}
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
              {t('stories.uploadStory')}
            </Button>
          </div>
        </div>
      </div>

      {/* 스토리 컨텐츠 */}
      <div className="max-w-6xl mx-auto px-2 py-4 md:pt-12">
        {storiesLoading ? (
          <div className="grid grid-cols-2 min-[426px]:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-6 2xl:grid-cols-6 gap-2">
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
          <div className="grid grid-cols-2 min-[426px]:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-6 2xl:grid-cols-6 gap-2">
            {stories.map((story, index) => (
              <div 
                key={story.id} 
                className="relative overflow-hidden rounded-xl hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group cursor-pointer" 
                style={{ aspectRatio: '9/16', minHeight: '200px' }}
                onClick={() => openStoryViewer(index)}
              >
                  {story.image_url ? (
                    story.image_url.match(/\.(mp4|webm|ogg|mov)(\?|$)/i) ? (
                      <video
                        src={story.image_url}
                        className="w-full h-full object-cover object-center"
                        loop
                        muted
                        playsInline
                        onMouseEnter={(e) => e.currentTarget.play()}
                        onMouseLeave={(e) => e.currentTarget.pause()}
                        style={{ 
                          userSelect: 'none',
                          WebkitUserSelect: 'none',
                          MozUserSelect: 'none',
                          msUserSelect: 'none'
                        }}
                      />
                    ) : (
                      <img 
                        src={story.image_url} 
                        alt="스토리 이미지" 
                        className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300 select-none"
                        draggable={false}
                        onDragStart={(e) => e.preventDefault()}
                        style={{ 
                          userSelect: 'none',
                          WebkitUserSelect: 'none',
                          MozUserSelect: 'none',
                          msUserSelect: 'none',
                          pointerEvents: 'none'
                        }}
                      />
                    )
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
                  
                  {/* 프로필 정보 - 이미지 위에 직접 오버레이 */}
                  <div className="absolute top-2 left-2 flex items-center gap-1 z-10 story-card-top" style={{ 
                    background: 'none !important', 
                    backgroundColor: 'transparent !important',
                    backgroundImage: 'none !important'
                  }}>
                    <div className="w-5 h-5 rounded-full overflow-hidden bg-white p-0.5">
                      <div className="w-full h-full rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                        {story.user_profile_image ? (
                          <img 
                            src={story.user_profile_image} 
                            alt="프로필" 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-white font-bold text-[10px] drop-shadow-sm">
                            {story.user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-white font-semibold text-[11px] drop-shadow-lg">
                      {story.user?.full_name || '익명'}
                    </p>
                  </div>
                  
                  {/* 삭제 버튼 - 상단 우측 (작성자 본인 또는 관리자, hover 시 표시) */}
                  {(user && (story.user_id === user.id || isAdmin)) && (
                    <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <button
                        onClick={(e) => handleDeleteStory(story.id, story.user_id, e)}
                        className="w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-110"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  
                  {/* 스토리 텍스트 - 이미지 위에 직접 오버레이 */}
                  {story.text && (
                    <div className="absolute bottom-10 left-2 right-2 z-10 story-card-middle" style={{ 
                      background: 'none !important', 
                      backgroundColor: 'transparent !important',
                      backgroundImage: 'none !important'
                    }}>
                      <p className="text-white text-[12px] leading-tight font-medium drop-shadow-lg line-clamp-2">
                        {story.text}
                      </p>
                    </div>
                  )}
                  
                  {/* 하단 액션 버튼들 - 이미지 위에 직접 오버레이 */}
                  <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between z-20 story-card-bottom" style={{ 
                    background: 'none !important', 
                    backgroundColor: 'transparent !important',
                    backgroundImage: 'none !important',
                    backgroundAttachment: 'initial !important',
                    backgroundClip: 'initial !important',
                    backgroundOrigin: 'initial !important',
                    backgroundPosition: 'initial !important',
                    backgroundRepeat: 'initial !important',
                    backgroundSize: 'initial !important'
                  }}>
                    <div className="flex items-center gap-2 text-white" style={{ background: 'none !important', backgroundColor: 'transparent !important' }}>
                      <button 
                        className="flex items-center gap-1 hover:scale-110 transition-transform"
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleStoryLike(story.id)
                        }}
                        style={{ background: 'none !important', backgroundColor: 'transparent !important' }}
                      >
                        <Heart 
                          className={`w-5 h-5 drop-shadow-lg ${likedStories.has(story.id) ? 'fill-red-500 text-red-500' : 'text-white'}`}
                          style={{ 
                            color: likedStories.has(story.id) ? 'rgb(239 68 68) !important' : 'white !important'
                          }}
                        />
                        <span className="text-[11px] drop-shadow-lg font-medium">{story.like_count || 0}</span>
                      </button>
                      <button 
                        className="flex items-center gap-1 hover:scale-110 transition-transform"
                        onClick={(e) => {
                          e.stopPropagation()
                          openCommentModal(story)
                        }}
                        style={{ background: 'none !important', backgroundColor: 'transparent !important' }}
                      >
                        <MessageSquare className="w-5 h-5 drop-shadow-lg" />
                        <span className="text-[11px] drop-shadow-lg font-medium">{story.comment_count || 0}</span>
                      </button>
                    </div>
                    
                    {/* 시간 정보 */}
                    <span 
                      className="text-white/90 text-[8px] min-[365px]:text-[10px] flex items-center gap-1 drop-shadow-lg font-medium" 
                      style={{ background: 'none !important', backgroundColor: 'transparent !important' }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Clock className="w-2.5 h-2.5 min-[365px]:w-3 min-[365px]:h-3" />
                      <span className="block sm:hidden">{formatTime(story.created_at, true)}</span>
                      <span className="hidden sm:block">{formatTime(story.created_at, false)}</span>
                    </span>
                  </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <ImageIcon className="w-10 h-10 text-purple-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-3">{t('stories.noStories')}</h3>
            <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">{t('stories.uploadFirstStory')}</p>
          </div>
        )}
      </div>

      {/* 스토리 업로드 모달 */}
      <Dialog open={showStoryUploadModal} onOpenChange={(open) => {
        // 사용자가 명시적으로 닫기 버튼을 눌렀을 때만 닫기
        if (!open) {
          setShowStoryUploadModal(false)
          clearImage()
          setStoryText('')
        }
      }}>
        <DialogContent 
          className="max-w-md w-[95vw] sm:w-full mx-auto bg-white border-2 border-gray-200 shadow-xl max-h-[85vh] sm:max-h-[90vh] overflow-y-auto z-[99999] p-3 sm:p-6" 
          style={{ 
            backgroundColor: 'white !important',
            background: 'white !important',
            zIndex: '99999 !important'
          }}
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader className="pb-2 sm:pb-4 border-b border-gray-200 bg-white" style={{ 
            backgroundColor: 'white !important',
            background: 'white !important'
          }}>
            <DialogTitle className="text-lg sm:text-xl font-semibold text-gray-900" style={{ 
              color: 'rgb(17 24 39) !important'
            }}>{t('stories.newStory')}</DialogTitle>
            <DialogDescription className="sr-only">새로운 스토리를 작성하는 모달입니다.</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3 sm:space-y-4 bg-white" style={{ 
            backgroundColor: 'white !important',
            background: 'white !important'
          }}>
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block" style={{ 
                color: 'rgb(55 65 81) !important'
              }}>
                {t('stories.photoUpload')}
              </Label>
              
              {/* 이미지/영상 미리보기 */}
              {imagePreview && selectedFile && (
                <div className="mb-2 sm:mb-3 relative">
                  {selectedFile.type.startsWith('video/') ? (
                    <video 
                      src={imagePreview}
                      controls
                      className="w-full h-36 sm:h-48 object-cover rounded-lg border-2 border-gray-200"
                    />
                  ) : (
                    <img 
                      src={imagePreview} 
                      alt="미리보기" 
                      className="w-full h-36 sm:h-48 object-cover rounded-lg border-2 border-gray-200"
                    />
                  )}
                  <button
                    onClick={clearImage}
                    className="absolute top-1 right-1 sm:top-2 sm:right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600 transition-colors"
                  >
                    <X className="w-3 h-3 sm:w-4 sm:h-4" />
                  </button>
                </div>
              )}
              
              {/* 파일 선택 버튼들 */}
              <div className="space-y-2">
                {/* 갤러리에서 선택 */}
                <div className="flex gap-2">
                  <input
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="imageUploadGallery"
                    multiple={false}
                    capture={undefined}
                  />
                  <label
                    htmlFor="imageUploadGallery"
                    className="flex-1 px-3 py-2 sm:px-4 sm:py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-600 dark:border-gray-400 hover:bg-purple-50 transition-colors text-center touch-manipulation"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex flex-col items-center gap-1 sm:gap-2">
                      <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0" />
                      <span className="text-xs sm:text-sm text-gray-600">
                        {imagePreview ? t('stories.selectOtherPhoto') : t('stories.selectFromGallery')}
                      </span>
                    </div>
                  </label>
                </div>
                
                {/* 카메라로 촬영 */}
                <div className="flex gap-2">
                  <input
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="imageUploadCamera"
                    capture="environment"
                    multiple={false}
                  />
                  <label
                    htmlFor="imageUploadCamera"
                    className="flex-1 px-3 py-2 sm:px-4 sm:py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-600 dark:border-gray-400 hover:bg-purple-50 transition-colors text-center touch-manipulation"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex flex-col items-center gap-1 sm:gap-2">
                      <Camera className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0" />
                      <span className="text-xs sm:text-sm text-gray-600">
                        {t('stories.takeWithCamera')}
                      </span>
                    </div>
                  </label>
                </div>
              </div>
            </div>
            
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-1 sm:mb-2 block" style={{ 
                color: 'rgb(55 65 81) !important'
              }}>
                {t('stories.storyContent')}
              </Label>
              <Textarea
                placeholder={t('stories.storyPlaceholder')}
                className="w-full px-2 py-2 sm:px-3 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                rows={3}
                value={storyText}
                onChange={(e) => setStoryText(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                onFocus={(e) => e.stopPropagation()}
              />
            </div>
            
            <div className="flex gap-2 pt-2 sm:pt-4">
              <Button
                variant="outline"
                onClick={() => setShowStoryUploadModal(false)}
                className="flex-1 text-sm py-2 h-9"
              >
                {t('buttons.cancel')}
              </Button>
              <Button
                onClick={handleStoryUpload}
                disabled={isUploading || !selectedFile}
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:bg-gray-400 text-white text-sm py-2 h-9"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 animate-spin" />
                    <span className="text-xs sm:text-sm">{t('stories.uploading')}</span>
                  </>
                ) : (
                  <span className="text-xs sm:text-sm">{t('stories.upload')}</span>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 모바일 플로팅 버튼 - 주제별 게시판과 같은 위치 */}
      {isMobile && (
        <div className="fixed bottom-20 right-4 z-50">
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
                className="text-white px-4 py-2 rounded-full text-sm font-medium mr-1 shadow-lg border-2 border-white transition-all duration-200 hover:scale-105 active:scale-95"
                style={{ 
                  background: 'linear-gradient(to right, #ff6b9d, #c44569, #8b5cf6)',
                  color: 'white'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(to right, #ff5a8a, #b83a5e, #7a4ae6)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(to right, #ff6b9d, #c44569, #8b5cf6)'
                }}
              >
                {t('stories.createStory')}
              </button>
            </div>
            
            {/* 메인 버튼 - 다크모드 토글과 같은 크기 */}
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
              className="w-11 h-11 rounded-full text-white shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center hover:scale-110 active:scale-95"
              style={{ 
                background: 'linear-gradient(to right, #ff6b9d, #c44569, #8b5cf6)',
                color: 'white'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(to right, #ff5a8a, #b83a5e, #7a4ae6)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'linear-gradient(to right, #ff6b9d, #c44569, #8b5cf6)'
              }}
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

      {/* 전체 화면 스토리 뷰어 */}
      {showStoryViewer && (
        <div 
          className="fixed inset-0 z-[9999] bg-black cursor-pointer"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          tabIndex={0}
          style={{ 
            backgroundColor: 'black !important',
            background: 'black !important'
          }}
        >
          
          {/* 닫기 버튼 - 다크모드에서도 강제 표시 */}
          <button
            onClick={closeStoryViewer}
            className="absolute top-4 right-4 z-[10004] w-10 h-10 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors story-viewer-close"
            style={{ 
              backgroundColor: 'rgba(0, 0, 0, 0.5) !important',
              background: 'rgba(0, 0, 0, 0.5) !important',
              color: 'white !important',
              display: 'flex !important',
              visibility: 'visible !important',
              alignItems: 'center !important',
              justifyContent: 'center !important',
              width: '2.5rem !important',
              height: '2.5rem !important',
              position: 'absolute !important',
              top: '1rem !important',
              right: '1rem !important'
            }}
          >
            <div style={{ 
              display: 'flex !important',
              alignItems: 'center !important',
              justifyContent: 'center !important',
              width: '100% !important',
              height: '100% !important',
              position: 'relative !important'
            }}>
              <X 
                className="w-5 h-5" 
                style={{ 
                  color: 'white !important',
                  display: 'block !important',
                  visibility: 'visible !important',
                  margin: '0 !important',
                  padding: '0 !important',
                  position: 'absolute !important',
                  top: '50% !important',
                  left: '50% !important',
                  transform: 'translate(-50%, -50%) !important',
                  width: '1.25rem !important',
                  height: '1.25rem !important'
                }} 
              />
            </div>
          </button>

          {/* 진행 바 - 다크모드에서도 보이도록 강제 스타일 적용 */}
          <div className="absolute top-0 left-0 right-0 z-[10005] px-4 pt-2 story-viewer-progress" style={{ 
            background: 'none !important', 
            backgroundColor: 'transparent !important',
            display: 'block !important',
            visibility: 'visible !important',
            position: 'absolute !important',
            top: '0 !important',
            left: '0 !important',
            right: '0 !important',
            zIndex: '10005 !important'
          }}>
            <div className="flex gap-1" style={{ 
              display: 'flex !important',
              visibility: 'visible !important'
            }}>
              {stories.map((_, index) => (
                <div
                  key={index}
                  className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden"
                  style={{ 
                    background: 'rgba(255, 255, 255, 0.3) !important',
                    backgroundColor: 'rgba(255, 255, 255, 0.3) !important',
                    display: 'block !important',
                    visibility: 'visible !important',
                    height: '2px !important',
                    borderRadius: '9999px !important',
                    overflow: 'hidden !important'
                  }}
                >
                  {index === currentStoryIndex && (
                    <div 
                      className="h-full bg-white rounded-full w-full progress-active"
                      style={{ 
                        background: 'white !important',
                        backgroundColor: 'white !important',
                        display: 'block !important',
                        visibility: 'visible !important',
                        height: '100% !important',
                        width: '100% !important'
                      }}
                    ></div>
                  )}
                  {index < currentStoryIndex && (
                    <div 
                      className="h-full bg-white rounded-full w-full progress-completed"
                      style={{ 
                        background: 'white !important',
                        backgroundColor: 'white !important',
                        display: 'block !important',
                        visibility: 'visible !important',
                        height: '100% !important',
                        width: '100% !important'
                      }}
                    ></div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 사용자 정보 - 다크모드에서도 보이도록 강제 스타일 적용 */}
          {stories[currentStoryIndex] && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                const userId = stories[currentStoryIndex].user_id
                if (userId) {
                  openProfileModal(userId)
                }
              }}
              className="absolute top-6 left-4 right-16 z-[10006] flex items-center gap-2 story-viewer-user-info hover:bg-white/10 rounded-lg px-2 py-1 transition-colors cursor-pointer" 
              style={{ 
                background: 'none !important', 
                backgroundColor: 'transparent !important',
                display: 'flex !important',
                visibility: 'visible !important',
                position: 'absolute !important',
                top: '24px !important',
                left: '16px !important',
                right: '64px !important',
                zIndex: '10006 !important',
                alignItems: 'center !important',
                gap: '8px !important',
                border: 'none !important',
                cursor: 'pointer !important'
              }}
            >
              <div 
                className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center user-avatar"
                style={{ 
                  background: 'linear-gradient(to bottom right, #60a5fa, #a855f7) !important',
                  backgroundColor: 'transparent !important',
                  display: 'flex !important',
                  visibility: 'visible !important',
                  width: '32px !important',
                  height: '32px !important',
                  borderRadius: '50% !important',
                  overflow: 'hidden !important'
                }}
              >
                {stories[currentStoryIndex].user_profile_image ? (
                  <img 
                    src={stories[currentStoryIndex].user_profile_image} 
                    alt="프로필" 
                    className="w-full h-full object-cover"
                    style={{ 
                      width: '100% !important',
                      height: '100% !important',
                      objectFit: 'cover !important',
                      display: 'block !important',
                      visibility: 'visible !important'
                    }}
                  />
                ) : (
                  <span className="text-white font-bold text-[12px] drop-shadow-sm">
                    {stories[currentStoryIndex].user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                )}
              </div>
              <span 
                className="text-white font-semibold text-sm drop-shadow-lg"
                style={{ 
                  color: 'white !important',
                  textShadow: '0 1px 3px rgba(0, 0, 0, 0.5) !important',
                  display: 'inline !important',
                  visibility: 'visible !important',
                  fontSize: '14px !important',
                  fontWeight: '600 !important'
                }}
              >
                {stories[currentStoryIndex].user?.full_name || '익명'}
              </span>
              <span 
                className="text-white/80 text-xs drop-shadow-lg"
                style={{ 
                  color: 'rgba(255, 255, 255, 0.8) !important',
                  textShadow: '0 1px 3px rgba(0, 0, 0, 0.5) !important',
                  display: 'inline !important',
                  visibility: 'visible !important',
                  fontSize: '12px !important'
                }}
              >
                {formatTime(stories[currentStoryIndex].created_at)}
              </span>
            </button>
          )}

          {/* 스토리 이미지 */}
          <div className="w-full h-full flex items-center justify-center relative z-[10001]">
            
            {stories[currentStoryIndex]?.image_url ? (
              <div className="w-full h-full flex items-center justify-center relative z-[10002]">
                {stories[currentStoryIndex].image_url.match(/\.(mp4|webm|ogg|mov)(\?|$)/i) ? (
                  <video
                    src={stories[currentStoryIndex].image_url}
                    className="max-w-full max-h-full object-contain shadow-lg relative z-[10003]"
                    loop
                    autoPlay
                    muted
                    playsInline
                    onContextMenu={(e) => e.preventDefault()}
                    style={{ 
                      userSelect: 'none',
                      WebkitUserSelect: 'none',
                      MozUserSelect: 'none',
                      msUserSelect: 'none'
                    }}
                    onError={(e) => {
                      console.error('❌ 스토리 영상 로드 실패:', stories[currentStoryIndex]?.image_url)
                      e.currentTarget.style.display = 'none'
                    }}
                    onLoadedData={() => {
                      console.log('✅ 스토리 영상 로드 성공:', stories[currentStoryIndex]?.image_url)
                    }}
                  />
                ) : (
                  <img
                    src={stories[currentStoryIndex].image_url}
                    alt="스토리"
                    className="max-w-full max-h-full object-contain shadow-lg relative z-[10003] select-none pointer-events-none"
                    draggable={false}
                    onDragStart={(e) => e.preventDefault()}
                    onDrag={(e) => e.preventDefault()}
                    onDragEnd={(e) => e.preventDefault()}
                    onContextMenu={(e) => e.preventDefault()}
                    style={{ 
                      userSelect: 'none',
                      WebkitUserSelect: 'none',
                      MozUserSelect: 'none',
                      msUserSelect: 'none',
                      WebkitUserDrag: 'none' as any,
                      KhtmlUserSelect: 'none',
                      pointerEvents: 'none'
                    }}
                    onError={(e) => {
                      console.error('❌ 스토리 이미지 로드 실패:', stories[currentStoryIndex]?.image_url)
                      e.currentTarget.style.display = 'none'
                    }}
                    onLoad={() => {
                      console.log('✅ 스토리 이미지 로드 성공:', stories[currentStoryIndex]?.image_url)
                    }}
                  />
                )}
              </div>
            ) : stories[currentStoryIndex] ? (
              <div className="text-black text-center bg-red-500 p-4 rounded">
                <p className="text-lg mb-2">⚠️ 이미지 URL이 없습니다</p>
                <p className="text-sm text-black/80">URL: {stories[currentStoryIndex]?.image_url || '없음'}</p>
                <p className="text-xs text-black/60 mt-2">스토리 인덱스: {currentStoryIndex}</p>
              </div>
            ) : (
              <div className="text-black text-center bg-yellow-500 p-4 rounded">
                <p className="text-lg mb-2">⚠️ 스토리 데이터가 없습니다</p>
                <p className="text-sm text-black/80">인덱스: {currentStoryIndex}</p>
                <p className="text-xs text-black/60 mt-2">배열 길이: {stories.length}</p>
              </div>
            )}
          </div>

          {/* 스토리 텍스트 */}
          <div className="absolute bottom-24 left-0 right-0 z-40 px-4" style={{ 
            position: 'absolute !important',
            bottom: '6rem !important',
            left: '0 !important',
            right: '0 !important',
            zIndex: '10009 !important',
            padding: '0 1rem !important'
          }}>
            <p className="text-white text-center drop-shadow-lg text-lg" style={{ 
              color: 'white !important',
              textAlign: 'center !important',
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.5) !important',
              fontSize: '1.125rem !important',
              display: 'block !important',
              visibility: 'visible !important'
            }}>
              {stories[currentStoryIndex].text}
            </p>
          </div>

          {/* 좋아요/댓글 버튼 */}
          <div className="absolute bottom-6 left-0 right-0 z-[10010] px-4 flex items-center justify-center gap-8 story-viewer-actions" style={{ 
            display: 'flex !important',
            visibility: 'visible !important',
            position: 'absolute !important',
            bottom: '2rem !important',
            left: '50% !important',
            transform: 'translateX(-50%) !important',
            zIndex: '10010 !important',
            padding: '0 !important',
            alignItems: 'center !important',
            justifyContent: 'center !important',
            gap: '2rem !important',
            width: 'auto !important'
          }}>
            <button
              onClick={(e) => {
                e.stopPropagation()
                toggleStoryLike(stories[currentStoryIndex].id)
              }}
              className="flex items-center gap-2 text-white hover:scale-110 transition-transform"
              style={{ 
                display: 'flex !important',
                visibility: 'visible !important',
                color: 'white !important',
                alignItems: 'center !important',
                gap: '0.5rem !important'
              }}
            >
              <Heart
                className={`w-6 h-6 drop-shadow-lg ${likedStories.has(stories[currentStoryIndex].id) ? 'fill-red-500 text-red-500' : 'text-white'}`}
                style={{ 
                  width: '1.5rem !important',
                  height: '1.5rem !important',
                  color: likedStories.has(stories[currentStoryIndex].id) ? 'rgb(239 68 68) !important' : 'white !important',
                  filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5)) !important',
                  display: 'block !important',
                  visibility: 'visible !important'
                }}
              />
              <span className="text-sm font-semibold drop-shadow-lg" style={{ 
                fontSize: '0.875rem !important',
                fontWeight: '600 !important',
                color: 'white !important',
                textShadow: '0 2px 4px rgba(0, 0, 0, 0.5) !important',
                display: 'inline !important',
                visibility: 'visible !important'
              }}>
                {stories[currentStoryIndex].like_count || 0}
              </span>
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation()
                openCommentModal(stories[currentStoryIndex])
              }}
              className="flex items-center gap-2 text-white hover:scale-110 transition-transform"
              style={{ 
                display: 'flex !important',
                visibility: 'visible !important',
                color: 'white !important',
                alignItems: 'center !important',
                gap: '0.5rem !important'
              }}
            >
              <MessageSquare 
                className="w-6 h-6 drop-shadow-lg text-white" 
                style={{ 
                  width: '1.5rem !important',
                  height: '1.5rem !important',
                  color: 'white !important',
                  filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5)) !important',
                  display: 'block !important',
                  visibility: 'visible !important'
                }}
              />
              <span className="text-sm font-semibold drop-shadow-lg" style={{ 
                fontSize: '0.875rem !important',
                fontWeight: '600 !important',
                color: 'white !important',
                textShadow: '0 2px 4px rgba(0, 0, 0, 0.5) !important',
                display: 'inline !important',
                visibility: 'visible !important'
              }}>
                {stories[currentStoryIndex].comment_count || 0}
              </span>
            </button>
          </div>

          {/* 네비게이션 영역 (좌/우 클릭) */}
          <div className="absolute inset-0 flex">
            {/* 왼쪽 절반 클릭 → 이전 */}
            <div 
              className="flex-1 cursor-pointer"
              onClick={goToPrevStory}
            ></div>
            {/* 오른쪽 절반 클릭 → 다음 */}
            <div 
              className="flex-1 cursor-pointer"
              onClick={goToNextStory}
            ></div>
          </div>

          {/* 좌우 화살표 (데스크톱) */}
          {currentStoryIndex > 0 && (
            <button
              onClick={goToPrevStory}
              className="hidden md:block absolute left-4 top-1/2 -translate-y-1/2 z-40 w-12 h-12 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
            >
              ‹
            </button>
          )}
          {currentStoryIndex < stories.length - 1 && (
            <button
              onClick={goToNextStory}
              className="hidden md:block absolute right-4 top-1/2 -translate-y-1/2 z-40 w-12 h-12 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
            >
              ›
            </button>
          )}
        </div>
      )}

      {/* Instagram 스타일 댓글 모달 */}
      {showCommentModal && selectedStory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[99999] p-4" style={{ 
          zIndex: '99999 !important',
          position: 'fixed !important',
          top: '0 !important',
          left: '0 !important',
          right: '0 !important',
          bottom: '0 !important'
        }}>
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[85vh] flex flex-col overflow-hidden" style={{ 
            zIndex: '100000 !important',
            position: 'relative !important'
          }}>
            {/* Instagram 스타일 헤더 */}
            <div className="flex items-center justify-between p-4 border-b bg-white">
              <button
                onClick={handleCloseCommentModal}
                className="text-gray-500 hover:text-gray-700 p-1"
              >
                <X className="w-6 h-6" />
              </button>
              <h3 className="text-lg font-semibold">{t('communityTab.comment')}</h3>
              <div className="w-6 h-6"></div> {/* 공간 맞추기 */}
            </div>

            {/* 댓글 목록 - 간단한 스타일 */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {isLoadingComments ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                  <span className="ml-2 text-gray-500">{t('stories.loadingComments')}</span>
                </div>
              ) : storyComments[selectedStory.id]?.length > 0 ? (
                storyComments[selectedStory.id].map((comment) => (
                  <div key={comment.id} className="border-b border-gray-200 pb-4">
                    {/* 원본 댓글 */}
                    <div className="flex gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-300 flex-shrink-0 flex items-center justify-center">
                        <span className="text-gray-600 text-sm font-semibold">
                          {comment.author?.full_name?.charAt(0).toUpperCase() || 'U'}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-semibold text-sm">
                            {comment.author?.full_name || t('freeboard.anonymous')}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(comment.created_at).toLocaleDateString(language === 'es' ? 'es-ES' : 'ko-KR')}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap mb-2">{comment.content}</p>
                        
                        {/* 답글 및 삭제 버튼 */}
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => startReply(comment.id, comment.author?.full_name || 'User')}
                            className="text-xs text-purple-600 hover:text-purple-800 font-medium"
                          >
                            Responder
                          </button>
                          
                          {/* 삭제 버튼 (본인 또는 관리자만) */}
                          {canDeleteComment(comment.user_id) && (
                            <button
                              onClick={() => handleDeleteComment(comment.id)}
                              className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Eliminar</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 답글 목록 (계단식) */}
                    {comment.replies && comment.replies.length > 0 && (
                      <div className="ml-12 mt-3 space-y-3">
                        {comment.replies.map((reply: any) => (
                          <div key={reply.id} className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-purple-200 flex-shrink-0 flex items-center justify-center">
                              <span className="text-purple-700 text-xs font-semibold">
                                {reply.author?.full_name?.charAt(0).toUpperCase() || 'U'}
                              </span>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold text-xs">
                                  {reply.author?.full_name || t('freeboard.anonymous')}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {new Date(reply.created_at).toLocaleDateString(language === 'es' ? 'es-ES' : 'ko-KR')}
                                </span>
                              </div>
                              <p className="text-xs text-gray-700 whitespace-pre-wrap mb-2">{reply.content}</p>
                              
                              {/* 답글 삭제 버튼 (본인 또는 관리자만) */}
                              {canDeleteComment(reply.user_id) && (
                                <button
                                  onClick={() => handleDeleteComment(reply.id, true, comment.id)}
                                  className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700"
                                >
                                  <Trash2 className="w-2.5 h-2.5" />
                                  <span>Eliminar</span>
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <MessageSquare className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500 font-medium">{t('communityTab.noComments')}</p>
                  <p className="text-gray-400 text-sm mt-1">{t('communityTab.firstComment')}</p>
                </div>
              )}
            </div>

            {/* 답글 작성 중 표시 */}
            {replyToComment && (
              <div className="p-4 border-t bg-white">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-purple-600 font-medium">Escribir respuesta</span>
                  <button
                    onClick={cancelReply}
                    className="text-gray-500 hover:text-gray-700 text-sm"
                  >
                    Cancelar
                  </button>
                </div>
                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-purple-500 rounded-full flex-shrink-0 flex items-center justify-center">
                    <span className="text-white text-xs font-semibold">
                      {user?.email?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div className="flex-1">
                    <Textarea
                      placeholder="Escribe una respuesta..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          handleSubmitReply()
                        }
                      }}
                      className="w-full text-sm resize-none"
                      rows={2}
                    />
                    <div className="flex justify-end gap-2 mt-2">
                      <button
                        onClick={cancelReply}
                        className="px-3 py-1 text-xs text-gray-600 hover:text-gray-800"
                      >
                        Cancelar
                      </button>
                      <Button 
                        onClick={handleSubmitReply}
                        disabled={!replyText.trim() || isCommenting}
                        size="sm"
                        className="text-xs"
                      >
                        {isCommenting ? t('communityTab.posting') : 'Responder'}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 댓글 작성 - Instagram 스타일 */}
            <div className="p-4 border-t bg-white">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden">
                  {user?.user_metadata?.avatar_url ? (
                    <img
                      src={user.user_metadata.avatar_url}
                      alt="내 프로필"
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-xs font-medium text-gray-600">
                      {user?.user_metadata?.full_name?.[0] || '?'}
                    </span>
                  )}
                </div>
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder={replyToComment ? t('communityTab.cancelReply') : t('communityTab.writeComment')}
                    disabled={!!replyToComment}
                    className="w-full px-3 py-2 border border-gray-200 rounded-full focus:outline-none focus:border-gray-400 text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                    maxLength={500}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey && !replyToComment) {
                        e.preventDefault()
                        handleSubmitComment()
                      }
                    }}
                  />
                  {commentText.length > 0 && !replyToComment && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <button
                        onClick={handleSubmitComment}
                        disabled={!commentText.trim() || isCommenting}
                        className="text-blue-500 font-semibold text-sm hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isCommenting ? t('communityTab.posting') : t('communityTab.post')}
                      </button>
                    </div>
                  )}
                </div>
              </div>
              {(commentText.length > 400 || replyText.length > 400) && (
                <div className="text-xs text-gray-400 mt-2 text-right">
                  {replyToComment ? replyText.length : commentText.length}/500
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 프로필 모달 */}
      {showProfileModal && profileUser && (
        <div className="fixed inset-0 z-[10010] flex items-center justify-center bg-black/80">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
            {/* 모달 헤더 */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {t('profile.title')}
              </h2>
              <button
                onClick={() => setShowProfileModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* 프로필 내용 */}
            <div className="p-6">
              {/* 프로필 이미지와 기본 정보 */}
              <div className="flex items-center gap-4 mb-6">
                <Avatar className="w-16 h-16">
                  <AvatarImage 
                    src={profileUser.main_profile_image || profileUser.profile_image || profileUser.avatar_url} 
                    alt={profileUser.full_name} 
                  />
                  <AvatarFallback className="text-xl">
                    {profileUser.full_name?.charAt(0)?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    {profileUser.full_name}
                  </h3>
                  {profileUser.korean_name && (
                    <p className="text-gray-600 dark:text-gray-400">
                      {profileUser.korean_name}
                    </p>
                  )}
                  {profileUser.spanish_name && (
                    <p className="text-gray-600 dark:text-gray-400">
                      {profileUser.spanish_name}
                    </p>
                  )}
                  {profileUser.nickname && (
                    <p className="text-sm text-blue-600 dark:text-blue-400">
                      @{profileUser.nickname}
                    </p>
                  )}
                </div>
              </div>

              {/* 한 줄 소개 */}
              {profileUser.one_line_intro && (
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  {profileUser.one_line_intro}
                </p>
              )}

              {/* 기본 정보 */}
              <div className="space-y-3 mb-6">
                {profileUser.user_type && (
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {profileUser.user_type === 'student' ? t('profile.student') : 
                       profileUser.user_type === 'worker' ? t('profile.worker') : 
                       profileUser.user_type === 'graduate' ? t('profile.graduate') : profileUser.user_type}
                    </span>
                  </div>
                )}
                
                {profileUser.join_date && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {t('profile.joinDate')}: {new Date(profileUser.join_date).toLocaleDateString('ko-KR')}
                    </span>
                  </div>
                )}
              </div>

              {/* 학업/직업 정보 */}
              {(profileUser.university || profileUser.major || profileUser.occupation || profileUser.company) && (
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
                    {t('profile.academicCareerInfo')}
                  </h4>
                  <div className="space-y-2">
                    {profileUser.university && (
                      <div className="flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {t('profile.university')}: {profileUser.university}
                        </span>
                      </div>
                    )}
                    
                    {profileUser.major && (
                      <div className="flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {t('profile.major')}: {profileUser.major}
                        </span>
                      </div>
                    )}
                    
                    {profileUser.occupation && (
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {t('profile.occupation')}: {profileUser.occupation}
                        </span>
                      </div>
                    )}
                    
                    {profileUser.company && (
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {t('profile.company')}: {profileUser.company}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 관심사 */}
              {profileUser.interests && profileUser.interests.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
                    {t('profile.interests')}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {profileUser.interests.map((interest: string, index: number) => (
                      <Badge key={index} variant="outline">
                        {interest}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* 자기소개 */}
              {profileUser.introduction && (
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
                    {t('profile.introduction')}
                  </h4>
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap text-sm">
                    {profileUser.introduction}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* 스토리 뷰어가 열리지 않는 경우 디버깅 */}
      {showStoryViewer && !stories[currentStoryIndex] && (
        <div className="fixed inset-0 z-50 bg-red-500 flex items-center justify-center">
          <div className="text-white text-center">
            <h2 className="text-2xl mb-4">⚠️ 스토리 뷰어 오류</h2>
            <p className="mb-2">showStoryViewer: {String(showStoryViewer)}</p>
            <p className="mb-2">currentStoryIndex: {currentStoryIndex}</p>
            <p className="mb-2">stories.length: {stories.length}</p>
            <p className="mb-2">stories[currentStoryIndex]: {String(stories[currentStoryIndex])}</p>
            <button 
              onClick={() => setShowStoryViewer(false)}
              className="bg-white text-red-500 px-4 py-2 rounded mt-4"
            >
              닫기
            </button>
          </div>
        </div>
      )}

    </div>
  )
}

export default function StoriesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600 dark:border-gray-400 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    }>
      <StoriesPageContent />
    </Suspense>
  )
}
