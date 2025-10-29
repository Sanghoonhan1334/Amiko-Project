'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Clock, 
  Video, 
  CheckCircle, 
  XCircle,
  Calendar,
  User,
  ArrowLeft,
  MessageSquare
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { convertKSTToUserTimezone } from '@/lib/timezone-converter'

// timezone의 UTC 오프셋 가져오기 (시간 단위)
function getTimezoneOffset(timezone: string): number {
  try {
    const now = new Date()
    const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000)
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: '2-digit',
      hour12: false,
      timeZoneName: 'short'
    })
    
    const parts = formatter.formatToParts(now)
    const timezoneName = parts.find(p => p.type === 'timeZoneName')?.value || ''
    
    // "+05:00" 형식에서 숫자 추출
    const match = timezoneName.match(/([+-]?)(\d{1,2}):?(\d{2})?/)
    if (match) {
      const sign = match[1] === '-' ? -1 : 1
      const hours = parseInt(match[2] || '0', 10)
      const minutes = parseInt(match[3] || '0', 10)
      return sign * (hours + minutes / 60)
    }
    
    // 대체 방법: 현재 시간을 해당 timezone으로 변환하여 UTC와의 차이 계산
    const utcDate = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }))
    const tzDate = new Date(now.toLocaleString('en-US', { timeZone: timezone }))
    return (tzDate.getTime() - utcDate.getTime()) / (1000 * 60 * 60)
  } catch {
    return 0
  }
}

interface BookingRequest {
  id: string
  partner_id: string
  user_id: string
  date: string
  start_time: string
  end_time: string
  duration: number
  topic: string
  description: string
  meet_url: string | null
  status: 'pending' | 'approved' | 'rejected'
  rejection_reason: string | null
  created_at: string
  approved_at: string | null
  // 원본 KST 시간 (DB에 저장된 값)
  kst_date?: string
  kst_start_time?: string
  kst_end_time?: string
  // 사용자 timezone 정보
  user_timezone?: string
  conversation_partners: {
    name: string
    avatar_url: string | null
    specialty: string | null
  }
}

