'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Bell, BellOff, Settings, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import {
  initializePushNotifications,
  getPushNotificationStatus,
  showLocalNotification
} from '@/lib/push-notifications'
import { useAuth } from '@/context/AuthContext'

export default function PushNotificationToggle() {
  const { user } = useAuth()
  const [isEnabled, setIsEnabled] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState<Record<string, unknown> | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (user) {
      checkPushNotificationStatus()
    }
  }, [user])

  const checkPushNotificationStatus = async () => {
    try {
      const pushStatus = getPushNotificationStatus()
      setStatus(pushStatus)

      // 실제 구독 상태 확인
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration()
        if (registration) {
          const subscription = await registration.pushManager.getSubscription()
          setIsEnabled(!!subscription && pushStatus.permission === 'granted')
        } else {
          setIsEnabled(false)
        }
      } else {
        setIsEnabled(false)
      }
    } catch (error) {
      console.error('[PUSH] 상태 확인 실패:', error)
      setIsEnabled(false)
    }
  }

  const handleToggle = async (enabled: boolean) => {
    if (!user) return

    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      if (enabled) {
        // 푸시 알림 활성화
        const success = await initializePushNotifications(user.id)
        if (success) {
          setIsEnabled(true)
          setSuccess('푸시 알림이 활성화되었습니다!')

          // 테스트 알림 표시
          setTimeout(() => {
            showLocalNotification({
              title: '🎉 푸시 알림 활성화!',
              body: '이제 중요한 알림을 놓치지 않을 수 있습니다.',
              data: { url: '/notifications' }
            })
          }, 1000)
        } else {
          setError('푸시 알림 활성화에 실패했습니다.')
        }
      } else {
        // 푸시 알림 비활성화
        try {
          // Service Worker 등록 확인
          if ('serviceWorker' in navigator) {
            const registration = await navigator.serviceWorker.getRegistration()
            if (registration) {
              // 기존 구독 해제
              const subscription = await registration.pushManager.getSubscription()
              if (subscription) {
                await subscription.unsubscribe()
                console.log('[PUSH] 기존 구독 해제 완료')
              }
            }
          }

          setIsEnabled(false)
          setSuccess('푸시 알림이 비활성화되었습니다.')
        } catch (error) {
          console.error('[PUSH] 구독 해제 실패:', error)
          // 구독 해제에 실패해도 UI 상태는 변경
          setIsEnabled(false)
          setSuccess('푸시 알림이 비활성화되었습니다. (구독 해제 실패)')
        }
      }
    } catch (error) {
      console.error('푸시 알림 토글 실패:', error)
      setError('푸시 알림 설정 변경에 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  // Test notification handler removed for production

  const getStatusIcon = () => {
    if (isEnabled) return <CheckCircle className="w-5 h-5 text-green-600" />
    if (status?.permission === 'denied') return <XCircle className="w-5 h-5 text-red-600" />
    return <AlertCircle className="w-5 h-5 text-yellow-600" />
  }

  const getStatusText = () => {
    if (isEnabled) return '활성화됨'
    if (status?.permission === 'denied') return '권한 거부됨'
    if (status?.permission === 'default') return '권한 요청 필요'
    return '비활성화됨'
  }

  const getStatusColor = () => {
    if (isEnabled) return 'bg-green-100 text-green-800'
    if (status?.permission === 'denied') return 'bg-red-100 text-red-800'
    return 'bg-yellow-100 text-yellow-800'
  }

  if (!user) {
    return null
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isEnabled ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
          푸시 알림 설정
        </CardTitle>
        <CardDescription>
          중요한 알림을 실시간으로 받아보세요
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* 상태 표시 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <span className="text-sm font-medium">상태</span>
          </div>
          <Badge className={getStatusColor()}>
            {getStatusText()}
          </Badge>
        </div>

        {/* 브라우저 지원 여부 */}
        {!status?.supported && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-800">
              <XCircle className="w-4 h-4" />
              <span className="text-sm">이 브라우저는 푸시 알림을 지원하지 않습니다</span>
            </div>
          </div>
        )}

        {/* Service Worker 지원 여부 */}
        {!status?.serviceWorker && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2 text-yellow-800">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">Service Worker를 지원하지 않습니다</span>
            </div>
          </div>
        )}

        {/* 토글 스위치 */}
        <div className="flex items-center justify-between">
          <Label htmlFor="push-notifications" className="text-sm font-medium">
            푸시 알림 {isEnabled ? '켜기' : '끄기'}
          </Label>
          <Switch
            id="push-notifications"
            checked={isEnabled}
            onCheckedChange={handleToggle}
            disabled={isLoading || !status?.supported || !status?.serviceWorker}
          />
        </div>

        {/* 테스트 버튼 제거 (프로덕션) */}

        {/* 권한이 거부된 경우 안내 */}
        {status?.permission === 'denied' && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-2 text-blue-800">
              <Settings className="w-4 h-4 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium mb-1">브라우저 설정에서 권한을 허용해주세요</p>
                <p>설정 → 개인정보 보호 및 보안 → 사이트 설정 → 알림</p>
              </div>
            </div>
          </div>
        )}

        {/* 성공/에러 메시지 */}
        {success && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 text-green-800">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm">{success}</span>
            </div>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-800">
              <XCircle className="w-4 h-4" />
              <span className="text-sm">{error}</span>
            </div>
          </div>
        )}

        {/* 로딩 상태 */}
        {isLoading && (
          <div className="flex items-center justify-center py-2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-600 dark:border-gray-400"></div>
            <span className="ml-2 text-sm text-gray-600">처리 중...</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
