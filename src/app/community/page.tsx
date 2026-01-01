'use client'

import { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { trackPageView, trackRevisitCommunityEnter } from '@/lib/analytics'

function CommunityRedirectContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // GA4 페이지뷰 추적 - 리다이렉트 전에 명시적으로 호출
    const currentPath = '/community' + (searchParams?.toString() ? `?${searchParams.toString()}` : '')
    trackPageView(currentPath)
    
    // 재방문 퍼널 이벤트: 커뮤니티 진입
    trackRevisitCommunityEnter()

    const cTab = searchParams.get('tab')
    
    // 메인 커뮤니티 탭으로 리다이렉트
    switch (cTab) {
      case 'popular':
        router.replace('/community/popular')
        break
      case 'lounge':
      case 'freeboard':
        router.replace('/community/freeboard')
        break
      default:
        // 기본적으로 메인 커뮤니티 탭으로 이동
        router.replace('/main?tab=community')
        break
    }
  }, [router, searchParams])

  return null
}

export default function CommunityRedirectPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CommunityRedirectContent />
    </Suspense>
  )
}


