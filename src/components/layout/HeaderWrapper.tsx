'use client'

import { Suspense } from 'react'
import Header from './Header'
import DarkModeToggle from '@/components/common/DarkModeToggle'

export default function HeaderWrapper() {
  return (
    <Suspense fallback={<div className="h-16 bg-black/50 backdrop-blur-md"></div>}>
      <Header />
      <DarkModeToggle />
    </Suspense>
  )
}
