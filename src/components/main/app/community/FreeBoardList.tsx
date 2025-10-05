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
  const [sortBy, setSortBy] = useState('latest')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [showAuthDialog, setShowAuthDialog] = useState(false)
  const [hasMobileNavigation, setHasMobileNavigation] = useState(false)
  const [selectedBoard, setSelectedBoard] = useState(language === 'es' ? 'Tablero por Temas' : '주제별 게시판')
  const [isFabExpanded, setIsFabExpanded] = useState(false)
  const [showPostModal, setShowPostModal] = useState(false)
  const [postTitle, setPostTitle] = useState('')
  const [postContent, setPostContent] = useState('')
  const [postCategory, setPostCategory] = useState('general')
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [uploadingImages, setUploadingImages] = useState(false)

  const categories: Category[] = [
    { id: 'all', name: '전체', icon: '📝' },
    { id: 'general', name: '주제별 게시판', icon: '📝' },
    { id: 'kpop', name: 'K-POP 게시판', icon: '🎵' },
    { id: 'kdrama', name: 'K-Drama 게시판', icon: '📺' },
    { id: 'beauty', name: '뷰티 게시판', icon: '💄' },
    { id: 'korean', name: '한국어 게시판', icon: '🇰🇷' },
    { id: 'spanish', name: '스페인어 게시판', icon: '🇪🇸' }
  ]

  const boardOptions = [
    { id: 'general', name: language === 'es' ? 'Tablero por Temas' : '주제별 게시판', icon: '📝' },
    { id: 'kpop', name: language === 'es' ? 'Foro K-POP' : 'K-POP 게시판', icon: '🎵' },
    { id: 'kdrama', name: language === 'es' ? 'Foro K-Drama' : 'K-Drama 게시판', icon: '📺' },
    { id: 'beauty', name: language === 'es' ? 'Foro de Belleza' : '뷰티 게시판', icon: '💄' },
    { id: 'korean', name: language === 'es' ? 'Foro de Coreano' : '한국어 게시판', icon: '🇰🇷' },
    { id: 'spanish', name: language === 'es' ? 'Foro de Español' : '스페인어 게시판', icon: '🇪🇸' }
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
      setShowAuthDialog(true)
      return
    }
    setShowPostModal(true)
    setIsFabExpanded(false)
  }

  // 글쓰기 모달 닫기
  const handleClosePostModal = () => {
    setShowPostModal(false)
    setPostTitle('')
    setPostContent('')
    setPostCategory('general')
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
      
      toast.success('이미지가 업로드되었습니다!')
    } catch (error) {
      console.error('이미지 업로드 실패:', error)
      toast.error('이미지 업로드에 실패했습니다.')
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
    if (!postTitle.trim() || !postContent.trim()) {
      toast.error('제목과 내용을 모두 입력해주세요.')
      return
    }

    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          gallery_id: 'free', // 자유게시판 갤러리 ID
          title: postTitle,
          content: postContent,
          images: uploadedImages
        })
      })

      if (response.ok) {
        toast.success('글이 성공적으로 작성되었습니다!')
        handleClosePostModal()
        // 게시글 목록 새로고침
        loadPosts()
      } else {
        toast.error('글 작성에 실패했습니다.')
      }
    } catch (error) {
      console.error('Error creating post:', error)
      toast.error('글 작성 중 오류가 발생했습니다.')
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

  // 게시글 로딩
  const loadPosts = async () => {
    setLoading(true)
    try {
      console.log('게시글 API 호출 시작...')
      
      const response = await fetch('/api/posts', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()
      console.log('API 응답 데이터:', data)

      if (data.success) {
        const transformedPosts = data.posts.map((post: any) => ({
          id: post.id,
          title: post.title,
          content: post.content,
          category_id: post.category_id || 'general',
          category_name: post.category_name || '자유게시판',
          author_name: post.author_name || '익명',
          created_at: post.created_at,
          views: post.views || 0,
          likes: post.likes || 0,
          comments_count: post.comments_count || 0,
          is_pinned: post.is_pinned || false,
          is_hot: post.likes > 10
        }))
        
        console.log('변환된 게시글 데이터:', { success: true, postsCount: transformedPosts.length, posts: transformedPosts })
        setPosts(transformedPosts)
      } else {
        console.error('게시글 로딩 실패:', data.error)
        toast.error(data.error || '게시글을 불러오는데 실패했습니다.')
      }
    } catch (error) {
      console.error('게시글 로딩 오류:', error)
      toast.error('게시글을 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPosts()
  }, [currentPage, sortBy, selectedCategory])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return '방금 전'
    if (diffInHours < 24) return `${diffInHours}시간 전`
    if (diffInHours < 48) return '어제'
    return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
  }

  const getCategoryIcon = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId)
    return category ? category.icon : '📝'
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
        <Card className="p-6 bg-white shadow-lg border border-gray-200 rounded-xl">
          <div className="space-y-4 sm:space-y-6">
            {/* 페이지 제목 - 드롭다운 */}
            <div className="flex items-center justify-between py-4 border-b border-gray-200">
              {/* 왼쪽 끝에 이전 버튼 */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/main?tab=community')}
                className="flex items-center gap-2 text-gray-700 hover:text-gray-900 border border-gray-300 hover:border-gray-400 bg-white shadow-sm hover:shadow-md px-3 py-2 text-sm font-medium"
              >
                <ArrowLeft className="w-4 h-4" />
                이전
              </Button>
              
              {/* 가운데 드롭다운 */}
              <Select value={selectedBoard} onValueChange={setSelectedBoard}>
                <SelectTrigger className="w-auto border-none shadow-none text-2xl font-bold text-gray-800 bg-transparent">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {boardOptions.map((board) => (
                    <SelectItem key={board.id} value={board.name}>
                      <div className="flex items-center gap-2">
                        <span>{board.icon}</span>
                        <span>{board.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* 오른쪽 끝에 글쓰기 버튼 */}
              <Button
                onClick={handleOpenPostModal}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 text-sm font-medium"
              >
                <Plus className="w-4 h-4 mr-2" />
                글쓰기
              </Button>
            </div>

            {/* 헤더 - showHeader가 true일 때만 표시 */}
            {showHeader && (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
                <div className="flex items-center gap-2 sm:gap-3">
                  <Filter className="w-5 h-5 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">카테고리</span>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          <span className="flex items-center gap-2">
                            <span>{category.icon}</span>
                            <span>{category.name}</span>
                          </span>
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
              <div className="p-8 text-center">
                <div className="inline-flex items-center gap-2 text-blue-600">
                  <span className="animate-spin">📝</span>
                  <span>{language === 'ko' ? '게시글을 불러오는 중...' : 'Loading posts...'}</span>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {posts.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <MessageSquare className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {language === 'ko' ? '게시글이 없습니다' : 'No posts yet'}
                    </h3>
                    <p className="text-sm text-gray-500 mb-4">
                      {language === 'ko' ? '첫 번째 게시글을 작성해보세요!' : 'Be the first to write a post!'}
                    </p>
                    <Button 
                      onClick={() => router.push('/community/post/create')}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      {language === 'ko' ? '게시글 작성' : 'Write Post'}
                    </Button>
                  </div>
                ) : (
                  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">번호</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">말머리</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">제목</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">글쓴이</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">작성일</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">조회</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">추천</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {posts.map((post, index) => (
                          <tr key={post.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => {
                            if (onPostSelect) {
                              onPostSelect(post)
                            } else {
                              router.push(`/community/post/${post.id}`)
                            }
                          }}>
                            <td className="px-4 py-3 text-sm text-gray-500">{posts.length - index}</td>
                            <td className="px-4 py-3 text-sm">
                              <Badge variant="secondary" className="text-xs">
                                {getCategoryIcon(post.category_id)} {post.category_name}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">
                              <div className="flex items-center gap-2">
                                {post.is_pinned && <Star className="w-4 h-4 text-yellow-500" />}
                                {post.is_hot && <TrendingUp className="w-4 h-4 text-red-500" />}
                                <span className="truncate max-w-xs">{post.title}</span>
                                {post.comments_count > 0 && (
                                  <span className="text-blue-600 text-xs">[{post.comments_count}]</span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-500">{post.author_name}</td>
                            <td className="px-4 py-3 text-sm text-gray-500">{formatDate(post.created_at)}</td>
                            <td className="px-4 py-3 text-sm text-gray-500">{formatNumber(post.views)}</td>
                            <td className="px-4 py-3 text-sm text-gray-500">{formatNumber(post.likes)}</td>
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
              <Button variant="outline" size="sm" disabled={currentPage === 1}>
                {language === 'ko' ? '이전' : 'Prev'}
              </Button>
              
              {[1, 2, 3, 4, 5].map((page) => (
                <Button
                  key={page}
                  variant={currentPage === page ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </Button>
              ))}
              
              <Button variant="outline" size="sm" disabled={currentPage === 5}>
                {language === 'ko' ? '다음' : 'Next'}
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* 모바일: DC인사이드 스타일 */}
      <div className="md:hidden bg-white min-h-screen">
        {/* 검색바 */}
        <div className="bg-gray-100 py-2">
          <div className="flex items-center bg-white px-4 py-2 mx-0">
            <input
              type="text"
              placeholder="갤러리 & 통합검색"
              className="flex-1 text-sm outline-none"
            />
            <span className="text-gray-400">🔍</span>
          </div>
        </div>

        {/* 섹션 타이틀 - 드롭다운 */}
        <div className="bg-white py-2 border-b border-gray-200">
          <div className="flex items-center justify-between px-4">
            <Select value={selectedBoard} onValueChange={setSelectedBoard}>
              <SelectTrigger className="w-auto border-none shadow-none text-lg font-medium text-gray-900 bg-transparent p-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {boardOptions.map((board) => (
                  <SelectItem key={board.id} value={board.name}>
                    <div className="flex items-center gap-2">
                      <span>{board.icon}</span>
                      <span>{board.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <button
                onClick={() => router.push('/main?tab=community')}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                title="이전"
              >
                <ArrowLeft className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>
        </div>

        {/* 카테고리 필터 */}
        <div className="bg-white py-2 border-b border-gray-200">
          <div className="flex gap-2 overflow-x-auto pb-1 px-4">
            <button className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm whitespace-nowrap">
              추천
            </button>
            <button className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm whitespace-nowrap">
              전체글
            </button>
            <button className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm whitespace-nowrap">
              인기글
            </button>
            <button className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm whitespace-nowrap">
              최신글
            </button>
          </div>
        </div>

        {/* 게시글 목록 */}
        <div className="bg-white">
          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-flex items-center gap-2 text-blue-600">
                <span className="animate-spin">📝</span>
                <span>{language === 'ko' ? '게시글을 불러오는 중...' : 'Loading posts...'}</span>
              </div>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {language === 'ko' ? '게시글이 없습니다' : 'No posts yet'}
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                {language === 'ko' ? '첫 번째 게시글을 작성해보세요!' : 'Be the first to write a post!'}
              </p>
              <Button 
                onClick={() => router.push('/community/post/create')}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="w-4 h-4 mr-1" />
                {language === 'ko' ? '게시글 작성' : 'Write Post'}
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {posts.map((post, index) => (
                <div 
                  key={post.id} 
                  className="py-4 cursor-pointer hover:bg-gray-50 px-4"
                  onClick={() => {
                    if (onPostSelect) {
                      onPostSelect(post)
                    } else {
                      router.push(`/community/post/${post.id}`)
                    }
                  }}
                >
                  <div className="space-y-2">
                    {/* 제목 */}
                    <h3 className="text-base font-medium text-gray-900 line-clamp-2">
                      {post.title}
                    </h3>
                    
                    {/* 카테고리와 날짜 */}
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <span>{getCategoryIcon(post.category_id)}</span>
                        <span>{post.category_name}</span>
                      </span>
                      <span>{formatDate(post.created_at)}</span>
                    </div>
                    
                    {/* 통계 */}
                    <div className="flex items-center gap-4 text-xs text-gray-400">
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
              <span className="text-lg">📹</span>
              <span className="text-xs">화상채팅</span>
            </Button>
            <Button variant="ghost" size="sm" className="flex flex-col items-center gap-1">
              <span className="text-lg">💬</span>
              <span className="text-xs">커뮤니티</span>
            </Button>
            <Button variant="ghost" size="sm" className="flex flex-col items-center gap-1">
              <span className="text-lg">⚡</span>
              <span className="text-xs">충전소</span>
            </Button>
          </div>
        </div> */}

        {/* 플로팅 글쓰기 버튼 */}
        <div className="fixed bottom-24 right-4 z-50 md:hidden">
          <div className="flex items-center">
            {/* 글쓰기 텍스트 - 원에서 확장되는 효과 */}
            <div className={`transition-all duration-300 ease-in-out ${
              isFabExpanded ? 'opacity-100 translate-x-0 scale-100' : 'opacity-0 translate-x-4 scale-95'
            }`}>
            <button
              onClick={handleOpenPostModal}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-4 py-2 rounded-full text-sm font-medium mr-1 shadow-lg border-2 border-white transition-all duration-200 hover:scale-105 active:scale-95"
            >
              글쓰기
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
              className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-2xl hover:shadow-3xl transition-all duration-300 flex items-center justify-center border-2 border-white hover:scale-110 active:scale-95"
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
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl w-full max-w-6xl max-h-[calc(100vh-80px)] overflow-hidden my-4">
            {/* 모달 헤더 */}
            <div className="flex items-center justify-between p-3 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-800">새 글 작성</h2>
              <button
                onClick={handleClosePostModal}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            {/* 모달 내용 */}
            <div className="p-3 space-y-3 max-h-[calc(100vh-160px)] overflow-y-auto">
              {/* 카테고리 선택 */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  카테고리
                </label>
                <Select value={postCategory} onValueChange={setPostCategory}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.filter(cat => cat.id !== 'all').map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        <div className="flex items-center gap-2">
                          <span>{category.icon}</span>
                          <span>{category.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 제목 입력 */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  제목
                </label>
                <input
                  type="text"
                  value={postTitle}
                  onChange={(e) => setPostTitle(e.target.value)}
                  placeholder="제목을 입력하세요"
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  maxLength={100}
                />
                <div className="text-right text-xs text-gray-500 mt-1">
                  {postTitle.length}/100
                </div>
              </div>

              {/* 내용 입력 */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  내용
                </label>
                <textarea
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  placeholder="내용을 입력하세요"
                  rows={6}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  maxLength={2000}
                />
                <div className="text-right text-xs text-gray-500 mt-1">
                  {postContent.length}/2000
                </div>
              </div>

              {/* 이미지 업로드 */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  이미지 첨부
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
                    className={`inline-flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${uploadingImages ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <span>📷</span>
                    {uploadingImages ? '업로드 중...' : '이미지 선택'}
                  </label>
                  <div className="text-xs text-gray-500">
                    JPG, PNG, GIF (최대 5MB, 최대 5개)
                  </div>
                  
                  {/* 이미지 미리보기 */}
                  {imagePreviews.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mt-2">
                      {imagePreviews.map((preview, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={preview}
                            alt={`첨부 이미지 ${index + 1}`}
                            className="w-full h-20 object-cover rounded-lg border"
                          />
                          <button
                            onClick={() => handleRemoveImage(index)}
                            className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
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
            <div className="flex items-center justify-end gap-2 p-3 border-t border-gray-200">
              <button
                onClick={handleClosePostModal}
                className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleSubmitPost}
                className="px-4 py-1.5 text-sm bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg font-medium transition-all duration-200 hover:scale-105 active:scale-95"
              >
                작성하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 인증 확인 다이얼로그 */}
      <AuthConfirmDialog
        open={showAuthDialog}
        onOpenChange={setShowAuthDialog}
        title="인증이 필요합니다"
        description="게시글 작성을 위해 인증이 필요합니다. 인증센터로 이동하시겠습니까?"
        confirmText="인증센터로 이동"
        cancelText="취소"
      />
    </div>
  )
}

export default FreeBoardList