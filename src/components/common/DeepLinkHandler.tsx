'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Capacitor } from '@capacitor/core'

/**
 * 딥링크 처리 컴포넌트
 * 네이티브 앱에서 Universal Link와 Custom URL Scheme을 처리합니다.
 */
export default function DeepLinkHandler() {
  const router = useRouter()

  useEffect(() => {
    // 네이티브 앱에서만 실행
    if (!Capacitor.isNativePlatform()) {
      return
    }

    let appUrlOpenListener: any = null

    const setupDeepLinkListener = async () => {
      try {
        const { App } = await import('@capacitor/app')

        // 앱이 딥링크로 열렸을 때 처리
        appUrlOpenListener = await App.addListener('appUrlOpen', (data) => {
          console.log('[DEEP_LINK] 앱 딥링크 수신:', data.url)

          try {
            const url = new URL(data.url)

            // OAuth 콜백 처리
            if (url.pathname === '/auth/callback' || url.pathname.includes('/auth/callback')) {
              console.log('[DEEP_LINK] OAuth 콜백 처리:', url.href)

              // URL에서 인증 코드 추출
              const code = url.searchParams.get('code')
              const error = url.searchParams.get('error')

              if (error) {
                console.error('[DEEP_LINK] OAuth 오류:', error)
                // 오류 처리 - 로그인 페이지로 리다이렉트
                router.push('/sign-in?error=oauth_error')
                return
              }

              if (code) {
                console.log('[DEEP_LINK] 인증 코드 수신, 세션 교환 시도')

                // 인증 코드를 세션으로 교환
                // WebView에서 콜백 URL로 이동하여 서버에서 처리하도록 함
                const callbackUrl = `${window.location.origin}/auth/callback${url.search}`
                console.log('[DEEP_LINK] WebView에서 콜백 처리:', callbackUrl)

                window.location.href = callbackUrl
              }
            }
          } catch (error) {
            console.error('[DEEP_LINK] 딥링크 처리 오류:', error)
          }
        })

        console.log('[DEEP_LINK] 딥링크 리스너 설정 완료')
      } catch (error) {
        console.error('[DEEP_LINK] 딥링크 리스너 설정 실패:', error)
      }
    }

    setupDeepLinkListener()

    // 클린업
    return () => {
      if (appUrlOpenListener) {
        appUrlOpenListener.remove()
      }
    }
  }, [router])

  return null // UI를 렌더링하지 않음
}

