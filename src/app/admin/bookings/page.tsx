'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useLanguage } from '@/context/LanguageContext'
import { useAuth } from '@/context/AuthContext'

interface Booking {
  id: string
  user_id: string
  consultant_id: string
  topic: string
  description: string
  start_at: string
  end_at: string
  duration: number
  price: number
  order_id: string
  status: string
  created_at: string
}

export default function AdminBookingsPage() {
  const { language } = useLanguage()
  const { token } = useAuth()
  const t = (ko: string, es: string) => language === 'ko' ? ko : es

  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  // 예약 목록 조회
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const response = await fetch('/api/admin/bookings', {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (!response.ok) {
          throw new Error(t('예약 목록을 불러올 수 없습니다.', 'No se pudo cargar la lista de reservas.'))
        }
        const data = await response.json()
        setBookings(data.bookings || [])
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : t('알 수 없는 오류가 발생했습니다.', 'Ocurrió un error desconocido.'))
      } finally {
        setLoading(false)
      }
    }

    fetchBookings()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 필터링된 예약 목록
  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = 
      booking.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.order_id.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  // 상태별 배지 색상
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">{t('확정됨', 'Confirmada')}</Badge>
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">{t('대기중', 'Pendiente')}</Badge>
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">{t('취소됨', 'Cancelada')}</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  // 날짜 포맷팅
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString(language === 'ko' ? 'ko-KR' : 'es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // 총 예약 금액 계산
  const totalAmount = filteredBookings
    .filter(b => b.status === 'confirmed')
    .reduce((sum, b) => sum + b.price, 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600 dark:border-gray-400"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('예약 관리', 'Gestión de Reservas')}</h1>
        <p className="text-gray-600 dark:text-gray-400">{t('모든 예약 내역을 조회하고 관리할 수 있습니다.', 'Consulta y gestiona todas las reservas.')}</p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('총 예약 건수', 'Total de Reservas')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredBookings.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('확정된 예약', 'Reservas Confirmadas')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {filteredBookings.filter(b => b.status === 'confirmed').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('대기중인 예약', 'Reservas Pendientes')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {filteredBookings.filter(b => b.status === 'pending').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('총 예약 금액', 'Monto Total')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              ₩{totalAmount.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 필터 및 검색 */}
      <Card>
        <CardHeader>
          <CardTitle>{t('필터 및 검색', 'Filtros y Búsqueda')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder={t('상담 주제, 주문번호로 검색...', 'Buscar por tema, número de orden...')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="w-full md:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder={t('상태 선택', 'Seleccionar estado')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('모든 상태', 'Todos los estados')}</SelectItem>
                  <SelectItem value="confirmed">{t('확정됨', 'Confirmada')}</SelectItem>
                  <SelectItem value="pending">{t('대기중', 'Pendiente')}</SelectItem>
                  <SelectItem value="cancelled">{t('취소됨', 'Cancelada')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 에러 메시지 */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* 예약 목록 */}
      <Card>
        <CardHeader>
          <CardTitle>{t('예약 내역', 'Historial de Reservas')}</CardTitle>
          <CardDescription>
            {filteredBookings.length}{t('개의 예약 내역이 있습니다.', ' registros de reserva.')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredBookings.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              {t('검색 조건에 맞는 예약 내역이 없습니다.', 'No se encontraron reservas con los filtros aplicados.')}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b dark:border-gray-700">
                    <th className="text-left py-3 px-4 font-medium">{t('주문번호', 'Número de Orden')}</th>
                    <th className="text-left py-3 px-4 font-medium">{t('상담사', 'Consultor')}</th>
                    <th className="text-left py-3 px-4 font-medium">{t('주제', 'Tema')}</th>
                    <th className="text-left py-3 px-4 font-medium">{t('일정', 'Horario')}</th>
                    <th className="text-left py-3 px-4 font-medium">{t('금액', 'Monto')}</th>
                    <th className="text-left py-3 px-4 font-medium">{t('상태', 'Estado')}</th>
                    <th className="text-left py-3 px-4 font-medium">{t('예약일', 'Fecha de Reserva')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.map((booking) => (
                    <tr key={booking.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="py-3 px-4">
                        <code className="text-xs bg-gray-100 dark:bg-gray-800 dark:text-gray-300 px-2 py-1 rounded">
                          {booking.order_id}
                        </code>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm font-medium">
                          {booking.consultant_id || 'N/A'}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm max-w-xs truncate" title={booking.topic}>
                          {booking.topic}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm">
                          {formatDate(booking.start_at)}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {booking.duration}{t('분', 'min')}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium">
                          ₩{booking.price.toLocaleString()}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {getStatusBadge(booking.status)}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                        {formatDate(booking.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
