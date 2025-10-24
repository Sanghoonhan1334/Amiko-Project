'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Search, Plus, Filter, Sparkles, Users, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

// 간단한 데이터 로딩 함수
async function loadFanroomsData() {
  try {
    const response = await fetch('/api/fanzone/list?country=latam&sort=trending&limit=20', {
      credentials: 'include'
    })
    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error loading fanrooms:', error)
    return { success: false, fanrooms: [] }
  }
}

export default function FanZoneHomeSimple() {
  console.log('🎨 FanZoneHomeSimple RENDER')
  
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [activeFilter, setActiveFilter] = useState('trending')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedCountry, setSelectedCountry] = useState('latam')
  const [loading, setLoading] = useState(false)
  const [realFanrooms, setRealFanrooms] = useState<any[]>([])
  const [myFanrooms, setMyFanrooms] = useState<any[]>([])
  const hasLoadedRef = useRef(false)
  const [isClient, setIsClient] = useState(false)

  // 클라이언트 사이드 렌더링 확인
  useEffect(() => {
    setIsClient(true)
  }, [])

  const handleViewFanroom = (slug: string, country: string = 'latam') => {
    router.push(`/community/fanzone/${country}/${slug}`)
  }

  const handleCreateFanroom = () => {
    router.push('/community/fanzone/create-room')
  }

  const handleJoinFanroom = (fanroomId: string) => {
    console.log('Join fanroom:', fanroomId)
  }

  // 데이터 로딩 - 한 번만 실행
  useEffect(() => {
    if (hasLoadedRef.current) {
      console.log('⏸️ Already loaded, skipping...')
      return
    }
    
    console.log('🔄 Loading fanrooms ONCE')
    hasLoadedRef.current = true
    
    const loadData = async () => {
      try {
        setLoading(true)
        const data = await loadFanroomsData()
        
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
    }
    
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Usar solo datos reales de la base de datos
  const displayMyFanrooms = myFanrooms
  const displayExploreFanrooms = realFanrooms

  // 서버 사이드 렌더링 시에는 로딩 상태 표시
  if (!isClient) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900">
        <div className="max-w-6xl mx-auto px-1 py-16">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-48 bg-gray-200 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 via-pink-600/20 to-indigo-600/20"></div>
        <div className="relative max-w-6xl mx-auto px-1 py-16 md:py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 bg-clip-text text-transparent mb-6">
              FanZone
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
              Connect with fellow fans, share your passion, and discover amazing communities
            </p>
            
            {/* Search Bar */}
            <div className="max-w-md mx-auto mb-8">
              {showSearch ? (
                <div className="flex gap-2">
                  <Input
                    placeholder="Search communities..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    onClick={() => setShowSearch(false)}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => setShowSearch(true)}
                  className="w-full justify-start text-gray-500"
                >
                  <Search className="w-4 h-4 mr-2" />
                  Search communities...
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-1 pb-16">
        {/* My Communities */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Users className="w-6 h-6 text-purple-600" />
              My Communities
            </h2>
            <Button
              onClick={handleCreateFanroom}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Community
            </Button>
          </div>

          {loading ? (
            <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="w-32 h-40 rounded-xl" />
              ))}
            </div>
          ) : displayMyFanrooms.length > 0 ? (
            <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
              {displayMyFanrooms.map((fanroom) => (
                <Card
                  key={fanroom.id}
                  className="flex-shrink-0 w-32 cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => handleViewFanroom(fanroom.slug, fanroom.country)}
                >
                  <div className="relative h-20 w-full">
                    <Image
                      src={fanroom.cover_image || '/amiko-logo.png'}
                      alt={fanroom.name}
                      fill
                      className="object-cover rounded-t-xl"
                    />
                  </div>
                  <div className="p-3">
                    <h3 className="font-semibold text-sm truncate">{fanroom.name}</h3>
                    <p className="text-xs text-gray-500">{fanroom.member_count} members</p>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>You haven't joined any communities yet</p>
              <Button
                onClick={handleCreateFanroom}
                className="mt-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                Create Your First Community
              </Button>
            </div>
          )}
        </section>

        {/* Explore Communities */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Globe className="w-6 h-6 text-indigo-600" />
              Explore Communities
            </h2>
            
            {/* Filters */}
            <div className="flex gap-2">
              <Button
                variant={activeFilter === 'trending' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveFilter('trending')}
              >
                <Sparkles className="w-4 h-4 mr-1" />
                Trending
              </Button>
              <Button
                variant={activeFilter === 'newest' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveFilter('newest')}
              >
                Newest
              </Button>
              <Button
                variant={activeFilter === 'popular' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveFilter('popular')}
              >
                Popular
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-48 rounded-xl" />
              ))}
            </div>
          ) : displayExploreFanrooms.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayExploreFanrooms.map((fanroom) => (
                <Card
                  key={fanroom.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow overflow-hidden"
                  onClick={() => handleViewFanroom(fanroom.slug, fanroom.country)}
                >
                  <div className="relative h-32 w-full">
                    <Image
                      src={fanroom.cover_image || '/amiko-logo.png'}
                      alt={fanroom.name}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute top-2 right-2">
                      <Badge variant="secondary" className="bg-white/90 text-gray-800">
                        {fanroom.category}
                      </Badge>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-lg mb-2">{fanroom.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                      {fanroom.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">
                        {fanroom.member_count} members
                      </span>
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleJoinFanroom(fanroom.id)
                        }}
                      >
                        Join
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Globe className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">No communities found</p>
              <p className="text-sm">Try adjusting your search or filters</p>
            </div>
          )}
        </section>
      </div>

      {/* Floating Create Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={handleCreateFanroom}
          size="lg"
          className="w-14 h-14 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-lg hover:shadow-xl transition-all duration-200"
        >
          <span className="text-white text-xl">+💫</span>
        </Button>
      </div>
    </div>
  )
}
