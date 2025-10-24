'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { MessageCircle, Send, User } from 'lucide-react'

interface Comment {
  id: string
  test_id: string
  user_id: string
  user_name: string
  user_avatar_url?: string
  comment: string
  created_at: string
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
      
      // 새 댓글 객체 생성
      const newCommentObj: Comment = {
        id: Date.now().toString(),
        test_id: testId,
        user_id: user.id,
        user_name: user.user_metadata?.name || 'Anonymous',
        user_avatar_url: user.user_metadata?.avatar_url || null,
        comment: newComment.trim(),
        created_at: new Date().toISOString()
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
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-purple-500" />
          Comentarios ({comments.length})
        </h3>
      </div>
      
      {/* 댓글 작성 폼 */}
      {user ? (
        <form onSubmit={handleSubmitComment} className="p-4 border-b">
          <div className="flex gap-3">
            <div className="flex-shrink-0">
              {user.user_metadata?.avatar_url ? (
                <img 
                  src={user.user_metadata.avatar_url} 
                  alt="Profile" 
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-purple-600" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Escribe tu comentario..."
                className="w-full p-3 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                rows={3}
                maxLength={500}
              />
              <div className="flex justify-between items-center mt-2">
                <span className="text-sm text-gray-500">
                  {newComment.length}/500
                </span>
                <button
                  type="submit"
                  disabled={!newComment.trim() || isSubmitting}
                  className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  Comentar
                </button>
              </div>
            </div>
          </div>
        </form>
      ) : (
        <div className="p-4 border-b text-center text-gray-500">
          Por favor, inicia sesión para escribir comentarios.
        </div>
      )}
      
      {/* 댓글 목록 */}
      <div className="max-h-96 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 text-center text-gray-500">
            Cargando comentarios...
          </div>
        ) : comments.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            Aún no hay comentarios. ¡Sé el primero en comentar!
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {comments.map((comment) => (
              <div key={comment.id} className="p-4">
                <div className="flex gap-3">
                  <div className="flex-shrink-0">
                    {comment.user_avatar_url ? (
                      <img 
                        src={comment.user_avatar_url} 
                        alt={comment.user_name} 
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-gray-600" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900">
                        {comment.user_name}
                      </span>
                      <span className="text-sm text-gray-500">
                        {formatTime(comment.created_at)}
                      </span>
                    </div>
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {comment.comment}
                    </p>
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
