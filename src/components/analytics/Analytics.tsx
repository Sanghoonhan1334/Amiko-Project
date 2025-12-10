'use client'

import Script from 'next/script'
import { useEffect, useRef } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { trackPageView, trackSessionStart } from '@/lib/analytics'

const GA4_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID || 'G-5RM3B0CKWJ'

export default function Analytics() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const isInitialized = useRef(false)

  // localhost 감지 (컴포넌트 내부에서만 실행)
  const isLocalhost =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname.includes('localhost'))

  // DEBUG_MODE 계산 (컴포넌트 내부에서만 실행)
  const DEBUG_MODE = process.env.NODE_ENV === 'development' || isLocalhost

  // Session start tracking (once per session)
  useEffect(() => {
    trackSessionStart()
  }, [])

  // 페이지뷰 추적
  useEffect(() => {
    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '')
    trackPageView(url)
  }, [pathname, searchParams])

  // GA 초기화 중복 방지
  useEffect(() => {
    if (isInitialized.current) return
    isInitialized.current = true
  }, [])

  return (
    <>
      {GA4_MEASUREMENT_ID && (
        <>
          <Script
            id="ga4-measurement"
            strategy="afterInteractive"
            src={`https://www.googletagmanager.com/gtag/js?id=${GA4_MEASUREMENT_ID}`}
            onLoad={() => {
              // 스크립트 로드 확인
              if (typeof window !== 'undefined' && (window as any).gtag) {
                console.log('[GA4] Script loaded successfully', {
                  measurementId: GA4_MEASUREMENT_ID,
                  debugMode: DEBUG_MODE,
                  hostname: typeof window !== 'undefined' ? window.location.hostname : 'unknown'
                })
              }
            }}
          />
          <Script id="ga4-config" strategy="afterInteractive">
            {`
              (function() {
                if (window.__GA4_INITIALIZED__) {
                  console.warn('[GA4] Already initialized, skipping...');
                  return;
                }
                window.__GA4_INITIALIZED__ = true;

                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());

                var isLocalhost =
                  location.hostname === 'localhost' ||
                  location.hostname === '127.0.0.1' ||
                  location.hostname.indexOf('localhost') !== -1;

                var debugMode = ${process.env.NODE_ENV === 'development' ? 'true' : 'false'} || isLocalhost;

                gtag('config', '${GA4_MEASUREMENT_ID}', {
                  page_path: window.location.pathname,
                  send_page_view: false,
                  debug_mode: debugMode
                });

                console.log('[GA4 Initialized]', { 
                  debugMode: debugMode, 
                  hostname: location.hostname,
                  measurementId: '${GA4_MEASUREMENT_ID}'
                });
              })();
            `}
          </Script>
        </>
      )}
    </>
  )
}
