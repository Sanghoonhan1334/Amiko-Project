'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Languages } from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'
import { useAuth } from '@/context/AuthContext'
import { TranslationService } from '@/lib/translation'
import PostFilters, { FilterOptions } from './PostFilters'
import GalleryNavigation from './GalleryNavigation'

interface Post {
  id: string
  title: string
  content: string
  images: string[]
  view_count: number
  like_count: number
  dislike_count: number
  comment_count: number
  is_pinned: boolean
  is_hot: boolean
  created_at: string
  updated_at: string
  user: {
    id: string
    full_name: string
    avatar_url?: string
  }
  // 번역된 필드들
  translatedTitle?: string
  translatedContent?: string
}

interface Gallery {
  id: string
  slug: string
  name_ko: string
  icon: string
  color: string
}

interface PostListProps {
  gallery: Gallery
  onPostSelect: (post: Post) => void
  onCreatePost: () => void
  onGallerySelect?: (gallery: Gallery) => void
  onBackToGalleries?: () => void
  onPopularPosts?: () => void
}

// GalleryPostList.tsx - 갤러리 시스템 게시글 목록 (currentView === 'posts')
export default function GalleryPostList({
  gallery,
  onPostSelect,
  onCreatePost,
  onGallerySelect,
  onBackToGalleries,
  onPopularPosts
}: PostListProps) {
  const { t, language } = useLanguage()
  const { user } = useAuth()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userVotes, setUserVotes] = useState<Record<string, 'like' | 'dislike' | null>>({})
  const [translatingPosts, setTranslatingPosts] = useState<Set<string>>(new Set())
  const [filters, setFilters] = useState<FilterOptions>({
    sortBy: 'latest',
    timeRange: 'all',
    postType: 'all',
    status: 'all',
    searchQuery: ''
  })

  const translationService = new TranslationService()

  useEffect(() => {
    loadPosts()
  }, [gallery.id, filters])

  const loadPosts = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log('[GalleryPostList] 게시물 로드 시작:', {
        galleryId: gallery.id,
        gallerySlug: gallery.slug,
        galleryName: gallery.name_ko,
        filters
      })

      // 필터 파라미터를 URL에 추가
      const params = new URLSearchParams({
        sortBy: filters.sortBy,
        timeRange: filters.timeRange,
        postType: filters.postType,
        status: filters.status,
        searchQuery: filters.searchQuery,
        limit: '20',
        offset: '0'
      })

      const apiUrl = `/api/galleries/${gallery.slug}/posts/filtered?${params}`
      console.log('[GalleryPostList] API 호출 URL:', apiUrl)

      const response = await fetch(apiUrl, {
        headers: user ? {
          'Authorization': `Bearer ${user.access_token}`
        } : {}
      })

      if (!response.ok) {
        throw new Error('게시물을 불러오는데 실패했습니다')
      }

      const data = await response.json()
      console.log('[GalleryPostList] API 응답:', {
        galleryId: gallery.id,
        galleryName: gallery.name_ko,
        postsCount: data.posts?.length || 0,
        posts: data.posts?.map((post: any) => ({
          id: post.id,
          title: post.title,
          gallery: post.gallery
        })) || []
      })
      setPosts(data.posts || [])
      setUserVotes(data.userVotes || {})
    } catch (err) {
      console.error('게시물 로드 오류:', err)
      setError(err instanceof Error ? err.message : t('community.galleryList.errors.unknownError'))
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) return '방금 전'
    if (diffInHours < 24) return `${diffInHours}시간 전`
    if (diffInHours < 48) return '어제'
    return date.toLocaleDateString('ko-KR')
  }

  const handleFilterChange = (newFilters: FilterOptions) => {
    setFilters(newFilters)
  }

  const handleVote = async (postId: string, voteType: 'like' | 'dislike') => {
    if (!user) {
      setError('로그인이 필요합니다')
      return
    }

    try {
      const response = await fetch(`/api/posts/${postId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.access_token}`
        },
        body: JSON.stringify({ vote_type: voteType })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '투표에 실패했습니다')
      }

      const data = await response.json()
      console.log('투표 성공:', data)

      // 투표 상태 업데이트
      setUserVotes(prev => ({
        ...prev,
        [postId]: data.vote_type
      }))

      // 게시물 목록의 투표 수 업데이트
      setPosts(prev => prev.map(post =>
        post.id === postId
          ? { ...post, like_count: data.like_count, dislike_count: data.dislike_count }
          : post
      ))
    } catch (err) {
      console.error('투표 오류:', err)
      setError(err instanceof Error ? err.message : '투표 처리 중 오류가 발생했습니다')
    }
  }

  // 갤러리 게시물 번역
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
      console.error('갤러리 게시물 번역 실패:', error)
      setError('번역에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setTranslatingPosts(prev => {
        const newSet = new Set(prev)
        newSet.delete(post.id)
        return newSet
      })
    }
  }

  const getPostPreview = (content: string) => {
    // HTML 태그 제거하고 텍스트만 추출
    const textContent = content.replace(/<[^>]*>/g, '')
    return textContent.length > 100 ? textContent.substring(0, 100) + '...' : textContent
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600 dark:border-gray-400 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('buttons.loading')}</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={loadPosts}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            다시 시도
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 갤러리 네비게이션 */}
      {onGallerySelect && onBackToGalleries && onPopularPosts && (
        <GalleryNavigation
          currentGallery={gallery}
          onGallerySelect={onGallerySelect}
          onBackToGalleries={onBackToGalleries}
          onPopularPosts={onPopularPosts}
        />
      )}

      {/* 탭 버튼들 */}
      <div className="flex items-center space-x-2 mb-4">
        <Button
          onClick={() => handleFilterChange({ ...filters, sortBy: 'hot', status: 'hot' })}
          variant={filters.sortBy === 'hot' && filters.status === 'hot' ? 'default' : 'outline'}
          size="sm"
          className={filters.sortBy === 'hot' && filters.status === 'hot' ? 'bg-blue-500 hover:bg-blue-600 text-white' : ''}
        >
          추천
        </Button>
        <Button
          onClick={() => handleFilterChange({ ...filters, sortBy: 'latest', status: 'all' })}
          variant={filters.sortBy === 'latest' && filters.status === 'all' ? 'default' : 'outline'}
          size="sm"
          className={filters.sortBy === 'latest' && filters.status === 'all' ? 'bg-blue-500 hover:bg-blue-600 text-white' : ''}
        >
          전체글
        </Button>
        <Button
          onClick={() => handleFilterChange({ ...filters, sortBy: 'popular', status: 'popular' })}
          variant={filters.sortBy === 'popular' && filters.status === 'popular' ? 'default' : 'outline'}
          size="sm"
          className={filters.sortBy === 'popular' && filters.status === 'popular' ? 'bg-blue-500 hover:bg-blue-600 text-white' : ''}
        >
          인기글
        </Button>
        <Button
          onClick={() => handleFilterChange({ ...filters, sortBy: 'latest', status: 'all' })}
          variant={filters.sortBy === 'latest' && filters.status === 'all' ? 'default' : 'outline'}
          size="sm"
          className={filters.sortBy === 'latest' && filters.status === 'all' ? 'bg-blue-500 hover:bg-blue-600 text-white' : ''}
        >
          최신글
        </Button>
      </div>

      {/* 필터 및 글쓰기 버튼 */}
      <div className="flex items-center justify-between gap-4">
        <PostFilters
          onFilterChange={handleFilterChange}
          currentFilters={filters}
        />

        {user && (
          <Button
            onClick={onCreatePost}
            className="bg-blue-500 hover:bg-blue-600 text-white whitespace-nowrap"
          >
            ✏️ {t('community.galleryList.writePost')}
          </Button>
        )}
      </div>

      {/* 갤러리 헤더 */}
      <div className="flex items-center space-x-3">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
          style={{ backgroundColor: gallery.color + '20' }}
        >
          {gallery.icon}
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-800">{gallery.name_ko}</h1>
          <p className="text-sm text-gray-600">{t('community.galleryList.totalPosts').replace('{count}', posts.length.toString())}</p>
        </div>
      </div>


      {/* 게시물 목록 */}
      <div className="space-y-4">
        {posts.map((post) => (
          <Card
            key={post.id}
            className="cursor-pointer hover:shadow-md transition-all duration-200 border hover:border-gray-600 dark:border-gray-400"
            onClick={() => onPostSelect(post)}
          >
            <div className="p-6">
              {/* 게시물 헤더 */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  {/* 작성자 아바타 */}
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                    {post.user.avatar_url ? (
                      <img
                        src={post.user.avatar_url}
                        alt={post.user.full_name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-sm font-medium text-gray-600">
                        {post.user.full_name.charAt(0)}
                      </span>
                    )}
                  </div>

                  <div>
                    <p className="font-medium text-gray-800">{post.user.full_name}</p>
                    <p className="text-xs text-gray-500">{formatDate(post.created_at)}</p>
                  </div>
                </div>

                {/* 상태 배지 */}
                <div className="flex space-x-2">
                  {post.is_pinned && (
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">
                      📌 고정
                    </Badge>
                  )}
                  {post.is_hot && (
                    <Badge variant="secondary" className="bg-red-100 text-red-700">
                      🔥 핫글
                    </Badge>
                  )}
                </div>
              </div>

              {/* 게시물 제목 */}
              <div className="mb-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold text-gray-800 line-clamp-2 flex-1">
                    {post.translatedTitle || post.title}
                  </h3>
                  {post.translatedTitle && (
                    <span className="text-xs text-blue-500">(번역됨)</span>
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
              </div>

              {/* 게시물 미리보기 */}
              <div className="mb-4">
                <div className="flex items-start gap-2">
                  <p className="text-gray-600 line-clamp-3 flex-1">
                    {getPostPreview(post.translatedContent || post.content)}
                  </p>
                  {post.translatedContent && (
                    <span className="text-xs text-blue-500 mt-1">(번역됨)</span>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0 text-gray-400 hover:text-blue-500 mt-1"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleTranslatePost(post, 'content')
                    }}
                    disabled={translatingPosts.has(post.id)}
                  >
                    <Languages className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {/* 이미지 미리보기 */}
              {post.images && post.images.length > 0 && (
                <div className="mb-4">
                  <div className="flex space-x-2">
                    {post.images.slice(0, 3).map((image, index) => (
                      <div key={index} className="w-20 h-20 bg-gray-200 rounded-lg overflow-hidden">
                        <img
                          src={image}
                          alt={`첨부 이미지 ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                    {post.images.length > 3 && (
                      <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
                        <span className="text-sm text-gray-500">+{post.images.length - 3}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 통계 정보 및 투표 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <div className="flex items-center">
                    <span className="mr-1">👁️</span>
                    <span>{post.view_count}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="mr-1">💬</span>
                    <span>{post.comment_count}</span>
                  </div>
                </div>

                {/* 투표 버튼 */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleVote(post.id, 'like')
                    }}
                    disabled={!user}
                    className={`flex items-center space-x-1 px-2 py-1 rounded text-xs transition-all ${
                      userVotes[post.id] === 'like'
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-green-50 hover:text-green-600'
                    } ${!user ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <span>👍</span>
                    <span>{post.like_count}</span>
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleVote(post.id, 'dislike')
                    }}
                    disabled={!user}
                    className={`flex items-center space-x-1 px-2 py-1 rounded text-xs transition-all ${
                      userVotes[post.id] === 'dislike'
                        ? 'bg-red-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600'
                    } ${!user ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <span>👎</span>
                    <span>{post.dislike_count}</span>
                  </button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* 게시물이 없는 경우 */}
      {posts.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-4xl mb-4">📝</div>
          <p className="text-gray-600 mb-4">{t('community.galleryList.noPosts')}</p>
          {user && (
            <Button
              onClick={onCreatePost}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              첫 번째 글 작성하기
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
