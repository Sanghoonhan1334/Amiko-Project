'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { MessageCircle, Send, User, ThumbsUp, ThumbsDown, Reply } from 'lucide-react'

interface Comment {
  id: string
  test_id: string
  user_id: string
  user_name: string
  user_avatar_url?: string
  comment: string
  created_at: string
  parent_id?: string // 대댓글용
  likes: number
  dislikes: number
  user_liked?: boolean
  user_disliked?: boolean
  replies?: Comment[] // 대댓글 목록
}

interface TestCommentsProps {
  testId: string
}

export default function TestComments({ testId }: TestCommentsProps) {
  const { user } = useAuth()
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')

  // 댓글 조회 (로컬 스토리지 기반)
  const fetchComments = async () => {
    try {
      setIsLoading(true)
      
      // 로컬 스토리지에서 댓글 조회
      const storedComments = localStorage.getItem(`${testId}-comments`)
      if (storedComments) {
        const parsedComments = JSON.parse(storedComments)
        setComments(parsedComments)
      } else {
        setComments([])
      }
    } catch (error) {
      console.error('Error fetching comments:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // 댓글 작성 (로컬 스토리지 기반)
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newComment.trim() || !user) return
    
    try {
      setIsSubmitting(true)
      
      // 닉네임이 없으면 댓글 작성 불가
      if (!user.user_metadata?.name) {
        alert('Por favor, completa tu perfil con un nombre de usuario para poder comentar.')
        return
      }

      // 새 댓글 객체 생성
      const newCommentObj: Comment = {
        id: Date.now().toString(),
        test_id: testId,
        user_id: user.id,
        user_name: user.user_metadata.name,
        user_avatar_url: user.user_metadata?.avatar_url || null,
        comment: newComment.trim(),
        created_at: new Date().toISOString(),
        likes: 0,
        dislikes: 0,
        user_liked: false,
        user_disliked: false,
        replies: []
      }
      
      // 기존 댓글 목록에 새 댓글 추가
      const updatedComments = [newCommentObj, ...comments]
      
      // 로컬 스토리지에 저장
      localStorage.setItem(`${testId}-comments`, JSON.stringify(updatedComments))
      
      // 상태 업데이트
      setComments(updatedComments)
      setNewComment('')
    } catch (error) {
      console.error('Error submitting comment:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // 대댓글 작성
  const handleSubmitReply = async (parentId: string) => {
    if (!replyText.trim() || !user) return
    
    // 닉네임이 없으면 답글 작성 불가
    if (!user.user_metadata?.name) {
      alert('Por favor, completa tu perfil con un nombre de usuario para poder responder.')
      return
    }
    
    try {
      const newReply: Comment = {
        id: Date.now().toString(),
        test_id: testId,
        user_id: user.id,
        user_name: user.user_metadata.name,
        user_avatar_url: user.user_metadata?.avatar_url || null,
        comment: replyText.trim(),
        created_at: new Date().toISOString(),
        parent_id: parentId,
        likes: 0,
        dislikes: 0,
        user_liked: false,
        user_disliked: false
      }
      
      // 부모 댓글에 대댓글 추가
      const updatedComments = comments.map(comment => {
        if (comment.id === parentId) {
          return {
            ...comment,
            replies: [...(comment.replies || []), newReply]
          }
        }
        return comment
      })
      
      // 로컬 스토리지에 저장
      localStorage.setItem(`${testId}-comments`, JSON.stringify(updatedComments))
      
      // 상태 업데이트
      setComments(updatedComments)
      setReplyText('')
      setReplyingTo(null)
    } catch (error) {
      console.error('Error submitting reply:', error)
    }
  }

  // 추천/비추천 토글
  const handleLikeDislike = (commentId: string, type: 'like' | 'dislike') => {
    if (!user) return
    
    const updatedComments = comments.map(comment => {
      if (comment.id === commentId) {
        const newComment = { ...comment }
        
        if (type === 'like') {
          if (newComment.user_liked) {
            // 추천 취소
            newComment.likes = Math.max(0, newComment.likes - 1)
            newComment.user_liked = false
          } else {
            // 추천
            newComment.likes += 1
            newComment.user_liked = true
            
            // 비추천이 있었다면 취소
            if (newComment.user_disliked) {
              newComment.dislikes = Math.max(0, newComment.dislikes - 1)
              newComment.user_disliked = false
            }
          }
        } else {
          if (newComment.user_disliked) {
            // 비추천 취소
            newComment.dislikes = Math.max(0, newComment.dislikes - 1)
            newComment.user_disliked = false
          } else {
            // 비추천
            newComment.dislikes += 1
            newComment.user_disliked = true
            
            // 추천이 있었다면 취소
            if (newComment.user_liked) {
              newComment.likes = Math.max(0, newComment.likes - 1)
              newComment.user_liked = false
            }
          }
        }
        
        return newComment
      }
      
      // 대댓글도 처리
      if (comment.replies) {
        const updatedReplies = comment.replies.map(reply => {
          if (reply.id === commentId) {
            const newReply = { ...reply }
            
            if (type === 'like') {
              if (newReply.user_liked) {
                newReply.likes = Math.max(0, newReply.likes - 1)
                newReply.user_liked = false
              } else {
                newReply.likes += 1
                newReply.user_liked = true
                
                if (newReply.user_disliked) {
                  newReply.dislikes = Math.max(0, newReply.dislikes - 1)
                  newReply.user_disliked = false
                }
              }
            } else {
              if (newReply.user_disliked) {
                newReply.dislikes = Math.max(0, newReply.dislikes - 1)
                newReply.user_disliked = false
              } else {
                newReply.dislikes += 1
                newReply.user_disliked = true
                
                if (newReply.user_liked) {
                  newReply.likes = Math.max(0, newReply.likes - 1)
                  newReply.user_liked = false
                }
              }
            }
            
            return newReply
          }
          return reply
        })
        
        return { ...comment, replies: updatedReplies }
      }
      
      return comment
    })
    
    // 로컬 스토리지에 저장
    localStorage.setItem(`${testId}-comments`, JSON.stringify(updatedComments))
    
    // 상태 업데이트
    setComments(updatedComments)
  }

  // 시간 포맷팅
  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    
    if (minutes < 1) return 'hace un momento'
    if (minutes < 60) return `hace ${minutes} min`
    if (hours < 24) return `hace ${hours} h`
    if (days < 7) return `hace ${days} días`
    
    return date.toLocaleDateString('es-ES')
  }

  useEffect(() => {
    fetchComments()
  }, [testId])

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="p-4 border-b">
        <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-purple-500" />
          Comentarios ({comments.length})
        </h3>
      </div>
      
      {/* 댓글 작성 폼 */}
      {user ? (
        user.user_metadata?.name ? (
          <form onSubmit={handleSubmitComment} className="p-3 border-b">
          <div className="flex gap-2">
            <div className="flex-shrink-0">
              {user.user_metadata?.avatar_url ? (
                <img 
                  src={user.user_metadata.avatar_url} 
                  alt="Profile" 
                  className="w-6 h-6 rounded-full object-cover"
                />
              ) : (
                <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                  <User className="w-3 h-3 text-purple-600" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Escribe tu comentario..."
                className="w-full p-2 text-sm border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                rows={2}
                maxLength={500}
              />
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-gray-500">
                  {newComment.length}/500
                </span>
                <button
                  type="submit"
                  disabled={!newComment.trim() || isSubmitting}
                  className="px-2 py-1 bg-purple-500 text-white text-xs rounded-md hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  {isSubmitting ? (
                    <div className="animate-spin rounded-full h-2.5 w-2.5 border-b-2 border-white"></div>
                  ) : (
                    <Send className="w-2.5 h-2.5" />
                  )}
                  Comentar
                </button>
              </div>
            </div>
          </div>
        </form>
        ) : (
          <div className="p-3 border-b">
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800 text-sm">
                Por favor, completa tu perfil con un nombre de usuario para poder comentar.
              </p>
            </div>
          </div>
        )
      ) : (
        <div className="p-3 border-b text-center text-gray-500 text-sm">
          Por favor, inicia sesión para escribir comentarios.
        </div>
      )}
      
      {/* 댓글 목록 */}
      <div className="max-h-96 overflow-y-auto">
        {isLoading ? (
          <div className="p-3 text-center text-gray-500 text-sm">
            Cargando comentarios...
          </div>
        ) : comments.length === 0 ? (
          <div className="p-3 text-center text-gray-500 text-sm">
            Aún no hay comentarios. ¡Sé el primero en comentar!
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {comments.map((comment) => (
              <div key={comment.id} className="p-3">
                <div className="flex gap-2">
                  <div className="flex-shrink-0">
                    {comment.user_avatar_url ? (
                      <img 
                        src={comment.user_avatar_url} 
                        alt={comment.user_name} 
                        className="w-6 h-6 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                        <User className="w-3 h-3 text-gray-600" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900 text-sm">
                        {comment.user_name}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatTime(comment.created_at)}
                      </span>
                    </div>
                    <p className="text-gray-700 text-sm whitespace-pre-wrap mb-3">
                      {comment.comment}
                    </p>
                    
                    {/* 추천/비추천 및 답글 버튼 */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleLikeDislike(comment.id, 'like')}
                        className={`flex items-center gap-1 text-xs ${
                          comment.user_liked ? 'text-blue-600' : 'text-gray-500 hover:text-blue-600'
                        }`}
                      >
                        <ThumbsUp className={`w-3 h-3 ${comment.user_liked ? 'fill-current' : ''}`} />
                        <span>{comment.likes}</span>
                      </button>
                      
                      <button
                        onClick={() => handleLikeDislike(comment.id, 'dislike')}
                        className={`flex items-center gap-1 text-xs ${
                          comment.user_disliked ? 'text-red-600' : 'text-gray-500 hover:text-red-600'
                        }`}
                      >
                        <ThumbsDown className={`w-3 h-3 ${comment.user_disliked ? 'fill-current' : ''}`} />
                        <span>{comment.dislikes}</span>
                      </button>
                      
                      <button
                        onClick={() => setReplyingTo(comment.id)}
                        className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
                      >
                        <Reply className="w-3 h-3" />
                        <span>Responder</span>
                      </button>
                    </div>
                    
                    {/* 답글 작성 폼 */}
                    {replyingTo === comment.id && (
                      <div className="mt-2 p-2 bg-gray-50 rounded-lg">
                        <div className="flex gap-1">
                          <input
                            type="text"
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="Escribe tu respuesta..."
                            className="flex-1 p-1.5 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                          <button
                            onClick={() => handleSubmitReply(comment.id)}
                            disabled={!replyText.trim()}
                            className="px-1.5 py-1 bg-purple-500 text-white text-xs rounded-md hover:bg-purple-600 disabled:opacity-50"
                          >
                            Enviar
                          </button>
                          <button
                            onClick={() => {
                              setReplyingTo(null)
                              setReplyText('')
                            }}
                            className="px-1.5 py-1 bg-gray-300 text-gray-700 text-xs rounded-md hover:bg-gray-400"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {/* 대댓글 목록 */}
                    {comment.replies && comment.replies.length > 0 && (
                      <div className="mt-2 ml-3 space-y-2">
                        {comment.replies.map((reply) => (
                          <div key={reply.id} className="flex gap-2">
                            <div className="flex-shrink-0">
                              {reply.user_avatar_url ? (
                                <img 
                                  src={reply.user_avatar_url} 
                                  alt={reply.user_name} 
                                  className="w-5 h-5 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center">
                                  <User className="w-2.5 h-2.5 text-gray-600" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-gray-900 text-xs">
                                  {reply.user_name}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {formatTime(reply.created_at)}
                                </span>
                              </div>
                              <p className="text-gray-700 text-xs whitespace-pre-wrap mb-2">
                                {reply.comment}
                              </p>
                              
                              {/* 대댓글 추천/비추천 */}
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleLikeDislike(reply.id, 'like')}
                                  className={`flex items-center gap-1 text-xs ${
                                    reply.user_liked ? 'text-blue-600' : 'text-gray-500 hover:text-blue-600'
                                  }`}
                                >
                                  <ThumbsUp className={`w-2.5 h-2.5 ${reply.user_liked ? 'fill-current' : ''}`} />
                                  <span>{reply.likes}</span>
                                </button>
                                
                                <button
                                  onClick={() => handleLikeDislike(reply.id, 'dislike')}
                                  className={`flex items-center gap-1 text-xs ${
                                    reply.user_disliked ? 'text-red-600' : 'text-gray-500 hover:text-red-600'
                                  }`}
                                >
                                  <ThumbsDown className={`w-2.5 h-2.5 ${reply.user_disliked ? 'fill-current' : ''}`} />
                                  <span>{reply.dislikes}</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
