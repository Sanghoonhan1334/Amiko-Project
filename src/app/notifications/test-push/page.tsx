'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Bell, Send, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import ProtectedRoute from '@/components/auth/ProtectedRoute'

export default function TestPushNotificationPage() {
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    title: '🧪 테스트 알림',
    body: '이것은 테스트 푸시 알림입니다!',
    type: 'test',
    url: '/notifications'
  })
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setIsLoading(true)
    setError('')
    setResult(null)

    try {
      const response = await fetch('/api/notifications/send-push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: user.id,
          title: formData.title,
          body: formData.body,
          data: {
            type: formData.type,
            url: formData.url,
            timestamp: new Date().toISOString()
          },
          tag: formData.type
        })
      })

      const data = await response.json()

      if (response.ok) {
        setResult(data)
      } else {
        setError(data.message || '푸시 알림 발송에 실패했습니다.')
      }
    } catch (error) {
      console.error('푸시 알림 발송 중 오류:', error)
      setError('푸시 알림 발송 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const getPresetNotification = (type: string) => {
    const presets = {
      'booking_reminder': {
        title: '📅 상담 시작 1시간 전',
        body: '곧 상담이 시작됩니다. 준비해주세요!',
        url: '/bookings'
      },
      'payment_confirmed': {
        title: '💳 결제 완료',
        body: '상담 예약이 확정되었습니다.',
        url: '/bookings'
      },
      'consultation_completed': {
        title: '✅ 상담 완료',
        body: '상담이 완료되었습니다. 후기를 작성해주세요!',
        url: '/bookings'
      },
      'system_maintenance': {
        title: '🔧 시스템 점검',
        body: '시스템 점검이 예정되어 있습니다.',
        url: '/notifications'
      }
    }

    const preset = presets[type as keyof typeof presets]
    if (preset) {
      setFormData(prev => ({
        ...prev,
        title: preset.title,
        body: preset.body,
        url: preset.url,
        type
      }))
    }
  }

  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">푸시 알림 테스트</h1>
          <p className="text-gray-600">
            푸시 알림 시스템을 테스트하고 디버깅할 수 있습니다.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              테스트 알림 발송
            </CardTitle>
            <CardDescription>
              자신에게 테스트 푸시 알림을 보내보세요.
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 프리셋 선택 */}
              <div className="space-y-2">
                <Label htmlFor="preset">프리셋 알림</Label>
                <Select onValueChange={getPresetNotification}>
                  <SelectTrigger>
                    <SelectValue placeholder="프리셋을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="test">🧪 테스트 알림</SelectItem>
                    <SelectItem value="booking_reminder">📅 상담 시작 알림</SelectItem>
                    <SelectItem value="payment_confirmed">💳 결제 완료 알림</SelectItem>
                    <SelectItem value="consultation_completed">✅ 상담 완료 알림</SelectItem>
                    <SelectItem value="system_maintenance">🔧 시스템 점검 알림</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 제목 */}
              <div className="space-y-2">
                <Label htmlFor="title">알림 제목</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="알림 제목을 입력하세요"
                  required
                />
              </div>

              {/* 내용 */}
              <div className="space-y-2">
                <Label htmlFor="body">알림 내용</Label>
                <Textarea
                  id="body"
                  value={formData.body}
                  onChange={(e) => handleInputChange('body', e.target.value)}
                  placeholder="알림 내용을 입력하세요"
                  rows={3}
                  required
                />
              </div>

              {/* 링크 URL */}
              <div className="space-y-2">
                <Label htmlFor="url">링크 URL</Label>
                <Input
                  id="url"
                  value={formData.url}
                  onChange={(e) => handleInputChange('url', e.target.value)}
                  placeholder="/notifications"
                />
              </div>

              {/* 발송 버튼 */}
              <Button
                type="submit"
                disabled={isLoading || !user}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    발송 중...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    푸시 알림 발송
                  </>
                )}
              </Button>
            </form>

            {/* 결과 표시 */}
            {result && (
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 text-green-800 mb-2">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">발송 성공!</span>
                </div>
                <div className="text-sm text-green-700 space-y-1">
                  <p>알림 ID: {result.data.notificationId}</p>
                  <p>총 구독: {result.data.totalSubscriptions}개</p>
                  <p>성공: {result.data.successful}개</p>
                  <p>실패: {result.data.failed}개</p>
                  <p>상태: {result.data.status}</p>
                </div>
              </div>
            )}

            {/* 에러 표시 */}
            {error && (
              <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 text-red-800">
                  <XCircle className="w-5 h-5" />
                  <span className="font-medium">발송 실패</span>
                </div>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            )}

            {/* 사용자 정보 */}
            {user && (
              <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">사용자 정보</h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>사용자 ID: {user.id}</p>
                  <p>이메일: {user.email}</p>
                  <p>이름: {user.user_metadata?.full_name || user.email?.split('@')[0] || '미설정'}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 사용법 안내 */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>📖 사용법</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-gray-600">
            <p>1. <strong>프리셋 선택</strong>: 미리 정의된 알림 템플릿을 선택하거나</p>
            <p>2. <strong>직접 입력</strong>: 제목과 내용을 직접 입력하세요</p>
            <p>3. <strong>발송</strong>: "푸시 알림 발송" 버튼을 클릭하세요</p>
            <p>4. <strong>확인</strong>: 브라우저에서 푸시 알림을 확인하세요</p>
            <p className="text-yellow-600">
              ⚠️ 푸시 알림을 받으려면 먼저 알림 권한을 허용해야 합니다.
            </p>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  )
}
