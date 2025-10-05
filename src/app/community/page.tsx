'use client'

import { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function CommunityRedirectContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const cTab = searchParams.get('tab') || 'galleries'
    
    // 새로운 URL 구조로 리다이렉트
    switch (cTab) {
      case 'galleries':
        router.replace('/community/galleries')
        break
      case 'popular':
        router.replace('/community/popular')
        break
      case 'lounge':
      case 'freeboard':
        router.replace('/community/freeboard')
        break
      default:
        router.replace('/community/galleries')
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


