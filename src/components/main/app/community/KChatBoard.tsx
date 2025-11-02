'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { Plus, Users, MessageSquare, Globe, Heart, Image as ImageIcon, X, ArrowLeft, Star, Search, Trash2 } from 'lucide-react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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

type TabType = 'country' | 'fanclub'

export default function KChatBoard() {
  const { user, token } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabType>('country')
  const [rooms, setRooms] = useState<ChatRoom[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null)
  const [favoriteRooms, setFavoriteRooms] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')

  // 즐겨찾기 로드
  useEffect(() => {
    const savedFavorites = localStorage.getItem('kchat_favorites')
    if (savedFavorites) {
      setFavoriteRooms(new Set(JSON.parse(savedFavorites)))
    }
  }, [])

  useEffect(() => {
    fetchRooms()
  }, [activeTab])

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
      const response = await fetch(`/api/chat/rooms?type=${activeTab}`)
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

  const handleThumbnailSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB')
      return
    }

    setThumbnailFile(file)
    const reader = new FileReader()
    reader.onloadend = () => {
      setThumbnailPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const uploadThumbnail = async (file: File): Promise<string | null> => {
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload/image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      const data = await response.json()
      return data.url || null
    } catch (error) {
      console.error('Failed to upload thumbnail:', error)
      return null
    }
  }

  const handleCreateRoom = async (formData: FormData) => {
    try {
      const name = formData.get('name') as string
      const description = formData.get('description') as string
      const country = formData.get('country') as string

      let thumbnailUrl: string | null = null
      if (thumbnailFile) {
        thumbnailUrl = await uploadThumbnail(thumbnailFile)
      }

      const roomData: any = {
        name,
        description,
        type: activeTab,
        created_by: user?.id
      }

      if (activeTab === 'country' && country) {
        roomData.country = country
      }

      if (thumbnailUrl) {
        roomData.thumbnail_url = thumbnailUrl
      }

      const response = await fetch('/api/chat/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(roomData)
      })

      const data = await response.json()
      
      if (!response.ok) {
        console.error('API Error Response:', data)
        // 스페인어 에러 메시지
        if (response.status === 403) {
          alert('Solo los administradores pueden crear salas de chat por país.')
        } else {
          alert(`Error: ${data.error || 'Error al crear la sala de chat'}`)
        }
        return
      }
      
      if (data.success) {
        setShowCreateModal(false)
        setThumbnailFile(null)
        setThumbnailPreview(null)
        fetchRooms()
      }
    } catch (error) {
      console.error('Failed to create room:', error)
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
                <h1 className="text-xl sm:text-2xl font-bold">K-Chat Zone</h1>
                <p className="text-xs sm:text-sm mt-1 text-gray-600">
                  Únete a chats por país o fanclub para discutir K-cultura
                </p>
              </div>
            </div>
            {user && (activeTab === 'fanclub' || (activeTab === 'country' && user.is_admin)) && (
              <Button
                onClick={() => setShowCreateModal(true)}
                className="hidden sm:flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Crear Sala
              </Button>
            )}
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-2 mt-4">
            <Button
              variant={activeTab === 'country' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('country')}
              className={`flex items-center gap-2 transition-all ${
                activeTab === 'country' 
                  ? 'bg-blue-500 text-white hover:bg-blue-600 scale-105 shadow-md' 
                  : 'hover:bg-gray-100 active:scale-95'
              }`}
            >
              <Globe className="w-4 h-4" />
              Chat por País
            </Button>
            <Button
              variant={activeTab === 'fanclub' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('fanclub')}
              className={`flex items-center gap-2 transition-all ${
                activeTab === 'fanclub' 
                  ? 'bg-blue-500 text-white hover:bg-blue-600 scale-105 shadow-md' 
                  : 'hover:bg-gray-100 active:scale-95'
              }`}
            >
              <Heart className="w-4 h-4" />
              FanChat · Libre
            </Button>
          </div>
          {/* Tab helper description */}
          <div className="mt-2 text-xs sm:text-sm text-gray-600">
            {activeTab === 'country' ? (
              <span>Salas oficiales por país. Solo administradores crean las salas.</span>
            ) : (
              <span>Crea o únete a chats libres con quien quieras. Es un espacio abierto para conversar.</span>
            )}
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            placeholder="Buscar salas de chat..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-14 pr-4 py-2 w-full border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            <p className="text-gray-600 mb-4">Aún no hay salas de chat</p>
            {user && (activeTab === 'fanclub' || (activeTab === 'country' && user.is_admin)) && (
              <Button onClick={() => setShowCreateModal(true)}>
                Crear la primera sala
              </Button>
            )}
            {!user && (
              <Link href="/sign-in">
                <Button>Iniciar sesión para crear una sala</Button>
              </Link>
            )}
          </div>
        ) : (
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
        )}
      </div>

      {/* Create Room Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">Crear Sala de Chat</h2>
            <form action={handleCreateRoom}>
              <div className="space-y-4">
                {/* Thumbnail Upload */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-2">Miniatura de la Sala</label>
                  {thumbnailPreview ? (
                    <div className="relative w-full h-40 sm:h-48 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden">
                      <Image
                        src={thumbnailPreview}
                        alt="Thumbnail preview"
                        fill
                        className="object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setThumbnailFile(null)
                          setThumbnailPreview(null)
                        }}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-40 sm:h-48 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-purple-500 transition-colors">
                      <ImageIcon className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mb-2" />
                      <p className="text-xs sm:text-sm text-gray-600">Haz clic o arrastra para subir</p>
                      <p className="text-xs text-gray-500 mt-1">PNG, JPG hasta 5MB</p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleThumbnailSelect}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-1">Nombre de la Sala</label>
                  <input
                    name="name"
                    type="text"
                    required
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                    placeholder={activeTab === 'country' ? 'Ingresa el nombre de la sala' : 'Ej: Sala para Mark ~'}
                  />
                </div>
                {activeTab === 'country' && (
                  <div>
                    <label className="block text-xs sm:text-sm font-medium mb-1">País</label>
                    <input
                      name="country"
                      type="text"
                      required
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                      placeholder="Ingresa el país"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-1">Descripción</label>
                  <textarea
                    name="description"
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                    rows={3}
                    placeholder="Describe tu sala de chat"
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-4 sm:mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCreateModal(false)
                    setThumbnailFile(null)
                    setThumbnailPreview(null)
                  }}
                  className="flex-1 text-sm"
                >
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1 text-sm bg-purple-500 text-white hover:bg-purple-600 border border-purple-500">
                  Crear
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Action Button (mobile only) */}
      {user && (activeTab === 'fanclub' || (activeTab === 'country' && user.is_admin)) && (
        <button
          aria-label="Crear Sala"
          onClick={() => setShowCreateModal(true)}
          className="sm:hidden fixed bottom-6 right-4 z-50 rounded-full bg-blue-600 text-white shadow-lg w-12 h-12 flex items-center justify-center active:scale-95"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}
    </div>
  )
}
