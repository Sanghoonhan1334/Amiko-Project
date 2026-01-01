'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import { useRouter } from 'next/navigation'
import { Users, MessageSquare, ArrowLeft, Star, Search, Trash2, Plus, X } from 'lucide-react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import Link from 'next/link'

interface ChatRoom {
  id: string
  name: string
  type: 'country' | 'fanclub'
  country?: string
  fanclub_name?: string
  description?: string
  participant_count: number
  max_participants: number
  thumbnail_url?: string
  created_at: string
}

export default function KChatBoard() {
  const { user, token } = useAuth()
  const { t } = useLanguage()
  const router = useRouter()
  const [rooms, setRooms] = useState<ChatRoom[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [favoriteRooms, setFavoriteRooms] = useState<Set<string>>(new Set())

  // 즐겨찾기 로드
  useEffect(() => {
    const savedFavorites = localStorage.getItem('kchat_favorites')
    if (savedFavorites) {
      setFavoriteRooms(new Set(JSON.parse(savedFavorites)))
    }
  }, [])

  useEffect(() => {
    fetchRooms()
  }, [])

  // 관리자 권한 확인 (디버그용)
  useEffect(() => {
    console.log('🔍 [KChatBoard] useEffect 실행됨', {
      user가_존재하나: !!user,
      user_객체: user
    })
    
    if (user) {
      console.log('🔍 [KChatBoard] 사용자 정보:', {
        id: user.id,
        email: user.email,
        is_admin: user.is_admin,
        is_admin_타입: typeof user.is_admin,
        전체_user_객체: user
      })
    } else {
      console.log('🔍 [KChatBoard] ⚠️ user 객체가 없습니다!')
    }
  }, [user])

  const fetchRooms = async () => {
    try {
      setLoading(true)
      // fanclub 타입만 가져오기 (아미코 전체 채팅은 플로팅 버튼으로 접근)
      const response = await fetch('/api/chat/rooms?type=fanclub')
      
      if (!response.ok) {
        console.error('Failed to fetch chat rooms:', response.status, response.statusText)
        setRooms([])
        return
      }
      
      const data = await response.json()
      
      if (data.success) {
        setRooms(data.rooms || [])
      }
    } catch (error) {
      console.error('Failed to fetch chat rooms:', error)
      setRooms([])
    } finally {
      setLoading(false)
    }
  }


  const getTimeAgo = (dateString: string) => {
    const now = new Date()
    const date = new Date(dateString)
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffInDays === 0) return 'Hoy'
    if (diffInDays === 1) return 'Ayer'
    if (diffInDays < 7) return `Hace ${diffInDays} días`
    if (diffInDays < 30) return `Hace ${Math.floor(diffInDays / 7)} semanas`
    return `Hace ${Math.floor(diffInDays / 30)} meses`
  }

  // 즐겨찾기 토글
  const toggleFavorite = (roomId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    const newFavorites = new Set(favoriteRooms)
    if (newFavorites.has(roomId)) {
      newFavorites.delete(roomId)
    } else {
      newFavorites.add(roomId)
    }
    
    setFavoriteRooms(newFavorites)
    localStorage.setItem('kchat_favorites', JSON.stringify(Array.from(newFavorites)))
  }

  // 채팅방 삭제 (관리자 전용)
  const deleteRoom = async (roomId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!user?.is_admin) {
      alert('관리자만 채팅방을 삭제할 수 있습니다.')
      return
    }

    if (!confirm('정말 이 채팅방을 삭제하시겠습니까?')) {
      return
    }

    try {
      const response = await fetch(`/api/chat/rooms?roomId=${roomId}&userId=${user.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()

      if (data.success) {
        alert('채팅방이 삭제되었습니다.')
        fetchRooms() // 목록 새로고침
      } else {
        alert(data.error || '채팅방 삭제에 실패했습니다.')
      }
    } catch (error) {
      console.error('채팅방 삭제 오류:', error)
      alert('채팅방 삭제 중 오류가 발생했습니다.')
    }
  }

  // 검색어로 필터링
  const filteredRooms = rooms.filter(room => {
    if (!searchQuery.trim()) return true
    const query = searchQuery.toLowerCase()
    return room.name.toLowerCase().includes(query) || 
           room.description?.toLowerCase().includes(query) ||
           room.country?.toLowerCase().includes(query) ||
           room.fanclub_name?.toLowerCase().includes(query)
  })

  // 즐겨찾기 순으로 정렬
  const sortedRooms = [...filteredRooms].sort((a, b) => {
    const aIsFavorite = favoriteRooms.has(a.id)
    const bIsFavorite = favoriteRooms.has(b.id)
    
    if (aIsFavorite && !bIsFavorite) return -1
    if (!aIsFavorite && bIsFavorite) return 1
    return 0
  })

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* 뒤로가기 버튼 */}
              <button
                onClick={() => router.push('/main?tab=community')}
                className="flex items-center gap-2 px-3 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg transition-colors"
                title="Atrás"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="hidden sm:inline">Comunidad</span>
              </button>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold">{t('community.chatRoomTitle')}</h1>
                <p className="text-xs sm:text-sm mt-1 text-gray-600">
                  {t('community.chatRoomSubtitle')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="relative">
          <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            placeholder="Buscar salas de chat..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 sm:pl-12 pr-10 py-2 w-full border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="border rounded-lg p-4 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : rooms.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 mb-4">{t('community.chatRoomNoRooms') || 'Aún no hay salas de chat'}</p>
            {user && (
              <Button onClick={() => router.push('/community/k-chat/create')}>
                {t('community.chatRoomCreateFirst') || 'Crear la primera sala'}
              </Button>
            )}
            {!user && (
              <Link href="/sign-in">
                <Button>{t('community.chatRoomLoginToCreate') || 'Iniciar sesión para crear una sala'}</Button>
              </Link>
            )}
          </div>
        ) : (
          <>
            {/* 채팅방 생성 페이지로 이동하는 버튼 */}
            {user && (
              <div className="mb-4 flex justify-end">
                <Button 
                  onClick={() => router.push('/community/k-chat/create')}
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  {t('community.chatRoomCreate') || '채팅방 만들기'}
                </Button>
              </div>
            )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedRooms.map(room => {
              const isFavorite = favoriteRooms.has(room.id)
              return (
                <Link key={room.id} href={`/community/k-chat/${room.id}`}>
                  <div className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer relative">
                    {/* 즐겨찾기 버튼 */}
                    <button
                      onClick={(e) => toggleFavorite(room.id, e)}
                      className={`absolute top-2 right-2 z-10 p-2 rounded-full transition-all ${
                        isFavorite 
                          ? 'bg-yellow-400 text-yellow-900 shadow-md' 
                          : 'bg-white/80 text-gray-400 hover:bg-white hover:text-yellow-500'
                      }`}
                      title={isFavorite ? 'Eliminar de favoritos' : 'Agregar a favoritos'}
                    >
                      <Star className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
                    </button>

                    {/* 삭제 버튼 (관리자 전용) */}
                    {user?.is_admin && (
                      <button
                        onClick={(e) => deleteRoom(room.id, e)}
                        className="absolute top-2 left-2 z-10 p-2 rounded-full bg-red-500/80 text-white hover:bg-red-600 shadow-md transition-all"
                        title="채팅방 삭제 (관리자)"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}

                    {/* Thumbnail */}
                    {room.thumbnail_url ? (
                      <div className="relative w-full h-48">
                        <Image
                          src={room.thumbnail_url}
                          alt={room.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-full h-48 bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                        <MessageSquare className="w-16 h-16 text-gray-400" />
                      </div>
                    )}
                    
                    {/* Content */}
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-base sm:text-lg">{room.name}</h3>
                        <div className="flex items-center gap-1 text-xs sm:text-sm text-gray-600">
                          <Users className="w-4 h-4" />
                          <span>{room.participant_count}/{room.max_participants}</span>
                        </div>
                      </div>
                      {room.description && (
                        <p className="text-xs sm:text-sm text-gray-600 mb-3 line-clamp-2">
                          {room.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{getTimeAgo(room.created_at)}</span>
                        <span>{room.type}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
          </>
        )}
      </div>

    </div>
  )
}
