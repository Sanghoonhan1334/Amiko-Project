'use client'

import { useState, useEffect } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase-client'

/**
 * Hook personalizado para operaciones de FanZone
 * Maneja CRUD básico, membresías y estados de carga
 */
export function useFanZone() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Cargar usuario actual
  useEffect(() => {
    const supabase = createSupabaseBrowserClient()
    
    const getUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser()
      console.log('🔍 useFanZone getUser:', { user: user?.id, error })
      setUser(user)
      setLoading(false)
    }
    
    getUser()
    
    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔄 Auth state changed:', event, session?.user?.id)
      setUser(session?.user ?? null)
    })
    
    return () => subscription.unsubscribe()
  }, [])

  /**
   * Crear FanRoom
   */
  const createFanroom = async (fanroomData: {
    name: string
    description?: string
    category: string
    country: string
    visibility?: string
    tags?: string[]
    coverImage?: string
  }) => {
    try {
      console.log('📤 Creating fanroom:', fanroomData)
      console.log('👤 Current user:', user?.id || 'null')
      
      // Obtener token de sesión de Supabase
      const supabase = createSupabaseBrowserClient()
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      const token = session?.access_token
      
      console.log('🔑 Token:', token ? 'present' : 'missing')
      console.log('🔑 Session error:', sessionError)
      console.log('🔑 Session full:', session)
      console.log('🍪 Cookies:', document.cookie)
      console.log('👤 useFanZone user state:', user)
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }
      
      // Si hay token, añadirlo al header
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
        console.log('✅ Authorization header set')
      } else {
        console.log('❌ No token to set in header')
      }
      
      console.log('📤 Fetch options:', {
        method: 'POST',
        headers: Object.keys(headers),
        credentials: 'include',
        bodySize: JSON.stringify(fanroomData).length
      })
      
      const response = await fetch('/api/fanzone/create', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify(fanroomData),
      })

      const data = await response.json()
      
      console.log('📥 Response:', response.status, data)
      
      if (!response.ok) {
        throw new Error(data.error || 'Error al crear FanRoom')
      }

      return data
    } catch (error) {
      console.error('Error creating fanroom:', error)
      throw error
    }
  }

  /**
   * Listar FanRooms con filtros
   */
  const listFanrooms = async (filters: {
    country?: string
    category?: string
    sort?: string
    search?: string
    limit?: number
    offset?: number
  } = {}) => {
    try {
      const params = new URLSearchParams()
      
      if (filters.country) params.append('country', filters.country)
      if (filters.category) params.append('category', filters.category)
      if (filters.sort) params.append('sort', filters.sort)
      if (filters.search) params.append('q', filters.search)
      if (filters.limit) params.append('limit', filters.limit.toString())
      if (filters.offset) params.append('offset', filters.offset.toString())

      const response = await fetch(`/api/fanzone/list?${params}`, {
        credentials: 'include'
      })
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Error al obtener FanRooms')
      }

      return data
    } catch (error) {
      console.error('Error listing fanrooms:', error)
      throw error
    }
  }

  /**
   * Unirse a FanRoom
   */
  const joinFanroom = async (fanroomId: string) => {
    try {
      const response = await fetch('/api/fanzone/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ fanroomId }),
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Error al unirse al FanRoom')
      }

      return data
    } catch (error) {
      console.error('Error joining fanroom:', error)
      throw error
    }
  }

  /**
   * Salir de FanRoom
   */
  const leaveFanroom = async (fanroomId: string) => {
    try {
      const response = await fetch(`/api/fanzone/leave?fanroomId=${fanroomId}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Error al salir del FanRoom')
      }

      return data
    } catch (error) {
      console.error('Error leaving fanroom:', error)
      throw error
    }
  }

  /**
   * Obtener posts de FanRoom
   */
  const getFanroomPosts = async (fanroomId: string, limit = 20, offset = 0) => {
    try {
      const params = new URLSearchParams({
        fanroomId,
        limit: limit.toString(),
        offset: offset.toString(),
      })

      const response = await fetch(`/api/fanzone/posts?${params}`, {
        credentials: 'include'
      })
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Error al obtener posts')
      }

      return data
    } catch (error) {
      console.error('Error getting posts:', error)
      throw error
    }
  }

  /**
   * Crear post en FanRoom
   */
  const createPost = async (fanroomId: string, content: string, mediaUrls?: string[]) => {
    try {
      const response = await fetch('/api/fanzone/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          fanroomId,
          content,
          mediaUrls,
        }),
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Error al crear post')
      }

      return data
    } catch (error) {
      console.error('Error creating post:', error)
      throw error
    }
  }

  /**
   * Obtener mensajes de chat
   */
  const getChatMessages = async (fanroomId: string, limit = 50, offset = 0) => {
    try {
      const params = new URLSearchParams({
        fanroomId,
        limit: limit.toString(),
        offset: offset.toString(),
      })

      const response = await fetch(`/api/fanzone/chat?${params}`, {
        credentials: 'include'
      })
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Error al obtener mensajes')
      }

      return data
    } catch (error) {
      console.error('Error getting chat messages:', error)
      throw error
    }
  }

  /**
   * Enviar mensaje de chat
   */
  const sendChatMessage = async (fanroomId: string, message: string) => {
    try {
      const response = await fetch('/api/fanzone/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          fanroomId,
          message,
        }),
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Error al enviar mensaje')
      }

      return data
    } catch (error) {
      console.error('Error sending chat message:', error)
      throw error
    }
  }

  /**
   * Generar slug único
   */
  const generateSlug = (name: string): string => {
    return name.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
  }

  /**
   * Formatear fecha relativa
   */
  const formatRelativeTime = (dateString: string): string => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Ahora'
    if (diffInMinutes < 60) return `Hace ${diffInMinutes} min`
    
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `Hace ${diffInHours} h`
    
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `Hace ${diffInDays} días`
    
    return date.toLocaleDateString('es-MX')
  }

  return {
    user,
    loading,
    createFanroom,
    listFanrooms,
    joinFanroom,
    leaveFanroom,
    getFanroomPosts,
    createPost,
    getChatMessages,
    sendChatMessage,
    generateSlug,
    formatRelativeTime,
  }
}
