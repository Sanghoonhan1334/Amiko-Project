'use client'

import { useEffect, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'

export default function HistoryManager() {
  const router = useRouter()
  const pathname = usePathname()
  const isInitialized = useRef(false)
  const touchStartX = useRef(0)
  const touchStartY = useRef(0)
  const isSwipeFromEdge = useRef(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    // 초기 히스토리 설정 (한 번만 실행)
    if (!isInitialized.current) {
      // 히스토리가 비어있으면 초기 상태 추가
      if (window.history.state === null) {
        window.history.replaceState({ index: 0, preventBack: false }, '', pathname)
      }
      isInitialized.current = true
    }

    // 터치 시작 핸들러 - 왼쪽 가장자리에서 시작하는지 확인
    const handleTouchStart = (e: TouchEvent) => {
      try {
        if (!e.touches || e.touches.length === 0) return
        
        touchStartX.current = e.touches[0].clientX
        touchStartY.current = e.touches[0].clientY
        
        // 왼쪽 가장자리에서 시작하는 스와이프인지 확인 (20px 이내)
        isSwipeFromEdge.current = touchStartX.current <= 20
      } catch (error) {
        console.error('[HistoryManager] touchstart error:', error)
      }
    }

    // 터치 이동 핸들러 - 왼쪽 가장자리에서 시작한 스와이프 방지
    const handleTouchMove = (e: TouchEvent) => {
      try {
        if (!isSwipeFromEdge.current || !e.touches || e.touches.length === 0) return

        const touchX = e.touches[0].clientX
        const touchY = e.touches[0].clientY
        const deltaX = touchX - touchStartX.current
        const deltaY = Math.abs(touchY - touchStartY.current)

        // 수평 스와이프가 수직 스와이프보다 크고, 오른쪽으로 스와이프하는 경우
        // (뒤로가기 제스처)
        if (deltaX > 0 && Math.abs(deltaX) > deltaY && Math.abs(deltaX) > 10) {
          // 뒤로가기 제스처 방지
          e.preventDefault()
        }
      } catch (error) {
        console.error('[HistoryManager] touchmove error:', error)
      }
    }

    // 터치 종료 핸들러
    const handleTouchEnd = () => {
      isSwipeFromEdge.current = false
    }

    // popstate 이벤트 리스너 (뒤로가기 버튼 감지)
    const handlePopState = (event: PopStateEvent) => {
      try {
        const currentState = window.history.state
        const currentPath = window.location.pathname

        // 히스토리가 비어있거나 첫 페이지인 경우
        if (currentState === null || (currentState.index !== undefined && currentState.index === 0)) {
          // 로그인, 회원가입, 랜딩 페이지에서 뒤로가기를 누른 경우
          if (currentPath === '/sign-in' || currentPath === '/sign-up' || currentPath === '/') {
            // 랜딩 페이지로 이동 (앱 종료 방지)
            event.preventDefault()
            router.push('/')
            // 히스토리 다시 추가
            setTimeout(() => {
              window.history.pushState({ index: 0, preventBack: false }, '', '/')
            }, 0)
          } else {
            // 다른 페이지에서는 메인으로 이동
            event.preventDefault()
            router.push('/main?tab=home')
            setTimeout(() => {
              window.history.pushState({ index: 0, preventBack: false }, '', '/main?tab=home')
            }, 0)
          }
        }
      } catch (error) {
        console.error('[HistoryManager] popstate error:', error)
      }
    }

    // 이벤트 리스너 등록
    // passive: false를 사용하여 preventDefault() 호출 가능하게 함
    document.addEventListener('touchstart', handleTouchStart, { passive: true })
    document.addEventListener('touchmove', handleTouchMove, { passive: false })
    document.addEventListener('touchend', handleTouchEnd, { passive: true })
    window.addEventListener('popstate', handlePopState)

    return () => {
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
      window.removeEventListener('popstate', handlePopState)
    }
  }, [pathname, router])

  return null
}

