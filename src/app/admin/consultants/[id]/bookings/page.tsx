'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useLanguage } from '@/context/LanguageContext'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'


interface Consultant {
  id: string
  name: string
  email: string
  specialty: string
  hourly_rate: number
  timezone: string
}

interface Booking {
  id: string
  topic: string
  start_at: string
  end_at: string
  duration: number
  price: number
  status: string
  user_id: string
  created_at: string
  users: {
    email: string
  }
}

export default function ConsultantBookingsPage() {
  const params = useParams()
  const consultantId = params.id as string
  const { language } = useLanguage()
  const { token } = useAuth()
  const t = (ko: string, es: string) => language === 'ko' ? ko : es
  
  const [consultant, setConsultant] = useState<Consultant | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<string>('all')

  // 상담사 정보 및 예약 목록 조회
  useEffect(() => {
    const fetchData = async () => {
      try {
        // 상담사 정보 조회
        const consultantResponse = await fetch(`/api/admin/consultants/${consultantId}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (!consultantResponse.ok) {
          throw new Error(t('상담사 정보를 불러올 수 없습니다.', 'No se pudo cargar la información del consultor.'))
        }
        const consultantData = await consultantResponse.json()
        setConsultant(consultantData.consultant)

        // 상담사별 예약 목록 조회
        const bookingsResponse = await fetch(`/api/admin/consultants/${consultantId}/bookings`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (!bookingsResponse.ok) {
          throw new Error(t('예약 정보를 불러올 수 없습니다.', 'No se pudo cargar la información de reservas.'))
        }
        const bookingsData = await bookingsResponse.json()
        setBookings(bookingsData.bookings || [])
        setFilteredBookings(bookingsData.bookings || [])
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : t('알 수 없는 오류가 발생했습니다.', 'Ocurrió un error desconocido.'))
      } finally {
        setLoading(false)
      }
    }

    if (consultantId) {
      fetchData()
    }
  }, [consultantId])

  // 필터링 적용
  useEffect(() => {
    let filtered = [...bookings]

    // 상태별 필터링
    if (statusFilter !== 'all') {
      filtered = filtered.filter(booking => booking.status === statusFilter)
    }

    // 날짜별 필터링
    if (dateFilter !== 'all') {
      const today = new Date()
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      const nextWeek = new Date(today)
      nextWeek.setDate(nextWeek.getDate() + 7)

      switch (dateFilter) {
        case 'today':
          filtered = filtered.filter(booking => {
            const bookingDate = new Date(booking.start_at)
            return bookingDate.toDateString() === today.toDateString()
          })
          break
        case 'tomorrow':
          filtered = filtered.filter(booking => {
            const bookingDate = new Date(booking.start_at)
            return bookingDate.toDateString() === tomorrow.toDateString()
          })
          break
        case 'this_week':
          filtered = filtered.filter(booking => {
            const bookingDate = new Date(booking.start_at)
            return bookingDate >= today && bookingDate <= nextWeek
          })
          break
        case 'past':
          filtered = filtered.filter(booking => {
            const bookingDate = new Date(booking.start_at)
            return bookingDate < today
          })
          break
      }
    }

    setFilteredBookings(filtered)
  }, [bookings, statusFilter, dateFilter])

  // 상태별 배지 색상
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">{t('확인됨', 'Confirmado')}</Badge>
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">{t('대기 중', 'Pendiente')}</Badge>
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">{t('취소됨', 'Cancelado')}</Badge>
      case 'completed':
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">{t('완료됨', 'Completado')}</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  // 날짜 포맷팅
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString(language === 'ko' ? 'ko-KR' : 'es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    })
  }

  // 시간 포맷팅
  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString(language === 'ko' ? 'ko-KR' : 'es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // 예약 상태 변경
  const handleStatusChange = async (bookingId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus }),
      })
      
      if (response.ok) {
        // 예약 목록 새로고침
        window.location.reload()
      } else {
        alert(t('상태 변경에 실패했습니다.', 'No se pudo cambiar el estado.'))
      }
    } catch (error) {
      alert(t('상태 변경 중 오류가 발생했습니다.', 'Ocurrió un error al cambiar el estado.'))
    }
  }

  // 필터 초기화
  const resetFilters = () => {
    setStatusFilter('all')
    setDateFilter('all')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600 dark:border-gray-400 mx-auto mb-4"></div>
          <h1 className="text-xl font-semibold mb-2 dark:text-gray-100">{t('로딩 중...', 'Cargando...')}</h1>
          <p className="text-gray-600 dark:text-gray-400">{t('잠시만 기다려주세요.', 'Por favor espere un momento.')}</p>
        </div>
      </div>
    )
  }

  if (error || !consultant) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg max-w-md w-full text-center">
          <div className="text-red-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            {t('상담사 정보를 찾을 수 없습니다', 'No se encontró la información del consultor')}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <Link href="/admin/consultants">
            <Button>
              {t('상담사 목록으로 돌아가기', 'Volver a la lista de consultores')}
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-7xl mx-auto">
          {/* 헤더 */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <Link href="/admin/consultants">
                  <Button variant="outline" size="sm">
                    ← {t('상담사 목록', 'Lista de consultores')}
                  </Button>
                </Link>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  {consultant.name} - {t('예약 관리', 'Gestión de Reservas')}
                </h1>
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                {consultant.specialty} • {consultant.timezone} • ₩{consultant.hourly_rate.toLocaleString()}/{t('시간', 'hora')}
              </p>
            </div>
            <div className="flex space-x-3">
              <Link href={`/admin/consultants/${consultantId}`}>
                <Button variant="outline">
                  {t('상담사 정보', 'Info del consultor')}
                </Button>
              </Link>
              <Link href="/admin/consultants">
                <Button>
                  {t('상담사 목록', 'Lista de consultores')}
                </Button>
              </Link>
            </div>
          </div>

          {/* 통계 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium dark:text-gray-100">{t('총 예약', 'Total de reservas')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold dark:text-gray-100">{bookings.length}</div>
              </CardContent>
            </Card>
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium dark:text-gray-100">{t('대기 중', 'Pendiente')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {bookings.filter(b => b.status === 'pending').length}
                </div>
              </CardContent>
            </Card>
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium dark:text-gray-100">{t('확인됨', 'Confirmado')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {bookings.filter(b => b.status === 'confirmed').length}
                </div>
              </CardContent>
            </Card>
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium dark:text-gray-100">{t('완료됨', 'Completado')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {bookings.filter(b => b.status === 'completed').length}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 필터 섹션 */}
          {bookings.length > 0 && (
            <Card className="mb-6 dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-lg dark:text-gray-100">{t('필터', 'Filtros')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4 items-end">
                  {/* 상태별 필터 */}
                  <div className="space-y-2">
                    <Label htmlFor="status-filter" className="dark:text-gray-200">{t('상태', 'Estado')}</Label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-32 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="dark:bg-gray-700 dark:border-gray-600">
                        <SelectItem value="all">{t('전체', 'Todos')}</SelectItem>
                        <SelectItem value="pending">{t('대기 중', 'Pendiente')}</SelectItem>
                        <SelectItem value="confirmed">{t('확인됨', 'Confirmado')}</SelectItem>
                        <SelectItem value="completed">{t('완료됨', 'Completado')}</SelectItem>
                        <SelectItem value="cancelled">{t('취소됨', 'Cancelado')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* 날짜별 필터 */}
                  <div className="space-y-2">
                    <Label htmlFor="date-filter" className="dark:text-gray-200">{t('날짜', 'Fecha')}</Label>
                    <Select value={dateFilter} onValueChange={setDateFilter}>
                      <SelectTrigger className="w-40 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="dark:bg-gray-700 dark:border-gray-600">
                        <SelectItem value="all">{t('전체 기간', 'Todos los períodos')}</SelectItem>
                        <SelectItem value="today">{t('오늘', 'Hoy')}</SelectItem>
                        <SelectItem value="tomorrow">{t('내일', 'Mañana')}</SelectItem>
                        <SelectItem value="this_week">{t('이번 주', 'Esta semana')}</SelectItem>
                        <SelectItem value="past">{t('과거', 'Pasados')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* 필터 초기화 */}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={resetFilters}
                    className="ml-2"
                  >
                    {t('필터 초기화', 'Restablecer filtros')}
                  </Button>

                  {/* 결과 개수 */}
                  <div className="ml-auto text-sm text-gray-600 dark:text-gray-400">
                    {filteredBookings.length} {t('개 예약', 'reservas')}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 에러 메시지 */}
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg mb-6">
              <p className="text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* 예약 목록 */}
          {filteredBookings.length === 0 ? (
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardContent className="text-center py-12">
                {bookings.length === 0 ? (
                  <>
                    <div className="text-gray-400 mb-4">
                      <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      {t('예약 목록이 없습니다', 'No hay reservas')}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {t('이 상담사에 대한 예약이 생성되면 여기에 표시됩니다.', 'Las reservas para este consultor aparecerán aquí.')}
                    </p>
                  </>
                ) : (
                  <>
                    <div className="text-gray-400 mb-4">
                      <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      {t('필터 조건에 맞는 예약이 없습니다', 'No hay reservas que coincidan con los filtros')}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                      {t('필터를 조정해보세요.', 'Intente ajustar los filtros.')}
                    </p>
                    <Button variant="outline" onClick={resetFilters}>
                      {t('필터 초기화', 'Restablecer filtros')}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredBookings.map((booking) => (
                <Card key={booking.id} className="hover:shadow-md transition-shadow dark:bg-gray-800 dark:border-gray-700">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2 dark:text-gray-100">{booking.topic}</CardTitle>
                        <div className="space-y-1">
                          <CardDescription className="text-base">
                            📅 {formatDate(booking.start_at)} {formatTime(booking.start_at)} - {formatTime(booking.end_at)}
                          </CardDescription>
                          <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                            <span>👤 {booking.users?.email || t('알 수 없음', 'Desconocido')}</span>
                            <span>⏱️ {booking.duration}{t('분', ' min')}</span>
                            <span>💰 ₩{booking.price.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end space-y-2">
                        {getStatusBadge(booking.status)}
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {formatDate(booking.created_at)}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {t('예약 ID', 'ID de reserva')}: {booking.id}
                      </div>
                      <div className="flex space-x-2">
                        <Link href={`/bookings/${booking.id}`}>
                          <Button variant="outline" size="sm">
                            {t('상세보기', 'Ver detalles')}
                          </Button>
                        </Link>
                        
                        {/* 상태 변경 드롭다운 */}
                        <Select 
                          value={booking.status} 
                          onValueChange={(value) => handleStatusChange(booking.id, value)}
                        >
                          <SelectTrigger className="w-32 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="dark:bg-gray-700 dark:border-gray-600">
                            <SelectItem value="pending">{t('대기 중', 'Pendiente')}</SelectItem>
                            <SelectItem value="confirmed">{t('확인', 'Confirmar')}</SelectItem>
                            <SelectItem value="completed">{t('완료', 'Completar')}</SelectItem>
                            <SelectItem value="cancelled">{t('취소', 'Cancelar')}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
