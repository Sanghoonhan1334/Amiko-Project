'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  Plus,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Eye,
  User,
  Clock,
  Trophy,
  TrendingUp,
  Star,
  Search,
  Pin,
  ArrowLeft,
  Languages
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import { createSupabaseBrowserClient } from '@/lib/supabase-client'
import { TranslationService } from '@/lib/translation'
import { useRouter } from 'next/navigation'
import PostDetail from './PostDetail'
import PostEditModal from './PostEditModal'
import { CardGridSkeleton } from '@/components/ui/skeleton'
import AuthorName from '@/components/common/AuthorName'

// 게시글 타입 정의
interface Post {
  id: string
  title: string
  content: string
  is_notice: boolean
  is_survey: boolean
  is_verified: boolean
  is_pinned: boolean
  view_count: number
  like_count: number
  dislike_count: number
  comment_count: number
  created_at: string
  updated_at: string
  author: {
    id: string
    full_name: string
    profile_image?: string
  }
  category?: {
    id: string
    name: string
  }
  // 번역된 필드들
  translatedTitle?: string
  translatedContent?: string
}

interface PostListResponse {
  posts: Post[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export default function FreeBoard() {
  const { user, session, token } = useAuth()
  const { t, language } = useLanguage()
  const router = useRouter()
  const supabase = createSupabaseBrowserClient()

  // 번역 서비스 초기화
  const translationService = TranslationService.getInstance()

  // 상태 관리
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [showPostDetail, setShowPostDetail] = useState(false)
  const [showWriteDialog, setShowWriteDialog] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingPost, setEditingPost] = useState<Post | null>(null)
  const [showAnnouncementDialog, setShowAnnouncementDialog] = useState(false)

  // 번역 상태 관리
  const [translatingPosts, setTranslatingPosts] = useState<Set<string>>(new Set())

  // 필터 및 검색
  const [currentCategory, setCurrentCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('latest')
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 0,
    currentPage: 1,
    limit: 10
  })

  // 게시글 작성
  const [writeTitle, setWriteTitle] = useState('')
  const [writeContent, setWriteContent] = useState('')
  const [writeCategory, setWriteCategory] = useState('자유게시판')
  const [writeIsNotice, setWriteIsNotice] = useState(false)
  const [writeIsSurvey, setWriteIsSurvey] = useState(false)
  const [writeSurveyOptions, setWriteSurveyOptions] = useState(['', ''])
  const [writeLoading, setWriteLoading] = useState(false)

  // 공지사항 작성 상태
  const [announcementTitle, setAnnouncementTitle] = useState('')
  const [announcementContent, setAnnouncementContent] = useState('')
  const [announcementLoading, setAnnouncementLoading] = useState(false)
  const [announcementImages, setAnnouncementImages] = useState<string[]>([])
  const [uploadingAnnouncementImages, setUploadingAnnouncementImages] = useState(false)

  // 운영자 권한 체크 (특정 운영자 아이디만 허용)
  const isAdmin = user?.email === 'admin@amiko.com' || user?.email === 'info@helloamiko.com' || user?.email === 'eugenia.arevalo@gmail.com'

  // 디버깅용 로그
  console.log('현재 사용자 정보:', {
    email: user?.email,
    isAdmin: isAdmin,
    user: user
  })

  // 이미지 업로드
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  const [uploadingImages, setUploadingImages] = useState(false)
  const [imagePreviews, setImagePreviews] = useState<string[]>([])

  // 이미지 파일 업로드 핸들러
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    // 이미지 파일만 필터링
    const imageFiles = files.filter(file => file.type.startsWith('image/'))
    if (imageFiles.length === 0) {
      alert(language === 'ko' ? '이미지 파일만 업로드할 수 있습니다.' : 'Solo se pueden subir archivos de imagen.')
      return
    }

    // 파일 크기 제한 (5MB)
    const maxSize = 5 * 1024 * 1024
    const validFiles = imageFiles.filter(file => {
      if (file.size > maxSize) {
        alert(language === 'ko'
          ? `${file.name}은(는) 5MB를 초과합니다.`
          : `${file.name} excede 5MB.`)
        return false
      }
      return true
    })

    if (validFiles.length === 0) return

    // 최대 5개 이미지 제한
    if (uploadedImages.length + validFiles.length > 5) {
      alert(language === 'ko' ? '최대 5개까지 이미지를 업로드할 수 있습니다.' : 'Se pueden subir máximo 5 imágenes.')
      return
    }

    setUploadingImages(true)
    setError(null)

