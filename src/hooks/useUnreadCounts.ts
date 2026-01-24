'use client'

import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/context/AuthContext'

interface UnreadCounts {
  chat: number
  notifications: number
  total: number
}

export function useUnreadCounts() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['unread-counts', user?.id],
    queryFn: async (): Promise<UnreadCounts> => {
      if (!user) return { chat: 0, notifications: 0, total: 0 }

      try {
        // 병렬로 API 호출
        const [chatResponse, notificationResponse] = await Promise.all([
          // 채팅방 정보와 읽지 않은 메시지 확인
          fetch('/api/chat/rooms').then(async (res) => {
            const data = await res.json()
            if (data.success && data.rooms) {
              const amikoRoom = data.rooms.find((room: any) =>
                room.type === 'country' && (
                  room.name?.toLowerCase().includes('amiko') ||
                  room.name?.toLowerCase().includes('아미코')
                )
              )

              if (amikoRoom) {
                const unreadRes = await fetch(
                  `/api/chat/unread-check?roomId=${amikoRoom.id}&userId=${user.id}`,
                  { cache: 'no-store' }
                )
                const unreadData = await unreadRes.json()
                return unreadData.success ? unreadData.unreadCount || 0 : 0
              }
            }
            return 0
          }),
          // 알림 개수 확인
          fetch('/api/notifications/unread-count', { cache: 'no-store' })
            .then(res => res.json())
            .then(data => data.count || 0)
            .catch(() => 0)
        ])

        const chat = chatResponse
        const notifications = notificationResponse
        const total = chat + notifications

        return { chat, notifications, total }
      } catch (error) {
        console.error('Failed to fetch unread counts:', error)
        return { chat: 0, notifications: 0, total: 0 }
      }
    },
    enabled: !!user,
    staleTime: 10000, // 10초 동안 fresh 상태 유지
    refetchInterval: 30000, // 30초마다 백그라운드에서 재검증
    refetchIntervalInBackground: false, // 백그라운드에서는 재검증하지 않음
  })
}
