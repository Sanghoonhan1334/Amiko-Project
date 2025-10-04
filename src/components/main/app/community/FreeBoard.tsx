'use client'

import { useState, useEffect } from 'react'
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
  ArrowLeft
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import { createClientComponentClient } from '@/lib/supabase'
import PostDetail from './PostDetail'
import { CardGridSkeleton } from '@/components/ui/skeleton'
import VerificationGuard from '@/components/common/VerificationGuard'

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
  const { t } = useLanguage()
  const supabase = createClientComponentClient()
  
  // 상태 관리
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [showPostDetail, setShowPostDetail] = useState(false)
  const [showWriteDialog, setShowWriteDialog] = useState(false)
  
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
      alert('이미지 파일만 업로드할 수 있습니다.')
      return
    }

    // 파일 크기 제한 (5MB)
    const maxSize = 5 * 1024 * 1024
    const validFiles = imageFiles.filter(file => {
      if (file.size > maxSize) {
        alert(`${file.name}은(는) 5MB를 초과합니다.`)
        return false
      }
      return true
    })

    if (validFiles.length === 0) return

    // 최대 5개 이미지 제한
    if (uploadedImages.length + validFiles.length > 5) {
      alert('최대 5개까지 이미지를 업로드할 수 있습니다.')
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
            'Authorization': `Bearer ${encodeURIComponent(currentToken)}`
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

  // 게시글 목록 조회
  const fetchPosts = async () => {
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
      setPosts(data.posts)
      
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
  }

  // 게시글 작성
  const handleWritePost = async () => {
    if (!user) {
      setError('로그인이 필요합니다.')
      return
    }

    if (!writeTitle.trim() || !writeContent.trim()) {
      setError('제목과 내용을 입력해주세요.')
      return
    }

    // 공지사항 작성 권한 체크 (임시로 이메일로 확인)
    if (writeIsNotice) {
      const userEmail = user.email || ''
      const isAdmin = userEmail.includes('admin') || userEmail.includes('@amiko.com')
      if (!isAdmin) {
        setError('공지사항은 운영자만 작성할 수 있습니다.')
        return
      }
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
      
      // 카테고리 자동 설정
      let category_name = '자유게시판' // 기본값
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
      console.log('API 요청 시작')
      
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${encodeURIComponent(currentToken)}`
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
            alert('시스템 점검 중입니다. 잠시 후 다시 시도해주세요.')
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
    if (!user) {
      setError('로그인이 필요합니다.')
      return
    }

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      
      if (!token) {
        setError('인증 토큰을 가져올 수 없습니다. 다시 로그인해주세요.')
        return
      }
      
      const response = await fetch(`/api/posts/${postId}/reactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${encodeURIComponent(token)}`
        },
        body: JSON.stringify({ reaction_type: reactionType })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '반응 처리에 실패했습니다.')
      }

      // 목록 새로고침
      await fetchPosts()
    } catch (err) {
      console.error('반응 처리 실패:', err)
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.')
    }
  }

  // 검색 실행
  const handleSearch = () => {
    console.log('검색 실행:', searchQuery)
    setCurrentPage(1)
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

  // 초기 로드 및 의존성 변경 시 재조회
  useEffect(() => {
    console.log('FreeBoard 마운트됨, 사용자 상태:', { user: !!user })
    fetchPosts()
  }, [currentPage, user])

  // 카테고리, 정렬, 검색어 변경 시 재조회
  useEffect(() => {
    console.log('필터 변경 감지:', { currentCategory, sortBy, searchQuery })
    fetchPosts()
  }, [currentCategory, sortBy, searchQuery])

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
      <div className="space-y-6">
        <CardGridSkeleton count={6} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
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
      </div>

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
                  : 'hover:bg-blue-50 hover:text-blue-600'
              } active:scale-95 active:bg-blue-200 active:text-blue-800`}
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
          
          <VerificationGuard requiredLevel="sms">
            <Dialog open={showWriteDialog} onOpenChange={setShowWriteDialog}>
              <DialogTrigger asChild>
                <Button className="bg-blue-400 hover:bg-blue-500 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  {t('buttons.write')}
                </Button>
              </DialogTrigger>
            <DialogContent 
              className="max-w-2xl bg-white border border-gray-200 shadow-xl"
              style={{ 
                backgroundColor: 'white',
                opacity: 1
              }}
            >
              <DialogHeader>
                <DialogTitle>{t('freeboard.writePost')}</DialogTitle>
                <DialogDescription>
{t('freeboard.writePostDescription')}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
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
                      {(user?.email?.includes('admin') || user?.email?.includes('@amiko.com')) && (
                        <label className="flex items-center">
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
{t('freeboard.notice')}
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
                    <div className="bg-yellow-50 p-3 rounded-lg">
                      <p className="text-sm text-yellow-800">
                        ⚠️ 공지사항은 중요한 안내사항에만 사용해주세요
                      </p>
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
                      className={`cursor-pointer flex flex-col items-center justify-center py-4 text-gray-600 hover:text-gray-800 ${uploadingImages ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <div className="text-4xl mb-2">📷</div>
                      <div className='text-sm font-medium'>
                        {uploadingImages ? '업로드 중...' : '이미지를 선택하거나 여기에 드래그하세요'}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        JPG, PNG, GIF 파일 (최대 5개, 각 5MB 이하)
                      </div>
                    </label>
                  </div>
                  
                  {/* 업로드된 이미지 미리보기 */}
                  {imagePreviews.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <div className="text-sm font-medium text-gray-700 mb-2">업로드된 이미지 ({imagePreviews.length}/5)</div>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {imagePreviews.map((preview, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={preview}
                              alt={`첨부 이미지 ${index + 1}`}
                              className="w-full h-32 object-cover rounded-lg border"
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
          </VerificationGuard>
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
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              목록으로
            </Button>
          </div>
          
          {/* 게시글 상세 내용 */}
          <PostDetail
            post={selectedPost}
            onClose={() => setShowPostDetail(false)}
            onUpdate={fetchPosts}
          />
        </div>
      ) : (
        /* 게시글 목록 */
        <Card>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">{t('freeboard.loadingPosts')}</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-600">{error}</p>
              <Button onClick={fetchPosts} className="mt-2">{t('freeboard.retry')}</Button>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">{t('freeboard.noPosts')}</p>
            </div>
          ) : (
            <>
              {/* 게시글 목록 테이블 */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">{t('communityTab.title')}</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">{t('freeboard.author')}</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">{t('freeboard.createdAt')}</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">{t('freeboard.views')}</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">{t('freeboard.likes')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {posts.map((post, index) => (
                      <tr
                        key={post.id}
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => handlePostClick(post)}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {getPostIcon(post)}
                            {post.images && post.images.length > 0 && (
                              <span className="text-sm">📷</span>
                            )}
                            <span className="text-sm font-medium text-gray-900">
                              {post.title}
                            </span>
                            {post.comment_count > 0 && (
                              <span className="text-xs text-gray-500">
                                [{post.comment_count}]
                              </span>
                            )}
                            {post.is_pinned && (
                              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                                개념글
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {post.author?.full_name || '익명'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {formatDate(post.created_at)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {post.view_count}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex items-center gap-1">
                            <span className="text-green-600">{post.like_count}</span>
                            <span className="text-gray-400">-</span>
                            <span className="text-red-600">{post.dislike_count}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* 페이지네이션 */}
              {pagination.totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 p-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
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
                          className="min-w-[32px]"
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
                  >
                    다음
                  </Button>
                </div>
              )}
            </>
          )}
        </Card>
      )}
    </div>
  )
}