'use client'

import dynamic from 'next/dynamic'
import { useLanguage } from '@/context/LanguageContext'

// Agora 관련 컴포넌트를 동적 임포트로 처리 (SSR 방지)
const VideoCallStarter = dynamic(() => import('@/components/video/VideoCallStarter'), {
  ssr: false,
  loading: () => <div className="p-6">영상소통 로딩 중...</div>
})



export default function MeetTab() {
  const { t } = useLanguage()

  const handleStartCall = (channelName: string) => {
    console.log('Starting video call with channel:', channelName)
    // TODO: 실제 Agora 통화 시작 로직
  }



  return (
    <div className="p-6">
      <VideoCallStarter onStartCall={handleStartCall} />
    </div>
  )
}
