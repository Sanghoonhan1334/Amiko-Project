'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function CommunityRedirectPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const cTab = searchParams.get('tab') || 'lounge'
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', 'community')
    params.set('cTab', cTab)
    router.replace(`/main?${params.toString()}`)
  }, [router, searchParams])

  return null
}


