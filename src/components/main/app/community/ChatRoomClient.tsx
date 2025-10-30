'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Send, Users, Image as ImageIcon, X, RotateCw, Shield, Ban, UserMinus, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@supabase/supabase-js'
import Image from 'next/image'
import UserBadge from '@/components/common/UserBadge'

interface Message {
  id: string
  message: string
  image_url?: string
  user_id: string
  created_at: string
  status?: 'sending' | 'sent' | 'failed' // 메시지 전송 상태
  user_profiles?: {
    display_name?: string
    avatar_url?: string
    total_points?: number
  }
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
  owner_id?: string
}

interface Participant {
  user_id: string
  role: 'owner' | 'admin' | 'moderator' | 'member'
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function ChatRoomClient({ roomId }: { roomId: string }) {
  const { user, token, loading: authLoading } = useAuth()
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
  const [userRole, setUserRole] = useState<'owner' | 'admin' | 'moderator' | 'member'>('member')
  const [showSettings, setShowSettings] = useState(false)
  const [showParticipantsModal, setShowParticipantsModal] = useState(false)
  const [showReportsModal, setShowReportsModal] = useState(false)
  const [participants, setParticipants] = useState<any[]>([])
  const [reports, setReports] = useState<any[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const channelRef = useRef<any>(null)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const processedMessageIds = useRef<Set<string>>(new Set())

  // 중복 메시지 방지 헬퍼 함수
  const addMessageSafely = (newMessage: Message) => {
    setMessages((prev) => {
      // 이미 처리된 메시지인지 확인
      if (processedMessageIds.current.has(newMessage.id)) {
        console.log('⚠️ 중복 메시지 무시:', newMessage.id)
        return prev
      }
      
      // 배열에도 이미 있는지 확인 (이중 체크)
      const exists = prev.some(m => m.id === newMessage.id)
      if (exists) {
        console.log('⚠️ 중복 메시지 무시 (배열에 이미 존재):', newMessage.id)
        return prev
      }
      
      // 새 메시지 추가
      processedMessageIds.current.add(newMessage.id)
      console.log('✅ 새 메시지 추가:', newMessage.id)
      return [...prev, newMessage]
    })
  }

  useEffect(() => {
    // 인증 로딩 중일 때는 기다림 (새로고침 시 로그인 풀리는 문제 방지)
    if (authLoading) {
      console.log('⏳ 인증 로딩 중... 대기')
      return
    }

    // 세션 복구 대기 (authLoading이 false가 되어도 user는 아직 없을 수 있음)
    const timeoutId = setTimeout(() => {
      // 로딩 완료 후 사용자가 없으면 로그인 페이지로
      if (!user) {
        console.log('❌ 사용자 없음 - 로그인 페이지로 이동')
        router.push('/sign-in')
        return
      }

      console.log('✅ 사용자 인증 완료 - 채팅 시작')

      fetchRoom()
      fetchMessages()
      joinRoom()
      
      // Subscribe to messages (Realtime) - cleanup은 ref에 저장됨
      subscribeToMessages()

      // Polling fallback (5초마다 메시지 확인)
      startPolling()
    }, 500)

    return () => {
      clearTimeout(timeoutId)
      // Cleanup channel
      if (channelRef.current) {
        authSupabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
      stopPolling()
      leaveRoom()
    }
  }, [roomId, user, authSupabase, authLoading])

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
      
      // 사용자의 권한 가져오기
      if (user) {
        const { data: participant } = await authSupabase
          .from('chat_room_participants')
          .select('role')
          .eq('room_id', roomId)
          .eq('user_id', user.id)
          .single()
        
        if (participant) {
          setUserRole(participant.role as any)
        }
      }
    } catch (error) {
      console.error('Error fetching room:', error)
    }
  }

  const fetchMessages = async () => {
    try {
      // 우선 프로필 없이 로드
      const { data, error } = await authSupabase
        .from('chat_messages')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('❌ Error fetching messages:', error)
        throw error
      }

      const messages = data || []
      
      // 각 메시지에 프로필 정보 추가 (별도 쿼리)
      const messagesWithProfiles = await Promise.all(
        messages.map(async (msg) => {
          try {
            const { data: profile } = await authSupabase
              .from('user_profiles')
              .select('display_name, avatar_url, total_points')
              .eq('user_id', msg.user_id)
              .single()
            // total_points 폴백: user_points 테이블에서 조회
            let totalPoints = profile?.total_points ?? 0
            if (!totalPoints) {
              const { data: pointsRow } = await authSupabase
                .from('user_points')
                .select('total_points')
                .eq('user_id', msg.user_id)
                .single()
              totalPoints = pointsRow?.total_points ?? 0
            }
            msg.user_profiles = { ...(msg.user_profiles || {}), display_name: profile?.display_name, avatar_url: profile?.avatar_url, total_points: totalPoints }
            
            return {
              ...msg,
              user_profiles: msg.user_profiles
            }
          } catch {
            return msg
          }
        })
      )
      
      // 초기 로드 시 처리된 ID Set 초기화 및 채우기
      processedMessageIds.current = new Set(messagesWithProfiles.map(m => m.id))
      
      setMessages(messagesWithProfiles)
      console.log('📨 초기 메시지 로드:', messagesWithProfiles.length, '개')
    } catch (error) {
      console.error('❌ Error fetching messages:', error)
    } finally {
      setLoading(false)
    }
  }

