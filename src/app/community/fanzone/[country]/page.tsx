'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Search, Plus, Filter, Sparkles, Users, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useFanZone } from '@/hooks/useFanZone'

/**
 * FanZone Country Page
 * /community/fanzone/[country] - Página específica por país
 */
export default function FanZoneCountryPage() {
  const params = useParams()
  const router = useRouter()
  const { listFanrooms } = useFanZone()
  
  const country = params.country as string
  
  // Estados de UI
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [activeFilter, setActiveFilter] = useState('trending')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [loading, setLoading] = useState(false)
  const [fanrooms, setFanrooms] = useState<any[]>([])
  const [totalFanrooms, setTotalFanrooms] = useState(0)

  // Configuración de países
  const countryConfig = {
    latam: { 
      name: 'LATAM', 
      flag: '🌎', 
      color: 'purple',
      description: 'Toda Latinoamérica',
      population: '650M+'
    },
    mx: { 
      name: 'México', 
      flag: '🇲🇽', 
      color: 'green',
      description: 'Tierra de los fans mexicanos',
      population: '130M+'
    },
    pe: { 
      name: 'Perú', 
      flag: '🇵🇪', 
      color: 'red',
      description: 'Comunidad peruana de K-Culture',
      population: '33M+'
    },
    co: { 
      name: 'Colombia', 
      flag: '🇨🇴', 
      color: 'yellow',
      description: 'Fans colombianos unidos',
      population: '51M+'
    },
    cl: { 
      name: 'Chile', 
      flag: '🇨🇱', 
      color: 'blue',
      description: 'K-Pop en el fin del mundo',
      population: '19M+'
    },
    ar: { 
      name: 'Argentina', 
      flag: '🇦🇷', 
      color: 'sky',
      description: 'Pasión argentina por K-Culture',
      population: '45M+'
    },
    br: { 
      name: 'Brasil', 
      flag: '🇧🇷', 
      color: 'green',
      description: 'Maior comunidade K-Pop da América Latina',
      population: '215M+'
    },
    us: { 
      name: 'Estados Unidos', 
      flag: '🇺🇸', 
      color: 'blue',
      description: 'K-Pop community in the USA',
      population: '330M+'
    }
  }

  const currentCountry = countryConfig[country as keyof typeof countryConfig] || countryConfig.latam

  // Cargar FanRooms reales desde la base de datos
  useEffect(() => {
    const loadFanrooms = async () => {
      try {
        setLoading(true)
        const data = await listFanrooms({
          country: country,
          category: selectedCategory !== 'all' ? selectedCategory : undefined,
          sort: activeFilter,
          search: searchQuery || undefined,
          limit: 50
        })
        
        console.log('📦 Loaded fanrooms for country:', country, data)
        
        if (data && data.fanrooms) {
          setFanrooms(data.fanrooms)
          setTotalFanrooms(data.fanrooms.length)
        }
      } catch (error) {
        console.error('Error loading fanrooms:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadFanrooms()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [country, selectedCategory, activeFilter, searchQuery])

  /**
   * Maneja búsqueda
   */
  const handleSearch = (query: string) => {
    setSearchQuery(query)
  }

  /**
   * Maneja cambio de filtro
   */
  const handleFilterChange = (filter: string) => {
    setActiveFilter(filter)
  }

  /**
   * Maneja cambio de categoría
   */
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category)
  }

  /**
   * Maneja navegación hacia atrás
   */
  const handleBack = () => {
    router.push('/community/fanzone')
  }

  /**
   * Maneja creación de FanRoom
   */
  const handleCreateFanroom = () => {
    router.push(`/community/fanzone/${country}/create-room`)
  }

  /**
   * Maneja navegación a FanRoom
   */
  const handleViewFanroom = (slug: string) => {
    router.push(`/community/fanzone/${country}/${slug}`)
  }

  /**
   * Renderiza una tarjeta de FanRoom
   */
  const renderFanroomCard = (fanroom: any) => {
    return (
      <Card
        key={fanroom.id}
        className="mb-4 cursor-pointer group hover:shadow-lg transition-all duration-200 hover:scale-[1.02]"
        onClick={() => handleViewFanroom(fanroom.slug)}
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
              {fanroom.is_trending && (
                <Badge className="bg-orange-500 text-white text-xs px-2 py-1">
                  🔥 En llamas
                </Badge>
              )}
              {fanroom.is_featured && (
                <Badge className="bg-yellow-500 text-white text-xs px-2 py-1">
                  ⭐ Destacado
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
                  ⚡ {fanroom.active_members} activos
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
                  {fanroom.category === 'kpop' ? 'K-Pop' : 
                   fanroom.category === 'kdrama' ? 'K-Drama' : 
                   fanroom.category === 'kbeauty' ? 'K-Beauty' : 'Otro'}
                </Badge>
                <Badge 
                  variant="secondary" 
                  className={`text-xs bg-${currentCountry.color}-100 text-${currentCountry.color}-700 dark:bg-${currentCountry.color}-900 dark:text-${currentCountry.color}-300`}
                >
                  {currentCountry.name}
                </Badge>
              </div>
            </div>

            {/* Descripción */}
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
              {fanroom.description}
            </p>

            {/* Estadísticas */}
            <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>{fanroom.member_count || 0}</span>
                </div>
              </div>
              
              {/* Botón de acción */}
              <Button
                size="sm"
                variant={fanroom.isMember ? "outline" : "default"}
                className="text-xs px-3 py-1"
                onClick={(e) => {
                  e.stopPropagation()
                  // TODO: Implementar lógica de unirse
                }}
              >
                {fanroom.isMember ? 'Unido' : 'Súmate'}
              </Button>
            </div>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Header con información del país */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="text-white hover:bg-white/20 p-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            
            <div className="flex items-center gap-3">
              <span className="text-4xl">{currentCountry.flag}</span>
              <div>
                <h1 className="text-3xl font-bold">
                  FanZone {currentCountry.name}
                </h1>
                <p className="text-purple-100">
                  {currentCountry.description}
                </p>
              </div>
            </div>
          </div>
          
          {/* Estadísticas del país */}
          <div className="grid grid-cols-3 gap-4 max-w-md">
            <div className="text-center">
              <div className="text-2xl font-bold">{currentCountry.population}</div>
              <div className="text-sm text-purple-100">Población</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{totalFanrooms}</div>
              <div className="text-sm text-purple-100">FanRooms</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">15K+</div>
              <div className="text-sm text-purple-100">Fans activos</div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Filtros */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto scrollbar-hide">
          <div className="flex items-center gap-1">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600 dark:text-gray-400">Filtrar:</span>
          </div>
          
          {/* Filtros de ordenamiento */}
          <div className="flex items-center gap-1">
            {(['trending', 'recent', 'featured', 'popular']).map((filter) => (
              <Button
                key={filter}
                variant={activeFilter === filter ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleFilterChange(filter)}
                className="text-xs"
              >
                {filter === 'trending' ? 'En llamas' :
                 filter === 'recent' ? 'Recientes' :
                 filter === 'featured' ? 'Destacadas' : 'Populares'}
              </Button>
            ))}
          </div>
          
          {/* Filtros de categoría */}
          <div className="flex items-center gap-1 ml-2">
            {(['all', 'kpop', 'kdrama', 'kbeauty', 'kfood', 'kgaming', 'learning', 'other']).map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleCategoryChange(category)}
                className="text-xs"
              >
                {category === 'all' ? 'Todas' : 
                 category === 'kpop' ? 'K-Pop' :
                 category === 'kdrama' ? 'K-Drama' :
                 category === 'kbeauty' ? 'K-Beauty' :
                 category === 'kfood' ? 'K-Food' :
                 category === 'kgaming' ? 'K-Gaming' :
                 category === 'learning' ? 'Aprendizaje' : 'Otro'}
              </Button>
            ))}
          </div>
        </div>

        {/* Grid de FanRooms */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Comunidades en {currentCountry.name}
            </h2>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/community/fanzone')}
            >
              <Globe className="w-4 h-4 mr-2" />
              Ver todas LATAM
            </Button>
          </div>
          
          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-80 rounded-xl" />
              ))}
            </div>
          ) : fanrooms.length === 0 ? (
            <Card className="p-8 text-center">
              <div className="space-y-4">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto">
                  <Users className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  No hay comunidades en {currentCountry.name}
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Sé el primero en crear una comunidad increíble
                </p>
                <Button onClick={handleCreateFanroom} className="mt-4">
                  Crear Comunidad
                </Button>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {fanrooms.map(renderFanroomCard)}
            </div>
          )}
        </div>

        {/* FAB para crear FanRoom */}
        <div className="fixed bottom-20 right-4 z-50 md:bottom-6">
          <Button
            size="lg"
            onClick={handleCreateFanroom}
            className="w-14 h-14 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 active:scale-95"
          >
            <span className="text-white text-xl">+💫</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
