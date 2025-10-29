'use client'

import { useState } from 'react'
import { Heart, MessageCircle, Eye } from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'

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

interface IdolMemesPostProps {
  post: Post
  theme: 'day' | 'night'
}

export default function IdolMemesPost({ post, theme }: IdolMemesPostProps) {
  const router = useRouter()
  const { user, token } = useAuth()
  const [isLiked, setIsLiked] = useState(post.is_liked || false)
  const [likesCount, setLikesCount] = useState(post.likes_count)
  const [isPlaying, setIsPlaying] = useState(false)

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation()
    
    if (!user) {
      router.push('/sign-in')
      return
    }

    try {
      const res = await fetch(`/api/idol-photos/${post.id}/like`, {
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

  const handleClick = () => {
    router.push(`/community/idol-photos/${post.id}`)
  }

  const isDark = theme === 'night'
  const timeAgo = getTimeAgo(post.created_at)

  return (
    <div
      onClick={handleClick}
      className={`group relative overflow-hidden border rounded-lg ${
        isDark ? 'border-gray-800 bg-gray-950' : 'border-gray-200 bg-white'
      } hover:shadow-lg transition-all cursor-pointer`}
    >
      {/* Media - Thumbnail */}
      {post.media_url && (
        <div className="relative aspect-square w-full bg-gray-100">
          {post.media_type === 'video' ? (
            <video
              src={post.media_url}
              poster={post.thumbnail_url}
              className="w-full h-full object-cover"
            />
          ) : (
            <Image
              src={post.media_url}
              alt={post.title}
              fill
              className="object-cover"
            />
          )}
        </div>
      )}

      {/* Content - Always visible */}
      <div className={`p-3 ${isDark ? 'bg-gray-950' : 'bg-white'}`}>
        <h3 className={`font-semibold text-sm mb-2 line-clamp-2 ${
          isDark ? 'text-white' : 'text-gray-900'
        }`}>
          {post.title}
        </h3>

        {/* Meta Info */}
        <div className={`flex items-center gap-2 text-xs mb-2 ${
          isDark ? 'text-gray-400' : 'text-gray-600'
        }`}>
          {post.author_name && (
            <span className="font-medium">{post.author_name}</span>
          )}
          <span>•</span>
          <span>{timeAgo}</span>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3 pt-2 border-t border-gray-200 dark:border-gray-800">
          <button
            onClick={handleLike}
            className={`flex items-center gap-1 text-xs transition-colors ${
              isLiked
                ? 'text-red-500'
                : isDark
                ? 'text-gray-400 hover:text-red-500'
                : 'text-gray-600 hover:text-red-500'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-current' : ''}`} />
            {likesCount}
          </button>

          <div className={`flex items-center gap-1 text-xs ${
            isDark ? 'text-gray-400' : 'text-gray-600'
          }`}>
            <MessageCircle className="w-3.5 h-3.5" />
            {post.comments_count}
          </div>

          <div className={`flex items-center gap-1 text-xs ${
            isDark ? 'text-gray-400' : 'text-gray-600'
          }`}>
            <Eye className="w-3.5 h-3.5" />
            {post.views}
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
  if (diffInSeconds < 3600) return `Hace ${Math.floor(diffInSeconds / 60)} min`
  if (diffInSeconds < 86400) return `Hace ${Math.floor(diffInSeconds / 3600)} h`
  if (diffInSeconds < 604800) return `Hace ${Math.floor(diffInSeconds / 86400)} días`
  return date.toLocaleDateString('es-ES')
}
