'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/context/AuthContext'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import PayPalPaymentButton from '@/components/payments/PayPalPaymentButton'

interface Consultant {
  id: string
  name: string
  specialty: string
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
}

function CheckoutContent() {
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const bookingId = searchParams.get('bookingId')
  
  const [booking, setBooking] = useState<Booking | null>(null)
  const [consultant, setConsultant] = useState<Consultant | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [processing, setProcessing] = useState(false)

  // 예약 정보 및 상담사 정보 조회
  useEffect(() => {
    const fetchData = async () => {
      if (!bookingId) {
        setError('예약 ID가 없습니다.')
        setLoading(false)
        return
      }

      try {
        // 예약 정보 조회
        const bookingResponse = await fetch(`/api/bookings/${bookingId}`)
        if (!bookingResponse.ok) {
          throw new Error('예약 정보를 불러올 수 없습니다.')
        }
        const bookingData = await bookingResponse.json()
        setBooking(bookingData.booking)

        // 상담사 정보 조회
        if (bookingData.booking.consultant_id) {
          const consultantResponse = await fetch(`/api/consultants/${bookingData.booking.consultant_id}`)
          if (consultantResponse.ok) {
            const consultantData = await consultantResponse.json()
            setConsultant(consultantData.consultant)
          }
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.')
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      fetchData()
    }
  }, [user, bookingId])

  // Stripe 결제는 StripePaymentButton 컴포넌트에서 처리

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
            <h1 className="text-xl font-semibold mb-2">결제 정보 불러오는 중...</h1>
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
            <div className="text-red-500 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              예약 정보를 찾을 수 없습니다
            </h3>
            <p className="text-gray-600 mb-6">
              {error || '요청하신 예약 정보가 존재하지 않습니다.'}
            </p>
            <Button onClick={() => router.push('/bookings')}>
              예약 목록으로 돌아가기
            </Button>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            {/* 헤더 */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                상담 예약 결제
              </h1>
              <p className="text-gray-600">
                예약 정보를 확인하고 상담 결제를 진행하세요.
              </p>
            </div>

            {/* 예약 정보 카드 */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-2xl">{booking.topic}</CardTitle>
                <CardDescription>
                  예약 번호: {booking.order_id}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* 상담 정보 */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">상담 정보</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">상담사</p>
                      <p className="font-medium">
                        {consultant ? `${consultant.name} (${consultant.specialty})` : '상담사 정보 없음'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">상담 주제</p>
                      <p className="font-medium">{booking.topic}</p>
                    </div>
                  </div>
                  {booking.description && (
                    <div className="mt-4">
                      <p className="text-sm text-gray-600">상세 설명</p>
                      <p className="font-medium">{booking.description}</p>
                    </div>
                  )}
                </div>

                <Separator />

                {/* 일정 정보 */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">일정 정보</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">상담 날짜</p>
                      <p className="font-medium">{formatDate(booking.start_at)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">상담 시간</p>
                      <p className="font-medium">
                        {formatTime(booking.start_at)} - {formatTime(booking.end_at)}
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* 결제 정보 */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">결제 정보</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">상담 시간</p>
                      <p className="font-medium">{booking.duration}분</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">상담사 시간당 요금</p>
                      <p className="font-medium">
                        {consultant ? `₩${consultant.hourly_rate.toLocaleString()}` : '정보 없음'}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-blue-900">총 결제 금액</span>
                      <span className="text-2xl font-bold text-blue-900">
                        ₩{booking.price.toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-blue-700 mt-1">
                      {booking.duration}분 × {consultant ? `₩${consultant.hourly_rate.toLocaleString()}/시간` : '시간당 요금'} ÷ 60
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 결제 버튼 */}
            <div className="text-center">
              <PayPalPaymentButton
                amount={booking.price * 100} // USD 센트 단위로 변환
                orderId={booking.order_id}
                orderName={`Amiko - ${booking.topic}`}
                customerName={user?.email?.split('@')[0] || '고객'}
                customerEmail={user?.email || ''}
                bookingId={booking.id}
                disabled={processing}
                className="w-full"
              />
              <p className="text-sm text-gray-600 mt-3">
                결제 완료 후 예약이 확정됩니다.
              </p>
              
              {/* 실제 결제 안내 */}
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center justify-center text-sm text-green-700">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  실제 결제가 진행됩니다. 신중하게 진행해주세요.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CheckoutContent />
    </Suspense>
  )
}
