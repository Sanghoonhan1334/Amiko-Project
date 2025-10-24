'use client'

import React from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Users, Activity, Calendar, Eye, Star, TrendingUp } from 'lucide-react'

interface FanRoomHeaderProps {
  fanroom: any
  onJoin?: () => void
  onLeave?: () => void
}

/**
 * FanRoomHeader - Header del FanRoom con información principal
 * Incluye: Imagen de portada, título, descripción, estadísticas, botones de acción
 */
export default function FanRoomHeader({ 
  fanroom, 
  onJoin, 
  onLeave 
}: FanRoomHeaderProps) {
  /**
   * Maneja click en botón de unirse/salir
   */
  const handleMembershipToggle = () => {
    if (fanroom.isMember) {
      onLeave?.()
    } else {
      onJoin?.()
    }
  }

  /**
   * Formatea fecha relativa
   */
  const formatRelativeDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffInDays === 0) return 'Hoy'
    if (diffInDays === 1) return 'Ayer'
    if (diffInDays < 7) return `Hace ${diffInDays} días`
    if (diffInDays < 30) return `Hace ${Math.floor(diffInDays / 7)} semanas`
    return `Hace ${Math.floor(diffInDays / 30)} meses`
  }

  return (
    <Card className="relative overflow-hidden">
      {/* Imagen de portada */}
      <div className="relative h-48 md:h-64 bg-gradient-to-br from-purple-400 to-pink-400">
        {(fanroom.cover_image || fanroom.coverImage) ? (
          <img
            src={fanroom.cover_image || fanroom.coverImage}
            alt={fanroom.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-white text-6xl font-bold">
              {fanroom.name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}

        {/* Overlay con badges */}
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          {(fanroom.is_trending || fanroom.isTrending) && (
            <Badge className="bg-orange-500 text-white px-3 py-1">
              <TrendingUp className="w-4 h-4 mr-1" />
              En llamas
            </Badge>
          )}
          {(fanroom.is_featured || fanroom.isFeatured) && (
            <Badge className="bg-yellow-500 text-white px-3 py-1">
              <Star className="w-4 h-4 mr-1" />
              Destacado
            </Badge>
          )}
          {fanroom.visibility === 'private' && (
            <Badge className="bg-gray-600 text-white px-3 py-1">
              🔒 Privado
            </Badge>
          )}
        </div>

        {/* Badge de actividad */}
        {fanroom.activeMembers > 0 && (
          <div className="absolute top-4 right-4">
            <Badge 
              variant="secondary" 
              className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 px-3 py-1"
            >
              <Activity className="w-4 h-4 mr-1" />
              {fanroom.activeMembers} activos
            </Badge>
          </div>
        )}
      </div>

      {/* Contenido */}
      <div className="p-6 space-y-4">
        {/* Título y categoría */}
        <div className="space-y-2">
          <div className="flex items-start justify-between">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">
              {fanroom.name}
            </h1>
            
            <Button
              size="lg"
              variant={fanroom.isMember ? "outline" : "default"}
              onClick={handleMembershipToggle}
              className="ml-4"
            >
              {fanroom.isMember ? 'Unido' : 'Súmate'}
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-sm">
              {fanroom.category === 'kpop' ? 'K-Pop' : 
               fanroom.category === 'kdrama' ? 'K-Drama' : 
               fanroom.category === 'kbeauty' ? 'K-Beauty' : 'Otro'}
            </Badge>
            {fanroom.tags && fanroom.tags.length > 0 && (
              <div className="flex items-center gap-1">
                {fanroom.tags.slice(0, 3).map((tag: string, index: number) => (
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
          </div>
        </div>

        {/* Descripción */}
        {fanroom.description && (
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
            {fanroom.description}
          </p>
        )}

        {/* Estadísticas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-gray-500 dark:text-gray-400 mb-1">
              <Users className="w-4 h-4" />
              <span className="text-sm">Miembros</span>
            </div>
            <div className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              {(fanroom.member_count || fanroom.memberCount || 0).toLocaleString()}
            </div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-gray-500 dark:text-gray-400 mb-1">
              <Activity className="w-4 h-4" />
              <span className="text-sm">Activos</span>
            </div>
            <div className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              {(fanroom.active_members || fanroom.activeMembers || 0).toLocaleString()}
            </div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-gray-500 dark:text-gray-400 mb-1">
              <Calendar className="w-4 h-4" />
              <span className="text-sm">Creado</span>
            </div>
            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {formatRelativeDate(fanroom.created_at || fanroom.createdAt)}
            </div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-gray-500 dark:text-gray-400 mb-1">
              <Eye className="w-4 h-4" />
              <span className="text-sm">Visibilidad</span>
            </div>
            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {fanroom.visibility === 'public' ? 'Público' : 'Privado'}
            </div>
          </div>
        </div>

        {/* Información del creador */}
        {fanroom.creator && (
          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
              {fanroom.creator.avatar ? (
                <img
                  src={fanroom.creator.avatar}
                  alt={fanroom.creator.name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span className="text-white font-semibold">
                  {fanroom.creator.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {fanroom.creator.name}
                </span>
                <Badge variant="secondary" className="text-xs">
                  Creador
                </Badge>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Creado por {fanroom.creator.name}
              </p>
            </div>
            
            <Button
              variant="outline"
              size="sm"
            >
              Ver perfil
            </Button>
          </div>
        )}
      </div>
    </Card>
  )
}
