'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { 
  ThumbsUp, 
  ThumbsDown,
  MessageSquare,
  User,
  Clock,
  Star,
  Pin,
  Trophy,
  Send,
  Edit,
  Trash2
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { createClientComponentClient } from '@/lib/supabase'
import UserProfileModal from '@/components/common/UserProfileModal'

interface Comment {
  id: string
  content: string
  parent_id?: string
  like_count: number
  dislike_count: number
  created_at: string
  author: {
    id: string
    full_name: string
    profile_image?: string
  }
  replies?: Comment[]
}

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

interface PostDetailProps {
  post: Post
  onClose: () => void
  onUpdate: () => void
}

export default function PostDetail({ post, onClose, onUpdate }: PostDetailProps) {
  const { user, token } = useAuth()
  const supabase = createClientComponentClient()
  
  // 상태 관리
  const [postData, setPostData] = useState<Post>(post)
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userReaction, setUserReaction] = useState<'like' | 'dislike' | null>(null)
  const [reactionLoading, setReactionLoading] = useState(false)
  const reactionTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  // 댓글 작성
  const [newComment, setNewComment] = useState('')
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [commentLoading, setCommentLoading] = useState(false)
  
  // 프로필 모달 상태
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)

  // 게시글 상세 조회
  const fetchPostDetail = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/posts/${post.id}`)
      
      if (!response.ok) {
        throw new Error('게시글을 불러오는데 실패했습니다.')
      }

      const data = await response.json()
      setPostData(data.post)
    } catch (err) {
      console.error('게시글 상세 조회 실패:', err)
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  // 댓글 목록 조회
  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/posts/${post.id}/comments`)
      
      if (!response.ok) {
        throw new Error('댓글 목록을 불러오는데 실패했습니다.')
      }

      const data = await response.json()
      setComments(data.comments)
    } catch (err) {
      console.error('댓글 목록 조회 실패:', err)
    }
  }

  // 사용자 반응 상태 조회
  const fetchUserReaction = async () => {
    if (!user) return

    try {
      // AuthContext에서 토큰 가져오기
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
      
      if (!currentToken) return
      const response = await fetch(`/api/posts/${post.id}/reactions`, {
        headers: {
          'Authorization': `Bearer ${currentToken}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setUserReaction(data.user_reaction)
      }
    } catch (err) {
      console.error('사용자 반응 조회 실패:', err)
    }
  }

  // 게시글 반응 토글
  const handleReaction = async (reactionType: 'like' | 'dislike') => {
    console.log('반응 버튼 클릭됨:', reactionType)
    
    // 이미 처리 중이면 무시
    // Ignore if already processing
    if (reactionLoading) {
      console.log('반응 처리 중이므로 무시')
      return
    }
    
    if (!user) {
      console.log('사용자가 로그인되지 않음')
      setError('로그인이 필요합니다.')
      return
    }

    // 즉시 UI 업데이트 (낙관적 업데이트)
    // Immediate UI update (optimistic update)
    const currentReaction = userReaction
    const newReaction = currentReaction === reactionType ? null : reactionType
    
    // 로컬 상태 즉시 업데이트
    // Update local state immediately
    setUserReaction(newReaction)
    setPostData(prev => {
      const newData = { ...prev }
      
      if (currentReaction === 'like') {
        newData.like_count = Math.max(0, newData.like_count - 1)
      } else if (currentReaction === 'dislike') {
        newData.dislike_count = Math.max(0, newData.dislike_count - 1)
      }
      
      if (newReaction === 'like') {
        newData.like_count += 1
      } else if (newReaction === 'dislike') {
        newData.dislike_count += 1
      }
      
      return newData
    })

    // 짧은 로딩 상태 (중복 클릭 방지용)
    // Short loading state (for preventing duplicate clicks)
    setReactionLoading(true)
    
    // 기존 타이머가 있으면 취소
    // Cancel existing timer if any
    if (reactionTimeoutRef.current) {
      clearTimeout(reactionTimeoutRef.current)
    }
    
    // 짧은 지연 후 로딩 해제 (사용자 경험 개선)
    // Short delay before clearing loading (improve UX)
    reactionTimeoutRef.current = setTimeout(() => {
      setReactionLoading(false)
      reactionTimeoutRef.current = null
    }, 100) // 100ms 후 로딩 해제 (매우 빠르게)
    
    try {
      // AuthContext에서 토큰 가져오기
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
      
      console.log('토큰 상태:', { token: !!currentToken, user: !!user })
      
      if (!currentToken) {
        console.log('토큰이 없음')
        setError('인증 토큰을 가져올 수 없습니다. 다시 로그인해주세요.')
        // 실패 시 원래 상태로 복원
        // Restore original state on failure
        setUserReaction(currentReaction)
        setPostData(prev => ({
          ...prev,
          like_count: postData.like_count,
          dislike_count: postData.dislike_count
        }))
        return
      }
      
      console.log('API 요청 시작:', { postId: post.id, reactionType })
      
      const response = await fetch(`/api/posts/${post.id}/reactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentToken}`
        },
        body: JSON.stringify({ reaction_type: reactionType })
      })

      console.log('API 응답 상태:', response.status)

      if (!response.ok) {
        const errorData = await response.json()
        console.error('API 에러:', errorData)
        throw new Error(errorData.error || '반응 처리에 실패했습니다.')
      }

      const data = await response.json()
      console.log('반응 처리 성공:', data)
      console.log('카운트 상세:', data.counts)
      
      // 서버에서 받은 실제 데이터로 동기화
      // Sync with actual data from server
      console.log('서버 카운트로 업데이트:', {
        like_count: data.counts.like_count,
        dislike_count: data.counts.dislike_count
      })
      
      setUserReaction(data.reaction_type)
      setPostData(prev => ({
        ...prev,
        like_count: data.counts.like_count,
        dislike_count: data.counts.dislike_count
      }))
    } catch (err) {
      console.error('반응 처리 실패:', err)
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.')
      
      // 실패 시 원래 상태로 복원
      // Restore original state on failure
      setUserReaction(currentReaction)
      setPostData(prev => ({
        ...prev,
        like_count: postData.like_count,
        dislike_count: postData.dislike_count
      }))
    }
  }

  // 댓글 작성
  const handleCommentSubmit = async () => {
    if (!user) {
      setError('로그인이 필요합니다.')
      return
    }

    if (!newComment.trim()) {
      setError('댓글 내용을 입력해주세요.')
      return
    }

    try {
      setCommentLoading(true)
      setError(null)

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
      
      if (!currentToken) {
        setError('인증 토큰을 가져올 수 없습니다. 다시 로그인해주세요.')
        return
      }
      
      const response = await fetch(`/api/posts/${post.id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentToken}`
        },
        body: JSON.stringify({
          content: newComment.trim(),
          parent_id: replyTo
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '댓글 작성에 실패했습니다.')
      }

      // 댓글 작성 성공
      setNewComment('')
      setReplyTo(null)
      setReplyContent('')
      
      // 댓글 목록 새로고침
      await fetchComments()
      
      // 게시글 데이터 업데이트
      await fetchPostDetail()
    } catch (err) {
      console.error('댓글 작성 실패:', err)
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.')
    } finally {
      setCommentLoading(false)
    }
  }

  // 프로필 보기
  const handleViewProfile = (userId: string) => {
    setSelectedUserId(userId)
    setShowProfileModal(true)
  }

  // 대댓글 작성
  const handleReplySubmit = async (parentId: string) => {
    if (!user) {
      setError('로그인이 필요합니다.')
      return
    }

    if (!replyContent.trim()) {
      setError('댓글 내용을 입력해주세요.')
      return
    }

    try {
      setCommentLoading(true)
      setError(null)

      // AuthContext에서 토큰 가져오기
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
      
      const response = await fetch(`/api/posts/${post.id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentToken}`
        },
        body: JSON.stringify({
          content: replyContent.trim(),
          parent_id: parentId
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '댓글 작성에 실패했습니다.')
      }

      // 대댓글 작성 성공
      setReplyContent('')
      
      // 댓글 목록 새로고침
      await fetchComments()
      
      // 게시글 데이터 업데이트
      await fetchPostDetail()
    } catch (err) {
      console.error('대댓글 작성 실패:', err)
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.')
    } finally {
      setCommentLoading(false)
    }
  }

  // 날짜 포맷팅
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // 초기 로드
  useEffect(() => {
    fetchPostDetail()
    fetchComments()
    fetchUserReaction()
  }, [post.id])

  // 컴포넌트 언마운트 시 타이머 정리
  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (reactionTimeoutRef.current) {
        clearTimeout(reactionTimeoutRef.current)
      }
    }
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">{t('postDetail.loadingPost')}</p>
        </div>
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

      {/* 게시글 상세 */}
      <Card className="p-6">
        <div className="space-y-4">
          {/* 제목 및 메타 정보 */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              {postData.is_notice && <Pin className="w-4 h-4 text-red-500" />}
              {postData.is_survey && <Trophy className="w-4 h-4 text-green-500" />}
              {postData.is_verified && <Star className="w-4 h-4 text-blue-500" />}
              <h1 className="text-2xl font-bold text-gray-900">{postData.title}</h1>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <User className="w-4 h-4" />
                {postData.author?.full_name || '익명'}
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {formatDate(postData.created_at)}
              </div>
              <div className="flex items-center gap-1">
                <MessageSquare className="w-4 h-4" />
{t('postDetail.views')} {postData.view_count}
              </div>
            </div>
          </div>

          {/* 반응 버튼 */}
          <div className="flex items-center gap-2">
            <Button
              variant={userReaction === 'like' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleReaction('like')}
              disabled={reactionLoading}
              className={`flex items-center gap-1 transition-all duration-200 ${
                userReaction === 'like' 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                  : 'hover:bg-blue-50 hover:text-blue-600'
              } ${reactionLoading ? 'opacity-50 cursor-not-allowed' : ''} active:scale-95 active:bg-blue-200 active:text-blue-800`}
            >
              <ThumbsUp className={`w-4 h-4 transition-colors duration-200 ${userReaction === 'like' ? 'text-white' : 'text-gray-600'}`} />
              {postData.like_count}
            </Button>
            <Button
              variant={userReaction === 'dislike' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleReaction('dislike')}
              disabled={reactionLoading}
              className={`flex items-center gap-1 transition-all duration-200 ${
                userReaction === 'dislike' 
                  ? 'bg-red-600 hover:bg-red-700 text-white' 
                  : 'hover:bg-red-50 hover:text-red-600'
              } ${reactionLoading ? 'opacity-50 cursor-not-allowed' : ''} active:scale-95 active:bg-red-200 active:text-red-800`}
            >
              <ThumbsDown className={`w-4 h-4 transition-colors duration-200 ${userReaction === 'dislike' ? 'text-white' : 'text-gray-600'}`} />
              {postData.dislike_count}
            </Button>
          </div>

          {/* 내용 */}
          <div className="prose max-w-none">
            <div className="whitespace-pre-wrap text-gray-800">
              {postData.content}
            </div>
          </div>
        </div>
      </Card>

      {/* 댓글 목록 */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">
{t('postDetail.comments')} ({postData.comment_count})
        </h3>
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="border-b border-gray-200 pb-4 last:border-b-0">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-gray-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {comment.author?.id ? (
                      <button
                        onClick={() => handleViewProfile(comment.author.id)}
                        className="font-medium text-sm text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                      >
                        {comment.author?.full_name || '익명'}
                      </button>
                    ) : (
                      <span className="font-medium text-sm">{comment.author?.full_name || '익명'}</span>
                    )}
                    <span className="text-xs text-gray-500">
                      {formatDate(comment.created_at)}
                    </span>
                  </div>
                  <p className="text-gray-800 mb-2">{comment.content}</p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
                    >
                      {t('postDetail.reply')}
                    </Button>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <ThumbsUp className="w-3 h-3" />
                      {comment.like_count}
                      <ThumbsDown className="w-3 h-3 ml-2" />
                      {comment.dislike_count}
                    </div>
                  </div>
                  
                  {/* 대댓글 작성 */}
                  {replyTo === comment.id && (
                    <div className="mt-3 pl-4 border-l-2 border-gray-200">
                      <Textarea
                        placeholder={t('postDetail.replyPlaceholder')}
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        rows={2}
                        className="mb-2"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleReplySubmit(comment.id)}
                          disabled={commentLoading}
                        >
{t('postDetail.writeReply')}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setReplyTo(null)}
                        >
{t('buttons.cancel')}
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {/* 대댓글 목록 */}
                  {comment.replies && comment.replies.length > 0 && (
                    <div className="mt-3 pl-4 border-l-2 border-gray-200 space-y-3">
                      {comment.replies.map((reply) => (
                        <div key={reply.id} className="flex items-start gap-3">
                          <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                            <User className="w-3 h-3 text-gray-600" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              {reply.author?.id ? (
                                <button
                                  onClick={() => handleViewProfile(reply.author.id)}
                                  className="font-medium text-sm text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                                >
                                  {reply.author?.full_name || '익명'}
                                </button>
                              ) : (
                                <span className="font-medium text-sm">{reply.author?.full_name || '익명'}</span>
                              )}
                              <span className="text-xs text-gray-500">
                                {formatDate(reply.created_at)}
                              </span>
                            </div>
                            <p className="text-gray-800">{reply.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {comments.length === 0 && (
            <div className="text-center py-8 text-gray-500">
{t('postDetail.noComments')}
            </div>
          )}
        </div>
      </Card>

      {/* 댓글 작성 */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">{t('postDetail.writeComment')}</h3>
        <div className="space-y-4">
          <Textarea
            placeholder={t('postDetail.commentPlaceholder')}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={3}
          />
          <div className="flex justify-end">
            <Button
              onClick={handleCommentSubmit}
              disabled={commentLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
{commentLoading ? t('buttons.writing') : t('postDetail.writeComment')}
            </Button>
          </div>
        </div>
      </Card>

      {/* 사용자 프로필 모달 */}
      <UserProfileModal
        userId={selectedUserId}
        isOpen={showProfileModal}
        onClose={() => {
          setShowProfileModal(false)
          setSelectedUserId(null)
        }}
      />
    </div>
  )
}