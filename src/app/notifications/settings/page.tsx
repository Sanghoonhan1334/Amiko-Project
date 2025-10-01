'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Bell, Mail, Smartphone, Save, RotateCcw, AlertCircle } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import ProtectedRoute from '@/components/auth/ProtectedRoute'

import PushNotificationToggle from '@/components/notifications/PushNotificationToggle'
import { useLanguage } from '@/context/LanguageContext'

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
  const { t } = useLanguage()
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
  const fetchSettings = useCallback(async () => {
    if (!user) return

    try {
      setLoading(true)
      
      // 먼저 localStorage에서 설정 확인
      const localSettings = localStorage.getItem(`notificationSettings_${user.id}`)
      
      const response = await fetch(`/api/notifications/settings?userId=${user.id}`)
      
      if (response.ok) {
        const data = await response.json()
        
        // 로컬에 저장된 경우거나 실제 DB에서 가져온 경우 모두 적용
        if (data.settings) {
          setSettings(data.settings)
          // localStorage에도 저장
          localStorage.setItem(`notificationSettings_${user.id}`, JSON.stringify(data.settings))
        }
        
        // 성공 메시지가 있으면 표시
        if (data.message && !data.is_local) {
          setSuccess(data.message)
          setTimeout(() => setSuccess(''), 5000)
        }
      } else {
        // API 실패 시 localStorage에서 설정 불러오기
        if (localSettings) {
          setSettings(JSON.parse(localSettings))
          console.log('[NOTIFICATION SETTINGS] localStorage에서 설정 로드')
        } else {
          // localStorage에도 없으면 기본 설정
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
          localStorage.setItem(`notificationSettings_${user.id}`, JSON.stringify(defaultSettings))
        }
      }
    } catch (error) {
      console.error('알림 설정 조회 실패:', error)
      
      // 에러 발생 시 localStorage에서 설정 불러오기
      const localSettings = localStorage.getItem(`notificationSettings_${user.id}`)
      if (localSettings) {
        setSettings(JSON.parse(localSettings))
      } else {
        // localStorage에도 없으면 기본 설정
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
        localStorage.setItem(`notificationSettings_${user.id}`, JSON.stringify(defaultSettings))
      }
    } finally {
      setLoading(false)
    }
  }, [user, t])

  // 컴포넌트 마운트 시 설정 조회
  useEffect(() => {
    if (user) {
      fetchSettings()
    }
  }, [user, fetchSettings])

  // 알림 설정 저장
  const saveSettings = useCallback(async () => {
    if (!user || !settings) return

    try {
      setSaving(true)
      setError('')
      setSuccess('')

      // 먼저 localStorage에 저장 (즉시 적용)
      localStorage.setItem(`notificationSettings_${user.id}`, JSON.stringify(settings))

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
        
        // 로컬 저장인 경우와 실제 DB 저장 구분
        if (data.is_local) {
          setSuccess('설정이 로컬에 저장되었습니다.')
        } else {
          setSuccess(data.message || t('notificationSettings.successMessage'))
        }
        setTimeout(() => setSuccess(''), 3000)
      } else {
        // API 실패해도 localStorage에는 저장되었으므로 성공 메시지
        setSuccess('설정이 로컬에 저장되었습니다.')
        setTimeout(() => setSuccess(''), 3000)
      }
    } catch (error) {
      console.error('알림 설정 저장 실패:', error)
      // 에러가 발생해도 localStorage에는 저장되었음
      setSuccess('설정이 로컬에 저장되었습니다.')
      setTimeout(() => setSuccess(''), 3000)
    } finally {
      setSaving(false)
    }
  }, [user, settings, t])

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



  // 설정 변경 시 자동 저장 (디바운스)
  useEffect(() => {
    if (!user || !settings) return

    const timeoutId = setTimeout(() => {
      saveSettings()
    }, 2000) // 2초 후 자동 저장

    return () => clearTimeout(timeoutId)
  }, [settings, user, saveSettings])

  // 자동 저장 중일 때 표시할 상태
  const [autoSaving, setAutoSaving] = useState(false)

  // 자동 저장 함수 (사용자에게 알림 없이)
  const autoSave = useCallback(async () => {
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
  }, [user, settings])

  // 설정 변경 시 자동 저장 (디바운스)
  useEffect(() => {
    if (!user || !settings) return

    const timeoutId = setTimeout(() => {
      autoSave()
    }, 2000) // 2초 후 자동 저장

    return () => clearTimeout(timeoutId)
  }, [settings, user, autoSave])

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
                  ⚙️ {t('notificationSettings.title')}
                </h1>
                <p className="text-gray-600">
                  {t('notificationSettings.subtitle')}
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
                    } catch {
                      alert('시스템 상태 확인 중 오류가 발생했습니다.')
                    }
                  }}
                >
                  🔍 {t('notificationSettings.systemStatus')}
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetSettings}
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  {t('notificationSettings.reset')}
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
                        setSuccess(t('notificationSettings.testSuccess'))
                        setTimeout(() => setSuccess(''), 5000)
                      } else {
                        const errorData = await response.json()
                        console.warn('[NOTIFICATION TEST] API 응답 에러:', errorData)
                        setError(`테스트 알림 발송 실패: ${errorData.message || '알 수 없는 오류'}`)
                        setTimeout(() => setError(''), 8000)
                      }
                    } catch {
                      setError(t('notificationSettings.testError'))
                      setTimeout(() => setError(''), 5000)
                    }
                  }}
                >
                  🧪 {t('notificationSettings.testNotification')}
                </Button>
                
                <div className="flex items-center space-x-2">
                  <Button
                    onClick={saveSettings}
                    disabled={saving}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? t('notificationSettings.saving') : t('notificationSettings.save')}
                  </Button>
                  
                  {autoSaving && (
                    <div className="flex items-center text-sm text-gray-500">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500 mr-2"></div>
                      {t('notificationSettings.autoSaving')}
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
                  <span>{t('notificationSettings.notificationChannels')}</span>
                </CardTitle>
                <CardDescription>
                  {t('notificationSettings.channelDescription')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* 이메일 알림 */}
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Mail className="w-5 h-5 text-blue-600" />
                    <div>
                      <Label className="text-base font-medium">{t('notificationSettings.emailNotification')}</Label>
                      <p className="text-sm text-gray-600">{t('notificationSettings.emailDescription')}</p>
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
                      <Label className="text-base font-medium">{t('notificationSettings.browserPushNotification')}</Label>
                      <p className="text-sm text-gray-600">{t('notificationSettings.browserPushDescription')}</p>
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
                      <Label className="text-base font-medium">{t('notificationSettings.inAppNotification')}</Label>
                      <p className="text-sm text-gray-600">{t('notificationSettings.inAppDescription')}</p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.in_app_enabled}
                    onCheckedChange={() => toggleChannel('in_app')}
                  />
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
                {saving ? t('notificationSettings.saving') : t('notificationSettings.saveSettings')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
