'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/context/LanguageContext'
import { useAuth } from '@/context/AuthContext'
import { UserBadge } from '@/components/UserBadge'

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
  is_popular: boolean
  created_at: string
  updated_at: string
  user: {
    id: string
    full_name: string
    avatar_url?: string
    nickname?: string
    total_points?: number
    is_vip?: boolean
  }
  gallery: {
    id: string
    slug: string
    name_ko: string
    icon: string
    color: string
  }
}

interface PopularPostsProps {
  onPostSelect: (post: Post) => void
}

export default function PopularPosts({ onPostSelect }: PopularPostsProps) {
  const { t, language } = useLanguage()
  const { user } = useAuth()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'hot' | 'popular' | 'all'>('hot')
  const [userVotes, setUserVotes] = useState<Record<string, 'like' | 'dislike' | null>>({})

  useEffect(() => {
    loadPopularPosts()
  }, [filter])

  const loadPopularPosts = async () => {
    try {
      setLoading(true)
      setError(null)

      let query = ''
      switch (filter) {
        case 'hot':
          query = '?filter=hot'
          break
        case 'popular':
          query = '?filter=popular'
          break
        default:
          query = '?filter=all'
      }

      const response = await fetch(`/api/posts/popular${query}`, {
        headers: user ? {
          'Authorization': `Bearer ${encodeURIComponent(user.access_token)}`
        } : {}
      })

      if (!response.ok) {
        throw new Error('인기글을 불러오는데 실패했습니다')
      }

      const data = await response.json()
      setPosts(data.posts || [])
    } catch (err) {
      console.error('인기글 로드 오류:', err)
      setError(err instanceof Error ? err.message : '인기글을 불러오는데 실패했습니다')
    } finally {
      setLoading(false)
    }
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
          'Authorization': `Bearer ${encodeURIComponent(user.access_token)}`
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return '방금 전'
    if (diffInHours < 24) return `${diffInHours}시간 전`
    if (diffInHours < 48) return '어제'
    return date.toLocaleDateString('ko-KR')
  }

  const getPostPreview = (content: string) => {
    const textContent = content.replace(/<[^>]*>/g, '')
    return textContent.length > 100 ? textContent.substring(0, 100) + '...' : textContent
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600 dark:border-gray-400"></div>
          <p className="text-gray-600 mt-2">인기글을 불러오는 중...</p>
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
            onClick={loadPopularPosts}
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
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            {filter === 'hot' ? '🔥 핫글' : filter === 'popular' ? '⭐ 인기글' : '📈 인기 게시물'}
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            {filter === 'hot' ? '최근 6시간 내 폭발적인 인기' : 
             filter === 'popular' ? '최근 24시간 내 높은 인기도' : 
             '핫글과 인기글을 모두 보기'}
          </p>
        </div>
      </div>

      {/* 필터 버튼 */}
      <div className="flex space-x-2">
        <Button
          onClick={() => setFilter('hot')}
          variant={filter === 'hot' ? 'default' : 'outline'}
          className={filter === 'hot' ? 'bg-red-500 hover:bg-red-600' : ''}
        >
          🔥 핫글
        </Button>
        <Button
          onClick={() => setFilter('popular')}
          variant={filter === 'popular' ? 'default' : 'outline'}
          className={filter === 'popular' ? 'bg-yellow-500 hover:bg-yellow-600' : ''}
        >
          ⭐ 인기글
        </Button>
        <Button
          onClick={() => setFilter('all')}
          variant={filter === 'all' ? 'default' : 'outline'}
        >
          📈 전체
        </Button>
      </div>

      {/* 게시물 목록 */}
      <div className="space-y-4">
        {posts.map((post) => (
          <Card 
            key={post.id} 
            className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => onPostSelect(post)}
          >
            <div className="space-y-4">
              {/* 게시물 헤더 */}
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  {/* 갤러리 아이콘 */}
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
                    style={{ backgroundColor: post.gallery.color + '20' }}
                  >
                    {post.gallery.icon}
                  </div>
                  
                  {/* 갤러리 이름 */}
                  <span className="text-sm font-medium text-gray-600">
                    {post.gallery.name_ko}
                  </span>
                  
                  {/* 상태 배지 */}
                  <div className="flex space-x-1">
                    {post.is_pinned && (
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 text-xs">
                        📌 고정
                      </Badge>
                    )}
                    {post.is_hot && (
                      <Badge variant="secondary" className="bg-red-100 text-red-700 text-xs">
                        🔥 핫글
                      </Badge>
                    )}
                    {post.is_popular && !post.is_pinned && (
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 text-xs">
                        ⭐ 인기글
                      </Badge>
                    )}
                  </div>
                </div>

                {/* 작성자 정보 */}
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium text-gray-600">
                      {(post.user.nickname || post.user.full_name)?.charAt(0) || 'U'}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {post.user.nickname || post.user.full_name || '익명'}
                      <UserBadge totalPoints={post.user.total_points || 0} isVip={post.user.is_vip || false} small />
                    </p>
                    <p className="text-xs text-gray-500">{formatDate(post.created_at)}</p>
                  </div>
                </div>
              </div>

              {/* 게시물 제목 */}
              <h3 className="text-lg font-semibold text-gray-800 line-clamp-2">
                {post.title}
              </h3>

              {/* 게시물 미리보기 */}
              <p className="text-gray-600 line-clamp-3">
                {getPostPreview(post.content)}
              </p>

              {/* 이미지 미리보기 */}
              {post.images && post.images.length > 0 && (
                <div className="flex space-x-2">
                  {post.images.slice(0, 3).map((image, index) => (
                    <div key={index} className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden">
                      <img 
                        src={image} 
                        alt={`첨부 이미지 ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                  {post.images.length > 3 && (
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                      <span className="text-xs text-gray-500">+{post.images.length - 3}</span>
                    </div>
                  )}
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
        <Card className="p-8 text-center">
          <div className="text-gray-400 text-4xl mb-4">
            {filter === 'hot' ? '🔥' : filter === 'popular' ? '⭐' : '📈'}
          </div>
          <p className="text-gray-600 mb-2">
            {filter === 'hot' ? '아직 핫글이 없습니다' : 
             filter === 'popular' ? '아직 인기글이 없습니다' : 
             '아직 인기 게시물이 없습니다'}
          </p>
          <p className="text-sm text-gray-500">
            게시물에 추천을 많이 받으면 인기글이 될 수 있습니다!
          </p>
        </Card>
      )}
    </div>
  )
}
