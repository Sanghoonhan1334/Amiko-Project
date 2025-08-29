'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface AdminNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  data?: any;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  is_read: boolean;
  read_by?: string;
  read_at?: string;
  target_roles: string[];
  created_at: string;
  expires_at?: string;
}

interface NotificationData {
  notifications: AdminNotification[];
  unreadCount: number;
  pagination: {
    limit: number;
    offset: number;
    total: number;
  };
}

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [userId, setUserId] = useState<string>(''); // 실제로는 인증에서 가져와야 함

  // 알림 목록 조회
  const fetchNotifications = async (unreadOnly: boolean = false) => {
    if (!userId) return;

    try {
      setLoading(true);
      const response = await fetch(
        `/api/admin/notifications?userId=${userId}&unreadOnly=${unreadOnly}&limit=100`,
        { method: 'GET' }
      );

      const result = await response.json();

      if (response.ok) {
        setNotifications(result.data.notifications);
        setUnreadCount(result.data.unreadCount);
      } else {
        setError(result.error || '알림 조회에 실패했습니다.');
      }
    } catch (err) {
      setError('알림 조회 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 알림 읽음 처리
  const markAsRead = async (notificationId: string) => {
    if (!userId) return;

    try {
      const response = await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'mark_read',
          notificationId,
          userId
        })
      });

      if (response.ok) {
        // 로컬 상태 업데이트
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === notificationId 
              ? { ...notif, is_read: true }
              : notif
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('알림 읽음 처리 실패:', err);
    }
  };

  // 모든 알림 읽음 처리
  const markAllAsRead = async () => {
    if (!userId) return;

    try {
      const response = await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'mark_all_read',
          userId
        })
      });

      if (response.ok) {
        // 로컬 상태 업데이트
        setNotifications(prev => 
          prev.map(notif => ({ ...notif, is_read: true }))
        );
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('모든 알림 읽음 처리 실패:', err);
    }
  };

  // 우선순위별 색상
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'normal': return 'bg-blue-500 text-white';
      case 'low': return 'bg-gray-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  // 타입별 아이콘
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'new_booking': return '🎉';
      case 'payment_completed': return '✅';
      case 'payment_failed': return '❌';
      case 'consultation_reminder': return '⏰';
      case 'system_alert': return '🔔';
      default: return '📢';
    }
  };

  // 날짜 포맷팅
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return '방금 전';
    if (diffInHours < 24) return `${diffInHours}시간 전`;
    if (diffInHours < 48) return '어제';
    
    return date.toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  useEffect(() => {
    // 임시로 하드코딩된 사용자 ID (실제로는 인증에서 가져와야 함)
    setUserId('temp-admin-user-id');
  }, []);

  useEffect(() => {
    if (userId) {
      fetchNotifications();
    }
  }, [userId]);

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">🔔 관리자 알림</h1>
            <p className="text-gray-600 mt-2">
              시스템 알림과 중요한 이벤트를 확인하세요.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="secondary" className="text-lg px-4 py-2">
              읽지 않음: {unreadCount}건
            </Badge>
            {unreadCount > 0 && (
              <Button onClick={markAllAsRead} variant="outline">
                모두 읽음 처리
              </Button>
            )}
          </div>
        </div>
      </div>

      {error && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-600">❌ 오류 발생</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-700">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* 필터 버튼 */}
      <div className="mb-6 flex gap-2">
        <Button 
          onClick={() => fetchNotifications(false)} 
          variant="outline"
        >
          전체 알림
        </Button>
        <Button 
          onClick={() => fetchNotifications(true)} 
          variant="outline"
        >
          읽지 않은 알림
        </Button>
      </div>

      {/* 알림 목록 */}
      <div className="space-y-4">
        {notifications.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-gray-500">알림이 없습니다.</p>
            </CardContent>
          </Card>
        ) : (
          notifications.map((notification) => (
            <Card 
              key={notification.id} 
              className={`transition-all duration-200 ${
                notification.is_read 
                  ? 'opacity-75 bg-gray-50' 
                  : 'border-l-4 border-l-blue-500 bg-white'
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getTypeIcon(notification.type)}</span>
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        {notification.title}
                        <Badge className={getPriorityColor(notification.priority)}>
                          {notification.priority.toUpperCase()}
                        </Badge>
                        {!notification.is_read && (
                          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                            새로움
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {formatDate(notification.created_at)}
                      </CardDescription>
                    </div>
                  </div>
                  {!notification.is_read && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => markAsRead(notification.id)}
                    >
                      읽음 처리
                    </Button>
                  )}
                </div>
              </CardHeader>
              
              <CardContent>
                <p className="text-gray-700 mb-3">{notification.message}</p>
                
                {notification.data && (
                  <div className="bg-gray-50 p-3 rounded-md">
                    <h4 className="font-medium text-sm text-gray-600 mb-2">📋 상세 정보</h4>
                    <pre className="text-xs text-gray-700 whitespace-pre-wrap overflow-x-auto">
                      {JSON.stringify(notification.data, null, 2)}
                    </pre>
                  </div>
                )}
                
                <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
                  <span>대상 역할: {notification.target_roles.join(', ')}</span>
                  {notification.read_by && (
                    <span>읽음: {notification.read_at}</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* 알림 통계 */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>📊 알림 통계</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{notifications.length}</div>
              <div className="text-sm text-gray-600">전체 알림</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{unreadCount}</div>
              <div className="text-sm text-gray-600">읽지 않음</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {notifications.filter(n => n.priority === 'high' || n.priority === 'urgent').length}
              </div>
              <div className="text-sm text-gray-600">중요 알림</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {notifications.filter(n => n.type === 'new_booking').length}
              </div>
              <div className="text-sm text-gray-600">새 예약</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
