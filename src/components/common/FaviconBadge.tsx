'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useAuth } from '@/context/AuthContext'

export default function FaviconBadge() {
  const { user } = useAuth()
  const [totalUnreadCount, setTotalUnreadCount] = useState(0)
  const faviconUrlRef = useRef<string | null>(null)

  // SVG 파비콘 생성 (배지 없이 하얀 원 + 검은색 A만)
  const updateFavicon = useCallback((count: number) => {
    if (typeof window === 'undefined' || !document?.head) return

    try {
      // 배지 없이 하얀 원 + 검은색 A만
      const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
          <!-- 하얀 원 배경 -->
          <circle cx="16" cy="16" r="16" fill="#FFFFFF" stroke="#E5E7EB" stroke-width="1"/>
          <!-- 검은색 A 글씨 -->
          <text x="16" y="22" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#000000" text-anchor="middle">A</text>
        </svg>
      `

      const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })
      const url = URL.createObjectURL(svgBlob)

      // 이전 URL 정리
      if (faviconUrlRef.current) {
        try {
          URL.revokeObjectURL(faviconUrlRef.current)
        } catch (e) {
          // 무시
        }
      }
      faviconUrlRef.current = url

      // 기존 icon link 태그 찾기 (rel="icon"만, 첫 번째 것만)
      const iconLink = document.querySelector('link[rel="icon"]') as HTMLLinkElement
      
      if (iconLink && iconLink.parentNode) {
        // 기존 link가 있으면 href만 업데이트 (안전하게)
        try {
          iconLink.href = url
          iconLink.type = 'image/svg+xml'
        } catch (e) {
          console.warn('[FaviconBadge] 파비콘 업데이트 실패:', e)
        }
      } else if (document.head) {
        // 기존 link가 없으면 새로 생성
        try {
          const newLink = document.createElement('link')
          newLink.rel = 'icon'
          newLink.type = 'image/svg+xml'
          newLink.href = url
          document.head.appendChild(newLink)
        } catch (e) {
          console.warn('[FaviconBadge] 파비콘 생성 실패:', e)
        }
      }
    } catch (error) {
      console.error('[FaviconBadge] 파비콘 업데이트 실패:', error)
    }
  }, [])

  // 읽지 않은 채팅 + 알림 합계 가져오기
  const fetchTotalUnreadCount = useCallback(async () => {
    if (!user) {
      setTotalUnreadCount(0)
      updateTitle(0)
      updateAppBadge(0)
      return
    }

    try {
      // 1. 읽지 않은 채팅 개수
      let unreadChatCount = 0
      try {
        const roomsResponse = await fetch('/api/chat/rooms')
        const roomsData = await roomsResponse.json()
        
        if (roomsData.success && roomsData.rooms) {
          const amikoRoom = roomsData.rooms.find((room: any) => 
            room.type === 'country' && (
              room.name?.toLowerCase().includes('amiko') || 
              room.name?.toLowerCase().includes('아미코')
            )
          )
          
          if (amikoRoom) {
            const chatResponse = await fetch(
              `/api/chat/unread-check?roomId=${amikoRoom.id}&userId=${user.id}`,
              { cache: 'no-store' }
            )
            const chatData = await chatResponse.json()
            if (chatData.success) {
              unreadChatCount = chatData.unreadCount || 0
            }
          }
        }
      } catch (error) {
        console.error('[FaviconBadge] 채팅 개수 조회 실패:', error)
      }

      // 2. 읽지 않은 알림 개수
      let unreadNotificationCount = 0
      try {
        const notificationResponse = await fetch('/api/notifications/unread-count', {
          cache: 'no-store'
        })
        const notificationData = await notificationResponse.json()
        unreadNotificationCount = notificationData.count || 0
      } catch (error) {
        console.error('[FaviconBadge] 알림 개수 조회 실패:', error)
      }

      // 3. 합계 계산
      const total = unreadChatCount + unreadNotificationCount
      setTotalUnreadCount(total)
      updateTitle(total)
      updateAppBadge(total)
    } catch (error) {
      console.error('[FaviconBadge] 전체 개수 조회 실패:', error)
    }
  }, [user])

  // 타이틀 업데이트
  const updateTitle = useCallback((count: number) => {
    if (typeof window === 'undefined' || !document) return
    try {
      if (count > 0) {
        document.title = `(${count > 99 ? '99+' : count}) Amiko - 한국 문화 교류 플랫폼`
      } else {
        document.title = 'Amiko - 한국 문화 교류 플랫폼'
      }
    } catch (error) {
      console.warn('[FaviconBadge] 타이틀 업데이트 실패:', error)
    }
  }, [])

  // PWA 앱 아이콘 배지 업데이트 (Badging API)
  const updateAppBadge = useCallback(async (count: number) => {
    if (typeof window === 'undefined') return

    // Badging API 지원 확인
    if ('setAppBadge' in navigator) {
      try {
        if (count > 0) {
          await (navigator as any).setAppBadge(count)
        } else {
          await (navigator as any).clearAppBadge()
        }
      } catch (error) {
        console.error('[FaviconBadge] 앱 배지 업데이트 실패:', error)
      }
    }
  }, [])

  useEffect(() => {
    // 초기 파비콘 설정 (한 번만)
    updateFavicon(0)
    
    fetchTotalUnreadCount()
    const interval = setInterval(fetchTotalUnreadCount, 5000)
    
    return () => {
      clearInterval(interval)
      // cleanup에서는 파비콘을 건드리지 않음 (다른 스크립트와 충돌 방지)
      updateTitle(0)
      updateAppBadge(0)
      
      // URL 정리
      if (faviconUrlRef.current) {
        try {
          URL.revokeObjectURL(faviconUrlRef.current)
        } catch (e) {
          // 무시
        }
        faviconUrlRef.current = null
      }
    }
  }, [user, fetchTotalUnreadCount, updateFavicon, updateTitle, updateAppBadge])

  return null
}

