'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowRight, Users, Activity } from 'lucide-react'
import { FanroomWithDetails } from '@/types/fanzone'
import fanzoneEs from '@/i18n/community/es'

interface MyFanzonesProps {
  fanrooms: FanroomWithDetails[]
  loading: boolean
  onJoin?: (fanroomId: string) => void
  onLeave?: (fanroomId: string) => void
  onView?: (slug: string) => void
}

/**
 * MyFanzones - Scroll horizontal de mis comunidades
 * Muestra las FanRooms a las que el usuario se ha unido
 */
export default function MyFanzones({ 
  fanrooms, 
  loading, 
  onJoin, 
  onLeave, 
  onView 
}: MyFanzonesProps) {
  const { user } = useAuth()
  const router = useRouter()

  /**
   * Maneja click en "Ver todas"
   */
  const handleViewAll = () => {
    // TODO: Navegar a página de mis comunidades
    console.log('View all my fanrooms')
  }

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

  // Si no hay usuario autenticado
  if (!user) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {fanzoneEs.home.myCommunities}
          </h2>
        </div>
        
        <Card className="p-6 text-center">
          <div className="space-y-2">
            <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto">
              <Users className="w-6 h-6 text-gray-400" />
            </div>
            <h3 className="font-medium text-gray-900 dark:text-gray-100">
              Inicia sesión para ver tus comunidades
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Únete a FanRooms y aparecerán aquí
            </p>
            <Button 
              onClick={() => router.push('/sign-in')}
              className="mt-3"
            >
              Iniciar sesión
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {fanzoneEs.home.myCommunities}
        </h2>
        
        {fanrooms.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleViewAll}
            className="text-purple-600 hover:text-purple-700 dark:text-purple-400"
          >
            {fanzoneEs.home.exploreAll}
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        )}
      </div>

      {/* Contenido */}
      {loading ? (
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex-shrink-0 w-32">
              <Skeleton className="w-full h-40 rounded-xl" />
            </div>
          ))}
        </div>
      ) : fanrooms.length === 0 ? (
        <Card className="p-6 text-center">
          <div className="space-y-3">
            <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto">
              <Users className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="font-medium text-gray-900 dark:text-gray-100">
              {fanzoneEs.home.noCommunities}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {fanzoneEs.home.noCommunitiesDesc}
            </p>
            <Button 
              onClick={() => {
                // Scroll a la sección de exploración
                document.querySelector('[data-section="explore"]')?.scrollIntoView({ 
                  behavior: 'smooth' 
                })
              }}
              className="mt-3"
            >
              {fanzoneEs.home.exploreButton}
            </Button>
          </div>
        </Card>
      ) : (
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
          {fanrooms.map((fanroom) => (
            <Card
              key={fanroom.id}
              className="flex-shrink-0 w-32 cursor-pointer group hover:shadow-lg transition-all duration-200"
              onClick={() => handleFanroomClick(fanroom.slug)}
            >
              <div className="relative">
                {/* Imagen de portada */}
                <div className="w-full h-24 bg-gradient-to-br from-purple-400 to-pink-400 rounded-t-xl overflow-hidden">
                  {fanroom.cover_image ? (
                    <img
                      src={fanroom.cover_image}
                      alt={fanroom.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-white text-2xl font-bold">
                        {fanroom.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Badge de actividad */}
                {fanroom.active_members > 0 && (
                  <div className="absolute top-2 right-2">
                    <Badge 
                      variant="secondary" 
                      className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 text-xs px-1 py-0"
                    >
                      <Activity className="w-3 h-3 mr-1" />
                      {fanroom.active_members}
                    </Badge>
                  </div>
                )}

                {/* Información */}
                <div className="p-3 space-y-2">
                  <h3 className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
                    {fanroom.name}
                  </h3>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      <span>{fanroom.member_count}</span>
                    </div>
                    
                    {fanroom.is_trending && (
                      <Badge variant="secondary" className="text-xs px-1 py-0 bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300">
                        🔥
                      </Badge>
                    )}
                  </div>

                  {/* Botón de acción */}
                  <Button
                    size="sm"
                    variant={fanroom.is_member ? "outline" : "default"}
                    className="w-full text-xs"
                    onClick={(e) => handleToggleMembership(e, fanroom)}
                  >
                    {fanroom.is_member ? fanzoneEs.card.joined : fanzoneEs.card.join}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
