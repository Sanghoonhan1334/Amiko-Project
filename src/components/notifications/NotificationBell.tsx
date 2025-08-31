'use client'

import { useState, useEffect, useCallback } from 'react'
import { Bell, BellOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/context/AuthContext'
import { Notification } from '@/lib/notifications'

interface NotificationBellProps {
  className?: string
}

export default function NotificationBell({ className }: NotificationBellProps) {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  // 알림 목록 조회
  const fetchNotifications = useCallback(async () => {
    if (!user) return

    try {
      setLoading(true)
      const response = await fetch(`/api/notifications?userId=${user.id}&limit=5&unreadOnly=true`)
      
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications || [])
        setUnreadCount(data.unreadCount || 0)
      } else {
        // 에러 응답 처리
        const errorData = await response.json()
        console.warn('[NOTIFICATION] API 응답 에러:', errorData)
        
        // 테이블이 없는 경우 등은 빈 목록으로 처리
        if (errorData.message && errorData.message.includes('테이블이 아직 생성되지 않았습니다')) {
          setNotifications([])
          setUnreadCount(0)
          return
        }
        
        // 다른 에러는 무시하고 빈 목록 표시
        setNotifications([])
        setUnreadCount(0)
      }
    } catch (error) {
      console.error('알림 조회 실패:', error)
      // 네트워크 에러 등은 무시하고 빈 목록 표시
      setNotifications([])
      setUnreadCount(0)
    } finally {
      setLoading(false)
    }
  }, [user])

  // 컴포넌트 마운트 시 알림 조회
  useEffect(() => {
    fetchNotifications()
    
    // 30초마다 알림 새로고침
    const interval = setInterval(fetchNotifications, 30000)
    
    return () => clearInterval(interval)
  }, [user, fetchNotifications])

  // 알림 읽음 처리
  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRead: true })
      })

      if (response.ok) {
        // 로컬 상태 업데이트
        setNotifications(prev => 
          prev.map(n => 
            n.id === notificationId 
              ? { ...n, is_read: true, read_at: new Date().toISOString() }
              : n
          )
        )
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('알림 읽음 처리 실패:', error)
    }
  }

  // 모든 알림 읽음 처리
  const markAllAsRead = async () => {
    if (!user) return

    try {
      const response = await fetch('/api/notifications/read-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      })

      if (response.ok) {
        setNotifications([])
        setUnreadCount(0)
      }
    } catch (error) {
      console.error('전체 알림 읽음 처리 실패:', error)
    }
  }

  if (!user) return null

  return (
    <div className={`relative ${className}`}>
      {/* 알림 벨 버튼 */}
      <Button
        variant="ghost"
        size="sm"
        className="relative p-2"
        onClick={() => setIsOpen(!isOpen)}
        disabled={loading}
      >
        {unreadCount > 0 ? (
          <Bell className="h-5 w-5 text-blue-600" />
        ) : (
          <BellOff className="h-5 w-5 text-gray-400" />
        )}
        
        {/* 읽지 않은 알림 개수 배지 */}
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      {/* 알림 드롭다운 */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          {/* 헤더 */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">알림</h3>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                모두 읽음
              </Button>
            )}
          </div>

          {/* 알림 목록 */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2">알림 불러오는 중...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <BellOff className="h-8 w-8 mx-auto text-gray-300 mb-2" />
                <p>새로운 알림이 없습니다</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                      !notification.isRead ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${
                          !notification.isRead ? 'text-gray-900' : 'text-gray-700'
                        }`}>
                          {notification.title}
                        </p>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-2">
                          {new Date(notification.createdAt).toLocaleString('ko-KR', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      
                      {/* 읽지 않은 알림 표시 */}
                      {!notification.isRead && (
                        <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-2"></div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 푸터 */}
          <div className="p-3 border-t border-gray-200 bg-gray-50">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-sm text-gray-600 hover:text-gray-800"
              onClick={() => {
                setIsOpen(false)
                // 알림 페이지로 이동
                window.location.href = '/notifications'
              }}
            >
              모든 알림 보기
            </Button>
          </div>
        </div>
      )}

      {/* 드롭다운 외부 클릭 시 닫기 */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}
