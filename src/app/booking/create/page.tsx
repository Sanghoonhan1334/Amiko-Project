'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAuth } from '@/context/AuthContext'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import { checkAuthAndRedirect } from '@/lib/auth-utils'
import { ArrowLeft, Calendar, Clock, User, AlertCircle, CheckCircle } from 'lucide-react'

interface Partner {
  id: string
  name: string
  avatar_url: string | null
  specialty: string | null
  status: string
}

interface AvailableSlot {
  id: string
  date: string
  start_time: string
  end_time: string
}

export default function CreateBookingPage() {
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const partnerIdFromUrl = searchParams.get('partnerId')
  
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null)
  const [partners, setPartners] = useState<Partner[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [error, setError] = useState('')
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([])
  
  const [formData, setFormData] = useState({
    partnerId: '',
    scheduleId: '',
    date: '',
    time: '',
    topic: '',
    description: ''
  })

  // URL에서 partnerId가 있으면 파트너 정보 로드
  useEffect(() => {
    if (partnerIdFromUrl) {
      fetchPartnerInfo(partnerIdFromUrl)
      setFormData(prev => ({ ...prev, partnerId: partnerIdFromUrl }))
    } else {
      fetchPartners()
    }
  }, [partnerIdFromUrl])

  // 파트너 정보 조회 (개별)
  const fetchPartnerInfo = async (partnerId: string) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/conversation-partners/${partnerId}`)
      if (!response.ok) {
        throw new Error('No se pudo cargar la información del amigo coreano.')
      }
      const data = await response.json()
      setSelectedPartner(data.partner)
      setFormData(prev => ({ ...prev, partnerId: partnerId }))
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error desconocido.')
    } finally {
      setLoading(false)
    }
  }

  // 파트너 목록 조회
  const fetchPartners = async () => {
    try {
      const response = await fetch('/api/conversation-partners')
      if (!response.ok) {
        throw new Error('No se pudo cargar la lista de amigos.')
      }
      const data = await response.json()
      // 한국인만 필터링
      const koreanPartners = (data.partners || []).filter((p: any) => p.country === '대한민국')
      setPartners(koreanPartners)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error desconocido.')
    }
  }

  // 파트너 선택 시
  const handlePartnerChange = (partnerId: string) => {
    const partner = partners.find(p => p.id === partnerId)
    if (partner) {
      setSelectedPartner(partner)
    }
    setFormData(prev => ({
      ...prev,
      partnerId,
      scheduleId: '',
      date: '',
      time: ''
    }))
    setAvailableSlots([])
  }

  // 날짜 선택 시 가능 시간 조회
  const handleDateChange = async (date: string) => {
    console.log('[예약 생성] 날짜 변경:', date)
    setFormData(prev => ({ ...prev, date, time: '', scheduleId: '' }))
    setAvailableSlots([])
    
    // partnerId 확인 (formData 또는 URL에서)
    const currentPartnerId = formData.partnerId || partnerIdFromUrl
    console.log('[예약 생성] 현재 partnerId:', currentPartnerId, 'formData.partnerId:', formData.partnerId, 'partnerIdFromUrl:', partnerIdFromUrl)
    
    if (currentPartnerId && date) {
      setLoadingSlots(true)
      setError('')
      try {
        const apiUrl = `/api/partners/${currentPartnerId}/available-slots?date=${date}`
        console.log('[예약 생성] 시간 슬롯 조회 시작:', apiUrl)
        const response = await fetch(apiUrl)
        console.log('[예약 생성] API 응답 상태:', response.status)
        
        if (response.ok) {
          const data = await response.json()
          console.log('[예약 생성] 시간 슬롯 데이터:', data)
          setAvailableSlots(data.slots || [])
          
          if (data.slots && data.slots.length === 0) {
            setError('No hay horarios disponibles para esta fecha. Por favor selecciona otra fecha.')
          } else {
            setError('')
          }
        } else {
          const errorData = await response.json().catch(() => ({ error: 'Error al cargar horarios' }))
          console.error('[예약 생성] API 에러:', errorData)
          setError(errorData.error || 'Error al cargar los horarios disponibles.')
        }
      } catch (error) {
        console.error('[예약 생성] 시간 슬롯 조회 예외:', error)
        setError('Error al cargar los horarios disponibles.')
      } finally {
        setLoadingSlots(false)
      }
    } else if (!currentPartnerId) {
      setError('Por favor selecciona un amigo coreano primero.')
    } else if (!date) {
      setError('Por favor selecciona una fecha.')
    }
  }

  // 파트너가 선택되면 날짜가 있으면 자동으로 시간 슬롯 로드
  useEffect(() => {
    const currentPartnerId = formData.partnerId || partnerIdFromUrl
    if (currentPartnerId && formData.date && availableSlots.length === 0 && !loadingSlots) {
      handleDateChange(formData.date)
    }
  }, [formData.partnerId, partnerIdFromUrl])

  // 폼 제출 처리
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // 인증 체크
    if (!checkAuthAndRedirect(user, router, 'Solicitud de reserva')) {
      setLoading(false)
      return
    }

    try {
      // 필수 필드 검증
      if (!formData.partnerId || !formData.scheduleId || !formData.topic) {
        throw new Error('Por favor completa todos los campos requeridos.')
      }

      // 선택한 스케줄 정보 가져오기
      const selectedSlot = availableSlots.find(s => s.id === formData.scheduleId)
      if (!selectedSlot) {
        throw new Error('No se encontró el horario seleccionado.')
      }

      // 종료 시간 계산: 시작 시간 + 20분
      const [startHour, startMinute] = selectedSlot.start_time.split(':').map(Number)
      const endMinutes = startMinute + 20
      const endHour = startHour + Math.floor(endMinutes / 60)
      const finalEndMinute = endMinutes % 60
      const calculatedEndTime = `${String(endHour).padStart(2, '0')}:${String(finalEndMinute).padStart(2, '0')}`

      const bookingData: any = {
        partner_id: formData.partnerId,
        schedule_id: formData.scheduleId,
        date: selectedSlot.date,
        start_time: selectedSlot.start_time,
        end_time: calculatedEndTime,
        duration: 20,
        topic: formData.topic,
        description: formData.description
      }

      // 예약 요청 API 호출
      const response = await fetch('/api/bookings/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al enviar la solicitud de reserva.')
      }

      alert('¡Solicitud de reserva enviada! Te notificaremos cuando sea confirmada.')
      router.push('/main?tab=me')
      
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error desconocido.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 pt-20 md:py-12 pb-8">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            {/* 뒤로가기 버튼 */}
            <div className="mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Volver</span>
              </Button>
            </div>
            
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Reserva de Videollamada
              </h1>
              <p className="text-gray-600">
                Selecciona un amigo coreano y solicita una reserva.
              </p>
            </div>

            {/* 파트너 정보 카드 (선택된 경우) */}
            {selectedPartner && (
              <Card className="mb-6 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-16 h-16">
                      {selectedPartner.avatar_url ? (
                        <AvatarImage 
                          src={selectedPartner.avatar_url} 
                          alt={selectedPartner.name}
                        />
                      ) : null}
                      <AvatarFallback className="bg-gradient-to-br from-purple-100 to-blue-100 text-gray-700 font-medium">
                        {selectedPartner.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{selectedPartner.name}</h3>
                      {selectedPartner.specialty && (
                        <p className="text-sm text-gray-600">{selectedPartner.specialty}</p>
                      )}
                      <Badge className="mt-1 bg-green-100 text-green-800">
                        {selectedPartner.status === 'online' ? 'En línea' : 'Desconectado'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Ingresar Información de Reserva</CardTitle>
                <CardDescription>
                  Por favor selecciona un amigo, fecha, hora y tema.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* 한국인 친구 선택 */}
                  {!partnerIdFromUrl && (
                    <div className="space-y-2">
                      <Label htmlFor="partner">Seleccionar Amigo Coreano *</Label>
                      <Select 
                        value={formData.partnerId} 
                        onValueChange={handlePartnerChange}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un amigo" />
                        </SelectTrigger>
                        <SelectContent>
                          {partners
                            .filter(p => p.status === 'online')
                            .map((partner) => (
                            <SelectItem key={partner.id} value={partner.id}>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{partner.name}</span>
                                <Badge variant="outline" className="text-xs">En línea</Badge>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* 날짜 선택 */}
                  <div className="space-y-2">
                    <Label htmlFor="date">Fecha *</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="date"
                        type="date"
                        value={formData.date}
                        onChange={(e) => handleDateChange(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        required
                        disabled={!formData.partnerId && !partnerIdFromUrl}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  {/* 가능한 시간 슬롯 선택 */}
                  <div className="space-y-2">
                    <Label htmlFor="time">Hora *</Label>
                    {!formData.partnerId && !partnerIdFromUrl ? (
                      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                        Por favor selecciona un amigo coreano primero.
                      </div>
                    ) : !formData.date ? (
                      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                        Por favor selecciona una fecha primero.
                      </div>
                    ) : loadingSlots ? (
                      <div className="p-4 bg-gray-50 rounded-lg text-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600 mx-auto mb-2"></div>
                        <p className="text-sm text-gray-600">Cargando horarios disponibles...</p>
                      </div>
                    ) : availableSlots.length > 0 ? (
                      <div className="space-y-3">
                        <p className="text-sm font-medium text-gray-700">
                          Horarios disponibles ({availableSlots.length}):
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {availableSlots.map((slot) => (
                            <button
                              key={slot.id}
                              type="button"
                              onClick={() => {
                                console.log('[예약 생성] 시간 슬롯 선택:', slot)
                                setFormData(prev => ({ ...prev, scheduleId: slot.id, time: slot.start_time }))
                              }}
                              className={`p-4 rounded-lg border-2 text-sm transition-all hover:scale-105 ${
                                formData.scheduleId === slot.id
                                  ? 'border-purple-500 bg-purple-50 text-purple-700 font-semibold shadow-md ring-2 ring-purple-200'
                                  : 'border-gray-200 hover:border-purple-300 bg-white hover:bg-purple-50'
                              }`}
                            >
                              <div className="flex flex-col items-center justify-center gap-1">
                                <Clock className={`w-4 h-4 ${formData.scheduleId === slot.id ? 'text-purple-600' : 'text-gray-500'}`} />
                                <span className="font-semibold text-base">{slot.start_time}</span>
                                {slot.end_time && (
                                  <p className="text-xs text-gray-500">~ {slot.end_time}</p>
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                        {formData.scheduleId && (
                          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                            <p className="text-sm text-green-700 flex items-center gap-2">
                              <CheckCircle className="w-4 h-4" />
                              <span>
                                <span className="font-semibold">Horario seleccionado:</span>{' '}
                                {availableSlots.find(s => s.id === formData.scheduleId)?.start_time}
                                {availableSlots.find(s => s.id === formData.scheduleId)?.end_time && 
                                  ` - ${availableSlots.find(s => s.id === formData.scheduleId)?.end_time}`
                                }
                              </span>
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                        <div className="flex items-center gap-2 mb-1">
                          <AlertCircle className="w-4 h-4" />
                          <span className="font-semibold">No hay horarios disponibles</span>
                        </div>
                        <p>Este amigo coreano no tiene horarios disponibles para esta fecha. Por favor selecciona otra fecha.</p>
                      </div>
                    )}
                  </div>

                  {/* 상담 시간 - 20분 고정 */}
                  <div className="space-y-2">
                    <Label htmlFor="duration">Duración de la Consulta</Label>
                    <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>20 minutos (fijo)</span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Actualmente todas las reservas se realizan en unidades de 20 minutos.
                    </p>
                  </div>

                  {/* 주제 */}
                  <div className="space-y-2">
                    <Label htmlFor="topic">Tema de Conversación *</Label>
                    <Input
                      id="topic"
                      value={formData.topic}
                      onChange={(e) => setFormData(prev => ({ ...prev, topic: e.target.value }))}
                      placeholder="Ej: Práctica de conversación en coreano, preguntas sobre la cultura coreana, etc."
                      required
                    />
                  </div>

                  {/* 상세 설명 */}
                  <div className="space-y-2">
                    <Label htmlFor="description">Descripción Detallada</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Ingresa el contenido específico de la conversación o tus preguntas"
                      rows={3}
                    />
                  </div>

                  {/* Google Meet 링크 안내 */}
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5" />
                      <p className="text-xs text-blue-800">
                        El enlace de Google Meet se generará automáticamente cuando tu reserva sea confirmada. Recibirás una notificación con el enlace.
                      </p>
                    </div>
                  </div>

                  {/* 에러 메시지 */}
                  {error && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-red-700 text-sm">{error}</p>
                    </div>
                  )}

                  {/* 제출 버튼 */}
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white"
                    disabled={loading || !formData.partnerId || !formData.scheduleId || !formData.topic}
                  >
                    {loading ? 'Enviando solicitud...' : 'Enviar Solicitud de Reserva'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}

