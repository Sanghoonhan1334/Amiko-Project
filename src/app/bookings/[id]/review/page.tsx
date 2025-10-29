'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuth } from '@/context/AuthContext'
import ProtectedRoute from '@/components/auth/ProtectedRoute'

interface Consultant {
  id: string
  name: string
  specialty: string
}

interface Booking {
  id: string
  topic: string
  start_at: string
  end_at: string
  duration: number
  price: number
  status: string
  consultant_id: string
  created_at: string
  consultants: Consultant
}

export default function ReviewPage() {
  const { user } = useAuth()
  const params = useParams()
  const router = useRouter()
  const bookingId = params.id as string
  
  const [booking, setBooking] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  
  const [formData, setFormData] = useState({
    rating: '5',
    title: '',
    content: '',
    isAnonymous: false
  })

  // 예약 정보 조회
  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const response = await fetch(`/api/bookings/${bookingId}`)
        if (!response.ok) {
          throw new Error('예약 정보를 불러올 수 없습니다.')
        }
        const data = await response.json()
        setBooking(data.booking)
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.')
      } finally {
        setLoading(false)
      }
    }

    if (bookingId) {
      fetchBooking()
    }
  }, [bookingId])

  // 폼 제출 처리
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      // 필수 필드 검증
      if (!formData.title || !formData.content) {
        throw new Error('제목과 내용을 모두 입력해주세요.')
      }

      // 후기 데이터 생성
      const reviewData = {
        bookingId: bookingId,
        userId: user?.id,
        consultantId: booking?.consultant_id,
        rating: parseInt(formData.rating),
        title: formData.title,
        content: formData.content,
        isAnonymous: formData.isAnonymous
      }

      // 후기 작성 API 호출
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reviewData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || '후기 작성에 실패했습니다.')
      }

      alert('후기가 성공적으로 작성되었습니다.')
      router.push(`/bookings/${bookingId}`)
      
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.')
    } finally {
      setSaving(false)
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
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600 dark:border-gray-400 mx-auto mb-4"></div>
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

  // 후기 작성 불가능한 상태 체크
  if (booking.status !== 'completed') {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 py-12">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto">
              <Card>
                <CardContent className="text-center py-12">
                  <div className="text-red-400 mb-4">
                    <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    아직 후기를 작성할 수 없습니다
                  </h3>
                  <p className="text-gray-600 mb-6">
                    상담이 완료된 후에 후기를 작성할 수 있습니다.
                  </p>
                  <Link href={`/bookings/${bookingId}`}>
                    <Button>
                      예약 상세보기로 돌아가기
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                상담 후기 작성
              </h1>
              <p className="text-gray-600">
                상담 경험을 공유해주세요.
              </p>
            </div>

            {/* 예약 정보 요약 */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>상담 정보</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">상담 주제:</span>
                    <span className="font-medium">{booking.topic}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">상담사:</span>
                    <span className="font-medium">{booking.consultants?.name} ({booking.consultants?.specialty})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">상담 일시:</span>
                    <span className="font-medium">
                      {formatDate(booking.start_at)} {formatTime(booking.start_at)} - {formatTime(booking.end_at)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">상담 시간:</span>
                    <span className="font-medium">{booking.duration}분</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 후기 작성 폼 */}
            <Card>
              <CardHeader>
                <CardTitle>후기 작성</CardTitle>
                <CardDescription>
                  상담 경험에 대한 솔직한 의견을 남겨주세요.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* 평점 */}
                  <div className="space-y-2">
                    <Label htmlFor="rating">평점 *</Label>
                    <Select 
                      value={formData.rating} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, rating: value }))}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">⭐⭐⭐⭐⭐ 매우 만족 (5점)</SelectItem>
                        <SelectItem value="4">⭐⭐⭐⭐ 만족 (4점)</SelectItem>
                        <SelectItem value="3">⭐⭐⭐ 보통 (3점)</SelectItem>
                        <SelectItem value="2">⭐⭐ 불만족 (2점)</SelectItem>
                        <SelectItem value="1">⭐ 매우 불만족 (1점)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* 제목 */}
                  <div className="space-y-2">
                    <Label htmlFor="title">제목 *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="후기 제목을 입력하세요 (예: 정말 도움이 되었어요!)"
                      required
                    />
                  </div>

                  {/* 내용 */}
                  <div className="space-y-2">
                    <Label htmlFor="content">내용 *</Label>
                    <Textarea
                      id="content"
                      value={formData.content}
                      onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                      placeholder="상담 경험에 대한 자세한 후기를 작성해주세요. 상담사의 전문성, 상담 품질, 전반적인 만족도 등을 포함하여 작성하시면 됩니다."
                      rows={6}
                      required
                    />
                  </div>

                  {/* 익명 여부 */}
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isAnonymous"
                      checked={formData.isAnonymous}
                      onChange={(e) => setFormData(prev => ({ ...prev, isAnonymous: e.target.checked }))}
                      className="w-4 h-4"
                    />
                    <Label htmlFor="isAnonymous">
                      익명으로 작성하기
                    </Label>
                  </div>

                  {/* 에러 메시지 */}
                  {error && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-red-700 text-sm">{error}</p>
                    </div>
                  )}

                  {/* 버튼 그룹 */}
                  <div className="flex space-x-3">
                    <Link href={`/bookings/${bookingId}`} className="flex-1">
                      <Button variant="outline" className="w-full">
                        취소
                      </Button>
                    </Link>
                    <Button
                      type="submit"
                      className="flex-1"
                      disabled={saving || !formData.title || !formData.content}
                    >
                      {saving ? '저장 중...' : '후기 작성하기'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
