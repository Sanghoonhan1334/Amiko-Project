'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, X, Check, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'

interface Notification {
  id: string
  type: 'booking_request' | 'booking_approved' | 'booking_rejected' | 'schedule_confirmed' | 'comment' | 'like' | 'answer_accepted' | 'story_comment' | 'story_like' | 'new_post' | 'new_news'
  title: string
  message: string
  related_id?: string | null
  is_read: boolean
  created_at: string
}

interface NotificationResponse {
  notifications: Notification[]
}

export default function NotificationBell() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  // 알림 목록 조회
  const fetchNotifications = async () => {
    if (!user) {
      console.log('사용자 정보가 없어서 알림 조회 건너뜀')
      return
    }

    try {
      setLoading(true)
      const response = await fetch('/api/notifications')
      
      console.log('알림 API 응답:', { status: response.status })

      if (!response.ok) {
        console.warn('알림 API 에러로 인해 빈 알림 목록을 반환합니다.')
        setNotifications([])
        setUnreadCount(0)
        return
      }

      const data: NotificationResponse = await response.json()
      
      // 좋아요, 댓글, 새로운 뉴스만 필터링
      const allowedTypes = ['like', 'story_like', 'comment', 'story_comment', 'new_post', 'new_news']
      const filteredNotifications = (data.notifications || []).filter(n => allowedTypes.includes(n.type))
      
      const unread = filteredNotifications.filter(n => !n.is_read).length || 0
      setNotifications(filteredNotifications)
      setUnreadCount(unread)
    } catch (error) {
      console.error('알림 조회 실패:', error)
      setNotifications([])
      setUnreadCount(0)
    } finally {
      setLoading(false)
    }
  }

  // 읽지 않은 알림 개수만 조회 (필터링된 알림만)
  const fetchUnreadCount = async () => {
    if (!user) {
      setUnreadCount(0)
      return
    }

    try {
      const response = await fetch('/api/notifications', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store'
      })
      
      if (!response.ok) {
        console.warn('[NotificationBell] 알림 개수 조회 실패:', response.status)
        setUnreadCount(0)
        return
      }
      
      const data: NotificationResponse = await response.json()
      
      console.log('[NotificationBell] 전체 알림:', data.notifications?.length || 0, '개')
      console.log('[NotificationBell] 전체 알림 타입들:', data.notifications?.map(n => n.type) || [])
      
      // 좋아요, 댓글, 새로운 뉴스만 필터링
      const allowedTypes = ['like', 'story_like', 'comment', 'story_comment', 'new_post', 'new_news']
      const filteredNotifications = (data.notifications || []).filter(n => allowedTypes.includes(n.type))
      
      console.log('[NotificationBell] 필터링된 알림:', filteredNotifications.length, '개')
      console.log('[NotificationBell] 필터링된 알림 타입들:', filteredNotifications.map(n => n.type))
      
      // 읽지 않은 알림 개수만 계산
      const unread = filteredNotifications.filter(n => !n.is_read).length || 0
      console.log('[NotificationBell] 읽지 않은 알림:', unread, '개')
      
      setUnreadCount(unread)
    } catch (error) {
      // 네트워크 에러는 조용히 처리 (API가 없거나 연결 실패 시)
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        console.warn('[NotificationBell] 네트워크 연결 실패 - API 엔드포인트를 확인하세요')
      } else {
        console.error('[NotificationBell] 알림 개수 조회 오류:', error)
      }
      setUnreadCount(0)
    }
  }

  // 알림 읽음 처리
  const markAsRead = async (notificationId: string) => {
    if (!user) return

    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'POST'
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

  // 알림 클릭 시 해당 페이지로 이동
  const handleNotificationClick = (notification: Notification) => {
    // 읽음 처리
    markAsRead(notification.id)
    
    // 알림 드롭다운 닫기
    setIsOpen(false)
    
    // 타입별로 다른 페이지로 이동
    if (notification.type === 'like' || notification.type === 'story_like' || 
        notification.type === 'comment' || notification.type === 'story_comment') {
      // 내 게시물에 좋아요/댓글이 달린 경우 → 게시물 페이지로
      if (notification.related_id) {
        router.push(`/community/post/${notification.related_id}`)
      }
    } else if (notification.type === 'new_post' || notification.type === 'new_news') {
      // 새로운 뉴스 → 뉴스 페이지로
      if (notification.related_id) {
        router.push(`/community/news/${notification.related_id}`)
      } else {
        router.push('/community/news')
      }
    }
  }

  // 모든 알림 읽음 처리
  const markAllAsRead = async () => {
    if (!user) return

    try {
      const response = await fetch('/api/notifications/unread-count/read', {
        method: 'PUT'
      })

      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
        setUnreadCount(0)
      }
    } catch (error) {
      console.error('모든 알림 읽음 처리 실패:', error)
    }
  }

  // 알림 타입별 아이콘
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'booking_request':
        return '📅'
      case 'booking_approved':
        return '✅'
      case 'booking_rejected':
        return '❌'
      case 'schedule_confirmed':
        return '⏰'
      case 'comment':
      case 'story_comment':
        return '💬'
      case 'like':
      case 'story_like':
        return '❤️'
      case 'answer_accepted':
        return '✅'
      case 'new_post':
      case 'new_news':
        return '📰'
      default:
        return '🔔'
    }
  }

  // 알림 타입별 색상
  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'booking_request':
        return 'text-purple-600'
      case 'booking_approved':
        return 'text-green-600'
      case 'booking_rejected':
        return 'text-red-600'
      case 'schedule_confirmed':
        return 'text-blue-600'
      case 'comment':
      case 'story_comment':
        return 'text-blue-600'
      case 'like':
      case 'story_like':
        return 'text-red-600'
      case 'answer_accepted':
        return 'text-green-600'
      case 'new_post':
      case 'new_news':
        return 'text-blue-600'
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
    if (user) {
      fetchNotifications()
      fetchUnreadCount()
      
      // 5초마다 읽지 않은 알림 개수 업데이트 (더 빠른 반응)
      const interval = setInterval(fetchUnreadCount, 5000)
      return () => clearInterval(interval)
    } else {
      setNotifications([])
      setUnreadCount(0)
    }
  }, [user?.id]) // user 객체 대신 user?.id만 의존성으로 사용

  // 드롭다운이 열릴 때마다 최신 알림 가져오기
  useEffect(() => {
    if (isOpen && user) {
      fetchNotifications()
    }
  }, [isOpen, user])

  return (
    <div className="relative">
      {/* 알림 벨 버튼 */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
      >
        <Bell className="w-5 h-5 text-gray-600 dark:text-gray-300" />
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
        <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-[9999]">
          {/* 헤더 */}
          <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-100 dark:border-gray-700">
            <h3 className="font-semibold text-gray-800 dark:text-gray-200 text-sm sm:text-base">{t('myTab.notifications')}</h3>
            <div className="flex items-center gap-1 sm:gap-2">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 px-2 py-1"
                >
{t('myTab.markAllAsRead')}
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="p-1 sm:p-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* 알림 목록 */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-3 sm:p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
{t('myTab.loadingNotifications')}
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-3 sm:p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
{t('myTab.noNewNotifications')}
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-3 sm:p-4 border-b border-gray-50 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors ${
                    !notification.is_read ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                  }`}
                >
                  <div className="flex items-start gap-2 sm:gap-3">
                    <div className="text-base sm:text-lg">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1 sm:gap-2 mb-1">
                        <h4 className={`font-medium text-xs sm:text-sm ${getNotificationColor(notification.type)}`}>
                          {notification.title}
                        </h4>
                        {!notification.is_read && (
                          <div className="w-2 h-2 bg-blue-500 dark:bg-blue-400 rounded-full"></div>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 mb-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatTime(notification.created_at)}
                        </span>
                        {!notification.is_read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              markAsRead(notification.id)
                            }}
                            className="p-1 h-6 w-6 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100"
                          >
                            <Check className="w-3 h-3" />
                          </Button>
                        )}
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
{t('myTab.viewAllNotifications')}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}