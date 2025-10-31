'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Languages } from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { TranslationService } from '@/lib/translation'
import UserBadge from '@/components/common/UserBadge'

interface Comment {
  id: string
  content: string
  like_count: number
  dislike_count: number
  created_at: string
  updated_at: string
  author?: {
    id: string
    full_name: string
    profile_image?: string
    nickname?: string
    total_points?: number
    is_vip?: boolean
  }
  user?: {
    id: string
    full_name: string
    avatar_url?: string
  }
  parent_comment_id?: string
  replies?: Comment[]
  user_vote?: 'like' | 'dislike' | null
  // 번역된 필드들
  translatedContent?: string
}

interface CommentSectionProps {
  postId: string
  onCommentCountChange?: (count: number) => void
}

export default function CommentSection({ postId, onCommentCountChange }: CommentSectionProps) {
  const { t, language } = useLanguage()
  const { user, token } = useAuth()
  const router = useRouter()
  
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [commentContent, setCommentContent] = useState('')
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [sortBy, setSortBy] = useState<'latest' | 'oldest' | 'replies'>('latest')
  const [translatingComments, setTranslatingComments] = useState<Set<string>>(new Set())
  const [currentUserProfile, setCurrentUserProfile] = useState<{ name: string; avatar: string | null } | null>(null)
  
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const replyTextareaRef = useRef<HTMLTextAreaElement>(null)
  const translationService = new TranslationService()

  // 현재 사용자 프로필 정보 로드
  useEffect(() => {
    const loadUserProfile = async () => {
      if (!user?.id || !token) {
        setCurrentUserProfile(null)
        return
      }

      try {
        const response = await fetch('/api/profile', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        if (response.ok) {
          const data = await response.json()
          const profile = data.user || data.profile
          const displayName = profile?.display_name || profile?.full_name || profile?.nickname || user.email?.split('@')[0] || 'U'
          const avatarUrl = profile?.profile_image || profile?.avatar_url || null
          
          setCurrentUserProfile({
            name: displayName,
            avatar: avatarUrl
          })
        }
      } catch (error) {
        console.error('프로필 로드 실패:', error)
        setCurrentUserProfile(null)
      }
    }

    loadUserProfile()
  }, [user, token])

  // 댓글 로딩
  const loadComments = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/posts/${postId}/comments`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          const allComments = data.comments || []
          
          // 댓글을 계층 구조로 재구성
          const commentMap = new Map()
          const rootComments: Comment[] = []
          
          // 1단계: 모든 댓글을 Map에 저장
          allComments.forEach((comment: Comment) => {
            commentMap.set(comment.id, { ...comment, replies: [] })
          })
          
          // 2단계: 부모-자식 관계 설정
          allComments.forEach((comment: any) => {
            const commentWithReplies = commentMap.get(comment.id)
            if (comment.parent_comment_id) {
              // 대댓글인 경우 부모의 replies에 추가
              const parent = commentMap.get(comment.parent_comment_id)
              if (parent) {
                parent.replies.push(commentWithReplies)
              } else {
                // 부모를 찾을 수 없으면 루트로 추가
                rootComments.push(commentWithReplies)
              }
            } else {
              // 루트 댓글
              rootComments.push(commentWithReplies)
            }
          })
          
          setComments(rootComments)
          onCommentCountChange?.(allComments.length)
        }
      }
    } catch (error) {
      console.error('댓글 로딩 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  // 댓글 작성
  const handleSubmitComment = async () => {
    if (!commentContent.trim() || submitting) return

    try {
      setSubmitting(true)
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          content: commentContent.trim(),
          parent_comment_id: null
        })
      })

      if (response.ok) {
        setCommentContent('')
        await loadComments()
      }
    } catch (error) {
      console.error('댓글 작성 오류:', error)
    } finally {
      setSubmitting(false)
    }
  }

  // 답글 작성
  const handleSubmitReply = async (parentId: string) => {
    if (!replyContent.trim() || submitting) return

    try {
      setSubmitting(true)
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          content: replyContent.trim(),
          parent_comment_id: parentId
        })
      })

      if (response.ok) {
        setReplyContent('')
        setReplyingTo(null)
        await loadComments()
      }
    } catch (error) {
      console.error('답글 작성 오류:', error)
    } finally {
      setSubmitting(false)
    }
  }

  // 추천/비추천
  const handleVote = async (commentId: string, voteType: 'like' | 'dislike') => {
    if (!user || !token) return

    // Optimistic UI Update - 즉시 UI에 반영
    setComments(prevComments => {
      return prevComments.map(comment => {
        if (comment.id === commentId) {
          const prevVote = comment.user_vote
          let newLikeCount = comment.like_count
          let newDislikeCount = comment.dislike_count
          let newUserVote: 'like' | 'dislike' | null = voteType

          // 이전 투표 취소
          if (prevVote === 'like') {
            newLikeCount--
          } else if (prevVote === 'dislike') {
            newDislikeCount--
          }

          // 새 투표 또는 취소
          if (prevVote === voteType) {
            // 같은 버튼 클릭 시 취소
            newUserVote = null
          } else {
            // 다른 버튼 클릭 시 적용
            if (voteType === 'like') {
              newLikeCount++
            } else {
              newDislikeCount++
            }
          }

          return {
            ...comment,
            like_count: newLikeCount,
            dislike_count: newDislikeCount,
            user_vote: newUserVote
          }
        }
        
        // 대댓글도 처리
        if (comment.replies) {
          return {
            ...comment,
            replies: comment.replies.map(reply => {
              if (reply.id === commentId) {
                const prevVote = reply.user_vote
                let newLikeCount = reply.like_count
                let newDislikeCount = reply.dislike_count
                let newUserVote: 'like' | 'dislike' | null = voteType

                if (prevVote === 'like') {
                  newLikeCount--
                } else if (prevVote === 'dislike') {
                  newDislikeCount--
                }

                if (prevVote === voteType) {
                  newUserVote = null
                } else {
                  if (voteType === 'like') {
                    newLikeCount++
                  } else {
                    newDislikeCount++
                  }
                }

                return {
                  ...reply,
                  like_count: newLikeCount,
                  dislike_count: newDislikeCount,
                  user_vote: newUserVote
                }
              }
              return reply
            })
          }
        }
        
        return comment
      })
    })

    // 백그라운드에서 API 호출 (에러 시에만 복구)
    try {
      const response = await fetch(`/api/posts/${postId}/comments/${commentId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ vote_type: voteType })
      })

      if (!response.ok) {
        // 실패 시 원래 상태로 복구
        await loadComments()
      }
    } catch (error) {
      console.error('투표 오류:', error)
      // 에러 시 원래 상태로 복구
      await loadComments()
    }
  }

  // 댓글 번역
  const handleTranslateComment = async (commentId: string, isReply: boolean = false) => {
    if (translatingComments.has(commentId)) return // 이미 번역 중이면 무시
    
    setTranslatingComments(prev => new Set(prev).add(commentId))
    
    try {
      // 댓글 찾기
      let targetComment: Comment | null = null
      let commentPath: string[] = []
      
      if (isReply) {
        // 답글인 경우
        for (const comment of comments) {
          if (comment.replies) {
            const reply = comment.replies.find(r => r.id === commentId)
            if (reply) {
              targetComment = reply
              commentPath = [comment.id, 'replies']
              break
            }
          }
        }
      } else {
        // 메인 댓글인 경우
        targetComment = comments.find(c => c.id === commentId) || null
        commentPath = [commentId]
      }
      
      if (!targetComment) return
      
      const targetLang = language === 'ko' ? 'es' : 'ko'
      const translatedContent = await translationService.translate(targetComment.content, targetLang)
      
      // 상태 업데이트
      setComments(prevComments => {
        if (isReply) {
          // 답글 번역
          return prevComments.map(comment => {
            if (comment.id === commentPath[0] && comment.replies) {
              return {
                ...comment,
                replies: comment.replies.map(reply => 
                  reply.id === commentId 
                    ? { ...reply, translatedContent }
                    : reply
                )
              }
            }
            return comment
          })
        } else {
          // 메인 댓글 번역
          return prevComments.map(comment => 
            comment.id === commentId 
              ? { ...comment, translatedContent }
              : comment
          )
        }
      })
    } catch (error) {
      console.error('댓글 번역 실패:', error)
    } finally {
      setTranslatingComments(prev => {
        const newSet = new Set(prev)
        newSet.delete(commentId)
        return newSet
      })
    }
  }

  // 시간 포맷팅
  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return t('community.postDetail.timeAgo.now')
    if (diffInMinutes < 60) return t('community.postDetail.timeAgo.minutes').replace('{count}', String(diffInMinutes))
    if (diffInMinutes < 1440) return t('community.postDetail.timeAgo.hours').replace('{count}', String(Math.floor(diffInMinutes / 60)))
    const locale = language === 'es' ? 'es-ES' : 'ko-KR'
    return date.toLocaleDateString(locale, { month: 'short', day: 'numeric' })
  }

  // 댓글 정렬
  const sortedComments = [...comments].sort((a, b) => {
    switch (sortBy) {
      case 'oldest':
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      case 'replies':
        return (b.replies?.length || 0) - (a.replies?.length || 0)
      case 'latest':
      default:
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    }
  })

  useEffect(() => {
    loadComments()
  }, [postId])

  return (
    <div className="space-y-4">
      {/* 댓글 헤더 */}
      <div className="px-4 pt-3 md:pt-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm md:text-lg font-semibold text-gray-800">
            {t('freeboard.commentHeader')} {comments.length}
          </h3>
        </div>
        
        <div className="flex items-center space-x-1 md:space-x-2">
          <button
            onClick={() => setSortBy('latest')}
            className={`text-[10px] md:text-sm px-1.5 md:px-2 py-0.5 md:py-1 rounded ${
              sortBy === 'latest' ? 'bg-blue-100 text-blue-700' : 'text-gray-500'
            }`}
          >
            {t('freeboard.commentSort.latest')}
          </button>
          <button
            onClick={() => setSortBy('oldest')}
            className={`text-[10px] md:text-sm px-1.5 md:px-2 py-0.5 md:py-1 rounded ${
              sortBy === 'oldest' ? 'bg-blue-100 text-blue-700' : 'text-gray-500'
            }`}
          >
            {t('freeboard.commentSort.oldest')}
          </button>
          <button
            onClick={() => setSortBy('replies')}
            className={`text-[10px] md:text-sm px-1.5 md:px-2 py-0.5 md:py-1 rounded ${
              sortBy === 'replies' ? 'bg-blue-100 text-blue-700' : 'text-gray-500'
            }`}
          >
            {t('freeboard.commentSort.replies')}
          </button>
        </div>
      </div>

      {/* 댓글 작성 폼 */}
      {user ? (
        <div className="px-4 py-3 md:py-4 border-t border-gray-200">
          <div className="flex space-x-3">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium overflow-hidden">
              {currentUserProfile?.avatar ? (
                <img 
                  src={currentUserProfile.avatar} 
                  alt="프로필"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{(currentUserProfile?.name || user.user_metadata?.full_name || user.email?.charAt(0) || 'U').charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div className="flex-1">
              <textarea
                ref={textareaRef}
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                placeholder={t('freeboard.commentPlaceholder')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-xs md:text-sm"
                rows={3}
                maxLength={1000}
              />
              <div className="flex justify-between items-center mt-2">
                <span className="text-[10px] md:text-xs text-gray-500">
                  {commentContent.length}/1000
                </span>
                <Button
                  onClick={handleSubmitComment}
                  disabled={submitting || !commentContent.trim()}
                  size="sm"
                  className="bg-blue-500 hover:bg-blue-600 text-white text-xs md:text-sm px-3 py-1.5 md:px-4 md:py-2"
                >
                  {submitting ? t('freeboard.commentWriting') : t('freeboard.commentWrite')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="px-4 py-3 md:py-4 border-t border-gray-200">
          <p className="text-center text-xs md:text-sm text-gray-600">
            {t('freeboard.commentLoginRequired')}
          </p>
        </div>
      )}

      {/* 댓글 목록 */}
      {loading ? (
        <div className="text-center py-8 px-4">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600 dark:border-gray-400"></div>
          <p className="text-gray-600 mt-2">{t('stories.loadingComments')}</p>
        </div>
      ) : sortedComments.length === 0 ? (
        <div className="px-4 py-8 text-center">
          <p className="text-gray-600">{t('community.postDetail.noComments')}</p>
        </div>
      ) : (
        <div>
          {sortedComments.map((comment, index) => (
            <div key={comment.id}>
              {/* 메인 댓글 */}
              <div className={`p-4 ${index > 0 ? 'border-t border-gray-200' : ''}`}>
                <div className="flex space-x-3">
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 text-sm font-medium">
                    {(comment.author?.nickname || comment.author?.full_name)?.charAt(0) || 'U'}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="font-medium text-xs md:text-sm text-gray-800">
                        {comment.author?.nickname || comment.author?.full_name || t('freeboard.anonymous')}
                        <UserBadge totalPoints={comment.author?.total_points || 0} isVip={comment.author?.is_vip || false} small />
                      </span>
                      <span className="text-[10px] md:text-xs text-gray-500">
                        {formatTime(comment.created_at)}
                      </span>
                    </div>
                    
                    <div className="mb-2 md:mb-3">
                      <p className="text-xs md:text-sm text-gray-700 whitespace-pre-wrap">
                        {comment.translatedContent || comment.content}
                      </p>
                      {comment.translatedContent && (
                        <span className="text-[10px] md:text-xs text-blue-500">{t('freeboard.translated')}</span>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2 md:space-x-4">
                      <button
                        onClick={() => handleVote(comment.id, 'like')}
                        className={`flex items-center space-x-1 text-xs md:text-sm ${
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
                        className={`flex items-center space-x-1 text-xs md:text-sm ${
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
                          onClick={() => setReplyingTo(comment.id)}
                          className="text-xs md:text-sm text-gray-500 hover:text-blue-500"
                        >
                          {t('freeboard.replyButton')}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* 답글 입력창 */}
                {replyingTo === comment.id && user && (
                  <div className="ml-11 mt-3 p-3 md:p-4 bg-blue-50">
                    <div className="flex space-x-3">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium overflow-hidden">
                        {currentUserProfile?.avatar ? (
                          <img 
                            src={currentUserProfile.avatar} 
                            alt="프로필"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span>{(currentUserProfile?.name || user.user_metadata?.full_name || user.email?.charAt(0) || 'U').charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <textarea
                          ref={replyTextareaRef}
                          value={replyContent}
                          onChange={(e) => setReplyContent(e.target.value)}
                          placeholder={t('freeboard.replyPlaceholder').replace('{name}', comment.author?.full_name || t('freeboard.anonymous'))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-xs md:text-sm"
                          rows={2}
                          maxLength={1000}
                        />
                        <div className="flex justify-end space-x-2 mt-2">
                          <Button
                            onClick={() => setReplyingTo(null)}
                            variant="outline"
                            size="sm"
                            className="text-xs md:text-sm px-2 py-1 md:px-4 md:py-2"
                          >
                            {t('freeboard.replyCancel')}
                          </Button>
                          <Button
                            onClick={() => handleSubmitReply(comment.id)}
                            disabled={submitting || !replyContent.trim()}
                            size="sm"
                            className="bg-blue-500 hover:bg-blue-600 text-xs md:text-sm px-2 py-1 md:px-4 md:py-2"
                          >
                            {submitting ? t('freeboard.replyWriting') : t('freeboard.replyWrite')}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 답글 목록 */}
                {comment.replies && comment.replies.length > 0 && (
                  <div className="ml-11 mt-3 space-y-3">
                    {comment.replies.map((reply) => (
                      <div key={reply.id} className="p-3 md:p-4 bg-gray-50">
                        <div className="flex space-x-3">
                          <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center text-white text-sm font-medium">
                            {(reply.author?.nickname || reply.author?.full_name)?.charAt(0) || 'U'}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="font-medium text-xs md:text-sm text-gray-800">
                                {reply.author?.nickname || reply.author?.full_name || t('freeboard.anonymous')}
                                <UserBadge totalPoints={reply.author?.total_points || 0} isVip={reply.author?.is_vip || false} small />
                              </span>
                              <span className="text-[10px] md:text-xs text-gray-500">
                                {formatTime(reply.created_at)}
                              </span>
                            </div>
                            
                            <div className="mb-2 md:mb-3">
                              <p className="text-xs md:text-sm text-gray-700 whitespace-pre-wrap">
                                {reply.translatedContent || reply.content}
                              </p>
                              {reply.translatedContent && (
                                <span className="text-[10px] md:text-xs text-blue-500">{t('freeboard.translated')}</span>
                              )}
                            </div>
                            
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
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}