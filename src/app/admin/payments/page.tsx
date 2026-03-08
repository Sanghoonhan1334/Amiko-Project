'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useLanguage } from '@/context/LanguageContext'
import { useAuth } from '@/context/AuthContext'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface Payment {
  id: string
  payment_key: string
  order_id: string
  amount: number
  status: string
  customer_email: string
  created_at: string
  booking_id?: string
}

export default function AdminPaymentsPage() {
  const { language } = useLanguage()
  const { token } = useAuth()
  const t = (ko: string, es: string) => language === 'ko' ? ko : es

  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  // 결제 목록 조회
  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const response = await fetch('/api/admin/payments', {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (!response.ok) {
          throw new Error(t('결제 목록을 불러올 수 없습니다.', 'No se pudo cargar la lista de pagos.'))
        }
        const data = await response.json()
        setPayments(data.payments || [])
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : t('알 수 없는 오류가 발생했습니다.', 'Ocurrió un error desconocido.'))
      } finally {
        setLoading(false)
      }
    }

    fetchPayments()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 필터링된 결제 목록
  const filteredPayments = payments.filter(payment => {
    const matchesSearch = 
      payment.order_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.customer_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.payment_key.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  // 상태별 배지 색상
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DONE':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">{t('완료', 'Completado')}</Badge>
      case 'CANCELED':
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">{t('취소됨', 'Cancelado')}</Badge>
      case 'ABORTED':
        return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">{t('중단됨', 'Interrumpido')}</Badge>
      case 'PENDING':
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">{t('대기중', 'Pendiente')}</Badge>
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

  // 총 결제 금액 계산
  const totalAmount = filteredPayments
    .filter(p => p.status === 'DONE')
    .reduce((sum, p) => sum + p.amount, 0)

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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('결제 관리', 'Gestión de Pagos')}</h1>
        <p className="text-gray-600 dark:text-gray-400">{t('모든 결제 내역을 조회하고 관리할 수 있습니다.', 'Consulta y gestiona todos los pagos.')}</p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('총 결제 건수', 'Total de Pagos')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredPayments.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('완료된 결제', 'Pagos Completados')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {filteredPayments.filter(p => p.status === 'DONE').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('총 결제 금액', 'Monto Total')}</CardTitle>
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
                placeholder={t('주문번호, 고객이메일, 결제키로 검색...', 'Buscar por número de orden, email, clave de pago...')}
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
                  <SelectItem value="DONE">{t('완료', 'Completado')}</SelectItem>
                  <SelectItem value="CANCELED">{t('취소됨', 'Cancelado')}</SelectItem>
                  <SelectItem value="ABORTED">{t('중단됨', 'Interrumpido')}</SelectItem>
                  <SelectItem value="PENDING">{t('대기중', 'Pendiente')}</SelectItem>
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

      {/* 결제 목록 */}
      <Card>
        <CardHeader>
          <CardTitle>{t('결제 내역', 'Historial de Pagos')}</CardTitle>
          <CardDescription>
            {filteredPayments.length}{t('개의 결제 내역이 있습니다.', ' registros de pago encontrados.')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredPayments.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              {t('검색 조건에 맞는 결제 내역이 없습니다.', 'No se encontraron pagos con los filtros aplicados.')}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b dark:border-gray-700">
                    <th className="text-left py-3 px-4 font-medium">{t('결제키', 'Clave de Pago')}</th>
                    <th className="text-left py-3 px-4 font-medium">{t('주문번호', 'Número de Orden')}</th>
                    <th className="text-left py-3 px-4 font-medium">{t('고객', 'Cliente')}</th>
                    <th className="text-left py-3 px-4 font-medium">{t('금액', 'Monto')}</th>
                    <th className="text-left py-3 px-4 font-medium">{t('상태', 'Estado')}</th>
                    <th className="text-left py-3 px-4 font-medium">{t('결제일', 'Fecha de Pago')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.map((payment) => (
                    <tr key={payment.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="py-3 px-4">
                        <code className="text-xs bg-gray-100 dark:bg-gray-700 dark:text-gray-300 px-2 py-1 rounded">
                          {payment.payment_key.slice(0, 20)}...
                        </code>
                      </td>
                      <td className="py-3 px-4">
                        <code className="text-xs bg-gray-100 dark:bg-gray-700 dark:text-gray-300 px-2 py-1 rounded">
                          {payment.order_id}
                        </code>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm">{payment.customer_email}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium">
                          ₩{payment.amount.toLocaleString()}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {getStatusBadge(payment.status)}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                        {formatDate(payment.created_at)}
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
