'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import VideoCallStarter from '@/components/video/VideoCallStarter'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Calendar, Clock, CheckCircle, XCircle, ChevronRight, Plus } from 'lucide-react'

interface BookingRequest {
  id: string
  date: string
  start_time: string
  end_time: string
  topic: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  conversation_partners: {
    name: string
    avatar_url: string | null
    specialty: string | null
  }
}

export default function MeetTab() {
  const { user } = useAuth()
  const { t, language } = useLanguage()
  const router = useRouter()
  const [bookings, setBookings] = useState<BookingRequest[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.id) {
      fetchBookings()
    } else {
      setLoading(false)
    }
  }, [user?.id])

  const fetchBookings = async () => {
    try {
      setLoading(true)
      console.log('[MeetTab] 예약 목록 조회 시작, user_id:', user?.id)
      const response = await fetch('/api/bookings/my-requests', {
        method: 'GET',
        credentials: 'include' // 쿠키 포함
      })
      
      if (response.status === 401) {
        console.error('[MeetTab] 인증 실패 (401)')
        setBookings([])
        return
      }
      
      if (response.ok) {
        const data = await response.json()
        console.log('[MeetTab] 예약 목록 조회 성공:', data.bookings?.length || 0, '개')
        setBookings(data.bookings || [])
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error('[MeetTab] 예약 목록 조회 실패:', response.status, errorData)
        setBookings([])
      }
    } catch (error) {
      console.error('[MeetTab] 예약 목록 조회 예외:', error)
      setBookings([])
    } finally {
      setLoading(false)
    }
  }

  const handleStartCall = (channelName: string) => {
    console.log('Starting video call with channel:', channelName)
    // TODO: 실제 Agora 채팅 시작 로직
  }

  const formatDate = (dateString: string, timeString: string) => {
    try {
      if (!dateString || !timeString) {
        return `${dateString || ''} ${timeString || ''}`.trim()
      }

      // 날짜와 시간을 안전하게 파싱
      const [year, month, day] = dateString.split('-').map(Number)
      const [hour, minute] = timeString.split(':').map(Number)

      if (isNaN(year) || isNaN(month) || isNaN(day) || isNaN(hour) || isNaN(minute)) {
        // 숫자로 변환할 수 없으면 원본 반환
        return `${dateString} ${timeString}`
      }

      const date = new Date(year, month - 1, day, hour, minute)
      
      // 유효한 날짜인지 확인
      if (isNaN(date.getTime())) {
        return `${dateString} ${timeString}`
      }

      // 시간까지 포함하여 포맷팅
      return date.toLocaleString(language === 'es' ? 'es-PE' : 'ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })
    } catch (error) {
      console.error('[formatDate] 날짜 포맷팅 오류:', error, { dateString, timeString })
      // 오류 발생 시 원본 문자열 반환
      return `${dateString} ${timeString}`
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { 
        label: language === 'es' ? 'Pendiente' : '대기중', 
        className: 'bg-yellow-100 text-yellow-800 border-yellow-300',
        icon: Clock
      },
      approved: { 
        label: language === 'es' ? 'Confirmada' : '확정됨', 
        className: 'bg-green-100 text-green-800 border-green-300',
        icon: CheckCircle
      },
      rejected: { 
        label: language === 'es' ? 'Rechazada' : '거절됨', 
        className: 'bg-red-100 text-red-800 border-red-300',
        icon: XCircle
      }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    const Icon = config.icon
    
    return (
      <Badge className={`${config.className} border flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    )
  }

  return (
    <div className="w-full space-y-6">
      {/* 예약 목록 섹션 (맨 위) */}
      {user && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {language === 'es' ? 'Mis Reservas' : '내 예약'}
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/booking/create')}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              {language === 'es' ? 'Nueva Reserva' : '새 예약'}
            </Button>
          </div>

          {loading ? (
            <Card>
              <CardContent className="py-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600 dark:border-gray-400 mx-auto"></div>
                <p className="text-sm text-gray-600 mt-4">
                  {language === 'es' ? 'Cargando...' : '로딩 중...'}
                </p>
              </CardContent>
            </Card>
          ) : bookings.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  {language === 'es' ? 'No hay reservas' : '예약이 없습니다'}
                </h4>
                <p className="text-sm text-gray-500 mb-4">
                  {language === 'es' 
                    ? 'Aún no has realizado ninguna reserva. ¡Haz tu primera reserva ahora!' 
                    : '아직 예약한 상담이 없습니다. 첫 예약을 만들어보세요!'}
                </p>
                <Button onClick={() => router.push('/booking/create')}>
                  {language === 'es' ? 'Crear Reserva' : '예약 만들기'}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {bookings.map((booking) => (
                <Card 
                  key={booking.id} 
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => router.push(`/bookings/my-requests/${booking.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          {booking.conversation_partners && (
                            <Avatar className="w-10 h-10 flex-shrink-0">
                              {booking.conversation_partners.avatar_url ? (
                                <AvatarImage src={booking.conversation_partners.avatar_url} />
                              ) : null}
                              <AvatarFallback className="bg-gradient-to-br from-purple-100 to-blue-100 text-gray-700">
                                {booking.conversation_partners.name 
                                  ? booking.conversation_partners.name.charAt(0).toUpperCase()
                                  : (language === 'es' ? 'P' : '파')}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                              {booking.conversation_partners?.name || (language === 'es' ? 'Parceiro' : '파트너')}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                              {booking.topic}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4 mt-3 text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>{formatDate(booking.date, booking.start_time)}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end gap-2">
                        {getStatusBadge(booking.status)}
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 예약 생성 섹션 */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
          {language === 'es' ? 'Nueva Reserva' : '새 예약 만들기'}
        </h3>
        <VideoCallStarter onStartCall={handleStartCall} />
      </div>
    </div>
  )
}
