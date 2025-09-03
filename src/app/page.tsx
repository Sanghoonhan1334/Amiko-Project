'use client'

import Hero from '@/components/landing/Hero'
import FAQ from '@/components/landing/FAQ'

export default function HomePage() {
  return (
    <div className="min-h-screen body-gradient">
      <Hero />
      <FAQ />
    </div>
  )
}
