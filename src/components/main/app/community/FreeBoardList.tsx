'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
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
  ArrowLeft
} from 'lucide-react'
import AuthConfirmDialog from '@/components/common/AuthConfirmDialog'
import { Skeleton } from '@/components/ui/skeleton'

interface Post {
  id: string
  title: string
  content: string
  category_id: string
  category_name: string
  author_name: string
  created_at: string
  views: number
  likes: number
  comments_count: number
  is_pinned?: boolean
  is_hot?: boolean
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
  const router = useRouter()
  
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
  const [activeTab, setActiveTab] = useState('recommended')
  const [isFabExpanded, setIsFabExpanded] = useState(false)
  const [showPostModal, setShowPostModal] = useState(false)
  const [postTitle, setPostTitle] = useState('')
  const [postContent, setPostContent] = useState('')
  const [postCategory, setPostCategory] = useState('')
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [uploadingImages, setUploadingImages] = useState(false)
  const [abortController, setAbortController] = useState<AbortController | null>(null)
  const [isSubmittingPost, setIsSubmittingPost] = useState(false)

  const categories: Category[] = [
    { id: 'free', name: '자유게시판', icon: '' },
    { id: 'kpop', name: 'K-POP', icon: '' },
    { id: 'kdrama', name: 'K-Drama', icon: '' },
    { id: 'beauty', name: '뷰티', icon: '' },
    { id: 'korean', name: '한국어', icon: '' },
    { id: 'spanish', name: '스페인어', icon: '' }
  ]

  const boardOptions = [
    { id: 'all', name: language === 'es' ? 'Todos' : '전체', icon: '' },
    { id: 'free', name: language === 'es' ? 'Foro Libre' : '자유게시판', icon: '' },
    { id: 'kpop', name: language === 'es' ? 'Foro K-POP' : 'K-POP', icon: '' },
    { id: 'kdrama', name: language === 'es' ? 'Foro K-Drama' : 'K-Drama', icon: '' },
    { id: 'beauty', name: language === 'es' ? 'Foro de Belleza' : '뷰티', icon: '' },
    { id: 'korean', name: language === 'es' ? 'Foro de Coreano' : '한국어', icon: '' },
    { id: 'spanish', name: language === 'es' ? 'Foro de Español' : '스페인어', icon: '' }
  ]

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

  // 탭에 따라 게시글 정렬
  const sortedPosts = [...filteredPosts].sort((a, b) => {
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
        '자유게시판': 'free',
        'Foro Libre': 'free',
        'K-POP': 'kpop',
        'Foro K-POP': 'kpop',
        'K-Drama': 'drama',
        'Foro K-Drama': 'drama',
        '뷰티': 'beauty',
        'Foro de Belleza': 'beauty',
        '한국어': 'korean',
        'Foro de Coreano': 'korean',
        '스페인어': 'spanish',
        'Foro de Español': 'spanish'
      }
      
      const gallerySlug = boardToSlugMap[selectedBoard] || 'free'
      console.log('[LOAD_POSTS] 갤러리 슬러그:', gallerySlug)
      
      // 페이지네이션 파라미터 추가
      const offset = (currentPage - 1) * itemsPerPage
      const limit = itemsPerPage
      
      // 전체 선택 시 모든 게시판의 글을 가져오기 위해 gallery 파라미터 제거
      let apiUrl
      if (gallerySlug === 'all') {
        apiUrl = `/api/posts?page=${currentPage}&limit=${limit}&offset=${offset}`
      } else {
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
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log('[LOAD_POSTS] API 응답 데이터:', data)

      if (data.success && data.posts) {
        // API 응답을 Post 인터페이스에 맞게 변환
        const transformedPosts = data.posts.map((post: any) => ({
          id: post.id,
          title: post.title,
          content: post.content,
          category_id: post.category_id || 'general',
          category_name: post.category || '자유게시판',
          author_name: post.author?.full_name || '익명',
          created_at: post.created_at,
          views: post.view_count || 0,
          likes: post.like_count || 0,
          comments_count: post.comment_count || 0,
          is_pinned: post.is_pinned || false,
          is_hot: post.is_hot || false
        }))

        console.log('[LOAD_POSTS] 변환된 게시글:', transformedPosts.length, '개')
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
      if (diffInMinutes < 1) return '방금 전'
      if (diffInMinutes < 60) return `${diffInMinutes}분 전`
      return `${diffInHours}시간 전`
    } else if (diffInDays === 1) {
      // 어제 올린 글
      return '어제'
    } else {
      // 그 이전: 날짜 표시
      return koreaTime.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
    }
  }

  const getCategoryIcon = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId)
    return category ? category.icon : ''
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
              
