'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BellOff, Check, Trash2, Settings } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import { Notification, NotificationType } from '@/lib/notifications'
import Link from 'next/link'

export default function NotificationsPage() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  const limit = 20

  // 알림 목록 조회
  const fetchNotifications = useCallback(async (pageNum: number = 1, append: boolean = false) => {
    if (!user) return

    try {
      setLoading(true)
      const offset = (pageNum - 1) * limit
      const unreadOnly = filter === 'unread'
      
      const response = await fetch(
        `/api/notifications/${user.id}?limit=${limit}&offset=${offset}&unreadOnly=${unreadOnly}`
      )
      
      if (response.ok) {
        const data = await response.json()
        const newNotifications = data.notifications || []
        
        if (append) {
          setNotifications(prev => [...prev, ...newNotifications])
        } else {
          setNotifications(newNotifications)
        }
        
        setUnreadCount(data.unreadCount || 0)
        setHasMore(newNotifications.length === limit)
      } else {
        throw new Error('알림 조회에 실패했습니다.')
      }
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }, [user, filter])

  // 컴포넌트 마운트 시 알림 조회
  useEffect(() => {
    if (user) {
      fetchNotifications(1, false)
    }
  }, [user, filter, fetchNotifications])

  // 필터 변경 시 페이지 초기화
  useEffect(() => {
    setPage(1)
    setHasMore(true)
  }, [filter])

  // 더 많은 알림 로드
  const loadMore = () => {
    if (hasMore && !loading) {
      const nextPage = page + 1
      setPage(nextPage)
      fetchNotifications(nextPage, true)
    }
  }

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

  // 알림 삭제
  const deleteNotification = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        // 로컬 상태에서 제거
        setNotifications(prev => prev.filter(n => n.id !== notificationId))
      }
    } catch (error) {
      console.error('알림 삭제 실패:', error)
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
        setNotifications(prev => 
          prev.map(n => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
        )
        setUnreadCount(0)
      }
    } catch (error) {
      console.error('전체 알림 읽음 처리 실패:', error)
    }
  }

  // 알림 타입별 아이콘 및 색상
  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'booking_created':
        return { icon: '📅', color: 'text-blue-600' }
      case 'payment_confirmed':
        return { icon: '💳', color: 'text-green-600' }
      case 'consultation_reminder':
        return { icon: '⏰', color: 'text-yellow-600' }
      case 'consultation_completed':
        return { icon: '✅', color: 'text-purple-600' }
      case 'review_reminder':
        return { icon: '⭐', color: 'text-orange-600' }
      case 'system':
        return { icon: '🔔', color: 'text-gray-600' }
      default:
        return { icon: '🔔', color: 'text-gray-600' }
    }
  }

  if (loading && notifications.length === 0) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600 dark:border-gray-400 mx-auto mb-4"></div>
            <h1 className="text-xl font-semibold mb-2">알림 불러오는 중...</h1>
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
                  🔔 알림
                </h1>
                <p className="text-gray-600">
                  모든 알림을 확인하고 관리할 수 있습니다.
                </p>
              </div>
              
              <div className="flex space-x-3">
                <Link href="/notifications/settings">
                  <Button variant="outline" size="sm">
                    <Settings className="w-4 h-4 mr-2" />
                    설정
                  </Button>
                </Link>
                
                {unreadCount > 0 && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={markAllAsRead}
                  >
                    <Check className="w-4 h-4 mr-2" />
                    모두 읽음
                  </Button>
                )}
              </div>
            </div>

            {/* 필터 */}
            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="flex space-x-4">
                  <Button
                    variant={filter === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('all')}
                  >
                    전체 ({notifications.length})
                  </Button>
                  <Button
                    variant={filter === 'unread' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('unread')}
                  >
                    읽지 않음 ({unreadCount})
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* 에러 메시지 */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-6">
                <p className="text-red-700">{error}</p>
              </div>
            )}

            {/* 알림 목록 */}
            {notifications.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <BellOff className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {filter === 'unread' ? '읽지 않은 알림이 없습니다' : '알림이 없습니다'}
                  </h3>
                  <p className="text-gray-600">
                    {filter === 'unread' 
                      ? '모든 알림을 읽었습니다.' 
                      : '새로운 알림이 도착하면 여기에 표시됩니다.'
                    }
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {notifications.map((notification) => {
                  const { icon, color } = getNotificationIcon(notification.type)
                  return (
                    <Card 
                      key={notification.id} 
                      className={`transition-all hover:shadow-md ${
                        !notification.isRead ? 'border-blue-200 bg-blue-50' : ''
                      }`}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start space-x-4">
                          {/* 알림 아이콘 */}
                          <div className={`text-2xl ${color}`}>
                            {icon}
                          </div>
                          
                          {/* 알림 내용 */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                         <h3 className={`text-lg font-semibold ${
           !notification.isRead ? 'text-gray-900' : 'text-gray-700'
         }`}>
                                  {notification.title}
                                </h3>
                                <p className="text-gray-600 mt-2 leading-relaxed">
                                  {notification.message}
                                </p>
                                
                                {/* 추가 데이터 표시 */}
                                {notification.data && Object.keys(notification.data).length > 0 && (
                                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                                    <p className="text-sm text-gray-500 mb-2">추가 정보:</p>
                                    <pre className="text-xs text-gray-600 whitespace-pre-wrap">
                                      {JSON.stringify(notification.data, null, 2)}
                                    </pre>
                                  </div>
                                )}
                                
                                <div className="flex items-center space-x-4 mt-4 text-sm text-gray-500">
                                  <span>
                                    📅 {new Date(notification.createdAt).toLocaleString('ko-KR')}
                                  </span>
                                            {notification.readAt && (
            <span>
              ✅ {new Date(notification.readAt).toLocaleString('ko-KR')}
            </span>
          )}
                                </div>
                              </div>
                              
                              {/* 상태 표시 */}
                              <div className="flex items-center space-x-2">
                                        {!notification.isRead && (
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            새 알림
          </Badge>
        )}
                                
                                <Badge variant="outline" className="text-xs">
                                  {notification.type}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* 액션 버튼 */}
                        <div className="flex justify-end space-x-2 mt-4 pt-4 border-t border-gray-100">
                          {!notification.isRead && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => markAsRead(notification.id)}
                            >
                              <Check className="w-4 h-4 mr-2" />
                              읽음
                            </Button>
                          )}
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteNotification(notification.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            삭제
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}

            {/* 더 보기 버튼 */}
            {hasMore && (
              <div className="text-center mt-8">
                <Button
                  variant="outline"
                  onClick={loadMore}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 dark:border-gray-400 mr-2"></div>
                      로딩 중...
                    </>
                  ) : (
                    '더 많은 알림 보기'
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
