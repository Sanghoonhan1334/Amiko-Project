'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Share2, MoreVertical, Settings, Globe, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import FanRoomHeader from '@/components/main/app/community/fanzone/FanRoomHeader'
import FanRoomTabs from '@/components/main/app/community/fanzone/FanRoomTabs'

/**
 * FanRoom Detail Page con routing por país
 * /community/fanzone/[country]/[slug]
 */
export default function FanRoomDetailPage() {
  const params = useParams()
  const router = useRouter()
  
  const country = params.country as string
  const slug = params.slug as string
  
  // Estados principales
  const [fanroom, setFanroom] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('posts')

  // Configuración de países
  const countryConfig = {
    latam: { name: 'LATAM', flag: '🌎', color: 'purple' },
    mx: { name: 'México', flag: '🇲🇽', color: 'green' },
    pe: { name: 'Perú', flag: '🇵🇪', color: 'red' },
    co: { name: 'Colombia', flag: '🇨🇴', color: 'yellow' },
    cl: { name: 'Chile', flag: '🇨🇱', color: 'blue' },
    ar: { name: 'Argentina', flag: '🇦🇷', color: 'sky' },
    br: { name: 'Brasil', flag: '🇧🇷', color: 'green' },
    us: { name: 'Estados Unidos', flag: '🇺🇸', color: 'blue' }
  }

  const currentCountry = countryConfig[country as keyof typeof countryConfig] || countryConfig.latam

  // 실제 API에서 FanRoom 데이터를 가져옵니다

  // Cargar FanRoom
  useEffect(() => {
    if (slug && country) {
      loadFanroom()
    }
  }, [slug, country])

  /**
   * Carga información del FanRoom desde API
   */
  const loadFanroom = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // 실제 API 호출
      const response = await fetch(`/api/fanzone/fanroom/${country}/${slug}`)
      
      if (!response.ok) {
        throw new Error('FanRoom no encontrado')
      }
      
      const data = await response.json()
      
      if (data.success && data.fanroom) {
        setFanroom(data.fanroom)
      } else {
        throw new Error('Datos del FanRoom no válidos')
      }
      
    } catch (error) {
      console.error('Error loading fanroom:', error)
      setError('Error al cargar el FanRoom')
    } finally {
      setLoading(false)
    }
  }

  /**
   * Maneja unirse/salir del FanRoom
   */
  const handleToggleMembership = async () => {
    if (!fanroom) return

    try {
      // TODO: Implementar llamada real a API
      // const method = fanroom.isMember ? 'DELETE' : 'POST'
      // const response = await fetch(`/api/fanzone/${fanroom.isMember ? 'leave' : 'join'}`, {
      //   method,
      //   body: JSON.stringify({ fanroomId: fanroom.id })
      // })

      // Simular cambio de membresía
      await new Promise(resolve => setTimeout(resolve, 500))
      
      setFanroom(prev => prev ? {
        ...prev,
        isMember: !prev.isMember,
        memberCount: prev.isMember ? prev.memberCount - 1 : prev.memberCount + 1
      } : null)
      
    } catch (error) {
      console.error('Error toggling membership:', error)
    }
  }

  /**
   * Maneja compartir FanRoom
   */
  const handleShare = async () => {
    if (!fanroom) return

    try {
      if (navigator.share) {
        await navigator.share({
          title: fanroom.name,
          text: fanroom.description,
          url: window.location.href
        })
      } else {
        await navigator.clipboard.writeText(window.location.href)
        // TODO: Mostrar toast de confirmación
      }
    } catch (error) {
      console.error('Error sharing:', error)
    }
  }

  /**
   * Maneja navegación hacia atrás
   */
  const handleBack = () => {
    router.push(`/community/fanzone/${country}`)
  }

  /**
   * Maneja navegación a FanZone general
   */
  const handleGoToFanzone = () => {
    router.push('/community/fanzone')
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900">
        {/* Header skeleton */}
        <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <Skeleton className="w-8 h-8 rounded-full" />
            <Skeleton className="h-6 w-32" />
          </div>
        </div>

        {/* Content skeleton */}
        <div className="max-w-4xl mx-auto p-4 space-y-6">
          <Skeleton className="h-64 w-full rounded-xl" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !fanroom) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {error || 'FanRoom no encontrado'}
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            El FanRoom que buscas no existe o fue eliminado
          </p>
          <div className="flex gap-3 justify-center">
            <Button onClick={handleBack} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a {currentCountry.name}
            </Button>
            <Button onClick={handleGoToFanzone}>
              Ir a FanZone
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Header con navegación y país */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-3 pt-20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="p-2"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              
              <div className="flex items-center gap-2">
                <span className="text-lg">{currentCountry.flag}</span>
                <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
                  {fanroom.name}
                </h1>
              </div>
              
              <Badge 
                variant="secondary" 
                className={`bg-${currentCountry.color}-100 text-${currentCountry.color}-700 dark:bg-${currentCountry.color}-900 dark:text-${currentCountry.color}-300`}
              >
                {currentCountry.name}
              </Badge>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleShare}
                className="p-2"
              >
                <Share2 className="w-5 h-5" />
              </Button>
              
              {fanroom.userRole === 'creator' || fanroom.userRole === 'admin' ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    // TODO: Abrir configuración del FanRoom
                    console.log('Open fanroom settings')
                  }}
                  className="p-2"
                >
                  <Settings className="w-5 h-5" />
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-2"
                >
                  <MoreVertical className="w-5 h-5" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="max-w-4xl mx-auto">
        {/* Header del FanRoom */}
        <FanRoomHeader
          fanroom={fanroom}
          onJoin={handleToggleMembership}
          onLeave={handleToggleMembership}
        />

        {/* Tabs */}
        <FanRoomTabs
          fanroom={fanroom}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      </div>
    </div>
  )
}
