'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function CommunityRedirectPage() {
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


