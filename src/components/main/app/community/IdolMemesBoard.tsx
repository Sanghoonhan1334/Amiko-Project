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

// Mock data for testing
const mockPosts: Post[] = [
  {
    id: '1',
    title: '진이 너무 웃긴 순간 🤣',
    content: '진의 표정이 너무 웃겨서 리액션 짤로 만들었어요',
    media_url: '/misc/1.png',
    media_type: 'image',
    thumbnail_url: '',
    author_name: 'KpopLover123',
    views: 1523,
    likes_count: 89,
    comments_count: 12,
    category: 'BTS',
    tags: ['BTS', '진', '웃김'],
    is_pinned: false,
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    is_liked: false,
  },
  {
    id: '2',
    title: '🎵 NewJeans의 귀여운 리액션',
    content: '뉴진스 멤버들의 귀여운 리액션 모음입니다!',
    media_url: '/misc/2.png',
    media_type: 'image',
    thumbnail_url: '',
    author_name: 'FanGirl99',
    views: 3421,
    likes_count: 234,
    comments_count: 45,
    category: 'NewJeans',
    tags: ['NewJeans', '귀여움'],
    is_pinned: true,
    created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    is_liked: true,
  },
  {
    id: '3',
    title: 'BLACKPINK 지수가 말하는 순간 😂',
    content: '지수의 어록 모음입니다. 웃긴 부분만 추렸어요!',
    media_url: '/covers/jisoo.png',
    media_type: 'image',
    thumbnail_url: '',
    author_name: 'BLink2024',
    views: 5678,
    likes_count: 445,
    comments_count: 78,
    category: 'BLACKPINK',
    tags: ['BLACKPINK', '지수'],
    is_pinned: false,
    created_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    is_liked: false,
  },
  {
    id: '4',
    title: '필독: 게시판 사용 가이드',
    content: '밈을 올릴 때 주의사항을 확인해주세요!',
    media_url: '',
    media_type: undefined,
    thumbnail_url: '',
    author_name: '관리자',
    views: 890,
    likes_count: 45,
    comments_count: 8,
    category: undefined,
    tags: undefined,
    is_pinned: true,
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    is_liked: false,
  },
  {
    id: '5',
    title: '워너원의 추억 📸',
    content: '옛날 그룹들의 명장면 모음!',
    media_url: '/misc/3.png',
    media_type: 'image',
    thumbnail_url: '',
    author_name: 'OldSchoolKP',
    views: 2345,
    likes_count: 156,
    comments_count: 34,
    category: 'Wanna One',
    tags: ['워너원'],
    is_pinned: false,
    created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    is_liked: false,
  },
  {
    id: '6',
    title: '아이즈원 꿈 💜',
    content: '아이즈원 멤버들의 예쁜 순간들',
    media_url: '/misc/1.png',
    media_type: 'image',
    thumbnail_url: '',
    author_name: 'IZoneFan',
    views: 1234,
    likes_count: 67,
    comments_count: 23,
    category: 'IZ*ONE',
    tags: ['아이즈원'],
    is_pinned: false,
    created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    is_liked: true,
  },
  {
    id: '7',
    title: '레드벨벳 아버지의 코미디 🤪',
    content: '아이린과 슬기의 재치있는 순간들',
    media_url: '/misc/2.png',
    media_type: 'image',
    thumbnail_url: '',
    author_name: 'RVStan99',
    views: 2890,
    likes_count: 189,
    comments_count: 32,
    category: 'Red Velvet',
    tags: ['레드벨벳'],
    is_pinned: false,
    created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    is_liked: false,
  },
  {
    id: '8',
    title: '트와이스 트릭 😄',
    content: '츄가 너무 웃긴 리액션',
    media_url: '/misc/3.png',
    media_type: 'image',
    thumbnail_url: '',
    author_name: 'TWICEfan',
    views: 4456,
    likes_count: 312,
    comments_count: 56,
    category: 'TWICE',
    tags: ['트와이스'],
    is_pinned: false,
    created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    is_liked: true,
  },
  {
    id: '9',
    title: 'STRAY KIDS의 헐리우드 🎬',
    content: '한의 리액션이 너무 웃겨요!',
    media_url: '/misc/1.png',
    media_type: 'image',
    thumbnail_url: '',
    author_name: 'STAY_Life',
    views: 6789,
    likes_count: 521,
    comments_count: 89,
    category: 'Stray Kids',
    tags: ['스트레이키즈'],
    is_pinned: false,
    created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    is_liked: false,
  },
  {
    id: '10',
    title: 'ITZY 예나의 모먼트 💫',
    content: '예나의 귀여운 순간 모음',
    media_url: '/misc/2.png',
    media_type: 'image',
    thumbnail_url: '',
    author_name: 'MIDZY4ever',
    views: 3245,
    likes_count: 234,
    comments_count: 42,
    category: 'ITZY',
    tags: ['ITZY'],
    is_pinned: false,
    created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    is_liked: true,
  },
  {
    id: '11',
    title: '세븐틴 버논의 개그 🔥',
    content: '버논이 너무 웃긴 순간!',
    media_url: '/misc/3.png',
    media_type: 'image',
    thumbnail_url: '',
    author_name: 'CARAT_Love',
    views: 5123,
    likes_count: 378,
    comments_count: 67,
    category: 'SEVENTEEN',
    tags: ['세븐틴'],
    is_pinned: false,
    created_at: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString(),
    is_liked: false,
  },
]

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
      // API에서 데이터가 없으면 mockPosts 사용
      const finalData = Array.isArray(data) && data.length > 0 ? data : mockPosts
      setPosts(finalData)
    } catch (error) {
      console.error('Failed to fetch posts:', error)
      // 에러 시 mockPosts 사용
      setPosts(mockPosts)
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
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {regularPosts.map(post => (
                <IdolMemesPost key={post.id} post={post} theme={theme} />
              ))}
            </div>
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
