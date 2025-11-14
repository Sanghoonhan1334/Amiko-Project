'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { Plus, TrendingUp, Clock, Grid3x3, List as ListIcon, ArrowLeft, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import FanartUploadModal from './FanartUploadModal'
import AuthorName from '@/components/common/AuthorName'

interface FanartPost {
  id: string
  title: string
  author_name: string
  author_id?: string | null
  likes_count: number
  comments_count: number
  views: number
  image_url: string
  category: string
  is_pinned?: boolean
  is_liked?: boolean
  created_at: string
}

type ViewMode = 'grid' | 'list'
type SortType = 'popular' | 'recent'

const categories = ['All', 'Portrait', 'Group', 'Chibi', 'Digital', 'Traditional', 'Other']

export default function FanartBoard() {
  const { user, token } = useAuth()
  const router = useRouter()
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [sortBy, setSortBy] = useState<SortType>('popular')
  const [activeCategory, setActiveCategory] = useState('All')
  const [posts, setPosts] = useState<FanartPost[]>([])
  const [loading, setLoading] = useState(true)
  const [showUploadModal, setShowUploadModal] = useState(false)

  useEffect(() => {
    fetchFanarts()
  }, [sortBy, activeCategory, token])

  const fetchFanarts = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        sort: sortBy,
        category: activeCategory,
      })
      
      const headers: HeadersInit = {}
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
      
      const res = await fetch(`/api/fanart?${params}`, { headers })
      const data = await res.json()
      
      setPosts(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Failed to fetch fan arts:', error)
      setPosts([])
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (postId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!user?.is_admin) {
      alert('관리자만 게시물을 삭제할 수 있습니다.')
      return
    }

    if (!confirm('정말 이 게시물을 삭제하시겠습니까?')) {
      return
    }

    try {
      const res = await fetch(`/api/fanart/${postId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (res.ok) {
        alert('게시물이 삭제되었습니다.')
        fetchFanarts() // 목록 새로고침
      } else {
        const data = await res.json()
        alert(data.error || '게시물 삭제에 실패했습니다.')
      }
    } catch (error) {
      console.error('Failed to delete post:', error)
      alert('게시물 삭제 중 오류가 발생했습니다.')
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
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => router.push('/main?tab=community')}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Fan Art</h1>
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
                        {/* 삭제 버튼 (관리자 전용) */}
                        {user?.is_admin && (
                          <button
                            onClick={(e) => handleDelete(post.id, e)}
                            className="absolute top-2 left-2 z-10 p-2 rounded-full bg-red-500/80 text-white hover:bg-red-600 shadow-md transition-all"
                            title="게시물 삭제 (관리자)"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                        <Image
                          src={post.image_url}
                          alt={post.title}
                          fill
                          className="object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent p-3 flex flex-col justify-end">
                          <p className="text-white text-sm font-semibold truncate">{post.title}</p>
                          <AuthorName
                            userId={post.author_id}
                            name={post.author_name}
                            className="text-xs text-white/90"
                          />
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
            {regularPosts.length > 0 ? (
              viewMode === 'grid' ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {regularPosts.map(post => (
                    <Link key={post.id} href={`/community/fanart/${post.id}`}>
                      <div className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer">
                        {/* 삭제 버튼 (관리자 전용) */}
                        {user?.is_admin && (
                          <button
                            onClick={(e) => handleDelete(post.id, e)}
                            className="absolute top-2 left-2 z-10 p-2 rounded-full bg-red-500/80 text-white hover:bg-red-600 shadow-md transition-all"
                            title="게시물 삭제 (관리자)"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                        <Image
                          src={post.image_url}
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
                      <div className="relative flex gap-4 p-3 border border-gray-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer">
                        {/* 삭제 버튼 (관리자 전용) */}
                        {user?.is_admin && (
                          <button
                            onClick={(e) => handleDelete(post.id, e)}
                            className="absolute top-2 left-2 z-10 p-1.5 rounded-full bg-red-500/80 text-white hover:bg-red-600 shadow-md transition-all"
                            title="게시물 삭제 (관리자)"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <div className="relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                          <Image
                            src={post.image_url}
                            alt={post.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 truncate">{post.title}</h3>
                          <AuthorName
                            userId={post.author_id}
                            name={post.author_name}
                            className="text-sm text-gray-500 mt-1"
                          />
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
              )
            ) : (
              <div className="text-center py-16">
                <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 bg-gray-100">
                  <span className="text-4xl">🎨</span>
                </div>
                <h3 className="text-xl font-semibold mb-2 text-gray-700">
                  No hay fan art aún
                </h3>
                <p className="text-sm mb-6 text-gray-500">
                  ¡Sube el primer fan art!
                </p>
                {user && (
                  <Button
                    onClick={() => setShowUploadModal(true)}
                    className="px-6"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Subir
                  </Button>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Upload Button */}
      {user && (
        <Button
          size="lg"
          className="fixed bottom-8 right-8 rounded-full shadow-2xl h-16 w-16 p-0 bg-gradient-to-br from-purple-500 via-pink-500 to-purple-600 hover:from-purple-600 hover:via-pink-600 hover:to-purple-700 text-white z-50 transition-all duration-300 hover:scale-110"
          onClick={() => setShowUploadModal(true)}
        >
          <Plus className="w-10 h-10 drop-shadow-lg stroke-[3]" />
        </Button>
      )}

      {/* Upload Modal */}
      <FanartUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onSuccess={() => {
          setShowUploadModal(false)
          fetchFanarts()
        }}
      />
    </div>
  )
}