  // Polling functions (무료 백업 방법)
  const startPolling = () => {
    // Stop existing polling if any
    stopPolling()
    
    // Poll every 1.5 seconds for faster response (와츠앱처럼 빠르게)
    console.log('🔄 Polling started (1.5초 간격)')
    pollingIntervalRef.current = setInterval(() => {
      fetchNewMessages()
    }, 1500)
  }

  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
      pollingIntervalRef.current = null
    }
  }

  // 새 메시지만 가져오기 (성능 최적화)
  const fetchNewMessages = async () => {
    try {
      const lastMessage = messages[messages.length - 1]
      const lastMessageTime = lastMessage?.created_at || new Date(0).toISOString()

      const { data, error } = await authSupabase
        .from('chat_messages')
        .select('*')
        .eq('room_id', roomId)
        .gt('created_at', lastMessageTime)
        .order('created_at', { ascending: true })

      if (error) throw error

      if (data && data.length > 0) {
        console.log('🔄 Polling: 새 메시지', data.length, '개 발견')
        
        // 각 메시지에 프로필 추가
        const messagesWithProfiles = await Promise.all(
          data.map(async (msg) => {
            try {
              const { data: profile } = await authSupabase
                .from('user_profiles')
                .select('display_name, avatar_url, total_points')
                .eq('user_id', msg.user_id)
                .single()
              // total_points 폴백
              let totalPoints2 = profile?.total_points ?? 0
              if (!totalPoints2) {
                const { data: pointsRow2 } = await authSupabase
                  .from('user_points')
                  .select('total_points')
                  .eq('user_id', msg.user_id)
                  .single()
                totalPoints2 = pointsRow2?.total_points ?? 0
              }
              msg.user_profiles = { ...(msg.user_profiles || {}), display_name: profile?.display_name, avatar_url: profile?.avatar_url, total_points: totalPoints2 }
              
              return {
                ...msg,
                user_profiles: msg.user_profiles
              }
            } catch {
              return msg
            }
          })
        )
        
        // 각 메시지를 안전하게 추가
        messagesWithProfiles.forEach(msg => addMessageSafely(msg))
      }
    } catch (error) {
      // Polling 에러는 조용히 처리 (치명적이지 않음)
      if (process.env.NODE_ENV === 'development') {
        console.warn('⚠️ Polling error (non-critical):', error)
      }
    }
  }

  const subscribeToMessages = () => {
    // Remove existing channel if any
    if (channelRef.current) {
      console.log('🗑️ Removing existing channel')
      authSupabase.removeChannel(channelRef.current)
    }

    console.log('📡 Starting Realtime subscription for room:', roomId)

    // Create new channel
    const channel = authSupabase
      .channel(`room-${roomId}-${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${roomId}`
        },
        async (payload) => {
          console.log('✅ New message received via Realtime:', payload.new)
          const newMessage = payload.new as Message
          // 안전하게 메시지 추가 (중복 방지)
          addMessageSafely(newMessage)
        }
      )
      .subscribe((status) => {
        console.log('🔔 Realtime Subscription status:', status)
        if (status === 'SUBSCRIBED') {
          console.log('🎉 Realtime 연결 성공! 즉시 메시지 수신 가능')
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Realtime 연결 실패 - Polling으로 전환됩니다')
        } else if (status === 'TIMED_OUT') {
          console.warn('⏱️ Realtime 연결 시간 초과 - Polling으로 전환됩니다')
        }
      })

    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        console.log('🗑️ Cleaning up channel on unmount')
        authSupabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
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

    // tempMessage를 함수 스코프로 이동
    let tempMessage: Message | null = null
    
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

      // ⚡ Optimistic UI: DB에 insert하기 전에 먼저 UI에 추가
      tempMessage = {
        id: `temp-${Date.now()}`, // 임시 ID
        message: newMessage.trim() || '',
        image_url: imageUrl || undefined,
        user_id: user.id,
        created_at: new Date().toISOString(),
        status: 'sending' // 전송 중 상태
      }
      
      console.log('🚀 Optimistic UI: 메시지 즉시 표시')
      setMessages(prev => [...prev, tempMessage!])
      
      // 입력 필드 즉시 비우기
      setNewMessage('')
      setSelectedImage(null)
      setImagePreview(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      // DB에 insert
      const { data, error } = await authSupabase
        .from('chat_messages')
        .insert(messageData)
        .select()
        .single()

      if (error) throw error

      console.log('✅ DB에 메시지 저장 완료:', data.id)
      
      // 임시 메시지를 실제 메시지로 교체 (상태: sent)
      if (data && tempMessage) {
        setMessages(prev => prev.map(msg => 
          msg.id === tempMessage!.id ? { ...data, status: 'sent' as const } : msg
        ))
      }
      
    } catch (error) {
      console.error('❌ Error sending message:', error)
      
      // 실패 시 상태를 'failed'로 변경 (제거하지 않음!)
      if (tempMessage) {
        setMessages(prev => prev.map(msg => 
          msg.id === tempMessage!.id ? { ...msg, status: 'failed' as const } : msg
        ))
      }
    } finally {
      setUploading(false)
    }
  }

  // 카카오톡 스타일 재전송 함수
  const retrySendMessage = async (failedMessage: Message) => {
    if (!user) return

    try {
      setUploading(true)
      
      // 상태를 'sending'으로 변경
      setMessages(prev => prev.map(msg => 
        msg.id === failedMessage.id ? { ...msg, status: 'sending' as const } : msg
      ))

      const messageData: any = {
        room_id: roomId,
        user_id: user.id,
        message: failedMessage.message || ''
      }

      if (failedMessage.image_url) {
        messageData.image_url = failedMessage.image_url
      }

      // DB에 insert
      const { data, error } = await authSupabase
        .from('chat_messages')
        .insert(messageData)
        .select()
        .single()

      if (error) throw error

      console.log('✅ 재전송 성공:', data.id)
      
      // 실패한 메시지를 실제 메시지로 교체
      setMessages(prev => prev.map(msg => 
        msg.id === failedMessage.id ? { ...data, status: 'sent' as const } : msg
      ))
      
    } catch (error) {
      console.error('❌ 재전송 실패:', error)
      // 상태를 다시 'failed'로
      setMessages(prev => prev.map(msg => 
        msg.id === failedMessage.id ? { ...msg, status: 'failed' as const } : msg
      ))
    } finally {
      setUploading(false)
    }
  }

  // 카카오톡 스타일 메시지 삭제 함수
  const deleteFailedMessage = (messageId: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== messageId))
  }

  // 채팅방 관리 기능
  const banUser = async (userId: string, reason: string = '') => {
    if (!user || (userRole !== 'owner' && userRole !== 'admin' && userRole !== 'moderator')) {
      alert('No tienes permiso')
      return
    }

    try {
      // 1. 추방 기록 생성
      await authSupabase
        .from('chat_bans')
        .insert({
          room_id: roomId,
          user_id: userId,
          banned_by: user.id,
          reason: reason || 'Expulsado por administrador',
          ban_type: 'permanent'
        })

      // 2. 참여자 목록에서 제거
      await authSupabase
        .from('chat_room_participants')
        .delete()
        .eq('room_id', roomId)
        .eq('user_id', userId)

      alert('Usuario expulsado')
      
      // 채팅방 새로고침
      fetchRoom()
    } catch (error) {
      console.error('Error banning user:', error)
      alert('Error al expulsar usuario')
    }
  }

  const isAdmin = () => {
    return userRole === 'owner' || userRole === 'admin' || userRole === 'moderator'
  }

  // 참여자 목록 가져오기
  const fetchParticipants = async () => {
    try {
      const { data, error } = await authSupabase
        .from('chat_room_participants')
        .select('user_id, role')
        .eq('room_id', roomId)
        .order('role', { ascending: false })

      if (error) {
        console.error('Error fetching participants:', error)
        throw error
      }
      
      console.log('Participants data:', data)
      
      // user_id로 사용자 정보 가져오기
      const participantsWithUserInfo = await Promise.all(
        (data || []).map(async (participant) => {
          try {
            // user_profiles 테이블에서 닉네임 가져오기
            const { data: profileData } = await authSupabase
              .from('user_profiles')
              .select('display_name, avatar_url, total_points')
              .eq('user_id', participant.user_id)
              .single()
            let totalPoints3 = profileData?.total_points ?? 0
            if (!totalPoints3) {
              const { data: pointsRow3 } = await authSupabase
                .from('user_points')
                .select('total_points')
                .eq('user_id', participant.user_id)
                .single()
              totalPoints3 = pointsRow3?.total_points ?? 0
            }
            
            return {
              ...participant,
              user_profiles: { ...(profileData || {}), display_name: profileData?.display_name, avatar_url: profileData?.avatar_url, total_points: totalPoints3 }
            }
          } catch (error) {
            console.error('Error fetching profile for participant:', participant.user_id, error)
            return {
              ...participant,
              user_profiles: null
            }
          }
        })
      )
      
      console.log('Participants with info:', participantsWithUserInfo)
      setParticipants(participantsWithUserInfo)
    } catch (error) {
      console.error('Error fetching participants:', error)
      alert('Error al cargar participantes')
    }
  }

  // 신고 목록 가져오기
  const fetchReports = async () => {
    try {
      const { data, error } = await authSupabase
        .from('chat_reports')
        .select('*')
        .eq('room_id', roomId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching reports:', error)
        throw error
      }
      
      // 신고된 사용자와 신고한 사용자 정보 가져오기
      const reportsWithUserInfo = await Promise.all(
        (data || []).map(async (report) => {
          try {
            // 신고된 사용자 정보
            const { data: reportedProfile } = await authSupabase
              .from('user_profiles')
              .select('display_name')
              .eq('user_id', report.reported_user_id)
              .single()
            
            // 신고한 사용자 정보
            const { data: reporterProfile } = await authSupabase
              .from('user_profiles')
              .select('display_name')
              .eq('user_id', report.reporter_id)
              .single()
            
            return {
              ...report,
              reported_user_name: reportedProfile?.display_name || 'Usuario',
              reporter_name: reporterProfile?.display_name || 'Usuario'
            }
          } catch (error) {
            console.error('Error fetching report user info:', error)
            return {
              ...report,
              reported_user_name: 'Usuario',
              reporter_name: 'Usuario'
            }
          }
        })
      )
      
      console.log('Reports with info:', reportsWithUserInfo)
      setReports(reportsWithUserInfo)
    } catch (error) {
      console.error('Error fetching reports:', error)
      alert('Error al cargar denuncias')
    }
  }

  // 부방장 지정
  const assignAdmin = async (userId: string) => {
    try {
      const { error } = await authSupabase
        .from('chat_room_participants')
        .update({ role: 'admin' })
        .eq('room_id', roomId)
        .eq('user_id', userId)

      if (error) throw error
      alert('Subanfitrión asignado')
      fetchParticipants()
    } catch (error) {
      console.error('Error assigning admin:', error)
      alert('Error al asignar subanfitrión')
    }
  }

  // 역할 변경
  const changeRole = async (userId: string, newRole: string) => {
    try {
      const { error } = await authSupabase
        .from('chat_room_participants')
        .update({ role: newRole })
        .eq('room_id', roomId)
        .eq('user_id', userId)

      if (error) throw error
      alert('Rol actualizado')
      fetchParticipants()
    } catch (error) {
      console.error('Error changing role:', error)
      alert('Error al actualizar rol')
    }
  }

  // 신고 처리
  const handleReport = async (reportId: string, action: 'resolve' | 'dismiss') => {
    try {
      const { error } = await authSupabase
        .from('chat_reports')
        .update({ 
          status: action === 'resolve' ? 'resolved' : 'dismissed',
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id
        })
        .eq('id', reportId)

      if (error) throw error
      alert(action === 'resolve' ? 'Denuncia resuelta' : 'Denuncia descartada')
      fetchReports()
    } catch (error) {
      console.error('Error handling report:', error)
      alert('Error al procesar denuncia')
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const getUserName = (message: Message) => {
    // 1순위: user_profiles의 display_name (닉네임)
    if (message.user_profiles?.display_name) {
      let name = message.user_profiles.display_name
      // # 이후 부분 제거
      if (name.includes('#')) {
        name = name.split('#')[0]
      }
      return name
    }
    
    // 2순위: users의 user_metadata name
    if (message.users?.user_metadata?.name) {
      return message.users.user_metadata.name
    }
    
    // 3순위: email에서 추출
    if (message.users?.email) {
      return message.users.email.split('@')[0]
    }
    
    // 4순위: 기본값
    return 'Usuario'
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

  // 인증 로딩 중이거나 채팅 로딩 중일 때
  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600 dark:border-gray-400 mx-auto mb-4" />
          <p>{authLoading ? 'Verificando sesión...' : 'Cargando chat...'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* 뒤로가기 버튼 - 더 눈에 띄게 */}
            <button
              onClick={() => router.push('/community/k-chat')}
              className="flex items-center gap-2 px-3 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg transition-colors"
              title="Atrás"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline">Chat</span>
            </button>
            <div>
              <h1 className="font-semibold text-lg">{room?.name}</h1>
              <p className="text-sm text-gray-600">
                {room?.participant_count || 0} participants
              </p>
            </div>
          </div>
          
          {/* 관리 버튼 (관리자만) */}
          {isAdmin() && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSettings(!showSettings)}
              className="hover:bg-gray-100"
              title="채팅방 설정"
            >
              <Settings className="w-5 h-5" />
            </Button>
          )}
        </div>
      </div>

      {/* 관리 설정 패널 */}
      {showSettings && isAdmin() && (
        <div className="bg-white border-b border-gray-200 px-4 py-3">
          <div className="max-w-4xl mx-auto">
            <h3 className="font-semibold mb-2">Administración de sala de chat</h3>
            <p className="text-sm text-gray-600 mb-3">
              Rol: {userRole === 'owner' ? 'Anfitrión' : userRole === 'admin' ? 'Subanfitrión' : 'Moderador'}
            </p>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  fetchParticipants()
                  setShowParticipantsModal(true)
                }} 
                className="flex-1"
              >
                <Users className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Administrar </span>participantes
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  fetchReports()
                  setShowReportsModal(true)
                }} 
                className="flex-1"
              >
                <Shield className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Administrar </span>denuncias
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((message, index) => {
            const isOwn = message.user_id === user?.id
            // 고유한 키 생성 (id + index)
            const uniqueKey = `${message.id}-${index}`
            return (
              <div
                key={uniqueKey}
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
                    <div className="flex items-center gap-2 mb-1 px-1">
                      <span className="text-xs text-gray-600">
                        {getUserName(message)}
                        <UserBadge totalPoints={message.user_profiles?.total_points || 0} isVip={false} size="sm" />
                      </span>
                      {/* 추방 버튼 (관리자만, 자신 제외) */}
                      {isAdmin() && !isOwn && (
                        <button
                          onClick={() => {
                            if (confirm(`¿Expulsar a ${getUserName(message)}?`)) {
                              banUser(message.user_id)
                            }
                          }}
                          className="text-red-500 hover:text-red-700 transition-colors"
                          title="Expulsar"
                        >
                          <Ban className="w-3 h-3" />
                        </button>
                      )}
                    </div>
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
                    <div className="flex items-center gap-1 mt-1 px-1">
                      <span className="text-xs text-gray-500">
                        {getTimeAgo(message.created_at)}
                      </span>
                      {/* 카카오톡 스타일 메시지 상태 (자신의 메시지만) */}
                      {isOwn && message.status && (
                        <div className="flex items-center gap-1 ml-1">
                          {message.status === 'sending' && (
                            <div className="animate-spin text-gray-400">
                              <RotateCw className="w-3 h-3" />
                            </div>
                          )}
                          {message.status === 'sent' && (
                            <span className="text-xs text-blue-500">✓</span>
                          )}
                          {message.status === 'failed' && (
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-red-500">✗</span>
                              <button
                                onClick={() => retrySendMessage(message)}
                                className="text-red-500 hover:text-red-700 transition-colors"
                                title="재전송"
                              >
                                <RotateCw className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => deleteFailedMessage(message.id)}
                                className="text-red-500 hover:text-red-700 transition-colors"
                                title="삭제"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
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

      {/* 참여자 관리 모달 */}
      {showParticipantsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold">Participantes</h3>
              <button onClick={() => setShowParticipantsModal(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {participants.length === 0 ? (
                <p className="text-gray-500 text-center">No hay participantes</p>
              ) : (
                <div className="space-y-2">
                  {participants.map((participant) => {
                    // 메시지에서 사용하는 getUserName 로직과 동일하게
                    let username = 'Usuario'
                    
                    // 1순위: user_profiles의 display_name
                    if (participant.user_profiles?.display_name) {
                      username = participant.user_profiles.display_name
                      // # 이후 부분 제거
                      if (username.includes('#')) {
                        username = username.split('#')[0]
                      }
                    }
                    
                    const isCurrentUser = participant.user_id === user?.id
                    const canModify = userRole === 'owner' && !isCurrentUser
                    
                    return (
                      <div key={participant.user_id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                            {username[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium">{username}</p>
                            <p className="text-sm text-gray-500">
                              {participant.role === 'owner' ? 'Anfitrión' : 
                               participant.role === 'admin' ? 'Subanfitrión' : 
                               participant.role === 'moderator' ? 'Moderador' : 'Miembro'}
                            </p>
                          </div>
                        </div>
                        {canModify && (
                          <select
                            value={participant.role}
                            onChange={(e) => changeRole(participant.user_id, e.target.value)}
                            className="border rounded px-2 py-1 text-sm"
                          >
                            <option value="member">Miembro</option>
                            <option value="moderator">Moderador</option>
                            <option value="admin">Subanfitrión</option>
                          </select>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 신고 관리 모달 */}
      {showReportsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold">Denuncias</h3>
              <button onClick={() => setShowReportsModal(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {reports.length === 0 ? (
                <p className="text-gray-500 text-center">No hay denuncias pendientes</p>
              ) : (
                <div className="space-y-3">
                  {reports.map((report) => {
                    const reportedName = report.reported_user_name || 'Usuario'
                    const reporterName = report.reporter_name || 'Usuario'
                    
                    return (
                      <div key={report.id} className="border rounded-lg p-3">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-medium text-sm">Denunciado: {reportedName}</p>
                            <p className="text-xs text-gray-500">Denunciante: {reporterName}</p>
                          </div>
                        </div>
                        <p className="text-sm text-gray-700 mb-3">{report.reason}</p>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleReport(report.id, 'dismiss')}
                            className="flex-1"
                          >
                            Descartar
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              if (confirm(`¿Expulsar a ${reportedName}?`)) {
                                banUser(report.reported_user_id, report.reason)
                                handleReport(report.id, 'resolve')
                              }
                            }}
                            className="flex-1"
                          >
                            Expulsar
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
