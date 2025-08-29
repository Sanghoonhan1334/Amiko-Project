'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, XCircle, Calendar, Clock, User, CreditCard, AlertTriangle } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

interface CancelReason {
  value: string
  label: string
  description: string
}

const CANCEL_REASONS: CancelReason[] = [
  { value: 'schedule_conflict', label: '일정 변경', description: '개인 일정으로 인한 상담 일정 변경' },
  { value: 'personal_emergency', label: '개인 사정', description: '긴급한 개인 사정으로 인한 취소' },
  { value: 'consultant_change', label: '상담사 변경', description: '다른 상담사로 변경하고 싶음' },
  { value: 'service_unsatisfactory', label: '서비스 불만족', description: '서비스 품질에 대한 불만족' },
  { value: 'other', label: '기타', description: '기타 사유' }
]

function PaymentCancelContent() {
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  
  // 폼 데이터
  const [cancelReason, setCancelReason] = useState('')
  const [customReason, setCustomReason] = useState('')
  const [refundAmount, setRefundAmount] = useState('')
  
  // URL 파라미터
  const orderId = searchParams.get('orderId')
  const paymentKey = searchParams.get('paymentKey')
  const amount = searchParams.get('amount')

  useEffect(() => {
    if (amount) {
      setRefundAmount(amount)
    }
  }, [amount])

  const handleCancel = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!cancelReason) {
      setError('취소 사유를 선택해주세요.')
      return
    }

    if (cancelReason === 'other' && !customReason.trim()) {
      setError('기타 사유를 입력해주세요.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const finalReason = cancelReason === 'other' ? customReason : 
        CANCEL_REASONS.find(r => r.value === cancelReason)?.label || cancelReason

      const response = await fetch('/api/payments/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          paymentKey,
          orderId,
          cancelReason: finalReason,
          cancelAmount: parseInt(refundAmount)
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || '결제 취소에 실패했습니다.')
      }

      setSuccess(true)
      console.log('✅ 결제 취소 성공:', data)

    } catch (error) {
      console.error('❌ 결제 취소 실패:', error)
      setError(error instanceof Error ? error.message : '결제 취소에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  if (!orderId || !paymentKey) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
            <CardTitle className="text-red-600">잘못된 접근</CardTitle>
            <CardDescription>
              결제 취소에 필요한 정보가 누락되었습니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => router.push('/bookings')} className="w-full">
              예약 목록으로 돌아가기
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (success) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
              <XCircle className="w-12 h-12 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-green-600">결제가 취소되었습니다!</CardTitle>
            <CardDescription>
              환불은 3-5일 내에 처리됩니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2 text-green-800">취소 완료</h3>
              <p className="text-green-700 text-sm">
                결제 취소가 완료되었습니다. 환불 금액은 {parseInt(refundAmount).toLocaleString()}원입니다.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <Button onClick={() => router.push('/bookings')} className="w-full">
                예약 목록으로 돌아가기
              </Button>
              <Button onClick={() => router.push('/')} variant="outline" className="w-full">
                홈으로 돌아가기
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
          <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
            <AlertTriangle className="w-12 h-12 text-red-600" />
          </div>
          <CardTitle className="text-2xl text-red-600">결제 취소</CardTitle>
          <CardDescription>
            결제를 취소하시겠습니까? 취소 후 환불은 3-5일 내에 처리됩니다.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* 결제 정보 */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-3 flex items-center">
              <CreditCard className="w-5 h-5 mr-2" />
              취소할 결제 정보
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">주문 번호:</span>
                <p className="font-mono">{orderId}</p>
              </div>
              <div>
                <span className="text-gray-600">결제 금액:</span>
                <p className="font-semibold text-lg text-red-600">
                  {amount ? parseInt(amount).toLocaleString() : '0'}원
                </p>
              </div>
            </div>
          </div>

          {/* 취소 폼 */}
          <form onSubmit={handleCancel} className="space-y-6">
            {/* 취소 사유 선택 */}
            <div className="space-y-3">
              <Label htmlFor="cancelReason">취소 사유 *</Label>
              <Select value={cancelReason} onValueChange={setCancelReason}>
                <SelectTrigger>
                  <SelectValue placeholder="취소 사유를 선택해주세요" />
                </SelectTrigger>
                <SelectContent>
                  {CANCEL_REASONS.map((reason) => (
                    <SelectItem key={reason.value} value={reason.value}>
                      <div>
                        <div className="font-medium">{reason.label}</div>
                        <div className="text-sm text-gray-500">{reason.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 기타 사유 입력 */}
            {cancelReason === 'other' && (
              <div className="space-y-3">
                <Label htmlFor="customReason">기타 사유 *</Label>
                <Textarea
                  id="customReason"
                  placeholder="취소 사유를 자세히 입력해주세요"
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  rows={3}
                />
              </div>
            )}

            {/* 환불 금액 */}
            <div className="space-y-3">
              <Label htmlFor="refundAmount">환불 금액</Label>
              <Input
                id="refundAmount"
                type="number"
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                placeholder="환불할 금액을 입력하세요"
                min="0"
                max={amount || 0}
              />
              <p className="text-sm text-gray-500">
                전체 취소 시: {amount ? parseInt(amount).toLocaleString() : '0'}원
              </p>
            </div>

            {/* 경고 메시지 */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-yellow-600 mr-2 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium mb-1">⚠️ 취소 시 주의사항</p>
                  <ul className="space-y-1">
                    <li>• 취소 후 즉시 환불이 되지 않습니다</li>
                    <li>• 환불은 3-5일 내에 처리됩니다</li>
                    <li>• 취소된 예약은 복구할 수 없습니다</li>
                    <li>• 상담 시작 24시간 전까지 취소 가능합니다</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* 에러 메시지 */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                  <span className="text-red-800">{error}</span>
                </div>
              </div>
            )}

            {/* 액션 버튼들 */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                {loading ? '취소 처리 중...' : '결제 취소하기'}
              </Button>
              <Button
                type="button"
                onClick={() => router.back()}
                variant="outline"
                className="flex-1"
              >
                돌아가기
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default function PaymentCancelPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PaymentCancelContent />
    </Suspense>
  )
}
