'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import { useTheme } from 'next-themes'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase-client'
import { toast } from 'sonner'
import { TranslationService } from '@/lib/translation'
import { 
  MessageSquare, 
  ThumbsUp, 
  Eye, 
  Calendar, 
  User, 
  Search,
  Plus,
  Filter,
  ChevronDown,
  Clock,
  TrendingUp,
  Star,
  X,
  ArrowLeft,
  Globe
} from 'lucide-react'
import AuthConfirmDialog from '@/components/common/AuthConfirmDialog'
import { Skeleton } from '@/components/ui/skeleton'
import AuthorName from '@/components/common/AuthorName'

interface Post {
  id: string
  title: string
  content: string
  category_id: string
  category_name: string
  author_name: string
  author_id?: string | null
  created_at: string
  views: number
  likes: number
  comments_count: number
  is_pinned?: boolean
  is_hot?: boolean
  is_notice?: boolean
}

interface Category {
  id: string
  name: string
  icon: string
}

interface FreeBoardListProps {
  showHeader?: boolean
  onPostSelect?: (post: Post) => void
}

const FreeBoardList: React.FC<FreeBoardListProps> = ({ showHeader = true, onPostSelect }) => {
  const { user, token } = useAuth()
  const { language, t } = useLanguage()
  const { theme } = useTheme()
  const router = useRouter()
  
  // 번역 서비스 초기화
  const translationService = TranslationService.getInstance()
  
  // LibreTranslate 무료 번역 서비스 설정
  useEffect(() => {
    translationService.setProvider('libretranslate')
  }, [])
  
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalPosts, setTotalPosts] = useState(0)
  const [sortBy, setSortBy] = useState('latest')
  const itemsPerPage = 10
  const [selectedCategory, setSelectedCategory] = useState('free')
  const [showAuthDialog, setShowAuthDialog] = useState(false)
  const [hasMobileNavigation, setHasMobileNavigation] = useState(false)
  const [selectedBoard, setSelectedBoard] = useState(language === 'es' ? 'Todos' : '전체')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const [isFabExpanded, setIsFabExpanded] = useState(false)
  const [showPostModal, setShowPostModal] = useState(false)
  const [postTitle, setPostTitle] = useState('')
  const [postContent, setPostContent] = useState('')
  const [postCategory, setPostCategory] = useState('')
  
  // 공지사항 관련 상태
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false)
  const [announcementTitle, setAnnouncementTitle] = useState('')
  const [announcementContent, setAnnouncementContent] = useState('')
  const [announcementLoading, setAnnouncementLoading] = useState(false)
  const [announcementImages, setAnnouncementImages] = useState<string[]>([])
  const [uploadingAnnouncementImages, setUploadingAnnouncementImages] = useState(false)
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [uploadingImages, setUploadingImages] = useState(false)
  const [abortController, setAbortController] = useState<AbortController | null>(null)
  const [isSubmittingPost, setIsSubmittingPost] = useState(false)
  
  // 번역 상태 관리
  const [isTranslating, setIsTranslating] = useState(false)
  const [translatedPosts, setTranslatedPosts] = useState<Post[]>([])
  const [translationMode, setTranslationMode] = useState<'none' | 'ko-to-es' | 'es-to-ko'>('none')
  
  // 운영자 권한 체크
  const isAdmin = user?.email === 'admin@amiko.com' || user?.email === 'info@helloamiko.com'

  const categories: Category[] = [
    { id: 'announcement', name: language === 'ko' ? '📢 공지사항' : '📢 Anuncios', icon: '📢' },
    { id: 'free', name: t('community.categories.free'), icon: '' },
    { id: 'kpop', name: t('community.categories.kpop'), icon: '' },
    { id: 'kdrama', name: t('community.categories.kdrama'), icon: '' },
    { id: 'beauty', name: t('community.categories.beauty'), icon: '' },
    { id: 'korean', name: t('community.categories.korean'), icon: '' },
    { id: 'spanish', name: t('community.categories.spanish'), icon: '' }
  ]

  const boardOptions = [
    { id: 'all', name: language === 'es' ? 'Todos' : '전체', icon: '' },
    { id: 'announcement', name: language === 'ko' ? '📢 공지사항' : '📢 Anuncios', icon: '📢' },
    { id: 'free', name: language === 'es' ? 'Foro Libre' : '자유게시판', icon: '' },
    { id: 'kpop', name: language === 'es' ? 'Foro K-POP' : 'K-POP', icon: '' },
    { id: 'kdrama', name: language === 'es' ? 'Foro K-Drama' : 'K-Drama', icon: '' },
    { id: 'beauty', name: language === 'es' ? 'Foro de Belleza' : '뷰티', icon: '' },
    { id: 'korean', name: language === 'es' ? 'Foro de Coreano' : '한국어공부', icon: '' },
    { id: 'spanish', name: language === 'es' ? 'Foro de Español' : '스페인어공부', icon: '' }
  ]

  // 언어 변경 시 기본값 업데이트
  useEffect(() => {
    setSelectedBoard(language === 'es' ? 'Todos' : '전체')
  }, [language])

  // 모바일 네비게이션 감지
  useEffect(() => {
    const checkMobileNavigation = () => {
      setHasMobileNavigation(window.innerWidth < 768)
    }
    
    checkMobileNavigation()
    window.addEventListener('resize', checkMobileNavigation)
    
    return () => window.removeEventListener('resize', checkMobileNavigation)
  }, [])

  // 글쓰기 모달 열기
  const handleOpenPostModal = () => {
    if (!user) {
      router.push('/sign-in')
      return
    }
    setShowPostModal(true)
    setIsFabExpanded(false)
  }

  // 공지사항 모달 열기
  const handleOpenAnnouncementModal = () => {
    if (!user) {
      router.push('/sign-in')
      return
    }
    setShowAnnouncementModal(true)
    setIsFabExpanded(false)
  }

  // 공지사항 작성 함수
  const handleAnnouncementSubmit = async () => {
    if (!user || !isAdmin) return
    
    if (!announcementTitle.trim() || !announcementContent.trim()) {
      toast.error('제목과 내용을 모두 입력해주세요.')
      return
    }

    setAnnouncementLoading(true)
    
    try {
      console.log('공지사항 작성 시작:', {
        title: announcementTitle,
        contentLength: announcementContent.length,
        imagesCount: announcementImages.length,
        userEmail: user?.email
      })

      const requestData = {
        title: announcementTitle,
        content: announcementContent,
        category: '', // 공지사항은 빈칸으로 설정
        is_notice: true,
        is_pinned: true,
        images: announcementImages
        // gallery_id 제거 - API에서 기본값 처리
      }

      console.log('요청 데이터:', requestData)

      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      })

      console.log('응답 상태:', response.status)

      if (!response.ok) {
        const errorData = await response.json()
        console.error('API 에러 응답:', errorData)
        throw new Error(errorData.error || '공지사항 작성에 실패했습니다.')
      }

      const result = await response.json()
      console.log('공지사항 작성 성공:', result)

      // 성공 시 상태 초기화 및 모달 닫기
      setAnnouncementTitle('')
      setAnnouncementContent('')
      setAnnouncementImages([])
      setShowAnnouncementModal(false)
      
      // 게시글 목록 새로고침
      loadPosts()
      
      toast.success('공지사항이 작성되었습니다.')
    } catch (error) {
      console.error('공지사항 작성 실패:', error)
      toast.error(error instanceof Error ? error.message : '공지사항 작성에 실패했습니다.')
    } finally {
      setAnnouncementLoading(false)
    }
  }

  // 공지사항 이미지 업로드 핸들러
  const handleAnnouncementImageUpload = async (file: File): Promise<string> => {
    try {
      // 먼저 AuthContext에서 사용자 정보 확인
      if (!user) {
        throw new Error('로그인이 필요합니다.')
      }

      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', 'announcements')

      // Supabase 클라이언트 생성
      const supabase = createSupabaseBrowserClient()
      
      // 세션에서 토큰 가져오기
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        console.error('세션 에러:', sessionError)
        throw new Error('세션을 가져올 수 없습니다.')
      }
      
      if (!session?.access_token) {
        console.error('토큰이 없습니다. 세션:', session)
        throw new Error('인증 토큰을 가져올 수 없습니다. 다시 로그인해주세요.')
      }
      
      const token = session.access_token
      console.log('토큰 가져오기 성공:', token.slice(0, 20) + '...')

      const response = await fetch('/api/upload/image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('이미지 업로드 API 에러:', errorData)
        throw new Error(errorData.error || '이미지 업로드에 실패했습니다.')
      }

      const data = await response.json()
      console.log('이미지 업로드 성공:', data.url)
      return data.url
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
      toast.error('이미지 업로드에 실패했습니다.')
    } finally {
      setUploadingAnnouncementImages(false)
    }
  }

  // 공지사항 이미지 삭제 핸들러
  const handleAnnouncementImageRemove = (index: number) => {
    setAnnouncementImages(prev => prev.filter((_, i) => i !== index))
  }

  // 번역 함수들
  const handleTranslateToSpanish = async () => {
    if (isTranslating) return
    await performTranslation('ko', 'es')
  }

  const handleTranslateToKorean = async () => {
    if (isTranslating) return
    await performTranslation('es', 'ko')
  }

  const performTranslation = async (sourceLang: 'ko' | 'es', targetLang: 'ko' | 'es') => {
    setIsTranslating(true)
    try {
      const postsToTranslate = posts

      const translatedPostsData = await Promise.all(
        postsToTranslate.map(async (post) => {
          try {
            const [translatedTitle, translatedContent] = await Promise.all([
              translationService.translate(post.title, targetLang, sourceLang),
              translationService.translate(post.content, targetLang, sourceLang)
            ])

            return {
              ...post,
              translatedTitle,
              translatedContent
            }
          } catch (error) {
            console.error('번역 실패:', error)
            // 번역 실패 시 원본 텍스트 반환
            return {
              ...post,
              translatedTitle: post.title,
              translatedContent: post.content
            }
          }
        })
      )

      setTranslatedPosts(translatedPostsData)
      setTranslationMode(sourceLang === 'ko' ? 'ko-to-es' : 'es-to-ko')
      toast.success('번역이 완료되었습니다.')
    } catch (error) {
      console.error('번역 오류:', error)
      toast.error('번역 중 오류가 발생했습니다.')
    } finally {
      setIsTranslating(false)
    }
  }

  // 원본으로 돌아가기
  const handleShowOriginal = () => {
    setTranslationMode('none')
  }

  // 검색 핸들러
  const handleSearch = (query: string) => {
    setSearchQuery(query)
    // 검색어가 변경되면 첫 페이지로 이동
    setCurrentPage(1)
  }

  // 탭 핸들러
  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    setCurrentPage(1) // 탭 변경 시 첫 페이지로 이동
  }

  // 게시판 변경 핸들러
  const handleBoardChange = (board: string) => {
    console.log('[BOARD_CHANGE] 게시판 변경:', board)
    
    // 이전 요청 취소
    if (abortController) {
      abortController.abort()
    }
    
    setSelectedBoard(board)
    setCurrentPage(1)
    setPosts([]) // 이전 데이터 즉시 초기화
    setTotalPages(1)
    setTotalPosts(0)
    setLoading(true)
    // loadPosts는 useEffect에서 자동으로 호출됨
  }

  // 검색어에 따라 게시글 필터링 - 단순화
  const filteredPosts = posts.filter(post => {
    // 추천글 탭의 경우 3일 이내 글만 표시
    if (activeTab === 'recommended') {
      const threeDaysAgo = new Date()
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
      const postDate = new Date(post.created_at)
      
      if (postDate < threeDaysAgo) {
        return false // 3일 이상 된 글은 추천글에서 제외
      }
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      return (
        post.title.toLowerCase().includes(query) ||
        post.content.toLowerCase().includes(query) ||
        post.author_name.toLowerCase().includes(query)
      )
    }
    return true
  })

  // 탭에 따라 게시글 정렬 (공지사항은 항상 먼저)
  const sortedPosts = [...filteredPosts].sort((a, b) => {
    // 공지사항은 항상 맨 위에
    if (a.is_notice && !b.is_notice) return -1
    if (!a.is_notice && b.is_notice) return 1
    
    // 공지사항끼리는 생성일 기준 내림차순
    if (a.is_notice && b.is_notice) {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    }
    
    // 일반 게시글은 탭에 따라 정렬
    switch (activeTab) {
      case 'recommended':
        // 추천순: 좋아요 수 + 조회수 조합
        return (b.likes * 2 + b.views) - (a.likes * 2 + a.views)
      case 'popular':
        // 인기글: 좋아요 수 기준
        return b.likes - a.likes
      case 'latest':
        // 최신글: 작성일 기준
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      case 'all':
      default:
        // 전체글: 기본 정렬 (최신순)
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    }
  })

  // 글쓰기 모달 닫기
  const handleClosePostModal = () => {
    setShowPostModal(false)
    setPostTitle('')
    setPostContent('')
    setPostCategory('')
    setUploadedImages([])
    setImagePreviews([])
  }

  // 이미지 업로드 처리
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setUploadingImages(true)
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        if (file.size > 5 * 1024 * 1024) {
          throw new Error('파일 크기는 5MB를 초과할 수 없습니다.')
        }

        const formData = new FormData()
        formData.append('file', file)

        const response = await fetch('/api/upload/image', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData,
        })

        if (!response.ok) {
          throw new Error('이미지 업로드 실패')
        }

        const data = await response.json()
        return data.url
      })

      const urls = await Promise.all(uploadPromises)
      setUploadedImages(prev => [...prev, ...urls])
      
      // 미리보기 생성
      const previews = Array.from(files).map(file => URL.createObjectURL(file))
      setImagePreviews(prev => [...prev, ...previews])
      
      toast.success(language === 'es' ? '¡Imagen subida exitosamente!' : '이미지가 업로드되었습니다!')
    } catch (error) {
      console.error('이미지 업로드 실패:', error)
      toast.error(language === 'es' ? 'Error al subir la imagen.' : '이미지 업로드에 실패했습니다.')
    } finally {
      setUploadingImages(false)
    }
  }

  // 이미지 제거
  const handleRemoveImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index))
    setImagePreviews(prev => prev.filter((_, i) => i !== index))
  }

  // 글 작성 완료
  const handleSubmitPost = async () => {
    // 중복 요청 방지
    if (isSubmittingPost) {
      console.log('[POST_CREATE] 이미 제출 중 - 중복 요청 무시')
      return
    }

    console.log('[POST_CREATE] 글쓰기 시작:', {
      postTitle,
      postContent: postContent.substring(0, 50),
      postCategory,
      uploadedImages: uploadedImages.length
    })

    if (!postCategory) {
      toast.error(language === 'es' ? 'Por favor selecciona un foro.' : '게시판을 선택해주세요.')
      return
    }

    if (!postTitle.trim() || !postContent.trim()) {
      toast.error(language === 'es' ? 'Por favor ingresa título y contenido.' : '제목과 내용을 모두 입력해주세요.')
      return
    }

    setIsSubmittingPost(true) // 제출 상태 설정

    try {
      // 카테고리별 갤러리 ID 매핑
      const categoryGalleryMap: { [key: string]: string } = {
        'free': 'free',
        'kpop': 'kpop',
        'kdrama': 'drama',
        'beauty': 'beauty',
        'korean': 'korean',
        'spanish': 'spanish'
      }

      const galleryId = categoryGalleryMap[postCategory] || 'free'
      console.log('[POST_CREATE] 갤러리 ID 매핑:', { postCategory, galleryId })
      
      console.log('[POST_CREATE] API 요청 준비:', {
        url: '/api/posts',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token ? '토큰있음' : '토큰없음'}`
        },
        body: {
          gallery_id: galleryId,
          title: postTitle,
          content: postContent.substring(0, 50) + '...',
          images: uploadedImages.length,
          category_name: categories.find(cat => cat.id === postCategory)?.name || '자유게시판'
        }
      })
      
      console.log('[POST_CREATE] fetch 요청 시작...')
      
        const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          gallery_id: galleryId,
          title: postTitle,
          content: postContent,
          images: uploadedImages,
          category_name: categories.find(cat => cat.id === postCategory)?.name || '자유게시판'
        })
      })
      
      console.log('[POST_CREATE] fetch 응답 받음:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      })

      if (response.ok) {
        toast.success(t('community.postCreatedSuccess'))
        handleClosePostModal()
        
        // 작성한 카테고리로 필터 변경
        const categoryName = categories.find(cat => cat.id === postCategory)?.name || '자유게시판'
        setSelectedBoard(categoryName)
        
        // 게시글 목록 새로고침
        loadPosts()
      } else {
        toast.error(t('community.postCreateFailed'))
      }
    } catch (error) {
      console.error('[POST_CREATE] 게시글 작성 실패:', error)
      console.error('[POST_CREATE] 에러 상세:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      })
      toast.error(t('community.postCreateError'))
    } finally {
      setIsSubmittingPost(false) // 제출 상태 해제
    }
  }

  // 화면 클릭 시 확장된 상태 닫기
  useEffect(() => {
    if (isFabExpanded) {
      const handleClickOutside = () => {
        setIsFabExpanded(false)
      }
      
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [isFabExpanded])

  // 게시글 로딩 - AbortController 지원
  const loadPosts = async () => {
    // 이전 요청 취소
    if (abortController) {
      abortController.abort()
    }
    
    // 새로운 AbortController 생성
    const newController = new AbortController()
    setAbortController(newController)
    
    setLoading(true)
    try {
      console.log('[LOAD_POSTS] 게시글 로딩 시작:', { selectedBoard })
      
      // 게시판 이름을 갤러리 슬러그로 변환
      const boardToSlugMap: { [key: string]: string } = {
        '전체': 'all',
        'Todos': 'all',
        '📢 공지사항': 'announcement',
        '📢 Anuncios': 'announcement',
        '공지사항': 'announcement',
        'Anuncios': 'announcement',
        '자유게시판': 'free',
        'Foro Libre': 'free',
        'K-POP': 'kpop',
        'Foro K-POP': 'kpop',
        'K-Drama': 'drama',
        'Foro K-Drama': 'drama',
        '뷰티': 'beauty',
        'Foro de Belleza': 'beauty',
        '한국어': 'korean',
        '한국어공부': 'korean',
        'Foro de Coreano': 'korean',
        '스페인어': 'spanish',
        '스페인어공부': 'spanish',
        'Foro de Español': 'spanish'
      }
      
      const gallerySlug = boardToSlugMap[selectedBoard] || 'free'
      console.log('[LOAD_POSTS] 갤러리 슬러그:', gallerySlug)
      
      // 페이지네이션 파라미터 추가
      const offset = (currentPage - 1) * itemsPerPage
      const limit = itemsPerPage
      
      // API URL 구성
      let apiUrl
      if (gallerySlug === 'all') {
        // 전체 선택 시 모든 게시판의 글을 가져오기
        apiUrl = `/api/posts?page=${currentPage}&limit=${limit}&offset=${offset}`
      } else if (gallerySlug === 'announcement') {
        // 공지사항 선택 시 카테고리로 필터링
        apiUrl = `/api/posts?category=공지사항&page=${currentPage}&limit=${limit}&offset=${offset}`
      } else {
        // 특정 갤러리 선택 시
        apiUrl = `/api/posts?gallery=${gallerySlug}&page=${currentPage}&limit=${limit}&offset=${offset}`
      }
      
      console.log('[LOAD_POSTS] API URL:', apiUrl)
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        signal: newController.signal // AbortController 시그널 추가
      })

      console.log('[LOAD_POSTS] API 응답 상태:', response.status)

      if (!response.ok) {
        console.error('[LOAD_POSTS] API 응답 실패:', response.status, response.statusText)
        const errorText = await response.text()
        console.error('[LOAD_POSTS] 오류 응답 내용:', errorText)
        throw new Error(`게시글을 불러오는데 실패했습니다. (${response.status})`)
      }

      const data = await response.json()
      console.log('[LOAD_POSTS] API 응답 데이터:', data)
      console.log('[LOAD_POSTS] 게시글 개수:', data.posts?.length || 0)
      console.log('[LOAD_POSTS] 첫 번째 게시글:', data.posts?.[0])

      if (data.success && data.posts) {
        // API 응답을 Post 인터페이스에 맞게 변환
        const transformedPosts = data.posts.map((post: any) => ({
          id: post.id,
          title: post.title,
          content: post.content,
          category_id: post.category_id || 'general',
          category_name: post.category || '자유게시판',
          author_id: post.author?.id || null,
          author_name: post.author?.full_name || (post.is_notice ? (language === 'es' ? 'Administrador' : '운영자') : (language === 'es' ? 'Anónimo' : '익명')),
          created_at: post.created_at,
          views: post.view_count || 0,
          likes: post.like_count || 0,
          comments_count: post.comment_count || 0,
          is_pinned: post.is_pinned || false,
          is_hot: post.is_hot || false,
          is_notice: post.is_notice || false // is_notice 필드 추가
        }))

        console.log('[LOAD_POSTS] 변환된 게시글:', transformedPosts.length, '개')
        console.log('[LOAD_POSTS] 첫 번째 게시글 is_notice:', transformedPosts[0]?.is_notice)
        console.log('[LOAD_POSTS] 공지사항 개수:', transformedPosts.filter(p => p.is_notice).length)
        
        // API에서 이미 공지사항이 먼저 정렬되어 반환되므로, 클라이언트 정렬은 생략
        // API 응답 순서를 그대로 사용
        setPosts(transformedPosts)
        
        // 페이지네이션 정보 업데이트
        const total = data.total || transformedPosts.length
        const totalPagesCount = Math.ceil(total / itemsPerPage)
        setTotalPosts(total)
        setTotalPages(totalPagesCount)
        
        console.log('[LOAD_POSTS] 페이지네이션 정보:', {
          total,
          totalPages: totalPagesCount,
          currentPage,
          itemsPerPage
        })
      } else {
        console.log('[LOAD_POSTS] 성공하지 않음 또는 게시글 없음')
        setPosts([])
        setTotalPosts(0)
        setTotalPages(1)
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('[LOAD_POSTS] 요청 취소됨')
        return
      }
      console.error('[LOAD_POSTS] 게시글 로딩 실패:', error)
      setPosts([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPosts()
  }, [selectedBoard, currentPage, sortBy])

  const formatDate = (dateString: string) => {
    // 한국 시간 기준으로 변환
    const date = new Date(dateString)
    const koreaTime = new Date(date.toLocaleString("en-US", {timeZone: "Asia/Seoul"}))
    const now = new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Seoul"}))
    
    const diffInMinutes = Math.floor((now.getTime() - koreaTime.getTime()) / (1000 * 60))
    const diffInHours = Math.floor(diffInMinutes / 60)
    const diffInDays = Math.floor(diffInHours / 24)
    
    // 오늘인지 확인 (한국 시간 기준)
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const postDate = new Date(koreaTime.getFullYear(), koreaTime.getMonth(), koreaTime.getDate())
    
    if (postDate.getTime() === today.getTime()) {
      // 오늘 올린 글: 시간 표시
      if (diffInMinutes < 1) return t('community.postDetail.timeAgo.now')
      if (diffInMinutes < 60) return t('community.postDetail.timeAgo.minutes', { count: diffInMinutes.toString() })
      return t('community.postDetail.timeAgo.hours', { count: diffInHours.toString() })
    } else if (diffInDays === 1) {
      // 어제 올린 글
      return t('community.postDetail.timeAgo.yesterday')
    } else {
      // 그 이전: 날짜 표시
      const locale = language === 'es' ? 'es-ES' : 'ko-KR'
      return koreaTime.toLocaleDateString(locale, { month: 'short', day: 'numeric' })
    }
  }

  const getCategoryIcon = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId)
    return category ? category.icon : ''
  }

  const translateCategoryName = (categoryName: string) => {
    // 한국어 카테고리명을 번역
    const categoryMap: { [key: string]: string } = {
      '자유게시판': language === 'es' ? 'Foro Libre' : '자유게시판',
      'K-POP': language === 'es' ? 'K-POP' : 'K-POP',
      'K-Drama': language === 'es' ? 'K-Drama' : 'K-Drama',
      '뷰티': language === 'es' ? 'Belleza' : '뷰티',
      '한국어': language === 'es' ? 'Coreano' : '한국어',
      '스페인어': language === 'es' ? 'Español' : '스페인어'
    }
    return categoryMap[categoryName] || categoryName
  }

  const formatNumber = (num: number | undefined) => {
    if (num === undefined || num === null) {
      return '0'
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k'
    }
    return num.toString()
  }

  return (
    <div className="space-y-4 sm:space-y-6 pt-8 md:pt-12">
      {/* 웹 형태일 때 섹션 카드 래퍼 */}
      <div className="hidden md:block">
        <Card className="p-6 bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 rounded-xl">
          <div className="space-y-4 sm:space-y-6">
            {/* 페이지 제목 - 드롭다운 */}
            <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
              {/* 왼쪽 끝에 이전 버튼 */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/main?tab=community')}
                className="flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 border border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 bg-white dark:bg-gray-700 shadow-sm hover:shadow-md px-3 py-2 text-xs font-medium"
              >
                <ArrowLeft className="w-4 h-4" />
                {t('buttons.back')}
              </Button>
              
              {/* 웹용 정렬 드롭다운 - 카테고리 탭 왼쪽 */}
              <div className="hidden md:flex items-center gap-4">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('community.labels.sort')}</span>
                <Select value={activeTab} onValueChange={handleTabChange}>
                  <SelectTrigger className="w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('community.tabs.all')}</SelectItem>
                    <SelectItem value="recommended">{t('community.tabs.recommended')}</SelectItem>
                    <SelectItem value="popular">{t('community.tabs.popular')}</SelectItem>
                    <SelectItem value="latest">{t('community.tabs.latest')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 웹용 카테고리 드롭다운 */}
              <div className="hidden md:flex items-center gap-4">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('community.labels.topic')}</span>
                <Select value={selectedBoard} onValueChange={handleBoardChange}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {boardOptions.map((board) => (
                      <SelectItem key={board.id} value={board.name}>
                        <span>{board.name}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 번역 드롭다운 */}
              <div className="hidden md:flex items-center">
                {translationMode === 'none' ? (
                  <Select onValueChange={(value) => {
                    if (value === 'ko-to-es') {
                      handleTranslateToSpanish()
                    } else if (value === 'es-to-ko') {
                      handleTranslateToKorean()
                    }
                  }}>
                    <SelectTrigger className="w-40 text-xs">
                      <div className="flex items-center gap-1">
                        <Globe className="w-3 h-3" />
                        <SelectValue placeholder={t('community.translateSelect')} />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ko-to-es" disabled={isTranslating}>
                        {t('community.translateKoToEs')}
                      </SelectItem>
                      <SelectItem value="es-to-ko" disabled={isTranslating}>
                        {t('community.translateEsToKo')}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Button
                    onClick={handleShowOriginal}
                    variant="outline"
                    size="sm"
                    className="text-xs flex items-center gap-1"
                  >
                    <ArrowLeft className="w-3 h-3" />
                    {t('community.showOriginal')}
                  </Button>
                )}
              </div>
              
              {/* 모바일: 드롭다운 */}
              <div className="md:hidden">
                <Select value={selectedBoard} onValueChange={handleBoardChange}>
                  <SelectTrigger className="w-auto border-none shadow-none text-lg font-bold text-gray-800 bg-transparent">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {boardOptions.map((board) => (
                      <SelectItem key={board.id} value={board.name}>
                        <span>{board.name}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* 공지사항 버튼 (운영자만) */}
              {isAdmin && (
                <Button
                  onClick={handleOpenAnnouncementModal}
                  className="bg-gradient-to-r from-orange-400 to-red-500 hover:from-orange-500 hover:to-red-600 text-white px-4 py-2 text-sm font-medium shadow-lg hover:shadow-xl transition-all duration-300 mr-2 min-w-fit"
                >
                  📢 공지사항
                </Button>
              )}
              
              {/* 글쓰기 버튼 */}
              <Button
                onClick={handleOpenPostModal}
                className="text-white px-4 py-2 text-xs font-medium shadow-lg hover:shadow-xl transition-all duration-300"
                style={{ 
                  background: 'linear-gradient(to right, rgb(59 130 246), rgb(147 51 234))',
                  border: 'none',
                  color: 'white'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(to right, rgb(37 99 235), rgb(126 34 206))'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(to right, rgb(59 130 246), rgb(147 51 234))'
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                {t('community.writePost')}
              </Button>
            </div>

            {/* 헤더 - showHeader가 true일 때만 표시 */}
            {showHeader && (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
                <div className="flex items-center gap-2 sm:gap-3">
                  <Filter className="w-5 h-5 text-gray-600" />
                  <span className="text-xs font-medium text-gray-700">카테고리</span>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          <span>{category.name}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center gap-2">
                  {/* 정렬 드롭다운 */}
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="latest">최신순</SelectItem>
                      <SelectItem value="popular">인기순</SelectItem>
                      <SelectItem value="views">조회순</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Button 
                    onClick={async () => {
                      try {
                        if (!user && !token) {
                          setShowAuthDialog(true)
                          return
                        }
                        
                        if (!user) {
                          setShowAuthDialog(true)
                          return
                        }
                        
                        router.push('/community/post/create')
                      } catch (error) {
                        console.error('인증 상태 확인 오류:', error)
                        setShowAuthDialog(true)
                      }
                    }} 
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    {t('community.writePost')}
                  </Button>
                </div>
              </div>
            )}

            {/* 게시글 목록 */}
            {loading ? (
              <div className="p-4 space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-start space-x-3">
                      <Skeleton className="w-10 h-10 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-full" />
                        <Skeleton className="h-3 w-2/3" />
                        <div className="flex items-center space-x-4 pt-2">
                          <Skeleton className="h-3 w-12" />
                          <Skeleton className="h-3 w-12" />
                          <Skeleton className="h-3 w-16" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {sortedPosts.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <MessageSquare className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-base font-medium text-gray-900 mb-2">
                      {searchQuery.trim() 
                        ? (language === 'ko' ? '검색 결과가 없습니다' : 'No search results')
                        : (language === 'ko' ? '게시글이 없습니다' : 'No posts yet')
                      }
                    </h3>
                    <p className="text-sm text-gray-500 mb-4">
                      {searchQuery.trim()
                        ? (language === 'ko' ? '다른 검색어로 시도해보세요' : 'Try a different search term')
                        : (language === 'ko' ? '첫 번째 게시글을 작성해보세요!' : 'Be the first to write a post!')
                      }
                    </p>
                  </div>
                ) : (
                  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <table className="w-full">
                      <thead style={{ backgroundColor: theme === 'dark' ? 'rgb(55 65 81)' : 'rgb(249 250 251)' }}>
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: theme === 'dark' ? 'rgb(229 231 235)' : 'rgb(17 24 39)' }}>{t('freeboard.board')}</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: theme === 'dark' ? 'rgb(229 231 235)' : 'rgb(17 24 39)' }}>{t('freeboard.title')}</th>
                          <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider" style={{ color: theme === 'dark' ? 'rgb(229 231 235)' : 'rgb(17 24 39)' }}>{t('freeboard.writer')}</th>
                          <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider" style={{ color: theme === 'dark' ? 'rgb(229 231 235)' : 'rgb(17 24 39)' }}>{t('freeboard.createdAt')}</th>
                          <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider" style={{ color: theme === 'dark' ? 'rgb(229 231 235)' : 'rgb(17 24 39)' }}>{t('freeboard.views')}</th>
                          <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider" style={{ color: theme === 'dark' ? 'rgb(229 231 235)' : 'rgb(17 24 39)' }}>{t('freeboard.recommend')}</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {(translationMode !== 'none' ? translatedPosts : sortedPosts).map((post, index) => (
                          <tr key={post.id} className={`${
                            post.author_name === '운영자' || post.author_name === 'Admin' || post.author_name === 'Administrator' || post.is_notice
                              ? 'bg-yellow-50 hover:bg-yellow-100 dark:bg-yellow-900/20 dark:hover:bg-yellow-900/30'
                              : 'bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700'
                          } cursor-pointer`} onClick={() => {
                            if (onPostSelect) {
                              onPostSelect(post)
                            } else {
                              router.push(`/community/post/${post.id}`)
                            }
                          }}>
                            <td className="px-4 py-3 text-sm text-left">
                              <Badge variant="secondary" className="text-xs font-bold">
                                {post.is_notice ? t('community.notice') : translateCategoryName(post.category || post.category_name)}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 text-left">
                              <div className="flex items-center gap-2">
                                {post.is_pinned && <Star className="w-4 h-4 text-yellow-500" />}
                                {post.is_hot && <TrendingUp className="w-4 h-4 text-red-500" />}
                                <span className="truncate max-w-xs">
                                  {translationMode !== 'none' && post.translatedTitle ? post.translatedTitle : post.title}
                                </span>
                                {post.comments_count > 0 && (
                                  <span className="text-blue-600 dark:text-blue-400 text-xs">[{post.comments_count}]</span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 text-center">
                              <AuthorName
                                userId={post.author_id}
                                name={post.author_name}
                                className="justify-center"
                              />
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 text-center">{formatDate(post.created_at)}</td>
                            <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 text-center">{formatNumber(post.views)}</td>
                            <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 text-center">{formatNumber(post.likes)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* 페이지네이션 */}
            <div className="flex items-center justify-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
                className="bg-white dark:bg-gray-600 text-gray-900 dark:text-white border-gray-300 dark:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-500"
              >
                {t('buttons.back')}
              </Button>
              
              {/* 동적 페이지 번호 생성 */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  // 총 페이지가 5개 이하면 1부터 순서대로
                  pageNum = i + 1;
                } else {
                  // 총 페이지가 5개 초과면 현재 페이지 중심으로 표시
                  if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                }
                
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                    className={currentPage === pageNum 
                      ? 'bg-blue-500 hover:bg-blue-600 text-white' 
                      : 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white border-gray-300 dark:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-500'
                    }
                  >
                    {pageNum}
                  </Button>
                );
              })}
              
              <Button 
                variant="outline" 
                size="sm" 
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
                className="bg-white dark:bg-gray-600 text-gray-900 dark:text-white border-gray-300 dark:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-500"
              >
                {language === 'ko' ? '다음' : 'Next'}
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* 모바일: DC인사이드 스타일 */}
      <div className="md:hidden bg-white dark:bg-gray-900 min-h-screen">
        {/* 검색바 */}
        <div className="bg-gray-100 dark:bg-gray-800 py-1 md:py-2">
          <div className="flex items-center bg-white dark:bg-gray-700 px-4 py-2 mx-0">
            <input
              type="text"
              placeholder={t('community.searchPlaceholder')}
              className="flex-1 text-xs outline-none bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
            />
            <span className="text-gray-400 dark:text-gray-500">🔍</span>
          </div>
          {/* 검색 결과 정보 */}
          {searchQuery.trim() && (
            <div className="px-4 py-1 text-xs text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800">
              "{searchQuery}" 검색 결과: {sortedPosts.length}개
            </div>
          )}
        </div>

        {/* 섹션 타이틀 - 드롭다운 */}
        <div className="bg-white dark:bg-gray-800 py-1.5 md:py-2 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between px-4">
            <Select value={selectedBoard} onValueChange={handleBoardChange}>
              <SelectTrigger className="w-auto border-none shadow-none text-sm md:text-base font-medium text-gray-900 dark:text-gray-100 bg-transparent p-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {boardOptions.map((board) => (
                  <SelectItem key={board.id} value={board.name}>
                    <span>{board.name}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/main?tab=community')}
                className="flex items-center gap-1 md:gap-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 border-2 border-gray-400 dark:border-gray-600 hover:border-gray-500 dark:hover:border-gray-500 bg-white dark:bg-gray-700 shadow-sm hover:shadow-md px-2 md:px-3 py-1 md:py-2 text-xs md:text-sm"
              >
                <ArrowLeft className="w-3 h-3 md:w-4 md:h-4" />
                {t('buttons.back')}
              </Button>
            </div>
          </div>
        </div>

        {/* 카테고리 필터 */}
        <div className="bg-white dark:bg-gray-800 py-2 border-b border-gray-200 dark:border-gray-700">
          <div className={`flex gap-2 overflow-x-auto pb-1 px-4 ${language === 'es' ? 'gap-1' : 'gap-2'}`}>
            <button 
              className={`px-3 py-1 rounded-full whitespace-nowrap transition-colors ${
                language === 'es' ? 'text-[10px]' : 'text-xs'
              }               ${
                activeTab === 'all' 
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' 
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
              onClick={() => handleTabChange('all')}
            >
              {t('community.tabs.all')}
            </button>
            <button 
              className={`px-3 py-1 rounded-full whitespace-nowrap transition-colors ${
                language === 'es' ? 'text-[10px]' : 'text-xs'
              }               ${
                activeTab === 'recommended' 
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' 
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
              onClick={() => handleTabChange('recommended')}
            >
              {language === 'ko' ? '추천글' : 'Recomendados'}
            </button>
            <button 
              className={`px-3 py-1 rounded-full whitespace-nowrap transition-colors ${
                language === 'es' ? 'text-[10px]' : 'text-xs'
              }               ${
                activeTab === 'popular' 
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' 
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
              onClick={() => handleTabChange('popular')}
            >
              {t('community.tabs.popular')}
            </button>
            <button 
              className={`px-3 py-1 rounded-full whitespace-nowrap transition-colors ${
                language === 'es' ? 'text-[10px]' : 'text-xs'
              }               ${
                activeTab === 'latest' 
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' 
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
              onClick={() => handleTabChange('latest')}
            >
              {t('community.tabs.latest')}
            </button>
          </div>
        </div>

        {/* 게시글 목록 */}
        <div className="bg-white dark:bg-gray-800">
          {loading ? (
            <div className="p-4 space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-start space-x-3">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-2/3" />
                      <div className="flex items-center space-x-4 pt-2">
                        <Skeleton className="h-3 w-12" />
                        <Skeleton className="h-3 w-12" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : sortedPosts.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-8 h-8 text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-base font-medium text-gray-900 dark:text-gray-100 mb-2">
                {searchQuery.trim() 
                  ? (language === 'ko' ? '검색 결과가 없습니다' : 'No search results')
                  : (language === 'ko' ? '게시글이 없습니다' : 'No posts yet')
                }
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                {searchQuery.trim()
                  ? (language === 'ko' ? '다른 검색어로 시도해보세요' : 'Try a different search term')
                  : (language === 'ko' ? '첫 번째 게시글을 작성해보세요!' : 'Be the first to write a post!')
                }
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {sortedPosts.map((post, index) => (
                <div 
                  key={post.id} 
                  className="py-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 px-3"
                  onClick={() => {
                    if (onPostSelect) {
                      onPostSelect(post)
                    } else {
                      router.push(`/community/post/${post.id}`)
                    }
                  }}
                >
                  <div className="space-y-1">
                    {/* 제목 */}
                    <h3 className="text-xs sm:text-sm text-gray-900 dark:text-gray-100 line-clamp-2">
                      {post.title}
                    </h3>
                    
                    {/* 카테고리와 날짜 */}
                    <div className="flex items-center justify-between text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">
                      <span className="font-bold">{translateCategoryName(post.category_name)}</span>
                      <span>{formatDate(post.created_at)}</span>
                    </div>
                    
                    {/* 통계 */}
                    <div className="flex items-center gap-3 sm:gap-4 text-[10px] sm:text-xs text-gray-400 dark:text-gray-500">
                      <span className="flex items-center gap-1">
                        <Eye className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                        <span>{formatNumber(post.views)}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <ThumbsUp className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-red-500" />
                        <span>{formatNumber(post.likes)}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-blue-500" />
                        <span>{formatNumber(post.comments_count)}</span>
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 하단 네비게이션 - 제거됨 */}
        {/* <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 md:hidden">
          <div className="flex items-center justify-around">
            <Button variant="ghost" size="sm" className="flex flex-col items-center gap-1">
              <span className="text-base">📹</span>
              <span className="text-xs">화상채팅</span>
            </Button>
            <Button variant="ghost" size="sm" className="flex flex-col items-center gap-1">
              <span className="text-base">💬</span>
              <span className="text-xs">커뮤니티</span>
            </Button>
            <Button variant="ghost" size="sm" className="flex flex-col items-center gap-1">
              <span className="text-base">⚡</span>
              <span className="text-xs">충전소</span>
            </Button>
          </div>
        </div> */}

        {/* 플로팅 글쓰기 버튼 */}
        <div className="fixed bottom-64 right-2 z-50 md:hidden">
          <div className="flex items-center justify-end">
            {/* 확장된 버튼들 */}
            <div className={`transition-all duration-300 ease-in-out ${
              isFabExpanded ? 'opacity-100 translate-x-0 scale-100' : 'opacity-0 translate-x-4 scale-95'
            }`}>
              {/* 공지사항 버튼 (운영자만) */}
              {isAdmin && (
                <button
                  onClick={handleOpenAnnouncementModal}
                  className="bg-gradient-to-r from-orange-400 to-red-500 hover:from-orange-500 hover:to-red-600 text-white px-4 py-2 rounded-full text-sm font-medium mr-1 shadow-lg border-2 border-white transition-all duration-200 hover:scale-105 active:scale-95"
                >
                  📢 공지사항
                </button>
              )}
              
              {/* 글쓰기 버튼 */}
              <button
                onClick={handleOpenPostModal}
                className="text-white px-4 py-2 rounded-full text-xs font-medium mr-1 shadow-lg border-2 border-white transition-all duration-200 hover:scale-105 active:scale-95"
                style={{ 
                  background: 'linear-gradient(to right, rgb(59 130 246), rgb(147 51 234))',
                  color: 'white'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(to right, rgb(37 99 235), rgb(126 34 206))'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(to right, rgb(59 130 246), rgb(147 51 234))'
                }}
              >
                {t('community.writePost')}
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
              className="w-11 h-11 rounded-full text-white shadow-2xl hover:shadow-3xl transition-all duration-300 flex items-center justify-center border-2 border-white hover:scale-110 active:scale-95"
              style={{ 
                background: 'linear-gradient(to right, rgb(59 130 246), rgb(147 51 234))',
                color: 'white'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(to right, rgb(37 99 235), rgb(126 34 206))'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'linear-gradient(to right, rgb(59 130 246), rgb(147 51 234))'
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
      </div>

      {/* 글쓰기 모달 */}
      {showPostModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl md:max-w-3xl max-h-[85vh] overflow-hidden shadow-2xl border border-gray-100 dark:border-gray-700">
            {/* 모달 헤더 */}
            <div className="flex items-center justify-between p-3 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-700 dark:to-gray-600">
              <h2 className="text-base md:text-lg font-bold text-gray-800 dark:text-gray-100">{t('community.newPost')}</h2>
              <button
                onClick={handleClosePostModal}
                className="p-1 md:p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-all duration-200"
              >
                <X className="w-3 h-3 md:w-4 md:h-4 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            {/* 모달 내용 */}
            <div className="p-3 md:p-4 space-y-3 md:space-y-4 max-h-[calc(85vh-120px)] overflow-y-auto">
              {/* 카테고리 선택 */}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                  {t('community.category')}
                </label>
                <select 
                  value={postCategory} 
                  onChange={(e) => setPostCategory(e.target.value)}
                  className="w-full h-10 text-xs md:text-sm border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3"
                >
                  <option value="">{t('community.selectBoardPlaceholder')}</option>
                  {categories.filter(cat => cat.id !== 'all').map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 제목 입력 */}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                  {t('community.postTitle')}
                </label>
                <input
                  type="text"
                  value={postTitle}
                  onChange={(e) => setPostTitle(e.target.value)}
                  placeholder={t('community.postTitlePlaceholder')}
                  className="w-full px-3 py-2 text-sm border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                  maxLength={100}
                />
                <div className="text-right text-xs text-gray-500 dark:text-gray-400">
                  {postTitle.length}/100
                </div>
              </div>

              {/* 내용 입력 */}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                  {t('community.postContent')}
                </label>
                <textarea
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  placeholder={t('community.postContentPlaceholder')}
                  rows={6}
                  className="w-full px-3 py-2 text-sm border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                  maxLength={2000}
                />
                <div className="text-right text-xs text-gray-500 dark:text-gray-400">
                  {postContent.length}/2000
                </div>
              </div>

              {/* 이미지 업로드 */}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                  {t('community.attachImage')}
                </label>
                <div className="space-y-2">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                    id="post-image-upload"
                    disabled={uploadingImages}
                  />
                  <label
                    htmlFor="post-image-upload"
                    className={`inline-flex items-center gap-2 px-4 py-2 text-xs border-2 border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900 transition-all duration-200 font-medium bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${uploadingImages ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <span>📷</span>
                    {uploadingImages ? '업로드 중...' : t('community.selectImage')}
                  </label>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {t('community.imageRestrictions')}
                  </div>
                  
                  {/* 이미지 미리보기 */}
                  {imagePreviews.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                      {imagePreviews.map((preview, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={preview}
                            alt={`첨부 이미지 ${index + 1}`}
                            className="w-full h-20 object-cover rounded-lg border-2 border-gray-200 dark:border-gray-600 shadow-md hover:shadow-lg transition-shadow duration-200"
                          />
                          <button
                            onClick={() => handleRemoveImage(index)}
                            className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs hover:bg-red-600 transition-all duration-200 shadow-lg hover:shadow-xl"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 모달 푸터 */}
            <div className="flex items-center justify-end gap-3 p-3 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
              <button
                onClick={handleClosePostModal}
                className="px-4 py-2 text-xs text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:border-gray-400 dark:hover:border-gray-500 transition-all duration-200 font-medium bg-white dark:bg-gray-600"
              >
                {t('buttons.cancel')}
              </button>
              <button
                onClick={() => {
                  console.log('[BUTTON] 작성하기 버튼 클릭됨!')
                  handleSubmitPost()
                }}
                disabled={isSubmittingPost}
                className={`px-6 py-2 text-xs rounded-lg font-medium transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl ${
                  isSubmittingPost 
                    ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                    : 'text-white'
                }`}
                style={!isSubmittingPost ? { 
                  background: 'linear-gradient(to right, rgb(59 130 246), rgb(147 51 234))',
                  border: 'none',
                  color: 'white'
                } : undefined}
                onMouseEnter={!isSubmittingPost ? (e) => {
                  e.currentTarget.style.background = 'linear-gradient(to right, rgb(37 99 235), rgb(126 34 206))'
                } : undefined}
                onMouseLeave={!isSubmittingPost ? (e) => {
                  e.currentTarget.style.background = 'linear-gradient(to right, rgb(59 130 246), rgb(147 51 234))'
                } : undefined}
              >
                {isSubmittingPost ? '작성 중...' : t('community.createPost')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 인증 확인 다이얼로그 */}
      <AuthConfirmDialog
        open={showAuthDialog}
        onOpenChange={setShowAuthDialog}
        title={t('community.authRequired')}
        description={t('community.authRequiredDescription')}
        confirmText={t('community.goToAuthCenter')}
        cancelText={t('buttons.cancel')}
      />

      {/* 공지사항 작성 모달 */}
      {showAnnouncementModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl md:max-w-3xl max-h-[85vh] overflow-hidden shadow-2xl border border-gray-100 dark:border-gray-700">
            {/* 모달 헤더 */}
            <div className="flex items-center justify-between p-3 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-orange-50 to-red-50 dark:from-gray-700 dark:to-gray-600">
              <h2 className="text-base md:text-lg font-bold text-gray-800 dark:text-gray-100">📢 공지사항 작성</h2>
              <button
                onClick={() => {
                  setShowAnnouncementModal(false)
                  setAnnouncementTitle('')
                  setAnnouncementContent('')
                  setAnnouncementImages([])
                }}
                className="p-1 md:p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-all duration-200"
              >
                <X className="w-3 h-3 md:w-4 md:h-4 text-gray-500" />
              </button>
            </div>

            {/* 모달 내용 */}
            <div className="p-3 md:p-4 space-y-3 md:space-y-4 max-h-[60vh] overflow-y-auto">
              {/* 제목 입력 */}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                  제목 *
                </label>
                <input
                  type="text"
                  value={announcementTitle}
                  onChange={(e) => setAnnouncementTitle(e.target.value)}
                  placeholder="공지사항 제목을 입력하세요"
                  className="w-full px-3 py-2 text-sm border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 shadow-sm hover:shadow-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                  maxLength={100}
                />
              </div>

              {/* 내용 입력 */}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                  내용 *
                </label>
                <textarea
                  value={announcementContent}
                  onChange={(e) => setAnnouncementContent(e.target.value)}
                  placeholder="공지사항 내용을 입력하세요"
                  rows={8}
                  className="w-full px-3 py-2 text-sm border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 shadow-sm hover:shadow-md resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                  maxLength={5000}
                />
                <div className="text-right text-xs text-gray-500 dark:text-gray-400">
                  {announcementContent.length}/5000
                </div>
              </div>

              {/* 이미지 업로드 */}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
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
            </div>

            {/* 모달 하단 버튼 */}
            <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
              <button
                onClick={() => {
                  setShowAnnouncementModal(false)
                  setAnnouncementTitle('')
                  setAnnouncementContent('')
                  setAnnouncementImages([])
                }}
                disabled={announcementLoading}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                취소
              </button>
              <button
                onClick={handleAnnouncementSubmit}
                disabled={announcementLoading || !announcementTitle.trim() || !announcementContent.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-orange-400 to-red-500 hover:from-orange-500 hover:to-red-600 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {announcementLoading ? '작성 중...' : '📢 공지사항 작성'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default FreeBoardList