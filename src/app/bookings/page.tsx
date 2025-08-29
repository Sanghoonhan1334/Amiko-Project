import { supabaseServer } from '@/lib/supabaseServer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, User, MessageSquare } from 'lucide-react'

interface Booking {
  id: string
  topic: string
  start_at: string
  end_at: string
  duration: number
  price_cents: number
  status: string
  order_id: string
  created_at: string
  users?: {
    name: string
    email: string
  }
  consultants?: {
    name: string
    specialty: string
  }
}

async function getBookings(): Promise<Booking[]> {
  try {
    // supabaseServer가 초기화되지 않았으면 빈 배열 반환
    if (!supabaseServer) {
      console.warn('[BOOKINGS] Supabase 서버 클라이언트가 초기화되지 않았습니다.')
      return []
    }

    const { data, error } = await supabaseServer
      .from('bookings')
      .select(`
        *,
        users(name, email),
        consultants(name, specialty)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('예약 조회 오류:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('예약 조회 중 오류:', error)
    return []
  }
}

export default async function BookingsPage() {
  const bookings = await getBookings()

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: '대기중', className: 'bg-yellow-100 text-yellow-800' },
      confirmed: { label: '확정됨', className: 'bg-green-100 text-green-800' },
      cancelled: { label: '취소됨', className: 'bg-red-100 text-red-800' },
      completed: { label: '완료됨', className: 'bg-blue-100 text-blue-800' }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
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

  const formatPrice = (priceCents: number) => {
    return (priceCents / 100).toLocaleString('ko-KR')
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">예약 목록</h1>
        <p className="text-gray-600">모든 예약 내역을 확인할 수 있습니다.</p>
      </div>

      {bookings.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">예약이 없습니다</h3>
            <p className="text-gray-500">아직 예약한 상담이 없습니다.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {bookings.map((booking) => (
            <Card key={booking.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-2">{booking.topic}</CardTitle>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      {getStatusBadge(booking.status)}
                      <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                        #{booking.order_id}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">
                      {formatPrice(booking.price_cents)}원
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">상담사:</span>
                      <span className="font-medium">
                        {booking.consultants?.name || '미지정'}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">상담 일시:</span>
                      <span className="font-medium">
                        {formatDate(booking.start_at)}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">상담 시간:</span>
                      <span className="font-medium">{booking.duration}분</span>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">예약자:</span>
                      <span className="font-medium">
                        {booking.users?.name || booking.users?.email || '익명'}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">예약일:</span>
                      <span className="font-medium">
                        {formatDate(booking.created_at)}
                      </span>
                    </div>
                    
                    {booking.consultants?.specialty && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">전문분야:</span>
                        <span className="font-medium">
                          {booking.consultants.specialty}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
