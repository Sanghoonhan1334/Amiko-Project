'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';


interface AdminNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  is_read: boolean;
  read_by?: string;
  read_at?: string;
  target_roles: string[];
  created_at: string;
  expires_at?: string;
}

export default function AdminNotificationsPage() {
  const { language } = useLanguage();
  const { token } = useAuth();
  const t = (ko: string, es: string) => language === 'ko' ? ko : es;

  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [userId, setUserId] = useState<string>('');

  const fetchNotifications = useCallback(async (unreadOnly: boolean = false) => {
    if (!userId) return;

    try {
      setLoading(true);
      const response = await fetch(
        `/api/admin/notifications?userId=${userId}&unreadOnly=${unreadOnly}&limit=100`,
        { method: 'GET', headers: { Authorization: `Bearer ${token}` } }
      );

      const result = await response.json();

      if (response.ok) {
        setNotifications(result.data.notifications);
        setUnreadCount(result.data.unreadCount);
      } else {
        setError(result.error || t('알림 조회에 실패했습니다.', 'Error al cargar notificaciones.'));
      }
    } catch {
      setError(t('알림을 가져오는 중 오류가 발생했습니다.', 'Error al obtener notificaciones.'));
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const markAsRead = async (notificationId: string) => {
    if (!userId) return;

    try {
      const response = await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          action: 'mark_read',
          notificationId,
          userId
        })
      });

      if (response.ok) {
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
      console.error('Mark as read failed:', err);
    }
  };

  const markAllAsRead = async () => {
    if (!userId) return;

    try {
      const response = await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          action: 'mark_all_read',
          userId
        })
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => ({ ...notif, is_read: true }))
        );
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('Mark all as read failed:', err);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'normal': return 'bg-blue-500 text-white';
      case 'low': return 'bg-gray-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return t('방금 전', 'Justo ahora');
    if (diffInHours < 24) return `${diffInHours}${t('시간 전', ' horas atrás')}`;
    if (diffInHours < 48) return t('어제', 'Ayer');
    
    return date.toLocaleDateString(language === 'ko' ? 'ko-KR' : 'es-ES', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  useEffect(() => {
    setUserId('temp-admin-user-id');
  }, []);

  useEffect(() => {
    if (userId) {
      fetchNotifications();
    }
  }, [userId, fetchNotifications]);

  if (loading) {
    return (
      <div className="container mx-auto p-6 dark:bg-gray-900">
        <div className="text-center dark:text-gray-200">{t('로딩 중...', 'Cargando...')}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl dark:bg-gray-900">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold dark:text-white">🔔 {t('관리자 알림', 'Notificaciones del Administrador')}</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              {t('시스템 알림과 중요한 이벤트를 확인하세요.', 'Revise las notificaciones del sistema y eventos importantes.')}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="secondary" className="text-lg px-4 py-2 dark:bg-gray-700 dark:text-gray-200">
              {t(`읽지 않음: ${unreadCount}건`, `${unreadCount} sin leer`)}
            </Badge>
            {unreadCount > 0 && (
              <Button onClick={markAllAsRead} variant="outline" className="dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700">
                {t('모두 읽음 처리', 'Marcar todo como leído')}
              </Button>
            )}
          </div>
        </div>
      </div>

      {error && (
        <Card className="mb-6 border-red-200 bg-red-50 dark:bg-red-900/30 dark:border-red-800">
          <CardHeader>
            <CardTitle className="text-red-600 dark:text-red-400">❌ {t('오류 발생', 'Error')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-700 dark:text-red-300">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Filter buttons */}
      <div className="mb-6 flex gap-2">
        <Button 
          onClick={() => fetchNotifications(false)} 
          variant="outline"
          className="dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
        >
          {t('전체 알림', 'Todas las Notificaciones')}
        </Button>
        <Button 
          onClick={() => fetchNotifications(true)} 
          variant="outline"
          className="dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
        >
          {t('읽지 않은 알림', 'No Leídas')}
        </Button>
      </div>

      {/* Notification list */}
      <div className="space-y-4">
        {notifications.length === 0 ? (
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">{t('알림이 없습니다.', 'No hay notificaciones.')}</p>
            </CardContent>
          </Card>
        ) : (
          notifications.map((notification) => (
            <Card 
              key={notification.id} 
              className={`transition-all duration-200 ${
                notification.is_read 
                  ? 'opacity-75 bg-gray-50 dark:bg-gray-800/50' 
                  : 'border-l-4 border-l-blue-500 bg-white dark:bg-gray-800'
              } dark:border-gray-700`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getTypeIcon(notification.type)}</span>
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2 dark:text-white">
                        {notification.title}
                        <Badge className={getPriorityColor(notification.priority)}>
                          {notification.priority.toUpperCase()}
                        </Badge>
                        {!notification.is_read && (
                          <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                            {t('새로움', 'Nuevo')}
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="mt-1 dark:text-gray-400">
                        {formatDate(notification.created_at)}
                      </CardDescription>
                    </div>
                  </div>
                  {!notification.is_read && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => markAsRead(notification.id)}
                      className="dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                    >
                      {t('읽음 처리', 'Marcar como leído')}
                    </Button>
                  )}
                </div>
              </CardHeader>
              
              <CardContent>
                <p className="text-gray-700 dark:text-gray-300 mb-3">{notification.message}</p>
                
                {notification.data && (
                  <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-md">
                    <h4 className="font-medium text-sm text-gray-600 dark:text-gray-300 mb-2">📋 {t('상세 정보', 'Detalles')}</h4>
                    <pre className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap overflow-x-auto">
                      {JSON.stringify(notification.data, null, 2)}
                    </pre>
                  </div>
                )}
                
                <div className="mt-3 flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                  <span>{t('대상 역할', 'Rol objetivo')}: {notification.target_roles.join(', ')}</span>
                  {notification.read_by && (
                    <span>{t('읽음', 'Leído')}: {notification.read_at}</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Notification statistics */}
      <Card className="mt-8 dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="dark:text-white">📊 {t('알림 통계', 'Estadísticas de Notificaciones')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{notifications.length}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">{t('전체 알림', 'Total')}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{unreadCount}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">{t('읽지 않음', 'Sin leer')}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {notifications.filter(n => n.priority === 'high' || n.priority === 'urgent').length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">{t('중요 알림', 'Importantes')}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {notifications.filter(n => n.type === 'new_booking').length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">{t('새 예약', 'Nuevas Reservas')}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
