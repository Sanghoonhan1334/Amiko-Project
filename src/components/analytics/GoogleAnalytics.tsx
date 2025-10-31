'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'
import { pageview } from '@/lib/gtag'

export default function GoogleAnalytics() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (pathname) {
      let url = window.location.href.replace(window.location.origin, '')
      
      // 검색 쿼리 파라미터 추가
      if (searchParams && searchParams.toString()) {
        url += `?${searchParams.toString()}`
      }

      pageview(url)
    }
  }, [pathname, searchParams])

  return null
}

