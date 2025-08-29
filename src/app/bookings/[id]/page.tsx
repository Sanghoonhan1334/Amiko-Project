'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/context/AuthContext'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import { Label } from '@/components/ui/label'
import { formatTimeOnly, formatDateOnly, convertToUserTimezone } from '@/lib/timezone'

interface Consultant {
  id: string
  name: string
  specialty: string
  timezone: string
  hourly_rate: number
}

interface Booking {
  id: string
  topic: string
  description: string
  start_at: string
  end_at: string
  duration: number
  price: number
  status: string
  consultant_id: string
  order_id: string
  created_at: string
  consultants: Consultant
}

export default function BookingDetailPage() {
  const { user } = useAuth()
  const router = useRouter()
  const params = useParams()
  const bookingId = params.id as string
  
  const [booking, setBooking] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [cancelling, setCancelling] = useState(false)

  // 예약 상세 정보 조회
  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const response = await fetch(`/api/bookings/${bookingId}`)
        if (!response.ok) {
          throw new Error('예약 정보를 불러올 수 없습니다.')
        }
        const data = await response.json()
        setBooking(data.booking)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    if (bookingId) {
      fetchBooking()
    }
  }, [bookingId])

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

  // 상태별 설명
  const getStatusDescription = (status: string) => {
    switch (status) {
      case 'confirmed':
        return '상담사가 예약을 확인했습니다. 결제가 완료되면 상담을 진행할 수 있습니다.'
      case 'pending':
        return '예약이 생성되었습니다. 결제를 완료하면 상담사가 확인 후 확정됩니다.'
      case 'cancelled':
        return '예약이 취소되었습니다. 새로운 예약을 생성할 수 있습니다.'
      case 'completed':
        return '상담이 완료되었습니다. 상담 후기를 남길 수 있습니다.'
      default:
        return '예약 상태를 확인할 수 없습니다.'
    }
  }

  // 예약 취소
  const handleCancel = async () => {
    if (!confirm('정말로 이 예약을 취소하시겠습니까?')) {
      return
    }

    setCancelling(true)
    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' }),
      })
      
      if (response.ok) {
        // 예약 상태 업데이트
        setBooking(prev => prev ? { ...prev, status: 'cancelled' } : null)
        alert('예약이 취소되었습니다.')
      } else {
        alert('예약 취소에 실패했습니다.')
      }
    } catch (error) {
      alert('예약 취소 중 오류가 발생했습니다.')
    } finally {
      setCancelling(false)
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

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h1 className="text-xl font-semibold mb-2">예약 정보 불러오는 중...</h1>
            <p className="text-gray-600">잠시만 기다려주세요.</p>
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
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              예약을 찾을 수 없습니다
            </h3>
            <p className="text-gray-600 mb-6">{error}</p>
            <Link href="/bookings">
              <Button>
                예약 목록으로 돌아가기
              </Button>
            </Link>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* 헤더 */}
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  예약 상세 정보
                </h1>
                <p className="text-gray-600">
                  예약 정보와 상담사 정보를 확인할 수 있습니다.
                </p>
              </div>
              <div className="flex space-x-3">
                <Link href="/bookings">
                  <Button variant="outline">
                    목록으로
                  </Button>
                </Link>
                <Link href="/booking/create">
                  <Button>
                    새 예약하기
                  </Button>
                </Link>
              </div>
            </div>

            {/* 예약 상태 */}
            <Card className="mb-6">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl mb-2">{booking.topic}</CardTitle>
                    <CardDescription className="text-base">
                      {getStatusDescription(booking.status)}
                    </CardDescription>
                  </div>
                  <div className="flex flex-col items-end space-y-2">
                    {getStatusBadge(booking.status)}
                    <span className="text-2xl font-bold text-blue-600">
                      ₩{booking.price.toLocaleString()}
                    </span>
                  </div>
                </div>
              </CardHeader>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 예약 정보 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <span>📅</span>
                    <span>예약 정보</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-600">상담 주제</Label>
                    <p className="text-lg font-medium">{booking.topic}</p>
                  </div>
                  
                  {booking.description && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-600">상세 설명</Label>
                      <p className="text-gray-700">{booking.description}</p>
                    </div>
                  )}

                  <Separator />

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-600">예약 날짜</Label>
                      <p className="font-medium">{formatDate(booking.start_at)}</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-600">상담 시간</Label>
                      <p className="font-medium">{formatTime(booking.start_at)} - {formatTime(booking.end_at)}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-600">상담 시간</Label>
                      <p className="font-medium">{booking.duration}분</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-600">예약 번호</Label>
                      <p className="font-mono text-sm">{booking.order_id}</p>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-600">예약 생성일</Label>
                    <p className="text-sm text-gray-600">{formatDate(booking.created_at)}</p>
                  </div>
                </CardContent>
              </Card>

              {/* 상담사 정보 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <span>👨‍🏫</span>
                    <span>상담사 정보</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {booking.consultants ? (
                    <>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-600">이름</Label>
                        <p className="text-lg font-medium">{booking.consultants.name}</p>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-600">전문 분야</Label>
                        <p className="text-gray-700">{booking.consultants.specialty}</p>
                      </div>

                      <Separator />

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-600">시간당 요금</Label>
                          <p className="font-medium">₩{booking.consultants.hourly_rate.toLocaleString()}</p>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-600">시간대</Label>
                          <p className="font-medium">{booking.consultants.timezone}</p>
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-600">상담 비용 계산</Label>
                        <p className="text-sm text-gray-600">
                          ₩{booking.consultants.hourly_rate.toLocaleString()} × {booking.duration / 60}시간 = ₩{booking.price.toLocaleString()}
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <p>상담사 정보를 불러올 수 없습니다.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* 액션 버튼 */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>예약 관리</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  {booking.status === 'pending' && (
                    <>
                      <Link href={`/payments/checkout?bookingId=${booking.id}&amount=${booking.price}`}>
                        <Button className="bg-green-600 hover:bg-green-700">
                          💳 결제하기
                        </Button>
                      </Link>
                      <Link href={`/bookings/${bookingId}/edit`}>
                        <Button variant="outline">
                          ✏️ 예약 변경
                        </Button>
                      </Link>
                      <Button 
                        variant="outline" 
                        className="text-red-600 hover:text-red-700"
                        onClick={handleCancel}
                        disabled={cancelling}
                      >
                        {cancelling ? '취소 중...' : '❌ 예약 취소'}
                      </Button>
                    </>
                  )}

                  {booking.status === 'confirmed' && (
                    <div className="text-green-600 font-medium">
                      ✅ 결제가 완료되었습니다. 상담사가 연락드릴 예정입니다.
                    </div>
                  )}

                  {booking.status === 'cancelled' && (
                    <div className="text-red-600 font-medium">
                      ❌ 예약이 취소되었습니다.
                    </div>
                  )}

                  {booking.status === 'completed' && (
                    <Link href={`/bookings/${bookingId}/review`}>
                      <Button variant="outline">
                        📝 상담 후기 작성
                      </Button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
