'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, Calendar, Clock, User, CreditCard, ArrowRight, AlertCircle } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

interface PaymentSuccessData {
  orderId: string
  paypalOrderId: string
  amount: number
}

function PaymentSuccessContent() {
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [paymentData, setPaymentData] = useState<PaymentSuccessData | null>(null)
  const [booking, setBooking] = useState<Record<string, unknown> | null>(null)

  useEffect(() => {
    const processPaymentSuccess = async () => {
      try {
        const paypalOrderId = searchParams.get('paypalOrderId')
        const orderId = searchParams.get('orderId')
        const amount = searchParams.get('amount')

        // URL 파라미터 검증
        if (!paypalOrderId || !orderId || !amount) {
          setError('필수 결제 정보가 누락되었습니다.')
          setLoading(false)
          return
        }

        // 결제 데이터 설정
        const paymentInfo = {
          orderId,
          paypalOrderId,
          amount: parseInt(amount)
        }
        setPaymentData(paymentInfo)

        // PayPal 결제가 완료되었으므로, 예약 정보만 조회
        await fetchBookingInfo(paymentInfo.orderId)
        
        setLoading(false)
      } catch (error) {
        console.error('결제 성공 처리 중 오류:', error)
        setError('결제 처리 중 오류가 발생했습니다.')
        setLoading(false)
      }
    }

    if (user) {
      processPaymentSuccess()
    }
  }, [user, searchParams])

  // 예약 정보 조회 (웹훅 처리 후)
  const fetchBookingInfo = async (orderId: string) => {
    try {
      // 잠시 대기 (웹훅 처리 시간 고려)
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // 예약 정보 조회
      const response = await fetch(`/api/bookings?orderId=${orderId}`)
      if (response.ok) {
        const data = await response.json()
        if (data.booking) {
          setBooking(data.booking)
        }
      }
    } catch (error) {
      console.error('예약 정보 조회 실패:', error)
      // 예약 정보 조회 실패는 치명적이지 않음
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600 dark:border-gray-400 mx-auto mb-4"></div>
            <p className="text-gray-600">결제를 처리하고 있습니다...</p>
            <p className="text-sm text-gray-500 mt-2">잠시만 기다려주세요</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <CardTitle className="text-red-600">결제 처리 실패</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-3">
            <p className="text-sm text-gray-600">
              결제 처리에 실패했습니다. 관리자에게 문의하거나 다시 시도해주세요.
            </p>
            <div className="space-y-2">
              <Button onClick={() => router.push('/bookings')} className="w-full">
                예약 목록으로 돌아가기
              </Button>
              <Button 
                onClick={() => window.location.reload()} 
                variant="outline" 
                className="w-full"
              >
                다시 시도
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <CardTitle className="text-2xl text-green-600">결제가 완료되었습니다!</CardTitle>
          <CardDescription>
            상담 예약이 성공적으로 확정되었습니다.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* 결제 정보 */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-3 flex items-center">
              <CreditCard className="w-5 h-5 mr-2" />
              결제 정보
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">주문 번호:</span>
                <p className="font-mono">{paymentData?.orderId}</p>
              </div>
              <div>
                <span className="text-gray-600">결제 금액:</span>
                <p className="font-semibold text-lg text-green-600">
                  ${((paymentData?.amount || 0) / 100).toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* 예약 정보 */}
          {booking ? (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-3 flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                예약 정보
              </h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <User className="w-4 h-4 mr-2 text-gray-600" />
                  <span className="text-gray-600 mr-2">상담사:</span>
                  <span className="font-semibold">{typeof booking.consultants === 'object' && booking.consultants && 'name' in booking.consultants ? String(booking.consultants.name) : 'N/A'}</span>
                </div>
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2 text-gray-600" />
                  <span className="text-gray-600 mr-2">상담 일시:</span>
                  <span className="font-semibold">
                    {typeof booking.start_at === 'string' ? new Date(booking.start_at).toLocaleString('ko-KR') : 'N/A'}
                  </span>
                </div>
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-2 text-gray-600" />
                  <span className="text-gray-600 mr-2">상담 시간:</span>
                  <span className="font-semibold">{typeof booking.duration === 'number' ? `${booking.duration}분` : 'N/A'}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-gray-600 mr-2">상담 주제:</span>
                  <span className="font-semibold">{typeof booking.topic === 'string' ? booking.topic : 'N/A'}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-3 flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                예약 정보 처리 중
              </h3>
              <p className="text-yellow-700 text-sm">
                예약 정보를 불러오는 중입니다. 웹훅 처리 후 자동으로 업데이트됩니다.
              </p>
            </div>
          )}

          {/* 상태 표시 */}
          <div className="flex items-center justify-center">
            <Badge className="bg-green-100 text-green-800 text-lg px-4 py-2">
              결제 완료
            </Badge>
          </div>

          {/* 안내 메시지 */}
          <div className="text-center text-gray-600 text-sm space-y-2">
            <p>상담 시작 1시간 전에 알림을 보내드립니다.</p>
            <p>상담 관련 문의사항이 있으시면 언제든 연락주세요.</p>
            <p className="text-xs text-gray-500 mt-2">
              💡 결제 처리는 PayPal로 완료되었습니다.
            </p>
          </div>

          {/* 액션 버튼들 */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={() => router.push('/bookings')}
              className="flex-1"
              variant="outline"
            >
              예약 목록 보기
            </Button>
            <Button
              onClick={() => router.push('/')}
              className="flex-1"
            >
              홈으로 돌아가기
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PaymentSuccessContent />
    </Suspense>
  )
}
