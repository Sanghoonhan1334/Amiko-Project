'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { Plus, TrendingUp, Clock, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import IdolMemesPost from './IdolMemesPost'
import IdolMemesUploadModal from './IdolMemesUploadModal'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'

interface Post {
  id: string
  title: string
  content?: string
  media_url?: string
  media_type?: 'image' | 'video'
  thumbnail_url?: string
  author_name?: string
  author_id?: string | null
  views: number
  likes_count: number
  comments_count: number
  category?: string
  tags?: string[]
  is_pinned?: boolean
  created_at: string
  is_liked?: boolean
}

type SortType = 'popular' | 'recent'

export default function IdolMemesBoard() {
  const { user, token } = useAuth()
  const router = useRouter()
  const { theme: globalTheme } = useTheme()
  // 전역 다크 모드와 동기화
  const theme = globalTheme === 'dark' ? 'night' : 'day'
  const [sortBy, setSortBy] = useState<SortType>('popular')
  const [category, setCategory] = useState<string>('all')
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [showUploadModal, setShowUploadModal] = useState(false)

  useEffect(() => {
    fetchPosts()
  }, [sortBy, category, token])

  const fetchPosts = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        sort: sortBy,
        category: category,
      })
      
      const headers: HeadersInit = {}
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
      
      const res = await fetch(`/api/idol-photos?${params}`, {
        headers
      })
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

  return (
    <div className="min-h-screen transition-colors duration-300 bg-background text-foreground">
      {/* Header */}
      <div className="border-b border-border bg-card/95 backdrop-blur-sm pt-16 md:pt-32">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3 mb-3">
            <button
              onClick={() => router.push('/main?tab=community')}
              className="p-2 rounded-lg transition-colors hover:bg-muted"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg md:text-2xl font-bold text-foreground">Fotos de Ídolos</h1>
              <p className="text-xs md:text-sm mt-1 text-muted-foreground">
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
      <div className="max-w-6xl mx-auto px-4 py-6 pt-4 md:pt-16">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="aspect-square rounded-lg bg-muted animate-pulse"
              />
            ))}
          </div>
        ) : (
          <>
            {/* Pinned Posts */}
            {pinnedPosts.length > 0 && (
              <div className="mb-6">
                <div className="px-4 py-2 mb-3 rounded-lg bg-primary/10 border border-primary/20">
                  <h2 className="font-semibold text-sm text-foreground">📌 Importante</h2>
                </div>
                <div className="space-y-4">
                  {pinnedPosts.map(post => (
                    <IdolMemesPost key={post.id} post={post} theme={theme} onDelete={fetchPosts} listView={true} />
                  ))}
                </div>
              </div>
            )}

            {/* Regular Posts */}
            {regularPosts.length > 0 ? (
              <div className="space-y-4">
                {regularPosts.map(post => (
                  <IdolMemesPost key={post.id} post={post} theme={theme} onDelete={fetchPosts} listView={true} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 bg-muted">
                  <span className="text-4xl">📸</span>
                </div>
                <h3 className="text-xl font-semibold mb-2 text-foreground">
                  No hay publicaciones aún
                </h3>
                <p className="text-sm mb-6 text-muted-foreground">
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

      {/* Upload Button - Mobile Only, 다크 모드 토글 위에 배치 */}
      {user && (
        <Button
          size="lg"
          className="fixed bottom-64 right-2 z-50 md:hidden w-11 h-11 sm:h-14 sm:w-14 rounded-full shadow-2xl bg-[#7BC4C4] hover:bg-[#5BA8A8] text-white transition-all duration-200 hover:scale-105 active:scale-95 sm:bottom-52 sm:right-8"
          onClick={() => setShowUploadModal(true)}
        >
          <Plus className="w-5 h-5 sm:w-6 sm:h-6 drop-shadow-sm stroke-[3]" />
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
