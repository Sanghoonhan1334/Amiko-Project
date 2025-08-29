'use client'

import Hero from '@/components/landing/Hero'
import FeatureCards from '@/components/landing/FeatureCards'
import LoungeMini from '@/components/landing/LoungeMini'

export default function HomePage() {
  return (
    <div className="min-h-screen body-gradient">
      <Hero />
      <FeatureCards />
      <LoungeMini />
    </div>
  )
}
