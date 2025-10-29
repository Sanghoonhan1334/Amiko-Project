'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
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
  user_profiles?: {
    display_name?: string
    avatar_url?: string
  }
}

export default function FanartDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user, token } = useAuth()
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [isLiked, setIsLiked] = useState(false)
  const [likesCount, setLikesCount] = useState(0)
  const [comments, setComments] = useState<Comment[]>([])
  const [commentText, setCommentText] = useState('')
  const [sendingComment, setSendingComment] = useState(false)
  const [allPostIds, setAllPostIds] = useState<string[]>([])
  const [currentIndex, setCurrentIndex] = useState<number>(-1)

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
        setComments(prev => Array.isArray(prev) ? [newComment, ...prev] : [newComment])
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
                if (prevIndex >= 0 && allPostIds[prevIndex]) {
                  router.push(`/community/fanart/${allPostIds[prevIndex]}`)
                } else {
                  router.push('/community/fanart')
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
              onClick={() => router.push('/community/fanart')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-sm transition-colors"
            >
              Lista
            </button>

            <button
              onClick={() => {
                const nextIndex = currentIndex + 1
                if (nextIndex < allPostIds.length && allPostIds[nextIndex]) {
                  router.push(`/community/fanart/${allPostIds[nextIndex]}`)
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
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{comment.content}</p>
                    </div>
                  </div>
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

