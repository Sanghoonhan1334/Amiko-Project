'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/context/LanguageContext'
import { useAuth } from '@/context/AuthContext'
import CommentSection from './CommentSection'

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
}


interface PostDetailProps {
  postId: string
  onBack: () => void
  onEdit?: () => void
  onDelete?: () => void
}

export default function PostDetail({ postId, onBack, onEdit, onDelete }: PostDetailProps) {
  const { t, language } = useLanguage()
  const { user } = useAuth()
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userVote, setUserVote] = useState<'like' | 'dislike' | null>(null)

  useEffect(() => {
    loadPost()
    loadUserVote()
  }, [postId])

  const loadPost = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/posts/${postId}`)
      
      if (!response.ok) {
        throw new Error('게시물을 불러오는데 실패했습니다')
      }
      
      const data = await response.json()
      setPost(data.post)
    } catch (err) {
      console.error('게시물 로드 오류:', err)
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }


  const loadUserVote = async () => {
    if (!user) return
    
    try {
      const response = await fetch(`/api/posts/${postId}/vote`, {
        headers: {
          'Authorization': `Bearer ${user.access_token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setUserVote(data.vote_type)
      }
    } catch (err) {
      console.error('투표 정보 로드 오류:', err)
    }
  }

  const handleVote = async (voteType: 'like' | 'dislike') => {
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
      
      setUserVote(data.vote_type)
      if (post) {
        setPost({
          ...post,
          like_count: data.like_count,
          dislike_count: data.dislike_count
        })
      }
    } catch (err) {
      console.error('투표 오류:', err)
      setError(err instanceof Error ? err.message : '투표 처리 중 오류가 발생했습니다')
    }
  }


  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('ko-KR')
  }

  const formatContent = (content: string) => {
    // 간단한 HTML 태그 처리 (실제로는 더 복잡한 마크다운 파서 사용 권장)
    return content
      .replace(/\n/g, '<br />')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">게시물을 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <p className="text-red-600 mb-4">{error || '게시물을 찾을 수 없습니다'}</p>
          <Button onClick={onBack} variant="outline">
            ← 목록으로 돌아가기
          </Button>
        </div>
      </div>
    )
  }

  const isAuthor = user && user.id === post.user.id

  return (
    <div className="space-y-6">
      {/* 뒤로가기 버튼 */}
      <Button onClick={onBack} variant="outline" className="mb-4">
        ← 목록으로 돌아가기
      </Button>

      {/* 게시물 상세 */}
      <Card className="p-6">
        {/* 게시물 헤더 */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center space-x-3">
            {/* 작성자 아바타 */}
            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
              {post.user.avatar_url ? (
                <img 
                  src={post.user.avatar_url} 
                  alt={post.user.full_name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span className="text-lg font-medium text-gray-600">
                  {post.user.full_name.charAt(0)}
                </span>
              )}
            </div>
            
            <div>
              <p className="font-semibold text-gray-800">{post.user.full_name}</p>
              <p className="text-sm text-gray-500">{formatDate(post.created_at)}</p>
            </div>
          </div>

          {/* 상태 배지 및 액션 버튼 */}
          <div className="flex items-center space-x-2">
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
            
            {isAuthor && (
              <div className="flex space-x-2">
                <Button size="sm" variant="outline" onClick={onEdit}>
                  수정
                </Button>
                <Button size="sm" variant="outline" onClick={onDelete}>
                  삭제
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* 게시물 제목 */}
        <h1 className="text-2xl font-bold text-gray-800 mb-4">{post.title}</h1>

        {/* 게시물 내용 */}
        <div 
          className="prose max-w-none mb-6"
          dangerouslySetInnerHTML={{ __html: formatContent(post.content) }}
        />

        {/* 이미지 갤러리 */}
        {post.images && post.images.length > 0 && (
          <div className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {post.images.map((image, index) => (
                <div key={index} className="relative group">
                  <img 
                    src={image} 
                    alt={`첨부 이미지 ${index + 1}`}
                    className="w-full h-48 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => window.open(image, '_blank')}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 통계 및 액션 */}
        <div className="flex items-center justify-between pt-6 border-t">
          <div className="flex items-center space-x-6 text-sm text-gray-500">
            <div className="flex items-center">
              <span className="mr-1">👁️</span>
              <span>{post.view_count}</span>
            </div>
            <div className="flex items-center">
              <span className="mr-1">💬</span>
              <span>{post.comment_count}</span>
            </div>
          </div>

          {/* 추천/비추천 버튼 */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => handleVote('like')}
              disabled={!user}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                userVote === 'like'
                  ? 'bg-green-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-green-50 hover:text-green-600'
              } ${!user ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <span className="text-lg">👍</span>
              <span className="font-medium">{post.like_count}</span>
            </button>
            
            <button
              onClick={() => handleVote('dislike')}
              disabled={!user}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                userVote === 'dislike'
                  ? 'bg-red-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-red-50 hover:text-red-600'
              } ${!user ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <span className="text-lg">👎</span>
              <span className="font-medium">{post.dislike_count}</span>
            </button>
            
            {!user && (
              <span className="text-xs text-gray-500 ml-2">
                로그인 후 투표 가능
              </span>
            )}
          </div>
        </div>
      </Card>

      {/* 댓글 섹션 */}
      <CommentSection 
        postId={post.id} 
        onCommentCountChange={(count) => {
          // 댓글 수가 변경되면 게시물 정보 업데이트
          setPost(prev => prev ? { ...prev, comment_count: count } : null)
        }}
      />
    </div>
  )
}