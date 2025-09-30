'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

const Hero = dynamic(() => import('@/components/landing/Hero'), {
  ssr: false,
  loading: () => <div className="min-h-screen body-gradient flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500 mx-auto"></div>
      <p className="mt-4 text-gray-600">로딩 중...</p>
    </div>
  </div>
})

export default function HomePage() {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return (
      <div className="min-h-screen body-gradient flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen body-gradient">
      <Hero />
    </div>
  )
}
