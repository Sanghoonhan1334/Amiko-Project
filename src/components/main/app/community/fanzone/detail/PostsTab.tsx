'use client'

import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Heart, MessageCircle, Share2, MoreVertical, Image, Calendar, User } from 'lucide-react'
import { FanroomWithDetails, FanroomPostWithAuthor } from '@/types/fanzone'
import fanzoneEs from '@/i18n/community/es'

interface PostsTabProps {
  fanroom: FanroomWithDetails
  posts: FanroomPostWithAuthor[]
  loading: boolean
  onCreatePost: () => void
  onLoadMore?: () => void
}

/**
 * PostsTab - Tab de posts del FanRoom
 * Muestra lista de posts con interacciones
 */
export default function PostsTab({ 
  fanroom, 
  posts, 
  loading, 
  onCreatePost,
  onLoadMore 
}: PostsTabProps) {
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set())

  /**
   * Maneja like/unlike de post
   */
  const handleLikePost = async (postId: string) => {
    try {
      const isLiked = likedPosts.has(postId)
      const method = isLiked ? 'DELETE' : 'POST'
      
      const response = await fetch(`/api/fanzone/posts/${postId}/like`, {
        method
      })

      if (!response.ok) {
        throw new Error('Error al actualizar like')
      }

      // Actualizar estado local
      setLikedPosts(prev => {
        const newSet = new Set(prev)
        if (isLiked) {
          newSet.delete(postId)
        } else {
          newSet.add(postId)
        }
        return newSet
      })

    } catch (error) {
      console.error('Error liking post:', error)
    }
  }

  /**
   * Maneja compartir post
   */
  const handleSharePost = async (post: FanroomPostWithAuthor) => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Post de ${post.author?.user_metadata?.full_name || 'Usuario'}`,
          text: post.content,
          url: window.location.href
        })
      } else {
        await navigator.clipboard.writeText(post.content)
        // TODO: Mostrar toast de confirmación
      }
    } catch (error) {
      console.error('Error sharing post:', error)
    }
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
  const renderPost = (post: FanroomPostWithAuthor) => {
    const isLiked = likedPosts.has(post.id)
    const hasMedia = post.media_urls && post.media_urls.length > 0

    return (
      <Card key={post.id} className="p-4 space-y-4">
        {/* Header del post */}
        <div className="flex items-start gap-3">
          {/* Avatar del autor */}
          <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center flex-shrink-0">
            {post.author?.user_metadata?.avatar_url ? (
              <img
                src={post.author.user_metadata.avatar_url}
                alt={post.author.user_metadata.full_name || 'Usuario'}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <span className="text-white font-semibold text-sm">
                {(post.author?.user_metadata?.full_name || post.author?.email || 'U').charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          {/* Información del autor y fecha */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                {post.author?.user_metadata?.full_name || post.author?.email || 'Usuario'}
              </h4>
              <Badge variant="secondary" className="text-xs">
                Miembro
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <Calendar className="w-3 h-3" />
              <span>{formatRelativeTime(post.created_at)}</span>
              {post.updated_at !== post.created_at && (
                <span className="text-xs">(editado)</span>
              )}
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {post.media_urls.slice(0, 4).map((url, index) => (
                <div key={index} className="relative">
                  <img
                    src={url}
                    alt={`Media ${index + 1}`}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  {post.media_urls.length > 4 && index === 3 && (
                    <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                      <span className="text-white font-semibold">
                        +{post.media_urls.length - 4} más
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
              <span>{post.likes_count}</span>
            </Button>

            {/* Comentarios */}
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-1 text-gray-500 hover:text-blue-500"
            >
              <MessageCircle className="w-4 h-4" />
              <span>{post.comments_count}</span>
            </Button>
          </div>

          {/* Compartir */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleSharePost(post)}
            className="text-gray-500 hover:text-gray-700"
          >
            <Share2 className="w-4 h-4" />
          </Button>
        </div>
      </Card>
    )
  }

  // Loading state
  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="p-4">
            <div className="flex items-start gap-3">
              <Skeleton className="w-10 h-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
            <div className="mt-4 flex gap-4">
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-8 w-20" />
            </div>
          </Card>
        ))}
      </div>
    )
  }

  // Empty state
  if (posts.length === 0) {
    return (
      <Card className="p-8 text-center">
        <div className="space-y-4">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto">
            <Image className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            {fanzoneEs.posts.noPosts}
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            {fanzoneEs.posts.noPostsDesc}
          </p>
          {fanroom.is_member && (
            <Button onClick={onCreatePost} className="mt-3">
              {fanzoneEs.posts.createFirst}
            </Button>
          )}
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Lista de posts */}
      {posts.map(renderPost)}

      {/* Load More Button */}
      {onLoadMore && (
        <div className="flex justify-center pt-4">
          <Button variant="outline" onClick={onLoadMore}>
            Cargar más posts
          </Button>
        </div>
      )}
    </div>
  )
}