export default function BookingDetailPage() {
  const { user } = useAuth()
  const router = useRouter()
  const params = useParams()
  const bookingId = params.id as string
  
  const [booking, setBooking] = useState<BookingRequest | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [timeUntilBooking, setTimeUntilBooking] = useState<string>('')
  const [canJoinMeeting, setCanJoinMeeting] = useState(false)
  const [userTimezone, setUserTimezone] = useState<string>('America/Lima') // 사용자 timezone

  // 사용자 프로필 timezone 가져오기 (예약 생성 페이지와 동일한 로직)
  useEffect(() => {
    const fetchUserTimezone = async () => {
      if (!user?.id) return
      
      try {
        const response = await fetch(`/api/profile?userId=${user.id}`)
        if (response.ok) {
          const data = await response.json()
          
          // 회원가입 시 입력한 국적 정보 사용
          const signupCountry = data.user?.user_metadata?.country
          
          // 회원가입 시 입력한 국적을 타임존으로 매핑 (예약 생성 페이지와 동일)
          const countryToTimezone: Record<string, string> = {
            'KR': 'Asia/Seoul',
            '대한민국': 'Asia/Seoul',
            'South Korea': 'Asia/Seoul',
            'Korea': 'Asia/Seoul',
            'KOR': 'Asia/Seoul',
            'PE': 'America/Lima',
            'CO': 'America/Bogota',
            'MX': 'America/Mexico_City',
            'CL': 'America/Santiago',
            'AR': 'America/Buenos_Aires',
            'BR': 'America/Sao_Paulo',
            'US': 'America/New_York',
            'ES': 'Europe/Madrid',
          }
          
          let determinedTimezone = 'America/Lima' // 기본값
          
          if (signupCountry) {
            const mappedTimezone = countryToTimezone[signupCountry]
            if (mappedTimezone) {
              determinedTimezone = mappedTimezone
            }
          }
          
          setUserTimezone(determinedTimezone)
          console.log('[BookingDetailPage] 사용자 timezone 설정:', determinedTimezone, 'signupCountry:', signupCountry)
        }
      } catch (error) {
        console.error('[BookingDetailPage] timezone 가져오기 실패:', error)
        // 기본값 유지
      }
    }
    
    fetchUserTimezone()
  }, [user?.id])

  // 예약 상세 정보 조회
  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const response = await fetch(`/api/bookings/my-requests/${bookingId}`, {
          credentials: 'include' // 쿠키 포함
        })
        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('No autorizado. Por favor inicia sesión nuevamente.')
          } else if (response.status === 404) {
            throw new Error('No se encontró la reserva.')
          }
          throw new Error('No se pudo cargar la información de la reserva.')
        }
        const data = await response.json()
        
        // API에서 받은 user_timezone이 있으면 사용
        if (data.booking.user_timezone) {
          setUserTimezone(data.booking.user_timezone)
        }
        
        setBooking(data.booking)
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Ocurrió un error desconocido.')
      } finally {
        setLoading(false)
      }
    }

    if (bookingId) {
      fetchBooking()
    }
  }, [bookingId])

  // 예약 시간 계산 및 참여 가능 여부 체크
  useEffect(() => {
    if (!booking || booking.status !== 'approved') return

    const updateTimeCheck = () => {
      // KST 시간을 사용자 timezone으로 변환 (예약 생성 페이지와 동일한 로직)
      const kstDate = booking.kst_date || booking.date
      const kstTime = booking.kst_start_time || booking.start_time
      const timezone = booking.user_timezone || userTimezone
      
      const userDateAndTime = convertKSTToUserTimezone(kstDate, kstTime, timezone)
      
      // 변환된 날짜/시간으로 Date 객체 생성
      // 주의: 이 날짜/시간은 사용자 timezone 기준이므로, 해당 timezone으로 해석해야 함
      const [year, month, day] = userDateAndTime.date.split('-').map(Number)
      const [hour, minute] = userDateAndTime.time.split(':').map(Number)
      
      // 해당 timezone의 날짜/시간을 나타내는 UTC timestamp 계산
      // 로컬 timezone으로 Date 객체 생성
      const localDate = new Date(year, month - 1, day, hour, minute, 0)
      
      // 로컬 timezone 오프셋과 대상 timezone 오프셋 차이 계산
      const localOffsetMs = localDate.getTimezoneOffset() * 60000
      const targetOffset = getTimezoneOffset(timezone)
      const targetOffsetMs = targetOffset * 3600000
      
      // UTC 시간 계산 후 대상 timezone으로 변환
      const utcTime = localDate.getTime() - localOffsetMs
      const targetTime = utcTime + targetOffsetMs
      const bookingDate = new Date(targetTime)
      
      const now = new Date()
      const diffMs = bookingDate.getTime() - now.getTime()
      const diffMinutes = Math.floor(diffMs / (1000 * 60))

      // 예약 시간 5분 전부터 참여 가능
      if (diffMinutes <= -booking.duration) {
        // 상담 종료됨
        setCanJoinMeeting(false)
        setTimeUntilBooking('Finalizada')
      } else if (diffMinutes <= 5) {
        // 참여 가능
        setCanJoinMeeting(true)
        setTimeUntilBooking('Disponible ahora')
      } else {
        // 대기 중
        setCanJoinMeeting(false)
        const hours = Math.floor(diffMinutes / 60)
        const mins = diffMinutes % 60
        if (hours > 0) {
          setTimeUntilBooking(`En ${hours}h ${mins}m`)
        } else {
          setTimeUntilBooking(`En ${mins}m`)
        }
      }
    }

    updateTimeCheck()
    const interval = setInterval(updateTimeCheck, 60000) // 매분 업데이트

    return () => clearInterval(interval)
  }, [booking])

  // Google Meet 참여
  const handleJoinMeeting = () => {
    if (!booking?.meet_url) {
      alert('No hay enlace de Google Meet disponible.')
      return
    }
    
    // 새 탭에서 Google Meet 열기
    window.open(booking.meet_url, '_blank')
    
    // 상담 페이지로 이동
    router.push(`/call/${bookingId}`)
  }

  // 날짜 포맷팅 (예약 생성 페이지와 동일한 로직 사용)
  // KST 시간을 사용자 timezone으로 변환한 후 포맷팅
  const formatBookingDate = (booking: BookingRequest | null) => {
    if (!booking) return ''
    
    try {
      // API에서 받은 원본 KST 시간 사용 (예약 생성 시 저장된 값)
      const kstDate = booking.kst_date || booking.date
      const kstTime = booking.kst_start_time || booking.start_time
      const timezone = booking.user_timezone || userTimezone
      
      console.log('[formatBookingDate] 변환 전:', { kstDate, kstTime, timezone })
      
      // 예약 생성 시와 동일한 변환 로직 사용
      const userDateAndTime = convertKSTToUserTimezone(kstDate, kstTime, timezone)
      
      console.log('[formatBookingDate] 변환 후:', userDateAndTime)
      
      // 변환된 날짜/시간 파싱
      const [year, month, day] = userDateAndTime.date.split('-').map(Number)
      const [hour, minute] = userDateAndTime.time.split(':').map(Number)
      
      // 스페인어 월 이름
      const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 
                     'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
      const weekdays = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
      
      // 요일 계산 (변환된 날짜 기준)
      const dateObj = new Date(year, month - 1, day)
      const weekday = weekdays[dateObj.getDay()]
      
      return `${weekday}, ${day} de ${months[month - 1]} de ${year} a las ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
    } catch (error) {
      console.error('[formatBookingDate] 포맷팅 오류:', error)
      // 오류 시 간단한 포맷 반환
      const fallbackDate = booking.kst_date || booking.date
      const fallbackTime = booking.kst_start_time || booking.start_time
      return `${fallbackDate} ${fallbackTime}`
    }
  }

  // 상태별 배지
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <Badge className="bg-green-100 text-green-800 border-green-300">
            <CheckCircle className="w-3 h-3 mr-1" />
            Confirmada
          </Badge>
        )
      case 'pending':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
            <Clock className="w-3 h-3 mr-1" />
            Pendiente
          </Badge>
        )
      case 'rejected':
        return (
          <Badge className="bg-red-100 text-red-800 border-red-300">
            <XCircle className="w-3 h-3 mr-1" />
            Rechazada
          </Badge>
        )
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  // 상태별 설명
  const getStatusDescription = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Tu reserva ha sido confirmada. El enlace de Google Meet está disponible.'
      case 'pending':
        return 'Tu solicitud de reserva está siendo revisada. Te notificaremos cuando sea confirmada.'
      case 'rejected':
        return booking?.rejection_reason 
          ? `Tu reserva fue rechazada: ${booking.rejection_reason}`
          : 'Tu reserva fue rechazada.'
      default:
        return 'Estado desconocido.'
    }
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600 dark:border-gray-400 mx-auto mb-4"></div>
            <h1 className="text-xl font-semibold mb-2">Cargando información de la reserva...</h1>
            <p className="text-gray-600">Por favor espera un momento.</p>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  if (error || !booking) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
            <div className="text-red-400 mb-4">
              <XCircle className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No se encontró la reserva
            </h3>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button onClick={() => router.push('/main?tab=meet')}>
              Volver al inicio
            </Button>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 pt-20 md:pt-32 pb-8">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* 헤더 */}
            <div className="mb-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Volver</span>
              </Button>
              
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    Detalle de la Reserva
                  </h1>
                  <p className="text-gray-600">
                    Información de tu reserva de videollamada
                  </p>
                </div>
                {getStatusBadge(booking.status)}
              </div>
            </div>

            {/* 예약 상태 카드 */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-xl mb-2">{booking.topic}</CardTitle>
                <p className="text-gray-600">
                  {getStatusDescription(booking.status)}
                </p>
              </CardHeader>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 예약 정보 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Calendar className="w-5 h-5" />
                    <span>Información de la Reserva</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-600">Tema de conversación</p>
                    <p className="text-lg font-medium">{booking.topic}</p>
                  </div>
                  
                  {booking.description && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-600">Descripción</p>
                      <p className="text-gray-700">{booking.description}</p>
                    </div>
                  )}

                  <div className="space-y-2 pt-2 border-t">
                    <p className="text-sm font-medium text-gray-600">Fecha y hora</p>
                    <p className="font-medium">
                      {(() => {
                        // 디버깅: 직접 변환 실행
                        if (booking.kst_date && booking.kst_start_time && (booking.user_timezone || userTimezone)) {
                          const kstDate = booking.kst_date || booking.date
                          const kstTime = booking.kst_start_time || booking.start_time
                          const timezone = booking.user_timezone || userTimezone
                          console.log('[렌더링] 변환 실행:', { kstDate, kstTime, timezone })
                          const converted = convertKSTToUserTimezone(kstDate, kstTime, timezone)
                          console.log('[렌더링] 변환 결과:', converted)
                          const [year, month, day] = converted.date.split('-').map(Number)
                          const [hour, minute] = converted.time.split(':').map(Number)
                          const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 
                                         'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
                          const weekdays = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
                          const dateObj = new Date(year, month - 1, day)
                          const weekday = weekdays[dateObj.getDay()]
                          return `${weekday}, ${day} de ${months[month - 1]} de ${year} a las ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
                        }
                        return formatBookingDate(booking)
                      })()}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-600">Duración</p>
                    <p className="font-medium">{booking.duration} minutos</p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-600">Fecha de solicitud</p>
                    <p className="text-sm text-gray-600">
                      {format(new Date(booking.created_at), "d 'de' MMMM 'de' yyyy 'a las' HH:mm", { locale: es })}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* 파트너 정보 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <User className="w-5 h-5" />
                    <span>Información del Amigo Coreano</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {booking.conversation_partners ? (
                    <>
                      <div className="flex items-center gap-3">
                        <Avatar className="w-16 h-16">
                          {booking.conversation_partners.avatar_url ? (
                            <AvatarImage 
                              src={booking.conversation_partners.avatar_url} 
                              alt={booking.conversation_partners.name}
                            />
                          ) : null}
                          <AvatarFallback className="bg-gradient-to-br from-purple-100 to-blue-100 text-gray-700 font-medium">
                            {booking.conversation_partners.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-lg font-medium">{booking.conversation_partners.name}</p>
                          {booking.conversation_partners.specialty && (
                            <p className="text-sm text-gray-600">{booking.conversation_partners.specialty}</p>
                          )}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <p>No se pudo cargar la información del amigo coreano.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* 액션 버튼 */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Acciones</CardTitle>
              </CardHeader>
              <CardContent>
                {booking.status === 'pending' && (
                  <div className="space-y-4">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-5 h-5 text-yellow-600" />
                        <p className="font-semibold text-yellow-900">Esperando confirmación</p>
                      </div>
                      <p className="text-sm text-yellow-800">
                        Tu solicitud está siendo revisada. Te notificaremos cuando sea confirmada.
                      </p>
                    </div>
                  </div>
                )}

                {booking.status === 'approved' && (
                  <div className="space-y-4">
                    {booking.meet_url ? (
                      <>
                        {canJoinMeeting ? (
                          <div className="space-y-4">
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                              <div className="flex items-center gap-2 mb-2">
                                <CheckCircle className="w-5 h-5 text-green-600" />
                                <p className="font-semibold text-green-900">¡Listo para unirse!</p>
                              </div>
                              <p className="text-sm text-green-800 mb-4">
                                {timeUntilBooking}
                              </p>
                              <Button 
                                onClick={handleJoinMeeting}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                                size="lg"
                              >
                                <Video className="w-5 h-5 mr-2" />
                                Unirse a Google Meet
                              </Button>
                            </div>
                            <p className="text-xs text-gray-500 text-center">
                              Al hacer clic, se abrirá Google Meet en una nueva pestaña.
                            </p>
                          </div>
                        ) : (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <Clock className="w-5 h-5 text-blue-600" />
                              <p className="font-semibold text-blue-900">Reserva confirmada</p>
                            </div>
                            <p className="text-sm text-blue-800 mb-2">
                              {timeUntilBooking !== 'Finalizada' 
                                ? `Puedes unirte en: ${timeUntilBooking}` 
                                : 'Esta reserva ya ha finalizado.'}
                            </p>
                            {timeUntilBooking !== 'Finalizada' && (
                              <p className="text-xs text-gray-600">
                                Podrás unirte 5 minutos antes de la hora programada.
                              </p>
                            )}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <p className="text-gray-600">
                          El enlace de Google Meet se generará pronto. Por favor espera.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {booking.status === 'rejected' && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <XCircle className="w-5 h-5 text-red-600" />
                      <p className="font-semibold text-red-900">Reserva rechazada</p>
                    </div>
                    {booking.rejection_reason && (
                      <p className="text-sm text-red-800 mb-2">
                        Razón: {booking.rejection_reason}
                      </p>
                    )}
                    <p className="text-sm text-red-700">
                      Puedes crear una nueva reserva con otro horario.
                    </p>
                    <Button 
                      onClick={() => router.push('/booking/create')}
                      className="mt-4 w-full"
                      variant="outline"
                    >
                      Crear nueva reserva
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}

