'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Heart, MessageCircle, Eye, Share2 } from 'lucide-react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'

interface Post {
  id: string
  title: string
  content?: string
  media_url?: string
  media_type?: 'image' | 'video'
  thumbnail_url?: string
  author_name?: string
  views: number
  likes_count: number
  comments_count: number
  category?: string
  created_at: string
  is_liked?: boolean
}

export default function IdolMemesDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [isLiked, setIsLiked] = useState(false)
  const [likesCount, setLikesCount] = useState(0)

  useEffect(() => {
    fetchPost()
  }, [params.id])

  const fetchPost = async () => {
    try {
      const res = await fetch(`/api/idol-memes/${params.id}`)
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

  const handleLike = async () => {
    try {
      const res = await fetch(`/api/idol-memes/${params.id}/like`, {
        method: isLiked ? 'DELETE' : 'POST',
      })
      
      if (res.ok) {
        setIsLiked(!isLiked)
        setLikesCount(prev => prev + (isLiked ? -1 : 1))
      }
    } catch (error) {
      console.error('Failed to toggle like:', error)
    }
  }

  const handleShare = async () => {
    try {
      await navigator.share({
        title: post?.title,
        url: window.location.href,
      })
    } catch (error) {
      console.log('Share failed:', error)
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
        <div className="text-gray-500">No se encontró el post</div>
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
              onClick={() => router.back()}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-sm transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>이전글</span>
            </button>

            <button
              onClick={() => router.push('/community/idol-memes')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-sm transition-colors"
            >
              목록
            </button>

            <button
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-sm transition-colors opacity-50"
              disabled
            >
              <span>다음글</span>
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
              <span>조회 {post.views}</span>
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

        {/* Media - Full width */}
        {post.media_url && (
          <div className="w-full bg-black">
            {post.media_type === 'video' ? (
              <video
                src={post.media_url}
                poster={post.thumbnail_url}
                controls
                className="w-full"
                autoPlay
              />
            ) : (
              <div className="relative w-full" style={{ aspectRatio: '16/9' }}>
                <Image
                  src={post.media_url}
                  alt={post.title}
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            )}
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
            <div className="flex items-center gap-6">
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

              <div className="flex-1" />

              <button
                onClick={handleShare}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
              >
                <Share2 className="w-4 h-4" />
                <span className="text-sm">공유</span>
              </button>
            </div>
          </div>
        </div>

        {/* Comments Section */}
        <div className="max-w-4xl mx-auto px-4 py-8">
          <h2 className="text-2xl font-bold mb-6">댓글</h2>
          
          {/* Comment List */}
          <div className="space-y-4 mb-8">
            <div className="border-b border-gray-200 pb-4">
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-300 flex-shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold text-sm">미친 무력77 장개</span>
                    <span className="text-xs text-gray-500">3일전</span>
                  </div>
                  <p className="text-sm text-gray-700">그만해</p>
                </div>
              </div>
            </div>

            <div className="border-b border-gray-200 pb-4">
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-300 flex-shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold text-sm">호들갑 정치력63 강유</span>
                    <span className="text-xs text-gray-500">3일전</span>
                  </div>
                  <div className="text-2xl">😭</div>
                </div>
              </div>
            </div>
          </div>

          {/* Login to Comment */}
          <div className="border-t border-gray-200 pt-6 text-center">
            <p className="text-sm text-gray-500 mb-4">로그인 후 댓글을 달 수 있습니다.</p>
            <button
              onClick={() => router.push('/sign-in')}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-teal-500 hover:bg-teal-600 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              로그인
            </button>
          </div>
        </div>

        {/* Bottom Navigation */}
        <div className="border-t border-gray-200 bg-white sticky bottom-0">
          <div className="max-w-4xl mx-auto px-4 py-3 text-center">
            <button
              onClick={() => router.push('/community/idol-memes')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 hover:bg-gray-200 text-sm transition-colors"
            >
              목록
            </button>
          </div>
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
