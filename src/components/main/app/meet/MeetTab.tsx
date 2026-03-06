'use client'

import dynamic from 'next/dynamic'

const VCMarketplace = dynamic(() => import('@/components/videocall/VCMarketplace'), {
  ssr: false,
  loading: () => (
    <div className="w-full flex items-center justify-center py-12">
      <div className="w-8 h-8 border-3 border-purple-500 border-t-transparent rounded-full animate-spin" />
    </div>
  ),
})

export default function MeetTab() {
  return (
    <div className="w-full space-y-6">
      <VCMarketplace />
    </div>
  )
}
