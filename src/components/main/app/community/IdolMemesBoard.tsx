'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { Moon, Sun, Plus, TrendingUp, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import IdolMemesPost from './IdolMemesPost'
import IdolMemesUploadModal from './IdolMemesUploadModal'

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
  const { user } = useAuth()
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
          <div>
            <h1 className="text-2xl font-bold">Tablero de Memes de Ídolos</h1>
            <p className={`text-sm mt-1 ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Los memes más graciosos de tus ídolos favoritos
            </p>
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
              인기
            </Button>
            <Button
              variant={sortBy === 'recent' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortBy('recent')}
            >
              <Clock className="w-4 h-4 mr-1" />
              최신
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
                  <h2 className="font-semibold text-sm">📌 필독</h2>
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
                  아직 게시물이 없습니다
                </h3>
                <p className={`text-sm mb-6 ${
                  isDark ? 'text-gray-500' : 'text-gray-500'
                }`}>
                  첫 번째 밈을 올려보세요!
                </p>
                {user && (
                  <Button
                    onClick={() => setShowUploadModal(true)}
                    className="px-6"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    올리기
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
          className="fixed bottom-8 right-8 rounded-full shadow-lg h-14 w-14 p-0"
          onClick={() => setShowUploadModal(true)}
        >
          <Plus className="w-6 h-6" />
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
