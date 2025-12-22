'use client'

import { useEffect, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'

export default function HistoryManager() {
  const router = useRouter()
  const pathname = usePathname()
  const isInitialized = useRef(false)

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

    // popstate 이벤트 리스너 (뒤로가기 버튼 감지)
    const handlePopState = (event: PopStateEvent) => {
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
    }

    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [pathname, router])

  return null
}

