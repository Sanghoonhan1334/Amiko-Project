'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { Moon, Sun, Plus, TrendingUp, Clock, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import IdolMemesPost from './IdolMemesPost'
import IdolMemesUploadModal from './IdolMemesUploadModal'
import { useRouter } from 'next/navigation'

interface Post {
  id: string
  title: string
  content?: string
  media_url?: string
  media_type?: 'image' | 'video'
  thumbnail_url?: string
  author_name?: string
  views: number
  likes_count: number
  comments_count: number
  category?: string
  tags?: string[]
  is_pinned?: boolean
  created_at: string
  is_liked?: boolean
}

type Theme = 'day' | 'night'
type SortType = 'popular' | 'recent'

export default function IdolMemesBoard() {
  const { user, token } = useAuth()
  const router = useRouter()
  const [theme, setTheme] = useState<Theme>('day')
  const [sortBy, setSortBy] = useState<SortType>('popular')
  const [category, setCategory] = useState<string>('all')
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [showUploadModal, setShowUploadModal] = useState(false)

  useEffect(() => {
    fetchPosts()
  }, [sortBy, category])

  const fetchPosts = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        sort: sortBy,
        category: category,
      })
      const res = await fetch(`/api/idol-memes?${params}`)
      const data = await res.json()
      // 실제 API 데이터만 사용
      setPosts(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Failed to fetch posts:', error)
      setPosts([])
    } finally {
      setLoading(false)
    }
  }

  const pinnedPosts = Array.isArray(posts) ? posts.filter(post => post.is_pinned) : []
  const regularPosts = Array.isArray(posts) ? posts.filter(post => !post.is_pinned) : []

  const isDark = theme === 'night'

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDark ? 'bg-black text-white' : 'bg-white text-gray-900'
    }`}>
      {/* Header */}
      <div className={`sticky top-0 z-50 border-b ${
        isDark ? 'border-gray-800 bg-black/95' : 'border-gray-200 bg-white/95'
      } backdrop-blur-sm`}>
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3 mb-3">
            <button
              onClick={() => router.back()}
              className={`p-2 rounded-lg transition-colors ${
                isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
              }`}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold">Fotos de Ídolos</h1>
              <p className={`text-sm mt-1 ${
                isDark ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Comparte y disfruta de las mejores fotos de tus ídolos favoritos
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 mt-4">
            <Button
              variant={sortBy === 'popular' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortBy('popular')}
              className={isDark ? '' : ''}
            >
              <TrendingUp className="w-4 h-4 mr-1" />
              Popular
            </Button>
            <Button
              variant={sortBy === 'recent' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortBy('recent')}
            >
              <Clock className="w-4 h-4 mr-1" />
              Reciente
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className={`aspect-square rounded-lg ${
                  isDark ? 'bg-gray-900 animate-pulse' : 'bg-gray-100 animate-pulse'
                }`}
              />
            ))}
          </div>
        ) : (
          <>
            {/* Pinned Posts */}
            {pinnedPosts.length > 0 && (
              <div className="mb-6">
                <div className={`px-4 py-2 mb-3 rounded-lg ${
                  isDark ? 'bg-purple-900/30' : 'bg-purple-100'
                }`}>
                  <h2 className="font-semibold text-sm">📌 Importante</h2>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {pinnedPosts.map(post => (
                    <IdolMemesPost key={post.id} post={post} theme={theme} />
                  ))}
                </div>
              </div>
            )}

            {/* Regular Posts */}
            {regularPosts.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {regularPosts.map(post => (
                  <IdolMemesPost key={post.id} post={post} theme={theme} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${
                  isDark ? 'bg-gray-800' : 'bg-gray-100'
                }`}>
                  <span className="text-4xl">📸</span>
                </div>
                <h3 className={`text-xl font-semibold mb-2 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  No hay publicaciones aún
                </h3>
                <p className={`text-sm mb-6 ${
                  isDark ? 'text-gray-500' : 'text-gray-500'
                }`}>
                  ¡Sube el primer meme!
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
          <Plus className="w-8 h-8 drop-shadow-lg" />
        </Button>
      )}

      {/* Upload Modal */}
      <IdolMemesUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onSuccess={() => {
          setShowUploadModal(false)
          fetchPosts()
        }}
        theme={theme}
      />
    </div>
  )
}
