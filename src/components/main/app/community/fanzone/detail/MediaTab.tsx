'use client'

import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Image, Video, Play, Download, Share2, Eye, Calendar } from 'lucide-react'
import { FanroomWithDetails, FanroomPostWithAuthor } from '@/types/fanzone'
import fanzoneEs from '@/i18n/community/es'

interface MediaTabProps {
  fanroom: FanroomWithDetails
  media: FanroomPostWithAuthor[]
  loading: boolean
  onLoadMore?: () => void
}

/**
 * MediaTab - Tab de media del FanRoom
 * Muestra galería de fotos y videos de los posts
 */
export default function MediaTab({ 
  fanroom, 
  media, 
  loading, 
  onLoadMore 
}: MediaTabProps) {
  const [selectedMedia, setSelectedMedia] = useState<{
    post: FanroomPostWithAuthor
    mediaIndex: number
  } | null>(null)
  const [filter, setFilter] = useState<'all' | 'photos' | 'videos'>('all')

  /**
   * Filtra media según tipo
   */
  const filteredMedia = media.filter(post => {
    if (!post.media_urls || post.media_urls.length === 0) return false
    
    if (filter === 'photos') {
      return post.media_urls.some(url => 
        url.match(/\.(jpg|jpeg|png|gif|webp)$/i)
      )
    }
    
    if (filter === 'videos') {
      return post.media_urls.some(url => 
        url.match(/\.(mp4|webm|mov)$/i)
      )
    }
    
    return true
  })

  /**
   * Maneja click en media
   */
  const handleMediaClick = (post: FanroomPostWithAuthor, mediaIndex: number) => {
    setSelectedMedia({ post, mediaIndex })
  }

  /**
   * Maneja descarga de media
   */
  const handleDownload = async (url: string, filename: string) => {
    try {
      const response = await fetch(url)
      const blob = await response.blob()
      
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = filename
      link.click()
      
      URL.revokeObjectURL(link.href)
    } catch (error) {
      console.error('Error downloading media:', error)
    }
  }

  /**
   * Maneja compartir media
   */
  const handleShare = async (post: FanroomPostWithAuthor, mediaUrl: string) => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Media de ${post.author?.user_metadata?.full_name || 'Usuario'}`,
          text: post.content,
          url: mediaUrl
        })
      } else {
        await navigator.clipboard.writeText(mediaUrl)
        // TODO: Mostrar toast de confirmación
      }
    } catch (error) {
      console.error('Error sharing media:', error)
    }
  }

  /**
   * Formatea fecha relativa
   */
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffInDays === 0) return 'Hoy'
    if (diffInDays === 1) return 'Ayer'
    if (diffInDays < 7) return `Hace ${diffInDays} días`
    
    return date.toLocaleDateString('es-MX')
  }

  /**
   * Determina si un archivo es video
   */
  const isVideo = (url: string) => {
    return url.match(/\.(mp4|webm|mov)$/i)
  }

  /**
   * Renderiza un item de media
   */
  const renderMediaItem = (post: FanroomPostWithAuthor, mediaUrl: string, mediaIndex: number) => {
    const isVideoFile = isVideo(mediaUrl)
    
    return (
      <Card
        key={`${post.id}-${mediaIndex}`}
        className="overflow-hidden cursor-pointer group hover:shadow-lg transition-all duration-200"
        onClick={() => handleMediaClick(post, mediaIndex)}
      >
        <div className="relative aspect-square">
          {isVideoFile ? (
            <div className="relative w-full h-full bg-gray-100 dark:bg-gray-800">
              <video
                src={mediaUrl}
                className="w-full h-full object-cover"
                muted
                preload="metadata"
              />
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center">
                  <Play className="w-6 h-6 text-gray-900 ml-1" />
                </div>
              </div>
            </div>
          ) : (
            <img
              src={mediaUrl}
              alt={`Media ${mediaIndex + 1}`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            />
          )}
          
          {/* Overlay con acciones */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  handleDownload(mediaUrl, `media-${Date.now()}`)
                }}
                className="bg-white/90 hover:bg-white text-gray-900"
              >
                <Download className="w-4 h-4" />
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  handleShare(post, mediaUrl)
                }}
                className="bg-white/90 hover:bg-white text-gray-900"
              >
                <Share2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Badge de tipo */}
          <div className="absolute top-2 left-2">
            <Badge 
              variant="secondary" 
              className={`text-xs px-2 py-1 ${
                isVideoFile 
                  ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' 
                  : 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
              }`}
            >
              {isVideoFile ? <Video className="w-3 h-3 mr-1" /> : <Image className="w-3 h-3 mr-1" />}
              {isVideoFile ? 'Video' : 'Foto'}
            </Badge>
          </div>
        </div>

        {/* Información del post */}
        <div className="p-3 space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <Calendar className="w-3 h-3" />
            <span>{formatRelativeTime(post.created_at)}</span>
          </div>
          
          {post.content && (
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
              {post.content}
            </p>
          )}
          
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>{post.author?.user_metadata?.full_name || post.author?.email || 'Usuario'}</span>
            <div className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              <span>{post.likes_count}</span>
            </div>
          </div>
        </div>
      </Card>
    )
  }

  // Loading state
  if (loading) {
    return (
      <div className="space-y-4">
        {/* Filtros skeleton */}
        <div className="flex gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-20" />
          ))}
        </div>
        
        {/* Grid skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  // Empty state
  if (filteredMedia.length === 0) {
    return (
      <div className="space-y-4">
        {/* Filtros */}
        <div className="flex gap-2">
          {(['all', 'photos', 'videos'] as const).map((filterType) => (
            <Button
              key={filterType}
              variant={filter === filterType ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(filterType)}
            >
              {filterType === 'all' ? 'Todas' : filterType === 'photos' ? 'Fotos' : 'Videos'}
            </Button>
          ))}
        </div>

        <Card className="p-8 text-center">
          <div className="space-y-4">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto">
              <Image className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              {fanzoneEs.media.noMedia}
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              {fanzoneEs.media.noMediaDesc}
            </p>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex gap-2">
        {(['all', 'photos', 'videos'] as const).map((filterType) => (
          <Button
            key={filterType}
            variant={filter === filterType ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(filterType)}
          >
            {filterType === 'all' ? 'Todas' : filterType === 'photos' ? 'Fotos' : 'Videos'}
          </Button>
        ))}
      </div>

      {/* Grid de media */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredMedia.map((post) =>
          post.media_urls?.map((mediaUrl, mediaIndex) =>
            renderMediaItem(post, mediaUrl, mediaIndex)
          )
        )}
      </div>

      {/* Load More Button */}
      {onLoadMore && (
        <div className="flex justify-center pt-4">
          <Button variant="outline" onClick={onLoadMore}>
            Cargar más media
          </Button>
        </div>
      )}

      {/* Modal de vista ampliada (TODO: Implementar) */}
      {selectedMedia && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="max-w-4xl max-h-full">
            <div className="relative">
              {isVideo(selectedMedia.post.media_urls![selectedMedia.mediaIndex]) ? (
                <video
                  src={selectedMedia.post.media_urls![selectedMedia.mediaIndex]}
                  controls
                  className="max-w-full max-h-full"
                  autoPlay
                />
              ) : (
                <img
                  src={selectedMedia.post.media_urls![selectedMedia.mediaIndex]}
                  alt="Media ampliada"
                  className="max-w-full max-h-full object-contain"
                />
              )}
              
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSelectedMedia(null)}
                className="absolute top-4 right-4"
              >
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
