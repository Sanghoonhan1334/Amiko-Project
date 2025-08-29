'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  // 결제 목록 조회
  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const response = await fetch('/api/admin/payments')
        if (!response.ok) {
          throw new Error('결제 목록을 불러올 수 없습니다.')
        }
        const data = await response.json()
        setPayments(data.payments || [])
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchPayments()
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
        return <Badge className="bg-green-100 text-green-800">완료</Badge>
      case 'CANCELED':
        return <Badge className="bg-red-100 text-red-800">취소됨</Badge>
      case 'ABORTED':
        return <Badge className="bg-gray-100 text-gray-800">중단됨</Badge>
      case 'PENDING':
        return <Badge className="bg-yellow-100 text-yellow-800">대기중</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  // 날짜 포맷팅
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ko-KR', {
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">결제 관리</h1>
        <p className="text-gray-600">모든 결제 내역을 조회하고 관리할 수 있습니다.</p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 결제 건수</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredPayments.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">완료된 결제</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {filteredPayments.filter(p => p.status === 'DONE').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 결제 금액</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              ₩{totalAmount.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 필터 및 검색 */}
      <Card>
        <CardHeader>
          <CardTitle>필터 및 검색</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="주문번호, 고객이메일, 결제키로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="w-full md:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="상태 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">모든 상태</SelectItem>
                  <SelectItem value="DONE">완료</SelectItem>
                  <SelectItem value="CANCELED">취소됨</SelectItem>
                  <SelectItem value="ABORTED">중단됨</SelectItem>
                  <SelectItem value="PENDING">대기중</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 에러 메시지 */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* 결제 목록 */}
      <Card>
        <CardHeader>
          <CardTitle>결제 내역</CardTitle>
          <CardDescription>
            {filteredPayments.length}개의 결제 내역이 있습니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredPayments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              검색 조건에 맞는 결제 내역이 없습니다.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium">결제키</th>
                    <th className="text-left py-3 px-4 font-medium">주문번호</th>
                    <th className="text-left py-3 px-4 font-medium">고객</th>
                    <th className="text-left py-3 px-4 font-medium">금액</th>
                    <th className="text-left py-3 px-4 font-medium">상태</th>
                    <th className="text-left py-3 px-4 font-medium">결제일</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.map((payment) => (
                    <tr key={payment.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {payment.payment_key.slice(0, 20)}...
                        </code>
                      </td>
                      <td className="py-3 px-4">
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">
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
                      <td className="py-3 px-4 text-sm text-gray-600">
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
