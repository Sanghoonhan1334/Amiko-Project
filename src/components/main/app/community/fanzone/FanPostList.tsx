'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Heart, MessageCircle, Share2, MoreVertical, Image, Calendar, User } from 'lucide-react'

interface FanPostListProps {
  fanroom: any
  onCreatePost: () => void
}

/**
 * FanPostList - Lista de posts del FanRoom con datos reales
 */
export default function FanPostList({ fanroom, onCreatePost }: FanPostListProps) {
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set())
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Cargar posts reales
  useEffect(() => {
    loadPosts()
  }, [fanroom.id])

  const loadPosts = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/fanzone/posts?fanroom_id=${fanroom.id}`)
      const data = await response.json()
      
      if (data.success && data.posts) {
        setPosts(data.posts)
      } else {
        setPosts([])
      }
    } catch (error) {
      console.error('Error loading posts:', error)
      setPosts([])
    } finally {
      setLoading(false)
    }
  }

  /**
   * Maneja like/unlike de post
   */
  const handleLikePost = (postId: string) => {
    setLikedPosts(prev => {
      const newSet = new Set(prev)
      if (newSet.has(postId)) {
        newSet.delete(postId)
      } else {
        newSet.add(postId)
      }
      return newSet
    })
  }

  /**
   * Formatea fecha relativa
   */
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Ahora'
    if (diffInMinutes < 60) return `Hace ${diffInMinutes} min`
    
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `Hace ${diffInHours} h`
    
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `Hace ${diffInDays} días`
    
    return date.toLocaleDateString('es-MX')
  }

  /**
   * Renderiza un post individual
   */
  const renderPost = (post: any) => {
    const isLiked = likedPosts.has(post.id)
    const hasMedia = (post.media_urls || post.mediaUrls) && (post.media_urls || post.mediaUrls).length > 0

    return (
      <Card key={post.id} className="p-4 space-y-4">
        {/* Header del post */}
        <div className="flex items-start gap-3">
          {/* Avatar del autor */}
          <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center flex-shrink-0">
            {(post.author?.avatar || post.author_avatar) ? (
              <img
                src={post.author?.avatar || post.author_avatar}
                alt={post.author?.name || post.author_name || 'Usuario'}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <span className="text-white font-semibold text-sm">
                {(post.author?.name || post.author_name || 'U').charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          {/* Información del autor y fecha */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                {post.author?.name || post.author_name || 'Usuario'}
              </h4>
              <Badge variant="secondary" className="text-xs">
                Miembro
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <Calendar className="w-3 h-3" />
              <span>{formatRelativeTime(post.created_at || post.createdAt)}</span>
            </div>
          </div>

          {/* Menú de opciones */}
          <Button variant="ghost" size="sm" className="p-1">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </div>

        {/* Contenido del post */}
        <div className="space-y-3">
          <p className="text-gray-900 dark:text-gray-100 leading-relaxed whitespace-pre-wrap">
            {post.content}
          </p>

          {/* Media */}
          {hasMedia && (
            <div className={`grid gap-2 ${
              (post.media_urls || post.mediaUrls).length === 1 ? 'grid-cols-1' :
              (post.media_urls || post.mediaUrls).length === 2 ? 'grid-cols-2' :
              (post.media_urls || post.mediaUrls).length >= 3 ? 'grid-cols-2' : 'grid-cols-1'
            }`}>
              {(post.media_urls || post.mediaUrls).slice(0, 4).map((url: string, index: number) => (
                <div key={index} className="relative">
                  <img
                    src={url}
                    alt={`Media ${index + 1}`}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  {(post.media_urls || post.mediaUrls).length > 4 && index === 3 && (
                    <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                      <span className="text-white font-semibold">
                        +{(post.media_urls || post.mediaUrls).length - 4} más
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Interacciones */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4">
            {/* Like */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleLikePost(post.id)}
              className={`flex items-center gap-1 ${
                isLiked 
                  ? 'text-red-500 hover:text-red-600' 
                  : 'text-gray-500 hover:text-red-500'
              }`}
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
              <span>{post.likes_count || post.likesCount || 0}</span>
            </Button>

            {/* Comentarios */}
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-1 text-gray-500 hover:text-blue-500"
            >
              <MessageCircle className="w-4 h-4" />
              <span>{post.comments_count || post.commentsCount || 0}</span>
            </Button>
          </div>

          {/* Compartir */}
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-500 hover:text-gray-700"
          >
            <Share2 className="w-4 h-4" />
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Posts
        </h2>
        {fanroom.isMember && (
          <Button onClick={onCreatePost} size="sm">
            Crear post
          </Button>
        )}
      </div>

      {/* Lista de posts */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="p-4 space-y-4">
              <div className="flex items-start gap-3">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
              <Skeleton className="h-20 w-full" />
              <div className="flex gap-4">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-6 w-16" />
              </div>
            </Card>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="space-y-4">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto">
              <Image className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              Aún no hay posts
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              ¡Sé el primero en compartir algo!
            </p>
            {fanroom.isMember && (
              <Button onClick={onCreatePost} className="mt-3">
                Crear primer post
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {posts.map(renderPost)}
        </div>
      )}
    </div>
  )
}
