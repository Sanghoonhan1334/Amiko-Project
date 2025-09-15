'use client'

import { useState, useEffect } from 'react'
import { Bell, X, Check, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { useAuth } from '@/context/AuthContext'

interface Notification {
  id: string
  type: 'comment' | 'like' | 'answer_accepted' | 'story_comment' | 'story_like'
  title: string
  message: string
  data?: any
  is_read: boolean
  created_at: string
}

interface NotificationResponse {
  notifications: Notification[]
  unreadCount: number
  hasMore: boolean
}

export default function NotificationBell() {
  const { token } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  // 알림 목록 조회
  const fetchNotifications = async () => {
    if (!token) {
      console.log('토큰이 없어서 알림 조회 건너뜀')
      return
    }

    try {
      setLoading(true)
      console.log('알림 API 호출 시작:', { token: !!token })
      
      const response = await fetch('/api/notifications?limit=10', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      console.log('알림 API 응답:', { 
        status: response.status, 
        statusText: response.statusText,
        ok: response.ok 
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('알림 API 에러 응답:', errorData)
        
        // 데이터베이스 연결 문제인 경우 빈 알림으로 처리
        if (response.status === 500 && errorData.error?.includes('데이터베이스')) {
          console.warn('데이터베이스 연결 문제로 인해 빈 알림 목록을 반환합니다.')
          setNotifications([])
          setUnreadCount(0)
          return
        }
        
        // 다른 에러의 경우에도 빈 알림으로 처리하여 앱이 정상 작동하도록 함
        console.warn('알림 API 에러로 인해 빈 알림 목록을 반환합니다.')
        setNotifications([])
        setUnreadCount(0)
        return
      }

      const data: NotificationResponse = await response.json()
      console.log('알림 데이터 수신:', { 
        notificationsCount: data.notifications?.length || 0,
        unreadCount: data.unreadCount 
      })
      
      setNotifications(data.notifications)
      setUnreadCount(data.unreadCount)
    } catch (error) {
      console.error('알림 조회 실패:', error)
      
      // 모든 에러에 대해 빈 알림으로 설정하여 앱이 정상 작동하도록 함
      console.warn('알림 로드 실패로 인해 빈 알림 목록을 반환합니다.')
      setNotifications([])
      setUnreadCount(0)
      
      // 네트워크 에러인 경우 더 자세한 정보 출력
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        console.error('네트워크 에러 - 서버 연결을 확인해주세요')
      }
    } finally {
      setLoading(false)
    }
  }

  // 알림 읽음 처리
  const markAsRead = async (notificationId: string) => {
    if (!token) return

    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        setNotifications(prev => 
          prev.map(notification => 
            notification.id === notificationId 
              ? { ...notification, is_read: true }
              : notification
          )
        )
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('알림 읽음 처리 실패:', error)
    }
  }

  // 알림 삭제
  const deleteNotification = async (notificationId: string) => {
    if (!token) return

    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        setNotifications(prev => prev.filter(n => n.id !== notificationId))
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('알림 삭제 실패:', error)
    }
  }

  // 모든 알림 읽음 처리
  const markAllAsRead = async () => {
    if (!token) return

    try {
      const unreadNotifications = notifications.filter(n => !n.is_read)
      await Promise.all(unreadNotifications.map(n => markAsRead(n.id)))
    } catch (error) {
      console.error('모든 알림 읽음 처리 실패:', error)
    }
  }

  // 알림 타입별 아이콘
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'comment':
      case 'story_comment':
        return '💬'
      case 'like':
      case 'story_like':
        return '❤️'
      case 'answer_accepted':
        return '✅'
      default:
        return '🔔'
    }
  }

  // 알림 타입별 색상
  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'comment':
      case 'story_comment':
        return 'text-blue-600'
      case 'like':
      case 'story_like':
        return 'text-red-600'
      case 'answer_accepted':
        return 'text-green-600'
      default:
        return 'text-gray-600'
    }
  }

  // 시간 포맷팅
  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (minutes < 1) return '방금 전'
    if (minutes < 60) return `${minutes}분 전`
    if (hours < 24) return `${hours}시간 전`
    if (days < 7) return `${days}일 전`
    
    return date.toLocaleDateString('ko-KR')
  }

  // 컴포넌트 마운트 시 알림 조회
  useEffect(() => {
    if (token) {
      // 임시로 알림 기능 비활성화 (디버깅용)
      console.log('알림 기능이 임시로 비활성화되었습니다.')
      setNotifications([])
      setUnreadCount(0)
      
      // fetchNotifications() // 주석 처리
      
      // 30초마다 알림 새로고침
      // const interval = setInterval(fetchNotifications, 30000) // 주석 처리
      // return () => clearInterval(interval) // 주석 처리
    }
  }, [token])

  return (
    <div className="relative">
      {/* 알림 벨 버튼 */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-gray-100"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      {/* 알림 드롭다운 */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          {/* 헤더 */}
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800">알림</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="text-xs text-blue-600 hover:text-blue-700"
                >
                  모두 읽음
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="p-1"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* 알림 목록 */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500">
                알림을 불러오는 중...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                새로운 알림이 없습니다.
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-b border-gray-50 hover:bg-gray-50 ${
                    !notification.is_read ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-lg">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className={`font-medium text-sm ${getNotificationColor(notification.type)}`}>
                          {notification.title}
                        </h4>
                        {!notification.is_read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 mb-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          {formatTime(notification.created_at)}
                        </span>
                        <div className="flex items-center gap-1">
                          {!notification.is_read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => markAsRead(notification.id)}
                              className="p-1 h-6 w-6"
                            >
                              <Check className="w-3 h-3" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteNotification(notification.id)}
                            className="p-1 h-6 w-6 text-gray-400 hover:text-red-500"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* 푸터 */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-100 text-center">
              <Button
                variant="ghost"
                size="sm"
                className="text-blue-600 hover:text-blue-700"
                onClick={() => {
                  // 전체 알림 페이지로 이동
                  window.location.href = '/notifications'
                }}
              >
                모든 알림 보기
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}