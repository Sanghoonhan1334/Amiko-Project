'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Send, Users, Image as ImageIcon, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@supabase/supabase-js'
import Image from 'next/image'

interface Message {
  id: string
  message: string
  image_url?: string
  user_id: string
  created_at: string
  users?: {
    email?: string
    user_metadata?: {
      name?: string
    }
  }
}

interface ChatRoom {
  id: string
  name: string
  description?: string
  participant_count: number
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function ChatRoomClient({ roomId }: { roomId: string }) {
  const { user, token } = useAuth()
  const router = useRouter()
  
  // Create authenticated Supabase client with useMemo to prevent multiple instances
  const authSupabase = useMemo(() => {
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: token ? `Bearer ${token}` : '',
          },
        },
      }
    )
  }, [token])
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [room, setRoom] = useState<ChatRoom | null>(null)
  const [loading, setLoading] = useState(true)
  const [isDragging, setIsDragging] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!user) {
      router.push('/sign-in')
      return
    }

    fetchRoom()
    fetchMessages()
    joinRoom()
    subscribeToMessages()

    return () => {
      leaveRoom()
    }
  }, [roomId, user])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Prevent default browser drag behavior
  useEffect(() => {
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
    }

    const handleDrop = (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
    }

    document.addEventListener('dragover', handleDragOver)
    document.addEventListener('drop', handleDrop)

    return () => {
      document.removeEventListener('dragover', handleDragOver)
      document.removeEventListener('drop', handleDrop)
    }
  }, [])

  const fetchRoom = async () => {
    try {
      const { data, error } = await authSupabase
        .from('chat_rooms')
        .select('*')
        .eq('id', roomId)
        .single()

      if (error) throw error

      setRoom(data)
    } catch (error) {
      console.error('Error fetching room:', error)
    }
  }

  const fetchMessages = async () => {
    try {
      const { data, error } = await authSupabase
        .from('chat_messages')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true })

      if (error) throw error

      // No need to fetch user data, we'll use user_id directly
      setMessages(data || [])
    } catch (error) {
      console.error('Error fetching messages:', error)
    } finally {
      setLoading(false)
    }
  }

  const subscribeToMessages = () => {
    const channel = authSupabase
      .channel(`room-${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${roomId}`
        },
        async (payload) => {
          const newMessage = payload.new as Message
          setMessages((prev) => [...prev, newMessage])
        }
      )
      .subscribe()

    return () => {
      authSupabase.removeChannel(channel)
    }
  }

  const joinRoom = async () => {
    if (!user) return

    try {
      await authSupabase
        .from('chat_room_participants')
        .upsert({
          room_id: roomId,
          user_id: user.id,
          last_read_at: new Date().toISOString()
        })
    } catch (error) {
      console.error('Error joining room:', error)
    }
  }

  const leaveRoom = async () => {
    if (!user) return

    try {
      // Note: We don't remove the participant on unmount
      // Only when they explicitly leave
      await authSupabase
        .from('chat_room_participants')
        .update({ last_read_at: new Date().toISOString() })
        .eq('room_id', roomId)
        .eq('user_id', user.id)
    } catch (error) {
      console.error('Error leaving room:', error)
    }
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    processImageFile(file)
  }

  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB')
      return
    }

    setSelectedImage(file)
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const file = e.dataTransfer.files?.[0]
    if (!file) return

    processImageFile(file)
  }

  const removeImage = () => {
    setSelectedImage(null)
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      const fileName = `chat/${Date.now()}_${file.name}`
      const { data, error } = await authSupabase.storage
        .from('images')
        .upload(fileName, file)

      if (error) throw error

      const { data: { publicUrl } } = authSupabase.storage
        .from('images')
        .getPublicUrl(data.path)

      return publicUrl
    } catch (error) {
      console.error('Error uploading image:', error)
      return null
    }
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if ((!newMessage.trim() && !selectedImage) || !user || uploading) return

    try {
      setUploading(true)
      
      let imageUrl: string | null = null
      if (selectedImage) {
        imageUrl = await uploadImage(selectedImage)
        if (!imageUrl) {
          alert('Error al subir la imagen')
          setUploading(false)
          return
        }
      }

      const messageData: any = {
        room_id: roomId,
        user_id: user.id,
        message: newMessage.trim() || ''
      }

      if (imageUrl) {
        messageData.image_url = imageUrl
      }

      const { error } = await authSupabase
        .from('chat_messages')
        .insert(messageData)

      if (error) throw error

      setNewMessage('')
      setSelectedImage(null)
      setImagePreview(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error) {
      console.error('Error sending message:', error)
      alert('Error al enviar mensaje')
    } finally {
      setUploading(false)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const getUserName = (message: Message) => {
    // Use user_id if users data is not available
    if (message.users) {
      return (
        message.users?.user_metadata?.name ||
        message.users?.email?.split('@')[0] ||
        'Usuario'
      )
    }
    // If no user data, use user_id or default to "Usuario"
    return message.user_id ? message.user_id.substring(0, 8) : 'Usuario'
  }

  const getTimeAgo = (dateString: string) => {
    const now = new Date()
    const date = new Date(dateString)
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return 'Ahora'
    if (diffInSeconds < 3600) return `Hace ${Math.floor(diffInSeconds / 60)}m`
    if (diffInSeconds < 86400) return `Hace ${Math.floor(diffInSeconds / 3600)}h`
    return `Hace ${Math.floor(diffInSeconds / 86400)}d`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4" />
          <p>Cargando chat...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/community/k-chat')}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="font-semibold text-lg">{room?.name}</h1>
              <p className="text-sm text-gray-600">
                {room?.participant_count || 0} participants
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((message) => {
            const isOwn = message.user_id === user?.id
            return (
              <div
                key={message.id}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex gap-3 max-w-xs md:max-w-md ${isOwn ? 'flex-row-reverse' : ''}`}>
                  {/* Avatar */}
                  <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-sm font-semibold">
                      {getUserName(message).charAt(0).toUpperCase()}
                    </span>
                  </div>

                  {/* Message */}
                  <div className={`${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
                    <span className="text-xs text-gray-600 mb-1 px-1">
                      {getUserName(message)}
                    </span>
                    <div
                      className={`rounded-lg px-3 py-2 ${
                        isOwn
                          ? 'bg-purple-500 text-white'
                          : 'bg-white text-gray-900 border border-gray-200'
                      }`}
                    >
                      {message.image_url && (
                        <div className="mb-2 -mx-1">
                          <img
                            src={message.image_url}
                            alt="Chat image"
                            className="rounded-lg max-w-[300px] max-h-[400px] cursor-pointer hover:opacity-90 transition-opacity object-contain"
                            onClick={() => window.open(message.image_url, '_blank')}
                            style={{ maxWidth: 'min(300px, 80vw)' }}
                          />
                        </div>
                      )}
                      {message.message && (
                        <p className={`text-sm whitespace-pre-wrap ${message.image_url ? 'mt-2' : ''}`}>
                          {message.message}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-gray-500 mt-1 px-1">
                      {getTimeAgo(message.created_at)}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-200">
        <div 
          className={`${
            isDragging ? 'border-purple-500 border-2 border-dashed' : ''
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {isDragging && (
            <div className="text-center py-8 text-purple-500 font-semibold">
              Arrastra la imagen aquí para subir
            </div>
          )}
          <form onSubmit={sendMessage} className="max-w-4xl mx-auto px-4 py-3">
            {/* Image Preview - Above input area */}
            {imagePreview && (
              <div className="mb-2 relative inline-block">
                <div className="relative w-24 h-24 border rounded-lg overflow-hidden bg-gray-100">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                >
                  ×
                </button>
              </div>
            )}
            
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                disabled={!user || uploading}
              >
                <ImageIcon className="w-5 h-5" />
              </Button>
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Escribe un mensaje..."
                className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                disabled={!user || uploading}
              />
              <Button
                type="submit"
                disabled={!user || (!newMessage.trim() && !selectedImage) || uploading}
                className="px-6"
              >
                {uploading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
