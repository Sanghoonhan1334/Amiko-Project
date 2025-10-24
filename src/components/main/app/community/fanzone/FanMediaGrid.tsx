'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Image, Video, Play, Download, Share2, Eye, Calendar } from 'lucide-react'

interface FanMediaGridProps {
  fanroom: any
}

/**
 * FanMediaGrid - Grid Masonry para media del FanRoom con datos reales
 */
export default function FanMediaGrid({ fanroom }: FanMediaGridProps) {
  const [selectedMedia, setSelectedMedia] = useState<{
    url: string
    type: 'image' | 'video'
  } | null>(null)
  const [filter, setFilter] = useState<'all' | 'photos' | 'videos'>('all')
  const [media, setMedia] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Cargar media real (temporalmente deshabilitado hasta crear API)
  useEffect(() => {
    // loadMedia() // Comentado temporalmente hasta crear API endpoint
    setLoading(false)
    setMedia([]) // Por ahora mostrar estado vacío
  }, [fanroom.id])

  const loadMedia = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/fanzone/media?fanroom_id=${fanroom.id}`)
      const data = await response.json()
      
      if (data.success && data.media) {
        setMedia(data.media)
      } else {
        setMedia([])
      }
    } catch (error) {
      console.error('Error loading media:', error)
      setMedia([])
    } finally {
      setLoading(false)
    }
  }

  /**
   * Filtra media según tipo
   */
  const filteredMedia = media.filter(item => {
    if (filter === 'photos') return item.type === 'image'
    if (filter === 'videos') return item.type === 'video'
    return true
  })

  /**
   * Maneja click en media
   */
  const handleMediaClick = (media: any) => {
    setSelectedMedia({
      url: media.url,
      type: media.type as 'image' | 'video'
    })
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
   * Renderiza un item de media
   */
  const renderMediaItem = (media: any) => {
    return (
      <Card
        key={media.id}
        className="overflow-hidden cursor-pointer group hover:shadow-lg transition-all duration-200"
        onClick={() => handleMediaClick(media)}
      >
        <div className="relative aspect-square">
          {media.type === 'video' ? (
            <div className="relative w-full h-full bg-gray-100 dark:bg-gray-800">
              <video
                src={media.url}
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
              src={media.url}
              alt={`Media ${media.id}`}
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
                  handleDownload(media.url, `media-${Date.now()}`)
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
                  // TODO: Implementar compartir
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
                media.type === 'video'
                  ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' 
                  : 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
              }`}
            >
              {media.type === 'video' ? <Video className="w-3 h-3 mr-1" /> : <Image className="w-3 h-3 mr-1" />}
              {media.type === 'video' ? 'Video' : 'Foto'}
            </Badge>
          </div>
        </div>

        {/* Información del post */}
        <div className="p-3 space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <Calendar className="w-3 h-3" />
            <span>{formatRelativeTime(media.created_at || media.createdAt)}</span>
          </div>
          
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>{media.author_name || media.author || 'Usuario'}</span>
            <div className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              <span>{media.likes_count || media.likesCount || 0}</span>
            </div>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Media
        </h2>
        
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
      </div>

      {/* Grid de media */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="aspect-square w-full" />
              <div className="p-3 space-y-2">
                <Skeleton className="h-3 w-20" />
                <div className="flex justify-between">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-3 w-8" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : filteredMedia.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="space-y-4">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto">
              <Image className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              Sin media
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Los posts con fotos y videos aparecerán aquí
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredMedia.map(renderMediaItem)}
        </div>
      )}

      {/* Modal de vista ampliada */}
      {selectedMedia && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="max-w-4xl max-h-full">
            <div className="relative">
              {selectedMedia.type === 'video' ? (
                <video
                  src={selectedMedia.url}
                  controls
                  className="max-w-full max-h-full"
                  autoPlay
                />
              ) : (
                <img
                  src={selectedMedia.url}
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
