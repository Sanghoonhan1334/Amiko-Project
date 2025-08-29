'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

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
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  // 예약 목록 조회
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const response = await fetch('/api/admin/bookings')
        if (!response.ok) {
          throw new Error('예약 목록을 불러올 수 없습니다.')
        }
        const data = await response.json()
        setBookings(data.bookings || [])
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchBookings()
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
        return <Badge className="bg-green-100 text-green-800">확정됨</Badge>
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">대기중</Badge>
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800">취소됨</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  // 상담사 이름 가져오기
  const getConsultantName = (consultantId: string) => {
    const consultants = {
      '1': '김민수',
      '2': '이지영', 
      '3': '박준호'
    }
    return consultants[consultantId as keyof typeof consultants] || '상담사'
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

  // 총 예약 금액 계산
  const totalAmount = filteredBookings
    .filter(b => b.status === 'confirmed')
    .reduce((sum, b) => sum + b.price, 0)

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
        <h1 className="text-2xl font-bold text-gray-900">예약 관리</h1>
        <p className="text-gray-600">모든 예약 내역을 조회하고 관리할 수 있습니다.</p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 예약 건수</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredBookings.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">확정된 예약</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {filteredBookings.filter(b => b.status === 'confirmed').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">대기중인 예약</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {filteredBookings.filter(b => b.status === 'pending').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 예약 금액</CardTitle>
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
                placeholder="상담 주제, 주문번호로 검색..."
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
                  <SelectItem value="confirmed">확정됨</SelectItem>
                  <SelectItem value="pending">대기중</SelectItem>
                  <SelectItem value="cancelled">취소됨</SelectItem>
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

      {/* 예약 목록 */}
      <Card>
        <CardHeader>
          <CardTitle>예약 내역</CardTitle>
          <CardDescription>
            {filteredBookings.length}개의 예약 내역이 있습니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredBookings.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              검색 조건에 맞는 예약 내역이 없습니다.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium">주문번호</th>
                    <th className="text-left py-3 px-4 font-medium">상담사</th>
                    <th className="text-left py-3 px-4 font-medium">주제</th>
                    <th className="text-left py-3 px-4 font-medium">일정</th>
                    <th className="text-left py-3 px-4 font-medium">금액</th>
                    <th className="text-left py-3 px-4 font-medium">상태</th>
                    <th className="text-left py-3 px-4 font-medium">예약일</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.map((booking) => (
                    <tr key={booking.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {booking.order_id}
                        </code>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm font-medium">
                          {getConsultantName(booking.consultant_id)}
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
                        <div className="text-xs text-gray-500">
                          {booking.duration}분
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
                      <td className="py-3 px-4 text-sm text-gray-600">
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
