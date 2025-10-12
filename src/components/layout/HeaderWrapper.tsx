'use client'

import { Suspense } from 'react'
import Header from './Header'
import DarkModeToggle from '@/components/common/DarkModeToggle'
import { Skeleton } from '@/components/ui/skeleton'

export default function HeaderWrapper() {
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
    </Suspense>
  )
}
