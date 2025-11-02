'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, Heart, MessageCircle, Eye, Share2, Send, Download } from 'lucide-react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/AuthContext'

interface Post {
  id: string
  title: string
  content?: string
  image_url: string
  author_name?: string
  views: number
  likes_count: number
  comments_count: number
  category?: string
  created_at: string
  is_liked?: boolean
}

interface Comment {
  id: string
  content: string
  created_at: string
  parent_comment_id?: string | null
  user_profiles?: {
    display_name?: string
    avatar_url?: string
  }
  replies?: Comment[]
}

export default function FanartDetailPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, token } = useAuth()
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [isLiked, setIsLiked] = useState(false)
  const [likesCount, setLikesCount] = useState(0)
  const [comments, setComments] = useState<Comment[]>([])
  const [isLiking, setIsLiking] = useState(false) // 좋아요 처리 중 플래그
  const [commentText, setCommentText] = useState('')
  const [sendingComment, setSendingComment] = useState(false)
  const [allPostIds, setAllPostIds] = useState<string[]>([])
  const [currentIndex, setCurrentIndex] = useState<number>(-1)
  const [replyingTo, setReplyingTo] = useState<string | null>(null) // 답글 작성 중인 댓글 ID
  const [replyText, setReplyText] = useState('') // 답글 내용

  useEffect(() => {
    fetchAllPostIds()
  }, [token])

  useEffect(() => {
    if (allPostIds.length > 0) {
      const index = allPostIds.indexOf(params.id as string)
      setCurrentIndex(index)
    }
  }, [params.id, allPostIds])

  useEffect(() => {
    fetchPost()
    fetchComments()
  }, [params.id, token])

  const fetchAllPostIds = async () => {
    try {
      const headers: HeadersInit = {}
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
      
      const res = await fetch('/api/fanart', { headers })
      const data = await res.json()
      const ids = data.map((p: any) => p.id)
      setAllPostIds(ids)
    } catch (error) {
      console.error('Failed to fetch post IDs:', error)
    }
  }

  const fetchPost = async () => {
    try {
      const headers: HeadersInit = {}
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
      
      const res = await fetch(`/api/fanart/${params.id}`, { headers })
      const data = await res.json()
      setPost(data)
      setIsLiked(data.is_liked || false)
      setLikesCount(data.likes_count || 0)
    } catch (error) {
      console.error('Failed to fetch post:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchComments = async () => {
    try {
      const headers: HeadersInit = {}
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
      
      const res = await fetch(`/api/fanart/${params.id}/comments`, { headers })
      const data = await res.json()
      setComments(data || [])
    } catch (error) {
      console.error('Failed to fetch comments:', error)
    }
  }

  const handleLike = async () => {
    if (!user) {
      router.push('/sign-in')
      return
    }

    // 연속 클릭 방지 (0.5초)
    if (isLiking) {
      console.log('⏳ 좋아요 처리 중... 잠시 기다려주세요')
      return
    }

    setIsLiking(true)

    try {
      const res = await fetch(`/api/fanart/${params.id}/like`, {
        method: isLiked ? 'DELETE' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      
      if (res.ok) {
        setIsLiked(!isLiked)
        setLikesCount(prev => prev + (isLiked ? -1 : 1))
      }
    } catch (error) {
      console.error('Failed to toggle like:', error)
    } finally {
      // 0.5초 후 다시 클릭 가능
      setTimeout(() => {
        setIsLiking(false)
      }, 500)
    }
  }

  const handleDownload = async () => {
    if (!post?.image_url) return
    
    try {
      const response = await fetch(post.image_url)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = post.title || 'fan-art'
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Download failed:', error)
    }
  }

  const handleCommentSubmit = async () => {
    if (!user) {
      router.push('/sign-in')
      return
    }

    if (!commentText.trim()) return

    setSendingComment(true)
    try {
      const res = await fetch(`/api/fanart/${params.id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ content: commentText }),
      })

      if (res.ok) {
        const newComment = await res.json()
        setComments(prev => Array.isArray(prev) ? [{...newComment, replies: []}, ...prev] : [{...newComment, replies: []}])
        setCommentText('')
        if (post) {
          setPost({ ...post, comments_count: post.comments_count + 1 })
        }
      }
    } catch (error) {
      console.error('Failed to post comment:', error)
    } finally {
      setSendingComment(false)
    }
  }

  const handleReplySubmit = async (parentCommentId: string) => {
    if (!user) {
      router.push('/sign-in')
      return
    }

    if (!replyText.trim()) return

    setSendingComment(true)
    try {
      const res = await fetch(`/api/fanart/${params.id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          content: replyText,
          parent_comment_id: parentCommentId 
        }),
      })

      if (res.ok) {
        const newReply = await res.json()
        // 댓글 목록 업데이트: 해당 댓글의 replies에 추가
        setComments(prev => prev.map(comment => {
          if (comment.id === parentCommentId) {
            return {
              ...comment,
              replies: [...(comment.replies || []), newReply]
            }
          }
          return comment
        }))
        setReplyText('')
        setReplyingTo(null)
        if (post) {
          setPost({ ...post, comments_count: post.comments_count + 1 })
        }
      }
    } catch (error) {
      console.error('Failed to post reply:', error)
    } finally {
      setSendingComment(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-500">Cargando...</div>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-500">No se encontró el fan art</div>
      </div>
    )
  }

  const timeAgo = getTimeAgo(post.created_at)

  return (
    <div className="min-h-screen bg-white">
      {/* Header - Navigation */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                const prevIndex = currentIndex - 1
                const fromHome = searchParams.get('from') === 'home'
                if (prevIndex >= 0 && allPostIds[prevIndex]) {
                  router.push(`/community/fanart/${allPostIds[prevIndex]}${fromHome ? '?from=home' : ''}`)
                } else {
                  // 이전 게시물이 없으면 목록 또는 홈으로
                  router.push(fromHome ? '/main?tab=home' : '/community/fanart')
                }
              }}
              disabled={currentIndex <= 0}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-sm transition-colors ${
                currentIndex <= 0 ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Anterior</span>
            </button>

            <button
              onClick={() => {
                const fromHome = searchParams.get('from') === 'home'
                router.push(fromHome ? '/main?tab=home' : '/community/fanart')
              }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-sm transition-colors"
            >
              Lista
            </button>

            <button
              onClick={() => {
                const nextIndex = currentIndex + 1
                const fromHome = searchParams.get('from') === 'home'
                if (nextIndex < allPostIds.length && allPostIds[nextIndex]) {
                  router.push(`/community/fanart/${allPostIds[nextIndex]}${fromHome ? '?from=home' : ''}`)
                }
              }}
              disabled={currentIndex >= allPostIds.length - 1}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-sm transition-colors ${
                currentIndex >= allPostIds.length - 1 ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <span>Siguiente</span>
              <ArrowLeft className="w-4 h-4 rotate-180" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white">
        {/* Title and Meta Info */}
        <div className="border-b border-gray-200 bg-gray-50">
          <div className="max-w-4xl mx-auto px-4 py-3">
            <h1 className="text-lg font-semibold mb-2">{post.title}</h1>
            <div className="flex items-center gap-3 text-xs text-gray-600">
              <span>{post.author_name || 'Usuario'}</span>
              <span>•</span>
              <span>{likesCount}</span>
              <span>•</span>
              <span>{timeAgo}</span>
              <span>•</span>
              <span>Visitas {post.views}</span>
              {post.category && (
                <>
                  <span>•</span>
                  <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">
                    {post.category}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Image - Centered with max width */}
        {post.image_url && (
          <div className="w-full bg-gray-100 flex justify-center">
            <div className="relative max-w-2xl w-full">
              <Image
                src={post.image_url}
                alt={post.title}
                width={800}
                height={600}
                className="w-full h-auto object-contain"
                priority
              />
            </div>
          </div>
        )}

        {/* Content */}
        {post.content && (
          <div className="max-w-4xl mx-auto px-4 py-6 text-gray-700">
            {post.content}
          </div>
        )}

        {/* Actions */}
        <div className="border-t border-b border-gray-200 bg-white">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={handleLike}
                className={`flex items-center gap-2 transition-colors ${
                  isLiked ? 'text-red-500' : 'text-gray-600 hover:text-red-500'
                }`}
              >
                <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                <span className="text-sm">{likesCount}</span>
              </button>

              <div className="flex items-center gap-2 text-gray-600">
                <MessageCircle className="w-5 h-5" />
                <span className="text-sm">{post.comments_count}</span>
              </div>

              <div className="flex items-center gap-2 text-gray-600">
                <Eye className="w-5 h-5" />
                <span className="text-sm">{post.views}</span>
              </div>

              <div className="flex-1 min-w-[20px]" />

              <button
                onClick={handleDownload}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 whitespace-nowrap"
              >
                <Download className="w-4 h-4" />
                <span className="text-sm">Descargar</span>
              </button>
            </div>
          </div>
        </div>

        {/* Comments Section */}
        <div className="max-w-4xl mx-auto px-4 py-8">
          <h2 className="text-2xl font-bold mb-6">Comentarios ({comments.length})</h2>
          
          {/* Comment List */}
          {comments.length > 0 ? (
            <div className="space-y-4 mb-8">
              {comments.map((comment) => (
                <div key={comment.id} className="border-b border-gray-200 pb-4">
                  {/* 원본 댓글 */}
                  <div className="flex gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-300 flex-shrink-0 flex items-center justify-center">
                      <span className="text-gray-600 text-sm font-semibold">
                        {comment.user_profiles?.display_name?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-sm">
                          {comment.user_profiles?.display_name || 'Usuario'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {getTimeAgo(comment.created_at)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap mb-2">{comment.content}</p>
                      
                      {/* 답글 버튼 */}
                      <button
                        onClick={() => {
                          if (!user) {
                            router.push('/sign-in')
                            return
                          }
                          setReplyingTo(replyingTo === comment.id ? null : comment.id)
                          setReplyText('')
                        }}
                        className="text-xs text-purple-600 hover:text-purple-800 font-medium"
                      >
                        {replyingTo === comment.id ? 'Cancelar' : 'Responder'}
                      </button>
                    </div>
                  </div>

                  {/* 답글 목록 */}
                  {comment.replies && comment.replies.length > 0 && (
                    <div className="ml-12 mt-3 space-y-3">
                      {comment.replies.map((reply) => (
                        <div key={reply.id} className="flex gap-3">
                          <div className="w-8 h-8 rounded-full bg-purple-200 flex-shrink-0 flex items-center justify-center">
                            <span className="text-purple-700 text-xs font-semibold">
                              {reply.user_profiles?.display_name?.charAt(0).toUpperCase() || 'U'}
                            </span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-sm">
                                {reply.user_profiles?.display_name || 'Usuario'}
                              </span>
                              <span className="text-xs text-gray-500">
                                {getTimeAgo(reply.created_at)}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">{reply.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 답글 작성 폼 */}
                  {replyingTo === comment.id && user && (
                    <div className="ml-12 mt-3">
                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-purple-500 flex-shrink-0 flex items-center justify-center">
                          <span className="text-white text-xs font-semibold">
                            {user.email?.charAt(0).toUpperCase() || 'U'}
                          </span>
                        </div>
                        <div className="flex-1">
                          <textarea
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="Escribe una respuesta..."
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
                            rows={2}
                          />
                          <div className="flex justify-end gap-2 mt-2">
                            <button
                              onClick={() => {
                                setReplyingTo(null)
                                setReplyText('')
                              }}
                              className="px-3 py-1 text-xs text-gray-600 hover:text-gray-800"
                            >
                              Cancelar
                            </button>
                            <Button
                              onClick={() => handleReplySubmit(comment.id)}
                              disabled={!replyText.trim() || sendingComment}
                              size="sm"
                              className="text-xs"
                            >
                              {sendingComment ? (
                                <>Enviando...</>
                              ) : (
                                <>
                                  <Send className="w-3 h-3 mr-1" />
                                  Responder
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 mb-8">
              No hay comentarios aún. ¡Sé el primero en comentar!
            </div>
          )}

          {/* Comment Input */}
          {user ? (
            <div className="border-t border-gray-200 pt-6">
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-500 flex-shrink-0 flex items-center justify-center">
                  <span className="text-white text-sm font-semibold">
                    {user.email?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
                <div className="flex-1">
                  <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Escribe un comentario..."
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
                    rows={3}
                  />
                  <div className="flex justify-end mt-2">
                    <Button
                      onClick={handleCommentSubmit}
                      disabled={!commentText.trim() || sendingComment}
                      size="sm"
                    >
                      {sendingComment ? (
                        <>Enviando...</>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-1" />
                          Publicar
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="border-t border-gray-200 pt-6 text-center">
              <p className="text-sm text-gray-500 mb-4">Inicia sesión para comentar.</p>
              <button
                onClick={() => router.push('/sign-in')}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-teal-500 hover:bg-teal-600 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Iniciar sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function getTimeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) return 'Ahora'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} h`
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} días`
  return date.toLocaleDateString('es-ES')
}

