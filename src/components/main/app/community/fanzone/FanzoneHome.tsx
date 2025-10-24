'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Search, Plus, Filter, Sparkles, Users, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useFanZone } from '@/hooks/useFanZone'

const FanZoneHome = React.memo(function FanZoneHome() {
  console.log('🎨 FanZoneHome RENDER')
  
  const router = useRouter()
  const { listFanrooms } = useFanZone()
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [activeFilter, setActiveFilter] = useState('trending')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedCountry, setSelectedCountry] = useState('latam')
  const [loading, setLoading] = useState(false)
  const [realFanrooms, setRealFanrooms] = useState<any[]>([])
  const [myFanrooms, setMyFanrooms] = useState<any[]>([])
  
  const isLoadingRef = useRef(false)

  const handleViewFanroom = (slug: string, country: string = 'latam') => {
    router.push(`/community/fanzone/${country}/${slug}`)
  }

  const handleCreateFanroom = () => {
    router.push('/community/fanzone/create-room')
  }

  const handleJoinFanroom = (fanroomId: string) => {
    console.log('Join fanroom:', fanroomId)
  }

  // 데이터 로딩 함수를 메모이제이션
  const loadFanrooms = useCallback(async () => {
    if (isLoadingRef.current) {
      console.log('⏸️ Already loading, skipping...')
      return
    }
    
    console.log('🔄 Loading fanrooms ONCE')
    isLoadingRef.current = true
    
    try {
      setLoading(true)
      const data = await listFanrooms({
        country: selectedCountry,
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        sort: activeFilter,
        search: searchQuery || undefined,
        limit: 20
      })
      
      console.log('📦 Loaded fanrooms:', data)
      
      if (data && data.fanrooms) {
        setRealFanrooms(data.fanrooms)
        setMyFanrooms(data.fanrooms.filter((f: any) => f.isMember))
      }
    } catch (error) {
      console.error('Error loading fanrooms:', error)
    } finally {
      setLoading(false)
    }
  }, [listFanrooms, selectedCountry, selectedCategory, activeFilter, searchQuery])

  // 컴포넌트 마운트 시에만 데이터 로드
  useEffect(() => {
    loadFanrooms()
  }, [loadFanrooms]) // Empty array = only on mount

  // Usar solo datos reales de la base de datos
  const displayMyFanrooms = myFanrooms
  const displayExploreFanrooms = realFanrooms

  return (
    <div className="w-full space-y-6">
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">
              FanZone 💜
            </h1>
            <Badge variant="secondary" className="bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
              Conecta con fans como tú
            </Badge>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSearch(!showSearch)}
              className="p-2"
            >
              <Search className="w-5 h-5" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCreateFanroom}
              className="p-2"
            >
              <Plus className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {showSearch && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="¿Qué te apasiona?"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        )}

        <div className="space-y-3 mt-4">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
            <div className="flex items-center gap-1">
              <Globe className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">País:</span>
            </div>
            
            <div className="flex items-center gap-1">
              {([
                { code: 'latam', name: 'LATAM', flag: '🌎' },
                { code: 'mx', name: 'México', flag: '🇲🇽' },
                { code: 'pe', name: 'Perú', flag: '🇵🇪' },
                { code: 'co', name: 'Colombia', flag: '🇨🇴' },
                { code: 'cl', name: 'Chile', flag: '🇨🇱' },
                { code: 'ar', name: 'Argentina', flag: '🇦🇷' }
              ]).map((country) => (
                <Button
                  key={country.code}
                  variant={selectedCountry === country.code ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCountry(country.code)}
                  className="text-xs flex items-center gap-1"
                >
                  <span>{country.flag}</span>
                  <span className="hidden sm:inline">{country.name}</span>
                </Button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
            <div className="flex items-center gap-1">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Filtrar:</span>
            </div>
            
            <div className="flex items-center gap-1">
              {(['trending', 'recent', 'featured', 'popular']).map((filter) => (
                <Button
                  key={filter}
                  variant={activeFilter === filter ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveFilter(filter)}
                  className="text-xs"
                >
                  {filter === 'trending' ? 'En llamas' :
                   filter === 'recent' ? 'Recientes' :
                   filter === 'featured' ? 'Destacadas' : 'Populares'}
                </Button>
              ))}
            </div>
            
            <div className="flex items-center gap-1 ml-2">
              {(['all', 'kpop', 'kdrama', 'kbeauty']).map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className="text-xs"
                >
                  {category === 'all' ? 'Todas' : 
                   category === 'kpop' ? 'K-Pop' :
                   category === 'kdrama' ? 'K-Drama' : 'K-Beauty'}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Mis Comunidades
          </h2>
        </div>

        {loading ? (
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="flex-shrink-0 w-32">
                <Skeleton className="w-full h-24 rounded-t-xl" />
                <div className="p-3">
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-3 w-12 mb-2" />
                  <Skeleton className="h-6 w-full" />
                </div>
              </Card>
            ))}
          </div>
        ) : displayMyFanrooms.length === 0 ? (
          <Card className="p-6 text-center">
            <div className="space-y-3">
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto">
                <Users className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="font-medium text-gray-900 dark:text-gray-100">
                Aún no te has unido a ninguna comunidad
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Explora y únete a comunidades que te interesen
              </p>
            </div>
          </Card>
        ) : (
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
            {displayMyFanrooms.map((fanroom) => (
            <Card
              key={fanroom.id}
              className="flex-shrink-0 w-32 cursor-pointer"
              onClick={() => handleViewFanroom(fanroom.slug)}
            >
              <div className="w-full h-24 rounded-t-xl overflow-hidden bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center relative">
                {fanroom.cover_image ? (
                  <Image 
                    src={fanroom.cover_image} 
                    alt={fanroom.name}
                    width={128}
                    height={96}
                    className="w-full h-full object-cover"
                    unoptimized
                  />
                ) : (
                  <span className="text-white text-2xl font-bold">
                    {fanroom.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="p-3">
                <h3 className="font-medium text-sm truncate">{fanroom.name}</h3>
                <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                  <Users className="w-3 h-3" />
                  <span>{fanroom.member_count || 0}</span>
                </div>
                <Button size="sm" variant="outline" className="w-full text-xs mt-2">
                  Unido
                </Button>
              </div>
            </Card>
          ))}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-500" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            En llamas 🔥
          </h2>
        </div>
        
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-80 rounded-xl" />
            ))}
          </div>
        ) : displayExploreFanrooms.filter(f => f.is_trending).length === 0 ? (
          <Card className="p-8 text-center">
            <div className="space-y-4">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto">
                <Sparkles className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                No hay comunidades trending en este momento
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Sé el primero en crear una comunidad increíble
              </p>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {displayExploreFanrooms.filter(f => f.is_trending).map((fanroom) => (
            <Card key={fanroom.id} className="cursor-pointer">
              <div className="relative w-full h-32 bg-gradient-to-br from-purple-400 to-pink-400 rounded-t-xl overflow-hidden flex items-center justify-center">
                {fanroom.cover_image ? (
                  <Image 
                    src={fanroom.cover_image} 
                    alt={fanroom.name}
                    width={400}
                    height={128}
                    className="w-full h-full object-cover"
                    unoptimized
                  />
                ) : (
                  <span className="text-white text-3xl font-bold">
                    {fanroom.name.charAt(0).toUpperCase()}
                  </span>
                )}
                <Badge className="absolute top-2 left-2 bg-orange-500 text-white text-xs">
                  🔥 En llamas
                </Badge>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-sm">{fanroom.name}</h3>
                <p className="text-xs text-gray-600 mt-1 line-clamp-2">{fanroom.description}</p>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Users className="w-4 h-4" />
                    <span>{fanroom.member_count || 0}</span>
                  </div>
                  <Button size="sm" className="text-xs">
                    Súmate
                  </Button>
                </div>
              </div>
            </Card>
          ))}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Descubre comunidades
        </h2>
        
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-80 rounded-xl" />
            ))}
          </div>
        ) : displayExploreFanrooms.length === 0 ? (
          <Card className="p-8 text-center">
            <div className="space-y-4">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto">
                <Users className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                No hay comunidades disponibles
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
            {displayExploreFanrooms.map((fanroom) => (
            <Card key={fanroom.id} className="cursor-pointer">
              <div className="relative w-full h-32 bg-gradient-to-br from-purple-400 to-pink-400 rounded-t-xl overflow-hidden flex items-center justify-center">
                {fanroom.cover_image ? (
                  <Image 
                    src={fanroom.cover_image} 
                    alt={fanroom.name}
                    width={400}
                    height={128}
                    className="w-full h-full object-cover"
                    unoptimized
                  />
                ) : (
                  <span className="text-white text-3xl font-bold">
                    {fanroom.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-sm">{fanroom.name}</h3>
                <p className="text-xs text-gray-600 mt-1 line-clamp-2">{fanroom.description}</p>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Users className="w-4 h-4" />
                    <span>{fanroom.member_count || 0}</span>
                  </div>
                  <Button size="sm" className="text-xs">
                    Súmate
                  </Button>
                </div>
              </div>
            </Card>
          ))}
          </div>
        )}
      </div>

      <div className="fixed bottom-20 right-4 z-50 md:bottom-24 md:right-6">
        <Button
          size="lg"
          onClick={handleCreateFanroom}
          className="w-14 h-14 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-lg hover:shadow-xl transition-all duration-200"
        >
          <span className="text-white text-xl">+💫</span>
        </Button>
      </div>
    </div>
  )
})

export default FanZoneHome
