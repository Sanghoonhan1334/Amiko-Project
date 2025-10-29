'use client'

import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useLanguage } from '@/context/LanguageContext'

interface ProtectedRouteProps {
  children: React.ReactNode
  redirectTo?: string
}

export default function ProtectedRoute({ 
  children, 
  redirectTo = '/sign-in' 
}: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const { t } = useLanguage()
  const [isInitialized, setIsInitialized] = useState(false)
  const [hasLocalSession, setHasLocalSession] = useState(false)
  const [sessionWaitTimeout, setSessionWaitTimeout] = useState(false)

  // 로컬 스토리지에서 세션 확인
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedSession = localStorage.getItem('amiko_session')
      if (savedSession) {
        try {
          const sessionData = JSON.parse(savedSession)
          const now = Math.floor(Date.now() / 1000)
          if (sessionData.expires_at > now) {
            setHasLocalSession(true)
            // 로컬 세션이 있으면 3초 후 타임아웃 설정
            const timeout = setTimeout(() => {
              setSessionWaitTimeout(true)
            }, 3000)
            return () => clearTimeout(timeout)
          }
        } catch {
          // 파싱 에러 무시
        }
      }
    }
  }, [])

  // 초기 로드 시 세션 복구를 위한 추가 대기 시간
  useEffect(() => {
    if (!loading) {
      // 로컬 세션이 있으면 더 길게 기다림
      const waitTime = hasLocalSession ? 1000 : 500
      const timer = setTimeout(() => {
        setIsInitialized(true)
      }, waitTime)
      
      return () => clearTimeout(timer)
    }
  }, [loading, hasLocalSession])

  useEffect(() => {
    // 초기화가 완료되고 로딩이 끝났는데도 사용자가 없으면 리다이렉트
    // 단, 로컬 세션이 있으면 타임아웃이 지나거나 세션이 없을 때만 리다이렉트
    if (isInitialized && !loading && !user) {
      if (!hasLocalSession || sessionWaitTimeout) {
        console.log('[ProtectedRoute] 인증되지 않은 사용자, 로그인 페이지로 리다이렉트')
        router.push(redirectTo)
      }
    }
  }, [user, loading, isInitialized, hasLocalSession, sessionWaitTimeout, router, redirectTo])

  // 로딩 중이거나 아직 초기화되지 않았으면 로딩 표시
  if (loading || !isInitialized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600 dark:border-gray-400 mx-auto mb-4"></div>
          <h1 className="text-xl font-semibold mb-2">{t('auth.verifying')}</h1>
          <p className="text-gray-600">{t('auth.pleaseWait')}</p>
        </div>
      </div>
    )
  }

  // 로컬 세션이 있는데 사용자가 없으면 아직 복구 중일 수 있으므로 로딩 표시
  // 단, 타임아웃이 지나면 리다이렉트
  if (!user && hasLocalSession && !sessionWaitTimeout) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600 dark:border-gray-400 mx-auto mb-4"></div>
          <h1 className="text-xl font-semibold mb-2">{t('auth.verifying')}</h1>
          <p className="text-gray-600">{t('auth.pleaseWait')}</p>
        </div>
      </div>
    )
  }

  // 사용자가 없으면 아무것도 렌더링하지 않음 (리다이렉트 중)
  if (!user) {
    return null
  }

  // 인증된 사용자면 자식 컴포넌트 렌더링
  return <>{children}</>
}
