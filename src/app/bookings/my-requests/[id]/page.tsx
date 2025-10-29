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

  // 예약 상세 정보 조회
  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const response = await fetch(`/api/bookings/my-requests/${bookingId}`)
        if (!response.ok) {
          throw new Error('No se pudo cargar la información de la reserva.')
        }
        const data = await response.json()
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
      const bookingDate = new Date(`${booking.date}T${booking.start_time}:00`)
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

  // 날짜 포맷팅
  const formatBookingDate = (date: string, time: string) => {
    try {
      const dateTime = new Date(`${date}T${time}:00`)
      return format(dateTime, "EEEE, d 'de' MMMM 'de' yyyy 'a las' HH:mm", { locale: es })
    } catch {
      return `${date} ${time}`
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
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
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
      <div className="min-h-screen bg-gray-50 pt-20 md:py-12 pb-8">
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
                      {formatBookingDate(booking.date, booking.start_time)}
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

