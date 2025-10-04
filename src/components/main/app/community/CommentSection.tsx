'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useLanguage } from '@/context/LanguageContext'
import { useAuth } from '@/context/AuthContext'

interface Comment {
  id: string
  content: string
  like_count: number
  dislike_count: number
  created_at: string
  updated_at: string
  user: {
    id: string
    full_name: string
    avatar_url?: string
  }
  parent_id?: string
  replies?: Comment[]
  user_vote?: 'like' | 'dislike' | null
}

interface CommentSectionProps {
  postId: string
  onCommentCountChange?: (count: number) => void
}

export default function CommentSection({ postId, onCommentCountChange }: CommentSectionProps) {
  const { t, language } = useLanguage()
  const { user, token } = useAuth()
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'popular'>('newest')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const replyTextareaRef = useRef<HTMLTextAreaElement>(null)

  // 댓글 목록 로드
  const loadComments = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/posts/${postId}/comments`, {
        headers: user && token ? {
          'Authorization': `Bearer ${encodeURIComponent(token)}`
        } : {}
      })

      if (!response.ok) {
        throw new Error('댓글을 불러오는데 실패했습니다')
      }

      const data = await response.json()
      setComments(data.comments || [])
      
      if (onCommentCountChange) {
        onCommentCountChange(data.comments?.length || 0)
      }
    } catch (err) {
      console.error('댓글 로드 오류:', err)
      setError(err instanceof Error ? err.message : '댓글을 불러오는데 실패했습니다')
    } finally {
      setLoading(false)
    }
  }

  // 댓글 작성
  const handleSubmitComment = async () => {
    if (!user || !token) {
      setError('로그인이 필요합니다')
      return
    }

    if (!newComment.trim()) {
      setError('댓글 내용을 입력해주세요')
      return
    }

    try {
      setSubmitting(true)
      setError(null)

      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${encodeURIComponent(token)}`
        },
        body: JSON.stringify({
          content: newComment.trim(),
          parent_id: replyingTo || null
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '댓글 작성에 실패했습니다')
      }

      const data = await response.json()
      console.log('댓글 작성 성공:', data.comment.id)
      
      // 댓글 목록 새로고침
      await loadComments()
      
      // 폼 초기화
      setNewComment('')
      setReplyingTo(null)
      setReplyContent('')
      
      // 포커스 해제
      if (textareaRef.current) {
        textareaRef.current.blur()
      }
    } catch (err) {
      console.error('댓글 작성 오류:', err)
      setError(err instanceof Error ? err.message : '댓글 작성 중 오류가 발생했습니다')
    } finally {
      setSubmitting(false)
    }
  }

  // 답글 작성
  const handleSubmitReply = async (parentId: string) => {
    if (!user || !token) {
      setError('로그인이 필요합니다')
      return
    }

    if (!replyContent.trim()) {
      setError('답글 내용을 입력해주세요')
      return
    }

    try {
      setSubmitting(true)
      setError(null)

      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${encodeURIComponent(token)}`
        },
        body: JSON.stringify({
          content: replyContent.trim(),
          parent_id: parentId
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '답글 작성에 실패했습니다')
      }

      const data = await response.json()
      console.log('답글 작성 성공:', data.comment.id)
      
      // 댓글 목록 새로고침
      await loadComments()
      
      // 답글 폼 초기화
      setReplyingTo(null)
      setReplyContent('')
    } catch (err) {
      console.error('답글 작성 오류:', err)
      setError(err instanceof Error ? err.message : '답글 작성 중 오류가 발생했습니다')
    } finally {
      setSubmitting(false)
    }
  }

  // 댓글 추천/비추천
  const handleVote = async (commentId: string, voteType: 'like' | 'dislike') => {
    if (!user || !token) {
      setError('로그인이 필요합니다')
      return
    }

    try {
      const response = await fetch(`/api/comments/${commentId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${encodeURIComponent(token)}`
        },
        body: JSON.stringify({ vote_type: voteType })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '투표에 실패했습니다')
      }

      // 댓글 목록 새로고침
      await loadComments()
    } catch (err) {
      console.error('투표 오류:', err)
      setError(err instanceof Error ? err.message : '투표 중 오류가 발생했습니다')
    }
  }

  // 댓글 정렬
  const sortComments = (comments: Comment[]): Comment[] => {
    const sorted = [...comments].sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        case 'popular':
          return (b.like_count - b.dislike_count) - (a.like_count - a.dislike_count)
        default:
          return 0
      }
    })

    // 답글도 정렬
    return sorted.map(comment => ({
      ...comment,
      replies: comment.replies ? sortComments(comment.replies) : []
    }))
  }

  // 시간 포맷팅
  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (minutes < 1) return '방금 전'
    if (minutes < 60) return `${minutes}분 전`
    if (hours < 24) return `${hours}시간 전`
    if (days < 7) return `${days}일 전`
    
    return date.toLocaleDateString('ko-KR')
  }

  // 컴포넌트 마운트 시 댓글 로드
  useEffect(() => {
    loadComments()
  }, [postId, user])

  // 답글 입력창 포커스
  useEffect(() => {
    if (replyingTo && replyTextareaRef.current) {
      replyTextareaRef.current.focus()
    }
  }, [replyingTo])

  const sortedComments = sortComments(comments)

  return (
    <div className="space-y-6">
      {/* 댓글 헤더 */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800">
          댓글 {comments.length}개
        </h3>
        
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">정렬:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest' | 'popular')}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="newest">최신순</option>
            <option value="oldest">오래된순</option>
            <option value="popular">인기순</option>
          </select>
        </div>
      </div>

      {/* 댓글 작성 폼 */}
      {user ? (
        <Card className="p-4">
          <div className="flex space-x-3">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
              {user.user_metadata?.full_name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1">
              <textarea
                ref={textareaRef}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="댓글을 작성해주세요..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={3}
                maxLength={1000}
              />
              <div className="flex justify-between items-center mt-2">
                <p className="text-xs text-gray-500">{newComment.length}/1000</p>
                <Button
                  onClick={handleSubmitComment}
                  disabled={submitting || !newComment.trim()}
                  size="sm"
                  className="bg-blue-500 hover:bg-blue-600"
                >
                  {submitting ? '작성 중...' : '댓글 작성'}
                </Button>
              </div>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="p-4 bg-gray-50">
          <p className="text-gray-600 text-center">
            댓글을 작성하려면 로그인이 필요합니다.
          </p>
        </Card>
      )}

      {/* 오류 메시지 */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* 댓글 목록 */}
      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="text-gray-600 mt-2">댓글을 불러오는 중...</p>
        </div>
      ) : sortedComments.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-gray-600">아직 댓글이 없습니다. 첫 번째 댓글을 작성해보세요!</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {sortedComments.map((comment) => (
            <div key={comment.id} className="space-y-3">
              {/* 메인 댓글 */}
              <Card className="p-4">
                <div className="flex space-x-3">
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 text-sm font-medium">
                    {comment.user.full_name?.charAt(0) || 'U'}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="font-medium text-gray-800">
                        {comment.user.full_name || '익명'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatTime(comment.created_at)}
                      </span>
                    </div>
                    
                    <p className="text-gray-700 mb-3 whitespace-pre-wrap">
                      {comment.content}
                    </p>
                    
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={() => handleVote(comment.id, 'like')}
                        className={`flex items-center space-x-1 text-sm ${
                          comment.user_vote === 'like' 
                            ? 'text-blue-500' 
                            : 'text-gray-500 hover:text-blue-500'
                        }`}
                      >
                        <span>👍</span>
                        <span>{comment.like_count}</span>
                      </button>
                      
                      <button
                        onClick={() => handleVote(comment.id, 'dislike')}
                        className={`flex items-center space-x-1 text-sm ${
                          comment.user_vote === 'dislike' 
                            ? 'text-red-500' 
                            : 'text-gray-500 hover:text-red-500'
                        }`}
                      >
                        <span>👎</span>
                        <span>{comment.dislike_count}</span>
                      </button>
                      
                      {user && (
                        <button
                          onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                          className="text-sm text-gray-500 hover:text-blue-500"
                        >
                          답글
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>

              {/* 답글 입력창 */}
              {replyingTo === comment.id && user && (
                <Card className="p-4 ml-11 bg-blue-50">
                  <div className="flex space-x-3">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                      {user.user_metadata?.full_name?.charAt(0) || 'U'}
                    </div>
                    <div className="flex-1">
                      <textarea
                        ref={replyTextareaRef}
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        placeholder={`${comment.user.full_name}님에게 답글...`}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        rows={2}
                        maxLength={1000}
                      />
                      <div className="flex justify-end space-x-2 mt-2">
                        <Button
                          onClick={() => setReplyingTo(null)}
                          variant="outline"
                          size="sm"
                        >
                          취소
                        </Button>
                        <Button
                          onClick={() => handleSubmitReply(comment.id)}
                          disabled={submitting || !replyContent.trim()}
                          size="sm"
                          className="bg-blue-500 hover:bg-blue-600"
                        >
                          {submitting ? '작성 중...' : '답글 작성'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              {/* 답글 목록 */}
              {comment.replies && comment.replies.length > 0 && (
                <div className="ml-11 space-y-3">
                  {comment.replies.map((reply) => (
                    <Card key={reply.id} className="p-4 bg-gray-50">
                      <div className="flex space-x-3">
                        <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center text-white text-sm font-medium">
                          {reply.user.full_name?.charAt(0) || 'U'}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="font-medium text-gray-800">
                              {reply.user.full_name || '익명'}
                            </span>
                            <span className="text-xs text-gray-500">
                              {formatTime(reply.created_at)}
                            </span>
                          </div>
                          
                          <p className="text-gray-700 mb-3 whitespace-pre-wrap">
                            {reply.content}
                          </p>
                          
                          <div className="flex items-center space-x-4">
                            <button
                              onClick={() => handleVote(reply.id, 'like')}
                              className={`flex items-center space-x-1 text-sm ${
                                reply.user_vote === 'like' 
                                  ? 'text-blue-500' 
                                  : 'text-gray-500 hover:text-blue-500'
                              }`}
                            >
                              <span>👍</span>
                              <span>{reply.like_count}</span>
                            </button>
                            
                            <button
                              onClick={() => handleVote(reply.id, 'dislike')}
                              className={`flex items-center space-x-1 text-sm ${
                                reply.user_vote === 'dislike' 
                                  ? 'text-red-500' 
                                  : 'text-gray-500 hover:text-red-500'
                              }`}
                            >
                              <span>👎</span>
                              <span>{reply.dislike_count}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
