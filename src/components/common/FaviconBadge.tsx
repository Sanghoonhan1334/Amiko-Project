'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useUnreadCounts } from '@/hooks/useUnreadCounts'

export default function FaviconBadge() {
  const { user } = useAuth()
  const { data: unreadCounts } = useUnreadCounts()
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

  // 읽지 않은 채팅 + 알림 합계 가져오기 (React Query로 대체)
  // fetchTotalUnreadCount 함수는 더 이상 사용하지 않음

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

    // React Query가 자동으로 데이터를 가져오므로 수동 호출 불필요
  }, [updateFavicon])

  // 읽지 않은 메시지 개수 변경 시 UI 업데이트
  useEffect(() => {
    const total = unreadCounts?.total || 0
    updateTitle(total)
    updateAppBadge(total)
  }, [unreadCounts?.total, updateTitle, updateAppBadge])

  return null
}

