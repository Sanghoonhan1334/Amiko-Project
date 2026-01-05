'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import { createClient } from '@supabase/supabase-js'
import { Ban, UserX, Clock, X, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface ChatBan {
  id: string
  room_id: string
  user_id: string
  banned_by: string
  reason: string | null
  ban_type: 'temporary' | 'permanent'
  expires_at: string | null
  created_at: string
  users?: {
    id: string
    email: string | null
    full_name?: string | null
    korean_name?: string | null
    spanish_name?: string | null
    display_name?: string
  }
  rooms?: {
    id: string
    name: string
  }
}

export default function ChatBanManagement() {
  const { user, token } = useAuth()
  const { language } = useLanguage()
  const [bans, setBans] = useState<ChatBan[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'temporary' | 'permanent' | 'active'>('active')

  // 인증된 Supabase 클라이언트
  const authSupabase = React.useMemo(() => {
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

  // 채팅금지 목록 가져오기
  const fetchBans = async () => {
    if (!user || !token) return

    try {
      setLoading(true)
      
      // API 엔드포인트를 통해 조회 (서버 사이드에서 운영자 권한 체크)
      const response = await fetch('/api/admin/chat-bans', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        console.error('Error fetching chat bans:', result.error)
        return
      }

      setBans(result.bans || [])
    } catch (error) {
      console.error('Error fetching chat bans:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user && token) {
      fetchBans()
    }
  }, [user, token, authSupabase])

  // 채팅금지 해제
  const unbanUser = async (banId: string, userId: string, roomId: string) => {
    if (!user || !token) return

    if (!confirm(language === 'ko' 
      ? '이 사용자의 채팅금지를 해제하시겠습니까?'
      : '¿Deseas levantar la prohibición de chat de este usuario?')) {
      return
    }

    try {
      // API 엔드포인트를 통해 해제 (서버 사이드에서 운영자 권한 체크)
      const response = await fetch(`/api/admin/chat-bans/${banId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          roomId
        })
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        console.error('Error unbanning user:', result.error)
        alert(language === 'ko' 
          ? (result.error || '채팅금지 해제에 실패했습니다.') 
          : (result.error || 'Error al levantar la prohibición'))
        return
      }

      alert(language === 'ko' ? '채팅금지가 해제되었습니다.' : 'Prohibición de chat levantada')
      fetchBans()
    } catch (error) {
      console.error('Error unbanning user:', error)
      alert(language === 'ko' ? '채팅금지 해제 중 오류가 발생했습니다.' : 'Error al levantar la prohibición')
    }
  }

  // 필터링된 목록
  const filteredBans = bans.filter(ban => {
    if (filter === 'all') return true
    if (filter === 'temporary') return ban.ban_type === 'temporary'
    if (filter === 'permanent') return ban.ban_type === 'permanent'
    if (filter === 'active') {
      if (ban.ban_type === 'permanent') return true
      if (ban.ban_type === 'temporary' && ban.expires_at) {
        return new Date(ban.expires_at) > new Date()
      }
      return false
    }
    return true
  })

  // 사용자 이름 가져오기
  const getUserName = (ban: ChatBan) => {
    // display_name이 있으면 우선 사용 (user_profiles에서 가져온 값)
    if ((ban.users as any)?.display_name) return (ban.users as any).display_name
    if (ban.users?.korean_name) return ban.users.korean_name
    if (ban.users?.spanish_name) return ban.users.spanish_name
    if (ban.users?.full_name) return ban.users.full_name
    if (ban.users?.email) return ban.users.email.split('@')[0]
    return 'Unknown'
  }

  // 날짜 포맷
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString(language === 'ko' ? 'ko-KR' : 'es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // 남은 시간 계산
  const getTimeRemaining = (expiresAt: string | null) => {
    if (!expiresAt) return null
    const now = new Date()
    const expiry = new Date(expiresAt)
    const diff = expiry.getTime() - now.getTime()
    
    if (diff <= 0) return null
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    
    if (days > 0) {
      return language === 'ko' ? `${days}일 ${hours}시간` : `${days}d ${hours}h`
    } else if (hours > 0) {
      return language === 'ko' ? `${hours}시간 ${minutes}분` : `${hours}h ${minutes}m`
    } else {
      return language === 'ko' ? `${minutes}분` : `${minutes}m`
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* 필터 버튼 */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={filter === 'active' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('active')}
        >
          {language === 'ko' ? '활성' : 'Activos'}
        </Button>
        <Button
          variant={filter === 'temporary' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('temporary')}
        >
          {language === 'ko' ? '임시' : 'Temporales'}
        </Button>
        <Button
          variant={filter === 'permanent' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('permanent')}
        >
          {language === 'ko' ? '영구' : 'Permanentes'}
        </Button>
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          {language === 'ko' ? '전체' : 'Todos'}
        </Button>
      </div>

      {/* 채팅금지 목록 */}
      {filteredBans.length === 0 ? (
        <Card className="p-8 text-center">
          <Ban className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600">
            {language === 'ko' ? '채팅금지된 사용자가 없습니다.' : 'No hay usuarios con prohibición de chat.'}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredBans.map((ban) => {
            const isExpired = ban.ban_type === 'temporary' && ban.expires_at && new Date(ban.expires_at) <= new Date()
            const timeRemaining = getTimeRemaining(ban.expires_at)

            return (
              <Card key={ban.id} className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {ban.ban_type === 'permanent' ? (
                        <UserX className="w-5 h-5 text-red-600" />
                      ) : (
                        <Clock className="w-5 h-5 text-orange-600" />
                      )}
                      <h4 className="font-semibold text-lg">{getUserName(ban)}</h4>
                      <Badge variant={ban.ban_type === 'permanent' ? 'destructive' : 'secondary'}>
                        {ban.ban_type === 'permanent' 
                          ? (language === 'ko' ? '영구 추방' : 'Permanente')
                          : (language === 'ko' ? '임시 금지' : 'Temporal')}
                      </Badge>
                      {isExpired && (
                        <Badge variant="outline" className="text-gray-500">
                          {language === 'ko' ? '만료됨' : 'Expirado'}
                        </Badge>
                      )}
                    </div>

                    <div className="space-y-1 text-sm text-gray-600">
                      <p>
                        <span className="font-medium">{language === 'ko' ? '채팅방: ' : 'Sala: '}</span>
                        {ban.rooms?.name || ban.room_id}
                      </p>
                      {ban.reason && (
                        <p>
                          <span className="font-medium">{language === 'ko' ? '사유: ' : 'Razón: '}</span>
                          {ban.reason}
                        </p>
                      )}
                      <p>
                        <span className="font-medium">{language === 'ko' ? '적용일: ' : 'Aplicado: '}</span>
                        {formatDate(ban.created_at)}
                      </p>
                      {ban.ban_type === 'temporary' && ban.expires_at && (
                        <p>
                          <span className="font-medium">{language === 'ko' ? '만료일: ' : 'Expira: '}</span>
                          {formatDate(ban.expires_at)}
                          {timeRemaining && (
                            <span className="ml-2 text-orange-600 font-semibold">
                              ({language === 'ko' ? '남은 시간: ' : 'Tiempo restante: '}{timeRemaining})
                            </span>
                          )}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => unbanUser(ban.id, ban.user_id, ban.room_id)}
                      className="whitespace-nowrap"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      {language === 'ko' ? '해제' : 'Levantar'}
                    </Button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

