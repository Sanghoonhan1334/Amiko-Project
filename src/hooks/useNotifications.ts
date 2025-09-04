'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'

interface NotificationSchedule {
  sessionId: string
  sessionDate: Date
  notified24h: boolean
  notified1h: boolean
  notified10m: boolean
}

interface SessionNotification {
  id: string
  type: '24h' | '1h' | '10m'
  sessionId: string
  sessionDate: Date
  title: string
  message: string
  scheduledAt: Date
}

export function useNotifications() {
  const [schedules, setSchedules] = useState<NotificationSchedule[]>([])
  const [notifications, setNotifications] = useState<SessionNotification[]>([])

  // 알림 스케줄 등록
  const scheduleSessionNotifications = useCallback((sessionId: string, sessionDate: Date) => {
    const now = new Date()
    const session = new Date(sessionDate)
    
    // 24시간 전
    const notify24h = new Date(session.getTime() - 24 * 60 * 60 * 1000)
    // 1시간 전
    const notify1h = new Date(session.getTime() - 60 * 60 * 1000)
    // 10분 전
    const notify10m = new Date(session.getTime() - 10 * 60 * 1000)

    const newNotifications: SessionNotification[] = []

    if (notify24h > now) {
      newNotifications.push({
        id: `${sessionId}-24h`,
        type: '24h',
        sessionId,
        sessionDate: session,
        title: '🎈 내일 라운지 세션이 있어요!',
        message: '내일 토요일 20:00 라운지에서 만나요. 미리 일정을 확인해보세요!',
        scheduledAt: notify24h
      })
    }

    if (notify1h > now) {
      newNotifications.push({
        id: `${sessionId}-1h`,
        type: '1h',
        sessionId,
        sessionDate: session,
        title: '🎈 1시간 후 라운지 시작!',
        message: '곧 라운지가 시작됩니다. 준비하고 참여해보세요!',
        scheduledAt: notify1h
      })
    }

    if (notify10m > now) {
      newNotifications.push({
        id: `${sessionId}-10m`,
        type: '10m',
        sessionId,
        sessionDate: session,
        title: '🎈 10분 후 라운지 시작!',
        message: '라운지가 곧 시작됩니다. 지금 입장하세요!',
        scheduledAt: notify10m
      })
    }

    setNotifications(prev => [...prev.filter(n => n.sessionId !== sessionId), ...newNotifications])
    
    // 스케줄 상태 업데이트
    setSchedules(prev => {
      const existing = prev.find(s => s.sessionId === sessionId)
      if (existing) {
        return prev.map(s => 
          s.sessionId === sessionId 
            ? { ...s, sessionDate: session }
            : s
        )
      } else {
        return [...prev, {
          sessionId,
          sessionDate: session,
          notified24h: notify24h <= now,
          notified1h: notify1h <= now,
          notified10m: notify10m <= now
        }]
      }
    })
  }, [])

  // 푸시 알림 전송
  const sendPushNotification = useCallback(async (notification: SessionNotification) => {
    try {
      // 브라우저 알림 권한 확인
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: notification.id,
          requireInteraction: false,
          silent: false
        })
      }

      // 인앱 토스트 알림
      toast(notification.title, {
        description: notification.message,
        duration: 5000,
        action: {
          label: '라운지 가기',
          onClick: () => {
            window.location.href = '/main?tab=community&cTab=lounge'
          }
        }
      })

      console.log('알림 전송:', notification)
    } catch (error) {
      console.error('알림 전송 실패:', error)
    }
  }, [])

  // 알림 권한 요청
  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission()
      return permission === 'granted'
    }
    return false
  }, [])

  // 알림 체크 및 전송
  const checkAndSendNotifications = useCallback(() => {
    const now = new Date()
    
    notifications.forEach(notification => {
      const schedule = schedules.find(s => s.sessionId === notification.sessionId)
      if (!schedule) return

      const shouldSend = 
        (notification.type === '24h' && !schedule.notified24h && notification.scheduledAt <= now) ||
        (notification.type === '1h' && !schedule.notified1h && notification.scheduledAt <= now) ||
        (notification.type === '10m' && !schedule.notified10m && notification.scheduledAt <= now)

      if (shouldSend) {
        sendPushNotification(notification)
        
        // 알림 전송 상태 업데이트
        setSchedules(prev => prev.map(s => 
          s.sessionId === notification.sessionId
            ? {
                ...s,
                notified24h: notification.type === '24h' ? true : s.notified24h,
                notified1h: notification.type === '1h' ? true : s.notified1h,
                notified10m: notification.type === '10m' ? true : s.notified10m
              }
            : s
        ))
      }
    })
  }, [notifications, schedules, sendPushNotification])

  // 1분마다 알림 체크
  useEffect(() => {
    const interval = setInterval(checkAndSendNotifications, 60000) // 1분
    checkAndSendNotifications() // 즉시 한 번 체크
    
    return () => clearInterval(interval)
  }, [checkAndSendNotifications])

  // 페이지 로드 시 알림 권한 요청
  useEffect(() => {
    requestNotificationPermission()
  }, [requestNotificationPermission])

  return {
    scheduleSessionNotifications,
    requestNotificationPermission,
    schedules,
    notifications
  }
}