    try {
      // 토큰 가져오기
      let currentToken = token
      if (!currentToken) {
        try {
          const { data: { session: directSession }, error } = await supabase.auth.getSession()
          if (error) {
            console.error('세션 가져오기 실패:', error)
          } else {
            currentToken = directSession?.access_token
          }
        } catch (error) {
          console.error('세션 조회 중 오류:', error)
        }
      }

      if (!currentToken) {
        setError('인증 토큰을 가져올 수 없습니다. 다시 로그인해주세요.')
        return
      }

      // 각 이미지 파일 업로드
      const uploadPromises = validFiles.map(async (file) => {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('folder', 'posts')

        const response = await fetch('/api/upload/image', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${currentToken}`
          },
          body: formData
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || '이미지 업로드에 실패했습니다.')
        }

        const result = await response.json()
        return result.url
      })

      const uploadedUrls = await Promise.all(uploadPromises)
      setUploadedImages(prev => [...prev, ...uploadedUrls])

      // 미리보기 이미지 추가
      validFiles.forEach(file => {
        const reader = new FileReader()
        reader.onload = (e) => {
          setImagePreviews(prev => [...prev, e.target?.result as string])
        }
        reader.readAsDataURL(file)
      })

      console.log('이미지 업로드 완료:', uploadedUrls)

    } catch (err) {
      console.error('이미지 업로드 오류:', err)
      setError(err instanceof Error ? err.message : '이미지 업로드에 실패했습니다.')
    } finally {
      setUploadingImages(false)
    }
  }

  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index))
    setImagePreviews(prev => prev.filter((_, i) => i !== index))
  }

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return '🖼️'
    if (file.type.startsWith('video/')) return '🎥'
    if (file.type.includes('pdf')) return '📄'
    if (file.type.includes('word') || file.type.includes('document')) return '📝'
    if (file.type.includes('excel') || file.type.includes('spreadsheet')) return '📊'
    if (file.type.includes('powerpoint') || file.type.includes('presentation')) return '📈'
    return '📎'
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // 게시글 목록 정렬 (공지글을 맨 위에 고정)
  const sortPosts = (posts: Post[]) => {
    // 원본 배열을 변경하지 않도록 새 배열 생성
    const sorted = [...posts].sort((a, b) => {
      // 공지글은 항상 맨 위에
      if (a.is_notice && !b.is_notice) return -1
      if (!a.is_notice && b.is_notice) return 1

      // 공지글끼리는 생성일 기준 내림차순
      if (a.is_notice && b.is_notice) {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }

      // 일반 게시글끼리는 생성일 기준 내림차순
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

    console.log('[SORT_POSTS] 정렬 결과:', {
      total: sorted.length,
      notices: sorted.filter(p => p.is_notice).length,
      firstPost: sorted[0] ? { title: sorted[0].title, is_notice: sorted[0].is_notice } : null,
      firstNotice: sorted.find(p => p.is_notice) ? { title: sorted.find(p => p.is_notice)!.title } : null
    })

    return sorted
  }

  // 게시글 목록 조회
  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        sort: sortBy
      })

      if (currentCategory !== 'all') {
        params.append('category', currentCategory)
      }

      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim())
      }

      console.log('게시글 목록 요청:', {
        currentCategory,
        searchQuery,
        sortBy,
        currentPage,
        url: `/api/posts?${params}`
      })

      // 타임아웃 설정으로 무한 대기 방지
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000) // 5초 타임아웃

      const response = await fetch(`/api/posts?${params}`, {
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('API Error:', response.status, errorData)
        throw new Error(`게시글 목록을 불러오는데 실패했습니다. (${response.status}: ${errorData.error || 'Unknown error'})`)
      }

      const data: PostListResponse = await response.json()
      console.log('게시글 목록 응답:', data)
      console.log('첫 번째 게시글의 작성자 정보:', data.posts[0]?.author)
      console.log('첫 번째 게시글 is_notice:', data.posts[0]?.is_notice)
      console.log('공지사항 개수:', data.posts?.filter(p => p.is_notice).length || 0)

      // API에서 이미 공지사항이 먼저 정렬되어 반환되므로, 클라이언트 정렬은 생략
      // 만약 정렬이 필요하다면 sortPosts 함수 사용
      // const sortedPosts = sortPosts(data.posts)
      // setPosts(sortedPosts)
      setPosts(data.posts || [])

      // 페이지네이션 정보 업데이트
      setPagination({
        total: data.pagination?.total || 0,
        totalPages: data.pagination?.totalPages || 0,
        currentPage: currentPage,
        limit: 10
      })
    } catch (err) {
      console.error('게시글 목록 조회 실패:', err)

      // AbortError인 경우 타임아웃으로 처리
      if (err instanceof Error && err.name === 'AbortError') {
        console.log('게시글 로딩 타임아웃, 빈 배열 사용')
        setError('요청 시간이 초과되었습니다. 다시 시도해주세요.')
        setPosts([])
      } else {
        setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.')
        setPosts([])
      }
    } finally {
      setLoading(false)
    }
  }, [currentPage, sortBy, currentCategory, searchQuery]) // 의존성 배열에 모든 변수 포함

  // 게시글 작성
  const handleWritePost = async () => {
    // 로그인 체크 먼저
    if (!user) {
      // 로그인 페이지로 이동
      window.location.href = '/sign-in'
      return
    }


    if (!writeTitle.trim() || !writeContent.trim()) {
      setError('제목과 내용을 입력해주세요.')
      return
    }

    // 공지사항 작성 권한 체크
    if (writeIsNotice && !isAdmin) {
      setError('공지사항은 운영자만 작성할 수 있습니다.')
      return
    }

    // 설문조사 선택지 검증
    if (writeIsSurvey) {
      const validOptions = writeSurveyOptions.filter(option => option.trim())
      if (validOptions.length < 2) {
        setError('설문조사는 최소 2개의 선택지가 필요합니다.')
        return
      }
      if (validOptions.length > 10) {
        setError('설문조사는 최대 10개의 선택지만 가능합니다.')
        return
      }
    }

    try {
      setWriteLoading(true)
      setError(null)

      console.log('게시글 작성 시작:', { writeTitle, writeContent, writeCategory, writeIsNotice, writeIsSurvey })

      // AuthContext에서 토큰 가져오기
      let currentToken = token

      // AuthContext에 토큰이 없으면 직접 가져오기
      if (!currentToken) {
        try {
          const { data: { session: directSession }, error } = await supabase.auth.getSession()
          if (error) {
            console.error('세션 가져오기 실패:', error)
          } else {
            currentToken = directSession?.access_token
          }
        } catch (error) {
          console.error('세션 조회 중 오류:', error)
        }
      }

      // 토큰이 없으면 새로고침 시도
      if (!currentToken) {
        try {
          const { data: { session: refreshedSession }, error } = await supabase.auth.refreshSession()
          if (error) {
            console.error('세션 새로고침 실패:', error)
          } else {
            currentToken = refreshedSession?.access_token
          }
        } catch (error) {
          console.error('세션 새로고침 중 오류:', error)
        }
      }

      console.log('토큰 정보:', {
        authContextToken: !!token,
        currentToken: !!currentToken,
        user: !!user
      })

      if (!currentToken) {
        console.log('토큰이 없습니다. 에러 설정')
        setError('인증 토큰을 가져올 수 없습니다. 다시 로그인해주세요.')
        return
      }

      console.log('토큰 확인 완료, 요청 데이터 준비 중')

      // 카테고리 설정 (사용자가 선택한 카테고리 사용)
      let category_name = writeCategory // 사용자가 선택한 카테고리 사용
      if (writeIsNotice) {
        category_name = '공지'
      } else if (writeIsSurvey) {
        category_name = '설문조사'
      }

      // FormData 생성
      const formData = new FormData()
      formData.append('title', writeTitle.trim())
      formData.append('content', writeContent.trim())
      formData.append('category_name', category_name)
      formData.append('is_notice', writeIsNotice.toString())
      formData.append('is_survey', writeIsSurvey.toString())

      if (writeIsSurvey) {
        formData.append('survey_options', JSON.stringify(writeSurveyOptions.filter(option => option.trim())))
      }

      // 업로드된 이미지 URL들 추가
      if (uploadedImages.length > 0) {
        formData.append('uploaded_images', JSON.stringify(uploadedImages))
      }

      console.log('요청 데이터:', {
        title: writeTitle.trim(),
        content: writeContent.trim(),
        category_name,
        is_notice: writeIsNotice,
        is_survey: writeIsSurvey,
        fileCount: attachedFiles.length
      })

      // FormData 내용 확인
      console.log('FormData 내용:')
      for (let [key, value] of formData.entries()) {
        console.log(`${key}:`, value)
      }

      console.log('API 요청 시작')

      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${currentToken}`
          // Content-Type을 명시하지 않음 (FormData 자동 설정)
        },
        body: formData
      })

      console.log('응답 상태:', response.status, response.statusText)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('API 에러:', errorData)

        // 데이터베이스 연결 문제인 경우 사용자 친화적인 메시지 표시
        if (response.status === 500) {
          // 빈 객체이거나 데이터베이스 관련 에러인 경우
          if (!errorData.error || errorData.error.includes('데이터베이스') || errorData.error.includes('연결')) {
            alert(language === 'ko' ? '시스템 점검 중입니다. 잠시 후 다시 시도해주세요.' : 'El sistema está en mantenimiento. Intente de nuevo más tarde.')
            return
          }
        }

        throw new Error(errorData.error || '게시글 작성에 실패했습니다.')
      }