              {/* 데스크톱: 일렬로 나열된 게시판 탭, 모바일: 드롭다운 */}
              <div className="hidden md:flex items-center gap-1 overflow-x-auto scrollbar-hide pb-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {boardOptions.map((board) => (
                  <button
                    key={board.id}
                    onClick={() => handleBoardChange(board.name)}
                    className={`px-4 py-2 text-sm font-medium whitespace-nowrap transition-all duration-200 rounded-lg flex-shrink-0 ${
                      selectedBoard === board.name
                        ? 'bg-blue-500 text-white shadow-sm'
                        : 'bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-500 hover:shadow-sm'
                    }`}
                  >
                    {board.name}
                  </button>
                ))}
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
              
              {/* 오른쪽 끝에 글쓰기 버튼 */}
              <Button
                onClick={handleOpenPostModal}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-4 py-2 text-xs font-medium shadow-lg hover:shadow-xl transition-all duration-300"
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
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">게시판</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">제목</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">글쓴이</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">작성일</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">조회</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">추천</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {sortedPosts.map((post, index) => (
                          <tr key={post.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer" onClick={() => {
                            if (onPostSelect) {
                              onPostSelect(post)
                            } else {
                              router.push(`/community/post/${post.id}`)
                            }
                          }}>
                            <td className="px-4 py-3 text-sm">
                              <Badge variant="secondary" className="text-xs font-bold">
                                {post.category || post.category_name}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                              <div className="flex items-center gap-2">
                                {post.is_pinned && <Star className="w-4 h-4 text-yellow-500" />}
                                {post.is_hot && <TrendingUp className="w-4 h-4 text-red-500" />}
                                <span className="truncate max-w-xs">{post.title}</span>
                                {post.comments_count > 0 && (
                                  <span className="text-blue-600 dark:text-blue-400 text-xs">[{post.comments_count}]</span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{post.author_name}</td>
                            <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{formatDate(post.created_at)}</td>
                            <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{formatNumber(post.views)}</td>
                            <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{formatNumber(post.likes)}</td>
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
        <div className="bg-white dark:bg-gray-800 py-2 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between px-4">
            <Select value={selectedBoard} onValueChange={handleBoardChange}>
              <SelectTrigger className="w-auto border-none shadow-none text-base font-medium text-gray-900 dark:text-gray-100 bg-transparent p-0">
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
                className="flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 border-2 border-gray-400 dark:border-gray-600 hover:border-gray-500 dark:hover:border-gray-500 bg-white dark:bg-gray-700 shadow-sm hover:shadow-md px-3 py-2"
              >
                <ArrowLeft className="w-4 h-4" />
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
                activeTab === 'recommended' 
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' 
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
              onClick={() => handleTabChange('recommended')}
            >
              {t('community.tabs.recommended')}
            </button>
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
                    <h3 className="text-sm text-gray-900 dark:text-gray-100 line-clamp-2">
                      {post.title}
                    </h3>
                    
                    {/* 카테고리와 날짜 */}
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span className="font-bold">{post.category_name}</span>
                      <span>{formatDate(post.created_at)}</span>
                    </div>
                    
                    {/* 통계 */}
                    <div className="flex items-center gap-4 text-xs text-gray-400 dark:text-gray-500">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        <span>{formatNumber(post.views)}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <ThumbsUp className="w-3 h-3" />
                        <span>{formatNumber(post.likes)}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" />
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
        <div className="fixed bottom-20 right-4 z-50 md:hidden">
          <div className="flex items-center justify-end">
            {/* 글쓰기 텍스트 - 원에서 확장되는 효과 */}
            <div className={`transition-all duration-300 ease-in-out ${
              isFabExpanded ? 'opacity-100 translate-x-0 scale-100' : 'opacity-0 translate-x-4 scale-95'
            }`}>
            <button
              onClick={handleOpenPostModal}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-4 py-2 rounded-full text-xs font-medium mr-1 shadow-lg border-2 border-white transition-all duration-200 hover:scale-105 active:scale-95"
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
              className="w-11 h-11 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-2xl hover:shadow-3xl transition-all duration-300 flex items-center justify-center border-2 border-white hover:scale-110 active:scale-95"
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
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden shadow-2xl border border-gray-100 dark:border-gray-700">
            {/* 모달 헤더 */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-700 dark:to-gray-600">
              <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">{t('community.newPost')}</h2>
              <button
                onClick={handleClosePostModal}
                className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-all duration-200"
              >
                <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            {/* 모달 내용 */}
            <div className="p-4 space-y-4 max-h-[calc(85vh-120px)] overflow-y-auto">
              {/* 카테고리 선택 */}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                  {t('community.category')}
                </label>
                <Select value={postCategory} onValueChange={setPostCategory}>
                  <SelectTrigger className="w-full h-10 border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                    <SelectValue placeholder="게시판을 선택해주세요" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600">
                    {categories.filter(cat => cat.id !== 'all').map((category) => (
                      <SelectItem key={category.id} value={category.id} className="text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700">
                        <span>{category.name}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                    : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white'
                }`}
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
    </div>
  )
}

export default FreeBoardList