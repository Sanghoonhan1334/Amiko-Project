'use client'

import { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function CommunityRedirectContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const cTab = searchParams.get('tab') || 'lounge'
    const params = new URLSearchParams(searchParams.toString())
    
    // 기존 tab 파라미터가 있으면 유지, 없으면 community로 설정
    if (!params.get('tab')) {
      params.set('tab', 'community')
    }
    params.set('cTab', cTab)
    router.replace(`/main?${params.toString()}`)
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


