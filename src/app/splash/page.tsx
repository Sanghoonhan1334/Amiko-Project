'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import SplashSequence from '@/components/splash/SplashSequence'
import { Capacitor } from '@capacitor/core'

export default function SplashPage() {
  const router = useRouter()
  const [showSplash, setShowSplash] = useState(false)

  useEffect(() => {
    // prefers-reduced-motion 확인
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    
    if (prefersReducedMotion) {
      // 애니메이션 감소 설정이 활성화된 경우 500ms 후 즉시 이동
      setTimeout(() => {
        router.push('/')
      }, 500)
      return
    }

    // 앱인지 웹인지 확인
    const isApp = Capacitor.isNativePlatform()
    
    if (isApp) {
      // 앱: 백그라운드에서 돌아온 경우인지 확인
      const lastActiveTime = localStorage.getItem('lastActiveTime')
      const now = Date.now()
      const timeSinceLastActive = lastActiveTime ? now - parseInt(lastActiveTime) : Infinity
      
      // 30초 이상 비활성 상태였다면 앱 재시작으로 간주
      if (timeSinceLastActive > 30000) {
        setShowSplash(true)
      } else {
        // 백그라운드에서 돌아온 경우 즉시 이동
        router.push('/')
        return
      }
      
      // 현재 시간 저장
      localStorage.setItem('lastActiveTime', now.toString())
    } else {
      // 웹: 매번 스플래시 애니메이션 시작
      setShowSplash(true)
    }
  }, [router])

  const handleSplashComplete = () => {
    // 스플래시 완료 후 홈으로 이동 (localStorage 저장 제거)
    router.push('/')
  }

  if (!showSplash) {
    return (
      <div className="fixed inset-0 bg-white flex items-center justify-center z-50">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <SplashSequence onComplete={handleSplashComplete} />
    </div>
  )
}
