'use client'

import { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function CommunityRedirectContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
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


