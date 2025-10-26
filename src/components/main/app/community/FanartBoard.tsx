'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { Plus, TrendingUp, Clock, Grid3x3, List as ListIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import Link from 'next/link'

interface FanartPost {
  id: string
  title: string
  author_name: string
  likes_count: number
  comments_count: number
  views: number
  thumbnail_url: string
  category: string
  is_pinned?: boolean
  created_at: string
}

type ViewMode = 'grid' | 'list'
type SortType = 'popular' | 'recent'

// Mock data for fan art
const mockFanarts: FanartPost[] = [
  {
    id: '1',
    title: 'BTS Jimin Portrait',
    author_name: 'ArtLover99',
    likes_count: 245,
    comments_count: 12,
    views: 1234,
    thumbnail_url: '/covers/jisoo.png',
    category: 'Portrait',
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '2',
    title: 'NewJeans Fan Art',
    author_name: 'DrawMaster',
    likes_count: 567,
    comments_count: 45,
    views: 3421,
    thumbnail_url: '/misc/1.png',
    category: 'Group',
    is_pinned: true,
    created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '3',
    title: 'BLACKPINK Chibi Style',
    author_name: 'ChibiArtist',
    likes_count: 890,
    comments_count: 78,
    views: 5678,
    thumbnail_url: '/misc/2.png',
    category: 'Chibi',
    created_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '4',
    title: 'Aespa Karina Digital Art',
    author_name: 'DigitalArts',
    likes_count: 432,
    comments_count: 23,
    views: 2345,
    thumbnail_url: '/misc/3.png',
    category: 'Digital',
    created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '5',
    title: 'Stray Kids Fan Art',
    author_name: 'SKZ_Fan',
    likes_count: 321,
    comments_count: 34,
    views: 1890,
    thumbnail_url: '/misc/1.png',
    category: 'Group',
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '6',
    title: 'IU Watercolor Painting',
    author_name: 'WatercolorPro',
    likes_count: 654,
    comments_count: 56,
    views: 4123,
    thumbnail_url: '/misc/2.png',
    category: 'Traditional',
    created_at: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(),
  },
]

const categories = ['All', 'Portrait', 'Group', 'Chibi', 'Digital', 'Traditional']

export default function FanartBoard() {
  const { user } = useAuth()
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [sortBy, setSortBy] = useState<SortType>('popular')
  const [activeCategory, setActiveCategory] = useState('All')
  const [posts, setPosts] = useState<FanartPost[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFanarts()
  }, [sortBy, activeCategory])

  const fetchFanarts = async () => {
    setLoading(true)
    try {
      // API call would go here
      // For now, use mock data
      let data = [...mockFanarts]
      
      // Sort
      if (sortBy === 'popular') {
        data.sort((a, b) => b.likes_count - a.likes_count)
      } else {
        data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      }
      
      // Filter by category
      if (activeCategory !== 'All') {
        data = data.filter(post => post.category === activeCategory)
      }
      
      setPosts(data)
    } catch (error) {
      console.error('Failed to fetch fan arts:', error)
      setPosts(mockFanarts)
    } finally {
      setLoading(false)
    }
  }

  const pinnedPosts = posts.filter(post => post.is_pinned)
  const regularPosts = posts.filter(post => !post.is_pinned)

  const getTimeAgo = (dateString: string) => {
    const now = new Date()
    const date = new Date(dateString)
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return 'Ahora'
    if (diffInSeconds < 3600) return `Hace ${Math.floor(diffInSeconds / 60)}m`
    if (diffInSeconds < 86400) return `Hace ${Math.floor(diffInSeconds / 3600)}h`
    return `Hace ${Math.floor(diffInSeconds / 86400)}d`
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Tablero de Fan Art</h1>
            {user && (
              <Button className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Subir Fan Art
              </Button>
            )}
          </div>

          {/* Categories */}
          <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  activeCategory === category
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2">
            <Button
              variant={sortBy === 'popular' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortBy('popular')}
              className="flex items-center gap-1"
            >
              <TrendingUp className="w-4 h-4" />
              Popular
            </Button>
            <Button
              variant={sortBy === 'recent' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortBy('recent')}
              className="flex items-center gap-1"
            >
              <Clock className="w-4 h-4" />
              Reciente
            </Button>
            <div className="flex-1" />
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="flex items-center gap-1"
            >
              <Grid3x3 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="flex items-center gap-1"
            >
              <ListIcon className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="aspect-square bg-gray-100 animate-pulse rounded-lg"
              />
            ))}
          </div>
        ) : (
          <>
            {/* Pinned Posts */}
            {pinnedPosts.length > 0 && (
              <div className="mb-6">
                <div className="px-4 py-2 mb-3 rounded-lg bg-purple-100">
                  <h2 className="font-semibold text-sm">📌 Destacado</h2>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {pinnedPosts.map(post => (
                    <Link key={post.id} href={`/community/fanart/${post.id}`}>
                      <div className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer">
                        <Image
                          src={post.thumbnail_url}
                          alt={post.title}
                          fill
                          className="object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent p-3 flex flex-col justify-end">
                          <p className="text-white text-sm font-semibold truncate">{post.title}</p>
                          <div className="flex items-center gap-3 mt-1 text-white text-xs">
                            <span>♥ {post.likes_count}</span>
                            <span>💬 {post.comments_count}</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Regular Posts */}
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {regularPosts.map(post => (
                  <Link key={post.id} href={`/community/fanart/${post.id}`}>
                    <div className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer">
                      <Image
                        src={post.thumbnail_url}
                        alt={post.title}
                        fill
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent p-3 flex flex-col justify-end">
                        <p className="text-white text-sm font-semibold truncate">{post.title}</p>
                        <div className="flex items-center gap-3 mt-1 text-white text-xs">
                          <span>♥ {post.likes_count}</span>
                          <span>💬 {post.comments_count}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {regularPosts.map(post => (
                  <Link key={post.id} href={`/community/fanart/${post.id}`}>
                    <div className="flex gap-4 p-3 border border-gray-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer">
                      <div className="relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                        <Image
                          src={post.thumbnail_url}
                          alt={post.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">{post.title}</h3>
                        <p className="text-sm text-gray-500 mt-1">{post.author_name}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                          <span>♥ {post.likes_count}</span>
                          <span>💬 {post.comments_count}</span>
                          <span>{getTimeAgo(post.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
