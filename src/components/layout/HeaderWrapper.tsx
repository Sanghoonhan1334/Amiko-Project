'use client'

import { Suspense } from 'react'
import { usePathname } from 'next/navigation'
import Header from './Header'
import DarkModeToggle from '@/components/common/DarkModeToggle'
import PaletteSwitcher from '@/components/common/PaletteSwitcher'
import { Skeleton } from '@/components/ui/skeleton'

export default function HeaderWrapper() {
  const pathname = usePathname()
  
  // 채팅방에서는 헤더 숨김
  const isChatRoom = pathname?.includes('/community/k-chat/')
  
  if (isChatRoom) {
    return null
  }
  
  return (
    <Suspense fallback={
      <div className="h-16 bg-gray-200 dark:bg-gray-700 animate-pulse">
        <div className="container mx-auto px-4 h-full flex items-center justify-between">
          <Skeleton className="h-8 w-32" />
          <div className="flex items-center space-x-4">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        </div>
      </div>
    }>
      <Header />
      <DarkModeToggle />
      <PaletteSwitcher />
    </Suspense>
  )
}