      const responseData = await response.json()
      console.log('작성 성공:', responseData)
      console.log('작성된 게시글의 작성자 정보:', responseData.post?.author)

      // 포인트 획득 시도 (자유게시판 작성)
      if (user?.id && !writeIsNotice) {
        try {
          const pointsResponse = await fetch('/api/community/points', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: user.id,
              activityType: 'freeboard_post',
              postId: responseData.post.id,
              title: writeTitle
            })
          })

          if (pointsResponse.ok) {
            const pointsResult = await pointsResponse.json()
            console.log('포인트 획득 성공:', pointsResult)
            // 포인트 획득 알림은 toast로 표시
            if (typeof window !== 'undefined' && (window as any).toast) {
              (window as any).toast.success(`게시글이 작성되었습니다! +${pointsResult.points}점 획득!`)
            }
          } else {
            const errorData = await pointsResponse.json()
            console.warn('포인트 획득 실패:', errorData)
          }
        } catch (pointsError) {
          console.error('포인트 API 호출 실패:', pointsError)
          // 포인트 지급 실패해도 게시글 작성은 성공으로 처리
        }
      }

      // 작성 성공
      setWriteTitle('')
      setWriteContent('')
      setWriteIsNotice(false)
      setWriteIsSurvey(false)
      setWriteSurveyOptions(['', ''])
      setUploadedImages([])
      setImagePreviews([])
      setShowWriteDialog(false)

      // 목록 새로고침
      await fetchPosts()
    } catch (err) {
      console.error('게시글 작성 실패:', err)
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.')
    } finally {
      setWriteLoading(false)
    }
  }

  // 게시글 클릭
  const handlePostClick = (post: Post) => {
      setSelectedPost(post)
    setShowPostDetail(true)
  }

  // 좋아요/싫어요 토글
  const handleReaction = async (postId: string, reactionType: 'like' | 'dislike') => {
    console.log('[FRONTEND] handleReaction called:', { postId, reactionType, user: user?.id })

    if (!user) {
      console.error('[FRONTEND] No user logged in')
      setError('로그인이 필요합니다.')
      return
    }

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token

      console.log('[FRONTEND] Auth session:', { hasSession: !!session, hasToken: !!token, tokenLength: token?.length })

      if (!token) {
        console.error('[FRONTEND] No auth token available')
        setError('인증 토큰을 가져올 수 없습니다. 다시 로그인해주세요.')
        return
      }

      console.log('[FRONTEND] Making API call to reactions endpoint')
      const response = await fetch(`/api/posts/${postId}/reactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ reaction_type: reactionType })
      })

      console.log('[FRONTEND] API response status:', response.status)

      if (!response.ok) {
        const errorData = await response.json()
        console.error('[FRONTEND] API error:', errorData)
        throw new Error(errorData.error || '반응 처리에 실패했습니다.')
      }

      const responseData = await response.json()
      console.log('[FRONTEND] API success:', responseData)

      // 목록 새로고침
      await fetchPosts()
    } catch (err) {
      console.error('[FRONTEND] handleReaction error:', err)
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.')
    }
  }

  // 검색 실행
  const handleSearch = () => {
    console.log('검색 실행:', searchQuery)
    setCurrentPage(1)
    fetchPosts()
  }

  // 카테고리 변경
  const handleCategoryChange = (category: string) => {
    console.log('카테고리 변경:', category)
    setCurrentCategory(category)
    setCurrentPage(1)
  }

  // 정렬 변경
  const handleSortChange = (sort: string) => {
    console.log('정렬 변경:', sort)
    setSortBy(sort)
    setCurrentPage(1)
  }

  // 게시글 수정 핸들러
  const handleEditPost = (post: Post) => {
    setEditingPost(post)
    setShowEditModal(true)
  }

  // 게시글 번역 핸들러
  const handleTranslatePost = async (post: Post, type: 'title' | 'content') => {
    if (translatingPosts.has(post.id)) return // 이미 번역 중이면 무시

    setTranslatingPosts(prev => new Set(prev).add(post.id))

    try {
      const text = type === 'title' ? post.title : post.content
      const targetLang = language === 'ko' ? 'es' : 'ko'

      const translatedText = await translationService.translate(text, targetLang)

      setPosts(prevPosts =>
        prevPosts.map(p =>
          p.id === post.id
            ? {
                ...p,
                [`translated${type.charAt(0).toUpperCase() + type.slice(1)}`]: translatedText
              }
            : p
        )
      )
    } catch (error) {
      console.error('번역 실패:', error)
      setError('번역에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setTranslatingPosts(prev => {
        const newSet = new Set(prev)
        newSet.delete(post.id)
        return newSet
      })
    }
  }

  // 게시글 수정 완료 핸들러
  const handlePostUpdated = (updatedPost: Post) => {
    // 게시글 목록에서 해당 게시글 업데이트
    setPosts(prevPosts =>
      prevPosts.map(post =>
        post.id === updatedPost.id ? { ...post, ...updatedPost } : post
      )
    )

    // 선택된 게시글이 수정된 게시글이면 업데이트
    if (selectedPost && selectedPost.id === updatedPost.id) {
      setSelectedPost({ ...selectedPost, ...updatedPost })
    }

    setShowEditModal(false)
    setEditingPost(null)
  }

  // 공지사항 작성 핸들러
  const handleAnnouncementSubmit = async () => {
    if (!user || !isAdmin) return

    if (!announcementTitle.trim() || !announcementContent.trim()) {
      alert(language === 'ko' ? '제목과 내용을 모두 입력해주세요.' : 'Por favor, complete el título y el contenido.')
      return
    }

    setAnnouncementLoading(true)

    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: announcementTitle,
          content: announcementContent,
          category: '공지사항',
          is_notice: true,
          is_pinned: true,
          images: announcementImages
        })
      })

      if (!response.ok) {
        throw new Error('공지사항 작성에 실패했습니다.')
      }

      // 성공 시 상태 초기화 및 모달 닫기
      setAnnouncementTitle('')
      setAnnouncementContent('')
      setAnnouncementImages([])
      setShowAnnouncementDialog(false)

      // 게시글 목록 새로고침
      fetchPosts()

      // 공지사항 알림 전송
      await sendAnnouncementNotification(announcementTitle, announcementContent)

      alert(language === 'ko' ? '공지사항이 작성되었습니다.' : 'Se ha publicado el anuncio.')
    } catch (error) {
      console.error('공지사항 작성 실패:', error)
      alert(language === 'ko' ? '공지사항 작성에 실패했습니다.' : 'Error al publicar el anuncio.')
    } finally {
      setAnnouncementLoading(false)
    }
  }

  // 공지사항 이미지 업로드 핸들러
  const handleAnnouncementImageUpload = async (file: File): Promise<string> => {
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error('이미지 업로드에 실패했습니다.')
      }

      const data = await response.json()
      return data.imageUrl
    } catch (error) {
      console.error('이미지 업로드 실패:', error)
      throw error
    }
  }

  // 공지사항 이미지 파일 선택 핸들러
  const handleAnnouncementImageSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setUploadingAnnouncementImages(true)

    try {
      const uploadPromises = Array.from(files).map(file => handleAnnouncementImageUpload(file))
      const uploadedUrls = await Promise.all(uploadPromises)

      setAnnouncementImages(prev => [...prev, ...uploadedUrls])
    } catch (error) {
      alert(language === 'ko' ? '이미지 업로드에 실패했습니다.' : 'Error al subir la imagen.')
    } finally {
      setUploadingAnnouncementImages(false)
    }
  }

  // 공지사항 이미지 삭제 핸들러
  const handleAnnouncementImageRemove = (index: number) => {
    setAnnouncementImages(prev => prev.filter((_, i) => i !== index))
  }

  // 공지사항 알림 전송 함수
  const sendAnnouncementNotification = async (title: string, content: string) => {
    try {
      const response = await fetch('/api/notifications/announcement', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: `📢 새로운 공지사항: ${title}`,
          content: content.substring(0, 200) + (content.length > 200 ? '...' : ''),
          type: 'announcement',
          url: '/community/freeboard'
        })
      })

      if (!response.ok) {
        console.warn('공지사항 알림 전송에 실패했습니다.')
      } else {
        console.log('공지사항 알림이 전송되었습니다.')
      }
    } catch (error) {
      console.error('공지사항 알림 전송 실패:', error)
    }
  }

  // 초기 로드 및 의존성 변경 시 재조회
  useEffect(() => {
    console.log('FreeBoard 마운트됨, 사용자 상태:', { user: !!user })
    fetchPosts()
  }, [currentPage, user, fetchPosts]) // fetchPosts를 의존성에 추가

  // 카테고리, 정렬, 검색어 변경 시 재조회 - fetchPosts가 이미 이 값들을 의존하므로 자동으로 실행됨
  // 별도의 useEffect는 불필요하므로 제거하여 중복 호출 방지

  // 아이콘 렌더링
  const getPostIcon = (post: Post) => {
    if (post.is_notice) return <Pin className="w-4 h-4 text-red-500" />
    if (post.is_survey) return <Trophy className="w-4 h-4 text-green-500" />
    if (post.is_verified) return <Star className="w-4 h-4 text-blue-500" />
    return <MessageSquare className="w-4 h-4 text-gray-400" />
  }

  // 날짜 포맷팅
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ko-KR', {
      month: '2-digit',
      day: '2-digit'
    })
  }

  // 카테고리 옵션
  const categoryOptions = [
    { value: 'all', label: t('freeboard.allPosts') },
    { value: 'notice', label: t('freeboard.notice') },
    { value: '자유게시판', label: t('freeboard.freeBoard') },
    { value: 'survey', label: t('freeboard.survey') }
  ]

  // 정렬 옵션
  const sortOptions = [
    { value: 'latest', label: t('freeboard.latest') },
    { value: 'popular', label: t('freeboard.popular') },
    { value: 'likes', label: t('freeboard.likes') },
    { value: 'comments', label: t('freeboard.comments') }
  ]

  if (loading && posts.length === 0) {
    return (
      <div className="space-y-6 pt-20 md:pt-28">
        <CardGridSkeleton count={6} />
      </div>
    )
  }

  return (
    <div className="space-y-6 pt-20 md:pt-28">
      {/* 에러 메시지 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* 검색 바 */}
      <div className="flex gap-4 items-center">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder={t('freeboard.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="pl-12"
          />
        </div>
        <Button onClick={handleSearch} variant="outline">
          검색
        </Button>
        {searchQuery && (
          <Button
            onClick={() => {
              setSearchQuery('')
              setCurrentPage(1)
              fetchPosts()
            }}
            variant="ghost"
            size="sm"
          >
            초기화
          </Button>
        )}
      </div>

      {/* 디버깅용 운영자 상태 표시 */}
      {user && (
        <div className="mb-4 p-2 bg-yellow-100 border border-yellow-300 rounded text-sm">
          <strong>디버깅 정보:</strong>
          사용자: {user.email} |
          운영자 여부: {isAdmin ? '✅ 운영자' : '❌ 일반 사용자'}
        </div>
      )}

      {/* 필터 및 정렬 */}
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          {categoryOptions.map((option) => (
            <Button
              key={option.value}
              variant={currentCategory === option.value ? "default" : "outline"}
              size="sm"
              onClick={() => handleCategoryChange(option.value)}
              className={`transition-all duration-200 ${
                currentCategory === option.value
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400'
              } active:scale-95 active:bg-blue-200 dark:active:bg-blue-800 active:text-blue-800 dark:active:text-blue-200`}
            >
              {option.label}
            </Button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Select value={sortBy} onValueChange={handleSortChange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* 운영자만 보이는 공지사항 버튼 */}
          {isAdmin && (
            <Dialog open={showAnnouncementDialog} onOpenChange={setShowAnnouncementDialog}>
              <DialogTrigger asChild>
                <Button
                  className="bg-orange-500 hover:bg-orange-600 text-white font-bold border-2 border-orange-600 shadow-lg"
                  onClick={() => {
                    if (!user) {
                      window.location.href = '/sign-in'
                      return
                    }
                    setShowAnnouncementDialog(true)
                  }}
                >
                  <Pin className="w-4 h-4 mr-2" />
                  📢 공지사항
                </Button>
              </DialogTrigger>
            </Dialog>
          )}

          {/* 운영자가 아닌 경우 표시 (디버깅용) */}
          {!isAdmin && user && (
            <div className="text-xs text-gray-500 px-2">
              (운영자가 아님)
            </div>
          )}

          <Dialog open={showWriteDialog} onOpenChange={setShowWriteDialog}>
            <DialogTrigger asChild>
              <Button
                className="bg-blue-400 hover:bg-blue-500 text-white"
                onClick={() => {
                  if (!user) {
                    window.location.href = '/sign-in'
                    return
                  }
                  setShowWriteDialog(true)
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                {t('buttons.write')}
              </Button>
            </DialogTrigger>
            <DialogContent
              className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white border border-gray-200 shadow-xl mx-4"
              style={{
                backgroundColor: 'white',
                opacity: 1,
                zIndex: 1000
              }}
            >
              <DialogHeader>
                <DialogTitle>{t('freeboard.writePost')}</DialogTitle>
                <DialogDescription>
{t('freeboard.writePostDescription')}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {/* 카테고리 선택 */}
                <div>
                  <label className="block text-sm font-medium mb-2">{t('freeboard.category')}</label>
                  <select
                    value={writeCategory}
                    onChange={(e) => setWriteCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="공지사항">{language === 'ko' ? '📢 공지사항' : '📢 Anuncios'}</option>
                    <option value="자유게시판">자유게시판</option>
                    <option value="K-POP">K-POP</option>
                    <option value="K-Drama">K-Drama</option>
                    <option value="팬아트">팬아트</option>
                    <option value="아이돌짤">아이돌짤</option>
                    <option value="뷰티">뷰티</option>
                    <option value="한국어공부">한국어공부</option>
                    <option value="스페인어공부">스페인어공부</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">{t('communityTab.title')}</label>
                  <Input
                    placeholder={t('freeboard.titlePlaceholder')}
                    value={writeTitle}
                    onChange={(e) => setWriteTitle(e.target.value)}
                  />
                </div>


                <div className="space-y-3">
                <div>
                    <label className="block text-sm font-medium mb-2">{t('freeboard.postType')}</label>
                    <div className="flex gap-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="postType"
                          value="normal"
                          checked={!writeIsNotice && !writeIsSurvey}
                          onChange={() => {
                            setWriteIsNotice(false)
                            setWriteIsSurvey(false)
                            setWriteSurveyOptions(['', ''])
                          }}
                          className="mr-2"
                        />
{t('freeboard.normalPost')}
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="postType"
                          value="survey"
                          checked={writeIsSurvey}
                          onChange={() => {
                            setWriteIsNotice(false)
                            setWriteIsSurvey(true)
                            setWriteSurveyOptions(['', ''])
                          }}
                          className="mr-2"
                        />
{t('freeboard.survey')}
                      </label>
                      {isAdmin && (
                        <label className="flex items-center bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg border border-red-200 dark:border-red-800">
                          <input
                            type="radio"
                            name="postType"
                            value="notice"
                            checked={writeIsNotice}
                            onChange={() => {
                              setWriteIsNotice(true)
                              setWriteIsSurvey(false)
                              setWriteSurveyOptions(['', ''])
                            }}
                            className="mr-2"
                          />
                          <span className="text-red-700 dark:text-red-300 font-medium">📌 {t('freeboard.notice')}</span>
                        </label>
                      )}
                    </div>
                  </div>

                  {writeIsSurvey && (
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-sm text-blue-800 mb-2">
💡 {t('freeboard.surveyTips')}
                      </p>
                      <ul className="text-xs text-blue-700 space-y-1">
                        <li>• {t('freeboard.surveyTip1')}</li>
                        <li>• {t('freeboard.surveyTip2')}</li>
                        <li>• {t('freeboard.surveyTip3')}</li>
                      </ul>
                      <div className="mt-3">
                        <label className="block text-sm font-medium mb-2">{t('freeboard.surveyOptions')}</label>
                        <div className="space-y-2">
                          {writeSurveyOptions.map((option, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <span className="text-sm text-gray-500 w-8">{index + 1}.</span>
                              <Input
                                placeholder={`선택지 ${index + 1}`}
                                value={option}
                                onChange={(e) => {
                                  const newOptions = [...writeSurveyOptions]
                                  newOptions[index] = e.target.value
                                  setWriteSurveyOptions(newOptions)
                                }}
                                className="text-sm"
                              />
                              {writeSurveyOptions.length > 2 && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const newOptions = writeSurveyOptions.filter((_, i) => i !== index)
                                    setWriteSurveyOptions(newOptions)
                                  }}
                                  className="text-red-500 hover:text-red-700"
                                >
{t('buttons.delete')}
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (writeSurveyOptions.length < 10) {
                                setWriteSurveyOptions([...writeSurveyOptions, ''])
                              }
                            }}
                            disabled={writeSurveyOptions.length >= 10}
                            className="text-sm"
                          >
                            + 선택지 추가
                          </Button>
                          <span className="text-xs text-gray-500">
                            {writeSurveyOptions.length}/10
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          최소 2개, 최대 10개까지 가능합니다.
                        </p>
                      </div>
                    </div>
                  )}

                  {writeIsNotice && (
                    <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
                      <div className="flex items-center gap-2">
                        <span className="text-red-600 dark:text-red-400 text-lg">📌</span>
                        <div>
                          <p className="text-sm font-medium text-red-800 dark:text-red-300">
                            운영자 전용 공지사항
                          </p>
                          <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                            중요한 안내사항에만 사용해주세요. 모든 사용자에게 맨 위에 고정 표시됩니다.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">내용</label>
                  <Textarea
                    placeholder="내용을 입력하세요"
                    value={writeContent}
                    onChange={(e) => setWriteContent(e.target.value)}
                    rows={8}
                  />
                </div>

                {/* 파일 첨부 섹션 */}
                <div>
                  <label className="block text-sm font-medium mb-2">파일 첨부</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                    <input
                      type="file"
                      multiple
                      accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-upload"
                      disabled={uploadingImages}
                    />
                    <label
                      htmlFor="image-upload"
                      className={`cursor-pointer flex flex-col items-center justify-center py-6 text-gray-600 hover:text-gray-800 ${uploadingImages ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <div className="text-4xl mb-3">📷</div>
                      <div className='text-sm sm:text-base font-medium text-center px-2'>
                        {uploadingImages ? '업로드 중...' : '이미지를 선택하거나 여기에 드래그하세요'}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-500 mt-2 text-center px-2">
                        JPG, PNG, GIF 파일 (최대 5개, 각 5MB 이하)
                      </div>
                    </label>
                  </div>

                  {/* 업로드된 이미지 미리보기 */}
                  {imagePreviews.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <div className="text-sm font-medium text-gray-700 mb-2">업로드된 이미지 ({imagePreviews.length}/5)</div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
                        {imagePreviews.map((preview, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={preview}
                              alt={`첨부 이미지 ${index + 1}`}
                              className="w-full h-24 sm:h-32 object-cover rounded-lg border"
                            />
                            <button
                              onClick={() => removeImage(index)}
                              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs hover:bg-red-600 transition-colors"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowWriteDialog(false)}
                  >
{t('buttons.cancel')}
                  </Button>
                  <Button
                    onClick={() => {
                      console.log('작성 버튼 클릭됨')
                      handleWritePost()
                    }}
                    disabled={writeLoading}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
{writeLoading ? t('buttons.writing') : t('buttons.write')}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>


      {/* 게시글 상세보기 */}
      {showPostDetail && selectedPost ? (
        <div className="space-y-4">
          {/* 목록으로 돌아가기 버튼 */}
          <div className="flex items-center">
            <Button
              variant="outline"
              onClick={() => setShowPostDetail(false)}
              className="flex items-center gap-2 text-xs md:text-sm px-2 md:px-4 py-1 md:py-2"
            >
              <ArrowLeft className="w-3 h-3 md:w-4 md:h-4" />
              {t('freeboard.backToList')}
            </Button>
          </div>

          {/* 게시글 상세 내용 */}
          <PostDetail
            postId={selectedPost.id}
            onBack={() => setShowPostDetail(false)}
            onEdit={() => {
              handleEditPost(selectedPost)
            }}
            onDelete={async () => {
              if (confirm(`${t('freeboard.deleteConfirm')}\n${t('freeboard.deleteConfirmDescription')}`)) {
                try {
                  const response = await fetch(`/api/posts/${selectedPost.id}`, {
                    method: 'DELETE',
                    headers: {
                      'Authorization': `Bearer ${token}`
                    }
                  })

                  if (response.ok) {
                    alert(t('freeboard.deleteSuccess'))
                    setShowPostDetail(false)
                    fetchPosts() // 목록 새로고침
                  } else {
                    alert(t('freeboard.deleteFailed'))
                  }
                } catch (error) {
                  console.error('삭제 오류:', error)
                  alert(t('freeboard.deleteError'))
                }
              }
            }}
          />
        </div>
      ) : (
        /* 게시글 목록 */
        <Card className="mt-8 md:mt-12">
          {loading ? (
            <div className="text-center pt-32 md:pt-40 pb-8 min-h-[50vh] flex items-center justify-center">
              <div>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600 dark:border-gray-400 mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">{t('freeboard.loadingPosts')}</p>
              </div>
            </div>
          ) : error ? (
            <div className="text-center pt-32 md:pt-40 pb-8 min-h-[50vh] flex items-center justify-center">
              <div>
                <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
                <Button onClick={fetchPosts} className="mt-2">{t('freeboard.retry')}</Button>
              </div>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center pt-32 md:pt-40 pb-8 min-h-[50vh] flex items-center justify-center">
              <p className="text-gray-600 dark:text-gray-400">{t('freeboard.noPosts')}</p>
            </div>
          ) : (
            <>
              {/* 게시글 목록 테이블 - 공지사항이 먼저, 그 다음 일반 게시글 */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-600">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">번호</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">말머리</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">{t('communityTab.title')}</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">{t('freeboard.author')}</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">{t('freeboard.createdAt')}</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">{t('freeboard.views')}</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">{t('freeboard.likes')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {/* 공지사항을 맨 위에 먼저 표시 */}
                    {posts.filter(post => post.is_notice).map((post, index) => (
                      <tr
                        key={`notice-${post.id}`}
                        className="hover:bg-orange-50 dark:hover:bg-orange-900/20 cursor-pointer bg-orange-50 dark:bg-orange-900/10 border-l-4 border-orange-500"
                        onClick={() => handlePostClick(post)}
                      >
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                          <span className="flex items-center gap-1 text-orange-600 dark:text-orange-400 font-semibold">
                            <Pin className="w-3 h-3" />
                            {language === 'ko' ? '공지' : 'Anuncio'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                          <div className="flex items-center gap-1">
                            <span className="text-xs">📄</span>
                            <span>{post.category || (language === 'ko' ? '자유게시판' : 'Foro Libre')}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {getPostIcon(post)}
                            {post.images && post.images.length > 0 && (
                              <span className="text-sm">📷</span>
                            )}
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {post.title}
                            </span>
                            {post.comment_count > 0 && (
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                [{post.comment_count}]
                              </span>
                            )}
                            <Badge variant="secondary" className="bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300">
                              <Pin className="w-3 h-3 mr-1" />
                              {language === 'ko' ? '공지' : 'Anuncio'}
                            </Badge>
                            {post.is_pinned && (
                              <Badge variant="secondary" className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300">
                                {language === 'ko' ? '개념글' : 'Destacado'}
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                          <AuthorName
                            userId={post.author?.id}
                            name={post.author?.full_name || (language === 'ko' ? '익명' : 'Anónimo')}
                          />
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                          {formatDate(post.created_at)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                          {post.view_count}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex items-center gap-1">
                            <span className="text-green-600 dark:text-green-400">{post.like_count}</span>
                            <span className="text-gray-400 dark:text-gray-500">-</span>
                            <span className="text-red-600 dark:text-red-400">{post.dislike_count}</span>
                          </div>
                        </td>
                      </tr>
                    ))}

                    {/* 일반 게시글 표시 */}
                    {posts.filter(post => !post.is_notice).map((post, index) => (
                      <tr
                        key={post.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-500 cursor-pointer"
                        onClick={() => handlePostClick(post)}
                      >
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                          {posts.filter(p => !p.is_notice).length - index}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                          <div className="flex items-center gap-1">
                            {getPostIcon(post)}
                            {post.category?.name || '자유게시판'}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 font-medium">
                          <div className="flex items-center gap-2">
                            <span className="truncate max-w-xs">
                              {post.translatedTitle || post.title}
                            </span>
                            {post.translatedTitle && (
                              <span className="text-xs text-blue-500 dark:text-blue-400">
                                (번역됨)
                              </span>
                            )}
                            {post.comment_count > 0 && (
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                [{post.comment_count}]
                              </span>
                            )}
                            {post.is_pinned && (
                              <Badge variant="secondary" className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300">
                                개념글
                              </Badge>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0 text-gray-400 hover:text-blue-500"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleTranslatePost(post, 'title')
                              }}
                              disabled={translatingPosts.has(post.id)}
                            >
                              <Languages className="h-3 w-3" />
                            </Button>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                          <AuthorName
                            userId={post.author?.id}
                            name={post.author?.full_name || '익명'}
                          />
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                          {formatDate(post.created_at)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                          {post.view_count}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex items-center gap-1">
                            <span className="text-green-600 dark:text-green-400">{post.like_count}</span>
                            <span className="text-gray-400 dark:text-gray-500">-</span>
                            <span className="text-red-600 dark:text-red-400">{post.dislike_count}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 페이지네이션 */}
              {pagination.totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 p-4 border-t border-gray-200 dark:border-gray-700">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="bg-white dark:bg-gray-600 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-500"
                  >
                    이전
                  </Button>

                  {/* 페이지 번호들 */}
                  <div className="flex gap-1">
                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      let pageNum;
                      if (pagination.totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= pagination.totalPages - 2) {
                        pageNum = pagination.totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }

                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(pageNum)}
                          className={`min-w-[32px] ${
                            currentPage === pageNum
                              ? 'bg-blue-600 hover:bg-blue-700 text-white'
                              : 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-500'
                          }`}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(pagination.totalPages, prev + 1))}
                    disabled={currentPage === pagination.totalPages}
                    className="bg-white dark:bg-gray-600 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-500"
                  >
                    다음
                  </Button>
                </div>
              )}
            </>
          )}
        </Card>
      )}

      {/* 게시글 수정 모달 */}
      <PostEditModal
        post={editingPost}
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setEditingPost(null)
        }}
        onSave={handlePostUpdated}
      />

      {/* 공지사항 작성 다이얼로그 */}
      <Dialog open={showAnnouncementDialog} onOpenChange={setShowAnnouncementDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white border border-gray-200 shadow-xl mx-4">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900">공지사항 작성</DialogTitle>
            <DialogDescription className="text-gray-600">
              운영자만 작성할 수 있는 공지사항입니다. 작성된 공지사항은 게시글 목록 상단에 고정 표시됩니다.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* 제목 입력 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                제목 *
              </label>
              <Input
                value={announcementTitle}
                onChange={(e) => setAnnouncementTitle(e.target.value)}
                placeholder="공지사항 제목을 입력하세요"
                className="w-full"
                maxLength={100}
              />
            </div>

            {/* 내용 입력 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                내용 *
              </label>
              <Textarea
                value={announcementContent}
                onChange={(e) => setAnnouncementContent(e.target.value)}
                placeholder="공지사항 내용을 입력하세요"
                className="w-full min-h-[300px] resize-none"
                maxLength={5000}
              />
              <div className="text-right text-sm text-gray-500 mt-1">
                {announcementContent.length}/5000
              </div>
            </div>

            {/* 이미지 업로드 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                이미지 첨부 (선택사항)
              </label>

              {/* 이미지 업로드 버튼 */}
              <div className="mb-4">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleAnnouncementImageSelect}
                  className="hidden"
                  id="announcement-image-upload"
                />
                <label
                  htmlFor="announcement-image-upload"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
                >
                  📷 이미지 선택
                </label>
                {uploadingAnnouncementImages && (
                  <span className="ml-2 text-sm text-gray-500">업로드 중...</span>
                )}
              </div>

              {/* 업로드된 이미지 미리보기 */}
              {announcementImages.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                  {announcementImages.map((imageUrl, index) => (
                    <div key={index} className="relative">
                      <img
                        src={imageUrl}
                        alt={`공지사항 이미지 ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => handleAnnouncementImageRemove(index)}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 버튼 */}
            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAnnouncementDialog(false)
                  setAnnouncementTitle('')
                  setAnnouncementContent('')
                  setAnnouncementImages([])
                }}
                disabled={announcementLoading}
              >
                취소
              </Button>
              <Button
                onClick={handleAnnouncementSubmit}
                disabled={announcementLoading || !announcementTitle.trim() || !announcementContent.trim()}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                {announcementLoading ? '작성 중...' : '공지사항 작성'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
