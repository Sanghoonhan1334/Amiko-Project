import { supabaseServer } from '@/lib/supabaseServer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CreditCard, Receipt, Calendar, User } from 'lucide-react'

interface Payment {
  id: string
  payment_key: string
  order_id: string
  amount: number
  status: string
  method: string
  receipt_url: string
  approved_at: string
  created_at: string
  bookings?: {
    topic: string
    start_at: string
    users?: {
      name: string
      email: string
    }
    consultants?: {
      name: string
      specialty: string
    }
  }
}

async function getPayments(): Promise<Payment[]> {
  try {
    // supabaseServer가 초기화되지 않았으면 빈 배열 반환
    if (!supabaseServer) {
      console.warn('[PAYMENTS] Supabase 서버 클라이언트가 초기화되지 않았습니다.')
      return []
    }

    const { data, error } = await supabaseServer
      .from('payments')
      .select(`
        *,
        bookings(
          topic,
          start_at,
          users(name, email),
          consultants(name, specialty)
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('결제 내역 조회 오류:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('결제 내역 조회 중 오류:', error)
    return []
  }
}

export default async function PaymentsPage() {
  const payments = await getPayments()

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: '대기중', className: 'bg-yellow-100 text-yellow-800' },
      confirmed: { label: '확정됨', className: 'bg-green-100 text-green-800' },
      cancelled: { label: '취소됨', className: 'bg-red-100 text-red-800' },
      failed: { label: '실패', className: 'bg-gray-100 text-gray-800' }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    return <Badge className={config.className}>{config.label}</Badge>
  }

  const getMethodBadge = (method: string) => {
    const methodConfig = {
      CARD: { label: '카드', className: 'bg-blue-100 text-blue-800' },
      TRANSFER: { label: '계좌이체', className: 'bg-green-100 text-green-800' },
      VIRTUAL_ACCOUNT: { label: '가상계좌', className: 'bg-purple-100 text-purple-800' },
      PHONE: { label: '휴대폰', className: 'bg-orange-100 text-orange-800' }
    }

    const config = methodConfig[method as keyof typeof methodConfig] || { label: method, className: 'bg-gray-100 text-gray-800' }
    return <Badge className={config.className}>{config.label}</Badge>
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatAmount = (amount: number) => {
    return amount.toLocaleString('ko-KR')
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">결제 내역</h1>
        <p className="text-gray-600">모든 결제 내역을 확인할 수 있습니다.</p>
      </div>

      {payments.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Receipt className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">결제 내역이 없습니다</h3>
            <p className="text-gray-500">아직 결제한 내역이 없습니다.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {payments.map((payment) => (
            <Card key={payment.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-2">
                      {payment.bookings?.topic || '상담 예약'}
                    </CardTitle>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      {getStatusBadge(payment.status)}
                      {getMethodBadge(payment.method)}
                      <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                        #{payment.order_id}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">
                      {formatAmount(payment.amount)}원
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">결제 키:</span>
                      <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                        {payment.payment_key?.slice(0, 20)}...
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">결제일:</span>
                      <span className="font-medium">
                        {formatDate(payment.created_at)}
                      </span>
                    </div>

                    {payment.approved_at && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">승인일:</span>
                        <span className="font-medium">
                          {formatDate(payment.approved_at)}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">예약자:</span>
                      <span className="font-medium">
                        {payment.bookings?.users?.name || payment.bookings?.users?.email || '익명'}
                      </span>
                    </div>

                    {payment.bookings?.consultants?.name && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">상담사:</span>
                        <span className="font-medium">
                          {payment.bookings.consultants.name}
                        </span>
                      </div>
                    )}

                    {payment.bookings?.start_at && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">상담 일시:</span>
                        <span className="font-medium">
                          {formatDate(payment.bookings.start_at)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {payment.receipt_url && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <a
                      href={payment.receipt_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      <Receipt className="w-4 h-4" />
                      영수증 보기
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
