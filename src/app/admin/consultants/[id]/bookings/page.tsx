'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
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
        const consultantResponse = await fetch(`/api/admin/consultants/${consultantId}`)
        if (!consultantResponse.ok) {
          throw new Error('상담사 정보를 불러올 수 없습니다.')
        }
        const consultantData = await consultantResponse.json()
        setConsultant(consultantData.consultant)

        // 상담사별 예약 목록 조회
        const bookingsResponse = await fetch(`/api/admin/consultants/${consultantId}/bookings`)
        if (!bookingsResponse.ok) {
          throw new Error('예약 목록을 불러올 수 없습니다.')
        }
        const bookingsData = await bookingsResponse.json()
        setBookings(bookingsData.bookings || [])
        setFilteredBookings(bookingsData.bookings || [])
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.')
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
        return <Badge className="bg-green-100 text-green-800">확정됨</Badge>
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">대기중</Badge>
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800">취소됨</Badge>
      case 'completed':
        return <Badge className="bg-blue-100 text-blue-800">완료됨</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  // 날짜 포맷팅
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    })
  }

  // 시간 포맷팅
  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // 예약 상태 변경
  const handleStatusChange = async (bookingId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      
      if (response.ok) {
        // 예약 목록 새로고침
        window.location.reload()
      } else {
        alert('상태 변경에 실패했습니다.')
      }
    } catch (error) {
      alert('상태 변경 중 오류가 발생했습니다.')
    }
  }

  // 필터 초기화
  const resetFilters = () => {
    setStatusFilter('all')
    setDateFilter('all')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h1 className="text-xl font-semibold mb-2">데이터 불러오는 중...</h1>
          <p className="text-gray-600">잠시만 기다려주세요.</p>
        </div>
      </div>
    )
  }

  if (error || !consultant) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
          <div className="text-red-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            상담사 정보를 찾을 수 없습니다
          </h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link href="/admin/consultants">
            <Button>
              상담사 목록으로 돌아가기
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-7xl mx-auto">
          {/* 헤더 */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <Link href="/admin/consultants">
                  <Button variant="outline" size="sm">
                    ← 상담사 목록
                  </Button>
                </Link>
                <h1 className="text-3xl font-bold text-gray-900">
                  {consultant.name} 상담사 예약 관리
                </h1>
              </div>
              <p className="text-gray-600">
                {consultant.specialty} • {consultant.timezone} • ₩{consultant.hourly_rate.toLocaleString()}/시간
              </p>
            </div>
            <div className="flex space-x-3">
              <Link href={`/admin/consultants/${consultantId}`}>
                <Button variant="outline">
                  상담사 정보
                </Button>
              </Link>
              <Link href="/admin/consultants">
                <Button>
                  상담사 목록
                </Button>
              </Link>
            </div>
          </div>

          {/* 통계 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">전체 예약</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{bookings.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">대기중</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {bookings.filter(b => b.status === 'pending').length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">확정됨</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {bookings.filter(b => b.status === 'confirmed').length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">완료됨</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {bookings.filter(b => b.status === 'completed').length}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 필터 섹션 */}
          {bookings.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg">필터</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4 items-end">
                  {/* 상태별 필터 */}
                  <div className="space-y-2">
                    <Label htmlFor="status-filter">상태</Label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">전체</SelectItem>
                        <SelectItem value="pending">대기중</SelectItem>
                        <SelectItem value="confirmed">확정됨</SelectItem>
                        <SelectItem value="completed">완료됨</SelectItem>
                        <SelectItem value="cancelled">취소됨</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* 날짜별 필터 */}
                  <div className="space-y-2">
                    <Label htmlFor="date-filter">날짜</Label>
                    <Select value={dateFilter} onValueChange={setDateFilter}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">전체 기간</SelectItem>
                        <SelectItem value="today">오늘</SelectItem>
                        <SelectItem value="tomorrow">내일</SelectItem>
                        <SelectItem value="this_week">이번 주</SelectItem>
                        <SelectItem value="past">과거</SelectItem>
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
                    필터 초기화
                  </Button>

                  {/* 결과 개수 */}
                  <div className="ml-auto text-sm text-gray-600">
                    {filteredBookings.length}개 예약
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 에러 메시지 */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-6">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* 예약 목록 */}
          {filteredBookings.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                {bookings.length === 0 ? (
                  <>
                    <div className="text-gray-400 mb-4">
                      <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      아직 예약이 없습니다
                    </h3>
                    <p className="text-gray-600">
                      이 상담사에 대한 예약이 생성되면 여기에 표시됩니다.
                    </p>
                  </>
                ) : (
                  <>
                    <div className="text-gray-400 mb-4">
                      <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      필터 조건에 맞는 예약이 없습니다
                    </h3>
                    <p className="text-gray-600 mb-6">
                      필터를 조정해보세요.
                    </p>
                    <Button variant="outline" onClick={resetFilters}>
                      필터 초기화
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredBookings.map((booking) => (
                <Card key={booking.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2">{booking.topic}</CardTitle>
                        <div className="space-y-1">
                          <CardDescription className="text-base">
                            📅 {formatDate(booking.start_at)} {formatTime(booking.start_at)} - {formatTime(booking.end_at)}
                          </CardDescription>
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <span>👤 {booking.users?.email || '알 수 없음'}</span>
                            <span>⏱️ {booking.duration}분</span>
                            <span>💰 ₩{booking.price.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end space-y-2">
                        {getStatusBadge(booking.status)}
                        <div className="text-sm text-gray-500">
                          {formatDate(booking.created_at)}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-gray-600">
                        예약 ID: {booking.id}
                      </div>
                      <div className="flex space-x-2">
                        <Link href={`/bookings/${booking.id}`}>
                          <Button variant="outline" size="sm">
                            상세보기
                          </Button>
                        </Link>
                        
                        {/* 상태 변경 드롭다운 */}
                        <Select 
                          value={booking.status} 
                          onValueChange={(value) => handleStatusChange(booking.id, value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">대기중</SelectItem>
                            <SelectItem value="confirmed">확정</SelectItem>
                            <SelectItem value="completed">완료</SelectItem>
                            <SelectItem value="cancelled">취소</SelectItem>
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
