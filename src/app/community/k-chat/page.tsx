'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/context/LanguageContext'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Plus, X, Upload, Image as ImageIcon, MessageSquare, Users, Star, Search, Trash2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import Image from 'next/image'
import Link from 'next/link'

interface ChatRoom {
  id: string
  name: string
  type: 'country' | 'fanclub'
  description?: string
  participant_count: number
  max_participants: number
  thumbnail_url?: string
  created_at: string
  created_by?: string
}

export default function KChatPage() {
  const router = useRouter()
  const { t } = useLanguage()
  const { user, token } = useAuth()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    fanclub_name: ''
  })
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
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

  const fetchRooms = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/chat/rooms?type=fanclub')
      const data = await response.json()
      
      if (data.success) {
        // 아미코 전체 채팅방 제외 (플로팅 버튼으로 접근)
        const filteredRooms = (data.rooms || []).filter((room: ChatRoom) => {
          const name = room.name?.toLowerCase() || ''
          const description = room.description?.toLowerCase() || ''
          const isAmikoRoom = 
            name.includes('amiko') || 
            name.includes('아미코') ||
            name.includes('equipo') ||
            name.includes('administradores') ||
            description.includes('amiko') ||
            description.includes('아미코') ||
            description.includes('administradores coreanos')
          return !isAmikoRoom && room.type === 'fanclub'
        })
        setRooms(filteredRooms)
      }
    } catch (error) {
      console.error('Failed to fetch chat rooms:', error)
      setRooms([])
    } finally {
      setLoading(false)
    }
  }

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

  const deleteRoom = async (roomId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!user || !token) {
      alert(t('community.chatRoomLoginRequired') || '로그인이 필요합니다.')
      return
    }

    if (!confirm(t('community.chatRoomDeleteConfirm') || '정말 이 채팅방을 삭제하시겠습니까?')) {
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
        alert(t('community.chatRoomDeleted') || '채팅방이 삭제되었습니다.')
        fetchRooms()
      } else {
        alert(data.error || t('community.chatRoomDeleteFailed') || '채팅방 삭제에 실패했습니다.')
      }
    } catch (error) {
      console.error('채팅방 삭제 오류:', error)
      alert(t('community.chatRoomDeleteError') || '채팅방 삭제 중 오류가 발생했습니다.')
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
    if (diffInDays < 365) return `Hace ${Math.floor(diffInDays / 30)} meses`
    return `Hace ${Math.floor(diffInDays / 365)} años`
  }

  const filteredRooms = rooms.filter(room => {
    if (!searchQuery.trim()) return true
    const query = searchQuery.toLowerCase()
    return room.name.toLowerCase().includes(query) || 
           room.description?.toLowerCase().includes(query)
  })

  const sortedRooms = [...filteredRooms].sort((a, b) => {
    const aIsFavorite = favoriteRooms.has(a.id)
    const bIsFavorite = favoriteRooms.has(b.id)
    
    if (aIsFavorite && !bIsFavorite) return -1
    if (!aIsFavorite && bIsFavorite) return 1
    return 0
  })

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert(t('community.chatRoomImageOnly') || '이미지 파일만 업로드 가능합니다.')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alert(t('community.chatRoomImageSize') || '파일 크기는 5MB를 초과할 수 없습니다.')
      return
    }

    setSelectedImage(file)

    const reader = new FileReader()
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveImage = () => {
    setSelectedImage(null)
    setImagePreview(null)
  }

  const handleCreateRoom = async () => {
    if (!user || !token) {
      alert(t('community.chatRoomLoginRequired') || '로그인이 필요합니다.')
      return
    }

    if (!formData.name.trim()) {
      alert(t('community.chatRoomNameRequired') || '채팅방 이름을 입력해주세요.')
      return
    }

    try {
      setCreating(true)
      
      let thumbnailUrl = null
      if (selectedImage) {
        setUploadingImage(true)
        try {
          const formData = new FormData()
          formData.append('file', selectedImage)
          formData.append('folder', 'chat-rooms')

          const uploadResponse = await fetch('/api/upload/image', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`
            },
            body: formData
          })

          if (!uploadResponse.ok) {
            const errorData = await uploadResponse.json()
            throw new Error(errorData.error || '이미지 업로드에 실패했습니다.')
          }

          const uploadData = await uploadResponse.json()
          thumbnailUrl = uploadData.url
        } catch (error) {
          console.error('이미지 업로드 오류:', error)
          alert(error instanceof Error ? error.message : '이미지 업로드에 실패했습니다.')
          setUploadingImage(false)
          setCreating(false)
          return
        } finally {
          setUploadingImage(false)
        }
      }

      const response = await fetch('/api/chat/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          type: 'fanclub',
          fanclub_name: formData.fanclub_name.trim() || formData.name.trim(),
          description: formData.description.trim() || '',
          created_by: user.id,
          thumbnail_url: thumbnailUrl
        })
      })

      const data = await response.json()

      if (data.success) {
        alert(t('community.chatRoomCreated') || '채팅방이 생성되었습니다!')
        setShowCreateModal(false)
        setFormData({ name: '', description: '', fanclub_name: '' })
        setSelectedImage(null)
        setImagePreview(null)
        // 채팅방 목록 새로고침
        fetchRooms()
        // 생성된 채팅방으로 이동
        router.push(`/community/k-chat/${data.room.id}`)
      } else {
        alert(data.error || t('community.chatRoomCreateFailed') || '채팅방 생성에 실패했습니다.')
      }
    } catch (error) {
      console.error('채팅방 생성 오류:', error)
      alert(t('community.chatRoomCreateError') || '채팅방 생성 중 오류가 발생했습니다.')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* 뒤로가기 버튼 */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push('/main?tab=community')}
                className="hover:bg-gray-100"
                title="뒤로가기"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-base sm:text-xl md:text-2xl font-bold">
                  <span className="sm:hidden">{t('community.chatRoomTitleMobile') || 'Salas Libres'}</span>
                  <span className="hidden sm:inline">{t('community.chatRoomTitle') || 'Sala de Chat Libre'}</span>
                </h1>
              </div>
            </div>
            {/* Sala de Chat Libre 버튼 */}
            <Button 
              onClick={() => setShowCreateModal(true)}
              variant="outline"
              className="flex items-center gap-1 sm:gap-2 bg-pink-50 hover:bg-pink-100 border-pink-200 text-pink-700 text-xs sm:text-sm"
            >
              <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="font-medium hidden sm:inline">{t('community.chatRoomCreate') || 'Sala de Chat Libre'}</span>
              <span className="font-medium sm:hidden">Sala</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="relative">
          <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            placeholder={t('community.searchChatRooms') || '채팅방 검색...'}
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
            <p className="text-gray-600 mb-4">{t('community.chatRoomCreateDescription') || '새로운 채팅방을 만들어보세요!'}</p>
            {user && (
              <Button onClick={() => setShowCreateModal(true)}>
                {t('community.chatRoomCreateFirst') || '첫 번째 채팅방 만들기'}
              </Button>
            )}
            {!user && (
              <Link href="/sign-in">
                <Button>{t('community.chatRoomLoginToCreate') || '로그인하여 채팅방 만들기'}</Button>
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
                    >
                      <Star className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
                    </button>

                    {/* 삭제 버튼 (본인이 만든 채팅방인 경우만) */}
                    {user && room.created_by === user.id && (
                      <button
                        onClick={(e) => deleteRoom(room.id, e)}
                        className="absolute top-2 left-2 z-10 p-2 rounded-full bg-red-500/80 text-white hover:bg-red-600 shadow-md transition-all"
                        title={t('community.chatRoomDelete') || '채팅방 삭제'}
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
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* 채팅방 생성 모달 */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">{t('community.chatRoomCreate') || '채팅방 만들기'}</h2>
              <button
                onClick={() => {
                  setShowCreateModal(false)
                  setFormData({ name: '', description: '', fanclub_name: '' })
                  setSelectedImage(null)
                  setImagePreview(null)
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t('community.chatRoomName') || '채팅방 이름'} *
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={t('community.chatRoomNamePlaceholder') || '예: K-POP 토론방'}
                  maxLength={50}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t('community.chatRoomDescription') || '설명'}
                </label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder={t('community.chatRoomDescriptionPlaceholder') || '채팅방에 대한 간단한 설명을 입력하세요'}
                  rows={3}
                  maxLength={200}
                />
              </div>

              {/* 이미지 업로드 */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t('community.chatRoomThumbnail') || '채팅방 이미지'}
                </label>
                {imagePreview ? (
                  <div className="relative">
                    <div className="relative w-full h-48 rounded-lg overflow-hidden border border-gray-300">
                      <Image
                        src={imagePreview}
                        alt="Preview"
                        fill
                        className="object-cover"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 mb-2 text-gray-400" />
                      <p className="mb-2 text-sm text-gray-500">
                        <span className="font-semibold">{t('community.chatRoomClickToUpload') || '클릭하여 이미지 업로드'}</span>
                      </p>
                      <p className="text-xs text-gray-500">{t('community.chatRoomImageFormat') || 'PNG, JPG, GIF (최대 5MB)'}</p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageSelect}
                      disabled={uploadingImage}
                    />
                  </label>
                )}
              </div>
            </div>
            
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateModal(false)
                  setFormData({ name: '', description: '', fanclub_name: '' })
                  setSelectedImage(null)
                  setImagePreview(null)
                }}
                disabled={creating || uploadingImage}
              >
                {t('community.chatRoomCancel') || '취소'}
              </Button>
              <Button
                onClick={handleCreateRoom}
                disabled={creating || uploadingImage || !formData.name.trim()}
              >
                {uploadingImage 
                  ? (t('community.chatRoomUploading') || '업로드 중...') 
                  : creating 
                    ? (t('community.chatRoomCreating') || '생성 중...') 
                    : (t('community.chatRoomCreate') || '만들기')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
