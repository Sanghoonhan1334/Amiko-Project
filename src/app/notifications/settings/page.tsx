'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Bell, Mail, Smartphone, Save, RotateCcw, AlertCircle } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import { NotificationType, NOTIFICATION_TEMPLATES } from '@/lib/notifications'
import PushNotificationToggle from '@/components/notifications/PushNotificationToggle'

interface NotificationSettings {
  email_enabled: boolean
  push_enabled: boolean
  in_app_enabled: boolean
  email_types: string[]
  push_types: string[]
  in_app_types: string[]
}

export default function NotificationSettingsPage() {
  const { user } = useAuth()
  const [settings, setSettings] = useState<NotificationSettings>({
    email_enabled: true,
    push_enabled: true,
    in_app_enabled: true,
    email_types: ['booking_created', 'payment_confirmed', 'consultation_reminder', 'consultation_completed', 'review_reminder'],
    push_types: ['payment_confirmed', 'consultation_reminder', 'consultation_completed'],
    in_app_types: ['booking_created', 'payment_confirmed', 'consultation_reminder', 'consultation_completed', 'review_reminder', 'system']
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  // 푸시 알림 관련 상태는 PushNotificationToggle 컴포넌트에서 관리

  // 알림 설정 조회
  const fetchSettings = async () => {
    if (!user) return

    try {
      setLoading(true)
      const response = await fetch(`/api/notifications/settings?userId=${user.id}`)
      
      if (response.ok) {
        const data = await response.json()
        setSettings(data.settings)
        
        // 성공 메시지가 있으면 표시
        if (data.message) {
          setSuccess(data.message)
          setTimeout(() => setSuccess(''), 5000)
        }
      } else {
        // 에러 응답 처리
        const errorData = await response.json()
        console.warn('[NOTIFICATION SETTINGS] API 응답 에러:', errorData)
        
        // 테이블이 없는 경우 등은 기본 설정으로 처리
        if (errorData.message && errorData.message.includes('테이블이 아직 생성되지 않았습니다')) {
          const defaultSettings = {
            user_id: user.id,
            email_enabled: true,
            push_enabled: true,
            in_app_enabled: true,
            email_types: ['booking_created', 'payment_confirmed', 'consultation_reminder'],
            push_types: ['booking_created', 'payment_confirmed'],
            in_app_types: ['booking_created', 'payment_confirmed', 'consultation_reminder', 'consultation_completed', 'review_reminder', 'system']
          }
          setSettings(defaultSettings)
          setError('알림 설정 테이블이 아직 생성되지 않았습니다. 기본 설정을 사용합니다.')
          setTimeout(() => setError(''), 5000)
          return
        }
        
        // 다른 에러는 기본 설정으로 처리
        const defaultSettings = {
          user_id: user.id,
          email_enabled: true,
          push_enabled: true,
          in_app_enabled: true,
          email_types: ['booking_created', 'payment_confirmed', 'consultation_reminder'],
          push_types: ['booking_created', 'payment_confirmed'],
          in_app_types: ['booking_created', 'payment_confirmed', 'consultation_reminder', 'consultation_completed', 'review_reminder', 'system']
        }
        setSettings(defaultSettings)
        setError('설정을 불러올 수 없습니다. 기본 설정을 사용합니다.')
        setTimeout(() => setError(''), 5000)
      }
    } catch (error) {
      console.error('알림 설정 조회 실패:', error)
      // 네트워크 에러 등은 기본 설정으로 처리
      const defaultSettings = {
        user_id: user.id,
        email_enabled: true,
        push_enabled: true,
        in_app_enabled: true,
        email_types: ['booking_created', 'payment_confirmed', 'consultation_reminder'],
        push_types: ['booking_created', 'payment_confirmed'],
        in_app_types: ['booking_created', 'payment_confirmed', 'consultation_reminder', 'consultation_completed', 'review_reminder', 'system']
      }
      setSettings(defaultSettings)
      setError('네트워크 오류가 발생했습니다. 기본 설정을 사용합니다.')
      setTimeout(() => setError(''), 5000)
    } finally {
      setLoading(false)
    }
  }

  // 컴포넌트 마운트 시 설정 조회
  useEffect(() => {
    if (user) {
      fetchSettings()
    }
  }, [user])

  // 알림 설정 저장
  const saveSettings = async () => {
    if (!user || !settings) return

    try {
      setSaving(true)
      setError('')
      setSuccess('')

      const response = await fetch('/api/notifications/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          ...settings
        })
      })

      if (response.ok) {
        const data = await response.json()
        setSuccess(data.message || '알림 설정이 저장되었습니다.')
        setTimeout(() => setSuccess(''), 5000)
      } else {
        // 에러 응답 처리
        const errorData = await response.json()
        console.warn('[NOTIFICATION SETTINGS] 저장 API 응답 에러:', errorData)
        
        let errorMessage = errorData.error
        
        // 상세한 에러 정보가 있으면 표시
        if (errorData.details) {
          if (errorData.details.table_missing) {
            errorMessage += '\n\n💡 해결 방법:\n1. Supabase 대시보드에서 SQL Editor 접속\n2. database/notifications.sql 파일 내용 실행\n3. 페이지 새로고침 후 다시 시도'
          } else if (errorData.details.update_error) {
            errorMessage += `\n\n🔍 상세 오류: ${errorData.details.update_error}`
          } else if (errorData.details.create_error) {
            errorMessage += `\n\n🔍 생성 오류: ${errorData.details.create_error}`
          }
        }
        
        setError(errorMessage)
        setTimeout(() => setError(''), 10000) // 더 긴 시간 동안 표시
      }
    } catch (error) {
      console.error('알림 설정 저장 실패:', error)
      setError('네트워크 오류가 발생했습니다. 인터넷 연결을 확인하고 다시 시도해주세요.')
      setTimeout(() => setError(''), 5000)
    } finally {
      setSaving(false)
    }
  }

  // 설정 초기화
  const resetSettings = () => {
    setSettings({
      email_enabled: true,
      push_enabled: true,
      in_app_enabled: true,
      email_types: ['booking_created', 'payment_confirmed', 'consultation_reminder', 'consultation_completed', 'review_reminder'],
      push_types: ['payment_confirmed', 'consultation_reminder', 'consultation_completed'],
      in_app_types: ['booking_created', 'payment_confirmed', 'consultation_reminder', 'consultation_completed', 'review_reminder', 'system']
    })
  }

  // 알림 타입 토글
  const toggleNotificationType = (channel: 'email' | 'push' | 'in_app', type: string) => {
    setSettings(prev => {
      const typesKey = `${channel}_types` as keyof NotificationSettings
      const currentTypes = prev[typesKey] as string[]
      
      if (currentTypes.includes(type)) {
        return {
          ...prev,
          [typesKey]: currentTypes.filter(t => t !== type)
        }
      } else {
        return {
          ...prev,
          [typesKey]: [...currentTypes, type]
        }
      }
    })
  }

  // 알림 채널 토글
  const toggleChannel = (channel: 'email' | 'push' | 'in_app') => {
    setSettings(prev => ({
      ...prev,
      [`${channel}_enabled`]: !prev[`${channel}_enabled`]
    }))
  }

  // 알림 타입별 설명
  const getNotificationDescription = (type: string) => {
    switch (type) {
      case 'booking_created':
        return '새로운 상담 예약이 생성될 때'
      case 'payment_confirmed':
        return '결제가 완료되고 예약이 확정될 때'
      case 'consultation_reminder':
        return '상담 전날 또는 상담 시간 1시간 전'
      case 'consultation_completed':
        return '상담이 완료될 때'
      case 'review_reminder':
        return '상담 완료 후 후기 작성 안내'
      case 'system':
        return '시스템 공지사항 및 업데이트'
      default:
        return ''
    }
  }

  // 설정 변경 시 자동 저장 (디바운스)
  useEffect(() => {
    if (!user || !settings) return

    const timeoutId = setTimeout(() => {
      saveSettings()
    }, 2000) // 2초 후 자동 저장

    return () => clearTimeout(timeoutId)
  }, [settings, user])

  // 자동 저장 중일 때 표시할 상태
  const [autoSaving, setAutoSaving] = useState(false)

  // 자동 저장 함수 (사용자에게 알림 없이)
  const autoSave = async () => {
    if (!user || !settings) return

    try {
      setAutoSaving(true)
      const response = await fetch('/api/notifications/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          ...settings
        })
      })

      if (!response.ok) {
        console.warn('[NOTIFICATION SETTINGS] 자동 저장 실패:', response.status)
      }
    } catch (error) {
      console.error('[NOTIFICATION SETTINGS] 자동 저장 중 오류:', error)
    } finally {
      setAutoSaving(false)
    }
  }

  // 설정 변경 시 자동 저장 (디바운스)
  useEffect(() => {
    if (!user || !settings) return

    const timeoutId = setTimeout(() => {
      autoSave()
    }, 2000) // 2초 후 자동 저장

    return () => clearTimeout(timeoutId)
  }, [settings, user])

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h1 className="text-xl font-semibold mb-2">설정 불러오는 중...</h1>
            <p className="text-gray-600">잠시만 기다려주세요.</p>
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
                  ⚙️ 알림 설정
                </h1>
                <p className="text-gray-600">
                  원하는 알림을 선택하고 설정할 수 있습니다.
                </p>
              </div>
              
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    try {
                      const response = await fetch('/api/notifications/status')
                      if (response.ok) {
                        const data = await response.json()
                        console.log('알림 시스템 상태:', data)
                        
                        let statusMessage = data.message + '\n\n'
                        statusMessage += `📊 테이블 상태:\n`
                        statusMessage += `• notifications: ${data.status.notifications_table ? '✅' : '❌'}\n`
                        statusMessage += `• settings: ${data.status.notification_settings_table ? '✅' : '❌'}\n`
                        statusMessage += `• logs: ${data.status.notification_logs_table ? '✅' : '❌'}\n`
                        statusMessage += `• DB 연결: ${data.status.database_connection ? '✅' : '❌'}`
                        
                        if (!data.status.tables_ready) {
                          statusMessage += `\n\n💡 권장사항:\n${data.recommendations.if_tables_missing}`
                        }
                        
                        alert(statusMessage)
                      } else {
                        alert('시스템 상태 확인에 실패했습니다.')
                      }
                    } catch (error) {
                      alert('시스템 상태 확인 중 오류가 발생했습니다.')
                    }
                  }}
                >
                  🔍 시스템 상태
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetSettings}
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  초기화
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    if (!user) return
                    
                    try {
                      console.log('🧪 테스트 알림 발송 중...');
                      
                      // 직접 푸시 알림 발송 API 호출
                      const response = await fetch('/api/notifications/send-push', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          userId: user.id,
                          title: '테스트 알림',
                          body: '테스트 메시지입니다!',
                          data: { test: true }
                        })
                      });

                      if (response.ok) {
                        const data = await response.json()
                        setSuccess('테스트 알림이 발송되었습니다!')
                        setTimeout(() => setSuccess(''), 5000)
                      } else {
                        const errorData = await response.json()
                        console.warn('[NOTIFICATION TEST] API 응답 에러:', errorData)
                        setError(`테스트 알림 발송 실패: ${errorData.message || '알 수 없는 오류'}`)
                        setTimeout(() => setError(''), 8000)
                      }
                    } catch (error) {
                      console.error('테스트 알림 발송 실패:', error)
                      setError('테스트 알림 발송 중 오류가 발생했습니다.')
                      setTimeout(() => setError(''), 5000)
                    }
                  }}
                >
                  🧪 테스트 알림
                </Button>
                
                <div className="flex items-center space-x-2">
                  <Button
                    onClick={saveSettings}
                    disabled={saving}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? '저장 중...' : '저장'}
                  </Button>
                  
                  {autoSaving && (
                    <div className="flex items-center text-sm text-gray-500">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500 mr-2"></div>
                      자동 저장 중...
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 메시지 */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-6">
                <p className="text-red-700">{error}</p>
              </div>
            )}

            {success && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg mb-6">
                <p className="text-green-700">{success}</p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-red-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      {error}
                    </h3>
                    {error.includes('테이블이 아직 생성되지 않았습니다') && (
                      <div className="mt-2 text-sm text-red-700">
                        <p>데이터베이스에 알림 관련 테이블을 생성해야 합니다:</p>
                        <ol className="list-decimal list-inside mt-1 space-y-1">
                          <li>Supabase 대시보드에서 SQL Editor 접속</li>
                          <li><code className="bg-red-100 px-1 rounded">database/notifications.sql</code> 파일 내용 실행</li>
                          <li>페이지 새로고침</li>
                        </ol>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 알림 채널 설정 */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Bell className="w-5 h-5" />
                  <span>알림 채널</span>
                </CardTitle>
                <CardDescription>
                  어떤 방법으로 알림을 받을지 선택하세요.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* 이메일 알림 */}
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Mail className="w-5 h-5 text-blue-600" />
                    <div>
                      <Label className="text-base font-medium">이메일 알림</Label>
                      <p className="text-sm text-gray-600">이메일로 알림을 받습니다.</p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.email_enabled}
                    onCheckedChange={() => toggleChannel('email')}
                  />
                </div>

                {/* 푸시 알림 */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Smartphone className="w-5 h-5 text-green-600" />
                    <div>
                      <Label className="text-base font-medium">브라우저 푸시 알림</Label>
                      <p className="text-sm text-gray-600">브라우저에서 푸시 알림을 받습니다.</p>
                    </div>
                  </div>
                  
                  {/* 푸시 알림 토글 컴포넌트 */}
                  <PushNotificationToggle />
                </div>

                {/* 인앱 알림 */}
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Bell className="w-5 h-5 text-purple-600" />
                    <div>
                      <Label className="text-base font-medium">웹사이트 내 알림</Label>
                      <p className="text-sm text-gray-600">웹사이트에서 알림을 확인합니다.</p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.in_app_enabled}
                    onCheckedChange={() => toggleChannel('in_app')}
                  />
                </div>
              </CardContent>
            </Card>

            {/* 알림 타입별 설정 */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>알림 종류별 설정</CardTitle>
                <CardDescription>
                  각 알림 채널에서 받고 싶은 알림을 선택하세요.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {Object.entries(NOTIFICATION_TEMPLATES).map(([type, template]) => (
                    <div key={type} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{template.title}</h3>
                          <p className="text-sm text-gray-600 mt-1">{template.message}</p>
                          <p className="text-xs text-gray-500 mt-2">
                            {getNotificationDescription(type)}
                          </p>
                        </div>
                      </div>

                      <Separator className="my-4" />

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* 이메일 설정 */}
                        <div className="flex items-center space-x-3">
                          <Switch
                            checked={settings.email_enabled && settings.email_types.includes(type)}
                            onCheckedChange={() => toggleNotificationType('email', type)}
                            disabled={!settings.email_enabled}
                          />
                          <div className="flex items-center space-x-2">
                            <Mail className="w-4 h-4 text-blue-600" />
                            <Label className="text-sm">이메일</Label>
                          </div>
                        </div>

                        {/* 푸시 설정 */}
                        <div className="flex items-center space-x-3">
                          <Switch
                            checked={settings.push_enabled && settings.push_types.includes(type)}
                            onCheckedChange={() => toggleNotificationType('push', type)}
                            disabled={!settings.push_enabled}
                          />
                          <div className="flex items-center space-x-2">
                            <Smartphone className="w-4 h-4 text-green-600" />
                            <Label className="text-sm">푸시</Label>
                          </div>
                        </div>

                        {/* 인앱 설정 */}
                        <div className="flex items-center space-x-3">
                          <Switch
                            checked={settings.in_app_enabled && settings.in_app_types.includes(type)}
                            onCheckedChange={() => toggleNotificationType('in_app', type)}
                            disabled={!settings.in_app_enabled}
                          />
                          <div className="flex items-center space-x-2">
                            <Bell className="w-4 h-4 text-purple-600" />
                            <Label className="text-sm">웹사이트</Label>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 저장 버튼 */}
            <div className="text-center">
              <Button
                size="lg"
                onClick={saveSettings}
                disabled={saving}
                className="px-8"
              >
                <Save className="w-5 h-5 mr-2" />
                {saving ? '저장 중...' : '설정 저장'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
