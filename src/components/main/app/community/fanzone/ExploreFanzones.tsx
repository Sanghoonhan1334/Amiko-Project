'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Users, Activity, Star, Lock, Eye, Plus } from 'lucide-react'
import { FanroomWithDetails } from '@/types/fanzone'
import fanzoneEs from '@/i18n/community/es'

interface ExploreFanzonesProps {
  fanrooms: FanroomWithDetails[]
  loading: boolean
  onJoin?: (fanroomId: string) => void
  onLeave?: (fanroomId: string) => void
  onView?: (slug: string) => void
  hasMore?: boolean
  onLoadMore?: () => void
  variant?: 'default' | 'trending' | 'featured'
}

/**
 * ExploreFanzones - Grid Masonry para exploración de comunidades
 * Layout responsivo: 2 columnas móvil, 3+ desktop
 */
export default function ExploreFanzones({ 
  fanrooms, 
  loading, 
  onJoin, 
  onLeave, 
  onView,
  hasMore = false,
  onLoadMore,
  variant = 'default'
}: ExploreFanzonesProps) {
  const router = useRouter()
  const [columns, setColumns] = useState(2)
  const [masonryColumns, setMasonryColumns] = useState<FanroomWithDetails[][]>([])
  const containerRef = useRef<HTMLDivElement>(null)

  // Calcular columnas según tamaño de pantalla
  useEffect(() => {
    const updateColumns = () => {
      if (window.innerWidth >= 1024) {
        setColumns(3) // Desktop: 3 columnas
      } else if (window.innerWidth >= 768) {
        setColumns(2) // Tablet: 2 columnas
      } else {
        setColumns(2) // Mobile: 2 columnas
      }
    }

    updateColumns()
    window.addEventListener('resize', updateColumns)
    return () => window.removeEventListener('resize', updateColumns)
  }, [])

  // Distribuir FanRooms en columnas Masonry
  useEffect(() => {
    if (fanrooms.length === 0) {
      setMasonryColumns([])
      return
    }

    const newColumns: FanroomWithDetails[][] = Array.from({ length: columns }, () => [])
    const columnHeights = new Array(columns).fill(0)

    fanrooms.forEach((fanroom) => {
      // Encontrar la columna más corta
      const shortestColumnIndex = columnHeights.indexOf(Math.min(...columnHeights))
      
      // Agregar FanRoom a la columna más corta
      newColumns[shortestColumnIndex].push(fanroom)
      
      // Estimar altura (aproximada)
      const estimatedHeight = 200 + (fanroom.description ? 40 : 0) + (fanroom.tags?.length ? 30 : 0)
      columnHeights[shortestColumnIndex] += estimatedHeight
    })

    setMasonryColumns(newColumns)
  }, [fanrooms, columns])

  /**
   * Maneja click en FanRoom
   */
  const handleFanroomClick = (slug: string) => {
    if (onView) {
      onView(slug)
    } else {
      router.push(`/community/fanzone/${slug}`)
    }
  }

  /**
   * Maneja unirse/salir
   */
  const handleToggleMembership = (e: React.MouseEvent, fanroom: FanroomWithDetails) => {
    e.stopPropagation()
    
    if (fanroom.is_member) {
      onLeave?.(fanroom.id)
    } else {
      onJoin?.(fanroom.id)
    }
  }

  /**
   * Renderiza una tarjeta de FanRoom
   */
  const renderFanroomCard = (fanroom: FanroomWithDetails) => {
    const isTrending = fanroom.is_trending || variant === 'trending'
    const isFeatured = fanroom.is_featured || variant === 'featured'
    
    return (
      <Card
        key={fanroom.id}
        className="mb-4 cursor-pointer group hover:shadow-lg transition-all duration-200 hover:scale-[1.02]"
        onClick={() => handleFanroomClick(fanroom.slug)}
      >
        <div className="relative">
          {/* Imagen de portada */}
          <div className="relative w-full h-32 bg-gradient-to-br from-purple-400 to-pink-400 rounded-t-xl overflow-hidden">
            {fanroom.cover_image ? (
              <img
                src={fanroom.cover_image}
                alt={fanroom.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-white text-3xl font-bold">
                  {fanroom.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}

            {/* Overlay con badges */}
            <div className="absolute top-2 left-2 flex flex-col gap-1">
              {isTrending && (
                <Badge className="bg-orange-500 text-white text-xs px-2 py-1">
                  🔥 {fanzoneEs.card.trending}
                </Badge>
              )}
              {isFeatured && (
                <Badge className="bg-yellow-500 text-white text-xs px-2 py-1">
                  ⭐ {fanzoneEs.card.featured}
                </Badge>
              )}
              {fanroom.visibility === 'private' && (
                <Badge className="bg-gray-600 text-white text-xs px-2 py-1">
                  <Lock className="w-3 h-3 mr-1" />
                  {fanzoneEs.card.private}
                </Badge>
              )}
            </div>

            {/* Badge de actividad */}
            {fanroom.active_members > 0 && (
              <div className="absolute top-2 right-2">
                <Badge 
                  variant="secondary" 
                  className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 text-xs px-2 py-1"
                >
                  <Activity className="w-3 h-3 mr-1" />
                  {fanroom.active_members}
                </Badge>
              </div>
            )}
          </div>

          {/* Contenido */}
          <div className="p-4 space-y-3">
            {/* Título y categoría */}
            <div className="space-y-1">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 line-clamp-1">
                {fanroom.name}
              </h3>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {fanzoneEs.filters.categories[fanroom.category]}
                </Badge>
                {fanroom.is_trending && (
                  <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                    NUEVO
                  </Badge>
                )}
              </div>
            </div>

            {/* Descripción */}
            {fanroom.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                {fanroom.description}
              </p>
            )}

            {/* Tags */}
            {fanroom.tags && fanroom.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {fanroom.tags.slice(0, 3).map((tag, index) => (
                  <Badge 
                    key={index} 
                    variant="secondary" 
                    className="text-xs px-2 py-1 bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                  >
                    #{tag}
                  </Badge>
                ))}
                {fanroom.tags.length > 3 && (
                  <Badge variant="secondary" className="text-xs px-2 py-1">
                    +{fanroom.tags.length - 3}
                  </Badge>
                )}
              </div>
            )}

            {/* Estadísticas */}
            <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>{fanroom.member_count}</span>
                </div>
                {fanroom.recent_posts_count && (
                  <div className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    <span>{fanroom.recent_posts_count}</span>
                  </div>
                )}
              </div>
              
              {/* Botón de acción */}
              <Button
                size="sm"
                variant={fanroom.is_member ? "outline" : "default"}
                className="text-xs px-3 py-1"
                onClick={(e) => handleToggleMembership(e, fanroom)}
              >
                {fanroom.is_member ? fanzoneEs.card.joined : fanzoneEs.card.join}
              </Button>
            </div>
          </div>
        </div>
      </Card>
    )
  }

  // Loading state
  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-80 rounded-xl" />
        ))}
      </div>
    )
  }

  // Empty state
  if (fanrooms.length === 0) {
    return (
      <Card className="p-8 text-center">
        <div className="space-y-4">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto">
            <Users className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            {fanzoneEs.empty.noFanrooms}
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            {fanzoneEs.empty.noFanroomsDesc}
          </p>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Grid Masonry */}
      <div 
        ref={containerRef}
        className="grid grid-cols-2 lg:grid-cols-3 gap-4"
      >
        {masonryColumns.map((column, columnIndex) => (
          <div key={columnIndex} className="space-y-0">
            {column.map((fanroom) => renderFanroomCard(fanroom))}
          </div>
        ))}
      </div>

      {/* Load More Button */}
      {hasMore && onLoadMore && (
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            onClick={onLoadMore}
            className="px-6"
          >
            <Plus className="w-4 h-4 mr-2" />
            Cargar más comunidades
          </Button>
        </div>
      )}
    </div>
  )
}
